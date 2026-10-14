(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const hasLocalApi = ['127.0.0.1', 'localhost'].includes(location.hostname) && ['http:', 'https:'].includes(location.protocol);
  let guests = { ...window.WEDDING_CONFIG.guests, ...(window.WEDDING_GUESTS || {}) };
  const status = $('#guest-tool-status');
  const baseInput = $('#base-url');
  baseInput.value = new URL('index.html', location.href).href;
  function message(text, state = '') { status.textContent = text; status.className = `form-status ${state}`; }
  function inviteUrl(code) {
    const url = new URL(baseInput.value);
    if (!['http:', 'https:', 'file:'].includes(url.protocol)) throw new Error('Đường dẫn thiệp không hợp lệ.');
    url.search = '';
    url.hash = '';
    url.searchParams.set('guest', code);
    return url.href;
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); message('Đã sao chép link thiệp.', 'success'); }
    catch { message('Trình duyệt chưa cho phép sao chép. Bấm chuột phải vào “Xem thiệp” để sao chép địa chỉ.'); }
  }
  function render() {
    const rows = $('#guest-rows');
    rows.replaceChildren();
    for (const [code, name] of Object.entries(guests)) {
      const tr = document.createElement('tr');
      const nameCell = document.createElement('td'); nameCell.textContent = name;
      const codeCell = document.createElement('td'); const codeText = document.createElement('code'); codeText.textContent = code; codeCell.append(codeText);
      const linkCell = document.createElement('td'); const link = document.createElement('a'); link.href = inviteUrl(code); link.target = '_blank'; link.rel = 'noopener'; link.textContent = 'Xem thiệp ↗'; linkCell.append(link);
      const copyCell = document.createElement('td'); const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Sao chép'; button.setAttribute('aria-label', `Sao chép link của ${name}`); button.addEventListener('click', () => copy(inviteUrl(code))); copyCell.append(button);
      tr.append(nameCell, codeCell, linkCell, copyCell); rows.append(tr);
    }
  }
  function slugify(name) {
    return name.toLowerCase().replace(/đ/g, 'd').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'khach';
  }
  $('#guest-tool-form').addEventListener('submit', async event => {
    event.preventDefault();
    try {
      inviteUrl('test');
      const lines = $('#guest-names').value.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
      if (!lines.length) throw new Error('Bạn vui lòng nhập ít nhất một tên khách.');
      if (lines.length + Object.keys(guests).length > 3000) throw new Error('Danh sách tối đa 3000 khách.');
      const next = { ...guests };
      for (const line of lines) {
        const separator = line.indexOf('|');
        const name = separator < 0 ? line : line.slice(separator + 1).trim();
        let code = separator < 0 ? slugify(name) : line.slice(0, separator).trim().toLowerCase();
        if (!name || name.length > 100) throw new Error('Tên khách cần từ 1 đến 100 ký tự.');
        if (!/^[a-z][a-z0-9-]{0,79}$/.test(code) || ['constructor', 'prototype'].includes(code)) throw new Error('Mã khách cần bắt đầu bằng chữ, dùng chữ không dấu, số và dấu gạch nối.');
        if (separator < 0) {
          const stem = code;
          let suffix = 2;
          while (Object.prototype.hasOwnProperty.call(next, code) && next[code] !== name) code = `${stem}-${suffix++}`;
        }
        next[code] = name;
      }
      guests = next;
      render();
      if (!hasLocalApi) {
        message('Đã tạo link. Tải guest-map.js, thay public/guest-map.js trong repo rồi push để cập nhật tên khách.');
        return;
      }
      $('#generate-guests').disabled = true;
      message('Đang lưu danh sách…');
      try {
        const response = await fetch('/api/guests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ guests }), signal: AbortSignal.timeout(7000) });
        const result = await response.json();
        if (!response.ok || !result.ok) throw new Error(result.error || 'Chưa lưu được.');
        guests = { ...window.WEDDING_CONFIG.guests, ...result.guests };
        render();
        message('Đã lưu danh sách trên máy. Các link vừa tạo đã hiển thị đúng tên khách.', 'success');
        $('#guest-names').value = '';
      } catch {
        message('Đã tạo link nhưng chưa lưu vào thiệp. Bấm “Tải guest-map.js”, đặt tệp đó cạnh index.html rồi tải lại thiệp.', 'error');
      } finally { $('#generate-guests').disabled = false; }
    } catch (error) { message(error.message, 'error'); }
  });
  baseInput.addEventListener('change', () => { try { render(); } catch { message('Bạn vui lòng nhập đường dẫn gốc hợp lệ.', 'error'); } });
  $('#download-map').addEventListener('click', () => {
    const data = 'window.WEDDING_GUESTS = ' + JSON.stringify(guests, null, 2).replace(/</g, '\\u003c') + ';\n';
    const url = URL.createObjectURL(new Blob([data], { type: 'text/javascript;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'guest-map.js'; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    message('Đã tạo tệp guest-map.js. Giữ nguyên tên tệp khi thay vào thiệp.');
  });
  async function loadResponses() {
    if (!hasLocalApi) {
      $('#responses-title').closest('section').hidden = true;
      $('#generate-guests').textContent = 'Tạo danh sách & link';
      return;
    }
    try {
      const response = await fetch('/api/rsvps', { cache: 'no-store', signal: AbortSignal.timeout(7000) });
      if (!response.ok) throw new Error();
      const data = await response.json();
      const rows = $('#response-rows'); rows.replaceChildren();
      let total = 0;
      for (const item of data.items) {
        if (item.attendance === 'yes') total += item.party_size;
        const tr = document.createElement('tr');
        for (const text of [item.name, { yes: 'Sẽ đến', maybe: 'Báo sau', no: 'Vắng' }[item.attendance], item.party_size, item.wish || '—']) {
          const td = document.createElement('td'); td.textContent = text; tr.append(td);
        }
        rows.append(tr);
      }
      $('#response-summary').textContent = `${data.items.length} phản hồi · ${total} người xác nhận tham dự`;
      $('#export-rsvps').hidden = false;
    } catch {
      $('#response-summary').textContent = 'Chưa kết nối máy chủ local. Mở start-local.cmd để xem và xuất danh sách phản hồi.';
      $('#export-rsvps').hidden = true;
    }
  }
  $('#refresh-responses').addEventListener('click', loadResponses);
  render();
  loadResponses();
})();
