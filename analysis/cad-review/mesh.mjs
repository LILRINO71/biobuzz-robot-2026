// Meshes every shape in a STEP assembly once with OpenCascade, places each
// occurrence, and writes all triangles (mm) plus per-part metadata.
//   node analysis/cad-review/mesh.mjs <robot.step> <out-base>   ->  <out-base>.bin + .meta.json
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
const W = (process.env.SIMBENCH || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../ftc-simbench-pro')) + '/';
const require = createRequire(W + 'package.json');
const { loadEngine } = await import(pathToFileURL(W + 'tests/load.mjs').href);
const E = loadEngine();
const occtimportjs = require('occt-import-js');
const [,, stepPath, outBase] = process.argv;
const text = fs.readFileSync(stepPath, 'latin1');
const cad = E.parseSTEP(text);
const units = E.stepShapeUnits(text, cad.occs);
console.error('occs', cad.occs.length, 'units', units.length);
const params = { linearUnit: 'meter', linearDeflectionType: 'absolute_value', linearDeflection: 0.0006, angularDeflection: 0.6 };
const meshesOf = new Map();
let oc = await occtimportjs(), done = 0, fail = 0;
for (const u of units) {
  try {
    const r = oc.ReadStepFile(new TextEncoder().encode(u.text), params);
    if (r && r.success && r.meshes.some(m => m.index && m.index.array.length)) {
      meshesOf.set(u.rep, r.meshes.map(m => ({ color: m.color, P: Float32Array.from(m.attributes.position.array), I: Uint32Array.from(m.index.array) })));
    } else fail++;
  } catch (e) { fail++; oc = await occtimportjs(); }
  if (++done % 50 === 0) console.error(done, '/', units.length);
}
console.error('meshed', meshesOf.size, 'failed', fail);
// one record per occurrence: name, path, color, tri count, offsets into big buffers
const meta = []; const posChunks = []; let nTri = 0;
for (const o of cad.occs) {
  const list = meshesOf.get(o.rep); if (!list) continue;
  const T = o.T;
  for (const m of list) {
    const P = m.P, I = m.I, out = new Float32Array(I.length * 3);
    for (let k = 0; k < I.length; k++) {
      const x = P[I[k] * 3], y = P[I[k] * 3 + 1], z = P[I[k] * 3 + 2];
      let X = x, Y = y, Z = z;
      if (T) { const r = T.r; X = r[0][0] * x + r[1][0] * y + r[2][0] * z + T.t[0]; Y = r[0][1] * x + r[1][1] * y + r[2][1] * z + T.t[1]; Z = r[0][2] * x + r[1][2] * y + r[2][2] * z + T.t[2]; }
      out[k * 3] = X * 1000; out[k * 3 + 1] = Y * 1000; out[k * 3 + 2] = Z * 1000;
    }
    meta.push({ name: o.name, path: (o.path || []).map(p => p.n), keys: (o.path || []).map(p => p.k), color: m.color, tri0: nTri, tris: I.length / 3 });
    nTri += I.length / 3; posChunks.push(out);
  }
}
const all = new Float32Array(nTri * 9); let off = 0;
for (const c of posChunks) { all.set(c, off); off += c.length; }
fs.writeFileSync(outBase + '.bin', Buffer.from(all.buffer));
fs.writeFileSync(outBase + '.meta.json', JSON.stringify(meta));
console.error('tris', nTri);
