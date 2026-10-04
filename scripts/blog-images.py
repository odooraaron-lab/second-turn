"""
Draws a cover picture for every blog post: public/blog/<slug>.jpg (1200 x 675).

Each picture is generated from the post's slug, so it is unique and never changes, and the scene matches the
post's topic: a game board for classic games, a stack of boxes for collecting, a sorted box of pieces for care and
repair, cards and dice for game night, and a courier parcel for buying in NZ.

  python3 scripts/blog-images.py          # draw any posts that don't have a picture yet
  python3 scripts/blog-images.py --all    # redraw everything

To use a real photo instead, save it over public/blog/<slug>.jpg (landscape, about 1200 x 675) and it is used
everywhere: lists, the post page and when the post is shared. Needs: pip install pillow numpy
"""
import glob, hashlib, math, os, re, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "blog")
W, H = 1200, 675
S = 2  # drawn at twice the size, then scaled down for smooth edges

INK = (28, 43, 68)
RED = (210, 58, 42)
YELLOW = (242, 182, 50)
BLUE = (47, 109, 181)
GREEN = (46, 125, 79)
MINT = (219, 232, 213)
CARD = (255, 253, 247)
PINK = (246, 201, 191)
SKY = (199, 220, 242)
KRAFT = (200, 154, 100)
KRAFT_D = (170, 124, 75)
BRIGHTS = [RED, YELLOW, BLUE, GREEN, PINK, SKY]

TABLES = {
    "classic-games": [(219, 232, 213), (205, 224, 199), (226, 236, 222)],
    "collecting": [(246, 231, 198), (240, 222, 184), (232, 219, 196)],
    "care-and-repair": [(227, 236, 244), (214, 228, 240), (232, 238, 232)],
    "game-night": [(248, 220, 211), (243, 208, 196), (236, 226, 240)],
    "buying-in-nz": [(233, 226, 240), (222, 232, 226), (240, 232, 214)],
}

LW = 6 * S  # outline width
SH = 9 * S  # hard shadow offset


class Rng:
    def __init__(self, seed):
        self.r = np.random.default_rng(int(hashlib.md5(seed.encode()).hexdigest()[:12], 16))

    def u(self, a, b):
        return float(self.r.uniform(a, b))

    def i(self, a, b):
        return int(self.r.integers(a, b + 1))

    def pick(self, seq):
        return seq[int(self.r.integers(len(seq)))]

    def shuffle(self, seq):
        seq = list(seq)
        self.r.shuffle(seq)
        return seq


# ---------- drawing helpers (all coordinates in final pixels; scaled by S here) ----------
def sc(*v):
    return [x * S for x in v]


def rrect(d, x0, y0, x1, y1, r, fill, outline=INK, shadow=True):
    if shadow:
        d.rounded_rectangle(sc(x0, y0, x1, y1), r * S, fill=INK, outline=None)
        d.rounded_rectangle([x0 * S - SH * 0, y0 * S - SH, x1 * S - SH * 0, y1 * S - SH], r * S, fill=fill, outline=outline, width=LW)
    else:
        d.rounded_rectangle(sc(x0, y0, x1, y1), r * S, fill=fill, outline=outline, width=LW)


def layer():
    return Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0))


def paste_rotated(base, tile, cx, cy, angle):
    """Rotate a small RGBA tile and paste it centred at (cx, cy) in final pixels."""
    t = tile.rotate(angle, resample=Image.BICUBIC, expand=True)
    base.alpha_composite(t, (int(cx * S - t.width / 2), int(cy * S - t.height / 2)))


PIPS = {
    1: [(0, 0)],
    2: [(-1, -1), (1, 1)],
    3: [(-1, -1), (0, 0), (1, 1)],
    4: [(-1, -1), (1, -1), (-1, 1), (1, 1)],
    5: [(-1, -1), (1, -1), (0, 0), (-1, 1), (1, 1)],
    6: [(-1, -1), (1, -1), (-1, 0), (1, 0), (-1, 1), (1, 1)],
}


def die_tile(size, face, body=CARD, pip=INK):
    s = int(size * S)
    pad = SH + LW
    t = Image.new("RGBA", (s + pad * 2, s + pad * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(t)
    d.rounded_rectangle([pad, pad + SH * 0.6, pad + s, pad + s + SH * 0.6], s * 0.2, fill=INK)
    d.rounded_rectangle([pad, pad, pad + s, pad + s], s * 0.2, fill=body, outline=INK, width=LW)
    for dx, dy in PIPS[face]:
        cx, cy = pad + s / 2 + dx * s * 0.26, pad + s / 2 + dy * s * 0.26
        r = s * 0.085
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=pip)
    return t


def pawn_tile(h, color):
    """A side-on pawn: round head, flared body."""
    s = int(h * S)
    w = int(s * 0.72)
    pad = LW * 2
    t = Image.new("RGBA", (w + pad * 2, s + pad * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(t)
    ox, oy = pad, pad
    head_r = w * 0.25
    hx, hy = ox + w / 2, oy + head_r + 2
    body = [
        (ox + w * 0.36, oy + head_r * 1.7),
        (ox + w * 0.64, oy + head_r * 1.7),
        (ox + w * 0.78, oy + s * 0.86),
        (ox + w, oy + s * 0.94),
        (ox + w, oy + s),
        (ox, oy + s),
        (ox, oy + s * 0.94),
        (ox + w * 0.22, oy + s * 0.86),
    ]
    d.polygon(body, fill=color, outline=INK, width=LW)
    d.ellipse([hx - head_r, hy - head_r, hx + head_r, hy + head_r], fill=color, outline=INK, width=LW)
    d.ellipse([hx - head_r * 0.55, hy - head_r * 0.6, hx - head_r * 0.1, hy - head_r * 0.05], fill=(255, 255, 255, 140))
    return t


def card_tile(w, h, face, back=False):
    pw, ph = int(w * S), int(h * S)
    pad = SH + LW
    t = Image.new("RGBA", (pw + pad * 2, ph + pad * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(t)
    d.rounded_rectangle([pad + SH * 0.5, pad + SH * 0.5, pad + pw + SH * 0.5, pad + ph + SH * 0.5], 14 * S, fill=INK)
    d.rounded_rectangle([pad, pad, pad + pw, pad + ph], 14 * S, fill=CARD if not back else face, outline=INK, width=LW)
    if back:
        m = 14 * S
        d.rounded_rectangle([pad + m, pad + m, pad + pw - m, pad + ph - m], 8 * S, outline=CARD, width=LW)
    else:
        d.rectangle([pad + 10 * S, pad + 10 * S, pad + pw - 10 * S, pad + ph * 0.38], fill=face)
        for k in range(3):
            y = pad + ph * (0.52 + k * 0.12)
            d.line([pad + 18 * S, y, pad + pw - (18 + k * 16) * S, y], fill=INK, width=LW // 2)
    return t


def note_tile(w, h, color):
    pw, ph = int(w * S), int(h * S)
    pad = LW
    t = Image.new("RGBA", (pw + pad * 2, ph + pad * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(t)
    d.rectangle([pad, pad, pad + pw, pad + ph], fill=color, outline=INK, width=LW // 2 + 2)
    r = ph * 0.28
    d.ellipse([pad + pw / 2 - r, pad + ph / 2 - r, pad + pw / 2 + r, pad + ph / 2 + r], outline=INK, width=LW // 2)
    return t


def grain(img, rng, amount=7):
    a = np.asarray(img).astype(np.float32)
    n = rng.r.normal(0, amount, a.shape[:2])[..., None]
    return Image.fromarray(np.clip(a + n, 0, 255).astype(np.uint8))


# ---------- scenes ----------
def scene_board(base, rng):
    d = ImageDraw.Draw(base)
    bx0, by0 = rng.u(-120, -40), rng.u(80, 140)
    size = rng.u(620, 700)
    bx1, by1 = bx0 + size * 1.25, by0 + size
    rrect(d, bx0, by0, bx1, by1, 26, CARD)
    # perimeter track
    sq = 74
    cols = rng.shuffle([YELLOW, PINK, SKY, MINT, CARD, GREEN])
    k = 0
    x = bx0 + 24
    while x + sq < bx1 - 20:
        d.rounded_rectangle(sc(x, by0 + 24 - SH / S, x + sq - 8, by0 + 24 + sq - 8 - SH / S), 10 * S, fill=cols[k % len(cols)], outline=INK, width=LW)
        k += 1
        x += sq
    y = by0 + 24 + sq
    while y + sq < by1 - 20:
        d.rounded_rectangle(sc(bx1 - 24 - sq + 8, y - SH / S, bx1 - 24, y + sq - 8 - SH / S), 10 * S, fill=cols[k % len(cols)], outline=INK, width=LW)
        k += 1
        y += sq
    # centre panel with a big start arrow
    cx0, cy0 = bx0 + 140, by0 + 150
    d.rounded_rectangle(sc(cx0, cy0, cx0 + 360, cy0 + 260), 18 * S, fill=rng.pick([RED, BLUE, GREEN]), outline=INK, width=LW)
    ax, ay = cx0 + 70, cy0 + 130
    d.polygon(sc(ax, ay - 40, ax + 160, ay - 40, ax + 160, ay - 80, ax + 240, ay, ax + 160, ay + 80, ax + 160, ay + 40, ax, ay + 40), fill=CARD, outline=INK, width=LW)
    # pawns on the track
    for _ in range(rng.i(1, 2)):
        paste_rotated(base, pawn_tile(rng.u(110, 140), rng.pick([RED, BLUE, YELLOW, GREEN])), rng.u(bx0 + 120, bx1 - 140), by0 + rng.u(10, 30), rng.u(-8, 8))
    # dice off the board
    for k in range(2):
        paste_rotated(base, die_tile(rng.u(96, 120), rng.i(1, 6), body=rng.pick([CARD, RED])), rng.u(900, 1110), rng.u(170, 560), rng.u(-35, 35))
    # money
    for k in range(rng.i(2, 3)):
        paste_rotated(base, note_tile(190, 96, rng.pick([PINK, SKY, YELLOW, MINT])), rng.u(860, 1080), rng.u(480, 620), rng.u(-25, 25))


def scene_boxes(base, rng):
    d = ImageDraw.Draw(base)
    n = rng.i(4, 5)
    x0 = rng.u(90, 170)
    y = 640
    widths = [rng.u(430, 560) for _ in range(n)]
    for k in range(n):
        h = rng.u(70, 96)
        w = widths[k]
        x = x0 + rng.u(-30, 30)
        col = rng.pick(BRIGHTS + [CARD])
        rrect(d, x, y - h, x + w, y, 10, col)
        # spine stripes and a title bar
        sy = y - h - SH / S
        stripe = rng.pick([INK, CARD, RED, YELLOW])
        if stripe == col:
            stripe = INK
        d.rectangle(sc(x + 22, sy + h * 0.28, x + 22 + w * 0.38, sy + h * 0.52), fill=stripe)
        d.rectangle(sc(x + w * 0.62, sy + 6, x + w * 0.66, sy + h - 6), fill=INK)
        d.rectangle(sc(x + w * 0.7, sy + 6, x + w * 0.72, sy + h - 6), fill=INK)
        y -= h + 4
    # a lid propped up on the right, with a decade-ish pattern
    lx, ly, lw, lh = rng.u(720, 780), rng.u(120, 170), 380, 300
    tile = Image.new("RGBA", (int((lw + 40) * S), int((lh + 40) * S)), (0, 0, 0, 0))
    td = ImageDraw.Draw(tile)
    p = 20 * S
    td.rounded_rectangle([p + SH, p + SH, p + lw * S + SH, p + lh * S + SH], 18 * S, fill=INK)
    td.rounded_rectangle([p, p, p + lw * S, p + lh * S], 18 * S, fill=CARD, outline=INK, width=LW)
    style = rng.i(0, 2)
    if style == 0:  # 70s stripes
        bands = [YELLOW, (226, 131, 58), (181, 83, 42), (107, 58, 34)]
        for i, c in enumerate(bands):
            td.rectangle([p + LW, p + (90 + i * 34) * S, p + lw * S - LW, p + (124 + i * 34) * S], fill=c)
    elif style == 1:  # sunburst
        cx, cy = p + lw * S / 2, p + lh * S * 0.62
        for i in range(12):
            a0, a1 = math.radians(i * 30), math.radians(i * 30 + 15)
            r = lw * S
            td.polygon([(cx, cy), (cx + r * math.cos(a0), cy + r * math.sin(a0)), (cx + r * math.cos(a1), cy + r * math.sin(a1))], fill=rng.pick([YELLOW, PINK, SKY]))
        td.rounded_rectangle([p, p, p + lw * S, p + lh * S], 18 * S, outline=INK, width=LW)
        td.ellipse([cx - 60 * S, cy - 60 * S, cx + 60 * S, cy + 60 * S], fill=RED, outline=INK, width=LW)
    else:  # 80s shapes
        td.rounded_rectangle([p + LW, p + LW, p + lw * S - LW, p + lh * S - LW], 14 * S, fill=INK)
        td.polygon([(p + 60 * S, p + 230 * S), (p + 150 * S, p + 80 * S), (p + 220 * S, p + 230 * S)], fill=(255, 95, 162))
        td.ellipse([p + 230 * S, p + 60 * S, p + 330 * S, p + 160 * S], fill=(51, 195, 195))
        td.rectangle([p + 250 * S, p + 190 * S, p + 340 * S, p + 250 * S], fill=YELLOW)
    td.rounded_rectangle([p + 40 * S, p + 26 * S, p + (lw - 40) * S, p + 70 * S], 10 * S, fill=CARD, outline=INK, width=LW // 2 + 2)
    paste_rotated(base, tile, lx + lw / 2, ly + lh / 2, rng.u(-9, -3))
    # magnifier
    mx, my, mr = rng.u(980, 1080), rng.u(500, 570), 62
    d.line(sc(mx + mr * 0.7, my + mr * 0.7, mx + mr * 1.6, my + mr * 1.6), fill=INK, width=22 * S)
    d.ellipse(sc(mx - mr, my - mr, mx + mr, my + mr), fill=(235, 245, 250), outline=INK, width=LW + 2 * S)


def scene_sorted(base, rng):
    d = ImageDraw.Draw(base)
    # box tray
    tx0, ty0, tx1, ty1 = rng.u(60, 110), rng.u(90, 130), rng.u(700, 760), rng.u(560, 610)
    rrect(d, tx0, ty0, tx1, ty1, 22, (240, 236, 226))
    cols, rows = 3, 2
    cw, ch = (tx1 - tx0 - 60) / cols, (ty1 - ty0 - 60) / rows
    for r in range(rows):
        for c in range(cols):
            x0 = tx0 + 24 + c * (cw + 6)
            y0 = ty0 + 18 + r * (ch + 6) - SH / S
            d.rounded_rectangle(sc(x0, y0, x0 + cw, y0 + ch), 14 * S, fill=CARD, outline=INK, width=LW // 2 + 2)
            kind = rng.i(0, 3)
            col = rng.pick(BRIGHTS)
            for _ in range(rng.i(5, 9)):
                px, py = rng.u(x0 + 26, x0 + cw - 26), rng.u(y0 + 26, y0 + ch - 26)
                if kind == 0:
                    rr = 15
                    d.ellipse(sc(px - rr, py - rr, px + rr, py + rr), fill=col, outline=INK, width=LW // 2 + 2)
                elif kind == 1:
                    d.rounded_rectangle(sc(px - 16, py - 12, px + 16, py + 12), 4 * S, fill=col, outline=INK, width=LW // 2 + 2)
                elif kind == 2:
                    d.polygon(sc(px, py - 18, px + 17, py + 13, px - 17, py + 13), fill=col, outline=INK, width=LW // 2 + 1)
                else:
                    d.rounded_rectangle(sc(px - 22, py - 8, px + 22, py + 8), 8 * S, fill=col, outline=INK, width=LW // 2 + 1)
    # resealable bag with pieces
    gx, gy = rng.u(800, 860), rng.u(110, 160)
    bag = Image.new("RGBA", (int(330 * S), int(380 * S)), (0, 0, 0, 0))
    bd = ImageDraw.Draw(bag)
    bd.rounded_rectangle([20 * S, 20 * S, 300 * S, 350 * S], 16 * S, fill=(255, 255, 255, 120), outline=INK, width=LW)
    bd.rectangle([20 * S, 60 * S, 300 * S, 72 * S], fill=RED)
    for _ in range(9):
        px, py = rng.u(60, 260) * S, rng.u(130, 320) * S
        rr = 18 * S
        bd.ellipse([px - rr, py - rr, px + rr, py + rr], fill=rng.pick(BRIGHTS), outline=INK, width=LW // 2 + 2)
    paste_rotated(base, bag, gx + 150, gy + 170, rng.u(-12, 12))
    # tally on a note
    nx, ny = rng.u(810, 880), rng.u(500, 540)
    tile = Image.new("RGBA", (int(300 * S), int(170 * S)), (0, 0, 0, 0))
    nd = ImageDraw.Draw(tile)
    nd.rectangle([14 * S, 14 * S, 286 * S, 156 * S], fill=YELLOW, outline=INK, width=LW // 2 + 2)
    for g in range(rng.i(2, 3)):
        gx0 = (40 + g * 82) * S
        for k in range(4):
            nd.line([gx0 + k * 14 * S, 50 * S, gx0 + k * 14 * S, 120 * S], fill=INK, width=LW)
        nd.line([gx0 - 10 * S, 110 * S, gx0 + 54 * S, 58 * S], fill=INK, width=LW)
    paste_rotated(base, tile, nx + 150, ny + 85, rng.u(-10, 8))


def scene_cards(base, rng):
    d = ImageDraw.Draw(base)
    # scorepad
    px0, py0 = rng.u(760, 820), rng.u(70, 110)
    rrect(d, px0, py0, px0 + 320, py0 + 420, 14, CARD)
    for k in range(7):
        y = py0 + 60 + k * 48 - SH / S
        d.line(sc(px0 + 30, y, px0 + 290, y), fill=SKY, width=LW // 2)
        if k < 5:
            for t in range(rng.i(1, 4)):
                x = px0 + 170 + t * 22
                d.line(sc(x, y - 30, x, y - 6), fill=INK, width=LW // 2 + 2)
    d.rectangle(sc(px0 + 140, py0 + 20 - SH / S, px0 + 146, py0 + 400 - SH / S), fill=PINK)
    # fanned hand of cards
    fx, fy = rng.u(330, 420), rng.u(330, 380)
    n = rng.i(4, 5)
    spread = rng.u(10, 15)
    colors = rng.shuffle([RED, BLUE, YELLOW, GREEN, PINK])
    for k in range(n):
        ang = (k - (n - 1) / 2) * spread
        tile = card_tile(200, 290, colors[k % len(colors)], back=False)
        rad = math.radians(ang)
        cx = fx + math.sin(rad) * 230
        cy = fy - math.cos(rad) * 60 + abs(ang) * 1.2
        paste_rotated(base, tile, cx, cy, -ang)
    # face-down deck
    paste_rotated(base, card_tile(170, 245, rng.pick([BLUE, RED, GREEN]), back=True), rng.u(120, 170), rng.u(470, 520), rng.u(-14, 14))
    # dice and a pawn
    for k in range(2):
        paste_rotated(base, die_tile(rng.u(90, 110), rng.i(1, 6), body=rng.pick([CARD, YELLOW])), rng.u(660, 760), rng.u(500, 600), rng.u(-30, 30))
    paste_rotated(base, pawn_tile(rng.u(120, 150), rng.pick([RED, BLUE, GREEN])), rng.u(1100, 1140), rng.u(540, 580), rng.u(-6, 6))


def scene_parcel(base, rng):
    d = ImageDraw.Draw(base)
    # open courier box
    bx0, by0, bx1, by1 = rng.u(120, 180), rng.u(230, 260), rng.u(700, 740), rng.u(600, 630)
    # game box poking out
    gb = rng.pick([RED, BLUE, GREEN])
    rrect(d, bx0 + 50, by0 - 140, bx1 - 70, by0 + 80, 14, gb)
    d.rounded_rectangle(sc(bx0 + 90, by0 - 125 - SH / S, bx1 - 110, by0 - 70 - SH / S), 10 * S, fill=CARD, outline=INK, width=LW // 2 + 2)
    for k in range(5):
        x = bx0 + 90 + k * 64
        d.rounded_rectangle(sc(x, by0 - 50 - SH / S, x + 50, by0 - 4 - SH / S), 8 * S, fill=rng.pick([YELLOW, PINK, SKY, CARD]), outline=INK, width=LW // 2 + 2)
    rrect(d, bx0, by0, bx1, by1, 12, KRAFT)
    d.rectangle(sc(bx0 + 4, by0 - SH / S + 4, bx1 - 4, by0 + 46 - SH / S), fill=KRAFT_D)
    tx = (bx0 + bx1) / 2
    d.rectangle(sc(tx - 34, by0 - SH / S, tx + 34, by1 - SH / S), fill=(222, 196, 150))
    d.rectangle(sc(bx0 + 40, by1 - 120 - SH / S, bx0 + 230, by1 - 40 - SH / S), fill=CARD, outline=INK, width=LW // 2 + 2)
    for k in range(3):
        y = by1 - 100 + k * 18 - SH / S
        d.line(sc(bx0 + 60, y, bx0 + 200 - k * 30, y), fill=INK, width=LW // 2)
    # price sticker
    sx, sy, sr = rng.u(880, 960), rng.u(170, 230), 110
    d.ellipse(sc(sx - sr, sy - sr + SH / S, sx + sr, sy + sr + SH / S), fill=INK)
    d.ellipse(sc(sx - sr, sy - sr, sx + sr, sy + sr), fill=YELLOW, outline=INK, width=LW)
    d.text((sx * S, sy * S), "$", fill=INK, anchor="mm", font=FONT_DISPLAY_BIG)
    # pawn and die
    paste_rotated(base, pawn_tile(rng.u(150, 180), rng.pick([RED, BLUE, YELLOW])), rng.u(860, 920), rng.u(470, 520), rng.u(-6, 6))
    paste_rotated(base, die_tile(rng.u(100, 120), rng.i(1, 6)), rng.u(1040, 1110), rng.u(520, 600), rng.u(-30, 30))


SCENES = {
    "classic-games": scene_board,
    "collecting": scene_boxes,
    "care-and-repair": scene_sorted,
    "game-night": scene_cards,
    "buying-in-nz": scene_parcel,
}

try:
    from PIL import ImageFont

    _font_path = os.environ.get("SHRIKHAND_TTF") or os.path.join(ROOT, "scripts", "fonts", "Shrikhand-Regular.ttf")
    FONT_DISPLAY_BIG = ImageFont.truetype(_font_path, 150 * S)
except Exception:  # older Pillow without sized default fonts
    FONT_DISPLAY_BIG = ImageFont.load_default()


def paint(slug, category):
    rng = Rng(slug)
    table = rng.pick(TABLES.get(category, TABLES["classic-games"]))
    base = Image.new("RGBA", (W * S, H * S), table + (255,))
    # faint dotted tabletop pattern
    d = ImageDraw.Draw(base)
    dot = tuple(max(0, c - 14) for c in table)
    step = 36 * S
    for y in range(0, H * S, step):
        for x in range((y // step % 2) * step // 2, W * S, step):
            d.ellipse([x - 2 * S, y - 2 * S, x + 2 * S, y + 2 * S], fill=dot)
    SCENES.get(category, scene_board)(base, rng)
    img = base.convert("RGB").resize((W, H), Image.LANCZOS)
    img = grain(img, rng, 4)
    os.makedirs(OUT, exist_ok=True)
    img.save(os.path.join(OUT, f"{slug}.jpg"), quality=84, optimize=True, progressive=True)


def read_posts():
    posts = []
    for f in sorted(glob.glob(os.path.join(ROOT, "content", "blog", "*.ts"))):
        text = open(f, encoding="utf8").read()
        for m in re.finditer(r'slug:\s*"([^"]+)",\s*\n\s*(?:featured:[^\n]*\n\s*)?category:\s*"([^"]+)"', text):
            posts.append((m.group(1), m.group(2)))
        # posts that list category before slug
        for m in re.finditer(r'category:\s*"([^"]+)",\s*\n\s*slug:\s*"([^"]+)"', text):
            posts.append((m.group(2), m.group(1)))
    return posts


def main():
    redo = "--all" in sys.argv
    posts = read_posts()
    painted = 0
    for slug, cat in posts:
        path = os.path.join(OUT, f"{slug}.jpg")
        if redo or not os.path.exists(path):
            paint(slug, cat)
            painted += 1
    have = sorted(os.path.basename(p)[:-4] for p in glob.glob(os.path.join(OUT, "*.jpg")))
    with open(os.path.join(ROOT, "content", "post-images.ts"), "w", encoding="utf8") as f:
        f.write("// Generated by scripts/blog-images.py: posts that have a cover in public/blog.\n")
        f.write("export const postImages = new Set<string>([\n")
        for s in have:
            f.write(f'  "{s}",\n')
        f.write("]);\n")
    print(f"Drew {painted} covers; {len(have)} posts have a cover.")


if __name__ == "__main__":
    main()
