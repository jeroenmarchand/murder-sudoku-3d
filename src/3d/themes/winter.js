// Winter: an alpine lodge on a snowy summit at night. Moonlight, aurora, warm windows, a gondola into the valley.
(()=>{
const TAU=Math.PI*2;
const U={uT:{value:0},uH:{value:450}};
const lazy=f=>{let v;return()=>v||(v=f())};
function cvs(w,h,draw,rep){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');draw(g,w,h);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;if(rep){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep[0],rep[1])}return t}
const hash=(a)=>{let x=Math.sin(a*127.1+311.7)*43758.5453;return x-Math.floor(x)};
// ---------- shared materials ----------
const SNOW=()=>mat('#eef3fb',{roughness:.8,emissive:'#3a4f7a',emissiveIntensity:.32});
const PINE='#b98350',DPINE='#6e4528';
const IRON=()=>mat('#2b2a2c',{metalness:.75,roughness:.45});
const BRASS=()=>mat('#c99a45',{metalness:.9,roughness:.32});
// ---------- geometry helpers ----------
const GC={};
function rboxG(w,h,d,r=.03){const k=[w,h,d,r].join();if(GC[k])return GC[k];
  const b=Math.max(.002,Math.min(r*.6,h/2-.002,w/2-.004,d/2-.004)),iw=w-2*b,id=d-2*b,rr=Math.max(.001,Math.min(r,iw/2-.001,id/2-.001));
  const g=new THREE.ExtrudeGeometry(roundRect(iw,id,rr),{depth:Math.max(.002,h-2*b),bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:2,curveSegments:4});
  g.rotateX(-Math.PI/2);g.translate(0,b-h/2,0);g.computeVertexNormals();return GC[k]=g}
function rbox(w,h,d,m,x=0,y=0,z=0,r=.03){const o=sh(new THREE.Mesh(rboxG(w,h,d,r),m));o.position.set(x,y,z);return o}
function heartPath(cx,cy,s){const p=new THREE.Path();p.moveTo(cx,cy-s*.9);p.bezierCurveTo(cx+s*1.25,cy-s*.05,cx+s*.85,cy+s*.95,cx,cy+s*.38);p.bezierCurveTo(cx-s*.85,cy+s*.95,cx-s*1.25,cy-s*.05,cx,cy-s*.9);return p}
function ext(shape,depth,m,bev=.006){const g=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelThickness:bev,bevelSize:bev,bevelSegments:2,curveSegments:10});g.translate(0,0,-depth/2);return sh(new THREE.Mesh(g,m))}
function lathe(pts,m,seg=16){return sh(new THREE.Mesh(new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(p[0],p[1])),seg),m))}
function tube(pts,r,m,seg=12){return sh(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p))),seg,r,6),m))}
function fl(x,y,z,s){const f=flame(x,y,z,s);f.userData.live=1;return f}
// merge every static mesh of a group by material: a whole model costs a few draw calls
function geoByMat(g){g.updateMatrixWorld(true);const inv=new THREE.Matrix4().copy(g.matrixWorld).invert(),by=new Map();
  g.traverse(o=>{if(!o.isMesh||Array.isArray(o.material))return;let p=o;while(p&&p!==g){if(p.userData.live)return;p=p.parent}
    if(!by.has(o.material))by.set(o.material,[]);by.get(o.material).push(o)});return {by,inv}}
function bake(g){const {by,inv}=geoByMat(g);const M=new THREE.Matrix4();
  for(const [m,arr] of by){if(arr.length<2)continue;
    const geos=arr.map(o=>{const q=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();for(const k of Object.keys(q.attributes))if(!['position','normal','uv'].includes(k))q.deleteAttribute(k);
      if(!q.attributes.uv)q.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(q.attributes.position.count*2),2));return q.applyMatrix4(M.multiplyMatrices(inv,o.matrixWorld))});
    const mg=mergeGeometries(geos);geos.forEach(q=>q.dispose());if(!mg)continue;
    const cast=arr.some(o=>o.castShadow);arr.forEach(o=>o.parent.remove(o));const mm=new THREE.Mesh(mg,m);mm.castShadow=cast;mm.receiveShadow=true;g.add(mm)}
  return g}
// ---------- particles: smoke, steam, breath, embers (one draw call each, all motion on the GPU) ----------
const PUFF_V=`attribute float aSeed;uniform float uT,uH,uRise,uSpread,uSize,uLife;uniform vec2 uG,uWind;varying float vA,vS;
void main(){float p=fract(uT/uLife+aSeed);vec3 q=position;float s1=fract(aSeed*43.7);
q.y+=p*uRise*(.8+.4*s1);q.x+=sin(p*5.+aSeed*30.)*.5*uSpread*p+uWind.x*p*p;q.z+=cos(p*4.+aSeed*17.)*.5*uSpread*p+uWind.y*p*p;
vec4 mv=modelViewMatrix*vec4(q,1.);gl_Position=projectionMatrix*mv;
gl_PointSize=max(1.,uSize*mix(uG.x,uG.y,p)*(.7+.6*s1)*projectionMatrix[1][1]*uH/-mv.z);
vA=smoothstep(0.,.12,p)*(1.-p);vS=fract(aSeed*91.3);}`;
const PUFF_F=`uniform vec3 uC;uniform float uA,uFlick,uT;varying float vA,vS;
void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.0,d);a*=a;float f=1.-uFlick+uFlick*(.5+.5*sin(uT*18.+vS*60.));
gl_FragColor=vec4(uC*f,a*vA*uA);}`;
function puffs(org,per,o){const n=org.length*per,p=new Float32Array(n*3),s=new Float32Array(n),j=o.jit||0;
  for(let i=0;i<n;i++){const q=org[Math.floor(i/per)];p[i*3]=q[0]+(Math.random()-.5)*j;p[i*3+1]=q[1];p[i*3+2]=q[2]+(Math.random()-.5)*j;s[i]=Math.random()}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('aSeed',new THREE.BufferAttribute(s,1));
  const m=new THREE.ShaderMaterial({uniforms:{uT:U.uT,uH:U.uH,uC:{value:new THREE.Color(o.color).multiplyScalar(o.bright||1)},uRise:{value:o.rise},uSpread:{value:o.spread},
    uSize:{value:o.size},uLife:{value:o.life},uG:{value:new THREE.Vector2(o.g0??.4,o.g1??1.6)},uA:{value:o.alpha??1},uWind:{value:new THREE.Vector2(...(o.wind||[0,0]))},uFlick:{value:o.flick||0}},
    vertexShader:PUFF_V,fragmentShader:PUFF_F,transparent:true,depthWrite:false,blending:o.add?THREE.AdditiveBlending:THREE.NormalBlending});
  const pts=new THREE.Points(g,m);pts.frustumCulled=false;pts.raycast=()=>{};pts.renderOrder=3;pts.userData.live=1;return pts}

// ---------- canvas textures ----------
function knit(g,S,cs,colorAt){const n=Math.ceil(S/cs);for(let j=0;j<n;j++)for(let i=0;i<n;i++){const c=colorAt(i,j);if(!c)continue;g.fillStyle=c;const x=i*cs,y=j*cs;
  g.beginPath();g.moveTo(x+.5,y);g.lineTo(x+cs/2,y+cs*.42);g.lineTo(x+cs/2,y+cs);g.lineTo(x+.5,y+cs*.58);g.fill();
  g.beginPath();g.moveTo(x+cs-.5,y);g.lineTo(x+cs/2,y+cs*.42);g.lineTo(x+cs/2,y+cs);g.lineTo(x+cs-.5,y+cs*.58);g.fill()}}
// eight-pointed Selbu star on a pixel grid
const star=(i,j,c,r)=>{const dx=Math.abs(i-c),dy=Math.abs(j-c);if(dx+dy>r+1)return false;return (dx<=1&&dy<=r)||(dy<=1&&dx<=r)||(Math.abs(dx-dy)<=1&&dx+dy<=r+1&&dx+dy>2)};
const RUGT={};
function rugTex(L){if(RUGT[L])return RUGT[L];const cs=12,W=256*L,Hh=256;RUGT[L]=cvs(W,Hh,(g)=>{g.fillStyle='#7b1f24';g.fillRect(0,0,W,Hh);
  const nx=Math.round(W/cs),ny=Math.round(Hh/cs),per=Math.round(nx/L);
  knit(g,W,cs,(i,j)=>{if(j>=ny)return null;const cream='#f1e6d0',red=['#8e2329','#80202a'][(i+j)%2],navy='#20335a';
    if(j<2||j>=ny-2)return (i%2)?cream:navy;if(j===2||j===ny-3)return navy;
    if((j===3||j===ny-4)&&(i%4===0||i%4===1))return cream;
    const li=i%per,c=Math.floor(per/2),cj=Math.floor(ny/2);if(star(li,j,c,6))return cream;
    if(Math.abs(li-c)+Math.abs(j-cj)===9)return '#d8a63a';return red});
  // fringe
  g.fillStyle='#efe2c8';for(let y=6;y<Hh;y+=7){g.fillRect(0,y,5,3);g.fillRect(W-5,y,5,3)}});return RUGT[L]}
const tartanTex=lazy(()=>cvs(256,256,(g,S)=>{g.fillStyle='#8f1f24';g.fillRect(0,0,S,S);
  const st=(c,a,pos,w)=>{g.globalAlpha=a;g.fillStyle=c;g.fillRect(pos,0,w,S);g.fillRect(0,pos,S,w);g.globalAlpha=1};
  for(const o of[0,128]){st('#1c2c4a',.5,o+18,46);st('#0f3a26',.35,o+84,22);st('#f2d27a',.7,o+74,4);st('#ffffff',.35,o+112,3)}
  g.strokeStyle='rgba(0,0,0,.08)';for(let k=-S;k<S;k+=4){g.beginPath();g.moveTo(k,0);g.lineTo(k+S,S);g.stroke()}},[2,2]));
const ginghamTex=lazy(()=>cvs(128,128,(g,S)=>{g.fillStyle='#f4efe6';g.fillRect(0,0,S,S);g.fillStyle='rgba(190,30,40,.55)';
  for(let k=0;k<S;k+=32){g.fillRect(k,0,16,S);g.fillRect(0,k,S,16)}},[3,1]));
const quiltTex=lazy(()=>cvs(384,256,(g,W,Hh)=>{const cols=['#b8433f','#e9dcc3','#3f5f8a','#d39a3c','#6f8f5a','#a3304a','#f3eadb','#2e4a6e'];
  for(let j=0;j<4;j++)for(let i=0;i<6;i++){const x=i*64,y=j*64;g.fillStyle=cols[(i*3+j*5)%8];g.fillRect(x,y,64,64);
    if((i+j)%2){g.fillStyle=cols[(i+j*2+3)%8];g.beginPath();g.moveTo(x,y);g.lineTo(x+64,y);g.lineTo(x,y+64);g.fill()}
    else{g.fillStyle='rgba(255,255,255,.75)';g.beginPath();const p=heartPath(0,0,1);g.save();g.translate(x+32,y+30);g.scale(14,-14);
      g.moveTo(0,-.9);g.bezierCurveTo(1.25,-.05,.85,.95,0,.38);g.bezierCurveTo(-.85,.95,-1.25,-.05,0,-.9);g.restore();g.fill()}
    g.setLineDash([4,3]);g.strokeStyle='rgba(255,250,235,.6)';g.lineWidth=1.5;g.strokeRect(x+4,y+4,56,56);g.setLineDash([])}}));
const kastTex=lazy(()=>cvs(256,384,(g,W,Hh)=>{g.fillStyle='#3e6f78';g.fillRect(0,0,W,Hh);
  for(const x0 of[14,134]){g.fillStyle='#4e8590';g.beginPath();g.roundRect(x0,16,108,352,18);g.fill();g.strokeStyle='#e9d29a';g.lineWidth=4;g.beginPath();g.roundRect(x0+8,24,92,336,14);g.stroke();
    const cx=x0+54;g.strokeStyle='#2f5a2a';g.lineWidth=4;g.beginPath();g.moveTo(cx,320);g.bezierCurveTo(cx-6,250,cx+8,190,cx,120);g.stroke();
    for(const [dy,s] of[[260,1],[210,-1],[165,1]]){g.fillStyle='#5f8f3a';g.beginPath();g.ellipse(cx+s*16,dy,16,7,s*.6,0,7);g.fill()}
    const fl=(x,y,r,c)=>{g.fillStyle=c;for(let k=0;k<5;k++){const a=k/5*TAU;g.beginPath();g.ellipse(x+Math.cos(a)*r,y+Math.sin(a)*r,r*.8,r*.5,a,0,7);g.fill()}g.fillStyle='#f4c542';g.beginPath();g.arc(x,y,r*.5,0,7);g.fill()};
    fl(cx,110,13,'#c8323a');fl(cx-24,200,9,'#f2efe4');fl(cx+24,236,9,'#e0703a');
    g.fillStyle='#c8323a';g.save();g.translate(cx,300);g.scale(16,-16);g.beginPath();g.moveTo(0,-.9);g.bezierCurveTo(1.25,-.05,.85,.95,0,.38);g.bezierCurveTo(-.85,.95,-1.25,-.05,0,-.9);g.fill();g.restore();
    g.fillStyle='#e9d29a';g.font='700 22px Georgia';g.textAlign='center';g.fillText(x0<100?'18':'74',cx,62)}}));
const endTex=lazy(()=>cvs(64,64,(g)=>{g.fillStyle='#d2a874';g.fillRect(0,0,64,64);for(let r=4;r<32;r+=3+Math.random()*2){g.strokeStyle=`rgba(120,70,30,${.25+Math.random()*.25})`;g.lineWidth=1.2;g.beginPath();g.arc(32,32,r,0,7);g.stroke()}
  g.strokeStyle='rgba(70,40,20,.6)';g.lineWidth=2;g.beginPath();g.moveTo(32,32);g.lineTo(58,40);g.stroke()}));
const barkTex=lazy(()=>cvs(128,128,(g,S)=>{g.fillStyle='#ffffff';g.fillRect(0,0,S,S);for(let k=0;k<220;k++){g.fillStyle=`rgba(${Math.random()<.5?'40,20,10':'255,240,220'},${.1+Math.random()*.2})`;g.fillRect(Math.random()*S,Math.random()*S,1+Math.random()*2,8+Math.random()*30)}},[2,4]));
const plankTex=lazy(()=>cvs(128,128,(g,S)=>{g.fillStyle='#ffffff';g.fillRect(0,0,S,S);for(let y=0;y<S;y+=16){g.fillStyle=`rgba(60,30,10,${.05+Math.random()*.12})`;g.fillRect(0,y,S,16);g.fillStyle='rgba(40,20,5,.5)';g.fillRect(0,y,S,2)}},[1,1]));
const winTex=lazy(()=>cvs(64,64,(g)=>{const r=g.createRadialGradient(32,40,4,32,32,44);r.addColorStop(0,'#fff0c0');r.addColorStop(1,'#ff9a40');g.fillStyle=r;g.fillRect(0,0,64,64);
  g.fillStyle='#3a2414';g.fillRect(29,0,6,64);g.fillRect(0,29,64,6);g.fillRect(0,0,64,4);g.fillRect(0,60,64,4);g.fillRect(0,0,4,64);g.fillRect(60,0,4,64)}));
const iceTex=lazy(()=>cvs(256,256,(g,S)=>{g.fillStyle='#ffffff';g.fillRect(0,0,S,S);g.strokeStyle='rgba(255,255,255,1)';
  for(let k=0;k<26;k++){g.strokeStyle=`rgba(90,130,170,${.15+Math.random()*.25})`;g.lineWidth=.6+Math.random()*1.2;let x=Math.random()*S,y=Math.random()*S;g.beginPath();g.moveTo(x,y);for(let s=0;s<6;s++){x+=(Math.random()-.5)*50;y+=(Math.random()-.5)*50;g.lineTo(x,y)}g.stroke()}
  for(let k=0;k<40;k++){g.fillStyle=`rgba(255,255,255,${Math.random()*.5})`;g.beginPath();g.ellipse(Math.random()*S,Math.random()*S,10+Math.random()*30,3+Math.random()*6,Math.random()*3,0,7);g.fill()}},[2,2]));
const snowTex=lazy(()=>cvs(256,256,(g,S)=>{g.fillStyle='#ffffff';g.fillRect(0,0,S,S);
  for(let k=0;k<60;k++){const x=Math.random()*S,y=Math.random()*S,r=10+Math.random()*40;const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(150,175,215,.18)');gr.addColorStop(1,'rgba(150,175,215,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,2*r,2*r)}
  for(let k=0;k<500;k++){g.fillStyle=`rgba(${Math.random()<.5?'255,255,255':'170,190,225'},.5)`;g.fillRect(Math.random()*S,Math.random()*S,1,1)}},[1,1]));
const softTex=lazy(()=>cvs(128,128,(g)=>{const r=g.createRadialGradient(64,64,0,64,64,64);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.5,'rgba(255,255,255,.4)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,128,128)}));
function fieldstone(g,S,base,R){g.fillStyle='rgba(30,22,18,.55)';g.fillRect(0,0,S,S);const n=3,c=S/n;
  for(let j=-1;j<=n;j++)for(let i=-1;i<=n;i++){const cx=(i+.5)*c+(R()-.5)*c*.35+(j%2)*c*.3,cy=(j+.5)*c+(R()-.5)*c*.3,r=c*.47;
    g.fillStyle=base;g.beginPath();for(let k=0;k<9;k++){const a=k/9*TAU,rr=r*(.8+R()*.25);const x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*rr*.9;k?g.lineTo(x,y):g.moveTo(x,y)}g.closePath();g.fill();
    g.fillStyle=R()<.5?'rgba(20,10,0,.12)':'rgba(255,245,230,.12)';g.fill();
    const gr=g.createLinearGradient(cx-r,cy-r,cx+r,cy+r);gr.addColorStop(0,'rgba(255,250,240,.16)');gr.addColorStop(1,'rgba(0,0,0,.14)');g.fillStyle=gr;g.fill()}}
const stoneT=lazy(()=>cvs(256,256,(g,S)=>{g.fillStyle='#a49a90';g.fillRect(0,0,S,S);let s=7;fieldstone(g,S,'#b3a99d',()=>(s=(s*9301+49297)%233280)/233280)},[1,1]));

// ---------- floors ----------
const P_STRAW=(g,S,R,shade,lite)=>{for(let x=0;x<S;x+=64){g.fillStyle=R()<.5?shade(.07):lite(.06);g.fillRect(x,0,64,S);g.fillStyle=shade(.28);g.fillRect(x,0,2,S);g.fillRect(x,R()*S,64,2)}
  for(let k=0;k<40;k++){g.strokeStyle=R()<.5?shade(.06):lite(.05);g.lineWidth=1;const x=R()*S;g.beginPath();g.moveTo(x,0);g.bezierCurveTo(x+R()*6-3,S/3,x+R()*6-3,S*2/3,x+R()*4-2,S);g.stroke()}
  for(let k=0;k<170;k++){g.strokeStyle=R()<.6?'rgba(250,215,120,.6)':'rgba(140,95,30,.5)';g.lineWidth=1.3;const x=R()*S,y=R()*S,a=R()*6.3,l=6+R()*16;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+Math.cos(a+.4)*l/2,y+Math.sin(a+.4)*l/2,x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke()}};
const P_SLATE=(g,S,R,shade,lite)=>{g.fillStyle=shade(.32);g.fillRect(0,0,S,S);const rows=[[0,96],[96,80],[176,80]];
  for(const [y,h] of rows){let x=-R()*60;while(x<S){const w=70+R()*60;g.fillStyle='#98a2b2';g.fillRect(x+3,y+3,w-6,h-6);g.fillStyle=R()<.5?shade(.1):lite(.1);g.fillRect(x+3,y+3,w-6,h-6);
    g.strokeStyle=lite(.12);g.lineWidth=1;for(let k=0;k<3;k++){g.beginPath();const yy=y+8+R()*(h-16);g.moveTo(x+6,yy);g.lineTo(x+w-6,yy+R()*6-3);g.stroke()}x+=w}}
  for(let k=0;k<5;k++){const x=R()*S,y=R()*S,r=20+R()*40;const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(245,250,255,.75)');gr.addColorStop(1,'rgba(245,250,255,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,2*r,2*r)}};
const P_TARTAN=(g,S)=>{const st=(c,a,pos,w)=>{g.globalAlpha=a;g.fillStyle=c;g.fillRect(pos,0,w,S);g.fillRect(0,pos,S,w);g.globalAlpha=1};
  for(const o of[0,128]){st('#16301f',.42,o+20,44);st('#b8333a',.75,o+80,6);st('#f0cf6a',.65,o+102,3);st('#0c1f14',.3,o,10)}
  g.strokeStyle='rgba(0,0,0,.07)';g.lineWidth=1;for(let k=-S;k<S;k+=4){g.beginPath();g.moveTo(k,0);g.lineTo(k+S,S);g.stroke()}};
const P_KNIT=(g,S,R)=>{const cs=16;knit(g,S,cs,(i,j)=>{const c=7;if(star(i,j,c,5))return '#f3e7d2';if(i===0||j===0||i===15||j===15)return (i+j)%2?'#f3e7d2':'#9a3434';
  if((Math.abs(i-c)+Math.abs(j-c))===8)return '#e0b048';return (i+j)%2?'#b84848':'#a83e40'})};
const P_CHEV=(g,S,R,shade,lite)=>{for(let c=0;c<4;c++){const x=c*64,s=c%2?1:-1;for(let y=-64;y<S+32;y+=16){g.fillStyle=R()<.5?shade(.04+R()*.08):lite(.03+R()*.08);
  g.beginPath();g.moveTo(x,y);g.lineTo(x+64,y+32*s);g.lineTo(x+64,y+32*s+16);g.lineTo(x,y+16);g.closePath();g.fill();g.strokeStyle=shade(.3);g.lineWidth=1.4;g.stroke()}}};
const P_CHECK=(g,S,R,shade,lite)=>{g.fillStyle='rgba(42,70,110,.62)';g.fillRect(0,0,S/2,S/2);g.fillRect(S/2,S/2,S/2,S/2);g.strokeStyle=shade(.25);g.lineWidth=3;g.strokeRect(0,0,S/2,S/2);g.strokeRect(S/2,S/2,S/2,S/2);g.strokeRect(S/2,0,S/2,S/2);g.strokeRect(0,S/2,S/2,S/2);
  g.fillStyle='rgba(255,255,255,.5)';for(const [x,y] of[[64,64],[192,192]]){g.beginPath();for(let k=0;k<4;k++){const a=k/4*TAU;g.lineTo(x+Math.cos(a)*14,y+Math.sin(a)*14)}g.fill()}
  for(const [x,y] of[[192,64],[64,192]]){g.fillStyle='rgba(42,70,110,.35)';g.beginPath();g.arc(x,y,10,0,7);g.fill()}};
const P_FIELD=(g,S,R)=>fieldstone(g,S,'#c9a58e',R);
const P_ICE=(g,S,R,shade,lite)=>{for(let k=0;k<4;k++){const x=(k%2)*S/2,y=Math.floor(k/2)*S/2;const gr=g.createLinearGradient(x,y,x+S/2,y+S/2);gr.addColorStop(0,'rgba(255,255,255,.35)');gr.addColorStop(.5,'rgba(255,255,255,0)');gr.addColorStop(1,'rgba(20,60,110,.18)');g.fillStyle=gr;g.fillRect(x,y,S/2,S/2)}
  g.strokeStyle='rgba(245,252,255,.85)';g.lineWidth=4;g.strokeRect(2,2,S-4,S-4);g.beginPath();g.moveTo(S/2,0);g.lineTo(S/2,S);g.moveTo(0,S/2);g.lineTo(S,S/2);g.stroke();
  const br=(x,y,a,l,d)=>{if(d>3||l<4)return;const x2=x+Math.cos(a)*l,y2=y+Math.sin(a)*l;g.beginPath();g.moveTo(x,y);g.lineTo(x2,y2);g.stroke();br(x2,y2,a+.6,l*.6,d+1);br(x2,y2,a-.6,l*.6,d+1);br(x+(x2-x)*.5,y+(y2-y)*.5,a+1.1,l*.4,d+1)};
  g.lineWidth=1;g.strokeStyle='rgba(255,255,255,.55)';for(let k=0;k<5;k++)br(R()*S,R()*S,R()*TAU,18+R()*20,0)};
const P_SNOW=(g,S,R)=>{for(let k=0;k<26;k++){const x=R()*S,y=R()*S,r=18+R()*40;const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,R()<.5?'rgba(120,150,205,.16)':'rgba(255,255,255,.5)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,2*r,2*r)}
  const a=R()*TAU;let x=S/2-Math.cos(a)*S*.6,y=S/2-Math.sin(a)*S*.6;g.fillStyle='rgba(95,120,175,.28)';
  for(let k=0;k<9;k++){const s=k%2?1:-1,px=x-Math.sin(a)*9*s,py=y+Math.cos(a)*9*s;g.beginPath();g.ellipse(px,py,8,5,a,0,7);g.fill();g.beginPath();g.ellipse(px+Math.cos(a)*10,py+Math.sin(a)*10,5,4,a,0,7);g.fill();x+=Math.cos(a)*28;y+=Math.sin(a)*28}
  for(let k=0;k<160;k++){g.fillStyle=`rgba(255,255,255,${.5+R()*.5})`;g.fillRect(R()*S,R()*S,1.5,1.5)}};
const P_BRICK=(g,S,R,shade,lite)=>{g.fillStyle=shade(.35);g.fillRect(0,0,S,S);const b=64;
  for(let j=0;j<4;j++)for(let i=0;i<4;i++){const x=i*b,y=j*b,v=(i+j)%2;for(let k=0;k<3;k++){g.fillStyle='#94705f';
    const r=v?[x+3+k*21.3,y+3,18,b-6]:[x+3,y+3+k*21.3,b-6,18];g.fillRect(...r);g.fillStyle=R()<.5?shade(.04+R()*.1):lite(.04+R()*.1);g.fillRect(...r)}}};

// ---------- object builders ----------
function chair(){const g=new THREE.Group(),w=mat(PINE,{roughness:.6});g.add(rbox(.4,.05,.4,w,0,.285,0,.06));
  for(const[a,b]of[[1,1],[1,-1],[-1,1],[-1,-1]]){const l=cyl(.02,.028,.3,w,a*.13,.135,b*.13,8);l.rotation.z=-a*.12;l.rotation.x=b*.12;g.add(l)}
  const s=new THREE.Shape();s.moveTo(-.12,0);s.lineTo(.12,0);s.bezierCurveTo(.15,.15,.2,.28,.17,.36);s.quadraticCurveTo(.1,.45,0,.42);s.quadraticCurveTo(-.1,.45,-.17,.36);s.bezierCurveTo(-.2,.28,-.15,.15,-.12,0);
  s.holes.push(heartPath(0,.25,.055));const back=ext(s,.03,w,.007);back.rotation.y=Math.PI/2;back.rotation.z=.1;back.position.set(-.17,.3,0);g.add(back);
  g.add(rbox(.2,.012,.2,mat('#c8343a',{roughness:.9}),.02,.316,0,.05));return bake(g)}
function armchair(){const g=new THREE.Group(),f=new THREE.MeshStandardMaterial({map:tartanTex(),roughness:.92}),wd=mat(DPINE,{roughness:.55});
  g.add(rbox(.62,.24,.6,f,0,.17,0,.06));g.add(rbox(.5,.09,.48,f,.03,.335,0,.05));
  g.add(rbox(.13,.62,.62,f,-.25,.6,0,.06));for(const z of[-.27,.27]){g.add(rbox(.52,.17,.1,f,0,.4,z,.05));g.add(rbox(.24,.32,.07,f,-.16,.66,z*1.02,.04))}
  for(const[a,b]of[[1,1],[1,-1],[-1,1],[-1,-1]])g.add(cyl(.03,.022,.06,wd,a*.26,.03,b*.25,8));
  const fur=mat('#f3eee6',{roughness:1,flatShading:true});const sk=ball(.17,fur,-.22,.86,0,1);sk.scale.set(.5,.35,1.3);g.add(sk);
  const bl=rbox(.3,.03,.2,mat('#2e4a6e',{roughness:.95}),.08,.5,.28,.02);bl.rotation.x=.25;g.add(bl);return bake(g)}
function table(L){const g=new THREE.Group(),w=mat(PINE,{roughness:.55}),dw=mat(DPINE),wl=L-.16;
  g.add(rbox(wl,.06,.72,w,0,.44,0,.05));for(const s of[-1,1]){g.add(rbox(.07,.36,.5,dw,s*(wl/2-.12),.23,0,.02));g.add(rbox(.12,.05,.62,dw,s*(wl/2-.12),.03,0,.02))}
  g.add(box(wl-.3,.05,.05,dw,0,.14,0));
  const cl=new THREE.Mesh(new THREE.BoxGeometry(.4,.006,.76),new THREE.MeshStandardMaterial({map:ginghamTex(),roughness:.95}));cl.position.set(0,.474,0);cl.receiveShadow=true;g.add(cl);
  if(L>1){const c2=cl.clone();c2.position.x=wl/2-.25;g.add(c2);cl.position.x=-wl/2+.25}
  const px=L>1?-wl/2+.25:0;// fondue: cast-iron pot on a stand over a burner
  const pot=lathe([[0,0],[.075,0],[.09,.04],[.085,.085],[.078,.09]],mat('#a3242a',{roughness:.35,metalness:.2}),18);pot.position.set(px,.54,0);g.add(pot);
  g.add(cyl(.076,.076,.004,mat('#f2d58a',{roughness:.4,emissive:'#6a4a10',emissiveIntensity:.4}),px,.62,0,16));
  for(let k=0;k<3;k++){const a=k/3*TAU;const l=cyl(.006,.006,.08,IRON(),px+Math.cos(a)*.08,.51,Math.sin(a)*.08,4);g.add(l)}g.add(fl(px,.49,0,1));
  for(const a of[.4,2.2]){const f=cyl(.003,.003,.2,mat('#888',{metalness:.8}),px+Math.cos(a)*.06,.66,Math.sin(a)*.06,4);f.rotation.z=Math.cos(a)*.5;f.rotation.x=-Math.sin(a)*.5;g.add(f)}
  const mug=(x,z,c)=>{g.add(cyl(.035,.032,.08,mat(c,{roughness:.5}),x,.517,z,12));const h=new THREE.Mesh(new THREE.TorusGeometry(.022,.007,6,12),mat(c,{roughness:.5}));h.position.set(x+.04,.52,z);sh(h);g.add(h)};
  mug(px+.15,.22,'#e9e3d6');mug(px-.12,-.24,'#3f5f8a');
  if(L>1){const bx=wl/2-.3;g.add(rbox(.32,.025,.2,mat('#9a6a3c'),bx,.49,0,.02));const br=sh(new THREE.Mesh(new THREE.CapsuleGeometry(.05,.12,4,10),mat('#b5743a',{roughness:.8})));br.rotation.z=Math.PI/2;br.position.set(bx-.03,.54,-.02);g.add(br);
    const ch=sh(new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.06,3,1,false,0,TAU*.9),mat('#f0c860',{roughness:.6})));ch.position.set(bx+.1,.535,.04);g.add(ch);
    const jar=cyl(.04,.04,.07,mat('#ffd9a0',{emissive:'#ff9a40',emissiveIntensity:.6,roughness:.2}),bx-.12,.51+.035,.22,12);g.add(jar);g.add(fl(bx-.12,.56,.22,.8))}
  else{g.add(cyl(.035,.035,.06,mat('#ffd9a0',{emissive:'#ff9a40',emissiveIntensity:.6,roughness:.2}),-.2,.505,-.2,12));g.add(fl(-.2,.54,-.2,.8))}
  return bake(g)}
function bedstee(L){const g=new THREE.Group(),w=mat(PINE,{roughness:.55}),dw=mat(DPINE),wl=L-.12;
  g.add(rbox(wl,.18,.84,w,0,.14,0,.04));g.add(rbox(wl-.08,.1,.76,mat('#f2ece0',{roughness:.9}),0,.28,0,.05));
  const q=new THREE.Mesh(rboxG(wl*.64,.05,.82,.03),new THREE.MeshStandardMaterial({map:quiltTex(),roughness:.95}));q.position.set(wl*.17,.35,0);sh(q);q.material.map.wrapS=q.material.map.wrapT=THREE.RepeatWrapping;q.material.map.repeat.set(1.6,1.6);g.add(q);
  g.add(rbox(.3,.09,.6,mat('#ffffff',{roughness:.9}),-wl/2+.24,.37,0,.04));
  const kn=rbox(.22,.06,.8,mat('#2e4a6e',{roughness:.95}),wl/2-.16,.385,0,.03);g.add(kn);
  const hb=(h,hole)=>{const s=new THREE.Shape();s.moveTo(-.43,0);s.lineTo(.43,0);s.lineTo(.43,h-.1);s.quadraticCurveTo(.3,h-.02,.15,h-.04);s.quadraticCurveTo(0,h+.08,-.15,h-.04);s.quadraticCurveTo(-.3,h-.02,-.43,h-.1);s.lineTo(-.43,0);
    if(hole)s.holes.push(heartPath(0,h-.2,.07));return ext(s,.05,w,.01)};
  const H1=hb(.78,1);H1.rotation.y=Math.PI/2;H1.position.set(-wl/2,0,0);g.add(H1);const H2=hb(.5,1);H2.rotation.y=Math.PI/2;H2.position.set(wl/2,0,0);g.add(H2);
  for(const z of[-.42,.42]){g.add(ball(.035,dw,-wl/2,.72,z,1))}return bake(g)}
function rug(L){const g=new THREE.Group();const t=rugTex(L);const side=mat('#6d1b20',{roughness:1});
  const m=new THREE.Mesh(new THREE.BoxGeometry(L-.1,.022,.84),[side,side,new THREE.MeshStandardMaterial({map:t,roughness:.98}),side,side,side]);m.position.y=.012;m.receiveShadow=true;g.add(m);return g}
function bench(){const g=new THREE.Group(),w=mat(PINE,{roughness:.6});g.add(rbox(.84,.06,.32,w,0,.28,0,.04));
  for(const[a,b]of[[1,1],[1,-1],[-1,1],[-1,-1]]){const l=cyl(.022,.028,.29,w,a*.33,.135,b*.1,8);l.rotation.z=-a*.15;l.rotation.x=b*.15;g.add(l)}
  const s=new THREE.Shape();s.moveTo(-.4,0);s.lineTo(.4,0);s.lineTo(.4,.22);s.quadraticCurveTo(.2,.3,0,.27);s.quadraticCurveTo(-.2,.3,-.4,.22);s.lineTo(-.4,0);s.holes.push(heartPath(-.2,.13,.05));s.holes.push(heartPath(.2,.13,.05));
  const bk=ext(s,.03,w,.007);bk.rotation.x=-.12;bk.position.set(0,.31,-.14);g.add(bk);
  const pl=rbox(.36,.03,.12,new THREE.MeshStandardMaterial({map:tartanTex(),roughness:.95}),.2,.5,-.17,.015);pl.rotation.x=-.9;g.add(pl);return bake(g)}
function rendier(L,ctx,graze){const g=new THREE.Group(),fur=mat('#6f5139',{roughness:.95}),pale=mat('#dccdb2',{roughness:1}),dark=mat('#24180f',{roughness:.6}),bone=mat('#e4d6b8',{roughness:.55});
  const caps=(r,l,m,x,y,z,rz)=>{const o=sh(new THREE.Mesh(new THREE.CapsuleGeometry(r,l,5,12),m));o.position.set(x,y,z);o.rotation.z=rz;return o};
  g.add(caps(.125,.3,fur,0,.47,0,Math.PI/2));g.add(caps(.1,.24,pale,.02,.42,0,Math.PI/2));
  for(const[a,b]of[[.17,.075],[.17,-.075],[-.17,.075],[-.17,-.075]]){g.add(cyl(.045,.03,.22,fur,a,.33,b,8));g.add(cyl(.026,.022,.2,pale,a,.13,b,8));g.add(cyl(.03,.034,.04,dark,a,.02,b,8))}
  const nk=cyl(.07,.09,.3,fur,.22,.62,0,10);nk.rotation.z=-.6;g.add(nk);const rf=ball(.1,pale,.25,.53,0,1);rf.scale.set(.8,1.3,1);g.add(rf);
  const col=new THREE.Mesh(new THREE.TorusGeometry(.085,.014,6,16),mat('#b3262c'));col.position.set(.25,.6,0);col.rotation.y=Math.PI/2;col.rotation.x=-.6;sh(col);g.add(col);g.add(ball(.022,BRASS(),.32,.56,0,1));
  const sad=mat('#a3262c',{roughness:.85}),cream=mat('#f1e6d0',{roughness:.9});g.add(rbox(.28,.035,.3,sad,-.02,.612,0,.03));
  for(const z of[-.15,.15]){g.add(box(.25,.14,.012,sad,-.02,.53,z));g.add(box(.25,.025,.016,cream,-.02,.46,z));g.add(box(.25,.012,.016,cream,-.02,.595,z))}
  const tl=ball(.045,pale,-.3,.54,0,1);tl.userData.live=1;g.add(tl);
  const hp=new THREE.Group();hp.position.set(.3,.76,0);hp.userData.live=1;g.add(hp);
  hp.add(caps(.058,.1,fur,.06,-.01,0,Math.PI/2+.4));hp.add(ball(.048,pale,.14,-.05,0,1));hp.add(ball(.024,dark,.185,-.055,0,1));
  for(const s of[-1,1]){hp.add(ball(.012,dark,.08,.025,s*.045,1));const e=sh(new THREE.Mesh(new THREE.ConeGeometry(.022,.07,6),fur));e.position.set(.0,.035,s*.06);e.rotation.x=s*1.1;hp.add(e);
    hp.add(tube([[-.01,.04,.03*s],[-.04,.1,.08*s],[-.03,.16,.11*s],[.03,.2,.1*s]],.01,bone,10));
    hp.add(tube([[-.035,.09,.07*s],[.02,.12,.06*s]],.007,bone,4));hp.add(tube([[-.03,.15,.105*s],[.02,.17,.13*s]],.007,bone,4));hp.add(tube([[.0,.04,.04*s],[.07,.08,.04*s]],.007,bone,4))}
  bake(hp);hp.add(puffs([[.2,-.06,0]],7,{rise:.1,spread:.2,size:.08,life:2.8,color:'#dfe8f6',alpha:.45,g0:.3,g1:2.4,wind:[.3,0]}));
  const ph=Math.random()*9;ctx.anim(t=>{const gz=graze?Math.max(0,Math.sin(t*.13+ph))*1.1:0;hp.rotation.z=Math.sin(t*.5+ph)*.08-gz;hp.rotation.y=Math.sin(t*.31+ph)*.28;tl.position.y=.54+Math.max(0,Math.sin(t*2.3+ph))*.02;
    g.children[0].scale.y=1+Math.sin(t*1.4+ph)*.02});
  bake(g);return g}
function slee(){const g=new THREE.Group(),red=mat('#a8322c',{roughness:.5}),ir=IRON(),wd=mat(PINE,{roughness:.6});
  for(const z of[-.17,.17]){g.add(tube([[-.38,.03,z],[.25,.03,z],[.37,.06,z],[.42,.16,z],[.36,.25,z],[.3,.2,z]],.014,ir,24));for(const x of[-.28,0,.24])g.add(cyl(.012,.012,.18,ir,x,.12,z,6))}
  for(let k=0;k<5;k++)g.add(rbox(.62,.025,.065,k%2?wd:red,-.04,.225,-.16+k*.08,.01));
  g.add(rbox(.08,.03,.42,red,.27,.24,0,.015));
  const bl=rbox(.24,.08,.3,new THREE.MeshStandardMaterial({map:tartanTex(),roughness:.95}),-.18,.28,0,.035);g.add(bl);
  const rope=sh(new THREE.Mesh(new THREE.TorusGeometry(.12,.008,6,20,Math.PI),mat('#c9b48a')));rope.position.set(.42,.18,0);rope.rotation.y=Math.PI/2;rope.rotation.x=.4;g.add(rope);
  g.add(cyl(.045,.04,.1,mat('#2b3d2a',{roughness:.6}),.08,.29,.06,10));return bake(g)}
function vat(){const g=new THREE.Group(),wd=mat('#8a5530',{roughness:.7}),ir=IRON(),dw=mat(DPINE);
  const b=lathe([[0,-.25],[.165,-.25],[.19,-.12],[.2,0],[.19,.12],[.165,.25],[0,.25]],wd,20);b.rotation.z=Math.PI/2;b.position.y=.33;g.add(b);
  for(const x of[-.2,-.07,.07,.2]){const r=sh(new THREE.Mesh(new THREE.TorusGeometry(.2-Math.abs(x)*.17,.012,6,22),ir));r.rotation.y=Math.PI/2;r.position.set(x,.33,0);g.add(r)}
  for(const x of[-.15,.15]){const l1=box(.04,.3,.04,dw,x,.12,.1);l1.rotation.x=.45;g.add(l1);const l2=box(.04,.3,.04,dw,x,.12,-.1);l2.rotation.x=-.45;g.add(l2)}
  g.add(cyl(.016,.016,.07,BRASS(),.27,.27,0,8));const tp=cyl(.01,.01,.06,BRASS(),.3,.27,0,6);tp.rotation.z=Math.PI/2;g.add(tp);g.add(cyl(.014,.014,.05,BRASS(),.27,.31,0,6));
  g.add(cyl(.035,.03,.08,mat('#e9e3d6',{roughness:.5}),.3,.04,0,12));
  const sign=rbox(.2,.1,.015,mat('#1f2a24',{roughness:.9}),0,.6,.0,.01);g.add(sign);g.add(box(.012,.1,.012,dw,0,.55,0));
  const steam=puffs([[.3,.09,0],[0,.56,0]],8,{rise:.35,spread:.18,size:.09,life:3.2,color:'#e6edf7',alpha:.35,g0:.4,g1:2.6,wind:[.1,0],jit:.03});g.add(steam);return bake(g)}
// a snow-laden pine: green tiers, a lumpy snow skirt on the top half of every tier
function pineParts(){const fol=[],snow=[];const jit=(geo,a,sd)=>{const p=geo.attributes.position;for(let k=0;k<p.count;k++){const x=p.getX(k),y=p.getY(k),z=p.getZ(k);const f=1+a*Math.sin(Math.atan2(z,x)*7+y*9+sd);p.setXYZ(k,x*f,y,z*f)}geo.computeVertexNormals();return geo};
  const tiers=[[.36,.34,.2],[.3,.32,.4],[.23,.3,.6],[.15,.28,.78]];
  tiers.forEach(([r,h,y],i)=>{const c=jit(new THREE.ConeGeometry(r,h,9,2),.12,i);c.translate(0,y+h/2,0);fol.push(c);
    const sr=r*.62,sh2=h*.5;const s=jit(new THREE.ConeGeometry(sr,sh2,9,2),.14,i+3);s.translate(0,y+h-sh2/2+.012,0);snow.push(s)});
  const tr=new THREE.CylinderGeometry(.04,.06,.25,7);tr.translate(0,.12,0);
  const mound=new THREE.SphereGeometry(.22,10,6,0,TAU,0,Math.PI/2);mound.scale(1,.25,1);snow.push(mound);
  const strip=g=>{const q=g.index?g.toNonIndexed():g;for(const k of Object.keys(q.attributes))if(!['position','normal','uv'].includes(k))q.deleteAttribute(k);return q};
  return {fol:mergeGeometries(fol.map(strip)),snow:mergeGeometries(snow.map(strip)),trunk:tr}}
const PINEG=lazy(pineParts);
function den(){const g=new THREE.Group(),P=PINEG();g.add(sh(new THREE.Mesh(P.fol,mat('#24493a',{roughness:.9,flatShading:true}))));g.add(sh(new THREE.Mesh(P.snow,SNOW())));g.add(sh(new THREE.Mesh(P.trunk,mat('#4a3322'))));
  g.userData.sway=[.018,.8,Math.random()*6];return g}
function hulst(){const g=new THREE.Group(),m=mat('#1f4a2c',{roughness:.6,flatShading:true}),be=mat('#d0202a',{roughness:.3,emissive:'#5a0008',emissiveIntensity:.6});
  for(const [x,y,z,r] of[[0,.16,0,.2],[.15,.13,.08,.15],[-.13,.12,-.07,.15],[.03,.12,-.15,.13]]){g.add(ball(r,m,x,y,z,1));const s=ball(r*.92,SNOW(),x,y+r*.42,z,1);s.scale.set(1,.42,1);g.add(s)}
  for(let k=0;k<9;k++){const a=k*2.4,r=.17+(k%3)*.03;g.add(ball(.024,be,Math.cos(a)*r,.18+(k%2)*.05,Math.sin(a)*r,0))}return bake(g)}
function sneeuwpop(L,ctx){const g=new THREE.Group(),sn=mat('#f4f7fc',{roughness:.7,emissive:'#3a4f7a',emissiveIntensity:.3}),coal=mat('#151515',{roughness:.5});
  const md=new THREE.Mesh(new THREE.SphereGeometry(.42,18,8,0,TAU,0,Math.PI/2),sn);md.scale.set(1,.16,1);md.receiveShadow=true;g.add(md);
  for(const [y,r] of[[.2,.19],[.47,.14],[.68,.1]]){const b=sh(new THREE.Mesh(new THREE.SphereGeometry(r,20,14),sn));b.position.y=y;g.add(b)}
  for(const z of[-.035,.035])g.add(ball(.013,coal,.09,.71,z,0));for(const y of[.42,.5,.29,.2])g.add(ball(.016,coal,y>.4?.135:.18,y,0,0));
  const n=sh(new THREE.Mesh(new THREE.ConeGeometry(.02,.11,8),mat('#ef7a1f',{roughness:.6})));n.rotation.z=-Math.PI/2;n.position.set(.14,.68,0);g.add(n);
  for(let k=0;k<6;k++){const a=-.9+k*.36;g.add(ball(.008,coal,Math.cos(a)*.092,.65+Math.sin(a*1.2)*.0-.012*Math.cos(a*2),Math.sin(a)*.092,0))}
  const scm=mat('#c8323a',{roughness:.9});const sc=sh(new THREE.Mesh(new THREE.TorusGeometry(.105,.028,8,20),scm));sc.rotation.x=Math.PI/2;sc.position.y=.585;g.add(sc);
  const tail=new THREE.Group();tail.position.set(.04,.58,.09);tail.userData.live=1;tail.add(rbox(.06,.16,.02,scm,0,-.08,0,.008));tail.userData.sway=[.12,1.3,Math.random()*6];g.add(tail);
  g.add(cyl(.11,.11,.015,coal,0,.765,0,18));g.add(cyl(.07,.075,.13,coal,0,.835,0,16));g.add(cyl(.072,.072,.025,scm,0,.785,0,16));
  for(const s of[-1,1]){const a=cyl(.008,.006,.26,mat('#4a3322'),0,.5,s*.2,5);a.rotation.x=s*-1.0;g.add(a)}
  for(const [x,z] of[[.28,.2],[-.25,.24],[.22,-.27]])g.add(ball(.05,sn,x,.05,z,1));return bake(g)}
function vuurkorf(L,ctx){const g=new THREE.Group(),ir=mat('#2a2522',{metalness:.7,roughness:.5,side:THREE.DoubleSide});
  g.add(lathe([[0,.2],[.1,.205],[.2,.27],[.25,.38],[.26,.4]],ir,18));const rim=sh(new THREE.Mesh(new THREE.TorusGeometry(.26,.015,6,24),ir));rim.rotation.x=Math.PI/2;rim.position.y=.4;g.add(rim);
  for(let k=0;k<3;k++){const a=k/3*TAU;const l=cyl(.015,.015,.26,ir,Math.cos(a)*.15,.12,Math.sin(a)*.15,6);l.rotation.z=Math.cos(a)*.35;l.rotation.x=-Math.sin(a)*.35;g.add(l)}
  const coal=mat('#ff7a22',{emissive:'#ff5a10',emissiveIntensity:2.4,roughness:.9});for(let k=0;k<8;k++){const a=k*2.3;g.add(ball(.05,coal,Math.cos(a)*.11,.34,Math.sin(a)*.11,0))}
  const lg=mat('#3a2416');for(let k=0;k<3;k++){const l=cyl(.03,.03,.36,lg,0,.39,0,7);l.rotation.z=Math.PI/2;l.rotation.y=k*1.05;g.add(l)}
  g.add(fl(0,.38,0,3.3));g.add(fl(.07,.38,.04,2.3));g.add(fl(-.06,.38,-.05,2.5));
  g.add(puffs([[0,.45,0]],14,{rise:.9,spread:.25,size:.035,life:1.8,color:'#ffb050',bright:3,add:true,g0:1,g1:.3,flick:.6,jit:.2}));
  return bake(g)}
function kast(){const g=new THREE.Group(),b=mat('#3e6f78',{roughness:.6}),tr=mat('#e2c98c',{roughness:.5});g.add(rbox(.6,.86,.38,b,0,.47,0,.03));
  const fr=new THREE.Mesh(new THREE.PlaneGeometry(.56,.82),new THREE.MeshStandardMaterial({map:kastTex(),roughness:.6}));fr.position.set(0,.47,.192);g.add(fr);
  g.add(rbox(.68,.06,.44,b,0,.92,0,.02));g.add(rbox(.66,.025,.42,tr,0,.89,0,.01));g.add(rbox(.64,.05,.4,b,0,.035,0,.02));
  for(const x of[-.03,.03])g.add(ball(.014,BRASS(),x,.47,.2,1));return bake(g)}
function boekenkast(L,ctx){const g=new THREE.Group(),w=mat(PINE,{roughness:.6});const R=ctx.rand;
  g.add(box(.7,.04,.32,w,0,.02,0));for(const x of[-.33,.33])g.add(box(.04,.94,.32,w,x,.47,0));g.add(box(.7,.04,.32,w,0,.94,0));g.add(box(.66,.9,.02,mat(DPINE),0,.47,-.15));
  const cols=['#7d2a2a','#2b4a6e','#2f6a45','#c9a14a','#5a3a6e','#a0582b','#e8dcc0'];
  for(let s=0;s<3;s++){g.add(box(.62,.025,.3,w,0,.33+s*.31-.02,0));let x=-.3;while(x<.27){const bw=.03+R()*.04,h=.16+R()*.09;if(R()<.12){x+=.04;continue}
    const b=rbox(bw,h,.22,mat(cols[Math.floor(R()*7)],{roughness:.7}),x+bw/2,.04+s*.31+h/2,.03,.006);if(R()<.15)b.rotation.z=.15;g.add(b);x+=bw+.006}}
  const ant=mat('#e4d6b8',{roughness:.55});for(const s of[-1,1])g.add(tube([[0,.96,0],[s*.06,1.01,0],[s*.1,1.04,.02]],.008,ant,6));return bake(g)}
function beer(){const g=new THREE.Group(),fur=mat('#5a3b25',{roughness:1}),lt=mat('#8a6040',{roughness:1}),dk=mat('#1a120c',{roughness:.5}),cl=mat('#efe6d2',{roughness:.4});
  const caps=(r,l,m,x,y,z,rx=0,rz=0)=>{const o=sh(new THREE.Mesh(new THREE.CapsuleGeometry(r,l,5,12),m));o.position.set(x,y,z);o.rotation.set(rx,0,rz);return o};
  g.add(rbox(.44,.08,.38,mat(DPINE,{roughness:.5}),0,.04,0,.03));
  for(const z of[-.08,.08]){g.add(caps(.07,.1,fur,0,.19,z));g.add(ball(.06,fur,.04,.1,z,1))}
  g.add(caps(.16,.2,fur,0,.43,0));const bl=ball(.12,lt,.07,.4,0,1);bl.scale.set(.6,1.2,1);g.add(bl);
  g.add(ball(.11,fur,.02,.72,0,1));g.add(caps(.045,.05,lt,.11,.7,0,0,Math.PI/2));g.add(ball(.022,dk,.16,.71,0,1));
  for(const z of[-.06,.06]){g.add(ball(.032,fur,-.01,.8,z,1));g.add(ball(.011,dk,.09,.76,z*.7,0))}
  for(const s of[-1,1]){g.add(caps(.05,.16,fur,.08,.58,s*.17,s*-.6,-.9));for(let k=0;k<3;k++){const c=sh(new THREE.Mesh(new THREE.ConeGeometry(.008,.04,5),cl));c.position.set(.2,.66+k*.012,s*(.2+(k-1)*.02));c.rotation.z=-1.3;g.add(c)}}
  const hat=mat('#c8323a',{roughness:.95});g.add(cyl(.065,.09,.08,hat,-.01,.85,0,14));g.add(cyl(.092,.092,.025,mat('#f1e6d0',{roughness:.95}),-.01,.815,0,14));g.add(ball(.03,mat('#f1e6d0',{roughness:1}),-.01,.9,0,1));
  return bake(g)}
function haard(L,ctx){const g=new THREE.Group(),st=new THREE.MeshStandardMaterial({map:stoneT(),color:'#e8ddd0',roughness:.9}),bm=mat(DPINE,{roughness:.6}),soot=mat('#150e0b',{roughness:1});
  g.add(rbox(.84,.06,.52,st,0,.03,.03,.02));for(const x of[-.31,.31])g.add(rbox(.2,.56,.44,st,x,.34,0,.02));g.add(box(.44,.5,.06,soot,0,.31,-.17));g.add(box(.44,.04,.36,soot,0,.07,0));
  g.add(rbox(.88,.08,.48,bm,0,.64,.01,.02));g.add(rbox(.62,.22,.34,st,0,.79,-.04,.02));
  const lg=mat('#4a2c18');for(const [a,z] of[[.4,.04],[-.4,-.02],[0,-.08]]){const l=cyl(.035,.035,.34,lg,0,.13,z,7);l.rotation.z=Math.PI/2;l.rotation.y=a;g.add(l)}
  const em=mat('#ff6a1a',{emissive:'#ff4a08',emissiveIntensity:2.6});for(let k=0;k<6;k++)g.add(ball(.03,em,-.12+k*.05,.1,.02*(k%2),0));
  g.add(fl(0,.14,0,3.6));g.add(fl(-.09,.13,.02,2.6));g.add(fl(.1,.13,-.01,2.8));
  g.add(cyl(.02,.02,.08,mat('#f4ecd8'),-.32,.72,.1,8));g.add(fl(-.32,.76,.1,.9));g.add(rbox(.12,.12,.06,mat('#3a2414'),.26,.74,.08,.02));g.add(cyl(.04,.04,.01,mat('#f4ecd8'),.26,.75,.115,14).rotateX(Math.PI/2));
  return bake(g)}
function olielamp(L,ctx){const g=new THREE.Group(),w=mat(DPINE,{roughness:.6}),ir=IRON();
  g.add(cyl(.035,.04,.62,w,0,.33,0,10));for(const a of[0,Math.PI/2]){const f=box(.36,.04,.05,w,0,.03,0);f.rotation.y=a;g.add(f)}
  const arm=box(.2,.02,.02,ir,.1,.66,0);g.add(arm);g.add(cyl(.01,.01,.04,ir,.19,.64,0,6));
  const ln=new THREE.Group();ln.position.set(.19,.62,0);ln.userData.live=1;ln.userData.sway=[.08,1.1,Math.random()*6];g.add(ln);
  ln.add(cyl(.05,.055,.02,ir,0,-.22,0,8));ln.add(cyl(.045,.045,.15,mat('#ffd28a',{emissive:'#ffa040',emissiveIntensity:2.2,roughness:.2}),0,-.14,0,8));
  for(let k=0;k<4;k++){const a=k/4*TAU+Math.PI/4;ln.add(box(.008,.16,.008,ir,Math.cos(a)*.052,-.14,Math.sin(a)*.052))}
  const cap=sh(new THREE.Mesh(new THREE.ConeGeometry(.065,.06,8),ir));cap.position.y=-.035;ln.add(cap);ln.add(new THREE.Mesh(new THREE.TorusGeometry(.015,.004,4,10),ir));
  ln.add(fl(0,-.17,0,1.3));bake(ln);return bake(g)}
function skirek(L,ctx){const g=new THREE.Group(),w=mat(PINE,{roughness:.6});
  for(const x of[-.34,.34]){g.add(box(.05,.78,.05,w,x,.39,-.12));g.add(box(.06,.04,.34,w,x,.02,0))}g.add(rbox(.74,.05,.08,w,0,.74,-.12,.01));g.add(rbox(.74,.04,.1,w,0,.08,.05,.01));
  const cols=['#c8323a','#2b5f9e','#e0a82e'];
  for(let k=0;k<3;k++){const x=-.22+k*.22;for(const dz of[-.03,.03]){const geo=new THREE.BoxGeometry(.07,.9,.012,1,14,1);const p=geo.attributes.position;
      for(let i=0;i<p.count;i++){const y=p.getY(i);if(y>.3)p.setZ(i,p.getZ(i)+Math.pow(y-.3,2)*.9)}geo.computeVertexNormals();
      const s=sh(new THREE.Mesh(geo,mat(cols[k],{roughness:.4})));s.position.set(x+dz,.46,-.05);s.rotation.x=-.12;s.rotation.y=Math.PI/2*0;g.add(s)}
    const pl=cyl(.007,.007,.82,IRON(),x+.08,.43,.02,5);pl.rotation.x=-.1;g.add(pl);const bk=new THREE.Mesh(new THREE.TorusGeometry(.03,.005,4,10),mat('#222'));bk.rotation.x=Math.PI/2;bk.position.set(x+.08,.1,.05);g.add(bk)}
  return bake(g)}
function flessenrek(L,ctx){const g=new THREE.Group(),w=mat(DPINE,{roughness:.6});
  for(const x of[-.34,.34])g.add(box(.04,.8,.3,w,x,.4,0));for(const y of[.02,.28,.54,.78])g.add(box(.7,.03,.3,w,0,y,0));g.add(box(.66,.78,.02,w,0,.4,-.14));
  const cols=[['#2a5a2a',.25],['#6a3a14',.3],['#a8c8e8',.15],['#4a1a2a',.25]];const R=ctx.rand;
  for(let s=0;s<3;s++)for(let k=0;k<6;k++){const c=cols[Math.floor(R()*4)];if(R()<.15)continue;const b=lathe([[0,0],[.028,0],[.03,.01],[.03,.11],[.024,.14],[.011,.16],[.01,.2],[.012,.205],[0,.205]].map(p=>[p[0]*.95,p[1]*(s===2?.9:1)]),mat(c[0],{roughness:c[1],metalness:.1,emissive:c[0]==='#a8c8e8'?'#3a5a7a':'#000'}),10);
    b.position.set(-.27+k*.108,.035+s*.26,.02);g.add(b)}return bake(g)}
function houtkist(L,ctx){const g=new THREE.Group(),w=mat('#8a5a32',{roughness:.7}),ir=IRON();
  for(const s of[-1,1]){g.add(rbox(.58,.3,.04,w,0,.15,s*.19,.01));g.add(rbox(.04,.3,.38,w,s*.27,.15,0,.01))}g.add(box(.52,.03,.36,w,0,.03,0));
  for(const s of[-1,1])for(const t of[-1,1])g.add(box(.05,.31,.05,ir,s*.27,.155,t*.19));
  const lg=new THREE.MeshStandardMaterial({map:barkTex(),color:'#7a5232',roughness:.95}),en=new THREE.MeshStandardMaterial({map:endTex(),roughness:.9});
  for(let r=0;r<2;r++)for(let k=0;k<4-r;k++){const z=-.13+k*.085+r*.04,y=.27+r*.07;const l=cyl(.042,.042,.5,lg,0,y,z,7);l.rotation.z=Math.PI/2;g.add(l);
    for(const s of[-1,1]){const e=cyl(.04,.04,.004,en,s*.251,y,z,7);e.rotation.z=Math.PI/2;g.add(e)}}
  const hd=box(.025,.38,.025,mat('#9a6a3c'),.33,.2,.12);hd.rotation.z=-.35;g.add(hd);const ax=box(.1,.05,.012,mat('#9aa0a8',{metalness:.9,roughness:.3}),.4,.37,.12);ax.rotation.z=-.35;g.add(ax);
  return bake(g)}
const OBJ={stoel:chair,troon:armchair,tafel:table,bed:bedstee,tapijt:rug,bank:bench,paard:rendier,kist:houtkist,ton:vat,hooibaal:slee,boom:den,struik:hulst,bloemperk:sneeuwpop,put:vuurkorf,kast,boekenkast,harnas:beer,altaar:haard,kandelaar:olielamp,wapenrek:skirek,wijnrek:flessenrek};

// ---------- sky dome: night gradient, twinkling stars, moon, aurora curtains ----------
const DOME_V=`varying vec3 vD;void main(){vD=position;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}`;
const DOME_F=`uniform float uT;uniform vec3 uTop,uMid,uLow,uMoon;varying vec3 vD;
float hs(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hs(i),hs(i+vec2(1,0)),f.x),mix(hs(i+vec2(0,1)),hs(i+vec2(1,1)),f.x),f.y);}
void main(){vec3 d=normalize(vD);float y=d.y;vec2 c2=normalize(d.xz+1e-5);float az=atan(d.z,d.x);
 float k=clamp((-.3-y)/.62,0.,1.);
 vec3 col=mix(uTop,uMid,smoothstep(0.,.55,k));col=mix(col,uLow,smoothstep(.45,1.,k));
 vec2 sp=vec2(az*70.,y*70.);vec2 id=floor(sp);float r=hs(id);
 if(r>.9){vec2 f=fract(sp)-.5-(vec2(hs(id+3.1),hs(id+7.7))-.5)*.6;float s=smoothstep(.13,0.,length(f));float tw=.55+.45*sin(uT*(1.+r*3.)+r*40.);col+=vec3(.85,.92,1.)*s*tw*(r-.9)*9.*(1.-smoothstep(.55,1.,k));}
 vec3 au=vec3(0.);
 for(int i=0;i<3;i++){float fi=float(i);vec2 q=c2*(2.2+fi*.8);
  float base=-.66+fi*.055+.12*(vn(q+vec2(uT*.025,fi*3.))-.5)+.035*sin(az*3.+uT*.06+fi*2.);
  float e=y-base;float hgt=.13+.09*vn(q*1.3+vec2(fi*5.,uT*.02));
  float rays=vn(c2*40.+vec2(fi*9.,uT*.16))*.6+vn(c2*95.+vec2(uT*.32,fi))*.4;
  float shp=smoothstep(-.012,.01,e)*exp(-max(e,0.)/hgt*2.3);
  float pch=smoothstep(.28,.72,vn(c2*1.6+vec2(uT*.012+fi*4.,fi*2.)));
  vec3 ac=mix(vec3(.12,1.,.48),vec3(.62,.22,1.),smoothstep(0.,hgt*1.1,e));
  au+=ac*shp*(.25+1.2*rays*rays)*pch*(1.-fi*.22);}
 col+=au*.7*(.85+.15*sin(uT*.37));
 float md=dot(d,uMoon);float disc=smoothstep(.99935,.9996,md);
 col=mix(col,vec3(2.4,2.35,2.2)*(1.-.28*vn(d.xy*420.)-.15*vn(d.zy*900.)),disc);
 col+=vec3(.5,.62,.95)*(pow(max(md,0.),1400.)*.7+pow(max(md,0.),90.)*.14+pow(max(md,0.),12.)*.05);
 gl_FragColor=vec4(col,1.);}`;
const SNOW_V=`attribute float aSeed;uniform float uT,uH,uTop,uBot,uW;varying float vA;
void main(){vec3 q=position;float h=uTop-uBot;float sp=.22+.3*fract(aSeed*7.13);q.y=uBot+mod(q.y-uBot-uT*sp,h);
 q.x=mod(q.x+uW+uT*.06+sin(uT*.55+aSeed*40.)*.25,2.*uW)-uW;q.z+=cos(uT*.42+aSeed*23.)*.2;
 vec4 mv=modelViewMatrix*vec4(q,1.);gl_Position=projectionMatrix*mv;gl_PointSize=max(1.4,(.028+.03*fract(aSeed*3.7))*projectionMatrix[1][1]*uH/-mv.z);
 vA=smoothstep(uBot,uBot+.5,q.y)*smoothstep(uTop,uTop-1.2,q.y);}`;
const SNOW_F=`varying float vA;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(vec3(1.25,1.3,1.4),smoothstep(.5,.15,d)*vA*.85);}`;
const GLIT_V=`attribute float aSeed;uniform float uT,uH;varying float vA;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;
 vA=pow(max(0.,sin(uT*(1.2+aSeed)+aSeed*80.)),24.);gl_PointSize=max(1.,.05*projectionMatrix[1][1]*uH/-mv.z)*(.5+vA);}`;
const GLIT_F=`varying float vA;void main(){vec2 c=gl_PointCoord-.5;float s=max(0.,1.-abs(c.x)*9.)*max(0.,1.-abs(c.y)*2.2)+max(0.,1.-abs(c.y)*9.)*max(0.,1.-abs(c.x)*2.2);gl_FragColor=vec4(vec3(2.2,2.4,3.)*s*vA,1.);}`;

registerTheme({id:'winter',label:'Berghut',icon:'🏔️',title:'Moord in de berghut',loading:'De kabelbaan zet je af bij de hut…',
  i18n:{en:{label:'Ski lodge',title:'Murder at the ski lodge',loading:'The cable car drops you at the lodge…',
    subs:['The blizzard closed the pass. No one was leaving.','The northern lights danced. Inside lay a body.','The glühwein was still warm when the scream rang out.','Someone in the lodge left no tracks in the snow.',"The cable car stopped. The killer didn't."],
    victims:[['Innkeeper Sepp','m'],['Baroness Liesl','f']],
    rooms:{Stal:{name:'Reindeer stable'},Binnenplaats:{name:'Courtyard'},Bibliotheek:{name:'Reading room'},Slaapkamer:{name:'Guest room'},Troonzaal:{name:'Taproom'},
      Keuken:{name:'Kitchen'},Kapel:{name:'Fireside nook'},Wapenkamer:{name:'Ski room'},Tuin:{name:'Snow garden'},Kelder:{name:'Storage cellar'}},
    objs:{stoel:{name:'chair',verb:'Sat'},troon:{name:'armchair',verb:'Sat',art:'the'},tafel:{name:'table'},bed:{name:'box bed',verb:'Lay'},
      tapijt:{name:'rug',verb:'Stood'},bank:{name:'bench',verb:'Sat'},paard:{name:'reindeer',verb:'Sat'},kist:{name:'firewood crate'},
      ton:{name:'glühwein barrel'},hooibaal:{name:'sled'},boom:{name:'pine tree'},struik:{name:'holly bush'},bloemperk:{name:'snowman'},put:{name:'brazier'},
      kast:{name:'farmhouse cupboard'},boekenkast:{name:'bookcase'},harnas:{name:'stuffed bear'},altaar:{name:'fireplace'},kandelaar:{name:'oil lamp'},
      wapenrek:{name:'ski rack'},wijnrek:{name:'bottle rack'}}}},
  subs:['De sneeuwstorm sloot de pas. Niemand kon nog weg.','Het noorderlicht danste. Binnen lag een lijk.','De glühwein was nog warm toen het gegil klonk.','Iemand in de hut liet geen sporen na in de sneeuw.','De kabelbaan stond stil. De moordenaar niet.'],
  names:{A:[['Anneliese','f'],['Alois','m']],B:[['Burgi','f'],['Bastian','m']],C:[['Cilli','f'],['Clemens','m']],D:[['Dorli','f'],['Dominik','m']],E:[['Evi','f'],['Emil','m']],F:[['Franzi','f'],['Ferdl','m']],G:[['Gretl','f'],['Gustl','m']],H:[['Heidi','f'],['Hias','m']]},
  victims:[['Waard Sepp','m'],['Barones Liesl','f']],vicFace:{f:'👸',m:'🧔‍♂️'},
  faces:{f:['👱‍♀️','👩‍🦰','👵','👩‍🍳','👩‍🦳','🧝‍♀️','👩','🙍‍♀️'],m:['🧔','👨‍🦰','👴','👨‍🍳','🤵','👱‍♂️','🧑‍🦱','👨‍🦳']},
  rooms:{Stal:{name:'Rendierstal',color:'#c9a560',pat:P_STRAW},Binnenplaats:{name:'Binnenhof',art:'het',color:'#9aa4b4',pat:P_SLATE,rough:.7},Bibliotheek:{name:'Leeskamer',color:'#4f8062',pat:P_TARTAN,rough:.95},
    Slaapkamer:{name:'Gastenkamer',color:'#b84848',pat:P_KNIT,rough:.95},Troonzaal:{name:'Gelagkamer',color:'#bb7c46',pat:P_CHEV,rough:.55},Keuken:{name:'Keuken',color:'#e6dcc6',pat:P_CHECK,rough:.4},
    Kapel:{name:'Haardhoek',color:'#c9a58e',pat:P_FIELD,rough:.85},Wapenkamer:{name:'Skikamer',color:'#93c8ea',pat:P_ICE,rough:.22,metal:.05},Tuin:{name:'Sneeuwtuin',color:'#edf2f9',pat:P_SNOW,rough:.9},Kelder:{name:'Voorraadkelder',color:'#94705f',pat:P_BRICK}},
  look:{sky:['#050a1e','#132552','#3d5a8c'],fog:['#1e3260',30,120],hemi:['#9db6f0','#6a5040',1.0],sun:['#c6d8ff',3.6,[-10,7.5,-4]],rim:['#7fffc0',.35],fill:['#ffae62',.75],
    exposure:1.08,env:.28,bloom:[.55,.5,1.15],wall:'#8a5c38',cap:'#f1e6cf',grout:'#2a201a',base:'#5d4430',
    label:{bg:'rgba(236,243,252,.88)',fg:'#1b2b4c',line:'rgba(60,95,150,.5)',font:"'Avenir Next','Trebuchet MS',sans-serif"},dust:['#e6f0ff',50,.35]},
  objs:{
    stoel:{name:'stoel',verb:'Zat',h:.31,build:chair},
    troon:{name:'leunstoel',de:true,verb:'Zat',h:.38,build:armchair},
    tafel:{name:'tafel',de:true,build:table},
    bed:{name:'bedstee',de:true,verb:'Lag',h:.375,build:bedstee},
    tapijt:{name:'kleed',verb:'Stond',h:.026,blob:false,build:rug},
    bank:{name:'bank',de:true,verb:'Zat',h:.31,build:bench},
    paard:{name:'rendier',verb:'Zat',h:.63,build:(L,c)=>rendier(L,c,false)},
    kist:{name:'houtkist',de:true,build:houtkist},
    ton:{name:'glühweinvat',build:vat},
    hooibaal:{name:'slee',de:true,build:slee},
    boom:{name:'den',de:true,build:den},
    struik:{name:'hulst',de:true,build:hulst},
    bloemperk:{name:'sneeuwpop',de:true,build:sneeuwpop},
    put:{name:'vuurkorf',de:true,build:vuurkorf},
    kast:{name:'boerenkast',de:true,build:kast},
    boekenkast:{name:'boekenkast',de:true,build:boekenkast},
    harnas:{name:'opgezette beer',de:true,build:beer},
    altaar:{name:'open haard',de:true,build:haard},
    kandelaar:{name:'olielamp',de:true,build:olielamp},
    wapenrek:{name:'skirek',build:skirek},
    wijnrek:{name:'flessenrek',build:flessenrek},
  },
  env(ctx){const {world,N,H,E,rand}=ctx;const R=rand;
  ctx.anim(t=>{U.uT.value=t;U.uH.value=renderer.domElement.height*.5});
  // sky dome follows the camera, so stars, moon and aurora sit at infinity
  {const m=new THREE.ShaderMaterial({uniforms:{uT:U.uT,uTop:{value:new THREE.Color('#040817')},uMid:{value:new THREE.Color('#10204c')},uLow:{value:new THREE.Color('#3a5788')},
     uMoon:{value:new THREE.Vector3(-.62,-.44,-.65).normalize()}},vertexShader:DOME_V,fragmentShader:DOME_F,side:THREE.BackSide,depthWrite:false,depthTest:false,fog:false});
   const dome=new THREE.Mesh(new THREE.SphereGeometry(100,48,32),m);dome.renderOrder=-100;dome.frustumCulled=false;world.add(dome);
   ctx.anim(()=>dome.position.copy(camera.position))}
  // the summit: a snowy plateau with drifts piled against the lodge, a jagged rock cone falling into the valley haze
  const IS=H+3.3;
  const rimR=th=>{const c=Math.abs(Math.cos(th)),s=Math.abs(Math.sin(th));return IS/Math.pow(Math.pow(c,5)+Math.pow(s,5),.2)*(1+.035*Math.sin(3*th+1.3)+.025*Math.sin(7*th+.4)+.015*Math.sin(13*th))};
  const nz=(x,z)=>Math.sin(x*1.7+Math.sin(z*1.3))*.5+Math.sin(z*2.1+x*.7)*.35+Math.sin((x+z)*3.3)*.15;
  const flats=[];
  function gy(x,z){const dq=Math.max(Math.abs(x),Math.abs(z))-E;if(dq<-.05)return -.14;
    let y=-.12+.19*Math.exp(-Math.max(0,dq)*2.6)+.08*nz(x*.8,z*.8)*Math.min(1,Math.max(0,dq));
    for(const f of flats){const d=Math.hypot((x-f.x)/f.rx,(z-f.z)/f.rz);if(d<1.35){const k=d<1?1:1-(d-1)/.35;y=y+(f.y-y)*k*k*(3-2*k)}}
    const th=Math.atan2(z,x),fr=Math.hypot(x,z)/rimR(th);if(fr>.84)y-=Math.pow((fr-.84)/.16,2)*.45;return y}
  // layout (key light from the back-left: tall things stand right and back so their shadows miss the board)
  const lake={x:-H*.55-.4,z:E+1.55,rx:Math.min(1.5,H*.42+.2),rz:.85,y:-.1};flats.push(lake);
  const pit={x:H*.55+.3,z:E+1.5,rx:.9,rz:.8,y:-.06};flats.push(pit);
  const ch1={x:E+1.6,z:-E-1.3,rx:1.1,rz:1,y:-.08};flats.push(ch1);
  const ch2={x:E+1.7,z:H*.25,rx:.95,rz:.9,y:-.08};flats.push(ch2);
  const st={x:-H*.35-.4,z:-E-1.45,rx:1.1,rz:.9,y:-.08};flats.push(st);
  const used=[[lake.x,lake.z,lake.rx+.5],[pit.x,pit.z,1.2],[ch1.x,ch1.z,1.2],[ch2.x,ch2.z,1.1],[st.x,st.z,1.3],[0,E+.9,.9]];
  {const SA=HQ?140:90,RR=HQ?30:20,pos=[],uv=[],idx=[];
   for(let j=0;j<=RR;j++){const f=Math.pow(j/RR,.55);for(let i=0;i<=SA;i++){const th=i/SA*TAU,r=rimR(th)*f;const x=Math.cos(th)*r,z=Math.sin(th)*r;pos.push(x,gy(x,z),z);uv.push(x*.3,z*.3)}}
   for(let j=0;j<RR;j++)for(let i=0;i<SA;i++){const a=j*(SA+1)+i,b=a+SA+1;idx.push(a,a+1,b,b,a+1,b+1)}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
   const t=snowTex();t.repeat.set(1,1);const ground=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:'#dfe7f4',map:t,roughness:.92,emissive:'#22345c',emissiveIntensity:.35}));ground.receiveShadow=true;world.add(ground);
   // cliffs
   const K=11,cp=[];for(let k=0;k<=K;k++){const dep=Math.pow(k/K,1.35)*40;for(let i=0;i<=SA/2;i++){const th=i/(SA/2)*TAU;const r0=rimR(th);
     const jag=k?(.55*Math.sin(th*9+k*1.7)+.35*Math.sin(th*23-k*2.3)+.25*Math.sin(th*41+k*.9))*(.35+dep*.06):0;const r=r0*(1+dep*.03)+jag;
     const y=k?gy(Math.cos(th)*r0*.999,Math.sin(th)*r0*.999)-dep+.5*Math.sin(th*13+k*2.1)*(k>1?1:.3):gy(Math.cos(th)*r0*.999,Math.sin(th)*r0*.999);cp.push(Math.cos(th)*r,y,Math.sin(th)*r)}}
   const ci=[],W=SA/2+1;for(let k=0;k<K;k++)for(let i=0;i<SA/2;i++){const a=k*W+i,b=a+W;ci.push(a,a+1,b,b,a+1,b+1)}
   let cg=new THREE.BufferGeometry();cg.setAttribute('position',new THREE.Float32BufferAttribute(cp,3));cg.setIndex(ci);cg=cg.toNonIndexed();cg.computeVertexNormals();
   const cn=cg.attributes.normal,cpp=cg.attributes.position,cc=[],rock=new THREE.Color('#414a63'),rock2=new THREE.Color('#2e3549'),sn=new THREE.Color('#dbe4f2'),hz=new THREE.Color('#2a426e'),tmp=new THREE.Color();
   for(let f=0;f<cn.count;f+=3){const ny=(cn.getY(f)+cn.getY(f+1)+cn.getY(f+2))/3,yy=(cpp.getY(f)+cpp.getY(f+1)+cpp.getY(f+2))/3;
     tmp.copy(ny>.28?sn:(hash(f)<.5?rock:rock2));if(yy>-1.2&&ny>-.2)tmp.lerp(sn,.6);tmp.lerp(hz,Math.min(1,-yy/34));for(let q=0;q<3;q++)cc.push(tmp.r,tmp.g,tmp.b)}
   cg.setAttribute('color',new THREE.Float32BufferAttribute(cc,3));const cliff=new THREE.Mesh(cg,new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:.95}));cliff.receiveShadow=true;world.add(cliff)}
  // distant peaks rising from the valley haze, one merged mesh
  // a ridged mountain range rings the summit, rising out of the valley haze; one low-poly mesh
  const vn2=(x,y)=>{const i=Math.floor(x),j=Math.floor(y),f=x-i,g=y-j,u=f*f*(3-2*f),v=g*g*(3-2*g),h=(a,b)=>hash(a*57.1+b*131.7+seedK);
    return h(i,j)*(1-u)*(1-v)+h(i+1,j)*u*(1-v)+h(i,j+1)*(1-u)*v+h(i+1,j+1)*u*v};
  const seedK=ctx.seed%97;
  const ridge=(x,z)=>{let s=0,a=1,f=1/16;for(let o=0;o<4;o++){const n=1-Math.abs(2*vn2(x*f,z*f)-1);s+=n*n*a;a*=.5;f*=2.1}return s/1.6};
  const lift={x:-22,z:-26,y:-20};
  {const TH=HQ?220:140,RN=HQ?18:12,r0=34,r1=110,pos=[],idx=[];
   const hgt=(x,z,r)=>{const e=Math.pow(Math.max(0,Math.sin(Math.PI*Math.min(1,(r-r0)/(r1-r0))*1.05)),.6);let y=-64+e*(8+40*Math.pow(ridge(x,z),1.6));
     const dl=Math.hypot(x-lift.x,z-lift.z);if(dl<16)y=Math.max(y,lift.y-.8-Math.pow(dl/16,1.4)*30);return y};
   for(let j=0;j<=RN;j++){const r=r0+(r1-r0)*Math.pow(j/RN,1.2);for(let i=0;i<=TH;i++){const th=i/TH*TAU+(j%2)*Math.PI/TH;const x=Math.cos(th)*r,z=Math.sin(th)*r;pos.push(x,hgt(x,z,r),z)}}
   for(let j=0;j<RN;j++)for(let i=0;i<TH;i++){const a=j*(TH+1)+i,b=a+TH+1;idx.push(a,b,a+1,a+1,b,b+1)}
   let g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g=g.toNonIndexed();g.computeVertexNormals();
   const n=g.attributes.normal,pp=g.attributes.position,c=[],rk=new THREE.Color('#3d4762'),rk2=new THREE.Color('#2c3450'),sn=new THREE.Color('#dfe8f6'),sb=new THREE.Color('#9fb4d8'),tc=new THREE.Color();
   for(let f=0;f<n.count;f+=3){const ny=(n.getY(f)+n.getY(f+1)+n.getY(f+2))/3,y=(pp.getY(f)+pp.getY(f+1)+pp.getY(f+2))/3,hh=hash(f*.37);
     const snowy=ny>.55-Math.min(.35,(y+50)/60)+hh*.1;tc.copy(snowy?(ny>.8?sn:sb):(hh<.5?rk:rk2));for(let q=0;q<3;q++)c.push(tc.r,tc.g,tc.b)}
   g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));
   world.add(new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:.95,emissive:'#0b1530',emissiveIntensity:1})));
   const vf=new THREE.Mesh(new THREE.CircleGeometry(r0+4,48),mat('#4a5f88',{roughness:1}));vf.rotation.x=-Math.PI/2;vf.position.y=-63.5;world.add(vf)}
  // valley mist drifting between the peaks
  {const mm=new THREE.SpriteMaterial({map:softTex(),color:'#9fb6de',transparent:true,opacity:.2,depthWrite:false,fog:false});const ms=[];
   for(let i=0;i<9;i++){const s=new THREE.Sprite(mm);const a=i/9*TAU,d=40+R()*30;s.userData.m=[a,d,-46+R()*12,.004+R()*.004];s.scale.set(50+R()*30,12+R()*6,1);world.add(s);ms.push(s)}
   ctx.anim(t=>{for(const s of ms){const [a,d,y,v]=s.userData.m;const b=a+t*v;s.position.set(Math.cos(b)*d,y+Math.sin(t*.1+a)*1.5,Math.sin(b)*d)}mm.opacity=.18+Math.sin(t*.15)*.04})}
  // lodge wall: notched round logs with crossed ends, a snow roll on top
  const LOG=new THREE.MeshStandardMaterial({map:barkTex(),color:'#86593a',roughness:.85}),END=new THREE.MeshStandardMaterial({map:endTex(),roughness:.85}),SN=SNOW(),PST=mat(DPINE,{roughness:.7});
  {const log=(x,y,z,L,alongX)=>{const l=cyl(.075,.075,L,LOG,x,y,z,10);if(alongX)l.rotation.z=Math.PI/2;else l.rotation.x=Math.PI/2;world.add(l)};
   const endc=(x,y,z,alongX)=>{const e=cyl(.068,.068,.012,END,x,y,z,10);if(alongX)e.rotation.z=Math.PI/2;else e.rotation.x=Math.PI/2;world.add(e)};
   const ext2=E+.25,gap=.48;
   for(const s of[-1,1]){for(const y of[.0,.14,.28]){if(s===1){log((-ext2-gap)/2,y,s*E,ext2-gap,true);log((ext2+gap)/2,y,s*E,ext2-gap,true);endc(-gap+.006,y,E,true);endc(gap-.006,y,E,true)}else log(0,y,s*E,2*ext2,true);
       endc(-ext2-.006,y,s*E,true);endc(ext2+.006,y,s*E,true)}
     for(const y of[.07,.21,.35]){log(s*E,y,0,2*ext2,false);endc(s*E,y,-ext2-.006,false);endc(s*E,y,ext2+.006,false)}
     const c1=cyl(.1,.1,1,SN);c1.rotation.z=Math.PI/2;c1.scale.set(.45,1,1);if(s===1){c1.scale.y=(ext2-gap);c1.position.set(-(ext2+gap)/2,.37,E);world.add(c1);const c2=c1.clone();c2.position.x=(ext2+gap)/2;world.add(c2)}else{c1.scale.y=2*ext2;c1.position.set(0,.37,-E);world.add(c1)}
     const c3=cyl(.1,.1,2*ext2,SN,s*E,.44,0);c3.rotation.x=Math.PI/2;c3.scale.set(1,1,.45);world.add(c3)}
   // door posts, porch steps, a berghut sign
   for(const x of[-gap,gap]){world.add(cyl(.06,.065,.7,PST,x,.28,E,8));world.add(ball(.08,SN,x,.64,E,1))}
   world.add(rbox(.9,.08,.3,mat(PINE,{roughness:.7}),0,.02,E+.32,.02));world.add(rbox(.8,.08,.3,mat(PINE,{roughness:.7}),0,-.06,E+.58,.02));world.add(rbox(.9,.03,.12,SN,0,.075,E+.4,.02))}
  // corner posts with swinging lanterns and real warm light
  {for(const a of[-1,1])for(const b of[-1,1]){const x=a*(E+.02),z=b*(E+.02);world.add(cyl(.1,.11,1.2,PST,x,.48,z,10));const cp=ball(.13,SN,x,1.09,z,1);cp.scale.y=.5;world.add(cp);
     const arm=box(.4,.04,.04,PST,x+a*.2,.98,z);arm.rotation.y=-Math.atan2(b,a)*0+0;arm.rotation.y=a*b>0?-Math.PI/4:Math.PI/4;arm.position.set(x+a*.14,.98,z+b*.14);world.add(arm);
     const ln=new THREE.Group();ln.position.set(x+a*.27,.95,z+b*.27);ln.userData.sway=[.07,1+R()*.4,R()*6];
     const ir=IRON();ln.add(cyl(.06,.065,.02,ir,0,-.24,0,8));ln.add(cyl(.05,.05,.17,mat('#ffd28a',{emissive:'#ffa040',emissiveIntensity:2.4,roughness:.2}),0,-.15,0,8));
     const cap=sh(new THREE.Mesh(new THREE.ConeGeometry(.075,.07,8),ir));cap.position.y=-.035;ln.add(cap);ln.add(flame(0,-.2,0,1.4));world.add(ln);
     const L=new THREE.PointLight('#ffa95a',2,4.2,1.6);L.position.set(x+a*.3,.75,z+b*.3);world.add(L);flames.push({light:L,ph:R()*9})}}
  // chalets with lit windows and smoke, a sauna, a stone chimney on the right wall
  const smokeO=[];const glowM=new THREE.MeshBasicMaterial({map:GLOW,color:'#ff9a40',transparent:true,opacity:.5,blending:THREE.AdditiveBlending,depthWrite:false});
  const WIN=new THREE.MeshStandardMaterial({map:winTex(),emissiveMap:winTex(),emissive:'#ffb060',emissiveIntensity:2.2,roughness:.4});
  function chalet(cx,cz,w,d,h,rot,smoke){const g=new THREE.Group(),wall=new THREE.MeshStandardMaterial({map:plankTex(),color:'#7a4c2c',roughness:.85}),roof=mat('#3a2a22',{roughness:.8}),stn=new THREE.MeshStandardMaterial({map:stoneT(),color:'#c9c4bd',roughness:.95});
    g.add(rbox(w+.08,.22,d+.08,stn,0,.05,0,.02));g.add(rbox(w,h,d,wall,0,.16+h/2,0,.02));
    const rh=w*.42,top=.16+h;const gs=new THREE.Shape();gs.moveTo(-w/2,0);gs.lineTo(w/2,0);gs.lineTo(0,rh);gs.lineTo(-w/2,0);
    for(const s of[-1,1]){const gb=ext(gs,.04,wall,.004);gb.position.set(0,top,s*(d/2-.02));g.add(gb)}
    const sl=Math.hypot(w/2+.12,rh),an=Math.atan2(rh,w/2);
    for(const s of[-1,1]){const r=rbox(sl,.05,d+.36,roof,s*(w/4+.03),top+rh/2+.01,0,.01);r.rotation.z=-s*an;g.add(r);const sn=rbox(sl-.02,.08,d+.32,SN,s*(w/4+.03)-s*Math.sin(an)*.0,top+rh/2+.07,0,.04);sn.rotation.z=-s*an;g.add(sn)}
    const wq=new THREE.PlaneGeometry(.24,.26);for(const s of[-1,1]){const wm=new THREE.Mesh(wq,WIN);wm.position.set(s*w*.24,.16+h*.55,d/2+.002);g.add(wm);
      for(const t of[-1,1])g.add(box(.09,.28,.02,mat('#2f5a3a',{roughness:.7}),s*w*.24+t*.17,.16+h*.55,d/2+.012));g.add(rbox(.3,.04,.1,SN,s*w*.24,.16+h*.55-.15,d/2+.04,.015))}
    const wg=new THREE.Mesh(wq,WIN);wg.position.set(0,top+rh*.35,d/2+.03);wg.scale.set(.7,.7,1);g.add(wg);
    const sideW=new THREE.Mesh(wq,WIN);sideW.rotation.y=Math.PI/2;sideW.position.set(w/2+.002,.16+h*.55,0);g.add(sideW);const sideW2=sideW.clone();sideW2.rotation.y=-Math.PI/2;sideW2.position.x=-w/2-.002;g.add(sideW2);
    g.add(box(.26,.42,.02,mat('#5a3420'),0,.16+.21,d/2+.006));
    const chx=w*.22;g.add(rbox(.18,.5,.18,stn,chx,top+rh*.55,-d*.15,.01));g.add(rbox(.24,.05,.24,SN,chx,top+rh*.55+.26,-d*.15,.02));
    for(let k=0;k<Math.round(w/.09);k++){const ic=sh(new THREE.Mesh(new THREE.ConeGeometry(.012,.06+hash(k+cx)*.1,5),mat('#cfe8ff',{roughness:.1,emissive:'#4a7cc0',emissiveIntensity:.5})));ic.rotation.x=Math.PI;ic.position.set(-w/2-.06+k*.09,top-.04-.05,d/2+.18);g.add(ic)}
    bake(g);g.rotation.y=rot;g.position.set(cx,gy(cx,cz)+.02,cz);world.add(g);g.updateMatrixWorld(true);
    if(smoke){const v=new THREE.Vector3(chx,top+rh*.55+.3,-d*.15).applyMatrix4(g.matrixWorld);smokeO.push([v.x,v.y,v.z])}
    const gl=new THREE.Mesh(new THREE.PlaneGeometry(1.4,.9),glowM);gl.rotation.x=-Math.PI/2;const gp=new THREE.Vector3(0,0,d/2+.45).applyMatrix4(g.matrixWorld);gl.position.set(gp.x,gy(gp.x,gp.z)+.03,gp.z);gl.rotation.z=rot;world.add(gl);return g}
  chalet(ch1.x,ch1.z,1.3,1.05,.62,-Math.PI/2+.35,true);
  chalet(ch2.x,ch2.z,.95,.8,.48,-Math.PI/2-.15,true);
  ctx.anim(t=>{WIN.emissiveIntensity=2.1+Math.sin(t*2.3)*.12+Math.sin(t*7.1)*.06});
  // stone chimney against the right wall
  {const stn=new THREE.MeshStandardMaterial({map:stoneT(),color:'#bdb6ad',roughness:.95});const cx=E+.32,cz=-H*.45;
   world.add(rbox(.5,2,.62,stn,cx,.85,cz,.02));world.add(rbox(.6,.08,.72,stn,cx,1.88,cz,.02));world.add(rbox(.62,.1,.74,SN,cx,1.95,cz,.04));world.add(box(.2,.05,.2,mat('#120c0a'),cx,1.98,cz));
   smokeO.push([cx,2.02,cz])}
  // ski-lift valley station with a turning bullwheel; gondolas glide down to a lit station on a lower peak
  {const g=new THREE.Group(),wd=new THREE.MeshStandardMaterial({map:plankTex(),color:'#6a4128',roughness:.85}),roof=mat('#7a1e22',{roughness:.6}),stl=mat('#59606e',{metalness:.7,roughness:.4});
   g.add(rbox(1.5,.12,1.1,new THREE.MeshStandardMaterial({map:stoneT(),color:'#c9c4bd'}),0,.02,0,.02));g.add(rbox(1.4,.7,.12,wd,0,.43,.45,.02));for(const x of[-.65,.65])g.add(rbox(.12,.7,1.0,wd,x,.43,0,.02));
   g.add(rbox(1.7,.07,1.3,roof,0,.83,-.05,.02));g.add(rbox(1.66,.1,1.26,SN,0,.89,-.05,.05));
   for(const x of[-.45,.45])g.add(cyl(.05,.05,.7,stl,x,.42,-.2,8));
   const wm=new THREE.Mesh(new THREE.PlaneGeometry(.3,.24),WIN);wm.position.set(-.35,.5,.513);g.add(wm);const wm2=wm.clone();wm2.position.x=.35;g.add(wm2);
   bake(g);const sx=st.x,sz=st.z;g.position.set(sx,gy(sx,sz)+.02,sz);g.rotation.y=Math.atan2(lift.x-sx,lift.z-sz)+Math.PI;world.add(g);
   const wheel=new THREE.Group();const wr=new THREE.Mesh(new THREE.TorusGeometry(.42,.03,6,28),stl);wr.rotation.x=Math.PI/2;wheel.add(wr);
   for(let k=0;k<6;k++){const sp=box(.84,.02,.02,stl,0,0,0);sp.rotation.y=k/6*Math.PI;wheel.add(sp)}wheel.position.set(sx,gy(sx,sz)+.7,sz);world.add(wheel);ctx.anim(t=>wheel.rotation.y=t*.25);
   // cables: through the station, a lattice pylon at the cliff edge, sagging down to the far peak
   const dir=new THREE.Vector3(lift.x-sx,0,lift.z-sz).normalize(),side=new THREE.Vector3(-dir.z,0,dir.x);
   const edgeR=rimR(Math.atan2(dir.z,dir.x));let ed=0;for(let d=0;d<20;d+=.05){const x=sx+dir.x*d,z=sz+dir.z*d;if(Math.hypot(x,z)>edgeR*.9){ed=d;break}}
   const py={x:sx+dir.x*ed,z:sz+dir.z*ed};const pyB=gy(py.x,py.z),pyH=1.5;
   {const pg=new THREE.Group();for(const s of[-1,1])for(const t of[-1,1]){const l=cyl(.02,.03,pyH,stl,s*.14,pyH/2,t*.14,5);l.rotation.z=-s*.06;l.rotation.x=t*.06;pg.add(l)}
    for(let k=1;k<5;k++)pg.add(box(.3-k*.02,.02,.3-k*.02,stl,0,k*pyH/5,0));pg.add(box(.08,.06,.8,stl,0,pyH,0));bake(pg);pg.position.set(py.x,pyB,py.z);pg.rotation.y=Math.atan2(side.x,side.z);world.add(pg)}
   const far=new THREE.Vector3(lift.x-dir.x*1.2,lift.y+1.2,lift.z-dir.z*1.2);
   {const fs=new THREE.Group();fs.add(rbox(2.2,1.1,1.6,wd,0,.55,0,.03));fs.add(rbox(2.5,.12,1.9,roof,0,1.15,0,.02));fs.add(rbox(2.45,.16,1.85,SN,0,1.25,0,.06));
    for(const x of[-.6,0,.6]){const w=new THREE.Mesh(new THREE.PlaneGeometry(.4,.35),WIN);w.position.set(x,.6,.81);fs.add(w)}bake(fs);fs.position.set(lift.x,lift.y-.6,lift.z);fs.rotation.y=Math.atan2(dir.x,dir.z);world.add(fs)}
   const curves=[];for(const s of[-1,1]){const o=side.clone().multiplyScalar(s*.32);const a=new THREE.Vector3(sx,gy(sx,sz)+.72,sz).add(o),b=new THREE.Vector3(py.x,pyB+pyH-.02,py.z).add(o),c=far.clone().add(o);
     const m1=b.clone().lerp(c,.35);m1.y-=2.2;const m2=b.clone().lerp(c,.7);m2.y-=1.6;const cv=new THREE.CatmullRomCurve3([a,a.clone().lerp(b,.5).setY((a.y+b.y)/2+.05),b,m1,m2,c]);curves.push(cv);
     world.add(new THREE.Mesh(new THREE.TubeGeometry(cv,160,.013,4),mat('#1c1f26',{metalness:.6,roughness:.4})))}
   // gondola cabins as instanced meshes: red body, warm windows, steel hanger
   const gd=new THREE.Group(),red=mat('#b5262c',{roughness:.45,metalness:.2}),gl=mat('#ffcf8a',{emissive:'#ffa648',emissiveIntensity:2.2,roughness:.2});
   gd.add(rbox(.32,.26,.24,red,0,-.46,0,.05));gd.add(rbox(.33,.1,.25,gl,0,-.43,0,.02));gd.add(rbox(.3,.04,.22,SN,0,-.31,0,.02));gd.add(box(.02,.3,.02,stl,0,-.16,0));gd.add(box(.12,.03,.04,stl,0,-.01,0));
   const {by,inv}=geoByMat(gd);const inst=[],per=4,n=per*2;
   for(const [m,arr] of by){const gs=arr.map(o=>{const q=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();return q.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld))});
     const im=new THREE.InstancedMesh(mergeGeometries(gs),m,n);im.castShadow=true;im.frustumCulled=false;world.add(im);inst.push(im)}
   const M4=new THREE.Matrix4(),Q=new THREE.Quaternion(),S1=new THREE.Vector3(1,1,1),Y=new THREE.Vector3(0,1,0),P0=new THREE.Vector3();const yaw=Math.atan2(dir.x,dir.z);
   ctx.anim(t=>{for(let i=0;i<n;i++){const up=i<per,u0=((t/240)+(i%per)/per)%1,u=up?u0:1-u0;curves[up?0:1].getPointAt(Math.min(.999,Math.max(.001,u)),P0);
     Q.setFromAxisAngle(Y,yaw);const sw=Math.sin(t*.9+i)*.04;Q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),sw));
     const sc=u<.03?Math.max(.001,u/.03):1;S1.setScalar(sc*1.15);M4.compose(P0,Q,S1);for(const im of inst)im.setMatrixAt(i,M4)}for(const im of inst)im.instanceMatrix.needsUpdate=true})}
  // frozen lake with a skater and a grazing reindeer
  {const ice=new THREE.Mesh(new THREE.CircleGeometry(1,48),new THREE.MeshStandardMaterial({color:'#9cc4e4',map:iceTex(),roughness:.08,metalness:.35,emissive:'#14304e',emissiveIntensity:.6}));
   ice.rotation.x=-Math.PI/2;ice.scale.set(lake.rx,lake.rz,1);ice.position.set(lake.x,lake.y+.012,lake.z);ice.receiveShadow=true;world.add(ice);
   const rimS=new THREE.Mesh(new THREE.TorusGeometry(1,.07,6,48),SN);rimS.rotation.x=Math.PI/2;rimS.scale.set(lake.rx,lake.rz,.6);rimS.position.set(lake.x,lake.y+.01,lake.z);world.add(rimS);
   const sk=new THREE.Group(),coat=mat('#2f5f9e',{roughness:.7}),scarf=mat('#d43a3a',{roughness:.9}),skin=mat('#f0c8a8'),dk=mat('#1d1d22');
   const caps=(r,l,m,x,y,z,rz=0,rx=0)=>{const o=sh(new THREE.Mesh(new THREE.CapsuleGeometry(r,l,4,10),m));o.position.set(x,y,z);o.rotation.set(rx,0,rz);return o};
   sk.add(caps(.07,.14,coat,0,.36,0));sk.add(ball(.055,skin,0,.53,0,1));sk.add(cyl(.05,.06,.06,scarf,0,.59,0,10));sk.add(ball(.022,mat('#f4f4f4'),0,.63,0,1));
   sk.add(new THREE.Mesh(new THREE.TorusGeometry(.05,.018,6,12),scarf).rotateX(Math.PI/2).translateZ(-.46));
   for(const s of[-1,1]){sk.add(caps(.025,.16,dk,0,.15,s*.04,0,s*.12));sk.add(box(.14,.012,.02,mat('#c8ccd4',{metalness:.9,roughness:.2}),.02,.01,s*.05));sk.add(caps(.02,.14,coat,0,.4,s*.13,0,s*1.25))}
   bake(sk);sk.scale.setScalar(.95);world.add(sk);
   ctx.anim(t=>{const a=t*.32;const x=Math.sin(a)*lake.rx*.6,z=Math.sin(a*2)*lake.rz*.45;const dx=Math.cos(a)*lake.rx*.6,dz=Math.cos(a*2)*2*lake.rz*.45;
     sk.position.set(lake.x+x,lake.y+.012,lake.z+z);sk.rotation.y=Math.atan2(-dz,dx)-Math.PI/2;sk.rotation.z=Math.sin(a*2)*.12});
   const rd=rendier(1,ctx,true);rd.scale.setScalar(.85);const rx=lake.x+lake.rx+.25,rz=lake.z-.35;rd.position.set(rx,gy(rx,rz),rz);rd.rotation.y=Math.PI*.8;world.add(rd);
   const sm=sneeuwpop(1,ctx);sm.scale.setScalar(.8);const smx=lake.x-lake.rx*.55,smz=lake.z-lake.rz-.35;sm.position.set(smx,gy(smx,smz),smz);sm.rotation.y=.6;world.add(sm)}
  // outdoor fire pit: crackling flames, sparks, smoke, log benches and a parked sledge
  {const g=new THREE.Group(),stn=mat('#5a5e6a',{roughness:.9,flatShading:true});
   for(let k=0;k<10;k++){const a=k/10*TAU;const s=ball(.09,stn,Math.cos(a)*.32,.03,Math.sin(a)*.32,0);s.scale.set(1.2,.6,1);g.add(s);const c=ball(.07,SN,Math.cos(a)*.34,.08,Math.sin(a)*.34,0);c.scale.set(1.1,.35,1);g.add(c)}
   g.add(new THREE.Mesh(new THREE.CircleGeometry(.3,16),mat('#1a1210')).rotateX(-Math.PI/2).translateZ(.012));
   const lg=new THREE.MeshStandardMaterial({map:barkTex(),color:'#5a3a24',roughness:.95});for(let k=0;k<5;k++){const a=k/5*TAU;const l=cyl(.03,.035,.42,lg,Math.cos(a)*.08,.15,Math.sin(a)*.08,7);l.rotation.z=Math.cos(a)*.55;l.rotation.x=-Math.sin(a)*.55;g.add(l)}
   const em=mat('#ff6a1a',{emissive:'#ff4a08',emissiveIntensity:2.8});for(let k=0;k<7;k++)g.add(ball(.035,em,Math.cos(k*2.4)*.12,.04,Math.sin(k*2.4)*.12,0));
   for(const s of[-1,1]){const b=cyl(.1,.1,.7,lg,s*.72,.08,0,10);b.rotation.x=Math.PI/2;b.rotation.y=s*.2;g.add(b);const bs=cyl(.08,.08,.66,SN,s*.72,.15,0,8);bs.rotation.x=Math.PI/2;bs.scale.z=.35;bs.rotation.y=s*.2;g.add(bs)}
   bake(g);g.add(fl(0,.06,0,4.6));g.add(fl(.06,.06,.04,3.4));g.add(fl(-.06,.05,-.03,3.6));
   g.add(puffs([[0,.2,0]],HQ?26:14,{rise:1.6,spread:.35,size:.03,life:2,color:'#ffb050',bright:3.2,add:true,g0:1,g1:.25,flick:.7,jit:.15}));
   g.position.set(pit.x,pit.y,pit.z);world.add(g);smokeO.push([pit.x,pit.y+.5,pit.z]);
   const L=new THREE.PointLight('#ff8a3a',2,5,1.5);L.position.set(pit.x,pit.y+.5,pit.z);world.add(L);flames.push({light:L,ph:2});
   const sl=slee();sl.scale.setScalar(.85);sl.position.set(pit.x+.75,gy(pit.x+.75,pit.z-.75),pit.z-.75);sl.rotation.y=-.7;world.add(sl);
   // skis stuck in the snow by the door
   for(const [dx,c] of[[.75,'#c8323a'],[.86,'#2b5f9e']]){const s=box(.06,.75,.012,mat(c,{roughness:.4}),dx,.2,E+.55);s.rotation.z=(dx-.8)*.8;s.rotation.y=.3;world.add(s)}}
  // berghut sign
  {const t=cvs(256,96,(g)=>{g.fillStyle='#5a3a22';g.fillRect(0,0,256,96);g.strokeStyle='#3a2414';g.lineWidth=6;g.strokeRect(3,3,250,90);
     g.fillStyle='#f4e6c8';g.font='700 34px Georgia';g.textAlign='center';g.fillText((typeof LANG==='undefined'||LANG==='nl')?'BERGHUT':'SKI LODGE',128,46,236);g.font='italic 20px Georgia';g.fillText('Edelweiss · 2412 m',128,76)});
   const sg=new THREE.Group(),pw=mat(DPINE);sg.add(box(.86,.32,.04,new THREE.MeshStandardMaterial({map:t,roughness:.8}),0,.5,0));sg.add(rbox(.9,.06,.08,SN,0,.69,0,.03));for(const x of[-.38,.38])sg.add(cyl(.025,.03,.6,pw,x,.28,-.03,6));
   const sx=-1.25,sz=E+.75;sg.position.set(sx,gy(sx,sz),sz);sg.rotation.y=.12;world.add(sg)}
  // chimney smoke for the lodge and the chalets
  world.add(puffs(smokeO,HQ?22:12,{rise:2.6,spread:.7,size:.38,life:9,color:'#8d9ab4',alpha:.32,g0:.35,g1:2.4,wind:[1.4,.5],jit:.06}));
  // snow-laden pine forest: instanced, swaying in a vertex shader
  {const P=PINEG(),pos=[];for(let k=0;k<400&&pos.length<(HQ?70:40);k++){const th=R()*TAU,f=.3+R()*.66;const r=rimR(th)*f;const x=Math.cos(th)*r,z=Math.sin(th)*r;
     const dq=Math.max(Math.abs(x),Math.abs(z))-E;if(dq<.55)continue;if(x<0&&dq<1.4&&Math.abs(z)<E+.6)continue;if(z>E&&Math.abs(x)<1.6)continue;
     if(used.some(u=>Math.hypot(x-u[0],z-u[1])<u[2]))continue;if(pos.some(p=>Math.hypot(x-p[0],z-p[1])<.42))continue;pos.push([x,z,.75+R()*.8*Math.min(1,dq/1.5)])}
   const mk=(geo,m)=>{const im=new THREE.InstancedMesh(geo,m,pos.length);im.castShadow=true;im.receiveShadow=true;world.add(im);return im};
   const swayM=(c,o)=>{const m=new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.9},o));m.onBeforeCompile=s=>{s.uniforms.uT=U.uT;s.vertexShader='uniform float uT;\n'+s.vertexShader.replace('#include <begin_vertex>',
     '#include <begin_vertex>\n#ifdef USE_INSTANCING\nvec3 ip=instanceMatrix[3].xyz;\n#else\nvec3 ip=vec3(0.);\n#endif\nfloat sw=(sin(uT*.8+ip.x*1.7+ip.z*1.3)+.4*sin(uT*1.9+ip.z*3.))*.03*max(position.y,0.);transformed.x+=sw;transformed.z+=sw*.6;')};m.customProgramCacheKey=()=>'wsway'+c;return m};
   const a=mk(P.fol,swayM('#24493a',{flatShading:true})),b=mk(P.snow,swayM('#eef3fb',{emissive:'#3a4f7a',emissiveIntensity:.32,roughness:.8})),c=mk(P.trunk,mat('#4a3322'));
   const M4=new THREE.Matrix4(),Q=new THREE.Quaternion(),V=new THREE.Vector3(),S=new THREE.Vector3();
   pos.forEach(([x,z,s],i)=>{Q.setFromAxisAngle(new THREE.Vector3(0,1,0),R()*TAU);S.set(s,s*(.9+R()*.3),s);M4.compose(V.set(x,gy(x,z)-.03,z),Q,S);a.setMatrixAt(i,M4);b.setMatrixAt(i,M4);c.setMatrixAt(i,M4)})}
  // icicles along the outside of the lodge wall
  {const ip=[];for(const s of[-1,1])for(let u=-E-.2;u<E+.2;u+=.07){if(hash(u*7+s)<.45)continue;if(!(s===1&&Math.abs(u)<.55))ip.push([u,s*(E+.1),.36,0]);if(hash(u*3-s)>.4)ip.push([s*(E+.1),u,.43,1])}
   const im=new THREE.InstancedMesh(new THREE.ConeGeometry(.012,.1,5).rotateX(Math.PI).translate(0,-.05,0),mat('#d6ecff',{roughness:.08,metalness:.1,emissive:'#5a8cd0',emissiveIntensity:.7}),ip.length);
   const M4=new THREE.Matrix4(),V=new THREE.Vector3(),S=new THREE.Vector3(),Q=new THREE.Quaternion();ip.forEach(([a,b,y,v],i)=>{const l=.3+Math.pow(hash(i*3.7),2)*1.4;M4.compose(V.set(v?a:a,y,v?b:b),Q,S.set(1,l,1));if(v)M4.setPosition(a,y,b);im.setMatrixAt(i,M4)});world.add(im)}
  // snowfall over the summit and glints in the snow
  {const n=HQ?2600:900,W=IS+1.5,p=new Float32Array(n*3),s=new Float32Array(n);for(let i=0;i<n;i++){p[i*3]=(Math.random()*2-1)*W;p[i*3+1]=-1+Math.random()*9;p[i*3+2]=(Math.random()*2-1)*W;s[i]=Math.random()}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('aSeed',new THREE.BufferAttribute(s,1));
   const pts=new THREE.Points(g,new THREE.ShaderMaterial({uniforms:{uT:U.uT,uH:U.uH,uTop:{value:8},uBot:{value:-1},uW:{value:W}},vertexShader:SNOW_V,fragmentShader:SNOW_F,transparent:true,depthWrite:false}));
   pts.frustumCulled=false;pts.renderOrder=4;world.add(pts);
   const m=HQ?700:260,gp=[],gs=[];for(let i=0;i<m*3&&gp.length<m*3;i++){const th=Math.random()*TAU,r=rimR(th)*Math.sqrt(Math.random())*.95;const x=Math.cos(th)*r,z=Math.sin(th)*r;if(Math.max(Math.abs(x),Math.abs(z))<E+.2)continue;
     if(Math.hypot((x-lake.x)/lake.rx,(z-lake.z)/lake.rz)<1)continue;gp.push(x,gy(x,z)+.015,z);gs.push(Math.random())}
   const gg=new THREE.BufferGeometry();gg.setAttribute('position',new THREE.Float32BufferAttribute(gp,3));gg.setAttribute('aSeed',new THREE.Float32BufferAttribute(gs,1));
   const gl=new THREE.Points(gg,new THREE.ShaderMaterial({uniforms:{uT:U.uT,uH:U.uH},vertexShader:GLIT_V,fragmentShader:GLIT_F,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));gl.frustumCulled=false;world.add(gl)}
  // a little aurora light on the rim channel
  {const A=new THREE.Color('#7fffc0'),B=new THREE.Color('#b28cff');ctx.anim(t=>{rim.color.copy(A).lerp(B,.5+.5*Math.sin(t*.11));rim.intensity=.32+.08*Math.sin(t*.37)})}
  mergeStatic([LOG,END,SN,PST]);
  }
});
})();
