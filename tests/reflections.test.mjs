import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, writeFile, stat, rm, mkdir, symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {once} from 'node:events';
import http from 'node:http';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {ReflectionStore, digest} from '../reflections/store.mjs';
import {loadPublicReflections} from '../reflections/public.mjs';
import {BOOK, CONSENT_VERSION, validateSubmission} from '../reflections/policy.mjs';
import {createReflectionsServer} from '../reflections/server.mjs';
const example = (changes = {}) => ({book:BOOK, language:'en', text:'TEST FIXTURE — a question about the wind.', name:'', quoteConsent:false, consentVersion:CONSENT_VERSION, ...changes});
async function fixture(t) {
  const dir = await mkdtemp(path.join(tmpdir(), 'scale-reflections-test-'));
  t.after(() => rm(dir, {recursive:true, force:true}));
  return dir;
}
async function service(t, options = {}) {
  const directory = await fixture(t), staticRoot = path.join(directory, 'dist');
  await mkdir(staticRoot); await writeFile(path.join(staticRoot, 'index.html'), '<h1>Test preview</h1>');
  const {server, store} = createReflectionsServer({directory:path.join(directory, 'private'), staticRoot, ...options});
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const configResponse = await fetch(origin + '/api/reflections/config', {headers:{'X-Reflection-Client':'1'}});
  const cookie = configResponse.headers.get('set-cookie').split(';')[0];
  const {token} = await configResponse.json();
  const send = (body, headers = {}) => fetch(origin + '/api/reflections', {method:'POST', headers:{Origin:origin, 'Content-Type':'application/json', Cookie:cookie, 'X-Reflection-Token':token, ...headers}, body:JSON.stringify(body)});
  return {origin, store, send, directory, staticRoot};
}
test('unchecked words are private; stale or forged attribution is discarded and cannot be exported', async t => {
  const store = new ReflectionStore(await fixture(t));
  await store.submit(example({name:'DO_NOT_STORE', status:'eligible', approval:{by:'Hector'}, email:'not-stored@example.invalid'}), randomUUID());
  const [record] = await store.list();
  assert.equal(record.name, ''); assert.equal(record.status, 'private'); assert.equal(record.quoteConsent, false);
  assert.equal(record.approval, undefined); assert.equal(record.email, undefined);
  const file = path.join(await fixture(t), 'public.json'); await store.exportPublic(file);
  assert.deepEqual(JSON.parse(await readFile(file)), []);
  assert.equal(validateSubmission(example({name:{forged:true}})).name, '');
});
test('explicit consent is immediately public-eligible with no personal approval; withdrawal clears attribution', async t => {
  const store = new ReflectionStore(await fixture(t));
  await store.submit(example({quoteConsent:true, name:'T.R.'}), randomUUID());
  const [record] = await store.list(); assert.equal(record.status, 'eligible'); assert.equal(record.approval, undefined);
  const file = path.join(await fixture(t), 'public.json'); await store.exportPublic(file);
  const exported = JSON.parse(await readFile(file));
  assert.deepEqual(loadPublicReflections(exported), [{id:record.id, language:'en', text:record.text, name:'T.R.'}]);
  assert.equal(exported[0].requestId, undefined); assert.equal(exported[0].createdAt, undefined);
  assert.throws(() => loadPublicReflections([{...exported[0], text:'Changed words'}]), /differs/);
  assert.throws(() => loadPublicReflections([{...exported[0], quoteConsent:false}]), /Private/);
  await store.remove(record.id, 'revoke'); const [withdrawn] = await store.list();
  assert.equal(withdrawn.name, ''); assert.equal(withdrawn.quoteConsent, false); assert.equal(withdrawn.status, 'private');
  await store.exportPublic(file); assert.deepEqual(JSON.parse(await readFile(file)), []);
});
test('earlier consent versions are never reinterpreted as permission for the revised public feed', async t => {
  const directory = await fixture(t), store = new ReflectionStore(directory);
  const legacy = {...example({quoteConsent:true}), consentVersion:'quote-permission-v1', id:randomUUID(), createdAt:new Date().toISOString(), status:'approved', digest:'a'.repeat(64), approval:{by:'Hector'}};
  await writeFile(path.join(directory, 'submissions.json'), JSON.stringify({version:1, records:[legacy]}));
  const file = path.join(await fixture(t), 'public.json'); await store.exportPublic(file);
  assert.deepEqual(JSON.parse(await readFile(file)), []);
  assert.throws(() => loadPublicReflections([legacy]));
  assert.throws(() => store.submit({...example(), consentVersion:'quote-permission-v1'}, randomUUID()), /sharing choice/);
});
test('parallel retries persist once; changing the consent choice requires a new request ID; disk data is private', async t => {
  const directory = await fixture(t), store = new ReflectionStore(directory), id = randomUUID();
  await Promise.all(Array.from({length:12}, () => new ReflectionStore(directory).submit(example({name:'ignored'}), id)));
  await store.submit(example(), randomUUID()); assert.equal((await store.list()).length, 1);
  await assert.rejects(store.submit(example({quoteConsent:true}), id), /already used/);
  assert.equal((await stat(path.join(directory, 'submissions.json'))).mode & 0o777, 0o600);
});
test('validation accepts anonymous sharing and Spanish; missing/implicit consent, invalid text and shared attribution are refused', () => {
  for (const change of [{quoteConsent:'true'}, {quoteConsent:undefined}, {language:'fr'}, {book:'other'}, {text:'  '}, {text:'x'.repeat(2001)}, {text:'bad\u0000text'}, {consentVersion:'old'}, {quoteConsent:true, name:'x'.repeat(81)}, {quoteConsent:true, name:'bad\nname'}]) assert.throws(() => validateSubmission(example(change)));
  assert.equal(validateSubmission(example({language:'es', quoteConsent:true, name:''})).name, '');
});
test('private retention, public-eligible retention and local deletion work without an approval command', async t => {
  let now = Date.now(); const directory = await fixture(t), store = new ReflectionStore(directory, () => now);
  await store.submit(example(), randomUUID()); await store.submit(example({quoteConsent:true}), randomUUID());
  now += 91 * 86400000; await store.prune(); assert.equal((await store.list()).length, 1);
  const [record] = await store.list(); await store.remove(record.id, 'delete'); assert.equal((await store.list()).length, 0);
  const cli = new URL('../reflections/cli.mjs', import.meta.url);
  await assert.rejects(promisify(execFile)(process.execPath, [cli.pathname, 'approve', record.id], {env:{...process.env, REFLECTIONS_STATE_DIR:directory}}), /Use list/);
});
test('protected HTTP writes enforce consent eligibility; inbox, source and management stay inaccessible', async t => {
  const {origin, store, send, directory, staticRoot} = await service(t, {minimumAge:0});
  const input = {...example({name:'HIDDEN_NAME', status:'eligible'}), website:'', requestId:randomUUID()};
  for (const headers of [{Origin:'https://evil.invalid'}, {'X-Reflection-Token':'wrong'}, {Origin:''}, {'Content-Type':'text/plain'}, {'Sec-Fetch-Site':'cross-site'}]) assert.equal((await send(input, headers)).status, 403);
  const hostStatus = await new Promise((resolve, reject) => {
    const request = http.get(origin, {headers:{Host:'evil.invalid'}}, response => { response.resume(); resolve(response.statusCode); }); request.on('error', reject);
  }); assert.equal(hostStatus, 403);
  for (const route of ['/api/reflections', '/api/reflections/list', '/api/reflections/export', '/api/reflections/approve', '/.local-reflections/submissions.json', '/reflections/store.mjs']) assert.equal((await fetch(origin + route)).status, 404);
  const response = await send(input); assert.equal(response.status, 200); assert.deepEqual(await response.json(), {received:true});
  const [record] = await store.list(); assert.equal(record.name, ''); assert.equal(record.status, 'private');
  await send({...input, requestId:randomUUID(), quoteConsent:true, name:'R.'}); assert.equal((await store.list()).at(-1).status, 'eligible');
  await writeFile(path.join(directory, 'secret.txt'), 'private'); await symlink(path.join(directory, 'secret.txt'), path.join(staticRoot, 'leak.txt'));
  assert.equal((await fetch(origin + '/leak.txt')).status, 404);
});
test('HTTP timing, honeypot, payload size, session expiry and simultaneous rate limits fail safely', async t => {
  let now = Date.now(); const {origin, send, store} = await service(t, {now:() => now});
  const input = {...example(), website:'', requestId:randomUUID()};
  assert.equal((await send(input)).status, 400); now += 2100;
  assert.equal((await send({...input, website:'spam'})).status, 400);
  assert.equal((await send({...input, text:'x'.repeat(13000)})).status, 413);
  const responses = await Promise.all(Array.from({length:6}, (_, i) => send({...input, text:`TEST FIXTURE number ${i}`, requestId:randomUUID()})));
  assert.equal(responses.filter(response => response.status === 200).length, 3); assert.equal(responses.filter(response => response.status === 429).length, 3);
  assert.equal((await store.list()).length, 3); now += 1800001; assert.equal((await send(input)).status, 403);
  assert.equal((await fetch(origin + '/api/reflections', {method:'OPTIONS'})).status, 404);
});
