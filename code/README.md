# Robot code

Java for the FTC SDK 11.1.0 and Pedro Pathing 2.1.2, with Panels for live tuning. The copy the team builds and runs lives in our Android Studio project ([IDK-WHAT-TEAM-IM-ON, branch `Testing-code`](https://github.com/LILRINO71/IDK-WHAT-TEAM-IM-ON/tree/Testing-code)). This folder is a snapshot of it.

To use it in another Pedro Quickstart, copy `org/firstinspires/ftc/teamcode/pedroPathing/` into `TeamCode/src/main/java/`.

## OpModes

| File | What it does |
|---|---|
| `BiobuzzTeleOp.java` | Field-centric drive (per alliance) and a hold-to-aim heading lock. One button aims and fires everything held; trims; operator overrides; rumble feedback |
| `BiobuzzAuto.java` | Fires the 4 preloads and waits for the TIP. Sweeps the spill, fires from whichever side the up CELL faces, cycles again if time allows, and parks in the LOADING ZONE. Every wait has a time limit. Alliance and routine are picked in INIT |
| `ShooterTuner.java` | Table or manual mode. Measures the speed dip and recovery time of each shot and tunes the one calibration number live |
| `HardwareCheck.java` | Finds missing devices, jogs motors and servos, and shows what each colour sensor sees |
| `Constants.java` | Pedro: mecanum drive, plus Pinpoint pod offsets measured from the CAD |

## `robot/`

| Class | Job |
|---|---|
| `Robot` | Owns every subsystem and runs one update per loop, in order |
| `RobotConfig` | Every name and tunable. `@Configurable`, so values can change live in Panels |
| `Flywheel` | Feedforward (kS + kV) plus PI, scaled by battery voltage. Full power when more than 12% slow. Ready within 3% for 80 ms, dropping out only past 6%. Shot detection from the speed dip |
| `Shooter` | Flywheel + pitch servo + stopper. Fires one ball at a time only when aimed, at speed and settled, and stops the column as soon as the ball leaves |
| `ShotTable` | 2-D map, range × bearing to the up-CELL mouth → pitch and exit speed, for POLLEN and NECTAR. Generated from the physics sim (`analysis/shot-map`) |
| `Aim` | Range and bearing from the Pinpoint pose. Shoot-on-the-move by aiming at a virtual target, iterated 4 times. Decides whether the shot is inside the table's window |
| `HeadingLock` | PD + kS heading controller for TeleOp aiming |
| `Intake`, `BallSensor` | Classifies every ball at each mouth, even balls back to back. Slows the intake until a ball is classified and spits out opponent NECTAR. A merge claim keeps both intakes from feeding at once. Stops at 4 |
| `Column` | Indexes the next ball up to the stopper. Flags a STUCK column after 2 s |
| `Inventory` | Balls held plus balls on their way in, in firing order, never more than 4 |
| `HiveTracker` | Limelight tags → which CELL is up for each alliance, held for 250 ms before it changes. Manual flip as a backup |
| `StallGuard` | Current-based jam detection with back-off and cooldown |
| `Hub`, `CachedMotor` | Manual bulk caching, skipped repeat writes, current read at 10 Hz, filtered battery voltage, loop timing |
| `Field`, `Alliance`, `Ball`, `PoseStore` | Field geometry (HIVE, CELL mouths), mirroring for blue, ball masses, and the pose handed from AUTO to TeleOp |

Comments are only where a team has to fill in a value.
