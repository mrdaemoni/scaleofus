// Run against generated docs/ served with byte-range support. See QA_WEBSITE.md.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:4323';
const output = process.env.QA_OUTPUT || '/tmp/scaleofus-qa';
await mkdir(output, {recursive:true});
const browser = await chromium.launch({channel:'chrome', headless:true});
const results=[];
async function check(name, run) { await run(); results.push(name); console.log(`PASS ${name}`); }
try {
for (const locale of ['es','wind']) {
 for (const reducedMotion of ['no-preference','reduce']) {
  const page = await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion});
  page.setDefaultTimeout(12000);
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('https://**',route=>route.abort());
  await page.goto(`${base}/publisher/immerse/${locale}/`);
  const audio=page.locator('[data-audio]');
  const state=()=>audio.evaluate(a=>({time:a.currentTime,paused:a.paused,hash:location.hash}));
  const waitPausedSeek=()=>page.waitForFunction(()=>!document.querySelector('audio').seeking && document.querySelector('[data-audio-dock]').getAttribute('aria-busy')==='false');
  await check(`${locale} ${reducedMotion}: chapter 4 paused resume`,async()=>{
   await page.locator('[data-hero-play]').click();
   await page.waitForFunction(()=>!document.querySelector('audio').paused && document.querySelector('audio').currentTime>.15);
   await page.locator('[data-play]').click();
   await page.locator('[data-dock-chapter-link]').nth(3).click();
   await waitPausedSeek();
   const before=await state();assert(before.time>490);assert(before.paused);
   await page.locator('[data-play]').click();
   await page.waitForFunction(()=>!document.querySelector('audio').paused);
   await page.waitForTimeout(450);
   const after=await state();assert(Math.abs(after.time-before.time)<3,JSON.stringify({before,after}));assert.equal(after.hash,before.hash);
   console.log(JSON.stringify({locale,reducedMotion,before,after}));
   await page.locator('[data-play]').click();
  });
  await check(`${locale} ${reducedMotion}: all seven chapters, keyboard controls, sizes, descriptions`,async()=>{
   for(let i=0;i<7;i++){
    const link=page.locator('[data-dock-chapter-link]').nth(i);
    await link.focus();await page.keyboard.press('Enter');await waitPausedSeek();
    const target=Number(await link.getAttribute('data-start'));
    assert(Math.abs((await state()).time-target)<1);
    assert((await state()).hash.startsWith(`#chapter-${i+1}-`));
   }
   for(const selector of ['[data-play]','[data-collapse]','[data-seek]','[data-dock-chapter-link]']){
    const bounds=await page.locator(selector).first().boundingBox();assert(bounds.height>=44,`${selector} ${bounds.height}`);
    if(selector!=='[data-seek]')assert(bounds.width>=44,`${selector} ${bounds.width}`);
   }
   await page.locator('[data-collapse]').focus();await page.keyboard.press('Enter');
   assert.equal(await page.locator('[data-collapse]').getAttribute('aria-expanded'),'true');
   if(locale==='es') {
    assert.equal(await page.locator('[data-play]').getAttribute('aria-label'),'Reproducir narración');
    assert.equal(await page.locator('.publisher-return').textContent(),'← Libro y edición');
   }
   const descriptions=await page.locator('[data-beat] .living-drawing[role=img]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('aria-label')));
   assert.equal(descriptions.length,56);assert(descriptions.every(x=>x.endsWith('.')));assert(!descriptions.some(x=>/draw the|dibuja el|\.\.\.|…/.test(x)));
   assert(await page.locator('[data-reading-compass]').evaluate(n=>n.inert));
   if(reducedMotion==='reduce')assert.equal(await page.locator('.living-drawing').first().evaluate(n=>getComputedStyle(n).animationName),'none');
   await page.screenshot({path:`${output}/mobile-${locale}-${reducedMotion}.png`});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  });
  await check(`${locale} ${reducedMotion}: playing chapter switch, seek keyboard, home restart`,async()=>{
   await page.locator('[data-play]').click();
   await page.locator('[data-dock-chapter-link]').nth(1).click();await waitPausedSeek();
   await page.waitForFunction(()=>!document.querySelector('audio').paused);
   assert((await state()).time>150);
   await page.locator('[data-play]').click();
   await page.locator('[data-seek]').focus();await page.keyboard.press('ArrowRight');
   if(await page.locator('[data-collapse]').getAttribute('aria-expanded')==='false') await page.locator('[data-collapse]').click();
   await page.locator('.dock-options [data-reader-home]').click();
   await page.waitForFunction(()=>document.body.dataset.readerMode==='cover' && document.querySelector('audio').currentTime<1);
  });
  assert.deepEqual(errors,[]);await page.close();
 }
}
for(const width of [320,390,1440]){
 const page=await browser.newPage({viewport:{width,height:width===1440?1000:844}});page.setDefaultTimeout(12000);
 await page.route('https://**',route=>route.abort());
 await check(`landing ${width}px: bilingual entry and gallery`,async()=>{
  await page.goto(base+'/');
  assert.equal(await page.locator('[data-story-app]').count(),0);
  assert.equal(await page.locator('meta[name=robots]').count(),0);
  assert.equal(await page.getByRole('link',{name:'Lee o escucha en línea'}).getAttribute('href'),'/immerse/es/');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:`${output}/landing-${width}.png`});
  assert.equal(await page.getByRole('link',{name:'Read or listen online'}).getAttribute('href'),'/immerse/wind/');
  await page.getByRole('link',{name:'Read or listen online'}).click();
  await page.waitForURL('**/immerse/wind/');
  assert.equal(await page.locator('html').getAttribute('lang'),'en');
  assert.equal(await page.locator('[data-hero-play]').count(),1);
 });
 await page.close();
}
const page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(12000);await page.route('https://**',route=>route.abort());
await check('old root deep links, desktop English resume, manual readers and skip link',async()=>{
 await page.goto(base+'/#chapter-4-the-girl-at-the-pond');await page.waitForURL('**/books/the-boy-who-tried-to-catch-the-wind/**');
 await page.waitForFunction(()=>document.querySelector('audio').currentTime>490);
 await page.locator('[data-reader-listen]').click();await page.waitForFunction(()=>!document.querySelector('audio').paused);
 await page.waitForFunction(()=>document.querySelector('audio').currentTime>490);
 await page.screenshot({path:`${output}/desktop-reader.png`});
 for(const locale of ['es','wind']){
  await page.setViewportSize({width:390,height:844});await page.goto(`${base}/publisher/read/${locale}/`);
  await page.keyboard.press('Tab');assert.equal(await page.locator(':focus').getAttribute('class'),'reader-skip-link');
  await page.keyboard.press('Enter');assert.equal(await page.locator(':focus').getAttribute('id'),'story');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  for(let chapter=0;chapter<3;chapter++) {
   await page.locator('.reading-compass.is-visible [data-reader-next]').focus();
   await page.keyboard.press('Enter');
  }
  await page.locator('[data-reader-listen]').click();await page.waitForFunction(()=>!document.querySelector('audio').paused);
  await page.waitForFunction(()=>document.querySelector('audio').currentTime>490);
 }
});
await page.close();
await writeFile(`${output}/browser-results.json`,JSON.stringify({passed:results.length,checks:results},null,2));
} finally {await browser.close();}
