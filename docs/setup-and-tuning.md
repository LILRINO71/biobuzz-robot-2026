# Setup, controls and tuning

How to get the code in [`code/`](../code/) running on the real robot, in the order that saves the most time.

## 1. Driver Hub configuration

| Kind | Names |
|---|---|
| Drive motors | `leftFront` `leftRear` `rightFront` `rightRear` (goBILDA 435 rpm) |
| Mechanism motors | `frontIntake` `backIntake` (1150 rpm), `column` (435 rpm), `flywheel` (6000 rpm, 2:1 belt) |
| Servos | `pitch` `stopper` `leftJam` `rightJam` |
| REV Color Sensor V3 | `frontColor` `backColor` (one at each intake mouth) |
| Digital (IR break beams) | `columnIn` `columnTop` |
| I2C | `pinpoint` (goBILDA Pinpoint) |
| USB | `limelight` (Limelight 3A) |

## 2. Hardware Check (OpMode)

- Lists every device that's missing from the configuration.
- D-pad picks a device. A/B run a motor at ±30%, and the left stick moves a servo.
- Use it to:
  - flip any motor that runs backwards (`*_REVERSED` in `RobotConfig`);
  - find the servo positions for `PITCH_SERVO_AT_MIN` / `PITCH_SERVO_AT_MAX` (the pod at 60° and 87°), `STOPPER_OPEN` / `STOPPER_CLOSED` and `JAM_UP` / `JAM_DOWN`.
- Hold each ball type at each colour sensor and read the hue and saturation. Copy the ranges into `RobotConfig`. The defaults are: yellow 35–85°, blue 185–260°, red below 25° or above 330°, saturation at least 0.30.

## 3. Pedro Pathing

- Run the Pedro tuning OpModes: localization test, forward and lateral velocity, zero-power deceleration, then the PIDFs.
- Weigh the robot and set `Constants.followerConstants.mass`.
- The Pinpoint pod offsets in `Constants` were measured from the CAD, with the front intake as the robot's front. Check the encoder directions with the localization test.

## 4. Shooter Tuner (OpMode)

- **Table mode** sets pitch and speed from the shot map for a chosen range and bearing.
- Put the robot at a measured 30 in and then 50 in, straight in front of the up CELL.
- Fire with A, and nudge `EXIT_EFFICIENCY` with the bumpers until the shots land. That one number scales the whole table.
- While you're there, check the feedforward: flywheel power should sit near 0.42 at about 1,100 ticks/s.
- The screen also shows the speed dip on each shot and how long the wheel takes to be ready again.

## 5. Limelight

- Use an AprilTag pipeline with Full 3D on. Set `CAMERA_HEIGHT_IN` and `CAMERA_PITCH_DEG`.
- Tip a HIVE by hand and watch the `hive` telemetry line flip.
- The tags ride on the moving CELLs, so the code only uses them to tell which CELL is up, never to work out the robot's position.

## 6. Auto

- `PARTNER_AUTO_G` is the grams your partner banks in the far CELL during AUTO. Leave it at 0 if unsure: the second cycle then waits for the camera to see the TIP.
- In INIT: X = blue, B = red. The D-pad picks the routine: `FULL`, `PRELOAD_AND_PARK` or `PRELOAD_ONLY`.
- Start with the robot's back against the audience wall at x = −40 in.

## Controls

| Input | Driver (gamepad 1) | Operator (gamepad 2) |
|---|---|---|
| Sticks | Left: drive (field centric; Y toggles robot centric). Right X: turn. Left-stick click: slow | |
| Triggers | RT intake · LT eject | RT intake · LT eject |
| Bumpers | RB hold: aim and fire everything · LB hold: aim and spin up only | RB fire |
| Face buttons | B jamming wheels · Y field/robot centric | A flip the HIVE state · B jamming wheels · X clear a STUCK column · Y reset CELL grams |
| D-pad | ↑↓ speed trim ±1% · ←→ pitch trim ±0.5° | ↑ add POLLEN · ← add own NECTAR · ↓ remove last |
| Back | Reset heading (robot facing away from you) | |

Rumble patterns for the driver:
- one blip: an opponent NECTAR was spat out;
- one long: holding 4;
- three blips: enough grams are in the up CELL for a sure TIP.
