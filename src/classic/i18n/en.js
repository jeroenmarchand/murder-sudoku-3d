// English strings for the classic (2D) version. Keys of rooms, obj, and victims are the internal names from src/core.js.
const L={
  meta:{
    title:'Classic murder sudoku · make and print murder mystery logic puzzles | Murder Sudoku 3D',
    desc:'Make free murder mystery logic puzzles in three difficulty levels and print them. Place the suspects, follow the clues, and find the killer. Every case has exactly one solution.',
    ogTitle:'Printable murder sudoku puzzles · Murder Sudoku 3D',
    ogDesc:'Free murder mystery logic puzzles, endless cases, ready to print.',
    locale:'en_US'
  },
  ui:{
    difficulty:'Difficulty',easy:'Easy',medium:'Medium',hard:'Hard',
    newCase:'New case',print:'Print',hint:'Hint',clear:'Clear',solution:'Solution',hideSolution:'Hide solution',
    killerIs:'The killer is',check:'Check',choose:'— choose —',rules:'Rules',
    canOcc:'Can be occupied',cannotOcc:'Can’t be occupied',crossOut:'Cross out a square',eraser:'Eraser',
    busy:'Coming up with a new case…',
    footer:'Pick a suspect or ✕ below the board, then tap a square. Every case has exactly one solution. Share the link, and others play the same case.',
    play3d:'Play in 3D',feedback:'Feedback',about:'About Murder Sudoku 3D',source:'Source code',language:'Language'
  },
  rules:`<li>Each person is in their own <b>row</b> and their own <b>column</b>.</li>
<li>People stand only on an empty square or on an object from the green box.</li>
<li><b>Next to</b> means directly above, below, left, or right, <b>in the same area</b>.</li>
<li>A <b>corner of an area</b> is a square where two borders of that area meet. The outer edge counts as a border.</li>
<li><b>Alone</b> means nobody else is in the same area.</li>
<li>The victim was alone with the killer.</li>`,
  subs:['The court wanted a feast. It got a corpse.','The drawbridge went up. Nobody got out.','Someone in the castle is playing a dangerous game.','The ball hadn’t even started when the scream rang out.','The court jester isn’t laughing anymore.'],
  rooms:{Stal:'Stable',Binnenplaats:'Courtyard',Bibliotheek:'Library',Slaapkamer:'Bedroom',Troonzaal:'Throne room',Keuken:'Kitchen',Kapel:'Chapel',Wapenkamer:'Armory',Tuin:'Garden',Kelder:'Cellar'},
  // label for the legend, article and noun for clues, verb when "op" opens a clue
  obj:{
    stoel:{label:'Chair',a:'a',n:'chair',verb:'Sat'},paard:{label:'Horse',a:'a',n:'horse',verb:'Sat'},bank:{label:'Bench',a:'a',n:'bench',verb:'Sat'},
    tapijt:{label:'Rug',a:'a',n:'rug',verb:'Stood'},bed:{label:'Bed',a:'a',n:'bed',verb:'Lay'},troon:{label:'Throne',a:'the',n:'throne',verb:'Sat'},
    tafel:{label:'Table',a:'a',n:'table'},kast:{label:'Cupboard',a:'a',n:'cupboard'},boekenkast:{label:'Bookcase',a:'a',n:'bookcase'},
    kist:{label:'Chest',a:'a',n:'chest'},ton:{label:'Barrel',a:'a',n:'barrel'},hooibaal:{label:'Hay bale',a:'a',n:'hay bale'},
    boom:{label:'Tree',a:'a',n:'tree'},struik:{label:'Bush',a:'a',n:'bush'},put:{label:'Well',a:'a',n:'well'},
    harnas:{label:'Armor',a:'a',n:'suit of armor'},altaar:{label:'Altar',a:'an',n:'altar'},kandelaar:{label:'Candlestick',a:'a',n:'candlestick'},
    wapenrek:{label:'Weapon rack',a:'a',n:'weapon rack'},bloemperk:{label:'Flower bed',a:'a',n:'flower bed'},wijnrek:{label:'Wine rack',a:'a',n:'wine rack'}
  },
  victims:{'Heer Vranck':'Lord Vranck','Vrouwe Walburga':'Lady Walburga'},
  // clue fragments: o = obj entry, room = room name in lower case, g = 'f' or 'm', first = opens the sentence
  clue:{
    op:(o,first)=>(first?o.verb+' ':'')+`on ${o.a} <b>${o.n}</b>`,
    in:(room,first)=>(first?'Was in the ':'in the ')+`<b>${room}</b>`,
    naast:(o,first)=>(first?'Was ':'')+`<b>next to</b> ${o.a} <b>${o.n}</b>`,
    hoek:(g,first)=>(first?'Was ':'')+`in a <b>corner</b> of ${g==='f'?'her':'his'} <b>area</b>`,
    rand:first=>(first?'Was ':'')+'on the <b>edge</b> of the grid',
    geenobject:first=>(first?'Was ':'')+'<b>not</b> on an object',
    alleen:(g,first)=>(first?'Was ':'')+`<b>alone</b> in ${g==='f'?'her':'his'} area`
  },
  victimCard:g=>`<b>The victim</b><br>Was alone with ${g==='f'?'her':'his'} killer.`,
  caseNo:seed=>`· case ${seed}`,
  caseTitle:(seed,vic)=>`Case ${seed}: the murder of ${vic}`,
  msg:{
    noStand:'Nobody can stand there.',
    people:n=>`${n} ${n===1?'person is':'people are'} in the wrong place.`,
    incomplete:n=>`Not complete yet, and ${n} ${n===1?'person is':'people are'} in the wrong place.`,
    soFar:left=>`So far, so good. ${left} left to place.`,
    pickKiller:'The board is correct! Now choose the killer.',
    solved:k=>`Solved! ${k} is the killer. 🎉`,
    notKiller:k=>`The board is correct, but ${k} isn’t the killer.`,
    misplaced:n=>`${n} is in the wrong place.`,
    allPlaced:'Everyone is placed. Choose the killer.',
    placed:n=>`${n} is placed.`,
    confirmClear:'Clear everything?',
    reveal:(k,v,room)=>`${k} was alone with ${v} in the ${room}.`,
    confirmPrint:'Print the solution on a separate page too?',
    failed:'That didn’t work. Try a new case.'
  },
  print:{
    killer:'The killer is …',
    solTitle:seed=>`Solution to case ${seed}`,
    solLine:(k,v)=>`${k} was alone with ${v} and is the killer.`
  }
};
