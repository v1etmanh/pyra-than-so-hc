# -*- coding: utf-8 -*-
"""
Generate a luxury celestial portal artwork for the Login screen.
"""
import sys
from pathlib import Path

skill_path = Path(r"C:\Users\Admin\.gemini\config\skills\free_image_gen\scripts")
sys.path.insert(0, str(skill_path))

try:
    from generate_images import generate_single_image
except ImportError as e:
    print(f"Error importing free_image_gen: {e}")
    sys.exit(1)

root_dir = Path(__file__).resolve().parent.parent
out_dir = root_dir / "public" / "images" / "auth"
out_dir.mkdir(parents=True, exist_ok=True)
target = out_dir / "login_celestial_portal.png"

prompt = (
    "Abstract ethereal artwork of a celestial sacred portal, glowing rose quartz and champagne gold crystal ring floating in a deep midnight plum obsidian cosmos, delicate stardust nebula, soft luminous aura, quiet luxury spiritual healing, minimalist masterpiece, 8k resolution, no humans, no text"
)

print(f"Generating Login Artwork -> {target.name}...")
generate_single_image(prompt, target, model="magic")
print("Done: Generated login artwork in", target)
