/**
 * ============================================================================
 *  BÔNG DUA FLEUR — Phần dùng chung cho mọi trang
 * ============================================================================
 *  Dùng bởi cả index.html (trang chính) và thanh-toan.html (trang chuyển khoản).
 *  Không đụng tới DOM đặc thù của trang nào — mỗi trang tự lo phần của mình.
 * ============================================================================
 */
(function (root) {
  'use strict';

  var CFG = window.BONGDUA_CONFIG || {};
  var V = window.BongDuaValidate;
  var E = CFG.event || {};
  var PAY = CFG.payment || {};
  var CONTACT = CFG.contact || {};
  var POLICY = CFG.policy || {};
  var API = CFG.api || {};

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ======================================================== ANALYTICS ==== */
  /**
   * Lớp trừu tượng analytics. Hoạt động ngay cả khi chưa gắn provider nào:
   * event được đẩy vào window.dataLayer (GTM đọc được sau này) và vào
   * window.__bongduaEvents để QA/kiểm thử đọc lại.
   */
  var track = (function () {
    window.dataLayer = window.dataLayer || [];
    window.__bongduaEvents = [];
    return function (name, payload) {
      var evt = { event: name, ts: new Date().toISOString() };
      if (payload) for (var k in payload) if (payload.hasOwnProperty(k)) evt[k] = payload[k];
      window.dataLayer.push(evt);
      window.__bongduaEvents.push(evt);
      if (CFG.analytics && CFG.analytics.debug && window.console) console.log('[track]', evt);
    };
  })();

  /* ================================================ GIÁ TRỊ DẪN XUẤT ==== */
  var HAS_PLACE = !!(E.cafeName || E.cafeAddress);
  var PLACE_FALLBACK = 'Một quán café ấm cúng — Bông Dua sẽ báo địa chỉ khi xác nhận chỗ.';

  function placeShort() {
    if (E.cafeName) return E.cafeName;
    if (E.cafeAddress) return E.cafeAddress;
    return 'Sẽ báo khi xác nhận chỗ';
  }
  function placeFull() {
    if (!HAS_PLACE) return PLACE_FALLBACK;
    return [E.cafeName, E.cafeAddress].filter(Boolean).join(' — ');
  }

  /* ================================================== ƯU ĐÃI CÓ HẠN ==== */
  /**
   * Tính trạng thái ưu đãi từ ngày thật của máy khách.
   *
   * Vì sao tính động chứ không viết chữ cứng: một dòng "Ưu đãi hôm nay" viết
   * cứng thì hôm nay đúng, nhưng tuần sau vẫn ghi y hệt — khách quay lại lần
   * hai sẽ nhận ra và bắt đầu nghi ngờ luôn cả giá gốc. Ở đây số ngày còn lại
   * là thật, và hết hạn thì toàn bộ khối ưu đãi TỰ BIẾN MẤT.
   */
  var PROMO = (function () {
    var off = { active: false };
    var oldV = Number(E.priceOriginalVND) || 0;
    var newV = Number(E.priceVND) || 0;
    if (!V || !oldV || !newV || oldV <= newV) return off;

    var daysLeft = null;
    if (E.promoDeadlineISO) {
      var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(E.promoDeadlineISO);
      if (m) {
        // Hạn tính đến HẾT ngày đó, theo giờ máy khách.
        var end = new Date(+m[1], +m[2] - 1, +m[3], 23, 59, 59);
        var now = new Date();
        if (now > end) return off;                       // hết hạn -> ẩn sạch
        daysLeft = Math.ceil((end - now) / 86400000);
      }
    }

    var pct = Math.floor((oldV - newV) / oldV * 100);
    var deadlineShort = '';
    if (E.promoDeadlineISO) {
      var d = E.promoDeadlineISO.split('-');
      deadlineShort = d[2] + '.' + d[1];
    }

    var countdown = '';
    if (daysLeft === 1) countdown = 'Chỉ còn hôm nay';
    else if (daysLeft !== null) countdown = 'Còn ' + daysLeft + ' ngày';

    return {
      active: true,
      oldLabel: V.formatVND(oldV),
      newLabel: E.priceLabel || V.formatVND(newV),
      saveLabel: V.formatVND(oldV - newV),
      percentLabel: '−' + pct + '%',
      note: E.promoNote || '',
      daysLeft: daysLeft,
      countdown: countdown,
      afterNote: deadlineShort
        ? 'Sau ' + deadlineShort + ' giá về ' + V.formatVND(oldV)
        : '',
    };
  })();

  var DERIVED = {
    'event.dateShort':  E.dateShort || '',
    'event.dateLabel':  E.dateLabel || E.dateShort || '',
    'event.priceLabel': E.priceLabel || (V ? V.formatVND(E.priceVND) : ''),

    'event.priceOriginal': PROMO.active ? PROMO.oldLabel : '',
    'event.priceSave': PROMO.active ? PROMO.saveLabel : '',
    'event.promoNote': PROMO.active ? PROMO.note : '',
    'event.promoDeadline': PROMO.active ? PROMO.countdown : '',

    'hero.time':  E.timeLabel || E.durationLabel || '',
    'hero.place': placeShort(),

    'info.time':  E.timeLabel
      ? E.timeLabel + (E.durationLabel ? ' (' + String(E.durationLabel).toLowerCase() + ')' : '')
      : (E.durationLabel || 'Sẽ báo khi xác nhận chỗ'),
    'info.place': placeFull() + (E.cafeNote ? ' · ' + E.cafeNote : ''),
    'info.dresscode': (E.dresscode && E.dresscode.length)
      ? E.dresscode.join(' · ') + ' — tông sáng giúp bạn nổi bật giữa hoa và lên ảnh đẹp hơn.'
      : '',

    'closing.place': placeShort(),

    'founder.line': E.founderName
      ? E.founderName + ' — ' + (E.founderRole || '')
      : (E.founderRole || 'Chủ shop Bông Dua Fleur'),

    'checkin.photoNote': POLICY.photoDelivery ||
      'Thời gian gửi ảnh sẽ được Bông Dua báo cụ thể khi xác nhận chỗ.',

    'faq.dresscode': (E.dresscode && E.dresscode.length)
      ? 'Dresscode gợi ý: ' + E.dresscode.join(', ') + '. Đây chỉ là gợi ý để bộ ảnh của cả nhóm hài hoà, không bắt buộc.'
      : '',
    'faq.photoDelivery': POLICY.photoDelivery ||
      'Số lượng ảnh và thời gian gửi ảnh sẽ được Bông Dua báo cụ thể khi xác nhận chỗ cho bạn.',
    'faq.refund': POLICY.refund || POLICY.transfer ||
      'Chính sách hoàn / huỷ / đổi người tham dự vui lòng liên hệ trực tiếp Bông Dua Fleur để được hỗ trợ.',
  };

  function applyBindings() {
    $$('[data-cfg]').forEach(function (el) {
      var key = el.getAttribute('data-cfg');
      if (!DERIVED.hasOwnProperty(key)) return;
      var val = DERIVED[key];
      if (val === '' || val === null || val === undefined) {
        // Không có dữ liệu -> XOÁ chữ rồi ẩn, bất kể thẻ gì.
        // Trước đây chỉ ẩn thẻ <p>, nên khi ưu đãi hết hạn thì mấy thẻ <span>
        // vẫn giữ nguyên chữ mẫu viết sẵn trong HTML ("Còn 14 ngày") — tức là
        // trang nói dối khách đúng vào lúc không ai để ý nữa.
        el.textContent = '';
        el.hidden = true;
        return;
      }
      el.hidden = false;
      el.textContent = val;
    });

    // Hết ưu đãi (hoặc không cấu hình) -> gỡ sạch mọi dấu vết ưu đãi
    if (!PROMO.active) {
      $$('[data-cfg-row="promo"], [data-offer]').forEach(function (el) { el.remove(); });
    } else {
      renderOffers();
    }

    // Các hàng chỉ hiện khi có dữ liệu
    var dressRow = $('[data-cfg-row="dresscode"]');
    if (dressRow && !DERIVED['info.dresscode']) dressRow.remove();
    var lastRow = $('[data-cfg-row="lastOfYear"]');
    if (lastRow && !E.isLastOfYear) lastRow.remove();

    // Canonical + OG từ config
    if (CFG.site && CFG.site.canonical) {
      var c = $('link[rel="canonical"]');
      if (c) c.setAttribute('href', CFG.site.canonical);
    }
  }

  /* ==================================================== THẺ ƯU ĐÃI ====== */
  /**
   * Dựng thẻ ưu đãi vào mọi phần tử [data-offer]. Một nguồn duy nhất nên 4 chỗ
   * trên trang không bao giờ lệch nhau.
   * Thêm data-offer="slim" để lấy bản gọn (dùng ở banner, nơi phải tiết kiệm
   * chiều cao để nút Giữ chỗ còn nằm trong màn hình đầu).
   */
  function renderOffers() {
    $$('[data-offer]').forEach(function (host) {
      var slim = host.getAttribute('data-offer') === 'slim';
      host.classList.add('offer');
      if (slim) host.classList.add('offer--slim');
      host.innerHTML = '';

      var top = document.createElement('div');
      top.className = 'offer__top';

      var pct = document.createElement('span');
      pct.className = 'offer__pct';
      pct.textContent = PROMO.percentLabel;
      top.appendChild(pct);

      if (PROMO.note) {
        var lb = document.createElement('span');
        lb.className = 'offer__label';
        lb.textContent = PROMO.note;
        top.appendChild(lb);
      }
      host.appendChild(top);

      var prices = document.createElement('p');
      prices.className = 'offer__prices';
      var o = document.createElement('s');
      o.className = 'offer__old';
      o.textContent = PROMO.oldLabel;
      var n = document.createElement('strong');
      n.className = 'offer__new';
      n.textContent = PROMO.newLabel;
      var u = document.createElement('span');
      u.className = 'offer__unit';
      u.textContent = '/ người';
      prices.appendChild(o); prices.appendChild(n); prices.appendChild(u);
      host.appendChild(prices);

      if (!slim) {
        var note = document.createElement('p');
        note.className = 'offer__note';
        note.textContent = 'Tiết kiệm ' + PROMO.saveLabel +
          (PROMO.afterNote ? '. ' + PROMO.afterNote + '.' : '.');
        host.appendChild(note);
      }

      if (PROMO.countdown) {
        var dl = document.createElement('p');
        dl.className = 'offer__deadline';
        var dot = document.createElement('span');
        dot.className = 'offer__dot';
        dot.setAttribute('aria-hidden', 'true');
        dl.appendChild(dot);
        dl.appendChild(document.createTextNode(
          PROMO.countdown + (slim ? '' : ' để giữ mức giá này')));
        host.appendChild(dl);
      }
    });
  }

  /* ==================================================== FOOTER ========== */
  function renderFooter() {
    var list = $('#footer-links');
    var fb = $('#footer-fallback');
    var addr = $('#footer-addr');
    if (!list) return;

    var links = [];
    if (CONTACT.hotline) links.push({ label: 'Hotline ' + CONTACT.hotline, href: 'tel:' + CONTACT.hotline.replace(/\s/g, '') });
    if (CONTACT.zalo) links.push({ label: 'Zalo', href: 'https://zalo.me/' + CONTACT.zalo.replace(/\D/g, '') });
    if (CONTACT.email) links.push({ label: CONTACT.email, href: 'mailto:' + CONTACT.email });
    if (CONTACT.facebook) links.push({ label: 'Facebook', href: CONTACT.facebook });
    if (CONTACT.instagram) links.push({ label: 'Instagram', href: CONTACT.instagram });

    list.innerHTML = '';
    links.forEach(function (l) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = l.href;
      a.textContent = l.label;
      if (/^https?:/.test(l.href)) { a.rel = 'noopener'; a.target = '_blank'; }
      li.appendChild(a);
      list.appendChild(li);
    });

    if (!links.length && fb) fb.textContent = CONTACT.fallbackNote || '';
    if (addr && HAS_PLACE) addr.textContent = placeFull();

    // Link chính sách riêng tư: chỉ hiện khi đã có URL, không để lộ placeholder.
    var pl = $('#privacy-link');
    if (pl && CONTACT.privacyUrl) {
      pl.appendChild(document.createTextNode(' '));
      var pa = document.createElement('a');
      pa.href = CONTACT.privacyUrl;
      pa.textContent = 'Chính sách riêng tư';
      pa.rel = 'noopener';
      pa.target = '_blank';
      pl.appendChild(pa);
    }
  }

  /* ============================================== DỮ LIỆU GIỮA 2 TRANG ==== */
  /**
   * Trang đăng ký và trang chuyển khoản là hai trang riêng biệt. Dữ liệu đi kèm
   * (tên khách, mã giữ chỗ) được gửi qua sessionStorage chứ KHÔNG qua query
   * string — tên khách là thông tin cá nhân, không nên nằm trên thanh địa chỉ,
   * trong lịch sử trình duyệt hay trong referrer gửi sang bên thứ ba.
   *
   * sessionStorage có thể bị chặn (chế độ riêng tư, trình duyệt khoá site data)
   * nên mọi lời gọi đều bọc try/catch và trang chuyển khoản vẫn chạy được khi
   * không đọc được gì.
   */
  var BOOKING_KEY = 'bongdua:booking';

  function saveBooking(data) {
    try {
      sessionStorage.setItem(BOOKING_KEY, JSON.stringify(data));
      return true;
    } catch (e) { return false; }
  }

  function readBooking() {
    try {
      var raw = sessionStorage.getItem(BOOKING_KEY);
      if (!raw) return null;
      var d = JSON.parse(raw);
      return (d && typeof d === 'object') ? d : null;
    } catch (e) { return null; }
  }

  function clearBooking() {
    try { sessionStorage.removeItem(BOOKING_KEY); } catch (e) {}
  }

  /* ========================================================= XUẤT RA ===== */
  root.BongDuaCore = {
    CFG: CFG, V: V, E: E, PAY: PAY, CONTACT: CONTACT, POLICY: POLICY, API: API,
    $: $, $$: $$,
    track: track,
    DERIVED: DERIVED,
    applyBindings: applyBindings,
    renderFooter: renderFooter,
    placeShort: placeShort,
    placeFull: placeFull,
    PROMO: PROMO,
    renderOffers: renderOffers,
    saveBooking: saveBooking,
    readBooking: readBooking,
    clearBooking: clearBooking,
  };
})(typeof self !== 'undefined' ? self : this);
