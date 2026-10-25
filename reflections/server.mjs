import http from 'node:http';
import {randomBytes} from 'node:crypto';
import {readFile, realpath, stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ReflectionStore} from './store.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const types = {'.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.webp':'image/webp', '.png':'image/png', '.woff2':'font/woff2', '.mp3':'audio/mpeg', '.m4a':'audio/mp4', '.pdf':'application/pdf', '.zip':'application/zip', '.txt':'text/plain; charset=utf-8'};
// Deliberately local only. This is NOT a production collection backend.
export function createReflectionsServer({directory = path.join(root, '.local-reflections'), staticRoot = path.join(root, 'dist'), now = () => Date.now(), minimumAge = 2000, maxSubmissions = 3} = {}) {
  const store = new ReflectionStore(directory, now);
  const sessions = new Map();
  // Expire unpublished words while this local service is running, and on reads/writes.
  const retention = setInterval(() => { store.prune().catch(() => {}); }, 86400000);
  retention.unref();
  let windowStart = now(), issued = 0;
  const server = http.createServer((req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.setHeader('Content-Security-Policy', "frame-ancestors 'none'; form-action 'none'; base-uri 'self'");
    const json = (status, value) => { res.writeHead(status, {'Content-Type':'application/json; charset=utf-8'}); res.end(JSON.stringify(value)); };
    const handle = async () => {
      const origin = `http://127.0.0.1:${req.socket.localPort}`;
      if (req.headers.host !== `127.0.0.1:${req.socket.localPort}`) return json(403, {error:'Local host required.'});
      let url;
      try { url = new URL(req.url, origin); } catch { return json(400, {error:'Invalid request.'}); }
      if (url.pathname.startsWith('/api/')) {
        if (req.headers.origin && req.headers.origin !== origin || req.headers['sec-fetch-site'] === 'cross-site') return json(403, {error:'Same origin required.'});
        if (url.pathname === '/api/reflections/config' && req.method === 'GET') {
          if (req.headers['x-reflection-client'] !== '1') return json(403, {error:'Local form required.'});
          for (const [key, session] of sessions) if (session.expires < now()) sessions.delete(key);
          if (now() - windowStart >= 3600000) { windowStart = now(); issued = 0; }
          if (++issued > 60 || sessions.size >= 1000) return json(429, {error:'Please try later.'});
          const sid = randomBytes(24).toString('hex'), token = randomBytes(24).toString('hex');
          sessions.set(sid, {token, created:now(), expires:now() + 1800000, count:0, references:new Set()});
          res.setHeader('Set-Cookie', `reflection-session=${sid}; HttpOnly; SameSite=Strict; Path=/api/reflections; Max-Age=1800`);
          return json(200, {mode:'local', token});
        }
        // There is no HTTP inbox, export, search, moderation or raw-submission read.
        if (url.pathname !== '/api/reflections' || req.method !== 'POST') return json(404, {error:'Not found.'});
        if (req.headers.origin !== origin || req.headers['content-type'] !== 'application/json') return json(403, {error:'Same-origin JSON required.'});
        const sid = req.headers.cookie?.match(/(?:^|;\s*)reflection-session=([a-f0-9]{48})(?:;|$)/)?.[1];
        const session = sessions.get(sid);
        if (!session || session.expires < now() || req.headers['x-reflection-token'] !== session.token) return json(403, {error:'Refresh the form before sending.'});
        const chunks = []; let bytes = 0;
        for await (const chunk of req) { bytes += chunk.length; if (bytes > 12288) return json(413, {error:'Reflection too large.'}); chunks.push(chunk); }
        let body;
        try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return json(400, {error:'Invalid JSON.'}); }
        if (!body || typeof body !== 'object' || body.website !== '' || now() - session.created < minimumAge) return json(400, {error:'Please wait a moment and try again.'});
        if (!session.references.has(body.requestId)) {
          if (session.count >= maxSubmissions) return json(429, {error:'Please try another day.'});
          // Reserve before awaiting the store, preventing concurrent rate-limit bypass.
          session.count++; session.references.add(body.requestId);
        }
        return json(200, await store.submit(body, body.requestId));
      }
      if (!['GET', 'HEAD'].includes(req.method)) return json(405, {error:'Method not allowed.'});
      let pathname;
      try { pathname = decodeURIComponent(url.pathname); } catch { return json(400, {error:'Invalid path.'}); }
      if (pathname.includes('\\') || pathname.split('/').some(part => part.startsWith('.'))) return json(404, {error:'Not found.'});
      const base = await realpath(staticRoot);
      const requested = path.resolve(base, '.' + pathname, pathname.endsWith('/') ? 'index.html' : '');
      if (!requested.startsWith(base + path.sep)) return json(404, {error:'Not found.'});
      let file;
      try { file = await realpath(requested); } catch { return json(404, {error:'Not found.'}); }
      if (!file.startsWith(base + path.sep)) return json(404, {error:'Not found.'});
      const details = await stat(file);
      if (!details.isFile()) return json(404, {error:'Not found.'});
      res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
      res.setHeader('Accept-Ranges', 'bytes');
      if (req.headers.range) {
        const match = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range);
        const start = Number(match?.[1]), end = match?.[2] ? Number(match[2]) : details.size - 1;
        if (!match || start > end || end >= details.size) { res.writeHead(416, {'Content-Range':`bytes */${details.size}`}); return res.end(); }
        res.writeHead(206, {'Content-Length':end - start + 1, 'Content-Range':`bytes ${start}-${end}/${details.size}`});
        if (req.method === 'HEAD') return res.end();
        return createReadStream(file, {start, end}).pipe(res);
      }
      res.writeHead(200, {'Content-Length':details.size});
      if (req.method === 'HEAD') return res.end();
      createReadStream(file).pipe(res);
    };
    handle().catch(error => {
      if (!res.headersSent) json(error.status || 503, {error:error.status ? error.message : 'Unable to save. Your reflection has not been confirmed. Retry safely.'});
      else res.destroy();
    });
  });
  server.once('listening', () => { store.prune().catch(() => {}); });
  server.once('close', () => clearInterval(retention));
  return {server, store};
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.REFLECTIONS_PORT || 4331);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Choose a local port from 1024 to 65535.');
  const {server} = createReflectionsServer({directory:process.env.REFLECTIONS_STATE_DIR || undefined});
  server.listen(port, '127.0.0.1', () => console.log(`Connected reflections preview: http://127.0.0.1:${port}/reflections/\nOrdinary submissions go to the Formspree inbox.\nLocal-only sandbox: http://127.0.0.1:${port}/reflections/?local=1\nSandbox inbox: npm run reflections -- list`));
}
