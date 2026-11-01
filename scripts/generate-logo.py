"""Generate the app logo (favicon.svg + PNG fallbacks) from one 16x16 pixel map.

A framed canvas, partly painted: a pixel landscape with its bottom-right corner
still a blank grid, waiting to be painted square by square.

Run: python3 scripts/generate-logo.py   (needs Pillow)
"""
from pathlib import Path
from PIL import Image, ImageColor

COLORS = {
    "O": "#4a2f1b",  # frame, outer
    "F": "#9a6332",  # frame, inner
    "S": "#7cc3e8",  # sky
    "s": "#d8f0fb",  # cloud
    "Y": "#f6c945",  # sun
    "G": "#3f7a3a",  # hill, dark
    "g": "#6db35f",  # hill, light
    "C": "#fffdf8",  # unpainted square
    "c": "#d9d3c7",  # unpainted square, alternate
}

INNER = [  # "_" = unpainted, drawn as a checkerboard of blank squares
    "SSSSSSSSSSSS",
    "SssSSSSSYYYS",
    "SssssSSSYYYS",
    "SSSSSSSSYYYS",
    "SSSSSSSSSSSS",
    "SSgSSSSSSGSS",
    "SgggSSSSGGGS",
    "gggggSSGGGG_",
    "GggggggGG___",
    "GGGGggg_____",
    "GGGGG_______",
    "GGG_________",
]
assert len(INNER) == 12 and all(len(r) == 12 for r in INNER)
ROWS = ["O" * 16, "O" + "F" * 14 + "O"] + ["OF" + r + "FO" for r in INNER] + ["O" + "F" * 14 + "O", "O" * 16]
ROWS = ["".join(("C" if (x + y) % 2 else "c") if ch == "_" else ch for x, ch in enumerate(row)) for y, row in enumerate(ROWS)]

ROOT = Path(__file__).resolve().parent.parent / "public"


def svg() -> str:
    rects = []
    for y, row in enumerate(ROWS):
        x = 0
        while x < 16:  # merge horizontal runs of one color
            ch, start = row[x], x
            while x < 16 and row[x] == ch:
                x += 1
            rects.append(f'<rect x="{start}" y="{y}" width="{x - start}" height="1" fill="{COLORS[ch]}"/>')
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">\n'
        "  <title>Minecraft Canvases</title>\n  " + "\n  ".join(rects) + "\n</svg>\n"
    )


def png(scale: int, pad: int = 0) -> Image.Image:
    img = Image.new("RGB", (16, 16))
    for y, row in enumerate(ROWS):
        for x, ch in enumerate(row):
            img.putpixel((x, y), ImageColor.getrgb(COLORS[ch]))
    big = img.resize((16 * scale, 16 * scale), Image.NEAREST)
    if not pad:
        return big
    out = Image.new("RGB", (16 * scale + 2 * pad,) * 2, COLORS["O"])
    out.paste(big, (pad, pad))
    return out


if __name__ == "__main__":
    (ROOT / "favicon.svg").write_text(svg())
    png(2).save(ROOT / "favicon-32x32.png", optimize=True)
    png(11, pad=2).save(ROOT / "apple-touch-icon.png", optimize=True)  # 180x180
    png(12).save(ROOT / "icon-192.png", optimize=True)
    png(32).save(ROOT / "icon-512.png", optimize=True)
    print("wrote", ", ".join(p.name for p in sorted(ROOT.glob("*icon*"))))
