"""Process Tarot UI assets into animated WebM/MP4 videos and WebP graphics.

This script extracts frames from sprite sheets in public/tarot/UI_item, trims labels,
and uses FFmpeg to generate transparent WebM videos, MP4 fallbacks, and animated WebP
for:
1. Candle flame looping animation
2. Crystal ball activation/reading animation
3. Card deck sparkle animation
4. 3 celestial card backs (Past, Present, Future)
5. Static crystal ball orb
6. Optimized background canvas
"""

import subprocess
import tempfile
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public" / "tarot" / "UI_item"
OUTPUT = ROOT / "public" / "tarot" / "ui"

def alpha_trim(image: Image.Image, padding: int = 4) -> Image.Image:
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

def create_video_from_frames(frames: list[Image.Image], output_prefix: str, fps: int = 6) -> None:
    # Ensure all frames have the same size (based on max bounding box or uniform size)
    max_w = max(f.width for f in frames)
    max_h = max(f.height for f in frames)
    
    # Make even dimensions for H.264
    if max_w % 2 != 0: max_w += 1
    if max_h % 2 != 0: max_h += 1

    standardized = []
    for f in frames:
        canvas = Image.new("RGBA", (max_w, max_h), (0, 0, 0, 0))
        offset_x = (max_w - f.width) // 2
        offset_y = (max_h - f.height) // 2
        canvas.paste(f, (offset_x, offset_y), f if f.mode == "RGBA" else None)
        standardized.append(canvas)

    with tempfile.TemporaryDirectory() as tmpdir:
        tmppath = Path(tmpdir)
        for i, frame in enumerate(standardized):
            frame.save(tmppath / f"frame_{i:03d}.png")

        # 1. Render Transparent WebM (VP9 with yuva420p)
        webm_out = OUTPUT / f"{output_prefix}.webm"
        cmd_webm = [
            "ffmpeg", "-y", "-framerate", str(fps),
            "-i", str(tmppath / "frame_%03d.png"),
            "-c:v", "libvpx-vp9",
            "-pix_fmt", "yuva420p",
            "-b:v", "1500k",
            "-auto-alt-ref", "0",
            str(webm_out)
        ]
        subprocess.run(cmd_webm, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print(f"Generated {webm_out.name}")

        # 2. Render MP4 (H.264 with black background)
        mp4_out = OUTPUT / f"{output_prefix}.mp4"
        cmd_mp4 = [
            "ffmpeg", "-y", "-framerate", str(fps),
            "-i", str(tmppath / "frame_%03d.png"),
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-b:v", "1500k",
            str(mp4_out)
        ]
        subprocess.run(cmd_mp4, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print(f"Generated {mp4_out.name}")

        # 3. Render Animated WebP (lossless, looping, universal alpha)
        webp_anim_out = OUTPUT / f"{output_prefix}-anim.webp"
        standardized[0].save(
            webp_anim_out,
            save_all=True,
            append_images=standardized[1:],
            duration=round(1000 / fps),
            loop=0,
            lossless=True
        )
        print(f"Generated {webp_anim_out.name}")

def process_candle() -> None:
    print("Processing candle animation...")
    with Image.open(SOURCE / "Six-Frame Magical Candle Animation Strip.png") as im:
        rgba = im.convert("RGBA")
        width, height = rgba.size
        cols = 6
        frame_w = width // cols
        # Crop bottom 115px to discard 'FRAME 1..6' labels
        usable_h = height - 115
        frames = []
        for c in range(cols):
            box = (c * frame_w, 0, (c + 1) * frame_w, usable_h)
            frame = rgba.crop(box)
            trimmed = alpha_trim(frame, padding=6)
            # Scale to high quality manageable UI size (~260x480)
            trimmed.thumbnail((280, 520), Image.Resampling.LANCZOS)
            frames.append(trimmed)
        
        create_video_from_frames(frames, "candle", fps=6)

def process_crystal_ball() -> None:
    print("Processing crystal ball...")
    # Static oracle orb
    with Image.open(SOURCE / "Cosmic Crystal Ball Oracle.png") as im:
        trimmed = alpha_trim(im, padding=8)
        trimmed.thumbnail((540, 540), Image.Resampling.LANCZOS)
        trimmed.save(OUTPUT / "oracle-orb.webp", "WEBP", lossless=True)
        print("Generated oracle-orb.webp")

    # Animated crystal ball frames (3 cols x 2 rows = 6 frames)
    with Image.open(SOURCE / "Magical Crystal Ball Animation Frames.png") as im:
        rgba = im.convert("RGBA")
        width, height = rgba.size
        cols, rows = 3, 2
        frame_w = width // cols
        frame_h = height // rows
        crop_bottom = 90  # remove 'FRAME X' text
        frames = []
        for r in range(rows):
            for c in range(cols):
                box = (c * frame_w, r * frame_h, (c + 1) * frame_w, (r + 1) * frame_h - crop_bottom)
                frame = rgba.crop(box)
                trimmed = alpha_trim(frame, padding=6)
                trimmed.thumbnail((480, 480), Image.Resampling.LANCZOS)
                frames.append(trimmed)

        create_video_from_frames(frames, "crystal-ball-reading", fps=5)

def process_deck() -> None:
    print("Processing card deck...")
    with Image.open(SOURCE / "ChatGPT Image Sep 10, 2026, 04_56_40 PM.png") as im:
        rgba = im.convert("RGBA")
        width, height = rgba.size
        cols, rows = 3, 2
        frame_w = width // cols
        frame_h = height // rows
        frames = []
        for r in range(rows):
            for c in range(cols):
                box = (c * frame_w, r * frame_h, (c + 1) * frame_w, (r + 1) * frame_h)
                frame = rgba.crop(box)
                trimmed = alpha_trim(frame, padding=8)
                trimmed.thumbnail((440, 440), Image.Resampling.LANCZOS)
                frames.append(trimmed)

        # Static deck is frame 0
        frames[0].save(OUTPUT / "deck-idle.webp", "WEBP", lossless=True)
        print("Generated deck-idle.webp")
        create_video_from_frames(frames, "deck-shimmer", fps=6)

def process_cards_and_bg() -> None:
    print("Processing 3 cards and background plate...")
    # Slicing Celestial Tarot Card Trio (3 cards: Past, Present, Future)
    with Image.open(SOURCE / "Celestial Tarot Card Trio.png") as im:
        rgba = im.convert("RGBA")
        width, height = rgba.size
        card_w = width // 3
        card_names = ["card-back-past.webp", "card-back-present.webp", "card-back-future.webp"]
        for i, name in enumerate(card_names):
            box = (i * card_w, 0, (i + 1) * card_w, height)
            card = rgba.crop(box)
            trimmed = alpha_trim(card, padding=4)
            trimmed.thumbnail((360, 520), Image.Resampling.LANCZOS)
            trimmed.save(OUTPUT / name, "WEBP", lossless=True)
            print(f"Generated {name}")

    # Optimize Altar background
    with Image.open(SOURCE / "Mystical Cosmic Tarot Reading Interface.png") as im:
        im.save(OUTPUT / "altar-stage-bg.webp", "WEBP", quality=92, method=6)
        print("Generated altar-stage-bg.webp")

def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    process_candle()
    process_crystal_ball()
    process_deck()
    process_cards_and_bg()
    print("All Tarot media assets successfully processed!")

if __name__ == "__main__":
    main()
