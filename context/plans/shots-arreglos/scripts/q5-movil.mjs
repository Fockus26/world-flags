// B: atributos del campo de respuesta en móvil (viewport + táctil) en todos los modos
import {chromium, devices} from '@playwright/test';
import {B, boot, setMode, active} from './lib.mjs';
const setGame = async (page, v)=>{ await page.locator(`input[type=radio][value=${v}]`).evaluate(e=>e.click()); await page.waitForTimeout(400); };
const setRegions = async (page, regions)=>{ for (const r of ['world','north-america','central-america','caribbean','south-america','europe','oceania','asia','africa']) { const cb=page.locator(`input[type=checkbox][value=${r}]`); if ((await cb.isChecked()) !== regions.includes(r)) { await cb.evaluate(e=>e.click()); await page.waitForTimeout(200); } } };
const L=(...a)=>console.log(...a);
const browser = await chromium.launch();
const ctx = await browser.newContext({...devices['Pixel 7'], serviceWorkers:'block', reducedMotion:'reduce'});
const page = await ctx.newPage(); const errs=[]; page.on('pageerror',e=>errs.push(e.message));
L('touch:', await page.evaluate(()=>navigator.maxTouchPoints), 'ua móvil:', /Android/.test(await page.evaluate(()=>navigator.userAgent)));
await boot(page);
const attrs = (sel)=>page.evaluate((sel)=>{const i=document.querySelector(sel); if(!i) return 'NO INPUT'; const o={}; for (const a of ['id','name','type','inputmode','enterkeyhint','autocomplete','autocorrect','autocapitalize','spellcheck','data-1p-ignore','data-lpignore','data-bwignore','data-form-type','readonly','aria-disabled']) o[a]=i.getAttribute(a); o.label=document.querySelector(`label[for="${i.id}"]`)?.textContent?.trim().slice(0,40); o.hscroll=document.documentElement.scrollWidth>innerWidth; return JSON.stringify(o);}, sel);
for (const mode of ['Práctica','Competitivo']) {
  await setMode(page, mode);
  for (const game of ['flags','capitals','countries']) {
    await setGame(page, game); await setRegions(page,['north-america']);
    await page.getByRole('button',{name:'Comenzar práctica'}).tap();
    await page.waitForSelector('#answer-input, #rush-answer-input',{timeout:30000}); await page.waitForTimeout(1200);
    const sel = (await page.locator('#rush-answer-input').count()) ? '#rush-answer-input' : '#answer-input';
    L(`${game}/${mode}:`, await attrs(sel));
    if (sel==='#answer-input') {
      await page.locator(sel).tap(); await page.keyboard.type('zzz'); await page.keyboard.press('Enter'); await page.waitForTimeout(800);
      L('   tras comprobar:', await attrs(sel), '| foco', await active(page));
    }
    await page.screenshot({path:`.qa/q5-${game}-${mode==='Práctica'?'p':'c'}.png`});
    await page.getByRole('button',{name:'Abandonar'}).tap(); await page.waitForTimeout(500);
    await page.getByRole('button',{name:'Sí, abandonar'}).tap(); await page.waitForTimeout(2000);
  }
}
L('ERRS', errs); await browser.close();
