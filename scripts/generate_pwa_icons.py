import zlib
import struct
import math
import os

def make_png(width, height, draw_fn):
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # Filter type 0 (None)
        for x in range(width):
            r, g, b, a = draw_fn(x, y, width, height)
            raw_data.extend([r, g, b, a])
    
    compressed = zlib.compress(bytes(raw_data), 9)
    
    def chunk(tag, data):
        c = tag + data
        crc = zlib.crc32(c) & 0xffffffff
        return struct.pack('>I', len(data)) + c + struct.pack('>I', crc)
    
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    png_bytes = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', compressed) + chunk(b'IEND', b'')
    return png_bytes

def point_in_poly(x, y, poly):
    n = len(poly)
    inside = False
    p1x, p1y = poly[0]
    for i in range(1, n + 1):
        p2x, p2y = poly[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside

# Polygons in 340x240 normalized space
POLYS = [
    # 1. M Left-most slanted bar (Royal Blue)
    ([(38, 100), (84, 100), (48, 185), (2, 185)], (0, 76, 216)),
    # 2. M Left internal shadow fold (Dark Navy)
    ([(84, 100), (114, 100), (78, 185), (48, 185)], (0, 31, 112)),
    # 3. M Middle upward stroke (Vibrant Blue)
    ([(114, 100), (162, 15), (132, 15), (78, 185)], (0, 102, 255)),
    # 4. M to P downward shadow fold (Navy Shadow)
    ([(162, 15), (186, 15), (142, 185), (116, 185)], (0, 43, 138)),
    # 5. P Main upright ribbon stem (Electric Cyan/Blue)
    ([(186, 15), (234, 15), (166, 185), (142, 185)], (0, 136, 255)),
    # 6. P Top horizontal bar (Bright Azure)
    ([(224, 15), (316, 15), (292, 72), (200, 72)], (0, 153, 255)),
    # 7. P Right slanted curve/edge
    ([(316, 15), (316, 28), (274, 124), (232, 124), (292, 72)], (26, 163, 255)),
    # 8. P Bottom return loop
    ([(274, 124), (200, 124), (216, 72), (258, 72)], (0, 136, 255)),
]

def draw_mp_icon(x, y, w, h, bg_color=(9, 9, 11, 255), is_maskable=False):
    scale = (0.55 if is_maskable else 0.72) * min(w, h) / 240.0
    target_cx = w / 2.0
    target_cy = h / 2.0
    src_cx = 160.0
    src_cy = 100.0
    
    sx = (x - target_cx) / scale + src_cx
    sy = (y - target_cy) / scale + src_cy
    
    for poly, color in reversed(POLYS):
        if point_in_poly(sx, sy, poly):
            return color[0], color[1], color[2], 255
    
    return bg_color

os.makedirs('public', exist_ok=True)

# Generate App Icons
with open('public/pwa-192x192.png', 'wb') as f:
    f.write(make_png(192, 192, lambda x, y, w, h: draw_mp_icon(x, y, w, h, (9, 9, 11, 255), False)))

with open('public/pwa-512x512.png', 'wb') as f:
    f.write(make_png(512, 512, lambda x, y, w, h: draw_mp_icon(x, y, w, h, (9, 9, 11, 255), False)))

with open('public/pwa-maskable-512x512.png', 'wb') as f:
    f.write(make_png(512, 512, lambda x, y, w, h: draw_mp_icon(x, y, w, h, (9, 9, 11, 255), True)))

with open('public/apple-touch-icon.png', 'wb') as f:
    f.write(make_png(180, 180, lambda x, y, w, h: draw_mp_icon(x, y, w, h, (9, 9, 11, 255), False)))

# Also generate clean white-background logo.png matching the user's uploaded LOgo.jpg
with open('public/logo.png', 'wb') as f:
    f.write(make_png(256, 256, lambda x, y, w, h: draw_mp_icon(x, y, w, h, (255, 255, 255, 255), False)))

print("PWA & Brand Logo PNGs generated successfully!")
