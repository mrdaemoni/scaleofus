export const contactEndpoint = 'https://formspree.io/f/xqpejzzr';

// No retries: an interrupted response may follow an accepted submission.
export function createInquirySender(request: typeof fetch = fetch) {
  let pending = false;
  return async (data: FormData) => {
    if (pending) return { kind: 'pending' as const };
    pending = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await request(contactEndpoint, {
        method: 'POST', body: data, headers: { Accept: 'application/json' },
        credentials: 'omit', signal: controller.signal,
      });
      let body;
      try { body = await response.json(); } catch { return {kind:'uncertain' as const}; }
      if (response.ok && body?.ok === true) return {kind:'sent' as const};
      if (response.ok || response.status >= 500) return {kind:'uncertain' as const};
      return {kind:'rejected' as const, rateLimited:response.status === 429};
    } catch {
      return {kind:'uncertain' as const};
    } finally {
      clearTimeout(timeout);
      pending = false;
    }
  };
}

export function setupContactForms() {
  document.querySelectorAll<HTMLFormElement>('[data-contact-form]').forEach(form => {
    const fields = form.querySelector<HTMLFieldSetElement>('fieldset')!;
    const result = form.querySelector<HTMLElement>('[data-contact-result]')!;
    const button = form.querySelector<HTMLButtonElement>('[data-contact-send]')!;
    const name = form.querySelector<HTMLInputElement>('[name="name"]')!;
    const message = form.querySelector<HTMLTextAreaElement>('[name="message"]')!;
    const send = createInquirySender();
    let pending = false;
    let completed = false;
    async function submit() {
      if (pending || completed) return;
      [name, message].forEach(field => field.setCustomValidity(field.value.trim() ? '' : 'Please fill out this field.'));
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      data.set('name', name.value.trim());
      data.set('message', message.value.trim());
      pending = true;
      button.disabled = true;
      fields.disabled = true;
      form.setAttribute('aria-busy', 'true');
      result.textContent = 'Sending your inquiry…';
      const outcome = await send(data);
      pending = false;
      fields.disabled = false;
      form.removeAttribute('aria-busy');
      if (outcome.kind === 'sent') {
        completed = true;
        result.textContent = 'Your inquiry was submitted. Thank you for getting in touch.';
        form.reset();
        // Leave the button disabled until the visitor starts a new inquiry.
      } else {
        button.disabled = false;
        result.textContent = outcome.kind === 'rejected'
          ? outcome.rateLimited
            ? 'Too many inquiries were sent. Please wait before trying again. Your message is still here.'
            : 'Your inquiry was not accepted. Please check your details and try again. Your message is still here.'
          : 'We could not confirm whether your inquiry was received. Your message is still here. Please check before sending it again.';
      }
    }
    form.addEventListener('submit', event => { event.preventDefault(); void submit(); });
    button.addEventListener('click', () => { void submit(); });
    form.addEventListener('input', () => {
      [name, message].forEach(field => field.setCustomValidity(''));
      if (!pending) { completed = false; button.disabled = false; result.textContent = ''; }
    });
    form.addEventListener('change', () => {
      if (!pending) { completed = false; button.disabled = false; result.textContent = ''; }
    });
    // Enable only after the no-navigation handler is installed.
    fields.disabled = false;
  });
}
