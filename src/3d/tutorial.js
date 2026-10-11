// ---------- guided tutorial ----------
// One fixed easy castle case, played step by step with a coach panel. Every fact the coach states (who stands where, which squares fit)
// is read from the generated puzzle at runtime, so the text always matches the board. Progress lives under its own save key and never
// touches case saves, stats or murdoku2:last. Inlined into the engine module at /*@TUTORIAL*/, so it shares the engine's scope.
// A step: say() text, act() the action line, next (explanation step: wait for Next), target (selector to spotlight), rings() cell boxes
// [x0,y0,x1,y1] to ring on the board, mode/who/has (what must hold first: input mode, selected letter, letters already on their square),
// tap(i) true or the reason a board tap is not right, done() when an action step is complete, enter() on arrival, doss (phone sheet open or shut).
const TK='murdoku2:tutorial',TUT_SEED=541;let TUT=null;
// The case itself is stored, not generated: the generator shuffles with a random sort comparator, so the same seed can build a different
// board in another browser engine. Every step below relies on this exact board (generated once from easy seed 541).
const TUT_CASE='{"seed":541,"diff":"easy","M":{"N":6,"K":4,"reg":[1,1,1,2,2,2,1,1,1,2,2,2,3,1,3,2,0,0,3,3,3,2,0,0,3,3,3,2,0,0,3,3,0,0,0,0],"obj":[null,null,null,null,"kist","stoel","stoel",null,"ton",null,"ton",null,"bank",null,"struik","stoel",null,"tafel",null,"bank","bank",null,null,null,null,null,null,null,"harnas","troon",null,null,null,"harnas",null,null],"objId":[-1,-1,-1,-1,7,8,5,-1,4,-1,6,-1,12,-1,11,9,-1,3,-1,13,10,-1,-1,-1,-1,-1,-1,-1,1,2,-1,-1,-1,0,-1,-1],"objs":[{"t":"harnas","cells":[33]},{"t":"harnas","cells":[28]},{"t":"troon","cells":[29]},{"t":"tafel","cells":[17]},{"t":"ton","cells":[8]},{"t":"stoel","cells":[6]},{"t":"ton","cells":[10]},{"t":"kist","cells":[4]},{"t":"stoel","cells":[5]},{"t":"stoel","cells":[15]},{"t":"bank","cells":[20]},{"t":"struik","cells":[14]},{"t":"bank","cells":[12]},{"t":"bank","cells":[19]}],"rooms":[{"name":"Troonzaal","color":"#f1c9c4"},{"name":"Keuken","color":"#f6e6a8"},{"name":"Kelder","color":"#cfc6b8"},{"name":"Tuin","color":"#bfe0c0"}]},"sus":[{"name":"Adelheid","g":"f","face":"🧝‍♀️"},{"name":"Boudewijn","g":"m","face":"👴"},{"name":"Coenraad","g":"m","face":"🧔"},{"name":"Dirkje","g":"f","face":"👩‍🦰"},{"name":"Everard","g":"m","face":"👨‍🍳"}],"vic":{"name":"Vrouwe Walburga","g":"f","face":"👸","victim":true},"sol":{"Adelheid":20,"Boudewijn":31,"Coenraad":6,"Dirkje":3,"Everard":29,"Vrouwe Walburga":16},"clues":{"Adelheid":["op:bank"],"Boudewijn":["hoek","in:3"],"Coenraad":["in:1","rand"],"Dirkje":["naast:kist"],"Everard":["naast:harnas","op:troon"]},"killer":"Everard"}';
const tutIdx=id=>TS.findIndex(s=>s.id===id);
const tutWide=()=>innerWidth>=900;
const tutG=n=>person(n).g;
const tutChip=n=>`#palette .chip:nth-child(${people().indexOf(n)+1})`,tutCard=n=>`#cards .card:nth-child(${people().indexOf(n)+1})`,tutMode=m=>`.seg.mode button[data-m="${m}"]`;
const cbox=i=>{const N=P.M.N;return [i%N,i/N|0,i%N,i/N|0]},rowBox=i=>{const N=P.M.N;return [0,i/N|0,N-1,i/N|0]},colBox=i=>{const N=P.M.N;return [i%N,0,i%N,N-1]};
const obox=t=>{const N=P.M.N,c=P.M.objs.find(o=>o.t===t).cells,xs=c.map(i=>i%N),ys=c.map(i=>i/N|0);return [Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)]};
const roomOf=i=>L.room(P.M.rooms[P.M.reg[i]]);
let TGA=null;const tutAtoms=()=>{if(!TGA||TGA.P!==P){const G=geom(P.M);TGA={P,G,A:atomsFor(P.M,G)}}return TGA};
// squares that fit a person's clue; with free, also squares whose row and column nobody else holds
function tutCands(n,free){const {G,A}=tutAtoms(),cl=n===P.vic.name?[]:P.clues[n];
  return G.occ.filter(i=>cl.every(a=>A[a](i))&&(!free||!conflicts(i,n).length))}
function tutFacts(){const F={};for(const k of 'ABCDEV')F[k]=byLetter(k);const cl=(n,k)=>(P.clues[n].find(a=>a.startsWith(k+':'))||'').split(':')[1];
  F.op=cl(F.E,'op');F.nx=cl(F.D,'naast');F.room=+cl(F.C,'in');F.dC=tutCands(F.D);F.dX=F.dC.find(i=>i%P.M.N===P.sol[F.E]%P.M.N);F.cC=tutCands(F.C);F.bC=tutCands(F.B);return F}
// why a tap does not fit: the first rule it breaks, in the player's words
function why(n,i){const T=L.tut.w,M=P.M,N=M.N,{G,A}=tutAtoms(),at=Object.keys(state).find(m=>state[m]===i);
  if(!G.occ.includes(i))return T.blocked(oname(M.obj[i]));if(at)return T.here(at);
  for(const a of n===P.vic.name?[]:P.clues[n]){const [k,v]=a.split(':');
    if(k==='alleen'){if(Object.keys(state).some(m=>m!==n&&M.reg[state[m]]===M.reg[i]))return T.alleen;continue}
    if(A[a](i))continue;if(k==='op'||k==='naast')return T[k](oname(v));if(k==='in')return T.in(roomOf(i),L.room(M.rooms[+v]));return T[k]}
  const cf=conflicts(i,n);if(cf.length)return T.line(cf[0],(state[cf[0]]/N|0)===(i/N|0));return T.other}
const tutFix=n=>mode!=='pen'?{a:L.tut.needMode.pen,t:tutMode('pen')}:{a:L.tut.fix(n,tutG(n)),t:tutChip(n),r:[cbox(P.sol[n])],fix:n};
const onSol=n=>state[n]===P.sol[n];
const TS=(()=>{const T=()=>L.tut,F=()=>TUT.F,sol=k=>P.sol[F()[k]],place=k=>i=>i===sol(k)||why(F()[k],i),is=sel=>$(sel).classList.contains('on');
  return [
  {id:'intro',next:1,say:()=>T().intro},
  {id:'goal',next:1,say:()=>T().goal},
  {id:'board',next:1,say:()=>T().board(P.M.N,P.M.K),rings:()=>[[0,0,P.M.N-1,P.M.N-1]]},
  {id:'rotate',skip:1,say:()=>T().rotate,act:()=>T().rotateA(TOUCH),enter:()=>{TUT.rotated=false},done:()=>TUT.rotated},
  {id:'top',say:()=>T().top,act:()=>T().topA,target:'#camBtn',done:()=>topView},
  {id:'rule',next:1,say:()=>T().rule,rings:()=>[rowBox(sol('E')),colBox(sol('E'))]},
  {id:'file',next:tutWide,say:()=>T().file(tutWide()),act:()=>T().fileA,target:()=>tutWide()?'#cards':'#dossBtn',done:()=>$('#dossier').classList.contains('open')},
  {id:'card',next:1,doss:1,say:()=>T().card(F().E,clueText(F().E)),target:()=>tutCard(F().E),enter:()=>tutScroll(tutCard(F().E))},
  {id:'kinds',next:1,doss:1,say:()=>T().kinds},
  {id:'objects',doss:1,say:()=>T().objects(oname(F().op)),act:()=>T().objectsA(cap(oname(F().op))),target:()=>`#olist .oi[data-t="${F().op}"]`,
    enter:()=>{TUT.found=null;$('#objBox').open=true;tutScroll(`#olist .oi[data-t="${F().op}"]`)},done:()=>TUT.found===F().op},
  {id:'rings',next:1,doss:0,say:()=>T().rings,rings:()=>[obox(F().op)]},
  {id:'pickE',doss:0,say:()=>T().pick(F().E,oname(F().op)),act:()=>T().pickA(F().E),target:()=>tutChip(F().E),rings:()=>[obox(F().op)],done:()=>tool===F().E},
  {id:'placeE',mode:'pen',who:'E',say:()=>T().place,act:()=>T().placeA(oname(F().op),tutG(F().E)),target:'#cluebar',rings:()=>[cbox(sol('E'))],tap:place('E'),done:()=>onSol(F().E)},
  {id:'move',mode:'pen',who:'E',say:()=>T().move,act:()=>T().moveA,
    tap:i=>i===sol('E')||i===state[F().E]?T().w.again:tutAtoms().G.occ.includes(i)||T().w.blocked(oname(P.M.obj[i])),done:()=>state[F().E]!==undefined&&!onSol(F().E)},
  {id:'undo',say:()=>T().undo(F().E),act:()=>T().undoA(tutG(F().E)),target:'#undoBtn',req:()=>state[F().E]===undefined?tutFix(F().E):null,tap:()=>T().w.undo(F().E),done:()=>onSol(F().E),
    // after a reload the history is gone: give Undo the placed state to return to
    enter:()=>{if(!hist.length&&state[F().E]!==undefined&&!onSol(F().E)){hist.push(JSON.stringify({state:{...state,[F().E]:sol('E')},marks,notes}));renderUI()}}},
  {id:'pickD',has:'E',say:()=>T().pickD(F().D),act:()=>T().pickA(F().D),target:()=>tutChip(F().D),done:()=>tool===F().D},
  {id:'noteMode',has:'E',say:()=>T().noteMode(F().D,oname(F().nx)),act:()=>T().noteModeA,target:tutMode('notes'),done:()=>mode==='notes'},
  {id:'notes',has:'E',mode:'notes',who:'D',say:()=>T().notes(F().D),act:()=>T().notesA,rings:()=>F().dC.map(cbox),tap:i=>F().dC.includes(i)||T().w.notes,
    done:()=>F().dC.every(i=>(notes[i]||'').includes('D'))},
  {id:'crossMode',has:'E',say:()=>T().crossMode(F().D,F().E),act:()=>T().crossModeA,target:tutMode('x'),done:()=>mode==='x'},
  {id:'cross',has:'E',mode:'x',say:()=>T().cross,act:()=>T().crossA(F().E),rings:()=>[cbox(F().dX),colBox(sol('E'))],tap:i=>i===F().dX&&!marks[i]||T().w.cross(F().E),done:()=>!!marks[F().dX]},
  {id:'placeD',has:'E',mode:'pen',who:'D',say:()=>T().placeD(F().D),act:()=>T().placeDA(F().D),rings:()=>[cbox(sol('D'))],tap:place('D'),done:()=>onSol(F().D)},
  {id:'placeC',has:'ED',mode:'pen',who:'C',say:()=>T().placeC(F().C,L.room(P.M.rooms[F().room]),F().cC.filter(i=>(i/P.M.N|0)===(sol('D')/P.M.N|0)).length,F().D),
    act:()=>T().placeCA(F().C),rings:()=>F().cC.map(cbox),tap:place('C'),done:()=>onSol(F().C)},
  {id:'placeB',has:'EDC',mode:'pen',who:'B',say:()=>T().placeB(F().B),act:()=>T().placeBA(F().B,tutG(F().B))+(TUT.miss>=2?' '+T().placeBR:''),
    rings:()=>TUT.miss>=2?F().bC.map(cbox):[],tap:place('B'),done:()=>onSol(F().B)},
  {id:'hint1',has:'EDCB',say:()=>T().hint1,act:()=>T().hint1A,target:'#hintBtn',tap:i=>tool===F().A&&i===sol('A')||T().follow,done:()=>hintFor===F().A||state[F().A]!==undefined},
  {id:'hint2',has:'EDCB',say:()=>T().hint2(F().A),act:()=>T().hint2A(tutG(F().A)),target:'#hintBtn',tap:i=>tool===F().A&&i===sol('A')||T().hint2A(tutG(F().A)),done:()=>onSol(F().A),
    enter:()=>{if(state[F().A]===undefined&&hintFor!==F().A){tool=F().A;renderUI();hintFor=F().A;showHintRings(tutCands(F().A,true))}}},
  {id:'placeV',has:'EDCBA',mode:'pen',who:'V',say:()=>T().victim(F().V),act:()=>T().victimA(F().V,tutG(F().V)),rings:()=>TUT.miss>=2?[cbox(sol('V'))]:[],tap:place('V'),done:()=>onSol(F().V)},
  {id:'killer',next:1,has:'EDCBAV',say:()=>T().killer(F().V,roomOf(sol('V'))),rings:()=>[cbox(sol('V')),cbox(P.sol[P.killer])]},
  {id:'accuse',has:'EDCBAV',say:()=>T().accuse,act:()=>T().accuseA,target:'#accuseBtn',done:()=>is('#accuse')||solved},
  {id:'pick',has:'EDCBAV',say:()=>T().pickK(F().V,roomOf(sol('V'))),act:()=>T().pickKA,target:'#susList',req:()=>is('#accuse')?null:{a:T().needAccuse,t:'#accuseBtn'},done:()=>solved},
  {id:'win',say:()=>T().win,act:()=>TUT.winSeen?T().winA:'',target:'#winNext',done:()=>TUT.winSeen&&!is('#win')},
  {id:'newcase',say:()=>T().newCase,act:()=>T().newCaseA,target:'#newBtn',done:()=>is('#newMenu')},
  {id:'levels',next:1,say:()=>T().levels,target:'#newMenu',enter:()=>tutScroll('#newMenu .diff[data-d="hard"]'),onNext:closePops},
  {id:'more',say:()=>T().more,act:()=>T().moreA,target:'#moreBtn',done:()=>is('#more')},
  {id:'menu',next:1,say:()=>T().menu,target:'#tutBtn',onNext:()=>tutEnd(true)}]})();
const tutCur=()=>TUT&&TS[TUT.i];
const tutIsNext=s=>typeof s.next==='function'?s.next():!!s.next;
// the first thing that must hold before the step's own action: earlier people back on their squares, then the input mode, then the person
function tutReq(s){if(s.done&&s.done())return null;
  for(const k of s.has||'')if(!onSol(TUT.F[k]))return tutFix(TUT.F[k]);
  if(s.mode&&mode!==s.mode)return {a:L.tut.needMode[s.mode],t:tutMode(s.mode)};
  if(s.who&&tool!==TUT.F[s.who])return {a:L.tut.needPick(TUT.F[s.who]),t:tutChip(TUT.F[s.who])};
  return s.req?s.req():null}
function tutScroll(sel){setTimeout(()=>{const e=$(sel);if(e)e.scrollIntoView({block:'center',behavior:RMOTION.matches?'auto':'smooth'})},innerWidth<900?480:60)}

// ---------- flow ----------
function tutStart(resume){closePops();$('#tutOffer').classList.remove('on');try{localStorage.setItem('murdoku2:seen','1')}catch(e){}
  let s=null;try{if(resume)s=JSON.parse(localStorage.getItem(TK)||'null');else localStorage.removeItem(TK)}catch(e){}
  if(TUT)clearTimeout(TUT.adv);TUT={i:Math.max(0,Math.min(TS.length-1,s&&s.step||0)),miss:0,fb:'',fbc:'',winSeen:false};openCase(TUT_SEED,'easy',true)}
// called by openCase once the tutorial case is built and its save loaded
function tutBegin(){TUT.F=tutFacts();document.body.classList.add('tut');$('#coach').hidden=false;
  if(solved){solvedNow=true;syncPawns(false);if(TUT.i<=tutIdx('win'))TUT.i=tutIdx('newcase')}
  tutGo(TUT.i)}
function tutGo(i){if(!TUT)return;if(i>=TS.length)return tutEnd(true);clearTimeout(TUT.adv);TUT.adv=0;TUT.i=i;TUT.miss=0;TUT.fb='';TUT.rk=null;const s=TS[i];
  if(s.doss!=null&&innerWidth<900)$('#dossier').classList.toggle('open',!!s.doss);
  s.enter&&s.enter();save();tutCheck();
  const focusIn=$('#coach').contains(document.activeElement);
  requestAnimationFrame(()=>{if(!TUT)return;if(!$('#coachNext').hidden)$('#coachNext').focus({preventScroll:true});else if(focusIn)$('#coachTxt').focus({preventScroll:true})});
  for(const t of [120,450,900,1300])setTimeout(tutLayout,t)}
// re-evaluate after anything changes: action steps move on by themselves half a second after they are done
function tutCheck(){const s=tutCur();if(!s||!TUT.F)return;
  if(!tutIsNext(s)&&s.done&&s.done()&&!TUT.adv)TUT.adv=setTimeout(()=>{TUT.adv=0;if(tutCur()===s&&s.done())tutGo(TUT.i+1)},500);
  tutRender()}
function tutFb(t,c=''){if(!TUT)return;TUT.fb=t;TUT.fbc=c;tutRender()}
function tutMiss(r,i){TUT.miss++;tutFb(r,'bad');buzz();flashCells([i]);return false}
// board taps go through here first: true lets tapCell carry on
function tutTap(i){const s=tutCur();if(!s||!TUT.F)return true;if(s.done&&s.done())return false;
  const q=tutReq(s),at=Object.keys(state).find(n=>state[n]===i),pass=()=>{TUT.fb='';return true};
  if(!tool&&at&&mode!=='x')return pass();
  if(q)return q.fix&&tool===q.fix&&mode==='pen'&&i===P.sol[q.fix]?pass():tutMiss(q.a,i);
  if(!s.tap)return tutMiss(tutIsNext(s)?L.tut.wait:L.tut.follow,i);
  const r=s.tap(i);return r===true?pass():tutMiss(r,i)}
function tutClose(){if(!TUT)return;clearTimeout(TUT.adv);TUT=null;document.body.classList.remove('tut');$('#coach').hidden=true;$('#tutSpot').hidden=true;setRings([]);
  for(const m of ['#accuse','#win','#tutOffer'])$(m).classList.remove('on');closePops();showHintRings([]);document.body.style.removeProperty('--tut-top');
  try{localStorage.removeItem(TK)}catch(e){}}
// finish: a fresh easy case; exit: back to the case the player had going, if any
function tutEnd(fin){tutClose();if(fin){diff='easy';newCase();setTimeout(()=>toast(L.tut.done,'good'),2500);return}
  let last=null;try{last=localStorage.getItem('murdoku2:last')}catch(e){}const m=/^#(easy|medium|hard)-(\d+)$/.exec(last||'');
  if(m)openCase(+m[2],m[1]);else{diff='easy';newCase()}}
function tutOffer(){$('#tutOffer').classList.add('on');setTimeout(()=>$('#tutGo').focus({preventScroll:true}),60)}
function tutSkip(){$('#tutOffer').classList.remove('on');try{localStorage.setItem('murdoku2:seen','1')}catch(e){}
  if(innerWidth<900)$('#dossier').classList.add('open');else toast(L.t.welcome)}

// ---------- coach panel ----------
const tutSet=(sel,h)=>{const e=$(sel);if(e._h!==h){e._h=h;e.innerHTML=h}};
function tutRender(){const s=tutCur();if(!s||!TUT.F)return;const T=L.tut,q=tutReq(s),nx=!q&&tutIsNext(s);TUT.q=q;
  tutSet('#coachStep',T.step(TUT.i+1,TS.length));$('#coachBar').style.width=((TUT.i+1)/TS.length*100).toFixed(1)+'%';
  tutSet('#coachTxt',s.say());tutSet('#coachAct',q?q.a:nx||!s.act?'':s.act());tutSet('#coachFb',TUT.fb);$('#coachFb').className=TUT.fbc;
  const nb=$('#coachNext');nb.hidden=!nx;nb.textContent=s.id==='menu'?T.finish:T.next;$('#coachSkip').hidden=!s.skip||!!q;$('#coach .ch-row').hidden=nb.hidden&&$('#coachSkip').hidden;
  TUT.tSel=q?q.t:typeof s.target==='function'?s.target():s.target||null;
  const rg=q&&q.r?q.r:s.rings?s.rings():[],rk=JSON.stringify(rg);if(rk!==TUT.rk){TUT.rk=rk;setRings(rg)}
  tutLayout()}
const tutVis=el=>{if(!el)return null;const r=el.getBoundingClientRect();if(r.width<2||r.height<2||r.bottom<0||r.right<0||r.top>innerHeight||r.left>innerWidth)return null;return r};
// screen box around the ringed cells, so the coach can stay clear of them
function tutRingRect(){if(!TUT.rk||TUT.rk==='[]'||!P)return null;const N=P.M.N,v=new THREE.Vector3(),c=canvas.getBoundingClientRect();let l=1e9,t=1e9,r=-1e9,b=-1e9;
  for(const [x0,y0,x1,y1] of JSON.parse(TUT.rk))for(const [x,y] of [[x0-.5,y0-.5],[x1+.5,y0-.5],[x0-.5,y1+.5],[x1+.5,y1+.5]]){v.set(x-(N-1)/2,0,y-(N-1)/2).project(camera);
    const sx=(v.x+1)/2*c.width+c.left,sy=(1-v.y)/2*c.height+c.top;l=Math.min(l,sx);r=Math.max(r,sx);t=Math.min(t,sy);b=Math.max(b,sy)}
  return {left:l,top:t,right:r,bottom:b}}
const tutOver=(a,b)=>!b?0:Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
// phones: the coach docks under the header and the board, case file and dialogs make room below it.
// Wider screens: try a few spots in the free area and take the one that covers the least of what matters.
function tutLayout(){if(!TUT||!TUT.F)return;const c=$('#coach'),W=innerWidth,H=innerHeight,s=tutCur();
  const tEl=TUT.tSel?$(TUT.tSel):null,tr=tutVis(tEl),sp=$('#tutSpot');
  if(tr){const k=5,rad=parseFloat(getComputedStyle(tEl).borderTopLeftRadius)||10;sp.hidden=false;
    Object.assign(sp.style,{left:tr.left-k+'px',top:tr.top-k+'px',width:tr.width+2*k+'px',height:tr.height+2*k+'px',borderRadius:Math.min(rad+k,30)+'px'})}else sp.hidden=true;
  const hd=$('header').getBoundingClientRect(),hud=$('#hud').getBoundingClientRect();
  if(W<600){const top=Math.round(hd.bottom+6);c.style.left='';c.style.top=top+'px';const b=top+c.offsetHeight+8+'px';
    if(document.body.style.getPropertyValue('--tut-top')!==b){document.body.style.setProperty('--tut-top',b);resize()}return}
  const w=c.offsetWidth,h=c.offsetHeight,L0=(W>=900?$('#dossier').getBoundingClientRect().right:0)+12,R0=W-12,T0=hd.bottom+8,B0=H-12;
  const sheet=W<900&&$('#dossier').classList.contains('open'),modal=$('.modal.on .panel'),tools=$('header .tools').getBoundingClientRect();
  const avoid=[[tr,100],[tutRingRect(),tutIsNext(s)?20:100],[tools,50],[hud,sheet?0:3],[modal&&modal.getBoundingClientRect(),2]];
  const xs=[(L0+R0-w)/2,R0-w,L0],ys=[T0,hud.top-12-h,B0-h,(H-h)/2];let best=null,bs=1e18;
  ys.forEach((y0,yi)=>xs.forEach((x0,xi)=>{const x=Math.max(L0,Math.min(R0-w,x0)),y=Math.max(T0,Math.min(B0-h,y0)),r={left:x,top:y,right:x+w,bottom:y+h};
    let sc=(xi+yi)*40;for(const [a,wt] of avoid)sc+=wt*tutOver(r,a);if(sc<bs){bs=sc;best=r}}));
  c.style.left=Math.round(best.left)+'px';c.style.top=Math.round(best.top)+'px'}

// ---------- wiring ----------
$('#coach').addEventListener('click',e=>e.stopPropagation());
$('#coachNext').onclick=()=>{const s=tutCur();if(!s)return;if(s.onNext)s.onNext();if(TUT&&tutCur()===s)tutGo(TUT.i+1)};
$('#coachSkip').onclick=()=>{if(TUT)tutGo(TUT.i+1)};
$('#coachExit').onclick=()=>tutEnd(false);
$('#tutGo').onclick=()=>tutStart(false);$('#tutSkip').onclick=tutSkip;
$('#tutOffer').addEventListener('click',e=>{if(e.target.id==='tutOffer')tutSkip()});
$('#tutBtn').onclick=()=>tutStart(false);
// panels, menus and dialogs opening or closing can satisfy a step or move its target
{const mo=new MutationObserver(()=>{if(TUT)tutCheck()});for(const s of ['#dossier','#accuse','#win','#newMenu','#more'])mo.observe($(s),{attributes:true,attributeFilter:['class']})}
$('#dossier').addEventListener('transitionend',e=>{if(e.target.id==='dossier')tutLayout()});
addEventListener('resize',()=>setTimeout(tutLayout,60));
// a scrolled case file or menu moves the spotlight's target: follow it, at most once per frame
addEventListener('scroll',()=>{if(TUT&&!TUT.raf)TUT.raf=requestAnimationFrame(()=>{if(TUT){TUT.raf=0;tutLayout()}})},{capture:true,passive:true});
// turning the board: compare the view before and after a drag, pinch or scroll (after the damping has settled)
{let cam0=null;const sph=()=>new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
 controls.addEventListener('start',()=>{if(TUT)cam0=sph()});
 controls.addEventListener('end',()=>{if(!TUT||!cam0)return;const a=cam0;setTimeout(()=>{if(!TUT)return;const s=sph();
   if(Math.abs(s.theta-a.theta)>.15||Math.abs(s.phi-a.phi)>.15||Math.abs(s.radius/a.radius-1)>.08)TUT.rotated=true;tutCheck()},450)})}
const tutDbg=()=>TUT&&TUT.F&&{i:TUT.i,id:TS[TUT.i].id,n:TS.length,sel:TUT.tSel,F:TUT.F,miss:TUT.miss,act:$('#coachAct').textContent,fb:$('#coachFb').textContent,next:!$('#coachNext').hidden,txt:$('#coachTxt').textContent};
