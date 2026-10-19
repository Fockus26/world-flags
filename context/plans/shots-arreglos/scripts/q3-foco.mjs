// A1 Todos/Ninguno y A2 foco al abandonar
import {open,boot,active,setGame,setRegions,setMode} from './lib.mjs';
const L=(...a)=>console.log(...a);
const MODE = process.argv[2] ?? 'all';
if (MODE==='all' || MODE==='bulk') {
  const {browser,page,errs}=await open(); await boot(page);
  await page.getByRole('button',{name:'Elegir países específicos'}).click();
  await page.waitForSelector('[data-region-bulk=europe]',{timeout:20000}); await page.waitForTimeout(800);
  const bulk = async (how) => {
    const el = page.locator('[data-region-bulk=europe]').first();
    const label = (await el.getAttribute('aria-label')).split(':')[0];
    if (how==='click') await el.click(); else { await el.focus(); await page.keyboard.press(how); }
    await page.waitForTimeout(50); const a = await active(page);
    await page.waitForTimeout(250); const b = await active(page);
    await page.waitForTimeout(1200); const c = await active(page);
    L(`[${how}] ${label} → +50 ${a} | +300 ${b} | +1500 ${c} | diálogos: ${await page.locator('[role=dialog]').count()}`);
  };
  await bulk('Enter'); await bulk('Enter'); await bulk(' '); await bulk(' '); await bulk('click'); await bulk('click');
  // a medias: Europa entera marcada y un país desmarcado
  await page.locator('[data-region-bulk=europe]').first().click(); await page.waitForTimeout(500);
  let fr = page.getByRole('checkbox',{name:/^Francia/});
  if (!(await fr.first().isVisible().catch(()=>false))) {
    const exp = page.locator('[role=dialog] button[aria-expanded]').filter({hasText:'Europa'}).first();
    await exp.click().catch(()=>{}); await page.waitForTimeout(800);
  }
  if (await fr.count()) {
    await fr.first().click({force:true}); await page.waitForTimeout(500);
    L('a medias, botones:', await page.locator('[data-region-bulk=europe]').evaluateAll(es=>es.map(e=>e.getAttribute('aria-label').split(':')[0])));
    await page.locator('[data-region-bulk=europe][aria-label^=Todos]').focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(1500);
    L('a medias → Todos →', await active(page));
    await fr.first().click({force:true}); await page.waitForTimeout(500);
    await page.locator('[data-region-bulk=europe][aria-label^=Ninguno]').focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(1500);
    L('a medias → Ninguno →', await active(page));
  } else L('a medias: no encontré la casilla de Francia');
  L('ERRS', errs.slice(0,3)); await browser.close();
}
if (MODE==='all' || MODE==='abandon') {
  const {browser,page,errs}=await open(); await boot(page);
  for (const mode of ['Práctica','Competitivo']) {
    await setMode(page, mode);
    for (const game of ['countries','capitals','flags']) {
      await setGame(page, game); await setRegions(page, ['north-america']);
      await page.getByRole('button',{name:'Comenzar práctica'}).click();
      await page.waitForSelector('#answer-input, #rush-answer-input',{timeout:30000}); await page.waitForTimeout(1500);
      await page.getByRole('button',{name:'Abandonar'}).click(); await page.waitForTimeout(600);
      const modal = await active(page);
      await page.getByRole('button',{name:'Sí, abandonar'}).click();
      await page.waitForTimeout(2500);
      L(` ${game}/${mode} modal: ${modal} → tras abandonar: ${await active(page)}`);
    }
  }
  // práctica diaria: inyecta 2 banderas vencidas
  await page.evaluate(()=>{ const k='world-flags-learning-data'; const d=JSON.parse(localStorage.getItem(k)); const rv={dueDate:'2026-01-01',intervalDays:1,easeFactor:2.5,repetitions:1,lastReviewedAt:'2025-12-31T10:00:00.000Z'}; d.countryHistory={...(d.countryHistory||{}), ca:{review:rv}, mx:{review:rv}}; localStorage.setItem(k, JSON.stringify(d)); });
  await page.reload(); await page.waitForFunction(()=>{const h=document.getElementById('configuration-title'); return h && !h.closest('[inert]');},null,{timeout:120000}); await page.waitForTimeout(1000);
  await setGame(page,'flags');
  const daily = page.getByRole('button',{name:/^Práctica diaria/});
  if (await daily.count()) {
    await daily.click(); await page.waitForTimeout(2500);
    await page.getByRole('button',{name:'Abandonar'}).click(); await page.waitForTimeout(600);
    await page.getByRole('button',{name:'Sí, abandonar'}).click(); await page.waitForTimeout(2500);
    L(' práctica diaria tras abandonar:', await active(page));
  } else L(' práctica diaria: no apareció el botón');
  // Resultados → Volver al inicio (regresión del foco centralizado)
  await setMode(page,'Práctica'); await setGame(page,'flags'); await setRegions(page,['north-america']);
  await page.getByRole('button',{name:'Comenzar práctica'}).click(); await page.waitForSelector('#answer-input',{timeout:30000});
  for (let i=0;i<30 && !(await page.locator('#results-title').count());i++){
    const g=page.getByRole('button',{name:/Bien$/}); if (await g.count()) { await g.first().click(); await page.waitForTimeout(700); continue; }
    if (await page.locator('#answer-input:not([readonly])').count()) { await page.getByRole('button',{name:'Saltar'}).click(); await page.waitForTimeout(700); continue; }
    await page.waitForTimeout(500);
  }
  await page.waitForTimeout(1500); L(' resultados foco:', await active(page));
  await page.getByRole('button',{name:'Volver al inicio'}).click(); await page.waitForTimeout(2500);
  L(' volver al inicio foco:', await active(page));
  L('ERRS', errs.slice(0,3)); await browser.close();
}
