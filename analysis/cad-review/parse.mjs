// Parses a STEP assembly with FTC SimBench Pro's parser and writes every placed
// part with its sub-assembly path and bounding box.
//   node analysis/cad-review/parse.mjs <robot.step> <out.json>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const W = (process.env.SIMBENCH || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../ftc-simbench-pro')) + '/';
const { loadEngine } = await import(pathToFileURL(W + 'tests/load.mjs').href);
const E = loadEngine();
const [,, stepPath, outPath] = process.argv;
const text = fs.readFileSync(stepPath, 'latin1');
const t0 = Date.now();
const cad = E.parseSTEP(text, (m) => console.error('..', m));
console.error('parsed in', (Date.now() - t0) / 1000, 's; units', cad.units, 'solids', cad.solids.length);
const solids = cad.solids.map((s, i) => {
  const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
  for (const p of s.pts) for (let k = 0; k < 3; k++) { if (p[k] < mn[k]) mn[k] = p[k]; if (p[k] > mx[k]) mx[k] = p[k]; }
  return { i, name: s.name, part: s.part, kind: s.kind, size: s.size, asm: (s.asm || []).map(a => a.n), mn, mx, pts: s.pts };
});
fs.writeFileSync(outPath, JSON.stringify({ frame: cad.frame, bbox: cad.bbox, parts: cad.parts, mechs: (cad.mechs || []).map(m => ({ name: m.name, kind: m.kind, axis: m.axis, pivot: m.pivot, parts: m.parts && m.parts.length })), solids }));
console.error('frame', JSON.stringify(cad.frame && { up: cad.frame.up, origin: cad.frame.origin }), 'bbox', JSON.stringify(cad.bbox));
