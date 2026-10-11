// Dutch strings for the classic (2D) version. Keys of rooms, obj, and victims are the internal names from src/core.js.
const L={
  meta:{
    title:'Klassieke murder sudoku · moordpuzzels maken en printen | Murder Sudoku 3D',
    desc:'Maak gratis logische moordpuzzels in drie niveaus en druk ze af. Plaats de verdachten, volg de aanwijzingen en vind de dader. Elke zaak heeft precies één oplossing.',
    ogTitle:'Moordpuzzels om te printen · Murder Sudoku 3D',
    ogDesc:'Gratis logische moordpuzzels, oneindig veel zaken, klaar om af te drukken.',
    locale:'nl_NL'
  },
  ui:{
    difficulty:'Moeilijkheid',easy:'Makkelijk',medium:'Normaal',hard:'Moeilijk',
    newCase:'Nieuwe zaak',print:'Afdrukken',hint:'Hint',clear:'Wissen',solution:'Oplossing',hideSolution:'Verberg oplossing',
    killerIs:'De moordenaar is',check:'Controleer',choose:'— kies —',rules:'Spelregels',
    canOcc:'Kunnen worden bezet',cannotOcc:'Kunnen niet worden bezet',crossOut:'Vak schrappen',eraser:'Gum',
    busy:'Nieuwe zaak wordt bedacht…',
    footer:'Kies een verdachte of ✕ onder het bord en tik op een vak. Elke zaak heeft precies één oplossing. Deel de link om dezelfde zaak te delen.',
    play3d:'Speel in 3D',feedback:'Feedback',about:'Over Murder Sudoku 3D',source:'Broncode',language:'Taal'
  },
  rules:`<li>Iedere persoon staat in een eigen <b>rij</b> en een eigen <b>kolom</b>.</li>
<li>Je kunt alleen op een leeg vak of op een object uit het groene vak staan.</li>
<li><b>Naast</b> betekent direct boven, onder, links of rechts, <b>in hetzelfde gebied</b>.</li>
<li>Een <b>hoek van een gebied</b> is een vak waar twee grenzen van dat gebied samenkomen. De buitenrand telt als grens.</li>
<li><b>Alleen</b> betekent: niemand anders in hetzelfde gebied.</li>
<li>Het slachtoffer was alleen met de moordenaar.</li>`,
  subs:['Het hof wilde een feestmaal. Het kreeg een lijk.','De ophaalbrug ging omhoog. Niemand kwam er meer uit.','Iemand in de burcht speelt een gevaarlijk spel.','Het bal was nog niet begonnen toen het gegil klonk.','De hofnar lacht niet meer.'],
  rooms:{Stal:'Stal',Binnenplaats:'Binnenplaats',Bibliotheek:'Bibliotheek',Slaapkamer:'Slaapkamer',Troonzaal:'Troonzaal',Keuken:'Keuken',Kapel:'Kapel',Wapenkamer:'Wapenkamer',Tuin:'Tuin',Kelder:'Kelder'},
  // label for the legend, article and noun for clues, verb when "op" opens a clue
  obj:{
    stoel:{label:'Stoel',a:'een',n:'stoel',verb:'Zat'},paard:{label:'Paard',a:'een',n:'paard',verb:'Zat'},bank:{label:'Bank',a:'een',n:'bank',verb:'Zat'},
    tapijt:{label:'Tapijt',a:'een',n:'tapijt',verb:'Stond'},bed:{label:'Bed',a:'een',n:'bed',verb:'Lag'},troon:{label:'Troon',a:'de',n:'troon',verb:'Zat'},
    tafel:{label:'Tafel',a:'een',n:'tafel'},kast:{label:'Kast',a:'een',n:'kast'},boekenkast:{label:'Boekenkast',a:'een',n:'boekenkast'},
    kist:{label:'Kist',a:'een',n:'kist'},ton:{label:'Ton',a:'een',n:'ton'},hooibaal:{label:'Hooibaal',a:'een',n:'hooibaal'},
    boom:{label:'Boom',a:'een',n:'boom'},struik:{label:'Struik',a:'een',n:'struik'},put:{label:'Put',a:'een',n:'put'},
    harnas:{label:'Harnas',a:'een',n:'harnas'},altaar:{label:'Altaar',a:'een',n:'altaar'},kandelaar:{label:'Kandelaar',a:'een',n:'kandelaar'},
    wapenrek:{label:'Wapenrek',a:'een',n:'wapenrek'},bloemperk:{label:'Bloemperk',a:'een',n:'bloemperk'},wijnrek:{label:'Wijnrek',a:'een',n:'wijnrek'}
  },
  victims:{'Heer Vranck':'Heer Vranck','Vrouwe Walburga':'Vrouwe Walburga'},
  // clue fragments: o = obj entry, room = room name in lower case, g = 'f' or 'm', first = opens the sentence
  clue:{
    op:(o,first)=>(first?o.verb+' ':'')+`op ${o.a} <b>${o.n}</b>`,
    in:(room,first)=>(first?'Was in de ':'in de ')+`<b>${room}</b>`,
    naast:(o,first)=>(first?'Bevond zich ':'')+`<b>naast</b> ${o.a} <b>${o.n}</b>`,
    hoek:(g,first)=>(first?'Bevond zich ':'')+`in een <b>hoek</b> van ${g==='f'?'haar':'zijn'} <b>gebied</b>`,
    rand:first=>(first?'Bevond zich ':'')+'aan de <b>rand</b> van het raster',
    geenobject:first=>(first?'Stond ':'')+'<b>niet</b> op een object',
    alleen:(g,first)=>(first?'Was ':'')+`<b>alleen</b> in ${g==='f'?'haar':'zijn'} gebied`
  },
  victimCard:g=>`<b>Het slachtoffer</b><br>Was alleen met ${g==='f'?'haar':'zijn'} moordenaar.`,
  caseNo:seed=>`· zaak ${seed}`,
  caseTitle:(seed,vic)=>`Zaak ${seed}: moord op ${vic.replace(/^./,c=>c.toLowerCase())}`,
  msg:{
    noStand:'Daar kan niemand staan.',
    people:n=>`${n} ${n===1?'persoon staat':'personen staan'} verkeerd.`,
    incomplete:n=>`Nog niet compleet, en ${n} ${n===1?'persoon staat':'personen staan'} verkeerd.`,
    soFar:left=>`Tot nu toe goed. Nog ${left} te plaatsen.`,
    pickKiller:'Het bord klopt! Kies nu de moordenaar.',
    solved:k=>`Opgelost! ${k} is de moordenaar. 🎉`,
    notKiller:k=>`Het bord klopt, maar ${k} is niet de moordenaar.`,
    misplaced:n=>`${n} staat niet goed.`,
    allPlaced:'Alles staat al. Kies de moordenaar.',
    placed:n=>`${n} is geplaatst.`,
    confirmClear:'Alles wissen?',
    reveal:(k,v,room)=>`${k} was alleen met ${v} in de ${room}.`,
    confirmPrint:'Oplossing op een aparte pagina meeprinten?',
    failed:'Dat lukte niet. Probeer een nieuwe zaak.'
  },
  print:{
    killer:'De moordenaar is …',
    solTitle:seed=>`Oplossing zaak ${seed}`,
    solLine:(k,v)=>`${k} was alleen met ${v} en is de moordenaar.`
  }
};
