"""Turning a grid of cells into shapes that read as a map rather than a chart.

The board is 22 by 12 squares. Drawn as squares it looks like a spreadsheet. The
work here dissolves the grid: take the set of cells with one cover, trace the
outline of the region they form, and round the corners. What comes back is a
coastline, a stand of forest, a patch of weed.
"""
from __future__ import annotations


def outlines(cells, cols: int, rows: int) -> list:
    """Trace the boundary loops of a set of cell indices, in grid units.

    Every cell contributes four edges; edges shared by two cells in the set
    cancel. What survives is the boundary, which we then chain into closed
    loops. Returns a list of loops, each a list of (x, y) corner points.
    """
    inside = set(cells)
    edges: dict = {}
    for i in inside:
        r, c = divmod(i, cols)
        # clockwise so exterior rings wind the same way
        for a, b in (((c, r), (c + 1, r)),
                     ((c + 1, r), (c + 1, r + 1)),
                     ((c + 1, r + 1), (c, r + 1)),
                     ((c, r + 1), (c, r))):
            if (b, a) in edges:
                del edges[(b, a)]       # shared with a neighbour: interior
            else:
                edges[(a, b)] = True

    starts: dict = {}
    for a, b in edges:
        starts.setdefault(a, []).append(b)

    loops = []
    while starts:
        a = next(iter(starts))
        loop = [a]
        while True:
            nxt = starts.get(a)
            if not nxt:
                break
            b = nxt.pop()
            if not nxt:
                del starts[a]
            loop.append(b)
            a = b
            if a == loop[0]:
                break
        if len(loop) > 3:
            loops.append(loop[:-1] if loop[0] == loop[-1] else loop)
    return loops


def simplify(loop: list) -> list:
    """Drop points that sit in the middle of a straight run."""
    if len(loop) < 3:
        return loop
    out = []
    n = len(loop)
    for k in range(n):
        p, q, r = loop[k - 1], loop[k], loop[(k + 1) % n]
        if (q[0] - p[0]) * (r[1] - q[1]) != (q[1] - p[1]) * (r[0] - q[0]):
            out.append(q)
    return out or loop


def rounded_path(loop: list, unit: float, radius: float = 0.28,
                 ox: float = 0.0, oy: float = 0.0) -> str:
    """An SVG path for one loop with its corners rounded.

    radius is in cell units. At 0 this is the raw staircase; at 0.5 the shape
    goes fully blobby and a single cell becomes a circle.
    """
    pts = simplify(loop)
    n = len(pts)
    if n < 3:
        return ""
    out = []
    for k in range(n):
        prev, cur, nxt = pts[k - 1], pts[k], pts[(k + 1) % n]

        def cut(a, b, frac):
            dx, dy = b[0] - a[0], b[1] - a[1]
            length = (dx * dx + dy * dy) ** 0.5 or 1.0
            f = min(frac, length / 2) / length
            return (a[0] + dx * f, a[1] + dy * f)

        a = cut(cur, prev, radius)
        b = cut(cur, nxt, radius)
        px = lambda p: (ox + p[0] * unit, oy + p[1] * unit)
        ax, ay = px(a)
        cx, cy = px(cur)
        bx, by = px(b)
        if k == 0:
            out.append(f"M{ax:.1f},{ay:.1f}")
        else:
            out.append(f"L{ax:.1f},{ay:.1f}")
        out.append(f"Q{cx:.1f},{cy:.1f} {bx:.1f},{by:.1f}")
    out.append("Z")
    return "".join(out)


def region_path(cells, cols: int, rows: int, unit: float,
                radius: float = 0.28, ox: float = 0.0, oy: float = 0.0) -> str:
    """One SVG path covering every cell in `cells`, corners rounded.

    Holes come out with the opposite winding, so fill-rule evenodd cuts them.
    """
    return " ".join(rounded_path(lp, unit, radius, ox, oy)
                    for lp in outlines(cells, cols, rows))


def edge_segments(cells, cols: int, rows: int):
    """The boundary of a region as individual segments in grid units, for
    drawing a shoreline or a hatched edge without filling anything."""
    out = []
    for lp in outlines(cells, cols, rows):
        for k in range(len(lp)):
            out.append((lp[k], lp[(k + 1) % len(lp)]))
    return out


def neighbours4(i: int, cols: int, rows: int):
    r, c = divmod(i, cols)
    for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
        rr, cc = r + dr, c + dc
        if 0 <= rr < rows and 0 <= cc < cols:
            yield rr * cols + cc


def distance_field(seeds, blocked, cols: int, rows: int, limit: int = 6) -> dict:
    """How many steps each cell is from the nearest seed. Used for heat maps and
    for the soft glow around a stand of weed."""
    from collections import deque
    dist = {i: 0 for i in seeds}
    q = deque(seeds)
    while q:
        i = q.popleft()
        if dist[i] >= limit:
            continue
        for n in neighbours4(i, cols, rows):
            if n in dist or n in blocked:
                continue
            dist[n] = dist[i] + 1
            q.append(n)
    return dist


# ---- organic edges -------------------------------------------------------
# Rounding the corners of a 22 by 12 grid still reads as a grid: every bend
# happens on the same lattice. These build the region on a finer grid first,
# from a smooth field sampled off the coarse one plus a little noise, so the
# boundary wanders the way a real edge does. The noise is keyed on position, so
# the same board always draws the same coastline and only squares near a change
# move between one frame and the next.

def _hash2(x: int, y: int, seed: int) -> float:
    h = (x * 374761393 + y * 668265263 + seed * 1442695040888963407) & 0xFFFFFFFF
    h = (h ^ (h >> 13)) * 1274126177 & 0xFFFFFFFF
    return ((h ^ (h >> 16)) & 0xFFFF) / 65535.0


def _value_noise(x: float, y: float, seed: int) -> float:
    xi, yi = int(x // 1), int(y // 1)
    fx, fy = x - xi, y - yi
    sx = fx * fx * (3 - 2 * fx)
    sy = fy * fy * (3 - 2 * fy)
    a = _hash2(xi, yi, seed)
    b = _hash2(xi + 1, yi, seed)
    c = _hash2(xi, yi + 1, seed)
    d = _hash2(xi + 1, yi + 1, seed)
    return (a + (b - a) * sx) + ((c + (d - c) * sx) - (a + (b - a) * sx)) * sy


def organic(cells, cols: int, rows: int, scale: int = 5,
            wobble: float = 0.16, freq: float = 1.5, seed: int = 1701):
    """The same region on a `scale` times finer grid, with a wandering edge.

    Returns (fine_cells, fine_cols, fine_rows) ready for outlines().
    """
    inside = set(cells)
    if not inside:
        return set(), cols * scale, rows * scale
    fc_, fr_ = cols * scale, rows * scale

    def at(r, c):
        return 1.0 if (0 <= r < rows and 0 <= c < cols and r * cols + c in inside) else 0.0

    out = set()
    for fr in range(fr_):
        # coarse coordinates of this fine cell's centre, offset so that sampling
        # lands between cell centres rather than on them
        y = (fr + 0.5) / scale - 0.5
        r0 = int(y // 1)
        ty = y - r0
        ty = ty * ty * (3 - 2 * ty)
        for fc in range(fc_):
            x = (fc + 0.5) / scale - 0.5
            c0 = int(x // 1)
            tx = x - c0
            tx = tx * tx * (3 - 2 * tx)
            top = at(r0, c0) + (at(r0, c0 + 1) - at(r0, c0)) * tx
            bot = at(r0 + 1, c0) + (at(r0 + 1, c0 + 1) - at(r0 + 1, c0)) * tx
            v = top + (bot - top) * ty
            if wobble:
                v += (_value_noise(fc / scale * freq, fr / scale * freq, seed) - 0.5) * 2 * wobble
            if v >= 0.5:
                out.add(fr * fc_ + fc)
    return out, fc_, fr_


def organic_path(cells, cols: int, rows: int, unit: float, scale: int = 5,
                 wobble: float = 0.16, radius: float = 0.5,
                 ox: float = 0.0, oy: float = 0.0, seed: int = 1701) -> str:
    """An SVG path for a region with a wandering, non-gridded edge."""
    fine, fcols, frows = organic(cells, cols, rows, scale, wobble, seed=seed)
    if not fine:
        return ""
    return " ".join(rounded_path(lp, unit / scale, radius, ox, oy)
                    for lp in outlines(fine, fcols, frows))


def chaikin(loop: list, iterations: int = 3) -> list:
    """Corner cutting. Each pass replaces every corner with two points a quarter
    of the way along each side, which turns a staircase into a curve. Three
    passes is enough to lose the lattice without losing the shape."""
    pts = loop
    for _ in range(iterations):
        if len(pts) < 4:
            break
        out = []
        n = len(pts)
        for k in range(n):
            a, b = pts[k], pts[(k + 1) % n]
            out.append((a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25))
            out.append((a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75))
        pts = out
    return pts


def smooth_path(loop: list, unit: float, ox: float = 0.0, oy: float = 0.0,
                iterations: int = 3) -> str:
    pts = chaikin(simplify(loop), iterations)
    if len(pts) < 3:
        return ""
    d = [f"M{ox + pts[0][0]*unit:.1f},{oy + pts[0][1]*unit:.1f}"]
    for x, y in pts[1:]:
        d.append(f"L{ox + x*unit:.1f},{oy + y*unit:.1f}")
    d.append("Z")
    return "".join(d)


def coast(cells, cols: int, rows: int, unit: float, scale: int = 4,
          wobble: float = 0.16, ox: float = 0.0, oy: float = 0.0,
          seed: int = 1701, smoothing: int = 3) -> str:
    """The whole pipeline: build the region on a finer grid with a wandering
    edge, trace it, then cut the corners until it reads as a coastline."""
    fine, fcols, frows = organic(cells, cols, rows, scale, wobble, seed=seed)
    if not fine:
        return ""
    return " ".join(smooth_path(lp, unit / scale, ox, oy, smoothing)
                    for lp in outlines(fine, fcols, frows) if len(lp) > 5)


def links(cells, cols: int, rows: int, diagonal: bool = True):
    """Adjacent pairs of cells as centre-to-centre segments, plus every centre.

    A trench dug across a real map is rarely a straight row: it steps
    diagonally, and drawn cell by cell it reads as scattered chips rather than
    as one barrier. Joining neighbouring centres and stroking the result draws
    any arrangement as a single connected band.

    Diagonals are only bridged where there is no way round the corner. Bridging
    them everywhere cuts every elbow into a triangle, which on a projector looks
    like a piece of geometry nobody dug.
    """
    cs = set(cells)
    centres = []
    segs = []
    for i in cs:
        r, c = divmod(i, cols)
        centres.append((c + 0.5, r + 0.5))
        for dr, dc in ((0, 1), (1, 0)):
            rr, cc = r + dr, c + dc
            if 0 <= rr < rows and 0 <= cc < cols and rr * cols + cc in cs:
                segs.append(((c + 0.5, r + 0.5), (cc + 0.5, rr + 0.5)))
        if not diagonal:
            continue
        for dr, dc in ((1, 1), (1, -1)):
            rr, cc = r + dr, c + dc
            if not (0 <= rr < rows and 0 <= cc < cols) or rr * cols + cc not in cs:
                continue
            # the two cells that would form an elbow between them
            elbow_a = r * cols + cc
            elbow_b = rr * cols + c
            if elbow_a in cs or elbow_b in cs:
                continue                      # there is a way round; do not cut it
            segs.append(((c + 0.5, r + 0.5), (cc + 0.5, rr + 0.5)))
    return centres, segs


def band_svg(cells, cols: int, rows: int, unit: float, ox: float, oy: float,
             colour: str, width: float, dash: str | None = None,
             opacity: float = 1.0, anim: str | None = None,
             diagonal: bool = True) -> str:
    """One connected band through a set of cells, whatever shape they make."""
    if not cells:
        return ""
    centres, segs = links(cells, cols, rows, diagonal)
    d = f' stroke-dasharray="{dash}"' if dash else ""
    a = (f'<animate attributeName="opacity" values="{anim}" dur="1s" '
         f'repeatCount="indefinite"/>') if anim else ""
    out = [f'<g stroke="{colour}" stroke-width="{width:.1f}" stroke-linecap="round" '
           f'stroke-linejoin="round" fill="none" opacity="{opacity}"{d}>{a}']
    for (ax, ay), (bx, by) in segs:
        out.append(f'<line x1="{ox+ax*unit:.1f}" y1="{oy+ay*unit:.1f}" '
                   f'x2="{ox+bx*unit:.1f}" y2="{oy+by*unit:.1f}"/>')
    for (cx, cy) in centres:
        out.append(f'<line x1="{ox+cx*unit:.1f}" y1="{oy+cy*unit:.1f}" '
                   f'x2="{ox+cx*unit:.1f}" y2="{oy+cy*unit:.1f}"/>')
    out.append("</g>")
    return "".join(out)
