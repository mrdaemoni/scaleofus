const form = document.querySelector<HTMLFormElement>('[data-review-form]');
if (form) {
  const storageKey = `scaleofus:publisher-v1:review:${form.dataset.story}`;
  const saved = document.querySelector<HTMLElement>('.saved-review')!;
  const error = form.querySelector<HTMLElement>('.form-error')!;
  const show = (draft: {name: string; format: string; source: string; relationship: string; rating: string; review: string}) => {
    saved.hidden = false;
    const formats: Record<string,string> = {print:'Printed edition', online:'Online reading', immersive:'Immersive reading'};
    const sources: Record<string,string> = {purchased:'Purchase claimed, not verified', gifted:'Complimentary copy', borrowed:'Borrowed copy', 'free-digital':'Free digital story'};
    const relationships: Record<string,string> = {none:'No relationship disclosed', friend:'Friend of the author', family:'Family member', colleague:'Colleague or collaborator'};
    saved.querySelector('[data-review-label]')!.textContent = `${draft.name} · ${formats[draft.format]} · ${sources[draft.source]} · ${relationships[draft.relationship]}${draft.rating ? ' · ' + draft.rating + '/5' : ''}`;
    saved.querySelector('[data-review-text]')!.textContent = draft.review;
  };
  try { const stored = localStorage.getItem(storageKey); if (stored) show(JSON.parse(stored)); } catch { /* The form still works if storage is unavailable. */ }
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    error.hidden = true;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const format = String(data.get('format'));
    const source = String(data.get('source'));
    if ((format === 'print' && source === 'free-digital') || (format !== 'print' && source !== 'free-digital')) {
      error.textContent = 'Please choose how you received the edition you reviewed. Free digital reading belongs to an online or immersive review.';
      error.hidden = false;
      return;
    }
    const draft = { name: String(data.get('name')).trim(), format, source, relationship: String(data.get('relationship')), rating: String(data.get('rating')), review: String(data.get('review')).trim() };
    if (!draft.name || draft.review.length < 10) { error.textContent = 'Please add your name and at least 10 characters of review text.'; error.hidden = false; return; }
    try { localStorage.setItem(storageKey, JSON.stringify(draft)); show(draft); form.reset(); }
    catch { error.textContent = 'This browser could not save your draft. Your text is still in the form.'; error.hidden = false; }
  });
  document.querySelector('[data-delete-review]')?.addEventListener('click', () => {
    try { localStorage.removeItem(storageKey); saved.hidden = true; } catch { error.textContent = 'This browser could not remove the draft.'; error.hidden = false; }
  });
}
