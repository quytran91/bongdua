/**
 * ============================================================================
 *  BÔNG DUA FLEUR — Backend ghi đăng ký vào Google Sheets
 * ============================================================================
 *  Đây là Google Apps Script, chạy TRÊN tài khoản Google của Bông Dua.
 *  Không có key/secret nào lộ ra phía trình duyệt: trang web chỉ biết URL
 *  /exec, còn quyền ghi Sheet thuộc về chính script này.
 *
 *  CÀI ĐẶT NHANH (chi tiết xem README.md):
 *    1. Tạo Google Sheet mới -> Extensions -> Apps Script
 *    2. Dán toàn bộ file này vào Code.gs
 *    3. Chạy hàm setUp()  (cấp quyền khi Google hỏi)
 *    4. Deploy -> New deployment -> Web app
 *         Execute as:      Me
 *         Who has access:  Anyone
 *    5. Copy URL /exec -> dán vào assets/js/config.js -> api.endpoint
 *
 *  LƯU Ý ĐỒNG BỘ: phần validate dưới đây phải khớp với assets/js/validate.js.
 *  Nếu sửa quy tắc ở một bên, nhớ sửa bên còn lại.
 * ============================================================================
 */

/* ------------------------------------------------------------------ CONFIG */

var SHEET_NAME = 'DangKy';
var EVENT_DATE = '2026-09-20';   // phải khớp config.js -> event.dateISO
var TICKET_PRICE = 488000;       // phải khớp config.js -> event.priceVND

var HEADERS = [
  'created_at', 'registration_id', 'full_name', 'phone', 'email',
  'social_handle', 'note', 'ticket_price', 'event_date', 'payment_status',
  'payment_claimed_at', 'source_url', 'utm_source', 'utm_medium',
  'utm_campaign', 'utm_content', 'referrer', 'consent', 'user_agent'
];

var STATUS_PENDING = 'PENDING_PAYMENT';
var STATUS_CLAIMED = 'PAYMENT_CLAIMED';

// Chống spam: mỗi số điện thoại chỉ được tạo đăng ký mới sau khoảng này.
var DEDUPE_WINDOW_MS = 10 * 60 * 1000;   // 10 phút
// Chặn đăng ký ồ ạt toàn hệ thống.
var GLOBAL_MAX_PER_MINUTE = 20;

/* ------------------------------------------------------------------- SETUP */

/** Chạy tay MỘT LẦN sau khi dán code: tạo sheet + dòng tiêu đề. */
function setUp() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  sh.clear();
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
  sh.setFrozenRows(1);
  sh.autoResizeColumns(1, HEADERS.length);
  return 'Đã tạo sheet "' + SHEET_NAME + '" với ' + HEADERS.length + ' cột.';
}

/* -------------------------------------------------------------- VALIDATION */
/* Bản sao của assets/js/validate.js — giữ nguyên tên hàm để dễ đối chiếu.    */

var LIMITS = { name: { min: 2, max: 80 }, email: { max: 120 }, social: { max: 120 }, note: { max: 600 } };

function clean_(v) {
  if (v === null || v === undefined) return '';
  return String(v).replace(/\s+/g, ' ').trim();
}

function sanitize_(v, max) {
  var s = clean_(v).replace(/[\u0000-\u001F\u007F]/g, '');
  if (max && s.length > max) s = s.slice(0, max);
  return s;
}

function normalizePhone_(input) {
  if (input === null || input === undefined) return null;
  var raw = String(input).trim();
  var plus = raw.charAt(0) === '+';
  var d = raw.replace(/\D/g, '');
  if (!d) return null;
  if (plus || d.length > 10) { if (d.indexOf('84') === 0) d = '0' + d.slice(2); }
  if (d.length === 9 && d.charAt(0) !== '0') d = '0' + d;
  if (d.length !== 10) return null;
  if (!/^0(3|5|7|8|9)\d{8}$/.test(d)) return null;
  return d;
}

function isValidEmail_(v) {
  var s = clean_(v);
  if (!s || s.length > LIMITS.email.max) return false;
  return /^[^\s@,;:<>()[\]\\]+@[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?)+$/.test(s);
}

var MSG = {
  nameRequired: 'Bông Dua cần biết tên bạn để gọi cho đúng nhé.',
  nameShort:    'Tên hơi ngắn, bạn ghi đầy đủ giúp Bông Dua nhé.',
  nameInvalid:  'Tên chỉ nên gồm chữ, bạn kiểm tra lại giúp nhé.',
  phoneRequired:'Bông Dua cần số điện thoại để xác nhận chỗ cho bạn.',
  phoneInvalid: 'Số điện thoại chưa đúng. Ví dụ: 0912 345 678 hoặc +84912345678.',
  emailInvalid: 'Email này trông chưa đúng, bạn xem lại giúp nhé.',
  noteLong:     'Ghi chú dài quá, bạn rút gọn dưới 600 ký tự giúp nhé.',
  spam:         'Đăng ký chưa gửi được. Bạn thử lại sau ít phút nhé.'
};

function validateRegistration_(src) {
  src = src || {};
  var errors = {};

  var name = sanitize_(src.full_name, LIMITS.name.max);
  if (!name) errors.full_name = MSG.nameRequired;
  else if (name.length < LIMITS.name.min) errors.full_name = MSG.nameShort;
  else if (!/[A-Za-zÀ-ỹ]/.test(name)) errors.full_name = MSG.nameInvalid;

  var phoneRaw = clean_(src.phone);
  var phone = normalizePhone_(phoneRaw);
  if (!phoneRaw) errors.phone = MSG.phoneRequired;
  else if (!phone) errors.phone = MSG.phoneInvalid;

  var email = sanitize_(src.email, LIMITS.email.max);
  if (email && !isValidEmail_(email)) errors.email = MSG.emailInvalid;

  var note = sanitize_(src.note, LIMITS.note.max + 1);
  if (note.length > LIMITS.note.max) errors.note = MSG.noteLong;

  // Đồng ý là ngầm định khi khách bấm gửi (ô tích bắt buộc đã bỏ ở phía web,
  // câu giải thích đặt ngay dưới nút). Vẫn tôn trọng giá trị nếu được gửi kèm.
  var consent = (src.consent === undefined || src.consent === null)
    ? true
    : (src.consent === true || src.consent === 'true' || src.consent === 'on' || src.consent === 1);

  if (clean_(src.website)) errors._spam = MSG.spam;   // honeypot

  var ok = true;
  for (var k in errors) { if (errors.hasOwnProperty(k)) { ok = false; break; } }

  return {
    ok: ok,
    errors: errors,
    data: {
      full_name: name,
      phone: phone || '',
      email: email,
      social_handle: sanitize_(src.social_handle, LIMITS.social.max),
      note: note.slice(0, LIMITS.note.max),
      consent: consent
    }
  };
}

var ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function makeRegistrationId_(eventISO) {
  var mm = '09', yy = '26';
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(eventISO || ''));
  if (m) { mm = m[2]; yy = m[1].slice(2); }
  var tail = '';
  for (var i = 0; i < 4; i++) tail += ID_ALPHABET.charAt(Math.floor(Math.random() * ID_ALPHABET.length));
  return 'BD' + mm + yy + '-' + tail;
}

function isRegistrationId_(v) {
  return /^BD\d{4}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/.test(String(v || ''));
}

/* ------------------------------------------------------------------ ROUTES */

function doGet() {
  return json_({ ok: true, service: 'bongdua-fleur-register', version: 1 });
}

function doPost(e) {
  try {
    var body = {};
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
    var action = String(body.action || 'register');

    if (action === 'register') return handleRegister_(body);
    if (action === 'payment_claimed') return handlePaymentClaimed_(body);

    return json_({ ok: false, message: 'Yêu cầu không hợp lệ.' });
  } catch (err) {
    // KHÔNG log dữ liệu cá nhân, chỉ log lỗi kỹ thuật.
    console.error('doPost failed: ' + (err && err.message));
    return json_({ ok: false, message: 'Máy chủ đang bận. Bạn thử lại sau ít phút giúp Bông Dua nhé.' });
  }
}

/* -------------------------------------------------------------- HANDLERS */

function handleRegister_(body) {
  var check = validateRegistration_(body);
  if (!check.ok) {
    if (check.errors._spam) {
      // Với bot thì trả về như thành công giả cũng được, nhưng ở đây báo lỗi
      // trung tính để không tiết lộ cơ chế honeypot.
      return json_({ ok: false, message: MSG.spam });
    }
    return json_({ ok: false, message: 'Bạn kiểm tra lại vài thông tin giúp Bông Dua nhé.', errors: check.errors });
  }

  if (!underGlobalRateLimit_()) {
    return json_({ ok: false, message: 'Đang có nhiều người đăng ký cùng lúc. Bạn thử lại sau một phút nhé.' });
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sh = getSheet_();
    var d = check.data;

    // Chống double-submit / bấm hai lần: cùng số điện thoại trong 10 phút
    // -> trả lại đúng mã cũ, không tạo dòng mới.
    var existing = findRecentByPhone_(sh, d.phone);
    if (existing) {
      return json_({
        ok: true,
        duplicate: true,
        registration_id: existing,
        message: 'Bạn đã đăng ký rồi. Bông Dua dùng lại mã cũ cho bạn nhé.'
      });
    }

    var regId = uniqueRegistrationId_(sh);
    var now = new Date();

    sh.appendRow([
      now,
      regId,
      d.full_name,
      "'" + d.phone,            // dấu ' để Sheets giữ số 0 ở đầu
      d.email,
      d.social_handle,
      d.note,
      TICKET_PRICE,
      EVENT_DATE,
      STATUS_PENDING,
      '',
      sanitize_(body.source_url, 300),
      sanitize_(body.utm_source, 80),
      sanitize_(body.utm_medium, 80),
      sanitize_(body.utm_campaign, 120),
      sanitize_(body.utm_content, 120),
      sanitize_(body.referrer, 300),
      d.consent ? 'YES' : 'NO',
      sanitize_(body.user_agent, 300)
    ]);

    console.log('registered ' + regId);   // chỉ mã, không có PII
    return json_({ ok: true, registration_id: regId, payment_status: STATUS_PENDING });
  } finally {
    lock.releaseLock();
  }
}

function handlePaymentClaimed_(body) {
  var regId = clean_(body.registration_id);
  if (!isRegistrationId_(regId)) {
    return json_({ ok: false, message: 'Mã đăng ký không hợp lệ.' });
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sh = getSheet_();
    var col = HEADERS.indexOf('registration_id') + 1;
    var last = sh.getLastRow();
    if (last < 2) return json_({ ok: false, message: 'Không tìm thấy đăng ký này.' });

    var ids = sh.getRange(2, col, last - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]).trim() !== regId) continue;
      var row = i + 2;
      // Chỉ GHI NHẬN hành động, KHÔNG kết luận là đã thanh toán.
      sh.getRange(row, HEADERS.indexOf('payment_status') + 1).setValue(STATUS_CLAIMED);
      sh.getRange(row, HEADERS.indexOf('payment_claimed_at') + 1).setValue(new Date());
      console.log('claimed ' + regId);
      return json_({ ok: true, registration_id: regId, payment_status: STATUS_CLAIMED });
    }
    return json_({ ok: false, message: 'Không tìm thấy đăng ký này.' });
  } finally {
    lock.releaseLock();
  }
}

/* ------------------------------------------------------------------ UTILS */

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    setUp();
    sh = ss.getSheetByName(SHEET_NAME);
  }
  return sh;
}

/** Trả về registration_id cũ nếu số này vừa đăng ký trong DEDUPE_WINDOW_MS. */
function findRecentByPhone_(sh, phone) {
  var last = sh.getLastRow();
  if (last < 2) return null;
  var start = Math.max(2, last - 199);            // chỉ quét 200 dòng gần nhất
  var n = last - start + 1;
  var rows = sh.getRange(start, 1, n, HEADERS.length).getValues();
  var cutoff = Date.now() - DEDUPE_WINDOW_MS;
  var iCreated = HEADERS.indexOf('created_at');
  var iId = HEADERS.indexOf('registration_id');
  var iPhone = HEADERS.indexOf('phone');

  for (var i = rows.length - 1; i >= 0; i--) {
    var rowPhone = String(rows[i][iPhone]).replace(/^'/, '').trim();
    if (rowPhone !== phone) continue;
    var t = rows[i][iCreated];
    var ms = (t instanceof Date) ? t.getTime() : Date.parse(t);
    if (isNaN(ms) || ms >= cutoff) return String(rows[i][iId]).trim();
    return null;   // lần đăng ký gần nhất đã quá cũ -> cho đăng ký mới
  }
  return null;
}

function uniqueRegistrationId_(sh) {
  var last = sh.getLastRow();
  var known = {};
  if (last >= 2) {
    var col = HEADERS.indexOf('registration_id') + 1;
    var vals = sh.getRange(2, col, last - 1, 1).getValues();
    for (var i = 0; i < vals.length; i++) known[String(vals[i][0]).trim()] = true;
  }
  for (var k = 0; k < 30; k++) {
    var id = makeRegistrationId_(EVENT_DATE);
    if (!known[id]) return id;
  }
  // Cực hiếm: thêm hậu tố thời gian để chắc chắn không trùng.
  return makeRegistrationId_(EVENT_DATE) + String(Date.now()).slice(-2);
}

/** Throttle rất nhẹ ở mức toàn script, đủ chặn bot bắn liên tục. */
function underGlobalRateLimit_() {
  try {
    var cache = CacheService.getScriptCache();
    var key = 'rl_' + Math.floor(Date.now() / 60000);
    var n = parseInt(cache.get(key) || '0', 10) + 1;
    cache.put(key, String(n), 120);
    return n <= GLOBAL_MAX_PER_MINUTE;
  } catch (e) {
    return true;   // cache lỗi thì không chặn khách thật
  }
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
