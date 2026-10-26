#!/usr/bin/env python3
"""Generate the PWA and home screen icons for Pixel Run.

Draws the ninja from the game on a 16x16 pixel grid (sky, platform)
and scales it up without smoothing. The motif stays inside the central
safe zone, so the same artwork also works as a maskable icon.
"""

import argparse
from pathlib import Path

from PIL import Image

GRID = 16
SKY_TOP = (0x87, 0xCE, 0xEB)
SKY_BOTTOM = (0xC0, 0xE0, 0xFF)
PLATFORM = (0x8B, 0x45, 0x13)
PLATFORM_TOP = (0x5A, 0x2E, 0x0C)
NINJA = (0x00, 0x00, 0x00)
BAND = (0xFF, 0x00, 0x00)
KATANA = (0xCC, 0xCC, 0xCC)

# Same shape as ninjaSkin.idle in index.html: K = body, R = red band.
NINJA_SPRITE = [
    ".KK.",
    "KKKK",
    "KRRK",
    "KK.K",
]

ICONS = {
    "icon-32.png": 32,
    "apple-touch-icon.png": 180,
    "icon-192.png": 192,
    "icon-512.png": 512,
    "icon-maskable-512.png": 512,
}


def draw_grid():
    grid = Image.new("RGB", (GRID, GRID))
    for y in range(GRID):
        t = y / (GRID - 1)
        color = tuple(round(a + (b - a) * t) for a, b in zip(SKY_TOP, SKY_BOTTOM))
        for x in range(GRID):
            grid.putpixel((x, y), color)

    # Platform: rows 12-15, dark top edge.
    for x in range(GRID):
        grid.putpixel((x, 12), PLATFORM_TOP)
        for y in range(13, GRID):
            grid.putpixel((x, y), PLATFORM)

    # Ninja: each sprite pixel is 2x2 grid cells, standing on the platform.
    left, top = 4, 4
    for row, line in enumerate(NINJA_SPRITE):
        for col, cell in enumerate(line):
            if cell == ".":
                continue
            color = BAND if cell == "R" else NINJA
            for dy in range(2):
                for dx in range(2):
                    grid.putpixel((left + col * 2 + dx, top + row * 2 + dy), color)

    # Katana held up from the right hand.
    for y in range(3, 8):
        grid.putpixel((11, y), KATANA)
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
