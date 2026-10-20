// Shot map for the two-wheel shooter, built with the biobuzz-shot-sim engine.
// Grid: range (in, horizontal, robot centre to the up-CELL mouth centroid) x
// bearing (deg between the shot and the CELL's outward facing, 0 = straight in).
// Each cell holds the sim's best pitch (deg) and exit speed (m/s) for POLLEN and NECTAR.
//   node analysis/shot-map/make_shot_table.mjs [--height 16] [--check <ShotTable.java>]
// --check exits 1 if the Java table differs from what the sim gives now.
// SHOTSIM=<biobuzz-shot-sim checkout> if it isn't next to this repo.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const arg = (k) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : null; };
const SIM = process.env.SHOTSIM || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../biobuzz-shot-sim');
const H0 = +(arg('height') || 16);
const CHECK = arg('check');
const { loadEngine, BASE } = await import(pathToFileURL(path.join(SIM, 'tests', 'load-data.mjs')).href);
const E = loadEngine();

const shooter = { type: 'dual', wheelDiameterMm: 96, motorsPerWheel: 1, gear: 0.5, topRatio: 1.0, inertiaKgM2: 6e-4, shotInterval: 0.30, control: 'pid', batteryV: 12.5 };
const CX = -12.75, CY = -16.49;          // red up-CELL mouth centroid with the CELL up on the audience side
const LIM = 61.5;                         // robot centre stays 9 in off the walls
const RANGES = [12.5, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70];
const BEARINGS = [0, 20, 40, 60, 75];

const evalAt = (ball, x, y) => E.evaluate({
  ...BASE, ballId: ball, target: 'red', hiveState: { red: -1, blue: 1 }, robot: { x, y }, h0: H0, motorId: 'yj6000',
  precision: { sigThetaDeg: 1, sigYawDeg: 1, sigShooter: 0.015 }, shooter,
}, 'full');

const grid = { pollen: { th: [], v: [], hit: [] }, nectar: { th: [], v: [], hit: [] } };
for (const b of BEARINGS) {
  for (const ball of ['pollen', 'nectar']) for (const k of ['th', 'v', 'hit']) grid[ball][k].push([]);
  let last = null;
  for (const r of RANGES) {
    const a = b * Math.PI / 180;
    const x = CX - r * Math.sin(a), y = CY - r * Math.cos(a);
    const inside = Math.abs(x) <= LIM && Math.abs(y) <= LIM;
    const cell = {};
    for (const ball of ['pollen', 'nectar']) {
      const res = inside ? evalAt(ball, x, y) : null;
      cell[ball] = res && res.best ? { th: res.best.thetaDeg, v: res.best.v, hit: res.hitRate } : null;
    }
    const use = cell.pollen && cell.nectar ? cell : last;
    for (const ball of ['pollen', 'nectar']) {
      const g = grid[ball], i = g.th.length - 1;
      g.th[i].push(use ? use[ball].th : NaN); g.v[i].push(use ? use[ball].v : NaN);
      g.hit[i].push(cell[ball] ? cell[ball].hit : (use ? -1 : NaN));
    }
    if (cell.pollen && cell.nectar) last = cell;
  }
}
// rows that start empty (too close to the HIVE at a steep bearing) borrow the next valid range
for (const ball of ['pollen', 'nectar']) for (const k of ['th', 'v']) for (const row of grid[ball][k]) {
  for (let i = row.length - 2; i >= 0; i--) if (Number.isNaN(row[i])) row[i] = row[i + 1];
}

const f = (x, d = 1) => (Number.isNaN(x) ? 'NaN' : x.toFixed(d));
for (const ball of ['pollen', 'nectar']) {
  console.log(`\n${ball.toUpperCase()}  pitch/speed/hit by bearing (rows) and range (cols)`);
  console.log('bear\\r ' + RANGES.map((r) => String(r).padStart(15)).join(''));
  BEARINGS.forEach((b, i) => console.log(String(b).padStart(6) + ' ' + RANGES.map((_, j) => {
    const h = grid[ball].hit[i][j];
    return `${f(grid[ball].th[i][j])}/${f(grid[ball].v[i][j], 2)}/${h < 0 ? 'cp' : f(h * 100, 0)}`.padStart(15);
  }).join('')));
}
const arr2 = (m, d) => '{\n' + m.map((row) => '            {' + row.map((x) => f(x, d)).join(', ') + '}').join(',\n') + '\n    }';
console.log('\n// ShotTable.java');
console.log(`    static final double[] RANGE_IN = {${RANGES.join(', ')}};`);
console.log(`    static final double[] BEARING_DEG = {${BEARINGS.join(', ')}};`);
console.log(`    static final double[][] POLLEN_PITCH = ${arr2(grid.pollen.th, 1)};`);
console.log(`    static final double[][] POLLEN_SPEED = ${arr2(grid.pollen.v, 3)};`);
console.log(`    static final double[][] NECTAR_PITCH = ${arr2(grid.nectar.th, 1)};`);
console.log(`    static final double[][] NECTAR_SPEED = ${arr2(grid.nectar.v, 3)};`);

if (CHECK) {
  const java = fs.readFileSync(CHECK, 'utf8');
  const nums = (name) => { const m = new RegExp(name + String.raw` = \{([\s\S]*?)\};`).exec(java); return m ? m[1].match(/-?\d+(\.\d+)?/g) : null; };
  const want = {
    RANGE_IN: RANGES.map(String), BEARING_DEG: BEARINGS.map(String),
    POLLEN_PITCH: grid.pollen.th.flat().map((x) => f(x, 1)), POLLEN_SPEED: grid.pollen.v.flat().map((x) => f(x, 3)),
    NECTAR_PITCH: grid.nectar.th.flat().map((x) => f(x, 1)), NECTAR_SPEED: grid.nectar.v.flat().map((x) => f(x, 3)),
  };
  let bad = 0;
  for (const [name, exp] of Object.entries(want)) {
    const got = nums(name);
    const same = got && got.length === exp.length && got.every((v, i) => Math.abs(+v - +exp[i]) < 1e-9);
    console.log(`${same ? '✔' : '✖'} ${name} ${same ? 'matches the sim' : 'differs from the sim'}`);
    if (!same) bad++;
  }
  process.exit(bad ? 1 : 0);
}
