# AI agent tools: CLI-Anything and REA for biobuzz-robot-2026

Research note, 2026-11-17. It covers two agent toolkits:

- **[CLI-Anything](https://github.com/HKUDS/CLI-Anything)** (Apache-2.0) wraps real desktop programs (FreeCAD, Blender, 3MF and others) in CLIs that agents can drive.
- **[REA](https://github.com/morluto/rea)** (MIT) is an MCP server and CLI that gives agents reverse-engineering tools.

This file covers only what matters for **this** repo.

How to read the labels:

- **Confirmed**: checked against the tool's own repo or docs.
- **Recommendation**: a suggestion, not tested.
- Nothing below was run end to end on this project yet.

## What could help here

| Tool | Use in this repo | Value |
|---|---|---|
| CLI-Anything **FreeCAD** harness | Use a headless CAD check (mass, CoM, inertia, interference) on `cad/` exports. The **recommendation**: feed the measured inertia into `sim/` instead of estimates | High |
| REA **ADB tools** (needs adb) | On the real robot, read logcat and pull `/sdcard/FIRST` logs and screenshots from the Control Hub, which is Android. The agent can then compare a run with what the OpModes in `code/` should do. **Confirmed**: REA uses the adb you supply and never installs the SDK | Medium |
| REA **APK inspection** (needs JADX + JDK 17+) | Decompile *our own* built TeamCode APK to confirm what actually shipped | Low-Medium |

## Proposed changes (not made yet)

1. Add `tools/freecad_props.py`, a thin wrapper around `cli-anything-freecad --json` that writes mass properties to `analysis/`.
2. Add a CI step to `sim.yml` only if FreeCAD installs cleanly on the runner. Otherwise keep it local.
3. Add a short "debugging at practice" page: `adb connect 192.168.43.1:5555`, then let REA's adb tools pull the logs.

## Status on the dev PC (2026-11-17)

- **Installed:** the agent skills `cli-hub-meta-skill` and `reverse-engineer-anything`, plus `cli-anything-hub` 0.4.1 (pip).
- **Not usable yet:**
  - The REA CLI/MCP needs Node 24.22.1 or newer, and the PC has 24.15.0.
  - The FreeCAD/Blender harnesses need those programs installed. Neither is.

## Rules for REA

Use REA only on code and builds we made, or on devices we own. Reverse engineering commercial software can break its EULA or DMCA §1201, and §1201(f) covers only narrow interoperability work. REA's tool results are sent to the AI model provider, so never point it at keys, `.env` files or credentials.
