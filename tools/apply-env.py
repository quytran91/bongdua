# -*- coding: utf-8 -*-
"""
Đọc file .env rồi ghi các giá trị vào assets/js/config.js.

Chạy:  python tools/apply-env.py            (đọc .env cạnh file này/ở gốc repo)
       python tools/apply-env.py --check    (chỉ kiểm tra, không ghi)

Script chỉ thay phần giá trị của đúng những dòng nó nhận ra, giữ nguyên toàn
bộ comment và cấu trúc còn lại của config.js.
"""

import io
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CONFIG = os.path.join(ROOT, "assets", "js", "config.js")
ENV = os.path.join(ROOT, ".env")

sys.stdout.reconfigure(encoding="utf-8")


def read_env(path):
    data = {}
    if not os.path.exists(path):
        return None
    with io.open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            data[k.strip()] = v.strip()
    return data


def js_str(v):
    return "'" + str(v).replace("\\", "\\\\").replace("'", "\\'") + "'"


def js_list(v):
    parts = [p.strip() for p in str(v).split(",") if p.strip()]
    return "[" + ", ".join(js_str(p) for p in parts) + "]"


# key trong config.js  ->  (tên biến .env, cách chuyển đổi)
STRINGS = [
    ("dateISO", "EVENT_DATE_ISO"),
    ("dateLabel", "EVENT_DATE_LABEL"),
    ("timeLabel", "WORKSHOP_TIME"),
    ("cafeName", "CAFE_NAME"),
    ("cafeAddress", "CAFE_ADDRESS"),
    ("cafeNote", "CAFE_NOTE"),
    ("cafeMapUrl", "CAFE_MAP_URL"),
    ("founderName", "FOUNDER_NAME"),
    ("bankName", "BANK_NAME"),
    ("bankBin", "BANK_BIN"),
    ("accountNumber", "BANK_ACCOUNT_NUMBER"),
    ("accountName", "BANK_ACCOUNT_NAME"),
    ("staticQrPath", "PAYMENT_QR_PATH"),
    ("hotline", "HOTLINE"),
    ("zalo", "ZALO"),
    ("email", "CONTACT_EMAIL"),
    ("facebook", "SOCIAL_URL_FACEBOOK"),
    ("instagram", "SOCIAL_URL_INSTAGRAM"),
    ("privacyUrl", "PRIVACY_URL"),
    ("refund", "POLICY_REFUND"),
    ("transfer", "POLICY_TRANSFER"),
    ("photoDelivery", "POLICY_PHOTO_DELIVERY"),
    ("endpoint", "GOOGLE_APPS_SCRIPT_URL"),
    ("canonical", "SITE_CANONICAL"),
]

# Các key phải là số hoặc null
NUMBERS = [
    ("priceVND", "EVENT_PRICE_VND"),
    ("seatsTotal", "SEATS_TOTAL"),
]


def patch(src, key, new_value):
    """Thay giá trị của `key:` ở dòng đầu tiên tìm thấy, giữ nguyên comment cuối dòng."""
    pattern = re.compile(
        r"^(\s*" + re.escape(key) + r":\s*)(.*?)(,)(\s*(?://.*)?)$",
        re.MULTILINE,
    )
    m = pattern.search(src)
    if not m:
        return src, False
    if m.group(2) == new_value:
        return src, False
    return pattern.sub(lambda mm: mm.group(1) + new_value + mm.group(3) + mm.group(4),
                       src, count=1), True


def main():
    check_only = "--check" in sys.argv

    env = read_env(ENV)
    if env is None:
        print("Chưa có file .env. Hãy copy .env.example thành .env rồi điền.")
        print("  ->  " + ENV)
        sys.exit(1)

    with io.open(CONFIG, encoding="utf-8") as f:
        src = f.read()

    changed = []

    for key, envkey in STRINGS:
        if envkey not in env:
            continue
        src, did = patch(src, key, js_str(env[envkey]))
        if did:
            shown = env[envkey] if env[envkey] else "(để trống)"
            changed.append("%-18s <- %s" % (key, shown))

    for key, envkey in NUMBERS:
        if envkey not in env:
            continue
        raw = env[envkey]
        val = raw if re.match(r"^\d+$", raw) else "null"
        src, did = patch(src, key, val)
        if did:
            changed.append("%-18s <- %s" % (key, val))

    if "DRESSCODE" in env:
        src, did = patch(src, "dresscode", js_list(env["DRESSCODE"]))
        if did:
            changed.append("%-18s <- %s" % ("dresscode", env["DRESSCODE"] or "(rỗng)"))

    # priceLabel luôn suy ra từ priceVND để hai chỗ không lệch nhau
    m = re.search(r"priceVND:\s*(\d+)", src)
    if m:
        n = int(m.group(1))
        label = "{:,}".format(n).replace(",", ".") + "đ"
        src, did = patch(src, "priceLabel", js_str(label))
        if did:
            changed.append("%-18s <- %s (suy ra từ priceVND)" % ("priceLabel", label))

    if not changed:
        print("Không có gì thay đổi. config.js đã khớp .env.")
        return

    print("Thay đổi:" if not check_only else "Sẽ thay đổi (chế độ --check):")
    for c in changed:
        print("  " + c)

    if check_only:
        print("\nKhông ghi file (đang ở chế độ --check).")
        return

    with io.open(CONFIG, "w", encoding="utf-8", newline="\n") as f:
        f.write(src)
    print("\nĐã ghi " + os.path.relpath(CONFIG, ROOT))

    if env.get("BANK_BIN") and env.get("BANK_ACCOUNT_NUMBER"):
        print("QR VietQR: BẬT (sẽ hiện QR đúng số tiền + nội dung chuyển khoản).")
    elif env.get("PAYMENT_QR_PATH"):
        print("QR: dùng ảnh tĩnh " + env["PAYMENT_QR_PATH"])
    else:
        print("QR: CHƯA cấu hình -> trang hiện thông báo trung tính, không tạo QR giả.")

    if not env.get("GOOGLE_APPS_SCRIPT_URL"):
        print("Backend: CHƯA cấu hình -> form chạy CHẾ ĐỘ THỬ, không ghi vào Sheet.")


if __name__ == "__main__":
    main()
