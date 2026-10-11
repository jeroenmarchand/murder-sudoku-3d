// Plays the guided tutorial from start to finish with real taps and clicks: English on a phone (from the first-visit offer)
// and Dutch on a desktop (from the ?tutorial link, with a reload in the middle). Checks the coach's feedback on wrong moves,
// that nothing leaks into case saves, and that a returning player is not offered the tutorial again.
// Run with: npm run test:tutorial   (or: node tests/tutorial.mjs <site-root-url>). Screenshots land in test-results/tutorial/.
import fs from 'node:fs';
import { start, devices, watchErrors, ready3d } from './browser.mjs';
const OUT='test-results/tutorial';fs.mkdirSync(OUT,{recursive:true});
const CI=!!process.env.CI,TO=CI?60000:10000;let fails=0;const ok=(c,m)=>{console.log((c?'  ok  ':'  FAIL ')+m);if(!c)fails++};
const srv=await start();const ROOT=process.argv.slice(2).find(a=>!a.startsWith('--'))||srv.url;

async function run(name,dev,lang){
  console.log('==',name,lang);
  const ctx=await srv.browser.newContext({...dev,locale:lang==='nl'?'nl-NL':'en-US',...(CI?{deviceScaleFactor:1}:{})});
  const p=await ctx.newPage();p.setDefaultTimeout(TO);const errs=watchErrors(p);
  await p.addInitScript(()=>{if(!sessionStorage.getItem('x')){localStorage.clear();sessionStorage.setItem('x',1)}});
  const D=(f,a)=>p.evaluate(f,a),tut=()=>D(()=>__dbg.tut());
  const idle=async()=>{await p.waitForFunction(()=>__dbg.busy===0,null,{timeout:TO});await p.waitForTimeout(80)};
  const at=(id,ms=TO)=>p.waitForFunction(id=>{const t=__dbg.tut();return t&&t.id===id},id,{timeout:ms,polling:50}).then(()=>true,()=>false);
  const shot=async n=>{await p.waitForTimeout(500);await p.screenshot({path:`${OUT}/${name}-${n}.png`})};
  let F,sol,N,ppl;const facts=async()=>{({F,sol,N,ppl}=await D(()=>({F:__dbg.tut().F,sol:__dbg.P.sol,N:__dbg.P.M.N,ppl:__dbg.P.sus.map(s=>s.name).concat(__dbg.P.vic.name)})))};
  const tap=async i=>{await idle();const c=await D(i=>__dbg.cellScreen(i),i);if(dev.hasTouch)await p.touchscreen.tap(c.x,c.y);else await p.mouse.click(c.x,c.y);await idle()};
  // the coach must not sit on top of the square about to be tapped
  const clear=async i=>D(i=>{const c=__dbg.cellScreen(i),r=document.querySelector('#coach').getBoundingClientRect();return !(c.x>r.left&&c.x<r.right&&c.y>r.top&&c.y<r.bottom)},i);
  const st=async id=>{const r=await at(id);ok(r,'step '+id);if(!r){await p.screenshot({path:`${OUT}/${name}-stuck.png`});console.log(JSON.stringify(await tut()));throw new Error(name+': stuck before step '+id)}};
  const next=async id=>{await st(id);await p.click('#coachNext');await p.waitForFunction(id=>__dbg.tut().id!==id,id,{timeout:TO,polling:50})};
  // the coach scrolls lists to its target: wait until the element stops moving before tapping it
  const settle=async sel=>{let last='';for(let k=0;k<40;k++){const r=await D(s=>JSON.stringify(document.querySelector(s)?.getBoundingClientRect()),sel);if(r===last)return;last=r;await p.waitForTimeout(150)}};
  const chip=n=>p.click(`#palette .chip:nth-child(${ppl.indexOf(n)+1})`);
  const fb=async()=>(await p.waitForFunction(()=>__dbg.tut().fb,null,{timeout:TO,polling:50}).then(h=>h.jsonValue(),()=>''));

  if(lang==='en'){
    await p.goto(ROOT+'3d/');await ready3d(p);
    ok(await p.waitForSelector('#tutOffer.on',{timeout:TO}).then(()=>true,()=>false),'first visit offers the tutorial');await shot('00-offer');
    await p.click('#tutGo');
  }else{await p.goto(ROOT+'nl/3d/?tutorial');await ready3d(p)}
  ok(await at('intro'),'tutorial opens on its first step');await facts();
  ok(await D(()=>document.body.classList.contains('tut')&&getComputedStyle(document.querySelector('#timer')).display==='none'),'timer hidden');
  const t0=await tut();ok(/1/.test(await D(()=>document.querySelector('#coachStep').textContent))&&t0.n>=30,`step indicator (${t0.n} steps)`);
  await shot('01-intro');
  await next('intro');await next('goal');
  await st('board');ok(await D(()=>__dbg.rings().on),'board rings on');await shot('02-board');await next('board');

  await st('rotate');
  // a tap on the board during an explanation is answered, not ignored
  if(dev.hasTouch){await p.click('#coachSkip')}
  else{const r=await D(()=>{const b=document.querySelector('canvas').getBoundingClientRect();return {x:b.left+b.width/2,y:b.top+b.height/2}});
    await p.mouse.move(r.x,r.y);await p.mouse.down();for(let k=1;k<=12;k++)await p.mouse.move(r.x+k*22,r.y+k*4);await p.mouse.up()}
  await st('top');await p.click('#camBtn');
  await next('rule');
  await st('file');
  if((await tut()).next)await p.click('#coachNext');else await p.click('#dossBtn');
  await st('card');ok(await p.waitForFunction(()=>{const s=document.querySelector('#tutSpot'),c=document.querySelector('#coach').getBoundingClientRect(),r=s.getBoundingClientRect();return !s.hidden&&r.top>=c.bottom-2&&r.bottom<=innerHeight},null,{timeout:TO,polling:100}).then(()=>true,()=>false),'card scrolled into view and spotlighted, clear of the coach');await shot('03-card');await next('card');await next('kinds');
  await st('objects');await settle(`#olist .oi[data-t="${F.op}"]`);await p.click(`#olist .oi[data-t="${F.op}"]`);
  await st('rings');await idle();await shot('04-rings');await next('rings');

  await st('pickE');await chip(F.E);
  await st('placeE');
  const wrongE=sol[F.A];ok(await clear(wrongE),'coach clear of the board');await tap(wrongE);
  const fE=await fb();ok(fE.length>5&&(await tut()).id==='placeE','wrong square gets feedback: '+fE);await shot('05-wrong');
  await tap(sol[F.E]);
  await st('move');
  // any free square will do, so take one the coach does not cover, like a player would
  const frees=await D(([e,N])=>geom(__dbg.P.M).occ.filter(i=>i!==e&&i%N!==e%N&&(i/N|0)!==(e/N|0)),[sol[F.E],N]);let free=frees[0];
  for(const i of frees)if(await clear(i)){free=i;break}await tap(free);
  await st('undo');await p.click('#undoBtn');
  await st('pickD');ok(await D(e=>__dbg.state[e],F.E)===sol[F.E],'undo put E back');await chip(F.D);
  await st('noteMode');await p.click('.seg.mode button[data-m="notes"]');
  await st('notes');for(const i of F.dC)await tap(i);await shot('06-notes');
  await st('crossMode');await p.click('.seg.mode button[data-m="x"]');
  await st('cross');await tap(F.dX);
  await st('placeD');
  // wrong mode: the coach says how to fix it instead of blocking
  ok(/./.test((await tut()).act)&&(await tut()).sel.includes('pen'),'asks for pen mode');
  await p.click('.seg.mode button[data-m="pen"]');await idle();if(await D(()=>__dbg.tool)!==F.D)await chip(F.D);await tap(sol[F.D]);
  await st('placeC');await chip(F.C);
  const wrongC=F.cC.find(i=>i!==sol[F.C]&&(i/N|0)===(sol[F.D]/N|0));await tap(wrongC);
  const fC=await fb();ok(fC.length>5&&(await D(c=>__dbg.state[c],F.C))===undefined,'C in D\'s row is refused: '+fC);await tap(sol[F.C]);
  await st('placeB');await chip(F.B);
  const wrongB=F.bC.find(i=>i!==sol[F.B]);await tap(wrongB);await tap(wrongB);
  ok((await tut()).miss>=2&&await D(()=>__dbg.rings().n>0),'two misses ring the candidates');await shot('07-placeB-help');await tap(sol[F.B]);
  await st('hint1');await p.click('#hintBtn');
  await st('hint2');await shot('08-hint');
  if(await D(()=>__dbg.tool)!==F.A)await chip(F.A);await tap(sol[F.A]);
  await st('placeV');await chip(F.V);await tap(sol[F.V]);
  await st('killer');await shot('09-killer');await next('killer');
  await st('accuse');await p.click('#accuseBtn');
  await st('pick');await shot('10-accuse');
  const killer=await D(()=>__dbg.P.killer),wrongK=Object.keys(sol).find(n=>n!==killer&&n!==F.V);
  await p.click(`#susList button[data-n="${wrongK}"]`);await p.waitForTimeout(400);
  ok(!(await D(()=>__dbg.solved))&&await D(()=>document.querySelector('#accuse').classList.contains('on'))&&(await fb()).length>5,'wrong accusation explained, dialog stays');
  await p.click(`#susList button[data-n="${killer}"]`);
  await st('win');await p.waitForSelector('#win.on');await shot('11-win');await p.click('#winNext');
  await st('newcase');await p.click('#newBtn');
  await st('levels');await shot('12-levels');await next('levels');
  await st('more');await p.click('#moreBtn');
  await st('menu');await shot('13-menu');
  if(lang==='nl'){await p.reload();await ready3d(p);ok(await at('menu'),'reload resumes on the same step')}
  else{ok(await D(()=>document.querySelector('#coachNext').textContent.trim().length>0),'finish button labelled')}
  if(lang==='nl'){await p.click('#moreBtn');await p.waitForTimeout(300)}
  await p.click('#coachNext');
  await p.waitForFunction(()=>!__dbg.tut()&&!document.body.classList.contains('tut'),null,{timeout:TO});await ready3d(p);
  const ls=await D(()=>({...localStorage}));
  ok(!ls['murdoku2:tutorial']&&!Object.keys(ls).some(k=>/solved|stats/.test(k)&&ls[k].includes('541')),'tutorial save cleared and no stats written');
  ok(await D(()=>!/tutorial/.test(location.search)),'URL back to normal');
  await p.reload();await ready3d(p);await p.waitForTimeout(1800);
  ok(!(await D(()=>document.querySelector('#tutOffer').classList.contains('on'))),'returning player is not offered the tutorial');
  ok(await D(()=>document.querySelector('#coach').hidden),'coach hidden after finishing');
  // the menu item starts it again; Exit leaves it
  await p.click('#moreBtn');await p.click('#tutBtn');ok(await at('intro'),'menu item restarts the tutorial');
  await p.click('#coachExit');await p.waitForFunction(()=>!__dbg.tut(),null,{timeout:TO});ok(true,'exit leaves the tutorial');
  ok(!errs.length,'no page errors'+(errs.length?': '+errs.join(' | '):''));
  await ctx.close();
}

await run('phone',devices['iPhone 13'],'en');
await run('desktop',{viewport:{width:1280,height:800}},'nl');
if(process.argv.includes('--ipad')||process.env.TUT_IPAD)await run('ipad',devices['iPad (gen 7)'],'en');
await srv.stop();
console.log(fails?`${fails} failed`:'all passed');process.exit(fails?1:0);
