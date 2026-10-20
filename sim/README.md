# Simulator tests

`check.mjs` runs the real OpModes from [`code/`](../code/) inside the Java VM of [FTC SimBench Pro](https://github.com/LILRINO71/ftc-simbench-pro) at 50 Hz. It runs them against a small model of this robot:

- a mecanum base with motor lag;
- two intakes with colour sensors;
- the column with its two beam breaks, the stopper and the flywheel.

Each scenario feeds balls to the intake mouths, including opponent NECTAR. The check fails if the code does the wrong thing.

To run these autos I added Pedro Pathing 2.x path following to SimBench Pro's VM: Bezier paths and chains, heading interpolation, callbacks, `holdPoint` and pose tracking ([ftc-simbench-pro c8ca613](https://github.com/LILRINO71/ftc-simbench-pro/commit/c8ca613)). Before that change, an auto that called `followPath()` sat still.

```bash
node sim/check.mjs
```

```bash
node sim/run-opmode.mjs --opmode BiobuzzAuto.java --scenario auto --partner 120 --spawn 14
```

Set `SIMBENCH=<path>` if the ftc-simbench-pro checkout isn't next to this repo. CI runs `check.mjs` on every push and uploads the logs. The copies in `results/` are from the last local run.

| Scenario | What has to happen |
|---|---|
| `auto-one-cycle` | Fires the 4 preloads first and at least 7 balls in total. Never fires an opponent NECTAR, spits out the blue one it meets, and is parked in the LOADING ZONE before 29.3 s |
| `auto-two-cycles` | Same, with the partner's grams set, so a second TIP and cycle happen: at least 10 balls, a blue NECTAR spat out on each sweep, parked |
| `teleop` | Drives, intakes from both ends, spits out the opponent NECTAR, stops at 4, then aims and fires all 4 |

The model is a kinematic stand-in. It checks logic, timing, paths and rules, not real traction, real ball contact or the real flywheel.

## Bugs these runs caught

All four were fixed in the robot code before it ran on hardware:

1. The first shot waited about 5 s. The flywheel sat 3% fast and the integral was too weak to pull it into the ready band.
2. An opponent NECTAR right behind another ball came in unchecked, because the intake never saw a gap between them.
3. A ball left at the mouth when the intake stopped was never pulled in later.
4. After the second TIP, the auto drove to the far side to shoot at a CELL that now faced away.
