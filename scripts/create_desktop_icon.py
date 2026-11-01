#!/usr/bin/env python3
"""Convert the generated Pixel Run PNG into a Windows desktop icon."""

import argparse
from pathlib import Path

from PIL import Image


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    args = parser.parse_args()

    image = Image.open(args.source).convert("RGBA")
    image.save(
        args.destination,
        format="ICO",
        sizes=[(size, size) for size in (16, 24, 32, 48, 64, 96, 128, 256)],
    )


if __name__ == "__main__":
    main()
