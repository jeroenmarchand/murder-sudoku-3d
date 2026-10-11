// Dutch text for the 3D app. Plain strings are used at build time (t:key placeholders in index.html),
// functions at runtime. Keep keys in sync with en.js.
const L={
  brand:'Murder Sudoku',
  meta:{title:'Murder Sudoku 3D · speel gratis moordpuzzels online',
    desc:'Los een moord op met pure logica. Plaats de verdachten in een 3D-plattegrond, volg de aanwijzingen en ontmasker de dader. Gratis, zonder account, op telefoon, tablet en computer.',
    ogTitle:'Murder Sudoku 3D: wie is de moordenaar?',ogDesc:'Gratis logische moordpuzzels in 3D. Zes decors, drie niveaus, oneindig veel zaken.'},
  ui:{title:'Moord in de burcht',timer:'Speeltijd',cam:'Wissel camera',camKey:'Wissel camera (C)',top:'Boven',doss:'Dossier',dossOpen:'Dossier openen',
    newCase:'Nieuwe zaak',setting:'Decor',close:'Sluiten',objects:'Voorwerpen',rules:'Spelregels',print:'Afdrukbare versie',feedback:'Feedback',about:'Over Murder Sudoku',
    input:'Invoer',pawn:'Pion',pawnKey:'Pion plaatsen (N wisselt)',note:'Notitie',noteKey:'Notities maken (N)',cross:'Kruis',crossKey:'Vakken schrappen (X)',
    undo:'Ongedaan maken',undoKey:'Ongedaan maken (Z)',hint:'Hint',hintKey:'Hint (H)',more:'Meer',accuse:'Beschuldig',
    solution:'Oplossing',hideSolution:'Verberg oplossing',clearNotes:'Wis notities',clearAll:'Wis alles',language:'Taal',
    who:'Wie is de moordenaar?',cancel:'Annuleren',closed:'Zaak gesloten',look:'Bekijk het bord',next:'Volgende zaak',
    loading:'De burcht wordt gebouwd…',plotting:'Een nieuwe moord wordt beraamd…',surprise:'Verras me',
    showOnBoard:'Toon op het bord',occ:'Bezetbaar',blocks:'Blokkeert',guilty:'SCHULDIG',tagNote:'NOTITIE',tagCross:'KRUIS',
    time:'tijd',hints:'hints',misses:'missers'},
  diff:{easy:'Makkelijk',medium:'Normaal',hard:'Moeilijk'},
  diffSub:{easy:'6×6 · ruime aanwijzingen',medium:'8×8 · een flinke puzzel',hard:'9×9 · elke aanwijzing telt'},
  fb:{case:'Zaak',setting:'Decor',mode:'Modus',placed:'Geplaatst'},
  caseNo:s=>`Zaak ${s}`,
  murderOf:v=>`De moord op ${v}`,
  // clue grammar. k: clue kind; x: the object ({name,verb,de}) for op/naast, the room ({name,art}) for in; g: 'f'|'m'
  clue(k,x,first,g){const pr=g==='f'?'haar':'zijn',art=o=>o.de?'de':'een';
    if(k==='op'){const o=`op ${art(x)} <b>${x.name}</b>`;return first?`${x.verb||'Stond'} ${o}`:o}
    if(k==='in')return (first?'Was in ':'in ')+`${x.art||'de'} <b>${x.name.toLowerCase()}</b>`;
    if(k==='naast')return (first?'Bevond zich ':'')+`<b>naast</b> ${art(x)} <b>${x.name}</b>`;
    if(k==='hoek')return (first?'Bevond zich ':'')+`in een <b>hoek</b> van ${pr} <b>gebied</b>`;
    if(k==='rand')return (first?'Bevond zich ':'')+`aan de <b>rand</b> van het raster`;
    if(k==='geenobject')return (first?'Stond ':'')+`<b>niet</b> op een object`;
    if(k==='alleen')return (first?'Was ':'')+`<b>alleen</b> in ${pr} gebied`},
  victim:g=>'<b>Het slachtoffer.</b> Was alleen met '+(g==='f'?'haar':'zijn')+' moordenaar.',
  room:r=>`${r.art||'de'} ${r.name.toLowerCase()}`,
  or:a=>a.length>1?a.slice(0,-1).join(', ')+' of '+a.at(-1):a.join(''),
  rules:occ=>`<li>Iedere persoon staat in een eigen <b>rij</b> en een eigen <b>kolom</b>.</li>
<li>Je staat op een lege tegel of op een object dat bezet kan worden: ${occ}.</li>
<li><b>Naast</b> betekent direct ervoor, erachter, links of rechts, <b>in hetzelfde gebied</b>. Muren scheiden de gebieden.</li>
<li>Een <b>hoek van een gebied</b> is een vak waar twee muren van dat gebied samenkomen. De buitenmuur telt mee.</li>
<li><b>Alleen</b> betekent: niemand anders in hetzelfde gebied.</li>
<li>Het slachtoffer was alleen met de moordenaar.</li>`,
  bar:{sol:(k,v)=>`Dit is de <b>oplossing</b>. ${k} was alleen met ${v}.`,
    cross:'Tik op vakken om ze te <b>schrappen</b>. Nog eens tikken haalt het kruis weg.',
    notes:'Kies een verdachte en tik op elk vak waar die <b>misschien</b> stond.',
    idle:'Kies een verdachte en tik op een vak.<br>Tik op een pion om die op te pakken.'},
  t:{nothingUndo:'Niets om ongedaan te maken.',pickNote:'Kies eerst wie je wilt noteren.',here:n=>`Hier staat al ${n}.`,
    blocked:'Daar kan niemand staan.',pick:'Kies eerst een verdachte hieronder.',
    conflict:(n,row)=>`${n} staat al in deze ${row?'rij':'kolom'}.`,
    right:'Het bord klopt. Wie is de moordenaar?',almost:'Iedereen staat, maar er klopt nog iets niet.',
    wrong:n=>`${n} staat niet goed.`,allPlaced:'Alles staat. Wie is de moordenaar?',placed:n=>`${n} is geplaatst.`,
    hintOne:(n,g)=>`${n} kan nog maar op één plek staan. Zie je waarom? Tik nog eens op de hint om te plaatsen.`,
    hintMany:(n,c,g)=>`Kijk naar ${n}: nog ${c} plekken mogelijk. Tik nog eens op de hint om te plaatsen.`,
    noNotes:'Er zijn geen notities.',notesCleared:'Notities gewist. Ongedaan maken zet ze terug.',
    empty:'Het bord is al leeg.',cleared:'Bord gewist. Ongedaan maken zet het terug.',
    alone:(k,v,r)=>`${k} was alleen met ${v} in ${r}.`,hideSol:'Verberg eerst de oplossing.',
    accComplete:'Het bord is compleet. Wijs de dader aan.',accWrong:'Weet je het zeker? Het bord klopt nog niet helemaal.',
    accLeft:c=>`Nog ${c} ${c===1?'persoon':'personen'} te plaatsen. Je mag gokken, maar bewijs is beter.`,
    alibi:n=>`${n} heeft een alibi. Kijk nog eens naar het bord.`,guess:'Goed gegokt, maar het bord bewijst het nog niet. Maak het af!',
    failed:'Dat lukte niet. Probeer opnieuw.',solvedBefore:'Deze zaak heb je al opgelost. Kies gerust een nieuwe.',
    welcome:'Lees de aanwijzingen links en zet iedereen op de goede plek.'}
};
