// Japan: a tea house on a raised wooden floor in a spring garden at misty dawn.
// Cherry trees shed petals, koi circle a pond under a red arched bridge, bamboo sways, a shishi-odoshi tips.
(()=>{
const T3=THREE,PI=Math.PI,grp=()=>new T3.Group();
// ---------- helpers ----------
function ctex(w,h,fn,o={}){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');fn(g,w,h);
  const t=new T3.CanvasTexture(c);t.colorSpace=T3.SRGBColorSpace;t.anisotropy=8;if(o.wrap)t.wrapS=t.wrapT=T3.RepeatWrapping;if(o.rep)t.repeat.set(o.rep[0],o.rep[1]);return t}
const GC={};
// a rounded, bevelled box (centred), cached per size
function rgeo(w,h,d,r=.03,b=.012){const k=[w,h,d,r,b].join();if(GC[k])return GC[k];
  b=Math.max(0,Math.min(b,h/2-.002,w/2-.002,d/2-.002));r=Math.max(.002,Math.min(r,(w-2*b)/2-.002,(d-2*b)/2-.002));
  const g=new T3.ExtrudeGeometry(roundRect(w-2*b,d-2*b,r),{depth:Math.max(h-2*b,.002),bevelEnabled:b>0,bevelThickness:b,bevelSize:b,bevelSegments:2,curveSegments:4});
  g.rotateX(-PI/2);g.translate(0,b-h/2,0);return GC[k]=g}
function rb(w,h,d,m,x=0,y=0,z=0,r=.03,b=.012){const o=sh(new T3.Mesh(rgeo(w,h,d,r,b),m));o.position.set(x,y,z);return o}
function lathe(pts,m,x=0,y=0,z=0,seg=20){const o=sh(new T3.Mesh(new T3.LatheGeometry(pts.map(p=>new T3.Vector2(p[0],p[1])),seg),m));o.position.set(x,y,z);return o}
function tube(pts,r,m,seg=20,rs=6){const c=new T3.CatmullRomCurve3(pts.map(p=>new T3.Vector3(p[0],p[1],p[2])));return sh(new T3.Mesh(new T3.TubeGeometry(c,seg,r,rs,false),m))}
function at(o,x,y,z,rx=0,ry=0,rz=0){o.position.set(x,y,z);o.rotation.set(rx,ry,rz);return o}
// merge the static meshes of an object per material: a whole object becomes a handful of draw calls
function bake(g){g.updateMatrixWorld(true);const inv=new T3.Matrix4().copy(g.matrixWorld).invert(),by=new Map();
  g.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||Array.isArray(o.material))return;for(let p=o;p&&p!==g;p=p.parent)if(p.userData.live)return;
    if(!by.has(o.material))by.set(o.material,[]);by.get(o.material).push(o)});
  for(const [m,list] of by){if(list.length<2)continue;
    const geos=list.map(o=>{const q=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();for(const k of Object.keys(q.attributes))if(!['position','normal','uv'].includes(k))q.deleteAttribute(k);
      if(!q.attributes.uv)q.setAttribute('uv',new T3.Float32BufferAttribute(new Float32Array(q.attributes.position.count*2),2));
      return q.applyMatrix4(new T3.Matrix4().multiplyMatrices(inv,o.matrixWorld))});
    const mg=mergeGeometries(geos);if(!mg)continue;list.forEach(o=>o.parent.remove(o));g.add(sh(new T3.Mesh(mg,m)))}
  return g}
// move every static mesh of a group straight into the world so mergeStatic can fold scenery into one draw call per material
function dump(world,g){g.updateMatrixWorld(true);const ms=[];g.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh)ms.push(o)});
  for(const o of ms){o.geometry=o.geometry.clone().applyMatrix4(o.matrixWorld);o.position.set(0,0,0);o.rotation.set(0,0,0);o.scale.set(1,1,1);world.add(o)}}
function inst(geo,m,list,shadow){const im=new T3.InstancedMesh(geo,m,Math.max(1,list.length));const d=new T3.Object3D(),c=new T3.Color();
  list.forEach((o,i)=>{d.position.set(o.x,o.y,o.z);d.rotation.set(o.rx||0,o.ry||0,o.rz||0);d.scale.set(o.sx,o.sy??o.sx,o.sz??o.sx);d.updateMatrix();im.setMatrixAt(i,d.matrix);if(o.c)im.setColorAt(i,c.set(o.c))});
  im.count=list.length;im.castShadow=!!shadow;im.receiveShadow=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;im.computeBoundingSphere();return im}
// wind: bend vertices by their height above a base, in the vertex shader (works for meshes, instances and points)
const WIND={value:0};
function windify(m,amp,base){m.onBeforeCompile=s=>{s.uniforms.uWT=WIND;s.uniforms.uWA={value:amp};s.uniforms.uWB={value:base};
  s.vertexShader='uniform float uWT,uWA,uWB;\n'+s.vertexShader.replace('#include <project_vertex>',`vec4 mvPosition=vec4(transformed,1.);
#ifdef USE_INSTANCING
mvPosition=instanceMatrix*mvPosition;
#endif
float wh=max(mvPosition.y-uWB,0.);wh*=wh;
mvPosition.x+=(sin(uWT*1.3+mvPosition.x*.6+mvPosition.z*.4)+.6*sin(uWT*2.9+mvPosition.z*1.3))*uWA*wh;
mvPosition.z+=cos(uWT*1.1+mvPosition.x*.3+mvPosition.z*.7)*uWA*.6*wh;
mvPosition=modelViewMatrix*mvPosition;gl_Position=projectionMatrix*mvPosition;`)};m.customProgramCacheKey=()=>'jpwind';return m}

// ---------- textures ----------
function woodTex(base,n=70){return ctex(256,256,(g,w,h)=>{g.fillStyle=base;g.fillRect(0,0,w,h);
  for(let k=0;k<n;k++){const y=Math.random()*h,a=.04+Math.random()*.1;g.strokeStyle=Math.random()<.6?`rgba(30,15,5,${a})`:`rgba(255,240,215,${a*.7})`;g.lineWidth=.6+Math.random()*1.8;
    g.beginPath();g.moveTo(0,y);for(let x=0;x<=w;x+=16)g.lineTo(x,y+Math.sin(x*.025+k)*2.5+Math.random());g.stroke()}},{wrap:true})}
const SEIG=ctex(128,128,(g,w,h)=>{g.fillStyle='#22345a';g.fillRect(0,0,w,h);const r=16;
  for(let row=-2;row<18;row++)for(let col=-1;col<6;col++){const cx=col*2*r+(row%2?r:0),cy=row*r*.5;g.fillStyle='#22345a';g.beginPath();g.arc(cx,cy,r,0,7);g.fill();
    for(const f of[1,.72,.44]){g.strokeStyle='rgba(225,232,245,.8)';g.lineWidth=1.6;g.beginPath();g.arc(cx,cy,r*f-1,PI,2*PI);g.stroke()}}},{wrap:true,rep:[4,4]});
const BROC=ctex(128,128,(g,w,h)=>{g.fillStyle='#8e1d24';g.fillRect(0,0,w,h);g.strokeStyle='rgba(235,190,90,.85)';g.lineWidth=2;
  for(let x=0;x<=w;x+=32)for(let y=0;y<=h;y+=32){g.beginPath();g.moveTo(x,y-12);g.lineTo(x+12,y);g.lineTo(x,y+12);g.lineTo(x-12,y);g.closePath();g.stroke();
    g.fillStyle='rgba(235,190,90,.8)';g.beginPath();g.arc(x+16,y+16,3,0,7);g.fill()}},{wrap:true,rep:[3,3]});
const MAKIE=ctex(128,128,(g,w,h)=>{g.fillStyle='#120c0b';g.fillRect(0,0,w,h);
  for(let k=0;k<5;k++){const x=Math.random()*w,y=Math.random()*h,s=5+Math.random()*6;g.fillStyle='rgba(222,176,82,.95)';
    for(let p=0;p<5;p++){const a=p/5*PI*2;g.beginPath();g.ellipse(x+Math.cos(a)*s*.6,y+Math.sin(a)*s*.6,s*.5,s*.3,a,0,7);g.fill()}}
  g.strokeStyle='rgba(222,176,82,.6)';g.lineWidth=1.2;g.beginPath();g.moveTo(0,h*.8);g.bezierCurveTo(w*.3,h*.5,w*.6,h*.95,w,h*.7);g.stroke()},{wrap:true,rep:[3,3]});
const STRAW=ctex(128,128,(g,w,h)=>{g.fillStyle='#d8c08a';g.fillRect(0,0,w,h);for(let k=0;k<900;k++){g.fillStyle=Math.random()<.5?'rgba(120,90,40,.25)':'rgba(255,245,210,.3)';g.fillRect(Math.random()*w,Math.random()*h,1,6+Math.random()*10)}},{wrap:true});
const STRAWH=ctex(128,128,(g,w,h)=>{g.fillStyle='#d6bb7e';g.fillRect(0,0,w,h);for(let k=0;k<900;k++){g.fillStyle=Math.random()<.5?'rgba(120,90,40,.25)':'rgba(255,245,210,.3)';g.fillRect(Math.random()*w,Math.random()*h,6+Math.random()*12,1)}},{wrap:true,rep:[1,2]});
const SAKE=ctex(512,256,(g,w,h)=>{g.fillStyle='#e6d6ae';g.fillRect(0,0,w,h);for(let k=0;k<2500;k++){g.fillStyle=Math.random()<.5?'rgba(120,90,40,.2)':'rgba(255,250,230,.3)';g.fillRect(Math.random()*w,Math.random()*h,1,5+Math.random()*9)}
  for(const cx of[w*.25,w*.75]){g.fillStyle='#b8322a';g.beginPath();g.arc(cx,h*.5,58,0,7);g.fill();g.strokeStyle='#1d2c55';g.lineWidth=7;g.beginPath();g.arc(cx,h*.5,70,0,7);g.stroke();
    g.fillStyle='#fff6e6';g.font='700 78px "Hiragino Mincho ProN","Yu Mincho","Noto Serif JP",serif';g.textAlign='center';g.textBaseline='middle';g.fillText('酒',cx,h*.52)}
  g.fillStyle='#1d2c55';g.fillRect(0,14,w,10);g.fillRect(0,h-24,w,10)});
const LAMEL=ctex(128,128,(g,w,h)=>{g.fillStyle='#5b1414';g.fillRect(0,0,w,h);
  for(let y=0;y<h;y+=16){g.fillStyle='#2a0b0b';g.fillRect(0,y+13,w,3);g.fillStyle='rgba(255,255,255,.08)';g.fillRect(0,y,w,3);
    for(let x=4;x<w;x+=8){g.fillStyle='#2f4f9a';g.fillRect(x,y+4,3,9)}}},{wrap:true,rep:[2,2]});
const BYOBU=ctex(384,256,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,'#e8c36a');gr.addColorStop(.5,'#f3d888');gr.addColorStop(1,'#d9ad55');g.fillStyle=gr;g.fillRect(0,0,w,h);
  for(let k=0;k<40;k++){g.strokeStyle='rgba(150,100,30,.18)';g.strokeRect(Math.random()*w,Math.random()*h,30,30)}
  g.fillStyle='rgba(255,255,255,.55)';for(let k=0;k<5;k++){g.beginPath();g.ellipse(60+k*70,40+(k%2)*30,60,12,0,0,7);g.fill()}
  g.strokeStyle='#4a3524';g.lineWidth=9;g.lineCap='round';g.beginPath();g.moveTo(40,h);g.bezierCurveTo(80,170,30,120,140,100);g.bezierCurveTo(210,90,230,60,300,70);g.stroke();
  g.fillStyle='#2f5a3c';for(const [x,y] of[[120,95],[170,92],[230,70],[290,62],[90,140],[330,80]]){g.beginPath();g.ellipse(x,y,34,13,-.1,0,7);g.fill()}
  g.fillStyle='#b8322a';g.beginPath();g.arc(330,190,22,0,7);g.fill()});
const FUSUMA=ctex(256,128,(g,w,h)=>{g.fillStyle='#e9d39a';g.fillRect(0,0,w,h);g.fillStyle='rgba(255,250,235,.7)';for(let k=0;k<6;k++){g.beginPath();g.ellipse(Math.random()*w,Math.random()*h,50,10,0,0,7);g.fill()}
  g.strokeStyle='#2a1a10';g.lineWidth=4;g.strokeRect(2,2,w/2-4,h-4);g.strokeRect(w/2+2,2,w/2-4,h-4);g.fillStyle='#2a1a10';g.beginPath();g.arc(w/2-14,h/2,5,0,7);g.arc(w/2+14,h/2,5,0,7);g.fill()});
const TSUKA=ctex(64,64,(g,w,h)=>{g.fillStyle='#e8e2d4';g.fillRect(0,0,w,h);g.fillStyle='#1b2442';for(let y=-16;y<h+16;y+=16){g.beginPath();g.moveTo(0,y);g.lineTo(w/2,y+8);g.lineTo(w,y);g.lineTo(w,y+6);g.lineTo(w/2,y+14);g.lineTo(0,y+6);g.fill()}},{wrap:true,rep:[1,3]});
const CHO=ctex(128,128,(g,w,h)=>{g.fillStyle='#d23a26';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=10){g.fillStyle='rgba(60,10,5,.35)';g.fillRect(0,y,w,2)}
  g.fillStyle='rgba(255,240,220,.92)';g.beginPath();g.arc(32,64,18,0,7);g.arc(96,64,18,0,7);g.fill();g.fillStyle='#d23a26';g.beginPath();g.arc(32,64,9,0,7);g.arc(96,64,9,0,7);g.fill()});
const BAMBOO=ctex(32,256,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,0);gr.addColorStop(0,'#5f7a35');gr.addColorStop(.5,'#8fa956');gr.addColorStop(1,'#5f7a35');g.fillStyle=gr;g.fillRect(0,0,w,h);
  for(let y=0;y<h;y+=64){g.fillStyle='rgba(40,50,20,.7)';g.fillRect(0,y,w,3);g.fillStyle='rgba(230,240,190,.5)';g.fillRect(0,y+3,w,2)}},{wrap:true});
const PETAL_TEX=ctex(64,64,(g,w,h)=>{g.translate(32,32);for(let p=0;p<5;p++){g.rotate(PI*2/5);const gr=g.createRadialGradient(0,-12,1,0,-12,14);gr.addColorStop(0,'#fff4f7');gr.addColorStop(1,'#f4a8bf');g.fillStyle=gr;
  g.beginPath();g.moveTo(0,0);g.bezierCurveTo(-12,-8,-10,-26,-3,-27);g.lineTo(0,-23);g.lineTo(3,-27);g.bezierCurveTo(10,-26,12,-8,0,0);g.fill()}g.fillStyle='#e0567e';g.beginPath();g.arc(0,0,3.5,0,7);g.fill()});
// dense blossom clusters painted onto the crown puffs: little five-petal flowers over shadowy gaps
const BLOSSOM=ctex(256,128,(g,w,h)=>{g.fillStyle='#c97a92';g.fillRect(0,0,w,h);
  for(let k=0;k<700;k++){const x=Math.random()*w,y=Math.random()*h,r=2.5+Math.random()*3.5,l=78+Math.random()*18;g.fillStyle=`hsl(${340+Math.random()*12},${60+Math.random()*25}%,${l}%)`;
    for(let p=0;p<5;p++){const a=p/5*PI*2+k;g.beginPath();g.arc(x+Math.cos(a)*r*.6,y+Math.sin(a)*r*.6,r*.55,0,7);g.fill()}g.fillStyle='rgba(200,60,100,.7)';g.fillRect(x-.7,y-.7,1.4,1.4)}},{wrap:true,rep:[2,1]});
function cloudTex(){return ctex(128,128,(g,w,h)=>{for(let k=0;k<22;k++){const x=20+Math.random()*88,y=40+Math.random()*48,r=14+Math.random()*26;const gr=g.createRadialGradient(x,y,0,x,y,r);
  gr.addColorStop(0,'rgba(255,255,255,.22)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,w,h)}})}
const CLOUD=cloudTex();

// ---------- materials ----------
const LBLK=mat('#17100e',{roughness:.22,metalness:.05}),LRED=mat('#b5302a',{roughness:.3}),GLD=mat('#d6a84c',GOLD),IRON=mat('#26221f',{metalness:.6,roughness:.45});
const KEYAKI=new T3.MeshStandardMaterial({map:woodTex('#9a5632'),roughness:.42}),HINOKI=new T3.MeshStandardMaterial({map:woodTex('#dcb889',50),roughness:.6});
const DARKW=new T3.MeshStandardMaterial({map:woodTex('#40281b'),roughness:.4}),WEATH=new T3.MeshStandardMaterial({map:woodTex('#8a7360'),roughness:.9});
const PAPER=mat('#f6efe0',{roughness:.9}),WHITEF=mat('#f2ede4',{roughness:.95}),FELT=mat('#b8262a',{roughness:1});
const STONE=new T3.MeshStandardMaterial({map:stoneTex,color:'#b2b0a6',roughness:.95});
const BAMB=new T3.MeshStandardMaterial({map:BAMBOO,roughness:.5});
const LEAF=mat('#36602f',{flatShading:true,roughness:.8}),LEAF2=mat('#4b7a38',{flatShading:true,roughness:.8});
const CERAM=mat('#55707e',{roughness:.25}),CELA=mat('#a9bfa8',{roughness:.3}),MATCHA=mat('#7c9a3a',{roughness:.5});
const fab=(t,c='#ffffff')=>new T3.MeshStandardMaterial({map:t,color:c,roughness:.95});
const SEIGM=fab(SEIG),BROCM=fab(BROC),MAKIEM=new T3.MeshStandardMaterial({map:MAKIE,roughness:.25}),LAMELM=new T3.MeshStandardMaterial({map:LAMEL,roughness:.35});
const STRAWM=fab(STRAW),STRAWHM=fab(STRAWH),ROPE=mat('#6b4a28',{roughness:1});

// tatami mat textures with a brocade border all around, one per length
const TATAMI={};
function tatamiTex(L){if(TATAMI[L])return TATAMI[L];return TATAMI[L]=ctex(200*L,176,(g,w,h)=>{g.fillStyle='#c7c47f';g.fillRect(0,0,w,h);
  for(let x=0;x<w;x+=3){g.fillStyle=(x/3)%2?'rgba(60,60,10,.09)':'rgba(255,255,220,.08)';g.fillRect(x,0,1.5,h)}
  for(let k=0;k<300;k++){g.fillStyle=Math.random()<.5?'rgba(60,60,10,.06)':'rgba(255,255,220,.06)';g.fillRect(Math.random()*w,Math.random()*h,1,10+Math.random()*30)}
  const b=16;g.fillStyle='#1e1b22';g.fillRect(0,0,w,b);g.fillRect(0,h-b,w,b);g.fillRect(0,0,b,h);g.fillRect(w-b,0,b,h);
  g.fillStyle='rgba(220,180,90,.85)';for(let x=8;x<w;x+=14){g.fillRect(x,6,5,4);g.fillRect(x,h-10,5,4)}for(let y=8;y<h;y+=14){g.fillRect(6,y,4,5);g.fillRect(w-10,y,4,5)}})}

// ---------- floors ----------
const tatamiFloor=(heri,acc)=>(g,S,R,sh,li)=>{for(let x=0;x<S;x+=3){g.fillStyle=(x/3)%2?sh(.08):li(.06);g.fillRect(x,0,1.5,S)}
  for(let k=0;k<260;k++){g.fillStyle=R()<.5?sh(.05):li(.05);g.fillRect(R()*S,R()*S,1,8+R()*24)}
  for(const y of[0,S-22]){g.fillStyle=heri;g.fillRect(0,y,S,22);g.fillStyle=acc;for(let x=7;x<S;x+=16){g.beginPath();g.arc(x,y+11,2.6,0,7);g.fill()}
    g.fillStyle='rgba(0,0,0,.3)';g.fillRect(0,y?y:21,S,1.5)}};
const boards=(n,gap,knots)=>(g,S,R,sh,li)=>{const hh=S/n;for(let k=0;k<n;k++){const y=k*hh;g.fillStyle=R()<.5?sh(.06):li(.05);g.fillRect(0,y,S,hh);
    g.lineWidth=1;for(let j=0;j<14;j++){g.strokeStyle=R()<.5?sh(.07):li(.05);g.beginPath();const yy=y+R()*hh;g.moveTo(0,yy);g.bezierCurveTo(S/3,yy+R()*4-2,S*2/3,yy+R()*4-2,S,yy+R()*3-1.5);g.stroke()}
    g.fillStyle=sh(gap);g.fillRect(0,y,S,2);const j=R()*S;g.fillRect(j,y,2,hh);
    if(knots&&R()<.5){g.fillStyle=sh(.2);g.beginPath();g.ellipse(R()*S,y+hh/2,5,3,0,0,7);g.fill()}}};
const ROOMS={
  Stal:{name:'Riksjaloods',art:'de',color:'#8f7d6a',pat:(g,S,R,sh,li)=>{boards(4,.32,true)(g,S,R,sh,li);g.fillStyle=sh(.45);for(let k=0;k<4;k++)for(const x of[10,S-10]){g.beginPath();g.arc(x,k*S/4+S/8,2.2,0,7);g.fill()}},rough:.9},
  Binnenplaats:{name:'Binnenhof',art:'het',color:'#c7c4bc',pat:(g,S,R,sh,li)=>{for(let k=0;k<5000;k++){g.fillStyle=R()<.5?sh(.12):li(.16);g.fillRect(R()*S,R()*S,1.5,1.5)}
    for(let y=4;y<S;y+=10){g.lineWidth=2.2;g.strokeStyle=sh(.16);g.beginPath();g.moveTo(0,y);for(let x=0;x<=S;x+=16)g.lineTo(x,y+Math.sin(x/S*PI*2)*1.5);g.stroke();
      g.lineWidth=1.4;g.strokeStyle=li(.22);g.beginPath();g.moveTo(0,y+3);for(let x=0;x<=S;x+=16)g.lineTo(x,y+3+Math.sin(x/S*PI*2)*1.5);g.stroke()}},rough:.95},
  Bibliotheek:{name:'Schrijfkamer',art:'de',color:'#b4b46c',pat:tatamiFloor('#1f1c20','rgba(210,180,110,.7)'),rough:.85},
  Slaapkamer:{name:'Slaapvertrek',art:'het',color:'#dcc08c',pat:tatamiFloor('#2b3a6b','rgba(240,235,220,.8)'),rough:.85},
  Troonzaal:{name:'Keizerszaal',art:'de',color:'#a8443a',pat:(g,S,R,sh,li)=>{const gr=g.createLinearGradient(0,0,S,S);gr.addColorStop(0,li(.1));gr.addColorStop(.5,'rgba(0,0,0,0)');gr.addColorStop(1,sh(.1));g.fillStyle=gr;g.fillRect(0,0,S,S);
    g.strokeStyle='rgba(232,190,100,.85)';g.lineWidth=3;g.strokeRect(12,12,S-24,S-24);g.lineWidth=1.2;g.strokeRect(20,20,S-40,S-40);
    g.fillStyle='rgba(232,190,100,.8)';for(let p=0;p<5;p++){const a=p/5*PI*2-PI/2;g.beginPath();g.ellipse(S/2+Math.cos(a)*16,S/2+Math.sin(a)*16,12,8,a,0,7);g.fill()}
    g.fillStyle='#a8443a';g.beginPath();g.arc(S/2,S/2,6,0,7);g.fill()},rough:.32},
  Keuken:{name:'Keuken',art:'de',color:'#c08a58',pat:(g,S,R,sh,li)=>{for(let k=0;k<26;k++){g.fillStyle=R()<.5?sh(.06):li(.06);g.beginPath();g.ellipse(R()*S,R()*S,20+R()*40,12+R()*30,R()*3,0,7);g.fill()}
    for(let k=0;k<3000;k++){g.fillStyle=R()<.5?sh(.15):li(.12);g.fillRect(R()*S,R()*S,1.4,1.4)}
    for(let k=0;k<60;k++){g.strokeStyle='rgba(230,200,120,.35)';g.lineWidth=1;g.beginPath();const x=R()*S,y=R()*S,a=R()*6;g.moveTo(x,y);g.lineTo(x+Math.cos(a)*8,y+Math.sin(a)*8);g.stroke()}},rough:.95},
  Kapel:{name:'Schrijn',art:'het',color:'#e6cd9f',pat:boards(3,.16,false),rough:.5},
  Wapenkamer:{name:'Dojo',art:'de',color:'#6c4630',pat:(g,S,R,sh,li)=>{boards(8,.4,false)(g,S,R,sh,li);const gr=g.createLinearGradient(0,0,S,S);gr.addColorStop(.3,'rgba(255,240,220,0)');gr.addColorStop(.5,'rgba(255,240,220,.12)');gr.addColorStop(.7,'rgba(255,240,220,0)');g.fillStyle=gr;g.fillRect(0,0,S,S)},rough:.3},
  Tuin:{name:'Mostuin',art:'de',color:'#7a9658',pat:(g,S,R,sh,li)=>{for(let k=0;k<40;k++){g.fillStyle=R()<.5?'rgba(30,60,20,.18)':'rgba(190,220,120,.15)';g.beginPath();g.arc(R()*S,R()*S,8+R()*26,0,7);g.fill()}
    for(let k=0;k<2500;k++){g.fillStyle=R()<.5?'rgba(25,55,15,.3)':'rgba(200,235,140,.25)';g.fillRect(R()*S,R()*S,1.5,1.5)}
    g.fillStyle='rgba(255,200,215,.85)';for(let k=0;k<5;k++){g.beginPath();g.ellipse(R()*S,R()*S,3,2,R()*3,0,7);g.fill()}},rough:1},
  Kelder:{name:'Sakekelder',art:'de',color:'#625c55',pat:(g,S,R,sh,li)=>{g.fillStyle=sh(.45);g.fillRect(0,0,S,S);
    const xs=[0,S*.45+R()*20,S],ys=[0,S*.55+R()*20-10,S];
    for(let a=0;a<2;a++)for(let b=0;b<2;b++){const x0=xs[a]+4,x1=xs[a+1]-4,y0=ys[b]+4,y1=ys[b+1]-4;g.fillStyle=`rgba(${95+R()*20|0},${90+R()*16|0},${82+R()*14|0},1)`;
      g.beginPath();g.roundRect(x0,y0,x1-x0,y1-y0,10);g.fill();g.strokeStyle=li(.12);g.lineWidth=2;g.beginPath();g.moveTo(x0+8,y0+2);g.lineTo(x1-8,y0+2);g.stroke();
      for(let k=0;k<500;k++){g.fillStyle=R()<.5?sh(.12):li(.08);g.fillRect(x0+R()*(x1-x0),y0+R()*(y1-y0),1.5,1.5)}}},rough:.9}};

// ---------- objects ----------
const OBJS={
  stoel:{name:'zitkussen',verb:'Zat',h:.11,build(){const g=grp();g.add(rb(.5,.035,.5,LBLK,0,.0175,0,.05,.01));
    g.add(rb(.44,.075,.44,SEIGM,.02,.072,0,.09,.03));for(const[a,b]of[[1,1],[1,-1],[-1,1],[-1,-1]])g.add(ball(.018,GLD,.02+a*.2,.1,b*.2,0));
    const bk=grp();bk.position.set(-.21,.03,0);bk.rotation.z=.32;bk.add(rb(.045,.36,.46,LBLK,0,.18,0,.03,.01));bk.add(rb(.012,.26,.36,LRED,.024,.19,0,.02,.004));bk.add(rb(.06,.03,.48,GLD,0,.37,0,.01,.006));g.add(bk);return bake(g)}},
  troon:{name:'keizerlijke zetel',de:true,verb:'Zat',h:.36,build(){const g=grp();g.add(rb(.88,.1,.88,LBLK,0,.05,0,.05,.015));g.add(rb(.9,.018,.9,GLD,0,.105,0,.05,.006));
    g.add(rb(.72,.12,.72,LRED,.03,.17,0,.04,.015));g.add(rb(.62,.08,.62,BROCM,.04,.27,0,.08,.03));
    for(const z of[-.3,.3]){g.add(rb(.4,.07,.06,BROCM,.04,.34,z,.03,.02));g.add(rb(.04,.04,.07,GLD,.25,.34,z,.01,.005))}
    const fr=LBLK;const panel=(off)=>{const t=BYOBU.clone();t.needsUpdate=true;t.repeat.set(1/3,1);t.offset.set(off,0);return new T3.MeshStandardMaterial({map:t,roughness:.45,metalness:.25})};
    const ps=[[-.34,-.26,.5,0],[-.38,0,0,1/3],[-.34,.26,-.5,2/3]];
    for(const [x,z,ry,off] of ps){const p=grp();p.position.set(x,.12,z);p.rotation.y=ry;
      const m=new T3.Mesh(new T3.BoxGeometry(.02,.58,.27),[panel(off),panel(off),fr,fr,fr,fr]);sh(m);m.position.y=.39;p.add(m);p.add(rb(.035,.62,.3,fr,-.012,.39,0,.01,.005));g.add(p)}
    return bake(g)}},
  tafel:{name:'theetafel',build(L){const g=grp(),w=L-.2;g.add(rb(w,.045,.68,LBLK,0,.3,0,.06,.012));g.add(rb(w-.1,.006,.58,mat('#3c1512',{roughness:.2}),0,.323,0,.05,.002));
    for(const[a,b]of[[1,1],[1,-1],[-1,1],[-1,-1]]){g.add(rb(.055,.28,.055,LBLK,a*(w/2-.07),.14,b*.27,.01,.008));g.add(rb(.07,.012,.07,GLD,a*(w/2-.07),.008,b*.27,.01,.004))}
    g.add(rb(w-.2,.04,.025,LBLK,0,.255,.27,.01,.006));g.add(rb(w-.2,.04,.025,LBLK,0,.255,-.27,.01,.006));
    const set=(x,z)=>{const bw=lathe([[0,0],[.03,0],[.034,.006],[.05,.04],[.053,.055],[.047,.055],[.043,.014],[0,.014]],CELA,x,.326,z,18);g.add(bw);
      const tea=cyl(.044,.044,.004,MATCHA,x,.37,z,16);g.add(tea);
      const pot=ball(.06,IRON,x+.15,.37,z-.1,2);pot.scale.set(1,.8,1);g.add(pot);g.add(cyl(.02,.025,.02,IRON,x+.15,.42,z-.1,10));
      const hd=sh(new T3.Mesh(new T3.TorusGeometry(.05,.006,6,16,PI),IRON));hd.position.set(x+.15,.42,z-.1);g.add(hd);const sp=cyl(.008,.012,.07,IRON,x+.21,.38,z-.1,8);sp.rotation.z=-.9;g.add(sp);
      g.add(cyl(.026,.03,.06,LBLK,x-.12,.356,z+.12,16));g.add(cyl(.027,.027,.01,GLD,x-.12,.39,z+.12,16));
      const ch=sh(new T3.Mesh(new T3.ConeGeometry(.022,.06,10),HINOKI));ch.position.set(x+.08,.356,z+.15);ch.rotation.x=PI;g.add(ch);g.add(rb(.12,.008,.08,FELT,x-.14,.326,z-.12,.01,.002))};
    set(L>1?-.45:0,0);if(L>1){set(.45,.05);g.add(cyl(.03,.04,.12,CERAM,0,.385,-.15,14));g.add(ball(.03,mat('#c8283c'),0,.47,-.15,1));g.add(ball(.025,LEAF2,.03,.44,-.13,0))}
    return bake(g)}},
  bed:{name:'futon',verb:'Lag',h:.21,build(L){const g=grp(),w=L-.12;g.add(rb(w,.06,.86,HINOKI,0,.03,0,.03,.01));g.add(rb(w-.08,.08,.78,WHITEF,0,.1,0,.05,.03));
    g.add(rb(w*.7,.075,.8,SEIGM,w*.15-.02,.16,0,.06,.032));g.add(rb(.06,.09,.8,SEIGM,w*.15-.02-w*.35,.165,0,.03,.03));
    g.add(rb(.2,.07,.38,mat('#e3d2b0',{roughness:1}),-w/2+.18,.17,0,.04,.03));g.add(rb(.2,.012,.4,mat('#f6f2ea'),-w/2+.18,.205,0,.04,.004));return bake(g)}},
  tapijt:{name:'tatamimat',verb:'Stond',h:.034,blob:false,build(L){const g=grp(),e=mat('#5b5a34',{roughness:1});
    const m=new T3.Mesh(new T3.BoxGeometry(L-.1,.032,.86),[e,e,new T3.MeshStandardMaterial({map:tatamiTex(L),roughness:.9}),e,e,e]);m.position.y=.016;m.receiveShadow=true;g.add(m);return g}},
  bank:{name:'theebank',verb:'Zat',h:.285,build(){const g=grp();g.add(rb(.82,.05,.34,WEATH,0,.235,0,.02,.01));g.add(rb(.84,.016,.36,FELT,0,.268,0,.02,.006));
    g.add(box(.84,.09,.012,FELT,0,.225,.18));g.add(box(.84,.09,.012,FELT,0,.225,-.18));
    for(const[a,b]of[[1,1],[1,-1],[-1,1],[-1,-1]])g.add(rb(.05,.22,.05,WEATH,a*.35,.11,b*.12,.01,.006));
    for(const b of[-.12,.12])g.add(box(.7,.03,.03,WEATH,0,.06,b));for(const a of[-.35,.35])g.add(box(.03,.03,.22,WEATH,a,.06,0));return bake(g)}},
  paard:{name:'riksja',verb:'Zat',h:.5,build(){const g=grp();
    for(const z of[-.31,.31]){const t=sh(new T3.Mesh(new T3.TorusGeometry(.22,.022,8,30),LBLK));t.position.set(-.05,.23,z);g.add(t);
      const rim=sh(new T3.Mesh(new T3.TorusGeometry(.2,.008,6,30),LRED));rim.position.set(-.05,.23,z);g.add(rim);
      const hub=cyl(.035,.035,.05,GLD,-.05,.23,z,10);hub.rotation.x=PI/2;g.add(hub);
      for(let k=0;k<12;k++){const s=box(.008,.2,.008,LRED,-.05,.23,z);s.rotation.z=k/12*PI;g.add(s)}}
    const ax=cyl(.014,.014,.64,IRON,-.05,.23,0,8);ax.rotation.x=PI/2;g.add(ax);
    g.add(rb(.34,.16,.5,LBLK,-.04,.36,0,.04,.015));g.add(rb(.32,.06,.46,LRED,-.04,.47,0,.05,.025));
    const bk=grp();bk.position.set(-.2,.44,0);bk.rotation.z=.25;bk.add(rb(.05,.26,.46,LBLK,0,.13,0,.02,.01));bk.add(rb(.02,.2,.38,LRED,.03,.14,0,.02,.005));g.add(bk);
    const hood=sh(new T3.Mesh(new T3.CylinderGeometry(.13,.13,.48,14,1,true,0,PI),mat('#1d1a1a',{roughness:.8,side:T3.DoubleSide})));hood.rotation.x=PI/2;hood.rotation.y=-.5;hood.position.set(-.29,.62,0);g.add(hood);
    g.add(rb(.2,.025,.42,LBLK,.17,.26,0,.02,.008));g.add(rb(.025,.12,.42,LBLK,.27,.3,0,.01,.006));
    for(const z of[-.21,.21]){const s=box(.44,.025,.025,LBLK,.27,.24,z);s.rotation.z=-.42;g.add(s)}g.add(box(.025,.025,.46,LBLK,.46,.15,0));return bake(g)}},
  kist:{name:'lakkist',build(){const g=grp();g.add(rb(.52,.27,.36,LBLK,0,.135,0,.03,.012));g.add(rb(.55,.07,.39,MAKIEM,0,.3,0,.04,.02));
    for(const[a,b]of[[1,1],[1,-1],[-1,1],[-1,-1]]){g.add(rb(.05,.05,.05,GLD,a*.25,.3,b*.17,.01,.006));g.add(rb(.05,.04,.05,GLD,a*.24,.02,b*.16,.01,.006))}
    g.add(rb(.08,.07,.015,GLD,0,.22,.183,.01,.004));const cord=sh(new T3.Mesh(new T3.TorusGeometry(.035,.007,6,14),mat('#c62a35')));cord.position.set(0,.2,.192);g.add(cord);
    g.add(cyl(.012,.02,.06,mat('#c62a35'),0,.15,.193,8));return bake(g)}},
  ton:{name:'sakevat',build(){const g=grp();const m=new T3.Mesh(new T3.CylinderGeometry(.21,.21,.5,24,1,true),new T3.MeshStandardMaterial({map:SAKE,roughness:.95}));sh(m);m.position.y=.25;g.add(m);
    g.add(cyl(.205,.205,.015,HINOKI,0,.5,0,24));
    for(const y of[.04,.25,.47]){const r=sh(new T3.Mesh(new T3.TorusGeometry(.212,.012,6,26),ROPE));r.rotation.x=PI/2;r.position.y=y;g.add(r)}
    const k=sh(new T3.Mesh(new T3.TorusGeometry(.12,.012,6,20),ROPE));k.rotation.x=PI/2;k.position.y=.51;g.add(k);return bake(g)}},
  hooibaal:{name:'rijstbaal',build(){const g=grp();const bale=(y,z)=>{const c=new T3.Mesh(new T3.CylinderGeometry(.13,.13,.6,16),[STRAWHM,STRAWM,STRAWM]);sh(c);c.rotation.z=PI/2;c.position.set(0,y,z);g.add(c);
      for(const x of[-.3,.3]){const e=cyl(.12,.12,.025,STRAWM,x,y,z,16);e.rotation.z=PI/2;g.add(e);const kn=ball(.025,ROPE,x*1.06,y,z,0);g.add(kn)}
      for(const x of[-.18,0,.18]){const r=sh(new T3.Mesh(new T3.TorusGeometry(.133,.01,5,18),ROPE));r.rotation.y=PI/2;r.position.set(x,y,z);g.add(r)}};
    bale(.13,-.135);bale(.13,.135);bale(.355,0);return bake(g)}},
  boom:{name:'bonsai',build(){const g=grp();g.add(rb(.56,.13,.38,CERAM,0,.095,0,.05,.02));for(const[a,b]of[[1,1],[1,-1],[-1,1],[-1,-1]])g.add(rb(.06,.03,.05,CERAM,a*.22,.015,b*.14,.01,.005));
    g.add(rb(.5,.01,.32,mat('#3e5a2a',{roughness:1}),0,.16,0,.04,.003));g.add(ball(.05,STONE,.15,.17,.05,0));
    const tr=grp();tr.position.y=.16;const bark=mat('#4a3528',{roughness:.95});
    tr.add(tube([[-.06,0,0],[-.02,.12,.02],[-.1,.25,-.02],[0,.36,.03],[.08,.46,0]],.03,bark,20,7));
    tr.add(tube([[-.08,.24,-.02],[-.2,.3,-.04],[-.28,.33,0]],.014,bark,10,5));tr.add(tube([[0,.36,.03],[.14,.38,.08],[.24,.36,.06]],.012,bark,10,5));
    tr.add(tube([[-.02,.12,.02],[.12,.16,-.04],[.2,.2,-.08]],.012,bark,10,5));
    for(const[x,y,z,s] of[[.08,.52,0,1.1],[-.28,.38,0,.9],[.24,.42,.06,.85],[.2,.25,-.08,.75],[-.04,.6,0,.7]]){for(let k=0;k<3;k++){const b=ball(.09*s,k%2?LEAF:LEAF2,x+(k-1)*.07*s,y+(k===1?.025:0),z+(k%2?.03:-.03),1);b.scale.set(1,.42,.85);tr.add(b)}}
    bake(tr);tr.userData.live=true;tr.userData.sway=[.012,.8,Math.random()*6];g.add(tr);return bake(g)}},
  struik:{name:'azalea',build(){const g=grp(),m=mat('#3b6a32',{roughness:.85});const parts=[[0,.17,0,.26],[.17,.12,.1,.17],[-.16,.12,-.08,.18],[.05,.1,-.2,.15]];
    for(const[x,y,z,r] of parts){const b=ball(r,m,x,y,z,2);b.scale.set(1,.72,1);g.add(b)}
    const list=[],cols=['#e2407a','#f06292','#d81b60','#f48fb1','#ec5c8e'];
    for(let k=0;k<90;k++){const p=parts[k%4];const a=Math.random()*PI*2,e=Math.random()*1.3;const r=p[3];
      list.push({x:p[0]+Math.cos(a)*Math.sin(e)*r,y:p[1]+Math.cos(e)*r*.72,z:p[2]+Math.sin(a)*Math.sin(e)*r,sx:.024+Math.random()*.012,ry:Math.random()*6,c:cols[k%5]})}
    g.add(inst(new T3.IcosahedronGeometry(1,0),mat('#ffffff',{roughness:.7}),list,false));return bake(g)}},
  bloemperk:{name:'irisperk',build(){const g=grp();for(const s of[-1,1]){g.add(rb(.86,.09,.08,STONE,0,.045,s*.39,.02,.01));g.add(rb(.08,.09,.7,STONE,s*.39,.045,0,.02,.01))}
    g.add(box(.72,.04,.72,mat('#2f3d33',{roughness:.15,metalness:.2}),0,.03,0));
    const bl=[],fl=[];for(let k=0;k<16;k++){const x=-.27+(k%4)*.18+Math.random()*.04,z=-.27+Math.floor(k/4)*.18+Math.random()*.04;
      for(let j=0;j<3;j++)bl.push({x:x+(j-1)*.015,y:.17,z,sx:.6,sy:1+Math.random()*.4,sz:.18,rz:(j-1)*.18,ry:Math.random()*3});
      if(k%3!==1)fl.push({x,y:.33+Math.random()*.05,z,sx:.04,sy:.03,sz:.04,ry:Math.random()*3,c:k%5?'#5b3fb3':'#f2f0f6'})}
    const blade=new T3.ConeGeometry(.02,.3,4);g.add(inst(blade,mat('#4c7f3a',{roughness:.7}),bl,true));
    g.add(inst(new T3.IcosahedronGeometry(1,0),mat('#ffffff',{roughness:.6}),fl,false));return bake(g)}},
  put:{name:'stenen waterbak',build(L,ctx){const g=grp();
    g.add(lathe([[0,.13],[.12,.13],[.12,.2],[.2,.2],[.27,.17],[.28,.06],[.24,0],[0,0]],STONE,0,0,0,22));
    const w=new T3.Mesh(new T3.CircleGeometry(.118,20),new T3.MeshStandardMaterial({color:'#3d6a74',roughness:.05,metalness:.3,emissive:'#0f2a33'}));w.rotation.x=-PI/2;w.position.y=.185;g.add(w);
    g.add(ball(.09,STONE,.3,.04,.22,1));g.add(ball(.07,STONE,-.25,.03,.28,1));
    g.add(cyl(.028,.03,.42,BAMB,-.36,.21,0,10));const sp=cyl(.016,.016,.3,BAMB,-.22,.38,0,8);sp.rotation.z=PI/2+.25;g.add(sp);
    const ld=grp();ld.add(cyl(.006,.006,.36,HINOKI,0,0,0,6));ld.children[0].rotation.z=PI/2;ld.add(cyl(.028,.024,.04,HINOKI,.17,.015,0,10));ld.position.set(.02,.215,-.08);ld.rotation.y=.4;g.add(ld);
    const stream=new T3.Mesh(new T3.CylinderGeometry(.004,.006,.16,6,1,true),new T3.MeshStandardMaterial({color:'#d8f0ff',transparent:true,opacity:.6,roughness:.05,emissive:'#5a8aa0'}));stream.position.set(-.08,.29,0);stream.userData.live=true;g.add(stream);
    const rip=new T3.Mesh(new T3.RingGeometry(.8,1,24),new T3.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.4,depthWrite:false}));rip.rotation.x=-PI/2;rip.position.set(-.08,.188,0);rip.userData.live=true;g.add(rip);
    const ph=Math.random()*3;ctx.anim(t=>{const k=((t+ph)*.8)%1;rip.scale.setScalar(.01+k*.1);rip.material.opacity=.45*(1-k);stream.scale.x=stream.scale.z=1+Math.sin(t*20)*.2});return bake(g)}},
  kast:{name:'ladekast',build(){const g=grp();g.add(rb(.64,.78,.38,KEYAKI,0,.4,0,.02,.01));g.add(rb(.66,.03,.4,DARKW,0,.8,0,.02,.008));g.add(rb(.66,.02,.4,DARKW,0,.012,0,.02,.006));
    const dr=[[-.15,.66,.28,.12],[.15,.66,.28,.12],[0,.5,.58,.14],[0,.32,.58,.16],[-.15,.13,.28,.14],[.15,.13,.28,.14]];
    for(const[x,y,w,h] of dr){g.add(rb(w,h,.02,KEYAKI,x,y,.192,.008,.004));const hd=sh(new T3.Mesh(new T3.TorusGeometry(.03,.005,5,12,PI),IRON));hd.position.set(x,y-.015,.21);hd.rotation.z=PI;g.add(hd);
      g.add(rb(.05,.04,.006,IRON,x,y,.204,.005,.002))}
    for(const[a,b]of[[1,1],[1,-1],[-1,1],[-1,-1]])g.add(rb(.05,.05,.01,IRON,a*.29,.4+b*.35,.195,.004,.002));return bake(g)}},
  boekenkast:{name:'rolkast',build(){const g=grp(),f=DARKW;g.add(rb(.04,.88,.32,f,-.33,.44,0,.01,.006));g.add(rb(.04,.88,.32,f,.33,.44,0,.01,.006));g.add(rb(.7,.03,.32,f,0,.87,0,.01,.006));
    g.add(rb(.62,.3,.3,f,0,.15,0,.01,.006));const fd=new T3.Mesh(new T3.BoxGeometry(.6,.26,.01),[f,f,f,f,new T3.MeshStandardMaterial({map:FUSUMA,roughness:.6,metalness:.15}),f]);fd.position.set(0,.15,.152);sh(fd);g.add(fd);
    g.add(rb(.62,.025,.3,f,0,.31,0,.005,.004));g.add(rb(.32,.025,.28,f,-.15,.52,0,.005,.004));g.add(rb(.32,.025,.28,f,.15,.6,0,.005,.004));g.add(rb(.025,.09,.26,f,0,.56,0,.005,.004));
    const silk=[mat('#26407a'),mat('#8e2430'),mat('#b88a3a'),mat('#3f6b4a')],ends=mat('#1a1410',{roughness:.4});
    const scroll=(x,y,z,len,r,m)=>{const c=cyl(r,r,len,m,x,y,z,10);c.rotation.x=PI/2;g.add(c);for(const s of[-1,1]){const e=cyl(r*.55,r*.55,.02,ends,x,y,z+s*(len/2+.008),8);e.rotation.x=PI/2;g.add(e)}};
    for(let k=0;k<4;k++)scroll(-.22+k*.055,.35,0,.24,.024,silk[k%4]);scroll(-.195,.395,0,.22,.022,silk[2]);scroll(-.14,.395,0,.22,.022,silk[0]);
    for(let k=0;k<3;k++)scroll(-.25+k*.05,.56,0,.22,.02,silk[(k+1)%4]);
    for(let k=0;k<4;k++)g.add(rb(.18,.02,.24,k%2?mat('#efe6d0'):mat('#22325a'),.17,.33+k*.022,0,.004,.002));
    for(let k=0;k<3;k++)g.add(rb(.16,.02,.22,k%2?mat('#efe6d0'):mat('#7a2a2a'),.13,.623+k*.022,0,.004,.002));
    g.add(cyl(.035,.045,.12,CELA,.2,.67,0,14));g.add(cyl(.03,.035,.04,CERAM,0,.89,.05,12));return bake(g)}},
  harnas:{name:'samoeraiharnas',build(){const g=grp();g.add(rb(.44,.22,.32,LBLK,0,.11,0,.03,.012));g.add(cyl(.04,.04,.005,GLD,0,.13,.162,16)).rotation.x=PI/2;
    const ks=sh(new T3.Mesh(new T3.CylinderGeometry(.13,.17,.14,14,1,true),LAMELM));ks.material.side=T3.DoubleSide;ks.position.y=.29;ks.scale.z=.8;g.add(ks);
    const d=sh(new T3.Mesh(new T3.CylinderGeometry(.15,.12,.22,16),LAMELM));d.position.y=.47;d.scale.z=.78;g.add(d);
    g.add(rb(.2,.05,.18,LBLK,0,.59,0,.03,.012));
    for(const s of[-1,1]){const sd=grp();sd.position.set(0,.56,s*.16);sd.rotation.x=s*.35;sd.add(rb(.14,.17,.025,LAMELM,0,-.07,0,.01,.006));g.add(sd)}
    const kb=sh(new T3.Mesh(new T3.SphereGeometry(.1,18,10,0,PI*2,0,PI/2),LBLK));kb.position.y=.66;g.add(kb);
    const shk=sh(new T3.Mesh(new T3.CylinderGeometry(.11,.16,.08,16,1,true,PI*.25,PI*1.5),LAMELM));shk.material.side=T3.DoubleSide;shk.position.y=.63;shk.rotation.y=PI/2;g.add(shk);
    g.add(rb(.05,.05,.1,mat('#5a1414',{roughness:.3}),.09,.6,0,.02,.01));
    for(const s of[-1,1]){const h=box(.012,.2,.05,GLD,.06,.84,s*.06);h.rotation.x=s*.42;g.add(h)}g.add(cyl(.025,.025,.02,GLD,.08,.72,0,12)).rotation.z=PI/2;
    g.add(cyl(.016,.016,.006,GLD,0,.765,0,10));return bake(g)}},
  altaar:{name:'shinto-altaar',build(){const g=grp();g.add(rb(.74,.035,.44,HINOKI,0,.32,0,.01,.006));
    for(const[a,b]of[[1,1],[1,-1],[-1,1],[-1,-1]])g.add(rb(.04,.31,.04,HINOKI,a*.33,.155,b*.18,.006,.004));g.add(rb(.66,.03,.02,HINOKI,0,.08,.18,.005,.003));
    g.add(rb(.36,.04,.26,HINOKI,0,.36,-.04,.01,.006));g.add(box(.26,.17,.18,HINOKI,0,.465,-.04));g.add(box(.14,.13,.005,mat('#e9d8a8'),0,.45,.052));
    for(const x of[-.035,.035])g.add(box(.006,.12,.006,GLD,x,.45,.055));
    const roofM=mat('#5f927e',{roughness:.55,metalness:.3});for(const s of[-1,1]){const r=box(.36,.012,.17,roofM,0,.6,-.04+s*.065);r.rotation.x=s*.55;g.add(r)}
    g.add(box(.36,.025,.025,HINOKI,0,.635,-.04));for(const x of[-.1,0,.1]){const k=cyl(.012,.012,.06,GLD,x,.655,-.04,8);k.rotation.x=PI/2;g.add(k)}
    for(const x of[-.17,.17])for(const s of[-1,1]){const c=box(.008,.12,.012,HINOKI,x,.67,-.04+s*.025);c.rotation.x=s*.5;g.add(c)}
    g.add(tube([[-.36,.31,.215],[-.18,.27,.225],[0,.26,.228],[.18,.27,.225],[.36,.31,.215]],.016,mat('#cdb27a',{roughness:1}),20,6));
    for(const x of[-.2,0,.2]){for(let k=0;k<3;k++){const p=box(.03,.035,.004,PAPER,x+(k%2?.012:-.012),.24-k*.033,.23);g.add(p)}}
    const mir=cyl(.06,.06,.008,mat('#e9e3cf',{metalness:1,roughness:.12,emissive:'#5a4a30'}),0,.43,.12,24);mir.rotation.x=PI/2;g.add(mir);g.add(rb(.06,.06,.04,LBLK,0,.36,.12,.01,.005));
    for(const x of[-.26,.26]){g.add(cyl(.025,.03,.08,mat('#f2efe8',{roughness:.3}),x,.38,.08,12));for(let k=0;k<4;k++)g.add(ball(.035,LEAF,x+(k%2?.02:-.02),.45+k*.02,.08+(k>1?.02:-.02),0))}
    for(const x of[-.13,.13])g.add(lathe([[0,0],[.02,0],[.024,.04],[.012,.08],[.008,.1],[0,.1]],mat('#f4f1ea',{roughness:.3}),x,.338,.14,12));
    return bake(g)}},
  kandelaar:{name:'papieren lantaarn',build(L,ctx){const g=grp(),f=LBLK;g.add(rb(.34,.035,.34,f,0,.07,0,.01,.006));
    for(const[a,b]of[[1,1],[1,-1],[-1,1],[-1,-1]]){g.add(rb(.03,.07,.03,f,a*.14,.035,b*.14,.005,.004));g.add(box(.02,.56,.02,f,a*.125,.36,b*.125))}
    const lit=new T3.MeshStandardMaterial({color:'#fff4dc',emissive:'#ffb45a',emissiveIntensity:1.8,roughness:.9});const pap=new T3.Mesh(new T3.BoxGeometry(.23,.46,.23),lit);pap.position.y=.33;pap.castShadow=true;g.add(pap);
    for(const y of[.11,.23,.34,.45,.56])g.add(box(.25,.012,.25,f,0,y,0));g.add(rb(.29,.03,.29,f,0,.64,0,.01,.006));
    const hd=sh(new T3.Mesh(new T3.TorusGeometry(.1,.008,6,16,PI),f));hd.position.y=.655;g.add(hd);
    const sp=new T3.Sprite(new T3.SpriteMaterial({map:GLOW,color:'#ffcf9a',blending:T3.AdditiveBlending,depthWrite:false,transparent:true,opacity:.55}));sp.scale.setScalar(.9);sp.position.y=.34;g.add(sp);
    const ph=Math.random()*9;ctx.anim(t=>{lit.emissiveIntensity=1.7+Math.sin(t*3.1+ph)*.12+Math.sin(t*7.7+ph)*.06});return bake(g)}},
  wapenrek:{name:'katanarek',build(){const g=grp();g.add(rb(.66,.045,.26,LBLK,0,.022,0,.02,.008));
    for(const x of[-.24,.24]){g.add(rb(.05,.46,.16,LBLK,x,.25,0,.015,.008));g.add(rb(.054,.02,.17,GLD,x,.47,0,.006,.004));
      for(const y of[.2,.31,.42]){g.add(rb(.06,.02,.07,LBLK,x,y,.08,.006,.004))}}
    const sword=(y,len,col)=>{const s0=-len*.55,s1=len*.25,h1=len*.45;g.add(tube([[s0,y,.1],[ (s0+s1)/2,y+.012,.1],[s1,y,.1]],.014,col,10,6));
      g.add(tube([[s1+.012,y,.1],[h1,y-.005,.1]],.015,new T3.MeshStandardMaterial({map:TSUKA,roughness:.8}),6,6));
      const ts=cyl(.028,.028,.008,GLD,s1+.006,y,.1,14);ts.rotation.z=PI/2;g.add(ts);g.add(ball(.016,GLD,h1,y-.005,.1,0))};
    sword(.44,.86,LBLK);sword(.33,.64,mat('#5a1416',{roughness:.25}));sword(.22,.42,LBLK);return bake(g)}},
  wijnrek:{name:'sakerek',build(){const g=grp(),f=DARKW;for(const[a,b]of[[1,1],[1,-1],[-1,1],[-1,-1]])g.add(box(.04,.82,.04,f,a*.33,.41,b*.12));
    for(const y of[.04,.32,.6,.82])g.add(rb(.72,.025,.3,f,0,y,0,.005,.004));
    const glass=[mat('#3a5a2a',{roughness:.12}),mat('#5a3418',{roughness:.12})],cer=mat('#f2eee6',{roughness:.3}),blue=mat('#2c4a7e',{roughness:.3});
    const bottle=[[0,0],[.045,0],[.047,.15],[.03,.2],[.014,.23],[.014,.27],[0,.27]];for(let k=0;k<5;k++)g.add(lathe(bottle,glass[k%2],-.27+k*.135,.053,0,12));
    const tok=[[0,0],[.035,0],[.05,.05],[.04,.1],[.015,.14],[.022,.16],[0,.16]];for(let k=0;k<5;k++)g.add(lathe(tok,k%2?blue:cer,-.27+k*.135,.333,0,12));
    for(let k=0;k<3;k++)g.add(rb(.07,.05,.07,HINOKI,-.2+k*.2,.618+.025,0,.006,.004));return bake(g)}},
};

// ---------- sky painting (screen-space backdrop: dawn gradient, Mount Fuji, misty ridges) ----------
let skyKey='',skyTex=null;
function paintSky(){const el=renderer.domElement,a=el.width/Math.max(1,el.height),key=a.toFixed(2);if(key===skyKey&&scene.background===skyTex)return;skyKey=key;
  const Hh=a<1?1024:640,W=Math.round(Math.min(2048,Hh*a)),u=Hh;
  const t=ctex(W,Hh,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);[[0,'#8f86c2'],[.14,'#ae9fd2'],[.28,'#d9b8d3'],[.4,'#f5cdc6'],[.5,'#fbdcc6'],[.62,'#f6e4da'],[1,'#efe2df']].forEach(s=>gr.addColorStop(s[0],s[1]));g.fillStyle=gr;g.fillRect(0,0,w,h);
    const sx=w*(a<1?.22:.3),sy=h*.36;let r=g.createRadialGradient(sx,sy,0,sx,sy,u*.45);r.addColorStop(0,'rgba(255,248,225,.95)');r.addColorStop(.06,'rgba(255,236,200,.8)');r.addColorStop(.25,'rgba(255,214,180,.3)');r.addColorStop(1,'rgba(255,200,180,0)');g.fillStyle=r;g.fillRect(0,0,w,h);
    g.fillStyle='#fff8ea';g.beginPath();g.arc(sx,sy,u*.028,0,7);g.fill();
    for(let k=0;k<7;k++){g.fillStyle=`rgba(255,240,240,${.12+Math.random()*.12})`;g.beginPath();g.ellipse(Math.random()*w,h*(.06+Math.random()*.2),u*(.2+Math.random()*.3),u*(.012+Math.random()*.015),0,0,7);g.fill()}
    // Fuji
    const fx=w*(a<1?.66:.7),pk=h*.13,bs=h*.43,tw=u*.045,L=u*.7;
    g.save();g.beginPath();g.moveTo(fx-L,bs);g.quadraticCurveTo(fx-tw*1.6,bs-(bs-pk)*.12,fx-tw,pk);g.lineTo(fx-tw*.4,pk-u*.006);g.lineTo(fx+tw*.3,pk+u*.004);g.lineTo(fx+tw,pk);g.quadraticCurveTo(fx+tw*1.6,bs-(bs-pk)*.12,fx+L,bs);g.closePath();
    const fg=g.createLinearGradient(0,pk,0,bs);fg.addColorStop(0,'#8a84b8');fg.addColorStop(.6,'#b7a6c8');fg.addColorStop(1,'rgba(240,215,215,1)');g.fillStyle=fg;g.fill();g.clip();
    const sl=pk+(bs-pk)*.3;g.beginPath();g.moveTo(fx-L,pk-10);g.lineTo(fx+L,pk-10);g.lineTo(fx+L,sl);
    for(let x=fx+u*.3;x>fx-u*.3;x-=u*.018){g.lineTo(x,sl-u*.03*Math.abs(Math.sin(x*.05))+(Math.random()-.3)*u*.03+Math.abs(x-fx)*.08)}g.lineTo(fx-L,sl);g.closePath();
    const sg=g.createLinearGradient(fx-u*.1,pk,fx+u*.1,sl);sg.addColorStop(0,'#fbf8ff');sg.addColorStop(1,'#cfc6e2');g.fillStyle=sg;g.fill();
    g.fillStyle='rgba(120,110,160,.18)';for(let k=-4;k<=4;k++){g.beginPath();g.moveTo(fx+k*tw*.25,pk+4);g.lineTo(fx+k*u*.06,sl+u*.03);g.lineTo(fx+k*u*.06+u*.008,sl+u*.03);g.closePath();g.fill()}g.restore();
    // haze bands and rolling ridges in front of the mountain
    const ridge=(y0,amp,col,seed)=>{g.fillStyle=col;g.beginPath();g.moveTo(0,h);for(let x=0;x<=w;x+=8)g.lineTo(x,y0+Math.sin(x/u*6+seed)*amp*.6+Math.sin(x/u*13+seed*2)*amp*.3+Math.sin(x/u*31+seed)*amp*.1);g.lineTo(w,h);g.closePath();g.fill();
      const m=g.createLinearGradient(0,y0-amp*1.2,0,y0+amp*1.5);m.addColorStop(0,'rgba(250,232,225,0)');m.addColorStop(1,'rgba(250,232,225,.85)');g.fillStyle=m;g.fillRect(0,y0-amp*1.2,w,amp*2.7)};
    ridge(h*.38,u*.04,'rgba(176,160,196,.9)',1);ridge(h*.43,u*.035,'rgba(204,178,196,.92)',4);ridge(h*.48,u*.03,'rgba(226,200,204,.95)',7);
    // a pagoda and a few trees on the nearest ridge, as small silhouettes
    g.fillStyle='rgba(150,120,150,.75)';const px=w*(a<1?.2:.18),py=h*.47;for(let k=0;k<5;k++){const ww=u*(.03-k*.004),yy=py-k*u*.022;g.beginPath();g.moveTo(px-ww,yy);g.quadraticCurveTo(px,yy-u*.008,px+ww,yy);g.lineTo(px+ww*.5,yy-u*.012);g.lineTo(px-ww*.5,yy-u*.012);g.closePath();g.fill();g.fillRect(px-ww*.35,yy-u*.022,ww*.7,u*.012)}
    g.fillRect(px-1,py-u*.13,2,u*.03);
    const m=g.createLinearGradient(0,h*.46,0,h*.62);m.addColorStop(0,'rgba(246,230,222,0)');m.addColorStop(1,'rgba(246,230,222,1)');g.fillStyle=m;g.fillRect(0,h*.46,w,h*.54)});
  if(scene.background&&scene.background!==skyTex&&scene.background.dispose)scene.background.dispose();if(skyTex)skyTex.dispose();skyTex=t;scene.background=t}

// ---------- scenery builders ----------
const ROCK=(()=>{const g=new T3.IcosahedronGeometry(1,1),p=g.attributes.position,seen={};
  for(let i=0;i<p.count;i++){const k=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>v.toFixed(3)).join();if(!seen[k])seen[k]=.78+Math.random()*.4;const f=seen[k];p.setXYZ(i,p.getX(i)*f,p.getY(i)*f,p.getZ(i)*f)}
  g.computeVertexNormals();return g})();
function petalGeo(s){const sp=new T3.Shape();sp.moveTo(0,-s);sp.bezierCurveTo(s*.9,-s*.6,s*.8,s*.7,s*.2,s);sp.lineTo(0,s*.75);sp.lineTo(-s*.2,s);sp.bezierCurveTo(-s*.8,s*.7,-s*.9,-s*.6,0,-s);return new T3.ShapeGeometry(sp,3)}
function roofGeo(rt,rb_,h){const g=new T3.CylinderGeometry(rt,rb_,h,4,4);g.rotateY(PI/4);const p=g.attributes.position;
  for(let i=0;i<p.count;i++){const y=p.getY(i),f=(y+h/2)/h,x=p.getX(i),z=p.getZ(i),r=Math.hypot(x,z);if(r<1e-4)continue;const lin=rb_+(rt-rb_)*f,want=rt+(rb_-rt)*Math.pow(1-f,2.2);const k=want/lin;
    p.setXYZ(i,x*k,y+(f<.01?h*.25:0),z*k)}g.computeVertexNormals();return g}
function toro(world,x,z,yg,s,LIT){const g=grp();g.position.set(x,yg,z);g.scale.setScalar(s);g.rotation.y=Math.random()*PI;
  g.add(cyl(.2,.24,.08,STONE,0,.04,0,6));g.add(cyl(.065,.085,.44,STONE,0,.3,0,10));g.add(cyl(.18,.11,.09,STONE,0,.56,0,6));
  g.add(cyl(.13,.13,.2,STONE,0,.7,0,6));g.add(cyl(.11,.11,.21,LIT,0,.7,0,6));
  for(const sx of[-1,1]){g.add(box(.02,.11,.1,LIT,sx*.118,.7,0))}
  const r=sh(new T3.Mesh(roofGeo(.05,.34,.16),STONE));r.position.y=.88;r.scale.set(1,1,1);g.add(r);
  g.add(cyl(.05,.07,.05,STONE,0,.97,0,8));g.add(lathe([[0,0],[.045,.02],[.04,.06],[0,.1]],STONE,0,.99,0,10));dump(world,g)}
function cherryTree(rnd,x,yg,z,s,trunks,puffs,pts,PN){const tips=[];const v=new T3.Vector3(),up=new T3.Vector3(0,1,0),q=new T3.Quaternion();
  const seg=(p,dir,len,rad,depth)=>{const e=p.clone().addScaledVector(dir,len);const c=new T3.CylinderGeometry(rad*.68,rad,len,7,1);q.setFromUnitVectors(up,dir);
    c.applyQuaternion(q);v.copy(p).addScaledVector(dir,len/2);c.translate(v.x,v.y,v.z);trunks.push(c);
    if(depth>=3){tips.push(e);return}if(depth>=1)tips.push(e.clone().lerp(p,.4));
    const n=depth===0?3+(rnd()<.5?1:0):2+(rnd()<.4?1:0);for(let k=0;k<n;k++){const a=k/n*PI*2+rnd()*1.2,spread=depth===0?.75+rnd()*.35:.45+rnd()*.4;
      const d=dir.clone().multiplyScalar(Math.cos(spread)).add(new T3.Vector3(Math.cos(a)*Math.sin(spread),0,Math.sin(a)*Math.sin(spread)));d.y=Math.max(d.y,.15+(depth===0?.2:0));d.normalize();seg(e,d,len*(.62+rnd()*.15),rad*.62,depth+1)}};
  seg(new T3.Vector3(x,yg-.05,z),new T3.Vector3((rnd()-.5)*.25,1,(rnd()-.5)*.25).normalize(),1.05*s,.11*s,0);
  const cols=['#f3a9c0','#ee93b0','#f7bfd0','#f0a0b8','#fbd3df','#e98aa8'];
  for(const t of tips){const n=3+Math.floor(rnd()*2);for(let j=0;j<n;j++){const r=(.15+rnd()*.13)*s,ox=(rnd()-.5)*.36*s,oy=(rnd()-.3)*.16*s,oz=(rnd()-.5)*.36*s,cx=t.x+ox,cy=t.y+.04*s+oy,cz=t.z+oz;
      puffs.push({x:cx,y:cy,z:cz,sx:r,sy:r*.78,sz:r,ry:rnd()*6,rx:rnd()*.6,c:cols[Math.floor(rnd()*6)]});
      for(let k=0;k<PN/n;k++){const a=rnd()*PI*2,e=Math.acos(1-2*rnd()*.9),rr=r*(1+rnd()*.18);pts.push(cx+Math.cos(a)*Math.sin(e)*rr,cy+Math.cos(e)*rr*.78,cz+Math.sin(a)*Math.sin(e)*rr)}}}
  return tips}

registerTheme({id:'japan',label:'Theehuis',icon:'🌸',title:'Moord in het theehuis',loading:'De theeceremonie wordt voorbereid…',
  i18n:{en:{label:'Teahouse',title:'Murder at the teahouse',loading:'Preparing the tea ceremony…',
    subs:['The tea was still warm. The host was not.','Among the cherry blossoms, more than petals fell.',"Someone broke the teahouse's silence for good.",'The bamboo fountain knocked. Then: dead silence.','A bowl of matcha, a paper screen, a corpse.'],
    victims:[['Master Rikyu','m'],['Lady Sakura','f']],
    rooms:{Stal:{name:'Rickshaw shed'},Binnenplaats:{name:'Courtyard'},Bibliotheek:{name:'Writing room'},Slaapkamer:{name:'Sleeping quarters'},Troonzaal:{name:'Imperial hall'},
      Keuken:{name:'Kitchen'},Kapel:{name:'Shrine'},Wapenkamer:{name:'Dojo'},Tuin:{name:'Moss garden'},Kelder:{name:'Sake cellar'}},
    objs:{stoel:{name:'floor cushion',verb:'Sat'},troon:{name:'imperial seat',verb:'Sat',art:'the'},tafel:{name:'tea table'},bed:{name:'futon',verb:'Lay'},
      tapijt:{name:'tatami mat',verb:'Stood'},bank:{name:'tea bench',verb:'Sat'},paard:{name:'rickshaw',verb:'Sat'},kist:{name:'lacquer chest'},
      ton:{name:'sake barrel'},hooibaal:{name:'rice bale'},boom:{name:'bonsai'},struik:{name:'azalea'},bloemperk:{name:'iris bed'},put:{name:'stone water basin'},
      kast:{name:'chest of drawers'},boekenkast:{name:'scroll cabinet'},harnas:{name:'suit of samurai armor'},altaar:{name:'Shinto altar'},
      kandelaar:{name:'paper lantern'},wapenrek:{name:'katana rack'},wijnrek:{name:'sake rack'}}}},
  subs:['De thee was nog warm. De gastheer niet meer.','Tussen de kersenbloesem viel meer dan alleen bloemblaadjes.','Iemand verstoorde de stilte van het theehuis voorgoed.','De bamboefontein tikte. Toen werd het doodstil.','Een kom matcha, een papieren scherm, een lijk.'],
  names:{A:[['Akiko','f'],['Akira','m']],B:[['Botan','f'],['Benkei','m']],C:[['Chiyo','f'],['Chikara','m']],D:[['Daiko','f'],['Daisuke','m']],E:[['Emiko','f'],['Eiji','m']],F:[['Fumiko','f'],['Fujio','m']],G:[['Gin','f'],['Goro','m']],H:[['Haruka','f'],['Hiroshi','m']]},
  victims:[['Meester Rikyu','m'],['Vrouwe Sakura','f']],vicFace:{f:'👸🏻',m:'🧓🏻'},
  faces:{f:['👩🏻','👵🏻','👧🏻','👩🏻‍🦳','👩🏻‍🍳','👩🏻‍🎨','💁🏻‍♀️','🙍🏻‍♀️'],m:['🥷','👨🏻','👴🏻','🧔🏻','👨🏻‍🍳','🧑🏻‍🌾','🤵🏻','👦🏻']},
  rooms:ROOMS,objs:OBJS,
  look:{sky:['#8f86c2','#d9b8d3','#fbdcc6','#efe2df'],fog:['#f0dcd6',17,46],hemi:['#f4ecff','#8d8c6a',1.05],sun:['#ffdcc0',3.4,[-10,6.2,-2.5]],rim:['#ffc4d4',.55],fill:['#e8dcff',.35],
    exposure:1.0,env:.4,bloom:[.32,.55,1.25],wall:'#f1e9d8',cap:'#3a2519',wallMap:false,wallRough:.85,grout:'#2a1c14',base:false,
    label:{bg:'rgba(250,244,232,.9)',fg:'#4a2a1c',line:'rgba(190,58,46,.6)',font:"'EB Garamond', Georgia, serif"},dust:['#ffe2ec',70,.55]},
  env(ctx){const {world,N,H,rand}=ctx;const yg=-.62,O=H+1.0,I=H+.35,G=H+2.6,R1=H+8.5;
  paintSky();
  const T={t:0};
  // --- the tea house floor: dark polished plinth, an engawa deck around it on stilts ---
  {const pm=DARKW.clone();pm.map=DARKW.map.clone();pm.map.needsUpdate=true;pm.map.repeat.set(4,1);world.add(box(N+.7,.52,N+.7,pm,0,-.36,0))}
  {const dk=(vert)=>ctex(vert?64:256,vert?256:64,(g,w,h)=>{g.fillStyle='#7a5238';g.fillRect(0,0,w,h);const n=4;for(let k=0;k<n;k++){const a=k*(vert?w:h)/n,b=(vert?w:h)/n;
      g.fillStyle=Math.random()<.5?'rgba(0,0,0,.08)':'rgba(255,230,200,.06)';vert?g.fillRect(a,0,b,h):g.fillRect(0,a,w,b);
      for(let j=0;j<10;j++){g.strokeStyle=Math.random()<.5?'rgba(30,15,5,.12)':'rgba(255,230,200,.08)';g.lineWidth=1;g.beginPath();const o=a+Math.random()*b;vert?(g.moveTo(o,0),g.lineTo(o+Math.random()*3,h)):(g.moveTo(0,o),g.lineTo(w,o+Math.random()*3));g.stroke()}
      g.fillStyle='rgba(20,10,5,.5)';vert?g.fillRect(a,0,1.5,h):g.fillRect(0,a,w,1.5)}},{wrap:true});
   const th=.07,yd=-.1-th/2,wd=O-I;
   const mA=new T3.MeshStandardMaterial({map:dk(false),roughness:.38}),mB=new T3.MeshStandardMaterial({map:dk(true),roughness:.38});mA.map.repeat.set(O,1);mB.map.repeat.set(1,O);
   for(const s of[-1,1]){world.add(box(2*O,th,wd,mA,0,yd,s*(I+wd/2)));world.add(box(wd,th,2*I,mB,s*(I+wd/2),yd,0))}
   const fas=mat('#2c1b12',{roughness:.5});for(const s of[-1,1]){world.add(box(2*O+.04,.09,.05,fas,0,-.18,s*O));world.add(box(.05,.09,2*O+.04,fas,s*O,-.18,0))}
   const stH=-.2-yg;for(const s of[-1,1])for(let k=-O+.1;k<=O-.09;k+=(2*O-.2)/Math.max(3,Math.round(O*1.1))){world.add(box(.08,stH,.08,fas,k,yg+stH/2,s*(O-.06)));world.add(box(.08,stH,.08,fas,s*(O-.06),yg+stH/2,k))}}
  // --- ground: moss that dissolves into the mist, raked gravel around the house, a pond in front ---
  const pond={cx:0,cz:H+2.6,rx:H+1.55,rz:1.0};const pondPts=[];
  for(let k=0;k<72;k++){const a=k/72*PI*2,r=1+.07*Math.sin(3*a+1)+.05*Math.sin(5*a+2);pondPts.push([pond.cx+pond.rx*Math.cos(a)*r,pond.cz+pond.rz*Math.sin(a)*r])}
  const pondShape=()=>{const s=new T3.Shape();pondPts.forEach((p,i)=>i?s.lineTo(p[0],-p[1]):s.moveTo(p[0],-p[1]));s.closePath();return s};
  const inPond=(x,z,f=1)=>{const dx=(x-pond.cx)/(pond.rx*f),dz=(z-pond.cz)/(pond.rz*f);return dx*dx+dz*dz<1};
  {const sq=new T3.Shape();sq.moveTo(-R1,-R1);sq.lineTo(R1,-R1);sq.lineTo(R1,R1);sq.lineTo(-R1,R1);sq.closePath();const hole=new T3.Path();pondPts.slice().reverse().forEach((p,i)=>i?hole.lineTo(p[0],-p[1]):hole.moveTo(p[0],-p[1]));hole.closePath();sq.holes.push(hole);
   const geo=new T3.ShapeGeometry(sq,2);geo.rotateX(-PI/2);
   const moss=ctex(256,256,(g,w,h)=>{g.fillStyle='#7f9358';g.fillRect(0,0,w,h);for(let k=0;k<120;k++){g.fillStyle=Math.random()<.5?'rgba(30,60,20,.14)':'rgba(190,220,120,.12)';g.beginPath();g.arc(Math.random()*w,Math.random()*h,6+Math.random()*24,0,7);g.fill()}
     for(let k=0;k<5000;k++){g.fillStyle=Math.random()<.5?'rgba(25,55,15,.3)':'rgba(200,235,140,.22)';g.fillRect(Math.random()*w,Math.random()*h,1.5,1.5)}},{wrap:true,rep:[.45,.45]});
   const alpha=ctex(256,256,(g,w,h)=>{const d=g.createImageData(w,h);for(let j=0;j<h;j++)for(let i=0;i<w;i++){const x=(i/w*2-1)*R1,z=(j/h*2-1)*R1;const rr=Math.pow(Math.pow(Math.abs(x),4)+Math.pow(Math.abs(z),4),.25);
     const a0=H+4.2,a1=R1-.3;let v=1-Math.min(1,Math.max(0,(rr-a0)/(a1-a0)));v=v*v*(3-2*v);const o=(j*w+i)*4;d.data[o]=d.data[o+1]=d.data[o+2]=255*v;d.data[o+3]=255}g.putImageData(d,0,0)});
   alpha.colorSpace=T3.NoColorSpace;alpha.repeat.set(1/(2*R1),1/(2*R1));alpha.offset.set(.5,.5);
   const mm=new T3.MeshStandardMaterial({map:moss,alphaMap:alpha,transparent:true,roughness:1,color:'#ffffff'});const ground=new T3.Mesh(geo,mm);ground.position.y=yg-.004;ground.receiveShadow=true;ground.renderOrder=-2;world.add(ground)}
  // rocks first, so the raked circles can be painted around them
  const big=[[-H*.55,-O-.8,.42],[H*.5,-O-.95,.5],[O+.85,-H*.15,.4],[-O-.85,H*.25,.34]];
  const lanterns=[[-O-.9,-O-.9,1],[O+.9,-O-.9,1],[O+2.1,H*.45,.95],[-O-1.8,H+2.4,.95]];
  {const S=HQ?1024:512,k=S/(2*G);const gt=ctex(S,S,(g,w,h)=>{g.fillStyle='#d2cdc2';g.fillRect(0,0,w,h);
      const X=x=>(x+G)*k;const groove=(path)=>{g.lineWidth=k*.028;g.strokeStyle='rgba(95,88,78,.55)';path();g.stroke();g.lineWidth=k*.018;g.strokeStyle='rgba(255,252,244,.6)';g.save();g.translate(-k*.012,-k*.016);path();g.stroke();g.restore()};
      for(let d=.14;d<G-O+.6;d+=.1){const e=O+d,r=Math.min(.9,d*.9+.1);groove(()=>{g.beginPath();g.roundRect(X(-e),X(-e),2*e*k,2*e*k,r*k)})}
      for(const[x,z,s] of big.concat(lanterns.slice(0,2).map(l=>[l[0],l[1],.28]))){const rr=s+.55;g.fillStyle='#d2cdc2';g.beginPath();g.arc(X(x),X(z),rr*k,0,7);g.fill();
        for(let d=s+.08;d<=rr;d+=.1)groove(()=>{g.beginPath();g.arc(X(x),X(z),d*k,0,7)})}
      const id=g.getImageData(0,0,w,h);for(let i=0;i<id.data.length;i+=4){const n=(Math.random()-.5)*40;id.data[i]+=n;id.data[i+1]+=n;id.data[i+2]+=n}g.putImageData(id,0,0)});
   gt.repeat.set(1/(2*G),1/(2*G));gt.offset.set(.5,.5);const bt=gt;
   const zf=H+1.62,sp=roundRect(2*G,2*G,.9);const s2=new T3.Shape();const r=.9;
   s2.moveTo(-G+r,-zf);s2.lineTo(G-r,-zf);s2.quadraticCurveTo(G,-zf,G,-zf+r);s2.lineTo(G,G-r);s2.quadraticCurveTo(G,G,G-r,G);s2.lineTo(-G+r,G);s2.quadraticCurveTo(-G,G,-G,G-r);s2.lineTo(-G,-zf+r);s2.quadraticCurveTo(-G,-zf,-G+r,-zf);
   const gg=new T3.ShapeGeometry(s2,6);gg.rotateX(-PI/2);const gm=new T3.MeshStandardMaterial({map:gt,bumpMap:bt,bumpScale:3,roughness:.95});const gr=new T3.Mesh(gg,gm);gr.position.y=yg+.006;gr.receiveShadow=true;world.add(gr)}
  // stones: pond rim, gravel kerb, stilt footings, big garden rocks (one instanced draw call)
  {const L=[],gc=['#8f8b82','#a39e93','#7d7a72','#b3ada0','#6f6c66'];const R=()=>rand();
   for(let k=0;k<pondPts.length;k+=1){const p=pondPts[k],q=pondPts[(k+1)%pondPts.length];const a=Math.atan2(q[1]-p[1],q[0]-p[0]);if(k%2)continue;
     L.push({x:p[0],y:yg-.02,z:p[1],sx:.17+R()*.08,sy:.08+R()*.05,sz:.11+R()*.05,ry:-a,c:gc[k%5]})}
   const kerb=(x0,z0,x1,z1)=>{const len=Math.hypot(x1-x0,z1-z0),n=Math.round(len/.32);for(let k=0;k<=n;k++){const t=k/n;L.push({x:x0+(x1-x0)*t,y:yg,z:z0+(z1-z0)*t,sx:.16+R()*.05,sy:.06+R()*.03,sz:.08+R()*.03,ry:-Math.atan2(z1-z0,x1-x0)+R()*.3,c:gc[(k*3)%5]})}};
   kerb(-G+.6,-G-.05,G-.6,-G-.05);kerb(-G-.05,-G+.6,-G-.05,H+1.5);kerb(G+.05,-G+.6,G+.05,H+1.5);
   for(const[x,z,s] of big){L.push({x,y:yg+s*.3,z,sx:s,sy:s*.85,sz:s*.8,ry:R()*6,c:'#837f76'});L.push({x:x+s*.9,y:yg+s*.1,z:z+s*.4,sx:s*.45,sy:s*.4,sz:s*.4,ry:R()*6,c:'#76736b'})}
   for(let k=0;k<8;k++){const a=R()*PI*2,d=G+.6+R()*2.2;const x=Math.cos(a)*d,z=Math.sin(a)*d;if(inPond(x,z,1.2)||z>H+1)continue;L.push({x,y:yg,z,sx:.2+R()*.2,sy:.12+R()*.1,sz:.18+R()*.15,ry:R()*6,c:gc[k%5]})}
   const rm=new T3.MeshStandardMaterial({map:stoneTex,roughness:.92,flatShading:true});world.add(inst(ROCK,rm,L,true));
   // moss mounds hugging the big rocks
   const M=[];for(const[x,z,s] of big){M.push({x:x-s*.4,y:yg,z:z+s*.3,sx:s*.9,sy:s*.22,sz:s*.7,c:'#5f8a3e'});M.push({x:x+s*.6,y:yg,z:z-s*.4,sx:s*.6,sy:s*.16,sz:s*.5,c:'#6e9a48'})}
   world.add(inst(new T3.SphereGeometry(1,14,8,0,PI*2,0,PI/2),mat('#ffffff',{roughness:1}),M,false));
   // flat stones: footings, the shoe stone, stepping stones beyond the bridge
   const F=[];const bx=H*.42;for(const s of[-1,1])for(let k=-O+.1;k<=O-.09;k+=(2*O-.2)/Math.max(3,Math.round(O*1.1))){F.push({x:k,y:yg,z:s*(O-.06),sx:.11,sy:.05,c:'#9a958a'});F.push({x:s*(O-.06),y:yg,z:k,sx:.11,sy:.05,c:'#9a958a'})}
   F.push({x:bx,y:yg+.1,z:O+.24,sx:.34,sy:.22,sz:.22,c:'#a9a397'});for(let k=0;k<4;k++)F.push({x:bx+(k%2?.18:-.1)+R()*.1,y:yg,z:H+4.15+k*.48,sx:.2+R()*.06,sy:.05,sz:.17,ry:R()*3,c:'#a7a195'});
   for(let k=0;k<6;k++)F.push({x:O+.7+(k%2)*.3,y:yg,z:H*.9-k*.5+.4,sx:.18,sy:.04,sz:.15,ry:R()*3,c:'#a39e92'});
   world.add(inst(new T3.CylinderGeometry(1,1.08,1,10),new T3.MeshStandardMaterial({map:stoneTex,roughness:.9}),F,true))}
  // --- the koi pond: a hollow basin, a clear surface, lily pads, ripples, koi ---
  const wl=yg-.09;
  {const bg=new T3.ExtrudeGeometry(pondShape(),{depth:.45,bevelEnabled:false,curveSegments:2});bg.rotateX(-PI/2);bg.translate(0,yg-.45,0);
   const bed=new T3.Mesh(bg,new T3.MeshStandardMaterial({map:stoneTex,color:'#4d5e52',roughness:1,side:T3.BackSide}));bed.receiveShadow=true;world.add(bed);
   const sgeo=new T3.ShapeGeometry(pondShape(),2);sgeo.rotateX(-PI/2);const wt=WATER.clone();wt.needsUpdate=true;wt.repeat.set(.6,.6);
   const wm=new T3.MeshStandardMaterial({color:'#41807c',map:wt,roughness:.06,metalness:.25,transparent:true,opacity:.5,emissive:'#3a3550',emissiveIntensity:.35,depthWrite:false});
   const water=new T3.Mesh(sgeo,wm);water.position.y=wl;water.receiveShadow=true;water.renderOrder=1;world.add(water);
   ctx.anim((t,dt)=>{wt.offset.set(Math.sin(t*.12)*.2,t*.015)});
   // lily pads + lotus
   const pads=[];for(let k=0;k<9;k++){const a=rand()*PI*2,d=.35+rand()*.5;const x=pond.cx+Math.cos(a)*pond.rx*d,z=pond.cz+Math.sin(a)*pond.rz*d*.9;if(Math.abs(x-H*.42)<.5)continue;pads.push({x,y:wl+.006,z,sx:.1+rand()*.07,ry:rand()*6,c:k%3?'#4e7d3a':'#5f8f45'})}
   const pg=new T3.CircleGeometry(1,18,.35,PI*2-.35);pg.rotateX(-PI/2);const padM=inst(pg,mat('#ffffff',{roughness:.5,side:T3.DoubleSide}),pads,false);world.add(padM);
   const lot=[];pads.slice(0,3).forEach((p,i)=>{lot.push({x:p.x+.03,y:wl+.04,z:p.z,sx:.045,sy:.035,c:i%2?'#f6c2d2':'#fdf2f4'})});world.add(inst(new T3.IcosahedronGeometry(1,0),mat('#ffffff',{roughness:.6,emissive:'#ffd6e2',emissiveIntensity:.2}),lot,false));
   const padBase=pads.map(p=>({...p}));const dm=new T3.Object3D();
   ctx.anim((t)=>{padBase.forEach((p,i)=>{dm.position.set(p.x+Math.sin(t*.1+i)*.03,p.y,p.z+Math.cos(t*.08+i)*.03);dm.rotation.set(0,p.ry+Math.sin(t*.05+i)*.3,0);dm.scale.set(p.sx,1,p.sx);dm.updateMatrix();padM.setMatrixAt(i,dm.matrix)});padM.instanceMatrix.needsUpdate=true})}
  // ripples
  const ripples=[];{const rg=new T3.RingGeometry(.92,1,40);rg.rotateX(-PI/2);for(let k=0;k<7;k++){const m=new T3.Mesh(rg,new T3.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:0,depthWrite:false}));m.renderOrder=2;m.userData={t:-1,s:.5};world.add(m);ripples.push(m)}}
  const ripple=(x,z,s=.5)=>{const r=ripples.find(r=>r.userData.t<0)||ripples[0];r.position.set(x,wl+.004,z);r.userData.t=0;r.userData.s=s};
  ctx.anim((t,dt)=>{for(const r of ripples){const u=r.userData;if(u.t<0)continue;u.t+=dt/2.6;if(u.t>=1){u.t=-1;r.material.opacity=0;continue}r.scale.setScalar(.03+u.t*u.s);r.material.opacity=.5*(1-u.t)*(1-u.t)}
    if(Math.random()<dt*.9){const a=Math.random()*PI*2,d=Math.random()*.7;ripple(pond.cx+Math.cos(a)*pond.rx*d,pond.cz+Math.sin(a)*pond.rz*d,.3+Math.random()*.35)}});
  // koi: instanced bodies, patches and tails, swimming lazy loops
  {const KN=HQ?9:6;const prof=[];for(let k=0;k<=10;k++){const t=k/10;prof.push(new T3.Vector2(Math.sin(Math.pow(t,.7)*PI)*.05*(1-t*.55)+.004,t*.34))}
   const bodyG=new T3.LatheGeometry(prof,10);bodyG.rotateZ(-PI/2);bodyG.translate(-.17,0,0);bodyG.scale(1,.68,1);
   const tailS=new T3.Shape();tailS.moveTo(0,0);tailS.quadraticCurveTo(.06,.05,.1,.06);tailS.lineTo(.08,0);tailS.lineTo(.1,-.06);tailS.quadraticCurveTo(.06,-.05,0,0);const tailG=new T3.ShapeGeometry(tailS,3);tailG.rotateX(PI/2);
   const kc=[['#f3efe6','#e2401c'],['#ef6a1c','#f6f0e6'],['#f2efe8','#151313'],['#e8b13a','#f7d77a'],['#e2401c','#151313'],['#f6f2ea','#e2401c'],['#d8d6d0','#3a4560'],['#ef7a26','#f6f0e6'],['#f1ece4','#e65a20']];
   const bm=new T3.MeshStandardMaterial({roughness:.35}),body=new T3.InstancedMesh(bodyG,bm,KN),tail=new T3.InstancedMesh(tailG,new T3.MeshStandardMaterial({roughness:.5,side:T3.DoubleSide,transparent:true,opacity:.85}),KN),patch=new T3.InstancedMesh(new T3.SphereGeometry(1,10,6),new T3.MeshStandardMaterial({roughness:.35}),KN*2);
   const c=new T3.Color();const koi=[];for(let i=0;i<KN;i++){body.setColorAt(i,c.set(kc[i%9][0]));tail.setColorAt(i,c.set(kc[i%9][0]));patch.setColorAt(i*2,c.set(kc[i%9][1]));patch.setColorAt(i*2+1,c.set(kc[i%9][1]));
     koi.push({ax:pond.rx*(.25+rand()*.45),az:pond.rz*(.2+rand()*.35),cx:pond.cx+(rand()-.5)*pond.rx*.6,w:(.12+rand()*.12)*(rand()<.5?-1:1),ph:rand()*6,f8:rand()<.4,y:wl-.03-rand()*.06,s:1.25+rand()*.55})}
   for(const m of[body,tail,patch]){m.frustumCulled=false;m.instanceColor.needsUpdate=true;world.add(m)}
   const d=new T3.Object3D(),M0=new T3.Matrix4(),M1=new T3.Matrix4(),M2=new T3.Matrix4(),q=new T3.Quaternion(),Y=new T3.Vector3(0,1,0),S=new T3.Vector3(),P=new T3.Vector3();
   const pos=(k,t)=>{const a=t*k.w+k.ph;return [k.cx+Math.cos(a)*k.ax,pond.cz+(k.f8?Math.sin(2*a)*.5:Math.sin(a))*k.az]};
   ctx.anim(t=>{koi.forEach((k,i)=>{const [x,z]=pos(k,t),[x2,z2]=pos(k,t+.05);const yaw=Math.atan2(z2-z,-(x2-x));const wig=Math.sin(t*7+i)*.35;
     q.setFromAxisAngle(Y,yaw+Math.sin(t*7+i)*.06);P.set(x,k.y,z);S.set(k.s,k.s,k.s);M0.compose(P,q,S);body.setMatrixAt(i,M0);
     M1.makeRotationY(wig);M1.setPosition(.16,0,0);M2.multiplyMatrices(M0,M1);tail.setMatrixAt(i,M2);
     for(let j=0;j<2;j++){d.position.set(-.08+j*.11,.022,(j?.012:-.008));d.scale.set(.05-j*.012,.016,.028);d.rotation.set(0,j*.4,0);d.updateMatrix();M2.multiplyMatrices(M0,d.matrix);patch.setMatrixAt(i*2+j,M2)}});
     body.instanceMatrix.needsUpdate=tail.instanceMatrix.needsUpdate=patch.instanceMatrix.needsUpdate=true})}
  // --- the red arched bridge over the pond ---
  {const g=grp(),bx=H*.42,z0=O+.38,z1=pond.cz+pond.rz*1.3,red=mat('#c4372b',{roughness:.45}),plank=WEATH,len=z1-z0;
   const arch=t=>yg+.1+Math.sin(t*PI)*.42;const n=Math.round(len/.11);
   for(let k=0;k<n;k++){const t=(k+.5)/n,z=z0+t*len,y=arch(t),sl=Math.atan2(Math.cos(t*PI)*PI*.42,len);const p=box(.62,.035,len/n-.012,plank,0,y,z);p.rotation.x=-sl;g.add(p)}
   for(const s of[-1,1]){const pts=[];for(let k=0;k<=12;k++){const t=k/12;pts.push([s*.33,arch(t)-.04,z0+t*len])}g.add(tube(pts,.035,red,24,6));
     const rail=[];for(let k=0;k<=12;k++){const t=k/12;rail.push([s*.33,arch(t)+.3,z0+t*len])}g.add(tube(rail,.022,red,24,6));
     const mid=rail.map(p=>[p[0],p[1]-.14,p[2]]);g.add(tube(mid,.012,red,24,5));
     for(let k=0;k<=6;k++){const t=k/6,y=arch(t);g.add(box(.045,.34,.045,red,s*.33,y+.13,z0+t*len))}
     for(const t of[0,1]){g.add(lathe([[0,0],[.035,0],[.04,.03],[.03,.06],[.012,.09],[0,.11]],GLD,s*.33,arch(t)+.31,z0+t*len,12))}
     for(const t of[.3,.7]){const y=arch(t);g.add(cyl(.04,.04,y-yg+.3,DARKW,s*.26,(y+yg-.3)/2,z0+t*len,8))}}
   g.position.x=bx;dump(world,g)}
  // --- stone lanterns, glowing ---
  const LIT=new T3.MeshStandardMaterial({color:'#fff1d0',emissive:'#ffb054',emissiveIntensity:2.2,roughness:.9});
  for(const[x,z,s] of lanterns)toro(world,x,z,yg,s*1.3,LIT);
  ctx.anim(t=>{LIT.emissiveIntensity=2.1+Math.sin(t*2.3)*.12+Math.sin(t*6.1)*.07});
  // --- hanging paper lanterns on posts at the deck corners ---
  {const pap=new T3.MeshStandardMaterial({map:CHO,emissiveMap:CHO,emissive:'#ffffff',emissiveIntensity:1.25,roughness:.85});
   const prof=[];for(let k=0;k<=12;k++){const a=k/12*PI;prof.push(new T3.Vector2(Math.sin(a)*.1+.004,-Math.cos(a)*.12))}const cg=new T3.LatheGeometry(prof,16);
   for(const[a,b] of[[-1,-1],[1,-1],[-1,1],[1,1]]){const x=a*(O-.1),z=b*(O-.1);world.add(box(.06,1.08,.06,DARKW,x,-.1+.54,z));world.add(box(.06,.05,.3,DARKW,x,.96,z+b*.12));
     const hang=grp();hang.position.set(x,.95,z+b*.24);const body=sh(new T3.Mesh(cg,pap));body.position.y=-.2;hang.add(body);hang.add(cyl(.05,.05,.03,LBLK,0,-.07,0,12));hang.add(cyl(.05,.05,.03,LBLK,0,-.33,0,12));
     hang.add(box(.006,.06,.006,LBLK,0,-.03,0));const tas=cyl(.012,.004,.08,mat('#d6a84c'),0,-.39,0,6);hang.add(tas);hang.userData.sway=[.07,.7+rand()*.3,rand()*6];world.add(hang);
     if(b>0){const pl=new T3.PointLight('#ffa36a',1.4,3.2,1.6);pl.position.set(x,.6,z+b*.24);world.add(pl);flames.push({light:pl,ph:rand()*9})}}}
  // --- shishi-odoshi: a bamboo arm fills, tips into the pond and clacks back ---
  {const g=grp();const sx=-O-.75,sz=H+1.45;g.position.set(sx,yg,sz);const dir=Math.atan2(pond.cz-sz,pond.cx-pond.rx*.8-sx);g.rotation.y=-dir;
   for(const z of[-.07,.07])g.add(cyl(.025,.028,.32,BAMB,0,.16,z,8));const ax=cyl(.01,.01,.18,BAMB,0,.27,0,6);ax.rotation.x=PI/2;g.add(ax);
   g.add(ball(.12,STONE,-.2,.04,0,1));g.add(ball(.09,STONE,.38,.02,.14,1));
   g.add(cyl(.03,.03,.62,BAMB,.42,.31,-.2,8));const spout=cyl(.016,.016,.24,BAMB,.42,.6,-.09,8);spout.rotation.x=PI/2-.3;g.add(spout);
   const piv=grp();piv.position.y=.27;piv.userData.live=true;const tb=cyl(.04,.04,.7,BAMB,.13,0,0,10);tb.rotation.z=PI/2;piv.add(tb);
   for(const x of[-.08,.22])piv.add(cyl(.043,.043,.012,mat('#4b5e2c'),x,0,0,10)).rotation.z=PI/2;g.add(piv);
   const stream=new T3.Mesh(new T3.CylinderGeometry(.005,.006,.3,6,1,true),new T3.MeshStandardMaterial({color:'#e2f4ff',transparent:true,opacity:.55,emissive:'#6a9ab0',roughness:.05}));stream.position.set(.43,.43,0);g.add(stream);
   dump(world,(()=>{const s=grp();s.position.copy(g.position);s.rotation.copy(g.rotation);g.children.filter(o=>o!==piv&&o!==stream).forEach(o=>s.add(o));return s})());world.add(g);
   const wpos=new T3.Vector3();let last=0;
   ctx.anim(t=>{const c=(t%7)/7;let a;if(c<.78)a=.33-Math.pow(c/.78,2)*.24;else if(c<.84)a=.09-(c-.78)/.06*.65;else if(c<.88)a=-.56;else{const u=(c-.88)/.12;a=.33-.89*Math.exp(-u*5)*Math.cos(u*9)}
     piv.rotation.z=a;stream.visible=c<.8;stream.scale.y=.9+Math.sin(t*30)*.1;
     const cyc=Math.floor(t/7);if(c>.84&&last!==cyc){last=cyc;g.localToWorld(wpos.set(.55,0,0));ripple(wpos.x,wpos.z,.45)}})}
  // --- bamboo grove on the left, bending in the breeze ---
  {const n=HQ?80:44,cl=[],lv=[];for(let k=0;k<n;k++){const x=-G-.5-rand()*2.4,z=-G-.8+rand()*(2*G+.5);if(inPond(x,z,1.25))continue;const h=2.6+rand()*2.2,r=.03+rand()*.025;
     cl.push({x,y:yg,z,sx:r,sy:h,sz:r,rx:(rand()-.5)*.06,rz:(rand()-.5)*.08});for(let j=0;j<5;j++){const y=yg+h*(.45+j*.12);lv.push({x:x+(rand()-.5)*.3,y,z:z+(rand()-.5)*.3,sx:.5+rand()*.4,ry:rand()*6,rz:(rand()-.5)*.6})}}
   const cg=new T3.CylinderGeometry(1,1,1,7,10,true);cg.translate(0,.5,0);const bm=windify(new T3.MeshStandardMaterial({map:BAMBOO,roughness:.5}),.006,yg);const cm=inst(cg,bm,cl,true);world.add(cm);
   const lg=[];for(let k=0;k<7;k++){const s=new T3.Shape();s.moveTo(0,0);s.quadraticCurveTo(.05,.02,.32,0);s.quadraticCurveTo(.05,-.02,0,0);const g=new T3.ShapeGeometry(s,2);g.rotateX(-PI/2+.4);g.rotateZ(-.35);g.rotateY(k/7*PI*2);lg.push(g)}
   const lgeo=mergeGeometries(lg);const lm=windify(new T3.MeshStandardMaterial({color:'#7aa04a',roughness:.7,side:T3.DoubleSide}),.006,yg);world.add(inst(lgeo,lm,lv,true))}
  // --- cherry trees: merged trunks, instanced blossom puffs, thousands of blossom points ---
  {const trees=[[-H-.3,-G-1.0,1.15],[H*.42,-G-1.5,1.25],[G+.9,-G-.3,1.05],[G+1.2,H*.15,.95],[-G-2.9,-G-.9,1.0],[G+1.3,H+2.4,.85]];if(!HQ)trees.pop();
   const trunks=[],puffs=[],pts=[],PN=HQ?70:34;let rr=ctx.seed*7+3;const rnd=()=>(rr=(rr*9301+49297)%233280)/233280;const tips=[];
   for(const[x,z,s] of trees)tips.push(...cherryTree(rnd,x,yg,z,s,trunks,puffs,pts,PN));
   const tg=mergeGeometries(trunks.map(g=>{const q=g.toNonIndexed();return q}));const tm=new T3.Mesh(tg,new T3.MeshStandardMaterial({color:'#4a3530',roughness:.9,map:stoneTex}));tm.castShadow=tm.receiveShadow=true;world.add(tm);
   const pm=windify(new T3.MeshStandardMaterial({color:'#ffffff',map:BLOSSOM,roughness:.85,emissive:'#ffb8cc',emissiveIntensity:.1}),.004,yg);const pg=new T3.SphereGeometry(1,14,9);
   world.add(inst(pg,pm,puffs,true));
   const bg=new T3.BufferGeometry();bg.setAttribute('position',new T3.Float32BufferAttribute(pts,3));const cols=[];const cc=new T3.Color();for(let i=0;i<pts.length/3;i++){cc.setHSL(.94+Math.random()*.05,.75,.8+Math.random()*.15);cols.push(cc.r,cc.g,cc.b)}
   bg.setAttribute('color',new T3.Float32BufferAttribute(cols,3));
   const bp=windify(new T3.PointsMaterial({size:.17,map:PETAL_TEX,vertexColors:true,alphaTest:.45,transparent:false}),.004,yg);world.add(new T3.Points(bg,bp));
   ctx.tips=tips;
   // petals resting on gravel and moss under the trees
   const gp=[];for(let k=0;k<(HQ?320:140);k++){const t=tips[Math.floor(rand()*tips.length)];const x=t.x+(rand()-.5)*2.2,z=t.z+(rand()-.5)*2.2;if(Math.abs(x)<O+.05&&Math.abs(z)<O+.05)continue;if(inPond(x,z,1.02))continue;
     gp.push({x,y:yg+.012,z,sx:1,rx:-PI/2,rz:rand()*6,c:rand()<.5?'#f8c9d6':'#fde4ea'})}
   world.add(inst(petalGeo(.035),mat('#ffffff',{roughness:.8,side:T3.DoubleSide,emissive:'#ffc6d4',emissiveIntensity:.15}),gp,false))}
  // --- falling petals: tumbling, drifting downwind, landing, rising again from the crowns ---
  {const n=HQ?520:200,geo=petalGeo(.03),m=new T3.MeshStandardMaterial({color:'#ffd3df',roughness:.7,side:T3.DoubleSide,emissive:'#ffc0d0',emissiveIntensity:.25});
   const im=new T3.InstancedMesh(geo,m,n);im.frustumCulled=false;world.add(im);const P=[];const tips=ctx.tips;
   const spawn=(p,init)=>{if(Math.random()<.65){const t=tips[Math.floor(Math.random()*tips.length)];p.x=t.x+(Math.random()-.5)*1.2;p.z=t.z+(Math.random()-.5)*1.2;p.y=init?yg+Math.random()*(t.y-yg):t.y+(Math.random()-.5)*.4}
     else{p.x=(Math.random()-.5)*(2*G+4);p.z=(Math.random()-.5)*(2*G+4);p.y=init?Math.random()*4:3+Math.random()*1.5}p.vy=.16+Math.random()*.14;p.ph=Math.random()*9;p.sp=1+Math.random()*2;p.rest=0};
   for(let i=0;i<n;i++){const p={};spawn(p,true);P.push(p)}
   const d=new T3.Object3D();
   ctx.anim((t,dt)=>{for(let i=0;i<n;i++){const p=P[i];const floor=(Math.abs(p.x)<H&&Math.abs(p.z)<H)?.01:(inPond(p.x,p.z)?wl+.004:yg+.012);
       if(p.rest>0){p.rest-=dt;if(p.rest<=0)spawn(p,false);d.position.set(p.x,floor,p.z);d.rotation.set(-PI/2,0,p.ph);d.scale.setScalar(p.rest<.6?p.rest/.6:1);d.updateMatrix();im.setMatrixAt(i,d.matrix);continue}
       p.y-=p.vy*dt;p.x+=(.22+Math.sin(t*.4+p.ph)*.15)*dt;p.z+=Math.cos(t*.7+p.ph*1.7)*.12*dt;
       if(p.y<=floor){p.y=floor;p.rest=2+Math.random()*4}
       d.position.set(p.x+Math.sin(t*p.sp+p.ph)*.08,p.y,p.z);d.rotation.set(t*p.sp+p.ph,t*p.sp*.7,Math.sin(t+p.ph));d.scale.setScalar(1);d.updateMatrix();im.setMatrixAt(i,d.matrix)}
     im.instanceMatrix.needsUpdate=true})}
  // --- a five-storey pagoda in the misty distance ---
  {const g=grp(),wallM=mat('#efe6d6',{roughness:.9}),redM=mat('#b5382c',{roughness:.6}),roofM=mat('#3a4046',{roughness:.6,flatShading:true});
   g.add(rb(1.5,.22,1.5,STONE,0,.11,0,.05,.02));let y=.22;
   for(let k=0;k<5;k++){const s=1-k*.12,w=.86*s,hh=k?.34:.44;g.add(box(w,hh,w,wallM,0,y+hh/2,0));
     for(const[a,b]of[[1,1],[1,-1],[-1,1],[-1,-1]])g.add(box(.06,hh,.06,redM,a*w/2,y+hh/2,b*w/2));g.add(box(w*.4,hh*.6,.02,redM,0,y+hh*.4,w/2+.005));
     g.add(box(w*1.08,.06,w*1.08,redM,0,y+hh+.03,0));const r=sh(new T3.Mesh(roofGeo(w*.38,w*.98,.24),roofM));r.position.y=y+hh+.17;g.add(r);y+=hh+.24}
   g.add(cyl(.02,.03,.9,GLD,0,y+.4,0,8));for(let k=0;k<7;k++){const t=sh(new T3.Mesh(new T3.TorusGeometry(.06-k*.004,.012,5,14),GLD));t.rotation.x=PI/2;t.position.y=y+.15+k*.09;g.add(t)}
   g.position.set(-H*.75,yg,-G-6.5);g.rotation.y=.35;g.scale.setScalar(1.3);dump(world,g)}
  // --- birds circling in the morning air ---
  {const birds=[],bm=mat('#3a3444',{roughness:.8});const wg=new T3.BufferGeometry();wg.setAttribute('position',new T3.Float32BufferAttribute([0,0,0, .02,0,.16, -.06,0,.1, 0,0,0, -.06,0,.1, -.05,0,.02],3));wg.computeVertexNormals();
   for(let k=0;k<(HQ?6:4);k++){const b=grp(),body=ball(.03,bm,0,0,0,1);body.scale.set(2.2,.8,.9);b.add(body);const L=new T3.Mesh(wg,mat('#3a3444',{side:T3.DoubleSide}));const Rw=new T3.Mesh(wg,L.material);Rw.scale.z=-1;b.add(L,Rw);
     b.userData={L,R:Rw,r:G+1+rand()*3,h:2.6+rand()*2.2,w:(.12+rand()*.1)*(k%3?1:-1),ph:rand()*6};world.add(b);birds.push(b)}
   ctx.anim(t=>{for(const b of birds){const u=b.userData,a=t*u.w+u.ph;b.position.set(Math.cos(a)*u.r,u.h+Math.sin(t*.5+u.ph)*.3,Math.sin(a)*u.r*.8);b.rotation.y=u.w>0?-a-PI/2:-a+PI/2;b.rotation.z=u.w>0?.15:-.15;
     const flap=Math.sin(t*.6+u.ph)>-.2?Math.sin(t*11+u.ph)*.7:.12;u.L.rotation.x=flap;u.R.rotation.x=-flap}})}
  // --- low mist drifting around the garden ---
  {const mists=[];for(let k=0;k<(HQ?16:9);k++){const s=new T3.Sprite(new T3.SpriteMaterial({map:CLOUD,color:'#fff4ef',transparent:true,opacity:.55,depthWrite:false}));
     const a=rand()*PI*2,r=H+4.2+rand()*3.5;s.userData={a,r,y:yg+.3+rand()*.9,w:(rand()-.5)*.02,o:.4+rand()*.3};s.scale.set(6+rand()*4,2.2+rand()*1.2,1);world.add(s);mists.push(s)}
   ctx.anim(t=>{for(const s of mists){const u=s.userData;u.a+=u.w*.016;s.position.set(Math.cos(u.a)*u.r,u.y+Math.sin(t*.2+u.a)*.1,Math.sin(u.a)*u.r);s.material.opacity=u.o*(.8+.2*Math.sin(t*.3+u.a*3))}})}
  // fold the static scenery into a few draw calls; keep the backdrop matched to the screen shape
  mergeStatic([STONE,BAMB,DARKW,WEATH,GLD,LIT,LBLK,mat('#2c1b12',{roughness:.5}),mat('#c4372b',{roughness:.45}),mat('#efe6d6',{roughness:.9}),mat('#b5382c',{roughness:.6}),mat('#3a4046',{roughness:.6,flatShading:true}),mat('#4b5e2c')]);
  ctx.anim((t)=>{WIND.value=t;paintSky();
    // haze follows the camera distance, so phones (farther camera) and close-ups get the same soft depth
    if(scene.fog&&scene.fog.isFog){const d=camera.position.distanceTo(controls.target);scene.fog.near=Math.max(12,d*.95);scene.fog.far=Math.max(34,d*2.55)}});
  }
});
})();
