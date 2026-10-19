// Extra: rendirse en el rush de Países (doble clic + foco) y axe en las pantallas tocadas
import AxeBuilder from '@axe-core/playwright';
import {open,boot,active,setGame,setRegions,setMode} from './lib.mjs';
const L=(...a)=>console.log(...a);
const axe = async (page, what) => {
  const {violations} = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
  L(`axe ${what}:`, violations.length ? violations.map(v=>`${v.impact} ${v.id} → ${v.nodes.map(n=>n.target.join(' ')+(v.id==='color-contrast'?' ['+(n.any?.[0]?.message??'').slice(0,140)+'] html='+n.html.slice(0,120):'')).slice(0,3).join(', ')}`).join(' || ') : '0');
};
for (const scheme of ['light','dark']) {
  const {browser,page,errs}=await open({colorScheme:scheme, reducedMotion:'reduce'}); await boot(page);
  L('== tema', scheme);
  await axe(page,'inicio');
  await page.getByRole('button',{name:'Elegir países específicos'}).click(); await page.waitForTimeout(1200);
  await page.locator('[data-region-bulk=europe]').first().click(); await page.waitForTimeout(600);
  await axe(page,'selector de países (Europa marcada)');
  await page.getByRole('button',{name:'Cerrar'}).first().click(); await page.waitForTimeout(800);
  await setMode(page,'Competitivo'); await setGame(page,'countries'); await setRegions(page,['north-america']);
  await page.getByRole('button',{name:'Comenzar práctica'}).click(); await page.waitForSelector('#rush-answer-input',{timeout:30000}); await page.waitForTimeout(1200);
  await axe(page,'rush de Países');
  await page.locator('#rush-answer-input').pressSequentially('Canadá',{delay:15}); await page.waitForTimeout(400);
  await page.getByRole('button',{name:'Rendirme'}).click(); await page.waitForTimeout(700);
  L(' modal rendirse foco:', await active(page));
  await axe(page,'modal rendirse');
  await page.getByRole('button',{name:'Sí, rendirme'}).dblclick(); await page.waitForTimeout(2000);
  L(' tras dblclick Sí, rendirme → foco:', await active(page), '| resultados:', await page.locator('#results-title').count());
  await page.getByRole('button',{name:'Ver resultados'}).click(); await page.waitForSelector('#results-title',{timeout:15000}); await page.waitForTimeout(2000);
  L(' resultados:', await page.locator('#results-title').innerText(), '| foco:', await active(page));
  await axe(page,'resultados (rendido)');
  await page.getByRole('button',{name:'Volver al inicio'}).click(); await page.waitForTimeout(2500);
  L(' volver foco:', await active(page));
  for (const n of ['No, gracias','Cerrar aviso','Cerrar']) { const b=page.locator('[role=status] button').filter({hasText:n}); if (await b.count()) { L(' aviso:', (await page.locator('div[role=status]').innerText()).slice(0,90).split('\n').join(' | ')); await b.first().click(); await page.waitForTimeout(500); break; } }
  await setMode(page,'Práctica'); await setGame(page,'capitals');
  await page.getByRole('button',{name:'Comenzar práctica'}).click(); await page.waitForSelector('#answer-input',{timeout:30000}); await page.waitForTimeout(1200);
  await axe(page,'práctica Capitales');
  await page.getByRole('button',{name:'Abandonar'}).click(); await page.waitForTimeout(700);
  await axe(page,'modal abandonar');
  await page.getByRole('button',{name:'Sí, abandonar'}).click(); await page.waitForTimeout(2000);
  L('ERRS', errs.slice(0,3));
  await browser.close();
}
