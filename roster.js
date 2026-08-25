// 파일명: roster.js | @version 1.0.0
// 전교생 명렬표 시트를 읽어 «학번 4자리 → 이름» 으로 만든다.
//
// ★ 권한이 필요 없다. 학사일정과 같은 방식으로 «링크가 있는 사람» 공유이면 그냥 받아진다.
//     https://docs.google.com/spreadsheets/d/<시트ID>/gviz/tq?tqx=out:csv&sheet=통합
//   내 것이 아니어도 보기 권한만 있으면 된다. 내년에 새 시트가 나오면 설정에서 주소만 바꾼다.
//
// ★ 학번 = 학년(1) + 반(1) + 번호(2)   예) 1101 = 1학년 1반 1번, 3223 = 3학년 2반 23번
//
// ★ 시트 짜임 («통합» 탭)
//   반들이 가로로 늘어서 있고, 반마다 [번호][성명] 두 칸을 쓴다.
//   1행에 «1학년 1반 재적» 같은 이름표가 그 반의 «번호» 칸 자리에 있어 그것으로 자리를 잡는다.
//
// ★ 조심할 것 — 번호 칸이 비어 있는 학생이 꽤 있다(2학년 1반의 2·23·24·25번 등).
//   이름은 번호 순서대로 줄지어 있으므로 번호가 비면 «줄 순서» 로 메운다.
//   실제로 그렇게 했더니 재적 인원과 정확히 맞았다(342명).

const { fetchText } = require('./fetchtext.js');

const DEFAULT_SHEET = '12P5vNuMqZZ-3T0r8_5C-7kZCQlkZ878PjXWhhtMFvjA';
const TAB = '통합';

/* 주소든 ID 든 받아 ID 만 뽑아낸다 */
function sheetId(v) {
  const s = String(v || '').trim();
  const m = s.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : (s || DEFAULT_SHEET);
}

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

function parseRoster(csv) {
  const rows = parseCsv(csv);
  const spots = [];
  (rows[0] || []).forEach((v, c) => {
    const m = String(v).match(/(\d)\s*학년\s*(\d)\s*반/);
    if (m) spots.push({ grade: +m[1], cls: +m[2], col: c });
  });

  const students = [];
  const firstDataRow = 3;   // 0=반이름, 1=재적, 2=«번호/성명» 머리, 3부터 학생
  spots.forEach((sp) => {
    let seq = 0;
    for (let r = firstDataRow; r < rows.length; r++) {
      const noCell = String((rows[r] || [])[sp.col] || '').trim();
      const name = String((rows[r] || [])[sp.col + 1] || '').trim();
      if (!/^[가-힣]{2,5}$/.test(name)) {
        if (/^\d{1,2}$/.test(noCell)) seq = +noCell;   // 이름 없는 빈자리(전학 등)
        continue;
      }
      seq += 1;
      if (/^\d{1,2}$/.test(noCell)) seq = +noCell;      // 적혀 있으면 그것을 믿는다
      students.push({
        id: `${sp.grade}${sp.cls}${String(seq).padStart(2, '0')}`,
        grade: sp.grade, cls: sp.cls, no: seq, name: name
      });
    }
  });
  students.sort((a, b) => a.id.localeCompare(b.id));

  const classes = [];
  students.forEach((s) => {
    const key = `${s.grade}-${s.cls}`;
    let c = classes.filter((x) => x.key === key)[0];
    if (!c) { c = { key: key, grade: s.grade, cls: s.cls, students: [] }; classes.push(c); }
    c.students.push(s);
  });
  classes.sort((a, b) => (a.grade - b.grade) || (a.cls - b.cls));
  return { classes: classes, count: students.length };
}

async function fetchRoster(sheet) {
  const id = sheetId(sheet);
  const csv = await fetchText(
    `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(TAB)}`);
  const out = parseRoster(csv);
  out.sheetId = id;
  out.fetchedAt = new Date().toISOString();
  if (!out.count) out.error = '명렬표를 읽지 못했습니다 (시트 공유 상태와 «통합» 탭을 확인해 주세요)';
  return out;
}

module.exports = { fetchRoster, parseRoster, sheetId, DEFAULT_SHEET, TAB };
