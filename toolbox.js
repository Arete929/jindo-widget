/* 파일명: toolbox.js | @version 1.1.0 (v1.1.0 이름외우기에 학생 사진)
   도구상자 — «바로가기» 탭 안의 타일로 들어간다. 지비스·혜원이지 공통(views.js 다음에 읽힌다).
   스쿨보드(제작 호똑쌤)의 도구상자를 본떠 «선으로 그린 아이콘» 카드 여덟 개:
   PDF 편집기 · 랜덤 뽑기·모둠 편성 · QR 생성기 · 수업 타이머 · 학생이름외우기 · 계산기 ·
   시험문제 배점 산출기 · 등급별 인원 예측.   (글깎이·투표 및 설문·온라인등록부는 뺐다 — 서버가 필요해서)
   ★ 입력칸은 칠 때마다 다시 그리지 않는다(버벅임) — 값만 TB 에 담아 두고 단추를 눌러야 계산한다.
   ★ <select> 를 쓰지 않는다(단추 팔레트). 파일을 다루는 일(PDF·QR 저장)은 main.js 의 tb-* 가 한다. */

var TB = {
  open: false, tool: '',
  pdf: { mode: 'merge', files: [], pages: '', angle: 90, fit: true, busy: false, msg: '', ok: true, saved: [] },
  rnd: { names: '', mode: 'pick', n: 1, noRepeat: true, picked: [], left: null, gBy: 'count', gNum: 4, groups: [], msg: '' },
  qr: { text: '', size: 512, level: 'M', dark: '#000000', dataUrl: '', msg: '', ok: true, busy: false },
  tm: { mins: 10, left: 600, run: false, end: 0, msg: '', big: false, done: false },
  nm: { src: '', mode: 'card', idx: 0, flip: false, order: [], score: 0, tried: 0, q: null, picked: '', pairs: null, selL: -1, selR: -1, fails: 0, msg: '', photos: {}, photoSig: '', show: 'photo', manage: false, busy: false },
  cal: { tab: 'calc', expr: '', hist: [], res: '', err: '', d1: '', d2: '', dn: 30, dres: '', unitCat: 'len', unitVal: '1', unitFrom: 'm' },
  sc: { total: 100, n: 20, nSub: 4, step: 0.5, diffs: [], res: null, msg: '' },
  gr: { total: 200, scheme: '9', round: 'round', res: null }
};

/* ── 선 아이콘(스쿨보드 모양) — 24×24 · 선 굵기 1.8 ── */
var TB_SVG = {
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  pdf: '<path d="M4 6V4a2 2 0 0 1 2-2h8.5L20 7.5V20a2 2 0 0 1-2 2H4"/><path d="M14 2v6h6"/><circle cx="6" cy="14" r="3"/><path d="M6 10v1"/><path d="M6 17v1"/><path d="M10 14H9"/><path d="M3 14H2"/>',
  dice: '<rect width="12" height="12" x="2" y="10" rx="2"/><path d="m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6"/><path d="M6 18h.01"/><path d="M10 14h.01"/><path d="M15 6h.01"/><path d="M18 9h.01"/>',
  qr: '<rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/>',
  alarm: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M5 3 2 6"/><path d="m22 6-3-3"/><path d="M6.38 18.7 4 21"/><path d="M17.64 18.67 20 21"/>',
  game: '<line x1="6" x2="10" y1="11" y2="11"/><line x1="8" x2="8" y1="9" y2="13"/><line x1="15" x2="15.01" y1="12" y2="12"/><line x1="18" x2="18.01" y1="10" y2="10"/><path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258A4 4 0 0 0 17.32 5z"/>',
  calc: '<rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/>',
  list: '<line x1="10" x2="21" y1="6" y2="6"/><line x1="10" x2="21" y1="12" y2="12"/><line x1="10" x2="21" y1="18" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>',
  award: '<path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/><circle cx="12" cy="8" r="6"/>'
};
function tbIcon(k, sz) {
  return '<svg class="tbi" width="' + (sz || 24) + '" height="' + (sz || 24) + '" viewBox="0 0 24 24" fill="none" '
    + 'stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (TB_SVG[k] || '') + '</svg>';
}

var TB_TOOLS = [
  { k: 'pdf', ic: 'pdf', t: 'PDF 편집기', badge: 'NEW', d: 'PDF 합치기·나누기·쪽 뽑기·쪽 지우기·돌리기, 그림을 PDF 로 만들기를 내 컴퓨터에서 처리합니다.' },
  { k: 'rnd', ic: 'dice', t: '랜덤 뽑기·모둠 편성', d: '학급 명단이나 직접 적은 이름으로 발표자를 뽑고 모둠을 자동으로 편성합니다.' },
  { k: 'qr', ic: 'qr', t: 'QR 생성기', d: '주소나 글을 QR 코드로 만들어 그림으로 저장하거나 복사합니다.' },
  { k: 'tm', ic: 'alarm', t: '수업 타이머', badge: 'NEW', d: '안내 글과 함께 큰 화면 타이머를 띄우고 끝나면 소리로 알려 줍니다.' },
  { k: 'nm', ic: 'game', t: '학생이름외우기', d: '번호를 보고 이름 떠올리기: 카드 연습 · 퀴즈 · 짝맞추기로 새 학기 이름을 빠르게 외웁니다.' },
  { k: 'cal', ic: 'calc', t: '계산기', d: '사칙연산·계산 기록, 날짜 계산, 단위 변환을 한곳에서 씁니다.' },
  { k: 'sc', ic: 'list', t: '시험문제 배점 산출기', d: '총점과 문항 수에 맞춰 문항별 배점을 난이도에 따라 자동으로 산출합니다.' },
  { k: 'gr', ic: 'award', t: '등급별 인원 예측', d: '총 인원 기준으로 등급별 인원과 누적 석차를 예측합니다.' }
];

/* ── 바로가기 탭에 들어가는 «도구상자» 타일 ── */
function tbEntryTile() {
  return '<div class="lgrp">도구상자</div><div class="lnks">'
    + '<button class="tbentry" data-tbact="open"><span class="tbei">' + tbIcon('wrench', 26) + '</span>'
    + '<span class="tbet"><b>도구상자</b><small>PDF · 뽑기·모둠 · QR · 타이머 · 계산기 외 8가지</small></span></button></div>';
}

function viewToolbox() {
  var tool = TB_TOOLS.filter(function (x) { return x.k === TB.tool; })[0];
  var h = '<div class="top2"><div class="wknav">'
    + '<button class="wkb" data-tbact="back">← ' + (tool ? '도구상자' : '바로가기') + '</button>'
    + '<span class="wklab">' + (tool ? tbIcon(tool.ic, 18) + ' ' + esc(tool.t) : tbIcon('wrench', 18) + ' 도구상자') + '</span></div></div>';
  if (!tool) {
    h += '<div class="tbsub">필요한 도구를 고르세요. 각 도구는 별도의 화면으로 열립니다.</div><div class="tbgrid">'
      + TB_TOOLS.map(function (x) {
          return '<button class="tbcard" data-tbact="tool" data-tbv="' + x.k + '">'
            + (x.badge ? '<em class="tbbadge">' + x.badge + '</em>' : '')
            + '<span class="tbci">' + tbIcon(x.ic, 28) + '</span><b>' + esc(x.t) + '</b><small>' + esc(x.d) + '</small></button>';
        }).join('') + '</div>';
    return h + tbBigTimer();
  }
  var body = { pdf: tbPdfHtml, rnd: tbRndHtml, qr: tbQrHtml, tm: tbTmHtml, nm: tbNmHtml, cal: tbCalHtml, sc: tbScHtml, gr: tbGrHtml }[tool.k];
  return h + '<div class="tbbody">' + body() + '</div>' + tbBigTimer();
}

/* ── 작은 부품 ── */
function tbPal(path, cur, items) {   // 단추 팔레트: items = [[값, 글자], …]
  return '<span class="tbpal">' + items.map(function (it) {
    return '<button class="wkb' + (String(cur) === String(it[0]) ? ' go' : '') + '" data-tbact="set" data-tbp="' + path + '" data-tbv="' + esc(it[0]) + '">' + esc(it[1]) + '</button>';
  }).join('') + '</span>';
}
function tbStep(path, val, min, max) {  // − [값] +
  return '<span class="tbstep"><button class="wkb" data-tbact="step" data-tbp="' + path + '" data-tbv="-1" data-tbmin="' + min + '" data-tbmax="' + max + '">−</button>'
    + '<b>' + esc(val) + '</b><button class="wkb" data-tbact="step" data-tbp="' + path + '" data-tbv="1" data-tbmin="' + min + '" data-tbmax="' + max + '">＋</button></span>';
}
function tbMsg(m, ok) { return m ? '<div class="' + (ok === false ? 'atwarn' : 'rhint') + '">' + esc(m) + '</div>' : ''; }
function tbRoster() {
  var c = (typeof REC !== 'undefined' && REC && REC.roster && REC.roster.classes) || [];
  return c.filter(function (x) { return x.students && x.students.length; });
}
function tbRosterBtns(path, withNo) {
  var cs = tbRoster();
  if (!cs.length) return '<div class="rhint">학급 명단을 쓰려면 «학생기록» 탭을 한 번 열어 두세요(명단이 자동으로 생깁니다). 지금은 이름을 직접 적어 주세요.</div>';
  return '<div class="tbpal"><span class="slab">학급 명단</span>' + cs.map(function (c) {
    return '<button class="wkb" data-tbact="roster" data-tbp="' + path + '" data-tbv="' + esc(c.key) + '" data-tbno="' + (withNo ? 1 : 0) + '">' + esc(c.key) + ' (' + c.students.length + ')</button>';
  }).join('') + '</div>';
}
function tbNames(txt) {
  return String(txt || '').split(/[\n,]+/).map(function (s) { return s.trim(); }).filter(Boolean);
}
function tbShuffle(a) {
  a = a.slice();
  for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}
function tbPath(path) {   // 'rnd.names' → [TB.rnd, 'names']
  var p = path.split('.'), o = TB;
  for (var i = 0; i < p.length - 1; i++) o = o[p[i]];
  return [o, p[p.length - 1]];
}
function tbNum(v, d) { var n = Number(v); return isFinite(n) ? n : d; }
function tbFmt(n) { return String(Number(Number(n).toPrecision(9))); }

/* ═══════════ ① PDF 편집기 ═══════════ */
var TB_PDF_MODES = [['merge', '합치기'], ['split', '나누기'], ['extract', '쪽 뽑기'], ['delete', '쪽 지우기'], ['rotate', '돌리기'], ['images', '그림→PDF']];
function tbPdfHtml() {
  var s = TB.pdf, m = s.mode, multi = (m === 'merge' || m === 'images');
  var h = '<div class="tbrow">' + tbPal('pdf.mode', m, TB_PDF_MODES) + '</div>';
  h += '<div class="tbhint">' + ({
    merge: '여러 PDF 를 위에서부터 차례로 한 파일로 합칩니다.',
    split: '쪽 묶음마다 파일 하나로 나눕니다. 예) 1-3,4-6,7 → 파일 3개',
    extract: '고른 쪽만 뽑아 새 PDF 한 개로 만듭니다. 예) 1-3,5',
    delete: '고른 쪽을 뺀 나머지로 새 PDF 를 만듭니다. 예) 2,4-5',
    rotate: '고른 쪽을 돌립니다. 쪽을 비우지 말고 전체는 1- 로 적으세요.',
    images: '그림(PNG·JPG)을 한 쪽에 한 장씩 A4 에 맞춰 PDF 로 만듭니다.'
  })[m] + '</div>';
  h += '<div class="tbrow"><button class="wkb go" data-tbact="pdfpick">' + (multi ? '＋ 파일 고르기' : '📂 파일 고르기') + '</button>'
    + (s.files.length ? '<button class="wkb" data-tbact="pdfclear">비우기</button>' : '') + '</div>';
  if (s.files.length) {
    h += '<div class="tbfiles">' + s.files.map(function (f, i) {
      return '<div class="tbf' + (f.error ? ' bad' : '') + '"><span class="tbfn"><b>' + esc(f.name) + '</b><i>'
        + (f.error ? esc(f.error) : (f.pages ? f.pages + '쪽 · ' : '') + Math.round(f.size / 1024).toLocaleString() + ' KB') + '</i></span>'
        + (multi ? '<button class="wkb" data-tbact="pdfup" data-tbv="' + i + '"' + (i === 0 ? ' disabled' : '') + '>▲</button>'
          + '<button class="wkb" data-tbact="pdfdn" data-tbv="' + i + '"' + (i === s.files.length - 1 ? ' disabled' : '') + '>▼</button>'
          + '<button class="wkb" data-tbact="pdfx" data-tbv="' + i + '">✕</button>' : '') + '</div>';
    }).join('') + '</div>';
  }
  if (m === 'split' || m === 'extract' || m === 'delete' || m === 'rotate') {
    h += '<div class="tbrow"><label class="tbl">쪽 번호</label><input class="gpai wide" data-tbin="pdf.pages" placeholder="'
      + (m === 'rotate' ? '예) 1-  또는  2,4' : '예) 1-3,5,8-') + '" value="' + esc(s.pages) + '"></div>';
  }
  if (m === 'rotate') h += '<div class="tbrow"><label class="tbl">돌릴 각도</label>' + tbPal('pdf.angle', s.angle, [[90, '오른쪽 90°'], [180, '180°'], [270, '왼쪽 90°']]) + '</div>';
  if (m === 'images') h += '<div class="tbrow"><label class="tbl">크기</label>' + tbPal('pdf.fit', s.fit ? 1 : 0, [[1, 'A4 에 맞추기'], [0, '그림 크기 그대로']]) + '</div>';
  var label = { merge: '합치기', split: '나누기', extract: '쪽 뽑기', delete: '쪽 지우기', rotate: '돌리기', images: 'PDF 만들기' }[m];
  h += '<div class="tbrow"><button class="wkb go tbgo" data-tbact="pdfgo"' + (s.busy ? ' disabled' : '') + '>' + (s.busy ? '처리 중…' : label + ' 시작') + '</button></div>';
  h += tbMsg(s.msg, s.ok);
  if (s.saved.length) h += '<div class="tbrow"><button class="wkb" data-tbact="reveal" data-tbv="' + esc(s.saved[0]) + '">📁 저장된 곳 열기</button></div>';
  return h + '<div class="tbfoot">압축·한글 문서 변환은 아직 없습니다. 파일은 내 컴퓨터 안에서만 처리하고 어디로도 보내지 않습니다.</div>';
}

/* ═══════════ ② 랜덤 뽑기·모둠 편성 ═══════════ */
function tbRndHtml() {
  var s = TB.rnd, names = tbNames(s.names);
  var h = tbRosterBtns('rnd.names', false)
    + '<textarea class="gpai wide tbta" rows="5" data-tbin="rnd.names" placeholder="이름을 한 줄에 하나씩(또는 쉼표로) 적어 주세요">' + esc(s.names) + '</textarea>'
    + '<div class="tbhint">현재 ' + names.length + '명</div>'
    + '<div class="tbrow">' + tbPal('rnd.mode', s.mode, [['pick', '🎲 발표자 뽑기'], ['group', '👥 모둠 편성']]) + '</div>';
  if (s.mode === 'pick') {
    var left = s.left === null ? names : s.left;
    h += '<div class="tbrow"><label class="tbl">뽑을 사람 수</label>' + tbStep('rnd.n', s.n, 1, 20)
      + tbPal('rnd.noRepeat', s.noRepeat ? 1 : 0, [[1, '뽑힌 사람 빼기'], [0, '중복 허용']]) + '</div>'
      + '<div class="tbrow"><button class="wkb go tbgo" data-tbact="rndpick">뽑기!</button>'
      + (s.picked.length ? '<button class="wkb" data-tbact="rndreset">처음부터 다시</button>' : '') + '</div>'
      + (s.noRepeat && s.left !== null ? '<div class="tbhint">남은 사람 ' + left.length + '명</div>' : '');
    if (s.picked.length) h += '<div class="tbres">' + s.picked.map(function (n) { return '<span class="tbtag big">' + esc(n) + '</span>'; }).join('') + '</div>';
  } else {
    h += '<div class="tbrow">' + tbPal('rnd.gBy', s.gBy, [['count', '모둠 수'], ['size', '모둠당 인원']])
      + tbStep('rnd.gNum', s.gNum, 2, 30) + '<span class="tbhint">' + (s.gBy === 'count' ? '모둠' : '명씩') + '</span></div>'
      + '<div class="tbrow"><button class="wkb go tbgo" data-tbact="rndgroup">편성하기</button>'
      + (s.groups.length ? '<button class="wkb" data-tbact="rndcopy">복사</button>' : '') + '</div>';
    if (s.groups.length) h += '<div class="tbgroups">' + s.groups.map(function (g, i) {
      return '<div class="tbgrp"><b>' + (i + 1) + '모둠 <small>' + g.length + '명</small></b>' + g.map(function (n) { return '<span class="tbtag">' + esc(n) + '</span>'; }).join('') + '</div>';
    }).join('') + '</div>';
  }
  return h + tbMsg(s.msg, true);
}
function tbMakeGroups(names, by, num) {
  var n = names.length;
  var g = by === 'count' ? Math.min(Math.max(1, num), n) : Math.ceil(n / Math.max(1, num));
  var out = []; for (var i = 0; i < g; i++) out.push([]);
  tbShuffle(names).forEach(function (nm, i) { out[i % g].push(nm); });
  return out;
}

/* ═══════════ ③ QR 생성기 ═══════════ */
function tbQrHtml() {
  var s = TB.qr;
  var h = '<textarea class="gpai wide tbta" rows="3" data-tbin="qr.text" placeholder="QR 로 만들 주소나 글 (예: https://…)">' + esc(s.text) + '</textarea>'
    + '<div class="tbrow"><label class="tbl">크기</label>' + tbPal('qr.size', s.size, [[256, '작게'], [512, '보통'], [1024, '크게']])
    + '<label class="tbl">오류 복원</label>' + tbPal('qr.level', s.level, [['L', '낮음 7%'], ['M', '보통 15%'], ['Q', '높음 25%'], ['H', '최고 30%']]) + '</div>'
    + '<div class="tbrow"><label class="tbl">색</label>' + tbPal('qr.dark', s.dark, [['#000000', '검정'], ['#1e3a8a', '남색'], ['#6d28d9', '보라'], ['#047857', '초록'], ['#b91c1c', '빨강']]) + '</div>'
    + '<div class="tbrow"><button class="wkb go tbgo" data-tbact="qrmake"' + (s.busy ? ' disabled' : '') + '>' + (s.busy ? '만드는 중…' : 'QR 만들기') + '</button></div>';
  if (s.dataUrl) {
    h += '<div class="tbqr"><img src="' + s.dataUrl + '" alt="QR"></div>'
      + '<div class="tbrow"><button class="wkb go" data-tbact="qrsave">💾 그림으로 저장</button><button class="wkb" data-tbact="qrcopy">⧉ 복사</button></div>';
  }
  return h + tbMsg(s.msg, s.ok);
}

/* ═══════════ ④ 수업 타이머 ═══════════ */
function tbTmFmt(sec) { sec = Math.max(0, Math.ceil(sec)); var m = Math.floor(sec / 60), r = sec % 60; return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r; }
function tbTmLeft() { var t = TB.tm; return t.run ? Math.max(0, (t.end - Date.now()) / 1000) : t.left; }
function tbTmHtml() {
  var t = TB.tm;
  var h = '<div class="tbrow">' + tbPal('tm.mins', t.mins, [[1, '1분'], [3, '3분'], [5, '5분'], [10, '10분'], [15, '15분'], [20, '20분'], [30, '30분'], [45, '45분'], [50, '50분']]) + '</div>'
    + '<div class="tbrow"><label class="tbl">직접(분)</label>' + tbStep('tm.mins', t.mins, 1, 180) + '</div>'
    + '<div class="tbrow"><label class="tbl">안내 글</label><input class="gpai wide" data-tbin="tm.msg" placeholder="예) 모둠 활동 정리하고 자리에 앉아요" value="' + esc(t.msg) + '"></div>'
    + '<div class="tbdigits' + (t.done ? ' done' : '') + '" id="tbDigits">' + (t.done ? '끝!' : tbTmFmt(tbTmLeft())) + '</div>'
    + (t.msg ? '<div class="tbtmmsg">' + esc(t.msg) + '</div>' : '')
    + '<div class="tbrow">'
    + (t.run ? '<button class="wkb tbgo" data-tbact="tmpause">⏸ 잠깐 멈춤</button>'
      : '<button class="wkb go tbgo" data-tbact="tmstart">▶ ' + (t.left > 0 && t.left < t.mins * 60 && !t.done ? '이어서' : '시작') + '</button>')
    + '<button class="wkb" data-tbact="tmreset">↺ 처음으로</button>'
    + '<button class="wkb" data-tbact="tmbig">⛶ 크게 보기</button></div>';
  return h;
}
function tbBigTimer() {
  var t = TB.tm;
  if (!t.big) return '';
  return '<div class="tbbig" data-tbact="tmbig"><div class="tbbigd" id="tbBigDigits">' + (t.done ? '끝!' : tbTmFmt(tbTmLeft())) + '</div>'
    + (t.msg ? '<div class="tbbigm">' + esc(t.msg) + '</div>' : '') + '<small>화면을 누르면 닫힙니다</small></div>';
}
var tbTimerId = null;
function tbBeep(times) {
  try {
    var AC = window.AudioContext || window.webkitAudioContext, c = new AC(), t0 = c.currentTime;
    for (var i = 0; i < (times || 3); i++) {
      var o = c.createOscillator(), g = c.createGain();
      o.type = 'sine'; o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, t0 + i * 0.55);
      g.gain.exponentialRampToValueAtTime(0.4, t0 + i * 0.55 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.55 + 0.45);
      o.connect(g); g.connect(c.destination); o.start(t0 + i * 0.55); o.stop(t0 + i * 0.55 + 0.5);
    }
    setTimeout(function () { try { c.close(); } catch (e) { /* 이미 닫힘 */ } }, 2600);
  } catch (e) { /* 소리를 못 내도 화면은 간다 */ }
}
function tbTick() {
  var t = TB.tm;
  if (!t.run) return;
  var left = tbTmLeft();
  var txt = tbTmFmt(left);
  ['tbDigits', 'tbBigDigits'].forEach(function (id) { var el = document.getElementById(id); if (el) el.textContent = txt; });
  if (left <= 0) {
    t.run = false; t.left = 0; t.done = true;
    clearInterval(tbTimerId); tbTimerId = null;
    tbBeep(4); render();
  }
}

/* ═══════════ ⑤ 학생이름외우기 ═══════════ */
function tbNmList() {   // [{no, name, ph}] — «번호 이름» 한 줄씩, ph = 사진(있으면)
  return String(TB.nm.src || '').split('\n').map(function (l) { return l.trim(); }).filter(Boolean).map(function (l) {
    var m = l.match(/^(\S+)\s+(.+)$/);
    var it = m ? { no: m[1], name: m[2].trim() } : { no: '', name: l };
    it.ph = TB.nm.photos[it.name] || '';
    return it;
  });
}
/* 사진 보기 상태면, 사진 있는 학생만 연습한다(둘 이상일 때) — 사진 없는 학생이 섞이면 헷갈린다 */
function tbNmPool(list) {
  if (TB.nm.show !== 'photo') return list;
  var w = list.filter(function (x) { return x.ph; });
  return w.length >= 2 ? w : list;
}
function tbNmPhotoCount(list) { return list.filter(function (x) { return x.ph; }).length; }
/* 명단이 바뀌었으면 저장된 사진을 한 번 불러온다(그린 뒤 비동기 → 다시 그림) */
function tbNmPhotoSync(list) {
  var s = TB.nm, sig = list.map(function (x) { return x.name; }).join('|');
  if (sig === s.photoSig) return;
  s.photoSig = sig;
  if (!list.length) return;
  widgetAPI.tbPhotoGet(list.map(function (x) { return x.name; })).then(function (r) {
    var got = (r && r.photos) || {}, n = 0;
    Object.keys(got).forEach(function (k) { if (s.photos[k] !== got[k]) { s.photos[k] = got[k]; n++; } });
    if (n) { s.order = []; s.q = null; s.pairs = null; render(); }
  }).catch(function () { /* 사진을 못 불러와도 번호·이름 연습은 된다 */ });
}
/* 파일 이름 → 명단의 누구인가. 이름이 들어 있으면 그 사람(긴 이름 먼저), 아니면 번호가 «따로 떨어진 숫자» 로 들어 있는 사람 */
function tbNmMatch(base, list) {
  var b = String(base || '').replace(/\.[^.]+$/, '');
  var byName = list.filter(function (x) { return x.name && b.indexOf(x.name) >= 0; })
    .sort(function (a, c) { return c.name.length - a.name.length; });
  if (byName.length) return byName[0];
  var nums = b.match(/\d+/g) || [];
  for (var i = 0; i < list.length; i++) {
    if (list[i].no && nums.indexOf(String(list[i].no)) >= 0) return list[i];
  }
  return null;
}
/* 큰 사진을 줄인다 — canvas 로 그리면 휴대폰 세로 사진의 회전(EXIF)이 반영된다. 긴 쪽 360px JPEG */
function tbNmShrink(dataUrl) {
  return new Promise(function (res, rej) {
    var im = new Image();
    im.onload = function () {
      var w = im.naturalWidth, h = im.naturalHeight, k = Math.min(1, 360 / Math.max(w, h));
      var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
      var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height);
      res(c.toDataURL('image/jpeg', 0.85));
    };
    im.onerror = function () { rej(new Error('그림을 열 수 없습니다')); };
    im.src = dataUrl;
  });
}
function tbNmPhotoStore(name, path) {   // 한 장: 읽기 → 줄이기 → 저장 → 화면 사진 갱신
  return widgetAPI.tbPhotoRead(path).then(function (r) {
    if (!r || !r.ok) throw new Error((r && r.msg) || '읽지 못했습니다');
    return tbNmShrink(r.dataUrl);
  }).then(function (small) {
    return widgetAPI.tbPhotoSave({ name: name, dataUrl: small }).then(function (r) {
      if (!r || !r.ok) throw new Error((r && r.msg) || '저장하지 못했습니다');
      TB.nm.photos[name] = small;
    });
  });
}
function tbNmPhotosBulk() {
  var s = TB.nm, list = tbNmList();
  if (!list.length) { s.msg = '먼저 위에 학생 명단을 적어 주세요'; render(); return; }
  widgetAPI.tbPhotoPick(true).then(function (r) {
    var files = (r && r.files) || [];
    if (!files.length) return;
    s.busy = true; s.msg = '사진 ' + files.length + '장을 넣는 중…'; render();
    var okN = 0, miss = [], dup = {}, chain = Promise.resolve();
    files.forEach(function (f) {
      chain = chain.then(function () {
        var who = tbNmMatch(f.name, list);
        if (!who) { miss.push(f.name); return; }
        if (dup[who.name]) { miss.push(f.name + '(같은 학생 « ' + who.name + ' » 사진이 이미 있어 건너뜀)'); return; }
        dup[who.name] = 1;
        return tbNmPhotoStore(who.name, f.path).then(function () { okN++; }).catch(function (e) { miss.push(f.name + ' — ' + ((e && e.message) || e)); });
      });
    });
    return chain.then(function () {
      s.busy = false; s.order = []; s.q = null; s.pairs = null;
      s.msg = '사진 ' + okN + '장을 넣었습니다.' + (miss.length ? ' 짝을 못 찾은 파일 ' + miss.length + '개: ' + miss.slice(0, 4).join(', ') + (miss.length > 4 ? ' …' : '') : '');
      render();
    });
  }).catch(function (e) { s.busy = false; s.msg = String((e && e.message) || e); render(); });
}
function tbNmPhotoOne(name) {
  var s = TB.nm;
  widgetAPI.tbPhotoPick(false).then(function (r) {
    var f = r && r.files && r.files[0];
    if (!f) return;
    return tbNmPhotoStore(name, f.path).then(function () { s.order = []; s.q = null; s.pairs = null; s.msg = name + ' 사진을 넣었습니다'; render(); });
  }).catch(function (e) { s.msg = String((e && e.message) || e); render(); });
}
function tbNmThumb(x, cls) {
  return x.ph ? '<img class="' + cls + '" src="' + x.ph + '" alt="">' : '';
}
function tbNmHtml() {
  var s = TB.nm, list = tbNmList();
  tbNmPhotoSync(list);
  var nph = tbNmPhotoCount(list), pool = tbNmPool(list), photoMode = s.show === 'photo' && nph >= 2;
  var h = tbRosterBtns('nm.src', true)
    + '<textarea class="gpai wide tbta" rows="4" data-tbin="nm.src" placeholder="한 줄에 «번호 이름» (예: 3201 강재은). 학급 명단 단추를 눌러도 됩니다">' + esc(s.src) + '</textarea>'
    + '<div class="tbhint">현재 ' + list.length + '명 · 사진 ' + nph + '명'
    + (nph ? '' : ' — 사진이 없으면 번호와 이름으로 연습합니다')
    + (photoMode && pool.length < list.length ? ' · 사진 있는 ' + pool.length + '명만 연습' : '') + '</div>'
    + '<div class="tbrow"><button class="wkb go" data-tbact="nmphotos"' + (s.busy ? ' disabled' : '') + '>📷 사진 넣기(여러 장)</button>'
    + '<button class="wkb' + (s.manage ? ' go' : '') + '" data-tbact="nmmanage">🖼 학생별 사진</button>'
    + (nph ? '<button class="wkb" data-tbact="nmphotoclear">🗑 사진 모두 지우기</button>' : '') + '</div>'
    + '<div class="tbhint">파일 이름에 <b>학생 이름</b>이나 <b>번호</b>가 들어 있으면 자동으로 짝지어 줍니다 (예: 강재은.jpg · 3201.jpg · 3201_강재은.png). 사진은 이 PC 에만 저장되고 밖으로 나가지 않습니다.</div>';
  if (s.manage) {
    h += list.length ? '<div class="tbpgrid">' + list.map(function (x) {
      return '<div class="tbpcell"><button class="tbpbtn" data-tbact="nmphoto1" data-tbv="' + esc(x.name) + '" title="사진 고르기">'
        + (x.ph ? '<img src="' + x.ph + '" alt="">' : '<span class="tbpno">＋</span>') + '</button>'
        + '<div class="tbpnm">' + esc(x.name) + '</div>'
        + (x.ph ? '<button class="tbpx" data-tbact="nmphotodel" data-tbv="' + esc(x.name) + '" title="이 사진 지우기">×</button>' : '') + '</div>';
    }).join('') + '</div>' : '<div class="empty">명단을 먼저 적어 주세요.</div>';
  }
  h += '<div class="tbrow">' + tbPal('nm.mode', s.mode, [['card', '🃏 카드 연습'], ['quiz', '❓ 퀴즈'], ['match', '🔗 짝맞추기']])
    + (nph >= 2 ? tbPal('nm.show', s.show, [['photo', '🖼 사진으로'], ['no', '# 번호로']]) : '') + '</div>';
  if (list.length < 2) return h + '<div class="empty">두 명 이상 적어 주세요.</div>' + tbMsg(s.msg, true);
  if (s.mode === 'card') {
    if (!s.order.length || s.order.length !== pool.length) { s.order = pool.map(function (_, i) { return i; }); s.idx = 0; s.flip = false; }
    var cur = pool[s.order[s.idx % s.order.length]];
    h += '<div class="tbcardbig" data-tbact="nmflip"><small>' + (s.idx + 1) + ' / ' + pool.length + '</small>'
      + (photoMode ? tbNmThumb(cur, 'tbph') : '')
      + '<div class="tbcn' + (photoMode && cur.ph ? ' sm' : '') + '">' + esc(cur.no || '·') + '</div>'
      + '<div class="tbcm">' + (s.flip ? esc(cur.name) : '눌러서 이름 보기') + '</div></div>'
      + '<div class="tbrow"><button class="wkb" data-tbact="nmprev">◀ 이전</button><button class="wkb go" data-tbact="nmnext">다음 ▶</button>'
      + '<button class="wkb" data-tbact="nmshuf">🔀 섞기</button></div>';
  } else if (s.mode === 'quiz') {
    if (!s.q) s.q = tbNmQuiz(pool, list);
    h += '<div class="tbhint">맞힘 ' + s.score + ' / 시도 ' + s.tried + '</div>'
      + '<div class="tbcardbig"><small>' + (photoMode ? '이 학생의 이름은?' : '이 번호의 이름은?') + '</small>'
      + (photoMode ? tbNmThumb(s.q.cur, 'tbph') : '')
      + '<div class="tbcn' + (photoMode && s.q.cur.ph ? ' sm' : '') + '">' + esc(s.q.cur.no || '·') + '</div></div>'
      + '<div class="tbchoices">' + s.q.choices.map(function (c) {
          var cls = s.picked ? (c === s.q.cur.name ? ' ok' : (c === s.picked ? ' bad' : '')) : '';
          return '<button class="wkb tbch' + cls + '" data-tbact="nmans" data-tbv="' + esc(c) + '"' + (s.picked ? ' disabled' : '') + '>' + esc(c) + '</button>';
        }).join('') + '</div>'
      + (s.picked ? '<div class="tbrow"><button class="wkb go" data-tbact="nmnextq">다음 문제 ▶</button></div>' : '');
  } else {
    if (!s.pairs) s.pairs = tbNmPairs(pool);
    var left = s.pairs.filter(function (p) { return !p.done; });
    h += '<div class="tbhint">틀린 횟수 ' + s.fails + (left.length ? '' : ' — 모두 맞췄어요! 🎉') + '</div><div class="tbmatch"><div class="tbmc">'
      + s.pairs.map(function (p, i) {
          var lab = (photoMode && p.ph) ? '<img class="tbthumb" src="' + p.ph + '" alt=""><span>' + esc(p.no || '·') + '</span>' : esc(p.no || '·');
          return '<button class="wkb tbmb' + (photoMode && p.ph ? ' hasph' : '') + (p.done ? ' done' : '') + (s.selL === i ? ' sel' : '') + '" data-tbact="nmL" data-tbv="' + i + '"' + (p.done ? ' disabled' : '') + '>' + lab + '</button>';
        }).join('')
      + '</div><div class="tbmc">'
      + s.pairs.map(function (p, i) { var j = p.rpos; var q = s.pairs[j]; return '<button class="wkb tbmb' + (q.done ? ' done' : '') + (s.selR === j ? ' sel' : '') + '" data-tbact="nmR" data-tbv="' + j + '"' + (q.done ? ' disabled' : '') + '>' + esc(q.name) + '</button>'; }).join('')
      + '</div></div><div class="tbrow"><button class="wkb" data-tbact="nmagain">🔀 새로 섞기</button></div>';
  }
  return h + tbMsg(s.msg, true);
}
function tbNmQuiz(pool, all) {
  var cur = pool[Math.floor(Math.random() * pool.length)];
  var others = tbShuffle((all || pool).filter(function (x) { return x.name !== cur.name; })).slice(0, 3).map(function (x) { return x.name; });
  return { cur: cur, choices: tbShuffle(others.concat([cur.name])) };
}
function tbNmPairs(list) {
  var pick = tbShuffle(list).slice(0, 6);
  var right = tbShuffle(pick.map(function (_, i) { return i; }));
  return pick.map(function (p, i) { return { no: p.no, name: p.name, ph: p.ph, done: false, rpos: right[i] }; });
}

/* ═══════════ ⑥ 계산기 ═══════════ */
var TB_KEYS = ['C', '⌫', '(', ')', '7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '−', '0', '.', '%', '＋'];
function tbEval(src) {
  var s = String(src || '').replace(/×/g, '*').replace(/÷/g, '/').replace(/[−–]/g, '-').replace(/＋/g, '+').replace(/\s+/g, '');
  if (!s) return { ok: false, msg: '' };
  s = s.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');
  if (!/^[0-9+\-*/().]+$/.test(s)) return { ok: false, msg: '숫자와 ＋ − × ÷ ( ) % 만 쓸 수 있어요' };
  try {
    var v = Function('"use strict";return (' + s + ')')();
    if (typeof v !== 'number' || !isFinite(v)) return { ok: false, msg: '계산할 수 없어요(0으로 나눔 등)' };
    return { ok: true, v: Number(v.toPrecision(12)) };
  } catch (e) { return { ok: false, msg: '식이 올바르지 않아요' }; }
}
var TB_UNITS = {
  len: { name: '길이', base: { mm: 0.001, cm: 0.01, m: 1, km: 1000, 인치: 0.0254, 피트: 0.3048, 야드: 0.9144, 마일: 1609.344 } },
  wt: { name: '무게', base: { g: 1, kg: 1000, 톤: 1e6, 온스: 28.349523125, 파운드: 453.59237 } },
  area: { name: '넓이', base: { '㎡': 1, 평: 3.305785, '㎢': 1e6, 헥타르: 1e4, '평방피트': 0.09290304, 에이커: 4046.8564224 } },
  temp: { name: '온도', base: { '℃': 1, '℉': 1, K: 1 } }
};
function tbUnitConv(cat, val, from) {
  var u = TB_UNITS[cat], out = {};
  if (cat === 'temp') {
    var c = from === '℃' ? val : from === '℉' ? (val - 32) * 5 / 9 : val - 273.15;
    out['℃'] = c; out['℉'] = c * 9 / 5 + 32; out['K'] = c + 273.15; return out;
  }
  var base = val * u.base[from];
  Object.keys(u.base).forEach(function (k) { out[k] = base / u.base[k]; });
  return out;
}
function tbDow(d) { return '일월화수목금토'.charAt(d.getDay()); }
function tbDateStr(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + ' (' + tbDow(d) + ')'; }
function tbParseYmd(s) { var m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; }
function tbCalHtml() {
  var s = TB.cal;
  var h = '<div class="tbrow">' + tbPal('cal.tab', s.tab, [['calc', '계산'], ['date', '날짜 계산'], ['unit', '단위 변환']]) + '</div>';
  if (s.tab === 'calc') {
    h += '<div class="tbexpr"><input id="tbExpr" class="gpai wide" data-tbin="cal.expr" placeholder="식을 쓰고 = 또는 Enter" value="' + esc(s.expr) + '" autocomplete="off"></div>'
      + (s.res !== '' ? '<div class="tbcres">= ' + esc(s.res) + '</div>' : '') + (s.err ? '<div class="atwarn">' + esc(s.err) + '</div>' : '')
      + '<div class="tbkeys">' + TB_KEYS.map(function (k) { return '<button class="wkb tbk' + (/^[÷×−＋]$/.test(k) ? ' op' : '') + '" data-tbact="key" data-tbv="' + esc(k) + '">' + k + '</button>'; }).join('')
      + '<button class="wkb go tbk eq" data-tbact="eq">=</button></div>';
    if (s.hist.length) h += '<div class="tbhist"><b>계산 기록</b>' + s.hist.map(function (x, i) {
      return '<button class="wkb" data-tbact="hist" data-tbv="' + i + '">' + esc(x.e) + ' = <b>' + esc(x.r) + '</b></button>';
    }).join('') + '<button class="wkb" data-tbact="histclear">기록 지우기</button></div>';
  } else if (s.tab === 'date') {
    h += '<div class="tbrow"><label class="tbl">두 날짜 사이</label><input type="date" class="gpai" data-tbin="cal.d1" value="' + esc(s.d1) + '"> ~ <input type="date" class="gpai" data-tbin="cal.d2" value="' + esc(s.d2) + '">'
      + '<button class="wkb go" data-tbact="dcalc">며칠?</button></div>'
      + '<div class="tbrow"><label class="tbl">기준일 + N일</label><input type="date" class="gpai" data-tbin="cal.d1" value="' + esc(s.d1) + '"> + '
      + '<input type="number" class="gpai" style="width:5em" data-tbin="cal.dn" value="' + esc(s.dn) + '"> 일<button class="wkb go" data-tbact="dadd">날짜는?</button></div>'
      + (s.dres ? '<div class="tbcres">' + esc(s.dres) + '</div>' : '');
  } else {
    var u = TB_UNITS[s.unitCat];
    h += '<div class="tbrow">' + tbPal('cal.unitCat', s.unitCat, Object.keys(TB_UNITS).map(function (k) { return [k, TB_UNITS[k].name]; })) + '</div>'
      + '<div class="tbrow"><label class="tbl">값</label><input id="tbUv" class="gpai" style="width:8em" data-tbin="cal.unitVal" value="' + esc(s.unitVal) + '">'
      + tbPal('cal.unitFrom', s.unitFrom, Object.keys(u.base).map(function (k) { return [k, k]; })) + '<button class="wkb go" data-tbact="ucalc">변환</button></div>';
    var v = parseFloat(s.unitVal);
    if (isFinite(v)) {
      var r = tbUnitConv(s.unitCat, v, u.base[s.unitFrom] ? s.unitFrom : Object.keys(u.base)[0]);
      h += '<div class="tbunits">' + Object.keys(r).map(function (k) { return '<span class="tbtag' + (k === s.unitFrom ? ' on' : '') + '">' + tbFmt(r[k]) + ' ' + esc(k) + '</span>'; }).join('') + '</div>';
    }
  }
  return h;
}
function tbCalcRun() {
  var s = TB.cal, r = tbEval(s.expr);
  if (!r.ok) { s.err = r.msg; s.res = ''; return; }
  s.err = ''; s.res = tbFmt(r.v);
  s.hist.unshift({ e: s.expr, r: s.res }); s.hist = s.hist.slice(0, 10);
}

/* ═══════════ ⑦ 시험문제 배점 산출기 ═══════════ */
var TB_DW = { 상: 1.25, 중: 1, 하: 0.8 };
function tbScoreCalc(total, n, nSub, diffs, step) {
  if (!(total > 0) || !(n >= 1)) return { ok: false, msg: '총점과 문항 수를 확인해 주세요' };
  if (nSub < 0 || nSub > n) return { ok: false, msg: '서답형 수가 문항 수보다 클 수 없어요' };
  var units = Math.round(total / step);
  if (Math.abs(units * step - total) > 1e-9) return { ok: false, msg: '총점이 배점 단위(' + step + '점)의 배수가 아니에요' };
  if (units < n) return { ok: false, msg: '문항 수가 너무 많아 한 문항에 ' + step + '점도 못 줘요' };
  var w = [], i;
  for (i = 0; i < n; i++) w.push((i >= n - nSub ? 1.5 : 1) * TB_DW[diffs[i] || '중']);
  var sumW = w.reduce(function (a, b) { return a + b; }, 0);
  var raw = w.map(function (x) { return x / sumW * units; });
  var base = raw.map(function (x) { return Math.max(1, Math.floor(x)); });
  var diff = units - base.reduce(function (a, b) { return a + b; }, 0);
  var order = raw.map(function (x, k) { return k; }).sort(function (a, b) { return (raw[b] - Math.floor(raw[b])) - (raw[a] - Math.floor(raw[a])); });
  var k = 0;
  while (diff > 0) { base[order[k % n]]++; diff--; k++; }
  k = 0;
  while (diff < 0) {                       // 모자라지 않게 가장 큰 배점에서 덜어 낸다
    var big = 0; for (i = 1; i < n; i++) if (base[i] > base[big]) big = i;
    if (base[big] <= 1) break;
    base[big]--; diff++;
  }
  return { ok: true, pts: base.map(function (u) { return Math.round(u * step * 100) / 100; }) };
}
function tbScHtml() {
  var s = TB.sc;
  while (s.diffs.length < s.n) s.diffs.push('중');
  var h = '<div class="tbrow"><label class="tbl">총점</label><input type="number" class="gpai" style="width:6em" data-tbin="sc.total" value="' + esc(s.total) + '">'
    + '<label class="tbl">문항 수</label><input type="number" class="gpai" style="width:5em" data-tbin="sc.n" value="' + esc(s.n) + '">'
    + '<label class="tbl">그중 서답형</label><input type="number" class="gpai" style="width:5em" data-tbin="sc.nSub" value="' + esc(s.nSub) + '"></div>'
    + '<div class="tbrow"><label class="tbl">배점 단위</label>' + tbPal('sc.step', s.step, [[0.1, '0.1점'], [0.5, '0.5점'], [1, '1점']])
    + '<button class="wkb go tbgo" data-tbact="sccalc">배점 산출</button></div>'
    + '<div class="tbhint">서답형은 뒤쪽 문항으로 보고 1.5배, 난이도 상 1.25배·하 0.8배 비율로 나눕니다. 난이도는 표에서 눌러 바꾸세요.</div>';
  if (s.res) {
    var sum = s.res.reduce(function (a, b) { return a + b; }, 0);
    h += '<table class="tbtbl"><thead><tr><th>번호</th><th>구분</th><th>난이도</th><th>배점</th></tr></thead><tbody>'
      + s.res.map(function (p, i) {
          return '<tr><td>' + (i + 1) + '</td><td>' + (i >= s.res.length - s.nSub ? '서답형' : '선택형') + '</td>'
            + '<td><button class="wkb" data-tbact="scdiff" data-tbv="' + i + '">' + (s.diffs[i] || '중') + '</button></td><td><b>' + tbFmt(p) + '</b></td></tr>';
        }).join('') + '</tbody><tfoot><tr><td colspan="3">합계</td><td><b>' + tbFmt(sum) + '</b></td></tr></tfoot></table>'
      + '<div class="tbrow"><button class="wkb" data-tbact="sccopy">⧉ 표 복사</button></div>';
  }
  return h + tbMsg(s.msg, false);
}

/* ═══════════ ⑧ 등급별 인원 예측 ═══════════ */
var TB_GR = { '9': [4, 11, 23, 40, 60, 77, 89, 96, 100], '5': [10, 34, 66, 90, 100] };
function tbGradeCalc(N, scheme, mode) {
  var cum = TB_GR[scheme], prev = 0, out = [];
  cum.forEach(function (c, i) {
    var x = N * c / 100;
    var l = mode === 'ceil' ? Math.ceil(x - 1e-9) : mode === 'floor' ? Math.floor(x + 1e-9) : Math.round(x);
    if (i === cum.length - 1) l = N;
    l = Math.max(l, prev);
    out.push({ grade: i + 1, pct: i ? c - cum[i - 1] : c, cum: c, count: l - prev, limit: l });
    prev = l;
  });
  return out;
}
function tbGrHtml() {
  var s = TB.gr;
  var h = '<div class="tbrow"><label class="tbl">총 인원</label><input type="number" class="gpai" style="width:6em" data-tbin="gr.total" value="' + esc(s.total) + '">명</div>'
    + '<div class="tbrow"><label class="tbl">등급제</label>' + tbPal('gr.scheme', s.scheme, [['9', '9등급 (4·7·12·17·20·17·12·7·4%)'], ['5', '5등급 (10·24·32·24·10%)']]) + '</div>'
    + '<div class="tbrow"><label class="tbl">경계 처리</label>' + tbPal('gr.round', s.round, [['round', '반올림'], ['ceil', '올림'], ['floor', '내림']])
    + '<button class="wkb go tbgo" data-tbact="grcalc">예측하기</button></div>';
  if (s.res) {
    h += '<table class="tbtbl"><thead><tr><th>등급</th><th>비율</th><th>누적 비율</th><th>인원</th><th>누적 석차</th></tr></thead><tbody>'
      + s.res.map(function (r) {
          return '<tr><td><b>' + r.grade + '</b></td><td>' + r.pct + '%</td><td>' + r.cum + '%</td><td><b>' + r.count + '명</b></td><td>~' + r.limit + '등</td></tr>';
        }).join('') + '</tbody></table>'
      + '<div class="tbhint">동점자는 같은 등급으로 보고, 경계에 걸린 동점자는 위 등급에 넣는 학교가 많습니다 — 학교 규정을 따르세요.</div>';
  }
  return h;
}

/* ═══════════ 단추 동작 ═══════════ */
function tbAct(act, v, b) {
  var s;
  switch (act) {
    case 'open': TB.open = true; TB.tool = ''; break;
    case 'back': if (TB.tool) TB.tool = ''; else TB.open = false; break;
    case 'tool': TB.tool = v; break;
    case 'set': {
      var pp = tbPath(b.dataset.tbp), cur = pp[0][pp[1]];
      pp[0][pp[1]] = (typeof cur === 'number') ? Number(v) : (typeof cur === 'boolean') ? (v === '1' || v === 'true') : v;
      if (b.dataset.tbp === 'pdf.mode') { TB.pdf.files = []; TB.pdf.msg = ''; TB.pdf.saved = []; }
      if (b.dataset.tbp === 'tm.mins') { TB.tm.left = TB.tm.mins * 60; TB.tm.run = false; TB.tm.done = false; clearInterval(tbTimerId); tbTimerId = null; }
      if (b.dataset.tbp === 'rnd.mode' || b.dataset.tbp === 'rnd.noRepeat') { TB.rnd.left = null; TB.rnd.picked = []; }
      if (b.dataset.tbp === 'nm.mode' || b.dataset.tbp === 'nm.show') { TB.nm.msg = ''; TB.nm.order = []; TB.nm.q = null; TB.nm.pairs = null; TB.nm.picked = ''; TB.nm.selL = TB.nm.selR = -1; }
      if (b.dataset.tbp === 'cal.unitFrom' || b.dataset.tbp === 'cal.unitCat') {
        if (b.dataset.tbp === 'cal.unitCat') TB.cal.unitFrom = Object.keys(TB_UNITS[TB.cal.unitCat].base)[0];
      }
      if (b.dataset.tbp === 'sc.step' || b.dataset.tbp === 'gr.scheme' || b.dataset.tbp === 'gr.round') { TB.sc.res = null; TB.gr.res = null; }
      break;
    }
    case 'step': {
      var p2 = tbPath(b.dataset.tbp);
      p2[0][p2[1]] = Math.min(Number(b.dataset.tbmax), Math.max(Number(b.dataset.tbmin), Number(p2[0][p2[1]]) + Number(v)));
      if (b.dataset.tbp === 'tm.mins') { TB.tm.left = TB.tm.mins * 60; TB.tm.run = false; TB.tm.done = false; clearInterval(tbTimerId); tbTimerId = null; }
      break;
    }
    case 'roster': {
      var cls = tbRoster().filter(function (c) { return c.key === v; })[0];
      if (cls) {
        var p3 = tbPath(b.dataset.tbp);
        p3[0][p3[1]] = cls.students.map(function (st) { return b.dataset.tbno === '1' ? (st.id + ' ' + st.name) : st.name; }).join('\n');
        TB.rnd.left = null; TB.rnd.picked = []; TB.nm.order = []; TB.nm.q = null; TB.nm.pairs = null;
      }
      break;
    }
    case 'reveal': widgetAPI.tbReveal(v); return;
    /* PDF */
    case 'pdfpick': {
      s = TB.pdf; var multi = (s.mode === 'merge' || s.mode === 'images');
      widgetAPI.tbPdfPick(s.mode === 'images' ? 'image' : (multi ? 'multi' : 'one')).then(function (r) {
        if (r && r.files && r.files.length) { s.files = multi ? s.files.concat(r.files) : r.files.slice(0, 1); s.msg = ''; s.saved = []; }
        render();
      }).catch(function (e) { s.msg = String((e && e.message) || e); s.ok = false; render(); });
      return;
    }
    case 'pdfclear': TB.pdf.files = []; TB.pdf.msg = ''; TB.pdf.saved = []; break;
    case 'pdfx': TB.pdf.files.splice(Number(v), 1); break;
    case 'pdfup': { var i1 = Number(v); if (i1 > 0) { var t1 = TB.pdf.files[i1]; TB.pdf.files[i1] = TB.pdf.files[i1 - 1]; TB.pdf.files[i1 - 1] = t1; } break; }
    case 'pdfdn': { var i2 = Number(v), L = TB.pdf.files; if (i2 < L.length - 1) { var t2 = L[i2]; L[i2] = L[i2 + 1]; L[i2 + 1] = t2; } break; }
    case 'pdfgo': {
      s = TB.pdf;
      var good = s.files.filter(function (f) { return !f.error; });
      if (!good.length) { s.msg = '파일을 먼저 골라 주세요'; s.ok = false; break; }
      s.busy = true; s.msg = ''; s.saved = []; render();
      widgetAPI.tbPdfRun({ op: s.mode, files: good.map(function (f) { return f.path; }), pages: s.pages, angle: s.angle, fit: s.fit })
        .then(function (r) { s.busy = false; s.ok = !!(r && r.ok) || !!(r && r.canceled); s.msg = (r && r.msg) || '못 했습니다'; s.saved = (r && r.saved) || []; render(); })
        .catch(function (e) { s.busy = false; s.ok = false; s.msg = String((e && e.message) || e).replace(/^Error invoking remote method .[^.]*.:\s*/, ''); render(); });
      return;
    }
    /* 랜덤 */
    case 'rndpick': {
      s = TB.rnd; var names = tbNames(s.names);
      if (!names.length) { s.msg = '이름을 먼저 적어 주세요'; break; }
      var pool = s.noRepeat ? (s.left === null ? names : s.left) : names;
      if (!pool.length) { s.msg = '모두 뽑았어요 — «처음부터 다시» 를 눌러 주세요'; break; }
      var take = Math.min(s.n, pool.length), sh = tbShuffle(pool);
      s.picked = sh.slice(0, take);
      if (s.noRepeat) s.left = sh.slice(take);
      s.msg = take < s.n ? '남은 사람이 모자라 ' + take + '명만 뽑았어요' : '';
      break;
    }
    case 'rndreset': TB.rnd.picked = []; TB.rnd.left = null; TB.rnd.msg = ''; break;
    case 'rndgroup': {
      s = TB.rnd; var nm2 = tbNames(s.names);
      if (nm2.length < 2) { s.msg = '두 명 이상 적어 주세요'; s.groups = []; break; }
      s.groups = tbMakeGroups(nm2, s.gBy, s.gNum); s.msg = '';
      break;
    }
    case 'rndcopy': {
      var txt = TB.rnd.groups.map(function (g, i) { return (i + 1) + '모둠: ' + g.join(', '); }).join('\n');
      try { navigator.clipboard.writeText(txt); TB.rnd.msg = '복사했어요'; } catch (e) { TB.rnd.msg = '복사하지 못했어요'; }
      break;
    }
    /* QR */
    case 'qrmake': {
      s = TB.qr;
      if (!String(s.text || '').trim()) { s.msg = '주소나 글을 적어 주세요'; s.ok = false; break; }
      s.busy = true; s.msg = ''; render();
      widgetAPI.tbQr({ text: s.text, size: s.size, level: s.level, dark: s.dark }).then(function (r) {
        s.busy = false;
        if (r && r.ok) { s.dataUrl = r.dataUrl; s.ok = true; s.msg = ''; } else { s.ok = false; s.msg = (r && r.msg) || '못 만들었어요'; }
        render();
      }).catch(function (e) { s.busy = false; s.ok = false; s.msg = String((e && e.message) || e); render(); });
      return;
    }
    case 'qrsave':
      widgetAPI.tbQrSave({ dataUrl: TB.qr.dataUrl, name: 'QR' }).then(function (r) { TB.qr.ok = !!(r && (r.ok || r.canceled)); TB.qr.msg = (r && r.msg) || ''; render(); });
      return;
    case 'qrcopy':
      widgetAPI.tbQrCopy({ dataUrl: TB.qr.dataUrl }).then(function (r) { TB.qr.ok = !!(r && r.ok); TB.qr.msg = (r && r.msg) || ''; render(); });
      return;
    /* 타이머 */
    case 'tmstart': {
      s = TB.tm; if (s.done || s.left <= 0) { s.left = s.mins * 60; s.done = false; }
      s.run = true; s.end = Date.now() + s.left * 1000;
      clearInterval(tbTimerId); tbTimerId = setInterval(tbTick, 250);
      break;
    }
    case 'tmpause': s = TB.tm; s.left = tbTmLeft(); s.run = false; clearInterval(tbTimerId); tbTimerId = null; break;
    case 'tmreset': s = TB.tm; s.run = false; s.done = false; s.left = s.mins * 60; clearInterval(tbTimerId); tbTimerId = null; break;
    case 'tmbig': TB.tm.big = !TB.tm.big; break;
    /* 이름외우기 */
    case 'nmflip': TB.nm.flip = !TB.nm.flip; break;
    case 'nmnext': TB.nm.idx = (TB.nm.idx + 1) % Math.max(1, TB.nm.order.length); TB.nm.flip = false; break;
    case 'nmprev': TB.nm.idx = (TB.nm.idx - 1 + TB.nm.order.length) % Math.max(1, TB.nm.order.length); TB.nm.flip = false; break;
    case 'nmphotos': tbNmPhotosBulk(); return;
    case 'nmphoto1': tbNmPhotoOne(v); return;
    case 'nmphotodel': {
      widgetAPI.tbPhotoDel([v]).then(function () { delete TB.nm.photos[v]; TB.nm.order = []; TB.nm.q = null; TB.nm.pairs = null; TB.nm.msg = v + ' 사진을 지웠습니다'; render(); });
      return;
    }
    case 'nmphotoclear': {
      var allN = tbNmList().map(function (x) { return x.name; });
      widgetAPI.tbPhotoDel(allN).then(function (r) { TB.nm.photos = {}; TB.nm.order = []; TB.nm.q = null; TB.nm.pairs = null; TB.nm.msg = '이 명단의 사진 ' + ((r && r.n) || 0) + '장을 지웠습니다'; render(); });
      return;
    }
    case 'nmmanage': TB.nm.manage = !TB.nm.manage; break;
    case 'nmshuf': TB.nm.order = tbShuffle(tbNmPool(tbNmList()).map(function (_, i) { return i; })); TB.nm.idx = 0; TB.nm.flip = false; break;
    case 'nmans': s = TB.nm; if (!s.picked) { s.picked = v; s.tried++; if (v === s.q.cur.name) s.score++; } break;
    case 'nmnextq': TB.nm.q = tbNmQuiz(tbNmPool(tbNmList()), tbNmList()); TB.nm.picked = ''; break;
    case 'nmL': TB.nm.selL = Number(v); tbNmCheck(); break;
    case 'nmR': TB.nm.selR = Number(v); tbNmCheck(); break;
    case 'nmagain': TB.nm.pairs = null; TB.nm.selL = TB.nm.selR = -1; TB.nm.fails = 0; break;
    /* 계산기 */
    case 'key': {
      s = TB.cal;
      if (v === 'C') { s.expr = ''; s.res = ''; s.err = ''; }
      else if (v === '⌫') s.expr = s.expr.slice(0, -1);
      else s.expr += v;
      break;
    }
    case 'eq': tbCalcRun(); break;
    case 'hist': { var hh = TB.cal.hist[Number(v)]; if (hh) { TB.cal.expr = hh.e; TB.cal.res = hh.r; TB.cal.err = ''; } break; }
    case 'histclear': TB.cal.hist = []; break;
    case 'dcalc': {
      s = TB.cal; var a = tbParseYmd(s.d1), c2 = tbParseYmd(s.d2);
      if (!a || !c2) { s.dres = '두 날짜를 골라 주세요'; break; }
      var days = Math.round((c2 - a) / 86400000);
      s.dres = tbDateStr(a) + ' → ' + tbDateStr(c2) + ' : ' + (days >= 0 ? '' : '(앞선 날짜) ') + Math.abs(days) + '일 (' + Math.floor(Math.abs(days) / 7) + '주 ' + (Math.abs(days) % 7) + '일) · 양 끝 날을 모두 센다면 ' + (Math.abs(days) + 1) + '일';
      break;
    }
    case 'dadd': {
      s = TB.cal; var a2 = tbParseYmd(s.d1);
      if (!a2) { s.dres = '기준일을 골라 주세요'; break; }
      var r2 = new Date(a2); r2.setDate(r2.getDate() + Math.round(Number(s.dn) || 0));
      s.dres = tbDateStr(a2) + ' ' + (Number(s.dn) >= 0 ? '+' : '−') + ' ' + Math.abs(Math.round(Number(s.dn) || 0)) + '일 = ' + tbDateStr(r2);
      break;
    }
    case 'ucalc': break;   // 값은 이미 담겼다 — 다시 그리면 결과가 나온다
    /* 배점 */
    case 'sccalc': {
      s = TB.sc; s.total = tbNum(s.total, 100); s.n = Math.min(100, Math.max(1, Math.round(tbNum(s.n, 20)))); s.nSub = Math.round(tbNum(s.nSub, 0));
      while (s.diffs.length < s.n) s.diffs.push('중'); s.diffs.length = s.n;
      var r3 = tbScoreCalc(s.total, s.n, s.nSub, s.diffs, s.step);
      if (r3.ok) { s.res = r3.pts; s.msg = ''; } else { s.res = null; s.msg = r3.msg; }
      break;
    }
    case 'scdiff': {
      s = TB.sc; var di = Number(v); s.diffs[di] = ({ 중: '상', 상: '하', 하: '중' })[s.diffs[di] || '중'];
      var r4 = tbScoreCalc(s.total, s.n, s.nSub, s.diffs, s.step); if (r4.ok) s.res = r4.pts;
      break;
    }
    case 'sccopy': {
      s = TB.sc;
      var lines = s.res.map(function (p, i) { return (i + 1) + '번\t' + (i >= s.res.length - s.nSub ? '서답형' : '선택형') + '\t' + tbFmt(p); });
      try { navigator.clipboard.writeText(lines.join('\n')); s.msg = ''; } catch (e) { /* 못 복사해도 그만 */ }
      break;
    }
    /* 등급 */
    case 'grcalc': {
      s = TB.gr; s.total = Math.max(1, Math.round(tbNum(s.total, 200)));
      s.res = tbGradeCalc(s.total, s.scheme, s.round);
      break;
    }
  }
  render();
}
function tbNmCheck() {
  var s = TB.nm;
  if (s.selL < 0 || s.selR < 0) return;
  if (s.selL === s.selR) { s.pairs[s.selL].done = true; }
  else s.fails++;
  s.selL = s.selR = -1;
}

/* 그린 뒤 단추·입력칸을 이어 준다 — views.js 의 배선 자리에서 부른다 */
function wireToolbox(app) {
  app.querySelectorAll('[data-tbact]').forEach(function (b) {
    b.addEventListener('click', function (ev) { ev.stopPropagation(); tbAct(b.dataset.tbact, b.dataset.tbv, b); });
  });
  app.querySelectorAll('[data-tbin]').forEach(function (el) {
    var path = el.dataset.tbin;
    el.addEventListener('input', function () {
      var p = tbPath(path);
      p[0][p[1]] = (el.type === 'number') ? el.value : el.value;
    });
    el.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      if (el.tagName === 'TEXTAREA') { if (!e.ctrlKey) return; }
      e.preventDefault();
      if (path === 'cal.expr') { TB.cal.expr = el.value; tbAct('eq', '', el); }
      else if (path === 'cal.unitVal') { TB.cal.unitVal = el.value; tbAct('ucalc', '', el); }
      else if (path === 'qr.text') { TB.qr.text = el.value; tbAct('qrmake', '', el); }
    });
  });
}
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && TB.tm.big) { TB.tm.big = false; if (typeof render === 'function') render(); }
});
