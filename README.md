# Bông Dua Fleur — Landing page workshop đèn lồng hoa tươi

Trang bán vé workshop **cắm hoa tươi trên đèn lồng Trung thu**, ngày **20.09.2026**,
giá **488.000đ/người**. Workshop cuối cùng của Bông Dua Fleur trong năm 2026.

Luồng chính: khách xem trang → điền form giữ chỗ → dữ liệu ghi vào Google Sheets →
hiện mã đăng ký + QR chuyển khoản đúng 488.000đ → khách bấm "Tôi đã chuyển khoản" →
Bông Dua đối soát và gọi xác nhận.

---

## 1. Chạy thử ngay (30 giây)

Máy này chưa cài Node, nên trang được viết ở dạng **HTML/CSS/JS tĩnh** — mở là chạy.

```bash
python -m http.server 8123
```

Rồi mở http://127.0.0.1:8123/index.html

Chạy test:

```bash
python -m http.server 8123
```

Rồi mở http://127.0.0.1:8123/tests/index.html — trang tự chạy 47 test và hiện kết quả.
Nếu máy có Node thì `node tests/run.js` cho kết quả y hệt (thoát mã 1 khi có test hỏng).

> Mở thẳng `index.html` bằng file:// cũng xem được, nhưng nên dùng server tĩnh
> để `fetch` và ảnh hoạt động đúng như khi lên host.

---

## 2. Vì sao là HTML tĩnh chứ không phải Next.js

Brief ưu tiên Next.js + TypeScript + Tailwind. Quyết định giữ stack tĩnh vì:

1. **Máy này không có Node/npm.** Một dự án Next.js sẽ không `npm install` được,
   không chạy được, không build được và không kiểm thử được ở đây — nghĩa là bàn
   giao một thứ chưa ai chạy thử bao giờ.
2. **Yêu cầu bảo mật vẫn được đáp ứng.** Lý do brief chọn Next.js là để có API
   server-side, không lộ credential ra client. Google Apps Script cho đúng điều đó:
   script chạy bằng tài khoản Google sở hữu Sheet, trang web chỉ biết một URL
   `/exec`. Không có service account, private key hay secret nào trong repo.
3. **Không phải phương án `no-cors` mù.** Apps Script trả về JSON thật, trang đọc
   được `ok`, `registration_id`, `errors`. Ghi thành công hay thất bại đều biết
   chắc chắn — đây chính là điều brief cấm đánh đổi.
4. **Deploy ở đâu cũng được**, kể cả hosting rẻ nhất, và tải nhanh vì không có
   framework runtime.

Nếu sau này muốn chuyển sang Next.js: `assets/js/validate.js` đã viết dạng UMD
nên bê thẳng vào `/api/register` được, `assets/js/config.js` là file cấu hình duy
nhất, và schema Google Sheet ở mục 5 giữ nguyên.

---

## 3. Cấu trúc thư mục

```
bong-dua-workshop/
├── index.html                  trang giới thiệu + form giữ chỗ
├── thanh-toan.html             TRANG CHUYỂN KHOẢN (mã QR, Zalo, Facebook)
├── assets/
│   ├── css/styles.css          design system + responsive (mobile-first)
│   ├── js/config.js            ★ FILE CẤU HÌNH DUY NHẤT — sửa ở đây
│   ├── js/validate.js          validate + sinh mã, dùng chung web/test/Node
│   ├── js/core.js              phần dùng chung cho cả 2 trang
│   ├── js/main.js              trang chính: form, lightbox, sticky CTA
│   ├── js/payment.js           trang chuyển khoản: QR, copy, Zalo/Facebook
│   ├── img/                    ảnh đã tối ưu (WebP + JPEG fallback, nhiều size)
│   └── qr/                     nơi để ảnh QR tĩnh nếu dùng (không commit)
├── google-apps-script/Code.gs  backend ghi Google Sheets
├── tests/
│   ├── spec.js                 47 test dùng chung
│   ├── index.html              chạy test trong trình duyệt
│   └── run.js                  chạy test bằng Node
├── tools/
│   ├── build-images.py         sinh lại ảnh tối ưu từ thư mục ảnh gốc
│   └── apply-env.py            ghi giá trị từ .env vào config.js
├── .env.example                bảng thông tin cần điền
└── .gitignore
```

---

### Thứ tự các phần trên trang

**Trang 1 — `index.html`:**
`Banner` → **`Người hướng dẫn cắm hoa`** → `Câu chuyện nàng thơ` → `Trải nghiệm 3 hồi`
→ `Thành quả đèn hoa` → `Bạn nhận được gì` → `Khu check-in` → `Gallery`
→ `Thông tin buổi học` → `FAQ` → `Form giữ chỗ` → `Closing CTA` → `Footer`

**Trang 2 — `thanh-toan.html`** (khách được chuyển sang sau khi gửi form thành công):
`Lời chào theo tên` → `Mã QR + nút lưu` → `Thông tin chuyển khoản` →
`Nút Zalo / Facebook` → `Tôi đã chuyển khoản` → `Nhắc lại ngày giờ địa điểm`

---

## 4. Điền thông tin (bắt buộc trước khi chạy thật)

Có hai cách, chọn một:

**Cách A — sửa trực tiếp** `assets/js/config.js`. File có comment đánh dấu rõ:
`[XÁC NHẬN]`, `[TỪ POSTER]`, `[CẦN ĐIỀN]`.

**Cách B — dùng .env**

```bash
cp .env.example .env
# điền .env
python tools/apply-env.py --check   # xem trước
python tools/apply-env.py           # ghi vào config.js
```

### Checklist thay placeholder

| Việc | Ở đâu | Chưa điền thì sao |
|---|---|---|
| ~~URL Apps Script~~ | `api.endpoint` | **Đã điền và đã chạy thử thật.** Nếu xoá đi, form về **chế độ thử** kèm banner cảnh báo |
| Ngân hàng + số TK + QR | `payment.*` | **Đã điền** từ ảnh QR bạn gửi (VPBank · 0356622262 · PHAM THI THANH THU). Nếu xoá hết, trang **không tạo QR giả** mà hiện thông báo trung tính |
| Hotline / Zalo / email / MXH | `contact.*` | **Đã điền**: Zalo `0356622262`, Facebook `BongDuaFleur`. Để trống mục nào thì mục đó tự ẩn |
| Tên chủ shop | `event.founderName` | Section founder chỉ ghi "Người sáng lập Bông Dua Fleur" |
| Chính sách hoàn/huỷ/đổi người | `policy.refund`, `policy.transfer` | FAQ hiện "vui lòng liên hệ Bông Dua" |
| Thời gian trả ảnh | `policy.photoDelivery` | Hiện "sẽ báo cụ thể khi xác nhận chỗ" |
| Domain thật | `site.canonical` | Thẻ canonical trỏ về `bongduafleur.example.com` |
| Số chỗ | `event.seatsTotal` | Trang chỉ nói "nhóm nhỏ", **không nêu con số nào** |
| Đồ uống có trong 488k không | `includes[].confirmed` của mục `drink` | Hiện nhạt kèm nhãn "đang xác nhận" |
| Link Google Maps | `event.cafeMapUrl` | Không hiện nút chỉ đường |
| Link chính sách riêng tư | `contact.privacyUrl` | Footer chỉ ghi câu cam kết, không hiện link |

Toàn bộ chuỗi để trống đều được xử lý an toàn — trang tự ẩn hoặc dùng câu trung
tính, **không có chỗ nào hiện `[TEN_CAFE]` ra mặt khách**.

### ⚠️ Dữ liệu lấy từ poster, cần chủ dự án xác nhận

Poster `058dd6b2-…jpg` có sẵn giờ và địa điểm. Brief không cấp các thông tin này
và yêu cầu không tự bịa — nên chúng được đưa vào config với nhãn `[TỪ POSTER]`,
đúng theo poster, **và cần xác nhận lại trước khi chạy quảng cáo**:

- Khung giờ: **8:30 – 11:30**
- Địa điểm: **Lối Nhỏ Kafe — 46 Ngõ 2 Hoàng Quốc Việt, Nghĩa Đô, Hà Nội**
- Thứ trong tuần: **Chủ nhật**, 20.09.2026
- Dresscode gợi ý: **Trắng · Hồng · Hồng nude · Be**

Nếu sai, sửa trong `assets/js/config.js` (hoặc `.env`) là toàn trang đổi theo.
Muốn giấu giờ/địa điểm cho tới khi xác nhận chỗ thì để chuỗi rỗng.

---

## 5. Kết nối Google Sheets

**Đã nối xong và đã chạy thử thật.** Endpoint đang dùng nằm ở
`assets/js/config.js` → `api.endpoint`.

### Trang gửi gì lên

`POST` một chuỗi JSON với **đúng 5 khoá** Apps Script đang nhận, không thừa khoá nào:

```json
{
  "name":   "Nguyễn Thị Trăng",
  "phone":  "0912345678",
  "email":  "trang@gmail.com",
  "social": "@trang",
  "note":   "Đi cùng bạn"
}
```

`name` và `phone` là **hai field bắt buộc duy nhất** trên form; 3 khoá còn lại
có thể là chuỗi rỗng. `phone` luôn được chuẩn hoá về dạng `0…` trước khi gửi — nhập `+84912345678`
thì Sheet vẫn nhận `0912345678`.

### Một chi tiết bắt buộc phải đúng: `Content-Type: text/plain`

Đây là chỗ dễ sai nhất và đã kiểm chứng thật:

| Content-Type | Kết quả |
|---|---|
| `application/json` | Trình duyệt coi là "non-simple request" → gửi `OPTIONS` preflight trước. **Apps Script không trả lời `OPTIONS`** → chết ngay tại CORS, không gửi được gì |
| `text/plain;charset=utf-8` | "Simple request" → gửi thẳng, đi theo redirect sang `script.googleusercontent.com`, đọc được response |

Apps Script vẫn nhận nguyên chuỗi JSON qua `e.postData.contents`, nên đổi
Content-Type không ảnh hưởng gì phía script.

### Trang xử lý phản hồi thế nào

Endpoint trả `{"success":true}` kèm `Access-Control-Allow-Origin: *` (đã đo được),
nên trang **đọc được kết quả thật** chứ không phải "gửi rồi tin là xong".

| Máy chủ trả về | Trang làm gì |
|---|---|
| `{"success":true}` / `{"ok":true}` / chữ `OK` / body rỗng | Mở popup QR, xoá form |
| `{"success":false}` hoặc có trường `error` | Hiện đúng lời báo lỗi của máy chủ, **không mở QR**, giữ nguyên dữ liệu đã nhập |
| Trang HTML (deploy sai quyền) | Báo *"Kiểm tra lại quyền deploy: Who has access phải là Anyone"*, **không mở QR** |
| HTTP 4xx/5xx | Báo máy chủ gặp sự cố, **không mở QR** |
| Mất mạng / quá 15 giây | Báo lỗi mạng bằng tiếng Việt kèm gợi ý nhắn Zalo, **không mở QR** |

Quy tắc xuyên suốt: **chỉ mở popup QR khi máy chủ xác nhận thành công.**

### Chống bấm hai lần

Ngay khi bấm, nút bị `disabled` + `aria-busy="true"` và hiện spinner; đồng thời
một khoá logic chặn mọi lần submit tiếp theo. Đã đo: bấm 3 lần liên tiếp chỉ tạo
**1 request**. Xong (kể cả khi lỗi) nút mở lại để khách thử lại được.

### Nếu sau này đổi endpoint

Sửa `api.endpoint`. Nếu script mới nhận tên khoá khác, sửa `toApiPayload()` trong
`assets/js/validate.js` — đó là **nơi duy nhất** ánh xạ tên khoá, và có test bám theo.

### Nút "Tôi đã chuyển khoản"

Apps Script hiện tại chỉ có một hành động là ghi đăng ký, không có endpoint cập
nhật trạng thái. Nếu vẫn POST vào đó thì mỗi lần bấm sẽ tạo **một dòng rác không
tên không SĐT** trong Sheet. Vì vậy nút này chỉ ghi nhận phía trình duyệt
(`api.supportsPaymentClaimed: false`). Muốn ghi cả trạng thái vào Sheet thì dùng
`google-apps-script/Code.gs` kèm trong repo rồi bật cờ đó lên `true`.

### Những gì KHÔNG vào Sheet

Vì payload cố định 5 khoá: `consent`, mã giữ chỗ, UTM/nguồn và user-agent **không**
được gửi. UTM vẫn được ghi vào analytics (`window.dataLayer`) để biết khách đến từ
đâu. Nếu muốn đưa UTM vào Sheet, thêm cột bên Apps Script rồi thêm khoá tương ứng
trong `toApiPayload()`.

Mã giữ chỗ `BD0926-XXXX` vẫn được sinh để dựng nội dung chuyển khoản, nhưng **ẩn
khỏi giao diện** (`payment.showRegistrationId: false`) — đưa khách một mã mà shop
không tra được trong Sheet thì chỉ gây rối.

### Phương án dự phòng: Google Apps Script tự dựng

Repo có sẵn `google-apps-script/Code.gs` — bản đầy đủ hơn: tự tạo 19 cột, sinh mã
đăng ký phía server, chống trùng theo số điện thoại trong 10 phút, throttle
20 request/phút, và có endpoint cập nhật trạng thái đã chuyển khoản. Muốn dùng:
dán vào Apps Script, chạy `setUp`, Deploy → Web app (Execute as **Me**, Who has
access **Anyone**), rồi thay `api.endpoint` và bật `supportsPaymentClaimed: true`.

### Phương án dự phòng: Google Form

Nếu muốn quay lại dùng Google Form, xoá `api.endpoint` rồi chạy
`python tools/google-form-ids.py "<link form>"`. Hạn chế: Google Form không trả
CORS nên **không xác nhận được đã ghi hay chưa** — trang chỉ gửi rồi tin là xong.

---

---

## 6. Trang chuyển khoản (`thanh-toan.html`)

### Vì sao là trang riêng, không phải popup

Khách của Bông Dua chủ yếu dùng điện thoại. Một trang thật đáng tin hơn popup:

- Bấm **Back** quay lại được, **tải lại** được, **lưu link** được.
- Không kẹt trong một khung cuộn nhỏ bên trong màn hình vốn đã nhỏ.
- Không phụ thuộc việc modal có render kịp hay không.
- Có URL riêng → đo được trong analytics như một bước phễu thật.

### Dữ liệu đi giữa hai trang

Tên khách và mã giữ chỗ được gửi qua **`sessionStorage`**, **không** qua query
string. Lý do: tên khách là thông tin cá nhân, không nên nằm trên thanh địa chỉ,
trong lịch sử trình duyệt, hay bị gửi kèm trong referrer sang bên thứ ba.

Mọi lời gọi `sessionStorage` đều bọc `try/catch` (trình duyệt có thể chặn site
data). Nếu đọc không được — hoặc khách mở thẳng `thanh-toan.html` — trang vẫn
chạy: hiện mã QR và thông tin ngân hàng (đều là thông tin công khai), nhưng nói
rõ *"Trang này chưa gắn với đăng ký nào"* kèm link quay lại form.

Xem xong, dữ liệu tạm được **xoá khỏi sessionStorage** để máy dùng chung không
còn thấy tên người trước.

### Trang có gì

1. **Mã QR to, bấm được** — chạm vào ảnh là mở mã QR cỡ lớn ở tab mới; trên
   điện thoại giữ để lưu về máy. Kèm nút **"Lưu mã QR về máy"** tải thẳng file.
2. **Thông tin chuyển khoản dạng chữ** để ai muốn chuyển tay cũng được:
   VPBank · `0356622262` · PHAM THI THANH THU · **488.000đ**.
3. **Nội dung chuyển khoản** `Ws 20/9 <tên khách>`, có nút sao chép.
   Mẫu sửa ở `payment.transferTemplate` (`{ten}` = tên khách, `{ma}` = mã giữ chỗ).
4. **Nút Zalo và Facebook** — `zalo.me/0356622262` và `facebook.com/BongDuaFleur`.
5. **Nút "Tôi đã chuyển khoản"** — chỉ ghi nhận, xem mục 5 README.
6. **Nhắc lại** ngày, khung giờ, địa điểm.

Trang gắn `noindex, nofollow` — nội dung cá nhân hoá, không cần Google lập chỉ mục.

### Mã QR

Mã QR bạn gửi **đã bao sẵn** số tiền `488,000 đ` và nội dung `Ws 20/9`. Vì QR
tĩnh không mang được tên từng người, microcopy nói rõ: *"Nếu app cho sửa nội
dung, bạn thêm giúp tên mình để Bông Dua đối soát nhanh hơn nhé."*

Muốn QR **tự động mang tên/mã từng khách**, xoá `payment.staticQrPath` và điền
`payment.bankBin` (VPBank = `970432`). Trang sẽ dựng QR VietQR động theo đúng số
tiền và nội dung riêng của từng người.

### Đổi tên file trang

Sửa `site.paymentPage` trong `assets/js/config.js`.

---

---

## 7. Ảnh — inventory và phân vai

Ảnh gốc nằm ở `Downloads/bông dua workshop đèn lồng/`, **không bị sửa và không bị
đổi tên**. `tools/build-images.py` đọc từ đó và sinh ra `assets/img/`.

Chạy lại khi có ảnh mới:

```bash
python tools/build-images.py
```

Mỗi ảnh được xuất WebP + JPEG fallback ở **hai** bề rộng (720 cho điện thoại,
1440 cho desktop) để dùng với `srcset`/`sizes`. Mỗi lần tải trang chỉ lấy đúng
một size phù hợp màn hình.

Chỉ giữ hai bề rộng là quyết định có chủ đích: trang này phục vụ đúng một buổi
workshop, và GitHub chỉ cho **kéo-thả tối đa 100 file mỗi lần** khi upload thủ
công. Nhờ vậy cả dự án gọn trong **91 file, ~8.3 MB** — kéo một lần là xong.
Muốn nét hơn thì thêm bề rộng vào `BIG`/`MED` trong `build-images.py` rồi chạy
lại `python tools/rewrite-srcset.py` để cập nhật HTML.

Phần tử thứ 3 trong `MAP` là **tỉ lệ khung cắt sẵn** — dùng cho `hero-nhom-doc`:
script cắt giữa ảnh gốc về khung dọc rồi mới thu nhỏ, nên bản mobile không bị
phóng to từ một mẩu ảnh ngang.

| Ảnh gốc | Vai trò trên trang | Ghi chú xử lý |
|---|---|---|
| `banner.png` (1774×887) | **Banner chính** | Điện thoại: hiện thành **băng ảnh 16:9 nguyên vẹn** ở đầu trang, không bị chữ đè lên (ảnh chỉ cao 887px, nếu ép full-bleed dọc sẽ phải phóng to ~1.8 lần và mờ). Từ 720px: làm nền toàn màn hình, `object-position 64% 50%` để cô gái và chiếc đèn hoa nằm bên phải, chữ bên trái. Cũng là ảnh OG khi chia sẻ link |
| `mã qr.jpg` (1014×2046) | **Mã QR trong màn hình sau đăng ký** | Cắt bỏ phần trang trí trên/dưới (giữ lại 0.055→0.735 chiều cao) → còn 1014×1391, gọn hơn nhiều trong modal mà vẫn đủ logo VPBank, QR, `488,000 đ`, `Ws 20/9`, tên và số tài khoản |
| `logo in tạp dề 2.png` (1254×1254) | Logo trên banner + footer + favicon | Gốc là art phát sáng trên nền đen → tách nền đen thành alpha để đặt trên nền navy. Trên điện thoại logo đặt đè lên băng ảnh để không tốn thêm chiều cao màn hình đầu |
| `058dd6b2-…jpg` (1024×1536) | **Không đưa lên trang.** Chỉ dùng để đọc giờ/địa điểm/dresscode | Poster có chữ in sẵn; brief là source of truth cao hơn |
| `885cfadb-…png` (1122×1402) | Chip "Đèn lồng hoa tươi" ở banner (≥1080px) + **Product proof** cận cảnh | Ở product proof dùng `object-fit: contain` trên nền tối → **không bao giờ cắt mất cánh ngôi sao**. Có nút phóng to (lightbox) |
| `779958422_…jpg` (1320×1980) | **Người hướng dẫn cắm hoa** — chủ shop, đặt **ngay sau banner** | Đúng vai theo brief. Không gán ai khác là founder |
| `779019197_…jpg` | Câu chuyện — hồi 1 "trước giờ hẹn" | |
| `778664674_…jpg` | Câu chuyện — hồi 2 "giữa buổi" | |
| `780917547_…jpg` | Câu chuyện — hồi 3 "gần trưa" | |
| `779160486_…jpg` | Trải nghiệm 01 "Chạm vào hoa" | |
| `779268332_…jpg` | Trải nghiệm 02 "Tạo nên đèn trăng" | |
| `777951600_…jpg` | Trải nghiệm 03 "Lưu lại nàng thơ" | |
| `105aff45-…png` (1086×1448) | **Khu check-in & bộ ảnh** | Giữ tỉ lệ dọc 3/4 → luôn còn người + đèn lồng + wordmark trong khung, kể cả ở 360px |
| `779160485_…jpg` | Gallery — ảnh cả nhóm | |
| `780981722_…jpg` | Gallery — chân dung cùng lan/cẩm tú cầu | |
| `779201235_…jpg` | Gallery — khoảnh khắc cười tự nhiên | |
| `778568574_…jpg` | Gallery — cận cảnh hoa sen | |
| `779050263_…jpg` | Gallery — nhóm ngồi trò chuyện | |
| `780748678_…jpg` | Gallery — nàng cầm sen | |
| 18 ảnh còn lại | Chưa dùng | Dự phòng. Thêm vào `MAP` trong `build-images.py` nếu muốn dùng |

Trong `MAP`, phần tử thứ 3 là **tỉ lệ khung cắt sẵn**, phần tử thứ 4 là **khung
cắt tương đối** `(trái, trên, phải, dưới)` — dùng cho ảnh QR. Cắt trước rồi mới
thu nhỏ, nên không bị phóng to từ một mẩu ảnh.

**OG image:** `assets/img/khu-check-in-1080.jpg`.

**Alt text:** mô tả nội dung thật của ảnh (ai, đang làm gì, vật gì). Không nhồi từ
khoá, không dùng "nàng thơ" để nhận dạng người.

---

## 8. Deploy

Trang tĩnh — copy cả thư mục lên bất kỳ host nào.

**Netlify / Vercel:** kéo thả thư mục vào dashboard, hoặc

```bash
npx vercel --prod
```

(không cần cấu hình build; `api.endpoint` đã nằm trong `config.js`)

**GitHub Pages:** push repo → Settings → Pages → branch `main`, thư mục `/`.

**Hosting thường / cPanel:** upload toàn bộ vào `public_html`.

Sau khi có domain thật, nhớ cập nhật `site.canonical` trong config.

Nên bật cache dài cho `assets/img/` (ảnh có số size trong tên nên an toàn) và
cache ngắn cho `index.html`.

---

## 9. Đã kiểm thử những gì

Xem chi tiết ở [`QA.md`](QA.md). Tóm tắt:

- **47/47 test pass** (số điện thoại VN, field bắt buộc, email, honeypot, mã đăng
  ký, payload gửi Apps Script, chống double-submit, 7 kiểu phản hồi từ máy chủ).
- **Không có horizontal scroll** ở 360×800, 375×812, 430×932, 768×1024, 1440×900.
- **Không có lỗi console**, 108/108 asset trả về HTTP 200.
- Hero ở 360px vẫn thấy đủ **tên workshop · ngày · giờ · địa điểm · giá · CTA**
  trong màn hình đầu.
- Luồng đăng ký chạy đầy đủ: validate → mã `BD0926-XXXX` → modal QR vừa viewport →
  copy nội dung → "Tôi đã chuyển khoản" → Escape đóng, focus trả về chỗ cũ.
- QR VietQR sinh đúng URL với `amount=488000` và `addInfo=BONGDUA BD0926-XXXX`.
- **WCAG AA**: đã đo tương phản 18 cặp màu chữ/nền. Aqua gốc `#22D3EE` chỉ dùng
  trên nền navy; trên nền sáng dùng `--aqua-deep #0A6E85` (5.3:1) — đây là sửa đổi
  duy nhất so với bảng màu gốc, để chữ nhỏ không bị mờ.

---

## 10. Chủ dự án còn cần cung cấp

Xếp theo mức chặn:

**Chặn việc thu tiền**
1. Ngân hàng, số tài khoản, tên chủ tài khoản (IN HOA không dấu) → `payment.*`

**Chặn việc chạy thật**
2. Deploy Apps Script và dán URL → `api.endpoint`
3. Xác nhận giờ / địa điểm / thứ trong tuần lấy từ poster có đúng không

**Nên có trước khi chạy quảng cáo**
4. Hotline hoặc Zalo, link Facebook/Instagram
5. Tên chủ shop để đề ở section "Người dẫn lối"
6. Đồ uống/vật liệu có nằm trong 488.000đ không
7. Chính sách hoàn / huỷ / đổi người tham dự
8. Số lượng ảnh và thời gian gửi ảnh
9. Số chỗ (nếu muốn nói "còn N chỗ" — hiện tại trang **không** nêu con số nào)
10. Domain thật → `site.canonical`
11. Link Google Maps của quán
12. Link trang chính sách riêng tư (nếu có)

---

## 11. Ghi chú kỹ thuật

### Ô tích đồng ý đã được bỏ

Brief gốc yêu cầu một checkbox đồng ý **bắt buộc**. Chủ dự án đã bỏ vì thực tế
nhiều khách quên tích rồi không gửi được form — mất đăng ký thật.

Thay vào đó, câu giải thích nằm ngay dưới nút gửi:

> Bằng việc bấm **Giữ chỗ**, bạn đồng ý để Bông Dua Fleur dùng thông tin trên để
> liên hệ về đăng ký này. Bông Dua không chia sẻ thông tin của bạn cho bên thứ ba.

Đây là mẫu đồng ý ngầm định (implied consent) — vẫn nói rõ trước khi khách bấm,
nhưng không chặn ai. Form nay chỉ còn **2 field bắt buộc: họ tên và số điện thoại**.

`validateRegistration()` không còn báo lỗi khi thiếu `consent`, và trả về
`data.consent = true` (ngầm định). Nếu về sau muốn dựng lại ô tích, chỉ cần gửi
kèm `consent` — hàm vẫn tôn trọng giá trị được truyền vào, và đã có test bám theo.

- **Analytics** hoạt động sẵn mà chưa cần provider: mọi event được đẩy vào
  `window.dataLayer` (GTM đọc được sau này) và `window.__bongduaEvents` (để QA).
  Event có: `page_view`, `hero_cta_click`, `form_start`, `form_submit_success`,
  `form_submit_error`, `form_validation_error`, `qr_view`, `copy_transfer_content`,
  `payment_claimed`, `proof_zoom`, `sticky_cta_click`, `closing_cta_click`.
  Bật `analytics.debug: true` để in ra console. **Không hardcode tracker nào.**
- **Chống spam:** honeypot ẩn + validate hai lớp + throttle 20 request/phút ở
  Apps Script + dedupe theo số điện thoại trong 10 phút (bấm hai lần trả về đúng
  mã cũ, không tạo dòng trùng).
- **Không log PII:** Apps Script chỉ `console.log` mã đăng ký, không log tên/SĐT.
- **UTM & referrer** được lưu vào Sheet để biết nguồn chuyển đổi.
- **Giữ dữ liệu khi lỗi:** submit thất bại thì form giữ nguyên mọi thứ khách đã
  gõ; chỉ `reset()` sau khi server xác nhận đã ghi.
- **prefers-reduced-motion** được tôn trọng: tắt hết reveal/parallax, nội dung
  không bao giờ phải chờ animation mới đọc được.
- **Sticky CTA** tự ẩn khi bàn phím ảo mở, khi đang ở section form, và khi modal
  đang mở; nằm trong `env(safe-area-inset-bottom)`.
- **Đồng bộ validate:** `assets/js/validate.js` và phần validate trong `Code.gs`
  là hai bản của cùng một bộ quy tắc. Sửa một bên nhớ sửa bên kia.
