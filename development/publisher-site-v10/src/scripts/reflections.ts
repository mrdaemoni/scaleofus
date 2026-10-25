import {sendReflection} from './reflections-send';
const root = document.querySelector<HTMLElement>('[data-reflections]');
class ReaderError extends Error {}
if (root) {
  const es = root.dataset.language === 'es';
  const form = root.querySelector<HTMLFormElement>('[data-reflection-form]')!;
  const fields = form.querySelector<HTMLFieldSetElement>('fieldset')!;
  const availability = root.querySelector<HTMLElement>('[data-reflection-availability]')!;
  const connect = root.querySelector<HTMLButtonElement>('[data-reflection-connect]')!;
  const error = root.querySelector<HTMLElement>('[data-reflection-error]')!;
  const success = root.querySelector<HTMLElement>('[data-reflection-success]')!;
  const button = root.querySelector<HTMLButtonElement>('[data-reflection-submit]')!;
  const consent = form.querySelector<HTMLInputElement>('#reflection-consent')!;
  const name = form.querySelector<HTMLInputElement>('#reflection-name')!;
  const attribution = form.querySelector<HTMLElement>('#reflection-attribution')!;
  // Local storage is an explicit sandbox. Ordinary previews use the real inbox.
  const local = ['127.0.0.1', 'localhost', '[::1]'].includes(location.hostname) && new URLSearchParams(location.search).get('local') === '1';
  let token = '', requestId = '', inFlight = false;
  const label = es ? 'Enviar' : 'Submit';
  const syncAttribution = () => {
    attribution.hidden = !consent.checked;
    name.disabled = !consent.checked;
    if (!consent.checked) name.value = '';
  };
  consent.checked = false;
  consent.addEventListener('change', syncAttribution);
  syncAttribution();
  async function prepare() {
    fields.disabled = true; connect.hidden = true;
    availability.hidden = !local;
    if (!local) { fields.disabled = false; return; }
    try {
      const response = await fetch('/api/reflections/config', {headers:{'X-Reflection-Client':'1'}, cache:'no-store', signal:AbortSignal.timeout(5000)});
      if (!response.ok) throw new Error();
      const config = await response.json();
      if (config.mode !== 'local' || typeof config.token !== 'string') throw new Error();
      token = config.token;
      availability.textContent = es ? 'Prueba local · se guarda solo en esta Mac.' : 'Local test · saved on this Mac only.';
      await new Promise(resolve => setTimeout(resolve, 2100));
      fields.disabled = false;
    } catch {
      availability.textContent = es ? 'Aún no podemos recibir reflexiones aquí.' : 'We can’t receive reflections here yet.';
      connect.hidden = false;
    }
  }
  connect.addEventListener('click', prepare);
  form.addEventListener('input', () => { if (!inFlight) { requestId = ''; error.hidden = true; } });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (inFlight || (local && !token) || fields.disabled || !form.reportValidity()) return;
    syncAttribution();
    const values = new FormData(form);
    if (!requestId) requestId = crypto.randomUUID();
    const body = {book:values.get('book'), language:values.get('language'), consentVersion:values.get('consentVersion'), text:values.get('text'), name:consent.checked ? name.value : '', quoteConsent:consent.checked, website:values.get('website'), requestId};
    inFlight = true; fields.disabled = true; error.hidden = true;
    button.textContent = es ? 'Enviando…' : 'Sending…';
    try {
      if (!local) {
        const outcome = await sendReflection(body, requestId, String(values.get('website') || ''));
        if (outcome.kind === 'uncertain') throw new ReaderError(es ? 'No pudimos confirmar la recepción. Tu texto sigue aquí. Comprueba antes de volver a enviarlo para evitar duplicados.' : 'We couldn’t confirm whether it was received. Your words are still here. Please check before sending again to avoid a duplicate.');
        if (outcome.kind === 'rejected') throw new ReaderError(outcome.rateLimited
          ? (es ? 'No podemos recibir más reflexiones por ahora. Tu texto sigue aquí. Vuelve más tarde.' : 'We can’t receive more reflections right now. Your words are still here. Please try later.')
          : (es ? 'No se aceptó tu reflexión. Tu texto sigue aquí. Revisa e inténtalo de nuevo.' : 'Your reflection wasn’t accepted. Your words are still here. Please check and try again.'));
      } else {
        const response = await fetch('/api/reflections', {method:'POST', headers:{'Content-Type':'application/json', 'X-Reflection-Token':token}, body:JSON.stringify(body), signal:AbortSignal.timeout(10000)});
        if (!response.ok) {
          if (response.status === 429) throw new ReaderError(es ? 'Vuelve a intentarlo más tarde. Tu texto sigue aquí.' : 'Try again later. Your words are still here.');
          if (response.status === 403) { connect.hidden = false; throw new ReaderError(es ? 'Pulsa «Volver a intentar» antes de enviar. Tu texto sigue aquí.' : 'Choose “Try again” before sending. Your words are still here.'); }
          throw new Error();
        }
        const receipt = await response.json();
        if (receipt.received !== true) throw new Error();
      }
      form.reset(); syncAttribution(); form.hidden = true; success.hidden = false;
      success.querySelector<HTMLElement>('h2')!.focus();
    } catch (failure) {
      error.textContent = failure instanceof ReaderError ? failure.message : (es ? 'No pudimos confirmar el envío. Tu texto sigue aquí. Vuelve a intentarlo.' : 'We couldn’t confirm it was saved. Your words are still here. Please try again.');
      error.hidden = false;
    } finally { fields.disabled = false; inFlight = false; button.textContent = label; }
  });
  prepare();
}
