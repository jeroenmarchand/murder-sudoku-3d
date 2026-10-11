// Unit tests for the puzzle generator in src/core.js (runs in Node, no browser).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const ctx = vm.createContext({});
vm.runInContext(fs.readFileSync(new URL('../src/core.js', import.meta.url), 'utf8') + ';this.api={generate,geom,atomsFor,countSolutions,DIFF,OCC};', ctx);
const { generate, geom, atomsFor, countSolutions, DIFF } = ctx.api;

const CASES = [['easy', [1, 12, 99]], ['medium', [75, 2024]], ['hard', [4031]]];

for (const [diff, seeds] of CASES) {
  for (const seed of seeds) {
    test(`${diff}-${seed}: valid puzzle with exactly one solution`, () => {
      const P = generate(seed, diff);
      assert.ok(P, 'generator returned a puzzle');
      const { M, sus, vic, sol, clues, killer } = P;
      assert.equal(M.N, DIFF[diff].N);
      assert.equal(sus.length, M.N - 1);
      sus.forEach((s, i) => assert.equal(s.name[0], 'ABCDEFGH'[i], `suspect ${s.name} starts with its letter`));

      // one person per row and per column, all on occupiable cells
      const G = geom(M);
      const cells = Object.values(sol);
      assert.equal(new Set(cells.map(i => Math.floor(i / M.N))).size, M.N, 'rows unique');
      assert.equal(new Set(cells.map(i => i % M.N)).size, M.N, 'columns unique');
      cells.forEach(i => assert.ok(G.occ.includes(i), `cell ${i} is occupiable`));

      // the killer is the only other person in the victim's room
      const room = M.reg[sol[vic.name]];
      const inRoom = Object.keys(sol).filter(n => n !== vic.name && M.reg[sol[n]] === room);
      assert.deepEqual(inRoom, [killer]);

      // the clues allow exactly one solution
      const people = sus.map(s => s.name).concat(vic.name);
      const r = countSolutions(M, G, atomsFor(M, G), people, vic.name, clues, 2, 5e6);
      assert.equal(r.over, false, 'solver finished within budget');
      assert.equal(r.count, 1);
    });
  }
}

test('same seed gives the same puzzle', () => {
  assert.equal(JSON.stringify(generate(42, 'easy')), JSON.stringify(generate(42, 'easy')));
});
