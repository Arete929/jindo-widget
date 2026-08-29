// 파일명: mealduty.js | @version 1.0.0
// 수정요약: v1.0.0 첫 판 — 급식지도 순서표(구글 시트)를 읽어 «날짜 → 지도교사» 로 편다
//
// ★ 권한이 필요 없다. «링크가 있는 사람» 공유이면 아래 주소로 그냥 받아진다.
//     https://docs.google.com/spreadsheets/d/<시트ID>/gviz/tq?tqx=out:csv
//
// ★ 시트 짜임 — 여기가 까다롭다
//   ① 한 달이 세 열이다: [일] [요일] [지도교사]. 그런 묶음이 옆으로 여섯 개.
//   ② 그런 판이 «세로로 두 덩이» 다. 위는 3~8월, 아래는 9~2월.
//   ③ 그런데 아래 덩이 머리줄에는 달 이름이 없다 — «요일 / 지도교사» 뿐이다.
//      → 달을 못박으면 내년에 어긋난다. «요일로 알아낸다».
//        1일이 무슨 요일인지가 달마다 다르므로, 며칠만 맞춰 봐도 어느 달인지 갈린다.
//        학사일정(academic.js)이 연도를 알아내는 것과 같은 수법이다.
//
// ★ 지도교사 칸에는 사람 이름만 있는 것이 아니다.
//   «개교기념일 / 기말고사 / 추석연휴 / 재량휴업일» 처럼 그날의 사정이 적혀 있다.
//   그런 날은 «급식 없는 날» 로 본다.
//   «김용환(1학년만 급식)» 처럼 단서가 붙기도 한다 — 이름과 단서를 갈라 읽는다.
//
// ★ 이름은 컴시간과 «모양이 다르다».
//   컴시간은 가려서 준다(김*호). 시트는 온전하다(김진호). 별표 자리를 빼고 맞춰 본다.

const { fetchText } = require('./fetchtext.js');

// 혜원여자중학교 급식지도 순서표
const DEFAULT_SHEET = '166D73pd0TNh01QwO7gtVy0GDkqtgSynlFe6JQd6Wcm8';

const DOW = ['일', '월', '화', '수', '목', '금', '토'];
/* 학년도 차례 — 3월에 시작해 이듬해 2월에 끝난다.
   ★ 시트도 이 차례로 왼쪽에서 오른쪽으로 늘어놓는다. 그 차례가 달을 가리는 열쇠다. */
const MONTH_ORDER = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2];
const DAY_OK = /^[일월화수목금토]$/;

/* 큰따옴표 안의 쉼표·줄바꿈까지 지키는 CSV 해석 */
function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', q = false;
  const s = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === '"') { if (s[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

/* 지도교사 칸을 «이름» 과 «단서» 로 가른다.
   김용환(1학년만 급식) → { name:'김용환', note:'1학년만 급식' }
   개교기념일           → { name:'',       note:'개교기념일' }   ← 급식 없는 날 */
function readCell(raw) {
  const s = String(raw || '').trim();
  if (!s) return null;
  const m = s.match(/^([^(（]*)[(（]([^)）]*)[)）]\s*$/);
  const head = (m ? m[1] : s).trim();
  const note = m ? m[2].trim() : '';
  // 사람 이름은 두세 글자 한글이다. 그 밖은 그날의 사정으로 본다.
  if (/^[가-힣]{2,4}$/.test(head) && head !== '지도교사') {
    return { name: head, note: note };
  }
  return { name: '', note: s };
}

/* 머리줄인가 — «지도교사» 가 두 번 넘게 나오면 머리줄이다.
   ★ 위 덩이는 «3월 일 / 요일 / 지도교사», 아래 덩이는 «(빈칸) / 요일 / 지도교사» 다.
     둘 다 «지도교사» 는 있으므로 그것으로 찾는다. */
function isHeader(row) {
  let n = 0;
  row.forEach((v) => { if (String(v || '').trim() === '지도교사') n++; });
  return n >= 2;
}

/* (일, 요일) 짝들이 어느 (해, 달) 에 맞는지 알아낸다.
   ★ 같은 달이라도 해가 다르면 요일이 통째로 밀린다. 며칠만 맞춰 봐도 갈린다.
   → { y, m, score } · 못 고르면 score 0 */
function guessMonth(pairs, acStart, hintMonth, afterMonth) {
  const list = (pairs || []).filter((p) => p.day >= 1 && p.day <= 31 && DAY_OK.test(p.dow));
  /* 후보는 «앞 묶음보다 뒤인 달» 뿐이다.
     ★ 이것이 없으면 3월↔11월, 9월↔12월 처럼 요일이 통째로 같은 짝을 못 가린다. */
  const from = afterMonth ? MONTH_ORDER.indexOf(afterMonth) + 1 : 0;
  const seq = MONTH_ORDER.slice(Math.max(0, from));
  const cands = seq.map((m) => ({ y: m >= 3 ? acStart : acStart + 1, m }));
  if (!cands.length) return { y: 0, m: 0, score: 0 };
  /* 맞춰 볼 날이 너무 적으면(1·2월처럼 아직 안 채운 묶음) 차례가 곧 답이다 */
  if (list.length < 5) {
    const c0 = hintMonth ? cands.filter((c) => c.m === hintMonth)[0] : cands[0];
    return c0 ? { y: c0.y, m: c0.m, score: 0.5, bySeq: true } : { y: 0, m: 0, score: 0 };
  }
  let best = { y: 0, m: 0, score: 0 };
  cands.forEach((c) => {
    // 머리에 «N월» 이 적혀 있으면 그 달만 본다 — 굳이 헤맬 까닭이 없다
    if (hintMonth && c.m !== hintMonth) return;
    let hit = 0, seen = 0;
    list.forEach((p) => {
      const t = new Date(c.y, c.m - 1, p.day);
      if (t.getMonth() !== c.m - 1) return;    // 그 달에 없는 날(2월 30일 등)
      seen++;
      if (DOW[t.getDay()] === p.dow) hit++;
    });
    const score = seen ? hit / seen : 0;
    if (score > best.score) best = { y: c.y, m: c.m, score };
  });
  if (best.score >= 0.9) return best;
  /* 어중간하다 — 억지로 요일에 맞추면 온 날짜가 어긋난다. 차례를 믿는다. */
  const c0 = hintMonth ? cands.filter((c) => c.m === hintMonth)[0] : cands[0];
  return c0 ? { y: c0.y, m: c0.m, score: best.score, bySeq: true }
    : { y: 0, m: 0, score: best.score };
}

function ymd(y, m, d) {
  const p = (n) => String(n).padStart(2, '0');
  return y + '-' + p(m) + '-' + p(d);
}

/* 시트 글 → { days: {'2026-03-11': {name, note, dow}}, names: {…}, blocks: […] } */
function parseDuty(csv, now) {
  const rows = parseCsv(csv);
  const base = now || new Date();
  // 학년도 — 3월에 시작한다
  const acStart = (base.getMonth() + 1) >= 3 ? base.getFullYear() : base.getFullYear() - 1;

  // 머리줄이 나오는 자리마다 «덩이» 가 시작된다
  const heads = [];
  rows.forEach((r, i) => { if (isHeader(r)) heads.push(i); });

  const days = {};
  const blocks = [];
  const warn = [];
  /* 왼쪽에서 오른쪽으로, 위 덩이에서 아래 덩이로 — 달은 늘 앞으로만 간다 */
  let prevMonth = 0;

  heads.forEach((h, hi) => {
    const head = rows[h];
    const end = (hi + 1 < heads.length) ? heads[hi + 1] : rows.length;
    // 세 열이 한 달이다 — 머리줄의 «지도교사» 자리로 묶음을 잡는다
    for (let c = 0; c + 2 < head.length; c += 3) {
      if (String(head[c + 2] || '').trim() !== '지도교사') continue;
      // 머리에 «N월 일» 이 적혀 있으면 그 달로 본다(위 덩이). 없으면 요일로 알아낸다.
      const hint = Number((String(head[c] || '').match(/^(\d{1,2})월/) || [])[1]) || 0;

      const pairs = [];
      for (let r = h + 1; r < end; r++) {
        const day = Number(String((rows[r] || [])[c] || '').trim());
        const dow = String((rows[r] || [])[c + 1] || '').trim();
        if (!day || day < 1 || day > 31) continue;
        pairs.push({ day, dow, cell: (rows[r] || [])[c + 2], row: r });
      }
      if (!pairs.length) continue;

      const g = guessMonth(pairs, acStart, hint, prevMonth);
      if (!g.m) {
        warn.push('달을 못 알아본 묶음 (머리 «' + String(head[c] || '').trim() + '», 열 ' + c + ')');
        continue;
      }
      prevMonth = g.m;
      const got = { y: g.y, m: g.m, hint: hint, score: g.score,
        bySeq: !!g.bySeq, n: 0, col: c };
      pairs.forEach((p) => {
        const t = new Date(g.y, g.m - 1, p.day);
        if (t.getMonth() !== g.m - 1) return;      // 그 달에 없는 날
        const v = readCell(p.cell);
        if (!v) return;
        days[ymd(g.y, g.m, p.day)] = { name: v.name, note: v.note, dow: p.dow };
        got.n++;
      });
      blocks.push(got);
    }
  });

  // 이름마다 «언제 하는지» 를 모아 둔다
  const names = {};
  Object.keys(days).sort().forEach((k) => {
    const n = days[k].name;
    if (!n) return;
    (names[n] = names[n] || []).push(k);
  });

  return {
    fetchedAt: new Date().toISOString(),
    acStart: acStart,
    days: days,
    names: names,
    blocks: blocks,
    warn: warn,
    error: Object.keys(days).length ? '' : '급식지도 순서표를 읽지 못했습니다 (시트 공유 상태를 확인해 주세요)'
  };
}

/* 컴시간 이름(김*호)에 맞는 시트 이름(김진호)을 고른다.
   ★ 둘 이상 걸리면 «많이 나오는 쪽» 을 쓴다 — 시트 오타(공셰화)가 한 번씩 섞인다. */
function matchName(masked, names) {
  const m = String(masked || '').trim();
  if (!m) return '';
  if (names[m]) return m;                       // 가려지지 않은 이름이면 그대로
  const fits = Object.keys(names).filter((full) => {
    if (full.length !== m.length) return false;
    for (let i = 0; i < m.length; i++) {
      if (m[i] === '*' || m[i] === '＊') continue;
      if (m[i] !== full[i]) return false;
    }
    return true;
  });
  if (!fits.length) return '';
  if (fits.length === 1) return fits[0];
  return fits.sort((a, b) => names[b].length - names[a].length)[0];
}

/* 그 사람의 «앞으로 남은» 급식지도. 오늘 것도 넣는다.
   → [{ date:'2026-10-02', dow:'금', dday:34, note:'' }] */
function nextFor(duty, fullName, now) {
  const list = (duty && duty.names && duty.names[fullName]) || [];
  const base = now ? new Date(now) : new Date();
  base.setHours(0, 0, 0, 0);
  const out = [];
  list.forEach((k) => {
    const t = new Date(k + 'T00:00:00');
    const dd = Math.round((t - base) / 86400000);
    if (dd < 0) return;
    out.push({ date: k, dow: duty.days[k].dow, dday: dd, note: duty.days[k].note || '' });
  });
  return out.sort((a, b) => a.dday - b.dday);
}

/* 시트에서 받아 정리한다 */
async function fetchDuty(sheetId) {
  const id = String(sheetId || '').trim() || DEFAULT_SHEET;
  const csv = await fetchText('https://docs.google.com/spreadsheets/d/' + id
    + '/gviz/tq?tqx=out:csv');
  const out = parseDuty(csv);
  out.sheetId = id;
  return out;
}

/* 붙여넣은 주소에서 시트 ID 만 꺼낸다 (주소를 통째로 넣어도 되게) */
function sheetIdOf(s) {
  const t = String(s || '').trim();
  if (!t) return '';
  const m = t.match(/\/spreadsheets\/d\/([A-Za-z0-9_-]{20,})/);
  return m ? m[1] : (/^[A-Za-z0-9_-]{20,}$/.test(t) ? t : '');
}

module.exports = {
  fetchDuty, parseDuty, matchName, nextFor, sheetIdOf,
  DEFAULT_SHEET, readCell, guessMonth
};
