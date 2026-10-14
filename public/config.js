/* Chỉnh tên khách mời, QR và thông tin chuyển khoản tại đây.
 * Ví dụ URL: https://ten-mien-cua-ban/?guest=gia-dinh
 * Mã khách không có trong GUESTS sẽ hiển thị lời mời chung.
 */
window.WEDDING_CONFIG = {
  // GitHub Pages: điền URL Google Form để nhận RSVP, hoặc để trống.
  rsvpFormUrl: '',
  receptionAt: '2026-11-25T18:00:00+07:00',
  guests: {
    'gia-dinh': 'Quý gia đình',
    'ban-be': 'Bạn và người thương',
    // 'anh-minh': 'Anh Nguyễn Văn Minh', // Ví dụ, thay bằng khách thật.
  },
  defaultGuest: 'Quý khách',
  music: 'assets/violin.mp3',
  video: 'assets/wedding-film.mp4',
  gift: {
    qrImage: 'assets/qr-mung-cuoi.svg',
    isMock: false,
    bank: 'TPBank',
    accountNumber: '00000272054',
    accountName: 'GIANG CHI KIET',
  },
};
