#!/usr/bin/env python3
from __future__ import annotations

import math
import os
import struct
import zlib


def _png_chunk(tag: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)


def write_png_rgba(path: str, width: int, height: int, pixels: bytes) -> None:
    if len(pixels) != width * height * 4:
        raise ValueError("pixels must be RGBA8888, width*height*4 bytes")

    signature = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)

    # Each scanline: filter byte + raw RGBA.
    raw = bytearray()
    stride = width * 4
    for y in range(height):
        raw.append(0)
        raw.extend(pixels[y * stride : (y + 1) * stride])

    compressed = zlib.compress(bytes(raw), level=9)
    png = signature + _png_chunk(b"IHDR", ihdr) + _png_chunk(b"IDAT", compressed) + _png_chunk(b"IEND", b"")

    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        f.write(png)


def clamp(v: float, lo: float, hi: float) -> float:
    return lo if v < lo else hi if v > hi else v


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def lerp_color(c1: tuple[int, int, int], c2: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return (
        int(round(lerp(c1[0], c2[0], t))),
        int(round(lerp(c1[1], c2[1], t))),
        int(round(lerp(c1[2], c2[2], t))),
    )


def set_px(buf: bytearray, w: int, x: int, y: int, r: int, g: int, b: int, a: int) -> None:
    i = (y * w + x) * 4
    buf[i + 0] = r
    buf[i + 1] = g
    buf[i + 2] = b
    buf[i + 3] = a


def draw_circle(buf: bytearray, w: int, h: int, cx: float, cy: float, radius: float, color: tuple[int, int, int, int]) -> None:
    r, g, b, a = color
    x0 = max(0, int(cx - radius - 1))
    x1 = min(w - 1, int(cx + radius + 1))
    y0 = max(0, int(cy - radius - 1))
    y1 = min(h - 1, int(cy + radius + 1))
    r2 = radius * radius
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            dx = (x + 0.5) - cx
            dy = (y + 0.5) - cy
            if dx * dx + dy * dy <= r2:
                set_px(buf, w, x, y, r, g, b, a)


def draw_rounded_rect(buf: bytearray, w: int, h: int, x: int, y: int, rw: int, rh: int, radius: int, color: tuple[int, int, int, int]) -> None:
    r, g, b, a = color
    for yy in range(y, y + rh):
        if yy < 0 or yy >= h:
            continue
        for xx in range(x, x + rw):
            if xx < 0 or xx >= w:
                continue
            # distance to nearest corner center
            cx = x + radius if xx < x + radius else (x + rw - 1 - radius if xx >= x + rw - radius else None)
            cy = y + radius if yy < y + radius else (y + rh - 1 - radius if yy >= y + rh - radius else None)
            if cx is None or cy is None:
                set_px(buf, w, xx, yy, r, g, b, a)
                continue
            dx = xx - cx
            dy = yy - cy
            if dx * dx + dy * dy <= radius * radius:
                set_px(buf, w, xx, yy, r, g, b, a)


def render_icon(size: int, round_mask: bool) -> bytes:
    w = h = size
    buf = bytearray(w * h * 4)

    top = (8, 16, 34)
    bottom = (19, 42, 74)
    cx = (w - 1) / 2
    cy = (h - 1) / 2

    # Background gradient + vignette.
    maxd = math.hypot(cx, cy)
    for y in range(h):
        t = y / (h - 1) if h > 1 else 0
        base = lerp_color(top, bottom, t)
        for x in range(w):
            d = math.hypot(x - cx, y - cy) / maxd
            v = 1.0 - clamp((d - 0.15) / 0.85, 0.0, 1.0) * 0.25
            r = int(base[0] * v)
            g = int(base[1] * v)
            b = int(base[2] * v)
            set_px(buf, w, x, y, r, g, b, 255)

    # Blue dial circle.
    dial_r = size * 0.34
    draw_circle(buf, w, h, cx, cy, dial_r * 1.12, (26, 56, 110, 255))
    draw_circle(buf, w, h, cx, cy, dial_r * 1.02, (47, 123, 255, 255))
    draw_circle(buf, w, h, cx, cy, dial_r * 0.88, (12, 18, 32, 255))

    # Dumbbell glyph.
    bar_w = int(size * 0.38)
    bar_h = max(2, int(size * 0.06))
    bar_x = int(cx - bar_w / 2)
    bar_y = int(cy - bar_h / 2)
    draw_rounded_rect(buf, w, h, bar_x, bar_y, bar_w, bar_h, radius=max(1, bar_h // 2), color=(235, 242, 255, 255))

    plate_w = max(2, int(size * 0.08))
    plate_h = int(size * 0.18)
    gap = max(2, int(size * 0.02))
    left_x = bar_x - plate_w - gap
    right_x = bar_x + bar_w + gap
    plate_y = int(cy - plate_h / 2)
    draw_rounded_rect(buf, w, h, left_x, plate_y, plate_w, plate_h, radius=max(2, plate_w // 2), color=(235, 242, 255, 255))
    draw_rounded_rect(buf, w, h, right_x, plate_y, plate_w, plate_h, radius=max(2, plate_w // 2), color=(235, 242, 255, 255))

    # Mask to circle for round icon variant.
    if round_mask:
        r = size * 0.5
        r2 = (r - 0.5) * (r - 0.5)
        for y in range(h):
            for x in range(w):
                dx = (x + 0.5) - cx
                dy = (y + 0.5) - cy
                if dx * dx + dy * dy > r2:
                    i = (y * w + x) * 4 + 3
                    buf[i] = 0

    return bytes(buf)


def main() -> None:
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    res_root = os.path.join(repo_root, "app", "src", "main", "res")

    densities = {
        "mipmap-mdpi": 48,
        "mipmap-hdpi": 72,
        "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144,
        "mipmap-xxxhdpi": 192,
    }

    for folder, size in densities.items():
        base_dir = os.path.join(res_root, folder)
        write_png_rgba(os.path.join(base_dir, "ic_launcher.png"), size, size, render_icon(size, round_mask=False))
        write_png_rgba(os.path.join(base_dir, "ic_launcher_round.png"), size, size, render_icon(size, round_mask=True))

    print("Generated launcher icons in:", res_root)


if __name__ == "__main__":
    main()

