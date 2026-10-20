// cad/gen/check.mjs — run by `transfer-outtake.mjs --check`.
// 1. OpenCascade reads the STEP back: every solid meshes, bbox matches, key parts measured.
// 2. Clash sweep of the new parts against each other over pitch 60/72/87, top wheel
//    lifted for NECTAR, stopper open/closed, swing plate at rest / full travel.
// 3. START height at every pitch, and the ball geometry (gaps, staged ball vs top wheel).

import path from 'node:path';
import { pathToFileURL } from 'node:url';

const r1 = (v) => Math.round(v * 10) / 10;
const fmt = (a) => '(' + a.map(r1).join(', ') + ')';

/* exact world AABB of one body (mm) */
function aabb(b) {
  const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
  const W = (lx, ly, lz) => [0, 1, 2].map((k) => b.o[k] + b.x[k] * lx + b.y[k] * ly + b.z[k] * lz);
  const grow = (p, pad = [0, 0, 0]) => { for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], p[k] - pad[k]); mx[k] = Math.max(mx[k], p[k] + pad[k]); } };
  if (b.type === 'prism') for (const q of b.profile) { grow(W(q[0], q[1], 0)); grow(W(q[0], q[1], b.h)); }
  else { const pad = [0, 1, 2].map((k) => b.r * Math.sqrt(Math.max(0, 1 - b.z[k] * b.z[k]))); grow(W(0, 0, 0), pad); grow(W(0, 0, b.h), pad); }
  return { mn, mx };
}
const unionBox = (list) => list.reduce((A, B) => ({ mn: A.mn.map((v, k) => Math.min(v, B.mn[k])), mx: A.mx.map((v, k) => Math.max(v, B.mx[k])) }), { mn: [Infinity, Infinity, Infinity], mx: [-Infinity, -Infinity, -Infinity] });

export async function checkAll({ text, bodies, layout, build, worldBodies, clashes, D, loadOcct, SIMBENCH }) {
  let bad = 0;
  const fail = (s) => { bad++; console.log('  FAIL ' + s); };

  /* ---- 1. OpenCascade ---- */
  console.log('\n[1] OpenCascade (occt-import-js) read-back');
  const occt = await loadOcct(process.env.OCCT_IMPORT_JS || path.join(SIMBENCH, 'node_modules', 'occt-import-js'));
  if (!occt) { fail('occt-import-js not found'); return 1; }
  const r = occt.ReadStepFile(new TextEncoder().encode(text), { linearUnit: 'millimeter', linearDeflectionType: 'bounding_box_ratio', linearDeflection: 0.0005, angularDeflection: 0.3 });
  if (!r || !r.success) { fail('ReadStepFile failed'); return 1; }
  const meshBox = [];
  let empty = 0, tris = 0;
  // a multi-body part keeps its name on the tree node, not on its meshes
  const nodeName = new Map();
  const visit = (nd) => { for (const i of nd.meshes || []) nodeName.set(i, nd.name); for (const c of nd.children || []) visit(c); };
  visit(r.root);
  for (const [i, mh] of r.meshes.entries()) {
    if (!mh.name && nodeName.get(i)) mh.name = nodeName.get(i);
    const Pp = mh.attributes?.position?.array || [], I = mh.index?.array || [];
    if (!Pp.length || !I.length) { empty++; continue; }
    tris += I.length / 3;
    const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < Pp.length; i += 3) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], Pp[i + k]); mx[k] = Math.max(mx[k], Pp[i + k]); }
    meshBox.push({ name: mh.name || '', mn, mx });
  }
  console.log(`  success, ${r.meshes.length} meshes (${empty} empty), ${tris} triangles; solids written: ${bodies.length}`);
  if (empty) fail(empty + ' empty meshes');
  if (r.meshes.length !== bodies.length) fail(`${r.meshes.length} meshes for ${bodies.length} solids`);
  // occt-import-js names a multi-body part below the second tree level after its subassembly, so
  // match every mesh to the solid it came from by bounding box (and that checks each solid on its own)
  const boxes = bodies.map((b) => ({ b, bb: aabb(b), used: false }));
  let worst = 0;
  for (const mb of meshBox) {
    let best = null, be = Infinity;
    for (const c of boxes) { if (c.used) continue; const e = Math.max(...[0, 1, 2].flatMap((k) => [Math.abs(c.bb.mn[k] - mb.mn[k]), Math.abs(c.bb.mx[k] - mb.mx[k])])); if (e < be) { be = e; best = c; } }
    best.used = true; worst = Math.max(worst, be);
    if (!best.b.part.startsWith(mb.name)) mb.name = best.b.part;
  }
  console.log(`  every mesh matched to its own solid; worst bbox difference ${worst.toFixed(2)} mm`);
  if (worst > 0.5) fail('a mesh does not match its solid');
  const all = unionBox(meshBox), truth = unionBox(bodies.map(aabb));
  const err = Math.max(...[0, 1, 2].flatMap((k) => [Math.abs(all.mn[k] - truth.mn[k]), Math.abs(all.mx[k] - truth.mx[k])]));
  console.log(`  bbox ${fmt(all.mn)} .. ${fmt(all.mx)} mm; vs the solids as written: ${err.toFixed(2)} mm`);
  if (err > 0.5) fail('bbox mismatch');

  // measure named parts on the OCCT meshes (names carry the part name)
  const pick = (re) => unionBox(meshBox.filter((x) => re.test(x.name)));
  const cen = (b) => b.mn.map((v, k) => (v + b.mx[k]) / 2);
  const named = meshBox.filter((x) => x.name).length;
  console.log(`  ${named}/${meshBox.length} meshes carry a part name`);
  const rows = [];
  const want = (label, got, exp, tol = 0.6) => { const ok = got.every((v, k) => exp[k] == null || Math.abs(v - exp[k]) <= tol); rows.push([label, fmt(got), fmt(exp.map((v) => v ?? NaN)).replace(/NaN/g, '-'), ok ? 'ok' : 'MISMATCH']); if (!ok) bad++; };
  if (named) {
    const wb = pick(/^Column Wall Back/), wf = pick(/^Column Wall Front/);
    want('column walls: inner faces x', [wb.mx[0], wf.mn[0]], [-D.ballX, D.ballX]);
    want('column walls: z range', [Math.min(wb.mn[2], wf.mn[2]), Math.max(wb.mx[2], wf.mx[2])], [D.floorZ, D.colTop]);
    const gk = meshBox.filter((x) => /Gecko/.test(x.name));
    const gy = [...new Set(gk.map((x) => r1(cen(x)[1])))].sort((a, b) => a - b), gz = [...new Set(gk.map((x) => r1(cen(x)[2])))].sort((a, b) => a - b);
    want('Gecko stacks: wheel centre y', gy, [-D.stackY, D.stackY]);
    want('Gecko stacks: axle z', gz, D.axZ);
    want('Gecko diameter (z extent)', [gk[0].mx[2] - gk[0].mn[2]], [72]);
    want('stack tip gap (y)', [Math.min(...gk.filter((x) => cen(x)[1] > 0).map((x) => x.mn[1])) - Math.max(...gk.filter((x) => cen(x)[1] < 0).map((x) => x.mx[1]))], [61]);
    const irs = meshBox.filter((x) => /IR Break Beam/.test(x.name)).map((x) => r1(cen(x)[2]));
    want('IR beams z', [...new Set(irs)].sort((a, b) => a - b), D.beamZ);
    want('stopper flap underside z', [pick(/^Stopper Flap/).mn[2]], [D.flapZ]);
    want('435 motor axis (y, z)', cen(pick(/435 rpm/)).slice(1).map((v, k) => k === 0 ? v : v), [D.stackY, D.axZ[3]]);
    const sh = pick(/^Shooter Shaft/);
    want('shooter shaft = pivot (x, z)', [cen(sh)[0], cen(sh)[2]], D.A);
    const hb = cen(pick(/^72mm Hogback Top Wheel/));
    const th = D.pitch * Math.PI / 180;
    want('top wheel centre (x, z) @72', [hb[0], hb[2]], [D.A[0] + D.arm * Math.sin(th), D.A[1] - D.arm * Math.cos(th)]);
    want('top wheel centre distance', [Math.hypot(hb[0] - D.A[0], hb[2] - D.A[1])], [D.arm]);
    const mo = pick(/6000 rpm/);
    want('6000 rpm motor axis (x, z)', [cen(mo)[0], cen(mo)[2]], D.m6000);
    want('belt pulley radii 40T/20T (ratio)', [(pick(/40T Pulley/).mx[2] - pick(/40T Pulley/).mn[2]) / (pick(/20T Pulley/).mx[2] - pick(/20T Pulley/).mn[2])], [2], 0.01);
    want('pitch gears 60T/20T (ratio)', [(pick(/Pitch Gear 60T/).mx[2] - pick(/Pitch Gear 60T/).mn[2]) / (pick(/Servo Gear 20T/).mx[2] - pick(/Servo Gear 20T/).mn[2])], [3], 0.05);
    const rp = meshBox.filter((x) => /Floating Ramp Plate/.test(x.name));
    const back = rp.find((x) => cen(x)[0] < 0), front = rp.find((x) => cen(x)[0] > 0);
    // the top surface runs mouth -> top end; the 3 mm plate hangs under it, so its far corners sit 3*sin(38) inboard
    const tn = Math.atan2(D.rampTop[1] - D.rampMouth[1], D.rampMouth[0] - D.rampTop[0]), sx = D.rampT * Math.sin(tn), sz = D.rampT * Math.cos(tn);
    want('ramp back: mouth x / top-end x', [back.mn[0], back.mx[0]], [-D.rampMouth[0], -D.rampTop[0] + sx], 0.3);
    want('ramp front: mouth x / top-end x', [front.mx[0], front.mn[0]], [D.rampMouth[0], D.rampTop[0] - sx], 0.3);
    want('ramp z: lip underside / top end', [back.mn[2], back.mx[2]], [D.rampMouth[1] - sz, D.rampTop[1]], 0.3);
    want('ramp angle (deg)', [Math.atan2(back.mx[2] - (back.mn[2] + sz), (back.mx[0] - sx) - back.mn[0]) * 180 / Math.PI], [37.9], 0.1);
    want('max height (START 457.2)', [all.mx[2]], [null]);
    rows.push(['', '', '', '']);
  }
  const w = [0, 1, 2].map((k) => Math.max(...rows.map((x) => x[k].length)));
  for (const x of rows) if (x[0]) console.log('  ' + x[0].padEnd(w[0]) + '  ' + x[1].padEnd(w[1]) + '  want ' + x[2].padEnd(w[2]) + '  ' + x[3]);
  if (all.mx[2] > D.start) fail('taller than START');

  /* ---- 2. clash sweep ---- */
  console.log('\n[2] clash sweep (new parts against each other)');
  const seen = new Map(); const shaftPairs = new Map();
  const poses = [];
  for (const pitch of [D.pitchMin, D.pitch, D.pitchMax]) for (const bLift of [0, 21]) for (const flapOpen of [false, true]) for (const swing of [0, D.travel]) poses.push({ pitch, bLift, flapOpen, swing });
  for (const pose of poses) {
    const { root } = build(pose);
    for (const c of clashes(worldBodies(root))) {
      const key = [c.a, c.b].sort().join('  <>  ');
      const tag = `p${pose.pitch}${pose.bLift ? ' lift' : ''}${pose.flapOpen ? ' open' : ''}${pose.swing ? ' swing' : ''}`;
      const map = c.shaft ? shaftPairs : seen;
      if (!map.has(key)) map.set(key, new Set());
      map.get(key).add(tag);
    }
  }
  console.log(`  ${poses.length} poses`);
  for (const [k, tags] of seen) console.log('  CLASH ' + k + '   at ' + [...tags].slice(0, 6).join(', ') + (tags.size > 6 ? ` (+${tags.size - 6})` : ''));
  if (!seen.size) console.log('  no solid clashes between plates, wheels, motors, servos, links, ramps');
  console.log(`  shaft-through pairs (bearing holes / bores to cut): ${shaftPairs.size}`);
  for (const [k] of shaftPairs) console.log('    ' + k);

  /* ---- 3. START height + ball geometry ---- */
  console.log('\n[3] START height and ball geometry');
  for (const pitch of [D.pitchMin, D.pitch, D.pitchMax]) for (const bLift of [0, 21]) {
    const { root } = build({ pitch, bLift, flapOpen: false, swing: 0 });
    const top = Math.max(...worldBodies(root).map((b) => aabb(b).mx[2]));
    console.log(`  pitch ${pitch}${bLift ? ' (NECTAR lifting the top wheel)' : ''}: highest point ${r1(top)} mm ${top <= D.start ? '<=' : '>'} 457.2`);
    if (top > D.start) bad++;
  }
  const gap = D.arm - D.aR - D.bR;
  console.log(`  nip gap ${gap} mm: POLLEN 71 squeezed ${71 - gap}, NECTAR 92 lifts the top wheel ${92 - gap - (71 - gap)} mm for the same squeeze`);
  console.log(`  column tip gap ${2 * (D.stackY - D.wheelR)} mm: same squeeze; sprung stack travel ${D.travel} mm`);
  // the staged ball under the stopper against the top wheel, over the pitch range
  const stagedN = [0, D.flapZ - 46], stagedP = [0, D.flapZ - 35.5];
  let clearFrom = null;
  for (let p = D.pitchMin; p <= D.pitchMax; p += 0.5) {
    const th = p * Math.PI / 180, B = [D.A[0] + D.arm * Math.sin(th), D.A[1] - D.arm * Math.cos(th)];
    const dn = Math.hypot(B[0] - stagedN[0], B[1] - stagedN[1]) - D.bR - 46, dp = Math.hypot(B[0] - stagedP[0], B[1] - stagedP[1]) - D.bR - 35.5;
    const fx = Math.max(-50, Math.min(8, B[0])), fz = Math.max(D.flapZ, Math.min(D.flapZ + 4, B[1]));
    const flapGap = Math.hypot(B[0] - fx, B[1] - fz) - D.bR;            // closed flap spans x -50..8, z 324..328
    if (clearFrom == null && dn > 0 && dp > 0) clearFrom = p;
    if (p === D.pitchMin || p === D.pitch || p === D.pitchMax || p === clearFrom)
      console.log(`  pitch ${p}: top wheel centre ${fmt(B)}, bottom z ${r1(B[1] - D.bR)}; vs staged NECTAR ${r1(dn)} mm, staged POLLEN ${r1(dp)} mm, vs stopper flap top ${r1(flapGap)} mm`);
  }
  console.log(`  the top wheel clears a ball staged under the stopper from pitch ${clearFrom} deg up`);
  const nip = (p) => { const th = p * Math.PI / 180, s = D.aR + gap / 2; return [D.A[0] + s * Math.sin(th), D.A[1] - s * Math.cos(th)]; };
  console.log(`  nip centre: ${fmt(nip(D.pitchMin))} @${D.pitchMin}, ${fmt(nip(D.pitch))} @${D.pitch}, ${fmt(nip(D.pitchMax))} @${D.pitchMax} (moves ${r1(Math.hypot(...nip(D.pitchMin).map((v, k) => v - nip(D.pitchMax)[k])))} mm)`);
  console.log(`  ramp: ${layout.ramps.angleDeg.toFixed(2)} deg, hinge ${fmt(layout.ramps.hinge)} (back), lip ${r1(D.rampMouth[1] - D.rampT * Math.cos(Math.atan2(144, 185)))} mm off the tiles`);
  console.log(bad ? `\n${bad} problem(s)` : '\nall checks passed');
  return bad ? 1 : 0;
}
