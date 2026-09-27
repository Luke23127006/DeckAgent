(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const fixtures = window.DeckFixtures;
  let session = window.DeckDemo.createSession();
  let version = 0;
  let selectedSlide = 0;
  let overview = false;
  let busy = false;
  let canReject = false;
  let receipt = null;
  let messages = [];
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const fold = text => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  function feedback(id, text, error = false) {
    $(id).textContent = text; $(id).hidden = !text; $(id).classList.toggle('error', error);
  }
  function openGuide() {
    const { working, candidate, accepted } = session.view();
    $('state-inspector').textContent = JSON.stringify({ working: working?.id || null, candidate: candidate?.id || null, accepted: accepted?.id || null, activeConstraints: working?.constraints || null, lastExport: receipt ? { version: receipt.deck.id, format: receipt.format, simulated: true } : null }, null, 2);
    $('guide-dialog').showModal();
  }
  async function simulate(deck, title) {
    busy = true;
    session.propose(deck);
    $('progress-title').textContent = title;
    $('progress-detail').textContent = 'Đang chuẩn bị nội dung và cấu trúc từ dữ liệu mẫu…';
    $('progress-dialog').showModal();
    await wait(650);
    $('progress-detail').textContent = `Candidate ${deck.id} đã có. Đang mô phỏng validation; bản accepted chưa thay đổi.`;
    await wait(650);
    session.validate();
    busy = false;
    $('progress-dialog').close();
  }
  function sourceLabel() {
    const mode = $('source-mode').value;
    if (mode === 'paste') return $('source-text').value.trim() === fixtures.source ? 'Báo cáo nguồn mẫu' : 'Văn bản do user dán · nội dung chưa được xử lý';
    if (mode === 'file') return `${$('source-file').files[0].name} · file chưa được đọc`;
    return 'Không dùng source · deck minh họa dựng sẵn';
  }
  async function generate(audience) {
    if (busy) return;
    const deck = fixtures.createDeck(`v${++version}`, $('brief').value.trim(), { audience }, sourceLabel());
    canReject = false;
    await simulate(deck, 'Đưa câu chuyện lên slide.');
    messages = [{ role: 'assistant', text: 'Bản nháp gồm 6 slide đã sẵn sàng. Xem kết quả, rồi thử một yêu cầu chỉnh sửa bên dưới.' }];
    $('create-view').hidden = true; $('workspace').hidden = false;
    render();
    window.scrollTo(0, 0);
    $('accept').focus();
  }
  function slideHTML(slide, index, count, theme) {
    const art = '<div class="book-art" aria-hidden="true"><span></span><span></span><span></span></div>';
    const cards = slide.cards ? `<div class="stat-cards">${slide.cards.map(([value, label]) => `<div class="stat-card"><b>${escape(value)}</b><span>${escape(label)}</span></div>`).join('')}</div>` : '';
    const items = slide.items ? `<ul class="slide-list">${slide.items.map(item => `<li>${escape(item)}</li>`).join('')}</ul>` : '';
    return `<div class="slide-shell theme-${escape(theme)}"><article class="presentation-slide ${escape(slide.type)}" aria-label="Slide ${index + 1}: ${escape(slide.label)}"><div class="slide-kicker">THƯ VIỆN SẺ CHIA · ${escape(slide.label.toUpperCase())}</div><h2>${escape(slide.title)}</h2>${slide.body ? `<p>${escape(slide.body)}</p>` : ''}${cards}${slide.type === 'results' ? '<div class="data-bar" aria-hidden="true"><span></span><span></span></div>' : ''}${items}${slide.note ? `<div class="slide-note">${escape(slide.note)}</div>` : ''}${slide.type === 'cover' ? art : ''}<div class="slide-footer"><span>DỮ LIỆU GIẢ LẬP · W-027</span><span>${String(index + 1).padStart(2, '0')} / ${String(count).padStart(2, '0')}</span></div></article></div>`;
  }
  function render() {
    const { working, accepted } = session.view();
    if (!working) return;
    selectedSlide = Math.min(selectedSlide, working.slides.length - 1);
    const isAccepted = working.id === accepted?.id;
    $('version-tag').textContent = working.id;
    $('accepted-label').textContent = accepted ? `Bản đã chọn: ${accepted.id}` : 'Chưa có bản được chấp nhận';
    $('export-open').disabled = !accepted;
    $('preview-status').textContent = isAccepted ? '● Bản đã chấp nhận' : '○ Bản đang xem · chưa Accept';
    $('preview-status').classList.toggle('accepted', isAccepted);
    $('slide-count').textContent = working.slides.length;
    $('thumbnails').innerHTML = working.slides.map((slide, i) => `<button class="thumbnail ${i === selectedSlide && !overview ? 'active' : ''}" data-slide="${i}" aria-label="Xem slide ${i + 1}: ${escape(slide.label)}" ${i === selectedSlide && !overview ? 'aria-current="true"' : ''}><div class="thumb-picture ${working.theme === 'sage' ? 'sage' : ['cover', 'close'].includes(slide.type) ? 'dark' : ''}"><b>${escape(slide.title)}</b><small>THƯ VIỆN SẺ CHIA</small></div><span class="thumbnail-caption"><b>${String(i + 1).padStart(2, '0')}</b>${escape(slide.label)}</span></button>`).join('');
    $('slide-stage').innerHTML = overview ? `<div class="deck-grid">${working.slides.map((slide, i) => `<button class="deck-grid-item" data-slide="${i}" aria-label="Mở slide ${i + 1}">${slideHTML(slide, i, working.slides.length, working.theme)}<span>${i + 1}. ${escape(slide.label)}</span></button>`).join('')}</div>` : slideHTML(working.slides[selectedSlide], selectedSlide, working.slides.length, working.theme);
    $('slide-navigation').hidden = overview;
    $('position').textContent = `${selectedSlide + 1} / ${working.slides.length}`;
    $('previous-slide').disabled = selectedSlide === 0;
    $('next-slide').disabled = selectedSlide === working.slides.length - 1;
    for (const [id, active] of [['single-view', !overview], ['grid-view', overview]]) { $(id).classList.toggle('active', active); $(id).setAttribute('aria-pressed', String(active)); }
    $('review-heading').textContent = isAccepted ? 'BẢN NÀY ĐÃ ĐƯỢC CHẤP NHẬN' : 'XEM LẠI TRƯỚC KHI CHỌN';
    $('change-summary').textContent = working.change;
    $('accept').disabled = isAccepted;
    $('accept').textContent = isAccepted ? 'Đã chấp nhận ✓' : 'Chấp nhận bản này ✓';
    $('reject').hidden = !canReject || isAccepted;
    const labels = { audience: 'Audience', language: 'Ngôn ngữ', length: 'Độ dài', tone: 'Giọng điệu' };
    $('constraint-list').innerHTML = Object.entries(working.constraints).map(([key, value]) => `<div class="constraint-row"><dt>${labels[key] || escape(key)}</dt><dd>${escape(value)}</dd></div>`).join('');
    $('provenance').textContent = `Input: ${working.sourceLabel}. Số liệu trên slide luôn từ fixture giả lập; không trích xuất từ file/văn bản tùy ý. Câu hỏi và khuyến nghị bổ sung được ghi chú riêng.`;
    $('conversation').innerHTML = messages.slice(-4).map(message => `<div class="message ${message.role}">${escape(message.text)}</div>`).join('');
    $('conversation').scrollTop = $('conversation').scrollHeight;
  }
  $('source-mode').addEventListener('change', () => {
    $('paste-source').hidden = $('source-mode').value !== 'paste';
    $('file-source').hidden = $('source-mode').value !== 'file';
    feedback('create-feedback', '');
  });
  $('sample-brief').addEventListener('click', () => { $('brief').value = fixtures.prompt; $('brief').focus(); });
  $('sample-source').addEventListener('click', () => { $('source-text').value = fixtures.source; });
  $('create-form').addEventListener('submit', event => {
    event.preventDefault();
    if (busy) return;
    const brief = $('brief').value.trim();
    if (!brief) return feedback('create-feedback', 'Hãy mô tả điều bạn muốn trình bày hoặc dùng brief mẫu.', true);
    if ($('source-mode').value === 'paste' && !$('source-text').value.trim()) return feedback('create-feedback', 'Dán nội dung, dùng nguồn mẫu hoặc chọn “Không dùng nguồn”.', true);
    if ($('source-mode').value === 'file') {
      const file = $('source-file').files[0];
      if (!file) return feedback('create-feedback', 'Chọn một file để tiếp tục hoặc chọn “Không dùng nguồn”.', true);
      if (!/\.(txt|md|markdown|pdf|docx|pptx)$/i.test(file.name)) return feedback('create-feedback', 'Loại file này ngoài source boundary V1. Thử TXT/Markdown, text-layer PDF, DOCX hoặc PPTX-as-source.', true);
    }
    feedback('create-feedback', '');
    const audienceMatch = brief.match(/audience\s*:\s*([^.!?\n]+)/i) || brief.match(/(?:dành cho|cho)\s+([^.!?\n]+)/i);
    if (!audienceMatch) { $('audience').value = ''; $('clarify-dialog').showModal(); $('audience').focus(); }
    else generate(audienceMatch[1].trim().slice(0, 120));
  });
  $('clarify-form').addEventListener('submit', event => {
    event.preventDefault();
    const audience = $('audience').value.trim();
    if (!audience) return $('audience').focus();
    $('clarify-dialog').close(); generate(audience);
  });
  document.querySelectorAll('[data-audience]').forEach(button => button.addEventListener('click', () => { $('audience').value = button.dataset.audience; }));
  $('refinement-examples').innerHTML = fixtures.actions.map(action => `<button type="button" data-refine="${action.key}">${escape(action.label)}</button>`).join('');
  $('refinement-examples').addEventListener('click', event => {
    const button = event.target.closest('[data-refine]');
    if (button) { $('refine-request').value = fixtures.actions.find(action => action.key === button.dataset.refine).prompt; $('refine-request').focus(); feedback('workspace-feedback', ''); }
  });
  $('refine-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    const request = $('refine-request').value.trim();
    const action = fixtures.findAction(request);
    if (!action) {
      const unsupported = /dich|translate|hinh anh|image|slide \d/.test(fold(request));
      return feedback('workspace-feedback', unsupported ? 'Yêu cầu này chưa có mô phỏng ở checkpoint hiện tại. Translation/assets là deferred; slide-targeted chỉ best effort trong V1. Hãy thử một câu mẫu bên phải.' : 'Câu này chưa có biến thể demo. Hãy chọn một gợi ý rồi gửi nguyên câu mẫu; V0 chưa hiểu yêu cầu tự do.', true);
    }
    feedback('workspace-feedback', '');
    const deck = fixtures.refine(session.view().working, action, `v${++version}`);
    messages.push({ role: 'user', text: request });
    await simulate(deck, 'Thử một cách kể mới.');
    canReject = true;
    messages.push({ role: 'assistant', text: `${deck.change} Đây là biến thể dựng sẵn. Bạn có thể chấp nhận hoặc bỏ lần sửa này.` });
    $('refine-request').value = '';
    render(); $('accept').focus();
  });
  $('accept').addEventListener('click', () => {
    if (busy) return;
    session.accept(); canReject = false; render();
    feedback('workspace-feedback', `Đã chọn ${session.view().accepted.id}. Export sẽ dùng bản này cho đến khi bạn chấp nhận một bản khác.`);
    $('export-open').focus();
  });
  $('reject').addEventListener('click', () => {
    if (busy || !canReject) return;
    session.reject(); canReject = false;
    messages.push({ role: 'assistant', text: `Đã trở về ${session.view().working.id}. Nội dung và constraints được khôi phục cùng nhau theo giả định V0.` });
    render(); feedback('workspace-feedback', 'Đã bỏ lần sửa. Bạn có thể tiếp tục thử một yêu cầu khác.'); $('refine-request').focus();
  });
  for (const id of ['thumbnails', 'slide-stage']) $(id).addEventListener('click', event => { const button = event.target.closest('[data-slide]'); if (button) { selectedSlide = Number(button.dataset.slide); overview = false; render(); } });
  $('previous-slide').addEventListener('click', () => { selectedSlide--; render(); });
  $('next-slide').addEventListener('click', () => { selectedSlide++; render(); });
  $('single-view').addEventListener('click', () => { overview = false; render(); });
  $('grid-view').addEventListener('click', () => { overview = true; render(); });
  $('export-open').addEventListener('click', () => {
    const { accepted, working } = session.view();
    if (!accepted || busy) return;
    $('export-state').innerHTML = `<b>Xuất ${escape(accepted.id)} · ${accepted.slides.length} slide · bản đã chấp nhận</b>${working.id !== accepted.id ? `Bạn đang xem ${escape(working.id)} chưa Accept. Export vẫn dùng ${escape(accepted.id)}.` : 'Đây là bản bạn vừa xem và chấp nhận.'}`;
    $('export-result').hidden = true; $('download-receipt').hidden = true; receipt = null;
    $('export-dialog').showModal();
  });
  document.querySelectorAll('[data-export]').forEach(button => button.addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    const result = session.exportAccepted(button.dataset.export);
    document.querySelectorAll('[data-export]').forEach(item => item.disabled = true);
    $('download-receipt').hidden = true;
    $('export-result').hidden = false;
    $('export-result').textContent = `Đang mô phỏng xuất ${result.format} từ ${result.deck.id}…`;
    await wait(700);
    receipt = result;
    $('export-result').innerHTML = `<strong>✓ Hoàn tất mô phỏng ${escape(result.format)}</strong><br>${escape(result.deck.id)} · ${result.deck.slides.length} slide. Accepted state được giữ nguyên.<br>Chưa tạo file ${escape(result.format)} thật. Biên nhận JSON bên dưới chỉ dùng đối chiếu nội dung demo.`;
    $('download-receipt').hidden = false;
    busy = false;
    document.querySelectorAll('[data-export]').forEach(item => item.disabled = false);
  }));
  $('download-receipt').addEventListener('click', () => {
    if (!receipt) return;
    const blob = new Blob([JSON.stringify({ note: 'W-027 mock export receipt. NOT a PPTX/PDF file. Synthetic content only.', ...receipt }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = `DEMO-${receipt.deck.id}-${receipt.format}-receipt.json`; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => { if (!busy) $(button.dataset.close).close(); }));
  document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); }));
  $('guide-open').addEventListener('click', openGuide); $('assumptions-open').addEventListener('click', openGuide);
  function requestReset(event) { event.preventDefault(); if (!busy) $('reset-dialog').showModal(); }
  $('reset').addEventListener('click', requestReset); $('brand').addEventListener('click', requestReset);
  $('confirm-reset').addEventListener('click', () => {
    session = window.DeckDemo.createSession(); version = 0; selectedSlide = 0; overview = false; canReject = false; receipt = null; messages = [];
    $('create-form').reset(); $('refine-form').reset(); $('paste-source').hidden = true; $('file-source').hidden = true;
    feedback('workspace-feedback', ''); feedback('create-feedback', '');
    $('workspace').hidden = true; $('create-view').hidden = false; $('reset-dialog').close(); window.scrollTo(0, 0); $('brief').focus();
  });
})();
