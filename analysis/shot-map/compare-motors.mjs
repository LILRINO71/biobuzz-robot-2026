// Compares flywheel motor and gearing options for the two-wheel shooter at six scoring spots.
//   SHOTSIM=<biobuzz-shot-sim checkout> node analysis/shot-map/compare-motors.mjs
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const SIM = process.env.SHOTSIM || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../biobuzz-shot-sim');
const { loadEngine, BASE } = await import(pathToFileURL(path.join(SIM, 'tests', 'load-data.mjs')).href);
const E = loadEngine();
const configs = [];
for (const motorId of ['yj6000', 'yj1620', 'yj1150']) for (const gear of [0.5, 0.667, 1]) for (const topRatio of [1.0, 0.9])
  configs.push({ motorId, gear, topRatio });
const spots = [[-40, -61.5], [-40, -54], [-25, -50], [-55, -40], [-40, 54], [-56, 44]];
console.log('motor   gear  k    | hit% POLLEN / NECTAR at 6 spots                       | head  dipMs');
for (const c of configs) {
  const out = [];
  let head = 0, rec = 0;
  for (const [x, y] of spots) for (const ball of ['pollen', 'nectar']) {
    const p = { ...BASE, ballId: ball, robot: { x, y }, h0: 16, hiveState: y > 0 ? { red: 1, blue: 1 } : { red: -1, blue: 1 }, motorId: c.motorId,
      precision: { sigThetaDeg: 1, sigYawDeg: 1, sigShooter: 0.015 },
      shooter: { type: 'dual', wheelDiameterMm: 96, motorsPerWheel: 1, gear: c.gear, topRatio: c.topRatio, inertiaKgM2: 6e-4, shotInterval: 0.30, control: 'pid', batteryV: 12.5 } };
    const r = E.evaluate(p, 'full');
    out.push(r.best ? Math.round(r.hitRate * 100) : 0);
    if (r.motor) { head = Math.max(head, r.motor.headroom || 0); rec = Math.max(rec, r.motor.recoveryMs || 0); }
  }
  console.log(c.motorId.padEnd(7), String(c.gear).padEnd(5), String(c.topRatio).padEnd(4), '|', out.join(' ').padEnd(52), '|', head.toFixed(2), Math.round(rec));
}
