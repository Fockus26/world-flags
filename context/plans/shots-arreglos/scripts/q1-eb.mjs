// ErrorBoundary: "Recargar la página" y aspecto en claro/oscuro (forzado con profile.name = 123)
import {open,active,B,CONTRAST_FN} from './lib.mjs';
const L=(...a)=>console.log(...a);
const bad = JSON.stringify({profile:{name:123,avatarStyle:'adventurer-neutral',avatarSeed:'explorer-1'}});
for (const scheme of ['light','dark']) {
  const {browser,page,errs}=await open({colorScheme:scheme, width:390, height:844});
  await page.goto(B,{timeout:180000});
  await page.evaluate((v)=>{ localStorage.setItem('world-flags-learning-data', v); localStorage.setItem('world-flags-tutorial-seen','true'); }, bad);
  await page.reload({timeout:180000});
  await page.waitForSelector('#error-boundary-title',{timeout:120000});
  await page.waitForTimeout(1000);
  const info = await page.evaluate((fn)=>{
    const {toRgb,ratio}=eval(fn);
    const sec=document.querySelector('section[aria-labelledby=error-boundary-title]');
    const bg=toRgb(getComputedStyle(sec).backgroundColor);
    const pageBg=toRgb(getComputedStyle(document.body).backgroundColor);
    const h1=document.getElementById('error-boundary-title'); const p=sec.querySelector('p');
    const btns=[...sec.querySelectorAll('button')].map(b=>{const cs=getComputedStyle(b); return b.textContent.trim()+' '+ratio(toRgb(cs.color),toRgb(cs.backgroundColor)).toFixed(2)+' (borde vs tarjeta '+ratio(toRgb(cs.backgroundColor),bg).toFixed(2)+')';});
    return {theme: document.documentElement.dataset.theme ?? document.documentElement.className, h1: ratio(toRgb(getComputedStyle(h1).color),bg).toFixed(2), p: ratio(toRgb(getComputedStyle(p).color),bg).toFixed(2), card_vs_page: ratio(bg,pageBg).toFixed(2), btns, hscroll: document.documentElement.scrollWidth > innerWidth};
  }, CONTRAST_FN);
  L(scheme, JSON.stringify(info));
  await page.screenshot({path:`q1-eb-${scheme}.png`});
  // Tab hasta "Recargar la página" y ver anillo
  for (let i=0;i<4;i++){ await page.keyboard.press('Tab'); const a=await active(page); if (/Recargar/.test(a)) break; }
  const ring = await page.evaluate(()=>{const a=document.activeElement; const cs=getComputedStyle(a); return a.textContent.trim()+' outline '+cs.outlineStyle+' '+cs.outlineWidth+' '+cs.outlineColor;});
  L(' focus:', ring);
  await page.screenshot({path:`q1-eb-${scheme}-focus.png`});
  // Recargar: la página navega de nuevo (con los datos aún dañados vuelve el EB)
  const nav = page.waitForEvent('framenavigated',{timeout:20000}).then(()=>true).catch(()=>false);
  await page.keyboard.press('Enter');
  L(' reload navigated:', await nav);
  await page.waitForSelector('#error-boundary-title',{timeout:120000}).then(()=>L(' tras recargar: EB otra vez (datos aún dañados, esperado en main)')).catch(()=>L(' tras recargar: sin EB'));
  // Con clic de ratón también
  const nav2 = page.waitForEvent('framenavigated',{timeout:20000}).then(()=>true).catch(()=>false);
  await page.getByRole('button',{name:'Recargar la página'}).click();
  L(' click navigated:', await nav2);
  L(' ERRS', errs.filter(e=>!/name is not iterable|La app falló|The above error/.test(e)).slice(0,3));
  await browser.close();
}
