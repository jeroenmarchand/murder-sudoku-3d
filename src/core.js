// ---------- shared core: runs in the page and in the worker ----------
const DIFF={
  easy:  {N:6,K:4,dens:[.30,.42],mode:'easy'},
  medium:{N:8,K:6,dens:[.34,.46],mode:'medium'},
  hard:  {N:9,K:7,dens:[.36,.48],mode:'hard'}
};
const OCC=new Set(['stoel','paard','bank','tapijt','bed','troon']);
const LEN={tapijt:[1,3],tafel:[1,2],bed:[2,2]};
const UNIQUE=new Set(['troon']);
const ROOMS=[
 {name:'Stal',color:'#e6cfa8',occ:['paard','paard','bank'],blk:['ton','hooibaal','kist']},
 {name:'Binnenplaats',color:'#cfe3b4',occ:['bank','paard'],blk:['boom','struik','put']},
 {name:'Bibliotheek',color:'#c9dcef',occ:['stoel','tapijt'],blk:['boekenkast','boekenkast','tafel']},
 {name:'Slaapkamer',color:'#ddd0ec',occ:['bed','stoel','tapijt'],blk:['kast','kist']},
 {name:'Troonzaal',color:'#f1c9c4',occ:['troon','tapijt','stoel'],blk:['harnas','tafel']},
 {name:'Keuken',color:'#f6e6a8',occ:['stoel','bank'],blk:['tafel','ton','kast']},
 {name:'Kapel',color:'#dcdcdc',occ:['bank','tapijt'],blk:['altaar','kandelaar']},
 {name:'Wapenkamer',color:'#d9c9b6',occ:['stoel','bank'],blk:['harnas','wapenrek','kist']},
 {name:'Tuin',color:'#bfe0c0',occ:['bank'],blk:['boom','struik','bloemperk']},
 {name:'Kelder',color:'#cfc6b8',occ:['stoel'],blk:['ton','wijnrek','kist']}
];
const NAMES={A:[['Adelheid','f'],['Arnoud','m']],B:[['Beatrijs','f'],['Boudewijn','m']],C:[['Clementia','f'],['Coenraad','m']],
 D:[['Dirkje','f'],['Diederik','m']],E:[['Ermgard','f'],['Everard','m']],F:[['Fenna','f'],['Floris','m']],
 G:[['Gerlinde','f'],['Gijsbrecht','m']],H:[['Hadewych','f'],['Hugo','m']]};
const VICTIMS=[['Heer Vranck','m'],['Vrouwe Walburga','f']];
const FACES={f:['👸','👩‍🍳','👵','👩‍🦰','👩‍🌾','🧝‍♀️','👩‍🦳','🧕'],m:['🧔','💂','👨‍🦱','🧙','👨‍🍳','🤵','👴','🧑‍🎤']};

function rng(seed){let a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const pick=(r,a)=>a[Math.floor(r()*a.length)];
function shuffle(r,a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const D4=[[1,0],[-1,0],[0,1],[0,-1]];

function makeRegions(r,N,K){
  for(let tries=0;tries<200;tries++){
    const reg=Array(N*N).fill(-1);const sizes=Array(K).fill(0);
    const seeds=shuffle(r,[...Array(N*N).keys()]).slice(0,K);
    seeds.forEach((s,i)=>{reg[s]=i;sizes[i]=1});
    let left=N*N-K,guard=0;
    while(left>0&&guard++<100000){
      // favour small regions so sizes stay balanced
      const order=shuffle(r,[...Array(K).keys()]).sort((a,b)=>sizes[a]-sizes[b]+ (r()-.5)*4);
      const k=order[0];const front=[];
      for(let i=0;i<N*N;i++)if(reg[i]===k){const y=Math.floor(i/N),x=i%N;
        for(const[dy,dx]of D4){const yy=y+dy,xx=x+dx;if(yy>=0&&yy<N&&xx>=0&&xx<N&&reg[yy*N+xx]<0)front.push(yy*N+xx)}}
      if(!front.length){sizes[k]+=1000;continue}
      const c=pick(r,front);reg[c]=k;sizes[k]++;left--;
      for(let j=0;j<K;j++)if(sizes[j]>=1000)sizes[j]-=1000;
    }
    const cnt=Array(K).fill(0);reg.forEach(v=>cnt[v]++);
    if(left===0&&Math.min(...cnt)>=3)return reg;
  }
  return null;
}

function buildMap(r,cfg){
  const N=cfg.N,K=cfg.K;
  const reg=makeRegions(r,N,K);if(!reg)return null;
  const rooms=shuffle(r,ROOMS).slice(0,K);
  const obj=Array(N*N).fill(null),objId=Array(N*N).fill(-1),objs=[];const used=new Set();
  for(let k=0;k<K;k++){
    const cells=[];for(let i=0;i<N*N;i++)if(reg[i]===k)cells.push(i);
    const target=Math.round(cells.length*(cfg.dens[0]+r()*(cfg.dens[1]-cfg.dens[0])));
    let filled=0,guard=0;const room=rooms[k];
    while(filled<target&&guard++<200){
      const wantOcc=r()<0.45;let t=pick(r,wantOcc?room.occ:room.blk);
      if(UNIQUE.has(t)&&used.has(t))continue;
      const [lo,hi]=LEN[t]||[1,1];const len=lo+Math.floor(r()*(hi-lo+1));
      if(filled+len>target+1)continue;
      const s=pick(r,cells);const vert=r()<.5;const cs=[];let ok=true;
      for(let j=0;j<len;j++){const y=Math.floor(s/N)+(vert?j:0),x=s%N+(vert?0:j);
        if(y>=N||x>=N){ok=false;break}const i=y*N+x;if(reg[i]!==k||obj[i]){ok=false;break}cs.push(i)}
      if(!ok)continue;
      const id=objs.length;objs.push({t,cells:cs});cs.forEach(i=>{obj[i]=t;objId[i]=id});used.add(t);filled+=len;
    }
    if(!cells.some(i=>!obj[i]||OCC.has(obj[i])))return null;
  }
  return {N,K,reg,obj,objId,objs,rooms:rooms.map(x=>({name:x.name,color:x.color}))};
}

function geom(M){
  const N=M.N,occ=[];
  for(let i=0;i<N*N;i++)if(!M.obj[i]||OCC.has(M.obj[i]))occ.push(i);
  const nb=i=>{const y=Math.floor(i/N),x=i%N,o=[];for(const[dy,dx]of D4){const yy=y+dy,xx=x+dx;
    if(yy>=0&&yy<N&&xx>=0&&xx<N&&M.reg[yy*N+xx]===M.reg[i])o.push(yy*N+xx)}return o};
  const bord=(i,dy,dx)=>{const y=Math.floor(i/N)+dy,x=i%N+dx;return y<0||y>=N||x<0||x>=N||M.reg[y*N+x]!==M.reg[i]};
  const corner=i=>(bord(i,1,0)||bord(i,-1,0))&&(bord(i,0,1)||bord(i,0,-1));
  const edge=i=>{const y=Math.floor(i/N),x=i%N;return y===0||x===0||y===N-1||x===N-1};
  return {occ,nb,corner,edge};
}

function atomsFor(M,G){
  const A={};const types=new Set(M.obj.filter(Boolean));
  for(const t of types){if(OCC.has(t))A['op:'+t]=i=>M.obj[i]===t;
    A['naast:'+t]=i=>G.nb(i).some(q=>M.obj[q]===t)}
  for(let k=0;k<M.K;k++)A['in:'+k]=i=>M.reg[i]===k;
  A['hoek']=G.corner;A['rand']=G.edge;A['geenobject']=i=>!M.obj[i];A['alleen']=()=>true;
  return A;
}

function countSolutions(M,G,A,people,victim,clues,cap,budget){
  const N=M.N;const cand={};
  for(const n of people){
    if(n===victim){cand[n]=G.occ;continue}
    cand[n]=G.occ.filter(i=>clues[n].every(a=>A[a](i)));
    if(!cand[n].length)return {count:0};
  }
  const order=people.slice().sort((a,b)=>cand[a].length-cand[b].length);
  const alone=people.filter(n=>n!==victim&&clues[n].includes('alleen'));
  const pos={};let count=0,nodes=0,first=null,over=false;
  const regCnt=Array(M.K).fill(0);
  function rec(d,rows,cols){
    if(count>=cap||over)return;
    if(++nodes>budget){over=true;return}
    if(d===order.length){
      if(regCnt[M.reg[pos[victim]]]!==2)return;
      for(const n of alone)if(regCnt[M.reg[pos[n]]]!==1)return;
      count++;if(!first)first=Object.assign({},pos);return;
    }
    const n=order[d];
    for(const i of cand[n]){const y=Math.floor(i/N),x=i%N;
      if(rows>>y&1||cols>>x&1)continue;
      pos[n]=i;regCnt[M.reg[i]]++;rec(d+1,rows|1<<y,cols|1<<x);regCnt[M.reg[i]]--;
      if(count>=cap||over)return;}
  }
  rec(0,0,0);
  return {count:over?cap:count,first,over};
}

function placeSolution(r,M,G){
  const N=M.N;const occSet=new Set(G.occ);
  for(let t=0;t<60;t++){
    const colOf=Array(N);const usedC=new Set();
    const rows=[...Array(N).keys()];
    const go=y=>{if(y===N)return true;for(const x of shuffle(r,[...Array(N).keys()])){
      if(usedC.has(x)||!occSet.has(y*N+x))continue;usedC.add(x);colOf[y]=x;if(go(y+1))return true;usedC.delete(x)}return false};
    if(!go(0))return null;
    const cells=rows.map(y=>y*N+colOf[y]);
    const cnt={};cells.forEach(i=>cnt[M.reg[i]]=(cnt[M.reg[i]]||0)+1);
    const vIdx=shuffle(r,cells.map((_,j)=>j)).find(j=>cnt[M.reg[cells[j]]]===2);
    if(vIdx===undefined)continue;
    return {cells,vIdx};
  }
  return null;
}

function generate(seed,diff){
  const cfg=DIFF[diff];
  for(let att=0;att<400;att++){
    const r=rng(seed*7919+att*104729+13);
    const M=buildMap(r,cfg);if(!M)continue;
    const G=geom(M);const A=atomsFor(M,G);
    const P=placeSolution(r,M,G);if(!P)continue;
    const N=M.N;const letters='ABCDEFGH'.slice(0,N-1).split('');
    const fpool=shuffle(r,FACES.f),mpool=shuffle(r,FACES.m);
    const sus=letters.map(L=>{const [nm,g]=pick(r,NAMES[L]);return {name:nm,g,face:(g==='f'?fpool:mpool).pop()}});
    const [vn,vg]=pick(r,VICTIMS);const vic={name:vn,g:vg,face:vg==='f'?'👸':'🤴',victim:true};
    const others=shuffle(r,P.cells.filter((_,j)=>j!==P.vIdx));
    const sol={};sus.forEach((s,j)=>sol[s.name]=others[j]);sol[vic.name]=P.cells[P.vIdx];
    const people=sus.map(s=>s.name).concat(vic.name);
    const regCnt={};Object.values(sol).forEach(i=>regCnt[M.reg[i]]=(regCnt[M.reg[i]]||0)+1);
    const truth={},strength={};
    for(const a in A)strength[a]=a==='alleen'?G.occ.length*0.6:G.occ.filter(A[a]).length;
    for(const s of sus){const i=sol[s.name];
      truth[s.name]=Object.keys(A).filter(a=>a==='alleen'?regCnt[M.reg[i]]===1:A[a](i)).filter(a=>strength[a]<G.occ.length)}
    const res=chooseClues(r,cfg.mode,M,G,A,people,vic.name,sus,truth,strength);
    if(!res)continue;
    const killer=people.find(n=>n!==vic.name&&M.reg[sol[n]]===M.reg[sol[vic.name]]);
    return {seed,diff,M,sus,vic,sol,clues:res,killer};
  }
  return null;
}

function chooseClues(r,mode,M,G,A,people,victim,sus,truth,strength){
  const names=sus.map(s=>s.name);const BUD=40000;
  const cnt=(cl,cap)=>countSolutions(M,G,A,people,victim,cl,cap,BUD).count;
  const clues={};
  for(const n of names){
    const t=truth[n].slice().sort((a,b)=>strength[a]-strength[b]);
    if(!t.length)return null;
    let pool=mode==='easy'?t.slice(0,Math.max(1,Math.ceil(t.length/3))):t.slice(0,Math.max(1,Math.ceil(t.length*2/3)));
    clues[n]=[pick(r,pool)];
  }
  let c=cnt(clues,60);
  for(let it=0;it<40&&c!==1;it++){
    let best=null;
    for(const n of shuffle(r,names)){
      const opts=truth[n].map(a=>[a]);
      if(clues[n].length===1)truth[n].forEach(a=>{if(a!==clues[n][0])opts.push([clues[n][0],a])});
      for(const o of opts){
        if(o.length===clues[n].length&&o.every((a,j)=>a===clues[n][j]))continue;
        const t=Object.assign({},clues);t[n]=o;const k=cnt(t,c);
        if(k<1||k>=c)continue;
        const weak=o.reduce((s,a)=>s+Math.log(strength[a]+1),0)-(o.length-1)*1.5;
        let score;
        if(mode==='easy')score=[k,-weak*0.01,r()];
                else score=[k,o.length,r()];
        if(!best||cmp(score,best.score)<0)best={score,n,o,k};
      }
    }
    if(!best)return null;
    clues[best.n]=best.o;c=best.k;
  }
  if(c!==1)return null;
  const rounds=mode==='hard'?3:mode==='medium'?1:0;
  for(let rd=0;rd<rounds;rd++){ // loosen clues while the answer stays unique
    for(const n of shuffle(r,names)){
      const alts=truth[n].map(a=>[a]).filter(o=>!(o.length===clues[n].length&&o[0]===clues[n][0]))
        .sort((a,b)=>strength[b[0]]-strength[a[0]]);
      const curW=clues[n].length>1?-1:strength[clues[n][0]];
      for(const o of alts){if(clues[n].length===1&&strength[o[0]]<=curW)break;
        const t=Object.assign({},clues);t[n]=o;if(cnt(t,2)===1){clues[n]=o;break}}
    }
  }
  const fin=countSolutions(M,G,A,people,victim,clues,2,3000000);
  if(fin.over||fin.count!==1)return null;
  return clues;
}
function cmp(a,b){for(let i=0;i<a.length;i++){if(a[i]<b[i])return -1;if(a[i]>b[i])return 1}return 0}
