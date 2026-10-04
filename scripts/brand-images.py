"""
Draws the site icons and the share image from the shop name in site.config.ts:

  app/icon.svg, app/favicon.ico, app/apple-icon.png,
  public/icon-192.png, public/icon-512.png, public/icon-maskable-512.png,
  public/opengraph-image.png (1200 x 630, shown when a page is shared or in Google results)

Run it again after changing the name:  python3 scripts/brand-images.py
Needs: pip install pillow
"""
import math, os, re
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = os.path.join(ROOT, "scripts", "fonts")
INK = (12, 11, 34)
RED = (255, 94, 138)
YELLOW = (255, 210, 63)
BLUE = (63, 224, 197)
MINT = (27, 26, 58)
CARD = (255, 244, 226)
PINK = (255, 179, 200)
SKY = (185, 176, 255)

config = open(os.path.join(ROOT, "site.config.ts"), encoding="utf8").read()
NAME = re.search(r'name:\s*"([^"]+)"', config).group(1)
TAGLINE = re.search(r'tagline:\s*"([^"]+)"', config).group(1)


def font(name, size, weight=None):
    f = ImageFont.truetype(os.path.join(FONTS, name), size)
    if weight:
        try:
            f.set_variation_by_axes([weight])
        except Exception:
            pass
    return f


def die(d, cx, cy, s, angle=0, body=RED, pip=CARD, outline=INK, line=None, shadow=True):
    """A rounded die showing two, drawn as a rotated polygon so it stays crisp."""
    line = line or max(2, int(s * 0.07))
    r = s * 0.22

    def rot(x, y):
        a = math.radians(angle)
        return (cx + x * math.cos(a) - y * math.sin(a), cy + x * math.sin(a) + y * math.cos(a))

    pts = []
    h = s / 2
    for (qx, qy, a0) in [(h - r, -h + r, -90), (h - r, h - r, 0), (-h + r, h - r, 90), (-h + r, -h + r, 180)]:
        for k in range(10):
            a = math.radians(a0 + k * 10)
            pts.append(rot(qx + r * math.cos(a), qy + r * math.sin(a)))
    if shadow:
        off = s * 0.09
        d.polygon([(x, y + off) for x, y in pts], fill=outline)
    d.polygon(pts, fill=body, outline=outline, width=line)
    for px, py in [(-0.26, -0.26), (0.26, 0.26)]:
        x, y = rot(px * s, py * s)
        pr = s * 0.095
        d.ellipse([x - pr, y - pr, x + pr, y + pr], fill=pip)


def icon(size, background=None, scale=0.78):
    s = size * 4
    img = Image.new("RGBA", (s, s), background + (255,) if background else (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    die(d, s / 2, s / 2 - s * 0.03, s * scale, angle=-8)
    return img.resize((size, size), Image.LANCZOS)


def write_svg():
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <g transform="rotate(-8 32 32)">
    <rect x="9" y="12" width="46" height="46" rx="11" fill="#0c0b22"/>
    <rect x="9" y="8" width="46" height="46" rx="11" fill="#ff5e8a" stroke="#0c0b22" stroke-width="3.5"/>
    <circle cx="21" cy="19.5" r="4.4" fill="#fff4e2"/>
    <circle cx="43" cy="42.5" r="4.4" fill="#fff4e2"/>
  </g>
</svg>
"""
    open(os.path.join(ROOT, "app", "icon.svg"), "w").write(svg)


def share_image():
    W, H, S = 1200, 630, 2
    img = Image.new("RGB", (W * S, H * S), MINT)
    d = ImageDraw.Draw(img)
    for y in range(0, H * S, 36 * S):
        for x in range(0, W * S, 36 * S):
            d.ellipse([x - 2 * S, y - 2 * S, x + 2 * S, y + 2 * S], fill=(44, 42, 86))
    # board on the right
    bx, by, bs = 700 * S, 95 * S, 440 * S
    d.rounded_rectangle([bx, by + 12 * S, bx + bs, by + bs + 12 * S], 30 * S, fill=INK)
    d.rounded_rectangle([bx, by, bx + bs, by + bs], 30 * S, fill=(42, 40, 87), outline=INK, width=6 * S)
    gap, pad = 14 * S, 22 * S
    cell = (bs - pad * 2 - gap * 2) / 3
    colours = [YELLOW, BLUE, SKY, PINK, YELLOW, BLUE, SKY, PINK, (42, 40, 87)]
    order = [(2, 0), (2, 1), (2, 2), (1, 2), (1, 1), (1, 0), (0, 0), (0, 1), (0, 2)]
    numf = font("Bungee-Regular.ttf", 30 * S)
    for n, (r, c) in enumerate(order):
        x0 = bx + pad + c * (cell + gap)
        y0 = by + pad + r * (cell + gap)
        fill = RED if n == 0 else colours[n]
        d.rounded_rectangle([x0, y0, x0 + cell, y0 + cell], 16 * S, fill=fill, outline=INK, width=5 * S)
        d.text((x0 + 14 * S, y0 + 8 * S), str(n + 1), font=numf, fill=CARD if n == 8 else INK)
    # pawn on square 1
    px, py = bx + pad + cell * 0.4, by + pad + 2 * (cell + gap) + cell * 0.14
    pw, ph = 60 * S, 78 * S
    d.polygon([(px + pw * 0.36, py + ph * 0.3), (px + pw * 0.64, py + ph * 0.3), (px + pw * 0.8, py + ph * 0.86),
               (px + pw, py + ph * 0.94), (px + pw, py + ph), (px, py + ph), (px, py + ph * 0.94), (px + pw * 0.2, py + ph * 0.86)],
              fill=CARD, outline=INK, width=5 * S)
    hr = pw * 0.27
    d.ellipse([px + pw / 2 - hr, py + hr * 0.2, px + pw / 2 + hr, py + hr * 2.2], fill=CARD, outline=INK, width=5 * S)
    die(d, 640 * S, 520 * S, 92 * S, angle=18, body=CARD, pip=INK, line=5 * S)
    # words on the left
    title = font("Bungee-Regular.ttf", 92 * S)
    words = NAME.split(" ")
    lines, cur = [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if d.textlength(trial, font=title) > 560 * S and cur:
            lines.append(cur)
            cur = w
        else:
            cur = trial
    lines.append(cur)
    y = 150 * S
    for ln in lines:
        d.text((70 * S, y), ln, font=title, fill=CARD)
        y += 124 * S
    sub = font("NunitoSans.ttf", 34 * S)
    words, line_, out = TAGLINE.split(" "), "", []
    for w in words:
        trial = (line_ + " " + w).strip()
        if d.textlength(trial, font=sub) > 540 * S and line_:
            out.append(line_)
            line_ = w
        else:
            line_ = trial
    out.append(line_)
    y += 18 * S
    for ln in out:
        d.text((74 * S, y), ln, font=sub, fill=(201, 195, 232))
        y += 46 * S
    img = img.resize((W, H), Image.LANCZOS)
    img.save(os.path.join(ROOT, "public", "opengraph-image.png"), optimize=True)


def main():
    write_svg()
    icon(512).save(os.path.join(ROOT, "public", "icon-512.png"))
    icon(192).save(os.path.join(ROOT, "public", "icon-192.png"))
    icon(512, background=MINT, scale=0.56).save(os.path.join(ROOT, "public", "icon-maskable-512.png"))
    icon(180, background=MINT, scale=0.66).convert("RGB").save(os.path.join(ROOT, "app", "apple-icon.png"))
    ico = icon(256)
    ico.save(os.path.join(ROOT, "app", "favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48)])
    share_image()
    print(f"Icons and share image drawn for {NAME}.")


if __name__ == "__main__":
    main()
