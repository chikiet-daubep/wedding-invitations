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

  // Dùng textContent để tên khách luôn là văn bản, không phải HTML.
  const params = new URLSearchParams(window.location.search);
  const guestCode = (params.get('guest') || params.get('to') || '').trim().toLowerCase();
  const extraGuests = window.WEDDING_GUESTS || {};
  const guestName = Object.prototype.hasOwnProperty.call(extraGuests, guestCode)
    ? extraGuests[guestCode] : Object.prototype.hasOwnProperty.call(config.guests, guestCode)
      ? config.guests[guestCode] : config.defaultGuest;
  document.querySelectorAll('[data-guest]').forEach(el => { el.textContent = guestName; });

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
    toggle.setAttribute('aria-label', musicWanted ? 'Tắt nhạc nền' : 'Bật nhạc nền');
    $('#music-label').textContent = playing ? 'Tắt nhạc' : musicWanted && !video.paused ? 'Nhạc tạm dừng' : 'Bật nhạc';
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
  const giftDialog = $('#gift-dialog');
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
  [photoDialog, giftDialog].forEach(dialog => {
    dialog.addEventListener('close', () => document.body.classList.remove('dialog-open'));
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (dialog === photoDialog || event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
  });

  const gift = config.gift;
  $('#gift-qr').src = gift.qrImage;
  $('#gift-qr').alt = gift.isMock ? 'Ảnh QR mẫu, chưa dùng để chuyển khoản' : 'Mã QR nhận quà mừng cưới';
  $('#gift-mock-note').hidden = !gift.isMock;
  // Khi dùng QR thật, chỉ hiện thông tin ngân hàng đã được cấu hình.
  if (!gift.isMock && (gift.bank || gift.accountNumber || gift.accountName)) {
    $('#bank-details').hidden = false;
    $('#bank-name').textContent = gift.bank;
    $('#bank-account').textContent = gift.accountNumber;
    $('#bank-owner').textContent = gift.accountName;
    $('#copy-account').hidden = !gift.accountNumber;
  }
  $('#show-gift').addEventListener('click', () => openDialog(giftDialog));
  $('#dock-gift').addEventListener('click', () => openDialog(giftDialog));
  $('#copy-account').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(gift.accountNumber);
      notify('Đã sao chép số tài khoản.');
    } catch {
      // file:// hoặc trình duyệt không hỗ trợ Clipboard: chọn văn bản để sao chép.
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents($('#bank-account'));
      selection.removeAllRanges();
      selection.addRange(range);
      notify('Đã chọn số tài khoản. Bạn có thể sao chép văn bản này.');
    }
  });
  $('#gift-qr').addEventListener('error', () => {
    $('#gift-qr').hidden = true;
    $('#gift-mock-note').hidden = false;
    $('#gift-mock-note').textContent = 'Ảnh QR chưa tải được. Vui lòng thử lại sau.';
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
