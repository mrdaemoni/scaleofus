// Shared consent policy. Publication eligibility is reader-controlled.
export const BOOK = 'the-boy-who-tried-to-catch-the-wind';
export const CONSENT_VERSION = 'public-sharing-v2';
export const RETENTION_DAYS = 90;
export class ReflectionError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
export function validateSubmission(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ReflectionError('Invalid reflection.');
  if (!['en', 'es'].includes(input.language) || input.book !== BOOK) throw new ReflectionError('Unknown story or language.');
  if (typeof input.quoteConsent !== 'boolean' || input.consentVersion !== CONSENT_VERSION) throw new ReflectionError('Please confirm your sharing choice.');
  if (typeof input.text !== 'string') throw new ReflectionError('Please use text for your reflection.');
  const text = input.text.trim().normalize('NFC');
  // Unchecked attribution is discarded, including forged/stale hidden input data.
  if (input.quoteConsent && typeof input.name !== 'string') throw new ReflectionError('Please use text for your name or initials.');
  const name = input.quoteConsent ? input.name.trim().normalize('NFC') : '';
  if (text.length < 3 || text.length > 2000 || name.length > 80) throw new ReflectionError('Use 3–2,000 characters for your reflection and up to 80 for your name.');
  if (/[\u0000-\u0008\u000b-\u001f\u007f]/u.test(text) || /[\u0000-\u001f\u007f]/u.test(name)) throw new ReflectionError('Please remove control characters.');
  const rating = input.rating;
  if (rating !== undefined && (!Number.isInteger(rating) || rating < 1 || rating > 5)) throw new ReflectionError('Choose a rating from 1 to 5 stars.');
  return {book:BOOK, language:input.language, text, name, quoteConsent:input.quoteConsent, consentVersion:CONSENT_VERSION, ...(rating === undefined ? {} : {rating})};
}
export const isPublicEligible = record => record.quoteConsent === true && record.consentVersion === CONSENT_VERSION && record.status === 'eligible';
export function publicReflections(records) {
  if (!Array.isArray(records)) throw new Error('Public reflections must be an array.');
  const ids = new Set();
  return records.map(record => {
    const clean = validateSubmission(record);
    if (!isPublicEligible(record) || !/^[a-f0-9]{64}$/.test(record.digest || '') || !/^[a-f0-9-]{36}$/.test(record.id || '') || ids.has(record.id)) throw new Error('Private, duplicate or unconsented reflection in public export.');
    ids.add(record.id);
    return {id:record.id, language:clean.language, text:clean.text, name:clean.name || (clean.language === 'es' ? 'Anónimo' : 'Anonymous')};
  });
}
