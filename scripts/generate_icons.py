#!/usr/bin/env python3
"""Generate the PWA and home screen icons for Pixel Run.

Draws the ninja from the game on a 16x16 pixel grid (sky, platform)
and scales it up without smoothing. The motif stays inside the central
safe zone, so the same artwork also works as a maskable icon.
"""

import argparse
import base64
import re
from io import BytesIO
from pathlib import Path

from PIL import Image

GRID = 64
SKY_TOP = (0x87, 0xCE, 0xEB)
SKY_BOTTOM = (0xC0, 0xE0, 0xFF)
NINJA = (0x00, 0x00, 0x00)
BAND = (0x00, 0xC8, 0x53)
KATANA = (0xCC, 0xCC, 0xCC)

# Same shape and colors as ninjaSkin.idle in index.html: K = body, G = green band.
NINJA_SPRITE = [
    ".KK.",
    "KKKK",
    "KGGK",
    "KK.K",
]

ICONS = {
    "icon-32.png": 32,
    "apple-touch-icon.png": 180,
    "icon-192.png": 192,
    "icon-512.png": 512,
    "icon-maskable-512.png": 512,
}


def load_platform_texture():
    html_path = Path(__file__).resolve().parent.parent / "index.html"
    html = html_path.read_text(encoding="utf-8")
    match = re.search(r'platformTexture\.src = "data:image/png;base64,([^"]+)"', html)
    if not match:
        raise ValueError("Could not find the game's platform texture in index.html")
    image_data = base64.b64decode(match.group(1))
    return Image.open(BytesIO(image_data)).convert("RGB")


def draw_grid():
    grid = Image.new("RGB", (GRID, GRID))
    for y in range(GRID):
        t = y / (GRID - 1)
        color = tuple(round(a + (b - a) * t) for a, b in zip(SKY_TOP, SKY_BOTTOM))
        for x in range(GRID):
            grid.putpixel((x, y), color)

    # Match the game's platform draw size so the texture details remain visible.
    platform = load_platform_texture().resize((GRID, 16), Image.NEAREST)
    grid.paste(platform, (0, 48))

    # Ninja: each sprite pixel is 8x8 grid cells, standing on the platform.
    left, top = 16, 16
    for row, line in enumerate(NINJA_SPRITE):
        for col, cell in enumerate(line):
            if cell == ".":
                continue
            color = BAND if cell == "G" else NINJA
            for dy in range(8):
                for dx in range(8):
                    grid.putpixel((left + col * 8 + dx, top + row * 8 + dy), color)

    # Katana held up from the right hand.
    for y in range(12, 32):
        for dx in range(2):
            grid.putpixel((44 + dx, y), KATANA)
    return grid


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=Path(__file__).resolve().parent.parent / "icons",
        help="directory for the PNG files (default: icons/ in the repository)",
    )
    parser.add_argument("-n", "--dry-run", action="store_true", help="list the files without writing them")
    args = parser.parse_args()

    grid = draw_grid()
    for name, size in ICONS.items():
        path = args.out_dir / name
        if args.dry_run:
            print(f"would write {path} ({size}x{size})")
            continue
        args.out_dir.mkdir(parents=True, exist_ok=True)
        grid.resize((size, size), Image.NEAREST).save(path, optimize=True)
        print(f"wrote {path} ({size}x{size})")


if __name__ == "__main__":
    main()
