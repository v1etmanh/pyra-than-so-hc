# -*- coding: utf-8 -*-
"""
Batch Runner utilizing the free_image_gen skill engine for 205 Numerology images.
"""
import os
import sys
import json
import time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

# Import generator from the free_image_gen skill
skill_path = Path(r"C:\Users\Admin\.gemini\config\skills\free_image_gen\scripts")
sys.path.insert(0, str(skill_path))

try:
    from generate_images import generate_single_image
except ImportError as e:
    print(f"Error importing free_image_gen skill: {e}")
    sys.exit(1)

root_dir = Path(__file__).resolve().parent.parent
data_file = root_dir / "data" / "art_prompts_200.json"
public_dir = root_dir / "public"

with open(data_file, "r", encoding="utf-8") as f:
    prompts = json.load(f)

total = len(prompts)
print(f"============================================================")
print(f"🚀 GENERATING {total} NUMEROLOGY ARTWORKS VIA FREE_IMAGE_GEN")
print(f"============================================================")

def process_item(item, idx):
    rel_path = item.get("relative_path", f"images/numerology/{item['category']}/{item['filename']}")
    # Replace .webp or .jpg with .png for high quality lossless art
    out_path = public_dir / rel_path
    if str(out_path).endswith('.webp') or str(out_path).endswith('.jpg'):
        out_path = out_path.with_suffix('.png')
    
    out_path.parent.mkdir(parents=True, exist_ok=True)

    if out_path.exists() and out_path.stat().st_size > 5000:
        return f"⏩ [{idx}/{total}] Exists: {item['title']} -> {out_path.name}"

    success = generate_single_image(
        prompt=item["prompt"],
        output_path=out_path,
        model="magic",
        max_retries=3,
        delay_between_retries=2.0
    )
    if success:
        return f"✅ [{idx}/{total}] Done: {item['title']} -> {out_path.name} ({out_path.stat().st_size // 1024} KB)"
    else:
        return f"❌ [{idx}/{total}] Failed: {item['title']}"

max_workers = 4
completed = 0
start_time = time.time()

with ThreadPoolExecutor(max_workers=max_workers) as executor:
    futures = {executor.submit(process_item, item, i + 1): item for i, item in enumerate(prompts)}
    for future in as_completed(futures):
        res = future.result()
        completed += 1
        print(res, flush=True)

elapsed = round(time.time() - start_time, 1)
print(f"\n============================================================")
print(f"🎉 BATCH COMPLETE: {completed}/{total} processed in {elapsed}s")
print(f"All images saved to: {public_dir / 'images' / 'numerology'}")
print(f"============================================================")
