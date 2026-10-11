# Murder Sudoku 3D: writing a setting (theme)

Murder Sudoku is a logic puzzle with a multilingual UI (English at the root, Dutch under `/nl/`). The brand
is "Murder Sudoku" in every language. A generated case is a board of N×N tiles (N = 6, 8, or 9)
split into rooms by low walls, with furniture objects on some tiles. A setting re-skins the whole
3D world: sky, light, scenery around the board, floor textures, wall colours, every object model,
the names of rooms, people, and objects. The puzzle logic never changes.

Engine: `src/3d/index.html` (three.js r169, ES module). A new setting should not need engine
changes; if it does, keep them small and mention them in the pull request. Each setting is one file
`src/3d/themes/<id>.js` that is inlined into the module at build time, so it can use every engine
global listed below. The reference setting is `src/3d/themes/castle.js`: read it first.

## Build and look

```sh
npm run dev                                   # http://localhost:5173, rebuilds on every page load
node scripts/build.mjs --only <id>            # optional: build only castle + your theme (faster)
```

Open `http://localhost:5173/3d/?theme=<id>#medium-75` to force your setting and a case. Try several
cases (`#easy-12`, `#medium-75`, `#hard-4031`) because scenery must fit every board size (N = 6, 8, 9).
`?nobake` turns off static-mesh merging when you debug a model. `npm run test:smoke` loads every
setting and fails on console errors or names that do not start with their letter.

When you add a setting, also add a card for it to `src/site/index.html` and run
`npm run screenshots` to regenerate the images in `src/site/img/`.

## The registerTheme object

```js
registerTheme({
  id:'space', label:'Ruimte', icon:'🚀',          // label + emoji shown on the picker chip
  title:'Moord in de ruimte',                     // header title
  loading:'Het station wordt opgestart…',         // loader text
  subs:[ '…5 short, punchy Dutch one-liners…' ],  // dossier subtitle, picked per case
  names:{A:[['Femname','f'],['Malename','m']], … H:[…]},  // EVERY name must start with its letter A..H; one f and one m each
  victims:[['Kapitein Vos','m'],['Commandant Vera','f']], // one m, one f; must not equal any suspect name
  vicFace:{f:'👩‍🚀',m:'👨‍🚀'}, faces:{f:[8 emoji],m:[8 emoji]},
  rooms:{ <canonical key>:{name:'Hangar', art:'de'|'het', color:'#hex', pat:'planks'|'cobble'|'carpet'|'checker'|'tiles'|'marble'|'flag'|'grass'|function(g,S,R,shade,lite){…canvas 2D on S×S…}, rough?, metal?, glow?:['#hex',intensity]}, … all 10 },
  objs:{ <canonical key>:{name:'scooter', de?:true, verb?:'Zat'|'Stond'|'Lag', h?:seatHeight, blob?:false, build(L,ctx){ return THREE.Group } }, … all 21 },
  look:{ sky:[css colours top→bottom or [stop,colour]], fog:[colour,near,far], hemi:[sky,ground,I], sun:[colour,I,[x,y,z]],
         rim:[colour,I], fill:[colour,I], exposure:1, env:.35, bloom:[strength,radius,threshold],
         wall:'#hex', cap:'#hex', wallMap?:Texture, wallRough?, wallMetal?, capGlow?:'#hex', grout:'#hex', groutMetal?, base:'#hex'|false,
         label:{bg:'rgba()',fg:'#hex',line:'rgba()',font:'CSS font family'}, dust:[colour,count,opacity], shadowR?:number, sunFixed?:bool },
  i18n:{en:{ /* English text, see "Translations" below */ }},
  env(ctx){ /* scenery around the board, built into ctx.world */ }
});
```

### Canonical rooms and the objects they hold (fixed by the generator)

| key | occupiable | blocking |
|---|---|---|
| Stal | paard, paard, bank | ton, hooibaal, kist |
| Binnenplaats | bank, paard | boom, struik, put |
| Bibliotheek | stoel, tapijt | boekenkast, tafel |
| Slaapkamer | bed, stoel, tapijt | kast, kist |
| Troonzaal | troon (unique), tapijt, stoel | harnas, tafel |
| Keuken | stoel, bank | tafel, ton, kast |
| Kapel | bank, tapijt | altaar, kandelaar |
| Wapenkamer | stoel, bank | harnas, wapenrek, kist |
| Tuin | bank | boom, struik, bloemperk |
| Kelder | stoel | ton, wijnrek, kist |

Re-imagine each room and object for your setting while keeping its role, for example on a
space station: Stal → Hangar, paard → hoverbike, hooibaal → brandstoftank, Troonzaal → Brug,
troon → commandostoel. Names are lower case nouns for objects (`name:'hoverbike'`), capitalised
for rooms. `de:true` makes clues say "de X" instead of "een X" (use it for the unique throne
equivalent). `art` is the room's article: "Was in **het** observatorium".

Occupiable objects (stoel, paard, bank, tapijt, bed, troon) carry a pawn: give them a flat
surface at height `h` (castle: stoel .31, bank .31, troon .38, bed .37, paard .63, tapijt .026)
and set `verb` ('Zat' for seats, 'Lag' for beds, 'Stond' for floor rugs/platforms).

### Translations (`i18n`)

The inline text is Dutch. Every setting must also provide `i18n.en`, and any other language in
`LANGS` (`scripts/build.mjs`) gets its own `i18n.<lang>` block. On a non-Dutch page,
`registerTheme` drops the Dutch grammar fields (room `art`, object `art`, `de`, and `verb`) and then
merges the block over the theme. Keys missing from the block fall back to the Dutch text, so give
every key.

```js
i18n:{en:{
  label:'Castle', title:'Murder in the castle', loading:'Raising the drawbridge…',
  subs:['…5 English one-liners…'],
  victims:[['Lord Vranck','m'],['Lady Walburga','f']],   // same order and genders as the Dutch list
  names:{…},                                              // optional; same letter rules as the Dutch names
  rooms:{Stal:{name:'Stable'}, Troonzaal:{name:'Throne room'}, …all 10},
  objs:{stoel:{name:'chair',verb:'Sat'}, troon:{name:'throne',verb:'Sat',art:'the'}, kist:{name:'chest'}, …all 21},
}}
```

English grammar fields, used by `L.clue` in `src/3d/i18n/en.js`:

- Object `art`: defaults to "a" or "an" from the first letter. Set `art:'the'` for unique objects
  (the throne equivalent), or `art:'an'`/`'a'` when the first letter misleads ("an hourglass").
- Object `verb`: "Sat", "Lay", or "Stood" (default "Stood") for occupiable objects.
- Room `art`: defaults to "the". Set `art:''` for no article ("Was in **sickbay**").

Room and object names are not translated anywhere else: canvas textures that draw text (signs,
labels) must read the name from the theme at build time, not hard-code Dutch.

### Object builders

`build(L,ctx)` returns a `THREE.Group` centred on the origin, floor at y=0, sized to fit inside a
0.95×0.95 cell. Multi-cell objects run along +x and get `L` cells: tapijt 1–3, tafel 1–2,
bed 2. Single-cell objects get a random quarter turn. A soft contact-shadow decal is added under
every object automatically (`blob:false` turns it off, for flat rugs for example).

Make them beautiful: bevelled and rounded shapes (`ExtrudeGeometry` with bevel, `LatheGeometry`,
`CapsuleGeometry`, `TorusGeometry`, `RoundedBoxGeometry` is not imported, use `roundRect` + extrude),
real proportions, small details, varied materials (metal, glass with `MeshPhysicalMaterial`
transmission is too slow; use metalness/roughness and emissive instead), emissive parts that
bloom (emissive intensity above ~1.6 in linear light blooms with the default threshold).

## Engine globals you can use

- `THREE` (whole namespace), `mergeGeometries` (BufferGeometryUtils).
- `mat(color, opts)` cached `MeshStandardMaterial`; `box(w,h,d,m,x,y,z)`, `cyl(rt,rb,h,m,x,y,z,seg)`,
  `ball(r,m,x,y,z,detail)` all return shadow-casting meshes; `sh(mesh)` turns shadows on.
- `flame(x,y,z,scale)` an animated flickering flame + glow; `candle(x,z,h,y)`.
- `flames.push({light:PointLight, ph})` flickers a light; `flames.push({flag:mesh, ph})` waves a flag.
- `noiseTex(base,amp,size)`, `stoneTex`, `GRASS`, `WATER` (repeat textures), `GLOW` (radial sprite),
  `gradTex(stops)`, `roundRect(w,d,r)` → `THREE.Shape`, `stars(parent,n,color,size,opacity,band)`.
- `mergeStatic([materials])` merges every static mesh directly under `world` with those materials
  into one draw call. Use it for walls, rocks, repeated scenery.
- `WOOD`, `DWOOD`, `GOLD` (material opts), `HQ` (false on phones: use it to scale particle counts).
- `ctx = {world, N, H (=N/2), E (=H+.2, outer wall line), seed, rand (seeded 0..1), anim(fn), M}`.
  The board spans x,z ∈ [-H, H] at y≈0; tiles top out at y≈0. Scenery goes outside the board.
- `ctx.anim((t,dt)=>{…})` runs every frame (t in seconds). `obj.userData.sway=[amp,speed,phase]`
  makes any object sway gently (trees, lanterns, plants).

The engine owns: tiles, region walls, labels, pawns, notes, the camera (orbit, polar ≤ 1.12 rad,
distance roughly 1.6–2.2×N), sun shadow camera, a slow sun drift (disable with `look.sunFixed`).
The camera looks at the board from above at ~40–60°, so the scenery ring around the board and the
sky gradient behind it are what the player sees; the far horizon shows at the top.

## Quality bar

- Wildly distinct mood: its own sky, sun colour and angle, fog, palette, materials, scenery.
- Fidelity: low sun angles give long readable shadows; contact shadows; bevels; rim light.
- Everything that can move, moves: water, particles, flags, lights, vehicles, creatures, clouds,
  smoke, celestial bodies. Keep motion calm so it does not distract from the puzzle.
- Readability first: floors of different rooms must stay clearly distinguishable, walls must read,
  the board must not be darker than the castle. Pawns are coloured discs with emoji; keep objects
  under ~0.9 high so they never hide pawns from the default camera.
- Performance: aim under ~350 draw calls (merge or instance repeated meshes), particles via
  `THREE.Points`, scale counts by `HQ`. No external assets or network loads: everything is
  procedural (geometry + canvas textures).
- Dutch inline text and a complete `i18n.en` block, with correct grammar in both ("Zat op de commandostoel", "Sat on the command chair"). Check the clues in the browser at `/3d/` and `/nl/3d/`.
