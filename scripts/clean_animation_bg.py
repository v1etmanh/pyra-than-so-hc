#!/usr/bin/env python3
"""
clean_animation_bg.py
---------------------
Professional background cleaner & matting processor for animation frame sequences.
"""

import os
import sys
import glob
import time
import argparse
import subprocess
from concurrent.futures import ThreadPoolExecutor
from PIL import Image
import numpy as np
from tqdm import tqdm

def clean_frame(input_path, output_path, t_low=16.0, t_high=55.0, despill_factor=0.8, border_sample_size=6):
    try:
        with Image.open(input_path) as img:
            img = img.convert('RGBA')
            arr = np.array(img).astype(np.float32)
            
        h, w, _ = arr.shape
        b_sz = min(border_sample_size, h // 4, w // 4)
        
        # 1. Sample background color from 4 borders
        top = arr[0:b_sz, :, :3].reshape(-1, 3)
        bottom = arr[-b_sz:, :, :3].reshape(-1, 3)
        left = arr[:, 0:b_sz, :3].reshape(-1, 3)
        right = arr[:, -b_sz:, :3].reshape(-1, 3)
        borders = np.concatenate([top, bottom, left, right], axis=0)
        bg_color = np.median(borders, axis=0)
        
        rgb = arr[:, :, :3]
        orig_alpha = arr[:, :, 3] / 255.0
        
        # 2. Euclidean color distance from background
        dist = np.linalg.norm(rgb - bg_color, axis=2)
        
        # 3. Luminance difference
        lum = 0.299 * rgb[:, :, 0] + 0.587 * rgb[:, :, 1] + 0.114 * rgb[:, :, 2]
        bg_lum = 0.299 * bg_color[0] + 0.587 * bg_color[1] + 0.114 * bg_color[2]
        lum_diff = np.maximum(0.0, lum - bg_lum)
        
        # 4. Smoothstep alpha mask based on color distance & luminance
        mask_dist = np.clip((dist - t_low) / max(t_high - t_low, 1e-5), 0.0, 1.0)
        mask_dist = mask_dist * mask_dist * (3.0 - 2.0 * mask_dist)  # Hermite smoothstep
        
        mask_lum = np.clip(lum_diff / 22.0, 0.0, 1.0)
        
        combined_mask = mask_dist * mask_lum
        final_alpha = np.clip(orig_alpha * combined_mask, 0.0, 1.0)
        
        # 5. Color Decontamination / Despill
        clean_rgb = np.zeros_like(rgb)
        for c in range(3):
            sub = bg_color[c] * (1.0 - final_alpha) * despill_factor
            clean_rgb[:, :, c] = np.clip(rgb[:, :, c] - sub, 0.0, 255.0)
            
        out_arr = np.dstack([clean_rgb, final_alpha * 255.0]).astype(np.uint8)
        out_img = Image.fromarray(out_arr, 'RGBA')
        
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        out_img.save(output_path, 'PNG', optimize=True)
        return True, input_path
    except Exception as e:
        return False, f"{input_path}: {e}"

def export_video(input_dir, output_video, fps=30):
    print(f"\n[FFmpeg] Rendering transparent WebM video to: {output_video} @ {fps} FPS...")
    pattern = os.path.join(input_dir, "%04d.png")
    
    cmd = [
        "ffmpeg", "-y",
        "-framerate", str(fps),
        "-i", pattern,
        "-c:v", "libvpx-vp9",
        "-pix_fmt", "yuva420p",
        "-b:v", "2M",
        "-auto-alt-ref", "0",
        output_video
    ]
    
    try:
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if res.returncode == 0:
            print(f"[FFmpeg] Successfully generated: {output_video} ({os.path.getsize(output_video) / 1024:.1f} KB)")
            return True
        else:
            print(f"[FFmpeg Warning] {res.stderr[-400:]}")
            return False
    except Exception as err:
        print(f"[FFmpeg Error] {err}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Clean background residue from animation PNG sequence.")
    parser.add_argument("--input-dir", default=r"public\animation\start", help="Input directory containing PNG frames.")
    parser.add_argument("--output-dir", default=r"public\animation\start_clean", help="Output directory for cleaned frames.")
    parser.add_argument("--inplace", action="store_true", help="Replace original files directly (creates backup first).")
    parser.add_argument("--t-low", type=float, default=16.0, help="Lower threshold for background color distance.")
    parser.add_argument("--t-high", type=float, default=55.0, help="Upper threshold for full opacity color distance.")
    parser.add_argument("--despill", type=float, default=0.8, help="Edge color de-contamination factor (0.0 - 1.0).")
    parser.add_argument("--threads", type=int, default=8, help="Number of concurrent worker threads.")
    parser.add_argument("--video", action="store_true", help="Also generate transparent WebM video using FFmpeg.")
    parser.add_argument("--fps", type=int, default=30, help="FPS for generated video.")
    
    args = parser.parse_args()
    
    input_pattern = os.path.join(args.input_dir, "*.png")
    files = sorted(glob.glob(input_pattern))
    
    if not files:
        print(f"[Error] No PNG files found in: {args.input_dir}")
        sys.exit(1)
        
    print(f"============================================================")
    print(f" Animation Background Cleaner & Matting Engine")
    print(f" Found: {len(files)} frames in '{args.input_dir}'")
    print(f" Thresholds: low={args.t_low}, high={args.t_high}, despill={args.despill}")
    print(f" Threads: {args.threads}")
    print(f"============================================================")
    
    out_dir = args.output_dir
    if args.inplace:
        backup_dir = args.input_dir + "_backup"
        if not os.path.exists(backup_dir):
            print(f"[Backup] Creating backup of original frames to '{backup_dir}'...")
            import shutil
            shutil.copytree(args.input_dir, backup_dir)
        out_dir = args.input_dir
        
    os.makedirs(out_dir, exist_ok=True)
    
    start_time = time.time()
    
    tasks = []
    with ThreadPoolExecutor(max_workers=args.threads) as executor:
        for f in files:
            fname = os.path.basename(f)
            dest = os.path.join(out_dir, fname)
            tasks.append(executor.submit(clean_frame, f, dest, args.t_low, args.t_high, args.despill))
            
        success_count = 0
        for task in tqdm(tasks, desc="Cleaning frames", unit="frame"):
            ok, msg = task.result()
            if ok:
                success_count += 1
            else:
                print(f"\n[Error] {msg}")
                
    elapsed = time.time() - start_time
    print(f"\n[Done] Cleaned {success_count}/{len(files)} frames in {elapsed:.2f}s ({len(files)/elapsed:.1f} fps).")
    print(f"Output saved to: {out_dir}")
    
    if args.video:
        video_path = os.path.join(os.path.dirname(out_dir), "start.webm")
        export_video(out_dir, video_path, fps=args.fps)

if __name__ == "__main__":
    main()
