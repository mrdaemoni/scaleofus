// Disposable synthetic inbox only; no test words are published or retained.
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {once} from 'node:events';
import {createReflectionsServer} from '../reflections/server.mjs';
const {chromium} = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const temporary = await mkdtemp(path.join(tmpdir(), 'reflections-browser-'));
const output = process.env.QA_OUTPUT || path.resolve('.reflections-proof');
await mkdir(output, {recursive:true});
const {server, store} = createReflectionsServer({directory:path.join(temporary, 'private'), staticRoot:process.env.QA_STATIC_ROOT || path.resolve('dist')});
server.listen(0, '127.0.0.1'); await once(server, 'listening');
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({channel:'chrome', headless:true});
const results = [], errors = [];
async function pageFor(options = {}) {
  const context = await browser.newContext(options), page = await context.newPage();
  page.setDefaultTimeout(12000); await page.route('https://**', route => route.abort());
  page.on('pageerror', error => errors.push(error.message)); return page;
}
async function ready(page, route = '/reflections/') {
  await page.goto(origin + route + '?local=1'); await page.waitForFunction(() => !document.querySelector('[data-reflection-form] fieldset').disabled);
}
async function check(name, work) { await work(); results.push(name); console.log(`PASS ${name}`); }
try {
  const prefixes = process.env.QA_INCLUDE_PUBLISHER === '1' ? ['', '/publisher'] : [''];
  for (const prefix of prefixes) for (const es of [false]) for (const width of [320, 390, 1440]) {
    const page = await pageFor({viewport:{width, height:width === 1440 ? 1000 : 844}, reducedMotion:'reduce'});
    await check(`${prefix || 'root'} ${es ? 'Spanish' : 'English'} ${width}px: minimal accessible form and mobile layout`, async () => {
      await ready(page, prefix + (es ? '/es/reflections/' : '/reflections/'));
      assert.equal(await page.locator('html').getAttribute('lang'), es ? 'es' : 'en');
      assert.equal(await page.locator('#reflection-consent').isChecked(), false);
      assert.equal(await page.locator('#reflection-name').isVisible(), false);
      assert.equal(await page.locator('#reflection-name').isDisabled(), true);
      assert.equal(await page.locator('[data-contact-form]').count(), 0);
      assert.equal(await page.locator('[data-reflections] input[type=email]').count(), 0);
      assert.equal(await page.locator('.reflection-quotes figure').count(), 0);
      assert.equal(await page.locator('[data-reflections]').innerText().then(text => /Hector|Héctor|approv|moderation/i.test(text)), false);
      assert.match(await page.locator('h1').innerText(), es ? /Cuéntanos qué\s+se te quedó/ : /Tell us what\s+stayed with you/);
      assert.match(await page.locator('[data-reflection-availability]').textContent(), es ? /solo en esta Mac/ : /this Mac only/);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      for (const selector of ['#reflection-text', '[data-reflection-submit]', '.reflection-consent']) assert((await page.locator(selector).boundingBox()).height >= 44);
      await page.locator('#reflection-text').focus(); assert.equal(await page.locator('#reflection-text').evaluate(node => getComputedStyle(node).outlineStyle), 'solid');
      assert.equal(await page.locator('.reflection-language').count(), 0);
      await page.evaluate(() => { document.activeElement?.blur(); scrollTo(0, 0); });
      if (!prefix) await page.screenshot({path:path.join(output, `${es ? 'es' : 'en'}-${width}.png`), fullPage:true});
    }); await page.context().close();
  }
  for (const es of [false]) await check(`${es ? 'Spanish' : 'English'}: consent toggles attribution, clears hidden name and stays optional`, async () => {
    const page = await pageFor({viewport:{width:390, height:844}}); await ready(page, es ? '/es/reflections/' : '/reflections/');
    const checkbox = page.locator('#reflection-consent'), name = page.locator('#reflection-name');
    await checkbox.check(); assert.equal(await name.isVisible(), true); assert.equal(await name.isDisabled(), false);
    assert.equal(await name.getAttribute('required'), null); await name.fill('TEST INITIALS');
    if (!es) await page.screenshot({path:path.join(output, 'sharing-name-mobile.png'), fullPage:true});
    await checkbox.uncheck(); assert.equal(await name.inputValue(), ''); assert.equal(await name.isVisible(), false); assert.equal(await name.isDisabled(), true);
    await checkbox.check(); assert.equal(await name.inputValue(), ''); await checkbox.uncheck();
    await page.locator('#reflection-text').fill(`TEST FIXTURE — private toggle ${es}`);
    await page.locator('[data-reflection-submit]').click(); await page.locator('[data-reflection-success]').waitFor({state:'visible'});
    const record = (await store.list()).at(-1); assert.equal(record.name, ''); assert.equal(record.status, 'private'); assert.equal(record.quoteConsent, false);
    assert.equal(await page.locator('[data-reflection-success]').innerText(), es ? 'Gracias.' : 'Thank you.');
    await page.context().close();
  });
  await check('optional star rating supports hover, keyboard selection and clearing', async () => {
    const page = await pageFor({viewport:{width:390, height:844}}); await ready(page);
    assert.equal(await page.locator('[name="rating"]:checked').count(), 0);
    const fourth = page.locator('.reflection-stars label').nth(3);
    assert.equal(await fourth.getAttribute('title'), '4 out of 5 stars');
    await fourth.hover();
    await page.waitForFunction(() => {
      const stars = [...document.querySelectorAll('.reflection-stars span')];
      return getComputedStyle(stars[3]).color !== getComputedStyle(stars[4]).color;
    });
    const colors = await page.locator('.reflection-stars span').evaluateAll(nodes => nodes.map(node => getComputedStyle(node).color));
    assert.equal(new Set(colors.slice(0, 4)).size, 1); assert.notEqual(colors[3], colors[4]);
    await fourth.click(); assert.equal(await page.locator('[name="rating"]:checked').inputValue(), '4');
    await page.getByRole('button', {name:'Clear rating'}).click(); assert.equal(await page.locator('[name="rating"]:checked').count(), 0);
    await page.getByRole('radio', {name:'3 out of 5 stars', exact:true}).focus(); await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('[name="rating"]:checked').inputValue(), '4');
    await page.locator('#reflection-text').fill('TEST FIXTURE — optional rating.');
    await page.locator('[data-reflection-submit]').click(); await page.locator('[data-reflection-success]').waitFor({state:'visible'});
    assert.equal((await store.list()).at(-1).rating, 4); await page.context().close();
  });
  await check('consented responses are eligible immediately; private responses and names never enter export', async () => {
    const page = await pageFor(); await ready(page);
    await page.locator('#reflection-text').fill('TEST FIXTURE — sharing is my choice.'); await page.locator('#reflection-consent').check(); await page.locator('#reflection-name').fill('T.R.');
    await page.locator('[data-reflection-submit]').click(); await page.locator('[data-reflection-success]').waitFor({state:'visible'});
    const record = (await store.list()).at(-1); assert.equal(record.status, 'eligible'); assert.equal(record.name, 'T.R.'); assert.equal(record.approval, undefined);
    const file = path.join(temporary, 'public.json'); await store.exportPublic(file); const exported = JSON.parse(await readFile(file));
    assert.equal(exported.length, 1); assert.equal(exported[0].id, record.id); assert(!JSON.stringify(exported).includes('private toggle'));
    assert.equal((await page.evaluate(async () => (await fetch('/api/reflections')).status)), 404);
    await page.context().close();
  });
  await check('rapid repeated submit saves once, thank-you hides the form, refresh starts unchecked', async () => {
    const page = await pageFor(); await ready(page); const before = (await store.list()).length;
    await page.locator('#reflection-text').fill('TEST FIXTURE — repeated submit.');
    await page.locator('[data-reflection-form]').evaluate(form => { form.requestSubmit(); form.dispatchEvent(new Event('submit', {bubbles:true, cancelable:true})); });
    await page.locator('[data-reflection-success]').waitFor({state:'visible'}); assert.equal((await store.list()).length, before + 1);
    assert.equal(await page.locator('[data-reflection-form]').isVisible(), false);
    await page.screenshot({path:path.join(output, 'thank-you-mobile.png'), fullPage:true});
    await page.reload(); await page.waitForFunction(() => !document.querySelector('[data-reflection-form] fieldset').disabled);
    assert.equal(await page.locator('#reflection-consent').isChecked(), false); assert.equal(await page.locator('#reflection-name').isVisible(), false);
    assert.equal((await store.list()).length, before + 1); await page.context().close();
  });
  await check('lost receipt preserves words and retries without duplicating the local record', async () => {
    const page = await pageFor(); await ready(page); const before = (await store.list()).length; let loseReceipt = true;
    await page.route('**/api/reflections', async route => { if (loseReceipt) { loseReceipt = false; await route.fetch(); await route.abort('failed'); } else await route.continue(); });
    const text = 'TEST FIXTURE — lost receipt retry.'; await page.locator('#reflection-text').fill(text); await page.locator('[data-reflection-submit]').click();
    await page.locator('[data-reflection-error]').waitFor({state:'visible'}); assert.equal(await page.locator('#reflection-text').inputValue(), text);
    await page.locator('[data-reflection-submit]').click(); await page.locator('[data-reflection-success]').waitFor({state:'visible'}); assert.equal((await store.list()).length, before + 1);
    await page.context().close();
  });
  await check('unavailable local sandbox and JavaScript refusal remain disabled; no reflection POST sent', async () => {
    const page = await pageFor(); let posts = 0;
    page.on('request', request => { if (request.method() === 'POST' && request.url() === origin + '/api/reflections') posts++; });
    await page.route('**/api/reflections/config', route => route.fulfill({status:404, body:'Not found'}));
    await page.goto(origin + '/reflections/?local=1'); await page.getByText('We can’t receive reflections here yet.').waitFor();
    assert.equal(await page.locator('#reflection-text').isDisabled(), true); assert.equal(posts, 0);
    const withoutJS = await pageFor({javaScriptEnabled:false}); await withoutJS.goto(origin + '/reflections/');
    assert.equal(await withoutJS.locator('#reflection-text').isDisabled(), true); assert.equal(await withoutJS.locator('#reflection-name').isVisible(), false);
    await withoutJS.context().close(); await page.context().close();
  });
  await check('book and checkout entrances stay intact; legacy review links point to the simple flow', async () => {
    const page = await pageFor(); await page.goto(origin); assert.equal(await page.locator('#digital-tab').getAttribute('href'), '/immerse/wind/');
    assert.equal(await page.locator('.spanish-reader-link').getAttribute('href'), '/immerse/es/');
    await page.locator('.reflection-invitation').click(); await page.waitForURL('**/reflections/');
    await page.goto(origin + '/stories/the-boy-who-tried-to-catch-the-wind/'); assert.match(await page.locator('.purchase-note').textContent(), /Sales are not open|Preview · price to be confirmed/);
    assert.equal(await page.locator('[data-review-form]').count(), 0); await page.context().close();
  });
  await check('previous Spanish reflections links redirect to English without changing Spanish readers', async () => {
    const page = await pageFor();
    for (const prefix of prefixes) {
      await page.goto(origin + prefix + '/es/reflections/'); await page.waitForURL(origin + prefix + '/reflections/');
      assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    }
    await page.goto(origin + '/immerse/es/'); assert.equal(await page.locator('html').getAttribute('lang'), 'es');
    await page.context().close();
  });
  assert.deepEqual(errors, []); await writeFile(path.join(output, 'browser-results.json'), JSON.stringify({passed:results.length, checks:results, pageErrors:errors, syntheticPrivateStoreRemoved:true}, null, 2));
} finally {
  await browser.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); await rm(temporary, {recursive:true, force:true});
}
