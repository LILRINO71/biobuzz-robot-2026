import json, sys, re
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

BASE = sys.argv[1]
meta = json.load(open(BASE + ".meta.json"))
TRI = np.fromfile(BASE + ".bin", dtype=np.float32).reshape(-1, 3, 3)

def tri_index(pred):
    ids = []
    for k, m in enumerate(meta):
        if pred(m):
            ids.append(np.arange(m["tri0"], m["tri0"] + m["tris"]))
    return np.concatenate(ids) if ids else np.zeros(0, int)

def mesh_owner():
    own = np.zeros(len(TRI), np.int32)
    for k, m in enumerate(meta):
        own[m["tri0"]:m["tri0"] + m["tris"]] = k
    return own
OWN = mesh_owner()

def lin2srgb(c):
    c = np.clip(c, 0, 1)
    return np.where(c <= 0.0031308, 12.92 * c, 1.055 * np.power(c, 1 / 2.4) - 0.055)

def render(ax, sel, right, up, px_per_mm=2.0, clip=None, colors=None, title="", light=None):
    """orthographic splat render; right/up are unit vectors of the screen; view dir = up x right"""
    right = np.asarray(right, float); up = np.asarray(up, float)
    fwd = np.cross(up, right)  # toward viewer
    T = TRI[sel].astype(np.float64)
    if clip is not None:
        n, d = clip  # keep points with dot(p,n) <= d
        c = T.mean(1) @ np.asarray(n, float)
        keep = c <= d
        T = T[keep]; sel = sel[keep]
    e1 = T[:, 1] - T[:, 0]; e2 = T[:, 2] - T[:, 0]
    N = np.cross(e1, e2); A = np.linalg.norm(N, axis=1) * 0.5
    Nn = N / np.maximum(A[:, None] * 2, 1e-12)
    L = np.asarray(light if light is not None else fwd * 0.8 + up * 0.5 + right * 0.3, float); L /= np.linalg.norm(L)
    shade = 0.35 + 0.65 * np.abs(Nn @ L)
    if colors is None:
        base = np.array([meta[k]["color"] for k in OWN[sel]], float)
        base = lin2srgb(base)
        base = np.where(base.sum(1, keepdims=True) < 0.25, base + 0.22, base)
    else:
        base = colors(OWN[sel])
    col = np.clip(base * shade[:, None], 0, 1)
    # samples per triangle ~ projected area in px
    nsamp = np.clip(np.ceil(A * px_per_mm ** 2 * 1.5).astype(int), 1, 60)
    rep = np.repeat(np.arange(len(T)), nsamp)
    r1 = np.sqrt(np.random.rand(len(rep))); r2 = np.random.rand(len(rep))
    P = (1 - r1)[:, None] * T[rep, 0] + (r1 * (1 - r2))[:, None] * T[rep, 1] + (r1 * r2)[:, None] * T[rep, 2]
    P = np.concatenate([P, T.reshape(-1, 3)]); rep = np.concatenate([rep, np.repeat(np.arange(len(T)), 3)])
    u = P @ right; v = P @ up; z = P @ fwd
    u0, u1, v0, v1 = u.min(), u.max(), v.min(), v.max()
    W = int((u1 - u0) * px_per_mm) + 3; H = int((v1 - v0) * px_per_mm) + 3
    iu = ((u - u0) * px_per_mm).astype(int); iv = ((v1 - v) * px_per_mm).astype(int)
    pix = iv * W + iu
    order = np.lexsort((-z, pix))
    pix_s = pix[order]
    first = np.ones(len(pix_s), bool); first[1:] = pix_s[1:] != pix_s[:-1]
    win = order[first]
    img = np.ones((H * W, 3))
    img[pix[win]] = col[rep[win]]
    img = img.reshape(H, W, 3)
    ax.imshow(img, extent=(u0, u0 + W / px_per_mm, v1 - H / px_per_mm, v1), interpolation="nearest")
    ax.set_title(title); ax.grid(True, alpha=0.35, lw=0.5)
    return img

if __name__ == "__main__":
    pass
