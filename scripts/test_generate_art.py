# -*- coding: utf-8 -*-
import urllib.request
import urllib.parse
import os
import time

test_dir = os.path.abspath(os.path.join(os.getcwd(), 'public', 'images', 'numerology', 'lifepath'))
os.makedirs(test_dir, exist_ok=True)

prompt = "Abstract mystical concept of Life Path Number 1: A single radiant golden pillar of light cutting through a dark cosmic expanse, initiating a new cosmic pathway of leadership and independence, dreamy ethereal surrealism, abstract cosmic atmosphere, deep indigo and mystic obsidian ambient background, soft glowing light, floating stardust bokeh, sacred geometry accents, soft nebula mist, fine art aesthetic, minimalist, evocative, masterpiece, no humans, no text, 8k resolution"

encoded = urllib.parse.quote(prompt)
url = f"https://image.pollinations.ai/prompt/{encoded}?width=768&height=768&model=flux&nologo=true&seed=42"

target_file = os.path.join(test_dir, "lifepath_1.jpg")
print(f"Testing generation to: {target_file}")
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req, timeout=45) as response, open(target_file, 'wb') as out_file:
        data = response.read()
        out_file.write(data)
    print(f"SUCCESS: Generated {target_file}, size: {os.path.getsize(target_file)} bytes")
except Exception as e:
    print(f"ERROR: {e}")
