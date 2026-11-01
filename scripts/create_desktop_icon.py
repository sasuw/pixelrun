#!/usr/bin/env python3
"""Convert the generated Pixel Run PNG into a Windows desktop icon."""

import argparse
import struct
from io import BytesIO
from pathlib import Path

from PIL import Image


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    args = parser.parse_args()

    image = Image.open(args.source).convert("RGBA")
    sizes = (16, 24, 32, 48, 64, 96, 128, 256)
    images = []
    for size in sizes:
        output = BytesIO()
        image.resize((size, size), Image.Resampling.NEAREST).save(output, format="PNG")
        images.append(output.getvalue())

    offset = 6 + 16 * len(images)
    entries = []
    for size, data in zip(sizes, images):
        entries.append(struct.pack("<BBBBHHII", size % 256, size % 256, 0, 0, 1, 32, len(data), offset))
        offset += len(data)

    args.destination.write_bytes(struct.pack("<HHH", 0, 1, len(images)) + b"".join(entries + images))


if __name__ == "__main__":
    main()
