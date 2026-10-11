// Egypt: a sandstone temple in the desert under a blazing late-afternoon sun. Dunes, the Nile, pyramids, palms.
(()=>{
const TAU=Math.PI*2,SRGB=THREE.SRGBColorSpace;
const sm=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)},fr=x=>x-Math.floor(x);
// shared clock for shader-driven motion (reeds, sand, smoke, water, haze)
const U={t:{value:0}};
function ctex(w,h,fn,rep){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');fn(g,w,h);
  const t=new THREE.CanvasTexture(c);t.colorSpace=SRGB;t.anisotropy=8;if(rep){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep[0],rep[1])}return t}
function grain(g,w,h,amp){const d=g.getImageData(0,0,w,h);for(let i=0;i<d.data.length;i+=4){const n=(Math.random()-.5)*amp;d.data[i]+=n;d.data[i+1]+=n;d.data[i+2]+=n}g.putImageData(d,0,0)}
function lathe(pts,m,seg=20,x=0,y=0,z=0){const o=sh(new THREE.Mesh(new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(p[0],p[1])),seg),m));o.position.set(x,y,z);return o}
function ext(shape,depth,m,bev=.008,curve=8){const g=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:bev>0,bevelThickness:bev,bevelSize:bev,bevelSegments:2,curveSegments:curve});g.translate(0,0,-depth/2);return sh(new THREE.Mesh(g,m))}
// rounded, bevelled box centred on (x,y,z)
function rbox(w,h,d,r,m,x=0,y=0,z=0,b=.01){const s=roundRect(w-2*b,d-2*b,Math.max(.001,Math.min(r,(Math.min(w,d)-2*b)/2-.002)));
  const g=new THREE.ExtrudeGeometry(s,{depth:Math.max(.001,h-2*b),bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:2,curveSegments:3});
  g.rotateX(-Math.PI/2);g.translate(0,-(h-2*b)/2,0);const o=sh(new THREE.Mesh(g,m));o.position.set(x,y,z);return o}
function tube(pts,r,m,seg=12,rs=7){const c=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)));return sh(new THREE.Mesh(new THREE.TubeGeometry(c,seg,r,rs,false),m))}
function sc(o,x,y,z){o.scale.set(x,y,z);return o}
function rot(o,x,y,z){o.rotation.set(x,y,z);return o}
// merge the direct mesh children of a group into one mesh per material (fewer draw calls per object)
function bake(src){const out=new THREE.Group(),by=new Map();
  const keep=[];for(const o of src.children){if(!o.isMesh)continue;if(Array.isArray(o.material)){keep.push(o);continue}o.updateMatrix();const g=(o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone());
    for(const k of Object.keys(g.attributes))if(!['position','normal','uv'].includes(k))g.deleteAttribute(k);if(!g.attributes.uv)g.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count*2),2));
    g.applyMatrix4(o.matrix);if(!by.has(o.material))by.set(o.material,[]);by.get(o.material).push(g)}
  for(const [m,gs] of by){const mg=mergeGeometries(gs);gs.forEach(x=>x.dispose());out.add(sh(new THREE.Mesh(mg,m)))}
  for(const o of [...src.children])if(!o.isMesh||keep.includes(o))out.add(o);return out}

// ---------- hieroglyphs ----------
function glyph(g,k,x,y,s){g.save();g.translate(x,y);g.scale(s/40,s/40);g.lineWidth=3.4;g.lineCap='round';g.lineJoin='round';g.beginPath();
  switch(((k%12)+12)%12){
  case 0:g.ellipse(0,-9,6,8,0,0,TAU);g.moveTo(-13,0);g.lineTo(13,0);g.moveTo(0,0);g.lineTo(0,18);g.stroke();break; // ankh
  case 1:g.moveTo(-16,-2);g.quadraticCurveTo(0,-13,16,-2);g.quadraticCurveTo(0,8,-16,-2);g.moveTo(-16,-11);g.quadraticCurveTo(0,-20,17,-10);g.moveTo(-3,4);g.lineTo(-6,17);g.moveTo(5,4);g.quadraticCurveTo(10,15,17,9);g.stroke();
    g.beginPath();g.arc(0,-3,4,0,TAU);g.fill();break; // eye of Horus
  case 2:g.ellipse(0,4,9,12,0,0,TAU);g.moveTo(-9,2);g.lineTo(9,2);g.moveTo(0,-8);g.lineTo(0,16);g.stroke();g.beginPath();g.ellipse(0,-11,6,4,0,0,TAU);g.fill();
    g.beginPath();for(const s of[-1,1]){g.moveTo(s*9,-2);g.lineTo(s*16,-8);g.moveTo(s*9,6);g.lineTo(s*17,6);g.moveTo(s*8,13);g.lineTo(s*15,19)}g.stroke();break; // scarab
  case 3:g.ellipse(-1,2,10,7,-.3,0,TAU);g.moveTo(6,-3);g.arc(9,-9,5,0,TAU);g.moveTo(14,-9);g.lineTo(18,-7);g.moveTo(-9,6);g.lineTo(-18,12);g.moveTo(-2,9);g.lineTo(-3,18);g.moveTo(3,9);g.lineTo(4,18);g.stroke();break; // falcon
  case 4:g.moveTo(0,18);g.quadraticCurveTo(-3,0,4,-18);g.quadraticCurveTo(9,-4,0,18);g.stroke();break; // reed leaf
  case 5:g.moveTo(-18,0);for(let i=0;i<8;i++)g.lineTo(-18+(i+1)*4.5,i%2?0:-6);g.moveTo(-18,10);for(let i=0;i<8;i++)g.lineTo(-18+(i+1)*4.5,i%2?10:4);g.stroke();break; // water
  case 6:g.moveTo(0,-14);g.lineTo(0,18);g.moveTo(-9,18);g.lineTo(9,18);for(const yy of[-14,-9,-4])g.moveTo(-9,yy),g.lineTo(9,yy);g.stroke();break; // djed
  case 7:g.arc(0,-2,9,0,TAU);g.moveTo(-16,12);g.lineTo(16,12);g.moveTo(-12,12);g.quadraticCurveTo(-10,4,-6,6);g.stroke();break; // sun on horizon
  case 8:g.moveTo(-18,8);g.bezierCurveTo(-10,-8,-2,16,6,2);g.bezierCurveTo(10,-6,14,-2,18,-8);g.moveTo(16,-10);g.lineTo(14,-15);g.stroke();break; // viper
  case 9:g.moveTo(-14,10);g.arc(0,10,14,Math.PI,0);g.closePath();g.stroke();break; // bread loaf
  case 10:g.moveTo(-12,18);g.lineTo(-12,-6);g.quadraticCurveTo(0,-20,12,-6);g.lineTo(12,18);g.moveTo(-4,-2);g.arc(0,-2,4,0,TAU);g.stroke();break; // owl-ish shrine
  case 11:g.moveTo(-6,-16);g.lineTo(6,-16);g.lineTo(3,16);g.lineTo(-3,16);g.closePath();g.moveTo(-14,-2);g.lineTo(14,-2);g.stroke();break; // was-sceptre top
  }g.restore()}
// incised relief look: a dark cut with a light lip below it
function relief(g,k,x,y,s,paint){g.strokeStyle='rgba(60,35,15,.55)';g.fillStyle='rgba(60,35,15,.55)';glyph(g,k,x,y,s);
  g.strokeStyle='rgba(255,240,210,.35)';g.fillStyle='rgba(255,240,210,.35)';glyph(g,k,x+1,y+1.5,s);
  if(paint){g.strokeStyle=paint;g.fillStyle=paint;glyph(g,k,x,y,s*.96)}}
const PIG=['rgba(52,96,170,.62)','rgba(170,58,40,.6)','rgba(70,140,95,.55)','rgba(214,160,58,.6)'];
function sandstone(g,w,h,base='#d8b47e',amp=34){g.fillStyle=base;g.fillRect(0,0,w,h);grain(g,w,h,amp);
  for(let k=0;k<w*h/900;k++){g.fillStyle=Math.random()<.5?'rgba(120,70,30,.06)':'rgba(255,240,210,.07)';const r=2+Math.random()*10;g.beginPath();g.arc(Math.random()*w,Math.random()*h,r,0,TAU);g.fill()}
  g.strokeStyle='rgba(110,70,35,.12)';g.lineWidth=1;for(let y=0;y<h;y+=h/(1+Math.floor(h/90))){g.beginPath();g.moveTo(0,y+Math.random()*2);g.lineTo(w,y+Math.random()*2);g.stroke()}}

// ---------- textures ----------
const T={};
T.frieze=ctex(512,160,(g,w,h)=>{sandstone(g,w,h,'#d9b680');g.fillStyle='rgba(52,96,170,.55)';g.fillRect(0,12,w,7);g.fillStyle='rgba(170,58,40,.5)';g.fillRect(0,h-20,w,7);
  for(let i=0;i<10;i++)relief(g,i*5+3,26+i*51,82,40,i%3===0?PIG[i%4]:null)},[1,1]);
T.cornice=ctex(256,64,(g,w,h)=>{g.fillStyle='#e2c48e';g.fillRect(0,0,w,h);const c=['#3b67a8','#e2c48e','#b5483a','#e2c48e','#3f8a68','#e2c48e'];
  for(let i=0;i<24;i++){g.fillStyle=c[i%6];g.fillRect(i*w/24,10,w/24-2,h-22)}g.fillStyle='#c9a35a';g.fillRect(0,0,w,8);g.fillRect(0,h-10,w,10);grain(g,w,h,20)},[4,1]);
T.pylon=ctex(512,512,(g,w,h)=>{sandstone(g,w,h,'#dcb882',30);
  // winged sun at the top, a big cartouche pair, then columns of glyphs
  g.save();g.translate(w/2,70);g.fillStyle='rgba(214,160,58,.75)';g.beginPath();g.arc(0,0,22,0,TAU);g.fill();
  for(const s of[-1,1]){for(let f=0;f<5;f++){g.fillStyle=f%2?'rgba(52,96,170,.6)':'rgba(70,140,95,.55)';g.beginPath();g.moveTo(s*20,-8+f*4);g.quadraticCurveTo(s*110,-30+f*6,s*200,-6+f*7);g.lineTo(s*200,0+f*7);g.quadraticCurveTo(s*110,-20+f*8,s*20,-2+f*4);g.fill()}}
  g.restore();
  for(const cx of[w/2-60,w/2+60]){g.strokeStyle='rgba(60,35,15,.6)';g.lineWidth=5;g.beginPath();g.roundRect(cx-34,130,68,190,34);g.stroke();g.fillStyle='rgba(214,160,58,.25)';g.fill();
    for(let i=0;i<4;i++)relief(g,i*3+(cx>w/2?1:0),cx,165+i*42,30,PIG[i%4])}
  g.strokeStyle='rgba(60,35,15,.6)';g.lineWidth=5;g.beginPath();g.moveTo(cx0(w,0),130);g.stroke();
  for(const cx of[40,90,w-90,w-40]){g.strokeStyle='rgba(60,35,15,.3)';g.lineWidth=2;g.beginPath();g.moveTo(cx-22,110);g.lineTo(cx-22,h-30);g.stroke();
    for(let i=0;i<8;i++)relief(g,(i*7+cx)%12,cx,135+i*44,30,i%2?PIG[(i+cx)%4]:null)}
  // a striding king offering to the gods, simplified figures
  for(const [fx,dir,col] of [[w/2-140,1,'rgba(52,96,170,.55)'],[w/2+140,-1,'rgba(170,58,40,.5)']]){g.save();g.translate(fx,0);g.scale(dir,1);
    g.fillStyle='rgba(120,70,35,.45)';g.beginPath();g.ellipse(0,355,12,14,0,0,TAU);g.fill();g.fillRect(-10,368,20,60);
    g.fillStyle=col;g.beginPath();g.moveTo(-14,360);g.lineTo(-14,346);g.lineTo(10,342);g.lineTo(6,372);g.fill();
    g.fillStyle='rgba(240,230,205,.6)';g.beginPath();g.moveTo(-12,428);g.lineTo(12,428);g.lineTo(16,452);g.lineTo(-16,452);g.fill();
    g.strokeStyle='rgba(120,70,35,.5)';g.lineWidth=6;g.beginPath();g.moveTo(-6,452);g.lineTo(-14,490);g.moveTo(6,452);g.lineTo(16,490);g.moveTo(8,385);g.lineTo(34,375);g.stroke();g.restore()}
  g.fillStyle='rgba(60,35,15,.25)';g.fillRect(0,h-14,w,14)});
function cx0(w){return w/2}
T.obelisk=ctex(64,512,(g,w,h)=>{sandstone(g,w,h,'#c9a074',36);g.fillStyle='#b68d63';g.globalAlpha=.4;g.fillRect(0,0,w,h);g.globalAlpha=1;
  g.strokeStyle='rgba(60,35,15,.5)';g.lineWidth=2;g.strokeRect(8,20,w-16,h-40);for(let i=0;i<11;i++)relief(g,i*5+2,w/2,48+i*42,30)});
T.shaft=ctex(256,512,(g,w,h)=>{sandstone(g,w,h,'#dab783',28);
  for(const [y,c] of [[34,'#3b67a8'],[46,'#b5483a'],[58,'#3f8a68'],[70,'#d6a03a']]){g.fillStyle=c;g.globalAlpha=.75;g.fillRect(0,y,w,9);g.globalAlpha=1}
  g.strokeStyle='rgba(60,35,15,.4)';g.lineWidth=2;g.strokeRect(w*.38,100,w*.24,h-150);for(let i=0;i<8;i++)relief(g,i*7+1,w/2,130+i*44,34,i%2?PIG[i%4]:null);
  for(let x=0;x<w;x+=w/8){g.fillStyle='rgba(80,50,20,.12)';g.fillRect(x,0,3,h)}});
T.capital=ctex(256,128,(g,w,h)=>{g.fillStyle='#d9b680';g.fillRect(0,0,w,h);const c=['#3f8a68','#3b67a8','#3f8a68','#b5483a'];
  for(let i=0;i<16;i++){const x=i*w/16;g.fillStyle=c[i%4];g.beginPath();g.moveTo(x+2,h);g.quadraticCurveTo(x+w/32,h*.05,x+w/16-2,h);g.fill();g.strokeStyle='rgba(230,190,90,.8)';g.lineWidth=2;g.stroke()}
  g.fillStyle='#d6a03a';g.fillRect(0,h-10,w,10);g.fillRect(0,0,w,6);grain(g,w,h,18)});
T.nemes=ctex(64,128,(g,w,h)=>{for(let y=0;y<h;y+=16){g.fillStyle='#2c4f9a';g.fillRect(0,y,w,8);g.fillStyle='#e0b040';g.fillRect(0,y+8,w,8)}grain(g,w,h,16)},[1,1]);
T.pave=ctex(512,512,(g,w,h)=>{sandstone(g,w,h,'#d7b27a',30);g.strokeStyle='rgba(120,80,40,.4)';g.lineWidth=3;
  const rows=4;for(let r=0;r<rows;r++){const y=r*h/rows;g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke();let x=(r%2)*64;while(x<w){g.beginPath();g.moveTo(x,y);g.lineTo(x,y+h/rows);g.stroke();x+=96+Math.random()*64}}
  for(let k=0;k<14;k++){const x=Math.random()*w,y=Math.random()*h,r=20+Math.random()*60;const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(236,200,140,.5)');gr.addColorStop(1,'rgba(236,200,140,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,2*r,2*r)}},[.5,.5]);
T.ripple=ctex(512,512,(g,w,h)=>{g.fillStyle='#e6e0d6';g.fillRect(0,0,w,h);
  for(let y=-20;y<h+20;y+=7){g.beginPath();const ph=Math.random()*6;for(let x=0;x<=w;x+=8){const yy=y+Math.sin(x*.025+ph)*3+Math.sin(x*.071+y)*1.5;x?g.lineTo(x,yy):g.moveTo(x,yy)}
    g.strokeStyle='rgba(255,255,255,.75)';g.lineWidth=2.4;g.stroke();g.translate(0,2.6);g.strokeStyle='rgba(120,100,80,.45)';g.lineWidth=2;g.stroke();g.translate(0,-2.6)}
  grain(g,w,h,22)},[1,1]);
T.trunk=ctex(256,64,(g,w,h)=>{g.fillStyle='#7a5a3a';g.fillRect(0,0,w,h);for(let x=0;x<w;x+=16){for(let y=0;y<h;y+=12){g.fillStyle=Math.random()<.5?'#8d6a45':'#5e432a';g.beginPath();g.moveTo(x,y+(x/16%2)*6);g.lineTo(x+14,y+6+(x/16%2)*6);g.lineTo(x,y+12+(x/16%2)*6);g.fill()}}
  grain(g,w,h,24)},[1,1]);
T.burlap=ctex(128,128,(g,w,h)=>{g.fillStyle='#b99566';g.fillRect(0,0,w,h);for(let i=0;i<w;i+=4){g.fillStyle='rgba(80,55,30,.18)';g.fillRect(i,0,1.5,h);g.fillRect(0,i,w,1.5)}grain(g,w,h,26)},[2,2]);
T.blanket=ctex(256,128,(g,w,h)=>{const c=['#b5302a','#e0b040','#2c4f9a','#efe6d0','#2f8a6a','#b5302a'];for(let i=0;i<16;i++){g.fillStyle=c[i%6];g.fillRect(0,i*h/16,w,h/16)}
  g.fillStyle='rgba(255,255,255,.25)';for(let x=0;x<w;x+=16)for(let y=0;y<h;y+=16)if((x+y)%32===0)g.fillRect(x+4,y+4,6,6);grain(g,w,h,16)});
T.mat=ctex(256,256,(g,w,h)=>{g.fillStyle='#cfa966';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=6){const gr=g.createLinearGradient(0,y,0,y+6);gr.addColorStop(0,'rgba(255,240,200,.35)');gr.addColorStop(1,'rgba(90,60,25,.3)');g.fillStyle=gr;g.fillRect(0,y,w,6)}
  for(let x=20;x<w;x+=40){g.fillStyle='rgba(90,55,25,.45)';g.fillRect(x,0,3,h)}
  const band=(y,c)=>{g.fillStyle=c;g.fillRect(0,y,w,10)};band(14,'#b5302a');band(28,'#2c4f9a');band(h-24,'#2c4f9a');band(h-38,'#b5302a');
  g.strokeStyle='#2f8a6a';g.lineWidth=4;g.beginPath();for(let x=0;x<=w;x+=16)g.lineTo(x,h/2+((x/16)%2?-14:14));g.stroke();grain(g,w,h,18)});
T.relief2=ctex(256,256,(g,w,h)=>{sandstone(g,w,h,'#d3ad78',30);for(let r=0;r<4;r++)for(let c=0;c<4;c++)relief(g,r*4+c,32+c*64,36+r*62,34,(r+c)%3===0?PIG[(r+c)%4]:null)});
T.throneBack=ctex(256,256,(g,w,h)=>{g.fillStyle='#e0b040';g.fillRect(0,0,w,h);
  for(let y=40;y<h-10;y+=14)for(let x=10;x<w-10;x+=20){g.fillStyle=((x+y)/2)%3<1?'#2c4f9a':((x+y)%3<1.5?'#3fb1a6':'#b5302a');g.beginPath();g.roundRect(x+2,y+2,16,10,5);g.fill()}
  g.fillStyle='#c48a20';g.fillRect(0,0,w,36);g.fillStyle='#b5302a';g.beginPath();g.arc(w/2,18,13,0,TAU);g.fill();
  for(const s of[-1,1]){g.fillStyle='#2c4f9a';g.beginPath();g.moveTo(w/2+s*14,12);g.quadraticCurveTo(w/2+s*70,0,w/2+s*120,14);g.lineTo(w/2+s*14,24);g.fill()}
  g.strokeStyle='#8a5a10';g.lineWidth=6;g.strokeRect(3,3,w-6,h-6);grain(g,w,h,14)});
T.bedPanel=ctex(256,128,(g,w,h)=>{g.fillStyle='#e0b040';g.fillRect(0,0,w,h);g.fillStyle='#2a1a12';g.fillRect(8,8,w-16,h-16);
  for(let i=0;i<6;i++){g.fillStyle='rgba(224,176,64,.9)';glyph(g,i*2,28+i*40,h/2,36);g.strokeStyle='#e0b040';glyph(g,i*2,28+i*40,h/2,36)}});
T.chest=ctex(256,128,(g,w,h)=>{g.fillStyle='#e0b040';g.fillRect(0,0,w,h);g.fillStyle='#1d3f7a';g.fillRect(10,10,w-20,h-20);
  g.strokeStyle='#e0b040';g.fillStyle='#e0b040';for(let i=0;i<5;i++)glyph(g,[0,1,6,2,3][i],36+i*46,h/2,46);grain(g,w,h,12)});
T.shrine=ctex(128,256,(g,w,h)=>{g.fillStyle='#e0b040';g.fillRect(0,0,w,h);g.fillStyle='#c78f22';for(let y=0;y<h;y+=4)g.fillRect(0,y,w,1);
  g.fillStyle='#1d3f7a';g.fillRect(14,30,w-28,h-60);g.strokeStyle='#e0b040';g.fillStyle='#e0b040';glyph(g,1,w/2,80,60);glyph(g,0,w/2,150,44);glyph(g,6,w/2,205,40);grain(g,w,h,10)});
T.sarc=ctex(256,128,(g,w,h)=>{sandstone(g,w,h,'#b7a48a',28);for(let i=0;i<8;i++)relief(g,i*3+1,20+i*31,h/2,26,i%2?PIG[i%4]:null)});

// ---------- floors ----------
const F={
  reed(g,S,R,sh_,li){for(let y=0;y<S;y+=8){const gr=g.createLinearGradient(0,y,0,y+8);gr.addColorStop(0,li(.22));gr.addColorStop(.6,'rgba(0,0,0,0)');gr.addColorStop(1,sh_(.22));g.fillStyle=gr;g.fillRect(0,y,S,8)}
    for(let x=0;x<S;x+=64){g.fillStyle=sh_(.28);g.fillRect(x+30,0,4,S);g.fillStyle=li(.15);g.fillRect(x+29,0,1,S)}
    for(let k=0;k<70;k++){g.strokeStyle=R()<.5?li(.3):sh_(.18);g.lineWidth=1.2;const x=R()*S,y=R()*S,a=R()*6;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*14,y+Math.sin(a)*14);g.stroke()}},
  flags(g,S,R,sh_,li){const cut=(x0,y0,x1,y1)=>{g.strokeStyle='rgba(240,210,150,.9)';g.lineWidth=5;g.beginPath();g.moveTo(x0,y0);g.lineTo(x1,y1);g.stroke();g.strokeStyle=sh_(.25);g.lineWidth=1.5;g.beginPath();g.moveTo(x0+2,y0+3);g.lineTo(x1+2,y1+3);g.stroke()};
    for(let k=0;k<30;k++){g.fillStyle=R()<.5?sh_(.06):li(.08);g.beginPath();g.arc(R()*S,R()*S,4+R()*16,0,TAU);g.fill()}
    cut(0,S*.55,S,S*.48);cut(S*.42,0,S*.46,S*.52);cut(S*.7,S*.5,S*.66,S);
    const gr=g.createRadialGradient(S*.9,S*.1,0,S*.9,S*.1,S*.5);gr.addColorStop(0,'rgba(240,205,140,.6)');gr.addColorStop(1,'rgba(240,205,140,0)');g.fillStyle=gr;g.fillRect(0,0,S,S)},
  faience(g,S,R,sh_,li){const q=S/2;for(let i=0;i<4;i++){const x=(i%2)*q,y=Math.floor(i/2)*q;g.fillStyle=R()<.5?li(.1):sh_(.08);g.fillRect(x+4,y+4,q-8,q-8);
      const gr=g.createLinearGradient(x,y,x+q,y+q);gr.addColorStop(0,li(.28));gr.addColorStop(.5,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(x+4,y+4,q-8,q-8);
      g.strokeStyle='rgba(230,190,90,.7)';g.lineWidth=2;g.strokeRect(x+8,y+8,q-16,q-16);g.strokeStyle='#123a6a';g.fillStyle='#123a6a';glyph(g,[0,1,2,6][i],x+q/2,y+q/2,q*.62)}
    g.fillStyle=sh_(.35);g.fillRect(q-2,0,4,S);g.fillRect(0,q-2,S,4)},
  linen(g,S,R,sh_,li){for(let k=0;k<1800;k++){g.fillStyle=R()<.5?sh_(.04):li(.05);g.fillRect(R()*S,R()*S,3,1)}
    const c=['#2c4f9a','#e0b040','#b5302a','#e0b040'];for(let i=0;i<16;i++){g.fillStyle=c[i%4];g.globalAlpha=.75;g.fillRect(i*S/16+1,10,S/16-2,12);g.fillRect(i*S/16+1,S-22,S/16-2,12);g.fillRect(10,i*S/16+1,12,S/16-2);g.fillRect(S-22,i*S/16+1,12,S/16-2)}g.globalAlpha=1;
    g.save();g.translate(S/2,S/2);for(let k=0;k<8;k++){g.rotate(TAU/8);g.fillStyle=k%2?'rgba(239,230,208,.55)':'rgba(44,79,154,.45)';g.beginPath();g.ellipse(0,-30,10,26,0,0,TAU);g.fill()}
    g.fillStyle='rgba(224,176,64,.9)';g.beginPath();g.arc(0,0,11,0,TAU);g.fill();g.restore()},
  lapis(g,S,R,sh_,li){const n=16,q=S/n;const blues=['#1f3f86','#2c4f9a','#24478f','#35599f','#18357a'];
    for(let i=0;i<n;i++)for(let j=0;j<n;j++){g.fillStyle=blues[Math.floor(R()*5)];g.fillRect(i*q+1,j*q+1,q-2,q-2);if(R()<.08){g.fillStyle='rgba(255,230,150,.6)';g.fillRect(i*q+q/2,j*q+q/2,1.5,1.5)}}
    g.fillStyle='#e2b545';for(let i=0;i<n;i++)for(let j=0;j<n;j++){const d=Math.abs(i-7.5)+Math.abs(j-7.5);if(d<2.5||Math.abs(d-6)<.6||i===0||j===0||i===n-1||j===n-1)g.fillRect(i*q+1,j*q+1,q-2,q-2)}
    g.fillStyle=sh_(.25);for(let i=0;i<=n;i++){g.fillRect(i*q-1,0,2,S);g.fillRect(0,i*q-1,S,2)}},
  terra(g,S,R,sh_,li){const q=S/2;for(let i=0;i<4;i++){const x=(i%2)*q,y=Math.floor(i/2)*q;g.fillStyle=R()<.5?li(.08):sh_(.1);g.fillRect(x+3,y+3,q-6,q-6);
      const gr=g.createRadialGradient(x+q/2,y+q/2,q*.1,x+q/2,y+q/2,q*.7);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,sh_(.16));g.fillStyle=gr;g.fillRect(x,y,q,q)}
    g.fillStyle=sh_(.4);g.fillRect(q-3,0,6,S);g.fillRect(0,q-3,S,6);
    for(let k=0;k<40;k++){g.fillStyle='rgba(250,240,220,.35)';g.beginPath();g.arc(R()*S,R()*S,1+R()*3,0,TAU);g.fill()}
    for(let k=0;k<30;k++){g.fillStyle='rgba(225,180,90,.6)';g.fillRect(R()*S,R()*S,3,1.6)}},
  alabaster(g,S,R,sh_,li){for(let k=0;k<7;k++){g.strokeStyle=`rgba(170,140,100,${.06+R()*.1})`;g.lineWidth=1+R()*2.5;g.beginPath();let x=R()*S,y=0;g.moveTo(x,y);while(y<S){x+=R()*26-13;y+=10+R()*16;g.lineTo(x,y)}g.stroke()}
    g.strokeStyle='rgba(205,160,60,.85)';g.lineWidth=3;g.strokeRect(18,18,S-36,S-36);g.lineWidth=1.5;g.strokeRect(26,26,S-52,S-52);
    g.strokeStyle='rgba(205,160,60,.7)';g.fillStyle='rgba(205,160,60,.7)';glyph(g,0,S/2,S/2,70)},
  granite(g,S,R,sh_,li){for(let k=0;k<2600;k++){const r=R();g.fillStyle=r<.35?'rgba(25,20,22,.5)':r<.6?'rgba(240,235,230,.4)':'rgba(190,120,110,.35)';g.fillRect(R()*S,R()*S,1+R()*2.5,1+R()*2.5)}
    g.strokeStyle=sh_(.35);g.lineWidth=3;g.beginPath();g.moveTo(0,S/2);g.lineTo(S,S/2);g.moveTo(S*.4,0);g.lineTo(S*.4,S/2);g.moveTo(S*.65,S/2);g.lineTo(S*.65,S);g.stroke()},
  garden(g,S,R,sh_,li){for(let k=0;k<900;k++){g.strokeStyle=R()<.5?'rgba(25,60,15,.25)':'rgba(210,235,140,.22)';const x=R()*S,y=R()*S;g.lineWidth=1.5;g.beginPath();g.moveTo(x,y);g.lineTo(x+R()*4-2,y-5-R()*6);g.stroke()}
    for(let k=0;k<10;k++){const x=R()*S,y=R()*S;g.fillStyle=['#5b8fd6','#f4f0e0','#e8a33a'][k%3];for(let p=0;p<5;p++){g.beginPath();g.arc(x+Math.cos(p*1.256)*3,y+Math.sin(p*1.256)*3,2.4,0,TAU);g.fill()}}},
  tomb(g,S,R,sh_,li){g.fillStyle='rgba(214,160,58,.85)';g.fillRect(0,0,S,10);g.fillRect(0,S-10,S,10);
    const star=(x,y,r)=>{g.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,rr=i%2?r*.38:r;g.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr)}g.closePath();g.fill()};
    g.fillStyle='rgba(240,200,90,.85)';for(let r=0;r<4;r++)for(let c=0;c<4;c++)star(32+c*64+(r%2)*16,42+r*58,11);
    for(let k=0;k<400;k++){g.fillStyle=R()<.5?sh_(.08):li(.04);g.fillRect(R()*S,R()*S,2,2)}}
};

// ---------- particles (all GPU-animated) ----------
const SOFT=ctex(64,64,(g,w,h)=>{const r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.5,'rgba(255,255,255,.35)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64)});
SOFT.colorSpace=THREE.NoColorSpace;
function smoke(n,height,size,color,opacity,speed=.12,spread=.06){const g=new THREE.BufferGeometry();const p=new Float32Array(n*3),s=new Float32Array(n);for(let i=0;i<n;i++)s[i]=i/n+Math.random()*.02;
  g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('aSeed',new THREE.BufferAttribute(s,1));g.boundingSphere=new THREE.Sphere(new THREE.Vector3(0,height/2,0),height);
  const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uT:U.t,uC:{value:new THREE.Color(color)},uO:{value:opacity},uH:{value:height},uS:{value:size},uV:{value:speed},uW:{value:spread},uM:{value:SOFT}},
    vertexShader:`attribute float aSeed;uniform float uT,uH,uS,uV,uW;varying float vA;void main(){float p=fract(uT*uV+aSeed);vec3 q=position;q.y+=p*uH;
      q.x+=sin(p*5.+aSeed*40.)*uW*(.3+p)+p*p*uW*2.;q.z+=cos(p*4.+aSeed*31.)*uW*(.3+p);vec4 mv=modelViewMatrix*vec4(q,1.);gl_Position=projectionMatrix*mv;
      gl_PointSize=uS*(.5+p*1.8)*(420./-mv.z);vA=smoothstep(0.,.12,p)*(1.-p);}`,
    fragmentShader:`uniform vec3 uC;uniform float uO;uniform sampler2D uM;varying float vA;void main(){float a=texture2D(uM,gl_PointCoord).r*vA*uO;if(a<.004)discard;gl_FragColor=vec4(uC,a);}`});
  const pts=new THREE.Points(g,m);pts.frustumCulled=false;return pts}

// ---------- reusable models ----------
const M_={};const G=()=>M_.gold||(M_.gold=mat('#e2b13f',{metalness:.85,roughness:.28}));
const LION=[[0,0],[.034,0],[.036,.012],[.028,.03],[.02,.05],[.016,.1],[.02,.16],[.018,.2],[.022,.22],[.022,.24],[0,.24]];
function lionLeg(h,m){const o=lathe(LION.map(p=>[p[0],p[1]*h/.24]),m,10);return o}
function jar(h,r,m,band){const pts=[[0,0],[r*.35,0],[r*.55,h*.08],[r*.95,h*.35],[r,h*.5],[r*.85,h*.72],[r*.45,h*.86],[r*.38,h*.92],[r*.5,h*.97],[r*.44,h],[0,h]];const g=new THREE.Group();g.add(lathe(pts,m,16));
  if(band){const b=sh(new THREE.Mesh(new THREE.TorusGeometry(r*.97,.008,4,20),band));b.rotation.x=Math.PI/2;b.position.y=h*.52;g.add(b)}return g}
function amphora(h,r,m){return lathe([[0,0],[.012,0],[.02,h*.08],[r*.8,h*.35],[r,h*.55],[r*.8,h*.75],[r*.3,h*.86],[r*.28,h*.97],[r*.4,h],[0,h]],m,14)}
// a date palm: tapered curved trunk, drooping fronds with leaflets, date clusters
function crownGeo(n,L,R){const P=[],C=[],cA=new THREE.Color(),cB=new THREE.Color();
  for(let i=0;i<n;i++){const th=i/n*TAU+R()*.4,dead=i<2,e0=dead?-.9:(.2+R()*.7),len=L*(dead?.7:.8+R()*.35);const d=[Math.cos(th),Math.sin(th)];
    cA.set(dead?'#8c6a3a':'#8aa040');cB.set(dead?'#6a4a28':'#3e6a26');const pt=s=>{const r=len*s*Math.cos(e0*.6),y=len*(s*Math.sin(e0)-.55*s*s);return [d[0]*r,y,d[1]*r]};
    const st=9;for(let k=1;k<st;k++){const s0=k/st,s1=(k+1)/st,a=pt(s0),b=pt(s1),ll=len*(.34*Math.sin(Math.PI*s0)+.06);
      for(const sd of[-1,1]){const tip=[a[0]+(-d[1]*sd)*ll+d[0]*ll*.45,a[1]-ll*.45,a[2]+(d[0]*sd)*ll+d[1]*ll*.45];P.push(...a,...b,...tip);const c=cA.clone().lerp(cB,s0+R()*.15);for(let q=0;q<3;q++)C.push(c.r,c.g,c.b)}}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.computeVertexNormals();return g}
const FROND=()=>M_.frond||(M_.frond=new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:.8}));
const TRUNK=()=>M_.trunk||(M_.trunk=new THREE.MeshStandardMaterial({map:T.trunk,roughness:.95}));
function palm(h,R,lean=.25){const g=new THREE.Group();const la=R()*TAU,lx=Math.cos(la)*lean,lz=Math.sin(la)*lean;
  const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,0),new THREE.Vector3(lx*h*.15,h*.4,lz*h*.15),new THREE.Vector3(lx*h*.55,h*.8,lz*h*.55),new THREE.Vector3(lx*h*.7,h,lz*h*.7)]);
  const tg=new THREE.TubeGeometry(curve,14,h*.035,7,false);const p=tg.attributes.position;
  for(let i=0;i<p.count;i++){const seg=Math.floor(i/8)/14,c=curve.getPoint(seg),k=1.25-.45*seg;p.setXYZ(i,c.x+(p.getX(i)-c.x)*k,p.getY(i),c.z+(p.getZ(i)-c.z)*k)}tg.computeVertexNormals();
  const tr=sh(new THREE.Mesh(tg,TRUNK()));g.add(tr);const top=curve.getPoint(1);
  const crown=new THREE.Group();crown.position.copy(top);const cm=new THREE.Mesh(crownGeo(14,h*.42,R),FROND());cm.castShadow=true;crown.add(cm);
  const dm=mat('#c46a22',{roughness:.5});for(let k=0;k<3;k++){const a=k*2.1+R();const cl=ball(h*.045,dm,Math.cos(a)*h*.05,-h*.06,Math.sin(a)*h*.05,0);cl.scale.set(1,1.4,1);crown.add(cl)}
  crown.add(ball(h*.04,mat('#6a7a2a'),0,0,0,0));crown.userData.sway=[.06,.7+R()*.4,R()*6];g.add(crown);g.userData.sway=[.012,.5+R()*.3,R()*6];return g}
// a camel; flat saddle top at y=.63. Returns {g, head, tail, jaw}
function camel(){const g=new THREE.Group(),S=new THREE.Group(),hide=mat('#c39158',{roughness:.85}),dk=mat('#7a5530',{roughness:.9}),pad=mat('#3a2a1c');
  S.add(sc(ball(.2,hide,0,.5,0,2),1.45,.72,.78));S.add(sc(ball(.15,hide,-.02,.56,0,2),1.2,.75,.9));S.add(sc(ball(.12,hide,.2,.5,0,1),1,1,.95));
  for(const [x,z] of[[.17,.07],[.17,-.07],[-.17,.07],[-.17,-.07]]){const up=cyl(.034,.026,.22,hide,x,.36,z,8);S.add(up);S.add(ball(.032,hide,x,.25,z,0));S.add(cyl(.024,.022,.22,hide,x,.13,z,8));S.add(sc(cyl(.04,.044,.025,pad,x,.012,z,10),1.2,1,1))}
  // saddle: wooden frame, a striped blanket that hangs down both flanks, a flat cushion on top
  const bl=new THREE.MeshStandardMaterial({map:T.blanket,roughness:.9});S.add(rbox(.34,.02,.44,.03,bl,-.02,.585,0,.006));
  for(const z of[-.215,.215])S.add(box(.32,.16,.012,bl,-.02,.51,z));
  S.add(rbox(.3,.05,.3,.05,mat('#b5302a',{roughness:.85}),-.02,.605,0,.012));
  for(const x of[-.17,.13])S.add(box(.025,.08,.3,mat(DWOOD),x,.62,0));
  const tas=mat('#e0b040');for(const x of[-.14,-.02,.1])for(const z of[-.222,.222])S.add(ball(.014,tas,x,.42,z,0));
  g.add(bake(S));
  const head=new THREE.Group();head.position.set(.27,.55,0);
  const H_=new THREE.Group();H_.add(tube([[0,0,0],[.07,.1,0],[.07,.22,0],[.13,.31,0]],.045,hide,10,7));
  H_.add(sc(ball(.06,hide,.17,.32,0,1),1.5,.85,.8));H_.add(sc(ball(.04,hide,.25,.3,0,1),1.2,.9,.9));
  for(const z of[-.03,.03]){H_.add(ball(.011,mat('#120a05'),.18,.345,z*1.4,0));const e=sh(new THREE.Mesh(new THREE.ConeGeometry(.012,.04,5),hide));e.position.set(.12,.375,z);e.rotation.z=.4;H_.add(e)}
  H_.add(sc(ball(.03,dk,.05,.18,0,1),1,1.8,.8));
  head.add(bake(H_));const jaw=box(.08,.018,.05,hide,.23,-.03+.3,0);head.add(jaw);g.add(head);
  const tail=new THREE.Group();tail.position.set(-.29,.55,0);const tl=cyl(.012,.008,.22,dk,0,-.11,0,5);tail.add(tl);tail.add(sc(ball(.02,dk,0,-.22,0,0),1,1.6,1));g.add(tail);
  return {g,head,tail,jaw}}
// a recumbent sphinx facing +x
function sphinx(m,nm){const g=new THREE.Group();g.add(rbox(1,.12,.42,.03,m,0,.06,0));g.add(sc(ball(.2,m,-.1,.27,0,2),1.6,.75,.85));
  g.add(sc(ball(.12,m,-.38,.24,0,1),1,1,1.1));for(const z of[-.09,.09])g.add(rbox(.36,.07,.08,.03,m,.24,.155,z,.008));
  g.add(rbox(.14,.26,.2,.04,m,.17,.36,0,.01));g.add(sc(ball(.075,m,.21,.52,0,2),1,1.15,.95));
  const ne=new THREE.Shape();ne.moveTo(-.11,0);ne.lineTo(.11,0);ne.lineTo(.08,.2);ne.lineTo(-.08,.2);ne.closePath();const n=ext(ne,.1,nm,.006);n.rotation.y=Math.PI/2;n.position.set(.18,.36,0);g.add(n);
  for(const z of[-.085,.085])g.add(box(.04,.13,.04,nm,.24,.42,z));g.add(box(.03,.07,.025,m,.27,.42,0));return g}

registerTheme({id:'egypt',label:'Tempel',icon:'🐫',title:'Moord in de tempel',loading:'De tempelpoort zwaait open…',
  subs:['De zon brandt. De farao zwijgt. Iemand liegt.','In de schaduw van de zuilen viel een lichaam.','Het zand bewaart elk geheim, behalve dit ene.','De priesters zongen nog toen het gegil klonk.','Anubis weegt de harten. Jij zoekt de dader.'],
  names:{A:[['Amunet','f'],['Ahmose','m']],B:[['Bastet','f'],['Bakenre','m']],C:[['Cleopatra','f'],['Cheops','m']],D:[['Djedet','f'],['Djoser','m']],
    E:[['Eset','f'],['Echnaton','m']],F:[['Farida','f'],['Fahim','m']],G:[['Gilukhepa','f'],['Geb','m']],H:[['Hatsjepsoet','f'],['Horemheb','m']]},
  victims:[['Hogepriester Imhotep','m'],['Koningin Nefertari','f']],vicFace:{f:'👸🏽',m:'👳🏾‍♂️'},
  faces:{f:['👸🏽','👩🏽','👵🏽','👩🏾‍🦱','🧕🏽','👩🏽‍🦳','💃🏽','🧝🏽‍♀️'],m:['🧔🏽','👳🏽‍♂️','👨🏾‍🦲','🧙🏽‍♂️','👴🏽','🤴🏽','🧑🏾','👨🏽‍🌾']},
  rooms:{Stal:{name:'Kamelenstal',art:'de',color:'#c99d58',pat:F.reed},Binnenplaats:{name:'Zuilenhof',art:'het',color:'#d8b888',pat:F.flags},
    Bibliotheek:{name:'Papyrusarchief',art:'het',color:'#4fa79c',pat:F.faience,rough:.38},Slaapkamer:{name:'Slaapvertrek',art:'het',color:'#c48c78',pat:F.linen},
    Troonzaal:{name:'Faraozaal',art:'de',color:'#2c4f9a',pat:F.lapis,rough:.4,metal:.15},Keuken:{name:'Bakkerij',art:'de',color:'#c4703f',pat:F.terra},
    Kapel:{name:'Heiligdom',art:'het',color:'#e4d8c0',pat:F.alabaster,rough:.35},Wapenkamer:{name:'Wapenhuis',art:'het',color:'#8c7c7e',pat:F.granite,rough:.5},
    Tuin:{name:'Papyrustuin',art:'de',color:'#74a04e',pat:F.garden},Kelder:{name:'Grafkamer',art:'de',color:'#7a4632',pat:F.tomb}},
  look:{sky:[[0,'#2c86b0'],[.3,'#6dbbd2'],[.55,'#bfe3e2'],[.75,'#f7f0dc'],[1,'#f3dcae']],fog:['#efd9b0',30,125],hemi:['#cfeaf2','#b8844a',.5],
    sun:['#ffe2b4',4.2,[-10,7.2,-3.5]],rim:['#9fd8ff',.45],fill:['#ffd6a0',.4],exposure:.95,env:.28,bloom:[.42,.5,1.45],
    wall:'#d7b47e',cap:'#2f5d9e',grout:'#5a3d22',base:'#b48f60',shadowR:11,
    label:{bg:'rgba(24,40,78,.82)',fg:'#f3d27a',line:'rgba(226,177,63,.7)',font:'Cinzel, Georgia, serif'},dust:['#f6dca6',HQ?160:70,.5]},
  i18n:{en:{label:'Temple',title:'Murder in the temple',loading:'The temple gates swing open…',
    subs:['The sun burns. The pharaoh is silent. Someone is lying.','In the shadow of the columns, a body fell.','The sand keeps every secret but this one.','The priests were still chanting when the scream rang out.','Anubis weighs the hearts. You find the killer.'],
    victims:[['High Priest Imhotep','m'],['Queen Nefertari','f']],
    rooms:{Stal:{name:'Camel stable'},Binnenplaats:{name:'Colonnade'},Bibliotheek:{name:'Papyrus archive'},Slaapkamer:{name:'Bedchamber'},Troonzaal:{name:'Pharaoh’s hall'},
      Keuken:{name:'Bakery'},Kapel:{name:'Sanctuary'},Wapenkamer:{name:'Armory'},Tuin:{name:'Papyrus garden'},Kelder:{name:'Burial chamber'}},
    objs:{stoel:{name:'ebony chair',verb:'Sat'},troon:{name:'pharaoh’s throne',verb:'Sat',art:'the'},tafel:{name:'table'},bed:{name:'lion bed',verb:'Lay'},
      tapijt:{name:'reed mat',verb:'Stood'},bank:{name:'bench',verb:'Sat'},paard:{name:'camel',verb:'Sat'},kist:{name:'canopic chest'},ton:{name:'storage jar'},
      hooibaal:{name:'grain sack'},boom:{name:'date palm'},struik:{name:'papyrus plant'},bloemperk:{name:'lotus pond'},put:{name:'water basin'},kast:{name:'shrine'},
      boekenkast:{name:'scroll rack'},harnas:{name:'Anubis statue'},altaar:{name:'offering table'},kandelaar:{name:'fire bowl'},wapenrek:{name:'spear rack'},wijnrek:{name:'amphora rack'}}}},
  objs:{
    stoel:{name:'zetel',verb:'Zat',h:.31,build(L){const S=new THREE.Group(),eb=mat('#2a1a12',{roughness:.45}),gd=G();
      S.add(rbox(.42,.04,.4,.04,mat('#c9a35e',{roughness:.9,map:T.mat}),0,.29,0));S.add(rbox(.46,.03,.44,.03,eb,0,.265,0));
      for(const [a,b] of[[1,1],[1,-1],[-1,1],[-1,-1]])S.add(lionLeg(.25,eb).translateX(a*.18).translateZ(b*.17));
      for(const [a,b] of[[1,1],[1,-1],[-1,1],[-1,-1]])S.add(ball(.022,gd,a*.18,.015,b*.17,0));
      const bk=rbox(.04,.36,.4,.02,eb,-.21,.46,0);bk.rotation.z=.12;S.add(bk);const bp=box(.012,.26,.3,new THREE.MeshStandardMaterial({map:T.throneBack,roughness:.4,metalness:.4}),-.188,.47,0);bp.rotation.z=.12;S.add(bp);
      S.add(box(.4,.02,.02,gd,0,.255,.2));S.add(box(.4,.02,.02,gd,0,.255,-.2));return bake(S)}},
    troon:{name:'faraotroon',de:true,verb:'Zat',h:.38,build(L,ctx){const g=new THREE.Group(),S=new THREE.Group(),gd=G(),lp=mat('#2c4f9a',{roughness:.35,metalness:.2});
      S.add(rbox(.82,.06,.82,.06,mat('#d6c3a0',{roughness:.5}),0,.03,0));S.add(rbox(.72,.05,.72,.05,lp,0,.08,0));
      for(const [a,b] of[[1,1],[1,-1],[-1,1],[-1,-1]])S.add(lionLeg(.2,gd).translateX(a*.2).translateZ(b*.2).translateY(.1));
      S.add(rbox(.52,.06,.5,.03,gd,0,.32,0));S.add(rbox(.48,.05,.46,.06,mat('#b5302a',{roughness:.8}),0,.36,0));
      S.add(rbox(.07,.66,.56,.03,gd,-.27,.57,0));S.add(box(.012,.5,.46,new THREE.MeshStandardMaterial({map:T.throneBack,roughness:.35,metalness:.5}),-.232,.6,0));S.add(box(.012,.5,.46,new THREE.MeshStandardMaterial({map:T.throneBack,roughness:.35,metalness:.5}),-.308,.6,0));
      for(const z of[-.26,.26]){S.add(rbox(.5,.05,.07,.025,gd,0,.5,z));S.add(box(.46,.14,.012,new THREE.MeshStandardMaterial({map:T.throneBack,roughness:.35,metalness:.5}),0,.42,z*1.02));
        S.add(sc(ball(.05,gd,.27,.53,z,1),1.3,1,1));S.add(ball(.022,gd,.32,.51,z,0))}
      for(const z of[-.2,-.07,.07,.2]){const u=sh(new THREE.Mesh(new THREE.ConeGeometry(.025,.1,6),gd));u.position.set(-.27,.95,z);S.add(u);S.add(ball(.02,mat('#b5302a'),-.27,.92,z,0))}
      S.add(rbox(.2,.06,.36,.02,lp,.42,.03,0));g.add(bake(S));
      const gem=ball(.045,new THREE.MeshStandardMaterial({color:'#3fe0d0',emissive:'#1fc8b8',emissiveIntensity:1.4,roughness:.2,metalness:.3}),-.225,.8,0,1);gem.scale.set(.5,1,1);g.add(gem);
      ctx.anim(t=>{gem.material.emissiveIntensity=1.3+Math.sin(t*1.4)*.7});return g}},
    tafel:{name:'tafel',build(L){const S=new THREE.Group(),w=L-.18,cd=mat('#9a5c2e',{roughness:.55}),gd=G();
      S.add(rbox(w,.05,.66,.04,cd,0,.43,0));S.add(box(w-.04,.012,.62,mat('#efe6d0',{roughness:.9}),0,.46,0));S.add(box(w-.1,.035,.03,gd,0,.395,.31));S.add(box(w-.1,.035,.03,gd,0,.395,-.31));
      for(const [a,b] of[[1,1],[1,-1],[-1,1],[-1,-1]]){S.add(lathe([[0,0],[.03,0],[.032,.02],[.02,.06],[.018,.3],[.032,.37],[.04,.41],[0,.41]],cd,10,a*(w/2-.07),0,b*.26))}
      const bowl=lathe([[0,0],[.06,0],[.1,.04],[.11,.05],[.0,.05]],mat('#3fb1a6',{roughness:.3}),16,-w/4,.465,.05);S.add(bowl);
      const dt=mat('#7a2e14',{roughness:.4});for(let k=0;k<7;k++)S.add(sc(ball(.022,dt,-w/4+Math.cos(k)*.05,.52,.05+Math.sin(k)*.05,0),1,.7,1.4));
      S.add(sc(ball(.03,mat('#8a6aa0',{roughness:.4}),-w/4+.02,.545,.04,0),1,1,1));
      const jg=jar(.2,.06,mat('#b5653a',{roughness:.7}),mat('#2c4f9a'));jg.position.set(w/4,.466,-.12);S.add(...bake(jg).children.map(c=>{c.position.copy(jg.position);return c}));
      for(const x of[w/4-.12,w/4+.02]){const lf=sc(ball(.05,mat('#c98b45',{roughness:.9}),x,.48,.14,1),1.2,.5,1);S.add(lf)}
      S.add(sc(cyl(.04,.05,.03,mat('#c9a072'),-w/4+.14,.475,-.17,10),1,1,.7));
      return bake(S)}},
    bed:{name:'leeuwenbed',verb:'Lag',h:.37,build(L){const S=new THREE.Group(),w=L-.14,gd=G(),eb=mat('#2a1a12',{roughness:.45});
      for(const z of[-.36,.36])S.add(rbox(w,.07,.06,.02,gd,0,.25,z));for(const x of[-w/2+.04,w/2-.04])S.add(rbox(.06,.07,.72,.02,gd,x,.25,0));
      S.add(rbox(w-.08,.09,.72,.04,mat('#f1ead8',{roughness:.95}),0,.315,0));S.add(box(w*.62,.014,.745,mat('#2c4f9a',{roughness:.9}),w*.17,.367,0));
      S.add(box(.03,.016,.75,mat('#e0b040'),w*.17-w*.31,.368,0));
      for(const [a,b] of[[1,1],[1,-1],[-1,1],[-1,-1]])S.add(lionLeg(.22,gd).translateX(a*(w/2-.05)).translateZ(b*.34));
      // lion heads guard the head end, a painted footboard at the foot
      for(const z of[-.34,.34]){S.add(cyl(.035,.04,.36,gd,-w/2+.03,.42,z,10));S.add(sc(ball(.075,gd,-w/2+.04,.64,z,1),1,1.05,.95));S.add(sc(ball(.05,gd,0-w/2+.11,.62,z,1),1.3,.75,.8));
        S.add(ball(.012,mat('#1d3f7a'),-w/2+.105,.665,z+.03,0));S.add(ball(.012,mat('#1d3f7a'),-w/2+.105,.665,z-.03,0));
        const mn=sh(new THREE.Mesh(new THREE.TorusGeometry(.07,.022,6,14),mat('#c48a20',{metalness:.8,roughness:.35})));mn.position.set(-w/2+.04,.6,z);mn.rotation.y=Math.PI/2;S.add(mn)}
      S.add(box(.03,.3,.74,new THREE.MeshStandardMaterial({map:T.bedPanel,metalness:.4,roughness:.4}),w/2-.02,.42,0));S.add(box(.04,.03,.78,gd,w/2-.02,.585,0));
      const hr=sh(new THREE.Mesh(new THREE.TorusGeometry(.07,.018,6,14,Math.PI),eb));hr.position.set(-w/2+.17,.44,0);hr.rotation.set(0,Math.PI/2,Math.PI);S.add(hr);S.add(box(.04,.03,.12,eb,-w/2+.17,.37,0));
      return bake(S)}},
    tapijt:{name:'rietmat',verb:'Stond',h:.026,blob:false,build(L){const g=new THREE.Group();const t=T.mat.clone();t.needsUpdate=true;t.wrapS=THREE.RepeatWrapping;t.repeat.set(Math.max(1,L*.8),1);
      const side=mat('#a8823f',{roughness:1});const m=new THREE.Mesh(new THREE.BoxGeometry(L-.12,.022,.8),[side,side,new THREE.MeshStandardMaterial({map:t,roughness:.95}),side,side,side]);m.position.y=.012;m.receiveShadow=true;g.add(m);
      const fr_=new THREE.Group();for(const x of[-(L-.12)/2-.02,(L-.12)/2+.02])for(let z=-.38;z<=.38;z+=.04)fr_.add(box(.05,.006,.012,side,x,.006,z));g.add(bake(fr_));return g}},
    bank:{name:'rustbank',verb:'Zat',h:.31,build(L){const S=new THREE.Group(),cd=mat('#9a5c2e',{roughness:.55}),gd=G();
      S.add(rbox(.84,.05,.34,.03,cd,0,.255,0));S.add(rbox(.8,.04,.3,.04,mat('#2f8a6a',{roughness:.85}),0,.295,0));for(let x=-.3;x<=.3;x+=.2)S.add(box(.08,.005,.305,mat('#e0b040'),x,.316,0));
      for(const [a,b] of[[1,1],[1,-1],[-1,1],[-1,-1]])S.add(lionLeg(.23,cd).translateX(a*.36).translateZ(b*.12));
      S.add(rbox(.84,.16,.035,.015,cd,0,.4,-.155));S.add(box(.78,.02,.04,gd,0,.47,-.155));for(const x of[-.4,.4])S.add(ball(.025,gd,x,.49,-.155,0));return bake(S)}},
    paard:{name:'kameel',verb:'Zat',h:.63,build(L,ctx){const c=camel(),ph=Math.random()*9;
      ctx.anim(t=>{c.head.rotation.z=Math.sin(t*.7+ph)*.08-.02;c.head.rotation.y=Math.sin(t*.31+ph)*.18;c.jaw.position.y=.27+Math.max(0,Math.sin(t*5+ph))*.012*(Math.sin(t*.4+ph)>0?1:0);
        c.tail.rotation.x=Math.sin(t*1.3+ph)*.35;c.tail.rotation.z=.2+Math.sin(t*.9+ph)*.08});return c.g}},
    kist:{name:'canopenkist',build(L){const S=new THREE.Group(),gd=G(),ch=new THREE.MeshStandardMaterial({map:T.chest,roughness:.4,metalness:.35});
      for(const z of[-.15,.15])S.add(rbox(.6,.03,.04,.01,mat(DWOOD),0,.015,z));
      S.add(sh(new THREE.Mesh(new THREE.BoxGeometry(.54,.26,.36),[ch,ch,gd,gd,ch,ch])));S.children[S.children.length-1].position.y=.16;
      S.add(rbox(.6,.04,.42,.015,gd,0,.31,0));S.add(rbox(.5,.025,.32,.01,mat('#1d3f7a',{roughness:.4}),0,.34,0));
      const heads=[['#e0b040','human'],['#5a4a3a','baboon'],['#1a1a1a','jackal'],['#c48a20','falcon']];
      heads.forEach(([c],i)=>{const x=-.18+i*.12;S.add(lathe([[0,0],[.035,0],[.045,.05],[.04,.11],[.025,.13],[0,.13]],mat('#e8dcc4',{roughness:.35}),12,x,.352,0));
        S.add(sc(ball(.032,mat(c,{roughness:.4,metalness:c==='#e0b040'||c==='#c48a20'?.7:0}),x,.5,0,1),1,1.1,1));
        if(i===2)for(const z of[-.014,.014]){const e=sh(new THREE.Mesh(new THREE.ConeGeometry(.009,.04,4),mat(c)));e.position.set(x-.005,.54,z);S.add(e)}
        if(i===3){const bk=sh(new THREE.Mesh(new THREE.ConeGeometry(.01,.03,4),mat('#2a1a12')));bk.position.set(x+.032,.495,0);bk.rotation.z=-Math.PI/2;S.add(bk)}});
      return bake(S)}},
    ton:{name:'voorraadpot',build(L){const S=new THREE.Group(),tc=mat('#b5653a',{roughness:.75});S.add(sh(new THREE.Mesh(new THREE.TorusGeometry(.12,.03,8,18),mat('#7a5a3a'))).rotateX(Math.PI/2).translateZ(-.03));
      const j=jar(.56,.2,tc,mat('#2c4f9a',{roughness:.6}));j.position.y=.02;S.add(...bake(j).children.map(c=>{c.position.y=.02;return c}));
      const b2=sh(new THREE.Mesh(new THREE.TorusGeometry(.17,.008,4,20),mat('#efe6d0')));b2.rotation.x=Math.PI/2;b2.position.y=.38;S.add(b2);
      S.add(sc(ball(.08,mat('#8c7a5a',{roughness:1}),0,.6,0,1),1,.55,1));
      for(let k=0;k<6;k++){const a=k/6*TAU;const d=box(.03,.05,.006,mat('#2c4f9a'),Math.cos(a)*.197,.24,Math.sin(a)*.197);d.rotation.y=-a+Math.PI/2;S.add(d)}return bake(S)}},
    hooibaal:{name:'graanzak',build(L){const S=new THREE.Group(),bm=new THREE.MeshStandardMaterial({map:T.burlap,roughness:1}),rp=mat('#7a5a2a');
      const sack=(x,z,s,ry)=>{const b=sc(ball(.17*s,bm,x,.15*s,z,2),1,1.15,.9);S.add(b);S.add(sc(ball(.07*s,bm,x,.33*s,z,1),1,1.3,1));
        const r=sh(new THREE.Mesh(new THREE.TorusGeometry(.05*s,.012,5,12),rp));r.rotation.x=Math.PI/2;r.position.set(x,.29*s,z);S.add(r)};
      sack(-.14,.08,1);sack(.16,-.04,.95);sack(.02,-.2,.8);
      const gr=mat('#e0b85a',{roughness:.9});for(let k=0;k<18;k++){const a=Math.random()*TAU,r=.1+Math.random()*.2;S.add(sc(ball(.012,gr,.25+Math.cos(a)*r*.5,.006,.2+Math.sin(a)*r*.4,0),1,.5,1.3))}
      S.add(sc(ball(.09,gr,.3,0,.22,1),1,.25,1));return bake(S)}},
    boom:{name:'dadelpalm',build(L){const g=new THREE.Group();g.add(cyl(.12,.14,.06,mat('#a88a62',{roughness:.95}),0,.03,0,12));
      const p=palm(1.15,Math.random,.12);g.add(p);return g}},
    struik:{name:'papyrusstruik',build(L){const g=new THREE.Group(),st=mat('#5f8a34',{roughness:.7}),um=new THREE.MeshStandardMaterial({color:'#8fb04a',side:THREE.DoubleSide,roughness:.8});
      g.add(sc(ball(.16,mat('#5a4a32',{roughness:1}),0,0,0,1),1,.3,1));
      for(let k=0;k<11;k++){const a=k*2.4,r=.04+(k%4)*.035,h=.45+((k*37)%10)/10*.35,s=new THREE.Group();s.position.set(Math.cos(a)*r,0,Math.sin(a)*r);
        s.rotation.z=Math.cos(a)*.18;s.rotation.x=Math.sin(a)*.18;const S=new THREE.Group();S.add(cyl(.008,.012,h,st,0,h/2,0,5));
        const u=sh(new THREE.Mesh(new THREE.ConeGeometry(.09,.11,10,1,true),um));u.position.y=h+.03;u.rotation.x=Math.PI;S.add(u);S.add(ball(.014,mat('#c9b45a'),0,h+.02,0,0));
        s.add(bake(S));s.userData.sway=[.06,1+k*.07,k];g.add(s)}return g}},
    bloemperk:{name:'lotusvijver',build(L,ctx){const g=new THREE.Group(),S=new THREE.Group(),st=new THREE.MeshStandardMaterial({map:T.relief2,color:'#e6caa0',roughness:.85});
      for(const s of[-1,1]){S.add(rbox(.86,.12,.08,.02,st,0,.06,s*.39));S.add(rbox(.08,.12,.7,.02,st,s*.39,.06,0))}
      for(const s of[-1,1])for(const t_ of[-1,1])S.add(rbox(.1,.15,.1,.02,mat('#e0c08e',{roughness:.7}),s*.39,.075,t_*.39));
      S.add(box(.72,.02,.72,mat('#3a5a40'),0,.02,0));g.add(bake(S));
      const wt=WATER.clone();wt.needsUpdate=true;wt.repeat.set(1.2,1.2);const water=new THREE.Mesh(new THREE.PlaneGeometry(.72,.72),new THREE.MeshStandardMaterial({color:'#2f8a86',map:wt,roughness:.06,metalness:.35,emissive:'#0a3a3a',transparent:true,opacity:.92}));
      water.rotation.x=-Math.PI/2;water.position.y=.085;water.receiveShadow=true;g.add(water);
      const pads=[],pm=mat('#3f7a2e',{roughness:.6,side:THREE.DoubleSide}),pk=mat('#f2a7c0',{roughness:.5}),wh=mat('#fbf4ea',{roughness:.5});
      for(let k=0;k<6;k++){const p=new THREE.Group();const a=k*1.7,r=.12+(k%3)*.08;p.position.set(Math.cos(a)*r,.09,Math.sin(a)*r);
        const disc=new THREE.Mesh(new THREE.CircleGeometry(.06+(k%2)*.02,14,.3,TAU-.5),pm);disc.rotation.x=-Math.PI/2;p.add(disc);
        if(k%2===0){const fl=new THREE.Group();for(let q=0;q<6;q++){const pe=sh(new THREE.Mesh(new THREE.ConeGeometry(.018,.06,4),k%4?pk:wh));pe.position.set(Math.cos(q)*.016,.03,Math.sin(q)*.016);pe.rotation.set(Math.sin(q)*.4,0,-Math.cos(q)*.4);fl.add(pe)}fl.add(ball(.012,mat('#f2c94c'),0,.03,0,0));p.add(bake(fl))}
        g.add(p);pads.push([p,k])}
      ctx.anim(t=>{wt.offset.set(Math.sin(t*.2)*.1,t*.015);for(const [p,k] of pads){p.rotation.y=Math.sin(t*.25+k)*.4;p.position.y=.09+Math.sin(t*1.1+k)*.004}});return g}},
    put:{name:'waterbekken',build(L,ctx){const g=new THREE.Group(),S=new THREE.Group(),st=new THREE.MeshStandardMaterial({map:stoneTex,color:'#dcc39a',roughness:.85});
      S.add(lathe([[0,0],[.3,0],[.33,.02],[.33,.2],[.36,.22],[.36,.25],[.29,.25],[.29,.06],[0,.06]],st,24));
      const ws=new THREE.Mesh(new THREE.CircleGeometry(.29,24),new THREE.MeshStandardMaterial({color:'#2b7f8a',roughness:.05,metalness:.4,emissive:'#083236',map:(()=>{const w=WATER.clone();w.needsUpdate=true;return w})()}));
      ws.rotation.x=-Math.PI/2;ws.position.y=.2;g.add(ws);
      // shaduf: a post with a swinging lever, bucket on one end and a mud counterweight on the other
      S.add(rbox(.07,.62,.07,.01,mat('#7a5a3a',{roughness:.9}),-.26,.31,-.26));S.add(box(.12,.04,.04,mat(DWOOD),-.26,.62,-.26));g.add(bake(S));
      const lev=new THREE.Group();lev.position.set(-.26,.64,-.26);lev.rotation.y=-Math.PI/4;const LS=new THREE.Group();const ar=cyl(.012,.014,.86,mat('#8a6a42'),0,0,0,6);ar.rotation.z=Math.PI/2;ar.position.x=.13;LS.add(ar);
      LS.add(sc(ball(.06,mat('#6a4a2e',{roughness:1}),-.28,-.02,0,1),1,.9,1));lev.add(bake(LS));
      const rope=new THREE.Group();rope.position.x=.55;rope.add(cyl(.003,.003,.3,mat('#3a2a1a'),0,-.15,0,4));rope.add(lathe([[0,0],[.035,0],[.045,.06],[.04,.07],[0,.07]],mat('#b5653a'),10,0,-.36,0));lev.add(rope);g.add(lev);
      const ph=Math.random()*6;ctx.anim(t=>{const a=Math.sin(t*.45+ph);lev.rotation.z=-.22+a*.2;rope.rotation.z=-lev.rotation.z;ws.material.map.offset.set(Math.sin(t*.3)*.05,t*.02)});return g}},
    kast:{name:'schrijn',build(L){const S=new THREE.Group(),gd=G(),sm_=new THREE.MeshStandardMaterial({map:T.shrine,roughness:.35,metalness:.45});
      S.add(rbox(.62,.06,.44,.02,mat(DWOOD),0,.03,0));S.add(sh(new THREE.Mesh(new THREE.BoxGeometry(.54,.7,.36),[sm_,sm_,gd,gd,sm_,sm_])));S.children[S.children.length-1].position.y=.41;
      S.add(box(.004,.62,.004,mat('#3a2a10'),0,.42,.181));for(const x of[-.04,.04])S.add(ball(.014,mat('#1d3f7a'),x,.42,.185,0));
      // cavetto cornice
      const cs=new THREE.Shape();cs.moveTo(-.3,0);cs.lineTo(.3,0);cs.quadraticCurveTo(.32,.06,.36,.1);cs.lineTo(-.36,.1);cs.quadraticCurveTo(-.32,.06,-.3,0);
      const cn=ext(cs,.46,new THREE.MeshStandardMaterial({map:T.cornice,roughness:.5}),.004);cn.position.set(0,.76,0);S.add(cn);
      S.add(rbox(.74,.03,.5,.01,gd,0,.875,0));for(let x=-.27;x<=.28;x+=.068){S.add(cyl(.009,.012,.04,gd,x,.91,.2,6));S.add(sc(ball(.016,gd,x,.94,.2,0),1,1.2,.6))}const B=bake(S);B.scale.setScalar(.86);return B}},
    boekenkast:{name:'papyrusrek',build(L){const S=new THREE.Group(),cd=mat('#8c5226',{roughness:.6});
      S.add(rbox(.72,.04,.34,.01,cd,0,.02,0));S.add(rbox(.72,.04,.34,.01,cd,0,.98,0));for(const x of[-.34,-.115,.115,.34])S.add(box(.03,.96,.32,cd,x,.5,0));
      for(const y of[.33,.66])S.add(box(.7,.025,.32,cd,0,y,0));S.add(box(.7,.96,.02,mat('#5a3418'),0,.5,-.15));
      const pp=[mat('#efe2bf',{roughness:.85}),mat('#e4d2a2',{roughness:.85}),mat('#f4ead0',{roughness:.85})],tie=mat('#b5302a');
      for(let s=0;s<3;s++)for(let c=0;c<3;c++){const cx=-.228+c*.228,y=.05+s*.33;let k=0;
        for(let r=0;r<3;r++)for(let q=0;q<(r===2?2:3-r%2);q++){if(Math.random()<.12)continue;const x=cx-.06+q*.055+(r%2)*.027;const sc_=cyl(.025,.025,.26,pp[(k++)%3],x,y+.027+r*.047,.02,10);sc_.rotation.x=Math.PI/2;S.add(sc_);
          if(k%3===0){const t=cyl(.027,.027,.015,tie,x,y+.027+r*.047,.02+(k%2?.04:-.04),10);t.rotation.x=Math.PI/2;S.add(t)}}}
      S.add(box(.72,.035,.02,mat('#e0b040',GOLD),0,.96,.17));return bake(S)}},
    harnas:{name:'Anubisbeeld',build(L,ctx){const g=new THREE.Group(),S=new THREE.Group(),bs=mat('#1d1b1f',{roughness:.32,metalness:.15}),gd=G(),nm=new THREE.MeshStandardMaterial({map:T.nemes,roughness:.35,metalness:.4});
      S.add(rbox(.38,.12,.38,.02,mat('#d6c3a0',{roughness:.5}),0,.06,0));S.add(box(.39,.025,.39,gd,0,.1,0));
      for(const z of[-.055,.055])S.add(cyl(.032,.038,.3,bs,.0+(z>0?.04:-.02),.27,z,8));for(const z of[-.055,.055])S.add(rbox(.1,.03,.06,.01,bs,(z>0?.06:0),.13,z));
      const kilt=sh(new THREE.Mesh(new THREE.CylinderGeometry(.075,.12,.17,4,1),new THREE.MeshStandardMaterial({map:T.nemes,roughness:.35,metalness:.5})));kilt.rotation.y=Math.PI/4;kilt.scale.set(1,1,.8);kilt.position.y=.46;S.add(kilt);
      S.add(sc(cyl(.08,.065,.22,bs,0,.64,0,10),1,1,.75));S.add(sh(new THREE.Mesh(new THREE.CylinderGeometry(.115,.115,.035,14,1,true),gd)).translateY(.74));
      for(const z of[-.1,.1]){S.add(cyl(.022,.02,.2,bs,.0,.63,z,6));S.add(cyl(.02,.018,.15,bs,.06,.53,z,6).rotateZ(-1.0))}
      S.add(cyl(.008,.008,.95,gd,.12,.47,.1,6));const wt=sh(new THREE.Mesh(new THREE.ConeGeometry(.02,.05,4),gd));wt.position.set(.13,.96,.1);wt.rotation.z=-.9;S.add(wt);
      // jackal head with tall ears and a striped headcloth
      S.add(sc(ball(.06,bs,0,.82,0,1),1,1.05,.95));const sn=sh(new THREE.Mesh(new THREE.CylinderGeometry(.018,.04,.13,6),bs));sn.rotation.z=-Math.PI/2+.25;sn.position.set(.08,.8,0);S.add(sn);
      for(const z of[-.03,.03]){const e=sh(new THREE.Mesh(new THREE.ConeGeometry(.022,.12,4),bs));e.position.set(-.01,.92,z);e.rotation.x=z*1.6;S.add(e);S.add(box(.004,.06,.01,gd,.0,.91,z))}
      for(const z of[-.055,.055])S.add(box(.04,.16,.03,nm,-.01,.72,z));S.add(box(.05,.16,.1,nm,-.05,.75,0));
      g.add(bake(S));const em=new THREE.MeshStandardMaterial({color:'#ffd27a',emissive:'#ffb020',emissiveIntensity:1.6});for(const z of[-.022,.022])g.add(ball(.009,em,.045,.84,z,0));
      ctx.anim(t=>{em.emissiveIntensity=1.2+Math.sin(t*.9)*.9});return g}},
    altaar:{name:'offertafel',build(L,ctx){const g=new THREE.Group(),S=new THREE.Group(),st=new THREE.MeshStandardMaterial({map:T.relief2,color:'#efe0c4',roughness:.6});
      S.add(rbox(.74,.36,.44,.02,st,0,.18,0));S.add(rbox(.8,.05,.5,.015,mat('#f1e6d0',{roughness:.45}),0,.385,0));S.add(box(.82,.02,.52,G(),0,.355,0));
      const br=mat('#c98b45',{roughness:.85});for(let k=0;k<4;k++)S.add(sc(ball(.05,br,-.18+k*.11,.44,.1,1),1.2,.55,1));
      S.add(sc(ball(.05,mat('#5a8a2a'),.0,.44,-.12,1),1.6,.6,1.1));for(let k=0;k<4;k++)S.add(ball(.024,mat('#6a2a6a',{roughness:.3}),-.04+k*.025,.47,-.12+(k%2)*.02,0));
      const pm=mat('#e8dcc4',{roughness:.3});for(const x of[-.28,.28]){S.add(lathe([[0,0],[.04,0],[.02,.04],[.018,.12],[.05,.16],[.055,.18],[0,.18]],G(),12,x,.41,-.12));S.add(sc(ball(.03,mat('#3a1a0a'),x,.59,-.12,0),1,.4,1))}
      S.add(lathe([[0,0],[.03,0],[.05,.05],[.04,.12],[.02,.16],[.03,.18],[0,.18]],pm,12,.27,.41,.12));
      const lo=new THREE.Group();for(let q=0;q<7;q++){const pe=sh(new THREE.Mesh(new THREE.ConeGeometry(.012,.07,4),mat('#5b8fd6')));pe.position.set(.27+Math.cos(q)*.008,.62,.12+Math.sin(q)*.008);pe.rotation.set(Math.sin(q)*.4,0,-Math.cos(q)*.4);S.add(pe)}
      g.add(bake(S));for(const x of[-.28,.28]){const sm_=smoke(HQ?26:12,.9,.09,'#efe6dc',.32,.08,.05);sm_.position.set(x,.6,-.12);g.add(sm_);g.add(flame(x,.59,-.12,.7))}return g}},
    kandelaar:{name:'vuurschaal',build(L){const g=new THREE.Group(),S=new THREE.Group(),bz=mat('#a8702e',{metalness:.85,roughness:.35});
      for(let k=0;k<3;k++){const a=k/3*TAU;const l=cyl(.012,.016,.56,bz,Math.cos(a)*.1,.27,Math.sin(a)*.1,6);l.rotation.set(Math.sin(a)*.22,0,-Math.cos(a)*.22);S.add(l);S.add(ball(.022,bz,Math.cos(a)*.16,.02,Math.sin(a)*.16,0))}
      S.add(sh(new THREE.Mesh(new THREE.TorusGeometry(.08,.008,5,16),bz)).rotateX(Math.PI/2).translateZ(-.25));
      S.add(lathe([[0,0],[.05,0],[.14,.06],[.17,.12],[.16,.12],[.13,.07],[0,.04]],bz,20,0,.52,0));S.add(sh(new THREE.Mesh(new THREE.TorusGeometry(.17,.012,6,22),G())).rotateX(Math.PI/2).translateZ(-.64));
      S.add(sc(ball(.12,mat('#2a1a10',{roughness:1}),0,.6,0,1),1,.3,1));g.add(bake(S));
      const coal=ball(.1,new THREE.MeshStandardMaterial({color:'#ff6a1a',emissive:'#ff4a00',emissiveIntensity:2.2,roughness:1}),0,.6,0,1);coal.scale.set(1,.28,1);g.add(coal);
      g.add(flame(0,.6,0,2.2));g.add(flame(.05,.6,.03,1.5));
      const sm_=smoke(HQ?24:10,1.2,.12,'#6a5a4e',.22,.07,.08);sm_.position.y=.75;g.add(sm_);return g}},
    wapenrek:{name:'speerrek',build(L){const S=new THREE.Group(),cd=mat('#7a4a26',{roughness:.6}),br=mat('#c08a3a',{metalness:.85,roughness:.3});
      S.add(rbox(.74,.05,.24,.01,cd,0,.025,0));for(const x of[-.33,.33])S.add(box(.05,.82,.05,cd,x,.43,0));S.add(box(.72,.04,.06,cd,0,.76,0));S.add(box(.72,.04,.06,cd,0,.3,0));
      for(const x of[-.22,-.1,.02]){S.add(cyl(.01,.01,.9,mat('#6a4a2a'),x,.47,.04,6));const tp=sh(new THREE.Mesh(new THREE.ConeGeometry(.022,.1,4),br));tp.position.set(x,.96,.04);S.add(tp)}
      // khopesh: a sickle sword
      const ks=new THREE.Shape();ks.moveTo(0,0);ks.lineTo(.018,0);ks.lineTo(.018,.18);ks.quadraticCurveTo(.13,.2,.13,.33);ks.quadraticCurveTo(.1,.24,.0,.22);ks.closePath();
      const k1=ext(ks,.01,br,.003);k1.position.set(.14,.36,.05);S.add(k1);S.add(box(.03,.12,.02,mat('#2a1a12'),.149,.31,.05));
      const sd=sc(ball(.15,mat('#efe6d0',{roughness:.9}),.27,.48,.07,2),.75,1.15,.14);S.add(sd);S.add(sc(ball(.06,mat('#3a2a1a',{roughness:.9}),.27,.53,.085,1),.9,.8,.18));
      return bake(S)}},
    wijnrek:{name:'amforenrek',build(L){const S=new THREE.Group(),cd=mat('#7a4a26',{roughness:.6}),tc=[mat('#b5653a',{roughness:.7}),mat('#c9845a',{roughness:.7})];
      S.add(rbox(.76,.04,.32,.01,cd,0,.3,0));S.add(rbox(.76,.04,.32,.01,cd,0,.02,0));for(const x of[-.35,.35])for(const z of[-.13,.13])S.add(box(.04,.46,.04,cd,x,.23,z));
      for(let k=0;k<4;k++){const a=amphora(.5,.075,tc[k%2]);a.position.set(-.27+k*.18,.12,0);S.add(a);
        for(const s of[-1,1]){const h=sh(new THREE.Mesh(new THREE.TorusGeometry(.03,.006,4,8,Math.PI),tc[k%2]));h.position.set(-.27+k*.18+s*.03,.12+.44,0);h.rotation.z=s*Math.PI/2;h.rotation.y=Math.PI/2;S.add(h)}
        S.add(box(.12,.02,.02,mat('#2c4f9a'),-.27+k*.18,.36,.07))}
      return bake(S)}},
  },
  env(ctx){const {world,N,H,E,rand}=ctx;const R=rand;
  const gold=mat('#f0c050',{metalness:.95,roughness:.18});
  // ---------- desert ground: dunes with sharp crests, a riverbed for the Nile behind the temple ----------
  const ZR=-(H+7.6);const rc=x=>ZR-Math.sin(x*.07)*1.3;
  function dune(x,z){const r=Math.max(Math.abs(x),Math.abs(z)),m=sm(H+2.6,H+11,r);
    const u=x*.085+Math.sin(z*.06)*1.4+Math.sin(z*.021+1.3)*2.2,s=fr(u),p=s<.78?Math.pow(s/.78,1.6):Math.pow((1-s)/.22,1.2);
    const v=z*.11+x*.04+Math.sin(x*.05)*1.1,s2=fr(v),p2=s2<.7?Math.pow(s2/.7,1.5):Math.pow((1-s2)/.3,1.3);
    let h=(2.6*p*(.6+.4*Math.sin(z*.05+x*.02))+1.0*p2+.7*Math.sin(x*.03+z*.045)+.6)*m*(1+sm(20,60,r)*1.4);
    const dr=Math.abs(z-rc(x));h*=sm(2.4,7,dr);h-=.85;if(dr<2)h-=(1-dr/2)*.6;return h}
  {const seg=HQ?230:140,ext_=120;const gg=new THREE.PlaneGeometry(2,2,seg,seg);gg.rotateX(-Math.PI/2);const p=gg.attributes.position,uv=gg.attributes.uv;const col=[];
   const warp=t=>ext_*(.22*t+.78*t*t*t);const cS=new THREE.Color('#dba862'),cC=new THREE.Color('#f2d29a'),cT=new THREE.Color('#bd8448'),cG=new THREE.Color('#6d8a36'),cM=new THREE.Color('#7a5e3c'),c=new THREE.Color();
   for(let i=0;i<p.count;i++){const x=warp(p.getX(i)),z=warp(p.getZ(i));const y=dune(x,z);p.setXYZ(i,x,y,z);uv.setXY(i,x*.32,z*.32);
     const hn=(dune(x+.6,z)-dune(x-.6,z));c.copy(cS).lerp(hn<0?cC:cT,Math.min(1,Math.abs(hn)*.9));const dr=Math.abs(z-rc(x));
     if(dr<4.2)c.lerp(cG,sm(4.2,2.2,dr)*(.85+.15*Math.sin(x*1.3)));if(dr<1.7)c.lerp(cM,sm(1.7,1.1,dr));col.push(c.r,c.g,c.b)}
   gg.setAttribute('color',new THREE.Float32BufferAttribute(col,3));gg.computeVertexNormals();
   const ground=new THREE.Mesh(gg,new THREE.MeshStandardMaterial({vertexColors:true,map:T.ripple,bumpMap:T.ripple,bumpScale:2.2,roughness:.95}));T.ripple.repeat.set(1,1);ground.receiveShadow=true;world.add(ground)}
  // the Nile: one long water plane, only visible inside the riverbed
  const wt=WATER.clone();wt.needsUpdate=true;wt.repeat.set(40,2);
  const river=new THREE.Mesh(new THREE.PlaneGeometry(240,9),new THREE.MeshStandardMaterial({color:'#2f8c8e',map:wt,roughness:.05,metalness:.35,emissive:'#0b3a3e',emissiveIntensity:.9}));
  river.rotation.x=-Math.PI/2;river.position.set(0,-1.1,ZR);world.add(river);
  // ---------- temple platform: three steps of sandstone, paved top ----------
  const pav=new THREE.MeshStandardMaterial({map:T.pave,color:'#f0dcc0',roughness:.9}),side=new THREE.MeshStandardMaterial({map:stoneTex,color:'#d6b27e',roughness:.95});
  const zb=-(E+2.2),zf=E+1.3,xw=E+1.35;
  for(const [k,top] of [[0,-.12],[1,-.36],[2,-.6]]){const w=2*xw+k*.6,d=(zf-zb)+k*.6;const s=roundRect(w,d,.18);const gg=new THREE.ExtrudeGeometry(s,{depth:.24+(k===2?.3:0),bevelEnabled:true,bevelThickness:.02,bevelSize:.02,bevelSegments:1,curveSegments:3});
    gg.rotateX(-Math.PI/2);const m=new THREE.Mesh(gg,[pav,side]);m.position.set(0,top-.26-(k===2?.3:0),(zb+zf)/2);m.receiveShadow=true;m.castShadow=k===0;world.add(m)}
  // ---------- enclosure wall with a painted glyph frieze and cavetto cornice, a gate in front ----------
  const fz=T.frieze;fz.repeat.set((N+.5)/1.25,1);const wm=new THREE.MeshStandardMaterial({map:fz,roughness:.88}),cm=new THREE.MeshStandardMaterial({map:T.cornice,roughness:.6});T.cornice.repeat.set(N*1.2,1);
  const wh=.36;for(const s of[-1,1]){
    if(s===1){const half=(N+.5-1.1)/2;for(const q of[-1,1]){world.add(box(half,wh,.24,wm,q*(1.1/2+half/2),wh/2-.12,E));world.add(box(half+.02,.06,.32,cm,q*(1.1/2+half/2),wh-.09,E))}}
    else{world.add(box(N+.5,wh,.24,wm,0,wh/2-.12,-E));world.add(box(N+.54,.06,.32,cm,0,wh-.09,-E))}
    world.add(box(.24,wh,N+.5,wm,s*E,wh/2-.12,0));world.add(box(.32,.06,N+.54,cm,s*E,wh-.09,0))}
  // gate: two small pylons with banners
  const pyl=(w0,w1,h,d,mtl)=>{const s=new THREE.Shape();s.moveTo(-w0/2,0);s.lineTo(w0/2,0);s.lineTo(w1/2,h);s.lineTo(-w1/2,h);s.closePath();const m=ext(s,d,mtl,.012,2);return m};
  const rp=T.relief2.clone();rp.needsUpdate=true;rp.wrapS=rp.wrapT=THREE.RepeatWrapping;rp.repeat.set(1/.5,1/.8);rp.offset.set(.5,0);const gm=new THREE.MeshStandardMaterial({map:rp,roughness:.85});
  const flagsA=[];const flag=(x,y,z,len,color)=>{const geo=new THREE.PlaneGeometry(len,.09,10,1);geo.translate(len/2,0,0);const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color,side:THREE.DoubleSide,roughness:.8}));
    m.position.set(x,y,z);m.rotation.y=Math.PI*.15;world.add(m);flagsA.push({m,base:Float32Array.from(geo.attributes.position.array),ph:R()*6})};
  for(const s of[-1,1]){const m=pyl(.55,.44,.78,.36,gm);m.position.set(s*.73,-.12,E);world.add(m);world.add(box(.5,.05,.4,cm,s*.73,.68,E));
    world.add(cyl(.012,.015,1.5,mat('#6a4a2a'),s*.73+s*.2,.6,E+.2,6));flag(s*.73+s*.2,1.28,E+.2,.6,'#b5302a');flag(s*.73+s*.2,1.15,E+.2,.45,'#e0b040')}
  world.add(box(.95,.06,.4,cm,0,.62,E));world.add(box(.98,.05,.42,mat('#e0b040',GOLD),0,.58,E));
  // ---------- the great pylon behind the board ----------
  const Wp=Math.min(N*.82,7.2),tw=(Wp-1.1)/2,ph_=2.3,zP=-(E+.95);
  const pt=T.pylon.clone();pt.needsUpdate=true;pt.wrapS=pt.wrapT=THREE.ClampToEdgeWrapping;pt.repeat.set(1/tw,1/ph_);pt.offset.set(.5,0);const pm=new THREE.MeshStandardMaterial({map:pt,roughness:.85});
  for(const s of[-1,1]){const m=pyl(tw,tw*.86,ph_,.7,[pm,side]);m.position.set(s*(.55+tw/2),-.12,zP);world.add(m);
    const cs=new THREE.Shape();cs.moveTo(-tw*.43,0);cs.lineTo(tw*.43,0);cs.quadraticCurveTo(tw*.45,.12,tw*.47+.08,.2);cs.lineTo(-tw*.47-.08,.2);cs.quadraticCurveTo(-tw*.45,.12,-tw*.43,0);
    const tc=T.cornice.clone();tc.needsUpdate=true;tc.repeat.set(tw*1.5,4);const cn=ext(cs,.66,new THREE.MeshStandardMaterial({map:tc,roughness:.6}),.01);cn.position.set(s*(.55+tw/2),ph_-.12,zP);world.add(cn);
    for(const q of[-1,1]){const fx=s*(.55+tw/2)+q*tw*.22;world.add(cyl(.02,.028,3.4,mat('#5a3a20'),fx,1.5,zP+.4,6));flag(fx,3.05,zP+.4,1.2,q<0?'#b5302a':'#2f8a6a');flag(fx,2.9,zP+.4,.85,'#e0b040')}}
  world.add(box(1.1,1.65,.5,side,0,.7,zP));world.add(box(.7,1.25,.52,mat('#3a2614'),0,.51,zP));
  {const wg=new THREE.Shape();wg.moveTo(-.65,0);wg.quadraticCurveTo(-.3,.16,0,.08);wg.quadraticCurveTo(.3,.16,.65,0);wg.lineTo(.6,-.08);wg.quadraticCurveTo(.3,.04,0,-.03);wg.quadraticCurveTo(-.3,.04,-.6,-.08);wg.closePath();
   const w=ext(wg,.04,mat('#2c6fb0',{roughness:.4}),.008);w.position.set(0,1.38,zP+.28);world.add(w);world.add(cyl(.12,.12,.06,mat('#e0b040',GOLD),0,1.4,zP+.3,20).rotateX(Math.PI/2))}
  world.add(box(1.25,.12,.56,cm,0,1.58,zP));
  // ---------- seated colossi beside the pylon ----------
  const sst=new THREE.MeshStandardMaterial({map:stoneTex,color:'#d9b47e',roughness:.92}),nm=new THREE.MeshStandardMaterial({map:T.nemes,roughness:.6});
  // Osiride colossi: mummiform kings with crossed arms, crook and flail, striped nemes and the white crown
  const colossus=(x,z,s)=>{const g=new THREE.Group();
    g.add(rbox(.95,.28,.95,.06,side,0,.14,0,.02));g.add(rbox(.8,.08,.8,.04,sst,0,.32,0));
    g.add(lathe([[0,0],[.3,0],[.31,.05],[.27,.12],[.25,.3],[.27,.7],[.3,1.1],[.33,1.35],[.36,1.5],[.37,1.58],[.3,1.64],[.14,1.68],[0,1.68]],sst,24,0,.36,0));
    g.children[g.children.length-1].scale.set(1,1,.72);
    const bp=sc(ball(.2,nm,0,2.12,-.03,1),1.15,1,.9);g.add(bp);
    for(const q of[-1,1]){const lap=rbox(.1,.36,.05,.02,nm,q*.17,1.86,.15,.01);lap.rotation.x=-.12;g.add(lap)}
    g.add(sc(ball(.14,sst,0,2.12,.06,1),.9,1.1,1));g.add(box(.04,.13,.05,sst,0,1.96,.17));
    for(const q of[-1,1]){const a=sc(ball(.08,sst,q*.08,1.62,.2,1),1.6,.6,.7);a.rotation.z=q*.6;g.add(a)}
    g.add(cyl(.016,.016,.6,gold,-.07,1.66,.26,6).rotateZ(.5));g.add(cyl(.016,.016,.6,gold,.07,1.66,.26,6).rotateZ(-.5));
    g.add(sh(new THREE.Mesh(new THREE.TorusGeometry(.06,.016,5,10,Math.PI*1.2),gold)).translateX(-.2).translateY(1.95).translateZ(.28));
    g.add(lathe([[0,0],[.13,0],[.12,.1],[.09,.25],[.06,.34],[.045,.38],[0,.4]],mat('#efe6d0',{roughness:.6}),16,0,2.22,0));
    g.add(sh(new THREE.Mesh(new THREE.TorusGeometry(.135,.022,6,18),gold)).rotateX(Math.PI/2).translateZ(-2.23));
    const ur=sh(new THREE.Mesh(new THREE.CylinderGeometry(.018,.03,.12,6),gold));ur.position.set(0,2.28,.14);ur.rotation.x=.4;g.add(ur);
    const B=bake(g);B.position.set(x,-.12,z);B.scale.setScalar(s*1.2);world.add(B)};
  const cS=N<=6?.82:1;for(const s of[-1,1])colossus(s*(Wp/2+.62*cS+.1),zP+.05,cS);
  // ---------- side colonnades: papyrus-bundle columns with lotus capitals, instanced ----------
  {const ch=1.45,cols=[];for(const s of[-1,1]){const n=Math.max(3,Math.round(N/1.6));for(let i=0;i<n;i++)cols.push([s*(E+.72),-H+.6+i*(N-1.4)/(n-1)])}
   const sg=new THREE.CylinderGeometry(.13,.15,ch*.8,32,8);{const p=sg.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),a=Math.atan2(z,x),k=1+.08*Math.cos(a*8);const y=p.getY(i);const nk=y<-ch*.36?.85+.15*((y+ch*.4)/(ch*.04)):1;p.setX(i,x*k*nk);p.setZ(i,z*k*nk)}sg.computeVertexNormals();sg.translate(0,ch*.4+.06,0)}
   const capG=new THREE.LatheGeometry([[.13,0],[.15,.05],[.22,.18],[.27,.28],[.26,.3],[.15,.3]].map(p=>new THREE.Vector2(p[0],p[1])),24);capG.translate(0,ch*.8+.06,0);
   const baseG=mergeGeometries([new THREE.CylinderGeometry(.21,.22,.06,24).translate(0,.03,0).toNonIndexed(),new THREE.BoxGeometry(.36,.09,.36).translate(0,ch*.8+.06+.345,0).toNonIndexed()].map(g=>{for(const k of Object.keys(g.attributes))if(!['position','normal','uv'].includes(k))g.deleteAttribute(k);return g}));
   const sM=new THREE.MeshStandardMaterial({map:T.shaft,roughness:.85}),cM=new THREE.MeshStandardMaterial({map:T.capital,roughness:.6,side:THREE.DoubleSide}),bM=new THREE.MeshStandardMaterial({map:stoneTex,color:'#dcbf8e',roughness:.9});
   const dm=new THREE.Object3D();for(const [g_,m_] of [[sg,sM],[capG,cM],[baseG,bM]]){const im=new THREE.InstancedMesh(g_,m_,cols.length);cols.forEach(([x,z],i)=>{dm.position.set(x,-.12,z);dm.rotation.y=i*1.3;dm.updateMatrix();im.setMatrixAt(i,dm.matrix)});
     im.castShadow=im.receiveShadow=true;im.frustumCulled=false;world.add(im)}
   for(const s of[-1,1]){world.add(box(.34,.16,N-.8,new THREE.MeshStandardMaterial({map:T.frieze,roughness:.85}),s*(E+.72),-.12+ch+.06+.39+.08,-H+.6+(N-1.4)/2));world.add(box(.38,.05,N-.75,cm,s*(E+.72),-.12+ch+.06+.39+.18,-H+.6+(N-1.4)/2))}}
  // ---------- obelisks at the front corners, braziers, sphinxes guarding the gate ----------
  const om=new THREE.MeshStandardMaterial({map:T.obelisk,roughness:.8});
  for(const s of[-1,1]){const x=s*(E+.85),z=E+.78;world.add(rbox(.5,.16,.5,.02,side,x,-.04,z));const og=new THREE.CylinderGeometry(.11,.17,2.3,4,1);og.rotateY(Math.PI/4);const o=sh(new THREE.Mesh(og,om));o.position.set(x,1.19,z);world.add(o);
    const py=sh(new THREE.Mesh(new THREE.ConeGeometry(.155,.26,4),gold));py.rotation.y=Math.PI/4;py.position.set(x,2.47,z);world.add(py)}
  for(const s of[-1,1]){const g=sphinx(sst,nm);g.position.set(s*1.55,-.12,E+.78);g.rotation.y=-Math.PI/2;g.scale.setScalar(.85);world.add(g)}
  const braz=(x,z)=>{const g=new THREE.Group();g.add(cyl(.09,.13,.5,side,0,.25,0,10));g.add(lathe([[0,0],[.08,0],[.17,.08],[.19,.13],[.17,.13],[0,.06]],mat('#a8702e',{metalness:.85,roughness:.35}),18,0,.5,0));
    const coal=ball(.13,new THREE.MeshStandardMaterial({color:'#ff6a1a',emissive:'#ff4a00',emissiveIntensity:2.2}),0,.6,0,1);coal.scale.set(1,.25,1);g.add(coal);g.add(flame(0,.6,0,4.5));g.add(flame(.06,.6,.04,3));
    const sm_=smoke(HQ?30:12,1.8,.16,'#5e5048',.2,.06,.12);sm_.position.y=.8;g.add(sm_);g.position.set(x,-.12,z);world.add(g)};
  for(const s of[-1,1]){braz(s*(E+.72),H+.25);braz(s*(Wp/2+1.45),zP+.75)}
  // ---------- date palms along the river and beside the temple ----------
  const palms=[];const addPalm=(x,z,h)=>{const y=dune(x,z);const p=palm(h,R,.18+R()*.25);p.position.set(x,y-.05,z);world.add(p);palms.push(p)};
  for(let k=0;k<(HQ?16:9);k++){const x=(R()*2-1)*(H+9),side_=R()<.55?1:-1,z=rc(x)+side_*(2.3+R()*1.6);if(Math.abs(x)<Wp/2+2&&side_>0&&z>zb-1)continue;addPalm(x,z,2.2+R()*1.3)}
  for(const s of[-1,1]){addPalm(s*(xw+1.4+R()*.6),-H+R()*1.5,2.4+R()*.8);addPalm(s*(xw+2.2+R()*.8),H*.3+R()*2,2.0+R()*.8);if(HQ)addPalm(s*(xw+1.0),zb-1.2,2.6)}
  // reeds along both banks: one mesh, swaying in the vertex shader
  {const P=[],A=[],n=HQ?2600:1100;for(let k=0;k<n;k++){const t=R()*2-1,x=Math.sign(t)*Math.pow(Math.abs(t),1.6)*50,s=R()<.5?-1:1,z=rc(x)+s*(1.05+R()*.9),y=dune(x,z),h=.35+R()*.6,a=R()*TAU,w=.025;
     const lx=(R()-.5)*.25,lz=(R()-.5)*.25;P.push(x-Math.cos(a)*w,y,z-Math.sin(a)*w,x+Math.cos(a)*w,y,z+Math.sin(a)*w,x+lx*h,y+h,z+lz*h);A.push(0,0,1)}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('aSw',new THREE.Float32BufferAttribute(A,1));g.computeVertexNormals();
   const m=new THREE.MeshStandardMaterial({color:'#7d9a3c',side:THREE.DoubleSide,roughness:.8});m.onBeforeCompile=s=>{s.uniforms.uT=U.t;s.vertexShader='uniform float uT;attribute float aSw;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nfloat sw=aSw*aSw;transformed.x+=sin(uT*1.4+position.x*.6+position.z*.4)*.08*sw;transformed.z+=cos(uT*1.1+position.x*.4)*.04*sw;')};
   const reeds=new THREE.Mesh(g,m);reeds.receiveShadow=true;world.add(reeds)}
  // ---------- pyramids and a far obelisk on the horizon ----------
  for(const [x,z,r,h,cap] of [[-14,-(H+34),11,13,1],[4,-(H+44),8,9.5,0],[16,-(H+38),5,5.6,0]]){const y=dune(x,z)-1.2;const p=new THREE.Mesh(new THREE.ConeGeometry(r,h,4,1),new THREE.MeshStandardMaterial({color:'#e3bb7c',roughness:.95,flatShading:true}));
    p.rotation.y=Math.PI/4+.3;p.position.set(x,y+h/2,z);world.add(p);if(cap){const c=new THREE.Mesh(new THREE.ConeGeometry(r*.1,h*.1,4,1),gold);c.rotation.y=Math.PI/4+.3;c.position.set(x,y+h*.95,z);world.add(c)}}
  {const x=22,z=-(H+20),y=dune(x,z);const o=new THREE.Mesh(new THREE.CylinderGeometry(.35,.55,7,4),om);o.rotation.y=.6;o.position.set(x,y+3.3,z);world.add(o)}
  // the sun: a hot glare disc in the sky, only seen when the view tilts up
  {const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:SOFT,color:new THREE.Color('#fff4d8').multiplyScalar(3),blending:THREE.AdditiveBlending,depthWrite:false,fog:false,transparent:true}));
   sp.position.set(-10,7.2,-3.5).normalize().multiplyScalar(150);sp.scale.setScalar(26);world.add(sp)}
  // heat haze: a shimmering band where the far dunes meet the sky
  {const g=new THREE.CylinderGeometry(42,42,9,64,1,true);g.translate(0,3,0);const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.BackSide,fog:false,uniforms:{uT:U.t},
     vertexShader:`varying vec2 vU;varying vec3 vP;void main(){vU=uv;vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
     fragmentShader:`uniform float uT;varying vec2 vU;varying vec3 vP;void main(){float y=vU.y;float w=sin(vU.x*420.+uT*1.7+sin(y*40.-uT*2.3)*2.)*.5+.5;float s=sin(y*90.-uT*3.)*.5+.5;
       float a=pow(1.-y,2.2)*(.38+.12*w+.1*s);gl_FragColor=vec4(vec3(.98,.92,.80),a*.55);}`});
   const hz=new THREE.Mesh(g,m);hz.renderOrder=-2;hz.position.y=-1;world.add(hz)}
  // blowing sand: a low drift of grains streaming downwind
  {const n=HQ?2600:700,p=new Float32Array(n*3),s=new Float32Array(n);for(let i=0;i<n;i++){p[i*3]=(R()*2-1)*30;p[i*3+1]=-.8+Math.pow(R(),2.5)*2.6;p[i*3+2]=-22+R()*30;s[i]=R()}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('aSeed',new THREE.BufferAttribute(s,1));
   const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uT:U.t,uM:{value:SOFT}},
     vertexShader:`attribute float aSeed;uniform float uT;varying float vA;void main(){vec3 q=position;float sp=1.6+aSeed*2.2;q.x=mod(q.x+uT*sp+30.,60.)-30.;q.y+=sin(uT*1.3+aSeed*30.+q.x*.4)*.12;q.z+=sin(uT*.7+aSeed*20.)*.3;
       vec4 mv=modelViewMatrix*vec4(q,1.);gl_Position=projectionMatrix*mv;gl_PointSize=min(5.,(1.+aSeed*1.6)*(34./-mv.z));vA=smoothstep(30.,24.,abs(q.x))*(.35+.4*aSeed);}`,
     fragmentShader:`uniform sampler2D uM;varying float vA;void main(){float a=texture2D(uM,gl_PointCoord).r*vA;if(a<.01)discard;gl_FragColor=vec4(.97,.86,.62,a);}`});
   const pts=new THREE.Points(g,m);pts.frustumCulled=false;world.add(pts)}
  // ---------- life: felucca and skiff on the Nile, vultures and a falcon, a scarab with its dung ball, a camel caravan ----------
  const boats=[];
  {const mk=(big)=>{const g=new THREE.Group(),S=new THREE.Group(),hull=mat(big?'#7a4a26':'#9a8a4a',{roughness:.7});
     const hg=new THREE.SphereGeometry(1,18,8,0,TAU,Math.PI/2,Math.PI/2);const h=new THREE.Mesh(hg,hull);h.scale.set(big?.9:.6,big?.28:.16,big?.26:.16);h.material.side=THREE.DoubleSide;S.add(h);
     S.add(sc(sh(new THREE.Mesh(new THREE.TorusGeometry(1,.03,5,24),mat(big?'#c9a35e':'#c9b45a'))),big?.9:.6,big?.26:.16,1).rotateX(Math.PI/2));
     if(big){S.add(cyl(.018,.022,1.6,mat('#5a3a20'),.18,.75,0,6));S.add(box(.18,.12,.1,mat('#efe6d0'),-.45,.08,0));S.add(sc(ball(.05,mat('#3a2a20'),-.3,.18,0,1),1,1.6,1));S.add(ball(.035,mat('#8a5a3a'),-.3,.28,0,0))}
     else{S.add(sc(ball(.04,mat('#efe6d0'),.05,.12,0,1),1,1.8,1));S.add(ball(.03,mat('#7a4a2a'),.05,.22,0,0));const pole=cyl(.006,.006,.9,mat('#5a3a20'),.1,.2,0,4);pole.rotation.z=-.5;S.add(pole)}
     g.add(bake(S));let sail=null;
     if(big){const yard=cyl(.012,.012,2.2,mat('#5a3a20'),.18,1.0,0,5);yard.rotation.z=-1.05;g.add(yard);
       const sg=new THREE.BufferGeometry(),A=new THREE.Vector3(.18+Math.sin(1.05)*1.1,1.0+Math.cos(1.05)*1.1,0),B=new THREE.Vector3(.18-Math.sin(1.05)*1.1,1.0-Math.cos(1.05)*1.1,0),C=new THREE.Vector3(.2,.12,0);
       const P=[],n=6;for(let i=0;i<n;i++)for(let j=0;j<n-i;j++){const v=(a,b)=>{const c=1-a-b;return [A.x*a+B.x*b+C.x*c,A.y*a+B.y*b+C.y*c,0]};const q=(a,b)=>v(a/n,b/n);P.push(...q(i,j),...q(i+1,j),...q(i,j+1));if(j<n-i-1)P.push(...q(i+1,j),...q(i+1,j+1),...q(i,j+1))}
       sg.setAttribute('position',new THREE.Float32BufferAttribute(P,3));sg.computeVertexNormals();sail=new THREE.Mesh(sg,new THREE.MeshStandardMaterial({color:'#f4ede0',side:THREE.DoubleSide,roughness:.85}));sail.castShadow=true;
       sail.userData.base=Float32Array.from(P);g.add(sail)}
     world.add(g);return {g,sail}};
   boats.push({...mk(true),sp:.32,off:R()*60,dir:1,s:1.25});boats.push({...mk(false),sp:.18,off:R()*60,dir:-1,s:1.1})}
  const birds=[];
  {const wingS=new THREE.Shape();wingS.moveTo(0,0);wingS.lineTo(.62,.05);wingS.lineTo(.7,-.04);wingS.lineTo(.62,-.08);wingS.lineTo(.66,-.14);wingS.lineTo(.5,-.14);wingS.lineTo(.52,-.2);wingS.lineTo(.2,-.2);wingS.lineTo(0,-.12);wingS.closePath();
   const wg=new THREE.ShapeGeometry(wingS);wg.rotateX(-Math.PI/2);
   const mk=(dark,s)=>{const g=new THREE.Group();const m=mat(dark,{roughness:.9,side:THREE.DoubleSide});g.add(sc(ball(.08,m,0,0,0,1),2.2,.8,.9));g.add(ball(.045,mat(s<.8?'#d9b47e':'#e8d8c8'),.2,.02,0,0));
     const tl=new THREE.Mesh(new THREE.ConeGeometry(.07,.2,3),m);tl.rotation.z=Math.PI/2;tl.scale.set(1,1,.3);tl.position.x=-.22;g.add(tl);
     const L_=new THREE.Mesh(wg,m),R_=new THREE.Mesh(wg,m);L_.position.set(.05,0,.04);R_.position.set(.05,0,-.04);R_.scale.z=-1;L_.rotation.y=Math.PI/2;R_.rotation.y=-Math.PI/2;
     const lw=new THREE.Group(),rw=new THREE.Group();lw.add(L_);rw.add(R_);L_.rotation.set(0,0,0);R_.rotation.set(0,0,0);L_.geometry=wg;L_.scale.set(1,1,1);R_.scale.set(1,1,-1);
     lw.position.set(.05,0,.03);rw.position.set(.05,0,-.03);L_.position.set(0,0,0);R_.position.set(0,0,0);L_.rotation.y=-Math.PI/2;R_.rotation.y=-Math.PI/2;g.add(lw,rw);
     g.scale.setScalar(s);world.add(g);return {g,lw,rw}};
   for(let k=0;k<3;k++)birds.push({...mk('#2e241e',1.25),r:6+k*1.6,cx:-2+k,cz:-(H+4),y:6.5+k*.9,sp:.12+k*.02,ph:k*2.1});
   birds.push({...mk('#6a4a32',.7),r:11,cx:3,cz:-(H+1),y:5,sp:-.2,ph:1})}
  // scarab beetle rolling its dung ball along the front terrace
  let scarab;{const g=new THREE.Group(),S=new THREE.Group(),sc_=mat('#1a2a2a',{metalness:.7,roughness:.25,color:'#1f3a3a'});S.add(sc(ball(.05,sc_,0,.03,0,2),1.3,.55,1));S.add(sc(ball(.025,sc_,.07,.025,0,1),1,.6,1.2));
   S.add(box(.004,.01,.09,mat('#000'),0,.055,0).rotateY(Math.PI/2));g.add(bake(S));const legs=[];for(const x of[-.04,0,.04])for(const s of[-1,1]){const l=cyl(.004,.004,.07,sc_,0,0,0,4);l.rotation.x=s*1.2;const lg=new THREE.Group();lg.position.set(x,.02,s*.03);l.position.z=s*.03;lg.add(l);g.add(lg);legs.push([lg,x,s])}
   const ballM=sh(new THREE.Mesh(new THREE.IcosahedronGeometry(.06,1),mat('#6a4a2a',{roughness:1,flatShading:true})));ballM.position.set(-.11,.06,0);g.add(ballM);g.scale.setScalar(1.3);world.add(g);scarab={g,legs,ballM}}
  // a distant camel caravan crossing the dunes beyond the river
  const caravan=[];for(let k=0;k<(HQ?5:3);k++){const c=camel();c.g.scale.setScalar(1.6);world.add(c.g);caravan.push({c,off:k*1.7})}
  // banners and anything else that waves
  const v3=new THREE.Vector3();
  ctx.anim((t,dt)=>{U.t.value=t;wt.offset.set(t*.03,Math.sin(t*.2)*.05);river.material.emissiveIntensity=.85+Math.sin(t*.6)*.12;
    for(const f of flagsA){const p=f.m.geometry.attributes.position;for(let i=0;i<p.count;i++){const x=f.base[i*3];p.setZ(i,Math.sin(x*7-t*4+f.ph)*.05*x*1.4);p.setY(i,f.base[i*3+1]-x*x*.05)}p.needsUpdate=true;f.m.geometry.computeVertexNormals()}
    for(const b of boats){const L=70;const x=((b.off+t*b.sp*b.dir)%L+L)%L-L/2;const z=rc(x);b.g.position.set(x,-1.1+Math.sin(t*1.2+b.off)*.025,z);b.g.scale.setScalar(b.s);
      const dz=rc(x+.5)-z;b.g.rotation.set(Math.sin(t*.9+b.off)*.04,-Math.atan2(dz,.5)+(b.dir<0?Math.PI:0),Math.sin(t*.7)*.02);
      if(b.sail){const p=b.sail.geometry.attributes.position,B=b.sail.userData.base;for(let i=0;i<p.count;i++){const x=B[i*3],y=B[i*3+1];const k=Math.max(0,1-Math.abs(x-.2)*.6)*Math.min(1,y);p.setZ(i,k*(.18+Math.sin(t*1.5+y*2)*.03))}p.needsUpdate=true;b.sail.geometry.computeVertexNormals()}}
    for(const b of birds){const a=t*b.sp+b.ph;b.g.position.set(b.cx+Math.cos(a)*b.r,b.y+Math.sin(a*2.3)*.3,b.cz+Math.sin(a)*b.r);b.g.rotation.set(Math.sign(b.sp)*.35,-a-Math.sign(b.sp)*Math.PI/2,0,'YXZ');
      const fl=Math.sin(a*7)>.6?Math.sin(t*9+b.ph)*.5:.08+Math.sin(t*.8+b.ph)*.05;b.lw.rotation.x=fl;b.rw.rotation.x=-fl}
    {const span=2*E,sp=.09,d=(t*sp)%(2*span),fwd=d<span,x=fwd?-E+d:E-(d-span),z=E+1.08;scarab.g.position.set(x,-.12,z);scarab.g.rotation.y=fwd?Math.PI:0;
      scarab.ballM.rotation.z=(fwd?1:-1)*x/.06;for(const [lg,lx,s] of scarab.legs)lg.rotation.y=Math.sin(t*14+lx*40+s)*.4}
    for(const k of caravan){const x=((t*.22+k.off)%60+60)%60-30,z=-(H+15)+Math.sin(x*.08)*1.5;const y=dune(x,z);k.c.g.position.set(x,y,z);k.c.g.rotation.y=-Math.atan2(Math.cos(x*.08)*.12,1);
      k.c.g.position.y+=Math.abs(Math.sin(t*2.4+k.off))*.04;k.c.head.rotation.z=Math.sin(t*2.4+k.off)*.1;k.c.tail.rotation.x=Math.sin(t*1.6+k.off)*.3}
  });
  mergeStatic([wm,cm,side,sst,nm,gm,om,gold,mat('#6a4a2a'),mat('#5a3a20')]);
  }
});
})();
