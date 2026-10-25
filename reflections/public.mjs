// Build-time validation. No private inbox is imported by the site.
import {createHash} from 'node:crypto';
import {validateSubmission, publicReflections} from './policy.mjs';
export function loadPublicReflections(records) {
  const display = publicReflections(records);
  for (const record of records) {
    const digest = createHash('sha256').update(JSON.stringify(validateSubmission(record))).digest('hex');
    if (digest !== record.digest) throw new Error('Public reflection differs from its consent record.');
  }
  return display;
}
