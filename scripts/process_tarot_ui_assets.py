"""Prepare the supplied Numina Tarot concept art for responsive UI use.

The source sheets remain untouched. Runtime assets are cropped, alpha-trimmed,
resized, and saved as lossless WebP files under public/tarot/ui.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public" / "tarot" / "UI_item"
OUTPUT = ROOT / "public" / "tarot" / "ui"


def alpha_trim(image: Image.Image, padding: int = 6) -> Image.Image:
    rgba = image.convert("RGBA")
    alpha = rgba.getchannel("A")
    bbox = alpha.getbbox()
    if bbox is None:
        return rgba
    left, top, right, bottom = bbox
    return rgba.crop(
        (
            max(0, left - padding),
            max(0, top - padding),
            min(rgba.width, right + padding),
            min(rgba.height, bottom + padding),
        )
    )


def fit(image: Image.Image, max_width: int, max_height: int) -> Image.Image:
    result = image.copy()
    result.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
    return result


def save(image: Image.Image, name: str, max_width: int, max_height: int) -> None:
    prepared = fit(alpha_trim(image), max_width, max_height)
    prepared.save(OUTPUT / name, "WEBP", lossless=True, method=6)


def split_grid(
    filename: str,
    prefix: str,
    columns: int,
    rows: int,
    *,
    crop_bottom: int = 0,
    max_width: int,
    max_height: int,
) -> None:
    with Image.open(SOURCE / filename) as source:
        rgba = source.convert("RGBA")
        for row in range(rows):
            for column in range(columns):
                left = round(column * rgba.width / columns)
                right = round((column + 1) * rgba.width / columns)
                top = round(row * rgba.height / rows)
                bottom = round((row + 1) * rgba.height / rows) - crop_bottom
                frame = rgba.crop((left, top, right, bottom))
                index = row * columns + column + 1
                save(frame, f"{prefix}-{index}.webp", max_width, max_height)


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)

    with Image.open(SOURCE / "Cosmic Crystal Ball Oracle.png") as image:
        save(image, "oracle-orb.webp", 720, 720)

    split_grid(
        "Magical Crystal Ball Animation Frames.png",
        "orb-frame",
        3,
        2,
        crop_bottom=100,
        max_width=420,
        max_height=420,
    )
    split_grid(
        "Six-Frame Magical Candle Animation Strip.png",
        "candle-frame",
        6,
        1,
        crop_bottom=126,
        max_width=240,
        max_height=430,
    )
    split_grid(
        "ChatGPT Image Sep 10, 2026, 04_56_40 PM.png",
        "deck-frame",
        3,
        2,
        max_width=420,
        max_height=420,
    )
    split_grid(
        "Celestial Tarot Card Trio.png",
        "card-back",
        3,
        1,
        max_width=360,
        max_height=520,
    )


if __name__ == "__main__":
    main()
