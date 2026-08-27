# QA — Bông Dua Fleur landing page

Ghi lại đúng những gì **đã chạy và đo được**, và những gì **chưa kiểm được** cùng lý do.

Môi trường: Chrome trong Browser pane, server tĩnh `python -m http.server 8123`.

---

## 1. Test tự động — 47/47 pass

Chạy: mở `http://127.0.0.1:8123/tests/index.html` (hoặc `node tests/run.js`).

Kết quả đo được: `{"total":47,"pass":47,"fail":0,"failures":[]}`

| Nhóm | Test | Kết quả |
|---|---|---|
| Số điện thoại VN | 6 test: số chuẩn, có dấu cách/chấm/gạch, `+84`/`84`, thiếu số 0, đầu số cố định, sai độ dài | pass |
| Field bắt buộc | 10 test: payload hợp lệ, thiếu tên, tên ngắn, tên không có chữ, thiếu SĐT, SĐT sai, **thiếu consent vẫn gửi được**, **`consent:false` không còn chặn**, vẫn tôn trọng consent nếu được gửi kèm, gom nhiều lỗi | pass |
| Email (tuỳ chọn) | 3 test: bỏ trống, email đúng, email sai | pass |
| Chống spam | 4 test: honeypot có/không dữ liệu, ghi chú quá dài, lọc ký tự điều khiển | pass |
| Mã đăng ký | 5 test: định dạng `BD<MMYY>-XXXX`, lấy tháng/năm từ ngày sự kiện, không có `0/O/1/I` (300 lần lặp), từ chối mã sai, nội dung CK | pass |
| Định dạng tiền | 1 test | pass |
| **Chống double-submit** | 3 test: chặn lần bấm thứ 2, mở khoá sau khi xong, `isBusy` | pass |
| **Payload gửi Apps Script** | 5 test: đúng 5 khoá `name/phone/email/social/note` và **không thừa khoá nào**, ánh xạ đúng tên, không lộ `consent`, field trống là chuỗi rỗng, số điện thoại đã chuẩn hoá | pass |
| **Phản hồi từ máy chủ** | 9 test: `{"success":true}`, `{"success":false}`, trường `error`, `ok:false`, lỗi theo field, HTML do deploy sai quyền, HTTP 500, body rỗng, body chữ `OK` | pass |

---

## 2. Responsive — 5 viewport

Đo bằng JS: `document.documentElement.scrollWidth` so với `innerWidth`, và quét
mọi phần tử xem có `getBoundingClientRect()` vượt khung không.

| Viewport | Horizontal scroll | Phần tử tràn | Ghi chú |
|---|---|---|---|
| 360 × 800 | **không** (scrollW = 360) | 0 | CTA hero nằm trong màn hình đầu |
| 375 × 812 | **không** (scrollW = 375) | 0 | CTA hero bottom ở 706/812 |
| 430 × 932 | **không** | 0 | CTA + dòng trấn an đều trong fold |
| 768 × 1024 | **không** | 0 | gallery 6 cột, value 2 cột, acts 1 cột |
| 1440 × 900 | **không** | 0 | acts 3 cột, story/proof/checkin/founder split 2 cột, chip đèn lồng ở hero hiện ra và **không đè lên chữ** (chữ 171→955, chip 1027→1295), sticky CTA `display:none` |

(Phần tử `.hero__moon` và honeypot `.hp` vượt khung theo thiết kế — moon nằm trong
`overflow:hidden` của hero, honeypot đặt ở `left:-9999px`. Không gây scroll.)

### Banner (dùng file `banner.png` chủ dự án cung cấp)
Vì không chụp được screenshot trong môi trường này, phép crop `object-fit: cover`
và lớp scrim đã được **mô phỏng lại bằng Pillow đúng công thức CSS** ở cả hai
breakpoint để nhìn tận mắt trước khi chốt.

| Breakpoint | Cách dùng | Kiểm chứng |
|---|---|---|
| < 720px | **Băng ảnh 16:9 nguyên vẹn** ở đầu trang | Ảnh chỉ cao 887px; nếu ép full-bleed dọc 390×808 sẽ phải phóng to ~1.8 lần. Làm băng ảnh thì nguồn cần 780×439 → thừa độ nét. Logo đặt đè lên băng để không tốn thêm chiều cao |
| ≥ 720px | Nền toàn màn hình, `object-position: 64% 50%` | Mô phỏng ở 1440×828: cô gái, chiếc đèn ngôi sao và vòm hoa nằm trọn bên phải; bóng dồn về trái nơi có chữ |

**Chiều cao màn hình đầu (390×844)** — banner làm hero cao 976px, CTA rơi khỏi
màn hình. Đã nén còn **746px** bằng 4 việc, đo lại từng bước:
băng ảnh 3:2 → 16:9 (−41px) · headline `13.5vw` → `11.5vw`, 3 dòng → 2 dòng
(−65px) · 4 thông tin sự kiện gộp thành một dòng gạch chấm, nhãn `dt` ẩn khỏi
mắt nhưng **trình đọc màn hình vẫn đọc được** (−66px) · hai nút về cùng một hàng
với nhãn rút gọn "Giữ chỗ 488.000đ" / "Trải nghiệm" (−64px).

### Hero trong màn hình đầu (360px)
Đọc được đủ: `WORKSHOP CUỐI CÙNG CỦA NĂM 2026 · 20.09.2026` / `Gói một mùa trăng
bằng hoa.` / subcopy / `NGÀY Chủ nhật, 20.09.2026` / `THỜI GIAN 8:30 – 11:30` /
`ĐỊA ĐIỂM Lối Nhỏ Kafe` / `GIỮ CHỖ 488.000đ` / nút **Giữ chỗ với 488.000đ**.

### Form trên mobile
- `f-name`, `f-phone`, `f-email`, `f-social`, `f-note` đều **16px** → iOS không tự zoom.
- `type="tel"` và `type="email"` → đúng bàn phím.
- 1 cột, nút submit full-width, lỗi nằm ngay dưới field.
- Submit lỗi **không** xoá dữ liệu đã nhập (chỉ `reset()` sau khi server xác nhận).

### Ảnh
- Toàn bộ asset trả HTTP **200**, không có link chết.
- Hero art-direction chạy đúng: ≤719px lấy `hero-nhom-doc-591.webp` (bản cắt sẵn
  khung dọc), ≥720px lấy `hero-nhom-1440.webp` (bản ngang).
- Ảnh thành quả: tỉ lệ hiển thị **0.800** = tỉ lệ gốc **0.800** (1122×1402) →
  `object-fit: contain`, **không méo, không cắt mất cánh ngôi sao**.
- Ảnh check-in giữ khung dọc 3/4 với `object-position: 50% 50%` → người, đèn lồng
  và wordmark Bông Dua đều nằm trong khung ở 360px và 390px.
- Mọi `<img>` có `width`/`height` hoặc `aspect-ratio` → không layout shift.
  (Đã sửa riêng ảnh QR: bỏ `width/height` cố định vì ảnh VietQR không vuông,
  thay bằng `min-height` giữ chỗ ở `.pay__qr`.)

---

## 3. Luồng đăng ký + modal QR

Chạy thật ở viewport 375×812.

| Bước | Kết quả đo được |
|---|---|
| Submit form rỗng | 3 lỗi hiện đúng field, **modal không mở** |
| Submit hợp lệ | mã `BD0926-AUAQ`, nội dung CK `BONGDUA BD0926-AUAQ` |
| Modal vừa viewport | panel 351×747 tại top 32 / bottom 780 trong khung 812 → **vừa** |
| Nội dung cuộn trong modal | `scrollHeight > clientHeight` → cuộn bên trong, không tràn trang |
| Khoá cuộn nền | `body.is-locked` bật |
| Sticky CTA khi modal mở | tắt (`is-on` = false) → không che modal |
| Focus vào modal | `document.activeElement === pay-panel` |
| Focus trap | 4 phần tử focus được trong panel; phần tử `hidden` bị loại khỏi vòng Tab |
| Nút đóng | 44×44 px, luôn nhìn thấy |
| "Tôi đã chuyển khoản" | nút 305×53, sau khi bấm hiện đúng câu *"Đã ghi nhận. Bông Dua sẽ đối soát và xác nhận chỗ…"* — **không nói "thanh toán thành công"** |
| Escape | đóng modal, `is-locked` gỡ, focus trả về |
| Form reset | chỉ reset **sau khi** server xác nhận |
| Analytics | `page_view → form_submit_success → qr_view → payment_claimed` đúng thứ tự |

### Màn hình sau đăng ký (đo ở 360×800 — máy hẹp nhất)

| Hạng mục | Kết quả |
|---|---|
| Lời chào theo tên | "Cảm ơn Nguyễn Thị Trăng Thanh nhé…" |
| Nội dung chuyển khoản | `Ws 20/9 Nguyễn Thị Trăng Thanh` (mẫu `{ten}`) |
| Thông tin ngân hàng | VPBank · 0356622262 · PHAM THI THANH THU |
| Mã QR | 259×350, tải xong, bọc trong thẻ `<a>` trỏ tới `payment-qr-760.jpg` |
| Nút "Lưu mã QR về máy" | Hiện; tải blob cùng miền nên chạy được thật |
| Nút Zalo / Facebook | 2 nút, mỗi nút 256×56 (≥44px), trỏ đúng `zalo.me/0356622262` và `facebook.com/BongDuaFleur` |
| Modal vừa viewport | panel 336×736 trong khung 800 → vừa, nội dung cuộn bên trong |
| Không tràn ngang | `scrollWidth === innerWidth` |

Ảnh QR gốc là poster dọc 1014×2046, chiếm tới 566px trong modal. Đã cắt còn
1014×1391 (giữ 0.055→0.735 chiều cao) — vẫn đủ logo VPBank, mã QR, `488,000 đ`,
`Ws 20/9`, tên và số tài khoản, nhưng gọn hơn hẳn.

### Nối Apps Script thật — đã chạy end-to-end

Endpoint được **kiểm chứng trực tiếp** trước khi viết code, không đoán:

| Phép thử | Kết quả đo được |
|---|---|
| `GET` từ trình duyệt | **Fail** — `No 'Access-Control-Allow-Origin' header` (doGet trả HTML) |
| `POST` từ Python (không qua CORS) | 200, `{"success":true}`, header `ACAO: *` |
| `POST` từ trình duyệt, `Content-Type: application/json` | Chết tại CORS preflight — Apps Script không trả lời `OPTIONS` |
| `POST` từ trình duyệt, `Content-Type: text/plain;charset=utf-8` | **200, `type: "cors"`, đọc được `{"success":true}`** ← cách đang dùng |

Chạy thật qua form (390×844): request đi trong ~6s, popup QR mở, form được xoá,
lời chào và nội dung chuyển khoản đúng tên khách, nút Zalo/Facebook trỏ đúng.

**Payload gửi đi** (bắt bằng cách chặn `fetch`):

```json
{"name":"Nguyễn Thị Trăng","phone":"0912345678","email":"trang@gmail.com","social":"@trang","note":"Đi cùng bạn"}
```

Đúng 5 khoá, không thừa. Tên đã gộp khoảng trắng thừa (`"  Nguyễn   Thị Trăng  "`
→ `"Nguyễn Thị Trăng"`), số điện thoại `+84 91 234 5678` đã chuẩn hoá về
`0912345678`.

**Chống bấm hai lần:** bấm submit 3 lần liên tiếp → đo được **1 request duy nhất**;
`disabled = true` và `aria-busy = "true"` ngay sau cú bấm đầu, mở lại khi xong.

**Năm kịch bản phản hồi** (chặn `fetch`, modal đóng sạch trước mỗi ca):

| Máy chủ trả về | Mở QR? | Báo lỗi | Giữ dữ liệu đã nhập |
|---|---|---|---|
| `{"success":true}` | **có** | — | form được xoá |
| `{"success":false,"error":"Sheet dang khoa"}` | không | "Sheet dang khoa." | có |
| Trang HTML (deploy sai quyền) | không | nhắc sửa *"Who has access phải là Anyone"* | có |
| HTTP 500 | không | "Máy chủ đang gặp sự cố." | có |
| Mất mạng (`TypeError`) | không | tiếng Việt + gợi ý nhắn Zalo | có |

Ca cuối là một lỗi **đã sửa trong lúc kiểm**: `TypeError: Failed to fetch` vốn bị
hiện thẳng bằng tiếng Anh cho khách.

**Một lỗi chặn luồng đã phát hiện và sửa:** code cũ bắt buộc máy chủ phải trả
`registration_id` hợp lệ, nếu không thì ném lỗi. Apps Script thật chỉ trả
`{"success":true}` → đăng ký **đã ghi vào Sheet** nhưng khách lại thấy báo lỗi và
không thấy QR. Nay mã giữ chỗ được sinh ở client khi máy chủ không trả về.

### Đổi popup QR thành TRANG RIÊNG `thanh-toan.html`

Chủ dự án phản hồi: khách dùng điện thoại nhiều, lo popup không load tốt. Đã bỏ
hẳn modal, chuyển thành một trang thật.

| Kịch bản | Kết quả đo được |
|---|---|
| Gửi form thành công | `location.pathname` đổi sang `/thanh-toan.html` |
| Cá nhân hoá | "Cảm ơn Đỗ Xuân Mạnh nhé…", nội dung CK `Ws 20/9 Đỗ Xuân Mạnh` |
| Mã QR | tải xong, 296×401 ở 390px · 274×370 ở 360px, bọc trong `<a>` mở ảnh gốc |
| Zalo / Facebook | đúng `zalo.me/0356622262` và `facebook.com/BongDuaFleur`, mỗi nút 316×56 |
| Nhắc lại sự kiện | ngày, khung giờ, địa điểm đọc từ config |
| Dọn dữ liệu tạm | `sessionStorage` được xoá ngay sau khi hiển thị |
| **Vào thẳng trang, không có đăng ký** | Vẫn hiện QR (thông tin công khai), nội dung CK lùi về `Ws 20/9`, hiện cảnh báo *"Trang này chưa gắn với đăng ký nào"* + link quay lại form |
| Nút "Tôi đã chuyển khoản" | Ẩn nút, hiện thông báo `role="status"`, **không** POST lên Apps Script |
| 360×800 và 1440×900 | không tràn ngang, không phần tử nào vượt khung |

Tên khách đi qua **`sessionStorage`**, không qua query string — tên là thông tin
cá nhân, không nên nằm trên thanh địa chỉ / lịch sử / referrer.

**Hai lỗi hồi quy đã phát hiện và sửa ngay trong lúc kiểm** — cả hai đều do CSS
dùng chung nằm trong khối modal bị xoá:

1. **Lightbox mất nền.** `.modal, .lightbox { position: fixed; inset: 0 }` và
   `.lightbox__backdrop` vốn khai báo chung với modal → lightbox ảnh thành quả
   mất hẳn lớp phủ. Đã cho lightbox khai báo đầy đủ, không dựa vào modal nữa.
2. **Nút Zalo/Facebook sập còn cao 26px** (đo được `316x26`) vì `.social__btn`,
   `.social__ic`, `.social__tx` cũng nằm trong khối bị xoá. Đã khôi phục, nay
   `316x56`.

### Bỏ ô tích đồng ý bắt buộc

Chủ dự án phản hồi: nhiều khách không tích nên không sang được trang tiếp theo —
mất đăng ký thật. Đã bỏ hẳn ô tích, chuyển thành dòng chữ ngay dưới nút gửi.

| Hạng mục | Trước | Sau |
|---|---|---|
| Số field bắt buộc | 3 (tên, SĐT, ô tích) | **2** (tên, SĐT) |
| Thuộc tính `required` trong form | `f-name`, `f-phone`, `f-consent` | `f-name`, `f-phone` |
| Không tích / không có consent | Chặn, báo lỗi | **Gửi được**, `data.consent = true` (ngầm định) |
| Câu giải thích | Nhãn cạnh ô tích | Dòng chữ dưới nút, vẫn đọc được trước khi bấm |

Đã dọn sạch mọi tham chiếu: `index.html`, `styles.css`, `main.js`,
`validate.js`, `spec.js`, `Code.gs` — đếm được **0** chỗ còn nhắc tới
`f-consent` / `e-consent` / `field--check`.

Chạy thật ở 390×844 với **chỉ 2 field được điền**: không lỗi, chuyển thẳng sang
`/thanh-toan.html`, nội dung CK đúng `Ws 20/9 Trần Thu Hà`.

Backend `Code.gs` cũng đã sửa tương ứng — nếu vẫn bắt buộc consent phía server
thì mọi đăng ký từ web mới sẽ bị từ chối.

### QR khi **chưa** có thông tin ngân hàng
Modal hiện panel *"Thông tin chuyển khoản đang được cập nhật"*, ẩn các dòng ngân
hàng/số TK/chủ TK, ẩn nút "Lưu mã QR". **Không có QR giả nào được sinh ra.**

### QR khi **đã** có thông tin ngân hàng
Sinh đúng URL:

```
https://img.vietqr.io/image/970436-1234567890-compact2.png
  ?amount=488000
  &addInfo=BONGDUA%20BD0926-GPUP
  &accountName=NGUYEN%20VAN%20A
```

Số tiền cố định **488000**, nội dung CK đúng mã của từng khách. Alt text:
*"Mã QR chuyển khoản 488.000đ cho đăng ký BD0926-GPUP"*.

---

## 3b. Nút bấm — chiều sâu tĩnh

Bản đầu dùng vệt sáng quét qua (light sweep). Chủ dự án phản hồi *"nhanh quá"* nên
đã **bỏ hẳn animation**, chuyển sang tạo chiều sâu bằng lớp nền + đổ bóng tĩnh.
Giữ nguyên màu xanh thương hiệu, chỉ thêm ánh sáng và độ dày.

Đo được trên nút chính: `animation-name: none`, không còn pseudo-element nào
(`::before`/`::after` = `none`), và **7 lớp `box-shadow`**:

| Lớp | Vai trò |
|---|---|
| `inset 0 1.5px 0 rgba(255,255,255,.62)` | Gờ sáng mép trên — nguồn sáng đến từ phía trên |
| `inset 0 0 0 1px rgba(255,255,255,.26)` | Viền sáng mảnh chạy quanh nút |
| `inset 0 -2px 7px rgba(2,12,26,.42)` | Gờ tối mép dưới — nút dày lên |
| `inset 0 -1px 0 rgba(2,12,26,.32)` | Vạch tối sắc ở đáy |
| `0 2px 3px rgba(2,12,26,.36)` | Bóng chạm mặt phẳng |
| `0 14px 32px -10px rgba(65,105,225,.78)` | Quầng sáng xanh gần |
| `0 26px 56px -24px rgba(0,71,171,.82)` | Quầng sáng xanh xa |

Cộng thêm lớp gloss phủ nửa trên trong `background` và `text-shadow` nhẹ cho chữ.

- **Hover**: nhấc lên 2px, quầng sáng nở rộng, `brightness(1.05)`.
- **Nhấn xuống**: lún 1px, gờ sáng trên chuyển thành bóng lõm bên trong, quầng
  sáng co lại — cảm giác nút bị ấn xuống thật.
- `prefers-reduced-motion: reduce`: bỏ hết `transition` và `transform`; chiều sâu
  vẫn còn nguyên vì nó là tĩnh.

Nút Zalo/Facebook dùng đúng ngôn ngữ đó với gradient thương hiệu tương ứng.

---

## 4. Accessibility

- **1 thẻ `<h1>`** duy nhất; heading đi theo thứ bậc.
- HTML semantic: `header` / `main` / `section` / `footer` / `dl` / `ol` / `details`.
- Mọi input có `<label>` thật gắn bằng `for`; lỗi gắn qua `aria-describedby` và
  `role="alert"`; field sai có `aria-invalid="true"`.
- Modal & lightbox: `role="dialog"`, `aria-modal="true"`, focus trap, đóng bằng
  Escape, trả focus về chỗ cũ.
- Skip link tới phần đăng ký.
- `prefers-reduced-motion`: tắt reveal, tắt smooth scroll, giảm spinner.
- Lightbox mở được **bằng nút bấm** (không chỉ hover), gallery không dùng hover
  làm cách duy nhất để thấy nội dung.

### Tương phản — đo 18 cặp màu, tất cả đạt WCAG AA

Đo bằng công thức WCAG trên màu computed thật.

| Chỗ | Tỉ lệ | Cần | |
|---|---|---|---|
| Body text trên nền pearl | 6.88 | 4.5 | pass |
| Chữ mô tả (act / value / gallery) | 6.45 | 4.5 | pass |
| `info dd` | 14.77 | 4.5 | pass |
| Eyebrow / `info dt` trên nền sáng | **5.29** | 4.5 | pass *(sau khi sửa)* |
| Founder name | 5.29 | 4.5 | pass |
| Số thứ tự hồi (30px) | 5.29 | 3 | pass |
| Giá trong value stack | 8.11 | 4.5 | pass |
| Hero sub / reassure trên navy | 12.04 | 4.5 | pass |
| Hero `dt` aqua trên navy | 10.42 | 4.5 | pass |
| Form hint / consent label | 12.04 | 4.5 | pass |
| Footer privacy | 12.66 | 4.5 | pass |
| Closing meta (aqua trên navy) | 10.42 | 4.5 | pass |
| Chữ trắng trên CTA gradient | 5.17 / 4.85 / 8.44 | 4.5 | pass ở **cả ba** điểm dừng |
| Chữ trắng trên nút Zalo | 4.54 / 5.18 / 6.24 | 4.5 | pass ở cả ba điểm dừng |
| Chữ trắng trên nút Facebook | 4.74 / 5.73 / 7.61 | 4.5 | pass ở cả ba điểm dừng |

**Một lỗi tương phản trên nút gradient đã sửa.** Đo tương phản trên nút gradient
thì phải đo **từng điểm dừng**, không chỉ điểm giữa — chữ nằm trải dài trên cả
dải màu. Ba nút đều có đầu sáng không đạt: nút chính `#7191F7` chỉ 2.96, Zalo
`#58A6FF` 2.53, Facebook `#6E9BFF` 2.69. Đã hạ độ sáng các điểm dừng đầu
(`#3D63E0`, `#1C74E0`, `#2470DC`) để **mọi điểm** trên gradient đều ≥ 4.5.
Chiều sâu không mất gì vì nó đến từ lớp đổ bóng, không từ độ sáng nền.

**Một sửa đổi so với bảng màu brief:** aqua gốc `#22D3EE` trên nền sáng chỉ đạt
**2.96** — dưới ngưỡng AA, đúng như brief đã cảnh báo ("aqua không được dùng làm
chữ nhỏ trên nền trắng nếu thiếu tương phản"). Đã thêm biến `--aqua-deep #0A6E85`
(5.29) chỉ dùng cho chữ nhỏ trên nền sáng. Aqua gốc vẫn giữ nguyên trên nền navy.

**Ba lỗi CSS đã tìm ra và sửa:**

1. Các quy tắc kiểu `.founder__text > p`, `.proof__text p`, `.checkin__text p`,
   `.story__text p` có specificity (0,1,1) nên **ghi đè** các class tiện ích
   (0,1,0) nằm bên trong. Hậu quả thật: mọi `<p class="eyebrow">` trong 4 section
   đó mất màu aqua và bị phóng từ 12.5px lên 15.5px — nhìn thấy rõ trên ảnh chụp
   màn hình đầu tiên của chủ dự án ("NGƯỜI DẪN LỐI" ra màu xám thay vì aqua).
   Đã sửa bằng cách loại trừ tường minh: `p:not(.eyebrow):not(.founder__name)`…
2. Nhờ vậy bỏ được toàn bộ `!important` mà `.proof__note` và `.checkin__hint`
   đang phải dùng để chống lại chính lỗi trên.
3. Eyebrow của section "Câu chuyện" dùng `--aqua-deep` (dành cho nền sáng) trong
   khi section đã đổi sang nền navy → chỉ đạt 3.21. Đã đổi về aqua gốc (10.42).

Đã đo lại **toàn bộ 17 eyebrow / nhãn nhỏ** trên trang sau khi sửa: tất cả đạt AA.

---

## 5. Console & lỗi

- `console.error` / `console.warn`: **không có**.
- Không có link chết (toàn bộ asset HTTP 200).
- Vùng chạm: mọi nút/link đều ≥44×44 ở 360px. Ngoại lệ duy nhất là link chữ nằm
  trong câu văn ở khối cảnh báo "chưa gắn với đăng ký nào" (277×39) — WCAG 2.5.8
  miễn trừ link nội tuyến trong đoạn văn.
- Không có `alert`, không autoplay nhạc/video.
- Không có chữ quan trọng render thành ảnh.

---

## 6. Chưa kiểm được trong môi trường này

Nói thẳng, đây là hạn chế của môi trường chứ không phải đã kiểm và bỏ qua:

1. **Không chụp được screenshot.** Browser pane không hiển thị nên không
   compositing frame. Toàn bộ QA ở trên làm bằng **đo đạc DOM/CSS thật** (kích
   thước, tỉ lệ, màu computed, tương phản tính bằng công thức WCAG) — chính xác
   hơn nhìn mắt, nhưng không thay được cảm nhận thẩm mỹ. **Nên mở bằng mắt một
   lượt trước khi chạy quảng cáo.**
2. **Focus ring không xác minh được.** `document.hasFocus() === false` (cửa sổ
   trình duyệt không được focus) nên `:focus` / `:focus-visible` không match.
   CSS đã có `:focus-visible { outline: 3px solid var(--aqua) }` và skip link
   `:focus { top: 12px }`, nhưng cần một người bấm Tab thật để xác nhận.
3. **Lazy-load ảnh dưới fold.** Tab không compositing nên IntersectionObserver
   của `loading="lazy"` không kích hoạt (3/16 ảnh tải). Đã kiểm bù bằng cách fetch
   trực tiếp toàn bộ 90 URL — tất cả 200 — và đo kích thước tự nhiên của ảnh chính.
4. **Dọn dòng test trong Sheet.** Quá trình nghiệm thu đã ghi **4 dòng thật** vào
   Sheet, tên đều bắt đầu bằng `[TEST]`, số điện thoại `0900000000`–`0900000002`.
   **Cần xoá giúp 4 dòng đó.**
5. **Quét mã QR bằng app ngân hàng thật.** Ảnh QR hiển thị đúng, tải được, và
   phần cắt vẫn giữ nguyên vùng mã. Nhưng **chưa ai quét thử** — hãy quét một
   lần bằng app VPBank để chắc chắn phần cắt không làm hỏng mã và số tiền hiện
   đúng 488.000đ.
6. **Lighthouse.** Chưa chạy được (không có Chrome CLI/Node ở đây). Các yếu tố
   nền tảng đã làm: WebP + srcset/sizes, preload ảnh hero, lazy-load dưới fold,
   `width`/`height` chống layout shift, không JS framework, không font-blocking
   (`display=swap`), semantic HTML, metadata đầy đủ.

---

## 7. Checklist trước khi chạy thật

- [x] Thông tin ngân hàng + ảnh QR — đã lấy từ file chủ dự án gửi
- [x] Zalo + Facebook trong màn hình sau đăng ký
- [ ] **Quét thử QR bằng app ngân hàng** — kiểm tra hiện đúng 488.000đ
- [x] Nối Apps Script — đã chạy thật, popup QR mở đúng khi thành công
- [x] Chống bấm hai lần — đo được 1 request khi bấm 3 lần
- [ ] **Xoá 4 dòng `[TEST]` trong Google Sheet** (SĐT `0900000000`–`0900000002`)
- [ ] Xác nhận lại giờ / địa điểm / thứ trong tuần (đang lấy từ poster)
- [ ] Quyết định đồ uống có nằm trong 488k không → `includes` mục `drink`
- [ ] Cập nhật `site.canonical` sang domain thật
- [ ] Mở bằng mắt trên một điện thoại thật, bấm Tab kiểm tra focus ring
- [ ] Kiểm tra ảnh OG bằng Facebook Sharing Debugger
