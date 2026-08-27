# -*- coding: utf-8 -*-
"""Chạy sau khi đổi bề rộng ảnh trong build-images.py.

Viết lại mọi tham chiếu assets/img/<slug>-<width>.<ext> theo danh sách bề
rộng MỚI trong manifest.json. Chạy sau khi đổi bề rộng trong build-images.py."""
import io, json, os, re, sys
sys.stdout.reconfigure(encoding='utf-8')
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

man = json.load(io.open('assets/img/manifest.json', encoding='utf-8'))
widths = {k: v['widths'] for k, v in man.items()}

REF = re.compile(r'assets/img/([a-z0-9-]+)-(\d+)\.(webp|jpg|png)')
SRCSET = re.compile(r'(srcset|imagesrcset)="([^"]+)"')


def nearest(slug, w):
    """Ánh xạ một bề rộng cũ sang bề rộng mới gần nhất."""
    ws = widths.get(slug)
    if not ws:
        return None
    return min(ws, key=lambda x: abs(x - w))


def fix_srcset(value, slug_hint=None):
    """Dựng lại srcset đầy đủ từ danh sách bề rộng mới, giữ nguyên đuôi file."""
    parts = [p.strip() for p in value.split(',') if p.strip()]
    if not parts:
        return value
    m = REF.search(parts[0])
    if not m:
        return value
    slug, ext = m.group(1), m.group(3)
    ws = widths.get(slug)
    if not ws:
        return value
    return ', '.join('assets/img/%s-%d.%s %dw' % (slug, w, ext, w) for w in ws)


def process(path):
    s = io.open(path, encoding='utf-8').read()
    orig = s

    # 1. Dựng lại toàn bộ srcset / imagesrcset
    def _ss(m):
        return '%s="%s"' % (m.group(1), fix_srcset(m.group(2)))
    s = SRCSET.sub(_ss, s)

    # 2. Các tham chiếu lẻ (src=, href=, staticQrPath...) -> bề rộng gần nhất
    def _ref(m):
        slug, w, ext = m.group(1), int(m.group(2)), m.group(3)
        n = nearest(slug, w)
        if n is None:
            print('   !! không rõ slug:', slug, 'trong', path)
            return m.group(0)
        return 'assets/img/%s-%d.%s' % (slug, n, ext)
    s = REF.sub(_ref, s)

    if s != orig:
        io.open(path, 'w', encoding='utf-8', newline='\n').write(s)
        print('   đã sửa', path)
    else:
        print('   không đổi', path)


for f in ['index.html', 'thanh-toan.html', 'assets/js/config.js']:
    process(f)

# 3. Kiểm tra: mọi đường dẫn ảnh nhắc tới trong code phải tồn tại thật
missing = []
for f in ['index.html', 'thanh-toan.html', 'assets/js/config.js']:
    for m in REF.finditer(io.open(f, encoding='utf-8').read()):
        path = m.group(0)
        if not os.path.exists(path):
            missing.append((f, path))
print('\nẢnh được nhắc tới nhưng KHÔNG tồn tại:', missing or 'không có')
print('Số file trong assets/img:', len(os.listdir('assets/img')))
