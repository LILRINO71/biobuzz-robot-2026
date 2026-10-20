// The robot's OpModes, run in FTC SimBench Pro, held to what they must do.
// CI runs this on every push; it writes the event logs to sim/results/.
//   node sim/check.mjs            (SIMBENCH=<ftc-simbench-pro checkout> if it isn't next to this repo)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runOpMode } from './run-opmode.mjs';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'results');
fs.mkdirSync(OUT, { recursive: true });

const cases = [
  {
    name: 'auto-one-cycle', opts: { opmode: 'BiobuzzAuto.java', scenario: 'auto', seconds: 30 },
    expect: (s) => [
      [s.fired.startsWith('PPPP'), 'fires the 4 preloads first'],
      [s.shots >= 7, `fires at least 7 (fired ${s.shots})`],
      [s.opponentFired === 0, 'never fires an opponent NECTAR'],
      [s.spatOut.includes('B'), 'spits out the blue NECTAR it meets'],
      [s.inLoadingZone, `ends parked in the LOADING ZONE (at ${s.finalPose.x}, ${s.finalPose.y})`],
      [s.doneAt != null && s.doneAt < 29.3, `finishes before the buzzer (${s.doneAt} s)`],
    ],
  },
  {
    name: 'auto-two-cycles', opts: { opmode: 'BiobuzzAuto.java', scenario: 'auto', seconds: 30, partner: 120, spawn: 14 },
    expect: (s) => [
      [s.shots >= 10, `fires at least 10 (fired ${s.shots})`],
      [s.opponentFired === 0, 'never fires an opponent NECTAR'],
      [(s.spatOut.match(/B/g) || []).length >= 2, 'spits out a blue NECTAR on each sweep'],
      [s.inLoadingZone, `ends parked in the LOADING ZONE (at ${s.finalPose.x}, ${s.finalPose.y})`],
      [s.doneAt != null && s.doneAt < 29.3, `finishes before the buzzer (${s.doneAt} s)`],
    ],
  },
  {
    name: 'teleop', opts: { opmode: 'BiobuzzTeleOp.java', scenario: 'teleop', seconds: 12 },
    expect: (s) => [
      [s.shots === 4, `aims and fires all 4 it holds (fired ${s.shots})`],
      [s.opponentFired === 0, 'never fires an opponent NECTAR'],
      [s.spatOut.includes('B'), 'spits out the blue NECTAR'],
      [s.taken.length <= 4 + s.shots, 'never holds more than 4'],
      [s.rumbles >= 2, 'rumbles the driver (opponent ball, full)'],
    ],
  },
];

let failed = 0;
for (const c of cases) {
  let r;
  try { r = await runOpMode(c.opts); } catch (e) { console.log(`✖ ${c.name}: ${e.message}`); failed++; continue; }
  fs.writeFileSync(path.join(OUT, `${c.name}.txt`), r.events.join('\n') + '\n\n' + JSON.stringify(r.summary, null, 2) + '\n');
  const checks = c.expect(r.summary);
  const bad = checks.filter(([ok]) => !ok);
  failed += bad.length;
  console.log(`${bad.length ? '✖' : '✔'} ${c.name}: ${r.summary.shots} shots (${r.summary.fired}), spat out ${r.summary.spatOut || 'none'}, done at ${r.summary.doneAt ?? '-'} s`);
  for (const [ok, what] of checks) console.log(`    ${ok ? '✔' : '✖'} ${what}`);
}
process.exit(failed ? 1 : 0);
