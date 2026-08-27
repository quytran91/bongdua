/**
 * ============================================================================
 *  BÔNG DUA FLEUR — Logic trang
 * ============================================================================
 *  Không có secret nào trong file này. Mọi thông tin nhạy cảm (service account,
 *  quyền ghi Sheet) nằm ở phía Google Apps Script.
 * ============================================================================
 */
(function () {
  'use strict';

  var C = window.BongDuaCore;
  var CFG = C.CFG, V = C.V, E = C.E, API = C.API;
  var $ = C.$, $$ = C.$$, track = C.track;

  /* ================================================ VALUE STACK ========= */
  function renderValueList() {
    var host = $('#value-list');
    if (!host) return;
    var items = (CFG.includes || []);
    host.innerHTML = '';
    items.forEach(function (it) {
      var li = document.createElement('li');
      li.className = 'value__item' + (it.confirmed ? '' : ' value__item--pending');

      var mark = document.createElement('span');
      mark.className = 'value__mark';
      mark.setAttribute('aria-hidden', 'true');
      mark.textContent = it.confirmed ? '✓' : '?';

      var body = document.createElement('div');
      var h = document.createElement('h3');
      h.textContent = it.label;
      if (!it.confirmed) {
        var tag = document.createElement('span');
        tag.className = 'value__pending';
        tag.textContent = 'đang xác nhận';
        h.appendChild(tag);
      }
      body.appendChild(h);

      var desc = it.desc || (it.confirmed ? '' : 'Bông Dua sẽ xác nhận mục này trước ngày diễn ra.');
      if (desc) {
        var p = document.createElement('p');
        p.textContent = desc;
        body.appendChild(p);
      }

      li.appendChild(mark);
      li.appendChild(body);
      host.appendChild(li);
    });
  }

  /* ================================================= REVEAL / MOTION ==== */
  function setupReveal() {
    var targets = $$('.section-title, .story__lead, .story__beat, .story__close, .act, .proof__text, .proof__fig, .value__list, .value__price, .checkin__fig, .checkin__text, .gallery__item, .founder__fig, .founder__text, .info__grid, .faq__list, .closing__title, .closing__body');
    if (!('IntersectionObserver' in window) ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    targets.forEach(function (el) { el.classList.add('reveal'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* ==================================================== STICKY CTA ====== */
  function setupSticky() {
    var bar = $('#sticky-cta');
    var hero = $('.hero');
    var signup = $('#dang-ky');
    if (!bar || !hero) return;
    bar.hidden = false;

    var pastHero = false, atForm = false, blocked = false;

    function apply() {
      var on = pastHero && !atForm && !blocked;
      bar.classList.toggle('is-on', on);
      // khi ẩn thì cũng loại khỏi tab order để không "bẫy" bàn phím
      bar.setAttribute('aria-hidden', on ? 'false' : 'true');
      $$('a, button', bar).forEach(function (el) {
        if (on) el.removeAttribute('tabindex'); else el.setAttribute('tabindex', '-1');
      });
    }
    apply();

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        pastHero = !en[0].isIntersecting; apply();
      }, { threshold: 0.02 }).observe(hero);

      if (signup) {
        new IntersectionObserver(function (en) {
          atForm = en[0].isIntersecting; apply();
        }, { threshold: 0.06 }).observe(signup);
      }
    } else {
      window.addEventListener('scroll', function () {
        pastHero = window.scrollY > window.innerHeight * 0.8; apply();
      }, { passive: true });
    }

    // Bàn phím ảo mở trên mobile -> nhấc sticky đi để không che input
    $$('input, textarea').forEach(function (el) {
      el.addEventListener('focus', function () { blocked = true; apply(); });
      el.addEventListener('blur', function () {
        setTimeout(function () {
          var ae = document.activeElement;
          if (!ae || !/^(INPUT|TEXTAREA)$/.test(ae.tagName)) { blocked = false; apply(); }
        }, 120);
      });
    });

    // Modal đang mở -> ẩn sticky
    document.addEventListener('bongdua:overlay', function (e) {
      blocked = !!e.detail.open; apply();
    });
  }

  /* ================================================ OVERLAY / A11Y ====== */
  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
  var overlayStack = [];

  function openOverlay(root, panel) {
    overlayStack.push({ root: root, panel: panel, prev: document.activeElement });
    root.hidden = false;
    document.body.classList.add('is-locked');
    document.dispatchEvent(new CustomEvent('bongdua:overlay', { detail: { open: true } }));
    // Focus ngay (rAF có thể bị hoãn khi tab ở nền -> bẫy focus sẽ hỏng),
    // rồi focus lại sau 1 frame khi layout đã ổn định.
    panel.focus();
    requestAnimationFrame(function () {
      if (!root.hidden && !root.contains(document.activeElement)) panel.focus();
    });
  }

  function closeOverlay() {
    var top = overlayStack.pop();
    if (!top) return;
    top.root.hidden = true;
    if (!overlayStack.length) {
      document.body.classList.remove('is-locked');
      document.dispatchEvent(new CustomEvent('bongdua:overlay', { detail: { open: false } }));
    }
    if (top.prev && top.prev.focus) top.prev.focus();
  }

  document.addEventListener('keydown', function (e) {
    if (!overlayStack.length) return;
    var top = overlayStack[overlayStack.length - 1];

    if (e.key === 'Escape') { e.preventDefault(); closeOverlay(); return; }
    if (e.key !== 'Tab') return;

    var items = $$(FOCUSABLE, top.panel).filter(function (el) {
      return el.offsetParent !== null || el === top.panel;
    });
    if (!items.length) { e.preventDefault(); top.panel.focus(); return; }

    var first = items[0], last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === top.panel)) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  });

  $$('[data-close-modal]').forEach(function (el) { el.addEventListener('click', closeOverlay); });
  $$('[data-close-lightbox]').forEach(function (el) { el.addEventListener('click', closeOverlay); });

  /* ==================================================== LIGHTBOX ======== */
  function setupLightbox() {
    var box = $('#lightbox'), panel = $('#lightbox-panel'), img = $('#lightbox-img');
    var src = $('#proof-img');
    if (!box || !panel || !img || !src) return;

    $$('[data-lightbox]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        img.src = src.currentSrc || src.src;
        img.alt = src.alt;
        openOverlay(box, panel);
        track('proof_zoom');
      });
    });
    // bấm thẳng vào ảnh cũng mở được
    src.style.cursor = 'zoom-in';
    src.addEventListener('click', function () { $('[data-lightbox]').click(); });
  }

  /* ================================================ UTM / NGUỒN ======== */
  function collectSource() {
    var q = new URLSearchParams(window.location.search);
    return {
      source_url: window.location.origin + window.location.pathname,
      utm_source: q.get('utm_source') || '',
      utm_medium: q.get('utm_medium') || '',
      utm_campaign: q.get('utm_campaign') || '',
      utm_content: q.get('utm_content') || '',
      referrer: document.referrer || '',
      user_agent: navigator.userAgent || '',
    };
  }

  /* ====================================================== API =========== */
  // Endpoint Apps Script được ưu tiên: nó xác nhận được kết quả.
  // Google Form chỉ dùng khi KHÔNG có endpoint.
  var GFORM = (!API.endpoint && API.googleForm && API.googleForm.formId &&
               API.googleForm.entries && API.googleForm.entries.phone) ? API.googleForm : null;
  var DEMO = !API.endpoint && !GFORM;

  /**
   * Gọi Apps Script Web App.
   *
   * BẮT BUỘC dùng Content-Type 'text/plain'. Đây là điểm dễ sai nhất:
   * 'application/json' biến request thành "non-simple", trình duyệt phải gửi
   * OPTIONS preflight trước — mà Apps Script không trả lời OPTIONS, nên request
   * chết ngay tại CORS. Với text/plain thì đây là "simple request", trình duyệt
   * gửi thẳng, đi theo redirect sang script.googleusercontent.com và đọc được
   * response (đã kiểm chứng: trả {"success":true} kèm ACAO: *).
   *
   * Apps Script vẫn nhận nguyên chuỗi JSON qua e.postData.contents.
   */
  function callApi(payload) {
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, API.timeoutMs || 15000);

    return fetch(API.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      signal: ctrl ? ctrl.signal : undefined,
      redirect: 'follow',
    }).then(function (res) {
      return res.text().then(function (txt) {
        return V.parseApiResponse(res.ok, txt);
      });
    }).finally(function () { clearTimeout(timer); });
  }

  /**
   * Gửi vào Google Form có sẵn.
   * Google Form không trả CORS header nên bắt buộc dùng no-cors: trình duyệt
   * gửi được nhưng KHÔNG đọc được kết quả. Ta chỉ biết "đã gửi đi", không biết
   * "đã ghi xong" — README nói rõ hạn chế này và khuyên dùng Apps Script.
   */
  function postGoogleForm(payload, regId) {
    var fd = new FormData();
    var e = GFORM.entries;
    var map = {
      full_name: payload.full_name,
      phone: payload.phone,
      email: payload.email,
      social_handle: payload.social_handle,
      note: payload.note,
      registration_id: regId,
    };
    Object.keys(map).forEach(function (k) {
      if (e[k] && map[k]) fd.append(e[k], map[k]);
    });

    var url = 'https://docs.google.com/forms/d/e/' +
      encodeURIComponent(GFORM.formId) + '/formResponse';

    return fetch(url, { method: 'POST', mode: 'no-cors', body: fd })
      .then(function () { return { ok: true, registration_id: regId, unverified: true }; });
  }

  /* ====================================================== FORM ========== */
  // Trang chuyển khoản là một trang RIÊNG, không phải popup: khách dùng điện
  // thoại nhiều nên một trang thật đáng tin hơn (bấm Back được, tải lại được,
  // không bị chặn, không kẹt trong khung cuộn nhỏ).
  var PAYMENT_PAGE = (CFG.site && CFG.site.paymentPage) || 'thanh-toan.html';
  var lastName = '';

  var FIELD_ERR = {
    full_name: '#e-name', phone: '#e-phone', email: '#e-email',
    note: '#e-form', _spam: '#e-form',
  };
  var FIELD_INPUT = {
    full_name: '#f-name', phone: '#f-phone', email: '#f-email',
    note: '#f-note',
  };

  function clearErrors() {
    Object.keys(FIELD_ERR).forEach(function (k) {
      var el = $(FIELD_ERR[k]);
      if (el) { el.hidden = true; el.textContent = ''; }
    });
    Object.keys(FIELD_INPUT).forEach(function (k) {
      var el = $(FIELD_INPUT[k]);
      if (el) el.removeAttribute('aria-invalid');
    });
    var f = $('#e-form');
    if (f) { f.hidden = true; f.textContent = ''; }
  }

  function showErrors(errors) {
    var firstEl = null;
    Object.keys(errors).forEach(function (k) {
      var target = $(FIELD_ERR[k] || '#e-form');
      if (target) {
        target.textContent = errors[k];
        target.hidden = false;
      }
      var input = $(FIELD_INPUT[k]);
      if (input) {
        input.setAttribute('aria-invalid', 'true');
        if (!firstEl) firstEl = input;
      }
    });
    if (firstEl) {
      firstEl.focus({ preventScroll: true });
      firstEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }

  function formError(msg) {
    var el = $('#e-form');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  function setupForm() {
    var form = $('#register-form');
    var btn = $('#submit-btn');
    if (!form || !btn || !V) return;

    if (DEMO) {
      var banner = $('#demo-banner');
      if (banner) banner.hidden = false;
    }

    var started = false;
    form.addEventListener('input', function () {
      if (!started) { started = true; track('form_start'); }
    }, { once: false });

    var guard = V.createSubmitGuard();

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (guard.isBusy()) return;             // chống double-submit

      clearErrors();

      var fd = new FormData(form);
      var raw = {
        full_name: fd.get('full_name'),
        phone: fd.get('phone'),
        email: fd.get('email'),
        social_handle: fd.get('social_handle'),
        note: fd.get('note'),
        website: fd.get('website'),
      };

      var check = V.validateRegistration(raw);
      if (!check.ok) {
        showErrors(check.errors);
        track('form_validation_error', { fields: Object.keys(check.errors).join(',') });
        return;
      }

      if (!guard.begin()) return;
      btn.setAttribute('aria-busy', 'true');
      btn.disabled = true;

      // Apps Script đang nhận ĐÚNG 5 khoá này. Không gửi thừa khoá nào để
      // khỏi lệch với cấu trúc cột bên Sheet.
      var payload = V.toApiPayload(check.data);

      // UTM/nguồn vẫn được ghi vào analytics để biết khách đến từ đâu,
      // nhưng không gửi sang Sheet vì script chưa có cột tương ứng.
      var source = collectSource();

      // Giữ lại tên để dựng nội dung chuyển khoản có tên khách.
      lastName = check.data.full_name;

      var work;
      if (DEMO) {
        work = Promise.resolve({
          ok: true, demo: true,
          registration_id: V.makeRegistrationId(E.dateISO),
        });
      } else if (GFORM) {
        work = postGoogleForm(payload, V.makeRegistrationId(E.dateISO));
      } else {
        work = callApi(payload);
      }

      work.then(function (res) {
        // Apps Script hiện tại chỉ trả {"success":true}, không sinh mã đăng ký.
        // Mã chỉ dùng để hiển thị / dựng nội dung chuyển khoản, nên nếu máy chủ
        // không trả về thì tự sinh ở client. KHÔNG được coi đây là lỗi — làm
        // vậy sẽ chặn mất popup QR dù đăng ký đã ghi vào Sheet thành công.
        var id = (res && V.isRegistrationId(res.registration_id))
          ? res.registration_id
          : V.makeRegistrationId(E.dateISO);
        track('form_submit_success', {
          registration_id: id, demo: !!res.demo, unverified: !!res.unverified,
          utm_source: source.utm_source, utm_medium: source.utm_medium,
          utm_campaign: source.utm_campaign, referrer: source.referrer,
        });
        // Chỉ reset form khi đã ghi thành công. Submit lỗi -> giữ nguyên dữ liệu.
        form.reset();
        started = false;

        // Gửi tên + mã sang trang chuyển khoản qua sessionStorage (không đưa
        // tên khách lên thanh địa chỉ). Trang kia vẫn chạy được nếu đọc hỏng.
        C.saveBooking({
          name: lastName,
          regId: id,
          demo: !!res.demo,
          unverified: !!res.unverified,
        });

        window.location.href = PAYMENT_PAGE;
      }).catch(function (err) {
        // Bất kể lỗi gì: KHÔNG mở popup QR. Khách phải biết là chưa gửi được.
        var KEEP = ' Thông tin bạn nhập vẫn còn nguyên, bạn thử lại giúp Bông Dua nhé.';

        if (err && err.fields) {
          showErrors(err.fields);
        } else if (err && err.name === 'AbortError') {
          formError('Mạng hơi chậm nên chưa gửi được.' + KEEP);
        } else if (err && (err.name === 'TypeError' || /failed to fetch|networkerror|load failed/i.test(err.message || ''))) {
          // Lỗi mạng của trình duyệt có message tiếng Anh - không đưa thẳng cho khách.
          formError('Không kết nối được tới máy chủ. Bạn kiểm tra mạng rồi thử lại giúp Bông Dua nhé.' +
            ' Nếu vẫn không được, nhắn Zalo/Facebook cho Bông Dua cũng được nhé.');
        } else {
          var msg = (err && err.message) ? String(err.message).trim() : 'Có lỗi xảy ra.';
          if (!/[.!?…]$/.test(msg)) msg += '.';
          formError(msg + KEEP);
        }
        track('form_submit_error', { message: err && err.message });
      }).finally(function () {
        guard.end();
        btn.removeAttribute('aria-busy');
        btn.disabled = false;
      });
    });
  }

  /* ==================================================== TRACK CTA ======= */
  function setupTracking() {
    $$('[data-track]').forEach(function (el) {
      if (el.id === 'submit-btn' || el.id === 'claim-btn' || el.id === 'copy-content') return;
      el.addEventListener('click', function () { track(el.getAttribute('data-track')); });
    });
  }

  /* ========================================================= INIT ======= */
  function init() {
    C.applyBindings();
    renderValueList();
    C.renderFooter();
    setupReveal();
    setupSticky();
    setupLightbox();
    setupForm();
    setupTracking();
    track('page_view');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else init();
})();
