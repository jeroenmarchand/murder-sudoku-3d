// Space: an orbital research station over a ringed gas giant. A cold, low sun rakes long shadows across
// the deck; a habitat ring turns below, solar wings track the light, a shuttle docks and leaves.
(()=>{
const TAU=Math.PI*2,V3=THREE.Vector3;
const cv=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
const ctex=(c,rep)=>{const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;if(rep){t.wrapS=t.wrapT=THREE.RepeatWrapping}return t};
// lazy texture cache: nothing is painted unless this setting is actually used
const TX={};const tx=(k,f)=>TX[k]||(TX[k]=f());

// ---------- geometry helpers ----------
const GC={};
// rounded, bevelled box centred on the origin
function rgeo(w,h,d,r=.04,b){b=b??Math.min(.016,h*.3,w*.25,d*.25);const k=[w,h,d,r,b].map(v=>(+v).toFixed(3)).join();if(GC[k])return GC[k];
  const iw=Math.max(.004,w-2*b),id=Math.max(.004,d-2*b);r=Math.max(.001,Math.min(r,iw/2-.0005,id/2-.0005));
  const g=new THREE.ExtrudeGeometry(roundRect(iw,id,r),{depth:Math.max(.002,h-2*b),bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:2,curveSegments:5});
  g.rotateX(-Math.PI/2);g.translate(0,b-h/2,0);return GC[k]=g}
function rb(w,h,d,r,m,x=0,y=0,z=0,b){const o=sh(new THREE.Mesh(rgeo(w,h,d,r,b),m));o.position.set(x,y,z);return o}
function tor(R,r,m,x=0,y=0,z=0,rx=Math.PI/2,seg=32){const o=sh(new THREE.Mesh(new THREE.TorusGeometry(R,r,8,seg),m));o.position.set(x,y,z);o.rotation.x=rx;return o}
function caps(r,l,m,x=0,y=0,z=0){const o=sh(new THREE.Mesh(new THREE.CapsuleGeometry(r,l,6,16),m));o.position.set(x,y,z);return o}
const rot=(o,x=0,y=0,z=0)=>{o.rotation.set(x,y,z);return o};
const live=o=>{o.userData.live=true;return o};
// merge an object's static parts into one mesh per material: a whole chair becomes three draw calls
function bake(g){const by=new Map();
  for(const o of g.children){if(!o.isMesh||o.userData.live||o.children.length||Array.isArray(o.material))continue;const a=by.get(o.material)||[];a.push(o);by.set(o.material,a)}
  for(const [m,parts] of by){if(parts.length<2)continue;
    const geos=parts.map(o=>{o.updateMatrix();const q=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();for(const k of Object.keys(q.attributes))if(!['position','normal','uv'].includes(k))q.deleteAttribute(k);return q.applyMatrix4(o.matrix)});
    const mg=mergeGeometries(geos);geos.forEach(q=>q.dispose());if(!mg)continue;parts.forEach(o=>g.remove(o));const mm=new THREE.Mesh(mg,m);
    mm.castShadow=!m.transparent;mm.receiveShadow=true;g.add(mm)}
  return g}

// ---------- materials ----------
const HUL=mat('#e6e9ef',{metalness:.3,roughness:.32}),HUL2=mat('#c3cad6',{metalness:.55,roughness:.34}),DRK=mat('#262b35',{metalness:.55,roughness:.4}),
  GUN=mat('#5c6575',{metalness:.85,roughness:.28}),CHR=mat('#eef2f8',{metalness:1,roughness:.12}),RUB=mat('#17191f',{roughness:.85}),
  ORN=mat('#ff7b30',{roughness:.5}),CUS=mat('#33476b',{roughness:.7}),RED=mat('#b5232f',{roughness:.55}),YEL=mat('#e9b524',{roughness:.5}),
  GOLDV=mat('#e0a640',{metalness:1,roughness:.1}),
  GLS=mat('#a8ecff',{metalness:.1,roughness:.04,transparent:true,opacity:.24,emissive:'#2a8fb8',emissiveIntensity:.3,depthWrite:false});
// animated emissives (own instances so the clock can breathe them without touching the shared cache)
const EM=(c,e,k)=>new THREE.MeshStandardMaterial({color:c,emissive:e,emissiveIntensity:k,roughness:.35,metalness:.1});
const A={cyan:EM('#c8f7ff','#36d6ff',2.6),amber:EM('#ffd9a0','#ff9a2a',2.4),red:EM('#ff8a8a','#ff2a2a',2.6),green:EM('#b8ffcf','#2aff7a',2.4),
  mag:EM('#ffb8f2','#ff3ad8',2.4),core:EM('#e8fbff','#5ad8ff',3.4),ice:EM('#e8fbff','#8fe3ff',1.8),win:EM('#fff1d6','#ffd08a',2)};
// textures used by materials below are created lazily inside builders

// ---------- canvas textures ----------
function glowTex(){const c=cv(128,128),g=c.getContext('2d'),r=g.createRadialGradient(64,64,0,64,64,64);
  r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.12,'rgba(255,255,255,.85)');r.addColorStop(.35,'rgba(255,255,255,.22)');r.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=r;g.fillRect(0,0,128,128);return new THREE.CanvasTexture(c)}
function streakTex(){const c=cv(256,32),g=c.getContext('2d'),r=g.createLinearGradient(0,0,256,0);
  r.addColorStop(0,'rgba(255,255,255,0)');r.addColorStop(.5,'rgba(255,255,255,1)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,14,256,4);
  const v=g.createLinearGradient(0,0,0,32);v.addColorStop(0,'rgba(0,0,0,1)');v.addColorStop(.5,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,1)');
  g.globalCompositeOperation='destination-out';g.fillStyle=v;g.fillRect(0,0,256,32);return new THREE.CanvasTexture(c)}
const SOFT=()=>tx('soft',glowTex);
function spr(color,s,x=0,y=0,z=0,o=1,k=1,fog=true){const m=new THREE.SpriteMaterial({map:SOFT(),color:new THREE.Color(color).multiplyScalar(k),blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:o,fog});
  const p=new THREE.Sprite(m);p.scale.setScalar(s);p.position.set(x,y,z);return p}
function scanTex(){const c=cv(4,64),g=c.getContext('2d');for(let y=0;y<64;y++){const a=y%4<2?1:.45;g.fillStyle=`rgba(255,255,255,${a})`;g.fillRect(0,y,4,1)}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(1,6);return t}
// a little station UI (Dutch or English per LANG), drawn on a canvas (bg=null keeps it transparent for holograms)
function uiCanvas(w,h,bg,seed){const c=cv(w,h),g=c.getContext('2d');let s=seed||1;const R=()=>(s=(s*16807)%2147483647)/2147483647;
  if(bg){const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,bg[0]);gr.addColorStop(1,bg[1]);g.fillStyle=gr;g.fillRect(0,0,w,h)}
  const C='rgba(120,230,255,',u=h/12;g.strokeStyle=C+'.9)';g.lineWidth=Math.max(2,u*.12);
  const k=u*1.2;for(const [x,y,dx,dy] of [[4,4,1,1],[w-4,4,-1,1],[4,h-4,1,-1],[w-4,h-4,-1,-1]]){g.beginPath();g.moveTo(x+dx*k,y);g.lineTo(x,y);g.lineTo(x,y+dy*k);g.stroke()}
  g.fillStyle=C+'1)';g.font=`700 ${u*.95}px Inter, 'Avenir Next', sans-serif`;g.textBaseline='top';
  const NL=typeof LANG==='undefined'||LANG==='nl';
  const T=NL?['STATION KEPLER-9','BAAN 412 KM','SECTOR 7 · DEK B','KOERS 214°','REACTOR NOMINAAL']:['STATION KEPLER-9','ORBIT 412 KM','SECTOR 7 · DECK B','HEADING 214°','REACTOR NOMINAL'];g.fillText(T[Math.floor(R()*T.length)],u*.8,u*.7);
  g.font=`600 ${u*.6}px Inter, sans-serif`;g.fillStyle=C+'.75)';
  const rows=NL?[['O₂',.98],['DRUK',.82],['ENERGIE',.64],['KOELING',.71],['SCHILD',.9]]:[['O₂',.98],['PRESSURE',.82],['POWER',.64],['COOLING',.71],['SHIELD',.9]];
  for(let i=0;i<4;i++){const [n,v]=rows[(i+Math.floor(R()*5))%5],y=u*2.4+i*u*1.25;g.fillText(n,u*.8,y);
    g.fillStyle=C+'.18)';g.fillRect(u*4.2,y+u*.12,w*.32,u*.42);g.fillStyle=i===2?'rgba(255,170,80,.95)':C+'.9)';g.fillRect(u*4.2,y+u*.12,w*.32*(v-R()*.1),u*.42);g.fillStyle=C+'.75)'}
  // radar
  const rx=w*.78,ry=h*.42,rr=Math.min(w*.16,h*.3);g.strokeStyle=C+'.6)';g.lineWidth=1.5;for(const f of[1,.66,.33]){g.beginPath();g.arc(rx,ry,rr*f,0,TAU);g.stroke()}
  g.beginPath();g.moveTo(rx-rr,ry);g.lineTo(rx+rr,ry);g.moveTo(rx,ry-rr);g.lineTo(rx,ry+rr);g.stroke();
  const sw=g.createRadialGradient(rx,ry,0,rx,ry,rr);sw.addColorStop(0,C+'.5)');sw.addColorStop(1,C+'0)');g.fillStyle=sw;g.beginPath();g.moveTo(rx,ry);g.arc(rx,ry,rr,-.2,.9);g.fill();
  for(let i=0;i<5;i++){g.fillStyle=i?C+'1)':'rgba(255,120,90,1)';g.beginPath();g.arc(rx+(R()-.5)*rr*1.3,ry+(R()-.5)*rr*1.3,u*.14,0,TAU);g.fill()}
  // waveform
  g.strokeStyle='rgba(160,255,200,.9)';g.lineWidth=2;g.beginPath();for(let x=0;x<w*.92;x+=3){const y=h*.86+Math.sin(x*.06+seed)*u*.5*Math.sin(x*.013)+Math.sin(x*.21)*u*.12;x?g.lineTo(u*.8+x*.0+x*.0+x,y):g.moveTo(u*.8,y)}g.stroke();
  if(!bg){g.globalCompositeOperation='destination-out';for(let y=0;y<h;y+=3){g.fillStyle='rgba(0,0,0,.45)';g.fillRect(0,y,w,1)}}
  return c}
const HOLO=()=>tx('holo',()=>new THREE.MeshBasicMaterial({color:new THREE.Color('#5fe6ff').multiplyScalar(1.7),map:scanTex(),transparent:true,opacity:.5,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
const HOLOW=()=>tx('holow',()=>new THREE.MeshBasicMaterial({color:new THREE.Color('#6fe9ff').multiplyScalar(2),wireframe:true,transparent:true,opacity:.75,blending:THREE.AdditiveBlending,depthWrite:false}));
const HOLOUI=k=>tx('holoui'+k,()=>new THREE.MeshBasicMaterial({map:ctex(uiCanvas(512,288,null,k*97+3)),color:new THREE.Color('#ffffff').multiplyScalar(1.5),transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
const SCREEN=L=>tx('scr'+L,()=>{const t=ctex(uiCanvas(256*L,150,['#06121f','#0b2236'],L*31+7),true);return new THREE.MeshStandardMaterial({map:t,emissiveMap:t,emissive:'#ffffff',emissiveIntensity:1.5,roughness:.2,metalness:.2})});
// server rack fronts: faceplates in the colour map, LEDs in the emissive map; the clock flicks the offset so LEDs blink
function rackTex(){const W=128,Hh=512,a=cv(W,Hh),b=cv(W,Hh),g=a.getContext('2d'),e=b.getContext('2d');g.fillStyle='#1a1e26';g.fillRect(0,0,W,Hh);e.fillStyle='#000';e.fillRect(0,0,W,Hh);
  const cols=['#39f08a','#3fd2ff','#ffb03a','#39f08a','#39f08a','#ff4a4a'];
  for(let y=0;y<Hh;y+=16){g.fillStyle=(y/16)%5===0?'#2a303b':'#232832';g.fillRect(3,y+1,W-6,14);g.fillStyle='#0d1015';for(let x=40;x<W-10;x+=5)g.fillRect(x,y+4,3,8);
    for(let k=0;k<4;k++)if(Math.random()<.75){e.fillStyle=cols[Math.floor(Math.random()*cols.length)];e.fillRect(8+k*7,y+6,4,4)}}
  const ta=ctex(a,true),tb=ctex(b,true);ta.repeat.set(1,.5);tb.repeat.set(1,.5);return [ta,tb]}
const RACKS=()=>tx('racks',()=>[0,1,2].map(i=>{const [m,e]=rackTex();return new THREE.MeshStandardMaterial({map:m,emissiveMap:e,emissive:'#ffffff',emissiveIntensity:2.2,roughness:.5,metalness:.4})}));
function hullTex(){const W=512,Hh=128,a=cv(W,Hh),g=a.getContext('2d');g.fillStyle='#cfd5de';g.fillRect(0,0,W,Hh);
  for(let x=0;x<W;x+=64){g.fillStyle=Math.random()<.5?'rgba(0,0,0,.06)':'rgba(255,255,255,.08)';g.fillRect(x,0,64,Hh);g.fillStyle='rgba(20,25,35,.45)';g.fillRect(x,0,2,Hh)}
  g.fillStyle='rgba(20,25,35,.4)';g.fillRect(0,40,W,2);g.fillRect(0,88,W,2);g.fillStyle='#1a2030';for(let x=6;x<W;x+=16)g.fillRect(x,56,10,16);
  const b=cv(W,Hh),e=b.getContext('2d');e.fillStyle='#000';e.fillRect(0,0,W,Hh);for(let x=6;x<W;x+=16)if(Math.random()<.7){e.fillStyle=Math.random()<.85?'#ffd9a0':'#9fe8ff';e.fillRect(x+1,57,8,14)}
  const ta=ctex(a,true),tb=ctex(b,true);return [ta,tb]}
function solarTex(){const S=256,c=cv(S,S),g=c.getContext('2d');g.fillStyle='#c9d0da';g.fillRect(0,0,S,S);
  for(let y=0;y<8;y++)for(let x=0;x<4;x++){const gr=g.createLinearGradient(0,y*32,0,y*32+30);gr.addColorStop(0,'#1d3a78');gr.addColorStop(1,'#0c1a3c');g.fillStyle=gr;g.fillRect(x*64+3,y*32+2,58,28);
    g.strokeStyle='rgba(140,170,230,.35)';g.lineWidth=1;g.beginPath();g.moveTo(x*64+32,y*32+2);g.lineTo(x*64+32,y*32+30);g.stroke()}
  return ctex(c)}
function hazardTex(){const c=cv(128,32),g=c.getContext('2d');g.fillStyle='#e9b524';g.fillRect(0,0,128,32);g.fillStyle='#16181d';for(let x=-32;x<128;x+=24){g.beginPath();g.moveTo(x,32);g.lineTo(x+12,32);g.lineTo(x+44,0);g.lineTo(x+32,0);g.fill()}return ctex(c,true)}
function planetTex(){const W=1024,Hh=512,c=cv(W,Hh),g=c.getContext('2d'),d=g.createImageData(W,Hh);
  const pal=[[238,222,190],[220,186,140],[184,128,86],[156,98,66],[230,206,168],[198,166,132],[150,150,160],[240,228,204],[170,112,80],[214,196,170]];
  const NB=56,bc=[];for(let i=0;i<=NB;i++){const a=pal[Math.floor(Math.random()*pal.length)],b=pal[Math.floor(Math.random()*pal.length)],f=Math.random()*.5;bc.push(a.map((v,k)=>v*(1-f)+b[k]*f))}
  for(let y=0;y<Hh;y++){const lat=y/Hh,pole=.62+.38*Math.pow(Math.sin(lat*Math.PI),.6);
    for(let x=0;x<W;x++){const u=x/W*TAU;const w=lat+.010*Math.sin(u*3+lat*38)+.006*Math.sin(u*7+lat*90+1.3)+.003*Math.sin(u*19+lat*210)+.0015*Math.sin(u*41+lat*400);
      const b=Math.max(0,Math.min(NB-.001,w*NB)),i=Math.floor(b);let f=b-i;f=f*f*(3-2*f);const A0=bc[i],B0=bc[i+1];const n=(Math.random()-.5)*6;const o=(y*W+x)*4;
      d.data[o]=(A0[0]+(B0[0]-A0[0])*f)*pole+n;d.data[o+1]=(A0[1]+(B0[1]-A0[1])*f)*pole+n;d.data[o+2]=(A0[2]+(B0[2]-A0[2])*f)*pole+n;d.data[o+3]=255}}
  g.putImageData(d,0,0);
  // the great storm: a rusty oval with swirled rims
  const sx=W*.63,sy=Hh*.6;g.save();g.translate(sx,sy);g.scale(1,.5);const rg=g.createRadialGradient(0,0,4,0,0,46);rg.addColorStop(0,'rgba(196,92,58,.95)');rg.addColorStop(.6,'rgba(214,128,84,.7)');rg.addColorStop(1,'rgba(230,190,150,0)');
  g.fillStyle=rg;g.beginPath();g.arc(0,0,46,0,TAU);g.fill();g.strokeStyle='rgba(250,232,204,.45)';g.lineWidth=3;for(const r of[22,34]){g.beginPath();g.arc(0,0,r,.3,5.4);g.stroke()}g.restore();
  for(let k=0;k<14;k++){g.fillStyle=`rgba(250,240,220,${.15+Math.random()*.2})`;g.save();g.translate(Math.random()*W,Hh*(.25+Math.random()*.5));g.scale(1,.35);g.beginPath();g.arc(0,0,4+Math.random()*9,0,TAU);g.fill();g.restore()}
  const t=ctex(c);t.wrapS=THREE.RepeatWrapping;return t}
function ringTex(){const W=512,Hh=64,c=cv(W,Hh),g=c.getContext('2d'),d=g.createImageData(W,Hh);const bands=[];let a=0;for(let x=0;x<W;x++){a+=(Math.random()-.5)*.25;a=Math.max(-.5,Math.min(.5,a));bands.push(a)}
  for(let x=0;x<W;x++){const u=x/W;let al=.55+bands[x]*.6;al*=Math.min(1,u*14)*Math.min(1,(1-u)*10);if(u>.6&&u<.66)al*=.08;if(u>.84&&u<.855)al*=.25;al=Math.max(0,Math.min(1,al));
    const tone=u<.6?[226,206,176]:[196,186,176];for(let y=0;y<Hh;y++){const v=y/Hh,m=.88+.12*Math.sin(v*TAU*3+u*30);const o=(y*W+x)*4;
      d.data[o]=tone[0]*(.85+bands[x]*.3);d.data[o+1]=tone[1]*(.85+bands[x]*.3);d.data[o+2]=tone[2]*(.85+bands[x]*.3);d.data[o+3]=255*al*m}}
  g.putImageData(d,0,0);const t=ctex(c);t.wrapT=THREE.RepeatWrapping;return t}
function nebTex(hue){const S=256,c=cv(S,S),g=c.getContext('2d');g.globalCompositeOperation='lighter';
  for(let k=0;k<26;k++){const x=S/2+(Math.random()-.5)*S*.55,y=S/2+(Math.random()-.5)*S*.4,r=20+Math.random()*70,h=hue+(Math.random()-.5)*60;
    const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,`hsla(${h},80%,62%,.16)`);gr.addColorStop(1,`hsla(${h},80%,50%,0)`);g.fillStyle=gr;g.fillRect(0,0,S,S)}
  const e=g.createRadialGradient(S/2,S/2,S*.2,S/2,S/2,S/2);g.globalCompositeOperation='destination-in';e.addColorStop(0,'rgba(0,0,0,1)');e.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=e;g.fillRect(0,0,S,S);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
function plateTex(L){const W=256*L,Hh=256,c=cv(W,Hh),g=c.getContext('2d');g.fillStyle='#0a1a2c';g.fillRect(0,0,W,Hh);
  g.strokeStyle='rgba(90,220,255,.55)';g.lineWidth=2;const r=16,dx=r*1.732;for(let y=-r;y<Hh+r;y+=r*1.5)for(let x=-dx,row=Math.round(y/(r*1.5));x<W+dx;x+=dx){const cx=x+(row%2?dx/2:0);g.beginPath();for(let k=0;k<6;k++){const a=k/6*TAU+Math.PI/6;g[k?'lineTo':'moveTo'](cx+Math.cos(a)*r*.9,y+Math.sin(a)*r*.9)}g.closePath();g.stroke()}
  const gr=g.createRadialGradient(W/2,Hh/2,10,W/2,Hh/2,Math.max(W,Hh)*.6);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.55)');g.fillStyle=gr;g.fillRect(0,0,W,Hh);
  g.strokeStyle='rgba(160,245,255,1)';g.lineWidth=10;g.strokeRect(12,12,W-24,Hh-24);g.lineWidth=3;g.strokeRect(30,30,W-60,Hh-60);
  g.fillStyle='rgba(160,245,255,.9)';for(let x=60;x<W-40;x+=70){g.beginPath();g.moveTo(x,Hh/2-18);g.lineTo(x+18,Hh/2);g.lineTo(x,Hh/2+18);g.lineTo(x+8,Hh/2);g.closePath();g.fill()}
  return ctex(c)}

// ---------- floors ----------
function panelEdge(g,S,sh,li,inset=10){g.strokeStyle=sh(.32);g.lineWidth=3;g.strokeRect(inset,inset,S-2*inset,S-2*inset);g.strokeStyle=li(.22);g.lineWidth=1.5;g.strokeRect(inset+3,inset+3,S-2*inset-6,S-2*inset-6)}
function rivets(g,S,sh,li,o=22){for(const [x,y] of[[o,o],[S-o,o],[o,S-o],[S-o,S-o]]){g.fillStyle=sh(.35);g.beginPath();g.arc(x+1,y+1,4,0,TAU);g.fill();g.fillStyle=li(.45);g.beginPath();g.arc(x,y,3.2,0,TAU);g.fill()}}
const FL={
  tread(g,S,R,sh,li){for(let y=14,r=0;y<S;y+=20,r++)for(let x=14+(r%2)*10;x<S-6;x+=20){g.save();g.translate(x,y);g.rotate((r%2)?.75:-.75);g.fillStyle=li(.3);g.fillRect(-7,-2,14,3.5);g.fillStyle=sh(.28);g.fillRect(-7,1.5,14,1.6);g.restore()}
    panelEdge(g,S,sh,li,6);rivets(g,S,sh,li,16)},
  atrium(g,S,R,sh,li){g.fillStyle=li(.18);g.fillRect(14,14,S-28,S-28);panelEdge(g,S,sh,li,14);g.strokeStyle=sh(.12);g.lineWidth=2;g.beginPath();g.arc(S/2,S/2,S*.27,0,TAU);g.stroke();
    g.strokeStyle=li(.3);g.beginPath();g.arc(S/2,S/2,S*.27-3,0,TAU);g.stroke();for(let k=0;k<4;k++){g.save();g.translate(S/2,S/2);g.rotate(k*Math.PI/2+Math.PI/4);g.fillStyle=sh(.12);g.fillRect(S*.31,-2,S*.12,4);g.restore()}},
  circuit(g,S,R,sh,li){g.lineWidth=2.4;for(let k=0;k<22;k++){let x=Math.round(R()*8)*S/8,y=Math.round(R()*8)*S/8;g.strokeStyle=k%3?'rgba(150,235,255,.38)':'rgba(255,255,255,.5)';g.beginPath();g.moveTo(x,y);
      for(let s=0;s<4;s++){if(R()<.5)x+=(R()<.5?-1:1)*S/8*(1+Math.floor(R()*2));else y+=(R()<.5?-1:1)*S/8*(1+Math.floor(R()*2));g.lineTo(x,y)}g.stroke();g.fillStyle='rgba(170,245,255,.7)';g.beginPath();g.arc(x,y,4,0,TAU);g.fill()}
    panelEdge(g,S,sh,li,4)},
  hex(g,S,R,sh,li){const r=S/7,dx=r*1.732;for(let y=0,row=0;y<S+r;y+=r*1.5,row++)for(let x=(row%2)*dx/2;x<S+dx;x+=dx){g.beginPath();for(let k=0;k<6;k++){const a=k/6*TAU+Math.PI/6;g[k?'lineTo':'moveTo'](x+Math.cos(a)*r*.93,y+Math.sin(a)*r*.93)}g.closePath();
      g.fillStyle=R()<.5?li(.14):sh(.03);g.fill();g.strokeStyle=sh(.2);g.lineWidth=3;g.stroke();g.strokeStyle=li(.35);g.lineWidth=1;g.stroke()}},
  grateHex(g,S,R,sh,li){const r=S/9,dx=r*1.732;for(let y=0,row=0;y<S+r;y+=r*1.5,row++)for(let x=(row%2)*dx/2;x<S+dx;x+=dx){g.beginPath();for(let k=0;k<6;k++){const a=k/6*TAU+Math.PI/6;g[k?'lineTo':'moveTo'](x+Math.cos(a)*r*.7,y+Math.sin(a)*r*.7)}g.closePath();
      g.fillStyle=sh(.45);g.fill();g.strokeStyle=li(.25);g.lineWidth=1.5;g.stroke()}panelEdge(g,S,sh,li,5)},
  bridge(g,S,R,sh,li){const c=34;g.fillStyle=li(.1);g.beginPath();g.moveTo(c,14);g.lineTo(S-c,14);g.lineTo(S-14,c);g.lineTo(S-14,S-c);g.lineTo(S-c,S-14);g.lineTo(c,S-14);g.lineTo(14,S-c);g.lineTo(14,c);g.closePath();g.fill();
    g.strokeStyle=li(.4);g.lineWidth=2;g.stroke();g.strokeStyle=sh(.2);g.lineWidth=2;for(let k=1;k<4;k++){g.beginPath();g.moveTo(40,S/2+(k-2)*26);g.lineTo(S-40,S/2+(k-2)*26);g.stroke()}
    g.fillStyle='rgba(255,220,255,.4)';g.fillRect(S/2-30,S/2-3,60,6)},
  galley(g,S,R,sh,li){const n=4,s=S/n;for(let y=0;y<n;y++)for(let x=0;x<n;x++){g.fillStyle=R()<.5?li(.1):sh(.04);g.fillRect(x*s+3,y*s+3,s-6,s-6)}
    g.strokeStyle=sh(.25);g.lineWidth=4;for(let k=0;k<=S;k+=s){g.beginPath();g.moveTo(k,0);g.lineTo(k,S);g.moveTo(0,k);g.lineTo(S,k);g.stroke()}},
  nebula(g,S,R,sh,li){for(let k=0;k<6;k++){const x=R()*S,y=R()*S,r=30+R()*60,gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,R()<.5?'rgba(255,170,255,.25)':'rgba(140,200,255,.22)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,S,S)}
    for(let k=0;k<70;k++){g.fillStyle=`rgba(255,255,255,${.3+R()*.6})`;const r=R()<.9?1:2.2;g.beginPath();g.arc(R()*S,R()*S,r,0,TAU);g.fill()}panelEdge(g,S,sh,li,4)},
  hydro(g,S,R,sh,li){panelEdge(g,S,sh,li,8);for(let y=0;y<3;y++)for(let x=0;x<3;x++){const cx=S/6+x*S/3,cy=S/6+y*S/3;g.fillStyle=sh(.4);g.beginPath();g.arc(cx,cy,S/10,0,TAU);g.fill();g.strokeStyle=li(.35);g.lineWidth=3;g.stroke();
      g.fillStyle='rgba(160,255,140,.5)';for(let k=0;k<5;k++){g.beginPath();g.ellipse(cx+Math.cos(k*1.26)*7,cy+Math.sin(k*1.26)*7,6,3,k*1.26,0,TAU);g.fill()}}},
  grate(g,S,R,sh,li){for(let x=18;x<S-14;x+=14){g.fillStyle=sh(.42);g.fillRect(x,18,7,S-36);g.fillStyle=li(.2);g.fillRect(x+7,18,2,S-36)}panelEdge(g,S,sh,li,6);
    g.fillStyle='rgba(20,20,20,.55)';g.fillRect(6,S-16,S-12,10);g.fillStyle='rgba(240,190,40,.7)';for(let x=6;x<S-12;x+=16){g.beginPath();g.moveTo(x,S-6);g.lineTo(x+8,S-6);g.lineTo(x+14,S-16);g.lineTo(x+6,S-16);g.fill()}},
};

// ---------- objects ----------
const pulse=(t,f,ph=0)=>.5+.5*Math.sin(t*f+ph);
const OB={
  stoel:{name:'kuipstoel',de:true,verb:'Zat',h:.31,build(){const g=new THREE.Group();
    g.add(cyl(.17,.19,.03,DRK,0,.015,0,28));g.add(cyl(.03,.04,.2,CHR,0,.13,0,12));g.add(rb(.44,.07,.42,.1,HUL,0,.24,0));g.add(rb(.38,.04,.36,.09,ORN,0,.29,0));
    g.add(rot(rb(.07,.38,.42,.03,HUL,-.21,.47,0),0,0,.12));g.add(rot(rb(.03,.3,.34,.03,ORN,-.17,.47,0),0,0,.12));g.add(rot(box(.02,.02,.3,A.cyan,-.25,.64,0),0,0,.12));
    for(const z of[-.2,.2]){g.add(box(.03,.08,.03,DRK,-.02,.32,z));g.add(rb(.26,.03,.05,.015,DRK,0,.37,z))}return bake(g)}},
  troon:{name:'commandostoel',de:true,verb:'Zat',h:.38,build(L,ctx){const g=new THREE.Group();
    g.add(cyl(.44,.46,.06,DRK,0,.03,0,40));g.add(tor(.43,.012,A.cyan,0,.062,0));g.add(cyl(.07,.1,.2,CHR,0,.16,0,16));
    g.add(rb(.52,.08,.5,.12,HUL,0,.29,0));g.add(rb(.46,.05,.44,.1,RED,0,.355,0));
    g.add(rot(rb(.1,.46,.52,.05,HUL,-.25,.58,0),0,0,.1));g.add(rot(rb(.04,.4,.42,.04,RED,-.2,.58,0),0,0,.1));g.add(rot(rb(.09,.1,.3,.04,HUL,-.29,.85,0),0,0,.1));
    for(const z of[-.28,.28]){g.add(rb(.36,.05,.09,.03,HUL,.02,.46,z));g.add(box(.04,.1,.06,DRK,-.06,.4,z));g.add(box(.14,.012,.06,A.cyan,.1,.49,z));g.add(box(.025,.012,.025,A.red,-.06,.49,z))}
    const h=live(new THREE.Mesh(new THREE.PlaneGeometry(.2,.12),HOLOUI(1)));h.position.set(.14,.62,.28);h.rotation.y=-.5;g.add(h);
    const h2=live(new THREE.Mesh(new THREE.PlaneGeometry(.2,.12),HOLOUI(2)));h2.position.set(.14,.62,-.28);h2.rotation.y=.5;g.add(h2);
    const ph=Math.random()*6;ctx.anim(t=>{h.position.y=h2.position.y=.62+Math.sin(t*1.3+ph)*.012});return bake(g)}},
  tafel:{name:'console',de:true,build(L,ctx){const g=new THREE.Group(),w=L-.16;
    g.add(rb(w-.1,.06,.48,.05,DRK,0,.03,0));g.add(rb(w,.36,.56,.06,HUL,0,.24,0));g.add(box(w-.06,.016,.02,A.cyan,0,.2,.285));
    for(let x=-w/2+.12;x<w/2-.08;x+=.08)g.add(box(.03,.12,.01,DRK,x,.24,-.284));
    const top=rot(rb(w-.02,.05,.52,.04,DRK,0,.45,0),.22,0,0);g.add(top);
    const s=live(new THREE.Mesh(new THREE.PlaneGeometry(w-.14,.4),SCREEN(L)));s.position.set(0,.478,0);s.rotation.x=-Math.PI/2+.22;s.receiveShadow=true;g.add(s);
    const hm=live(new THREE.Mesh(new THREE.PlaneGeometry(Math.min(.62,w*.62),.24),HOLOUI(L+2)));hm.position.set(0,.7,-.16);g.add(hm);
    const ph=Math.random()*6;ctx.anim(t=>{hm.position.y=.7+Math.sin(t*1.1+ph)*.01});return bake(g)}},
  bed:{name:'cryobed',verb:'Lag',h:.37,build(L,ctx){const g=new THREE.Group(),w=L-.12;
    g.add(rb(w-.2,.07,.6,.06,DRK,0,.035,0));g.add(box(w-.3,.012,.02,A.ice,0,.04,.305));g.add(box(w-.3,.012,.02,A.ice,0,.04,-.305));
    g.add(rb(w,.2,.78,.1,HUL,0,.17,0));g.add(rb(w-.12,.1,.62,.06,mat('#dfe9f2',{roughness:.6}),0,.32,0));
    g.add(rb(.26,.06,.46,.05,mat('#ffffff',{roughness:.7}),-w/2+.26,.385,0));
    for(const z of[-.395,.395])g.add(box(w-.24,.02,.012,A.ice,0,.21,z));
    g.add(rb(.16,.34,.74,.05,HUL2,-w/2+.06,.34,0));g.add(box(.012,.14,.4,SCREEN(1),-w/2+.145,.4,0));g.add(rb(.12,.1,.7,.04,DRK,w/2-.04,.27,0));
    // the open canopy, hinged on the far side
    const pv=new THREE.Group();pv.position.set(0,.36,-.34);const shell=new THREE.Mesh(new THREE.CylinderGeometry(.25,.25,w-.24,24,1,true,Math.PI/2,Math.PI),GLS);
    shell.rotation.z=Math.PI/2;shell.position.z=.25;shell.renderOrder=3;pv.add(shell);
    const fr=new THREE.Mesh(new THREE.TorusGeometry(.25,.012,6,24,Math.PI),HUL2);fr.rotation.y=Math.PI/2;fr.position.set(-(w-.24)/2,0,.25);const fr2=fr.clone();fr2.position.x*=-1;pv.add(fr,fr2);
    pv.rotation.x=-1.85;g.add(pv);
    const mist=live(spr('#9fe8ff',.7,0,.42,0,.25));g.add(mist);const ph=Math.random()*6;
    ctx.anim(t=>{mist.material.opacity=.14+pulse(t,.7,ph)*.14;mist.scale.set(w*.9,.5+pulse(t,.5,ph)*.1,1);pv.rotation.x=-1.85+Math.sin(t*.4+ph)*.015});return bake(g)}},
  tapijt:{name:'lichtplaat',de:true,verb:'Stond',h:.026,blob:false,build(L,ctx){const g=new THREE.Group(),w=L-.1,d=.84;
    const t=tx('plate'+L,()=>{const q=plateTex(L);q.repeat.set(1/(w-.032),1/(d-.032));q.offset.set(.5,.5);return q});
    const m=tx('platem'+L,()=>new THREE.MeshStandardMaterial({map:t,emissiveMap:t,emissive:'#ffffff',emissiveIntensity:1,roughness:.3,metalness:.4}));
    const p=new THREE.Mesh(rgeo(w,.026,d,.08,.008),m);p.position.y=.013;p.receiveShadow=true;g.add(p);
    const bar=new THREE.Mesh(new THREE.PlaneGeometry(.05,d-.12),HOLO());bar.rotation.x=-Math.PI/2;bar.position.y=.03;g.add(bar);
    const ph=Math.random()*6;ctx.anim(t=>{m.emissiveIntensity=.8+pulse(t,1.2,0)*.5;bar.position.x=Math.sin(t*.6+ph)*(w/2-.1)});return g}},
  bank:{name:'zitbank',de:true,verb:'Zat',h:.31,build(){const g=new THREE.Group();
    for(const x of[-.32,.32])g.add(rb(.06,.24,.3,.02,DRK,x,.12,0));g.add(box(.7,.012,.02,A.cyan,0,.03,.1));
    g.add(rb(.84,.05,.34,.04,HUL,0,.26,0));g.add(rb(.78,.03,.3,.03,CUS,0,.295,0));
    g.add(rot(rb(.82,.2,.04,.02,HUL,0,.44,-.16),-.12,0,0));g.add(rot(rb(.74,.16,.025,.02,CUS,0,.44,-.135),-.12,0,0));g.add(rot(box(.6,.012,.02,A.cyan,0,.55,-.185),-.12,0,0));return bake(g)}},
  paard:{name:'hoverbike',de:true,verb:'Zat',h:.5,build(L,ctx){const g=new THREE.Group(),b=new THREE.Group();
    const f=rot(caps(.1,.44,HUL,0,.36,0),0,0,Math.PI/2);f.scale.set(1,1,.85);b.add(f);
    const n=rot(caps(.07,.22,ORN,.12,.42,0),0,0,Math.PI/2-.12);n.scale.set(1,1,.9);b.add(n);
    b.add(rb(.32,.06,.17,.06,RUB,-.06,.47,0));b.add(rot(box(.012,.11,.15,GLS,.25,.5,0),0,0,-.7));
    b.add(rot(cyl(.012,.012,.3,CHR,.19,.51,0,8),Math.PI/2,0,0));for(const z of[-.15,.15])b.add(rot(cyl(.018,.018,.06,RUB,.19,.51,z,8),Math.PI/2,0,0));
    for(const x of[-.28,.28]){b.add(cyl(.12,.13,.06,DRK,x,.17,0,24));b.add(tor(.125,.016,A.cyan,x,.145,0));b.add(cyl(.09,.09,.01,A.cyan,x,.138,0,20));b.add(box(.05,.16,.06,GUN,x*.9,.27,0))}
    b.add(rot(rb(.14,.11,.02,.02,ORN,-.33,.47,0),0,0,.3));b.add(rot(cyl(.05,.065,.08,GUN,-.38,.36,0,14),0,0,Math.PI/2));b.add(rot(cyl(.045,.045,.01,A.amber,-.42,.36,0,14),0,0,Math.PI/2));
    bake(b);g.add(b);const s1=spr('#59dfff',.5,.28,.06,0,.55,1.4),s2=spr('#59dfff',.5,-.28,.06,0,.55,1.4),ex=spr('#ffae5a',.18,-.43,.36,0,.8,1.6);b.add(s1,s2,ex);
    const ph=Math.random()*6;ctx.anim(t=>{b.position.y=Math.sin(t*1.7+ph)*.007;const k=.45+pulse(t,3.1,ph)*.12;s1.scale.setScalar(k);s2.scale.setScalar(k);ex.material.opacity=.6+pulse(t,9,ph)*.3});return g}},
  kist:{name:'vrachtkrat',build(){const g=new THREE.Group(),hz=tx('hzm',()=>new THREE.MeshStandardMaterial({map:hazardTex(),roughness:.5}));
    g.add(rb(.52,.32,.38,.04,mat('#d9dde4',{metalness:.3,roughness:.4}),0,.16,0));g.add(box(.53,.05,.39,hz,0,.24,0));
    for(const [x,z] of[[.24,.17],[-.24,.17],[.24,-.17],[-.24,-.17]])g.add(rb(.07,.33,.07,.02,DRK,x,.165,z));
    g.add(box(.4,.012,.26,DRK,0,.326,0));g.add(box(.14,.07,.008,SCREEN(1),0,.12,.192));g.add(box(.025,.025,.01,A.green,.13,.12,.193));return bake(g)}},
  ton:{name:'opslagvat',build(){const g=new THREE.Group();
    g.add(cyl(.2,.21,.04,DRK,0,.02,0,28));g.add(cyl(.185,.185,.44,HUL2,0,.25,0,28));const dm=sh(new THREE.Mesh(new THREE.SphereGeometry(.185,28,10,0,TAU,0,Math.PI/2),HUL2));dm.scale.y=.35;dm.position.y=.47;g.add(dm);
    for(const y of[.1,.4])g.add(tor(.19,.012,GUN,0,y,0));g.add(cyl(.189,.189,.035,A.amber,0,.25,0,28));
    g.add(cyl(.025,.025,.08,CHR,0,.55,0,10));g.add(tor(.04,.008,RED,0,.59,0));g.add(rot(cyl(.04,.04,.03,GUN,0,.32,.19,14),Math.PI/2,0,0));g.add(rot(cyl(.03,.03,.01,A.green,0,.32,.205,14),Math.PI/2,0,0));return bake(g)}},
  hooibaal:{name:'brandstoftank',de:true,build(){const g=new THREE.Group(),FT=mat('#e66a2c',{metalness:.35,roughness:.38});
    g.add(rb(.62,.03,.42,.04,GUN,0,.015,0));for(const x of[-.18,.18])g.add(rb(.07,.14,.38,.02,DRK,x,.09,0));
    g.add(rot(caps(.16,.34,FT,0,.27,0),0,0,Math.PI/2));for(const x of[-.18,.18])g.add(rot(tor(.163,.014,DRK,x,.27,0,0),0,Math.PI/2,0));
    g.add(rb(.2,.06,.02,.02,A.amber,0,.3,.155));g.add(cyl(.035,.035,.02,CHR,.08,.435,0,14));g.add(cyl(.028,.028,.005,A.green,.08,.447,0,14));
    g.add(rot(cyl(.014,.014,.2,CHR,-.08,.43,0,8),0,0,Math.PI/2));g.add(cyl(.014,.014,.1,CHR,-.18,.39,0,8));return bake(g)}},
  boom:{name:'biokoepel',de:true,build(L,ctx){const g=new THREE.Group();
    g.add(cyl(.3,.33,.16,HUL,0,.08,0,36));g.add(cyl(.27,.27,.01,mat('#2b1d14',{roughness:1}),0,.162,0,32));g.add(tor(.305,.012,A.green,0,.16,0));
    const tr=new THREE.Group();tr.position.y=.16;const curve=new THREE.CatmullRomCurve3([new V3(0,0,0),new V3(.03,.12,.02),new V3(-.02,.24,-.01),new V3(.01,.32,0)]);
    tr.add(sh(new THREE.Mesh(new THREE.TubeGeometry(curve,12,.022,6),mat('#4a3a5a',{roughness:.8}))));
    const lf=[mat('#3fbf9a',{flatShading:true,roughness:.6,emissive:'#0d5a48',emissiveIntensity:.5}),mat('#59d6b0',{flatShading:true,roughness:.6,emissive:'#0d5a48',emissiveIntensity:.5})];
    tr.add(ball(.13,lf[0],0,.34,0,0));tr.add(ball(.09,lf[1],.08,.4,.05,0));tr.add(ball(.08,lf[1],-.07,.38,-.06,0));
    for(let k=0;k<5;k++){const a=k*1.3;tr.add(ball(.016,A.mag,Math.cos(a)*.12,.3+(k%2)*.07,Math.sin(a)*.12,0))}
    bake(tr);tr.userData.sway=[.03,.7,Math.random()*6];g.add(tr);
    const dome=new THREE.Mesh(new THREE.SphereGeometry(.29,28,14,0,TAU,0,Math.PI/2),GLS);dome.scale.y=1.55;dome.position.y=.16;dome.renderOrder=3;g.add(dome);
    g.add(cyl(.07,.07,.02,DRK,0,.615,0,20));g.add(cyl(.05,.05,.01,A.cyan,0,.604,0,20));return bake(g)}},
  struik:{name:'gloeiplant',de:true,build(){const g=new THREE.Group(),p=new THREE.Group();
    const pot=sh(new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(0,0),new THREE.Vector2(.12,0),new THREE.Vector2(.16,.12),new THREE.Vector2(.17,.14),new THREE.Vector2(.15,.14),new THREE.Vector2(0,.13)],28),HUL));g.add(pot);
    g.add(tor(.165,.01,A.mag,0,.14,0));const lm=mat('#2f9a6a',{flatShading:true,roughness:.55}),lm2=mat('#44b884',{flatShading:true,roughness:.55});
    for(let k=0;k<8;k++){const l=.2+(k%3)*.06,pv=new THREE.Group();pv.position.y=.13;pv.rotation.y=k/8*TAU+(k%2)*.3;const tilt=new THREE.Group();tilt.rotation.z=-(.35+(k%3)*.18);
      const leaf=sh(new THREE.Mesh(new THREE.ConeGeometry(.04,l,5),k%2?lm:lm2));leaf.scale.z=.35;leaf.position.y=l/2;tilt.add(leaf);tilt.add(ball(.022,A.mag,0,l+.01,0,1));pv.add(tilt);p.add(pv)}
    p.userData.sway=[.05,.9,Math.random()*6];g.add(p);return bake(g)}},
  bloemperk:{name:'kweekbak',de:true,build(L,ctx){const g=new THREE.Group();
    g.add(rb(.86,.14,.86,.06,HUL,0,.07,0));g.add(box(.76,.01,.76,mat('#0f2c36',{emissive:'#08465a',emissiveIntensity:.6,roughness:.08,metalness:.3}),0,.142,0));
    const st=mat('#3c8a3a',{roughness:.7}),lt=[mat('#6bd35a',{flatShading:true,roughness:.6}),mat('#8fe36a',{flatShading:true,roughness:.6})],fr=mat('#ff4a5a',{roughness:.4});
    for(let i=0;i<16;i++){const x=-.3+(i%4)*.2,z=-.3+Math.floor(i/4)*.2;g.add(cyl(.008,.008,.08,st,x,.18,z,4));g.add(ball(.05,lt[i%2],x,.23,z,0));g.add(ball(.035,lt[(i+1)%2],x+.03,.26,z-.02,0));if(i%5===1)g.add(ball(.018,fr,x-.03,.25,z+.03,0))}
    for(const x of[-.4,.4])g.add(box(.03,.48,.04,GUN,x,.38,0));g.add(rb(.86,.04,.1,.02,DRK,0,.62,0));g.add(box(.78,.015,.05,A.mag,0,.595,0));
    const cone=new THREE.Mesh(new THREE.CylinderGeometry(.39,.39,.44,4,1,true),new THREE.MeshBasicMaterial({color:'#ff6ae0',transparent:true,opacity:.07,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
    cone.scale.set(1,1,.98);cone.rotation.y=Math.PI/4;cone.position.y=.37;g.add(live(cone));const ph=Math.random()*6;ctx.anim(t=>{cone.material.opacity=.05+pulse(t,.9,ph)*.03});return bake(g)}},
  put:{name:'reactorkern',de:true,build(L,ctx){const g=new THREE.Group();
    g.add(cyl(.36,.4,.08,DRK,0,.04,0,36));g.add(cyl(.3,.34,.06,HUL,0,.11,0,36));g.add(tor(.31,.01,A.cyan,0,.142,0));
    g.add(cyl(.085,.085,.62,A.core,0,.45,0,20));const sl=new THREE.Mesh(new THREE.CylinderGeometry(.14,.14,.62,28,1,true),GLS);sl.position.y=.45;sl.renderOrder=3;g.add(live(sl));
    for(let k=0;k<4;k++){const a=k/4*TAU+Math.PI/4;g.add(box(.035,.68,.035,GUN,Math.cos(a)*.22,.47,Math.sin(a)*.22))}
    g.add(cyl(.28,.24,.07,HUL,0,.795,0,36));g.add(cyl(.16,.16,.03,DRK,0,.84,0,28));g.add(cyl(.06,.06,.012,A.core,0,.857,0,20));
    const r1=live(tor(.19,.012,A.cyan,0,.34,0)),r2=live(tor(.19,.012,A.cyan,0,.56,0));g.add(r1,r2);const gl=spr('#7fe4ff',1,0,.45,0,.55,1.2);g.add(gl);
    const ph=Math.random()*6;ctx.anim(t=>{r1.rotation.set(Math.PI/2+Math.sin(t*.9+ph)*.35,t*.8,0);r2.rotation.set(Math.PI/2+Math.cos(t*.7+ph)*.35,-t*.6,0);
      r1.position.y=.34+Math.sin(t*1.1+ph)*.03;r2.position.y=.56-Math.sin(t*1.1+ph)*.03;gl.scale.setScalar(.85+pulse(t,2.2,ph)*.25)});return bake(g)}},
  kast:{name:'locker',de:true,build(){const g=new THREE.Group();
    g.add(rb(.6,.05,.38,.03,DRK,0,.025,0));g.add(rb(.58,.84,.36,.05,HUL,0,.47,0));for(const x of[-.135,.135])g.add(rb(.25,.68,.02,.03,HUL2,x,.48,.18));
    g.add(box(.006,.74,.01,DRK,0,.48,.185));for(const x of[-.03,.03])g.add(box(.012,.12,.02,CHR,x,.5,.2));
    g.add(box(.07,.09,.012,DRK,.2,.66,.19));g.add(box(.03,.012,.014,A.green,.2,.69,.195));for(let k=0;k<3;k++)g.add(box(.18,.012,.012,DRK,-.13,.16+k*.03,.19));
    g.add(box(.5,.012,.02,A.cyan,0,.86,.17));return bake(g)}},
  boekenkast:{name:'serverkast',de:true,build(L,ctx){const g=new THREE.Group();
    g.add(rb(.66,.9,.38,.03,DRK,0,.45,0));const R=RACKS(),m=R[Math.floor(ctx.rand()*3)];const f=live(new THREE.Mesh(new THREE.PlaneGeometry(.56,.8),m));f.position.set(0,.46,.191);g.add(f);
    for(const x of[-.3,.3])g.add(box(.016,.82,.02,CHR,x,.46,.2));g.add(box(.6,.014,.02,A.cyan,0,.885,.18));g.add(rot(cyl(.025,.025,.3,RUB,.18,.92,-.08,8),0,0,Math.PI/2));return bake(g)}},
  harnas:{name:'ruimtepak',build(){const g=new THREE.Group(),SU=mat('#f2f3f5',{roughness:.62}),SU2=mat('#d5d9e0',{roughness:.55});
    g.add(cyl(.18,.2,.03,DRK,0,.015,0,28));g.add(tor(.19,.008,A.cyan,0,.032,0));
    for(const z of[-.065,.065]){g.add(rb(.13,.07,.09,.03,SU2,.02,.065,z));g.add(caps(.045,.18,SU,0,.22,z))}
    g.add(rb(.22,.27,.3,.09,SU,0,.48,0));g.add(rb(.12,.1,.3,.04,ORN,.0,.37,0));g.add(rb(.02,.09,.13,.01,DRK,.11,.52,0));g.add(box(.012,.02,.02,A.cyan,.122,.54,-.03));g.add(box(.012,.02,.02,A.red,.122,.54,.03));
    g.add(rb(.12,.28,.27,.04,SU2,-.15,.5,0));g.add(box(.012,.2,.02,A.cyan,-.212,.5,.08));
    for(const s of[-1,1]){g.add(rot(caps(.04,.2,SU,0,.44,s*.19),s*.14,0,0));g.add(ball(.042,DRK,0,.29,s*.215,1))}
    g.add(tor(.085,.02,DRK,0,.62,0));g.add(sh(new THREE.Mesh(new THREE.SphereGeometry(.11,24,16),SU)).translateY(.72));
    const v=sh(new THREE.Mesh(new THREE.SphereGeometry(.114,24,12,Math.PI-.95,1.9,.9,1.05),GOLDV));v.position.y=.72;g.add(v);return bake(g)}},
  altaar:{name:'telescoop',de:true,build(L,ctx){const g=new THREE.Group();
    g.add(cyl(.22,.26,.06,DRK,0,.03,0,32));g.add(tor(.23,.008,A.cyan,0,.062,0));g.add(cyl(.05,.07,.38,HUL,0,.25,0,16));
    const hd=new THREE.Group();hd.position.y=.46;hd.add(rb(.12,.1,.2,.03,GUN,0,0,0));for(const z of[-.09,.09])hd.add(box(.05,.14,.02,GUN,0,.07,z));
    const tb=new THREE.Group();tb.position.y=.1;tb.add(rot(cyl(.07,.085,.62,HUL,0,.0,0,24),0,0,-Math.PI/2));tb.add(rot(tor(.072,.012,DRK,.31,0,0,0),0,Math.PI/2,0));
    tb.add(rot(cyl(.062,.062,.01,mat('#123047',{metalness:.9,roughness:.05,emissive:'#1f6a9a',emissiveIntensity:.6}),.315,0,0,20),0,0,Math.PI/2));
    tb.add(rot(cyl(.018,.018,.2,GUN,.05,.1,0,8),0,0,Math.PI/2));tb.add(rot(cyl(.03,.035,.12,DRK,-.32,0,0,16),0,0,Math.PI/2));tb.add(box(.12,.012,.02,A.cyan,0,.0,.086));
    tb.rotation.z=.62;bake(tb);hd.add(tb);bake(hd);g.add(hd);const ph=Math.random()*6;
    ctx.anim(t=>{hd.rotation.y=Math.sin(t*.06+ph)*.7;tb.rotation.z=.62+Math.sin(t*.045+ph)*.12});return bake(g)}},
  kandelaar:{name:'holozuil',de:true,build(L,ctx){const g=new THREE.Group();
    g.add(cyl(.16,.2,.05,DRK,0,.025,0,28));g.add(cyl(.07,.09,.3,HUL,0,.2,0,20));g.add(cyl(.13,.1,.05,DRK,0,.375,0,28));g.add(cyl(.1,.1,.01,A.cyan,0,.402,0,24));g.add(tor(.13,.008,A.cyan,0,.4,0));
    const ho=new THREE.Group();ho.position.y=.6;const w=new THREE.Mesh(new THREE.IcosahedronGeometry(.13,2),HOLOW());ho.add(w);
    const core=new THREE.Mesh(new THREE.SphereGeometry(.1,20,12),HOLO());ho.add(core);const ri=new THREE.Mesh(new THREE.TorusGeometry(.2,.004,4,48),HOLOW());ri.rotation.x=Math.PI/2-.4;ho.add(ri);
    const mo=new THREE.Mesh(new THREE.SphereGeometry(.02,8,6),HOLOW());ho.add(mo);g.add(live(ho));
    const beam=live(new THREE.Mesh(new THREE.CylinderGeometry(.16,.09,.2,24,1,true),HOLO()));beam.position.y=.5;g.add(beam);
    const ph=Math.random()*6;ctx.anim(t=>{w.rotation.y=t*.4;core.rotation.y=-t*.2;ri.rotation.z=t*.3;mo.position.set(Math.cos(t*.9+ph)*.2,Math.sin(t*.9+ph)*.08,Math.sin(t*.9+ph)*.2);ho.position.y=.6+Math.sin(t*1.2+ph)*.012});return bake(g)}},
  wapenrek:{name:'laserrek',build(){const g=new THREE.Group();
    g.add(rb(.78,.06,.32,.03,GUN,0,.03,0));g.add(rb(.74,.7,.06,.03,DRK,0,.38,-.12));g.add(box(.68,.015,.02,A.cyan,0,.72,-.088));
    for(const x of[-.22,0,.22]){g.add(rb(.07,.46,.05,.02,HUL,x,.36,-.06));g.add(rb(.05,.14,.06,.02,RUB,x,.18,-.06));g.add(cyl(.012,.014,.16,GUN,x,.67,-.06,8));
      g.add(box(.02,.13,.056,A.cyan,x,.4,-.06));g.add(box(.11,.03,.08,GUN,x,.25,-.07));g.add(box(.11,.03,.08,GUN,x,.55,-.07));g.add(box(.03,.03,.01,x?A.green:A.amber,x,.1,-.088))}return bake(g)}},
  wijnrek:{name:'koelrek',build(){const g=new THREE.Group();
    for(const x of[-.35,.35])g.add(rb(.04,.8,.32,.015,GUN,x,.4,0));for(const y of[.02,.27,.52,.78])g.add(box(.74,.03,.32,DRK,0,y,0));
    for(let r=0;r<3;r++)for(let c=0;c<3;c++){const x=-.22+c*.22,y=.145+r*.25;g.add(rot(cyl(.07,.07,.28,HUL2,x,y,0,16),Math.PI/2,0,0));g.add(rot(cyl(.05,.05,.012,(r+c)%3?A.cyan:A.ice,x,y,.145,16),Math.PI/2,0,0));g.add(rot(tor(.071,.008,GUN,x,y,.1,0),0,0,0))}
    g.add(cyl(.018,.018,.78,CHR,.33,.4,.17,8));return bake(g)}},
};

registerTheme({id:'space',label:'Ruimte',icon:'🚀',title:'Moord in de ruimte',loading:'Het station wordt opgestart…',
  subs:['In de ruimte hoort niemand je schreeuwen. Behalve vannacht.','Acht bemanningsleden, één luchtsluis, nul alibi’s.','De zuurstof is beperkt. De verdachten niet.','Het station draait door. Het slachtoffer niet meer.','Ergens tussen de sterren zit een moordenaar aan boord.'],
  names:{A:[['Astrid','f'],['Arend','m']],B:[['Bente','f'],['Bastiaan','m']],C:[['Cassia','f'],['Casper','m']],D:[['Dewi','f'],['Dex','m']],
    E:[['Elara','f'],['Evert','m']],F:[['Femke','f'],['Freek','m']],G:[['Gwen','f'],['Gijs','m']],H:[['Hester','f'],['Huib','m']]},
  victims:[['Kapitein Vos','m'],['Commandant Lyra','f']],vicFace:{f:'👩‍✈️',m:'👨‍✈️'},
  faces:{f:['👩‍🚀','👩‍🔬','👩‍💻','👩‍🔧','👩‍⚕️','👩‍🏭','👩🏾‍🚀','👩🏻‍🔬'],m:['👨‍🚀','👨‍🔬','👨‍💻','👨‍🔧','👨‍⚕️','👨‍🏭','👨🏾‍🚀','🧑‍🚀']},
  rooms:{Stal:{name:'Hangar',art:'de',color:'#b9a467',pat:FL.tread,metal:.35,rough:.5},Binnenplaats:{name:'Atrium',art:'het',color:'#dfe4ec',pat:FL.atrium,rough:.45},
    Bibliotheek:{name:'Serverruimte',art:'de',color:'#4170a8',pat:FL.circuit,glow:['#1a5a9a',.18]},Slaapkamer:{name:'Cryokamer',art:'de',color:'#a3dbe9',pat:FL.hex,rough:.35},
    Troonzaal:{name:'Brug',art:'de',color:'#7d66bd',pat:FL.bridge,rough:.5},Keuken:{name:'Kombuis',art:'de',color:'#e6a36a',pat:FL.galley,rough:.5},
    Kapel:{name:'Observatorium',art:'het',color:'#b4609a',pat:FL.nebula,rough:.3,metal:.2},Wapenkamer:{name:'Arsenaal',art:'het',color:'#7f8a99',pat:FL.grateHex,metal:.5,rough:.42},
    Tuin:{name:'Kas',art:'de',color:'#6cae58',pat:FL.hydro,glow:['#2a8a2a',.12]},Kelder:{name:'Machinekamer',art:'de',color:'#a8634c',pat:FL.grate,metal:.4,rough:.5}},
  look:{sky:[[0,'#010208'],[.45,'#050a1f'],[.8,'#0e1236'],[1,'#1c1446']],fog:['#060a1e',34,150],hemi:['#a9bcff','#6a4a38',.62],sun:['#f4f7ff',4.2,[-9.5,5,-5.5]],
    rim:['#8a7bff',.7],fill:['#8fd0ff',.42],exposure:1.08,env:.55,bloom:[.55,.45,2.1],
    wall:'#9aa3b3',wallMap:false,wallRough:.32,wallMetal:.6,cap:'#d6f6ff',capGlow:'#1fb8f0',grout:'#0b101c',groutMetal:.5,base:false,
    label:{bg:'rgba(5,14,30,.8)',fg:'#c4f4ff',line:'rgba(80,215,255,.6)',font:"Inter, 'Avenir Next', sans-serif"},dust:['#a8dcff',HQ?150:60,.38]},
  i18n:{en:{label:'Space',title:'Murder in space',loading:'Booting up the station…',
    subs:['In space, no one hears you scream. Tonight, someone did.','Eight crew members, one airlock, zero alibis.','Oxygen is limited. Suspects are not.','The station keeps spinning. The victim doesn’t.','Somewhere among the stars, a killer is on board.'],
    victims:[['Captain Vos','m'],['Commander Lyra','f']],
    rooms:{Stal:{name:'Hangar'},Binnenplaats:{name:'Atrium'},Bibliotheek:{name:'Server room'},Slaapkamer:{name:'Cryo chamber'},Troonzaal:{name:'Bridge'},
      Keuken:{name:'Galley'},Kapel:{name:'Observatory'},Wapenkamer:{name:'Armory'},Tuin:{name:'Greenhouse'},Kelder:{name:'Engine room'}},
    objs:{stoel:{name:'bucket seat',verb:'Sat'},troon:{name:'command chair',verb:'Sat',art:'the'},tafel:{name:'console'},bed:{name:'cryobed',verb:'Lay'},
      tapijt:{name:'light panel',verb:'Stood'},bank:{name:'bench',verb:'Sat'},paard:{name:'hoverbike',verb:'Sat'},kist:{name:'cargo crate'},ton:{name:'storage drum'},
      hooibaal:{name:'fuel tank'},boom:{name:'biodome'},struik:{name:'glow plant'},bloemperk:{name:'grow tray'},put:{name:'reactor core'},kast:{name:'locker'},
      boekenkast:{name:'server rack'},harnas:{name:'spacesuit'},altaar:{name:'telescope'},kandelaar:{name:'holo pillar'},wapenrek:{name:'laser rack'},wijnrek:{name:'cooling rack'}}}},
  objs:OB,
  env(ctx){const {world,N,H,E,rand}=ctx;const R=rand;
  const navs=[];// blinking lights: {s, per, ph, on}
  const nav=(c,s,x,y,z,per,ph,par=world)=>{const p=spr(c,s,x,y,z,1,2.2);par.add(p);navs.push({p,per,ph,s});return p};
  // ---- deep space: stars, nebulae, the gas giant and its ring, a moon, the sun ----
  {const n=HQ?2400:900,pos=[],sz=[],ph=[],col=[];const pr=renderer.getPixelRatio();
   for(let i=0;i<n;i++){const u=Math.random()*2-1,a=Math.random()*TAU,s=Math.sqrt(1-u*u),r=200;pos.push(r*s*Math.cos(a),r*u,r*s*Math.sin(a));
     const big=Math.random()<.06;sz.push((big?3.2+Math.random()*2.5:1+Math.random()*1.6)*pr);ph.push(Math.random()*100);
     const tnt=Math.random();col.push(...(tnt<.15?[1,.82,.7]:tnt<.35?[.72,.84,1]:[1,1,1]))}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('size',new THREE.Float32BufferAttribute(sz,1));
   g.setAttribute('ph',new THREE.Float32BufferAttribute(ph,1));g.setAttribute('col',new THREE.Float32BufferAttribute(col,3));
   const m=new THREE.ShaderMaterial({uniforms:{t:{value:0}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
     vertexShader:'attribute float size;attribute float ph;attribute vec3 col;uniform float t;varying vec3 vC;varying float vA;void main(){vC=col;vA=.55+.45*sin(t*(.5+fract(ph*.37)*1.6)+ph);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=size;}',
     fragmentShader:'varying vec3 vC;varying float vA;void main(){float r=length(gl_PointCoord-.5);float a=smoothstep(.5,.0,r);a*=a;gl_FragColor=vec4(vC*vA*a*1.4,a);}'});
   const st=new THREE.Points(g,m);st.frustumCulled=false;world.add(st);ctx.anim((t)=>{m.uniforms.t.value=t;st.rotation.y=t*.002})}
  {const nebs=[[300,'#b04dff',[-90,-70,-130],150,.55],[190,'#3fd0d8',[110,-95,-90],130,.4],[330,'#ff5aa0',[-140,-40,40],120,.35],[220,'#5a7bff',[40,-120,-150],170,.45]];
   for(const [h,c,p,s,o] of nebs){const m=new THREE.SpriteMaterial({map:tx('neb'+h,()=>nebTex(h)),color:c,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:o,fog:false});
     const sp=new THREE.Sprite(m);sp.position.set(...p);sp.scale.setScalar(s);world.add(sp);const ph=Math.random()*6;ctx.anim(t=>{m.rotation=ph+t*.004})}}
  const PC=new V3(58,-84,-124),pR=30;
  {const tilt=new THREE.Group();tilt.position.copy(PC);tilt.rotation.set(.3,0,.42);world.add(tilt);
   const pm=new THREE.MeshStandardMaterial({map:tx('planet',planetTex),roughness:1,metalness:0,fog:false});
   const ps=new THREE.Mesh(new THREE.SphereGeometry(pR,96,64),pm);tilt.add(ps);
   const am=new THREE.ShaderMaterial({uniforms:{c:{value:new THREE.Color('#9fd0ff')},sd:{value:new V3(-1,.5,-.5).normalize()}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
     vertexShader:'varying vec3 vN;varying vec3 vV;void main(){vec4 w=modelMatrix*vec4(position,1.);vN=normalize(mat3(modelMatrix)*normal);vV=normalize(cameraPosition-w.xyz);gl_Position=projectionMatrix*viewMatrix*w;}',
     fragmentShader:'uniform vec3 c;uniform vec3 sd;varying vec3 vN;varying vec3 vV;void main(){float f=1.-max(dot(vN,vV),0.);float l=smoothstep(-.35,.5,dot(vN,sd));float a=pow(f,2.6)*(.15+l);gl_FragColor=vec4(c*a*1.6,a);}'});
   const atm=new THREE.Mesh(new THREE.SphereGeometry(pR*1.035,64,40),am);tilt.add(atm);
   const r0=pR*1.32,r1=pR*2.25,TS=200,rg=new THREE.RingGeometry(r0,r1,TS,4);const p=rg.attributes.position,uv=rg.attributes.uv;
   for(let k=0;k<p.count;k++){const r=Math.hypot(p.getX(k),p.getY(k));uv.setXY(k,(r-r0)/(r1-r0),(k%(TS+1))/TS*3)}
   const rm=new THREE.MeshStandardMaterial({map:tx('ring',ringTex),transparent:true,side:THREE.DoubleSide,roughness:.9,depthWrite:false,fog:false,emissive:'#3a3028',emissiveIntensity:.5});
   const ring=new THREE.Mesh(rg,rm);ring.rotation.x=-Math.PI/2;tilt.add(ring);
   // a small moon drifting around the giant
   const moon=new THREE.Mesh(new THREE.SphereGeometry(4.2,32,20),new THREE.MeshStandardMaterial({map:tx('moon',()=>{const t=noiseTex('#9a948c',60,128);return t}),roughness:1,fog:false}));world.add(moon);
   ctx.anim((t,dt)=>{ps.rotation.y=t*.006;atm.rotation.y=t*.006;ring.rotation.z=t*.0015;am.uniforms.sd.value.copy(sun.position).normalize();
     const a=t*.012+1.1;moon.position.set(PC.x+Math.cos(a)*pR*2.9,PC.y+20+Math.sin(a)*14,PC.z+Math.sin(a)*pR*2.2);moon.rotation.y=t*.01})}
  // the distant sun flaring over the limb of the planet
  {const sg=new THREE.Group();sg.position.set(-22,-122,-146);world.add(sg);
   const core=spr('#ffffff',14,0,0,0,1,3,false),halo=spr('#bcd6ff',70,0,0,0,.55,1.4,false),halo2=spr('#7f9cff',150,0,0,0,.22,1,false);
   const sm=new THREE.SpriteMaterial({map:tx('streak',streakTex),color:new THREE.Color('#cfe2ff').multiplyScalar(2.2),blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,fog:false});
   const st=new THREE.Sprite(sm);st.scale.set(120,4.5,1);const st2=new THREE.Sprite(sm.clone());st2.material.rotation=Math.PI/2.2;st2.scale.set(90,4,1);st2.material.opacity=.4;
   sg.add(halo2,halo,core,st,st2);ctx.anim(t=>{const k=1+Math.sin(t*.7)*.04+Math.sin(t*1.9)*.02;halo.scale.setScalar(70*k);core.scale.setScalar(14*k);st.material.opacity=.42+Math.sin(t*.5)*.1;st.material.rotation=Math.sin(t*.05)*.03})}
  // asteroid and debris field, tumbling on a slow orbit beneath the station
  {const n=HQ?90:36,geo=new THREE.IcosahedronGeometry(1,1);const gp=geo.attributes.position;const off=new Map();
   for(let k=0;k<gp.count;k++){const key=[gp.getX(k),gp.getY(k),gp.getZ(k)].map(v=>v.toFixed(3)).join();if(!off.has(key))off.set(key,.75+Math.random()*.45);const f=off.get(key);gp.setXYZ(k,gp.getX(k)*f,gp.getY(k)*f*.8,gp.getZ(k)*f)}
   geo.computeVertexNormals();const am=new THREE.MeshStandardMaterial({color:'#6d6660',roughness:.95,flatShading:true});const im=new THREE.InstancedMesh(geo,am,n);
   const D=[];for(let i=0;i<n;i++){const near=i<n*.25;const r=near?H+5+Math.random()*5:H+10+Math.random()*28,a=Math.random()*TAU;
     D.push({r,a,y:near?-2.5-Math.random()*3:-4-Math.random()*14,s:near?.05+Math.random()*.12:.2+Math.pow(Math.random(),3)*1.1,sp:(.004+Math.random()*.006)*(near?1.6:1),ax:new V3(Math.random()-.5,Math.random()-.5,Math.random()-.5).normalize(),w:.1+Math.random()*.3,q:Math.random()*6})}
   world.add(im);const o=new THREE.Object3D();
   const upd=t=>{for(let i=0;i<n;i++){const d=D[i],a=d.a+t*d.sp;o.position.set(Math.cos(a)*d.r,d.y+Math.sin(t*.1+d.q)*.2,Math.sin(a)*d.r);o.quaternion.setFromAxisAngle(d.ax,d.q+t*d.w);o.scale.setScalar(d.s);o.updateMatrix();im.setMatrixAt(i,o.matrix)}im.instanceMatrix.needsUpdate=true};
   upd(0);ctx.anim(upd)}

  // ---- the station ----
  const [HT,HW]=tx('hull',hullTex);
  const hullM=new THREE.MeshStandardMaterial({map:HT,emissiveMap:HW,emissive:'#ffffff',emissiveIntensity:1.6,metalness:.45,roughness:.38});
  const deckM=mat('#3a414e',{metalness:.7,roughness:.36}),rimM=mat('#4b5361',{metalness:.75,roughness:.3}),capR=mat('#9aa4b4',{metalness:.8,roughness:.25});
  const TRIM=A.cyan;
  // deck plate under the board, and the tapered hull beneath it
  world.add(rb(N+1.3,.34,N+1.3,.45,deckM,0,-.26,0,.04));
  {const top=(H+.6)*1.1,hh=2.4;const hg=new THREE.CylinderGeometry(top,top*.42,hh,8,1,true);hg.rotateY(Math.PI/8);const hu=new THREE.Mesh(hg,hullM);hu.position.y=-.43-hh/2;
   HT.repeat.set(4,1);HW.repeat.set(4,1);world.add(hu);const bot=cyl(top*.42,top*.3,.4,deckM,0,-.43-hh-.2,0,8);bot.rotation.y=Math.PI/8;world.add(bot);
   world.add(cyl(.5,.2,1.6,GUN,0,-.43-hh-1.1,0,12));const beacon=nav('#ff4040',.9,0,-.43-hh-1.95,0,2.2,0)}
  // bulkhead rim with a glowing trim, one rib per cell
  const hz=tx('hzm',()=>new THREE.MeshStandardMaterial({map:hazardTex(),roughness:.5}));
  for(const s of[-1,1]){world.add(box(N+.64,.34,.24,rimM,0,.08,s*E));world.add(box(.24,.34,N+.64,rimM,s*E,.08,0));
    world.add(box(N+.66,.03,.28,capR,0,.265,s*E));world.add(box(.28,.03,N+.66,capR,s*E,.265,0));
    world.add(box(N+.4,.022,.05,TRIM,0,.285,s*E));world.add(box(.05,.022,N+.4,TRIM,s*E,.285,0));
    world.add(box(N+.5,.015,.012,TRIM,0,-.03,s*(E+.125)));world.add(box(.012,.015,N+.5,TRIM,s*(E+.125),-.03,0));
    for(let k=-H+.5;k<H;k+=1){world.add(box(.06,.3,.03,capR,k,.08,s*(E+.13)));world.add(box(.03,.3,.06,capR,s*(E+.13),.08,k))}}
  // airlock at the front
  world.add(box(1.1,.5,.36,rimM,0,.16,E+.04));world.add(box(1.14,.03,.4,capR,0,.42,E+.04));world.add(box(.6,.36,.02,DRK,0,.15,E+.225));world.add(box(.012,.34,.025,TRIM,0,.15,E+.23));
  world.add(box(.9,.05,.02,hz,0,.38,E+.225));world.add(box(.9,.05,.02,hz,0,-.05,E+.225));
  // corner pylons with navigation lights
  for(const a of[-1,1])for(const b of[-1,1]){const x=a*(E+.08),z=b*(E+.08);const py=cyl(.3,.34,1.0,rimM,x,.3,z,8);py.rotation.y=Math.PI/8;world.add(py);
    world.add(cyl(.33,.33,.04,capR,x,.82,z,8));world.add(cyl(.22,.3,.12,deckM,x,.9,z,8));world.add(tor(.305,.012,TRIM,x,.55,z));world.add(tor(.345,.012,TRIM,x,-.05,z));
    world.add(cyl(.015,.015,.4,CHR,x,1.15,z,6));nav(a<0?'#ff3a3a':'#3aff7a',.55,x,1.37,z,a<0?1.6:1.6,b>0?0:.8);
    if(b<0)nav('#ffffff',.6,x+a*.22,.96,z-.0,3.1,a<0?.2:1.7)}
  // comms dish on the back-left pylon
  {const dg=new THREE.Group();dg.position.set(-(E+.08),1.0,-(E+.08));world.add(dg);const yk=new THREE.Group();dg.add(yk);yk.add(cyl(.04,.06,.18,GUN,0,.09,0,10));
   const dish=new THREE.Group();dish.position.y=.22;yk.add(dish);const dm=sh(new THREE.Mesh(new THREE.SphereGeometry(.34,28,10,0,TAU,0,.75),mat('#e6e9ef',{metalness:.4,roughness:.3,side:THREE.DoubleSide})));
   dm.rotation.x=Math.PI;dm.position.y=.24;dish.add(dm);dish.add(cyl(.01,.01,.26,CHR,0,.12,0,6));dish.add(spr('#ff6a5a',.25,0,.0,0,1,2));dish.rotation.x=.9;
   ctx.anim(t=>{yk.rotation.y=t*.08;dish.rotation.x=.75+Math.sin(t*.13)*.25})}
  // holographic status screens floating at the sides of the board
  for(const s of[-1,1]){const hx=s*(E+.95),hz2=-H*.35;world.add(cyl(.12,.16,.08,deckM,hx,-.02,hz2,16));world.add(cyl(.09,.09,.01,TRIM,hx,.025,hz2,16));
    const pl=new THREE.Mesh(new THREE.PlaneGeometry(1.15,.65),HOLOUI(s>0?7:8));pl.position.set(hx,.55,hz2);pl.rotation.set(-.15,-s*.55,0);world.add(pl);
    const bm=new THREE.Mesh(new THREE.CylinderGeometry(.5,.08,.42,4,1,true),HOLO());bm.position.set(hx,.24,hz2);bm.rotation.y=-s*.55+Math.PI/4;bm.scale.set(1.15,1,.1);world.add(bm);
    const ph=s*2;ctx.anim(t=>{pl.position.y=.55+Math.sin(t*.8+ph)*.025})}
  // solar wings along both sides, slowly tracking the sun
  {const sm=new THREE.MeshStandardMaterial({map:tx('solar',solarTex),metalness:.55,roughness:.26,side:THREE.DoubleSide}),pivs=[];
   for(const s of[-1,1]){const L0=E+.3,L1=H+11;const arm=cyl(.06,.06,L1-L0,GUN,s*(L0+L1)/2,-.25,0,10);arm.rotation.z=Math.PI/2;world.add(arm);
     for(let k=0;k<4;k++){const x=s*(H+2.0+k*2.2);const pv=new THREE.Group();pv.position.set(x,-.25,0);world.add(pv);pv.add(rot(cyl(.1,.1,.16,DRK,0,0,0,12),0,0,Math.PI/2));
       for(const z of[-1,1]){const p=new THREE.Mesh(new THREE.BoxGeometry(1.9,.025,1.15),sm);p.position.z=z*.72;p.castShadow=true;pv.add(p);pv.add(rot(cyl(.02,.02,.15,GUN,0,0,z*.1,6),Math.PI/2,0,0))}
       pivs.push(pv)}}
   ctx.anim(t=>{for(const [i,p] of pivs.entries())p.rotation.x=.5+Math.sin(t*.05)*.18+Math.sin(t*.11+i)*.02})}
  // habitat ring: turns slowly around the hub to make gravity; lit windows on the hull
  {const rg=new THREE.Group();rg.position.y=-1.35;world.add(rg);const Rr=H+3.1;
   const [T2,W2]=tx('hull2',()=>{const [a,b]=hullTex();a.repeat.set(24,1);b.repeat.set(24,1);return [a,b]});
   const rM=new THREE.MeshStandardMaterial({map:T2,emissiveMap:W2,emissive:'#ffffff',emissiveIntensity:1.8,metalness:.45,roughness:.36});
   const tube=new THREE.Mesh(new THREE.TorusGeometry(Rr,.26,18,140),rM);tube.rotation.x=Math.PI/2;tube.castShadow=true;tube.receiveShadow=true;rg.add(tube);
   rg.add(tor(Rr,.035,TRIM,0,.2,0,Math.PI/2,140));
   for(let k=0;k<6;k++){const a=k/6*TAU,ca=Math.cos(a),sa=Math.sin(a);const sp=cyl(.05,.05,Rr-H*.6,GUN,ca*(Rr+H*.6)/2,0,sa*(Rr+H*.6)/2,8);sp.rotation.set(0,-a,Math.PI/2);rg.add(sp);
     const md=rb(.8,.5,.62,.12,HUL,ca*Rr,0,sa*Rr,.04);md.rotation.y=-a+Math.PI/2;rg.add(md);rg.add(nav('#ffffff',.35,ca*Rr,.3,sa*Rr,2.4,k*.4,rg))}
   const hub=cyl(H*.62,H*.62,.36,rimM,0,0,0,24);rg.add(hub);rg.add(tor(H*.62+.01,.02,TRIM,0,.1,0,Math.PI/2,64));
   ctx.anim(t=>{rg.rotation.y=t*.025})}
  // docking arm at the back, and a shuttle that comes in, docks, and leaves again
  {const L0=E+.12,L1=E+2.4,y=-.12;const arm=cyl(.12,.12,L1-L0,rimM,0,y,-(L0+L1)/2,12);arm.rotation.x=Math.PI/2;world.add(arm);
   for(let z=L0+.3;z<L1;z+=.4)world.add(tor(.13,.015,capR,0,y,-z,0));world.add(rot(cyl(.26,.22,.18,deckM,0,y,-L1,20),Math.PI/2,0,0));
   const dock=tor(.2,.025,A.amber,0,y,-L1-.09,0);dock.material=dock.material.clone();world.add(dock);
   const sh2=new THREE.Group();const b=new THREE.Group();sh2.add(b);
   const f=caps(.13,.48,HUL,0,0,0);f.rotation.x=Math.PI/2;f.scale.set(1.15,.8,1);b.add(f);
   b.add(rot(caps(.07,.16,mat('#0b1a2a',{metalness:.8,roughness:.08,emissive:'#3fc9ff',emissiveIntensity:1.1}),0,.06,.2),Math.PI/2,0,0));
   const ws=new THREE.Shape();ws.moveTo(0,.1);ws.lineTo(.5,-.18);ws.lineTo(.5,-.28);ws.lineTo(0,-.26);ws.closePath();
   const wg=new THREE.ExtrudeGeometry(ws,{depth:.02,bevelEnabled:true,bevelSize:.01,bevelThickness:.01,bevelSegments:1});wg.rotateX(Math.PI/2);
   for(const s of[-1,1]){const w=sh(new THREE.Mesh(wg,HUL2));w.scale.x=s;w.position.set(s*.08,-.02,0);b.add(w);b.add(box(.3,.012,.05,ORN,s*.3,-.01,-.15))}
   b.add(rot(rb(.02,.2,.22,.03,HUL2,0,.14,-.26),0,0,0));for(const s of[-1,1])b.add(rot(cyl(.05,.065,.14,GUN,s*.08,-.02,-.36,12),Math.PI/2,0,0));
   bake(b);const eg=[spr('#7fdcff',.4,-.08,-.02,-.45,.9,2),spr('#7fdcff',.4,.08,-.02,-.45,.9,2)];eg.forEach(e=>sh2.add(e));
   nav('#ff3a3a',.25,-.58,-.02,-.2,1.3,0,sh2);nav('#3aff7a',.25,.58,-.02,-.2,1.3,0,sh2);nav('#ffffff',.3,0,.26,-.34,1.9,.5,sh2);
   world.add(sh2);
   const dockP=new V3(0,y,-L1-.6),out=new V3(0,y,-L1-3.2);
   const inC=new THREE.CatmullRomCurve3([new V3(-34,-7,-40),new V3(-14,-2.5,-L1-12),new V3(-3,-.4,-L1-6),out,dockP]);
   const outC=new THREE.CatmullRomCurve3([dockP,out,new V3(4,.6,-L1-7),new V3(16,2.5,-L1-13),new V3(38,6,-44)]);
   const T=74,q=new THREE.Quaternion(),m4=new THREE.Matrix4(),pp=new V3(),tg=new V3(),up=new V3(0,1,0);let first=true;
   const sm=x=>x*x*(3-2*x);
   ctx.anim((t,dt)=>{const c=(t+20)%T;let p,thr=1,docked=false;
     if(c<26){const k=sm(c/26);inC.getPointAt(Math.min(.9999,1-Math.pow(1-k,1.6)),pp);inC.getTangentAt(Math.min(.9999,k),tg);thr=1-k*.8}
     else if(c<40){pp.copy(dockP);tg.set(0,0,1);thr=.05;docked=true}
     else{const k=sm(Math.min(1,(c-40)/30));outC.getPointAt(Math.pow(k,1.5),pp);if(k<.12)tg.set(0,0,1);else outC.getTangentAt(Math.min(.9999,Math.pow(k,1.5)),tg);thr=.3+k}
     sh2.position.copy(pp);m4.lookAt(new V3(),tg.clone().negate(),up);q.setFromRotationMatrix(m4);
     if(first){sh2.quaternion.copy(q);first=false}else sh2.quaternion.slerp(q,Math.min(1,dt*1.1));
     sh2.visible=c<70.5;b.position.y=Math.sin(t*1.3)*.01;
     for(const e of eg){e.scale.setScalar(.15+thr*.45+Math.sin(t*30)*.02);e.material.opacity=.4+thr*.6}
     dock.material.emissive.set(docked?'#2aff7a':'#ff9a2a');dock.material.emissiveIntensity=docked?2.4:1.2+pulse(t,3)*1.6})}

  // ---- animated materials ----
  const hol=HOLO(),hw=HOLOW(),uis=[1,2,3,4,5,7,8].map(HOLOUI),racks=RACKS();let rk=0;
  ctx.anim((t,dt)=>{A.cyan.emissiveIntensity=3+Math.sin(t*.8)*.4;A.ice.emissiveIntensity=1.5+Math.sin(t*.6)*.35;A.mag.emissiveIntensity=2+Math.sin(t*1.1)*.6;
    A.core.emissiveIntensity=3+Math.sin(t*2.2)*.8+Math.sin(t*5.3)*.25;A.amber.emissiveIntensity=2.1+Math.sin(t*1.7)*.4;
    A.red.emissiveIntensity=(t%1.4)<.7?3:.4;A.green.emissiveIntensity=(t%2.6)<1.9?2.6:.5;
    const fl=Math.sin(t*37)>.97?.35:1;hol.opacity=(.42+Math.sin(t*9)*.06)*fl;hol.map.offset.y=-t*.25;hw.opacity=(.7+Math.sin(t*13)*.08)*fl;
    for(const [i,u] of uis.entries())u.opacity=(.78+Math.sin(t*7+i)*.06)*(Math.sin(t*23+i*3)>.985?.3:1);
    for(const i of[1,2])if(TX['scr'+i])TX['scr'+i].map.offset.x=(t*.02)%1;
    rk+=dt;if(rk>.22){rk=0;const r=racks[Math.floor(Math.random()*3)];r.emissiveMap.offset.y=Math.floor(Math.random()*8)/16;r.map.offset.y=r.emissiveMap.offset.y}
    for(const n of navs){const c=(t+n.ph)%n.per,on=c<.14;n.p.material.opacity=on?1:Math.max(.0,.12-c*.05);n.p.scale.setScalar(n.s*(on?1:.6))}});
  mergeStatic([deckM,rimM,capR,TRIM,hz,GUN,CHR]);
  }
});
})();
