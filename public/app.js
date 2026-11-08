(() => {
  'use strict';
  const config = window.WEDDING_CONFIG;
  const hasLocalApi = ['127.0.0.1', 'localhost'].includes(location.hostname) && ['http:', 'https:'].includes(location.protocol);
  const $ = (selector) => document.querySelector(selector);
  const gate = $('#gate');
  const main = $('#invitation');
  main.inert = true;
  main.setAttribute('aria-hidden', 'true');
  const music = $('#background-music');
  const video = $('#wedding-video');
  const toggle = $('#music-toggle');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Cánh hoa đào rơi nhẹ, không chặn thao tác và giảm số cánh trên điện thoại.
  const snow = document.createElement('div');
  snow.className = 'petal-fall';
  snow.setAttribute('aria-hidden', 'true');
  const flakes = document.createDocumentFragment();
  for (let i = 0; i < 32; i++) {
    const flake = document.createElement('span');
    flake.className = 'peach-petal';
    flake.style.setProperty('--snow-x', `${Math.random() * 100}%`);
    flake.style.setProperty('--snow-size', `${8 + Math.random() * 7}px`);
    flake.style.setProperty('--snow-duration', `${16 + Math.random() * 14}s`);
    flake.style.setProperty('--snow-delay', `${-Math.random() * 26}s`);
    flake.style.setProperty('--snow-drift', `${-65 + Math.random() * 130}px`);
    flake.style.setProperty('--snow-opacity', `${0.5 + Math.random() * 0.3}`);
    flakes.append(flake);
  }
  snow.append(flakes);
  document.body.append(snow);
  document.addEventListener('visibilitychange', () => {
    snow.classList.toggle('snow-paused', document.hidden);
  });
  let opened = false;
  let musicWanted = false;
  let playAttempt = 0;
  let toastTimeout;
  let currentLanguage = localStorage.getItem('wedding-language') === 'en' ? 'en' : 'vi';

  const translations = [
    ['.cover-copy .eyebrow', { vi: 'THIỆP MỜI THÀNH HÔN', en: 'WEDDING INVITATION' }],
    ['.guest-line>span', { vi: 'TRÂN TRỌNG KÍNH MỜI', en: 'YOU ARE CORDIALLY INVITED' }],
    ['#open-invitation', { vi: 'Mở thiệp mời <svg><use href="#arrow"/></svg>', en: 'Open invitation <svg><use href="#arrow"/></svg>' }],
    ['.cover-note', { vi: 'Mở một lời mời, chung một niềm vui.', en: 'Open an invitation, share a joyful moment.' }],
    ['.site-header nav a:nth-child(1)', { vi: 'Hôn lễ', en: 'Ceremony' }],
    ['.site-header nav a:nth-child(2)', { vi: 'Tiệc cưới', en: 'Reception' }],
    ['.site-header nav a:nth-child(3)', { vi: 'Album', en: 'Gallery' }],
    ['.site-header nav a:nth-child(4)', { vi: 'Video', en: 'Video' }],
    ['.hero-copy>.eyebrow', { vi: 'HỶ SỰ · 25 THÁNG 11 NĂM 2026', en: 'OUR WEDDING · NOVEMBER 25, 2026' }],
    ['.hero-intro', { vi: 'Chúng mình cưới!', en: 'We are getting married!' }],
    ['.hero-message', { vi: 'Có những cuộc gặp gỡ trở thành một đời.<br>Và có những niềm vui, chỉ trọn vẹn khi được sẻ chia.', en: 'Some encounters become a lifetime.<br>And some joys are complete only when shared.' }],
    ['.personal-invite p:first-child', { vi: 'Thân mời <strong data-guest>Quý khách</strong>', en: 'Dear <strong data-guest>Guest</strong>' }],
    ['.personal-invite p:nth-child(2)', { vi: 'đến chung vui trong ngày hạnh phúc của chúng mình.', en: 'please join us on our happiest day.' }],
    ['.hero-copy .text-link', { vi: 'Xem lời mời chung vui', en: 'View the celebration invitation' }],
    ['.countdown-heading .eyebrow', { vi: 'ĐẾM NGÀY CHUNG ĐÔI', en: 'COUNTING DOWN TO OUR DAY' }],
    ['.countdown>div:nth-child(1) span', { vi: 'NGÀY', en: 'DAYS' }],
    ['.countdown>div:nth-child(3) span', { vi: 'GIỜ', en: 'HOURS' }],
    ['.countdown>div:nth-child(5) span', { vi: 'PHÚT', en: 'MINUTES' }],
    ['.countdown>div:nth-child(7) span', { vi: 'GIÂY', en: 'SECONDS' }],
    ['#countdown-title', { vi: 'Chờ ngày mình<br><em>về chung một nhà.</em>', en: 'Counting down to<br><em>our forever.</em>' }],
    ['#countdown-note', { vi: 'Hẹn gặp nhau lúc 18:00 · 25.11.2026', en: 'See you at 18:00 · November 25, 2026' }],
    ['.ceremony .section-number', { vi: 'LỜI NGỎ', en: 'A NOTE FROM OUR FAMILIES' }],
    ['#ceremony-title', { vi: 'Trân trọng báo tin <em>lễ thành hôn</em>', en: 'With joy, we announce <em>our wedding</em>' }],
    ['.ceremony>.section-heading>p', { vi: 'Hai gia đình hân hoan báo tin lễ thành hôn của', en: 'Our families joyfully announce the wedding of' }],
    ['.family:first-of-type .eyebrow', { vi: 'NHÀ TRAI', en: "GROOM'S FAMILY" }],
    ['.family:last-of-type .eyebrow', { vi: 'NHÀ GÁI', en: "BRIDE'S FAMILY" }],
    ['.family:first-of-type .birth-order', { vi: 'Út Nam', en: 'Youngest son' }],
    ['.family:last-of-type .birth-order', { vi: 'Thứ Nữ', en: 'Youngest daughter' }],
    ['.family:first-of-type>p:nth-of-type(2)', { vi: 'Ông <strong>Giang Tỷ</strong><br>Bà <strong>Thái Kim Phượng</strong>', en: 'Mr. <strong>Giang Tỷ</strong><br>Mrs. <strong>Thái Kim Phượng</strong>' }],
    ['.family:last-of-type>p:nth-of-type(2)', { vi: 'Bà <strong>Nguyễn Thị Tuyết Vân</strong>', en: 'Mrs. <strong>Nguyễn Thị Tuyết Vân</strong>' }],
    ['.ceremony-time .eyebrow', { vi: 'HÔN LỄ ĐƯỢC CỬ HÀNH TẠI TƯ GIA', en: 'THE CEREMONY WILL TAKE PLACE AT HOME' }],
    ['.ceremony-date span', { vi: 'Thứ Tư, ngày 25 tháng 11 năm 2026', en: 'Wednesday, November 25, 2026' }],
    ['.lunar', { vi: 'Nhằm ngày 17 tháng 10 năm Bính Ngọ', en: '17th day of the 10th lunar month · Year of the Horse' }],
    ['.reception-copy .section-number', { vi: 'LỜI MỜI CHUNG VUI', en: 'A JOYFUL INVITATION' }],
    ['#celebration-title', { vi: 'Một ngày đặc biệt.<br><em>Một lời mời thương.</em>', en: 'A special day.<br><em>A heartfelt invitation.</em>' }],
    ['.reception-copy>p:first-of-type', { vi: 'Trân trọng kính mời <strong data-guest>Quý khách</strong><br>đến dự tiệc mừng lễ thành hôn của chúng mình.', en: 'We warmly invite <strong data-guest>Guest</strong><br>to celebrate our wedding with us.' }],
    ['.reception-copy .hall', { vi: 'Sảnh Grand Diamond · Tầng Trệt', en: 'Grand Diamond Hall · Ground Floor' }],
    ['.reception-photo>span', { vi: 'Ngày vui, có bạn.', en: 'A joyful day, with you.' }],
    ['.reception-date>div:first-child span:first-child', { vi: 'THỨ TƯ', en: 'WEDNESDAY' }],
    ['.reception-date>div:first-child span:last-child', { vi: 'THÁNG 11 · 2026', en: 'NOVEMBER · 2026' }],
    ['.reception-date>div:last-child span:first-child', { vi: 'ĐÓN KHÁCH LÚC', en: 'GUESTS ARRIVE' }],
    ['.reception-date>div:last-child span:last-child', { vi: '17/10 · BÍNH NGỌ', en: '10TH LUNAR MONTH · HORSE' }],
    ['.button-row a:first-child', { vi: 'Xem địa điểm', en: 'View location' }],
    ['.button-row a:last-child', { vi: 'Lưu lịch <span aria-hidden="true">↗</span>', en: 'Save to calendar <span aria-hidden="true">↗</span>' }],
    ['.gallery-heading .section-number', { vi: 'KHOẢNH KHẮC CỦA CHÚNG MÌNH', en: 'OUR MOMENTS' }],
    ['#gallery-title', { vi: 'Bên nhau, <em>thật đẹp.</em>', en: 'Together, <em>beautifully.</em>' }],
    ['.gallery-heading>p', { vi: 'Mỗi tấm hình, một chút thương.<br>Chạm vào ảnh để xem trọn khoảnh khắc.', en: 'Every photo holds a little love.<br>Tap to relive each moment.' }],
    ['.film-section .section-number', { vi: 'THƯỚC PHIM YÊU THƯƠNG', en: 'A FILM OF LOVE' }],
    ['#film-title', { vi: 'Lưu giữ <em>ngày hạnh phúc.</em>', en: 'A keepsake of <em>our happy day.</em>' }],
    ['.film-section .section-heading>p', { vi: 'Cùng xem những khoảnh khắc của chúng mình.', en: 'Watch a few moments from our story.' }],
    ['.film-note', { vi: 'Nhạc nền sẽ tạm dừng khi video phát.', en: 'The background music pauses while the video plays.' }],
    ['.location-copy .section-number', { vi: 'HẸN GẶP BẠN TẠI ĐÂY', en: 'MEET US HERE' }],
    ['#location-title', { vi: 'Đường đến <em>ngày vui.</em>', en: 'The way to <em>our celebration.</em>' }],
    ['.location-copy .eyebrow', { vi: 'TRUNG TÂM HỘI NGHỊ & TIỆC CƯỚI', en: 'WEDDING & EVENT VENUE' }],
    ['.location-copy .button', { vi: 'Chỉ đường trên Google Maps <svg><use href="#arrow"/></svg>', en: 'Directions on Google Maps <svg><use href="#arrow"/></svg>' }],
    ['.location-copy>p:not(.eyebrow):not(.location-time)', { vi: '584 Âu Cơ, Phường Bảy Hiền<br>Sảnh Grand Diamond · Tầng Trệt', en: '584 Au Co Street, Bay Hien Ward<br>Grand Diamond Hall · Ground Floor' }],
    ['.location-time', { vi: '25.11.2026 <span>·</span> 18:00', en: 'November 25, 2026 <span>·</span> 18:00' }],
    ['.gift-copy .section-number', { vi: 'GỬI CHÚT YÊU THƯƠNG', en: 'A LITTLE LOVE' }],
    ['#gift-title', { vi: 'Mừng hạnh phúc <em>chúng mình.</em>', en: 'Celebrating <em>our happiness.</em>' }],
    ['.gift-copy>p', { vi: 'Sự hiện diện của bạn là món quà quý giá nhất.<br>Nếu muốn gửi thêm lời chúc qua một món quà nhỏ,<br>chúng mình xin đón nhận bằng tất cả lòng biết ơn.', en: 'Your presence is the greatest gift.<br>If you would like to send a little blessing,<br>we receive it with heartfelt gratitude.' }],
    ['.wishes-section .section-number', { vi: 'NHỮNG ĐIỀU THƯƠNG MẾN', en: 'KIND WORDS' }],
    ['#wishes-title', { vi: 'Sổ <em>lời chúc.</em>', en: 'A book of <em>wishes.</em>' }],
    ['.wishes-section .section-heading>p', { vi: 'Những lời thương, chúng mình xin giữ mãi.', en: 'We will treasure every kind word.' }],
    ['.wishes-empty', { vi: 'Lời chúc đầu tiên đang chờ bạn viết nên ♡', en: 'The first wish is waiting to be written ♡' }],
    ['footer .footer-note', { vi: 'Sự hiện diện của bạn là niềm vui của chúng mình. Hẹn gặp bạn trong ngày chung đôi ♡', en: 'Your presence is our joy. We cannot wait to see you on our special day ♡' }],
    ['footer>p:first-of-type', { vi: 'Trân trọng cảm ơn', en: 'With heartfelt thanks' }],
    ['#mobile-dock>a:nth-child(1) span', { vi: 'Tiệc cưới', en: 'Reception' }],
    ['#mobile-dock>a:nth-child(2) span', { vi: 'Bản đồ', en: 'Map' }],
    ['#reopen', { vi: 'Xem lại bìa thiệp ↗', en: 'View the cover again ↗' }],
  ];

  function setLanguage(language) {
    currentLanguage = language === 'en' ? 'en' : 'vi';
    document.documentElement.lang = currentLanguage;
    translations.forEach(([selector, values]) => document.querySelectorAll(selector).forEach(el => { el.innerHTML = values[currentLanguage]; }));
    document.querySelectorAll('[data-guest]').forEach(el => { el.textContent = guestName === config.defaultGuest && currentLanguage === 'en' ? 'Guest' : guestName; });
    document.querySelector('.countdown')?.setAttribute('aria-label', currentLanguage === 'en' ? 'Time remaining until the reception' : 'Thời gian còn lại đến tiệc cưới');
    document.querySelector('#mobile-dock')?.setAttribute('aria-label', currentLanguage === 'en' ? 'Quick access' : 'Truy cập nhanh');
    document.querySelectorAll('.gallery-item').forEach((el, index) => el.setAttribute('aria-label', currentLanguage === 'en' ? `View wedding photo ${index + 1}` : `Xem ảnh cưới ${index + 1}`));
    document.querySelectorAll('[data-lang-toggle]').forEach(button => {
      button.textContent = currentLanguage === 'en' ? 'VI' : 'EN';
      button.setAttribute('aria-label', currentLanguage === 'en' ? 'Chuyển sang tiếng Việt' : 'Switch to English');
    });
    localStorage.setItem('wedding-language', currentLanguage);
    syncMusic();
  }

  // Dùng textContent để tên khách luôn là văn bản, không phải HTML.
  const params = new URLSearchParams(window.location.search);
  const guestCode = (params.get('guest') || params.get('to') || '').trim().toLowerCase();
  const extraGuests = window.WEDDING_GUESTS || {};
  const guestName = Object.prototype.hasOwnProperty.call(extraGuests, guestCode)
    ? extraGuests[guestCode] : Object.prototype.hasOwnProperty.call(config.guests, guestCode)
      ? config.guests[guestCode] : config.defaultGuest;
  document.querySelectorAll('[data-guest]').forEach(el => { el.textContent = guestName; });
  document.querySelectorAll('[data-lang-toggle]').forEach(button => button.addEventListener('click', () => setLanguage(currentLanguage === 'vi' ? 'en' : 'vi')));
  setLanguage(currentLanguage);

  function notify(message) {
    clearTimeout(toastTimeout);
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('show');
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 4500);
  }

  music.src = config.music;
  music.volume = 0.38;
  video.src = config.video;
  $('#video-download').href = config.video;

  function updateMusicButton() {
    const playing = !music.paused;
    toggle.classList.toggle('playing', playing);
    toggle.setAttribute('aria-pressed', String(musicWanted));
    const labels = currentLanguage === 'en'
      ? { off: 'Turn off background music', on: 'Turn on background music', playing: 'Music on', paused: 'Music paused', button: 'Turn on' }
      : { off: 'Tắt nhạc nền', on: 'Bật nhạc nền', playing: 'Tắt nhạc', paused: 'Nhạc tạm dừng', button: 'Bật nhạc' };
    toggle.setAttribute('aria-label', musicWanted ? labels.off : labels.on);
    $('#music-label').textContent = playing ? labels.playing : musicWanted && !video.paused ? labels.paused : labels.button;
  }

  function syncMusic(showFailure = false) {
    const attempt = ++playAttempt;
    if (!musicWanted || !video.paused || !opened) {
      music.pause();
      updateMusicButton();
      return;
    }
    // Gọi play trực tiếp trong lần bấm mở thiệp để đáp ứng chính sách autoplay.
    const playback = music.play();
    if (playback) playback.catch(() => {
      if (attempt !== playAttempt) return;
      musicWanted = false;
      updateMusicButton();
      if (showFailure) notify('Chạm “Bật nhạc” để nghe nhạc nền.');
    });
    updateMusicButton();
  }
  music.addEventListener('play', updateMusicButton);
  music.addEventListener('pause', updateMusicButton);
  music.addEventListener('error', () => {
    musicWanted = false;
    updateMusicButton();
    if (opened) notify('Nhạc chưa tải được. Vui lòng thử lại.');
  });
  toggle.addEventListener('click', () => {
    musicWanted = !musicWanted;
    syncMusic(true);
    if (musicWanted && !video.paused) notify('Nhạc nền sẽ tiếp tục sau khi bạn dừng video.');
  });
  video.addEventListener('play', () => syncMusic());
  video.addEventListener('pause', () => syncMusic());
  video.addEventListener('ended', () => syncMusic());
  video.addEventListener('error', () => { $('#video-error').hidden = false; });

  let revealObserver;
  function enableReveals() {
    if (reducedMotion || !('IntersectionObserver' in window)) return;
    document.body.classList.add('motion-ready');
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.07, rootMargin: '0px 0px -15px 0px' });
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
  }

  $('#open-invitation').addEventListener('click', () => {
    if (opened) return;
    opened = true;
    musicWanted = true;
    syncMusic(true);
    main.inert = false;
    main.removeAttribute('aria-hidden');
    document.body.classList.add('is-open');
    gate.classList.add('opening');
    $('#open-invitation').disabled = true;
    window.scrollTo({ top: 0, behavior: 'instant' });
    setTimeout(() => {
      gate.hidden = true;
      document.body.classList.remove('is-closed');
      toggle.hidden = false;
      $('#mobile-dock').hidden = false;
      $('.brand').focus({ preventScroll: true });
      if (!revealObserver) enableReveals();
      const map = $('#venue-map');
      if (!map.src) map.src = map.dataset.src;
      if (hasLocalApi) loadWishes();
    }, reducedMotion ? 30 : 1700);
  });

  $('#reopen').addEventListener('click', () => {
    opened = false;
    musicWanted = false;
    // Cập nhật trạng thái trước pause vì sự kiện pause của video sẽ đồng bộ nhạc.
    video.pause();
    syncMusic();
    main.inert = true;
    main.setAttribute('aria-hidden', 'true');
    toggle.hidden = true;
    $('#mobile-dock').hidden = true;
    gate.hidden = false;
    gate.classList.remove('opening');
    document.body.classList.add('is-closed');
    document.body.classList.remove('is-open');
    $('#open-invitation').disabled = false;
    window.scrollTo({ top: 0, behavior: 'instant' });
    $('#open-invitation').focus({ preventScroll: true });
  });

  // Ngày tiệc có múi giờ +07:00, nhất quán dù khách đang ở quốc gia khác.
  const target = new Date(config.receptionAt).getTime();
  let countdownInterval;
  function updateCountdown() {
    const remaining = Math.max(0, Math.floor((target - Date.now()) / 1000));
    const values = [Math.floor(remaining / 86400), Math.floor(remaining / 3600) % 24, Math.floor(remaining / 60) % 60, remaining % 60];
    ['days', 'hours', 'minutes', 'seconds'].forEach((id, index) => { $(`#${id}`).textContent = String(values[index]).padStart(2, '0'); });
    if (!remaining) {
      $('#countdown-note').textContent = 'Ngày hạnh phúc của chúng mình đã đến. Cảm ơn bạn đã chung vui!';
      clearInterval(countdownInterval);
    }
  }
  updateCountdown();
  if (target > Date.now()) countdownInterval = setInterval(updateCountdown, 1000);

  // Album: hỗ trợ chuột, bàn phím và vuốt trên điện thoại.
  const photos = Array.from(document.querySelectorAll('[data-photo]')).map(el => ({ src: el.querySelector('img').getAttribute('src'), alt: el.querySelector('img').alt }));
  const photoDialog = $('#photo-dialog');
  let photoIndex = 0;
  let touchStartX = 0;
  function showPhoto(index) {
    photoIndex = (index + photos.length) % photos.length;
    $('#lightbox-image').src = photos[photoIndex].src;
    $('#lightbox-image').alt = photos[photoIndex].alt;
    $('#photo-caption').textContent = `${photoIndex + 1} / ${photos.length} · ${photos[photoIndex].alt}`;
  }
  function openDialog(dialog) {
    dialog.showModal();
    document.body.classList.add('dialog-open');
  }
  document.querySelectorAll('[data-photo]').forEach(el => el.addEventListener('click', () => {
    showPhoto(Number(el.dataset.photo));
    openDialog(photoDialog);
  }));
  $('#photo-prev').addEventListener('click', () => showPhoto(photoIndex - 1));
  $('#photo-next').addEventListener('click', () => showPhoto(photoIndex + 1));
  photoDialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      showPhoto(photoIndex + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  $('#lightbox-image').addEventListener('touchstart', event => { touchStartX = event.changedTouches[0].screenX; }, { passive: true });
  $('#lightbox-image').addEventListener('touchend', event => {
    const delta = event.changedTouches[0].screenX - touchStartX;
    if (Math.abs(delta) > 55) showPhoto(photoIndex + (delta < 0 ? 1 : -1));
  }, { passive: true });
  document.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', () => $(`#${el.dataset.close}`).close()));
  [photoDialog].forEach(dialog => {
    dialog.addEventListener('close', () => document.body.classList.remove('dialog-open'));
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (dialog === photoDialog || event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
  });

  // Chuyển động ảnh theo cuộn được giới hạn nhẹ, tắt khi giảm chuyển động.
  if (!reducedMotion) {
    let scrollQueued = false;
    window.addEventListener('scroll', () => {
      if (scrollQueued || !opened) return;
      scrollQueued = true;
      requestAnimationFrame(() => {
        const hero = $('.hero-photo');
        const bounds = hero.getBoundingClientRect();
        if (bounds.bottom > 0) hero.style.setProperty('--hero-drift', `${Math.min(24, Math.max(0, -bounds.top) * 0.035)}px`);
        scrollQueued = false;
      });
    }, { passive: true });
  }

  // Sổ lời chúc vẫn đọc dữ liệu đã có trong bản local.
  async function api(path, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    try {
      const response = await fetch(path, { ...options, signal: controller.signal, cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Không thể gửi lúc này.');
      return data;
    } finally { clearTimeout(timeout); }
  }
  function renderWishes(items) {
    const wall = $('#wish-wall');
    wall.replaceChildren();
    if (!items.length) {
      const empty = document.createElement('p');
      empty.className = 'wishes-empty';
      empty.textContent = 'Lời chúc đầu tiên đang chờ bạn viết nên ♡';
      wall.append(empty);
      return;
    }
    items.forEach(item => {
      const card = document.createElement('article');
      card.className = 'wish-card';
      const wish = document.createElement('blockquote');
      wish.textContent = item.wish;
      const author = document.createElement('p');
      author.textContent = `♡ ${item.name}`;
      const time = document.createElement('time');
      time.dateTime = item.updatedAt;
      time.textContent = new Date(item.updatedAt).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
      card.append(wish, author, time);
      wall.append(card);
    });
  }
  async function loadWishes() {
    try { renderWishes((await api('/api/wishes')).items); }
    catch { $('#wish-wall').textContent = 'Sổ lời chúc tạm thời chưa tải được. Bạn có thể thử lại sau.'; }
  }
  if (!hasLocalApi) {
    $('.wishes-section').hidden = true;
    $('.wishes-section').style.display = 'none';
  }
})();
