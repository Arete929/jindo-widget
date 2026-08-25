// 파일명: worknotice.js | @version 2.1.0
// 주간업무계획 구글 문서를 위젯이 직접 받아 «원문 모양 그대로» 정리한다.
//
// ★ 드라이브 권한이 필요 없다.
//   구글 문서는 «링크가 있는 사람» 공유 상태이면 아래 주소로 그냥 받아진다.
//     https://docs.google.com/document/d/<문서ID>/export?format=html
//
// ★ 왜 txt 가 아니라 html 인가 (v2.0.0 에서 바꿈)
//   예전에는 format=txt 로 받았는데, 그러면 «표»가 통째로 풀려서 칸이 줄줄이 늘어서고
//   들여쓰기·띄어쓰기도 전부 사라진다. 급식지도 안내표 같은 건 알아볼 수가 없다.
//   html 로 받으면 <table> 과 앞 공백이 그대로 있어서 원문처럼 다시 그릴 수 있다.
//
// 내보내는 모양
//   week = {
//     range : '2026.8. 24.(월) ~ 2026. 8. 28.(금)',
//     cal   : 표덩어리 | null,            // 요일 일정표 — 원문 표 그대로
//     days  : [{ day, dow, items:[..] }], // 위쪽 «오늘 일정» 띠를 만들려고 따로 뽑아둔 것
//     depts : [{ name:'교무기획부', blocks:[덩어리..] }]
//   }
//   덩어리(block) 는 둘 중 하나다
//     { k:'p',     t:'1. 2학기 시간표 확정 운영 : 8.25(화)~' }
//     { k:'table', rows:[[{ blocks:[..], cs:1, rs:1 }, ..], ..] }
//   글 덩어리는 앞 공백을 그대로 남긴다 — 화면에서 pre-wrap 으로 그리면 원문처럼 보인다.

const { fetchText } = require('./fetchtext.js');

const DOCS = {
  input: '1wtwG8gIc1aSQBTK15cYpB5MN52WUS2BQjDT_NT9yg2s',   // 입력본 (이번 주)
  merged: '1FSTfU1JVke3IA5zgiouS1ozeSR14rkXLBg4_KsuFSB0'   // 합본 (누적)
};

const DAY_RE = /^\s*(\d{1,2})\s*\(\s*([월화수목금토일])\s*\)\s*$/;
const RANGE_RE = /20\d\d\s*\.\s*\d{1,2}\s*\.\s*\d{1,2}\s*\.?\s*\([월화수목금토일]\)\s*[~〜～]/;
const DEPT_RE = /^\s*(\d{1,2})\s*\.\s*([가-힣0-9 ]{2,20}(?:부|실|과))\s*$/;
const ETC_RE = /^\s*기타\s*$/;

/* ── 글자 되살리기 ─────────────────────────────────────────────
   구글이 한글을 전부 &#xxxxx; 로 내보낸다. 앞뒤 공백은 «일부러» 남긴다. */
const NAMED = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  clubs: '♣', hearts: '♥', diams: '◆', spades: '♠', middot: '·',
  ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’', hellip: '…', ndash: '–', mdash: '—',
  rarr: '→', larr: '←', harr: '↔', uarr: '↑', darr: '↓',
  rArr: '⇒', lArr: '⇐', hArr: '⇔',
  bull: '•', sdot: '·', times: '×', divide: '÷', deg: '°', plusmn: '±',
  ne: '≠', le: '≤', ge: '≥', asymp: '≈', equiv: '≡', infin: '∞', radic: '√',
  trade: '™', copy: '©', reg: '®', laquo: '«', raquo: '»',
  prime: '′', Prime: '″', euro: '€', pound: '£', yen: '¥', cent: '¢',
  sect: '§', para: '¶', dagger: '†', Dagger: '‡', permil: '‰',
  sup2: '²', sup3: '³', frac12: '½', frac14: '¼', frac34: '¾',
  sim: '∼', cong: '≅', prop: '∝', ang: '∠', there4: '∴', because: '∵',
  ensp: ' ', emsp: ' ', thinsp: ' ', shy: '', zwj: '', zwnj: ''
};
function decode(s) {
  return String(s || '')
    .replace(/&#x([0-9a-f]+);/gi, (m, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (m, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => (NAMED[n.toLowerCase()] !== undefined ? NAMED[n.toLowerCase()] : m));
}
/* 태그를 걷어내고 글자만 — 줄바꿈(<br>)과 앞 공백은 살린다 */
function textOf(html) {
  return decode(
    String(html || '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p\s*>/gi, '\n')
      .replace(/<[^>]+>/g, '')
  ).replace(/​/g, '');
}
/* 눈에 보이는 글자가 있는지 (공백·♣ 만 있는 칸은 비어 있는 것으로 본다) */
function hasInk(t) {
  return /[^\s ♣·:\-]/.test(String(t || ''));
}

/* ── 표 하나를 줄·칸으로 ────────────────────────────────────────
   표 안에 표가 들어 있는 경우가 있어서(급식지도 안내표), 깊이를 세어
   «내 표의 tr/td» 만 집어낸다. */
function parseTable(s) {
  const rows = [];
  let depth = 0, row = null, open = false, start = 0, attr = '';
  const re = /<(\/?)(table|tr|td|th)\b([^>]*)>/gi;
  let m;
  while ((m = re.exec(s))) {
    const close = m[1] === '/';
    const tag = m[2].toLowerCase();
    if (tag === 'table') { depth += close ? -1 : 1; continue; }
    if (depth !== 1) continue;                       // 안쪽 표의 것은 건드리지 않는다
    if (tag === 'tr') {
      if (close) { if (row) rows.push(row); row = null; }
      else { if (row) rows.push(row); row = []; }
      continue;
    }
    if (close) {
      if (row && open) { row.push(cellOf(attr, s.slice(start, m.index))); open = false; }
    } else {
      if (row && open) { row.push(cellOf(attr, s.slice(start, m.index))); }
      open = true; attr = m[3] || ''; start = m.index + m[0].length;
    }
  }
  if (row) rows.push(row);
  return { k: 'table', rows: rows.filter((r) => r.length) };
}
function numAttr(attr, name) {
  const m = String(attr).match(new RegExp(name + '\\s*=\\s*"?(\\d+)', 'i'));
  return m ? Math.max(1, Number(m[1])) : 1;
}
function cellOf(attr, html) {
  return { blocks: blocksOf(html), cs: numAttr(attr, 'colspan'), rs: numAttr(attr, 'rowspan') };
}

/* ── 조각을 덩어리 목록으로 ────────────────────────────────────
   표는 표대로, 나머지는 문단으로 나눈다. */
function blocksOf(html) {
  const out = [];
  const s = String(html || '');
  let i = 0;
  const open = /<table\b/gi;
  for (;;) {
    open.lastIndex = i;
    const m = open.exec(s);
    if (!m) { pushParas(out, s.slice(i)); break; }
    if (m.index > i) pushParas(out, s.slice(i, m.index));
    // 짝이 맞는 </table> 을 찾는다 (표 안의 표를 건너뛰려고 깊이를 센다)
    const scan = /<table\b|<\/table\s*>/gi;
    scan.lastIndex = m.index;
    let depth = 0, end = -1, t;
    while ((t = scan.exec(s))) {
      if (t[0][1] === '/') { if (--depth === 0) { end = t.index + t[0].length; break; } }
      else depth++;
    }
    if (end < 0) { pushParas(out, s.slice(m.index)); break; }
    const tb = parseTable(s.slice(m.index, end));
    if (tb.rows.length) out.push(tb);
    i = end;
  }
  return out;
}
function pushParas(out, html) {
  if (!html) return;
  // <p>·<li> 단위로 자른다. 목록은 앞에 표식을 붙여 단계가 보이게 한다.
  const parts = String(html).split(/(?=<p\b)|(?=<li\b)/i);
  parts.forEach((part) => {
    if (!/<p\b|<li\b/i.test(part)) {
      const bare = textOf(part);
      bare.split('\n').forEach((ln) => { if (hasInk(ln)) out.push({ k: 'p', t: trimEnd(ln) }); });
      return;
    }
    const li = /^<li\b/i.test(part);
    const al = alignOf(part);
    textOf(part).split('\n').forEach((ln) => {
      if (!hasInk(ln)) return;
      const p = { k: 'p', t: (li ? '  · ' : '') + trimEnd(ln) };
      if (al) p.al = al;
      out.push(p);
    });
  });
}
function trimEnd(s) { return String(s).replace(/[\s ]+$/, ''); }

/* ── 가운데 정렬 같은 «줄 맞춤» 살리기 ────────────────────────────
   구글 문서는 맞춤을 글자에 직접 쓰지 않고 «.c9 { text-align:center }» 처럼
   맨 위 <style> 에 모아 두고 <p class="c9"> 로 가리킨다.
   그래서 클래스 → 맞춤 표를 먼저 만들어 두고, 문단마다 찾아 붙인다.
   급식지도 안내표의 이름이 왼쪽으로 붙어 나오던 것이 이것 때문이었다. */
let ALIGN = {};
function readAligns(html) {
  ALIGN = {};
  const css = (String(html).match(/<style[^>]*>([\s\S]*?)<\/style>/i) || [])[1] || '';
  const re = /\.([a-zA-Z][\w-]*)\s*\{([^}]*)\}/g;
  let m;
  while ((m = re.exec(css))) {
    const a = (m[2].match(/text-align\s*:\s*(center|right)/i) || [])[1];
    if (a) ALIGN[m[1]] = a.toLowerCase();
  }
}
function alignOf(tagHtml) {
  const cls = (String(tagHtml).match(/^<(?:p|li)\b[^>]*class="([^"]*)"/i) || [])[1] || '';
  for (const c of cls.split(/\s+/)) { if (ALIGN[c]) return ALIGN[c]; }
  return '';
}

/* ── 요일 일정표에서 «며칠에 무엇» 을 뽑아낸다 ──────────────────
   화면 위쪽 «오늘 일정» 띠를 만들기 위한 것이다. 표 자체는 따로 그대로 그린다. */
function daysFromCal(table) {
  const days = [];
  const rows = table.rows || [];
  for (let r = 0; r < rows.length; r++) {
    const head = rows[r].map((c) => cellText(c));
    const marks = head.map((t) => t.match(DAY_RE));
    // 그 줄이 통째로 «24(월)» 같은 날짜 머리일 때만 아래 줄을 내용으로 본다
    if (!marks.length || marks.some((m, i) => !m && hasInk(head[i]))) continue;
    const body = rows[r + 1] || [];
    marks.forEach((mk, i) => {
      if (!mk) return;
      const raw = cellText(body[i]);
      const items = String(raw).split('♣').map((t) => t.replace(/\s+/g, ' ').trim()).filter(hasInk);
      days.push({ day: Number(mk[1]), dow: mk[2], items: items });
    });
    r++;
  }
  return days;
}
function cellText(cell) {
  if (!cell) return '';
  return blockText(cell.blocks);
}
function blockText(blocks) {
  return (blocks || []).map((b) => (b.k === 'p' ? b.t
    : (b.rows || []).map((r) => r.map(cellText).join(' ')).join('\n'))).join('\n');
}

/* ── 문서 전체를 주차 목록으로 ─────────────────────────────── */
function parseWork(html) {
  readAligns(html);
  const body = String(html || '').slice(Math.max(0, String(html || '').indexOf('<body')));
  const blocks = blocksOf(body);

  const weeks = [];
  let wk = null, dept = null;

  const newDept = (name) => { dept = { name: name, blocks: [] }; wk.depts.push(dept); };

  for (const b of blocks) {
    if (b.k === 'p') {
      if (RANGE_RE.test(b.t)) {
        wk = { range: b.t.replace(/\s+/g, ' ').trim(), cal: null, days: [], depts: [] };
        weeks.push(wk); dept = null;
        continue;
      }
      if (!wk) continue;
      const dm = b.t.match(DEPT_RE);
      if (dm) { newDept(dm[2].trim()); continue; }
      if (ETC_RE.test(b.t)) { newDept('기타'); continue; }
      if (dept && hasInk(b.t)) dept.blocks.push(b);
      continue;
    }
    if (!wk) continue;

    // 첫 표는 요일 일정표다
    if (!wk.cal) { wk.cal = b; wk.days = daysFromCal(b); continue; }

    // 그 뒤의 표는 «부서» 표 — 첫 칸이 부서 이름이면 새 부서를 연다
    const rows = b.rows || [];
    let usedAsDept = false;
    rows.forEach((row) => {
      const first = cellText(row[0]);
      const dm = first.match(DEPT_RE);
      if (dm) { newDept(dm[2].trim()); usedAsDept = true; return; }
      if (ETC_RE.test(first)) { newDept('기타'); usedAsDept = true; return; }
      if (!dept) return;
      row.forEach((c) => { (c.blocks || []).forEach((x) => { if (blockInk(x)) dept.blocks.push(x); }); });
    });
    // 부서 표가 아니었다면(본문 한가운데 놓인 표) 지금 부서의 내용으로 붙인다
    if (!usedAsDept && !dept && weeks.length) { /* 부서가 없으면 버린다 */ }
  }

  weeks.forEach((w) => {
    w.depts = w.depts.filter((d) => d.blocks.some(blockInk)
      && !(d.blocks.length === 1 && /^\s*없음\s*$/.test(d.blocks[0].t || '')));
    w.count = w.depts.reduce((n, d) => n + d.blocks.length, 0);
  });
  return weeks;
}
function blockInk(b) {
  if (!b) return false;
  if (b.k === 'p') return hasInk(b.t);
  return (b.rows || []).some((r) => r.some((c) => hasInk(cellText(c))));
}

/* ── 두 문서를 받아 정리한다. 하나가 실패해도 나머지는 살린다. ── */
async function fetchWork(ids) {
  const docs = Object.assign({}, DOCS, ids || {});
  const out = { fetchedAt: new Date().toISOString(), input: null, merged: null, error: '' };
  const one = async (key, label) => {
    try {
      const html = await fetchText(`https://docs.google.com/document/d/${docs[key]}/export?format=html`);
      out[key] = parseWork(html);
    } catch (e) {
      out.error += `${label}: ${(e && e.message) || e}  `;
    }
  };
  await one('input', '입력본');
  await one('merged', '합본');
  out.error = out.error.trim();
  return out;
}

module.exports = { fetchWork, parseWork, DOCS };
