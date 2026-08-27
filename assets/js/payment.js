/**
 * ============================================================================
 *  BÔNG DUA FLEUR — Trang chuyển khoản (thanh-toan.html)
 * ============================================================================
 *  Đây là một TRANG THẬT, không phải popup. Lý do: khách chủ yếu dùng điện
 *  thoại — một trang riêng thì bấm Back được, tải lại được, lưu link được,
 *  không bị kẹt trong khung cuộn nhỏ và không phụ thuộc vào việc modal có
 *  render kịp hay không.
 *
 *  Trang này KHÔNG gửi gì lên máy chủ. Việc ghi đăng ký đã xong ở trang trước.
 * ============================================================================
 */
(function () {
  'use strict';

  var C = window.BongDuaCore;
  var V = C.V;
  var E = C.E, PAY = C.PAY, CONTACT = C.CONTACT, API = C.API;
  var $ = C.$, $$ = C.$$, track = C.track;

  var booking = C.readBooking() || {};
  var customerName = C.V.clean(booking.name || '');
  var regId = V.isRegistrationId(booking.regId)
    ? booking.regId
    : V.makeRegistrationId(E.dateISO);

  var currentQrUrl = '';

  /* ------------------------------------------------- NỘI DUNG CHUYỂN KHOẢN */
  function transferContent() {
    if (PAY.transferTemplate) {
      return PAY.transferTemplate
        .replace('{ten}', customerName)
        .replace('{ma}', regId)
        .replace(/\s+/g, ' ')
        .trim();
    }
    return V.transferContent(PAY.transferPrefix, regId);
  }

  /* ------------------------------------------------------------------ QR --- */
  function buildQr() {
    if (PAY.staticQrPath) return { url: PAY.staticQrPath, dynamic: false };
    if (PAY.bankBin && PAY.accountNumber) {
      var url = 'https://img.vietqr.io/image/' +
        encodeURIComponent(PAY.bankBin) + '-' + encodeURIComponent(PAY.accountNumber) +
        '-' + encodeURIComponent(PAY.vietqrTemplate || 'compact2') + '.png' +
        '?amount=' + encodeURIComponent(E.priceVND || 0) +
        '&addInfo=' + encodeURIComponent(transferContent()) +
        (PAY.accountName ? '&accountName=' + encodeURIComponent(PAY.accountName) : '');
      return { url: url, dynamic: true };
    }
    return null;
  }

  function missingBox(text) {
    var box = document.createElement('div');
    box.className = 'pay__missing';
    box.textContent = text;
    return box;
  }

  function renderQr() {
    var host = $('#pay-qr');
    var saveBtn = $('#save-qr');
    if (!host) return;
    host.innerHTML = '';
    currentQrUrl = '';

    var qr = buildQr();
    if (!qr) {
      // Chưa có thông tin ngân hàng -> KHÔNG dựng QR giả.
      var box = document.createElement('div');
      box.className = 'pay__missing';
      var s = document.createElement('strong');
      s.textContent = 'Thông tin chuyển khoản đang được cập nhật';
      box.appendChild(s);
      box.appendChild(document.createTextNode(
        'Bông Dua sẽ liên hệ và gửi thông tin chuyển khoản ' +
        (C.DERIVED['event.priceLabel'] || '') + ' cho bạn ngay.'
      ));
      host.appendChild(box);
      if (saveBtn) saveBtn.hidden = true;
      return;
    }

    var img = document.createElement('img');
    img.src = qr.url;
    img.decoding = 'async';
    img.alt = 'Mã QR chuyển khoản ' + (C.DERIVED['event.priceLabel'] || '') +
              ' tới ' + (PAY.bankName || 'ngân hàng') + ' ' + (PAY.accountNumber || '') +
              ' — ' + (PAY.accountName || 'Bông Dua Fleur');
    img.addEventListener('error', function () {
      host.innerHTML = '';
      host.appendChild(missingBox(
        'Không tải được mã QR. Bạn chuyển khoản theo thông tin bên dưới giúp Bông Dua nhé.'));
      if (saveBtn) saveBtn.hidden = true;
    });

    // Bọc trong <a>: chạm vào ảnh là mở mã QR cỡ lớn ở tab mới,
    // trên điện thoại giữ để lưu về máy rất nhanh.
    var link = document.createElement('a');
    link.href = qr.url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.className = 'pay__qrlink';
    link.setAttribute('aria-label', 'Mở ảnh mã QR ở cỡ lớn để lưu về máy');
    link.addEventListener('click', function () { track('open_qr_image'); });
    link.appendChild(img);

    var hint = document.createElement('span');
    hint.className = 'pay__qrhint';
    hint.textContent = 'Chạm vào mã QR để mở ảnh · giữ để lưu về máy';

    host.appendChild(link);
    host.appendChild(hint);
    currentQrUrl = qr.url;
    if (saveBtn) saveBtn.hidden = false;
  }

  /* ------------------------------------------------------ THÔNG TIN NGÂN HÀNG */
  function renderRows() {
    function row(rowId, valueId, value) {
      var r = $(rowId);
      if (!r) return;
      if (value) { r.hidden = false; $(valueId).textContent = value; }
      else r.hidden = true;
    }
    row('#row-bank', '#pay-bank', PAY.bankName);
    row('#row-acc', '#pay-acc', PAY.accountNumber);
    row('#row-name', '#pay-name', PAY.accountName);
    $('#pay-content').textContent = transferContent();

    var idRow = $('#row-regid');
    if (idRow) {
      idRow.hidden = (PAY.showRegistrationId === false);
      $('#reg-id').textContent = regId;
    }
  }

  /* ---------------------------------------------------------- LỜI CHÀO ----- */
  function renderGreeting() {
    var hello = $('#pay-hello');
    var back = $('#no-booking');

    if (customerName) {
      hello.textContent = 'Cảm ơn ' + customerName +
        ' nhé. Bông Dua đã nhận được thông tin của bạn.';
      if (back) back.hidden = true;
    } else {
      // Vào thẳng trang này mà chưa điền form (mở lại link, đổi tab, chặn
      // sessionStorage...). Vẫn cho xem QR vì đó là thông tin công khai,
      // nhưng nhắc rõ là chưa có đăng ký nào được ghi nhận.
      hello.textContent = 'Đây là thông tin chuyển khoản của workshop.';
      if (back) back.hidden = false;
    }

    if (booking.demo) {
      var d = $('#demo-note');
      if (d) d.hidden = false;
    }
  }

  /* -------------------------------------------------- ZALO / FACEBOOK ------ */
  function renderSocialLinks() {
    var host = $('#social-links');
    var wrap = $('#pay-social');
    if (!host) return;
    host.innerHTML = '';

    var items = [];
    if (CONTACT.zalo) {
      items.push({
        cls: 'social__btn social__btn--zalo',
        href: 'https://zalo.me/' + CONTACT.zalo.replace(/\D/g, ''),
        label: 'Nhắn Zalo', sub: CONTACT.zalo, icon: 'zalo',
      });
    }
    if (CONTACT.facebook) {
      items.push({
        cls: 'social__btn social__btn--fb',
        href: CONTACT.facebook,
        label: 'Nhắn Facebook', sub: 'Bông Dua Fleur', icon: 'fb',
      });
    }

    if (!items.length) { if (wrap) wrap.hidden = true; return; }
    if (wrap) wrap.hidden = false;

    items.forEach(function (it) {
      var a = document.createElement('a');
      a.className = it.cls;
      a.href = it.href;
      a.target = '_blank';
      a.rel = 'noopener';
      a.addEventListener('click', function () { track('contact_' + it.icon); });

      var ic = document.createElement('span');
      ic.className = 'social__ic';
      ic.setAttribute('aria-hidden', 'true');
      ic.textContent = it.icon === 'zalo' ? 'Zalo' : 'f';

      var tx = document.createElement('span');
      tx.className = 'social__tx';
      var st = document.createElement('strong');
      st.textContent = it.label;
      var sb = document.createElement('span');
      sb.textContent = it.sub;
      tx.appendChild(st);
      tx.appendChild(sb);

      a.appendChild(ic);
      a.appendChild(tx);
      host.appendChild(a);
    });
  }

  /* ------------------------------------------------------------ NÚT BẤM ---- */
  function setupCopy() {
    var btn = $('#copy-content');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var text = $('#pay-content').textContent;
      var old = btn.querySelector('.btn__label').textContent;

      function ok() {
        btn.querySelector('.btn__label').textContent = 'Đã sao chép ✓';
        setTimeout(function () { btn.querySelector('.btn__label').textContent = old; }, 1800);
        track('copy_transfer_content');
      }
      function fallback() {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:absolute;left:-9999px';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); ok(); }
        catch (e) { btn.querySelector('.btn__label').textContent = 'Bạn copy thủ công giúp nhé'; }
        document.body.removeChild(ta);
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(ok, fallback);
      } else fallback();
    });
  }

  function setupSaveQr() {
    var btn = $('#save-qr');
    if (!btn) return;
    btn.addEventListener('click', function () {
      if (!currentQrUrl) return;
      var ext = /\.(jpe?g|png|webp)(\?|$)/i.exec(currentQrUrl);
      var name = 'bongdua-qr-488k' + (ext ? '.' + ext[1].toLowerCase() : '.png');
      fetch(currentQrUrl, { mode: 'cors' })
        .then(function (r) { if (!r.ok) throw new Error('x'); return r.blob(); })
        .then(function (blob) {
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url; a.download = name;
          document.body.appendChild(a); a.click();
          document.body.removeChild(a);
          setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
          track('save_qr');
        })
        .catch(function () {
          // Trình duyệt chặn tải chéo miền -> mở ảnh để người dùng tự lưu.
          window.open(currentQrUrl, '_blank', 'noopener');
          track('save_qr_fallback');
        });
    });
  }

  function setupClaim() {
    var btn = $('#claim-btn');
    var msg = $('#claim-msg');
    if (!btn) return;

    btn.addEventListener('click', function () {
      btn.setAttribute('aria-busy', 'true');
      btn.disabled = true;

      // Microcopy đúng sự thật: đây chỉ là GHI NHẬN, không phải xác nhận
      // giao dịch. Trang không có cách nào kiểm tra ngân hàng.
      var okText = 'Đã ghi nhận. Bông Dua sẽ đối soát và xác nhận chỗ cho bạn ' +
                   'qua điện thoại. Nếu muốn nhanh hơn, bạn nhắn Zalo hoặc ' +
                   'Facebook ở trên giúp Bông Dua nhé.';

      function done(text) {
        btn.hidden = true;
        msg.textContent = text;
        msg.hidden = false;
        msg.setAttribute('role', 'status');
      }

      // Apps Script hiện tại chỉ có một hành động là ghi đăng ký. Nếu POST vào
      // đó lần nữa sẽ tạo một dòng rác không tên không SĐT trong Sheet.
      if (!API.supportsPaymentClaimed || !API.endpoint || booking.demo) {
        track('payment_claimed', { registration_id: regId, serverRecorded: false });
        done(okText);
        return;
      }

      fetch(API.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'payment_claimed', registration_id: regId }),
        redirect: 'follow',
      })
        .then(function (r) { return r.text().then(function (t) { return V.parseApiResponse(r.ok, t); }); })
        .then(function () {
          track('payment_claimed', { registration_id: regId, serverRecorded: true });
          done(okText);
        })
        .catch(function () {
          done('Bông Dua chưa ghi nhận tự động được, nhưng đừng lo. ' +
               'Bạn nhắn Zalo hoặc Facebook ở trên cho Bông Dua nhé.');
        })
        .finally(function () { btn.removeAttribute('aria-busy'); });
    });
  }

  /* ---------------------------------------------------------------- INIT --- */
  function init() {
    C.applyBindings();
    renderGreeting();
    renderQr();
    renderRows();
    renderSocialLinks();
    C.renderFooter();
    setupCopy();
    setupSaveQr();
    setupClaim();

    $$('[data-track]').forEach(function (el) {
      el.addEventListener('click', function () { track(el.getAttribute('data-track')); });
    });

    track('payment_page_view', {
      registration_id: regId,
      hasBooking: !!customerName,
      demo: !!booking.demo,
    });
    // Giữ nguyên tên event cũ để báo cáo chuyển đổi không bị đứt mạch khi
    // popup được đổi thành trang riêng.
    track('qr_view', { registration_id: regId, has_qr: !!currentQrUrl });

    // Đã hiển thị xong -> xoá dữ liệu tạm, tránh việc mở lại tab sau nhiều giờ
    // vẫn thấy tên người khác trên máy dùng chung.
    C.clearBooking();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else init();
})();
