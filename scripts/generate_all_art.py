# -*- coding: utf-8 -*-
import json
import os
import urllib.request
import urllib.parse
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

root_dir = os.path.abspath(os.getcwd())
data_file = os.path.join(root_dir, 'data', 'art_prompts_200.json')
public_dir = os.path.join(root_dir, 'public')

with open(data_file, 'r', encoding='utf-8') as f:
    prompts = json.load(f)

print(f"Loaded {len(prompts)} prompts to generate.")

def download_image(item, index, total):
    rel_path = item["relative_path"]
    target_file = os.path.join(public_dir, rel_path)
    os.makedirs(os.path.dirname(target_file), exist_ok=True)

    if os.path.exists(target_file) and os.path.getsize(target_file) > 10000:
        return f"[{index}/{total}] SKIPPED (Already exists): {item['title']}"

    prompt_text = item["prompt"]
    encoded = urllib.parse.quote(prompt_text)
    seed = abs(hash(item["id"])) % 100000
    url = f"https://image.pollinations.ai/prompt/{encoded}?width=768&height=768&model=flux&nologo=true&seed={seed}"

    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=60) as response, open(target_file, 'wb') as out_file:
                data = response.read()
                out_file.write(data)
            size_kb = os.path.getsize(target_file) // 1024
            return f"[{index}/{total}] SUCCESS ({size_kb} KB): {item['title']} -> {item['filename']}"
        except Exception as e:
            if attempt < 2:
                time.sleep(2 * (attempt + 1))
            else:
                return f"[{index}/{total}] FAILED: {item['title']} - Error: {e}"

max_workers = 6
print(f"Starting parallel generation with {max_workers} threads...")

completed_count = 0
with ThreadPoolExecutor(max_workers=max_workers) as executor:
    futures = [executor.submit(download_image, item, i + 1, len(prompts)) for i, item in enumerate(prompts)]
    for future in as_completed(futures):
        result = future.result()
        completed_count += 1
        print(result)

print(f"\n==========================================")
print(f"ALL DONE: Processed {completed_count}/{len(prompts)} images!")
print(f"Images are stored in: {os.path.join(public_dir, 'images', 'numerology')}")
