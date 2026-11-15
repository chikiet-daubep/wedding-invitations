/* Chỉnh tên khách mời, QR và thông tin chuyển khoản tại đây.
 * Ví dụ URL: https://ten-mien-cua-ban/?guest=gia-dinh
 * Mã khách không có trong GUESTS sẽ hiển thị lời mời chung.
 */
window.WEDDING_CONFIG = {
  // GitHub Pages: điền URL Google Form để nhận RSVP, hoặc để trống.
  rsvpFormUrl: '',
  receptionAt: '2026-11-25T18:00:00+07:00',
  invitationTypes: {
    wedding: {
      vi: 'THIỆP MỜI THÀNH HÔN',
      en: 'WEDDING INVITATION',
      openVi: 'Mở thiệp mời',
      openEn: 'Open invitation',
    },
    baoHy: {
      vi: 'TIỆC BÁO HỶ',
      en: 'CELEBRATION RECEPTION',
      openVi: 'Mở thiệp báo hỷ',
      openEn: 'Open celebration invitation',
    },
  },
  guests: {
    'gia-dinh': 'Quý gia đình',
    'ban-be': 'Bạn và người thương',
    // 'anh-minh': 'Anh Nguyễn Văn Minh', // Ví dụ, thay bằng khách thật.
  },
  defaultGuest: 'Quý khách',
  music: 'assets/violin.mp3',
  video: 'assets/wedding-film.mp4',
};
