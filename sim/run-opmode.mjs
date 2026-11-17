// Runs one of the robot's OpModes headless inside FTC SimBench Pro's Java VM,
// at 50 Hz, against a small model of this robot: mecanum base, two intakes with
// colour sensors, the column with its two beam breaks, the stopper and the
// flywheel. Balls are fed to the intake mouths by the scenario.
//
//   node sim/run-opmode.mjs --opmode BiobuzzAuto.java --scenario auto [--seconds 30]
//                           [--partner 120] [--spawn 14] [--simbench ../ftc-simbench-pro]
//
// SimBench Pro: https://github.com/LILRINO71/ftc-simbench-pro, through its headless entry
// tools/run-opmode.mjs: it reads the code, compiles it and runs INIT, START and the 50 Hz
// passes; this file is the robot it runs against (the `host`) and the scenario.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const IN = 0.0254, VMAX = 1.6, WMAX = 5.5;
const MOUTHS = { frontColor: 'front', backColor: 'back' };
const RGB = { P: [230, 200, 30], R: [210, 30, 40], B: [30, 60, 210] };

export async function runOpMode(opts = {}) {
  const o = { opmode: 'BiobuzzAuto.java', scenario: 'auto', seconds: 30, partner: 0, spawn: 25, alliance: 'RED',
    simbench: process.env.SIMBENCH || path.resolve(REPO, '..', 'ftc-simbench-pro'), code: path.join(REPO, 'code'), ...opts };
  const runner = path.join(o.simbench, 'tools', 'run-opmode.mjs');
  if (!fs.existsSync(runner)) throw new Error(`no tools/run-opmode.mjs in ${o.simbench}: update that ftc-simbench-pro checkout, or set SIMBENCH`);
  const SB = await import(pathToFileURL(runner).href);
  const DT = SB.DT;

  // every .java under code/, with the partner's AUTO grams this scenario plays with
  const code = SB.readJava(o.code).map((f) => (f.file === 'RobotConfig.java'
    ? { file: f.file, path: f.path, src: f.src.replace('PARTNER_AUTO_G = 0;', `PARTNER_AUTO_G = ${+o.partner};`) } : f));

  let R = { t: 0, tick: 0, pads: { 1: {}, 2: {} }, telemetry: [] };          // the run: SimBench's clock, sticks and telemetry
  const H = { x: -40 * IN, y: -61.5 * IN, h: Math.PI / 2, vx: 0, vy: 0, w: 0 };
  const devs = new Map();
  const W = { column: [], top: false, inPulse: 0, mouth: { front: null, back: null }, events: [], shots: [], taken: [], spat: [], spawned: 0, rumbles: 0 };
  const log = (s) => W.events.push(`${R.t.toFixed(2).padStart(6)}  ${s}`);
  const at = () => `(${(H.x / IN).toFixed(1)}, ${(H.y / IN).toFixed(1)}) heading ${(H.h * 180 / Math.PI).toFixed(1)}°`;
  const host = {
    dev(name, type, kind) {
      let s = devs.get(name);
      if (!s) { s = { name, type, kind, cmd: kind === 'servo' ? null : 0, act: 0, ticks: 0, offset: 0, vel: 0, target: 0, reversed: false, mode: 'run', tpr: 28, spec: { rpm: 6000 } }; devs.set(name, s); }
      return s;
    },
    heading() { return H.h; }, omega() { return H.w; },
    pose() { return { x: H.x, y: H.y, h: H.h }; },
    vel() { const c = Math.cos(H.h), s = Math.sin(H.h); return { x: H.vx * c + H.vy * s, y: -H.vx * s + H.vy * c }; },
    colorDist(name) { return W.mouth[MOUTHS[name]] ? 0.03 : 8.19; },
    color(name) { const m = W.mouth[MOUTHS[name]]; return m ? RGB[m.kind] : [90, 90, 90]; },
    volts() { return 12.4; },
    touch(name) { return name === 'columnTop' ? W.top : name === 'columnIn' ? W.inPulse > 0 : false; },
    rumble(i, m) { W.rumbles++; log(`rumble gamepad${i} (${m})`); },
  };
  const cmd = (n) => { const s = devs.get(n); return s && s.cmd != null ? s.cmd : 0; };

  function physics() {
    const lf = cmd('leftFront'), lr = cmd('leftRear'), rf = cmd('rightFront'), rr = cmd('rightRear');
    const f = (lf + lr + rf + rr) / 4, s = (-lf + lr + rf - rr) / 4, t = (-lf - lr + rf + rr) / 4;
    const c = Math.cos(H.h), sn = Math.sin(H.h), k = Math.min(1, DT / 0.12);
    H.vx += ((f * c - s * sn) * VMAX - H.vx) * k; H.vy += ((f * sn + s * c) * VMAX - H.vy) * k; H.w += (t * WMAX - H.w) * k;
    H.x += H.vx * DT; H.y += H.vy * DT; H.h += H.w * DT;
    const lim = (70.5 - 9) * IN;
    H.x = Math.max(-lim, Math.min(lim, H.x)); H.y = Math.max(-lim, Math.min(lim, H.y));

    const fly = devs.get('flywheel');
    if (fly) fly.vel += ((fly.cmd || 0) * 2800 * 12.4 / 12 - fly.vel) * Math.min(1, DT / 0.15);

    const col = cmd('column');
    if (W.inPulse > 0) W.inPulse -= DT;
    if (!W.top && W.column.length && col > 0.2) { W.climb = (W.climb || 0) + DT * col; if (W.climb > 0.25) { W.top = true; W.climb = 0; } }
    const stopper = devs.get('stopper');
    if (stopper && stopper.cmd != null && stopper.cmd > 0.4 && W.top && col > 0.5) {
      W.feedT = (W.feedT || 0) + DT;
      if (W.feedT > 0.06) {
        const b = W.column.shift(); W.top = false; W.feedT = 0;
        if (fly) fly.vel *= 0.93;
        W.shots.push({ t: R.t, ball: b }); log(`FIRED ${b} at ${at()}`);
      }
    } else W.feedT = 0;

    for (const side of ['front', 'back']) {
      const m = W.mouth[side];
      if (!m) continue;
      const p = cmd(side + 'Intake');
      m.t += DT;
      if (p > 0.5 && m.t > 0.08) {
        m.pull = (m.pull || 0) + DT;
        if (m.pull > 0.12) { W.mouth[side] = null; W.column.push(m.kind); W.inPulse = 0.06; W.taken.push(m.kind); log(`${side} intake took ${m.kind}`); }
      } else if (p < -0.3) { W.mouth[side] = null; W.spat.push(m.kind); log(`${side} intake spat out ${m.kind}`); }
    }
  }

  function scenario(k) {
    const t = R.t, next = (list) => list[(W.spawned++) % list.length];
    if (o.scenario === 'auto') {
      const sweeping = cmd('frontIntake') > 0.5 && Math.abs(Math.abs(H.y / IN) - 33) < 6;
      if (sweeping && !W.mouth.front && k % o.spawn === 0) W.mouth.front = { kind: next(['P', 'B', 'R', 'P', 'R', 'R']), t: 0 };
    } else if (o.scenario === 'teleop') {
      const pad = {};
      if (t < 1.5) pad.left_stick_y = -0.4;
      else if (t < 6.5) {
        pad.right_trigger = 1;
        if (k % 30 === 0 && !W.mouth.front) W.mouth.front = { kind: next(['B', 'R', 'P', 'P', 'R', 'P']), t: 0 };
        if (k % 45 === 0 && !W.mouth.back) W.mouth.back = { kind: 'P', t: 0 };
      } else if (t < 12) pad.right_bumper = true;
      R.pads[1] = pad;
    }
  }

  let step = '', parkedAt = null;
  const res = SB.runOpMode({
    code, opmode: o.opmode, seconds: o.seconds, initSeconds: 0.4,
    host: (run) => { R = run; return host; },
    onStart() { if (o.scenario === 'auto') { W.column = ['P', 'P', 'P', 'P']; W.top = true; } },
    beforeTick(run) { if (run.phase === 'run') scenario(run.tick); },
    afterTick(run) {
      if (run.phase !== 'run') return;
      physics();
      const tel = (run.telemetry || []).join(' | ');
      const st = /auto : (\w+)/.exec(tel);
      if (st && st[1] !== step) { step = st[1]; log(`step ${step} at ${at()}`); if (step === 'DONE' && parkedAt == null) parkedAt = run.t; }
    },
  });
  if (!res.compile.ok) throw new Error('compile failed: ' + res.compile.error);
  if (res.compile.parseErrors.length) throw new Error('parse errors: ' + JSON.stringify(res.compile.parseErrors));
  if (res.error) throw new Error(`OpMode crashed: ${res.error.cls} ${res.error.msg} (${res.error.file}:${res.error.line})`);
  const xIn = H.x / IN, yIn = H.y / IN;
  const sign = o.alliance === 'RED' ? 1 : -1;
  const inZone = sign * xIn - 9 <= -59.5 && sign * yIn + 9 >= 23.9 && sign * yIn - 9 <= 46.6;
  return {
    events: W.events, telemetry: res.telemetry,
    summary: {
      opmode: o.opmode, scenario: o.scenario, shots: W.shots.length, fired: W.shots.map((s) => s.ball).join(''),
      taken: W.taken.join(''), spatOut: W.spat.join(''), opponentFired: W.shots.filter((s) => s.ball === (o.alliance === 'RED' ? 'B' : 'R')).length,
      finalPose: { x: +xIn.toFixed(1), y: +yIn.toFixed(1), headingDeg: +(H.h * 180 / Math.PI).toFixed(1) },
      inLoadingZone: inZone, doneAt: parkedAt && +parkedAt.toFixed(2), lastStep: step, rumbles: W.rumbles,
    },
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2), opts = {};
  for (let i = 0; i < a.length; i += 2) opts[a[i].replace(/^--/, '')] = a[i + 1];
  for (const k of ['seconds', 'partner', 'spawn']) if (opts[k] != null) opts[k] = +opts[k];
  const r = await runOpMode(opts);
  console.log(r.events.join('\n'));
  console.log('\n' + JSON.stringify(r.summary, null, 2));
}
