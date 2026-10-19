// Tras el arreglo: el mismo profile.name = 123 ya no tumba la app
import {open,B} from './lib.mjs';
const {browser,page,errs}=await open();
await page.goto(B,{timeout:180000});
await page.evaluate(()=>{ localStorage.setItem('world-flags-learning-data', JSON.stringify({profile:{name:123,avatarStyle:{},avatarSeed:null}})); localStorage.setItem('world-flags-tutorial-seen','true'); });
await page.reload({timeout:180000});
await page.waitForTimeout(12000);
console.log(JSON.stringify(await page.evaluate(()=>({eb: !!document.getElementById('error-boundary-title'), h1: document.getElementById('configuration-title')?.textContent, summary: document.querySelector('[aria-label*="Abrir perfil"]')?.getAttribute('aria-label'), stored: JSON.parse(localStorage.getItem('world-flags-learning-data')||'{}').profile}))));
console.log('ERRS', errs.slice(0,3));
await browser.close();
