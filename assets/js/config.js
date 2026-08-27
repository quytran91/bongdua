/**
 * ============================================================================
 *  BÔNG DUA FLEUR — CẤU HÌNH TẬP TRUNG
 * ============================================================================
 *  Đây là NƠI DUY NHẤT chứa thông tin sự kiện / ngân hàng / liên hệ.
 *  Không hardcode các giá trị này ở chỗ khác trong codebase.
 *
 *  Ký hiệu trạng thái:
 *    [XÁC NHẬN]  = đã có trong brief của chủ dự án, không sửa nếu không được yêu cầu
 *    [TỪ POSTER] = đọc được từ poster 058dd6b2...jpg, CẦN CHỦ DỰ ÁN XÁC NHẬN LẠI
 *    [CẦN ĐIỀN]  = chưa có dữ liệu, trang sẽ tự ẩn hoặc hiện chữ trung tính
 *
 *  Quy ước: để chuỗi rỗng "" nghĩa là "chưa có". Giao diện sẽ tự ẩn phần đó
 *  hoặc hiển thị thông báo trung tính thay vì bịa nội dung.
 * ============================================================================
 */

window.BONGDUA_CONFIG = {
  /* ---------------------------------------------------------------- SỰ KIỆN */
  event: {
    brand: 'Bông Dua Fleur',                       // [XÁC NHẬN]
    title: 'Workshop cắm hoa tươi trên đèn lồng Trung thu', // [XÁC NHẬN]

    dateISO: '2026-09-20',                          // [XÁC NHẬN] 20/09/2026
    dateLabel: 'Chủ nhật, 20.09.2026',              // [TỪ POSTER] thứ trong tuần
    dateShort: '20.09.2026',                        // [XÁC NHẬN]

    // Thời lượng nửa ngày là [XÁC NHẬN]. Khung giờ cụ thể là [TỪ POSTER].
    // Nếu chưa muốn công bố giờ, để "" -> trang hiển thị "Buổi sáng (sẽ báo giờ khi xác nhận chỗ)".
    timeLabel: '8:30 – 11:30',                      // [TỪ POSTER]
    durationLabel: 'Nửa ngày',                      // [XÁC NHẬN]

    // Địa điểm: [TỪ POSTER]. Nếu để "" trang sẽ hiện "Café tại Hà Nội (báo địa chỉ khi xác nhận chỗ)".
    cafeName: 'Lối Nhỏ Kafe',                       // [TỪ POSTER]
    cafeAddress: '46 Ngõ 2 Hoàng Quốc Việt, Nghĩa Đô, Hà Nội', // [TỪ POSTER]
    cafeNote: 'Không gian biệt thự vintage ấm cúng, yên tĩnh giữa lòng Hà Nội.', // [TỪ POSTER]
    cafeMapUrl: '',                                 // [CẦN ĐIỀN] link Google Maps

    priceVND: 488000,                               // [XÁC NHẬN] số tiền thực thu
    priceLabel: '488.000đ',                         // [XÁC NHẬN]

    // Giá gốc để gạch ngang. Để 0 thì trang KHÔNG hiện giá gạch ở đâu cả.
    priceOriginalVND: 1500000,                      // [XÁC NHẬN]

    // Câu nhãn ưu đãi. Sửa MỘT chỗ này là đổi trên toàn trang.
    // Ví dụ khác: 'Ưu đãi mở bán sớm' · 'Ưu đãi đến hết 10.09' · '' (ẩn hẳn).
    promoNote: 'Ưu đãi hôm nay',                    // [XÁC NHẬN]

    isLastOfYear: true,                             // [XÁC NHẬN] workshop cuối 2026

    // Số chỗ: brief cấm tự bịa. Để null -> trang chỉ nói "nhóm nhỏ", không nêu con số.
    seatsTotal: null,                               // [CẦN ĐIỀN] ví dụ 12
    seatsLeft: null,                                // [CẦN ĐIỀN]

    // Dresscode [TỪ POSTER]. Để mảng rỗng nếu không muốn hiển thị.
    dresscode: ['Trắng', 'Hồng', 'Hồng nude', 'Be'], // [TỪ POSTER]

    founderName: 'Thư Phạm',                        // [XÁC NHẬN] người hướng dẫn cắm hoa
    founderRole: 'Người sáng lập Bông Dua Fleur',   // [XÁC NHẬN]
  },

  /* --------------------------------------------------- QUYỀN LỢI ĐÃ BAO GỒM */
  // Chỉ những mục có confirmed:true mới được ghi là "đã bao gồm trong 488.000đ".
  // Mục confirmed:false sẽ hiển thị nhạt kèm ghi chú "đang xác nhận" — hoặc bạn
  // xoá hẳn khỏi mảng nếu không muốn nhắc tới.
  includes: [
    { key: 'lantern',   label: 'Đèn lồng hoa tươi mang về', desc: 'Sản phẩm do chính tay bạn hoàn thiện, mang về treo ở nhà.', confirmed: true },
    { key: 'photos',    label: 'Ảnh chuyên nghiệp', desc: 'Photographer chụp bạn cùng sản phẩm và ở cổng hoa.', confirmed: true },
    { key: 'drink',     label: 'Đồ uống miễn phí', desc: 'Đồ uống tại café đã nằm trong vé, bạn không trả thêm.', confirmed: true },
    { key: 'technique', label: 'Kỹ thuật cắm hoa căn bản', desc: 'Được hướng dẫn từng bước, không cần biết gì trước.', confirmed: true },
  ],

  /* ------------------------------------------------------------ THANH TOÁN */
  // Chưa có thông tin ngân hàng -> để trống. Trang sẽ KHÔNG tạo QR giả,
  // mà hiện panel "Bông Dua sẽ gửi thông tin chuyển khoản" + nút liên hệ.
  payment: {
    // [XÁC NHẬN] Đọc từ ảnh "mã qr.jpg" chủ dự án cung cấp.
    bankName: 'VPBank',
    accountNumber: '0356622262',
    accountName: 'PHAM THI THANH THU',

    // Ảnh QR tĩnh do chủ dự án cung cấp. QR này ĐÃ bao sẵn số tiền 488.000đ
    // và nội dung "Ws 20/9", nên không dựng QR động nữa.
    staticQrPath: 'assets/img/payment-qr-760.jpg',

    // Nội dung chuyển khoản hiện cho khách. {ten} sẽ được thay bằng tên khách
    // vừa nhập -> Bông Dua đối soát được ai đã chuyển.
    // Để '' thì dùng lại mẫu cũ "BONGDUA <mã giữ chỗ>".
    transferTemplate: 'Ws 20/9 {ten}',
    transferPrefix: 'BONGDUA',

    // Mã giữ chỗ chỉ có ý nghĩa khi Sheet cũng lưu mã đó để tra cứu.
    // Apps Script hiện tại chỉ nhận name/phone/email/social/note nên mã không
    // vào Sheet -> ẩn đi, tránh đưa cho khách một mã mà shop không tra được.
    showRegistrationId: false,

    // Chỉ dùng khi KHÔNG có staticQrPath: dựng QR động qua VietQR.
    bankBin: '',             // mã BIN VietQR, ví dụ '970432' (VPBank)
    vietqrTemplate: 'compact2',
  },

  /* -------------------------------------------------------------- LIÊN HỆ */
  contact: {
    hotline: '0356622262',                                   // [XÁC NHẬN]
    zalo: '0356622262',                                      // [XÁC NHẬN]
    email: '',                                               // [CẦN ĐIỀN]
    facebook: 'https://www.facebook.com/BongDuaFleur',       // [XÁC NHẬN]
    instagram: '',                                           // [CẦN ĐIỀN] URL
    privacyUrl: '',          // [CẦN ĐIỀN] link chính sách riêng tư; để trống thì footer không hiện link
    // Câu hiển thị khi chưa có kênh liên hệ nào.
    fallbackNote: 'Bông Dua sẽ chủ động liên hệ với bạn qua số điện thoại bạn để lại.',
  },

  /* --------------------------------------------------------- CHÍNH SÁCH */
  // Brief cấm bịa chính sách hoàn/huỷ. Để "" -> FAQ hiện "vui lòng liên hệ".
  policy: {
    refund: '',              // [CẦN ĐIỀN]
    transfer: '',            // [CẦN ĐIỀN] đổi người tham dự
    photoDelivery: '',       // [CẦN ĐIỀN] thời gian trả ảnh
  },

  /* ------------------------------------------------------------- BACKEND */
  // Có 2 cách đưa đăng ký vào Google Sheets. Điền MỘT trong hai.
  api: {
    // ---- CÁCH A (đang dùng): Google Apps Script -------------------------
    // Đã kiểm chứng ngày 27/08/2026: POST trả {"success":true} kèm header
    // Access-Control-Allow-Origin: * -> trang ĐỌC ĐƯỢC kết quả, biết chắc đã
    // ghi hay chưa. Chỉ mở popup QR khi máy chủ báo thành công.
    endpoint: 'https://script.google.com/macros/s/AKfycbwOGlpXEkeRL3qdgHH_OZT8aVE34eyav-ngArlfQIe__VqwPW6vqDpp13ObKsa6uBiT/exec',

    // Apps Script này chỉ nhận đúng 5 khoá: name, phone, email, social, note.
    // Không có endpoint cập nhật trạng thái đã chuyển khoản -> nếu bật true mà
    // script không hỗ trợ, mỗi lần bấm "Tôi đã chuyển khoản" sẽ tạo thêm một
    // dòng rác trong Sheet. Chỉ bật khi dùng google-apps-script/Code.gs.
    supportsPaymentClaimed: false,

    // ---- CÁCH B (dự phòng): gửi thẳng vào Google Form có sẵn -------------
    // Chỉ dùng khi KHÔNG có endpoint ở trên. Hạn chế thật cần biết: Google Form
    // KHÔNG trả lời cho trình duyệt (không có CORS), nên trang chỉ "gửi rồi tin
    // là xong", không xác nhận được đã ghi thành công.
    // Lấy formId và các entry.xxx bằng: python tools/google-form-ids.py <link form>
    googleForm: {
      formId: '',            // chuỗi giữa /d/e/ và /viewform
      entries: {
        full_name: '',       // ví dụ 'entry.123456789'
        phone: '',
        email: '',
        social_handle: '',
        note: '',
        registration_id: '', // để '' nếu form không có câu hỏi này
      },
    },

    timeoutMs: 15000,
  },

  /* ------------------------------------------------------------------ SEO */
  site: {
    canonical: 'https://bongduafleur.netlify.app/', // đổi khi có domain riêng

    // Trang chuyển khoản là một TRANG RIÊNG (không phải popup) — khách dùng
    // điện thoại nhiều nên một trang thật đáng tin hơn: bấm Back được, tải lại
    // được, lưu link được, không kẹt trong khung cuộn nhỏ.
    paymentPage: 'thanh-toan.html',
    ogImage: 'assets/img/khu-check-in-1086.jpg',
  },

  /* ------------------------------------------------------------ ANALYTICS */
  analytics: {
    debug: false,            // true -> in event ra console để kiểm thử
  },
};
