// C: rush de Países (mapa) completo con sesión iniciada, y la entrada en el ranking
import {open,boot,login,active,setGame,setRegions,setMode} from './lib.mjs';
const L=(...a)=>console.log(...a);
const region = process.argv[2] ?? 'north-america';
const regionLabel = process.argv[3] ?? 'Norteamérica';
const {readFileSync} = await import('node:fs');
const src = readFileSync('src/data/countries.ts','utf8');
const names = [...src.matchAll(/name:\s*"([^"]+)",\s*region:\s*"([\w-]+)"/g)].filter(m=>m[2]===region).map(m=>m[1]);
L('países a escribir:', names.join(', '));

const C = await open(); const p = C.page;
await boot(p); await login(p);
const ng=p.getByRole('button',{name:'No, gracias'}); if (await ng.count()) await ng.click();
await setMode(p,'Competitivo'); await setGame(p,'countries'); await setRegions(p,[region]);
await p.getByRole('button',{name:'Comenzar práctica'}).click();
await p.waitForSelector('#rush-answer-input',{timeout:30000}); await p.waitForTimeout(1500);
L('foco al empezar:', await active(p));
const t0 = Date.now();
for (const n of names) {
  await p.locator('#rush-answer-input').fill('');
  await p.locator('#rush-answer-input').pressSequentially(n, {delay: 15});
  await p.waitForTimeout(250);
  const v = await p.locator('#rush-answer-input').inputValue().catch(()=> 'NO INPUT');
  if (v) { await p.keyboard.press('Enter'); await p.waitForTimeout(250); }
}
L('tiempo escribiendo ~', ((Date.now()-t0)/1000).toFixed(1),'s');
await p.waitForSelector('#results-title',{timeout:30000}).catch(()=>L('NO llegaron los resultados'));
await p.waitForTimeout(2500);
L('resultados:', await p.locator('#results-title').innerText().catch(()=>'-'), '| foco:', await active(p));
L('texto resultados:', (await p.locator('#results-title').locator('xpath=ancestor::section[1]').innerText().catch(()=>'')).split('\n').filter(Boolean).slice(0,8).join(' | '));
await p.screenshot({path:'.qa/q6-rush-resultados.png'});
await p.getByRole('button',{name:'Volver al inicio'}).click(); await p.waitForTimeout(2500);
L('volver al inicio foco:', await active(p));

async function ranking(page, who) {
  await page.getByRole('button',{name:'Ver ranking'}).click(); await page.waitForTimeout(2500);
  const dlg = page.locator('section[aria-labelledby=leaderboard-title]');
  await dlg.getByText('Países',{exact:true}).filter({visible:true}).first().click(); await page.waitForTimeout(800);
  if (!(await page.getByRole('option',{name:regionLabel}).count())) { await dlg.getByRole('button',{name:/Continente|Todo el mundo/}).first().click(); await page.waitForTimeout(800); }
  await page.getByRole('option',{name:regionLabel}).click(); await page.waitForTimeout(4000);
  L(who,'ranking Países', regionLabel+':', (await dlg.innerText()).split('\n').filter(Boolean).slice(-6).join(' | '));
  await page.screenshot({path:`.qa/q6-ranking-${who}.png`});
}
await ranking(p,'usuario');
L('ERRS usuario', C.errs.slice(0,4));
await C.browser.close();

const G = await open(); await boot(G.page);
const ng2=G.page.getByRole('button',{name:'No, gracias'}); if (await ng2.count()) await ng2.click();
await ranking(G.page,'invitado');
L('ERRS invitado', G.errs.slice(0,4));
await G.browser.close();
