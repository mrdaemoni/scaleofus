import {validateSubmission} from '../../../../reflections/policy.mjs';

export const reflectionsEndpoint = 'https://formspree.io/f/mkjjogvg';

// A lost receipt can follow an accepted submission. Never retry automatically.
export async function sendReflection(input: unknown, requestId: string, website: string, request: typeof fetch = fetch) {
  const clean = validateSubmission(input);
  if (website || !/^[a-f0-9-]{36}$/.test(requestId)) return {kind:'rejected' as const, rateLimited:false};
  try {
    const response = await request(reflectionsEndpoint, {
      method:'POST', credentials:'omit', referrerPolicy:'no-referrer',
      headers:{Accept:'application/json', 'Content-Type':'application/json'},
      body:JSON.stringify({...clean, requestId, _gotcha:'', _subject:'Scale of Us reader reflection'}),
      signal:AbortSignal.timeout(20000),
    });
    let receipt;
    try { receipt = await response.json(); } catch { return {kind:'uncertain' as const}; }
    if (response.ok && receipt?.ok === true) return {kind:'sent' as const};
    if (response.ok || response.status >= 500) return {kind:'uncertain' as const};
    return {kind:'rejected' as const, rateLimited:response.status === 429};
  } catch { return {kind:'uncertain' as const}; }
}
