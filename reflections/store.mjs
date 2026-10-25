import {createHash, randomUUID} from 'node:crypto';
import {mkdir, readFile, open, rename, rm} from 'node:fs/promises';
import path from 'node:path';
import {RETENTION_DAYS, CONSENT_VERSION, isPublicEligible, ReflectionError, validateSubmission, publicReflections} from './policy.mjs';
export const digest = value => createHash('sha256').update(JSON.stringify(validateSubmission(value))).digest('hex');
export async function atomicJSON(file, value) {
  await mkdir(path.dirname(file), {recursive:true, mode:0o700});
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    const handle = await open(temporary, 'wx', 0o600);
    try { await handle.writeFile(JSON.stringify(value, null, 2) + '\n'); await handle.sync(); } finally { await handle.close(); }
    await rename(temporary, file);
  } finally { await rm(temporary, {force:true}); }
}
export class ReflectionStore {
  constructor(directory, now = () => Date.now()) { this.directory = directory; this.now = now; }
  async transaction(work) {
    await mkdir(this.directory, {recursive:true, mode:0o700});
    const lock = path.join(this.directory, 'writer.lock');
    let held = false;
    for (let i = 0; i < 100; i++) {
      try { await mkdir(lock, {mode:0o700}); held = true; break; }
      catch (error) { if (error.code !== 'EEXIST') throw error; await new Promise(resolve => setTimeout(resolve, 20)); }
    }
    if (!held) throw new ReflectionError('Private store is busy. Retry shortly.', 503);
    try {
      let state;
      const file = path.join(this.directory, 'submissions.json');
      try { state = JSON.parse(await readFile(file, 'utf8')); }
      catch (error) { if (error.code !== 'ENOENT') throw error; state = {version:1, records:[]}; }
      if (state.version !== 1 || !Array.isArray(state.records)) throw new Error('Invalid private store.');
      const before = state.records.length;
      state.records = state.records.filter(record => isPublicEligible(record) || this.now() - Date.parse(record.createdAt) <= RETENTION_DAYS * 86400000);
      const result = await work(state);
      if (result.value && typeof result.value.removed === 'number') result.value.removed = before - state.records.length;
      if (result.write || state.records.length !== before) await atomicJSON(file, state);
      return result.value;
    } finally { await rm(lock, {recursive:true}); }
  }
  submit(input, requestId) {
    const clean = validateSubmission(input);
    if (!/^[a-f0-9-]{36}$/.test(requestId || '')) throw new ReflectionError('Invalid submission reference.');
    return this.transaction(state => {
      const fingerprint = digest(clean);
      const repeated = state.records.find(record => record.requestId === requestId);
      if (repeated) {
        if (repeated.digest !== fingerprint) throw new ReflectionError('This reference was already used. Start a new reflection.', 409);
        return {value:{received:true}};
      }
      // Duplicate retry from another tab also stays one record (within 24 hours).
      if (state.records.some(record => record.digest === fingerprint && this.now() - Date.parse(record.createdAt) < 86400000)) return {value:{received:true}};
      if (state.records.length >= 1000) throw new ReflectionError('The private inbox is full. Please try another day.', 503);
      state.records.push({...clean, id:randomUUID(), requestId, digest:fingerprint, createdAt:new Date(this.now()).toISOString(), status:clean.quoteConsent ? 'eligible' : 'private'});
      return {write:true, value:{received:true}};
    });
  }
  list() { return this.transaction(state => ({value:structuredClone(state.records)})); }
  remove(id, action) {
    return this.transaction(state => {
      const record = state.records.find(record => record.id === id);
      if (!record) throw new ReflectionError('Reflection not found.', 404);
      if (action === 'revoke') {
        record.quoteConsent = false; record.name = ''; record.status = 'private';
        record.withdrawnAt = new Date(this.now()).toISOString();
        if (record.consentVersion === CONSENT_VERSION) record.digest = digest(record);
      } else if (action === 'delete') state.records = state.records.filter(item => item.id !== id);
      else throw new ReflectionError('Unknown removal action.');
      return {write:true, value:{id, action}};
    });
  }
  prune() {
    return this.transaction(state => {
      return {value:{removed:0}};
    });
  }
  async exportPublic(file) {
    // Same lock as submit/remove, so export cannot race a withdrawal.
    return this.transaction(async state => {
      const records = state.records.filter(isPublicEligible).map(record => {
        if (digest(record) !== record.digest) throw new Error('Stored reflection differs from its consent record.');
        return {...validateSubmission(record), id:record.id, status:'eligible', digest:record.digest};
      });
      publicReflections(records); // Fail closed before writing any public data.
      await atomicJSON(file, records);
      return {value:{exported:records.length, file}};
    });
  }
}
