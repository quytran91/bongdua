/**
 * ============================================================================
 *  BÔNG DUA FLEUR — Validate & tiện ích dùng chung
 * ============================================================================
 *  File này CỐ Ý không phụ thuộc DOM để:
 *    1. chạy được trong trình duyệt (index.html, tests/index.html)
 *    2. chạy được trong Node (`node tests/run.js`) nếu máy có cài Node
 *    3. copy nguyên sang Google Apps Script làm lớp validate phía server
 *
 *  Nguyên tắc: client validate chỉ là lớp hỗ trợ UX.
 *  Server (Apps Script) BẮT BUỘC validate lại bằng chính bộ hàm này.
 * ============================================================================
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BongDuaValidate = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var LIMITS = {
    name:   { min: 2,  max: 80 },
    email:  { max: 120 },
    social: { max: 120 },
    note:   { max: 600 },
  };

  /** Bỏ khoảng trắng thừa, gộp nhiều space thành một. */
  function clean(v) {
    if (v === null || v === undefined) return '';
    return String(v).replace(/\s+/g, ' ').trim();
  }

  /** Cắt ký tự điều khiển + giới hạn độ dài, chống chèn rác vào Sheet. */
  function sanitize(v, max) {
    var s = clean(v).replace(/[\u0000-\u001F\u007F]/g, '');
    if (max && s.length > max) s = s.slice(0, max);
    return s;
  }

  /**
   * Chuẩn hoá số điện thoại Việt Nam về dạng 0xxxxxxxxx.
   * Chấp nhận: 0912345678 · 0912 345 678 · 0912.345.678 · +84912345678 · 84912345678
   * Trả về null nếu không hợp lệ.
   */
  function normalizePhone(input) {
    if (input === null || input === undefined) return null;
    var raw = String(input).trim();
    // chỉ giữ chữ số và dấu + ở đầu
    var plus = raw.charAt(0) === '+';
    var d = raw.replace(/\D/g, '');
    if (!d) return null;

    if (plus || d.length > 10) {
      // dạng quốc tế: 84 + 9 số
      if (d.indexOf('84') === 0) d = '0' + d.slice(2);
    }
    if (d.length === 9 && d.charAt(0) !== '0') d = '0' + d; // người dùng quên số 0
    if (d.length !== 10) return null;
    // đầu số di động VN hiện hành: 03x 05x 07x 08x 09x
    if (!/^0(3|5|7|8|9)\d{8}$/.test(d)) return null;
    return d;
  }

  function isValidEmail(v) {
    var s = clean(v);
    if (!s) return false;
    if (s.length > LIMITS.email.max) return false;
    // đủ chặt cho form đăng ký, không cố bắt hết RFC 5322
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
    spam:         'Đăng ký chưa gửi được. Bạn thử lại sau ít phút nhé.',
  };

  /**
   * Validate payload đăng ký.
   * @returns {{ok: boolean, errors: Object, data: Object}}
   *   errors: { <field>: <thông báo tiếng Việt> }
   *   data:   payload đã sanitize + chuẩn hoá (chỉ đáng tin khi ok === true)
   */
  function validateRegistration(input) {
    var src = input || {};
    var errors = {};

    var name = sanitize(src.full_name, LIMITS.name.max);
    if (!name) errors.full_name = MSG.nameRequired;
    else if (name.length < LIMITS.name.min) errors.full_name = MSG.nameShort;
    else if (!/[A-Za-zÀ-ỹ]/.test(name)) errors.full_name = MSG.nameInvalid;

    var phoneRaw = clean(src.phone);
    var phone = normalizePhone(phoneRaw);
    if (!phoneRaw) errors.phone = MSG.phoneRequired;
    else if (!phone) errors.phone = MSG.phoneInvalid;

    var email = sanitize(src.email, LIMITS.email.max);
    if (email && !isValidEmail(email)) errors.email = MSG.emailInvalid;

    var note = sanitize(src.note, LIMITS.note.max + 1);
    if (note.length > LIMITS.note.max) errors.note = MSG.noteLong;

    // Trước đây đây là một ô tích BẮT BUỘC. Chủ dự án bỏ đi vì nhiều khách quên
    // tích rồi không gửi được form. Nay sự đồng ý là ngầm định khi bấm nút, và
    // câu giải thích được đặt ngay dưới nút để vẫn minh bạch.
    // Nếu form có gửi kèm consent thì vẫn tôn trọng giá trị đó.
    var consent = (src.consent === undefined || src.consent === null)
      ? true
      : (src.consent === true || src.consent === 'true' || src.consent === 'on' || src.consent === 1);

    // honeypot: chỉ bot mới điền
    var trap = clean(src.website);
    if (trap) errors._spam = MSG.spam;

    return {
      ok: Object.keys(errors).length === 0,
      errors: errors,
      data: {
        full_name: name,
        phone: phone || '',
        email: email,
        social_handle: sanitize(src.social_handle, LIMITS.social.max),
        note: note.slice(0, LIMITS.note.max),
        consent: consent,
      },
    };
  }

  /* ------------------------------------------------------- MÃ ĐĂNG KÝ ---- */
  // Bỏ 0/O/1/I để đọc qua điện thoại không nhầm.
  var ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  /**
   * Sinh mã đăng ký dễ đối soát: BD<MMYY sự kiện>-<4 ký tự>.
   * Ví dụ sự kiện 20/09/2026 -> "BD0926-AB12".
   * @param {string} eventISO  'YYYY-MM-DD'
   * @param {function} [rand]  hàm random [0,1) — cho phép inject khi test
   */
  function makeRegistrationId(eventISO, rand) {
    var r = rand || Math.random;
    var mm = '09', yy = '26';
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(eventISO || ''));
    if (m) { mm = m[2]; yy = m[1].slice(2); }
    var tail = '';
    for (var i = 0; i < 4; i++) tail += ALPHABET.charAt(Math.floor(r() * ALPHABET.length));
    return 'BD' + mm + yy + '-' + tail;
  }

  var ID_RE = /^BD\d{4}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/;
  function isRegistrationId(v) { return ID_RE.test(String(v || '')); }

  /** Nội dung chuyển khoản. Viết hoa, không dấu, để ngân hàng không cắt chữ. */
  function transferContent(prefix, regId) {
    return (String(prefix || 'BONGDUA') + ' ' + String(regId || '')).trim().toUpperCase();
  }

  /* ------------------------------------------------- CHỐNG DOUBLE-SUBMIT -- */
  /**
   * Khoá chống bấm gửi hai lần. Tách riêng để test được mà không cần DOM.
   * begin() trả false nếu đang có request chạy dở.
   */
  function createSubmitGuard() {
    var busy = false;
    return {
      begin: function () { if (busy) return false; busy = true; return true; },
      end: function () { busy = false; },
      isBusy: function () { return busy; },
    };
  }

  /* ------------------------------------------------- PAYLOAD GỬI ĐI ------ */
  /**
   * Đổi dữ liệu form đã validate sang ĐÚNG bộ khoá mà Apps Script đang nhận:
   * name, phone, email, social, note — không thừa, không thiếu khoá nào.
   * Tách riêng để test được mà không cần DOM hay mạng.
   */
  function toApiPayload(data) {
    var d = data || {};
    return {
      name: d.full_name || '',
      phone: d.phone || '',
      email: d.email || '',
      social: d.social_handle || '',
      note: d.note || '',
    };
  }

  /* ------------------------------------------------- ĐỌC PHẢN HỒI API ---- */
  /**
   * Chuyển phản hồi thô của Apps Script thành object, hoặc ném Error có
   * thông báo tiếng Việt. Tách riêng để test được các ca lỗi Google Sheets.
   * @param {boolean} httpOk  res.ok
   * @param {string}  text    body dạng text
   */
  function parseApiResponse(httpOk, text) {
    var raw = String(text === null || text === undefined ? '' : text).trim();

    // Apps Script deploy sai quyền ("Who has access" khác Anyone) trả về TRANG
    // HTML đăng nhập nhưng vẫn kèm HTTP 200. Phải bắt trước mọi thứ khác, nếu
    // không sẽ hiện QR trong khi đăng ký chẳng vào Sheet nào cả.
    if (raw.charAt(0) === '<') {
      throw new Error('Máy chủ trả về trang HTML thay vì dữ liệu. ' +
        'Kiểm tra lại quyền deploy Apps Script: "Who has access" phải là Anyone.');
    }

    if (!httpOk) {
      throw new Error('Máy chủ đang gặp sự cố.');
    }

    // doPost không trả gì -> Apps Script vẫn đã chạy xong. Coi là đã ghi.
    if (!raw) return { ok: true };

    var data;
    try { data = JSON.parse(raw); }
    catch (e) { return { ok: true, raw: raw }; }   // ví dụ trả về chữ "OK"

    if (!data || typeof data !== 'object') return { ok: true, raw: raw };

    // Chấp nhận cả {ok:true} lẫn {success:true}. Chỉ coi là hỏng khi máy chủ
    // NÓI RÕ là hỏng — không đoán mò.
    var failed = data.ok === false ||
                 data.success === false ||
                 (data.error !== undefined && data.error !== null && data.error !== '');
    if (failed) {
      var err = new Error(data.message || data.error || 'Máy chủ từ chối yêu cầu.');
      if (data.errors) err.fields = data.errors;
      throw err;
    }
    return data;
  }

  /** 488000 -> "488.000đ" */
  function formatVND(n) {
    var v = Math.round(Number(n) || 0);
    return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ';
  }

  return {
    LIMITS: LIMITS,
    MSG: MSG,
    clean: clean,
    sanitize: sanitize,
    normalizePhone: normalizePhone,
    isValidEmail: isValidEmail,
    validateRegistration: validateRegistration,
    makeRegistrationId: makeRegistrationId,
    isRegistrationId: isRegistrationId,
    transferContent: transferContent,
    formatVND: formatVND,
    createSubmitGuard: createSubmitGuard,
    toApiPayload: toApiPayload,
    parseApiResponse: parseApiResponse,
  };
});
