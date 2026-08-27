/**
 * ============================================================================
 *  BÔNG DUA FLEUR — Bộ test cho validate & luồng đăng ký
 * ============================================================================
 *  Chạy được ở 2 nơi, dùng chung đúng một file spec này:
 *    · Trình duyệt : mở tests/index.html
 *    · Node        : node tests/run.js   (nếu máy có cài Node)
 * ============================================================================
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BongDuaSpec = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /** @param {object} V  module BongDuaValidate */
  function run(V) {
    var results = [];
    var group = '';

    function describe(name, fn) { group = name; fn(); }

    function it(name, fn) {
      try {
        fn();
        results.push({ group: group, name: name, ok: true });
      } catch (e) {
        results.push({ group: group, name: name, ok: false, message: e.message });
      }
    }

    function eq(actual, expected, label) {
      if (actual !== expected) {
        throw new Error((label ? label + ': ' : '') +
          'nhận ' + JSON.stringify(actual) + ', mong đợi ' + JSON.stringify(expected));
      }
    }
    function truthy(v, label) { if (!v) throw new Error((label || 'giá trị') + ' phải đúng'); }
    function falsy(v, label) { if (v) throw new Error((label || 'giá trị') + ' phải sai'); }
    function throws(fn, label) {
      var threw = false, err = null;
      try { fn(); } catch (e) { threw = true; err = e; }
      if (!threw) throw new Error((label || 'hàm') + ' phải ném lỗi');
      return err;
    }

    var base = {
      full_name: 'Nguyễn Thị Trăng',
      phone: '0912345678',
      email: '',
      social_handle: '',
      note: '',
      website: '',
    };
    function payload(over) {
      var o = {};
      for (var k in base) o[k] = base[k];
      for (var j in (over || {})) o[j] = over[j];
      return o;
    }

    /* ------------------------------------------------------ SỐ ĐIỆN THOẠI */
    describe('Số điện thoại Việt Nam', function () {
      it('chấp nhận số 10 chữ số chuẩn', function () {
        eq(V.normalizePhone('0912345678'), '0912345678');
        eq(V.normalizePhone('0387654321'), '0387654321');
        eq(V.normalizePhone('0567890123'), '0567890123');
        eq(V.normalizePhone('0787654321'), '0787654321');
        eq(V.normalizePhone('0812345678'), '0812345678');
      });

      it('bỏ qua khoảng trắng, dấu chấm, gạch ngang', function () {
        eq(V.normalizePhone('0912 345 678'), '0912345678');
        eq(V.normalizePhone('0912.345.678'), '0912345678');
        eq(V.normalizePhone('0912-345-678'), '0912345678');
        eq(V.normalizePhone(' 0912345678 '), '0912345678');
      });

      it('chuẩn hoá dạng quốc tế +84 / 84 về 0', function () {
        eq(V.normalizePhone('+84912345678'), '0912345678');
        eq(V.normalizePhone('84912345678'), '0912345678');
        eq(V.normalizePhone('+84 91 234 5678'), '0912345678');
      });

      it('tự thêm số 0 khi người dùng nhập thiếu', function () {
        eq(V.normalizePhone('912345678'), '0912345678');
      });

      it('từ chối đầu số không phải di động', function () {
        eq(V.normalizePhone('0212345678'), null, 'số cố định');
        eq(V.normalizePhone('0112345678'), null, 'đầu 01 đã bỏ');
        eq(V.normalizePhone('0412345678'), null);
        eq(V.normalizePhone('0612345678'), null);
      });

      it('từ chối số sai độ dài hoặc rỗng', function () {
        eq(V.normalizePhone('091234567'), null, 'thiếu 1 số');
        eq(V.normalizePhone('09123456789'), null, 'thừa 1 số');
        eq(V.normalizePhone(''), null);
        eq(V.normalizePhone('   '), null);
        eq(V.normalizePhone(null), null);
        eq(V.normalizePhone(undefined), null);
        eq(V.normalizePhone('không phải số'), null);
      });
    });

    /* ---------------------------------------------------- FIELD BẮT BUỘC */
    describe('Field bắt buộc', function () {
      it('payload hợp lệ thì ok', function () {
        var r = V.validateRegistration(payload());
        truthy(r.ok, 'kết quả');
        eq(r.data.phone, '0912345678');
        eq(r.data.full_name, 'Nguyễn Thị Trăng');
      });

      it('thiếu họ tên -> lỗi full_name', function () {
        var r = V.validateRegistration(payload({ full_name: '   ' }));
        falsy(r.ok);
        truthy(r.errors.full_name, 'lỗi full_name');
      });

      it('họ tên quá ngắn -> lỗi', function () {
        var r = V.validateRegistration(payload({ full_name: 'A' }));
        falsy(r.ok);
        eq(r.errors.full_name, V.MSG.nameShort);
      });

      it('họ tên không có chữ cái -> lỗi', function () {
        var r = V.validateRegistration(payload({ full_name: '123456' }));
        falsy(r.ok);
        eq(r.errors.full_name, V.MSG.nameInvalid);
      });

      it('thiếu số điện thoại -> lỗi phone', function () {
        var r = V.validateRegistration(payload({ phone: '' }));
        falsy(r.ok);
        eq(r.errors.phone, V.MSG.phoneRequired);
      });

      it('số điện thoại sai định dạng -> lỗi phone', function () {
        var r = V.validateRegistration(payload({ phone: '0212345678' }));
        falsy(r.ok);
        eq(r.errors.phone, V.MSG.phoneInvalid);
      });

      it('KHÔNG còn ô tích đồng ý -> thiếu consent vẫn gửi được', function () {
        var p = payload();
        delete p.consent;
        var r = V.validateRegistration(p);
        truthy(r.ok, 'phải hợp lệ dù không có consent');
        truthy(r.data.consent, 'đồng ý ngầm định khi bấm gửi');
      });

      it('consent: false KHÔNG còn chặn việc gửi form', function () {
        truthy(V.validateRegistration(payload({ consent: false })).ok);
      });

      it('vẫn tôn trọng consent nếu về sau form có gửi kèm', function () {
        truthy(V.validateRegistration(payload({ consent: 'on' })).data.consent);
        falsy(V.validateRegistration(payload({ consent: false })).data.consent);
      });

      it('gom được nhiều lỗi cùng lúc', function () {
        var r = V.validateRegistration({ full_name: '', phone: 'x' });
        falsy(r.ok);
        eq(Object.keys(r.errors).length, 2);
      });
    });

    /* ------------------------------------------------------------- EMAIL */
    describe('Email (không bắt buộc)', function () {
      it('bỏ trống vẫn hợp lệ', function () {
        truthy(V.validateRegistration(payload({ email: '' })).ok);
      });
      it('email đúng thì qua', function () {
        truthy(V.isValidEmail('trang@gmail.com'));
        truthy(V.isValidEmail('bong.dua+ws@fleur.com.vn'));
      });
      it('email sai thì báo lỗi', function () {
        falsy(V.isValidEmail('abc'));
        falsy(V.isValidEmail('a@b'));
        falsy(V.isValidEmail('a b@c.com'));
        falsy(V.isValidEmail('@gmail.com'));
        var r = V.validateRegistration(payload({ email: 'sai@' }));
        falsy(r.ok);
        eq(r.errors.email, V.MSG.emailInvalid);
      });
    });

    /* -------------------------------------------------- HONEYPOT / SPAM */
    describe('Chống spam', function () {
      it('honeypot có dữ liệu -> chặn', function () {
        var r = V.validateRegistration(payload({ website: 'http://spam.example' }));
        falsy(r.ok);
        eq(r.errors._spam, V.MSG.spam);
      });
      it('honeypot rỗng -> không ảnh hưởng', function () {
        truthy(V.validateRegistration(payload({ website: '' })).ok);
      });
      it('cắt ghi chú dài quá giới hạn', function () {
        var long = new Array(700).join('a');
        var r = V.validateRegistration(payload({ note: long }));
        falsy(r.ok);
        eq(r.errors.note, V.MSG.noteLong);
      });
      it('loại bỏ ký tự điều khiển khỏi dữ liệu', function () {
        var r = V.validateRegistration(payload({ social_handle: '@tr\u0007ang\u007F' }));
        truthy(r.ok);
        eq(r.data.social_handle, '@trang');
      });
    });

    /* ------------------------------------------------------- MÃ ĐĂNG KÝ */
    describe('Mã đăng ký', function () {
      it('đúng định dạng BD<MMYY>-XXXX', function () {
        var id = V.makeRegistrationId('2026-09-20');
        truthy(/^BD0926-[A-Z2-9]{4}$/.test(id), 'định dạng ' + id);
        truthy(V.isRegistrationId(id));
      });

      it('lấy tháng/năm từ ngày sự kiện', function () {
        eq(V.makeRegistrationId('2027-12-01', function () { return 0; }), 'BD1227-AAAA');
      });

      it('không dùng ký tự dễ nhầm 0/O/1/I', function () {
        for (var i = 0; i < 300; i++) {
          var tail = V.makeRegistrationId('2026-09-20').split('-')[1];
          falsy(/[01OI]/.test(tail), 'ký tự dễ nhầm trong ' + tail);
        }
      });

      it('từ chối mã sai', function () {
        falsy(V.isRegistrationId('BD0926-AB1O'), 'chứa O');
        falsy(V.isRegistrationId('BD0926-ABC'), 'thiếu ký tự');
        falsy(V.isRegistrationId('XX0926-ABCD'), 'sai tiền tố');
        falsy(V.isRegistrationId(''));
        falsy(V.isRegistrationId(null));
      });

      it('nội dung chuyển khoản viết hoa, đúng mẫu', function () {
        eq(V.transferContent('BONGDUA', 'BD0926-AB12'), 'BONGDUA BD0926-AB12');
        eq(V.transferContent('bongdua', 'bd0926-ab12'), 'BONGDUA BD0926-AB12');
      });
    });

    /* ------------------------------------------- PAYLOAD GỬI APPS SCRIPT */
    describe('Payload gửi lên Apps Script', function () {
      var src = {
        full_name: 'Nguyễn Thị Trăng', phone: '0912345678',
        email: 'a@b.com', social_handle: '@trang', note: 'đi cùng bạn',
      };

      it('đúng 5 khoá name/phone/email/social/note, không thừa khoá nào', function () {
        var p = V.toApiPayload(src);
        eq(Object.keys(p).sort().join(','), 'email,name,note,phone,social');
      });

      it('ánh xạ đúng tên khoá', function () {
        var p = V.toApiPayload(src);
        eq(p.name, 'Nguyễn Thị Trăng');
        eq(p.phone, '0912345678');
        eq(p.social, '@trang');
        eq(p.note, 'đi cùng bạn');
      });

      it('không gửi consent hay khoá nội bộ nào khác', function () {
        var p = V.toApiPayload(src);
        falsy(p.consent, 'consent');
        falsy(p.full_name, 'full_name');
        falsy(p.social_handle, 'social_handle');
      });

      it('field không bắt buộc để trống thì là chuỗi rỗng, không phải undefined', function () {
        var p = V.toApiPayload({ full_name: 'A B', phone: '0912345678' });
        eq(p.email, '');
        eq(p.social, '');
        eq(p.note, '');
      });

      it('payload sinh ra từ dữ liệu ĐÃ chuẩn hoá (số điện thoại về dạng 0…)', function () {
        var r = V.validateRegistration({
          full_name: 'Trần Thu Hà', phone: '+84387654321',
        });
        truthy(r.ok, 'validate');
        eq(V.toApiPayload(r.data).phone, '0387654321');
      });
    });

    /* ------------------------------------------------------- ĐỊNH DẠNG $ */
    describe('Định dạng tiền', function () {
      it('488000 -> 488.000đ', function () {
        eq(V.formatVND(488000), '488.000đ');
        eq(V.formatVND(1000000), '1.000.000đ');
        eq(V.formatVND(0), '0đ');
      });
    });

    /* --------------------------------------------- CHỐNG DOUBLE-SUBMIT */
    describe('Chống double-submit', function () {
      it('lần bấm thứ hai bị chặn khi đang gửi', function () {
        var g = V.createSubmitGuard();
        truthy(g.begin(), 'lần 1');
        falsy(g.begin(), 'lần 2 phải bị chặn');
        falsy(g.begin(), 'lần 3 phải bị chặn');
      });

      it('gửi xong thì mở khoá lại', function () {
        var g = V.createSubmitGuard();
        g.begin();
        g.end();
        truthy(g.begin(), 'sau khi end phải cho gửi lại');
      });

      it('isBusy phản ánh đúng trạng thái', function () {
        var g = V.createSubmitGuard();
        falsy(g.isBusy());
        g.begin();
        truthy(g.isBusy());
        g.end();
        falsy(g.isBusy());
      });
    });

    /* --------------------------------------------- LỖI TỪ GOOGLE SHEETS */
    describe('Xử lý lỗi Google Sheets / Apps Script', function () {
      it('phản hồi thành công thì trả về object', function () {
        var d = V.parseApiResponse(true, '{"ok":true,"registration_id":"BD0926-AB12"}');
        eq(d.registration_id, 'BD0926-AB12');
      });

      it('ok:false -> ném lỗi kèm message của server', function () {
        var e = throws(function () {
          V.parseApiResponse(true, '{"ok":false,"message":"Máy chủ đang bận."}');
        });
        eq(e.message, 'Máy chủ đang bận.');
      });

      it('lỗi theo field được giữ nguyên để hiện dưới input', function () {
        var e = throws(function () {
          V.parseApiResponse(true, '{"ok":false,"errors":{"phone":"Số sai"}}');
        });
        eq(e.fields.phone, 'Số sai');
      });

      it('nhận {"success":true} của Apps Script thật', function () {
        var d = V.parseApiResponse(true, '{"success":true}');
        truthy(d.success, 'success');
      });

      it('{"success":false} -> ném lỗi, KHÔNG được mở QR', function () {
        throws(function () { V.parseApiResponse(true, '{"success":false}'); });
      });

      it('có trường "error" -> ném lỗi kèm đúng nội dung', function () {
        var e = throws(function () {
          V.parseApiResponse(true, '{"error":"Sheet đang khoá"}');
        });
        eq(e.message, 'Sheet đang khoá');
      });

      it('Apps Script deploy sai quyền trả HTML -> lỗi nói rõ phải sửa gì', function () {
        var e = throws(function () {
          V.parseApiResponse(true, '<!DOCTYPE html><html>Sign in</html>');
        });
        truthy(/HTML/.test(e.message), 'nhắc HTML: ' + e.message);
        truthy(/Anyone/.test(e.message), 'nhắc quyền deploy: ' + e.message);
      });

      it('HTTP lỗi 500 -> ném lỗi', function () {
        throws(function () { V.parseApiResponse(false, '{"ok":true}'); });
      });

      it('body rỗng -> coi là đã ghi (doPost không trả gì vẫn hợp lệ)', function () {
        truthy(V.parseApiResponse(true, '').ok);
      });

      it('body là chữ thường kiểu "OK" -> coi là đã ghi', function () {
        truthy(V.parseApiResponse(true, 'OK').ok);
      });
    });

    return results;
  }

  return { run: run };
});
