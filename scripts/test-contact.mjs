import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createInquirySender} from '../development/publisher-site-v10/src/scripts/contact.ts';
const data = () => { const form = new FormData(); form.set('message','Test only'); return form; };
test('reports submitted only for an explicit successful response', async () => {
 const send=createInquirySender(async (url, options) => {
  assert.equal(url,'https://formspree.io/f/xqpejzzr');
  assert.equal(options.method,'POST'); assert.equal(options.credentials,'omit');
  assert.equal(options.headers.Accept,'application/json');
  return new Response(JSON.stringify({ok:true}),{status:200});
 });
 assert.deepEqual(await send(data()),{kind:'sent'});
});
test('rejects invalid requests and rate limits without claiming success', async () => {
 for (const status of [400,422,429]) {
  const send=createInquirySender(async()=>new Response(JSON.stringify({errors:[{message:'Rejected'}]}),{status}));
  assert.deepEqual(await send(data()),{kind:'rejected',rateLimited:status===429});
 }
});
test('network, server, malformed and ambiguous responses preserve uncertainty without retrying', async () => {
 for (const response of [()=>Promise.reject(new Error('network')),()=>Promise.resolve(new Response('not json',{status:200})),()=>Promise.resolve(new Response('{}',{status:200})),()=>Promise.resolve(new Response('{"ok":false}',{status:503}))]) {
  let requests=0; const send=createInquirySender((...args)=>{requests++;return response(...args);});
  assert.deepEqual(await send(data()),{kind:'uncertain'}); assert.equal(requests,1);
 }
});
test('suppresses concurrent duplicate submissions', async () => {
 let resolve;let requests=0;
 const send=createInquirySender(()=>{requests++;return new Promise(done=>{resolve=done;});});
 const first=send(data());
 assert.deepEqual(await send(data()),{kind:'pending'});
 assert.equal(requests,1);
 resolve(new Response('{"ok":true}',{status:200}));
 assert.deepEqual(await first,{kind:'sent'});
});
