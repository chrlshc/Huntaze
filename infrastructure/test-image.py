#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFont
import sys

# Create test images
def create_test_image(filename, text, color):
    img = Image.new('RGB', (800, 600), color=color)
    draw = ImageDraw.Draw(img)
    
    # Try to use a font, fallback to default if not available
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 60)
    except:
        font = ImageFont.load_default()
    
    # Center the text
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (800 - text_width) // 2
    y = (600 - text_height) // 2
    
    draw.text((x, y), text, fill='white', font=font)
    img.save(filename)
    print(f"Created {filename}")

# Create different test images
create_test_image('/tmp/safe-content.jpg', 'Safe Content', 'blue')
create_test_image('/tmp/suggestive-content.jpg', 'Beach Photo', 'orange')
print("Test images created!")