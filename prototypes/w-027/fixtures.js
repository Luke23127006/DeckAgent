/* All content below is synthetic. No AI, ingestion or source extraction is performed. */
(function () {
  const prompt = 'Tạo presentation báo cáo thử nghiệm Thư viện sẻ chia. Audience: ban chủ nhiệm câu lạc bộ. Tiếng Việt, 6 slide, giọng gần gũi. Giữ nguyên các số liệu trong nguồn.';
  const source = 'DỮ LIỆU GIẢ LẬP — Thư viện sẻ chia\nThử nghiệm 4 tuần, với 40 người tham gia.\nCó 120 lượt mượn sách: 90 lượt trả đúng hạn, 30 lượt trả trễ.\nNguồn: Báo cáo thử nghiệm minh họa, tháng 9/2026.\nBáo cáo không có dữ liệu về chi phí hoặc mức độ hài lòng.';
  const slides = [
    { key: 'cover', type: 'cover', label: 'Mở đầu', title: 'Một cuốn sách.\nNhiều kết nối.', subtitle: 'Thư viện sẻ chia', body: 'Nhìn lại 4 tuần thử nghiệm và cùng thảo luận bước tiếp theo.', tag: 'BÁO CÁO THỬ NGHIỆM · 09/2026' },
    { key: 'context', type: 'cards', label: 'Bối cảnh', title: 'Bắt đầu nhỏ,\nnhìn vào dữ liệu.', body: 'Một thử nghiệm trong câu lạc bộ để quan sát việc mượn và trả sách.', cards: [['04', 'tuần thử nghiệm'], ['40', 'người tham gia'], ['120', 'lượt mượn sách']] },
    { key: 'results', type: 'results', label: 'Kết quả', title: '120 lượt mượn.\nMột bức tranh rõ hơn.', body: 'Dữ liệu ghi nhận từ thử nghiệm, giữ nguyên trong mọi phiên bản demo.', cards: [['90', 'trả đúng hạn'], ['30', 'trả trễ']] },
    { key: 'insight', type: 'insight', label: 'Điều cần chú ý', title: '30 lượt trả trễ.\nMột câu hỏi cần tìm hiểu.', body: 'Báo cáo chưa giải thích nguyên nhân trả trễ. Cần thêm thông tin trước khi kết luận.', note: 'Không suy ra nguyên nhân từ số liệu hiện có.' },
    { key: 'limits', type: 'list', label: 'Giới hạn', title: 'Biết rõ điều\nchúng ta chưa biết.', items: ['Chưa có dữ liệu chi phí.', 'Chưa đo mức độ hài lòng.', 'Chưa có kết quả ngoài 4 tuần thử nghiệm.'], body: 'Các khoảng trống được giữ rõ, thay vì bổ sung số liệu không có trong nguồn.' },
    { key: 'close', type: 'close', label: 'Thảo luận', title: 'Bước tiếp theo,\ncùng quyết định.', body: 'Nhóm muốn tìm hiểu thêm điều gì trước khi mở rộng thử nghiệm?', note: 'Câu hỏi gợi thảo luận · nội dung bổ sung của bản demo' }
  ];
  const actions = [
    { key: 'shorten', label: 'Rút gọn', prompt: 'Rút gọn còn 4 slide.', aliases: ['rut gon', '4 slide', 'ngan gon'], summary: 'Rút từ 6 xuống 4 slide; giữ số liệu và gộp giới hạn vào phần thảo luận.' },
    { key: 'formal', label: 'Trang trọng hơn', prompt: 'Đổi sang giọng trang trọng hơn.', aliases: ['trang trong', 'formal'], summary: 'Điều chỉnh cách diễn đạt trên toàn deck; giữ nguyên dữ liệu và cấu trúc.' },
    { key: 'reorder', label: 'Đổi mạch kể', prompt: 'Đưa kết quả lên ngay sau mở đầu.', aliases: ['ket qua len', 'doi thu tu', 'sap xep', 'reorder'], summary: 'Đưa slide kết quả lên sau mở đầu; giữ nội dung các slide còn lại.' },
    { key: 'audience', label: 'Dễ hiểu hơn', prompt: 'Điều chỉnh cho người mới tham gia câu lạc bộ.', aliases: ['nguoi moi', 'audience'], summary: 'Đổi audience sang người mới tham gia và làm rõ phần bối cảnh.' },
    { key: 'polish', label: 'Làm rõ toàn deck', prompt: 'Làm rõ và cải thiện tổng thể deck.', aliases: ['lam ro', 'cai thien', 'polish'], summary: 'Làm gọn tiêu đề và nhấn mạnh điểm chính; dùng một biến thể trình bày dựng sẵn.' },
    { key: 'add', label: 'Thêm nội dung', prompt: 'Thêm một slide khuyến nghị: hỏi người tham gia về lý do trả trễ. Cho phép tăng thêm một slide.', aliases: ['them', 'khuyen nghi'], summary: 'Thêm khuyến nghị do user cung cấp; đánh dấu nội dung bổ sung, không coi là kết luận từ nguồn.' },
    { key: 'regenerate', label: 'Phương án khác', prompt: 'Tạo lại toàn deck với một phương án trình bày khác.', aliases: ['tao lai', 'phuong an', 'regenerate'], summary: 'Đổi phương án trình bày toàn deck; giữ số liệu, audience, ngôn ngữ và độ dài hiện tại.' }
  ];
  const clone = value => JSON.parse(JSON.stringify(value));
  const fold = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase();
  function findAction(text) {
    const normalized = fold(text.trim());
    // Intentionally narrow: matching a demo example is not natural-language understanding.
    return actions.find(a => fold(a.prompt) === normalized) || null;
  }
  function createDeck(id, brief, constraints, sourceLabel) {
    return { id, title: 'Thư viện sẻ chia', brief, constraints: { ...constraints, language: 'Tiếng Việt', length: '6 slide', tone: 'Gần gũi' }, sourceLabel, theme: 'blue', slides: clone(slides), change: 'Bản nháp đầu tiên · 6 slide minh họa' };
  }
  function refine(deck, action, id) {
    const next = clone(deck);
    next.id = id; next.change = action.summary;
    if (action.key === 'shorten') {
      next.slides = next.slides.filter(s => ['cover', 'results', 'insight', 'close'].includes(s.key));
      next.slides.find(s => s.key === 'close').body = 'Trước khi mở rộng: tìm hiểu nguyên nhân trả trễ, chi phí và mức độ hài lòng. Nguồn hiện chưa có các dữ liệu này.';
      next.constraints.length = `${next.slides.length} slide`;
      next.change = `Bản trước có ${deck.slides.length} slide; phương án này có ${next.slides.length} slide. Giữ số liệu và gộp giới hạn vào phần thảo luận.`;
    }
    if (action.key === 'formal') {
      next.constraints.tone = 'Trang trọng';
      next.slides.forEach(s => {
        const titles = { cover: 'Thư viện sẻ chia\nBáo cáo thử nghiệm', context: 'Phạm vi\nvà quy mô thử nghiệm', results: 'Tổng hợp\nkết quả mượn sách', insight: 'Vấn đề\ncần làm rõ', limits: 'Giới hạn\ncủa dữ liệu', close: 'Định hướng\nthảo luận tiếp theo' };
        s.title = titles[s.key] || s.title;
      });
    }
    if (action.key === 'reorder') {
      const result = next.slides.find(s => s.key === 'results');
      next.slides = next.slides.filter(s => s.key !== 'results');
      next.slides.splice(1, 0, result);
    }
    if (action.key === 'audience') {
      next.constraints.audience = 'Người mới tham gia câu lạc bộ';
      const context = next.slides.find(s => s.key === 'context') || next.slides[0];
      context.body = 'Cùng tìm hiểu một thử nghiệm mượn sách kéo dài 4 tuần. Các số liệu giúp nhóm trao đổi về điều đã xảy ra và điều cần tìm hiểu thêm.';
    }
    if (action.key === 'polish') {
      next.theme = 'sage';
      next.slides[0].title = 'Chia sẻ sách.\nKết nối cộng đồng.';
    }
    if (action.key === 'add') {
      if (!next.slides.some(s => s.key === 'recommendation')) next.slides.splice(next.slides.length - 1, 0, { key: 'recommendation', type: 'insight', label: 'Khuyến nghị', title: 'Lắng nghe\nngười tham gia.', body: 'Hỏi người tham gia về lý do trả trễ trước khi đề xuất thay đổi.', note: 'Khuyến nghị do user bổ sung · không phải phát hiện từ source' });
      else next.change = 'Slide khuyến nghị mẫu đã có trong deck. Biến thể demo này giữ nguyên slide đó; chưa mô phỏng thêm khuyến nghị khác.';
      next.constraints.length = `${next.slides.length} slide`;
    }
    if (action.key === 'regenerate') next.theme = next.theme === 'blue' ? 'sage' : 'blue';
    return next;
  }
  window.DeckFixtures = { prompt, source, actions, findAction, createDeck, refine };
})();
