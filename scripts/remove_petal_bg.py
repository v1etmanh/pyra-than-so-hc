import os
from PIL import Image, ImageFilter

def make_transparent_petal(input_path, output_path, threshold=15, soft_range=45):
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()
    
    new_data = []
    for item in datas:
        r, g, b, a = item
        # Max channel brightness
        brightness = max(r, g, b)
        
        if brightness <= threshold:
            # Completely transparent
            new_data.append((r, g, b, 0))
        elif brightness < threshold + soft_range:
            # Smooth feathered edge transition
            alpha = int(((brightness - threshold) / soft_range) * 255)
            new_data.append((r, g, b, alpha))
        else:
            # Full petal opacity
            new_data.append((r, g, b, 255))
            
    img.putdata(new_data)
    
    # Save as pure transparent PNG
    img.save(output_path, "PNG")
    print(f"Created transparent PNG: {output_path}")

if __name__ == "__main__":
    base_dir = r"c:\Users\Admin\.gemini\antigravity\scratch\NumerologyWebApp\public\images"
    
    sakura_in = os.path.join(base_dir, "petal-sakura.jpg")
    sakura_out = os.path.join(base_dir, "petal-sakura.png")
    
    lotus_in = os.path.join(base_dir, "petal-lotus.jpg")
    lotus_out = os.path.join(base_dir, "petal-lotus.png")
    
    make_transparent_petal(sakura_in, sakura_out, threshold=12, soft_range=35)
    make_transparent_petal(lotus_in, lotus_out, threshold=12, soft_range=35)
