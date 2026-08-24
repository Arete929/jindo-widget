// 파일명: worknotice.js | @version 1.0.0
// 주간업무계획 구글 문서를 위젯이 직접 받아 정리한다.
//
// ★ 드라이브 권한이 필요 없다.
//   구글 문서는 «링크가 있는 사람» 공유 상태이면 아래 주소로 글자만 그냥 받아진다.
//     https://docs.google.com/document/d/<문서ID>/export?format=txt
//   처음에는 드라이브 API 로 읽으려 했는데, drive.readonly 는 구글이 «제한된 권한» 으로
//   묶어 두어서 검증 안 받은 앱에는 잘 내주지 않는다. 그래서 계속 403 이 났다.
//   이 길은 권한도, 로그인도, 크롬 왕복도 필요 없다.

const { fetchText } = require('./fetchtext.js');

const DOCS = {
  input: '1wtwG8gIc1aSQBTK15cYpB5MN52WUS2BQjDT_NT9yg2s',   // 입력본 (이번 주)
  merged: '1FSTfU1JVke3IA5zgiouS1ozeSR14rkXLBg4_KsuFSB0'   // 합본 (누적)
};

const DAY_RE = /^(\d{1,2})\s*\(\s*([월화수목금토일])\s*\)$/;
const RANGE_RE = /^20\d\d\s*\.\s*\d{1,2}\s*\.\s*\d{1,2}\s*\.?\s*\([월화수목금토일]\)\s*[~〜～]/;
const DEPT_RE = /^(\d{1,2})\s*\.\s*([가-힣0-9 ]+(?:부|실))$/;
const ETC_RE = /^기타$/;
const JUNK_RE = /^[:\-\s]+$/;

function clean(t) {
  return String(t || '')
    .replace(/﻿/g, '')
    .replace(/ /g, ' ')
    .replace(/^#+\s*/, '')
    .trim();
}
/* 한 칸 안에 ♣ 로 여러 건이 붙어 있다 — 건별로 쪼갠다 */
function splitNotes(raw) {
  return String(raw || '').split('♣').map(clean).filter(Boolean);
}

/* 글자를 주차 목록으로. 최신 주차가 앞에 온다(문서 순서 그대로). */
function parseWork(text) {
  const cells = String(text || '')
    .replace(/\r/g, '\n')
    .split(/[\n\t]/)
    .map(clean)
    .map((s) => (JUNK_RE.test(s) ? '' : s));

  const weeks = [];
  let wk = null, dept = null;
  let dayRun = [], waiting = [];

  // 요일 머리 개수와 내용 칸 개수가 딱 맞을 때만 «몇 일 일정»으로 붙인다.
  // 어긋나면 엉뚱한 날에 붙는 것보다 주 단위로 모아두는 편이 정직하다.
  function flushDays() {
    if (!wk || !dayRun.length) { dayRun = []; waiting = []; return; }
    const ok = waiting.length === dayRun.length;
    dayRun.forEach((d, i) => {
      splitNotes(ok ? waiting[i] : '').forEach((t) => d.items.push(t));
      if (d.items.length) wk.days.push(d);
    });
    if (!ok) waiting.forEach((raw) => splitNotes(raw).forEach((t) => wk.notes.push(t)));
    dayRun = []; waiting = [];
  }

  for (const cell of cells) {
    if (RANGE_RE.test(cell)) {
      flushDays();
      wk = { range: cell, days: [], notes: [], depts: [] };
      weeks.push(wk); dept = null;
      continue;
    }
    if (!wk) continue;

    const dm = cell.match(DAY_RE);
    if (dm) {
      if (waiting.length) flushDays();
      dayRun.push({ day: Number(dm[1]), dow: dm[2], label: cell, items: [] });
      dept = null;
      continue;
    }
    const pm = cell.match(DEPT_RE);
    if (pm) {
      flushDays();
      dept = { no: Number(pm[1]), name: clean(pm[2]), lines: [] };
      wk.depts.push(dept);
      continue;
    }
    if (ETC_RE.test(cell)) {
      flushDays();
      dept = { no: 99, name: '기타', lines: [] };
      wk.depts.push(dept);
      continue;
    }
    if (dayRun.length) { waiting.push(cell); continue; }
    if (dept && cell) dept.lines.push(cell);
  }
  flushDays();

  weeks.forEach((w) => {
    w.days = w.days.filter((d) => d.items.length);
    w.depts = w.depts.filter((d) => d.lines.length && !(d.lines.length === 1 && /^없음$/.test(d.lines[0])));
    w.count = w.depts.reduce((n, d) => n + d.lines.length, 0);
  });
  return weeks;
}

/* 두 문서를 받아 정리한다. 하나가 실패해도 나머지는 살린다. */
async function fetchWork(ids) {
  const docs = Object.assign({}, DOCS, ids || {});
  const out = { fetchedAt: new Date().toISOString(), input: null, merged: null, error: '' };
  const one = async (key, label) => {
    try {
      out[key] = parseWork(await fetchText(`https://docs.google.com/document/d/${docs[key]}/export?format=txt`));
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
