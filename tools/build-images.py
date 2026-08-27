# -*- coding: utf-8 -*-
"""
Tối ưu ảnh cho landing page Bông Dua Fleur.

- Đọc ảnh gốc từ SRC (không sửa, không đổi tên file gốc).
- Xuất WebP + JPEG fallback ở nhiều bề rộng để dùng với srcset/sizes.
- Tách nền đen của logo thành alpha để logo đặt được trên nền navy.
- Ghi assets/img/manifest.json chứa kích thước thật -> dùng để set width/height,
  tránh layout shift.

Chạy:  python tools/build-images.py
Yêu cầu: Pillow (pip install Pillow)
"""

import json
import os
import sys

from PIL import Image

sys.stdout.reconfigure(encoding="utf-8")

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.environ.get(
    "BONGDUA_SRC",
    os.path.join(os.path.dirname(os.path.dirname(ROOT)), "bông dua workshop đèn lồng"),
)
OUT = os.path.join(ROOT, "assets", "img")

# slug -> (tên file gốc, các bề rộng cần xuất[, tỉ lệ w/h muốn cắt sẵn])
# Phần tử thứ 3 là tỉ lệ khung mong muốn: script cắt giữa ảnh gốc về đúng tỉ lệ
# đó TRƯỚC khi thu nhỏ. Dùng khi cần một bản dọc riêng cho điện thoại, để trình
# duyệt không phải cắt một ảnh ngang rồi phóng to phần còn lại cho mờ.
# Cố ý chỉ giữ HAI bề rộng mỗi ảnh (một cho điện thoại, một cho desktop).
# Lý do rất thực tế: trang này chỉ phục vụ đúng một buổi workshop, và GitHub chỉ
# cho kéo-thả tối đa 100 file mỗi lần upload thủ công. Ít bề rộng hơn -> toàn bộ
# dự án gói gọn dưới 100 file, upload một lần là xong.
BIG = [720, 1440]
MED = [720, 1440]
SMALL = [400]

MAP = {
    # Hero art-direction: bản ngang cho desktop, bản dọc cho điện thoại.
    # Cả hai đều phải nhìn ra ngay "đây là workshop cắm hoa".
    # Banner chính thức do chủ dự án cung cấp.
    "hero-banner": ("banner.png", [720, 1440]),
    # Mã QR chuyển khoản (đã bao sẵn số tiền + nội dung). Ảnh gốc là poster dọc
    # 1014x2046 -> cắt bỏ phần trang trí trên/dưới, chỉ giữ logo ngân hàng, mã
    # QR, số tiền và tên chủ tài khoản. Nhờ vậy QR không chiếm hết modal.
    "payment-qr": ("mã qr.jpg", [760], None, (0.0, 0.055, 1.0, 0.735)),
    "act-cham-vao-hoa": ("779160486_122198970476487124_8282488215244586479_n.jpg", MED),
    "act-tao-den-trang": ("779268332_122198969552487124_3469800110434266284_n.jpg", MED),
    "act-luu-lai": ("777951600_122198970962487124_2157797057011359087_n.jpg", MED),
    "thanh-qua-den-hoa": ("885cfadb-37b4-4de4-9be8-dcdcb2e1d19a.png", BIG),
    "khu-check-in": ("105aff45-a166-45b4-9c5c-ca486ca7102a.png", BIG),
    "founder": ("779958422_122198969312487124_3738119797127503694_n.jpg", MED),
    "gallery-ca-nhom": ("779160485_122198969222487124_7168863135255070736_n.jpg", MED),
    "gallery-sen-can": ("778568574_122198970764487124_2706250235333780129_n.jpg", MED),
    "gallery-chan-dung-lan": ("780981722_122198971124487124_2238055407352429244_n.jpg", MED),
    "gallery-tieng-cuoi": ("779050263_122198970122487124_1794471678301698258_n.jpg", MED),
    "gallery-nang-sen": ("780748678_122198971118487124_8330215382664132764_n.jpg", MED),
    "gallery-khoanh-khac": ("779201235_122198971100487124_3459144902002867339_n.jpg", MED),
}

LOGO_SRC = "logo in tạp dề 2.png"


def resize(im, w):
    if im.width <= w:
        return im.copy()
    h = round(im.height * w / im.width)
    return im.resize((w, h), Image.LANCZOS)


def center_crop(im, ratio):
    """Cắt giữa ảnh về đúng tỉ lệ w/h, giữ tối đa pixel gốc."""
    w, h = im.size
    if w / h > ratio:
        nw = round(h * ratio)
        x = (w - nw) // 2
        return im.crop((x, 0, x + nw, h))
    nh = round(w / ratio)
    y = (h - nh) // 2
    return im.crop((0, y, w, y + nh))


def build_photo(slug, filename, widths, manifest, crop_ratio=None, crop_box=None):
    path = os.path.join(SRC, filename)
    if not os.path.exists(path):
        print("  !! thiếu ảnh gốc:", filename)
        return
    im = Image.open(path).convert("RGB")
    if crop_box:
        w, h = im.size
        l, t, r, b = crop_box
        im = im.crop((round(l * w), round(t * h), round(r * w), round(b * h)))
    if crop_ratio:
        im = center_crop(im, crop_ratio)
    widths = sorted({min(w, im.width) for w in widths})
    for w in widths:
        r = resize(im, w)
        r.save(os.path.join(OUT, f"{slug}-{w}.webp"), "WEBP", quality=80, method=6)
        r.save(
            os.path.join(OUT, f"{slug}-{w}.jpg"),
            "JPEG",
            quality=82,
            optimize=True,
            progressive=True,
        )
    manifest[slug] = {
        "widths": widths,
        "w": im.width,
        "h": im.height,
        "ratio": round(im.width / im.height, 4),
        "source": filename,
    }
    print(f"  {slug:24s} {im.width}x{im.height} -> {widths}")


def build_logo(manifest):
    """Logo gốc là art phát sáng trên nền đen. Dùng độ sáng làm alpha để đặt
    được trên nền navy mà không lộ khối đen vuông."""
    path = os.path.join(SRC, LOGO_SRC)
    if not os.path.exists(path):
        print("  !! thiếu logo:", LOGO_SRC)
        return
    im = Image.open(path).convert("RGB")
    px = im.load()
    out = Image.new("RGBA", im.size)
    op = out.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b = px[x, y]
            a = max(r, g, b)
            if a < 8:
                op[x, y] = (0, 0, 0, 0)
                continue
            # unpremultiply nhẹ để giữ độ bão hoà màu
            k = 255.0 / a
            op[x, y] = (
                min(255, int(r * k)),
                min(255, int(g * k)),
                min(255, int(b * k)),
                a,
            )
    for w in SMALL:
        r = out.resize((w, round(out.height * w / out.width)), Image.LANCZOS)
        r.save(os.path.join(OUT, f"logo-{w}.webp"), "WEBP", quality=90, method=6)
        r.save(os.path.join(OUT, f"logo-{w}.png"), "PNG", optimize=True)
    manifest["logo"] = {"widths": SMALL, "w": im.width, "h": im.height, "ratio": 1.0,
                        "source": LOGO_SRC}
    print(f"  {'logo':24s} {im.width}x{im.height} -> {SMALL} (nền đen -> alpha)")


def main():
    os.makedirs(OUT, exist_ok=True)
    print("Nguồn:", SRC)
    if not os.path.isdir(SRC):
        print("Không tìm thấy thư mục ảnh gốc. Đặt biến môi trường BONGDUA_SRC.")
        sys.exit(1)
    manifest = {}
    for slug, spec in MAP.items():
        filename, widths = spec[0], spec[1]
        crop_ratio = spec[2] if len(spec) > 2 else None
        crop_box = spec[3] if len(spec) > 3 else None
        build_photo(slug, filename, widths, manifest, crop_ratio, crop_box)
    build_logo(manifest)
    with open(os.path.join(OUT, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    total = sum(
        os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT)
    )
    print(f"Xong. {len(os.listdir(OUT))} file, tổng {total/1024/1024:.2f} MB")


if __name__ == "__main__":
    main()
