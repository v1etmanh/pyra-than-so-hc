import os
import sys
import subprocess
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# Paths
ROOT_DIR = Path(r"c:\Users\Admin\.gemini\antigravity\scratch\NumerologyWebApp")
SCREENSHOTS_DIR = ROOT_DIR / "screenshots"
SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if not os.path.exists(EDGE_PATH):
    EDGE_PATH = r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"

BASE_URL = os.environ.get("SCREENSHOT_BASE_URL", "http://127.0.0.1:3200")

def capture():
    pages = [
        {
            "name": "home_desktop.png",
            "url": f"{BASE_URL}/vi",
            "width": 1280,
            "height": 3300
        },
        {
            "name": "consultation_desktop.png",
            "url": f"{BASE_URL}/vi/assessment",
            "width": 1280,
            "height": 3100
        },
        {
            "name": "chat_desktop.png",
            "url": f"{BASE_URL}/vi/chat",
            "width": 1280,
            "height": 1000
        },
        {
            "name": "home_mobile.png",
            "url": f"{BASE_URL}/vi",
            "width": 390,
            "height": 3800
        },
        {
            "name": "consultation_mobile.png",
            "url": f"{BASE_URL}/vi/assessment",
            "width": 390,
            "height": 3600
        }
    ]

    print("==================================================")
    print("CAPTURING FULL-PAGE SCREENSHOTS")
    print("==================================================")

    for p in pages:
        out_file = SCREENSHOTS_DIR / p["name"]
        print(f"\nCapturing: {p['name']} ({p['width']}x{p['height']})...")
        
        cmd = [
            EDGE_PATH,
            "--headless",
            "--disable-gpu",
            f"--window-size={p['width']},{p['height']}",
            "--hide-scrollbars",
            f"--screenshot={str(out_file)}",
            p["url"]
        ]
        
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if out_file.exists() and out_file.stat().st_size > 1000:
            print(f"[OK] Saved: {out_file.name} ({out_file.stat().st_size // 1024} KB)")
        else:
            print(f"[FAIL] Failed: {out_file.name}")

    print("\n==================================================")
    print("SCREENSHOT CAPTURE COMPLETE!")
    print(f"Location: {SCREENSHOTS_DIR}")
    print("==================================================")

if __name__ == "__main__":
    capture()
