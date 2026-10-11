// English text for the 3D app. Plain strings are used at build time (t:key placeholders in index.html),
// functions at runtime. Keep keys in sync with nl.js.
const L={
  brand:'Murder Sudoku',
  meta:{title:'Murder Sudoku 3D · Free murder mystery puzzles online',
    desc:'Solve a murder with pure logic. Place the suspects on a 3D floor plan, follow the clues, and unmask the killer. Free, no account needed, on phone, tablet, and computer.',
    ogTitle:'Murder Sudoku 3D: who is the murderer?',ogDesc:'Free murder mystery logic puzzles in 3D. Six settings, three levels, endless cases.'},
  ui:{title:'Murder in the castle',timer:'Time played',cam:'Switch camera',camKey:'Switch camera (C)',top:'Top view',doss:'Case file',dossOpen:'Open case file',
    newCase:'New case',setting:'Setting',close:'Close',objects:'Objects',rules:'Rules',print:'Printable version',feedback:'Feedback',about:'About Murder Sudoku',
    input:'Input mode',pawn:'Pawn',pawnKey:'Place pawns (N toggles)',note:'Note',noteKey:'Take notes (N)',cross:'Cross',crossKey:'Cross out squares (X)',
    undo:'Undo',undoKey:'Undo (Z)',hint:'Hint',hintKey:'Hint (H)',more:'More',accuse:'Accuse',
    solution:'Show solution',hideSolution:'Hide solution',clearNotes:'Clear notes',clearAll:'Clear all',language:'Language',
    who:'Who is the murderer?',cancel:'Cancel',closed:'Case closed',look:'View the board',next:'Next case',
    loading:'Building the castle…',plotting:'Plotting a new murder…',surprise:'Surprise me',
    showOnBoard:'Show on the board',occ:'Usable',blocks:'Blocking',guilty:'GUILTY',tagNote:'NOTE',tagCross:'CROSS',
    time:'time',hints:'hints',misses:'misses'},
  diff:{easy:'Easy',medium:'Medium',hard:'Hard'},
  diffSub:{easy:'6×6 · generous clues',medium:'8×8 · a solid puzzle',hard:'9×9 · every clue counts'},
  fb:{case:'Case',setting:'Setting',mode:'Mode',placed:'Placed'},
  caseNo:s=>`Case ${s}`,
  murderOf:v=>`The murder of ${v}`,
  // clue grammar. k: clue kind; x: the object ({name,verb,art}) for op/naast, the room ({name,art}) for in; g: 'f'|'m'.
  // Objects default to a/an by first letter (set art:'the' or 'an' in the theme to override); rooms default to "the" (art:'' for none).
  clue(k,x,first,g){const pr=g==='f'?'her':'his',W=(w,s)=>(first?w+' ':'')+s,
      a=o=>(o.art??(/^[aeiou]/i.test(o.name)?'an':'a'))+' ',the=r=>(r.art??'the')?(r.art??'the')+' ':'';
    if(k==='op')return W(x.verb||'Stood',`on ${a(x)}<b>${x.name}</b>`);
    if(k==='in')return W('Was',`in ${the(x)}<b>${x.name.toLowerCase()}</b>`);
    if(k==='naast')return W('Was',`<b>next to</b> ${a(x)}<b>${x.name}</b>`);
    if(k==='hoek')return W('Was',`in a <b>corner</b> of ${pr} <b>area</b>`);
    if(k==='rand')return W('Was',`on the <b>edge</b> of the grid`);
    if(k==='geenobject')return W('Was',`<b>not</b> on an object`);
    if(k==='alleen')return W('Was',`<b>alone</b> in ${pr} area`)},
  victim:g=>'<b>The victim.</b> Was alone with '+(g==='f'?'her':'his')+' murderer.',
  room:r=>((r.art??'the')?(r.art??'the')+' ':'')+r.name.toLowerCase(),
  or:a=>a.length>2?a.slice(0,-1).join(', ')+', or '+a.at(-1):a.join(' or '),
  rules:occ=>`<li>Each person is in their own <b>row</b> and their own <b>column</b>.</li>
<li>People stand on an empty tile or on an object that can hold a person: ${occ}.</li>
<li><b>Next to</b> means directly in front, behind, left, or right, <b>in the same area</b>. Walls separate the areas.</li>
<li>A <b>corner of an area</b> is a square where two walls of that area meet. The outer wall counts.</li>
<li><b>Alone</b> means nobody else is in the same area.</li>
<li>The victim was alone with the murderer.</li>`,
  bar:{sol:(k,v)=>`This is the <b>solution</b>. ${k} was alone with ${v}.`,
    cross:'Tap squares to <b>cross them out</b>. Tap again to remove the cross.',
    notes:'Pick a suspect and tap every square where they <b>might</b> have been.',
    idle:'Pick a suspect and tap a square.<br>Tap a pawn to pick it up.'},
  t:{nothingUndo:'Nothing to undo.',pickNote:'First pick who to take notes for.',here:n=>`${n} is already here.`,
    blocked:'Nobody can stand there.',pick:'First pick a suspect below.',
    conflict:(n,row)=>`${n} is already in this ${row?'row':'column'}.`,
    right:'The board is correct. Who is the murderer?',almost:'Everyone is placed, but something is still off.',
    wrong:n=>`${n} is in the wrong place.`,allPlaced:'Everyone is placed. Who is the murderer?',placed:n=>`${n} is placed.`,
    hintOne:(n,g)=>`${n} fits in only one spot. Can you see why? Tap the hint again to place ${g==='f'?'her':'him'}.`,
    hintMany:(n,c,g)=>`Look at ${n}: ${c} spots left. Tap the hint again to place ${g==='f'?'her':'him'}.`,
    noNotes:'There are no notes.',notesCleared:'Notes cleared. Undo brings them back.',
    empty:'The board is already empty.',cleared:'Board cleared. Undo brings it back.',
    alone:(k,v,r)=>`${k} was alone with ${v} in ${r}.`,hideSol:'Hide the solution first.',
    accComplete:'The board is complete. Point out the killer.',accWrong:'Are you sure? The board isn’t quite right yet.',
    accLeft:c=>`${c} ${c===1?'person':'people'} left to place. You can guess, but proof is better.`,
    alibi:n=>`${n} has an alibi. Take another look at the board.`,guess:'Good guess, but the board doesn’t prove it yet. Finish it!',
    failed:'That didn’t work. Try again.',solvedBefore:'You already solved this case. Pick a new one anytime.',
    welcome:'Read the clues on the left and put everyone in the right place.'}
};
