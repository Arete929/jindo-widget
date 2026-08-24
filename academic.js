// 파일명: academic.js | @version 1.15.0
// 학교 «연간 수업일수 계획표» 구글 시트에서 학사일정을 받아온다.
//
// ★ 권한이 필요 없다. «링크가 있는 사람» 공유이면 아래 주소로 그냥 받아진다.
//     https://docs.google.com/spreadsheets/d/<시트ID>/gviz/tq?tqx=out:csv&sheet=<탭이름>
//   탭 이름으로 부를 수 있어서 gid 를 몰라도 된다.
//
// ★ 시트 짜임 (수업진도 앱이 쓰는 것과 같은 원본이다)
//     탭 이름 = 월 ('3'~'12','1','2', 방학이 낀 달은 '8-1','8-2' 처럼 나뉘기도 한다)
//     열: [일, 요일, N월 행사내용, (작년 참고), 1학년 1~7교시, 2학년 1~7교시, 3학년 1~7교시]

const { fetchText } = require('./fetchtext.js');

const DEFAULT_SHEET = '1T8Ww4ejXmPsM1Q8NRny13VBElRF0C41L';
// 학년도 순서 — 3월에 시작해 이듬해 2월에 끝난다
const MONTH_TABS = ['3', '4', '5', '6', '7', '8-1', '8-2', '8', '9', '10', '11', '12', '1', '2'];

/* 큰따옴표 안의 쉼표·줄바꿈까지 지키는 CSV 해석 */
function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', q = false;
  const s = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === '"') {
        if (s[i + 1] === '"') { cell += '"'; i++; } else q = false;
      } else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

const DAY_OK = /^[일월화수목금토]$/;

/* 한 달치 → { month, days:[{day, dow, event, grades:{1:[...],2:[...],3:[...]}}] } */
function parseMonth(csv, tab) {
  const rows = parseCsv(csv);
  // 학년 머리(1학년/2학년/3학년)가 있는 행을 찾아 각 학년의 시작 열을 잡는다
  let gradeCol = null;
  for (const r of rows.slice(0, 6)) {
    const found = {};
    r.forEach((v, i) => {
      const m = String(v || '').replace(/\s/g, '').match(/^([123])학년$/);
      if (m && found[m[1]] === undefined) found[m[1]] = i;
    });
    if (found['1'] !== undefined && found['3'] !== undefined) { gradeCol = found; break; }
  }

  const days = [];
  for (const r of rows) {
    const dayNum = Number(String(r[0] || '').trim());
    const dow = String(r[1] || '').trim();
    if (!dayNum || dayNum < 1 || dayNum > 31 || !DAY_OK.test(dow)) continue;
    const event = String(r[2] || '').replace(/\s+/g, ' ').trim();
    const grades = {};
    if (gradeCol) {
      [1, 2, 3].forEach((g) => {
        const start = gradeCol[String(g)];
        if (start === undefined) return;
        const codes = [];
        for (let p = 0; p < 7; p++) codes.push(String(r[start + p] || '').trim());
        if (codes.some(Boolean)) grades[g] = codes;
      });
    }
    days.push({ day: dayNum, dow: dow, event: event, grades: grades });
  }
  // ★ 달은 «탭 이름»에서 뽑는 것이 가장 확실하다.
  //   예전에는 시트 안에서 «N월» 이라고 적힌 칸을 찾아 썼는데, 표 어딘가에 다른 달이
  //   적혀 있으면 엉뚱한 달이 된다 — 실제로 «8» 탭이 «3월» 로 잡혀 단추가 겹쳤다.
  //   탭 이름은 3~12·1·2 와 «8-1»·«8-2» 처럼 한 달을 둘로 나눈 것뿐이라 앞자리만 보면 된다.
  const fromTab = (String(tab).match(/^(\d{1,2})/) || [])[1];
  const fromCell = (String(rows.map(r => r[2] || '').find(v => /(\d{1,2})월/.test(v)) || '')
    .match(/(\d{1,2})월/) || [])[1];
  return { tab: tab, month: fromTab || fromCell || tab, days: days };
}

/* 한 달 받기 */
async function fetchMonth(tab, sheetId) {
  const id = sheetId || DEFAULT_SHEET;
  const csv = await fetchText(`https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`);
  return parseMonth(csv, tab);
}

/* 있는 탭을 훑어 한 해치를 받는다. 없는 탭은 조용히 건너뛴다. */
async function fetchYear(sheetId, onStep) {
  const out = { fetchedAt: new Date().toISOString(), sheetId: sheetId || DEFAULT_SHEET, months: [], error: '' };
  for (const tab of MONTH_TABS) {
    try {
      const m = await fetchMonth(tab, sheetId);
      if (m.days.length) out.months.push(m);
    } catch (e) { /* 없는 달은 넘어간다 */ }
    if (onStep) onStep(tab);
  }
  if (!out.months.length) out.error = '학사일정을 하나도 읽지 못했습니다 (시트 공유 상태를 확인해 주세요)';
  return out;
}

module.exports = { fetchMonth, fetchYear, parseMonth, MONTH_TABS, DEFAULT_SHEET };
