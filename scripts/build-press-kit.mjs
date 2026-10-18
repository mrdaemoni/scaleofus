import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';
import { bookPhotos } from '../development/publisher-site-v10/src/data/photos.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const publicRoot = path.join(root, 'development/publisher-site-v10/public');
const press = path.join(publicRoot, 'press');
const kit = path.join(press, 'scale-of-us-wind-press-kit');
await mkdir(kit, {recursive:true});
const photos = [];
for (const photo of bookPhotos) {
  const data = await readFile(path.join(publicRoot, photo.src));
  const metadata = await sharp(data).metadata();
  const file = path.basename(photo.src);
  await writeFile(path.join(kit,file), data);
  photos.push({file, source:photo.src, caption:photo.label, alt:photo.alt,
    width:metadata.width, height:metadata.height, bytes:data.length,
    sha256:createHash('sha256').update(data).digest('hex')});
}
const manifest = {
  title:'The Boy Who Tried to Catch the Wind — homepage photographs',
  source:'development/publisher-site-v10/src/data/photos.ts',
  updated:'2026-10-17',
  suppliedBy:'Hector Ouilhet Olmos',
  artworkCredit:'Text and illustrations © 2026 Hector Ouilhet Olmos / Scale of Us.',
  photographyCredit:'Photographs supplied by Hector Ouilhet Olmos. Separate photographer attribution is not recorded; do not infer a photography copyright credit.',
  permission:'Supplied for editorial coverage of the book. Retain the artwork credit; do not alter the artwork beyond ordinary cropping for layout. No other use or third-party licence is asserted.',
  photos
};
await writeFile(path.join(press,'image-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
const names=['book-information.txt','scale-of-us-press-copy.txt','scale-of-us-rights-and-credits.txt','scale-of-us-discussion-guide.txt','image-manifest.json'];
const readme=`SCALE OF US PRESS KIT\nThe Boy Who Tried to Catch the Wind\nUpdated October 17, 2026\n\nIncluded:\n- book-information.txt — verified metadata and edition details\n- scale-of-us-press-copy.txt — descriptions, creator biography, and captions\n- scale-of-us-rights-and-credits.txt — copyright, creation disclosure, and image permission\n- scale-of-us-discussion-guide.txt — questions and activities for readers\n- image-manifest.json — homepage source paths, captions, dimensions, and SHA-256 checksums\n${photos.map(p=>`- ${p.file} — ${p.caption}, ${p.width} × ${p.height} pixels`).join('\n')}\n\nThese six photographs are byte-for-byte copies of the current homepage photographs. They replace the earlier kit’s generic cover/sample-spread/book-detail selection. Earlier public source assets are preserved separately. See the manifest for supplied-image provenance and the photography-credit limitation.\n\nNot yet included:\n- Approved author portrait\n- Certified accessible EPUB 3\n\nPress materials: https://scaleofus.com/press/\nContact: hello@scaleofus.com\nContact form: https://scaleofus.com/#contact\n`;
await writeFile(path.join(press,'README.txt'),readme);
for (const name of [...names,'README.txt']) await copyFile(path.join(press,name),path.join(kit,name));
// Explicit allowlist: old images remain on disk, but never leak into the new ZIP.
const files=['README.txt',...names,...photos.map(p=>p.file)];
execFileSync('python3',['-c',`import sys,zipfile,os\nfolder,output,*names=sys.argv[1:]\nwith zipfile.ZipFile(output+'.tmp','w',zipfile.ZIP_DEFLATED) as z:\n for name in names: z.write(os.path.join(folder,name),'scale-of-us-wind-press-kit/'+name)\nos.replace(output+'.tmp',output)`,kit,path.join(press,'Scale-of-Us-Wind-Press-Kit.zip'),...files],{stdio:'inherit'});
console.log(JSON.stringify({photographs:photos.length,zipFiles:files.length,sourceBytesPreserved:true}));
