# -*- coding: utf-8 -*-
"""
Lấy formId và các mã entry.xxx của một Google Form, rồi in ra đoạn cấu hình
dán thẳng vào assets/js/config.js.

Dùng khi bạn đã có sẵn Google Form và muốn trang landing gửi thẳng vào đó.

Cách chạy:

    python tools/google-form-ids.py "https://docs.google.com/forms/d/e/XXXX/viewform"

Nếu máy chặn mạng, mở form trong trình duyệt -> Ctrl+S lưu file .html rồi:

    python tools/google-form-ids.py duong-dan-file.html

LƯU Ý: gửi vào Google Form là đường một chiều — trình duyệt KHÔNG đọc được kết
quả (Google Form không trả CORS header), nên trang chỉ biết "đã gửi đi", không
biết chắc "đã ghi xong". Nếu cần chắc chắn, dùng Google Apps Script (mục 5
README) — cách đó trả JSON thật.
"""

import io
import json
import os
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

# Từ khoá trong nhãn câu hỏi -> tên field trong config.js
GUESS = [
    ("full_name", ["họ và tên", "họ tên", "ho va ten", "tên của bạn", "name"]),
    ("phone", ["điện thoại", "dien thoai", "sđt", "sdt", "phone", "zalo"]),
    ("email", ["email", "e-mail", "thư điện tử"]),
    ("social_handle", ["instagram", "facebook", "fb", "ig", "mạng xã hội"]),
    ("note", ["ghi chú", "ghi chu", "note", "lời nhắn", "câu hỏi"]),
    ("registration_id", ["mã đăng ký", "ma dang ky", "mã giữ chỗ", "registration"]),
]


def load(src):
    if os.path.exists(src):
        return io.open(src, encoding="utf-8", errors="replace").read()
    try:
        from urllib.request import Request, urlopen
    except ImportError:
        print("Không import được urllib."); sys.exit(1)
    req = Request(src, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urlopen(req, timeout=25) as r:
            return r.read().decode("utf-8", "replace")
    except Exception as e:
        print("Không tải được form:", e)
        print("Hãy mở form trong trình duyệt, Ctrl+S lưu file .html rồi chạy lại")
        print("với đường dẫn file đó.")
        sys.exit(1)


def find_form_id(html, src):
    m = re.search(r"/forms/d/e/([A-Za-z0-9_-]{20,})", html) or \
        re.search(r"/forms/d/e/([A-Za-z0-9_-]{20,})", src)
    return m.group(1) if m else ""


def find_fields(html):
    """Google Form nhúng cấu trúc câu hỏi trong biến FB_PUBLIC_LOAD_DATA_."""
    m = re.search(r"FB_PUBLIC_LOAD_DATA_\s*=\s*(\[.*?\]);", html, re.S)
    fields = []
    if m:
        try:
            data = json.loads(m.group(1))
            for q in data[1][1]:
                label = (q[1] or "").strip()
                if not q[4]:
                    continue
                for part in q[4]:
                    if part and part[0]:
                        fields.append((label, "entry." + str(part[0])))
        except Exception:
            fields = []
    if not fields:
        # Dự phòng: quét thẳng trong HTML
        for eid in dict.fromkeys(re.findall(r'entry\.(\d{6,})', html)):
            fields.append(("(không đọc được nhãn)", "entry." + eid))
    return fields


def guess_key(label):
    low = label.lower()
    for key, words in GUESS:
        for w in words:
            if w in low:
                return key
    return ""


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    src = sys.argv[1]
    html = load(src)

    form_id = find_form_id(html, src)
    fields = find_fields(html)

    if not form_id:
        print("Không tìm thấy formId. Kiểm tra lại link (phải có dạng /forms/d/e/.../viewform).")
    if not fields:
        print("Không tìm thấy entry nào. Form có đang ở chế độ cần đăng nhập không?")
        sys.exit(1)

    print("\nCác câu hỏi đọc được:")
    mapping = {}
    for label, eid in fields:
        key = guess_key(label)
        mark = ("-> " + key) if key else "-> (không đoán được, tự gán tay)"
        print("  %-40s %-18s %s" % (label[:40], eid, mark))
        if key and key not in mapping:
            mapping[key] = eid

    print("\n" + "=" * 68)
    print("Dán đoạn dưới đây vào assets/js/config.js -> api.googleForm:")
    print("=" * 68)
    print("    googleForm: {")
    print("      formId: '%s'," % form_id)
    print("      entries: {")
    for key, _ in GUESS:
        print("        %-16s '%s'," % (key + ":", mapping.get(key, "")))
    print("      },")
    print("    },")
    print("=" * 68)

    missing = [k for k, _ in GUESS if k in ("full_name", "phone") and not mapping.get(k)]
    if missing:
        print("\nCẢNH BÁO: chưa gán được %s — bắt buộc phải có." % ", ".join(missing))
        print("Xem lại bảng trên rồi điền tay mã entry tương ứng.")


if __name__ == "__main__":
    main()
