# -*- coding: utf-8 -*-
"""
Generate 5 high-end trait artworks for Big 5 Personality Assessment using free_image_gen skill.
"""
import os
import sys
from pathlib import Path

skill_path = Path(r"C:\Users\Admin\.gemini\config\skills\free_image_gen\scripts")
sys.path.insert(0, str(skill_path))

try:
    from generate_images import generate_single_image
except ImportError as e:
    print(f"Error importing free_image_gen skill: {e}")
    sys.exit(1)

root_dir = Path(__file__).resolve().parent.parent
out_dir = root_dir / "public" / "images" / "personality"
out_dir.mkdir(parents=True, exist_ok=True)

traits = [
    {
        "id": "extraversion",
        "title": "Hướng Ngoại (Extraversion)",
        "prompt": "Abstract ethereal artwork of Extraversion, a radiant golden sunburst expanding outward into vibrant social cosmic constellations, sparkling stardust, warm amber aura, dynamic energy, dreamy surrealism, 8k resolution, minimalist masterpiece, no humans, no text",
        "file": "trait_extraversion.png"
    },
    {
        "id": "agreeableness",
        "title": "Dễ Chịu & Hợp Tác (Agreeableness)",
        "prompt": "Abstract ethereal artwork of Agreeableness and Empathy, gentle glowing rose-quartz and pearl light intertwining in serene harmony, soft pink nebula, soothing ripples of compassion, dreamy surrealism, 8k, no humans, no text",
        "file": "trait_agreeableness.png"
    },
    {
        "id": "conscientiousness",
        "title": "Tận Tâm & Kỷ Luật (Conscientiousness)",
        "prompt": "Abstract ethereal artwork of Conscientiousness and Focus, a precision crystalline geometric structure of sapphire and emerald order, architectural symmetry, steady golden laser lines, enduring stability, 8k, no humans, no text",
        "file": "trait_conscientiousness.png"
    },
    {
        "id": "negative_emotionality",
        "title": "Nhạy Cảm Cảm Xúc (Emotional Sensitivity)",
        "prompt": "Abstract ethereal artwork of Emotional Depth and Sensitivity, a deep amethyst purple ocean mirror with a tranquil surface reflecting serene moonlight and gentle ripples of inner reflection, 8k, no humans, no text",
        "file": "trait_emotionality.png"
    },
    {
        "id": "open_mindedness",
        "title": "Cởi Mở & Sáng Tạo (Open-Mindedness)",
        "prompt": "Abstract ethereal artwork of Open-Mindedness and Imagination, a cosmic prism blooming into a multi-dimensional fractal kaleidoscope of turquoise and gold creativity, expanding universe, 8k, no humans, no text",
        "file": "trait_openness.png"
    }
]

print("Generating 5 Trait Artworks...")
for t in traits:
    target = out_dir / t["file"]
    print(f"\nGenerating {t['title']} -> {target.name}...")
    generate_single_image(t["prompt"], target, model="magic")

print("\nDONE: All 5 personality trait images generated in:", out_dir)
