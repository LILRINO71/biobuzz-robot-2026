# Analysis tools

## `shot-map/`: where the shot table comes from

| File | What it does |
|---|---|
| `make_shot_table.mjs` | Runs [biobuzz-shot-sim](https://github.com/LILRINO71/biobuzz-shot-sim) for a two-wheel, zero-spin shooter at a 16 in exit. For every range (12.5–70 in) and bearing (0–75°) it places the robot on the field and keeps the sim's best pitch and exit speed for POLLEN and NECTAR. `--check <ShotTable.java>` proves the table in the code is what the sim gives now; CI runs it |
| `compare-motors.mjs` | Hit rate, motor headroom and recovery time at six scoring spots, for 6000/1620/1150 rpm motors at 1:1, 1.5:1 and 2:1 |
| `shot-map-output.txt` | The last generated table, with hit rates |

The motor comparison is why the shooter uses a 6000 rpm motor with a 2:1 belt. It uses 40% of the motor's top speed, recovers in 28 ms, and hits 97–99% at all six spots. A 1150 rpm motor misses most shots, and 1620 rpm at 2:1 can't reach the speed at all.

## `cad-review/`: how the team's 106 MB Onshape export was checked

| File | What it does |
|---|---|
| `parse.mjs` | Reads the STEP with [FTC SimBench Pro](https://github.com/LILRINO71/ftc-simbench-pro)'s parser: 1,646 placed parts with their sub-assembly paths |
| `mesh.mjs` | Cuts the file into one small STEP per shape (265 shapes), meshes each once with OpenCascade (`occt-import-js`), and places every occurrence. That gives 7.8 M triangles in 2 minutes. Meshing the whole file in one go returned empty meshes after 7 minutes |
| `render.py` | A numpy point-splat renderer with a z-buffer: orthographic views and section cuts of millions of triangles in seconds, no GPU |
| `figs.py` | The review figures: the top view with problems coloured, the side view against the tiles, and the intake section with both ball sizes |

```bash
node analysis/cad-review/mesh.mjs robot.step out/robotmesh
```

```bash
python analysis/cad-review/figs.py out/robotmesh
```

The team's CAD itself is not in this repo.
