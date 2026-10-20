# Backspin and Moving Tags Reshape BIOBUZZ Robots

As of mid-October 2026, the strongest BIOBUZZ teams are reusing DECODE's winning design almost unchanged. That design is a wide compliant-roller intake, a single-file transfer driven by a continuous feed wheel, and a turreted, hooded 96 mm flywheel on a 6000 rpm goBILDA motor with added steel mass. Software runs goBILDA Pinpoint odometry under Pedro Pathing, plus a custom flywheel loop (`kS + kV·target + kP·error`, scaled for battery voltage) that fires only when one shared "ready to fire" check passes. Two problems specific to BIOBUZZ are forcing changes. First, the upward-facing CELL is a pocket that rejects backspinning balls. Escape Velocity (14343) measured a **44% bounce-out rate** with a DECODE-style fixed hood and is adding powered counter-rollers, while Michigan's undefeated 13684 Infinity Tech shoots POLLEN underhand with topspin. Second, POLLEN (2.80 in) and NECTAR (3.62 in) differ by about 21 mm, so a shooter with a fixed gap launches them on different arcs, and teams are turning to sprung passive hoods, hoods that switch based on a sensor, or passive sorting. In software, FTC SDK 12.0's new AprilTag clusters break older AprilTag code, and FIRST says BIOBUZZ tags move with the HIVE, so vision can aim the robot but cannot tell it where it is on the field. The maintained stack is Pedro Pathing 3.0.2 with either SolversLib 0.3.6 or NextFTC 1.1.0; Road Runner has not shipped a release since January 2025. Brogan M. Pratt is not a top-team programmer. He teaches at The American School of The Hague, coaches FTC teams 23014 and 24090 (24090 went to the 2026 World Championship), and runs an FTC YouTube channel. His public repo teaches sound beginner-to-intermediate patterns, but it is pinned to SDK 11.2.1 and Pedro 2.0.3, its AprilTag code needs porting to SDK 12.0's cluster API, and it has several unit and logic bugs. The biggest caveat is that no BIOBUZZ team has published numbers for its shooter and the official Q&A could not be read, so the mechanical meta is still forming.

## Brogan M. Pratt teaches sound patterns in code that needs porting

**Who he is.** Brogan M. Pratt is an adult robotics teacher, not a student competitor or a library author. His GitHub account, MrPrattASH, describes him as a robotics educator in the Netherlands, coach of FTC teams 23014 and 24090, and an educational YouTuber ([GitHub MrPrattASH](https://github.com/MrPrattASH)). His personal site places him at **The American School of The Hague in Wassenaar**. It lists a B.A. and B.Ed. from Simon Fraser University and an M.Ed. in Technology from UBC, and gives his YouTube channel @BroganMPratt as the public contact ([broganpratt.com](https://www.broganpratt.com/); [YouTube @BroganMPratt](https://www.youtube.com/@BroganMPratt)).

His teams are strong in the Benelux region:

- **23014 The Flying Dutchman** won Inspire and was on the Winning Alliance at the 2024-25 Benelux Championship. In DECODE it took Inspire 2nd and Division Finalist at the same event ([FTCScout 23014](https://ftcscout.org/teams/23014)).
- **24090 Trojan Robotics** was a finalist at the DECODE Benelux Championship and competed in the **Edison Division at the 2026 FIRST World Championship**. It also won the Sustain Award at the June 2026 European Premier Event ([FTCScout 24090](https://ftcscout.org/teams/24090); [FIRST event page](https://ftc-events.firstinspires.org/2025/team/24090)).

The research found no Road Runner, NextFTC or SolversLib code from him, no Chief Delphi posts, and no repos for his student teams under his account.

**His videos and resources.** His output is teaching material. The FTC Community Video index lists four BIOBUZZ videos ([ftccv.org](https://ftccv.org/)):

- "The Forces That Destroy Robot Turrets, and How To Design Around Them"
- "This Transfer Makes Holding Too Many IMPOSSIBLE" (a transfer designed around the G407 four-ball limit)
- a 27-minute strategy breakdown of auto, teleop and FLOWERS
- "Every Foul in BIOBUZZ Explained"

A separate FTC Friday's episode covers a push-resistant robot ([YouTube](https://www.youtube.com/watch?v=oG4XWJ4Jhag)). A members' area holds a Pedro Pathing series (setup, PIDF tuning, writing autos, simultaneous actions), an AprilTag-tracking turret tutorial, "This Trick Makes Your Flywheel 30x Faster [PIDF Tuning]", and flywheel consistency tests ([members' videos](https://shop.broganpratt.com/supporters/videos)).

His shop's BIOBUZZ collection has 26 items, nearly all free to members ([BIOBUZZ resources](https://shop.broganpratt.com/collections/ftc-biobuzz-resources)):

- **CAD:** an **81 mm-ID turret bearing stack**, a dual-wheel flywheel, a hooded-flywheel angle finder, a **flywheel compression tester**, compliant-wheel molds and BIOBUZZ ball intakes.
- **Java snippets:** Pedro autos, AprilTag turret and drive alignment, slides, and arm PIDF with gravity feedforward.

None of the members-only videos could be viewed for this report. The specific advice inside them, including what the "30x faster" trick is, is unverified.

**His code.** His only FTC code repo is a fork of the FIRST SDK, last pushed on 7 September 2026. It pins **SDK 11.2.1, Pedro Pathing 2.0.3 and Panels 1.0.7** ([build.dependencies.gradle](https://github.com/MrPrattASH/FtcRobotController_TeamCode/blob/master/build.dependencies.gradle)). It teaches a consistent structure:

- **Loop structure.** An iterative `OpMode` updates every mechanism object first, then steps an enum state machine. Each state ends when `!shooter.isBusy()` or after a 2-second timer ([PedroStateActions.java](https://github.com/MrPrattASH/FtcRobotController_TeamCode/blob/master/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/pedroPathingTutorials/PedroStateActions.java)).
- **Flywheels.** These use the hub's built-in velocity PIDF through `setVelocity()`, starting at F = 14.098 and P = 265. A gamepad tuner changes the gains in steps from 10 down to 0.0001 ([FlywheelTunerTutorial.java](https://github.com/MrPrattASH/FtcRobotController_TeamCode/blob/master/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/tutorials/FlywheelTunerTutorial.java)).
- **Turrets.** A PD loop on AprilTag bearing adds a friction term based on the sign of the error, with a 0.2° deadband and a ±0.6 power clip ([TurretMechanismTutorialkV.java](https://github.com/MrPrattASH/FtcRobotController_TeamCode/blob/master/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/tutorials/TurretMechanismTutorialkV.java)). The advanced version adds ±1000-tick soft limits and an UNWIND state that swings the turret back to the opposite limit instead of over-rotating its cables ([TurretMechanismAdvanced.java](https://github.com/MrPrattASH/FtcRobotController_TeamCode/blob/master/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/tutorialsExamples/TurretMechanismAdvanced.java)).
- **Drive auto-align.** While the driver holds a trigger, a PD loop on bearing turns the mecanum drive to face tag 20 ([AprilTagAutoAlignmentMecanumDrivetrain.java](https://github.com/MrPrattASH/FtcRobotController_TeamCode/blob/master/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/tutorials/AprilTagAutoAlignmentMecanumDrivetrain.java)).
- **Limelight 3A.** One example combines the MegaTag2 robot pose with a trigonometric range estimate from `ty` ([LimeLightAprilAdvancedDistance.java](https://github.com/MrPrattASH/FtcRobotController_TeamCode/blob/master/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/LimeLightAprilAdvancedDistance.java)).

These are the right instincts: state machines that never block and always time out, feedforward combined with feedback, and soft limits. They match the patterns found in top DECODE code.

**Where it goes wrong.** The flaws are in the details and in the dates. Reading the source turned up the problems below. Treat them as a reviewer's findings and check each one before reusing the code.

| Problem | Where | Consequence | Fix |
|---|---|---|---|
| `SHOOTING` case has no `break` | [SimpleAuto.java](https://github.com/MrPrattASH/FtcRobotController_TeamCode/blob/master/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/tutorials/SimpleAuto.java) | Falls through into `STRAFE_RIGHT` | Add the `break` |
| "kV" term is `signum(error)·kV` | [TurretMechanismTutorialkV.java](https://github.com/MrPrattASH/FtcRobotController_TeamCode/blob/master/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/tutorials/TurretMechanismTutorialkV.java) | It is a static-friction (kS) term, not velocity feedforward, so the turret lags when the chassis turns | Rename it kS. Add kV × (rate of change of goal bearing − robot turn rate) |
| Mixes mm, cm and inches. Subtracts `ty` in degrees from an `atan()` result in radians | [LimeLightAprilAdvancedDistance.java](https://github.com/MrPrattASH/FtcRobotController_TeamCode/blob/master/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/LimeLightAprilAdvancedDistance.java) | Wrong range estimate | Use one unit system throughout |
| Pinpoint offsets written as mm/2.54 while `distanceUnit(MM)` is set | [Constants.java](https://github.com/MrPrattASH/FtcRobotController_TeamCode/blob/master/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/pedroPathingTutorials/Constants.java) | Pod offsets are wrong by a factor of 2.54 | Let Pedro 3 AutoTune compute the offsets |
| Encoder resolution 4000/(2π·16) ≈ 39.8 ticks/mm | Same file | Twice goBILDA's 19.894 ticks/mm for its 4-bar pod ([Pinpoint guide](https://servocity.com/content/user_manuals/3110-0002-0001%20User%20Guide.pdf)) | Use the goBILDA pod preset |
| Uses the Pedro 2.0.x API (FollowerConstants, PinpointConstants, FollowerBuilder) | pedroPathingTutorials | Does not match Pedro 3, which uses Foresight, PinpointConfig and AutoTune | Port the code and re-tune |
| Reads `AprilTagDetection.ftcPose` directly | Turret and align tutorials | SDK 12.0's cluster change breaks old AprilTag OpModes ([SDK v12.0 README](https://github.com/FIRST-Tech-Challenge/FtcRobotController/blob/v12.0/README.md)) | Branch on `AprilTagSingleDetection` vs `AprilTagClusterDetection` |

Two broader gaps matter more than any single bug.

1. **Flywheel control.** Competitive DECODE teams mostly dropped the hub's built-in velocity PIDF in favour of a hand-written feedforward loop that compensates for battery voltage (see the flywheel section below). Pratt's flywheel tutorial teaches the approach the top teams moved away from.
2. **Vision.** His vision code assumes the AprilTags stay still. MegaTag2 robot pose relies on a fixed map of where every tag is, but BIOBUZZ tags ride on the moving HIVE.

His material works best as a set of concepts to copy, with three changes:

- rename the turret's friction term and add a true velocity feedforward;
- move the AprilTag code to cluster detections and aim at the cluster origin;
- regenerate the Pedro configuration with Pedro 3's AutoTune.

## Ball spin, not speed, now separates BIOBUZZ shooters

### The DECODE World Champion's shooter is the starting point

The DECODE World Champion, **30030 Exodus**, used:

- a single firm 96 mm goBILDA Rhino wheel at 6000 rpm, with two Hogback steel weights and a constant 4.0 mm compression;
- an adjustable servo turret hood;
- a 42 mm cut-down Gecko wheel that replaced the kicker and delivered **three shots in 0.9 s**.

The whole robot weighed 11.8 kg and ran Pinpoint and a Limelight 3A ([Exodus robot page](https://exodiusftc.com/robot); [FIRST Championship results](https://community.firstinspires.org/congratulations-to-our-decode-first-championship-teams)). Their design history is the main lesson in short form:

1. A two-wheel shooter was inconsistent.
2. A turret hood with a kicker improved accuracy but slowed cycles.
3. A transfer wheel plus extra flywheel mass finally got three shots under one second.

That cadence mattered in a season whose world record was 342 non-penalty points with more than 90 ARTIFACTS scored in one match ([FUN 342 NP](https://www.youtube.com/watch?v=39f6G4UOTGk)).

The Open Alliance Seattle Solvers (23511) published the clearest test record ([Solvers OA thread](https://www.chiefdelphi.com/t/ftc-23511-seattle-solvers-decode-oa-season-thread/506155)):

- soft Gecko launcher wheels were much less consistent than firm Rhinos;
- 12,000 rpm overdrive vibrated and gave no benefit;
- foam glued to the wheel came apart at 6000 rpm, while foam on the fixed backing worked;
- **4 mm of side-to-side clearance** kept the ball centred on the wheel.

Their final robot added a second flywheel motor, **belted counter-rollers to cancel backspin**, a 300° turret and a 20–45° hood. It launched at 4.51, 5.8 and 7.0 m/s for close, far and very far shots ([Solvers Constants.java](https://raw.githubusercontent.com/FTC-23511/Decode-2026/master/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/globals/Constants.java); [Solvers CAD](https://www.seattlesolvers.com/resources/cad-designs)).

| | 30030 Exodus (World Champion) | 23511 Seattle Solvers | 11138 Robo Eclipse |
|---|---|---|---|
| Launcher wheel | 96 mm Rhino, 4.0 mm compression | 96 mm Rhino, 3 mm fixed + 4–5 mm foam (6–7 mm total) | Hooded flywheel |
| Flywheel motors | 6000 rpm, 1:1 (count not stated) | 2 | 2 |
| Extra inertia | 2× Hogback steel weights | Added flywheel mass | Not stated |
| Backspin handling | Fixed hood | Belted counter-rollers | Hood servo |
| Aiming | Servo turret, adjustable hood | 300° turret, 20–45° hood | CR-servo turret, 8192 CPR encoder |
| Feed | 42 mm Gecko feed wheel, 3 shots in 0.9 s | 0.15 s transfer window | 3-slot rotary spindexer |
| Sources | [Exodus](https://exodiusftc.com/robot) | [Solvers thread](https://www.chiefdelphi.com/t/ftc-23511-seattle-solvers-decode-oa-season-thread/506155) | [FTC11138](https://github.com/FelixYBW/FTC11138) |

### The upward CELL rejects backspinning balls

**Why the DECODE shooter fails here.** BIOBUZZ's target is an upward-facing pocket, not a goal with a backboard. A single wheel pressing the ball against a fixed hood sends it out with backspin. Escape Velocity's Ri3D robot used exactly that DECODE layout and landed **24 of 43 shots, a 44.18% bounce-out rate**. Their fix is powered counter-rollers. They also considered an underhand shooter, because it needs no counter-roller motor and adds topspin naturally ([14343 build thread](https://www.chiefdelphi.com/t/ftc-14343-escape-velocity-biobuzz-build-thread/524080)). The same post records 4.76 s from the first ball's contact to a TIP with eight POLLEN.

**The alternatives already on the field.** All three of these remove or reverse backspin:

- **13684 Infinity Tech** was Winning Alliance Captain and won Inspire at the Saline Preview with an underhand topspin POLLEN shooter. It was undefeated in Michigan when FUN profiled it ([Behind the Bot](https://youtu.be/6DdAeRmzYPQ)).
- **19705 WXYZ** built a two-flywheel shooter for its Ri3D robot ([video](https://youtu.be/DOWwamIKOog)).
- **Georgia Tech's Robot-in-30-Hours** build showed a dual-shooter concept ([GT day 2](https://youtu.be/bR91YppIwNk)).

A two-wheel design can also steer the exit angle without a hood, by running the wheels at different speeds ([Parsana review](https://medium.com/@unnatpar/decode-decoded-reviewing-the-mechanisms-of-a-shooter-with-frc-1edfe502769b)). However, Exodus dropped two wheels in DECODE because shots were inconsistent, so the trade-off is spin control versus shot-to-shot repeatability. The fixed solid hood that won DECODE is the wrong default for BIOBUZZ. Counter-rollers and topspin layouts are where the meta is heading. FUN's 17 October episode on BIOBUZZ shooter designs covers seven more teams and is worth watching next ([FUN shooter rundown](https://youtu.be/he8w_sUWtbQ)).

**Shot energy also changes when the HIVE tips.** The official field setup values say:

- seven POLLEN placed gently (174 g) must not tip a CELL, and a tossed eighth (199 g) must;
- each upward CELL starts the match holding three NECTAR (124 g), so about three launched POLLEN should tip it ([Competition Manual](https://ftc-resources.firstinspires.org/ftc/game/manual)).

Teams report that harder, more downward shots tip it with fewer balls ([12736 thread](https://www.chiefdelphi.com/t/12736-electric-mayhem-green-2026-27-build-thread/524051)). 12737 claims four POLLEN hitting the edge will tip the HIVE through momentum ([12737 thread](https://www.chiefdelphi.com/t/12737-2026-2027-season-build-thread-biobuzz/524059)). That edge-hit trick is close to breaking G417. G417 makes launching into an upward CELL the only legal way to move the HIVE, and lists deliberately launching into a CELL's outside faces as a strategic violation ([Competition Manual](https://ftc-resources.firstinspires.org/ftc/game/manual)). Tuning shot energy into the opening is legitimate. Aiming at the rim is not.

### Two ball sizes break fixed compression

**How big the problem is.** The figures below are arithmetic from the published DECODE specs:

- Exodus's 4.0 mm on a 127 mm ARTIFACT is 3.1% of the ball's diameter. The Solvers' 6–7 mm is about 5%.
- The same ratios give 2.2–3.6 mm for a 71.1 mm POLLEN and 2.9–4.6 mm for a 91.95 mm NECTAR.
- A fixed gap set to squeeze POLLEN by 4 mm would squeeze NECTAR by about **24.8 mm, 27% of its diameter**.

12737's two-wheel prototype already shows the result: one ball type sometimes flies much higher or lower than the other ([12737 thread](https://www.chiefdelphi.com/t/12737-2026-2027-season-build-thread-biobuzz/524059)).

**Three approaches.** Teams are splitting three ways:

1. **Switch the hood on a sensor.** Escape Velocity first proposed a colour sensor ahead of the shooter that pauses the transfer while a hood moves. They judged the roughly 250 ms switch delay hard to notice.
2. **A passive, sprung hood.** On 14 October Escape Velocity chose this instead, because sorting and active adjustment both cost motors or servos and add time between shots ([14343 thread p2](https://www.chiefdelphi.com/t/ftc-14343-escape-velocity-biobuzz-build-thread/524080?page=2)).
3. **Passive sorting.** 12736 Electric Mayhem Green built dual turrets with a passive sorting mechanism, so each ball type takes its own path ([FUN video](https://youtu.be/rsdIMsG-dhE)).

Offset Robotics' public concept CAD reportedly uses a sprung intake and a single-motor shooter, but the page would not load to confirm this ([Offset Robotics](https://offsetrobotics.com/biobuzz-robot-cad)). A sprung backing, where spring force rather than a fixed gap sets the compression, uses the fewest motors and servos. It should be the first thing to prototype.

**Speed is not the limit.** The user's own shot simulator puts the needed exit speed at about 5.0–5.3 m/s on a steep 62–75° launch ([biobuzz-shot-sim](https://github.com/LILRINO71/biobuzz-shot-sim)). That falls inside the Solvers' DECODE range of 4.5–7.0 m/s. DECODE flywheel hardware therefore has plenty of spare speed to recover between shots, and the rate of fire will be limited by the feed, as it was for Exodus. Steel flywheel mass is still cheap insurance: goBILDA's 82 mm steel flywheel adds 152 g and 1,651 g·cm² of inertia ([goBILDA flywheel](https://www.gobilda.com/steel-flywheel-82mm-diameter-152g-1651-g-cm/)).

## Continuous-feed transfers and four-ball magazines replace spindexers

**Intakes.** The best DECODE intakes were wide, powered and fast:

- **Solvers** ran 50 mm PETG tubes wrapped in Cat-Tongue grip tape at about 2,300 rpm. They kept **the intake's surface speed at least twice the drive speed**, so the robot did not push balls away as it drove onto them. An unpowered pivoting roller performed worse than a servo-pivoted one, and surgical tubing was too floppy ([Solvers OA thread](https://www.chiefdelphi.com/t/ftc-23511-seattle-solvers-decode-oa-season-thread/506155)).
- **Exodus** used a four-stage intake on one 435 rpm motor: boot wheels grip the ball off the floor, then Gecko wheels pass it on compliantly ([Exodus](https://exodiusftc.com/robot)).
- **Studica** recommends a 15–30° intake angle. In its tests, 100 mm 35A wheels tipped the robot and 50 mm wheels fixed it ([Studica](https://www.studica.com/blog/ftc-intake-shooter-systems/)).

BIOBUZZ intakes carry this over. Escape Velocity's widened compliant-wheel intake handles both POLLEN and NECTAR well, although its custom-cast wheel came out closer to surgical tubing and is being recast ([14343 thread](https://www.chiefdelphi.com/t/ftc-14343-escape-velocity-biobuzz-build-thread/524080)). The goBILDA StarterBot's Gecko intake holds four POLLEN and can pull POLLEN from a FLOWER straight into the robot ([goBILDA guide](https://www.gobilda.com/ftc-starter-bot-resource-guide-2026-2027-season/)). VOLTEC's published requirements are a typical target for a serious team: hold four, intake from the floor and corners, rapid fire, and ideally a turret that can shoot on the move ([VOLTEC thread](https://www.chiefdelphi.com/t/voltec-21802-23481-ftc-build-thread-2026-2027-biobuzz/524525)).

**Transfers.** The DECODE lesson is that kickers cost cycles:

- **Exodus** swapped its kicker for a feed wheel and went from slow cycles to three shots in under a second.
- **Ctrl-Y** recorded 3–4 s between auto shots with its kicker and kept adding servos to fix it ([Ctrl-Y](https://ftc.ctrlyrobotics.org/seasons/2025-2026-decode)).
- **Spindexers** (3-slot rotary indexers) were popular mainly to sort DECODE's colour pattern. For 12862, the handoff from spindexer to launcher was the hardest part, and it worked only when the carousel was exactly in position ([12862 thread](https://www.chiefdelphi.com/t/ftc-12862-build-thread-2025-decode/505789)).

BIOBUZZ has no colour order to build in the HIVE and raises the possession limit to four (G407). Both favour a straight four-slot magazine, or a widened single-file transfer feeding a continuous wheel. Escape Velocity describes its transfer that way, as similar to DECODE robots ([14343 thread](https://www.chiefdelphi.com/t/ftc-14343-escape-velocity-biobuzz-build-thread/524080)). Their 9 October update is a warning about compression: they removed an entire middle transfer stage after finding extreme compression that their CAD had missed ([14343 thread p2](https://www.chiefdelphi.com/t/ftc-14343-escape-velocity-biobuzz-build-thread/524080?page=2)).

**Perforated balls.** POLLEN holes are 11.2 mm and NECTAR holes are 16.1 mm ([Competition Manual](https://ftc-resources.firstinspires.org/ftc/game/manual)). No team has published data on balls snagging by their holes. DECODE's hollow ARTIFACTS did catch on spindexer standoffs until Leviathan replaced the standoffs with solid walls and enlarged the spinner ([Leviathan](https://leviathanrobotics.org/)). The safe design uses continuous polycarbonate walls, rounded lead-ins, and rollers wider than the spacing between holes.

**Rules that shape every mechanism.** From the [Competition Manual](https://ftc-resources.firstinspires.org/ftc/game/manual):

- **G407:** a robot may control at most four elements. A momentary fifth is tolerated if it is immediately reversed. Repeated violations are a major foul plus a yellow card.
- **G408:** a robot may not control opponent NECTAR.
- **G409:** a robot may not catch or deflect balls released by a tipping HIVE until they have touched something else, so the top of the robot needs a guard.
- **G418:** balls may enter a FLOWER only from the top, and only POLLEN may be removed, only through the bottom opening.
- **Size and actuators:** robots start inside an 18 in cube and may expand to 18 × 24 × 29 in. They may use 8 motors and 8 servos, each servo at no more than 8 W, and there is no weight limit (R102, R105, R502, R503, R104).

The user's earlier extraction of the manual found no BIOBUZZ launch-zone rule, unlike DECODE's G416. Check this against the current Team Updates.

**Motor and servo budget.** DECODE's champion used four drive motors on an 11.8 kg robot. A BIOBUZZ robot built the same way would need:

- **Motors:** four for the drive, one for the intake, one or two for the flywheel, and one for the feed or a counter-roller. That leaves at most one for a FLOWER mechanism.
- **Servos:** turret, hood lock, gate and FLOWER, well under eight.

This budget is derived from the [Exodus](https://exodiusftc.com/robot) and [11138](https://github.com/FelixYBW/FTC11138) actuator lists.

## Pedro 3, SDK 12 and Pinpoint form the maintained software stack

| Component | Latest version (17 Oct 2026) | Status |
|---|---|---|
| FTC SDK | 12.0, 12 Sep 2026 ([release](https://github.com/FIRST-Tech-Challenge/FtcRobotController/releases/tag/v12.0)) | Official BIOBUZZ release. AprilTag clusters (breaking change). Needs Android Studio Narwhal 3 Feature Drop |
| Pedro Pathing | 3.0.2, 16 Oct 2026 ([releases](https://github.com/Pedro-Pathing/PedroPathing/releases)) | Foresight path follower, PoseFactory, new Path API, AutoTune web page hosted on the robot. Maven packages are now `revhub` + `tuning` |
| Road Runner | 1.0.1, 5 Jan 2025 ([releases](https://github.com/acmerobotics/road-runner/releases)) | Last commit Nov 2025. Its quickstart last merged SDK 11.0 |
| SolversLib | 0.3.6, 16 Sep 2026 ([repo](https://github.com/FTC-23511/SolversLib)) | Maintained FTCLib fork led by 23511. Already migrated to Pedro 3 |
| FTCLib | 2.1.1, Feb 2023 ([releases](https://github.com/FTCLib/FTCLib/releases)) | Dormant |
| NextFTC | 1.1.0, Feb 2026 ([releases](https://github.com/NextFTC/NextFTC/releases)) | Kotlin-first command library. Its Pedro extension (1.0.0) predates Pedro 3 |
| Panels | fullpanels 1.0.18, 7 Oct 2026 ([maven](https://mymaven.bylazar.com/releases/com/bylazar/fullpanels/maven-metadata.xml)) | Telemetry and live-tuning dashboard |
| FTC Dashboard | 0.6.0, May 2026 ([release](https://github.com/acmerobotics/ftc-dashboard/releases/tag/v0.6.0)) | Adds a Limelight 3A view. Not verified against SDK 12 |
| Sloth | 0.3.2, Sep 2026 ([repo](https://github.com/Dairy-Foundation/Sloth)) | Hot reload of code changes, under 2 s |

**Libraries.** Pedro is the only path follower still releasing for the new SDK:

- **3.0.0** introduced the Foresight algorithm, which the release notes say raised team 12808's top speed in a straight-line test by 36%.
- **3.0.1** fixed the path-completion calculation that `isBusy()`-driven state machines rely on, and added `driveOrHold()`.
- **3.0.2** fixed the derivative, integral and piecewise-heading controllers ([v3.0.0](https://github.com/Pedro-Pathing/PedroPathing/releases/tag/v3.0.0); [v3.0.1](https://github.com/Pedro-Pathing/PedroPathing/releases/tag/v3.0.1); [v3.0.2](https://github.com/Pedro-Pathing/PedroPathing/releases/tag/v3.0.2)).

The Quickstart's v3.0.2 tag still pins `revhub` 3.0.1, so bump it by hand ([Quickstart v3.0.2](https://github.com/Pedro-Pathing/Quickstart/tree/v3.0.2)).

The DECODE code supports Pedro. Every strong DECODE repo read for this report used it:

- 11138 ran Pedro 2.1.2 with the Ivy scheduler and Panels;
- rio-v2 built its subsystems on NextFTC;
- 18270 used SolversLib controllers ([11138 README](https://github.com/FTC11138/Decode-Premier-Ivy); [rio-v2 Transfer.java](https://github.com/hershey-harsh/ftc-rio-v2/blob/HEAD/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/subsystems/Transfer.java); [18270 Spindexer.java](https://github.com/skandacode/Decode18270/blob/HEAD/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/subsystems/Spindexer.java)).

No survey of which libraries top teams use exists, so "top teams choose Pedro" rests on these repos rather than a count. Pick one command framework and do not mix the SolversLib, NextFTC and Ivy schedulers in one project. When upgrading Android Studio, never accept its prompt to downgrade the Android Gradle Plugin ([SDK v12.0 README](https://github.com/FIRST-Tech-Challenge/FtcRobotController/blob/v12.0/README.md)).

**Localization.** The **goBILDA Pinpoint V2** ($79.99) is the default. It combines two dead-wheel pods with an onboard IMU at about 1,500 Hz, and adds CRC8 error checking and configurable bulk-read windows ([goBILDA Pinpoint V2](https://www.gobilda.com/pinpoint-v2-odometry-computer-imu-sensor-fusion-for-2-wheel-odometry/)). The SDK sample gives the setup rules ([SensorGoBildaPinpoint.java](https://github.com/FIRST-Tech-Challenge/FtcRobotController/blob/v12.0/FtcRobotController/src/main/java/org/firstinspires/ftc/robotcontroller/external/samples/SensorGoBildaPinpoint.java)):

- call `resetPosAndIMU()` only while the robot is still, during init;
- the X pod must count up when driving forward, and the Y pod must count up when moving left;
- use goBILDA's pod presets rather than a hand-calculated resolution.

Pedro 3's AutoTune page, at 192.168.43.1:10158, works out pod directions and offsets for you. You push the robot forward, push it left, then rotate it 180° counter-clockwise. Do not plug the Pinpoint into I2C port 0 ([Pedro docs: Pinpoint](https://pedropathing.com/docs/pathing/tuning/localization/pinpoint)). goBILDA's driver release 1.3.0 was titled as a fix for invalid "NaN" reads, so treat a NaN pose as a fault ([goBILDA driver releases](https://github.com/goBILDA-Official/FtcRobotController-Add-Pinpoint/releases)).

The cheaper SparkFun OTOS optical sensor loses its calibration on every power cycle. Teams report that legal FTC mats read about three-quarters of the true distance, an error larger than the scale factors can correct ([SparkFun thread](https://community.sparkfun.com/t/sparkfun-otos-returning-incorrect-distance-values-despite-calibration-attempts/66597)).

**Vision.** SDK 12.0 groups the tags on each CELL into a **cluster**: tags on one flat surface that share an origin. Seeing any one tag gives a full 3D pose of the cluster, and the origin sits at the centre of the Cell opening. FIRST states that because BIOBUZZ tags move, they are not suitable for working out the robot's absolute position on the field. Code must branch on single-tag versus cluster detections ([SDK v12.0 README](https://github.com/FIRST-Tech-Challenge/FtcRobotController/blob/v12.0/README.md)). The webcam pipeline's default decimation setting of 3 detects a 5 in tag at 10 ft at 30 FPS ([ConceptAprilTagLocalization.java](https://github.com/FIRST-Tech-Challenge/FtcRobotController/blob/v12.0/FtcRobotController/src/main/java/org/firstinspires/ftc/robotcontroller/external/samples/ConceptAprilTagLocalization.java)).

On Limelight 3A:

- MegaTag2 needs the robot's heading sent every frame and an uploaded field map ([Limelight MegaTag2 docs](https://docs.limelightvision.io/docs/docs-limelight/pipeline-apriltag/apriltag-robot-localization-megatag2)). A map of fixed tag positions does not fit tags that ride on a tipping HIVE.
- `pipelineSwitch()` returns without waiting for the switch, and `getStaleness()` reports how old the data is in ms ([Limelight FTC API](https://docs.limelightvision.io/docs/docs-limelight/apis/ftc-programming)).

**The BIOBUZZ rule is: use the cluster's position relative to the robot for aiming and range, and never feed it into the odometry pose.** Early Chief Delphi advice agrees: use tags for aiming only, and keep a fixed hooded shot from a known spot plus a button that snaps the heading as the low-tech fallback ([CD auto-aim thread](https://www.chiefdelphi.com/t/ftc-auto-aiming/524081)).

Some teams will still fuse vision into the pose against references they can prove are stationary. For them, 11138's DECODE filters are the model ([11138 README](https://github.com/FTC11138/Decode-Premier-Ivy)):

- apply corrections only when the robot is moving slower than 8 in/s, because the camera lags about 150 ms;
- reject any camera pose more than 30 in or 25° away from odometry;
- require three passing frames in a row;
- blend each accepted correction in gradually, with a 1 s time constant.

**Loop time.** Talking to hardware, not doing math, dominates loop time. The standard fixes are:

- put every hub in MANUAL bulk caching and call `clearBulkCache()` once at the top of each loop ([gm0 bulk reads](https://gm0.org/en/latest/docs/software/tutorials/bulk-reads.html));
- skip motor writes that barely change ([Dairy cookbook](https://cookbook.dairy.foundation/improving_loop_times/improving_loop_times.html));
- keep I2C devices to a minimum, because they cannot be bulk-read;
- read motor current at most once per loop, because it is not in the bulk packet ([11138 README](https://github.com/FTC11138/Decode-Premier-Ivy)).

11138 also caps the time step `dt` in every controller and substitutes 20 ms when it looks wrong, so a slow hub transaction cannot cause a derivative spike.

## Feedforward-first, voltage-scaled flywheel loops replace the hub's PIDF

### Flywheel loops expose every term

Competitive DECODE teams almost all stopped using `setVelocity()`. Instead they ran the motor in RUN_WITHOUT_ENCODER mode with a hand-written control law, multiplied by nominal voltage over battery voltage. Some added a full-power (bang-bang) region when far from the target speed. The hub's built-in coefficients are set per port and per mode, and they are lost when the hub loses power ([FTC Docs PIDF](https://ftc-docs.firstinspires.org/programming_resources/shared/pidf_coefficients/pidf-coefficients.html)). The custom terms can be seen and tuned live from Panels or FTC Dashboard. WPILib explains why feedforward should do the heavy lifting: a pure feedforward flywheel already performs fairly well, and adding feedback lets it recover quickly after each ball hits the wheel ([WPILib flywheel tuning](https://docs.wpilib.org/en/latest/docs/software/advanced-controls/introduction/tuning-flywheel.html)).

| Team (season) | Control law and gains | Ready-to-fire check | Battery compensation |
|---|---|---|---|
| REV guidance (DECODE) | F·target + P·error, start at F = P = 0.0004 ([REV tips](https://docs.revrobotics.com/ftc-kickoff-concepts/decode-2025-26/programming-tips-and-tricks)) | Within −50 to +100 ticks/s of target | Not specified |
| 23511 Solvers (DECODE) | PIDF with P 0.01, F 0.00055 ([Constants.java](https://raw.githubusercontent.com/FTC-23511/Decode-2026/master/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/globals/Constants.java)) | Within 41 ticks/s, readiness predicted across the 0.15 s transfer | Not specified |
| 11138 Robo Eclipse (DECODE) | kS 0.065 + kV 0.000365·target + kP 0.01·error, applied to raw motor power ([Constants.java](https://github.com/FTC11138/Decode-Premier-Ivy/blob/HEAD/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/util/Constants.java)) | Flywheel within 100 ticks/s AND hood within 0.015 | Not stated |
| 23641 Cuberobot (DECODE) | kS 0.1174 + kV 0.0003 + kA 0.0005·accel + kP 0.01 ([ShooterConstants.java](https://github.com/kleongf/FTC_Decode/blob/HEAD/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/decode2026/constants/ShooterConstants.java)) | Not stated | × 12/V |
| 22131 (DECODE) | Bang-bang outside a band, otherwise kS 0.08 + kV 0.00039 + kP 0.01 ([Shooter.java](https://github.com/BaronClaps/22131-State/blob/HEAD/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/subsystem/Shooter.java)) | Within 50 ticks/s | Not stated |
| 24064 (DECODE) | PIDF gains switch at 100 in; output smoothed within 250 rpm of target; target rounded to 30 rpm steps ([Flywheel.java](https://github.com/ftc-jiar-robotics/24064-Decode/blob/HEAD/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/decode/subsystem/Flywheel.java)) | Within 70 rpm plus a limit on how fast the speed is changing | F and kS × Vmax/V |
| Mona Shores (DECODE → BIOBUZZ) | kS 0.10 + kV 0.00017 per rpm + kP 0.001 ([FlywheelBank.java](https://github.com/Mona-Shores-FTC-Robotics/biobuzz/blob/HEAD/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/shooter/FlywheelBank.java)) | Ready after ≤ 60 rpm error held 250 ms; drops out above 100 rpm | × 12.5/V, multiplier clipped to 0.5–2.0 |
| Pratt tutorial | Hub `setVelocity()` PIDF, F 14.098, P 265 | None in the tuner | None explicit |

**The tuning rule.** Mona Shores' BIOBUZZ test rig shows feedforward and feedback power separately. Their rule is that feedforward should carry nearly all the power, and a large feedback term means kV is wrong ([FlywheelTuningConfig.java](https://github.com/Mona-Shores-FTC-Robotics/biobuzz/blob/HEAD/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/shooter/config/FlywheelTuningConfig.java)). Typical kV values of 0.0003–0.0004 power per tick/s mean full power is about 2,800 ticks/s, the motor's free speed. So **kV ≈ 1/(maximum velocity)** is the right starting guess.

**Watch the units.** A bare goBILDA or REV motor encoder gives 28 ticks per revolution, so one tick/s is about 2.14 rpm, and a 50 rpm band is only about 23 ticks/s. A band that narrow catches noise, which is why strong code adds a hold time or two thresholds. Mona Shores added both after their ready signal flickered on and off while the wheel was at speed.

**Driving and firing.** 23641 also feeds forward the wheel acceleration needed as the robot drives toward or away from the goal, so the flywheel changes speed ahead of time instead of lagging ([SOTMUtil.java](https://github.com/kleongf/FTC_Decode/blob/HEAD/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/util/decodeutil/SOTMUtil.java)). REV warns that the first ball after spin-up flies harder, which is why its fire window has an upper bound as well as a lower one. For rapid fire, two ideas help:

- **Iron Reign fires in pulses** (feed, pause, feed) so the wheel recovers between balls ([Iron Reign manual](https://github.com/IronReign/FtcRobotControllerIronReign/blob/HEAD/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/robots/lebot2/docs/DriversManual.md)).
- **rio-v2 adjusts the hood instead of the wheel.** It raises the hood 0.005° per rpm below target, with a 150 rpm deadband and a 6° limit ([rio-v2 Shooter.java](https://github.com/hershey-harsh/ftc-rio-v2/blob/HEAD/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/subsystems/Shooter.java)).

### Shot maps need to know which CELL is up

A shot map turns distance to the goal into a wheel speed and a hood angle. Top DECODE code measured distance from the odometry pose to a fixed goal point, not from Limelight's `ty`. The pose works at any heading and keeps working when the tag is out of view. The map took four forms:

| Form | Team | Details |
|---|---|---|
| Lookup table | 23641 | Hood and speed from 28 in (31°, 1140) to 158 in (55°, 2140), plus separate red and blue angle offsets ([ShootingConstants.java](https://github.com/kleongf/FTC_Decode/blob/HEAD/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/decode2026/constants/ShootingConstants.java)) |
| 2-D table over field position | 11138 | 18 measured grid points. A tuning OpMode walks the operator through each point and prints the Java table entry. Red positions are mirrored into blue so one dataset serves both alliances ([11138 README](https://github.com/FTC11138/Decode-Premier-Ivy)) |
| Regression | 24064 | rpm = 1674.61 − 4.328d + 0.08095d² ([Flywheel.java](https://github.com/ftc-jiar-robotics/24064-Decode/blob/HEAD/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/decode/subsystem/Flywheel.java)) |
| Physics solver | rio-v2 | Solves a projectile arc through the goal for the hood angle. The time of flight comes out of the same calculation and is reused for shooting on the move ([rio-v2 Shooter.java](https://github.com/hershey-harsh/ftc-rio-v2/blob/HEAD/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/subsystems/Shooter.java)) |

BIOBUZZ adds a new input: which CELL is up. The upward CELL flips after every TIP, so the map needs the current CELL state and probably two tables. Mona Shores transcribed the HIVE geometry from the manual: pivot height 43.95 in, CELL spacing 18.84 in, and a settled CELL tilt of 30°. They note that the manual gives no XY coordinates for the AprilTag clusters, so teams must measure them ([HiveGeometry.java](https://github.com/Mona-Shores-FTC-Robotics/biobuzz/blob/HEAD/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/vision/HiveGeometry.java)). The user's own notes record the CELL mouth tilted 60°. That is probably the same geometry measured from the other axis, but confirm it before building a map on it.

### Turrets should feed forward the rate the goal bearing changes

DECODE aiming split into turrets, which track the goal continuously, and chassis heading locks:

- **23641's turret** reads its analog absolute encoder once at reset to set the motor encoder, then runs PID with a friction term plus **kV × (rate of change of the goal bearing − robot turn rate)**. That last term keeps it from lagging when the chassis rotates ([Turret.java](https://github.com/kleongf/FTC_Decode/blob/HEAD/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/decode2026/subsystems/Turret.java)).
- **11138's turret** reads a CR-servo turret through an 8192 CPR encoder geared 45:102, which gives about 0.02° per tick. It plugs that encoder into a spare drive-motor port, because the drive runs open-loop and Pinpoint handles localization ([11138 README](https://github.com/FTC11138/Decode-Premier-Ivy)).
- **Heading-lock teams** turn the whole robot toward the goal with a heading PID that releases on any stick input ([Neurobots HeadingLockController.java](https://github.com/Neurobots1/FTC-2025-2026/blob/HEAD/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/SubSystem/Shooter/HeadingLockController.java)).
- **12737 skipped the turret** and orbited the goal while always facing it ([12737 DECODE thread](https://www.chiefdelphi.com/t/ftc-12737-2025-26-decode-build-thread/505298)).

For BIOBUZZ the first season-specific vision code is already public. **6165 MSET Cuttlefish's `CellTipPipeline`** reads the alliance's tag cluster: tags right side up (roll under 90°) mean the CELL is scorable, and tags upside down or missing mean it has tipped. The state must hold for 0.25 s before it changes ([CellTipPipeline.java](https://github.com/6165-MSET-Cuttlefish/BioBuzz/blob/HEAD/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/modules/vision/CellTipPipeline.java)). Another repo identifies which CELL side is up from the official tag IDs and runs a second Limelight to find POLLEN ([BiobuzzVision.java](https://github.com/thiyageshvenkat/bot_code/blob/HEAD/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/vision/BiobuzzVision.java)).

### Shoot-on-the-move lead time is tuned, not derived

Shooting on the move works by aiming at a virtual goal: the real goal minus the robot's velocity times the ball's flight time. The flight time then depends on the new distance, so teams loop the calculation:

- **23641** runs ten iterations, with the flight time taken from a fitted curve and scaled by 0.8. Its solver outputs turret angle, turret turn-rate feedforward, wheel speed, wheel acceleration and hood angle ([SOTMUtil.java](https://github.com/kleongf/FTC_Decode/blob/HEAD/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/util/decodeutil/SOTMUtil.java)).
- **rio-v2**'s more detailed aim controller adds a fixed 0.70 s shot latency and a 0.15 s turret lead. Its comments say the measured latency is 0.5–0.8 s, from servo speed, feed and processing lag ([AimController.java](https://github.com/hershey-harsh/ftc-rio-v2/blob/HEAD/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/subsystems/AimController.java)).

These two teams corrected the physics in opposite directions: 23641 shortened its flight time and rio-v2 added latency on top. So treat lead time as a knob you tune, not a number you calculate. rio-v2's "strafe test" is the tuning method: if the ball lands off toward the direction you are strafing, the lead is too short. Its 4 in/s deadband on robot speed also stops the turret oscillating once the robot stops. No team has published hit rates for shooting on the move.

### Autos latch spin-up early and put a time limit on every wait

11138's DECODE auto is the template to copy ([11138 README](https://github.com/FTC11138/Decode-Premier-Ivy)):

- the turret aims at the *upcoming* shooting pose while the robot drives there;
- within 20 in of that pose, the flywheel target locks to the shooting value, so the wheel arrives at speed;
- shots fire only when the wheel is at speed, the robot is within 5 in, and the turret is within 2°, with a timeout running alongside;
- the robot leaves a gate at three balls, or 300 ms after reaching two, with a 2 s hard cap;
- no competition routine contains a wait without a time limit.

The same README records a framework trap: Ivy's `Command.NOOP` never reports done, so using it as an "else" branch makes the surrounding sequence wait forever. Pratt's state machine, which ends on `!isBusy()` or a timer, is the beginner version of this pattern.

## Ball sensing shifts from counting three balls to rejecting opponent NECTAR

**The rules change the job.** G407 caps possession at four elements, and the manual encourages systems that stop the robot from picking up more than four. G408 goes further: repeated control of opponent NECTAR counts as strategic **even if the robot has a sorting mechanism that automatically discards it** ([Competition Manual TU05](https://ftc-resources.firstinspires.org/ftc/game/manual)). So it is not enough to eject an opponent's NECTAR after you have picked it up; the robot must refuse it before it counts as controlled. Escape Velocity's intake geometry happens to reject opposing-colour NECTAR on its own ([14343 thread p2](https://www.chiefdelphi.com/t/ftc-14343-escape-velocity-biobuzz-build-thread/524080?page=2)), which is the ideal outcome. As of 17 October, no public BIOBUZZ repo contains code for rejecting opponent NECTAR.

**Where DECODE teams put sensors.** Sensors went in three places:

1. **At the intake mouth, to see a ball arrive.** 11138 used a laser time-of-flight sensor. The Solvers counted a ball when intake current stayed above 2.6 A for 125–167 ms, or when a distance sensor read under 5.67 cm ([FTC11138](https://github.com/FelixYBW/FTC11138); [Solvers Constants.java](https://raw.githubusercontent.com/FTC-23511/Decode-2026/master/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/globals/Constants.java)).
2. **At the indexer entry, to identify colour.** Leviathan used a REV Color Sensor V3 in a carefully tuned position ([Leviathan](https://leviathanrobotics.org/)).
3. **At the launch point, to confirm a ball is ready.** Ctrl-Y added a touch sensor to stop "blank" shots with no ball loaded ([Ctrl-Y](https://ftc.ctrlyrobotics.org/seasons/2025-2026-decode)). Leviathan moved its 2 m distance sensor upward so it saw each departing ball for longer ([Leviathan](https://leviathanrobotics.org/)).

**Mona Shores' colour pipeline** is the most complete public version ([IntakeLaneSensorConfig.java](https://github.com/Mona-Shores-FTC-Robotics/DECODE/blob/HEAD/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/subsystems/intake/config/IntakeLaneSensorConfig.java)):

1. A moving average over four samples smooths the noise caused by the holes in the balls.
2. A presence check combines distance, saturation (threshold 0.25), brightness and hue. The saturation check matters because hue means nothing when saturation is near zero.
3. Hue classification decides the colour.
4. A debounce confirms the result before it changes.

Each threshold is set halfway between the empty and ball-present readings. The team also rewrote the REV V3 driver to fetch all its data in one 14-byte I2C read ([FastColorSensor.java](https://github.com/Mona-Shores-FTC-Robotics/DECODE/blob/HEAD/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/subsystems/intake/FastColorSensor.java)). Teams using the Brushland Color Rangefinder configure colour and distance limits on the sensor itself and read the result as digital inputs, with no I2C traffic in the loop ([24064 ColorRangefinder.java](https://github.com/ftc-jiar-robotics/24064-Decode/blob/HEAD/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/decode/sensor/ColorRangefinder.java)).

**Telling BIOBUZZ balls apart.** BIOBUZZ is better suited to sensing than DECODE was, because size separates the ball types. POLLEN is 71 mm and yellow, and NECTAR is 92 mm and red or blue. A distance sensor across the channel reads about 20 mm farther for POLLEN, and a colour sensor at the same spot separates your NECTAR from the opponent's. The classifier must handle red, whose hue wraps around at 0°/360°.

**Counting.** The DECODE counting logic carries over with the cap raised to four ([11138 README](https://github.com/FTC11138/Decode-Premier-Ivy); [Iron Reign manual](https://github.com/IronReign/FtcRobotControllerIronReign/blob/HEAD/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/robots/lebot2/docs/DriversManual.md)):

- 11138's sensor must clear between balls before it counts another.
- At the cap, the intake switches itself off and spits out the extra ball.
- While a volley fires, ball detection is switched off until the encoder confirms the rotation finished, so outgoing balls are not counted.
- Iron Reign's LEDs flash green while the robot automatically ejects an extra ball.

**Jams.** Jams are detected from motor current with a minimum duration. 11138 defines five jam signatures, triggering at 4 A held for 160 ms and releasing below 3 A. It ignores the trigger while a ball is being handled, because normal intake loads also spike current, and it reverses at 0.6 power for 200 ms ([11138 Constants.java](https://github.com/FTC11138/Decode-Premier-Ivy/blob/HEAD/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/util/Constants.java)). rio-v2 shuts the transfer off if it draws more than 5 A for 0.4 s, as a backstop against burning out the motor when the distance sensor misses a stuck ball ([rio-v2 Transfer.java](https://github.com/hershey-harsh/ftc-rio-v2/blob/HEAD/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/subsystems/Transfer.java)). CircuitRunners ships an OpMode just for measuring these current thresholds ([IntakeCurrentDrawTuner.java](https://github.com/CircuitRunners/1002DecodeV1/blob/HEAD/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/Testers/IntakeCurrentDrawTuner.java)).

## Most recurring failures already have a published fix

| Problem | Root cause | Fix that worked | Source |
|---|---|---|---|
| Balls bounce out of the CELL | Backspin from a single wheel against a fixed hood | Powered counter-rollers, underhand topspin, or two wheels | [14343](https://www.chiefdelphi.com/t/ftc-14343-escape-velocity-biobuzz-build-thread/524080), [13684](https://youtu.be/6DdAeRmzYPQ) |
| POLLEN and NECTAR fly on different arcs | Fixed compression across a 21 mm size gap | Sprung passive hood, hood switched by a sensor, or passive sorting | [14343 p2](https://www.chiefdelphi.com/t/ftc-14343-escape-velocity-biobuzz-build-thread/524080?page=2), [12736](https://youtu.be/rsdIMsG-dhE) |
| Slow shot cycles | Kicker servo takes too long per ball | Continuous feed wheel (3 shots in 0.9 s) | [Exodus](https://exodiusftc.com/robot) |
| Flywheel speed drops in rapid fire | Too little inertia and torque | Steel weights, second motor, pulsed feed, hood compensation | [Exodus](https://exodiusftc.com/robot), [Iron Reign](https://github.com/IronReign/FtcRobotControllerIronReign/blob/HEAD/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/robots/lebot2/docs/DriversManual.md), [rio-v2](https://github.com/hershey-harsh/ftc-rio-v2/blob/HEAD/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/subsystems/Shooter.java) |
| Shots spread widely | Soft wheel, flexing mounts, ball off-centre | Firm wheel, foam only on the fixed side, rigid mounts, 4 mm side clearance | [Solvers](https://www.chiefdelphi.com/t/ftc-23511-seattle-solvers-decode-oa-season-thread/506155) |
| First shot flies long | Feeding before the speed settles | Fire only within −50/+100 ticks/s of target | [REV tips](https://docs.revrobotics.com/ftc-kickoff-concepts/decode-2025-26/programming-tips-and-tricks) |
| Balls jam in the transfer | Standoffs snag the holes; over-compression | Solid walls; remove the over-compressing stage | [Leviathan](https://leviathanrobotics.org/), [14343 p2](https://www.chiefdelphi.com/t/ftc-14343-escape-velocity-biobuzz-build-thread/524080?page=2) |
| Intake pushes balls away | Rollers slower than the drive | Roller surface speed ≥ 2× drive speed; servo-powered pivot | [Solvers](https://www.chiefdelphi.com/t/ftc-23511-seattle-solvers-decode-oa-season-thread/506155) |
| Slow, sloppy turret | 3D-printed bearing | Manufactured turntable bearing (4× faster); read angle from an external encoder | [Leviathan](https://leviathanrobotics.org/), [11138](https://github.com/FelixYBW/FTC11138) |
| Odometry breaks after a rebuild | Control Hub mounted at 45° misaligns the IMU | Mount the hub flat | [Leviathan](https://leviathanrobotics.org/) |
| Flywheel runs away to full power | Encoder sign mismatched with motor direction | Separate `encoderReversed` flag; zero P when measured speed is negative | [Mona Shores](https://github.com/Mona-Shores-FTC-Robotics/biobuzz/blob/HEAD/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/shooter/config/FlywheelTuningConfig.java) |
| Ready signal flickers | Noisy velocity crossing a single threshold | Two thresholds (60 rpm to enter, 100 to leave) plus a 250 ms hold | [Mona Shores](https://github.com/Mona-Shores-FTC-Robotics/biobuzz/blob/HEAD/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/shooter/config/FlywheelTuningConfig.java) |
| Flywheel ignores recovery commands | Write cache suppresses repeated identical writes | Do not cache flywheel writes | [FlywheelBank.java](https://github.com/Mona-Shores-FTC-Robotics/biobuzz/blob/HEAD/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/shooter/FlywheelBank.java) |
| Test shortcuts ship to competition | `signum(error) > 300` can never be true; `isUpToSpeed()` hard-coded to return true | Unit tests on constants and config names | [23641](https://github.com/kleongf/FTC_Decode/blob/HEAD/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/decode2026/subsystems/TorqueShooter.java), [rio-v2](https://github.com/hershey-harsh/ftc-rio-v2/blob/HEAD/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/subsystems/Shooter.java), [Mona Shores repo](https://github.com/Mona-Shores-FTC-Robotics/biobuzz) |
| False jam trips; robot grinds through auto | Normal loads spike current; the scheduler blocks recovery commands | Minimum duration and two thresholds; a direct flag that triggers the reverse regardless of scheduler | [11138 README](https://github.com/FTC11138/Decode-Premier-Ivy) |
| Robot pose jumps on vision updates | Ambiguous camera solutions | Speed, distance and heading filters, three-frame agreement, gradual blend | [11138 README](https://github.com/FTC11138/Decode-Premier-Ivy) |
| Limelight fails at a new venue | Lighting changes | Retune both alliance pipelines (exposure about 300); check tag lock before every match | [Iron Reign](https://github.com/IronReign/FtcRobotControllerIronReign/blob/HEAD/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/robots/lebot2/docs/DriversManual.md) |
| Old AprilTag code breaks | SDK 12.0 cluster API | Branch on single vs cluster detections; aim at the cluster origin | [SDK v12.0 README](https://github.com/FIRST-Tech-Challenge/FtcRobotController/blob/v12.0/README.md) |

Two patterns run through the table. Most mechanical failures are about compliance and ball position, not power. Most software failures come from noise on a single threshold, or from shortcuts that a cheap test would have caught. Mona Shores' BIOBUZZ repo already has a test that fails the build when a hardware name in code is not in the robot configuration. That kind of test would have caught both the `signum` bug and the hard-coded `return true`.

## Conclusion

The meta has shifted from how fast the ball leaves the robot to what state it is in as it leaves. DECODE-class flywheels already exceed BIOBUZZ's 5 m/s requirement, so the edge now comes from controlling spin (counter-rollers or topspin) and compliance (a sprung backing that suits two diameters). In software, the single "ready to fire" check that tied DECODE codebases together has to grow. It now needs to know which CELL is up, which ball type is staged, how many balls are held, and whether a ball belongs to the opponent. A team that writes that one check with two thresholds, a hold time and a timeout on every use will avoid most of the failures listed above.

Three risks are still open:

- The BIOBUZZ Q&A could not be read, so rulings on a momentary fifth ball, contact with the floating hood, and edge-hit tipping under G417 are unknown.
- Pedro 3 is five weeks old and is still fixing core controllers between point releases, so pin 3.0.2 and re-tune after every upgrade.
- Pratt's videos and the strongest teams' published code agree on structure, meaning state machines, feedforward and soft limits. They diverge on the details that BIOBUZZ punishes: static-tag vision, the hub's built-in PIDF and outdated library versions.

The practical path is to keep his architecture and replace those three details with the cluster API, voltage-compensated feedforward and Pedro 3's AutoTune.
