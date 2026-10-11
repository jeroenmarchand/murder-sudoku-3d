// End-to-end test of the 3D app on a phone and a tablet: placing pawns, notes, hints, undo,
// accusing, solving and reloading. Run with: npm run test:e2e   (or: node tests/e2e.mjs <url-of-3d-app>)
// Screenshots of each step land in test-results/.
import fs from 'node:fs';
import { start, devices } from './browser.mjs';
fs.mkdirSync('test-results', { recursive: true });
const CI=!!process.env.CI;let fails=0;const ok=(c,m)=>{console.log((c?'  ok  ':'  FAIL ')+m);if(!c)fails++};
const srv=await start();const b=srv.browser;const URL=process.argv[2]||srv.url+'3d/';
{
 for(const [name,dev] of [['phone',devices['iPhone 13']],['tablet',devices['iPad (gen 7) landscape']]]){
  console.log('==',name);
  // CI renders WebGL in software, so it runs at 1x pixels with longer waits
  const ctx=await b.newContext({...dev,locale:"en-US",...(CI?{deviceScaleFactor:1}:{})});const p=await ctx.newPage();if(CI)p.setDefaultTimeout(60000);const errs=[];
  p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&!m.text().includes('404')&&errs.push(m.text()));
  await p.addInitScript(()=>{if(!sessionStorage.getItem('x')){localStorage.clear();sessionStorage.setItem('x',1)}});
  await p.goto(URL+'#medium-75');
  const ready=()=>p.waitForFunction(()=>window.__dbg&&__dbg.P&&document.querySelector('#loader.off')&&__dbg.busy===0,null,{timeout:60000});
  await ready();
  const D=(f,a)=>p.evaluate(f,a);const idle=async()=>{await p.waitForFunction(()=>__dbg.busy===0,null,{timeout:CI?60000:8000});await p.waitForTimeout(80)};
  // first run: dossier opens on phone
  await p.waitForTimeout(2500);
  if(name==='phone'){ok(await D(()=>document.querySelector('#dossier').classList.contains('open')),'first run opens dossier');await p.click('#closeDoss');await p.waitForTimeout(400)}
  const sol=await D(()=>({sol:__dbg.P.sol,people:__dbg.P.sus.map(s=>s.name).concat(__dbg.P.vic.name),killer:__dbg.P.killer,N:__dbg.P.M.N,obj:__dbg.P.M.obj}));
  const tapReal=async i=>{const c=await D(`__dbg.cellScreen(${i})`);if(dev.hasTouch)await p.touchscreen.tap(c.x,c.y);else await p.mouse.click(c.x,c.y);await idle()};
  const chipIdx=n=>sol.people.indexOf(n);
  // place A by real taps on its solution cell
  const A=sol.people[0];await p.locator('#palette .chip').nth(0).click();
  ok(await D(()=>__dbg.tool)===A,'chip selects person');
  await tapReal(sol.sol[A]);ok(await D(`__dbg.state[${JSON.stringify(A)}]`)===sol.sol[A],'real tap places pawn on '+sol.sol[A]);
  // place on a furniture cell (occupiable object) by real tap
  const furnP=sol.people.find(n=>sol.obj[sol.sol[n]]&&n!==A);
  if(furnP){await p.locator('#palette .chip').nth(chipIdx(furnP)).click();await tapReal(sol.sol[furnP]);ok(await D(`__dbg.state[${JSON.stringify(furnP)}]`)===sol.sol[furnP],'real tap on '+sol.obj[sol.sol[furnP]]+' places '+furnP)}
  // tapping a placed pawn with no tool selects it, tapping again removes it
  await D(()=>{__dbg.tool=null});await tapReal(sol.sol[A]);ok(await D(()=>__dbg.tool)===A,'tap pawn selects it');
  await tapReal(sol.sol[A]);ok(await D(`__dbg.state[${JSON.stringify(A)}]`)===undefined,'tap again removes it');
  await p.click('#undoBtn');await idle();ok(await D(`__dbg.state[${JSON.stringify(A)}]`)===sol.sol[A],'undo puts it back');
  // conflict
  const B=sol.people[1];const N=sol.N;const r0=Math.floor(sol.sol[A]/N)*N;const rowCell=await D(([r0,N,a])=>{const occ=geom(__dbg.P.M).occ;for(let c=0;c<N;c++){const i=r0+c;if(i!==a&&occ.includes(i))return i}return r0},[r0,N,sol.sol[A]]);
  await D(`__dbg.tool=${JSON.stringify(B)};__dbg.tapCell(${rowCell})`);await idle();
  const t=await D(()=>document.querySelector('#toast').textContent);const bad=await D(`__dbg.pawns[${JSON.stringify(A)}].userData.bad`);
  if(await D(`__dbg.state[${JSON.stringify(B)}]`)!==undefined){ok(bad&&/row|column/.test(t),'conflict toast + red pawn: '+t)}else ok(/stand there/.test(t),'blocked cell toast: '+t);
  await D('__dbg.tapCell') ;await p.click('#undoBtn');await idle();
  // notes mode
  await p.click('.seg.mode button[data-m=notes]');await idle();ok(await D(()=>__dbg.mode)==='notes','notes mode');
  const C=sol.people[2];await D(`__dbg.tool=${JSON.stringify(C)}`);
  const free=await D(()=>{const P=__dbg.P,G=geom(P.M);return G.occ.filter(i=>!Object.values(__dbg.state).includes(i)).slice(0,40)});
  for(const i of free.slice(0,6))await D(`__dbg.tapCell(${i})`);
  ok(Object.keys(await D(()=>__dbg.notes)).length>=5,'notes placed');
  await p.screenshot({path:`test-results/${name}-notes.png`});
  await p.click('.seg.mode button[data-m=pen]');await idle();
  // x mode
  await p.click('.seg.mode button[data-m=x]');await D(`__dbg.tapCell(${free[10]})`);await idle();
  ok(await D(`!!JSON.parse(localStorage.getItem('murdoku2:medium:75')).marks[${free[10]}]`),'x mark saved');
  await D(`__dbg.tapCell(${free[10]})`);await idle();ok(!(await D(`JSON.parse(localStorage.getItem('murdoku2:medium:75')).marks[${free[10]}]`)),'x toggles off');
  await p.click('.seg.mode button[data-m=pen]');
  // hint two-step
  await p.click('#hintBtn');await idle();const h1=await D(()=>document.querySelector('#toast').textContent);const ht=await D(()=>__dbg.tool);
  await p.screenshot({path:`test-results/${name}-hint.png`});
  await p.click('#hintBtn');await idle();ok(await D(`__dbg.state[${JSON.stringify(ht)}]`)!==undefined,'hint step 2 places '+ht+' ('+h1+')');
  // more menu: clear all + undo
  await p.click('#moreBtn');await p.waitForTimeout(250);await p.screenshot({path:`test-results/${name}-more.png`});
  await p.click('#clearBtn');await idle();ok(Object.keys(await D(()=>__dbg.state)).length===0,'clear all');
  await p.click('#undoBtn');await idle();ok(Object.keys(await D(()=>__dbg.state)).length>0,'undo clear');
  // place everybody correctly
  await D(s=>{for(const n of s.people){__dbg.tool=n;if(__dbg.state[n]!==s.sol[n])__dbg.tapCell(s.sol[n])}__dbg.tool=null},sol);await idle();
  ok(await D(()=>document.querySelector('#accuseBtn').classList.contains('ready')),'accuse pulses when board is right');
  await p.screenshot({path:`test-results/${name}-full.png`});
  // wrong accusation
  const wrong=sol.people.find(n=>n!==sol.killer&&n!==sol.people[sol.people.length-1]);
  await p.click('#accuseBtn');await p.waitForTimeout(300);await p.screenshot({path:`test-results/${name}-accuse.png`});
  await p.click(`#susList button[data-n="${wrong}"]`);ok(/alibi/.test(await D(()=>document.querySelector('#toast').textContent)),'wrong accusation');
  await p.click('#accuseBtn');ok(await D(n=>document.querySelector(`#susList button[data-n="${n}"]`).classList.contains('no'),wrong),'wrong suspect struck through');
  await p.click(`#susList button[data-n="${sol.killer}"]`);await p.waitForTimeout(1200);await p.screenshot({path:`test-results/${name}-reveal.png`});
  await p.waitForSelector('#win.on',{timeout:CI?60000:5000});await p.waitForTimeout(600);await p.screenshot({path:`test-results/${name}-win.png`});
  ok(await D(()=>__dbg.solved),'solved');
  // reload keeps solved
  await p.reload();await ready();ok(await D(()=>__dbg.solved&&Object.keys(__dbg.state).length===__dbg.P.sus.length+1),'reload restores solved board');
  // new case via menu: hard
  await p.click('#newBtn');await p.waitForTimeout(250);await p.screenshot({path:`test-results/${name}-newmenu.png`});
  await p.click('#newMenu .diff[data-d=hard]');await p.waitForFunction(()=>__dbg.P.M.N===9&&document.querySelector('#loader.off'),null,{timeout:60000});await p.waitForTimeout(2600);
  ok(true,'hard case '+await D(()=>location.hash));await p.screenshot({path:`test-results/${name}-hard.png`});
  await p.click('#camBtn');await idle();await p.screenshot({path:`test-results/${name}-hard-top.png`});
  if(name==='tablet'){ // keyboard
    const L=await D(()=>__dbg.P.sus[0].name);await p.keyboard.press('a');ok(await D(()=>__dbg.tool)===L,'key A selects');
    await p.keyboard.press('n');ok(await D(()=>__dbg.mode)==='notes','key N');await p.keyboard.press('x');ok(await D(()=>__dbg.mode)==='x','key X');
    await p.keyboard.press('Escape');ok(await D(()=>__dbg.tool)===null,'Esc clears');
    await p.keyboard.press('h');ok(await D(()=>__dbg.tool)!==null,'key H hints');
    // hover ghost
    await p.click('.seg.mode button[data-m=pen]');const c=await D(()=>{const s=__dbg.P,G=geom(s.M);return __dbg.cellScreen(G.occ.find(i=>!Object.values(__dbg.state).includes(i)))});
    await p.mouse.move(c.x,c.y);await p.waitForTimeout(200);await p.screenshot({path:`test-results/${name}-ghost.png`});
  }
  ok(errs.length===0,'no errors '+errs.join(' | '));
  await ctx.close()}
 await srv.stop();console.log(fails?fails+' FAILED':'ALL PASS');process.exit(fails?1:0)}
