// A3 doble clic en los modales de lotes (y que un clic suelto sigue igual)
import {open,boot,active,setGame,setRegions,setMode,panelText} from './lib.mjs';
const L=(...a)=>console.log(...a);
const rm = process.argv[2] ?? 'reduce';
const {browser,page,errs}=await open({reducedMotion: rm}); await boot(page);
L('reducedMotion:', rm);
await setMode(page,'Práctica'); await setGame(page,'flags'); await setRegions(page,['south-america']);
const checked = ()=>page.evaluate(()=>[...document.querySelectorAll('input[type=checkbox]')].filter(c=>c.checked).map(c=>c.value).join(',') || '(vacío)');
// B) doble clic en "Empezar"
await page.getByRole('button',{name:'Aprender por lotes'}).click(); await page.waitForTimeout(800);
await page.getByRole('button',{name:'Empezar'}).dblclick(); await page.waitForTimeout(2500);
L('B dblclick Empezar → partida abierta:', await page.locator('#answer-input').count(), '| panel:', await panelText(page), '| foco:', await active(page));
// A) doble clic en "Sí, abandonar"
L('A antes:', await checked());
await page.getByRole('button',{name:'Abandonar'}).first().click(); await page.waitForTimeout(800);
await page.getByRole('button',{name:'Sí, abandonar'}).dblclick(); await page.waitForTimeout(2500);
L('A después:', await checked(), '| panel:', await panelText(page), '| foco:', await active(page));
// clic suelto justo después de cerrar (no es doble clic): debe funcionar
await page.getByRole('button',{name:'Aprender por lotes'}).click(); await page.waitForTimeout(800);
await page.getByRole('button',{name:'Cancelar'}).click(); await page.waitForTimeout(150);
await page.locator('input[type=checkbox][value=caribbean]').click({force:true}); await page.waitForTimeout(400);
L('clic suelto 150 ms tras cerrar → marca Caribe:', await checked());
// pasado el margen, un doble clic normal sigue siendo dos clics
await page.waitForTimeout(1200);
await page.locator('input[type=checkbox][value=caribbean]').dblclick({force:true}); await page.waitForTimeout(400);
L('dblclick en casilla sin modal (2 toggles, como siempre):', await checked());
// doble clic en "Sí, abandonar" de una partida: nada debajo se activa
await page.getByRole('button',{name:'Comenzar práctica'}).click(); await page.waitForSelector('#answer-input',{timeout:30000}); await page.waitForTimeout(1200);
const before = await checked();
await page.getByRole('button',{name:'Abandonar'}).click(); await page.waitForTimeout(600);
await page.getByRole('button',{name:'Sí, abandonar'}).dblclick(); await page.waitForTimeout(2500);
L('partida: dblclick Sí, abandonar → casillas', before, '→', await checked(), '| partida abierta:', await page.locator('#answer-input').count(), '| foco:', await active(page));
L('ERRS', errs.slice(0,3)); await browser.close();
