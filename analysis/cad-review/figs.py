import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from render import *
from matplotlib.patches import Rectangle, Circle, FancyArrowPatch

C = TRI.mean(1)
keys = [m.get("keys", []) for m in meta]
paths = [m["path"] for m in meta]
names = [m["name"] for m in meta]
CX, CY, FLOOR = -2.0, -55.35, -44.0
plt.rcParams.update({"font.size": 13})

def mask(fn):
    return np.array([fn(paths[i], keys[i], names[i]) for i in range(len(meta))])[OWN]

front_iwa = mask(lambda p, k, n: len(k) > 0 and k[0] == 49927)
fr_iwa = mask(lambda p, k, n: len(p) > 1 and p[0].startswith("Full Robot") and p[1] == "intake wheel assembly")
fr_ramp = mask(lambda p, k, n: len(p) > 1 and p[0].startswith("Full Robot") and p[1] == "ramp assembly")
battery = mask(lambda p, k, n: "Battery" in " ".join(p) + n)
field_el = mask(lambda p, k, n: n.startswith("am-585"))
far = (np.abs(C[:, 0] - CX) > 300) | (np.abs(C[:, 1] - CY) > 330) | (C[:, 2] < -150)
base = ~(front_iwa | fr_iwa | fr_ramp | battery | field_el | far)

GREY = np.array([0.62, 0.64, 0.68])
col = np.tile(GREY, (len(TRI), 1))
col[fr_iwa] = (0.95, 0.62, 0.2)
col[front_iwa] = (0.86, 0.15, 0.15)
col[fr_ramp] = (0.55, 0.25, 0.75)
col[far] = (0.86, 0.15, 0.15)
col[battery] = (0.1, 0.55, 0.85)
col[field_el] = (0.95, 0.8, 0.1)

def draw(ax, sel, right, up, s, title):
    render(ax, sel, right, up, s, colors=lambda o, sel=sel: col[sel], title=title)

allsel = np.arange(len(TRI))
near = np.where(np.all((C >= [-520, -440, -360]) & (C <= [560, 420, 340]), axis=1))[0]

# Figure A: top view with the start box and the problems called out
fig, ax = plt.subplots(figsize=(13, 12))
draw(ax, near, [1, 0, 0], [0, 1, 0], 1.0, "")
ax.add_patch(Rectangle((CX - 228.6, CY - 228.6), 457.2, 457.2, fill=False, ec="#1b7f3b", lw=2.5, ls="--"))
ax.text(CX - 225, CY - 250, "18 in START box, centred on the drivetrain", color="#1b7f3b", fontsize=13)
ax.annotate("side arms + plate reach\n~96 mm past the box front", xy=(-150, -378), xytext=(-500, -300),
            color="#444", arrowprops=dict(arrowstyle="->", color="#444", lw=1.5))
ax.annotate("front intake wheel assembly\nyawed ~33° (unmated)", xy=(120, -150), xytext=(250, -330),
            color="#b01818", arrowprops=dict(arrowstyle="->", color="#b01818", lw=1.8))
ax.annotate("bearings/screws floating\n~0.5 m away", xy=(480, 370), xytext=(170, 350),
            color="#b01818", arrowprops=dict(arrowstyle="->", color="#b01818", lw=1.8))
ax.annotate("battery outside\nthe frame", xy=(-365, 92), xytext=(-500, 250),
            color="#0d5f99", arrowprops=dict(arrowstyle="->", color="#0d5f99", lw=1.8))
ax.annotate("second copy of the intake\ninside 'Full Robot'", xy=(150, -60), xytext=(250, 120),
            color="#b06a10", arrowprops=dict(arrowstyle="->", color="#b06a10", lw=1.8))
ax.set_xlim(-520, 560); ax.set_ylim(-440, 420)
ax.set_xlabel("x (mm, CAD frame)"); ax.set_ylabel("y (mm, CAD frame)")
plt.tight_layout(); plt.savefig("figA_top.png", dpi=72); plt.close()

# Figure B: side view with the floor line
fig, ax = plt.subplots(figsize=(14, 7))
sel = near[C[near, 2] > -360]
draw(ax, sel, [0, -1, 0], [0, 0, 1], 1.2, "")
ax.axhline(FLOOR, color="k", lw=2)
ax.text(330, FLOOR + 8, "tile surface (mecanum contact)", fontsize=12)
ax.annotate("'Full Robot' ramp assemblies\nhang 70-85 mm below the floor", xy=(40, -110), xytext=(150, -260),
            color="#5b2290", arrowprops=dict(arrowstyle="->", color="#5b2290", lw=1.8))
ax.set_xlabel("-y (mm)  →  front intake end"); ax.set_ylabel("z (mm)")
ax.set_xlim(-430, 470); ax.set_ylim(-340, 340)
plt.tight_layout(); plt.savefig("figB_side.png", dpi=72); plt.close()

# Figure C: section through the back intake with both balls on a ramp parallel to the rollers
back = mask(lambda p, k, n: len(k) > 0 and k[0] == 49738)
chassis = mask(lambda p, k, n: len(p) > 1 and p[0].startswith("Full Robot") and p[1] == "Chassis")
top_ramp = mask(lambda p, k, n: (len(k) > 0 and k[0] == 49546) or (len(p) == 0 and n in ("floor", "ramp connector back")))
c2 = np.tile(GREY, (len(TRI), 1)); c2[back] = (0.85, 0.45, 0.1); c2[top_ramp] = (0.1, 0.5, 0.9)
sl = np.where((back | chassis | top_ramp) & (np.abs(C[:, 0] + 92) < 8))[0]
fig, ax = plt.subplots(figsize=(13, 8))
render(ax, sl, [0, -1, 0], [0, 0, 1], 3.0, colors=lambda o, sl=sl: c2[sl], title="")
ax.axhline(FLOOR, color="k", lw=2)
r1u, r1z, r1r = -169.5, 39.0, 28.0
for (R, label, colr, dy) in [(35.5, "POLLEN 71 mm", "#c9a100", 0), (46.0, "NECTAR 92 mm", "#c0262d", 0)]:
    ax.add_patch(Circle((r1u, FLOOR + R), R, fill=False, ec=colr, lw=2.5))
    squeeze = (FLOOR + 2 * R) - (r1z - r1r)
    ax.text(r1u + 55, FLOOR + 2 * R - 6, f"{label}: {squeeze:.0f} mm squeeze ({100 * squeeze / (2 * R):.0f}%)", color=colr, fontsize=12)
ax.annotate("lowest roller underside\n55 mm above the tiles", xy=(r1u, r1z - r1r), xytext=(-275, 120),
            arrowprops=dict(arrowstyle="->", lw=1.5), fontsize=12)
ax.annotate("star-wheel rows: 100+ mm up,\nnever touch a ball on the floor", xy=(-113, 56), xytext=(-60, 200),
            arrowprops=dict(arrowstyle="->", lw=1.5), fontsize=12)
ax.text(-275, 255, "back intake, section through the rollers (CAD as exported); blue = the only ramp parts", fontsize=12)
ax.set_xlim(-280, 120); ax.set_ylim(-60, 280)
ax.set_xlabel("-y (mm)  →  toward the robot centre"); ax.set_ylabel("z (mm)")
plt.tight_layout(); plt.savefig("figC_section.png", dpi=72); plt.close()
print("ok")
