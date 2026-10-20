// cad/gen/transfer-outtake.mjs — the column transfer, the two-wheel shooter
// and the floating ramps for the dual-intake BIOBUZZ robot, written as a STEP
// assembly with ftc-simbench-pro's tools/stepgen.mjs (real B-rep solids).
//
// Usage
//   node cad/gen/transfer-outtake.mjs            write ../biobuzz-transfer-outtake.step (+ layout.json, bodies.json)
//   node cad/gen/transfer-outtake.mjs --check    ...then open it with OpenCascade, measure it, and run the clash sweep
//   SIMBENCH=<ftc-simbench-pro checkout>   where stepgen.mjs and occt-import-js live (default: a checkout next to this repo)
//
// Robot frame, mm: x forward (the shooter fires over the front intake), y left,
// z up, origin at the drivetrain centre on the tiles.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '..');
const SIMBENCH = process.env.SIMBENCH || path.resolve(HERE, '../../../ftc-simbench-pro');
const SG = await import(pathToFileURL(path.join(SIMBENCH, 'tools', 'stepgen.mjs')).href);
const { part, asm, inst, prism, cyl, frame, compose, writeStep, loadOcct, walk, COL, ngon } = SG;

/* ---------------- the numbers ---------------- */
export const D = {
  floorZ: 82, colTop: 322, ballX: 50, wallT: 6,
  stackY: 66.5, axZ: [120, 170, 220, 270], wheelR: 36, wheelW: 9,
  oddX: [-30, -10, 10, 30], evenX: [-20, 0, 20],
  linkL: 38, linkTilt: 19, travel: 25,
  beamZ: [96, 300], topBeamY: 25, flapZ: 324,
  A: [-78, 404], arm: 145, pitch: 72, pitchMin: 60, pitchMax: 87, pitchStart: 87,
  aR: 48, bR: 36, armLen: 40,
  m6000: [-176, 428], bigPulleyR: 31.8, smallPulleyR: 15.9,
  podGearR: 30, servoGearR: 10,
  rampMouth: [255, 6], rampTop: [70, 150], rampT: 3, rampHalfW: 98,
  start: 457.2
};
const POSE = { pitch: D.pitch, bLift: 0, flapOpen: false, swing: 0 };

/* ---------------- helpers (mm in, metres out) ---------------- */
const m = (v) => v / 1000;
const P = (x, y, z) => [m(x), m(y), m(z)];
const F = (o, z, x) => frame(P(...o), z, x || null);
const ccw = (pts) => { let a = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; } return a < 0 ? pts.slice().reverse() : pts; };
const mmPts = (pts) => ccw(pts).map(([a, b]) => [m(a), m(b)]);
/* plate in the x-z plane, thickness along y from yLo to yHi; profile [x, z] */
const plateXZ = (pr, yLo, yHi) => prism(frame(P(0, yHi, 0), [0, -1, 0], [1, 0, 0]), mmPts(pr), m(yHi - yLo));
/* plate in the y-z plane, thickness along x from xLo to xHi; profile [y, z] */
const plateYZ = (pr, xLo, xHi) => prism(frame(P(xLo, 0, 0), [1, 0, 0], [0, 1, 0]), mmPts(pr), m(xHi - xLo));
/* axis-aligned box from corner ranges */
const boxR = ([x0, x1], [y0, y1], [z0, z1]) => prism(frame(P(0, 0, z0)), mmPts([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]), m(z1 - z0));
/* cylinder on an axis line: centre c, unit axis a, from s0 to s1 along it */
const cylAx = (c, a, r, s0, s1) => cyl(frame(P(c[0] + a[0] * s0, c[1] + a[1] * s0, c[2] + a[2] * s0), a), m(r), m(s1 - s0));
const X = [1, 0, 0], Y = [0, 1, 0];
const circ = (c, r, n = 40) => Array.from({ length: n }, (_, i) => { const t = 2 * Math.PI * i / n; return [c[0] + r * Math.cos(t), c[1] + r * Math.sin(t)]; });
function hull(pts) {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 1e-9) lo.pop(); lo.push(q); }
  for (const q of p.slice().reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 1e-9) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
const stadium = (a, b, r) => hull(circ(a, r).concat(circ(b, r)));
const deg = Math.PI / 180;

/* goBILDA 5203 motor: output face at local z=0, shaft along +z */
function motor(name, gearboxLen, canLen, shaftLen, kg) {
  return part(name, [
    prism(frame([0, 0, -m(gearboxLen)]), ngon(4, 0.0304, Math.PI / 4), m(gearboxLen)),
    cyl(frame([0, 0, -m(gearboxLen + canLen)]), 0.0185, m(canLen)),
    prism(frame([0, 0, 0]), ngon(6, 0.0046), m(shaftLen))
  ], COL.yellow, kg);
}
/* 2000 Series servo: body centred on the origin, spline at local (10, 0, 18.5..24.5) along +z */
const servoPart = (name) => part(name, [boxR([-20, 20], [-10, 10], [-18.5, 18.5]), cyl(frame(P(10, 0, 18.5)), 0.006, 0.006)], COL.black, 0.084);
/* wheel / pulley / gear blank: axle along local z, centred on the origin */
const disc = (name, r, w, color, kg) => part(name, [cyl(frame([0, 0, -m(w / 2)]), m(r), m(w))], color, kg);
const rod = (name, r, len, kg) => part(name, [cyl(frame([0, 0, 0]), m(r), m(len))], COL.steel, kg ?? 0.0004 * len);

/* ---------------- the model ---------------- */
export function build(pose = POSE) {
  const sa = D.linkL * Math.sin(D.linkTilt * deg), ca = D.linkL * Math.cos(D.linkTilt * deg);
  const Sy0 = -D.stackY;
  const Fy = Sy0 - sa;                                  // link pivots on the walls
  const F1 = [Fy, D.axZ[0] + ca], F4 = [Fy, D.axZ[3] + ca];
  // swing plate translation for this pose: the links turn about F1/F4
  const sinA = (Sy0 - pose.swing - Fy) / D.linkL;
  const dy = -pose.swing, dz = (F1[1] - D.linkL * Math.sqrt(1 - sinA * sinA)) - D.axZ[0];
  const S1 = [Sy0 + dy, D.axZ[0] + dz], S4 = [Sy0 + dy, D.axZ[3] + dz];

  /* ---- column transfer (fixed) ---- */
  const col = [];
  const wallBack = part('Column Wall Back (6 mm plate)', [plateYZ([[-112, 82], [-50, 82], [-50, 240], [50, 240], [50, 82], [108, 82], [108, 322], [-112, 322]], -56, -50)], COL.clear, 0.32);
  const wallFront = part('Column Wall Front (6 mm plate, notched for the pod)', [plateYZ([[-112, 82], [-50, 82], [-50, 240], [50, 240], [50, 82], [108, 82], [108, 322],
    [62, 322], [62, 306], [52, 306], [52, 322], [18, 322], [18, 284], [-18, 284], [-18, 322], [-52, 322], [-52, 306], [-62, 306], [-62, 322], [-112, 322]], 50, 56)], COL.clear, 0.30);
  col.push(inst(wallBack, frame()), inst(wallFront, frame()));
  const sill = part('Column IR Sill (bottom beam mount)', [boxR([0, 6], [-50, 50], [82, 104])], COL.clear, 0.02);
  col.push(inst(sill, F([-56, 0, 0])), inst(sill, F([50, 0, 0])));
  const axle = rod('Column Fixed Axle 8mm REX 116mm', 4, 116);
  const axleDrive = rod('Column Fixed Axle 4 (motor-driven) 8mm REX 111mm', 4, 111);
  const gecko = disc('goBILDA 72mm Gecko Wheel 30A 3615-4008-0072', D.wheelR, D.wheelW, COL.rubber, 0.017);
  const pulleyIn = disc('Column Stack Pulley 24mm (inside)', 12, 6, COL.grey, 0.006);
  const pulleyOut = disc('Column Drive Pulley 24mm (outside front)', 12, 6, COL.grey, 0.006);
  D.axZ.forEach((z, i) => {
    if (i === 3) col.push(inst(axleDrive, F([-44, D.stackY, z], X)), inst(pulleyOut, F([64, D.stackY, z], X)));
    else col.push(inst(axle, F([-58, D.stackY, z], X)));
    for (const x of (i % 2 ? D.evenX : D.oddX)) col.push(inst(gecko, F([x, D.stackY, z], X)));
    col.push(inst(pulleyIn, F([41, D.stackY, z], X)));
  });
  const m435 = motor('goBILDA 5203 Yellow Jacket 435 rpm 5203-2402-0014 (column)', 44, 60, 12, 0.35);
  col.push(inst(m435, F([-56, D.stackY, D.axZ[3]], X)));
  // link pivots: pins through the walls; the front top one is the jackshaft that drives the sprung stack
  const pin = rod('Swing Link Pivot Pin 8mm', 4, 10, 0.004);
  const jack = rod('Sprung Stack Jackshaft 8mm (front top link pivot)', 4, 23, 0.007);
  col.push(inst(pin, F([-60, F1[0], F1[1]], X)), inst(pin, F([50, F1[0], F1[1]], X)), inst(pin, F([-60, F4[0], F4[1]], X)), inst(jack, F([50, F4[0], F4[1]], X)));
  // outside the front wall, three planes: gears x 57..61, belts x 61..67 and x 67..73
  col.push(inst(pulleyOut, F([64, F4[0], F4[1]], X)), inst(pulleyOut, F([70, F4[0], F4[1]], X)));
  // reversing gear pair, outside the front wall
  const gear = disc('Column Reversing Gear 40T mod 1', 19.5, 4, COL.grey, 0.01);
  const stub = rod('Reversing Gear Stub Shaft 8mm', 4, 17, 0.004);
  for (const y of [20, -20]) col.push(inst(gear, F([59, y, 262], X)), inst(pulleyOut, F([64, y, 262], X)), inst(stub, F([50, y, 262], X)));
  // links (they turn with the swing; drawn at this pose)
  const linkB = part('Swing Link Bottom (4 mm)', [plateYZ(stadium(F1, S1, 7), 0, 4)], COL.orange, 0.008);
  const linkT = part('Swing Link Top (4 mm)', [plateYZ(stadium(F4, S4, 7), 0, 4)], COL.orange, 0.008);
  col.push(inst(linkB, F([-60, 0, 0])), inst(linkB, F([56, 0, 0])), inst(linkT, F([-60, 0, 0])), inst(linkT, F([56, 0, 0])));
  // IR break beams (3 mm emitter / receiver housings outside the walls)
  const ir = part('IR Break Beam 3mm (emitter or receiver)', [boxR([0, 8], [-6, 6], [-6, 6])], COL.black, 0.004);
  col.push(inst(ir, F([-64, 0, D.beamZ[0]])), inst(ir, F([56, 0, D.beamZ[0]])), inst(ir, F([-64, D.topBeamY, D.beamZ[1]])), inst(ir, F([56, D.topBeamY, D.beamZ[1]])));
  // stopper: servo on the back wall, flap on its spline, hinge along x at (y 54, z 330)
  const hinge = [54, 330];
  const sSrv = servoPart('Stopper Servo goBILDA 2000-0025-0002');
  col.push(inst(sSrv, { o: P(-74.5, hinge[0] - 10, hinge[1]), x: [0, 1, 0], y: [0, 0, 1], z: [1, 0, 0] }));
  // stops 8 mm past the ball's crown so the top wheel never reaches it, even at pitch 60
  const flap = part('Stopper Flap (4 mm, closed = horizontal)', [boxR([-50, 8], [-12 - hinge[0], 4], [D.flapZ - hinge[1], D.flapZ + 4 - hinge[1]])], COL.orange, 0.010);
  const fa = pose.flapOpen ? -90 * deg : 0;           // opens by turning up to vertical on the +y side
  col.push(inst(flap, { o: P(0, hinge[0], hinge[1]), x: [1, 0, 0], y: [0, Math.cos(fa), Math.sin(fa)], z: [0, -Math.sin(fa), Math.cos(fa)] }));

  /* ---- sprung stack on the swing plates (translated by the links) ---- */
  const spr = [];
  const swing = part('Swing Plate (6 mm, sprung stack)', [plateYZ([[-112, 96], [-48, 96], [-48, 296], [-112, 296]], 0, 6)], COL.alu, 0.09);
  spr.push(inst(swing, F([-50, 0, 0])), inst(swing, F([44, 0, 0])));
  const sAxleEnd = rod('Sprung Axle 8mm REX 120mm (links ride on it)', 4, 120);
  const sAxleTop = rod('Sprung Axle 4 8mm REX 133mm (driven through the top link)', 4, 133);
  const sAxle = rod('Sprung Axle 8mm REX 100mm', 4, 100);
  const pulleyS = disc('Sprung Stack Pulley 24mm (inside)', 12, 6, COL.grey, 0.006);
  D.axZ.forEach((z, i) => {
    spr.push(inst(i === 0 ? sAxleEnd : i === 3 ? sAxleTop : sAxle, F([i === 0 || i === 3 ? -60 : -50, Sy0, z], X)));
    for (const x of (i % 2 ? D.evenX : D.oddX)) spr.push(inst(gecko, F([x, Sy0, z], X)));
    spr.push(inst(pulleyS, F([40, Sy0, z], X)));
  });
  spr.push(inst(pulleyOut, F([70, Sy0, D.axZ[3]], X)));
  const sprung = asm('Sprung Stack (swing plate, 25 mm travel)', spr);
  col.push(inst(sprung, F([0, dy, dz])));
  const column = asm('Column Transfer', col);

  /* ---- shooter frame (fixed) ---- */
  const [Ax, Az] = D.A;
  const sh = [];
  const tower = part('Shooter Tower (6 mm plate, bolts on the back intake 1107 channels)', [plateXZ([[-205, 304], [-58, 304], [-58, 412], [-66, 424], [-90, 430], [-140, 455], [-205, 455]], 0, 6)], COL.alu, 0.22);
  sh.push(inst(tower, F([0, -136, 0])), inst(tower, F([0, 130, 0])));
  sh.push(inst(rod('Shooter Shaft 8mm REX 290mm (wheel shaft = pod pivot)', 4, 290), F([Ax, -140, Az], Y)));
  const hog96 = disc('96mm Hogback Shooter Wheel 50A', D.aR, 24, COL.rubber, 0.09);
  sh.push(inst(hog96, F([Ax, 18, Az], Y)), inst(hog96, F([Ax, -18, Az], Y)));
  sh.push(inst(disc('goBILDA Steel Flywheel (on the shooter shaft)', 44, 10, COL.steel, 0.30), F([Ax, 0, Az], Y)));
  sh.push(inst(disc('HTD5 40T Pulley (shooter shaft)', D.bigPulleyR, 10, COL.grey, 0.04), F([Ax, 143, Az], Y)));
  const [Mx, Mz] = D.m6000;
  sh.push(inst(motor('goBILDA 5203 Yellow Jacket 6000 rpm 5203-2402-0001 (shooter)', 14, 52, 20, 0.29), F([Mx, 130, Mz], Y)));
  sh.push(inst(disc('HTD5 20T Pulley (shooter motor)', D.smallPulleyR, 10, COL.grey, 0.015), F([Mx, 143, Mz], Y)));
  // pitch drive: servo with a 20T gear meshing the pod's 60T gear (3:1), behind and below the pivot
  const g = [Ax + 40 * Math.cos(225 * deg), Az + 40 * Math.sin(225 * deg)];
  sh.push(inst(servoPart('Pitch Servo goBILDA 2000-0025-0002 (torque)'), { o: P(g[0], -96.5, g[1] - 10), x: [0, 0, 1], y: [1, 0, 0], z: [0, 1, 0] }));
  sh.push(inst(disc('Pitch Servo Gear 20T mod 1', D.servoGearR - 0.2, 4, COL.grey, 0.004), F([g[0], -70, g[1]], Y)));
  sh.push(inst(part('Pitch Servo Bracket', [boxR([-24, 24], [-15, 0], [-24, 24])], COL.alu, 0.03), F([g[0], -115, g[1]])));
  const frameAsm = asm('Shooter Frame', sh);

  /* ---- shooter pod, in its own frame: origin on the pivot, x = shot direction,
         z = 90 deg up from it, y = robot y. B sits 145 mm along -z (the normal). ---- */
  const th = pose.pitch * deg;
  const e1 = [Math.cos(th), 0, Math.sin(th)], e3 = [-Math.sin(th), 0, Math.cos(th)];
  const Bl = [0, -D.arm], Pl = [D.armLen, -D.arm];
  const phi = Math.asin(Math.min(1, pose.bLift / D.armLen));
  const Bp = [Pl[0] - D.armLen * Math.cos(phi), Pl[1] - D.armLen * Math.sin(phi)];
  const pod = [];
  const podPlate = part('Shooter Pod Side Plate (6 mm)', [plateXZ(hull(circ([0, 0], 50, 64).concat(circ(Pl, 14))), 0, 6)], COL.alu, 0.12);
  pod.push(inst(podPlate, F([0, -67, 0])), inst(podPlate, F([0, 61, 0])));
  pod.push(inst(disc('Pod Pitch Gear 60T mod 1', D.podGearR - 0.2, 4, COL.grey, 0.02), F([0, -70, 0], Y)));
  const armPlate = part('Top Wheel Arm (6 mm, sprung)', [plateXZ(stadium(Pl, Bp, 11), 0, 6)], COL.orange, 0.03);
  pod.push(inst(armPlate, F([0, -59, 0])), inst(armPlate, F([0, 53, 0])));
  const armPin = rod('Top Wheel Arm Pivot Pin 8mm', 4, 14, 0.005);
  pod.push(inst(armPin, F([Pl[0], -67, Pl[1]], Y)), inst(armPin, F([Pl[0], 53, Pl[1]], Y)));
  pod.push(inst(rod('Top Wheel Shaft 8mm REX 118mm', 4, 118), F([Bp[0], -59, Bp[1]], Y)));
  pod.push(inst(disc('72mm Hogback Top Wheel 50A', D.bR, 30, COL.rubber, 0.05), F([Bp[0], 0, Bp[1]], Y)));
  const podAsm = asm('Shooter Pod (pivots on the shooter shaft)', pod);

  /* ---- floating ramps: one sub-assembly, origin on its hinge, placed twice ---- */
  const p0 = [-D.rampMouth[0], D.rampMouth[1]], p1 = [-D.rampTop[0], D.rampTop[1]];
  const L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), t = [(p1[0] - p0[0]) / L, (p1[1] - p0[1]) / L], n = [-t[1], t[0]];
  const H = [p1[0] - 8 * t[0] - 7 * n[0], p1[1] - 8 * t[1] - 7 * n[1]];
  const rel = (q) => [q[0] - H[0], q[1] - H[1]];
  const T = D.rampT;
  const rampPlate = part('Floating Ramp Plate 38deg (3 mm polycarbonate)', [plateXZ([p0, p1, [p1[0] - T * n[0], p1[1] - T * n[1]], [p0[0] - T * n[0], p0[1] - T * n[1]]].map(rel), -D.rampHalfW, D.rampHalfW)], COL.clear, 0.12);
  const rampRod = rod('Ramp Hinge Rod 8mm 208mm', 4, 208);
  const rampBr = part('Ramp Hinge Bracket', [boxR([-6, H[0] < 0 ? -56 - H[0] : 6], [0, 6], [-6, 6])], COL.alu, 0.01);
  const ramp = asm('Floating Ramp (origin on the hinge)', [inst(rampPlate, frame()), inst(rampRod, F([0, -104, 0], Y)), inst(rampBr, F([0, 99, 0])), inst(rampBr, F([0, -105, 0]))]);

  const root = asm('BIOBUZZ Transfer + Outtake (robot frame)', [
    inst(column, frame()),
    inst(frameAsm, frame()),
    inst(podAsm, { o: P(Ax, 0, Az), x: e1, y: [0, 1, 0], z: e3 }),
    inst(ramp, F([H[0], 0, H[1]])),
    inst(ramp, { o: P(-H[0], 0, H[1]), x: [-1, 0, 0], y: [0, -1, 0], z: [0, 0, 1] })
  ]);
  const layout = {
    frame: 'robot: x forward, y left, z up, origin = drivetrain centre on the tiles, mm',
    column: { ballX: [-D.ballX, D.ballX], z: [D.floorZ, D.colTop], fixedStackY: D.stackY, sprungStackY: Sy0, axleZ: D.axZ, wheel: '72 mm Gecko 30A, 9 mm', tipGap: 2 * (D.stackY - D.wheelR), travel: D.travel,
      linkPivots: { bottom: F1, top: F4 }, motor: '435 rpm on fixed axle 4, outside the back wall', beams: { bottomZ: D.beamZ[0], topZ: D.beamZ[1], topY: D.topBeamY }, flapZ: D.flapZ, flapHinge: hinge },
    shooter: { pivot: D.A, wheelA: '96 mm x2 + flywheel', wheelB: '72 mm, sprung', centreDistance: D.arm, nipGap: D.arm - D.aR - D.bR, pitch: pose.pitch, pitchRange: [D.pitchMin, D.pitchMax], startPitch: D.pitchStart,
      bCentre: [Ax + D.arm * Math.sin(th), Az - D.arm * Math.cos(th)], nip: [Ax + (D.aR + (D.arm - D.aR - D.bR) / 2) * Math.sin(th), Az - (D.aR + (D.arm - D.aR - D.bR) / 2) * Math.cos(th)],
      armPivotLocal: Pl, motor: D.m6000, belt: '2:1 HTD5 20T -> 40T', pitchGears: '20T servo -> 60T pod (3:1)', servoGear: g },
    ramps: { mouth: D.rampMouth, top: D.rampTop, angleDeg: Math.atan2(D.rampTop[1] - D.rampMouth[1], D.rampMouth[0] - D.rampTop[0]) / deg, hinge: H.map((v) => +v.toFixed(2)), width: 2 * D.rampHalfW, thickness: T }
  };
  return { root, layout };
}

/* ---------------- world bodies (for measuring and clash checks) ---------------- */
const toMM = (v) => v.map((x) => +(x * 1000).toFixed(4));
export function worldBodies(root) {
  const out = []; let k = 0;
  walk(root, (p, Fw) => {
    if (p.kind !== 'part') return;
    k++;
    for (const b of p.bodies) {
      const G = compose(Fw, b.F);
      const rec = { part: p.name, inst: k, type: b.type, o: toMM(G.o), x: G.x, y: G.y, z: G.z };
      if (b.type === 'prism') Object.assign(rec, { profile: b.profile.map((q) => [q[0] * 1000, q[1] * 1000]), h: b.h * 1000 });
      else Object.assign(rec, { r: b.r * 1000, h: b.h * 1000 });
      out.push(rec);
    }
  });
  return out;
}
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
function inPoly(px, py, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) c = !c;
  }
  return c;
}
function segDist(px, py, poly) {
  let d = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ax, ay] = poly[j], [bx, by] = poly[i], vx = bx - ax, vy = by - ay, L2 = vx * vx + vy * vy || 1;
    const s = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / L2));
    d = Math.min(d, Math.hypot(px - ax - s * vx, py - ay - s * vy));
  }
  return d;
}
export function inside(b, p, eps = 0.3) {
  const d = [p[0] - b.o[0], p[1] - b.o[1], p[2] - b.o[2]];
  const lx = dot(d, b.x), ly = dot(d, b.y), lz = dot(d, b.z);
  if (lz <= eps || lz >= b.h - eps) return false;
  if (b.type === 'cyl') return Math.hypot(lx, ly) < b.r - eps;
  return inPoly(lx, ly, b.profile) && segDist(lx, ly, b.profile) > eps;
}
function samples(b) {
  const pts = [];
  const W = (lx, ly, lz) => [b.o[0] + b.x[0] * lx + b.y[0] * ly + b.z[0] * lz, b.o[1] + b.x[1] * lx + b.y[1] * ly + b.z[1] * lz, b.o[2] + b.x[2] * lx + b.y[2] * ly + b.z[2] * lz];
  const layers = Math.min(40, Math.max(2, Math.ceil(b.h / 2)));
  if (b.type === 'cyl') {
    const nr = Math.min(12, Math.max(2, Math.ceil(b.r / 2)));
    for (let k = 0; k < layers; k++) { const lz = (k + 0.5) * b.h / layers;
      for (let i = 0; i < nr; i++) { const rr = (i + 0.5) * b.r / nr, na = Math.max(6, Math.ceil(2 * Math.PI * rr / 2));
        for (let j = 0; j < na; j++) { const a = 2 * Math.PI * j / na; pts.push(W(rr * Math.cos(a), rr * Math.sin(a), lz)); } } }
  } else {
    const xs = b.profile.map((q) => q[0]), ys = b.profile.map((q) => q[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    let area = 0; b.profile.forEach((q, i) => { const s = b.profile[(i + 1) % b.profile.length]; area += q[0] * s[1] - s[0] * q[1]; });
    const st = Math.min(4, Math.max(0.9, Math.sqrt(Math.abs(area) / 2 / 600)));
    for (let lx = x0 + st / 2; lx < x1; lx += st) for (let ly = y0 + st / 2; ly < y1; ly += st) if (inPoly(lx, ly, b.profile))
      for (let k = 0; k < layers; k++) pts.push(W(lx, ly, (k + 0.5) * b.h / layers));
  }
  return pts;
}
function bbox(pts) { const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity]; for (const p of pts) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], p[k]); mx[k] = Math.max(mx[k], p[k]); } return { mn, mx }; }
/* every pair of solids from different part instances that share volume */
export function clashes(bodies) {
  const S = bodies.map((b) => { const s = samples(b); return { b, s, bb: bbox(s) }; });
  const out = [];
  for (let i = 0; i < S.length; i++) for (let j = i + 1; j < S.length; j++) {
    const A = S[i], B = S[j];
    if (A.b.inst === B.b.inst) continue;
    if ([0, 1, 2].some((k) => A.bb.mx[k] < B.bb.mn[k] || B.bb.mx[k] < A.bb.mn[k])) continue;
    let n = 0;
    for (const p of A.s) if (inside(B.b, p)) n++;
    for (const p of B.s) if (inside(A.b, p)) n++;
    const isShaft = (x) => x.type === 'cyl' ? x.r <= 6.5 : x.profile.length === 6 && Math.max(...x.profile.map((q) => Math.hypot(q[0], q[1]))) <= 6.5;
    if (n) out.push({ a: A.b.part, b: B.b.part, n, shaft: isShaft(A.b) || isShaft(B.b) });
  }
  return out;
}

/* ---------------- CLI ---------------- */
async function main() {
  const args = process.argv.slice(2);
  const { root, layout } = build();
  const name = 'biobuzz-transfer-outtake';
  const text = writeStep(root, { units: 'mm', name, stamp: '2026-10-17T00:00:00' });
  fs.writeFileSync(path.join(OUT, name + '.step'), text);
  fs.writeFileSync(path.join(OUT, 'layout.json'), JSON.stringify(layout, (k, v) => typeof v === 'number' ? +v.toFixed(2) : v, 2) + '\n');
  const bodies = worldBodies(root);
  fs.writeFileSync(path.join(HERE, 'bodies.json'), JSON.stringify(bodies));
  let parts = 0; walk(root, (p) => { if (p.kind === 'part') parts++; });
  console.log(name + '.step', (text.length / 1024).toFixed(0) + ' KB,', parts, 'part instances,', bodies.length, 'solids');
  if (!args.includes('--check')) return;
  const { checkAll } = await import(pathToFileURL(path.join(HERE, 'check.mjs')).href);
  process.exitCode = await checkAll({ text, bodies, layout, build, worldBodies, clashes, inside, D, loadOcct, SIMBENCH });
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
