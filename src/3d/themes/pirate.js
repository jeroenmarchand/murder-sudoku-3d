// Pirate: "Moord op zee". The board is the main deck of a galleon at golden hour on the open sea.
(()=>{
const PI=Math.PI,TAU=PI*2;
// ---------- small helpers ----------
const TX={};const tex=(k,f)=>TX[k]||(TX[k]=f());
function canv(w,h,fn,rep){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');fn(g,w,h);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;if(rep)t.wrapS=t.wrapT=THREE.RepeatWrapping;return t}
function M(geo,m,x=0,y=0,z=0,rx=0,ry=0,rz=0){const o=sh(new THREE.Mesh(geo,m));o.position.set(x,y,z);o.rotation.set(rx,ry,rz);return o}
const GC={};const gc=(k,f)=>GC[k]||(GC[k]=f());
const lathe=(pts,seg=16)=>new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(p[0],p[1])),seg);
// rounded box, footprint w×d, height h, bottom at y=0
function rbox(w,h,d,r=.03,bev=.012){return gc('rb'+[w,h,d,r,bev],()=>{const g=new THREE.ExtrudeGeometry(roundRect(w-2*bev,d-2*bev,Math.min(r,(w-2*bev)/2-.001,(d-2*bev)/2-.001)),{depth:Math.max(.001,h-2*bev),bevelEnabled:true,bevelThickness:bev,bevelSize:bev,bevelSegments:2,curveSegments:4});
  g.rotateX(-PI/2);g.translate(0,bev,0);return g})}
const V3=(x,y,z)=>new THREE.Vector3(x,y,z),UP=V3(0,1,0);
// a cylinder from point a to point b
function rod(a,b,r,m,s=6,r2){const d=new THREE.Vector3().subVectors(b,a);const L=d.length();const o=M(new THREE.CylinderGeometry(r2??r,r,L,s,1),m);
  o.position.copy(a).addScaledVector(d,.5);o.quaternion.setFromUnitVectors(UP,d.normalize());return o}
// bake every static mesh inside g into one mesh per material (fewer draw calls); subtrees marked keep stay live
function bake(g){g.updateMatrixWorld(true);const inv=g.matrixWorld.clone().invert(),by=new Map();
  const walk=o=>{for(const c of o.children){if(c.userData.keep)continue;if(c.isMesh&&!c.isInstancedMesh&&!c.children.length&&!Array.isArray(c.material)){if(!by.has(c.material))by.set(c.material,[]);by.get(c.material).push(c)}walk(c)}};walk(g);
  const mm=new THREE.Matrix4();
  for(const [m,list] of by){if(list.length<2)continue;
    const geos=list.map(o=>{let q=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();for(const k of Object.keys(q.attributes))if(!['position','normal','uv'].includes(k))q.deleteAttribute(k);
      if(!q.attributes.uv)q.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(q.attributes.position.count*2),2));q.morphAttributes={};q.clearGroups();
      return q.applyMatrix4(mm.multiplyMatrices(inv,o.matrixWorld))});
    const mg=mergeGeometries(geos);geos.forEach(q=>q.dispose());if(!mg)continue;
    const cast=list.some(o=>o.castShadow);list.forEach(o=>o.parent.remove(o));const o=new THREE.Mesh(mg,m);o.castShadow=cast;o.receiveShadow=true;g.add(o)}
  return g}
const keep=o=>{o.userData.keep=true;return o};
const sm=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};

// ---------- materials ----------
const WD=mat('#7a4a28',{roughness:.62}),DW=mat('#4a2b17',{roughness:.7}),LW=mat('#a87a4c',{roughness:.7}),
  IRON=mat('#2b2826',{metalness:.75,roughness:.42}),BRASS=mat('#c99a45',{metalness:.92,roughness:.3}),
  GLD=mat('#f0c050',{metalness:1,roughness:.2,emissive:'#6a4200',emissiveIntensity:.35}),
  RED=mat('#8e2320',{roughness:.55}),VEL=mat('#7c1420',{roughness:.85}),CREAM=mat('#efe4c8',{roughness:.9}),
  BLK=mat('#121010',{roughness:.6}),STEEL=mat('#d7dbe0',{metalness:.95,roughness:.18});
const ropeTex=()=>tex('rope',()=>{const t=canv(64,64,(g,w,h)=>{g.fillStyle='#b8925f';g.fillRect(0,0,w,h);g.lineWidth=7;
  for(let k=-2;k<4;k++){g.strokeStyle='rgba(70,45,20,.45)';g.beginPath();g.moveTo(k*24,0);g.lineTo(k*24+40,h);g.stroke();g.strokeStyle='rgba(255,235,190,.25)';g.lineWidth=3;g.beginPath();g.moveTo(k*24+9,0);g.lineTo(k*24+49,h);g.stroke();g.lineWidth=7}},true);t.repeat.set(10,1);return t});
const ROPE=()=>gc('ropeM',()=>new THREE.MeshStandardMaterial({color:'#d9b47c',map:ropeTex(),roughness:1}));
const woodTex=()=>tex('wood',()=>canv(128,128,(g,w,h)=>{g.fillStyle='#ffffff';g.fillRect(0,0,w,h);g.lineWidth=1;
  for(let k=0;k<60;k++){g.strokeStyle=`rgba(${Math.random()<.5?'60,35,15':'255,240,210'},${.08+Math.random()*.12})`;const y=Math.random()*h;g.beginPath();g.moveTo(0,y);g.bezierCurveTo(w*.3,y+Math.random()*6-3,w*.6,y+Math.random()*6-3,w,y);g.stroke()}},true));
const WALLWOOD=()=>gc('wallwood',()=>canv(128,32,(g,w,h)=>{g.fillStyle='#fff';g.fillRect(0,0,w,h);for(let k=0;k<26;k++){g.strokeStyle=`rgba(${Math.random()<.5?'50,30,10':'255,240,210'},${.12+Math.random()*.15})`;g.lineWidth=1;const y=Math.random()*h;g.beginPath();g.moveTo(0,y);g.lineTo(w,y+Math.random()*3-1.5);g.stroke()}
  g.fillStyle='rgba(40,20,5,.35)';g.fillRect(0,h/2-1,w,2)},true));

// ---------- floor painters (each tile is 256×256) ----------
function planks(g,S,R,shade,lite,n,vert,caulk){const w=S/n;
  for(let i=0;i<n;i++){const a=i*w;g.fillStyle=R()<.5?shade(.03+R()*.08):lite(.02+R()*.07);vert?g.fillRect(a,0,w,S):g.fillRect(0,a,S,w);g.lineWidth=1;
    for(let k=0;k<12;k++){g.strokeStyle=R()<.5?shade(.08):lite(.06);g.beginPath();const o=a+R()*w;
      if(vert){g.moveTo(o,0);g.bezierCurveTo(o+R()*4-2,S*.3,o+R()*4-2,S*.6,o+R()*3-1.5,S)}else{g.moveTo(0,o);g.bezierCurveTo(S*.3,o+R()*4-2,S*.6,o+R()*4-2,S,o+R()*3-1.5)}g.stroke()}
    if(R()<.4){const kx=R()*S,ky=a+w*(.3+R()*.4);g.strokeStyle=shade(.18);g.lineWidth=1.5;g.beginPath();vert?g.ellipse(ky,kx,3,8,0,0,7):g.ellipse(kx,ky,8,3,0,0,7);g.stroke()}
    g.fillStyle=caulk;vert?g.fillRect(a,0,3,S):g.fillRect(0,a,S,3);
    const b=((i%2)?.28:.72)*S+(R()-.5)*30;vert?g.fillRect(a,b,w,3):g.fillRect(b,a,3,w);
    g.fillStyle='rgba(35,22,12,.5)';for(const o of[-9,12])for(const f of[.3,.7]){g.beginPath();vert?g.arc(a+w*f,b+o,2.2,0,7):g.arc(b+o,a+w*f,2.2,0,7);g.fill()}}}
function rose(g,cx,cy,r,c1,c2,line){g.save();g.translate(cx,cy);g.strokeStyle=line;g.lineWidth=2;g.beginPath();g.arc(0,0,r*.72,0,7);g.stroke();g.beginPath();g.arc(0,0,r*.78,0,7);g.stroke();
  for(let k=0;k<16;k++){const a=k/16*TAU-PI/2,L=k%4===0?r:k%2===0?r*.66:r*.42,w=k%4===0?r*.14:r*.09;
    for(const s of[-1,1]){g.fillStyle=s<0?c1:c2;g.beginPath();g.moveTo(0,0);g.lineTo(Math.cos(a)*L,Math.sin(a)*L);g.lineTo(Math.cos(a+s*PI/2)*w,Math.sin(a+s*PI/2)*w);g.closePath();g.fill()}}
  g.fillStyle=c2;g.beginPath();g.arc(0,0,r*.08,0,7);g.fill();g.restore()}
const FLOORS={
  deck:(g,S,R,sd,li)=>{planks(g,S,R,sd,li,4,false,'rgba(28,18,10,.62)');
    for(let k=0;k<5;k++){const x=R()*S,y=R()*S,r=24+R()*40;const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(245,240,225,.12)');gr.addColorStop(1,'rgba(245,240,225,0)');g.fillStyle=gr;g.fillRect(0,0,S,S)}},
  teak:(g,S,R,sd,li)=>{planks(g,S,R,sd,li,6,true,'rgba(18,10,4,.8)');g.strokeStyle=li(.18);g.lineWidth=2;g.strokeRect(5,5,S-10,S-10)},
  hold:(g,S,R,sd,li)=>{planks(g,S,R,sd,li,3,false,'rgba(60,40,20,.35)');g.fillStyle='rgba(225,200,148,.42)';g.fillRect(0,0,S,S);
    for(let k=0;k<7;k++){const x=R()*S,y=R()*S,r=30+R()*50;const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(250,232,190,.35)');gr.addColorStop(1,'rgba(250,232,190,0)');g.fillStyle=gr;g.fillRect(0,0,S,S)}
    for(let k=0;k<2200;k++){g.fillStyle=R()<.5?'rgba(110,80,40,.25)':'rgba(255,245,215,.35)';g.fillRect(R()*S,R()*S,1.5,1.5)}
    g.lineWidth=1.4;for(let k=0;k<26;k++){g.strokeStyle='rgba(235,200,90,.55)';const x=R()*S,y=R()*S,a=R()*TAU,l=8+R()*16;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke()}},
  ticking:(g,S,R,sd,li)=>{for(let x=0;x<S;x+=32){g.fillStyle='rgba(255,255,255,.42)';g.fillRect(x+4,0,12,S);g.fillStyle='rgba(30,50,90,.35)';g.fillRect(x+22,0,3,S)}
    for(let y=0;y<S;y+=3){g.fillStyle=y%6?sd(.05):li(.05);g.fillRect(0,y,S,1)}for(let x=0;x<S;x+=3){g.fillStyle=x%6?sd(.04):li(.04);g.fillRect(x,0,1,S)}
    g.save();g.translate(S*.68,S*.3);g.rotate(.12);g.fillStyle='rgba(205,180,140,.75)';g.fillRect(-28,-22,56,44);g.setLineDash([4,3]);g.strokeStyle='rgba(80,50,30,.6)';g.lineWidth=1.5;g.strokeRect(-25,-19,50,38);g.restore();
    g.setLineDash([5,4]);g.strokeStyle='rgba(40,40,70,.45)';g.lineWidth=1.5;g.beginPath();g.moveTo(0,S*.82);g.lineTo(S,S*.82);g.stroke();g.setLineDash([])},
  chart:(g,S,R,sd,li)=>{for(let k=0;k<2600;k++){g.fillStyle=R()<.5?sd(.05):li(.04);g.fillRect(R()*S,R()*S,1,2)}
    g.strokeStyle='rgba(232,196,120,.6)';g.lineWidth=4;g.strokeRect(14,14,S-28,S-28);g.lineWidth=1.5;g.strokeRect(24,24,S-48,S-48);
    rose(g,S/2,S/2,S*.33,'rgba(236,206,140,.85)','rgba(150,110,50,.85)','rgba(232,196,120,.55)')},
  rug:(g,S,R,sd,li)=>{g.fillStyle='rgba(30,30,70,.55)';g.fillRect(10,10,S-20,S-20);g.fillStyle='rgba(168,58,52,1)';g.fillRect(30,30,S-60,S-60);
    g.strokeStyle='rgba(235,190,100,.8)';g.lineWidth=3;g.strokeRect(12,12,S-24,S-24);g.strokeRect(30,30,S-60,S-60);
    g.fillStyle='rgba(235,190,100,.75)';for(let k=0;k<12;k++){const t=34+k*(S-68)/11;for(const [x,y] of[[t,20],[t,S-20],[20,t],[S-20,t]]){g.beginPath();g.arc(x,y,3,0,7);g.fill()}}
    g.save();g.translate(S/2,S/2);g.fillStyle='rgba(30,30,70,.6)';g.beginPath();g.ellipse(0,0,62,42,0,0,7);g.fill();g.strokeStyle='rgba(235,190,100,.8)';g.lineWidth=2.5;g.stroke();
    g.fillStyle='rgba(235,190,100,.8)';g.beginPath();g.moveTo(0,-30);g.lineTo(22,0);g.lineTo(0,30);g.lineTo(-22,0);g.closePath();g.fill();g.restore();
    for(let k=0;k<2400;k++){g.fillStyle=R()<.5?sd(.05):li(.03);g.fillRect(R()*S,R()*S,1,2)}},
  galley:(g,S,R,sd,li)=>{const n=4,w=S/n;for(let i=0;i<n;i++)for(let j=0;j<n;j++){g.fillStyle=R()<.5?sd(.04+R()*.08):li(.03+R()*.08);g.fillRect(i*w+3,j*w+3,w-6,w-6);
      const gr=g.createLinearGradient(i*w,j*w,i*w+w,j*w+w);gr.addColorStop(0,li(.1));gr.addColorStop(1,sd(.08));g.fillStyle=gr;g.fillRect(i*w+3,j*w+3,w-6,w-6)}
    g.fillStyle='rgba(235,220,190,.55)';for(let k=0;k<=n;k++){g.fillRect(k*w-3,0,6,S);g.fillRect(0,k*w-3,S,6)}},
  treasure:(g,S,R,sd,li)=>{for(let k=0;k<2600;k++){g.fillStyle=R()<.5?sd(.06):li(.04);g.fillRect(R()*S,R()*S,1,2)}
    g.strokeStyle='rgba(240,200,110,.45)';g.lineWidth=2;for(let k=-S;k<S*2;k+=64){g.beginPath();g.moveTo(k,0);g.lineTo(k+S,S);g.stroke();g.beginPath();g.moveTo(k,S);g.lineTo(k+S,0);g.stroke()}
    g.fillStyle='rgba(240,200,110,.7)';for(let x=0;x<=S;x+=64)for(let y=0;y<=S;y+=64){g.beginPath();g.arc(x+32,y,4,0,7);g.fill();g.beginPath();g.arc(x,y+32,4,0,7);g.fill()}
    for(let k=0;k<7;k++){const x=20+R()*(S-40),y=20+R()*(S-40);g.fillStyle='rgba(225,170,50,.95)';g.beginPath();g.ellipse(x,y,9,7,R(),0,7);g.fill();g.fillStyle='rgba(255,240,170,.8)';g.beginPath();g.ellipse(x-2,y-2,4,3,0,0,7);g.fill()}},
  guns:(g,S,R,sd,li)=>{planks(g,S,R,sd,li,3,false,'rgba(20,20,24,.55)');g.fillStyle='rgba(40,40,46,.7)';for(const x of[S*.3,S*.7]){g.fillRect(x-5,0,10,S);g.fillStyle='rgba(190,190,200,.25)';g.fillRect(x-5,0,2,S);g.fillStyle='rgba(40,40,46,.7)'}
    g.fillStyle='rgba(25,25,30,.85)';for(const x of[S*.3,S*.7])for(let y=16;y<S;y+=48){g.beginPath();g.arc(x,y,3.5,0,7);g.fill()}
    g.strokeStyle='rgba(30,30,35,.8)';g.lineWidth=4;g.beginPath();g.arc(S/2,S/2,13,0,7);g.stroke()},
  ballast:(g,S,R,sd,li)=>{g.fillStyle=sd(.35);g.fillRect(0,0,S,S);for(let k=0;k<46;k++){const x=R()*S,y=R()*S,rx=14+R()*14,ry=10+R()*10,a=R()*3;
      for(const dx of[-S,0,S])for(const dy of[-S,0,S]){g.fillStyle=`rgba(${120+R()*40|0},${135+R()*35|0},${118+R()*30|0},1)`;g.beginPath();g.ellipse(x+dx,y+dy,rx,ry,a,0,7);g.fill();
        g.fillStyle='rgba(255,255,240,.18)';g.beginPath();g.ellipse(x+dx-rx*.25,y+dy-ry*.3,rx*.45,ry*.35,a,0,7);g.fill()}}},
};

// ---------- object textures ----------
const staveTex=()=>tex('stave',()=>{const t=canv(256,128,(g,w,h)=>{g.fillStyle='#8d5a32';g.fillRect(0,0,w,h);for(let x=0;x<w;x+=16){g.fillStyle=Math.random()<.5?'rgba(40,20,5,.15)':'rgba(255,230,190,.08)';g.fillRect(x,0,16,h);g.fillStyle='rgba(30,15,5,.5)';g.fillRect(x,0,1.5,h)}
  g.fillStyle='rgba(30,15,5,.7)';g.font='bold 30px Georgia,serif';g.textAlign='center';g.fillText('RUM',w*.25,h*.62);g.font='bold 18px Georgia,serif';g.fillText('XXX',w*.75,h*.6)});return t});
const parchTex=(L)=>tex('parch'+L,()=>canv(220*L,190,(g,w,h)=>{const R=Math.random;g.fillStyle='#e9d4a2';g.fillRect(0,0,w,h);
  for(let k=0;k<1800*L;k++){g.fillStyle=R()<.5?'rgba(120,80,30,.08)':'rgba(255,250,230,.12)';g.fillRect(R()*w,R()*h,2,2)}
  // sea hatching
  g.strokeStyle='rgba(70,90,110,.25)';g.lineWidth=1;for(let y=10;y<h;y+=9){g.beginPath();for(let x=0;x<w;x+=12){g.moveTo(x,y);g.quadraticCurveTo(x+3,y-3,x+6,y)}g.stroke()}
  // islands
  const isl=[];for(let k=0;k<L+1;k++)isl.push([w*(k+.5)/(L+1)+(R()-.5)*30,h*(.35+R()*.3),26+R()*22]);
  for(const [x,y,r] of isl){g.fillStyle='#d8bb7c';g.strokeStyle='#6b4a22';g.lineWidth=2.5;g.beginPath();for(let a=0;a<=24;a++){const an=a/24*TAU,rr=r*(.75+.35*Math.sin(an*3+x)*Math.cos(an*2+y));a?g.lineTo(x+Math.cos(an)*rr*1.3,y+Math.sin(an)*rr*.8):g.moveTo(x+Math.cos(an)*rr*1.3,y+Math.sin(an)*rr*.8)}g.closePath();g.fill();g.stroke();
    g.fillStyle='rgba(60,110,40,.55)';for(let k=0;k<5;k++){g.beginPath();g.arc(x+(R()-.5)*r,y+(R()-.5)*r*.5,4,0,7);g.fill()}}
  // dotted path to the X
  g.setLineDash([6,5]);g.strokeStyle='#9c1c14';g.lineWidth=2.5;g.beginPath();g.moveTo(isl[0][0],isl[0][1]);for(const p of isl.slice(1))g.quadraticCurveTo((p[0]+isl[0][0])/2,p[1]-40,p[0],p[1]);g.stroke();g.setLineDash([]);
  const X=isl[isl.length-1];g.strokeStyle='#b0160e';g.lineWidth=6;g.beginPath();g.moveTo(X[0]-10,X[1]-10);g.lineTo(X[0]+10,X[1]+10);g.moveTo(X[0]+10,X[1]-10);g.lineTo(X[0]-10,X[1]+10);g.stroke();
  rose(g,w-34,34,24,'rgba(90,60,30,.8)','rgba(200,160,90,.8)','rgba(90,60,30,.6)');
  // sea serpent doodle
  g.strokeStyle='rgba(60,70,60,.6)';g.lineWidth=3;g.beginPath();const sx=w*.15,sy=h*.85;g.moveTo(sx,sy);for(let k=1;k<6;k++)g.quadraticCurveTo(sx+k*12-6,sy-(k%2?14:-6),sx+k*12,sy);g.stroke();
  // burnt edges
  const gr=g.createRadialGradient(w/2,h/2,Math.min(w,h)*.3,w/2,h/2,Math.max(w,h)*.62);gr.addColorStop(0,'rgba(80,40,10,0)');gr.addColorStop(1,'rgba(80,40,10,.55)');g.fillStyle=gr;g.fillRect(0,0,w,h);
  g.strokeStyle='rgba(60,30,10,.7)';g.lineWidth=4;g.strokeRect(2,2,w-4,h-4)}));
const sailTex=()=>tex('sail',()=>canv(256,256,(g,w,h)=>{const R=Math.random;g.fillStyle='#f3e7cb';g.fillRect(0,0,w,h);
  for(let x=0;x<w;x+=32){g.fillStyle=R()<.5?'rgba(120,90,50,.05)':'rgba(255,255,255,.08)';g.fillRect(x,0,32,h);g.fillStyle='rgba(120,92,58,.28)';g.fillRect(x,0,2,h);g.fillRect(x+4,0,1,h)}
  g.fillStyle='rgba(90,65,40,.5)';for(let x=8;x<w;x+=16){g.beginPath();g.arc(x,26,2,0,7);g.fill();g.beginPath();g.arc(x,52,2,0,7);g.fill()}
  const gr=g.createLinearGradient(0,h*.6,0,h);gr.addColorStop(0,'rgba(120,90,50,0)');gr.addColorStop(1,'rgba(120,90,50,.22)');g.fillStyle=gr;g.fillRect(0,0,w,h);
  for(let k=0;k<2;k++){const x=40+R()*170,y=90+R()*120;g.fillStyle='rgba(215,195,150,.9)';g.fillRect(x,y,30,24);g.setLineDash([3,3]);g.strokeStyle='rgba(90,65,40,.5)';g.strokeRect(x+2,y+2,26,20);g.setLineDash([])}
  g.strokeStyle='rgba(150,120,80,.6)';g.lineWidth=6;g.strokeRect(0,0,w,h)}));
const flagTex=()=>tex('flag',()=>canv(256,160,(g,w,h)=>{g.fillStyle='#141212';g.fillRect(0,0,w,h);g.fillStyle='#f2ede0';g.strokeStyle='#f2ede0';
  const cx=w*.48,cy=h*.42;g.beginPath();g.ellipse(cx,cy,30,32,0,0,7);g.fill();g.fillRect(cx-17,cy+18,34,22);
  g.fillStyle='#141212';g.beginPath();g.ellipse(cx-12,cy,9,10,0,0,7);g.fill();g.beginPath();g.ellipse(cx+12,cy,9,10,0,0,7);g.fill();g.beginPath();g.moveTo(cx,cy+10);g.lineTo(cx-5,cy+19);g.lineTo(cx+5,cy+19);g.fill();
  for(let k=-2;k<=2;k++)g.fillRect(cx+k*7-1,cy+28,2,12);
  g.lineCap='round';g.lineWidth=11;g.beginPath();g.moveTo(cx-62,cy+40);g.lineTo(cx+62,cy+92);g.moveTo(cx+62,cy+40);g.lineTo(cx-62,cy+92);g.stroke();
  g.fillStyle='#f2ede0';for(const [x,y] of[[cx-64,cy+36],[cx-66,cy+46],[cx+64,cy+36],[cx+66,cy+46],[cx-64,cy+88],[cx-66,cy+98],[cx+64,cy+88],[cx+66,cy+98]]){g.beginPath();g.arc(x,y,7,0,7);g.fill()}
  g.fillStyle='rgba(0,0,0,0)';g.globalCompositeOperation='destination-out';for(let y=0;y<h;y+=10){g.beginPath();g.moveTo(w,y);g.lineTo(w-8-Math.random()*14,y+5);g.lineTo(w,y+10);g.fill()}}));
const dutchFlag=()=>tex('nl',()=>canv(48,32,(g,w,h)=>{g.fillStyle='#ae1c28';g.fillRect(0,0,w,h/3);g.fillStyle='#fff';g.fillRect(0,h/3,w,h/3);g.fillStyle='#21468b';g.fillRect(0,2*h/3,w,h/3)}));
const frondTex=()=>tex('frond',()=>canv(256,64,(g,w,h)=>{g.clearRect(0,0,w,h);g.strokeStyle='#ffffff';g.lineCap='round';
  for(let x=6;x<w-6;x+=5){const L=(h*.48)*Math.sin(Math.PI*x/w)**.6;g.lineWidth=3.2;g.beginPath();g.moveTo(x,h/2);g.lineTo(x+10,h/2-L);g.moveTo(x,h/2);g.lineTo(x+10,h/2+L);g.stroke()}
  g.lineWidth=4;g.beginPath();g.moveTo(0,h/2);g.lineTo(w,h/2);g.stroke()}));
const netTex=()=>tex('net',()=>{const t=canv(64,64,(g,w,h)=>{g.clearRect(0,0,w,h);g.strokeStyle='#e8d9b0';g.lineWidth=3;g.beginPath();g.moveTo(0,0);g.lineTo(w,h);g.moveTo(w,0);g.lineTo(0,h);g.stroke()},true);t.repeat.set(5,5);return t});

// ---------- reusable models ----------
function lantern(s=1){const g=new THREE.Group(),glass=gc('lglass',()=>new THREE.MeshStandardMaterial({color:'#ffcf7a',emissive:'#ffa233',emissiveIntensity:2.6,roughness:.3}));
  g.add(M(lathe([[0,0],[.07,0],[.08,.02],[.05,.04],[.06,.05],[0,.05]],10),IRON,0,0,0));
  g.add(M(new THREE.CylinderGeometry(.06,.05,.16,6),glass,0,.13,0));
  for(let k=0;k<6;k++){const a=k/6*TAU+PI/6;g.add(box(.012,.17,.012,IRON,Math.cos(a)*.06,.13,Math.sin(a)*.06))}
  g.add(M(new THREE.ConeGeometry(.085,.08,6),IRON,0,.25,0));g.add(M(new THREE.TorusGeometry(.025,.007,5,10),IRON,0,.31,0));
  g.scale.setScalar(s);return g}
function barrelGeo(r0,r1,L){return gc('bar'+[r0,r1,L],()=>{const p=[];for(let k=0;k<=10;k++){const y=k/10;p.push([r0+(r1-r0)*Math.sin(PI*y),y*L-L/2])}return lathe(p,18)})}
function palm(s,ctx,amp=.03){const g=new THREE.Group();const tr=new THREE.Group();g.add(tr);
  const trunkM=gc('palmTrunk',()=>new THREE.MeshStandardMaterial({color:'#8a6a48',roughness:.95,map:canv(32,64,(q,w,h)=>{q.fillStyle='#fff';q.fillRect(0,0,w,h);for(let y=0;y<h;y+=8){q.fillStyle='rgba(60,40,20,.45)';q.fillRect(0,y,w,2);q.fillStyle='rgba(255,240,210,.3)';q.fillRect(0,y+2,w,1)}},true)}));
  const pts=[];for(let k=0;k<=8;k++){const f=k/8;pts.push(V3(Math.sin(f*1.6)*.16*s,f*.82*s,Math.sin(f*1.2)*.04*s))}
  for(let k=0;k<8;k++){const r=(.05-.016*k/8)*s;tr.add(rod(pts[k],pts[k+1],r*.85,trunkM,8,r))}
  const crown=new THREE.Group();crown.position.copy(pts[8]);tr.add(crown);
  const fm=gc('frondM',()=>new THREE.MeshStandardMaterial({color:'#4f8f34',map:frondTex(),alphaTest:.5,side:THREE.DoubleSide,roughness:.8}));
  const fg=gc('frondG',()=>{const n=10,pos=[],uv=[],idx=[];for(let i=0;i<=n;i++){const f=i/n,x=f*.5,y=.12*f-.42*f*f,w=.12*Math.sin(PI*Math.min(1,f*1.1))**.7+.01;
      pos.push(x,y,-w, x,y+.025,0, x,y,w);uv.push(f,0,f,.5,f,1);if(i<n){const a=i*3;idx.push(a,a+3,a+1,a+1,a+3,a+4,a+1,a+4,a+2,a+2,a+4,a+5)}}
    const q=new THREE.BufferGeometry();q.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));q.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));q.setIndex(idx);q.computeVertexNormals();return q});
  for(let k=0;k<8;k++){const f=new THREE.Mesh(fg,fm);f.castShadow=true;f.scale.setScalar(s*(.9+.25*(k%3)/2));f.rotation.set(0,k/8*TAU+.3,(k%2?.25:-.05));crown.add(f)}
  for(let k=0;k<3;k++){const a=k/3*TAU;crown.add(ball(.035*s,mat('#5a3f22'),Math.cos(a)*.04*s,-.03*s,Math.sin(a)*.04*s,1))}
  crown.userData.sway=[amp*1.6,1.1+Math.random()*.4,Math.random()*6];tr.userData.sway=[amp*.5,.7+Math.random()*.3,Math.random()*6];
  return g}
// a small lofted boat hull (stern transom at -x, pointed bow at +x)
function boatGeo(len,beam,dep,trans=.45){return gc('boat'+[len,beam,dep,trans],()=>{const S=18,J=8,pos=[],uv=[],idx=[];
  for(let i=0;i<=S;i++){const s=i/S,x=-len/2+s*len;const b=beam/2*(s<.45?(trans+(1-trans)*Math.sin(s/.45*PI/2)):Math.sqrt(Math.max(0,1-((s-.45)/.55)**2)));
    const top=dep*.25*(2*s-1)**2*(s>.5?1.4:.6),d=dep*(s>.45?1-.55*((s-.45)/.55)**2:1);
    for(let j=0;j<=2*J;j++){const f=(j/J-1)*PI/2;pos.push(x,top-d*Math.cos(f),b*Math.sin(f));uv.push(s,j/(2*J))}}
  for(let i=0;i<S;i++)for(let j=0;j<2*J;j++){const a=i*(2*J+1)+j,c=a+2*J+1;idx.push(a,c,a+1,c,c+1,a+1)}
  // transom
  const base=pos.length/3;pos.push(-len/2,-dep*.4,0);uv.push(0,.5);for(let j=0;j<2*J;j++)idx.push(base,j,j+1);
  const q=new THREE.BufferGeometry();q.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));q.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));q.setIndex(idx);q.computeVertexNormals();return q})}
const boatTex=()=>tex('boatT',()=>canv(128,128,(g,w,h)=>{g.fillStyle='#8a5a33';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=11){g.fillStyle='rgba(40,20,8,.45)';g.fillRect(0,y,w,1.5)}
  g.fillStyle='#2f6d74';g.fillRect(0,0,w,12);g.fillRect(0,h-12,w,12);g.fillStyle='#e7d6a8';g.fillRect(0,12,w,3);g.fillRect(0,h-15,w,3)}));
function sail(w0,w1,h,bulge,mtl,sx=10,sy=8){const geo=new THREE.PlaneGeometry(1,1,sx,sy);const m=new THREE.Mesh(geo,mtl);m.castShadow=false;m.receiveShadow=true;
  const n=geo.attributes.position.count,uv=geo.attributes.uv;const U=new Float32Array(n),Vv=new Float32Array(n);for(let i=0;i<n;i++){U[i]=uv.getX(i);Vv[i]=1-uv.getY(i)}
  m.userData.sail={w0,w1,h,bulge,U,V:Vv,ph:Math.random()*6};return m}
function updSail(m,t){const s=m.userData.sail,p=m.geometry.attributes.position;
  for(let i=0;i<s.U.length;i++){const u=s.U[i],v=s.V[i];const w=s.w0+(s.w1-s.w0)*v;const x=(u-.5)*w;
    let y=-v*s.h+Math.sin(PI*u)*v**4*.12*s.h;const puff=1+.07*Math.sin(t*1.05+s.ph)+.03*Math.sin(t*2.3+s.ph*2);
    const z=-s.bulge*puff*Math.sin(PI*u)**.85*Math.sin(PI*(v*.82+.12))+.018*Math.sin(t*3.1+v*7+u*5+s.ph)*v;
    p.setXYZ(i,x,y,z)}
  p.needsUpdate=true;m.geometry.computeVertexNormals()}
function flagMesh(w,h,mtl,sx=12,sy=6){const geo=new THREE.PlaneGeometry(w,h,sx,sy);geo.translate(w/2,0,0);const m=new THREE.Mesh(geo,mtl);m.castShadow=true;
  m.userData.flag={base:geo.attributes.position.array.slice(),w,ph:Math.random()*6};return m}
function updFlag(m,t,sp=4.2){const f=m.userData.flag,p=m.geometry.attributes.position,b=f.base;
  for(let i=0;i<p.count;i++){const x=b[i*3],y=b[i*3+1],k=x/f.w;p.setXYZ(i,x-k*k*.04*f.w,y-k*k*.08*f.w+Math.sin(t*sp*.7+x*5+f.ph)*.02*k,Math.sin(x*6/f.w*2.2-t*sp+f.ph)*.09*f.w*k+Math.sin(x*11/f.w-t*sp*1.6+y*3)*.02*f.w*k)}
  p.needsUpdate=true;m.geometry.computeVertexNormals()}

// ---------- the 21 objects ----------
const OBJ={
  stoel:{name:'kruk',verb:'Zat',h:.31,build(){const g=new THREE.Group();
    g.add(M(lathe([[0,0],[.19,0],[.205,.015],[.2,.04],[.17,.05],[0,.05]],20),WD,0,.26,0));
    for(let k=0;k<3;k++){const a=k/3*TAU+.4;g.add(rod(V3(Math.cos(a)*.1,.27,Math.sin(a)*.1),V3(Math.cos(a)*.18,0,Math.sin(a)*.18),.022,DW,7,.028))}
    g.add(M(new THREE.TorusGeometry(.14,.013,5,18),ROPE(),0,.11,0,PI/2));
    for(let k=0;k<6;k++){const a=k/6*TAU;g.add(ball(.012,BRASS,Math.cos(a)*.17,.305,Math.sin(a)*.17,0))}
    return bake(g)}},
  troon:{name:'kapiteinsstoel',de:true,verb:'Zat',h:.38,build(){const g=new THREE.Group();
    g.add(M(rbox(.56,.27,.56,.05),DW,0,.03,0));g.add(M(rbox(.59,.03,.59,.05),GLD,0,.27,0));g.add(M(rbox(.5,.08,.5,.06,.025),VEL,0,.3,0));
    for(const [a,b] of[[1,1],[1,-1],[-1,1],[-1,-1]])g.add(ball(.045,GLD,a*.25,.035,b*.25,1));
    const bs=new THREE.Shape();bs.moveTo(-.27,0);bs.lineTo(.27,0);bs.lineTo(.27,.5);bs.quadraticCurveTo(.3,.62,.2,.66);bs.quadraticCurveTo(.1,.56,0,.62);bs.quadraticCurveTo(-.1,.56,-.2,.66);bs.quadraticCurveTo(-.3,.62,-.27,.5);bs.closePath();
    const bg=new THREE.ExtrudeGeometry(bs,{depth:.06,bevelEnabled:true,bevelThickness:.015,bevelSize:.015,bevelSegments:2,curveSegments:6});bg.rotateY(PI/2);
    g.add(M(bg,DW,-.28,.3,0,0,0,.08));
    const pad=new THREE.ExtrudeGeometry(roundRect(.34,.36,.08),{depth:.03,bevelEnabled:true,bevelThickness:.015,bevelSize:.015,bevelSegments:2});pad.rotateY(PI/2);g.add(M(pad,VEL,-.22,.6,0,0,0,.08));
    for(let i=0;i<3;i++)for(let j=0;j<3;j++)g.add(ball(.012,GLD,-.185+(.06+j*.12)*.08,.48+j*.12,-.12+i*.12,0));
    // skull crest
    g.add(ball(.065,GLD,-.27,1.0,0,2));g.add(box(.05,.05,.07,GLD,-.27,.95,0));
    for(const z of[-.025,.025])g.add(ball(.018,BLK,-.215,1.0,z,0));
    for(const s of[-1,1]){const b=rod(V3(-.27,.9,-.13*s),V3(-.27,1.06,.13*s),.012,GLD,6);g.add(b)}
    for(const z of[-.27,.27]){g.add(M(rbox(.46,.04,.07,.02),DW,0,.5,z));g.add(box(.05,.16,.05,DW,.18,.42,z));g.add(ball(.04,GLD,.22,.53,z,1))}
    return bake(g)}},
  tafel:{name:'scheepstafel',de:true,build(L){const g=new THREE.Group();const w=L-.16;
    g.add(M(rbox(w,.06,.74,.04),WD,0,.4,0));g.add(M(rbox(w+.02,.015,.76,.04),DW,0,.395,0));
    for(const x of[-w/2+.12,w/2-.12]){for(const s of[-1,1]){const l=box(.05,.46,.05,DW,x,.2,0);l.rotation.x=s*.55;g.add(l)}g.add(box(.06,.05,.66,DW,x,.03,0))}
    g.add(box(w-.2,.05,.05,DW,0,.2,0));
    const mp=new THREE.Mesh(new THREE.PlaneGeometry(.46,.34),new THREE.MeshStandardMaterial({map:parchTex(1),roughness:.9}));mp.rotation.set(-PI/2,0,.18);mp.position.set(-w*.12,.462,.05);mp.receiveShadow=true;g.add(mp);
    // dagger stuck in the table
    const dg=new THREE.Group();dg.position.set(-w*.12+.05,.46,.08);dg.rotation.z=.12;dg.add(box(.012,.12,.03,STEEL,0,.04,0));dg.add(box(.02,.015,.09,BRASS,0,.105,0));dg.add(cyl(.012,.012,.08,BLK,0,.15,0,6));dg.add(ball(.017,BRASS,0,.195,0,0));g.add(dg);
    // compass, tankard, candle
    g.add(cyl(.06,.065,.03,BRASS,w*.18,.475,-.2,16));g.add(cyl(.05,.05,.004,mat('#f4ead2'),w*.18,.492,-.2,16));g.add(box(.006,.003,.08,RED,w*.18,.496,-.2));
    g.add(cyl(.045,.05,.11,mat('#9aa0a6',{metalness:.85,roughness:.35}),w*.3,.515,.18,12));const hd=M(new THREE.TorusGeometry(.03,.008,5,10,PI),mat('#9aa0a6',{metalness:.85,roughness:.35}),w*.3+.05,.515,.18,0,0,-PI/2);g.add(hd);
    if(L>1){g.add(M(lathe([[0,0],[.04,0],[.045,.1],[.02,.16],[.014,.22],[0,.22]],10),mat('#2d5a2a',{roughness:.12,metalness:.3}),-w*.38,.43,-.18));for(let k=0;k<6;k++)g.add(cyl(.025,.025,.008,GLD,w*.35+Math.random()*.06,.435+k*.009,-.1,10))}
    bake(g);g.add(candle(-w*.32+(L>1?.0:.12),-.22,.12,.43));return g}},
  bed:{name:'hangmat',verb:'Lag',h:.37,build(L,ctx){const g=new THREE.Group();const w=L-.12,px=w/2-.05;
    for(const s of[-1,1]){g.add(cyl(.04,.05,.78,DW,s*px,.39,0,10));g.add(ball(.045,DW,s*px,.8,0,1));g.add(box(.08,.04,.36,DW,s*px,.02,0));g.add(M(new THREE.TorusGeometry(.045,.01,5,12),IRON,s*px,.72,0,0,PI/2))}
    bake(g);
    const sw=keep(new THREE.Group());sw.position.y=.74;g.add(sw);
    const ws=w-.62,seg=16,pos=[],uv=[],idx=[];for(let i=0;i<=seg;i++)for(let j=0;j<=6;j++){const u=i/seg,v=j/6,x=(u-.5)*ws,z=(v-.5)*.6;pos.push(x,.35-.74+.13*(2*u-1)**2+.08*(2*v-1)**2,z);uv.push(u*3,v);if(i<seg&&j<6){const a=i*7+j;idx.push(a,a+7,a+1,a+1,a+7,a+8)}}
    const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));sg.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));sg.setIndex(idx);sg.computeVertexNormals();
    const cm=gc('hamM',()=>new THREE.MeshStandardMaterial({side:THREE.DoubleSide,roughness:.95,map:canv(64,64,(q,W,Hh)=>{q.fillStyle='#e8dcc0';q.fillRect(0,0,W,Hh);for(let y=4;y<Hh;y+=16){q.fillStyle='#b23a2e';q.fillRect(0,y,W,5)}},true)}));
    sw.add(M(sg,cm));
    for(const s of[-1,1])for(let k=0;k<5;k++){sw.add(rod(V3(s*(px-.03),-.02,0),V3(s*(ws/2),.35-.74+.13+.08*((k/4)*2-1)**2,(k/4-.5)*.56),.006,ROPE(),4))}
    sw.add(M(rbox(.2,.07,.34,.03),CREAM,-ws/2+.18,.36-.74+.06,0));const bl=M(new THREE.CylinderGeometry(.05,.05,.5,10),mat('#3e5a7a',{roughness:.95}),ws/2-.16,.36-.74+.1,0,PI/2);sw.add(bl);
    bake(sw);const ph=Math.random()*6;ctx.anim(t=>{sw.rotation.x=Math.sin(t*.8+ph)*.035});return g}},
  tapijt:{name:'schatkaart',verb:'Stond',h:.026,blob:false,build(L){const g=new THREE.Group();const w=L-.14;
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,.78),new THREE.MeshStandardMaterial({map:parchTex(L),roughness:.92}));m.rotation.x=-PI/2;m.position.y=.02;m.receiveShadow=true;g.add(m);
    const pm=mat('#d9c08c',{roughness:.9});for(const s of[-1,1]){const r=M(new THREE.CylinderGeometry(.028,.028,.8,12),pm,s*(w/2+.01),.03,0,PI/2);g.add(r)}return g}},
  bank:{name:'scheepsbank',de:true,verb:'Zat',h:.31,build(){const g=new THREE.Group();
    g.add(M(rbox(.84,.06,.32,.03),WD,0,.25,0));
    const ts=new THREE.Shape();ts.moveTo(-.15,0);ts.lineTo(-.06,0);ts.quadraticCurveTo(0,.09,.06,0);ts.lineTo(.15,0);ts.lineTo(.12,.25);ts.lineTo(-.12,.25);ts.closePath();
    const tg=new THREE.ExtrudeGeometry(ts,{depth:.05,bevelEnabled:true,bevelThickness:.008,bevelSize:.008,bevelSegments:1});tg.rotateY(PI/2);
    for(const x of[-.3,.3])g.add(M(tg,DW,x-.025,0,0));
    for(const x of[-.34,.34]){g.add(box(.05,.36,.05,DW,x,.43,-.13));g.add(box(.02,.2,.06,IRON,x,.27,-.1))}
    g.add(M(rbox(.82,.13,.05,.02),WD,0,.47,-.14));g.add(box(.82,.025,.055,DW,0,.6,-.14));
    // anchor emblem
    g.add(box(.012,.08,.01,GLD,0,.54,-.11));g.add(M(new THREE.TorusGeometry(.03,.006,4,10,PI),GLD,0,.52,-.11,0,0,PI));g.add(box(.05,.008,.01,GLD,0,.575,-.11));
    return bake(g)}},
  paard:{name:'sloep',verb:'Zat',h:.32,build(){const g=new THREE.Group();
    const bm=gc('boatM',()=>new THREE.MeshStandardMaterial({map:boatTex(),side:THREE.DoubleSide,roughness:.7}));
    g.add(M(boatGeo(.9,.46,.26),bm,0,.38,0));
    for(const x of[-.2,.22])g.add(box(.08,.12,.4,DW,x,.06,0));
    g.add(box(.08,.025,.42,LW,0,.3,0));g.add(box(.07,.025,.36,LW,-.27,.3,0));g.add(box(.06,.025,.26,LW,.27,.3,0));
    for(const s of[-1,1]){const o=new THREE.Group();o.position.set(0,.235,s*.11);o.rotation.y=s*.06;o.add(cyl(.012,.012,.86,LW,0,0,0,6));o.children[0].rotation.z=PI/2;o.add(box(.18,.008,.06,LW,.48,0,0));g.add(o)}
    // rim
    const rim=[];for(let k=0;k<=24;k++){const s=k/24,x=-.45+s*.9;const b=.23*(s<.45?(.45+.55*Math.sin(s/.45*PI/2)):Math.sqrt(Math.max(0,1-((s-.45)/.55)**2)));rim.push(V3(x,.38+.26*.25*(2*s-1)**2*(s>.5?1.4:.6),b))}
    for(const sg of[-1,1]){const c=new THREE.CatmullRomCurve3(rim.map(p=>V3(p.x,p.y,p.z*sg)));g.add(M(new THREE.TubeGeometry(c,24,.016,5),DW))}
    return bake(g)}},
  kist:{name:'schatkist',de:true,build(L,ctx){const g=new THREE.Group();const cw=mat('#6a3a1c',{roughness:.6});
    g.add(M(rbox(.56,.28,.38,.03),cw,0,0,0));
    for(const x of[-.2,0,.2])g.add(M(rbox(.045,.29,.395,.01),IRON,x,0,0));
    const lid=new THREE.Group();lid.position.set(0,.28,-.19);lid.rotation.x=-1.9;
    const lg=new THREE.CylinderGeometry(.19,.19,.56,16,1,false,0,PI);lg.rotateZ(PI/2);const l=M(lg,cw,0,0,.19);l.material.side=THREE.DoubleSide;lid.add(l);
    for(const x of[-.2,.2]){const b=M(new THREE.TorusGeometry(.19,.014,5,16,PI),IRON,x,0,.19,0,PI/2,0);lid.add(b)}g.add(lid);
    // the hoard
    const gm=ball(.24,GLD,0,.24,0,2);gm.scale.set(1.08,.42,.68);g.add(gm);
    const coin=gc('coin',()=>new THREE.CylinderGeometry(.03,.03,.008,12));
    for(let k=0;k<22;k++){const a=Math.random()*TAU,r=Math.random();const inside=k<12;const c=M(coin,GLD,inside?Math.cos(a)*.22*r:Math.cos(a)*(.3+r*.12),inside?.3+Math.random()*.03:.004+Math.random()*.01,inside?Math.sin(a)*.12*r:Math.sin(a)*(.24+r*.1),Math.random()*.6,0,Math.random()*.6);g.add(c)}
    g.add(cyl(.04,.035,.06,GLD,.08,.33,.04,10));g.add(cyl(.012,.012,.05,GLD,.08,.38,.04,6));g.add(cyl(.045,.04,.015,GLD,.08,.41,.04,10));
    const gems=[['#ff2a4a'],['#2ae07a'],['#3a8cff'],['#ffffff']];gems.forEach(([c],k)=>g.add(M(new THREE.OctahedronGeometry(.028),mat(c,{emissive:c,emissiveIntensity:.9,roughness:.1,metalness:.2}),-.15+k*.09,.335,(k%2?.05:-.04))));
    for(let k=0;k<14;k++){const a=k/13*PI*1.2;g.add(ball(.011,mat('#fbf6ee',{roughness:.2}),.28+Math.cos(a)*.04-.02,.2-k*.014,.17+Math.sin(a)*.03,0))}
    g.add(box(.07,.07,.02,BRASS,0,.2,.2));
    bake(g);
    const gl=[];for(let k=0;k<3;k++){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:'#fff2b0',blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));sp.position.set(-.12+k*.12,.34,(k-1)*.04);g.add(sp);gl.push(sp)}
    const ph=Math.random()*6;ctx.anim(t=>gl.forEach((s,k)=>{const v=Math.max(0,Math.sin(t*1.7+k*2.1+ph))**12;s.scale.setScalar(.02+v*.16)}));return g}},
  ton:{name:'rumvat',build(L,ctx){const g=new THREE.Group();const sm_=gc('staveM',()=>new THREE.MeshStandardMaterial({map:staveTex(),roughness:.6}));
    const b=M(barrelGeo(.165,.205,.54),sm_,0,.29,0,0,0,PI/2);g.add(b);
    for(const x of[-.22,-.08,.08,.22]){const r=.165+(.205-.165)*Math.sin(PI*(x/.54+.5));g.add(M(new THREE.TorusGeometry(r+.004,.011,5,20),IRON,x,.29,0,0,PI/2))}
    for(const x of[-.271,.271])g.add(M(new THREE.CircleGeometry(.163,18),mat('#6b4022'),x,.29,0,0,x>0?PI/2:-PI/2));
    for(const x of[-.16,.16]){g.add(box(.07,.1,.36,DW,x,.05,.0));}
    g.add(cyl(.018,.018,.07,BRASS,.3,.24,0,8));g.children[g.children.length-1].rotation.z=PI/2;g.add(box(.012,.04,.012,BRASS,.33,.26,0));
    g.add(cyl(.038,.034,.07,mat('#8d8f92',{metalness:.8,roughness:.4}),.36,.035,0,10));
    bake(g);
    const drop=new THREE.Mesh(new THREE.SphereGeometry(.009,6,4),mat('#7a3a10',{roughness:.1,emissive:'#3a1500'}));g.add(drop);const ph=Math.random()*5;
    ctx.anim(t=>{const p=((t+ph)%3.2)/3.2;const f=Math.max(0,(p-.75)/.25);drop.position.set(.335,.22-f*f*.15,0);drop.visible=p>.6;drop.scale.setScalar(p<.75?(p-.6)/.15:1)});return g}},
  hooibaal:{name:'touwrol',de:true,build(){const g=new THREE.Group();const rm=ROPE();
    for(let k=0;k<6;k++)g.add(M(new THREE.TorusGeometry(.1+k*.042,.024,6,28),rm,0,.026,0,PI/2));
    for(let k=0;k<4;k++)g.add(M(new THREE.TorusGeometry(.12+k*.042,.024,6,28),rm,0,.072,0,PI/2));
    for(let k=0;k<2;k++)g.add(M(new THREE.TorusGeometry(.15+k*.042,.024,6,28),rm,0,.118,0,PI/2));
    const c=new THREE.CatmullRomCurve3([V3(.33,.03,0),V3(.38,.02,.15),V3(.3,.02,.3),V3(.12,.02,.36)]);g.add(M(new THREE.TubeGeometry(c,16,.024,6),rm));
    // pulley block on top
    g.add(M(rbox(.1,.14,.06,.03),WD,.0,.14,0));g.add(cyl(.035,.035,.065,IRON,0,.21,0,10));g.children[g.children.length-1].rotation.x=PI/2;
    g.add(M(new THREE.TorusGeometry(.03,.008,5,10),IRON,0,.3,0));
    g.add(rod(V3(-.3,.012,.28),V3(-.05,.012,.38),.014,LW,6,.02));
    return bake(g)}},
  boom:{name:'palmboom',de:true,build(L,ctx){const g=new THREE.Group();
    g.add(M(lathe([[0,0],[.2,0],[.24,.12],[.26,.26],[.24,.26],[0,.26]],18),mat('#7a4a28',{roughness:.7,map:staveTex()}),0,0,0));
    for(const y of[.05,.2])g.add(M(new THREE.TorusGeometry(.22+y*.15,.01,5,20),IRON,0,y,0,PI/2));
    g.add(cyl(.235,.235,.01,mat('#dcc08a',{roughness:1}),0,.245,0,18));
    bake(g);const p=palm(1,ctx);p.position.y=.24;g.add(p);bake(p.children[0]);return g}},
  struik:{name:'visnet',build(L,ctx){const g=new THREE.Group();
    const mg=new THREE.IcosahedronGeometry(.27,3),pp=mg.attributes.position;for(let i=0;i<pp.count;i++){const x=pp.getX(i),y=pp.getY(i),z=pp.getZ(i);const f=1+.16*Math.sin(x*14+z*9)+.1*Math.sin(y*17+x*5);pp.setXYZ(i,x*f,Math.max(-.02,y*f),z*f)}mg.computeVertexNormals();
    const base=M(mg,mat('#6e5a3e',{roughness:1}),0,.05,0);base.scale.set(1,.5,.82);g.add(base);
    const net=M(mg,gc('netM',()=>new THREE.MeshStandardMaterial({color:'#efe0b8',map:netTex(),alphaTest:.5,side:THREE.DoubleSide,roughness:1})),0,.05,0);net.scale.set(1.04,.53,.86);g.add(net);
    const glass=[mat('#2fae8a',{roughness:.08,metalness:.2,emissive:'#0b4a3a',emissiveIntensity:.6}),mat('#3d7fd6',{roughness:.08,metalness:.2,emissive:'#0c2a5a',emissiveIntensity:.6})];
    for(const [x,z,k] of[[.16,.08,0],[-.12,.12,1],[.02,-.12,0]]){g.add(ball(.065,glass[k],x,.17,z,2));g.add(M(new THREE.TorusGeometry(.066,.006,4,14),ROPE(),x,.17,z,PI/2))}
    for(let k=0;k<4;k++){const a=-.6+k*.45;g.add(M(new THREE.CylinderGeometry(.03,.03,.05,10),mat('#c98f4e',{roughness:1}),Math.cos(a)*.32,.03,Math.sin(a)*.3,0,0,PI/2))}
    bake(g);
    // a crab that waves its claws
    const cr=keep(new THREE.Group());cr.position.set(-.28,0,-.22);cr.rotation.y=.7;g.add(cr);const cm=mat('#d4502c',{roughness:.5});
    const bd=ball(.05,cm,0,.04,0,1);bd.scale.set(1.3,.55,1);cr.add(bd);for(const s of[-1,1]){for(let k=0;k<3;k++)cr.add(rod(V3(-.03+k*.03,.035,s*.04),V3(-.04+k*.035,0,s*.09),.006,cm,4));cr.add(cyl(.004,.004,.04,cm,.03,.07,s*.015,4));cr.add(ball(.008,BLK,.03,.09,s*.015,0))}
    const claws=[];for(const s of[-1,1]){const c=new THREE.Group();c.position.set(.05,.04,s*.045);c.add(rod(V3(0,0,0),V3(.05,.01,s*.02),.008,cm,4));const pin=ball(.022,cm,.06,.015,s*.025,0);pin.scale.set(1.2,.7,.8);c.add(pin);cr.add(c);claws.push(c)}
    const ph=Math.random()*6;ctx.anim(t=>{const w=Math.sin(t*1.3+ph);claws[0].rotation.z=.3+Math.max(0,w)*.5;claws[1].rotation.z=.3+Math.max(0,-w)*.5;cr.position.x=-.28+Math.sin(t*.4+ph)*.025});return g}},
  put:{name:'kaapstander',de:true,build(L,ctx){const g=new THREE.Group();
    g.add(cyl(.33,.35,.05,DW,0,.025,0,24));for(let k=0;k<8;k++){const a=k/8*TAU;g.add(box(.06,.05,.04,IRON,Math.cos(a)*.27,.07,Math.sin(a)*.27))}
    bake(g);
    const r=keep(new THREE.Group());g.add(r);
    r.add(M(lathe([[0,.05],[.23,.05],[.2,.12],[.17,.27],[.19,.42],[.26,.45],[.27,.6],[.24,.62],[0,.62]],20),WD));
    for(let k=0;k<8;k++){const a=k/8*TAU;const b=box(.045,.1,.03,DW,Math.cos(a)*.2,.27,Math.sin(a)*.2);b.rotation.y=-a;r.add(b)}
    r.add(M(lathe([[0,.62],[.17,.62],[.15,.66],[.06,.69],[0,.69]],16),BRASS));
    for(let k=0;k<4;k++){const a=k/4*TAU;r.add(box(.035,.04,.035,BLK,Math.cos(a)*.27,.54,Math.sin(a)*.27))}
    for(const a of[0,PI/2]){const b=box(.88,.04,.04,LW,0,.54,0);b.rotation.y=a;r.add(b)}
    for(let k=0;k<3;k++)r.add(M(new THREE.TorusGeometry(.175+(k===1?-.005:0),.022,6,22),ROPE(),0,.16+k*.045,0,PI/2));
    bake(r);ctx.anim(t=>{r.rotation.y=t*.12});return g}},
  kast:{name:'kippenhok',build(L,ctx){const g=new THREE.Group();const w=.66,d=.46,h=.52;
    for(const [x,z] of[[1,1],[1,-1],[-1,1],[-1,-1]])g.add(box(.05,h,.05,DW,x*(w/2-.025),h/2,z*(d/2-.025)));
    g.add(M(rbox(w+.04,.04,d+.04,.02),WD,0,h,0));g.add(box(w,.03,d,LW,0,.03,0));g.add(box(w,h-.04,.02,WD,0,h/2,-d/2+.01));
    for(const x of[-1,1])g.add(box(.02,h-.04,d,WD,x*(w/2-.01),h/2,0));
    for(let k=0;k<9;k++)g.add(box(.018,h-.06,.018,LW,-w/2+.07+k*(w-.14)/8,h/2,d/2-.01));
    g.add(box(w,.04,.03,DW,0,h*.62,d/2-.005));
    g.add(box(w-.06,.02,d-.06,mat('#e2c56a',{roughness:1}),0,.055,0));
    g.add(ball(.03,mat('#f6eedc'),.18,.08,.05,1));
    bake(g);
    const hens=[];const hen=(x,y,z,ry,col)=>{const c=keep(new THREE.Group());c.position.set(x,y,z);c.rotation.y=ry;const bm=mat(col,{roughness:.9});
      const b=ball(.08,bm,0,.08,0,1);b.scale.set(1.25,.95,.85);c.add(b);const tl=M(new THREE.ConeGeometry(.05,.1,6),bm,-.1,.13,0,0,0,.9);c.add(tl);
      for(const s of[-1,1])c.add(cyl(.005,.005,.05,mat('#e0a030'),-.01,.02,s*.03,4));
      const hd=new THREE.Group();hd.position.set(.08,.15,0);c.add(hd);hd.add(ball(.04,bm,.02,.03,0,1));hd.add(M(new THREE.ConeGeometry(.012,.03,5),mat('#e8a12a'),.065,.03,0,0,0,-PI/2));
      hd.add(box(.04,.025,.008,mat('#d0202a'),.015,.075,0));hd.add(box(.01,.025,.01,mat('#d0202a'),.05,.005,0));for(const s of[-1,1])hd.add(ball(.006,BLK,.045,.04,s*.02,0));
      bake(c);g.add(c);hens.push({c,hd,ph:Math.random()*6})};
    hen(-.12,.06,0,.3,'#f3efe6');hen(.0,h+.02,.02,-.6,'#b26a32');
    ctx.anim(t=>{for(const q of hens){const p=(t*.7+q.ph)%4;const peck=p<.5?Math.sin(p/.5*PI):0;q.hd.rotation.z=-peck*.9;q.hd.rotation.y=Math.sin(t*.9+q.ph)*.4*(1-peck);q.c.position.y+=0}});return g}},
  boekenkast:{name:'kaartenrek',build(){const g=new THREE.Group();const w=.7,h=.96,d=.34;
    g.add(box(w,.04,d,DW,0,.02,0));g.add(M(rbox(w+.04,.04,d+.03,.02),WD,0,h,0));for(const x of[-1,1])g.add(box(.04,h,d,WD,x*(w/2-.02),h/2,0));g.add(box(w,h,.02,DW,0,h/2,-d/2+.01));
    for(let k=1;k<4;k++)g.add(box(w-.06,.02,d-.02,WD,0,k*h/4,0));for(const x of[-.11,.11])g.add(box(.02,h-.04,d-.02,WD,x,h/2,0));
    const pm=[mat('#ead6a6',{roughness:.9}),mat('#d9bf86',{roughness:.9}),mat('#f0e2be',{roughness:.9})];
    for(let r=0;r<4;r++)for(let c=0;c<3;c++){const n=1+Math.floor(Math.random()*3);for(let k=0;k<n;k++){const x=-.22+c*.22+(k-(n-1)/2)*.06,y=r*h/4+.06+(k%2)*.05;
      g.add(M(new THREE.CylinderGeometry(.028,.028,.34,10),pm[(r+c+k)%3],x,y,.02,PI/2));g.add(M(new THREE.TorusGeometry(.029,.006,4,10),RED,x,y,.1))}}
    // telescope on top
    g.add(M(lathe([[0,0],[.025,0],[.025,.14],[.032,.14],[.032,.26],[.038,.26],[.04,.36],[0,.36]],10),BRASS,-.18,h+.06,.02,0,0,-PI/2+.05));
    return bake(g)}},
  harnas:{name:'kanon',build(L,ctx){const g=new THREE.Group();
    const cs=new THREE.Shape();cs.moveTo(-.25,0);cs.lineTo(.25,0);cs.lineTo(.25,.12);cs.lineTo(.1,.12);cs.lineTo(.1,.2);cs.lineTo(-.06,.2);cs.lineTo(-.06,.16);cs.lineTo(-.25,.16);cs.closePath();
    const cg=new THREE.ExtrudeGeometry(cs,{depth:.05,bevelEnabled:true,bevelThickness:.008,bevelSize:.008,bevelSegments:1});
    for(const z of[-.15,.1])g.add(M(cg,WD,0,.06,z));
    g.add(box(.5,.04,.26,DW,0,.08,0));for(const x of[-.17,.17]){g.add(box(.06,.05,.42,DW,x,.07,0));for(const z of[-.2,.2])g.add(M(new THREE.CylinderGeometry(.065,.065,.04,14),DW,x,.065,z,PI/2))}
    const br=lathe([[0,0],[.03,0],[.03,.03],[.08,.04],[.095,.07],[.09,.12],[.098,.13],[.085,.16],[.08,.3],[.088,.31],[.068,.33],[.06,.55],[.072,.6],[.07,.64],[.045,.64],[.045,.5],[0,.5]],18);
    g.add(M(br,IRON,-.24,.27,0,0,0,-PI/2));g.add(M(new THREE.CylinderGeometry(.025,.025,.3,8),IRON,.0,.24,0,PI/2));
    g.add(ball(.025,IRON,-.27,.27,0,0));
    for(const [x,y,z] of[[-.2,.055,.33],[-.09,.055,.33],[-.145,.055,.23],[-.145,.14,.3]])g.add(ball(.055,IRON,x,y,z,1));
    g.add(rod(V3(.18,0,-.32),V3(.05,.42,-.27),.01,LW,5));
    bake(g);g.add(flame(.05,.42,-.27,.7));return g}},
  altaar:{name:'afgodsbeeld',build(L,ctx){const g=new THREE.Group();const stone=gc('idolStone',()=>new THREE.MeshStandardMaterial({map:stoneTex,color:'#9a9282',roughness:.95}));
    const gm=mat('#c99632',{metalness:.85,roughness:.35});
    g.add(M(rbox(.52,.28,.46,.04),stone,0,0,0));g.add(M(rbox(.56,.04,.5,.03),stone,0,.28,0));
    g.add(M(rbox(.24,.07,.22,.03),gm,0,.32,0));g.add(cyl(.1,.12,.2,gm,0,.48,0,12));for(const y of[.42,.52])g.add(M(new THREE.TorusGeometry(.11,.012,5,16),gm,0,y,0,PI/2));
    for(const s of[-1,1])g.add(M(rbox(.05,.04,.16,.02),gm,.09,.47,s*.04));
    g.add(M(rbox(.28,.26,.24,.07,.02),gm,0,.58,0));g.add(box(.05,.04,.24,gm,.13,.76,0));
    g.add(box(.03,.05,.16,BLK,.135,.64,0));for(let k=0;k<5;k++)g.add(box(.012,.018,.022,CREAM,.15,.66,-.06+k*.03));
    for(const s of[-1,1])g.add(M(new THREE.TorusGeometry(.035,.012,5,10),gm,0,.7,s*.13));
    for(let k=0;k<4;k++)g.add(cyl(.025,.025,.03+k*.01,GLD,.18,.315+k*.005,-.17+k*.11,10));
    const eyeM=new THREE.MeshStandardMaterial({color:'#7dffb0',emissive:'#36ff84',emissiveIntensity:2.2,roughness:.2});
    for(const s of[-1,1])g.add(M(new THREE.OctahedronGeometry(.026),eyeM,.14,.715,s*.055));
    bake(g);g.add(candle(.2,.18,.08,.3));g.add(candle(.2,-.19,.11,.3));
    const ph=Math.random()*6;ctx.anim(t=>{eyeM.emissiveIntensity=1.6+1.6*(.5+.5*Math.sin(t*1.4+ph))**3});return g}},
  kandelaar:{name:'lantaarn',de:true,build(L,ctx){const g=new THREE.Group();
    for(const a of[0,PI/2]){const b=M(rbox(.4,.04,.07,.02),DW,0,0,0,0,a,0);g.add(b)}
    g.add(cyl(.03,.035,.82,WD,0,.41,0,8));g.add(box(.22,.03,.03,DW,.09,.8,0));g.add(rod(V3(.02,.66,0),V3(.16,.8,0),.01,DW,5));
    bake(g);const hg=keep(new THREE.Group());hg.position.set(.18,.79,0);g.add(hg);
    hg.add(cyl(.004,.004,.08,IRON,0,-.04,0,4));const ln=lantern(1.05);ln.position.y=-.4;hg.add(ln);bake(ln);
    const fl=flame(0,-.29,0,1.5);hg.add(fl);hg.userData.sway=[.06,1.1+Math.random()*.3,Math.random()*6];return g}},
  wapenrek:{name:'sabelrek',build(){const g=new THREE.Group();
    for(const x of[-.32,.32]){g.add(box(.05,.82,.06,DW,x,.41,0));g.add(box(.12,.04,.2,DW,x,.02,0))}
    g.add(M(rbox(.72,.05,.08,.02),WD,0,.8,0));g.add(box(.68,.04,.05,WD,0,.2,0));
    const bs=new THREE.Shape();bs.moveTo(0,0);bs.lineTo(.026,0);bs.quadraticCurveTo(.05,-.25,.0,-.5);bs.quadraticCurveTo(.0,-.25,-.004,0);bs.closePath();
    const bg=new THREE.ExtrudeGeometry(bs,{depth:.006,bevelEnabled:false,curveSegments:8});
    for(const x of[-.17,0,.17]){g.add(M(bg,STEEL,x-.012,.7,.03));g.add(M(new THREE.TorusGeometry(.04,.007,5,12,PI*1.1),BRASS,x,.73,.034,0,0,.3));g.add(cyl(.012,.014,.09,mat('#2a1810'),x,.77,.034,6));g.add(ball(.017,BRASS,x,.82,.034,0))}
    // tricorn hat on a post
    const hat=new THREE.Group();hat.position.set(.32,.84,0);hat.add(M(new THREE.CylinderGeometry(.18,.18,.025,3),mat('#1d1a1c',{roughness:.9}),0,.01,0));hat.add(M(new THREE.TorusGeometry(.105,.012,4,3),GLD,0,.03,0,PI/2,0,PI/6));hat.add(M(lathe([[0,0],[.085,0],[.08,.08],[.04,.11],[0,.11]],12),mat('#1d1a1c',{roughness:.9}),0,.02,0));g.add(hat);
    return bake(g)}},
  wijnrek:{name:'flessenrek',build(L,ctx){const g=new THREE.Group();const w=.68,h=.6,d=.3;
    for(const x of[-1,1])g.add(box(.04,h,d,WD,x*(w/2-.02),h/2,0));g.add(M(rbox(w+.04,.04,d+.03,.02),WD,0,h,0));g.add(box(w,.03,d,DW,0,.015,0));g.add(box(w,h,.02,DW,0,h/2,-d/2+.01));
    for(let k=1;k<3;k++)g.add(box(w-.06,.02,d,WD,0,k*h/3,0));
    const gl=[mat('#2f6b2c',{roughness:.12,metalness:.25,emissive:'#0d2a0c',emissiveIntensity:.5}),mat('#6a3a14',{roughness:.12,metalness:.25,emissive:'#2a1405',emissiveIntensity:.5}),mat('#203a5a',{roughness:.12,metalness:.25,emissive:'#081828',emissiveIntensity:.5})];
    const bt=gc('bottle',()=>lathe([[0,0],[.045,0],[.047,.15],[.03,.19],[.016,.22],[.016,.27],[0,.27]],10));
    for(let r=0;r<3;r++)for(let c=0;c<5;c++)if(Math.random()<.85)g.add(M(bt,gl[(r*5+c)%3],-.24+c*.12,.07+r*h/3,-.13,PI/2,0,0));
    g.add(M(bt,gl[0],.2,h+.02,.05));g.add(M(bt,gl[1],.08,h+.02,-.06));
    const mb=M(bt,mat('#cfe8e0',{roughness:.05,metalness:.3,transparent:true,opacity:.55}),-.22,h+.07,.02,0,0,PI/2);g.add(mb);g.add(M(new THREE.CylinderGeometry(.018,.018,.1,8),mat('#efe0b5'),-.12,h+.07,.02,0,0,PI/2));
    g.add(cyl(.016,.016,.07,mat('#f4ecd8'),.08,h+.31,-.06,8));g.add(ball(.024,mat('#f4ecd8'),.08,h+.27,-.06,1));
    bake(g);g.add(flame(.08,h+.345,-.06,.9));return g}},
  bloemperk:{name:'stuurwiel',build(L,ctx){const g=new THREE.Group();
    g.add(M(rbox(.62,.04,.62,.04),mat('#8a6440',{roughness:.8}),0,0,0));for(let k=-2;k<=2;k++){g.add(box(.6,.012,.02,DW,0,.045,k*.11));g.add(box(.02,.012,.6,DW,k*.11,.045,0))}
    g.add(M(rbox(.18,.4,.26,.04),WD,-.02,.04,0));g.add(box(.03,.3,.2,BRASS,.075,.25,0));g.add(M(rbox(.22,.04,.3,.03),DW,-.02,.43,0));
    bake(g);const wl=keep(new THREE.Group());wl.position.set(.13,.5,0);g.add(wl);
    wl.add(M(new THREE.TorusGeometry(.27,.024,8,32),WD,0,0,0,0,PI/2));wl.add(M(new THREE.TorusGeometry(.1,.016,6,20),WD,0,0,0,0,PI/2));
    wl.add(cyl(.065,.065,.07,BRASS,0,0,0,14));wl.children[wl.children.length-1].rotation.z=PI/2;wl.add(cyl(.03,.03,.16,BRASS,-.06,0,0,8));wl.children[wl.children.length-1].rotation.z=PI/2;
    for(let k=0;k<8;k++){const a=k/8*TAU;const sp=new THREE.Group();sp.rotation.x=a;wl.add(sp);sp.add(cyl(.013,.016,.27,DW,0,.165,0,6));sp.add(M(lathe([[0,0],[.018,0],[.022,.03],[.014,.07],[.02,.09],[0,.1]],8),LW,0,.3,0))}
    bake(wl);const ph=Math.random()*6;ctx.anim(t=>{wl.rotation.x=Math.sin(t*.33+ph)*.35+Math.sin(t*.13)*.2});return g}},
};

// ---------- sea shader ----------
const WAVES=`
float waveH(vec2 p,float t,out vec2 g){float h=0.;g=vec2(0.);vec2 d;float ph;
  d=normalize(vec2(.25,1.));ph=dot(d,p)*.55+t*1.05;h+=.12*sin(ph);g+=.12*.55*cos(ph)*d;
  d=normalize(vec2(-.6,.8));ph=dot(d,p)*.92+t*1.4;h+=.065*sin(ph);g+=.065*.92*cos(ph)*d;
  d=normalize(vec2(.9,.35));ph=dot(d,p)*1.45+t*1.9;h+=.038*sin(ph);g+=.038*1.45*cos(ph)*d;
  d=normalize(vec2(-.3,-.95));ph=dot(d,p)*2.2+t*2.5;h+=.02*sin(ph);g+=.02*2.2*cos(ph)*d;
  return h;}`;
const NOISE=`
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<OCT;i++){s+=a*noise(p);p=p*2.03+17.1;a*=.5;}return s;}`;
function seaMaterial(){return new THREE.ShaderMaterial({fog:true,defines:{OCT:HQ?4:2},
  uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{uT:{value:0},uSun:{value:V3(-1,.5,-.6)},uSunCol:{value:new THREE.Color('#ffb066')},
    uDeep:{value:new THREE.Color('#0a2a44')},uShal:{value:new THREE.Color('#17797f')},uSkyH:{value:new THREE.Color('#ffc27c')},uSkyM:{value:new THREE.Color('#f39a8e')},uSkyZ:{value:new THREE.Color('#7c78bd')},
    uCloud:{value:new THREE.Color('#ffd7b8')},uHull:{value:new THREE.Vector4()},uIsle:{value:new THREE.Vector3(0,0,-1)}}]),
  vertexShader:`#include <fog_pars_vertex>
uniform float uT;varying vec3 vW;varying float vH;${WAVES}
void main(){vec4 wp=modelMatrix*vec4(position,1.);vec2 g;float att=mix(.25,1.,smoothstep(70.,14.,length(wp.xz)));float h=waveH(wp.xz,uT,g)*att;
  wp.y+=h;vW=wp.xyz;vH=h;vec4 mvPosition=viewMatrix*wp;gl_Position=projectionMatrix*mvPosition;
#include <fog_vertex>
}`,
  fragmentShader:`#include <fog_pars_fragment>
uniform float uT;uniform vec3 uSun,uSunCol,uDeep,uShal,uSkyH,uSkyM,uSkyZ,uCloud,uIsle;uniform vec4 uHull;varying vec3 vW;varying float vH;${WAVES}${NOISE}
float hullD(vec2 p){float bw=uHull.x,zb=uHull.y,zm=uHull.z,zs=uHull.w;float z=p.y,b;
  if(z<zm){float s=clamp((zm-z)/(zm-zb),0.,1.);b=bw*pow(max(1.-pow(s,2.2),0.),.6);}else{float s=clamp((z-zm)/(zs-zm),0.,1.);b=bw*(1.-.2*s*s);}
  return max(abs(p.x)-b,max(z-zs,zb-z));}
void main(){vec2 g;float dc=length(vW.xz);float att=mix(.25,1.,smoothstep(70.,14.,dc));float h=waveH(vW.xz,uT,g)*att;
  vec2 q=vW.xz;float fa=smoothstep(45.,6.,length(cameraPosition-vW));
  vec2 rg=vec2(0.);float a1=dot(q,vec2(.8,.6))*5.3+uT*3.1,a2=dot(q,vec2(-.5,.87))*7.9+uT*3.9,a3=dot(q,vec2(.2,-.98))*11.+uT*4.6;
  rg+=vec2(.8,.6)*cos(a1)*.06+vec2(-.5,.87)*cos(a2)*.045+vec2(.2,-.98)*cos(a3)*.03;rg*=fa;
  vec3 N=normalize(vec3(-g.x-rg.x,1.,-g.y-rg.y));vec3 V=normalize(cameraPosition-vW);vec3 L=normalize(uSun);
  vec3 R=reflect(-V,N);R.y=abs(R.y);float e=R.y;
  vec3 sky=mix(uSkyH,uSkyM,smoothstep(0.,.28,e));sky=mix(sky,uSkyZ,smoothstep(.28,.85,e));
  float sd=max(dot(R,L),0.);sky+=uSunCol*(pow(sd,5.)*.55+pow(sd,40.)*1.6);
  vec2 cp=vW.xz*.05+R.xz/max(R.y,.15)*.35+vec2(uT*.01,uT*.006);float cl=smoothstep(.55,.85,fbm(cp));sky=mix(sky,uCloud*(1.+pow(sd,3.)),cl*.3);
  float F=.04+.96*pow(1.-max(dot(N,V),0.),4.);
  float shal=0.;if(uIsle.z>0.){float di=length(vW.xz-uIsle.xy)-uIsle.z;shal=smoothstep(3.,0.,di);}
  vec3 body=mix(uDeep,uShal,clamp(h*2.5+.25,0.,1.)*.5+shal*.7);
  float sss=pow(clamp(dot(V,-L)*.5+.6,0.,1.),2.)*clamp(h*4.+.35,0.,1.);body+=uShal*sss*.35;
  body*=.55+.45*max(dot(N,L),0.)+.15;
  vec3 col=mix(body,sky,F);
  float sp=pow(sd,220.)*30.;float glit=smoothstep(.8,.95,noise(q*20.+vec2(uT*1.3,-uT)))*pow(sd,10.)*5.*fa;
  col+=uSunCol*(sp+glit);
  // foam: hull line, wake, crests, island surf
  float n=fbm(q*2.2+vec2(0.,uT*.5));
  float d=hullD(q);float foam=smoothstep(.32,0.,d-n*.25)*(.6+.4*sin(d*14.-uT*2.2+n*4.));foam*=smoothstep(.3,.55,n+.25);
  float wz=q.y-uHull.w;if(wz>0.){float wk=smoothstep(uHull.x*.7+wz*.18,uHull.x*.1,abs(q.x))*exp(-wz*.13);foam=max(foam,wk*smoothstep(.5,.8,n+.2*sin(wz*2.-uT*1.5))*.8);}
  float bz=q.y-uHull.y;if(bz>0.){float v=abs(abs(q.x)-bz*.45);foam=max(foam,smoothstep(.22,0.,v-n*.15)*exp(-bz*.25)*.7*step(0.,d));}
  foam=max(foam,smoothstep(.19,.24,h+n*.07)*smoothstep(.45,.75,n)*.6);
  if(uIsle.z>0.){float di=length(vW.xz-uIsle.xy)-uIsle.z;foam=max(foam,smoothstep(.7,0.,abs(di+.1-n*.5))*(.6+.4*sin(di*6.-uT*1.8)));}
  foam=clamp(foam,0.,1.);
  vec3 fc=vec3(1.,.93,.86)*(.75+.5*max(dot(N,L),0.));col=mix(col,fc,foam*.85);
  gl_FragColor=vec4(col,1.);
#include <fog_fragment>
}`})}

// ---------- registration ----------
registerTheme({id:'pirate',label:'Piraten',icon:'🏴‍☠️',title:'Moord op zee',loading:'De zeilen worden gehesen…',
  i18n:{en:{label:'Pirates',title:'Murder at sea',loading:'Hoisting the sails…',
    subs:["The treasure's still here. The captain isn't.","On the open sea, there's nowhere to run.",'Red on the horizon, blood on the deck.','Dead men tell no tales. These clues do.','Someone aboard is playing foul.'],
    victims:[['Captain Silvertooth','m'],['Captain Searose','f']],
    rooms:{Stal:{name:'Hold'},Binnenplaats:{name:'Main deck'},Bibliotheek:{name:'Chart room'},Slaapkamer:{name:'Crew quarters'},Troonzaal:{name:"Captain's cabin"},
      Keuken:{name:'Galley'},Kapel:{name:'Treasure room'},Wapenkamer:{name:'Gun deck'},Tuin:{name:'Quarterdeck'},Kelder:{name:'Storeroom'}},
    objs:{stoel:{name:'stool',verb:'Sat'},troon:{name:"captain's chair",verb:'Sat',art:'the'},tafel:{name:"ship's table"},bed:{name:'hammock',verb:'Lay'},
      tapijt:{name:'treasure map',verb:'Stood'},bank:{name:"ship's bench",verb:'Sat'},paard:{name:'rowboat',verb:'Sat'},kist:{name:'treasure chest'},
      ton:{name:'rum barrel'},hooibaal:{name:'coil of rope'},boom:{name:'palm tree'},struik:{name:'fishing net'},put:{name:'capstan'},kast:{name:'chicken coop'},
      boekenkast:{name:'chart rack'},harnas:{name:'cannon'},altaar:{name:'idol'},kandelaar:{name:'lantern'},wapenrek:{name:'cutlass rack'},
      wijnrek:{name:'bottle rack'},bloemperk:{name:"ship's wheel"}}}},
  subs:['De schat is er nog. De kapitein niet.','Op volle zee kan niemand ontsnappen.','Rood aan de horizon, bloed op het dek.','Dode mannen vertellen geen verhalen. Deze aanwijzingen wel.','Iemand aan boord speelt vals.'],
  names:{A:[['Anne','f'],['Adriaan','m']],B:[['Bregje','f'],['Bartel','m']],C:[['Cato','f'],['Claes','m']],D:[['Dieuwke','f'],['Dirk','m']],E:[['Elsje','f'],['Evert','m']],F:[['Fokje','f'],['Freek','m']],G:[['Grietje','f'],['Gerrit','m']],H:[['Hiltje','f'],['Hein','m']]},
  victims:[['Kapitein Zilvertand','m'],['Kapitein Zeeroos','f']],vicFace:{f:'👩‍✈️',m:'👨‍✈️'},
  faces:{f:['👩‍🦰','👩🏽‍🦱','👵','👩‍🍳','🧕','👱‍♀️','👩🏻‍🦳','🧜‍♀️'],m:['🧔','👨🏾‍🦲','👴','👨‍🍳','🧔🏻‍♂️','👨‍🦰','🦹‍♂️','🧜‍♂️']},
  rooms:{Stal:{name:'Ruim',art:'het',color:'#dcc28c',pat:FLOORS.hold},Binnenplaats:{name:'Hoofddek',art:'het',color:'#a88d6c',pat:FLOORS.deck},
    Bibliotheek:{name:'Kaartenkamer',color:'#3e8193',pat:FLOORS.chart},Slaapkamer:{name:'Logies',art:'het',color:'#a9bdd0',pat:FLOORS.ticking},
    Troonzaal:{name:'Kapiteinshut',color:'#a63a35',pat:FLOORS.rug},Keuken:{name:'Kombuis',color:'#c86c42',pat:FLOORS.galley,rough:.6},
    Kapel:{name:'Schatkamer',color:'#7a5596',pat:FLOORS.treasure},Wapenkamer:{name:'Kanonsdek',art:'het',color:'#828b98',pat:FLOORS.guns},
    Tuin:{name:'Achterdek',art:'het',color:'#c99a5c',pat:FLOORS.teak},Kelder:{name:'Bottelarij',color:'#7f977b',pat:FLOORS.ballast}},
  look:{sky:['#463a6c','#93588a','#e2806e','#ffb36b','#ffd79c'],fog:['#f0a07e',30,95],hemi:['#ffd6b6','#3e5470',.8],sun:['#ffad62',3.7,[-10,5.6,-6]],
    rim:['#b4c2ff',.5],fill:['#ffc8a2',.5],exposure:1.06,env:.45,bloom:[.45,.5,1.4],
    wall:'#7a5233',wallMap:false,wallRough:.6,cap:'#e6c072',grout:'#2a1c12',base:false,
    label:{bg:'rgba(46,24,12,.8)',fg:'#f8e6bc',line:'rgba(236,196,112,.6)'},dust:['#ffe0b0',70,.32],shadowR:undefined},
  objs:OBJ,
  env(ctx){const {world,N,H}=ctx;
    const ship=new THREE.Group();world.add(ship);
    // ---- hull form ----
    const BD=H+.5,Lb=3.3+.12*N,Ls=2.2,ZB=-H-Lb,ZS=H+Ls,ZF=-H-.3,ZQ=H+.48,YB=-.5,SEA=-.85;
    const sb=z=>z<ZF?Math.min(1,(ZF-z)/(ZF-ZB)):0,ss=z=>z>ZQ?Math.min(1,(z-ZQ)/(ZS-ZQ)):0;
    const bdAt=z=>z<ZF?BD*Math.pow(Math.max(0,1-Math.pow(sb(z),2.2)),.6):z>ZQ?BD*(1-.2*ss(z)**2):BD;
    const topAt=z=>.44+(.94-.44)*sm(ZF+.3,ZF-.3,z)+.32*sb(z)**2+(.7-.44)*sm(ZQ-.3,ZQ+.3,z)+.12*ss(z)**2;
    const keelAt=z=>-2+1.25*sb(z)**2.5+.3*ss(z);
    const bmAt=z=>{const b=bdAt(z);return b+.36*Math.min(1,b/BD*1.6)};
    const xAt=(z,y)=>{const b=bdAt(z),m=bmAt(z),tp=topAt(z),k=keelAt(z);if(y>=YB){const a=Math.min(1,Math.max(0,(tp-y)/(tp-YB)));return b+(m-b)*Math.sin(a*PI/2)}return m*Math.cos(Math.asin(Math.min(1,(y-YB)/(k-YB))))};
    const deckY=z=>z<ZF?.5:z>ZQ?.3:-.06;
    // hull planking texture: v follows height, u runs along the length
    const py=y=>(1-(y+2.2)/3.4)*512;
    const hullT=tex('hull',()=>canv(1024,512,(g,w,h)=>{const R=Math.random;g.fillStyle='#62402a';g.fillRect(0,0,w,h);
      for(let y=0;y<h;y+=15){g.fillStyle=R()<.5?'rgba(30,15,5,.12)':'rgba(255,230,190,.05)';g.fillRect(0,y,w,15);g.fillStyle='rgba(25,12,4,.5)';g.fillRect(0,y,w,1.5);for(let k=0;k<5;k++)g.fillRect(R()*w,y,1.5,15)}
      g.fillStyle='#43251c';g.fillRect(0,py(-.78),w,h);g.fillStyle='rgba(70,90,60,.35)';g.fillRect(0,py(-.78),w,30);
      g.fillStyle='#eadcb8';g.fillRect(0,py(-.72),w,py(-.78)-py(-.72));
      g.fillStyle='#1d1410';g.fillRect(0,py(-.02),w,py(-.13)-py(-.02));
      g.fillStyle='#1f5662';g.fillRect(0,py(.44),w,py(0)-py(.44));g.fillStyle='#d9ad52';g.fillRect(0,py(.44),w,4);g.fillRect(0,py(0)-4,w,4);g.fillRect(0,py(-.02)-3,w,3);
      g.fillStyle='#8c2a20';g.fillRect(0,py(.9),w,py(.6)-py(.9));g.fillStyle='#d9ad52';g.fillRect(0,py(.6),w,3);g.fillRect(0,py(.9),w,3);
      for(let k=0;k<14;k++){const x=(k+.5)*w/14;g.fillStyle='rgba(217,173,82,.8)';g.beginPath();g.arc(x,(py(.6)+py(.9))/2,5,0,7);g.fill()}
      for(let k=0;k<7;k++){const x=(k+.5)*w/7,y0=py(.36),y1=py(.12);g.fillStyle='#8e2a20';g.fillRect(x-17,y0-4,34,y1-y0+8);g.fillStyle='#0c0705';g.fillRect(x-13,y0,26,y1-y0)}},true));
    const hullM=new THREE.MeshStandardMaterial({map:hullT,roughness:.72,side:THREE.DoubleSide});
    const S=HQ?60:40,J=12,J1=5,RW=2*J+1;const pos=[],uv=[],idx=[];const ring0=[];
    for(let i=0;i<=S;i++){const z=ZS+(ZB-ZS)*i/S;const b=bdAt(z),m=bmAt(z),tp=topAt(z),k=keelAt(z),s1=sb(z),s2=ss(z);
      for(let c=0;c<RW;c++){const j=c<=J?c:2*J-c,sg=c<J?-1:1;let x,y;
        if(j<=J1){const a=j/J1;y=tp+(YB-tp)*a;x=b+(m-b)*Math.sin(a*PI/2)}else{const f=(j-J1)/(J-J1)*PI/2;y=YB+(k-YB)*Math.sin(f);x=m*Math.cos(f)}
        const dep=(tp-y)/(tp-k);const zz=z+1.15*s1*s1*Math.pow(dep,1.3)-.42*s2*dep;pos.push(sg*x,y,zz);uv.push(zz*.125,(y+2.2)/3.4);if(i===0)ring0.push([sg*x,y,zz])}}
    for(let i=0;i<S;i++)for(let c=0;c<RW-1;c++){const a=i*RW+c,b=a+RW;idx.push(a,b,a+1,b,b+1,a+1)}
    {const q=new THREE.BufferGeometry();q.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));q.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));q.setIndex(idx);q.computeVertexNormals();
     const hm=new THREE.Mesh(q,hullM);hm.castShadow=hm.receiveShadow=true;ship.add(hm)}
    // transom with the ship's name and lit cabin windows
    {const tp=topAt(ZS),k=keelAt(ZS),b0=bmAt(ZS);const vy=y=>(1-(y-k)/(tp-k))*512;
     const draw=(em)=>(g,w,h)=>{const X=x=>(x/(2*b0)+.5)*w;g.fillStyle=em?'#000':'#4a2a18';g.fillRect(0,0,w,h);
       if(!em){for(let y=0;y<h;y+=12){g.fillStyle='rgba(20,10,4,.35)';g.fillRect(0,y,w,1.5)}g.fillStyle='#3b221a';g.fillRect(0,vy(-.78),w,h);g.fillStyle='#eadcb8';g.fillRect(0,vy(-.72),w,vy(-.78)-vy(-.72));
         g.fillStyle='#7a1f18';g.fillRect(0,vy(.02),w,vy(-.3)-vy(.02));g.fillStyle='#e0b45a';g.fillRect(0,vy(.02),w,4);g.fillRect(0,vy(-.3)-4,w,4);
         g.font='bold 30px Georgia,serif';g.textAlign='center';g.textBaseline='middle';g.fillStyle='#f0c860';g.fillText((typeof LANG==='undefined'||LANG==='nl')?'DE VLIEGENDE HOLLANDER':'THE FLYING DUTCHMAN',w/2,(vy(.02)+vy(-.3))/2);
         g.fillStyle='#2a1810';g.fillRect(0,vy(.62),w,vy(.06)-vy(.62));g.fillStyle='#e0b45a';g.fillRect(0,vy(.62),w,5);g.fillRect(0,vy(.06),w,5)}
       for(let i=0;i<5;i++){const cx=X(-b0*.62+i*b0*.31),wy0=vy(.54),wy1=vy(.14),ww=w*.075;
         if(!em){g.fillStyle='#e0b45a';g.fillRect(cx-ww/2-5,wy0-5,ww+10,wy1-wy0+10);g.beginPath();g.arc(cx,wy0-5,ww/2+5,PI,0);g.fill()}
         g.fillStyle=em?'#ffb04a':'#ffd590';g.fillRect(cx-ww/2,wy0,ww,wy1-wy0);g.beginPath();g.arc(cx,wy0,ww/2,PI,0);g.fill();
         g.fillStyle=em?'#000':'#3a2010';g.fillRect(cx-1.5,wy0-ww/2,3,wy1-wy0+ww/2);g.fillRect(cx-ww/2,(wy0+wy1)/2-1.5,ww,3)}};
     const tm=new THREE.MeshStandardMaterial({map:canv(512,512,draw(false)),emissiveMap:canv(512,512,draw(true)),emissive:'#ffffff',emissiveIntensity:2.4,roughness:.6,side:THREE.DoubleSide});
     const cx=0,cy=ring0.reduce((s,p)=>s+p[1],0)/ring0.length,cz=ring0.reduce((s,p)=>s+p[2],0)/ring0.length;
     const tp2=[cx,cy,cz,...ring0.flat()],tuv=[.5,1-vy(cy)/512,...ring0.flatMap(p=>[p[0]/(2*b0)+.5,1-vy(p[1])/512])],ti=[];for(let c=0;c<ring0.length-1;c++)ti.push(0,c+1,c+2);
     const q=new THREE.BufferGeometry();q.setAttribute('position',new THREE.Float32BufferAttribute(tp2,3));q.setAttribute('uv',new THREE.Float32BufferAttribute(tuv,2));q.setIndex(ti);q.computeVertexNormals();
     const t=new THREE.Mesh(q,tm);t.receiveShadow=true;ship.add(t)}
    // decks
    const deckT=tex('deckT',()=>{const t=canv(512,512,(g,w,h)=>{const R=Math.random;g.fillStyle='#a07a52';g.fillRect(0,0,w,h);const n=18,pw=w/n;
      for(let i=0;i<n;i++){g.fillStyle=R()<.5?`rgba(40,20,5,${.05+R()*.12})`:`rgba(255,235,200,${.04+R()*.08})`;g.fillRect(i*pw,0,pw,h);g.fillStyle='rgba(25,14,6,.7)';g.fillRect(i*pw,0,2,h);
        for(let k=0;k<3;k++){const y=R()*h;g.fillRect(i*pw,y,pw,2);g.fillStyle='rgba(25,14,6,.5)';g.beginPath();g.arc(i*pw+pw*.3,y+6,1.6,0,7);g.arc(i*pw+pw*.7,y+6,1.6,0,7);g.fill();g.fillStyle='rgba(25,14,6,.7)'}
        g.lineWidth=1;for(let k=0;k<5;k++){g.strokeStyle='rgba(40,20,5,.12)';const x=i*pw+R()*pw;g.beginPath();g.moveTo(x,0);g.lineTo(x+R()*3,h);g.stroke()}}},true);t.repeat.set(.25,.25);return t});
    const deckM=new THREE.MeshStandardMaterial({map:deckT,roughness:.8});
    const deckGeo=(z0,z1,y,hole)=>{const sp=new THREE.Shape(),n=30,pts=[];for(let i=0;i<=n;i++){const z=z0+(z1-z0)*i/n;pts.push([Math.max(0,xAt(z,y)-.03),z])}
      sp.moveTo(pts[0][0],-pts[0][1]);for(const p of pts)sp.lineTo(p[0],-p[1]);for(let i=n;i>=0;i--)sp.lineTo(-pts[i][0],-pts[i][1]);
      if(hole){const hp=new THREE.Path();hp.moveTo(-hole,-hole);hp.lineTo(hole,-hole);hp.lineTo(hole,hole);hp.lineTo(-hole,hole);hp.lineTo(-hole,-hole);sp.holes.push(hp)}
      const q=new THREE.ShapeGeometry(sp);q.rotateX(-PI/2);q.translate(0,y,0);return q};
    for(const [z0,z1,y,hole] of[[ZF,ZQ,-.06,H+.01],[ZB+.02,ZF,.5],[ZQ,ZS-.08,.3]]){const d=new THREE.Mesh(deckGeo(z0,z1,y,hole),deckM);d.receiveShadow=true;ship.add(d)}
    // hatch coaming around the board
    for(const s of[-1,1]){ship.add(box(N+.28,.13,.14,DW,0,-.04,s*(H+.07)));ship.add(box(.14,.13,N,DW,s*(H+.07),-.04,0))}
    // inner bulwarks, painted red
    {const bm=new THREE.MeshStandardMaterial({color:'#8a3226',roughness:.7,side:THREE.DoubleSide,map:woodTex()});
     for(const [z0,z1] of[[ZS-.06,ZQ],[ZQ,ZF],[ZF,ZB+.25]]){const n=Math.max(4,Math.round(Math.abs(z1-z0)*3)),p=[],ix=[];
       for(const sg of[-1,1]){const o=p.length/3;for(let i=0;i<=n;i++){const z=z0+(z1-z0)*i/n,tp=topAt(z),dy=deckY((z0+z1)/2);p.push(sg*(xAt(z,tp)-.06),tp-.02,z,sg*(xAt(z,dy)-.06),dy,z);if(i<n){const a=o+i*2;ix.push(a,a+2,a+1,a+1,a+2,a+3)}}}
       const q=new THREE.BufferGeometry();q.setAttribute('position',new THREE.Float32BufferAttribute(p,3));q.setIndex(ix);q.computeVertexNormals();const uvs=[];for(let i=0;i<p.length/3;i++)uvs.push(p[i*3+2]*.5,p[i*3+1]);q.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
       const o=new THREE.Mesh(q,bm);o.receiveShadow=true;o.castShadow=true;ship.add(o)}
     // forecastle and quarterdeck fronts
     const face=(z,y0,y1,flip)=>{const sp=new THREE.Shape(),n=8;for(let i=0;i<=n;i++){const y=y0+(y1-y0)*i/n;const x=xAt(z,y)-.04;i?sp.lineTo(-x,y):sp.moveTo(-x,y)}for(let i=n;i>=0;i--){const y=y0+(y1-y0)*i/n;sp.lineTo(xAt(z,y)-.04,y)}
       const q=new THREE.ShapeGeometry(sp);if(flip)q.rotateY(PI);q.translate(0,0,z);return q};
     const ft=canv(512,128,(g,w,h)=>{g.fillStyle='#5b3620';g.fillRect(0,0,w,h);for(let x=0;x<w;x+=16){g.fillStyle='rgba(20,10,4,.4)';g.fillRect(x,0,2,h)}g.fillStyle='#d9ad52';g.fillRect(0,0,w,5);g.fillRect(0,h-6,w,6);
       for(const cx of[w*.3,w*.7]){g.fillStyle='#2e1a0e';g.fillRect(cx-26,26,52,h-32);g.fillStyle='#d9ad52';g.strokeStyle='#d9ad52';g.lineWidth=3;g.strokeRect(cx-26,26,52,h-32);g.beginPath();g.arc(cx+16,h*.6,4,0,7);g.fill()}
       for(const cx of[w*.1,w*.5,w*.9]){g.fillStyle='#ffcf80';g.fillRect(cx-14,34,28,26);g.fillStyle='#2e1a0e';g.fillRect(cx-1,34,2,26);g.fillRect(cx-14,46,28,2)}});
     const fm=new THREE.MeshStandardMaterial({map:ft,roughness:.7,emissive:'#ffffff',emissiveMap:canv(512,128,(g,w,h)=>{g.fillStyle='#000';g.fillRect(0,0,w,h);for(const cx of[w*.1,w*.5,w*.9]){g.fillStyle='#b8752a';g.fillRect(cx-14,34,28,26)}}),emissiveIntensity:1.6});
     const fq=face(ZF,-.06,.5);{const p=fq.attributes.position,u=fq.attributes.uv;for(let i=0;i<p.count;i++)u.setXY(i,p.getX(i)/(2*BD)+.5,(p.getY(i)+.06)/.56)}ship.add(sh(new THREE.Mesh(fq,fm)));
     ship.add(sh(new THREE.Mesh(face(ZQ,-.06,.3,true),bm)))}
    // balustrades on the deck breaks and the stern
    {const bal=gc('baluster',()=>lathe([[0,0],[.025,0],[.025,.02],[.014,.05],[.026,.1],[.012,.16],[.022,.18],[.022,.2],[0,.2]],7));
     const rail=(pts,y0,h)=>{for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1];ship.add(rod(V3(a[0],y0+h+.02,a[1]),V3(b[0],y0+h+.02,b[1]),.03,WD,6))}
       for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1];const L=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.max(1,Math.round(L/.17));for(let k=0;k<n;k++){const f=(k+.5)/n;const o=M(bal,LW,a[0]+(b[0]-a[0])*f,y0,a[1]+(b[1]-a[1])*f);o.scale.y=h/.2;ship.add(o)}}};
     const wf=xAt(ZF,.5)-.06;rail([[-wf,ZF+.02],[wf,ZF+.02]],.5,.26);
     const wq=xAt(ZQ,.3)-.06;rail([[-wq,ZQ+.02],[wq,ZQ+.02]],.3,.17)}
    // cap rails along the gunwale and across the stern
    {const rm=mat('#3e2414',{roughness:.5});for(const sg of[-1,1]){const pts=[];for(let i=0;i<=60;i++){const z=ZS-.04+(ZB+.05-ZS)*i/60;pts.push(V3(sg*(xAt(z,topAt(z))-.02),topAt(z)+.02,z))}
       ship.add(M(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),90,.055,6),rm))}
     const st=[];for(let i=0;i<=12;i++){const x=-xAt(ZS,topAt(ZS))+i/12*2*xAt(ZS,topAt(ZS));st.push(V3(x,topAt(ZS)+.02,ZS-.04+.12*(1-(x/BD)**2)))}ship.add(M(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(st),24,.06,6),rm));
     // stem timber along the cutwater
     const stem=[];for(let i=0;i<=10;i++){const y=topAt(ZB)+.05-(i/10)*(topAt(ZB)+.05-keelAt(ZB)-.1);const dep=(topAt(ZB)-y)/(topAt(ZB)-keelAt(ZB));stem.push(V3(0,y,ZB+1.15*Math.pow(Math.max(0,dep),1.3)-.03))}
     ship.add(M(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(stem),20,.07,6),mat('#d9ad52',GOLD)))}
    // guns run out through the ports
    {for(let k=-12;k<12;k++){const z=(k+.5)*8/7;if(Math.abs(z)>H-.2||z<ZF+.3)continue;for(const sg of[-1,1]){const x=xAt(z,.24);const g=cyl(.055,.07,.34,IRON,sg*(x+.06),.24,z,10);g.rotation.z=PI/2;ship.add(g);
       const mz=M(new THREE.TorusGeometry(.06,.016,6,12),IRON,sg*(x+.23),.24,z,0,PI/2,0);ship.add(mz)}}}
    // belaying pin rails inside the bulwarks
    for(const sg of[-1,1]){ship.add(box(.07,.04,N*.9,WD,sg*(BD-.1),.3,0));for(let z=-H*.88;z<H*.9;z+=.3)ship.add(cyl(.012,.012,.14,LW,sg*(BD-.1),.33,z,5))}
    // stern: lanterns, wheel, ensign
    const sternTop=topAt(ZS);
    const lm=[];for(const [x,s,dy] of[[0,1.5,.38],[-(bdAt(ZS)-.18),1.05,.22],[bdAt(ZS)-.18,1.05,.22]]){const l=lantern(s);l.position.set(x,sternTop+dy,ZS+.02);ship.add(l);lm.push(l);
      ship.add(rod(V3(x,sternTop,ZS),V3(x,sternTop+dy,ZS+.02),.02,IRON,5))}
    {const L1=new THREE.PointLight('#ffae55',1,6,1.6);L1.position.set(0,sternTop+.7,ZS-.3);world.add(L1);flames.push({light:L1,ph:1.3})}
    {const w=OBJ.bloemperk.build(1,ctx);w.rotation.y=-PI/2;w.position.set(0,.3,ZQ+1.05);w.scale.setScalar(1.05);world.add(w);
     const bn=new THREE.Group();bn.add(M(rbox(.2,.36,.2,.03),WD,0,0,0));bn.add(M(new THREE.SphereGeometry(.09,14,8,0,TAU,0,PI/2),BRASS,0,.36,0));bn.position.set(.45,.3,ZQ+.6);ship.add(bn);
     for(const sg of[-1,1]){const v=OBJ.ton.build(1,ctx);v.scale.setScalar(.8);v.rotation.y=PI/2;v.position.set(sg*(bdAt(ZS-.7)-.42),.3,ZS-.75);world.add(v)}}
    const flags=[];
    {const fx=.42,base=V3(fx,sternTop+.02,ZS+.02),top=V3(fx,sternTop+2.1,ZS+.45);ship.add(rod(base,top,.022,DW,6,.014));ship.add(ball(.035,GLD,top.x,top.y+.02,top.z,1));
     const fl=flagMesh(.82,.52,new THREE.MeshStandardMaterial({map:flagTex(),side:THREE.DoubleSide,alphaTest:.5,roughness:.85}));fl.position.set(top.x,top.y-.3,top.z-.02);fl.rotation.y=PI/2+.25;world.add(fl);flags.push(fl)}
    // bow: bowsprit, figurehead, anchors, bell
    const bowTop=topAt(ZB+.3);const bsA=V3(0,bowTop-.05,ZB+.6),bsDir=V3(0,Math.sin(.32),-Math.cos(.32)),bsB=bsA.clone().addScaledVector(bsDir,3.6);
    ship.add(rod(bsA,bsB,.1,mat('#5a3820',{roughness:.6}),10,.05));for(let k=1;k<4;k++){const p=bsA.clone().addScaledVector(bsDir,k*.8);ship.add(M(new THREE.TorusGeometry(.085-k*.01,.018,5,12),IRON,p.x,p.y,p.z,.32))}
    {const fh=new THREE.Group();fh.position.set(0,topAt(ZB)-.35,ZB+.02);fh.rotation.x=-.5;
     const body=M(new THREE.CapsuleGeometry(.075,.24,4,10),GLD,0,.12,-.08);body.rotation.x=-.6;fh.add(body);fh.add(ball(.065,GLD,0,.33,-.22,2));const hair=ball(.07,GLD,0,.34,-.17,1);hair.scale.set(1.05,1,1.2);fh.add(hair);
     for(const s of[-1,1])fh.add(rod(V3(s*.07,.24,-.16),V3(s*.05,.2,-.36),.022,GLD,6));
     const tail=new THREE.CatmullRomCurve3([V3(0,.0,-.02),V3(0,-.2,.05),V3(0,-.38,.0),V3(0,-.5,-.1)]);fh.add(M(new THREE.TubeGeometry(tail,12,.055,8),GLD));
     for(const s of[-1,1]){const f=ball(.06,GLD,s*.05,-.54,-.14,1);f.scale.set(1.2,.35,.8);fh.add(f)}ship.add(fh)}
    for(const sg of[-1,1]){const z=ZB+1.6,x=xAt(z,.1)+.05;const an=new THREE.Group();an.position.set(sg*x,.25,z);an.rotation.z=sg*.12;
      an.add(cyl(.025,.025,.7,IRON,0,-.15,0,6));an.add(M(new THREE.TorusGeometry(.2,.025,5,12,PI),IRON,0,-.3,0,0,PI/2,PI));an.add(box(.05,.03,.5,DW,0,.18,0));an.add(M(new THREE.TorusGeometry(.05,.012,5,10),IRON,0,.24,0,0,PI/2));
      for(const s of[-1,1]){const t=M(new THREE.ConeGeometry(.05,.1,4),IRON,0,-.42,s*.2,0,0,0);t.rotation.x=s*-.6;an.add(t)}ship.add(an)}
    let bell;{const bz=ZF-.5;ship.add(box(.05,.5,.05,DW,-.22,.75,bz));ship.add(box(.05,.5,.05,DW,.22,.75,bz));ship.add(box(.52,.06,.07,DW,0,1.02,bz));
      bell=keep(new THREE.Group());bell.position.set(0,.99,bz);bell.add(M(lathe([[0,-.0],[.04,-.02],[.06,-.12],[.09,-.2],[.095,-.22],[0,-.22]],16),BRASS));world.add(bell)}
    // anchor cable coils on the forecastle
    for(const sg of[-1,1]){const c=OBJ.hooibaal.build(1,ctx);c.scale.setScalar(.85);c.position.set(sg*(bdAt(ZF-1.6)-.55),.5,ZF-1.6);ship.add(c)}

    // forecastle and quarterdeck clutter: hatch grating, crates, shot, barrels, chest, skylight
    {const grate=new THREE.Group();const gz=ZF-(Lb-.3)*.3;grate.add(M(rbox(1.1,.08,.8,.03),DW,0,0,0));for(let k=0;k<7;k++)grate.add(box(.02,.03,.74,LW,-.45+k*.15,.09,0));for(let k=0;k<5;k++)grate.add(box(1.04,.03,.02,LW,0,.09,-.3+k*.15));grate.position.set(0,.5,gz);ship.add(grate);
     const crate=(x,y,z,s,r)=>{const c=new THREE.Group();c.add(M(rbox(s,s,s,.02),mat('#9a7048',{roughness:.8,map:WALLWOOD()}),0,0,0));for(const yy of[.08,.92])c.add(box(s+.01,.05*s/.4,s+.01,DW,0,yy*s,0));c.add(rod(V3(-s/2-.005,.1*s,s/2+.005),V3(s/2+.005,.9*s,s/2+.005),.012,DW,4));c.position.set(x,y,z);c.rotation.y=r;ship.add(c)};
     const cz=ZF-(Lb-.3)*.78;for(const sg of[-1,1]){const x=sg*(bdAt(cz)-.45);crate(x,.5,cz,.36,.3*sg);crate(x+sg*-.05,.86,cz+.02,.3,-.2*sg)}
     crate(BD-.4,.3,ZS-1.3,.32,.4);
     for(let i=0;i<3;i++)for(let j=0;j<3-i;j++)for(let k=0;k<3-i-j;k++){}
     const pyr=(x,y,z)=>{let n=0;for(let l=0;l<3;l++)for(let i=0;i<3-l;i++)for(let j=0;j<3-l;j++){ship.add(ball(.055,IRON,x+(i-(2-l)/2)*.11,y+.055+l*.078,z+(j-(2-l)/2)*.11,1));n++}};
     pyr(-.62,.5,ZF-.32);pyr(.62,.5,ZF-.32);
     for(const sg of[-1,1]){const v=OBJ.ton.build(1,ctx);v.children.forEach(c=>{if(!c.userData.keep&&c.isMesh)c.userData.k=1});v.scale.setScalar(.75);v.position.set(sg*(bdAt(ZF-.35)-.5),.5,ZF-.38);v.rotation.y=sg>0?0:PI;world.add(v)}
     const sk=new THREE.Group();sk.position.set(0,.3,ZS-1.0);sk.add(M(rbox(.8,.14,.6,.03),DW,0,0,0));
     const glassM=new THREE.MeshStandardMaterial({color:'#ffd9a0',emissive:'#ff9a40',emissiveIntensity:1.4,roughness:.2});
     for(const sg of[-1,1]){const pg=new THREE.PlaneGeometry(.74,.32);const o=new THREE.Mesh(pg,glassM);o.position.set(0,.25,sg*.13);o.rotation.x=-PI/2+sg*-.85;sk.add(o)}sk.add(box(.8,.03,.04,BRASS,0,.36,0));
     for(let k=-2;k<=2;k++)for(const sg of[-1,1]){const b=box(.015,.02,.34,BRASS,k*.17,.25,sg*.13);b.rotation.x=sg*.72;sk.add(b)}ship.add(sk);
     const ch=OBJ.kist.build(1,ctx);ch.scale.setScalar(.72);ch.position.set(-(BD-.55),.3,ZS-1.25);ch.rotation.y=.5;world.add(ch)}
    // ---- rig: masts, yards, sails; it rolls gently around the keel line ----
    const rig=new THREE.Group();world.add(rig);
    const mastM=mat('#7a5130',{roughness:.6}),yardM=mat('#4a2d18',{roughness:.6});
    const sailM=new THREE.MeshStandardMaterial({map:sailTex(),side:THREE.DoubleSide,roughness:.92,emissive:'#ff9a55',emissiveMap:sailTex(),emissiveIntensity:.2});
    const sails=[],masts=[];
    const mkMast=(z,s,W)=>{const g=new THREE.Group();g.position.set(0,deckY(z),z);rig.add(g);const h1=5*s,h2=3.2*s,h3=2.2*s;
      g.add(cyl(.11*s,.14*s,h1,mastM,0,h1/2,0,12));g.add(cyl(.08*s,.095*s,h2,mastM,0,h1-.4*s+h2/2,0,10));g.add(cyl(.045*s,.06*s,h3,mastM,0,h1+h2-1.1*s+h3/2,0,8));
      const top=h1+h2-1.1*s+h3;g.add(ball(.07*s,GLD,0,top+.03,0,1));
      for(let k=0;k<4;k++)g.add(M(new THREE.TorusGeometry(.125*s,.018,5,12),IRON,0,.6+k*1.1*s,0,PI/2));
      // crow's nest / top
      g.add(cyl(.5*s,.42*s,.06,WD,0,h1-.08,0,16));const bk=M(new THREE.CylinderGeometry(.46*s,.42*s,.36*s,16,1,true),new THREE.MeshStandardMaterial({color:'#6a4426',map:woodTex(),side:THREE.DoubleSide,roughness:.7}),0,h1+.1*s,0);g.add(bk);
      g.add(M(new THREE.TorusGeometry(.46*s,.03,5,18),DW,0,h1+.28*s,0,PI/2));
      const yards=[[2.9*s,W],[h1+1.75*s,W*.78],[h1+h2-.55*s+.9*s,W*.55]];
      for(const [y,w] of yards){const yd=new THREE.CylinderGeometry(.035*s,.06*s,w/2,8);yd.translate(0,w/4,0);for(const sg of[-1,1]){const o=M(yd,yardM,0,y,-.17*s,0,0,-sg*PI/2);g.add(o)}g.add(box(.12*s,.1*s,.12*s,DW,0,y,-.12*s))}
      const sd=[[yards[0][0],W*.94,W*.98,yards[0][0]-(.5+.85)*1.0-.05*s,.55*s],[yards[1][0],W*.74,W*.93,yards[1][0]-yards[0][0]-.15,.45*s],[yards[2][0],W*.52,W*.74,yards[2][0]-yards[1][0]-.15,.3*s]];
      sd[0][3]=yards[0][0]-1.0*s;
      for(const [y,w0,w1,h,b] of sd){const sl=sail(w0,w1,h,b,sailM);sl.position.set(0,y-.04,-.2*s);g.add(sl);sails.push(sl)}
      const pen=flagMesh(1.1*s,.12,mat('#b3221c',{side:THREE.DoubleSide,roughness:.8}),10,1);pen.position.set(0,top-.05,0);pen.rotation.y=PI/2+.2;g.add(pen);flags.push(pen);
      const info={g,s,z,h1,h2,top,W,yards};masts.push(info);return info};
    const mm=mkMast(ZF-.75,.74,2*BD*.98);const fm2=mkMast(ZF-(Lb-.3)*.6,.62,2*bdAt(ZF-(Lb-.3)*.6)*1.15+.5);
    // Jolly Roger at the main truck
    {const fl=flagMesh(1.0,.64,new THREE.MeshStandardMaterial({map:flagTex(),side:THREE.DoubleSide,alphaTest:.5,roughness:.85}));fl.position.set(0,mm.top-.4,0);fl.rotation.y=PI/2+.2;mm.g.add(fl);flags.push(fl)}
    for(const m of masts){const g=m.g;bake(g)}
    // jib: a triangular staysail from the bowsprit to the fore top, built in world space each frame
    const jibGeo=new THREE.BufferGeometry();const JN=6;{const ix=[];let r0=0;for(let r=0;r<JN;r++){const n0=JN-r+1,n1=JN-r;for(let c=0;c<n1;c++){ix.push(r0+c,r0+c+1,r0+n0+c);if(c<n1-1)ix.push(r0+c+1,r0+n0+c+1,r0+n0+c)}r0+=n0}
      const cnt=(JN+1)*(JN+2)/2;jibGeo.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(cnt*3),3));const u=[];for(let r=0;r<=JN;r++)for(let c=0;c<=JN-r;c++)u.push(c/JN,r/JN);jibGeo.setAttribute('uv',new THREE.Float32BufferAttribute(u,2));jibGeo.setIndex(ix)}
    const jib=new THREE.Mesh(jibGeo,sailM);jib.frustumCulled=false;jib.receiveShadow=true;world.add(jib);
    const jibB=bsA.clone().addScaledVector(bsDir,3.3),jibF=V3(0,deckY(fm2.z)+.9,fm2.z-.25);

    // ---- rigging lines (rebuilt each frame so the rolling masts stay tied to the hull) ----
    const lines=[];const R_=(m,x,y,z)=>({m,p:V3(x,y,z)}),W_=(x,y,z)=>({p:V3(x,y,z)});
    for(const m of masts){const s=m.s,z=m.z;
      for(const sg of[-1,1]){const sh_=[];for(const d of[-.35,0,.35,.7]){const zz=z+d*s;const b=W_(sg*(xAt(zz,topAt(zz))+.03),topAt(zz)-.02,zz),t=R_(m,sg*.12*s,m.h1-.15,0);lines.push([b,t]);sh_.push([b,t])}
        for(let k=0;k<3;k++)for(let f=.07;f<.92;f+=.075)lines.push([{lerp:[sh_[k],f]},{lerp:[sh_[k+1],f]}]);
        for(const d of[-.2,.2])lines.push([R_(m,sg*.44*s,m.h1+.25*s,d*s),R_(m,sg*.06*s,m.h1+m.h2-.6*s,0)]);
        for(const [y,w] of m.yards){lines.push([R_(m,sg*w/2,y,-.17*s),R_(m,0,y+.9*s,0)]);lines.push([R_(m,sg*w/2,y,-.17*s),W_(sg*(xAt(z+2*s,topAt(z+2*s))),topAt(z+2*s),z+2*s)])}
        lines.push([R_(m,0,m.top-.2,0),W_(sg*(xAt(z+2.4*s,topAt(z+2.4*s))),topAt(z+2.4*s),z+2.4*s)])}}
    lines.push([R_(mm,0,mm.h1-.1,0),W_(0,deckY(fm2.z)+.15,fm2.z+.3)]);lines.push([R_(mm,0,mm.h1+mm.h2-.6,0),R_(fm2,0,fm2.h1+.1,0)]);lines.push([R_(mm,0,mm.top-.15,0),R_(fm2,0,fm2.top-.1,0)]);
    lines.push([R_(fm2,0,fm2.h1-.1,0),{p:jibB.clone()}]);lines.push([R_(fm2,0,fm2.top-.3,0),{p:bsB.clone()}]);
    for(const sg of[-1,1])lines.push([{p:bsB.clone()},W_(sg*.4,topAt(ZB+.6),ZB+.7)]);
    const lgeo=new THREE.BufferGeometry();lgeo.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(lines.length*6),3));
    const lineObj=new THREE.LineSegments(lgeo,new THREE.LineBasicMaterial({color:'#2a1a10',transparent:true,opacity:.85}));lineObj.frustumCulled=false;world.add(lineObj);
    const tmp=V3(0,0,0);const wp=e=>{if(e.lerp){const [pair,f]=e.lerp;return wp(pair[0]).clone().lerp(wp(pair[1]),f)}if(e.m){return tmp.copy(e.p).applyMatrix4(e.m.g.matrixWorld).clone()}return e.p};

    bake(ship);

    // ---- the ocean ----
    const sea=new THREE.Group();sea.position.y=SEA;world.add(sea);
    const segs=HQ?150:80;const sgeo=new THREE.PlaneGeometry(2,2,segs,segs);sgeo.rotateX(-PI/2);{const p=sgeo.attributes.position,f=u=>140*(.22*u+.78*u*u*u);for(let i=0;i<p.count;i++){p.setX(i,f(p.getX(i)));p.setZ(i,f(p.getZ(i)))}}
    const seaM=seaMaterial();const seaMesh=new THREE.Mesh(sgeo,seaM);seaMesh.frustumCulled=false;sea.add(seaMesh);
    seaM.uniforms.uHull.value.set(bmAt(0)+.02,ZB-.2,ZF,ZS+.1);
    // a palm island off the port bow
    const IX=-(H+8.5),IZ=ZB-.5,IR=3.2;seaM.uniforms.uIsle.value.set(IX,IZ,IR);
    {const isl=new THREE.Group();isl.position.set(IX,0,IZ);sea.add(isl);
     const ig=lathe([[0,.62],[1.2,.55],[2.2,.32],[2.9,.08],[IR+.2,-.25],[IR+.6,-.8]],40);const ip=ig.attributes.position;for(let i=0;i<ip.count;i++){const x=ip.getX(i),z=ip.getZ(i),a=Math.atan2(z,x),f=1+.13*Math.sin(a*3+1)+.07*Math.sin(a*7);ip.setX(i,x*f);ip.setZ(i,z*f)}ig.computeVertexNormals();
     const sand=new THREE.MeshStandardMaterial({color:'#efd29a',roughness:1,map:noiseTex('#ffffff',30)});isl.add(M(ig,sand));
     const gm=new THREE.MeshStandardMaterial({color:'#5f8c3c',roughness:1,flatShading:true});const gg=new THREE.IcosahedronGeometry(1.1,1);gg.scale(1.3,.32,1);isl.add(M(gg,gm,-.3,.62,.2));
     for(const [x,z,s,r] of[[-.4,.1,2.6,0],[.6,-.5,2.2,1.2],[.1,.9,2.0,2.4],[-1.4,-.4,1.7,3.6]]){const p=palm(s,ctx,.02);p.position.set(x,.62,z);p.rotation.y=r;isl.add(p);bake(p.children[0])}
     const rk=mat('#7e746a',{flatShading:true,roughness:.95});for(let k=0;k<7;k++){const a=k/7*TAU+.3,r=2.5+Math.random()*.6;const o=M(new THREE.DodecahedronGeometry(.25+Math.random()*.35,0),rk,Math.cos(a)*r,.05,Math.sin(a)*r,Math.random(),Math.random(),0);isl.add(o)}
     const bt=M(boatGeo(1.2,.55,.3),gc('boatM',()=>new THREE.MeshStandardMaterial({map:boatTex(),side:THREE.DoubleSide,roughness:.7})),1.9,.38,1.1,0,.8,.18);isl.add(bt);
     const hut=new THREE.Group();hut.position.set(.9,.6,.2);for(const [x,z] of[[.3,.3],[.3,-.3],[-.3,.3],[-.3,-.3]])hut.add(cyl(.03,.03,.55,DW,x,.27,z,5));const rf=M(new THREE.ConeGeometry(.6,.42,4),mat('#c8a457',{flatShading:true,roughness:1}),0,.72,0,0,PI/4,0);hut.add(rf);isl.add(hut);
     bake(isl)}
    // a Dutch navy ship hunting the pirates on the far side
    const nav=new THREE.Group();{const S2=1.25;nav.position.set(H+10,0,ZB+2);nav.rotation.y=.35;sea.add(nav);
     const hm=new THREE.MeshStandardMaterial({map:boatTex(),side:THREE.DoubleSide,roughness:.7,color:'#9a8070'});const hg=boatGeo(4.6*S2,1.5*S2,1.3*S2,.6);const h=M(hg,hm,0,.65,0,0,PI/2,0);nav.add(h);
     nav.add(box(1.2*S2,.35,1.0*S2,mat('#5a3a22'),0,.85,1.6*S2));
     const sm2=new THREE.MeshStandardMaterial({color:'#f6eee0',side:THREE.DoubleSide,roughness:.9,emissive:'#ff9a55',emissiveIntensity:.15});
     for(const [z,hh] of[[-1.1*S2,4.2],[.6*S2,4.8]]){nav.add(cyl(.06,.08,hh,mastM,0,.6+hh/2,z,8));for(const [y,w,sh2] of[[2.4,2.2,1.5],[4.1,1.6,1.4]]){const geo=new THREE.PlaneGeometry(w,sh2,6,4);const p=geo.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y2=p.getY(i);p.setZ(i,-.35*Math.cos(x/w*PI)*Math.cos(y2/sh2*PI*.9))}geo.computeVertexNormals();const s=new THREE.Mesh(geo,sm2);s.position.set(0,.6+y-sh2/2+.3,z-.1);nav.add(s)}}
     const nf=flagMesh(.6,.4,new THREE.MeshStandardMaterial({map:dutchFlag(),side:THREE.DoubleSide,roughness:.8}),8,4);nf.position.set(0,.6+4.8,.6*S2);nf.rotation.y=PI/2;nav.add(nf);flags.push(nf);
     const bl=[];nav.traverse(o=>{if(o.userData.flag)bl.push(o)});bl.forEach(o=>keep(o));bake(nav)}
    // seagulls (instanced)
    const GN=HQ?9:5;const gb=new THREE.SphereGeometry(.06,8,6);gb.scale(1.9,.75,.75);
    const gw=new THREE.BufferGeometry();gw.setAttribute('position',new THREE.Float32BufferAttribute([.05,0,0, -.06,0,0, -.02,.02,.2, .02,.015,.16, -.1,-.01,.36],3));gw.setIndex([0,1,2,0,2,3,3,2,4]);gw.computeVertexNormals();
    const gbm=new THREE.InstancedMesh(gb,mat('#f4f1ea',{roughness:.7}),GN),gwl=new THREE.InstancedMesh(gw,mat('#e8e6e2',{roughness:.7,side:THREE.DoubleSide}),GN),gwr=new THREE.InstancedMesh(gw,mat('#e8e6e2',{roughness:.7,side:THREE.DoubleSide}),GN);
    for(const o of[gbm,gwl,gwr]){o.castShadow=true;o.frustumCulled=false;world.add(o)}
    const gulls=[];for(let i=0;i<GN;i++)gulls.push({r:H+2.5+Math.random()*4,y:3.2+Math.random()*2.6,w:(.12+Math.random()*.1)*(i%3?1:-1),ph:Math.random()*TAU,cx:(Math.random()-.5)*3,cz:-H-1+(Math.random()-.5)*4,fp:Math.random()*6});
    const dm=new THREE.Object3D(),M4=new THREE.Matrix4(),M5=new THREE.Matrix4(),FL=new THREE.Matrix4().makeScale(1,1,-1);
    // dolphins leaping off the bow
    const dg=(()=>{const b=lathe([[0,-.5],[.06,-.42],[.13,-.2],[.15,0],[.12,.2],[.07,.36],[.03,.46],[.035,.52],[0,.56]],12);b.rotateZ(-PI/2);
      const fin=new THREE.ConeGeometry(.06,.18,4);fin.translate(-.02,.18,0);const tl=new THREE.BoxGeometry(.05,.02,.32);tl.translate(-.52,0,0);const parts=[b,fin,tl].map(q=>{q=q.index?q.toNonIndexed():q;for(const k of Object.keys(q.attributes))if(!['position','normal','uv'].includes(k))q.deleteAttribute(k);return q});return mergeGeometries(parts)})();
    const dolM=mat('#5f7488',{roughness:.3,metalness:.1});const dols=[];for(let i=0;i<2;i++){const d=new THREE.Mesh(dg,dolM);d.castShadow=true;d.scale.setScalar(.9);world.add(d);dols.push({d,off:i*1.1,side:i?1:-1})}

    // ---- animation ----
    let roll=0;
    ctx.anim((t,dt)=>{
      seaM.uniforms.uT.value=t;seaM.uniforms.uSun.value.copy(sun.position).normalize();
      sea.rotation.z=Math.sin(t*.42)*.011;sea.rotation.x=Math.sin(t*.31+1)*.006;sea.position.y=SEA+Math.sin(t*.55)*.045;
      roll=Math.sin(t*.42)*-.011;rig.rotation.z=roll;rig.rotation.x=Math.sin(t*.31+1)*-.003;rig.updateMatrixWorld(true);
      for(const s of sails)updSail(s,t);for(const f of flags)updFlag(f,t);
      bell.rotation.x=Math.sin(t*.9)*.12;bell.rotation.z=roll*2;
      nav.position.y=Math.sin(t*.7+2)*.05;nav.rotation.z=Math.sin(t*.5)*.03;
      // jib
      {const top=fm2.g.localToWorld(V3(0,fm2.h1+.2,-.05));const p=jibGeo.attributes.position;let i=0;const A=jibB,B=jibF,C=top;
       for(let r=0;r<=JN;r++)for(let c=0;c<=JN-r;c++){const u=c/JN,v=r/JN;const w=1-u-v;const x=A.x*w+B.x*u+C.x*v,y=A.y*w+B.y*u+C.y*v,z=A.z*w+B.z*u+C.z*v;const bulge=Math.sin(PI*(u+v))*Math.min(1,w*3)*.35*(1+.08*Math.sin(t*1.2));p.setXYZ(i++,x+bulge*.9,y,z-bulge*.2)}
       p.needsUpdate=true;jibGeo.computeVertexNormals()}
      // rigging
      {const p=lgeo.attributes.position;for(let i=0;i<lines.length;i++){const a=wp(lines[i][0]),b=wp(lines[i][1]);p.setXYZ(i*2,a.x,a.y,a.z);p.setXYZ(i*2+1,b.x,b.y,b.z)}p.needsUpdate=true}
      // gulls
      for(let i=0;i<GN;i++){const q=gulls[i];const a=t*q.w+q.ph;const x=q.cx+Math.cos(a)*q.r,z=q.cz+Math.sin(a)*q.r*.8,y=q.y+Math.sin(t*.6+q.ph)*.35;
        dm.position.set(x,y,z);dm.rotation.set(0,-a+(q.w>0?-PI/2:PI/2),q.w>0?-.25:.25,'YXZ');dm.rotation.set(0,Math.atan2(-(Math.cos(a)*q.r*.8*q.w),-Math.sin(a)*q.r*q.w)*-1,0);
        const vx=-Math.sin(a)*q.r*q.w,vz=Math.cos(a)*q.r*.8*q.w;dm.rotation.set(0,Math.atan2(-vz,vx),0);dm.rotateX(q.w>0?-.3:.3);dm.updateMatrix();gbm.setMatrixAt(i,dm.matrix);
        const cyc=(t*.35+q.fp)%3;const flap=cyc<1.6?Math.sin(t*7+q.fp)*.6:.12;
        M5.makeRotationX(-flap);M4.multiplyMatrices(dm.matrix,M5);gwl.setMatrixAt(i,M4);M4.multiplyMatrices(dm.matrix,FL).multiply(M5);gwr.setMatrixAt(i,M4)}
      gbm.instanceMatrix.needsUpdate=gwl.instanceMatrix.needsUpdate=gwr.instanceMatrix.needsUpdate=true;
      // dolphins
      for(const q of dols){const per=9,p=((t+q.off)%per)/1.7;if(p<1){const x=q.side*(bdAt(ZB+2)+1.4+p*.4),z=ZB+3-p*3.2,y=SEA-.25+Math.sin(p*PI)*1.05;q.d.visible=true;q.d.position.set(x,y,z);q.d.rotation.set(0,PI/2,0);q.d.rotateZ(Math.cos(p*PI)*.9)}else q.d.visible=false}
    });
  }
});
})();
