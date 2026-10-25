import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {sendReflection, reflectionsEndpoint} from '../development/publisher-site-v10/src/scripts/reflections-send.ts';
import {BOOK, CONSENT_VERSION} from '../reflections/policy.mjs';
const example = changes => ({book:BOOK, language:'en', text:'TEST ONLY — connection fixture.', name:'', quoteConsent:false, consentVersion:CONSENT_VERSION, ...changes});

test('Formspree receives explicit consent, sanitized attribution and only the allowed fields', async () => {
  for (const quoteConsent of [false, true]) {
    let calls = 0;
    const requestId = randomUUID();
    const result = await sendReflection(example({quoteConsent, name:'T.R.', email:'excluded@example.invalid', status:'eligible'}), requestId, '', async (url, options) => {
      calls++;
      assert.equal(url, reflectionsEndpoint);
      assert.notEqual(url, 'https://formspree.io/f/xqpejzzr');
      assert.equal(options.credentials, 'omit');
      const body = JSON.parse(options.body);
      assert.equal(body.quoteConsent, quoteConsent);
      assert.equal(body.name, quoteConsent ? 'T.R.' : '');
      assert.equal(body.consentVersion, CONSENT_VERSION);
      assert.equal(body.requestId, requestId);
      assert.equal(body.email, undefined); assert.equal(body.status, undefined);
      return Response.json({ok:true});
    });
    assert.deepEqual(result, {kind:'sent'}); assert.equal(calls, 1);
  }
});

test('only a confirmed receipt succeeds; errors and lost receipts are never retried', async () => {
  for (const [makeResponse, expected] of [
    [() => Response.json({errors:[{message:'Limit'}]}, {status:429}), {kind:'rejected', rateLimited:true}],
    [() => Response.json({errors:[]}, {status:400}), {kind:'rejected', rateLimited:false}],
    [() => Response.json({ok:true}, {status:503}), {kind:'uncertain'}],
    [() => Response.json({}), {kind:'uncertain'}],
    [() => new Response('not JSON'), {kind:'uncertain'}],
    [() => { throw new Error('lost receipt'); }, {kind:'uncertain'}],
  ]) {
    let calls = 0;
    assert.deepEqual(await sendReflection(example(), randomUUID(), '', async () => { calls++; return makeResponse(); }), expected);
    assert.equal(calls, 1);
  }
});

test('invalid consent and honeypot input never reach Formspree', async () => {
  let calls = 0;
  const request = async () => { calls++; return Response.json({ok:true}); };
  await assert.rejects(sendReflection(example({quoteConsent:'true'}), randomUUID(), '', request));
  assert.equal((await sendReflection(example(), randomUUID(), 'spam', request)).kind, 'rejected');
  assert.equal(calls, 0);
});

test('optional ratings stay optional and only integers from 1 to 5 are sent', async () => {
  for (const rating of [undefined, 1, 5]) {
    await sendReflection(example(rating === undefined ? {} : {rating}), randomUUID(), '', async (_, options) => {
      assert.equal(JSON.parse(options.body).rating, rating);
      return Response.json({ok:true});
    });
  }
  for (const rating of [0, 6, 2.5, '5', null]) {
    await assert.rejects(sendReflection(example({rating}), randomUUID(), '', async () => { assert.fail('Invalid rating sent'); }));
  }
});
