#!/usr/bin/env python3
"""Build a static multilingual phone player; no upload or publication actions."""
import argparse,json,shutil
from pathlib import Path

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('manifest',type=Path);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
    data=json.loads(a.manifest.read_text());base=a.manifest.resolve().parent;out=a.output.resolve();out.mkdir(parents=True,exist_ok=True)
    locales=set()
    for e in data['editions']:
        e.setdefault('version',data.get('version','v1'))
        if e['locale'] in locales:raise ValueError('Duplicate locale')
        locales.add(e['locale'])
        for key in ['audio','closing']:
            if not e.get(key):continue
            source=(base/Path(e[key])).resolve();target=out/source.name
            if source!=target:shutil.copy2(source,target)
            e[key]=target.name
        for c in e['chapters']:
            if not 0<=c['start']<e['duration']:raise ValueError('Chapter outside audio duration')
    template=(Path(__file__).resolve().parent.parent/'assets/player.html').read_text()
    (out/'index.html').write_text(template.replace('__PLAYER_DATA__',json.dumps(data,ensure_ascii=False).replace('</','<\\/')))
    (out/'player-manifest.json').write_text(json.dumps(data,ensure_ascii=False,indent=2))
    print(json.dumps({'editions':len(locales),'output':str(out),'local_paths_excluded':True}))

if __name__=='__main__':main()
