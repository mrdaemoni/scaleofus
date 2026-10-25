#!/usr/bin/env python3
"""Mix narration and explicit music cues locally; no network or publication actions."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import numpy as np

SR=24000

def run(args):
    return subprocess.run(args,check=True,capture_output=True)

def sha(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def probe(path):
    return json.loads(run(['ffprobe','-v','error','-show_entries','format=duration,size:stream=codec_name,sample_rate,channels','-of','json',str(path)]).stdout)

def db(a):
    return float(20*np.log10(max(1e-12,np.sqrt(np.mean(a.astype(np.float64)**2)))))

def decode(path,start=0,duration=None):
    args=['ffmpeg','-v','error','-ss',str(start),'-i',str(path)]
    if duration is not None:args+=['-t',str(duration)]
    return np.frombuffer(run(args+['-ar',str(SR),'-ac','2','-f','f32le','-']).stdout,dtype='<f4').reshape(-1,2).copy()

def measure(path):
    result=run(['ffmpeg','-hide_banner','-nostats','-i',str(path),'-af','loudnorm=I=-16:TP=-2:LRA=9:print_format=json','-f','null','-'])
    return json.loads(re.findall(r'\{[^{}]+\}',result.stderr.decode())[-1])

def speech_mask(voice):
    mono=voice.mean(axis=1);block=SR//10;n=len(mono)//block
    level=np.sqrt(np.mean(mono[:n*block].reshape(n,block)**2,axis=1))
    return np.pad(np.repeat(level>10**(-35/20),block),(0,len(mono)-n*block),constant_values=False)

def resolve(base,path):return (base/Path(path)).resolve()

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('config',type=Path);parser.add_argument('--output',required=True,type=Path)
    args=parser.parse_args();cfg=json.loads(args.config.read_text());base=args.config.resolve().parent
    out=args.output.resolve();out.mkdir(parents=True,exist_ok=True)
    voice_path=resolve(base,cfg['narration']);original_hash=sha(voice_path)
    if cfg.get('narration_sha256') and original_hash!=cfg['narration_sha256']:raise ValueError('Narration checksum changed')
    narration_duration=float(probe(voice_path)['format']['duration'])
    tracks={t['id']:{**t,'file':str(resolve(base,t['file']))} for t in cfg['tracks']}
    if len(tracks)!=len(cfg['tracks']):raise ValueError('Duplicate track ID')
    for t in tracks.values():
        if t.get('sha256') and sha(t['file'])!=t['sha256']:raise ValueError('Track checksum changed: '+t['id'])
        t['duration']=float(probe(t['file'])['format']['duration'])
    cues=cfg['cues'];duration=max(narration_duration,max(c['end'] for c in cues))
    for c in cues:
        values=[c[k] for k in ['start','end','source_start','fade_in','fade_out']]
        if not all(np.isfinite(x) for x in values) or c['start']<0 or c['end']<=c['start'] or min(values[2:])<0:raise ValueError('Invalid cue: '+c['label'])
        if c['source_start']+c['end']-c['start']>tracks[c['track']]['duration']+0.1:raise ValueError('Cue exceeds source recording: '+c['label'])
    for p in cfg.get('protected_silences',[]):
        if not 0<=p['start']<p['end']<=duration:raise ValueError('Invalid protected silence')
    prefix=cfg.get('output_prefix','soundtrack-v1')
    print('Preparing narration; preserving its original timing.',flush=True)
    normalized=out/(prefix+'-narration-working.wav')
    run(['ffmpeg','-v','error','-y','-i',str(voice_path),'-af','loudnorm=I=-16:TP=-2:LRA=9','-ar',str(SR),'-ac','2','-c:a','pcm_f32le',str(normalized)])
    voice=decode(normalized);voice=np.pad(voice,((0,round(duration*SR)-len(voice)),(0,0)))
    music=np.zeros_like(voice)
    for c in cues:
        clip=decode(tracks[c['track']]['file'],c['source_start'],c['end']-c['start'])
        clip*=10**((c.get('target_rms_dbfs',-22)-db(clip))/20)
        fi=min(len(clip),round(c['fade_in']*SR));fo=min(len(clip),round(c['fade_out']*SR))
        if fi:clip[:fi]*=np.linspace(0,1,fi)[:,None]
        if fo:clip[-fo:]*=np.linspace(1,0,fo)[:,None]
        a=round(c['start']*SR);n=min(len(clip),len(music)-a);music[a:a+n]+=clip[:n]
    raw=out/(prefix+'-unducked.f32');duck=out/(prefix+'-ducked.f32')
    music.astype('<f4').tofile(raw)
    graph=('[0:a]highpass=f=70,lowpass=f=11000,equalizer=f=2500:t=q:w=1.15:g=-4.5,equalizer=f=4200:t=q:w=1:g=-2[m];'
           '[1:a]apad=whole_dur='+str(duration)+'[key];[m][key]sidechaincompress=threshold=0.025:ratio=10:attack=20:release=500:knee=2:link=average:detection=rms[out]')
    run(['ffmpeg','-v','error','-y','-f','f32le','-ar',str(SR),'-ac','2','-i',str(raw),'-i',str(normalized),'-filter_complex',graph,'-map','[out]','-t',str(duration),'-f','f32le',str(duck)])
    score=np.fromfile(duck,dtype='<f4').reshape(-1,2);score=np.pad(score[:len(voice)],((0,max(0,len(voice)-len(score))),(0,0)))
    mask=speech_mask(voice);target=cfg.get('minimum_average_margin_db',21.5)
    for c in cues:
        a,b=round(c['start']*SR),round(min(c['end'],narration_duration)*SR)
        if b<=a:continue
        selected=mask[a:b]&(np.max(np.abs(score[a:b]),axis=1)>1e-7)
        if np.any(selected):
            margin=db(voice[a:b][selected])-db(score[a:b][selected])
            if margin<target:score[a:b]*=10**((margin-target)/20)
    gap_levels=[]
    for g in cfg.get('chapter_gaps',[]):
        a,b=round(g['start']*SR),round(g['end']*SR)
        if b>a:score[a:b]*=(1+0.41254*np.sin(np.linspace(0,np.pi,b-a))**2)[:,None]
    silences=[]
    for p in cfg.get('protected_silences',[]):
        a,b=round(p['start']*SR),round(p['end']*SR);score[a:b]=0
        silences.append({**p,'music_peak':float(np.max(np.abs(score[a:b])))})
    margins=[]
    for c in cues:
        a,b=round(c['start']*SR),round(min(c['end'],narration_duration)*SR)
        if b<=a:continue
        selected=mask[a:b]&(np.max(np.abs(score[a:b]),axis=1)>1e-7)
        if np.any(selected):
            margin=db(voice[a:b][selected])-db(score[a:b][selected]);margins.append({'label':c['label'],'margin_db':margin})
            if margin<target-1:raise ValueError('Insufficient average voice margin: '+c['label'])
    for g in cfg.get('chapter_gaps',[]):
        a,b=round(g['start']*SR),round(g['end']*SR);gap_levels.append({**g,'music_rms_dbfs':db(score[a:b])})
    mixed=out/(prefix+'-raw.f32');(voice+score).astype('<f4').tofile(mixed)
    rawwav=out/(prefix+'-raw.wav')
    run(['ffmpeg','-v','error','-y','-f','f32le','-ar',str(SR),'-ac','2','-i',str(mixed),'-c:a','pcm_f32le',str(rawwav)])
    print('Mastering and verifying the complete recording.',flush=True)
    stats=measure(rawwav)
    norm='loudnorm=I=-16:TP=-2:LRA=9:linear=true:'+':'.join(['measured_I='+stats['input_i'],'measured_TP='+stats['input_tp'],'measured_LRA='+stats['input_lra'],'measured_thresh='+stats['input_thresh'],'offset='+stats['target_offset']])
    wav=out/(prefix+'.wav');mp3=out/(prefix+'.mp3');m4a=out/(prefix+'.m4a')
    run(['ffmpeg','-v','error','-y','-i',str(rawwav),'-af',norm,'-ar','48000','-ac','2','-c:a','pcm_s24le',str(wav)])
    used=list(dict.fromkeys(c['track'] for c in cues));credits='; '.join(tracks[t]['title']+' by '+tracks[t]['composer']+' ('+tracks[t]['page']+')' for t in used)
    comment='Music: '+credits+'. CC BY 4.0: https://creativecommons.org/licenses/by/4.0/. Edited: excerpts, EQ, ducking, fades, narration synchronization.'
    metadata=['-metadata','title='+cfg['title'],'-metadata','artist='+cfg.get('author',''),'-metadata','comment='+comment]
    run(['ffmpeg','-v','error','-y','-i',str(wav),'-c:a','libmp3lame','-b:a',str(cfg.get('mp3_kbps',160))+'k','-ar','48000',*metadata,str(mp3)])
    run(['ffmpeg','-v','error','-y','-i',str(wav),'-c:a','aac','-b:a',str(cfg.get('aac_kbps',96))+'k','-ar','48000','-movflags','+faststart',*metadata,str(m4a)])
    delivered={}
    for kind,file in [('mp3',mp3),('m4a',m4a)]:
        measured=measure(file);info=probe(file)
        if float(measured['input_tp'])>-1.5 or abs(float(measured['input_i'])+16)>1:raise ValueError('Delivered loudness/peak failed: '+kind)
        if abs(float(info['format']['duration'])-duration)>0.12:raise ValueError('Delivered duration mismatch')
        delivered[kind]={'file':str(file),'sha256':sha(file),'bytes':file.stat().st_size,'measured':measured,'probe':info}
    if cfg.get('max_mp3_bytes') and mp3.stat().st_size>cfg['max_mp3_bytes']:raise ValueError('MP3 exceeds hosting budget; reduce export bitrate')
    closing=None
    if cfg.get('closing_start') is not None:
        closing=out/(prefix+'-closing.mp3')
        run(['ffmpeg','-v','error','-y','-ss',str(cfg['closing_start']),'-i',str(wav),'-c:a','libmp3lame','-b:a',str(cfg.get('mp3_kbps',160))+'k',*metadata,str(closing)])
    if sha(voice_path)!=original_hash:raise ValueError('Source narration changed during rendering')
    result={'name':cfg['title'],'locale':cfg.get('locale'),'duration':duration,'narration_duration':narration_duration,'narration_sha256':original_hash,
            'config_sha256':sha(args.config),'wav':{'file':str(wav),'sha256':sha(wav)},'exports':delivered,'closing':str(closing) if closing else None,
            'cues':cues,'protected_silences':silences,'voice_music_margins':margins,'chapter_gap_levels':gap_levels,'source_ids':used,
            'verification_limit':'RMS speech proxy may include original ambience; automated checks do not establish artistic acceptance.'}
    (out/(prefix+'-validation.json')).write_text(json.dumps(result,indent=2))
    for f in [normalized,raw,duck,mixed,rawwav]:f.unlink()
    print(json.dumps({'duration':duration,'mp3_bytes':mp3.stat().st_size,'lufs':delivered['mp3']['measured']['input_i'],'true_peak':delivered['mp3']['measured']['input_tp'],'minimum_margin_db':min(x['margin_db'] for x in margins),'validation':str(out/(prefix+'-validation.json'))}),flush=True)

if __name__=='__main__':main()
