from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import re,json
root=Path('docs').resolve();errors=[];count=0
class Links(HTMLParser):
 def handle_starttag(self,tag,attrs):
  global count
  attrs=dict(attrs)
  for key in ['href','src','data-src','data-svg-src','data-raster-src']:
   url=attrs.get(key,'');u=urlsplit(url)
   if not url or u.scheme or u.netloc or url.startswith('#'):continue
   p=root/unquote(u.path).lstrip('/') if u.path.startswith('/') else current.parent/unquote(u.path)
   if p.is_dir():p=p/'index.html'
   count+=1
   if not p.exists():errors.append([str(current.relative_to(root)),key,url])
for current in root.rglob('*.html'):Links().feed(current.read_text())
for current in root.rglob('*.css'):
 for url in re.findall(r'url\([\"\']?([^\)\"\']+)',current.read_text()):
  u=urlsplit(url)
  if u.scheme or u.netloc or url.startswith('#'):continue
  p=root/unquote(u.path).lstrip('/') if u.path.startswith('/') else current.parent/unquote(u.path)
  count+=1
  if not p.exists():errors.append([str(current.relative_to(root)),'css',url])
print(json.dumps({'references':count,'broken':errors},indent=2));assert not errors
