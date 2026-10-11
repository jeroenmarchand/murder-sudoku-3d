// Castle: a floating island at dusk, moat, towers with torches and flags.
(()=>{
function rugTex(){const c=document.createElement('canvas');c.width=256;c.height=128;const g=c.getContext('2d');
  g.fillStyle='#7a2a2b';g.fillRect(0,0,256,128);g.strokeStyle='#d6ac5a';g.lineWidth=8;g.strokeRect(10,10,236,108);
  g.lineWidth=3;g.strokeRect(22,22,212,84);g.fillStyle='#d6ac5a';
  for(let x=40;x<230;x+=36){g.beginPath();g.moveTo(x,64);g.lineTo(x+12,46);g.lineTo(x+24,64);g.lineTo(x+12,82);g.closePath();g.fill()}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
const RUG=rugTex();let HAY=null;
// shape helpers: turned (lathe) parts and bevelled boxes read far better than raw cubes
const lathe=(pts,m,seg=16)=>sh(new THREE.Mesh(new THREE.LatheGeometry(pts.map(([x,y])=>new THREE.Vector2(x,y)),seg),m));
const rbox=(w,h,d,r,m,x=0,y=0,z=0)=>{const g=new THREE.ExtrudeGeometry(roundRect(w,d,Math.min(r,w/2-.001,d/2-.001)),{depth:h-r*.8,bevelEnabled:true,bevelThickness:r*.4,bevelSize:r*.4,bevelSegments:3,curveSegments:6});
  g.rotateX(-Math.PI/2);g.translate(0,-(h-r*.8)/2,0);const o=sh(new THREE.Mesh(g,m));o.position.set(x,y,z);return o};
const leg=(h,r,m)=>lathe([[0,0],[r*.9,0],[r,h*.08],[r*.7,h*.2],[r*1.15,h*.35],[r*.65,h*.5],[r*.75,h*.85],[r*1.1,h*.92],[r*1.1,h],[0,h]],m,10);
const OAK=mat('#8a5a32',{roughness:.62}),OAKD=mat('#5a3519',{roughness:.7}),BRASS=mat('#d4a648',{metalness:.9,roughness:.28}),IRON=mat('#3b3b40',{metalness:.85,roughness:.45});
registerTheme({id:'castle',label:'Burcht',icon:'🏰',title:'Moord in de burcht',loading:'De ophaalbrug gaat omhoog…',
  subs:['Het hof wilde een feestmaal. Het kreeg een lijk.','De ophaalbrug ging omhoog. Niemand kwam er meer uit.','Iemand in de burcht speelt een gevaarlijk spel.','Het bal was nog niet begonnen toen het gegil klonk.','De hofnar lacht niet meer.'],
  names:{A:[['Adelheid','f'],['Arnoud','m']],B:[['Beatrijs','f'],['Boudewijn','m']],C:[['Clementia','f'],['Coenraad','m']],D:[['Dirkje','f'],['Diederik','m']],E:[['Ermgard','f'],['Everard','m']],F:[['Fenna','f'],['Floris','m']],G:[['Gerlinde','f'],['Gijsbrecht','m']],H:[['Hadewych','f'],['Hugo','m']]},
  victims:[['Heer Vranck','m'],['Vrouwe Walburga','f']],vicFace:{f:'👸',m:'🤴'},
  faces:{f:['👸','👩‍🍳','👵','👩‍🦰','👩‍🌾','🧝‍♀️','👩‍🦳','🧕'],m:['🧔','💂','👨‍🦱','🧙','👨‍🍳','🤵','👴','🧑‍🎤']},
  rooms:{Stal:{name:'Stal',color:'#b48f62',pat:'planks'},Binnenplaats:{name:'Binnenplaats',color:'#9d968b',pat:'cobble'},Bibliotheek:{name:'Bibliotheek',color:'#5f7193',pat:'carpet'},
    Slaapkamer:{name:'Slaapkamer',color:'#8c7ca8',pat:'carpet'},Troonzaal:{name:'Troonzaal',color:'#a5544b',pat:'checker'},Keuken:{name:'Keuken',color:'#c48d5c',pat:'tiles'},
    Kapel:{name:'Kapel',color:'#e2dccf',pat:'marble',rough:.42},Wapenkamer:{name:'Wapenkamer',color:'#7f8999',pat:'flag'},Tuin:{name:'Tuin',color:'#6e9a57',pat:'grass'},Kelder:{name:'Kelder',color:'#6f6252',pat:'flag'}},
  i18n:{en:{label:'Castle',title:'Murder in the castle',loading:'Raising the drawbridge…',
    subs:['The court wanted a feast. It got a corpse.','The drawbridge went up. Nobody got out again.','Someone in the castle is playing a dangerous game.','The ball hadn’t even started when the scream rang out.','The court jester isn’t laughing anymore.'],
    victims:[['Lord Vranck','m'],['Lady Walburga','f']],
    rooms:{Stal:{name:'Stable'},Binnenplaats:{name:'Courtyard'},Bibliotheek:{name:'Library'},Slaapkamer:{name:'Bedroom'},Troonzaal:{name:'Throne room'},
      Keuken:{name:'Kitchen'},Kapel:{name:'Chapel'},Wapenkamer:{name:'Armory'},Tuin:{name:'Garden'},Kelder:{name:'Cellar'}},
    objs:{stoel:{name:'chair',verb:'Sat'},troon:{name:'throne',verb:'Sat',art:'the'},tafel:{name:'table'},bed:{name:'bed',verb:'Lay'},tapijt:{name:'rug',verb:'Stood'},
      bank:{name:'bench',verb:'Sat'},paard:{name:'horse',verb:'Sat'},kist:{name:'chest'},ton:{name:'barrel'},hooibaal:{name:'hay bale'},boom:{name:'tree'},
      struik:{name:'bush'},bloemperk:{name:'flower bed'},put:{name:'well'},kast:{name:'cupboard'},boekenkast:{name:'bookcase'},harnas:{name:'suit of armor'},
      altaar:{name:'altar'},kandelaar:{name:'candelabra'},wapenrek:{name:'weapon rack'},wijnrek:{name:'wine rack'}}}},
  look:{sky:['#0d0a24','#2a1f4a','#5a3a62','#c46a5e'],fog:['#1b1631',26,58],hemi:['#c6c4ff','#3b2c22',.42],sun:['#ffd2a0',3.8,[-9,6.5,-2]],env:.22,rim:['#8d97ff',.55],fill:['#ffd9b0',.25],
    wall:'#b9ab92',cap:'#d3c7ae',grout:'#3a2f27',base:'#8c8172'},
  objs:{
    stoel:{name:'stoel',verb:'Zat',h:0.31,build(L){const g=new THREE.Group();
      for(const[a,b]of[[1,1],[1,-1],[-1,1],[-1,-1]]){const l=leg(.27,.028,OAK);l.position.set(a*.16,0,b*.16);g.add(l)}
      g.add(rbox(.44,.05,.44,.03,OAK,0,.28,0));g.add(rbox(.38,.035,.38,.03,mat('#7b1e27',{roughness:.9}),0,.315,0));
      for(const b of[-1,1]){const p=leg(.36,.024,OAK);p.position.set(-.19,.29,b*.17);g.add(p)}
      const back=rbox(.05,.26,.36,.02,OAKD,-.19,.5,0);g.add(back);g.add(box(.035,.06,.24,BRASS,-.17,.52,0));
      g.add(rbox(.06,.04,.42,.02,OAK,-.19,.66,0));return g}},
    troon:{name:'troon',de:true,verb:'Zat',h:0.38,build(L){const g=new THREE.Group(),gd=mat('#d9a93a',GOLD),red=mat('#9c1b28',{roughness:.7});
      g.add(rbox(.66,.08,.66,.03,mat('#6b1a22',{roughness:.9}),0,.04,0));g.add(rbox(.58,.26,.56,.04,gd,0,.21,0));g.add(rbox(.5,.07,.5,.035,red,0,.36,0));
      const back=new THREE.Shape();back.moveTo(-.3,0);back.lineTo(.3,0);back.lineTo(.3,.42);back.quadraticCurveTo(.3,.58,0,.66);back.quadraticCurveTo(-.3,.58,-.3,.42);back.closePath();
      const bg=new THREE.ExtrudeGeometry(back,{depth:.06,bevelEnabled:true,bevelThickness:.02,bevelSize:.02,bevelSegments:2});const bk=sh(new THREE.Mesh(bg,gd));bk.rotation.y=Math.PI/2;bk.position.set(-.3,.3,0);g.add(bk);
      const pad=new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-.22,0),new THREE.Vector2(.22,0),new THREE.Vector2(.22,.3),new THREE.Vector2(0,.4),new THREE.Vector2(-.22,.3)]),{depth:.03,bevelEnabled:true,bevelThickness:.015,bevelSize:.015,bevelSegments:2});
      const pd=sh(new THREE.Mesh(pad,red));pd.rotation.y=Math.PI/2;pd.position.set(-.22,.38,0);g.add(pd);
      for(const z of[-.27,.27]){g.add(rbox(.5,.06,.08,.025,gd,0,.48,z));const f=leg(.14,.03,gd);f.position.set(.22,.36,z);g.add(f)}
      g.add(ball(.06,mat('#c0392b',{roughness:.15,metalness:.2,emissive:'#5a0a10'}),-.27,.99,0,2));
      for(const z of[-.24,.24])g.add(ball(.045,gd,-.27,.78,z,1));return g}},
    tafel:{name:'tafel',de:true,build(L){const g=new THREE.Group();const w=L-.16;
      g.add(rbox(w,.06,.74,.035,OAK,0,.45,0));g.add(box(w-.12,.05,.6,OAKD,0,.4,0));
      for(const[a,b]of[[1,1],[1,-1],[-1,1],[-1,-1]]){const l=leg(.39,.04,OAKD);l.position.set(a*(w/2-.1),0,b*.27);g.add(l)}
      g.add(box(w-.25,.03,.04,OAKD,0,.1,0));
      // a table runner, pewter plate, goblet and a candle
      g.add(box(w*.7,.006,.22,mat('#8f1f2b',{roughness:.95}),0,.483,0));
      const plate=lathe([[0,0],[.09,0],[.1,.012],[.085,.008],[0,.008]],mat('#c9cad0',{metalness:.85,roughness:.3}),20);plate.position.set(-w/4,.48,.16);g.add(plate);
      const gob=lathe([[0,0],[.035,0],[.01,.01],[.008,.05],[.03,.07],[.035,.11],[.03,.11],[.026,.075],[0,.075]],BRASS,14);gob.position.set(w/4,.48,-.12);g.add(gob);
      if(L>1){const bowl=lathe([[0,0],[.06,0],[.11,.05],[.1,.055],[.055,.01],[0,.01]],OAKD,16);bowl.position.set(-w/4+.05,.48,-.14);g.add(bowl);
        for(let k=0;k<4;k++)g.add(ball(.032,mat(['#c0392b','#e6b422','#7cb342','#c0392b'][k],{roughness:.4}),-w/4+.03+(k%2)*.05,.53+(k>1?.03:0),-.14+(k%2?.03:-.02),1))}
      g.add(candle(0,0,.12,.485));return g}},
    bed:{name:'bed',verb:'Lag',h:0.37,build(L){const g=new THREE.Group();const w=L-.12;
      g.add(rbox(w,.16,.82,.04,OAKD,0,.13,0));g.add(rbox(w-.06,.12,.74,.05,mat('#efe8dc',{roughness:.95}),0,.27,0));
      const quilt=rbox(w*.64,.08,.8,.04,mat('#3d5285',{roughness:.95}),w*.17,.32,0);g.add(quilt);g.add(box(w*.64,.012,.82,mat('#d9b25a',{metalness:.5,roughness:.5}),w*.17-w*.32+.02,.33,0).translateX(0));
      for(const z of[-.17,.17])g.add(rbox(.24,.08,.3,.04,mat('#fbf7ef',{roughness:.95}),-w/2+.22,.37,z));
      g.add(rbox(.08,.6,.88,.03,OAKD,-w/2,.32,0));g.add(rbox(.06,.34,.88,.03,OAKD,w/2,.2,0));
      for(const[x,z]of[[-w/2,-.42],[-w/2,.42],[w/2,-.42],[w/2,.42]]){const p=leg(1.05,.028,OAKD);p.position.set(x,0,z);g.add(p);g.add(ball(.035,BRASS,x,1.07,z,1))}
      // canopy and curtains gathered at the posts
      for(const z of[-.42,.42])for(const x of[-w/2,w/2]){const c=sh(new THREE.Mesh(new THREE.CylinderGeometry(.03,.07,.85,8,1,true),mat('#8f2430',{roughness:.95,side:THREE.DoubleSide})));c.position.set(x+(x<0?.06:-.06),.6,z);g.add(c)}
      return g}},
    tapijt:{name:'tapijt',verb:'Stond',h:0.026,build(L){const g=new THREE.Group();const t=RUG.clone();t.needsUpdate=true;
    const m=new THREE.Mesh(new THREE.BoxGeometry(L-.12,.025,.82),[mat('#7a1a1d'),mat('#7a1a1d'),new THREE.MeshStandardMaterial({map:t,roughness:.95}),mat('#7a1a1d'),mat('#7a1a1d'),mat('#7a1a1d')]);
    m.position.y=.013;m.receiveShadow=true;g.add(m);return g}},
    bank:{name:'bank',de:true,verb:'Zat',h:0.31,build(L){const g=new THREE.Group();
      g.add(rbox(.84,.06,.32,.025,OAK,0,.28,0));
      for(const a of[-.34,.34]){g.add(rbox(.06,.26,.28,.02,OAKD,a,.13,0));g.add(rbox(.06,.05,.32,.02,OAKD,a,.36,0))}
      g.add(box(.7,.03,.03,OAKD,0,.08,0));for(let k=-3;k<=3;k++)g.add(box(.025,.2,.02,OAKD,k*.1,.42,-.14));
      g.add(rbox(.84,.05,.05,.02,OAK,0,.54,-.14));return g}},
    paard:{name:'paard',verb:'Zat',h:0.63,build(L,ctx){const g=new THREE.Group(),m=mat('#7b4a2a',{roughness:.55}),d=mat('#241510',{roughness:.8}),hoof=mat('#1a1410');
      const cap=(r,l,mt,x,y,z,rz=0,rx=0)=>{const o=sh(new THREE.Mesh(new THREE.CapsuleGeometry(r,l,4,10),mt));o.position.set(x,y,z);o.rotation.set(rx,0,rz);return o};
      const body=cap(.12,.34,m,0,.47,0,Math.PI/2);body.scale.set(1,1,.92);g.add(body);
      for(const[a,b,k]of[[.17,.07,0],[.17,-.07,1],[-.17,.07,2],[-.17,-.07,3]]){g.add(cap(.035,.26,m,a,.22,b));g.add(cyl(.04,.045,.04,hoof,a,.02,b,8))}
      const neck=new THREE.Group();neck.position.set(.24,.55,0);g.add(neck);
      neck.add(cap(.065,.18,m,.06,.09,0,-.6));const head=cap(.05,.15,m,.17,.17,0,-Math.PI/2-.55);neck.add(head);
      neck.add(cap(.04,.04,m,.22,.12,0,-Math.PI/2-.55));
      for(const z of[-.03,.03]){const e=sh(new THREE.Mesh(new THREE.ConeGeometry(.016,.06,6),m));e.position.set(.11,.27,z);e.rotation.z=-.3;neck.add(e)}
      const mane=box(.03,.22,.03,d,.02,.12,0);mane.rotation.z=-.6;neck.add(mane);
      for(const z of[-.042,.042])neck.add(ball(.011,mat('#111',{roughness:.2}),.16,.2,z,1));
      const tail=new THREE.Group();tail.position.set(-.3,.53,0);g.add(tail);const tl=sh(new THREE.Mesh(new THREE.ConeGeometry(.035,.3,7),d));tl.position.set(-.04,-.14,0);tl.rotation.z=Math.PI-.25;tail.add(tl);
      // saddle and caparison
      g.add(rbox(.22,.035,.24,.015,mat('#5a2a14',{roughness:.6}),-.02,.6,0));for(const z of[-.115,.115])g.add(box(.2,.09,.01,mat('#a01e2a',{roughness:.9}),-.02,.54,z));
      for(const z of[-.12,.12])g.add(cyl(.01,.01,.07,IRON,-.02,.5,z,6));
      const ph=ctx.rand()*6;ctx.anim(t=>{tail.rotation.z=Math.sin(t*1.7+ph)*.22;tail.rotation.x=Math.sin(t*1.1+ph)*.15;neck.rotation.z=Math.sin(t*.8+ph)*.06-.02;body.scale.y=1+Math.sin(t*1.6+ph)*.015});
      return g}},
    kist:{name:'kist',de:true,build(L){const g=new THREE.Group(),w=mat('#6b3e1f',{roughness:.7});g.add(rbox(.52,.26,.34,.025,w,0,.13,0));
      const lid=sh(new THREE.Mesh(new THREE.CylinderGeometry(.17,.17,.52,18,1,false,0,Math.PI),mat('#7a4826',{roughness:.62})));lid.rotation.z=Math.PI/2;lid.position.y=.26;g.add(lid);
      for(const x of[-.18,.18]){const b=sh(new THREE.Mesh(new THREE.TorusGeometry(.173,.013,5,18,Math.PI),IRON));b.rotation.y=Math.PI/2;b.position.set(x,.26,0);g.add(b);g.add(box(.03,.25,.352,IRON,x,.13,0))}
      for(const x of[-.25,.25])for(const z of[-.16,.16])g.add(box(.035,.035,.035,BRASS,x,.02,z));
      g.add(rbox(.08,.09,.025,.008,BRASS,0,.24,.176));g.add(box(.012,.03,.005,mat('#111'),0,.235,.19));return g}},
    ton:{name:'ton',de:true,build(L){const g=new THREE.Group();
      const st=new THREE.MeshStandardMaterial({color:'#8a5530',roughness:.75,map:(()=>{const c=document.createElement('canvas');c.width=128;c.height=32;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,128,32);for(let i=0;i<16;i++){x.fillStyle=`rgba(60,30,10,${.1+Math.random()*.2})`;x.fillRect(i*8,0,8,32);x.fillStyle='rgba(30,15,5,.6)';x.fillRect(i*8,0,1,32)}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t})()});
      const pts=[];for(let i=0;i<=10;i++){const y=i/10*.52;pts.push([.17+Math.sin(i/10*Math.PI)*.045,y])}pts.unshift([0,0]);pts.push([0,.52]);g.add(lathe(pts,st,20));
      for(const y of[.06,.17,.35,.46]){const r=.17+Math.sin(y/.52*Math.PI)*.045+.004;const h=sh(new THREE.Mesh(new THREE.TorusGeometry(r,.009,5,28),IRON));h.rotation.x=Math.PI/2;h.position.y=y;g.add(h)}
      g.add(cyl(.165,.165,.012,mat('#6b3f22'),0,.518,0,20));const tap=cyl(.015,.015,.07,BRASS,.2,.12,0,8);tap.rotation.z=Math.PI/2;g.add(tap);return g}},
    hooibaal:{name:'hooibaal',de:true,build(L){const g=new THREE.Group();
      const tex=HAY||(HAY=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.fillStyle='#caa24a';x.fillRect(0,0,128,128);
        for(let i=0;i<1400;i++){const a=(Math.random()-.5)*.9,l=6+Math.random()*14,px=Math.random()*128,py=Math.random()*128;x.strokeStyle=`hsla(${40+Math.random()*12},${50+Math.random()*25}%,${45+Math.random()*30}%,.8)`;x.lineWidth=.6+Math.random()*.8;x.beginPath();x.moveTo(px,py);x.lineTo(px+Math.cos(a)*l,py+Math.sin(a)*l);x.stroke()}
        const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(3,3);return t})());
      const hm=new THREE.MeshStandardMaterial({map:tex,bumpMap:tex,bumpScale:3,roughness:1,color:'#cdb68a'});
      g.add(rbox(.62,.32,.4,.06,hm,0,.16,0));
      const tw=mat('#6a4a22',{roughness:1});for(const x of[-.16,.16]){g.add(box(.018,.012,.45,tw,x,.325,0));for(const z of[-.226,.226])g.add(box(.018,.3,.008,tw,x,.16,z))}
      const st=mat('#d9b44a',{roughness:1});for(let i=0;i<7;i++){const s=box(.12,.006,.008,st,(Math.random()-.5)*.8,.004,(Math.random()<.5?-1:1)*(.22+Math.random()*.08));s.rotation.y=Math.random()*3;g.add(s)}
      return g}},
    boom:{name:'boom',de:true,build(L){const g=new THREE.Group();
      g.add(lathe([[0,0],[.11,0],[.08,.06],[.06,.3],[.05,.5],[0,.5]],mat('#5a3a1e',{roughness:.95}),9));
      const b1=cyl(.025,.035,.25,mat('#5a3a1e'),.07,.42,.02,6);b1.rotation.z=-.7;g.add(b1);
      const cols=['#2f6b2a','#3e8a35','#4f9e3c','#367a30'];const crown=new THREE.Group();
      for(let k=0;k<9;k++){const a=k*2.4,r=k?.17:0,y=.62+(k%3)*.11+(k?0:.12);const m=new THREE.Mesh(new THREE.IcosahedronGeometry(.17+((k*37)%10)/100,1),mat(cols[k%4],{flatShading:true,roughness:.85}));
        m.position.set(Math.cos(a)*r,y,Math.sin(a)*r);m.scale.y=.85;sh(m);crown.add(m)}
      crown.userData.sway=[.03,1.1,Math.random()*6];g.add(crown);
      for(let k=0;k<4;k++)crown.add(ball(.025,mat('#d6402e',{roughness:.4}),Math.cos(k*1.6)*.22,.6+k*.07,Math.sin(k*1.6)*.22,1));return g}},
    struik:{name:'struik',de:true,build(L){const g=new THREE.Group(),c=new THREE.Group(),cols=['#2f6e2a','#3b7d33','#4a8e3a'];
      const P=[[0,.17,0,.2],[.15,.13,.08,.15],[-.13,.13,-.07,.15],[.05,.13,-.15,.14],[-.08,.12,.14,.13],[.02,.3,.02,.13]];
      P.forEach(([x,y,z,r],i)=>{const m=sh(new THREE.Mesh(new THREE.IcosahedronGeometry(r,1),mat(cols[i%3],{flatShading:true,roughness:.85})));m.position.set(x,y,z);m.scale.y=.85;c.add(m)});
      for(let k=0;k<6;k++){const a=k*1.9;c.add(ball(.022,mat('#d23a3a',{roughness:.3}),Math.cos(a)*.18,.16+(k%3)*.07,Math.sin(a)*.18,1))}
      c.userData.sway=[.025,1.4,Math.random()*6];g.add(c);return g}},
    bloemperk:{name:'bloemperk',build(L,ctx){const g=new THREE.Group(),s=new THREE.MeshStandardMaterial({map:stoneTex,color:'#b9ad98',roughness:.9});
      for(const[a,b,w,d]of[[0,.39,.84,.07],[0,-.39,.84,.07],[.39,0,.07,.7],[-.39,0,.07,.7]])g.add(rbox(w,.13,d,.025,s,a,.065,b));
      g.add(box(.72,.08,.72,mat('#4a3320',{roughness:1}),0,.06,0));
      const geos=[],vc=(geo,col)=>{if(geo.index)geo=geo.toNonIndexed();const c=new THREE.Color(col),n=geo.attributes.position.count,a=new Float32Array(n*3);for(let i=0;i<n;i++){a[i*3]=c.r;a[i*3+1]=c.g;a[i*3+2]=c.b}geo.setAttribute('color',new THREE.BufferAttribute(a,3));geos.push(geo)};
      const cols=['#e04f6a','#f2c94c','#f6f1ff','#b45ae0','#ff7f50','#ff9ec4'];
      for(let i=0;i<18;i++){const x=-.28+(i%6)*.112+(Math.random()-.5)*.04,z=-.25+Math.floor(i/6)*.25+(Math.random()-.5)*.06,h=.12+Math.random()*.08;
        vc(new THREE.CylinderGeometry(.007,.009,h,4).translate(x,.1+h/2,z),'#3a7a2a');
        const lf=new THREE.SphereGeometry(.035,5,3);lf.scale(1,.25,.5);lf.rotateY(Math.random()*3);lf.translate(x,.12,z);vc(lf,'#3f8a33');
        const col=cols[i%6];for(let p=0;p<5;p++){const a=p/5*Math.PI*2,pt=new THREE.SphereGeometry(.024,6,4);pt.scale(1,.35,1);pt.translate(x+Math.cos(a)*.026,.1+h,z+Math.sin(a)*.026);vc(pt,col)}
        vc(new THREE.SphereGeometry(.015,6,4).translate(x,.108+h,z),'#f5c242')}
      const fl=sh(new THREE.Mesh(mergeGeometries(geos),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.7})));fl.userData.sway=[.02,1.6,Math.random()*6];g.add(fl);
      // a butterfly drifting over the flowers
      const bf=new THREE.Group(),wm=new THREE.MeshStandardMaterial({color:['#ffb13b','#6fb6ff','#ff6fae'][Math.floor(Math.random()*3)],side:THREE.DoubleSide,roughness:.6,emissive:'#331a00',emissiveIntensity:.3});
      const wg=new THREE.CircleGeometry(.045,8);wg.translate(.04,0,0);const w1=new THREE.Mesh(wg,wm),w2=new THREE.Mesh(wg,wm);w1.rotation.x=w2.rotation.x=-Math.PI/2;
      const p1=new THREE.Group(),p2=new THREE.Group();p1.add(w1);p2.add(w2);p2.rotation.y=Math.PI;bf.add(p1,p2);{const bd=cyl(.006,.006,.05,mat('#222'),0,0,0,4);bd.rotation.x=Math.PI/2;bf.add(bd)}g.add(bf);
      const ph=Math.random()*6;if(ctx)ctx.anim(t=>{const a=t*.45+ph;bf.position.set(Math.cos(a)*.26,.42+Math.sin(t*1.3+ph)*.06,Math.sin(a*1.3)*.22);bf.rotation.y=-a;const f=Math.sin(t*16+ph)*.9;p1.rotation.z=f;p2.rotation.z=-f});
      return g}},
    put:{name:'put',de:true,build(L){const g=new THREE.Group(),s=new THREE.MeshStandardMaterial({map:stoneTex,color:'#c9bda8',roughness:.9});
    const w=sh(new THREE.Mesh(new THREE.CylinderGeometry(.34,.36,.32,20,1,true),s));w.material.side=THREE.DoubleSide;w.position.y=.16;g.add(w);
    const rr=sh(new THREE.Mesh(new THREE.TorusGeometry(.34,.05,8,24),s));rr.rotation.x=Math.PI/2;rr.position.y=.32;g.add(rr);
    const water=new THREE.Mesh(new THREE.CircleGeometry(.32,20),new THREE.MeshStandardMaterial({color:'#2a6fb5',roughness:.1,metalness:.3,emissive:'#0a2a55'}));water.rotation.x=-Math.PI/2;water.position.y=.2;g.add(water);
    for(const z of[-.3,.3])g.add(box(.05,.7,.05,mat(DWOOD),0,.5,z));
    const roof=sh(new THREE.Mesh(new THREE.ConeGeometry(.5,.28,4),mat('#8a3b2a',{flatShading:true})));roof.position.y=.95;roof.rotation.y=Math.PI/4;g.add(roof);
    const ax=cyl(.025,.025,.6,mat(DWOOD),0,.7,0,6);ax.rotation.x=Math.PI/2;g.add(ax);g.add(cyl(.06,.05,.1,mat('#7a4a26'),0,.55,0,8));return g}},
    kast:{name:'kast',de:true,build(L){const g=new THREE.Group(),w=mat('#5a341b',{roughness:.65}),wl=mat('#6e4224',{roughness:.58});
      g.add(rbox(.6,.76,.36,.02,w,0,.47,0));g.add(rbox(.66,.05,.42,.02,OAKD,0,.875,0));g.add(rbox(.62,.03,.38,.01,wl,0,.84,0));g.add(rbox(.64,.06,.4,.02,OAKD,0,.08,0));
      for(const a of[-1,1])for(const b of[-1,1])g.add(ball(.03,OAKD,a*.27,.03,b*.15,1));
      for(const x of[-1,1]){g.add(rbox(.27,.66,.02,.008,wl,x*.145,.47,.18));for(const y of[.31,.62])g.add(rbox(.19,.22,.014,.006,w,x*.145,y,.192));g.add(ball(.018,BRASS,x*.03,.47,.2,1))}
      return g}},
    boekenkast:{name:'boekenkast',de:true,build(L){const g=new THREE.Group(),w=mat('#4e2c15',{roughness:.7});
      g.add(box(.68,.9,.02,w,0,.48,-.14));for(const x of[-.34,.34])g.add(rbox(.04,.92,.32,.012,w,x,.47,0));
      for(const y of[.05,.35,.65])g.add(rbox(.68,.03,.3,.01,w,0,y,0));g.add(rbox(.78,.05,.36,.018,OAKD,0,.95,0));
      const geos=[],vc=(geo,col)=>{if(geo.index)geo=geo.toNonIndexed();const c=new THREE.Color(col),n=geo.attributes.position.count,a=new Float32Array(n*3);for(let i=0;i<n;i++){a[i*3]=c.r;a[i*3+1]=c.g;a[i*3+2]=c.b}geo.setAttribute('color',new THREE.BufferAttribute(a,3));geos.push(geo)};
      const cols=['#8e2b2b','#2b4e8e','#2b6a4a','#7a5a2a','#5a2b6a','#a0582b','#3a3a3a','#6e1f1f'];
      for(let s=0;s<3;s++){const y0=.065+s*.3;let x=-.31;while(x<.29){const bw=.028+Math.random()*.03,bh=.17+Math.random()*.08,bd=.2+Math.random()*.05;if(x+bw>.31)break;
        const lean=x>.18&&Math.random()<.5,col=cols[Math.floor(Math.random()*cols.length)];
        const b=new THREE.BoxGeometry(bw,bh,bd);b.translate(0,bh/2,0);const gb=new THREE.BoxGeometry(bw+.002,.012,.004);gb.translate(0,bh*.82,bd/2);const gb2=gb.clone();gb2.translate(0,-bh*.6,0);
        for(const q of[b,gb,gb2]){if(lean){q.translate(-bw/2,0,0);q.rotateZ(-.22);q.translate(bw/2,0,0)}q.translate(x+bw/2,y0,.03)}
        vc(b,col);vc(gb,'#d4a648');vc(gb2,'#d4a648');x+=bw+(lean?.06:.003);if(lean)break}}
      g.add(sh(new THREE.Mesh(mergeGeometries(geos),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.75}))));return g}},
    harnas:{name:'harnas',build(L){const g=new THREE.Group(),m=mat('#c8ccd4',{metalness:.95,roughness:.22}),dk=mat('#6d7280',{metalness:.9,roughness:.35}),P=(o,x,y,z)=>{o.position.set(x,y,z);g.add(o);return o};
      g.add(rbox(.32,.05,.32,.015,OAKD,0,.025,0));
      for(const z of[-.06,.06]){P(lathe([[0,0],[.055,0],[.06,.03],[.04,.08],[.05,.17],[.038,.23],[.045,.28],[.052,.34],[0,.34]],m,12),0,.05,z);P(ball(.034,dk,0,0,0,1),.025,.27,z)}
      P(lathe([[0,0],[.12,0],[.115,.04],[.1,.09],[0,.09]],dk,16),0,.36,0);
      P(lathe([[0,0],[.1,0],[.115,.06],[.13,.15],[.128,.21],[.1,.25],[.05,.27],[0,.27]],m,18),0,.43,0).scale.x=.72;
      for(const z of[-1,1]){P(sh(new THREE.Mesh(new THREE.SphereGeometry(.07,14,8,0,Math.PI*2,0,Math.PI/2),m)),0,.64,z*.14);P(cyl(.033,.03,.2,m,0,0,0,10),0,.53,z*.15);P(ball(.038,dk,0,0,0,1),.01,.42,z*.15)}
      P(cyl(.05,.06,.04,dk,0,0,0,14),0,.71,0);
      P(lathe([[0,0],[.062,0],[.074,.04],[.078,.09],[.068,.13],[.04,.16],[0,.17]],m,18),0,.72,0);
      P(box(.02,.012,.1,mat('#111'),0,0,0),.072,.81,0);P(box(.016,.06,.012,dk,0,0,0),.066,.77,0);
      const pl=P(sh(new THREE.Mesh(new THREE.ConeGeometry(.03,.14,8),mat('#b0262b',{roughness:.8}))),-.02,.94,0);pl.rotation.z=.5;pl.userData.sway=[.08,1.2,Math.random()*6];
      P(cyl(.011,.011,.9,OAKD,0,0,0,6),.05,.5,.24);const ax=P(new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.008,16,1,false,0,Math.PI),m),.05,.86,.24);sh(ax);ax.rotation.x=Math.PI/2;ax.rotation.z=Math.PI/2;
      P(sh(new THREE.Mesh(new THREE.ConeGeometry(.018,.08,6),m)),.05,.98,.24);return g}},
    altaar:{name:'altaar',build(L){const g=new THREE.Group(),s=new THREE.MeshStandardMaterial({map:stoneTex,color:'#efe9de',roughness:.55}),red=mat('#8e1f22',{roughness:.85}),au=mat('#d9a93a',GOLD);
      g.add(rbox(.78,.06,.48,.02,s,0,.03,0));g.add(rbox(.68,.36,.38,.02,s,0,.24,0));g.add(rbox(.78,.06,.48,.02,s,0,.45,0));
      for(const x of[-.3,.3]){const c=lathe([[0,0],[.035,0],[.03,.03],[.025,.32],[.035,.36],[0,.36]],s,10);c.position.set(x,.06,.2);g.add(c)}
      g.add(box(.6,.012,.5,red,0,.485,0));g.add(box(.34,.2,.012,red,0,.39,.252));g.add(box(.34,.018,.014,au,0,.3,.253));
      g.add(box(.035,.06,.014,au,0,.4,.258));g.add(box(.08,.02,.014,au,0,.41,.258));
      g.add(rbox(.1,.03,.06,.008,au,0,.505,-.05));g.add(rbox(.028,.24,.028,.008,au,0,.64,-.05));g.add(rbox(.13,.028,.028,.008,au,0,.69,-.05));
      const bk=rbox(.16,.025,.11,.01,mat('#5a1a1a'),.15,.505,.06);bk.rotation.y=.3;g.add(bk);const pg=box(.14,.006,.1,mat('#f3ead6'),.15,.52,.06);pg.rotation.y=.3;g.add(pg);
      g.add(candle(-.27,0,.14,.49));g.add(candle(.27,0,.14,.49));return g}},
    kandelaar:{name:'kandelaar',de:true,build(L){const g=new THREE.Group();
      g.add(lathe([[0,0],[.14,0],[.15,.02],[.08,.05],[.03,.08],[.025,.2],[.04,.22],[.02,.25],[.02,.5],[.04,.52],[.03,.56],[0,.56]],BRASS,18));
      for(const a of[0,Math.PI]){const arm=new THREE.Mesh(new THREE.TorusGeometry(.1,.01,6,16,Math.PI/2),BRASS);arm.position.set(Math.cos(a)*.1,.5,Math.sin(a)*.1);arm.rotation.set(0,-a,Math.PI);g.add(arm);
        const cup=lathe([[0,0],[.03,0],[.04,.03],[0,.03]],BRASS,10);cup.position.set(Math.cos(a)*.2,.6,Math.sin(a)*.2);g.add(cup);g.add(candle(Math.cos(a)*.2,Math.sin(a)*.2,.12,.63))}
      g.add(candle(0,0,.14,.56));return g}},
    wapenrek:{name:'wapenrek',build(L){const g=new THREE.Group(),w=OAKD,st=mat('#d9dde4',{metalness:.95,roughness:.18}),au=mat('#d9a93a',GOLD),lt=mat('#3a2418',{roughness:.9});
      for(const x of[-.33,.33]){{const p=leg(.78,.03,w);p.position.x=x;g.add(p)}g.add(rbox(.1,.04,.3,.015,w,x,.02,0))}
      g.add(rbox(.72,.04,.07,.015,w,0,.76,0));g.add(rbox(.72,.035,.12,.012,w,0,.08,0));
      for(const x of[-.2,0,.2]){const blade=new THREE.Shape();blade.moveTo(-.02,0);blade.lineTo(.02,0);blade.lineTo(.016,.46);blade.lineTo(0,.52);blade.lineTo(-.016,.46);blade.closePath();
        const bg=new THREE.ExtrudeGeometry(blade,{depth:.004,bevelEnabled:true,bevelThickness:.004,bevelSize:.004,bevelSegments:1});bg.rotateZ(Math.PI);const b=sh(new THREE.Mesh(bg,st));b.position.set(x,.62,.05);g.add(b);
        g.add(rbox(.14,.022,.03,.008,au,x,.625,.05));g.add(cyl(.013,.013,.1,lt,x,.68,.05,8));g.add(ball(.022,au,x,.74,.05,1))}
      const sd=sh(new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,.03,20),mat('#7a1f22',{roughness:.6})));sd.rotation.x=Math.PI/2;sd.position.set(.0,.4,-.06);g.add(sd);
      const rim=sh(new THREE.Mesh(new THREE.TorusGeometry(.13,.012,6,24),au));rim.position.set(0,.4,-.06);g.add(rim);g.add(ball(.03,au,0,.4,-.08,1));return g}},
    wijnrek:{name:'wijnrek',build(L){const g=new THREE.Group(),w=mat('#4b2c16',{roughness:.75});
      for(const x of[-.34,.34])g.add(rbox(.04,.8,.3,.012,w,x,.4,0));g.add(rbox(.72,.04,.32,.012,w,0,.8,0));g.add(box(.68,.76,.02,mat('#2a1a0e'),0,.4,-.13));
      for(let r=0;r<4;r++)g.add(box(.68,.02,.28,w,0,.03+r*.2,0));
      const bt=new THREE.LatheGeometry([[0,0],[.038,0],[.04,.01],[.04,.17],[.03,.2],[.013,.23],[.013,.28],[0,.28]].map(([x,y])=>new THREE.Vector2(x,y)),12);bt.rotateX(Math.PI/2);bt.translate(0,0,-.13);
      const ck=new THREE.CylinderGeometry(.014,.014,.025,8);ck.rotateX(Math.PI/2);ck.translate(0,0,.16);
      const G=[[],[]],C=[];for(let r=0;r<4;r++)for(let c=0;c<4;c++){if((r*4+c)%7===5)continue;const x=-.24+c*.16,y=.085+r*.2;G[(r+c*3)%2].push(bt.clone().translate(x,y,0));C.push(ck.clone().translate(x,y,0))}
      [['#1e4a24'],['#4a1222']].forEach(([col],i)=>g.add(sh(new THREE.Mesh(mergeGeometries(G[i]),mat(col,{roughness:.12,metalness:.35})))));
      g.add(new THREE.Mesh(mergeGeometries(C),mat('#b58a5a',{roughness:.9})));return g}},
  },
  env(ctx){const {world,N,H,E}=ctx;
  // a floating island: grass ring around a moat, rock underside, a few trees, a drawbridge at the gate
  const Wm=H+1.55,IS=Wm+1.15;
  {const top=roundRect(2*IS,2*IS,1.4);const hole=new THREE.Path();hole.moveTo(-Wm,-Wm);hole.lineTo(-Wm,Wm);hole.lineTo(Wm,Wm);hole.lineTo(Wm,-Wm);top.holes.push(hole);
   const gg=new THREE.ExtrudeGeometry(top,{depth:.5,bevelEnabled:true,bevelThickness:.06,bevelSize:.06,bevelSegments:2,curveSegments:10});gg.rotateX(-Math.PI/2);
   const pos=gg.attributes.position,uv=gg.attributes.uv;for(let k=0;k<pos.count;k++)uv.setXY(k,pos.getX(k)*.25,pos.getZ(k)*.25);
   const ground=new THREE.Mesh(gg,[new THREE.MeshStandardMaterial({color:'#5b7d45',map:GRASS,roughness:1}),new THREE.MeshStandardMaterial({color:'#6b5a46',map:stoneTex,roughness:1})]);
   ground.position.y=-.92;ground.receiveShadow=true;world.add(ground);
   // rock underside: a faceted, inverted pyramid whose top matches the island so it never peeks out
   const rg=new THREE.CylinderGeometry(1,.06,1,4,5);rg.rotateY(Math.PI/4);const rp=rg.attributes.position;
   for(let k=0;k<rp.count;k++){const y=rp.getY(k);if(y<.45&&y>-.49){const f=1+(Math.random()-.5)*.18;rp.setX(k,rp.getX(k)*f);rp.setZ(k,rp.getZ(k)*f);rp.setY(k,y+(Math.random()-.5)*.05)}}
   rg.computeVertexNormals();const rock=new THREE.Mesh(rg,new THREE.MeshStandardMaterial({color:'#4a3e36',roughness:1,flatShading:true}));
   rock.scale.set(IS*1.3,IS*.85,IS*1.3);rock.position.y=-.97-IS*.425;world.add(rock)}
  const water=new THREE.Mesh(new THREE.PlaneGeometry(2*Wm,2*Wm,HQ?60:36,HQ?60:36),new THREE.MeshStandardMaterial({color:'#2c5f78',map:WATER,roughness:.08,metalness:.3,emissive:'#071c2a',transparent:true,opacity:.94}));
  water.rotation.x=-Math.PI/2;water.position.y=-.6;water.receiveShadow=true;world.add(water);
  {const br=new THREE.Group();const pl=mat('#6e4a2a');for(let k=0;k<5;k++)br.add(box(.9,.05,.24,pl,0,0,k*.27));
   for(const x of[-.43,.43])br.add(box(.05,.08,1.3,mat(DWOOD),x,.05,.54));br.position.set(0,-.4,H+.62);world.add(br)}
  {const tm=[mat('#3f6b3a',{flatShading:true}),mat('#4d7d42',{flatShading:true}),mat('#355d33',{flatShading:true})],trunk=mat('#4a3322');
   const R=(()=>{let x=ctx.seed*9301+49297;return()=>(x=(x*9301+49297)%233280)/233280})();
   for(let k=0;k<22;k++){const side=Math.floor(R()*4),u=(R()*2-1)*(IS-.8),d=Wm+.35+R()*(IS-Wm-.85);
     let x=[u,u,d,-d][side],z=[d,-d,u,u][side];if(side===0&&Math.abs(x)<1)continue;
     const t=new THREE.Group(),s=.55+R()*.5;t.add(cyl(.04,.06,.3,trunk,0,.15,0,6));
     if(R()<.5){const c=sh(new THREE.Mesh(new THREE.ConeGeometry(.24,.6,7),tm[k%3]));c.position.y=.55;t.add(c);const c2=sh(new THREE.Mesh(new THREE.ConeGeometry(.18,.42,7),tm[(k+1)%3]));c2.position.y=.8;t.add(c2)}
     else{t.add(ball(.22,tm[k%3],0,.45,0,0));t.add(ball(.15,tm[(k+1)%3],.08,.62,.04,0))}
     t.userData.sway=[.025,.9+R()*.5,R()*6];t.scale.setScalar(s);t.rotation.y=R()*6;t.position.set(x,-.36,z);world.add(t)}}
  // castle wall: one merlon per cell, a walkway cap, slate-roofed towers with gold finials
  const cw=new THREE.MeshStandardMaterial({map:stoneTex,color:'#a69c8d',roughness:.95}),cwCap=new THREE.MeshStandardMaterial({map:stoneTex,color:'#bfb5a4',roughness:.9});const wh=.42;
  for(const s of[-1,1]){world.add(box(N+.4,wh,.3,cw,0,wh/2-.1,s*E));world.add(box(.3,wh,N+.4,cw,s*E,wh/2-.1,0));
    world.add(box(N+.44,.04,.34,cwCap,0,wh-.1,s*E));world.add(box(.34,.04,N+.44,cwCap,s*E,wh-.1,0));
    for(let k=-H+.5;k<H;k+=1){if(!(s===1&&Math.abs(k)<.6))world.add(box(.34,.14,.24,cwCap,k,wh+.0,s*E+s*.03));world.add(box(.24,.14,.34,cwCap,s*E+s*.03,wh,k))}}
  const roofM=new THREE.MeshStandardMaterial({color:'#3d4760',roughness:.55,flatShading:true}),finM=mat('#d9b25a',GOLD);
  for(const a of[-1,1])for(const b of[-1,1]){const x=a*(E+.1),z=b*(E+.1);world.add(cyl(.5,.56,1.4,cw,x,.5,z,20));
    world.add(cyl(.6,.52,.16,cwCap,x,1.24,z,20));
    for(let k=0;k<8;k++){const an=k/8*Math.PI*2;world.add(box(.15,.14,.15,cwCap,x+Math.cos(an)*.52,1.39,z+Math.sin(an)*.52))}
    const r=sh(new THREE.Mesh(new THREE.ConeGeometry(.56,1.05,20,1),roofM));r.position.set(x,1.92,z);world.add(r);
    world.add(ball(.045,finM,x,2.48,z,1));
    const fl=box(.015,.3,.015,mat('#2a2a2a'),x,2.62,z);world.add(fl);const flag=box(.2,.1,.008,mat('#9c2a33'),x+.1,2.7,z);world.add(flag);flames.push({flag,ph:Math.random()*6});
    world.add(flame(x+a*-.42,1.05,z+b*-.42,2.2));
    const L=new THREE.PointLight('#ffa65a',1.3,5.5,1.8);L.position.set(x-a*.9,1.2,z-b*.9);world.add(L);flames.push({light:L,ph:Math.random()*9})}
  // gate
  world.add(box(1.1,.72,.38,cw,0,.26,E+.05));world.add(box(1.16,.05,.42,cwCap,0,.64,E+.05));
  world.add(box(.54,.38,.44,mat('#2a1a0e'),0,.09,E+.06));

  // moat ripples: the plane is displaced every frame
  const wp=water.geometry.attributes.position,w0=Float32Array.from(wp.array);
  ctx.anim(t=>{WATER.offset.set(Math.sin(t*.15)*.3,t*.02);water.material.emissiveIntensity=.9+Math.sin(t*.8)*.1;
    for(let k=0;k<wp.count;k++){const x=w0[k*3],y=w0[k*3+1];wp.array[k*3+2]=Math.sin(x*2.1+t*1.3)*.022+Math.sin(y*2.7-t*1.1)*.018+Math.sin((x+y)*5+t*2.4)*.006}
    wp.needsUpdate=true;water.geometry.computeVertexNormals()});
  // soft sprite textures for clouds, smoke and mist
  const puff=(a)=>{const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');
    for(let k=0;k<9;k++){const x=30+Math.random()*68,y=40+Math.random()*48,r=22+Math.random()*24;const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,`rgba(255,255,255,${a})`);gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,128,128)}
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t};
  const CLOUD=puff(.5),SMOKE=puff(.35);
  // a sea of dusk clouds below the island, drifting slowly past
  const clouds=[];for(let k=0;k<(HQ?26:14);k++){const m=new THREE.SpriteMaterial({map:CLOUD,color:k%3?'#e9a6a0':'#b98aa8',transparent:true,opacity:.55+Math.random()*.3,depthWrite:false,fog:true});
    const s=new THREE.Sprite(m);const sc=5+Math.random()*7;s.scale.set(sc*1.7,sc,1);const a=Math.random()*Math.PI*2,r=IS+3+Math.random()*12;
    s.position.set(Math.cos(a)*r,-4.5-Math.random()*5,Math.sin(a)*r);s.userData={a,r,sp:.004+Math.random()*.006};world.add(s);clouds.push(s)}
  ctx.anim((t,dt)=>{for(const c of clouds){c.userData.a+=c.userData.sp*dt;c.position.x=Math.cos(c.userData.a)*c.userData.r;c.position.z=Math.sin(c.userData.a)*c.userData.r}});
  // waterfall spilling from the moat over the island's edge, with mist at its foot
  {const fx=IS-.05,fz=-H*.35;const fg=new THREE.PlaneGeometry(.7,6,1,24);const fp=fg.attributes.position;
   for(let k=0;k<fp.count;k++){const y=fp.getY(k);const d=(3-y)/6;fp.setZ(k,d*d*1.6);fp.setX(k,fp.getX(k)*(1+d*.5))}
   fg.computeVertexNormals();const ft=WATER.clone();ft.needsUpdate=true;ft.wrapS=ft.wrapT=THREE.RepeatWrapping;ft.repeat.set(1,3);
   const fall=new THREE.Mesh(fg,new THREE.MeshStandardMaterial({map:ft,color:'#9fd0e8',emissive:'#1d4f6a',transparent:true,opacity:.85,roughness:.15,side:THREE.DoubleSide,depthWrite:false}));
   fall.rotation.y=-Math.PI/2;fall.position.set(fx,-3.6,fz);world.add(fall);
   const mist=[];for(let k=0;k<8;k++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:SMOKE,color:'#dfeaf5',transparent:true,opacity:0,depthWrite:false}));s.userData.ph=k/8;world.add(s);mist.push(s)}
   ctx.anim(t=>{ft.offset.y=-t*.9;for(const s of mist){const u=(t*.25+s.userData.ph)%1;s.position.set(fx+1.4+u*.6,-6.4+u*1.2,fz+Math.sin(s.userData.ph*9)*.5);s.scale.setScalar(.8+u*1.8);s.material.opacity=Math.sin(u*Math.PI)*.45}})}
  // smoke curling up from a kitchen chimney on the back-left tower
  {const cx=-(E+.1),cz=-(E+.1);const ch=box(.16,.4,.16,new THREE.MeshStandardMaterial({map:stoneTex,color:'#8d8273',roughness:.95}),cx+.28,1.45,cz+.12);world.add(ch);
   const sm=[];for(let k=0;k<10;k++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:SMOKE,color:'#c9c0cf',transparent:true,opacity:0,depthWrite:false}));s.userData.ph=k/10;world.add(s);sm.push(s)}
   ctx.anim(t=>{for(const s of sm){const u=(t*.12+s.userData.ph)%1;s.position.set(cx+.28+Math.sin(u*5+s.userData.ph*7)*.12+u*.6,1.7+u*2.4,cz+.12+u*.3);s.scale.setScalar(.25+u*1.1);s.material.opacity=Math.sin(u*Math.PI)*.38*(1-u*.4)}})}
  // banners hanging from the outer walls, rippling in the wind
  {const bt=(()=>{const c=document.createElement('canvas');c.width=64;c.height=160;const g=c.getContext('2d');g.fillStyle='#8f1f2b';g.fillRect(0,0,64,160);
     g.fillStyle='#d9b25a';g.fillRect(0,0,64,8);g.beginPath();g.moveTo(32,40);g.lineTo(48,70);g.lineTo(32,100);g.lineTo(16,70);g.closePath();g.fill();
     g.strokeStyle='#d9b25a';g.lineWidth=3;g.strokeRect(6,14,52,140);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t})();
   const bm=new THREE.MeshStandardMaterial({map:bt,roughness:.85,side:THREE.DoubleSide});const bans=[];
   for(const [x,z,ry] of [[-H*.5,E+.17,0],[H*.5,E+.17,0],[-(E+.17),0,-Math.PI/2],[E+.17,0,Math.PI/2],[0,-(E+.17),Math.PI]]){
     const g=new THREE.PlaneGeometry(.3,.62,4,10);g.translate(0,-.31,0);const m=sh(new THREE.Mesh(g,bm));m.position.set(x,.33,z);m.rotation.y=ry;world.add(m);
     bans.push({m,p0:Float32Array.from(g.attributes.position.array),ph:Math.random()*6})}
   ctx.anim(t=>{for(const b of bans){const pa=b.m.geometry.attributes.position;for(let k=0;k<pa.count;k++){const y=b.p0[k*3+1];pa.array[k*3+2]=Math.sin(t*2.2+y*7+b.ph)*.03*(-y)+(-y)*.06}pa.needsUpdate=true}})}
  // swifts circling the towers, wings flapping
  {const bm=new THREE.MeshStandardMaterial({color:'#2a2230',roughness:.8,side:THREE.DoubleSide});const birds=[];
   for(let k=0;k<(HQ?7:4);k++){const b=new THREE.Group();const wg=new THREE.BufferGeometry();wg.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,-.05,0,.16,.05,0,0],3));wg.computeVertexNormals();
     const l=new THREE.Mesh(wg,bm),r=new THREE.Mesh(wg,bm);r.scale.z=-1;b.add(l,r);b.add(new THREE.Mesh(new THREE.ConeGeometry(.02,.12,5),bm).rotateZ(-Math.PI/2));
     b.userData={l,r,a:Math.random()*6,rad:H+1.5+Math.random()*3,y:2.4+Math.random()*1.6,sp:.25+Math.random()*.2,ph:Math.random()*6};world.add(b);birds.push(b)}
   ctx.anim((t,dt)=>{for(const b of birds){const u=b.userData;u.a+=u.sp*dt;const x=Math.cos(u.a)*u.rad,z=Math.sin(u.a)*u.rad;b.position.set(x,u.y+Math.sin(t*.7+u.ph)*.3,z);
     b.rotation.y=-u.a;const f=Math.sin(t*9+u.ph)*.7;u.l.rotation.x=f;u.r.rotation.x=-f}})}
  // fireflies drifting over the island grass
  {const n=HQ?90:40,g=new THREE.BufferGeometry(),p=new Float32Array(n*3),seed=[];for(let k=0;k<n;k++){const a=Math.random()*6.28,r=Wm+.3+Math.random()*(IS-Wm-.3);p[k*3]=Math.cos(a)*r;p[k*3+1]=-.2+Math.random()*.6;p[k*3+2]=Math.sin(a)*r;seed.push(Math.random()*6)}
   g.setAttribute('position',new THREE.BufferAttribute(p,3));const p0=p.slice();const ff=new THREE.Points(g,new THREE.PointsMaterial({color:new THREE.Color('#ffe08a').multiplyScalar(3),size:.06,transparent:true,opacity:.9,depthWrite:false,blending:THREE.AdditiveBlending}));world.add(ff);
   ctx.anim(t=>{for(let k=0;k<n;k++){p[k*3]=p0[k*3]+Math.sin(t*.4+seed[k])*.2;p[k*3+1]=p0[k*3+1]+Math.sin(t*.9+seed[k]*2)*.12;p[k*3+2]=p0[k*3+2]+Math.cos(t*.35+seed[k])*.2}g.attributes.position.needsUpdate=true;ff.material.opacity=.6+Math.sin(t*2)*.3})}
  // the moon rising over the far side
  {const moon=new THREE.Mesh(new THREE.CircleGeometry(3.2,40),new THREE.MeshBasicMaterial({color:new THREE.Color('#fff1d6').multiplyScalar(1.8),fog:false}));moon.position.set(-60,28,-70);moon.lookAt(0,0,0);world.add(moon);
   const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:'#ffd9b0',transparent:true,opacity:.35,depthWrite:false,fog:false,blending:THREE.AdditiveBlending}));halo.scale.setScalar(26);halo.position.copy(moon.position);world.add(halo)}
  stars(world,420,'#fff6e0',.28,.6,1.2);
  }
});
})();
