// 파일명: gradeplan.js | @version 1.0.0
// 학년부 일지(일정) 시트 읽기.
//
// 학년마다 «학년부 일지» 구글 시트가 따로 있다. 학사일정(학교 전체)과 달리
// 그 학년만의 할 일이 날짜별로 쌓인다. 학사일정 화면에 얹어 함께 본다.
//
// 시트 생김새 (2026학년도 3학년부 «일지» 탭)
//   일자 | 요일 | 구분 | 내용 | 세부사항 | 확인 | (숨은 칸 몇 개) | 학사일정
//   8/24  월    체육   아침…  가. 기간…   ✔                        학교폭력예방뮤지컬…
//   (빈)  (빈)  진학   영신…  11:00       ✔
//
// ★ 일자가 비어 있으면 «위 날짜에 딸린» 항목이다. 하루에 여러 건이 쌓인다.
// ★ 머리글 줄을 찾아 칸 번호를 잡는다 — 위쪽에 «업무 링크» 같은 딴 줄이 있어서
//   첫 줄을 머리글로 여기면 어긋난다.
// ★ 맨 오른쪽 «학사일정» 칸은 우리가 이미 갖고 있는 것과 같아서 읽지 않는다.

const { fetchText } = require('./fetchtext.js');

/* 시트 주소에서 문서 ID 와 탭 번호(gid)를 뽑는다 */
function parseUrl(url) {
  const s = String(url || '').trim();
  if (!s) return null;
  const id = (s.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/) || [])[1]
    || (/^[a-zA-Z0-9-_]{30,}$/.test(s) ? s : '');
  if (!id) return null;
  const gid = (s.match(/[#&?]gid=(\d+)/) || [])[1] || '0';
  return { id, gid };
}

/* 아주 작은 CSV 읽개 — 따옴표 안의 쉼표와 줄바꿈을 지킨다 */
function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', q = false;
  const t = String(text || '').replace(/\r\n/g, '\n');
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) {
      if (c === '"') { if (t[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

const clean = (v) => String(v == null ? '' : v).replace(/ /g, ' ').trim();

/* 머리글 줄을 찾는다 — «구분» 과 «내용» 이 같은 줄에 있으면 그 줄이다 */
function findHead(rows) {
  for (let r = 0; r < Math.min(rows.length, 12); r++) {
    const cells = (rows[r] || []).map(clean);
    const cat = cells.indexOf('구분');
    const title = cells.indexOf('내용');
    if (cat >= 0 && title > cat) {
      return {
        row: r,
        date: cells.indexOf('일자') >= 0 ? cells.indexOf('일자') : 0,
        dow: cells.indexOf('요일') >= 0 ? cells.indexOf('요일') : 1,
        cat: cat,
        title: title,
        detail: cells.indexOf('세부사항') >= 0 ? cells.indexOf('세부사항') : title + 1,
        done: cells.indexOf('확인')            // 없으면 -1 → 아래에서 값으로 찾는다
      };
    }
  }
  return null;
}

/* ★ «확인» 칸을 값으로 찾는다.
   시트에는 «확인» 이라고 적혀 있는데 CSV 로는 그 머리글이 빈 칸으로 넘어온다.
   그래서 머리글로 못 찾을 때는, 세부사항 다음 칸부터 훑어
   «TRUE/FALSE 만 들어 있는 첫 칸» 을 체크상자 칸으로 본다. */
function findDoneCol(rows, H) {
  const from = Math.max(H.detail + 1, H.cat + 1);
  const to = Math.min(from + 8, 40);
  for (let c = from; c < to; c++) {
    let yes = 0, no = 0, other = 0;
    for (let r = H.row + 1; r < Math.min(rows.length, H.row + 40); r++) {
      const v = clean((rows[r] || [])[c]);
      if (!v) continue;
      if (/^true$/i.test(v)) yes++;
      else if (/^false$/i.test(v)) no++;
      else other++;
    }
    if (!other && (yes + no) >= 3) return c;
  }
  return -1;
}

/* «8/24» → { month:8, day:24 }. «8.24» · «08/24» 도 받는다 */
function mdOf(v) {
  const m = clean(v).match(/^(\d{1,2})\s*[./-]\s*(\d{1,2})/);
  if (!m) return null;
  const month = Number(m[1]), day = Number(m[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { month, day };
}

/* 한 학년치 받기 → { items, cats, fetchedAt } */
async function fetchPlan(url) {
  const u = parseUrl(url);
  if (!u) throw new Error('시트 주소를 알아볼 수 없습니다');
  const csv = await fetchText(
    `https://docs.google.com/spreadsheets/d/${u.id}/gviz/tq?tqx=out:csv&gid=${u.gid}`);
  const rows = parseCsv(csv);
  const H = findHead(rows);
  if (!H) throw new Error('시트에서 «구분·내용» 머리글을 찾지 못했습니다');
  if (H.done < 0) H.done = findDoneCol(rows, H);

  const items = [];
  const cats = [];
  let cur = null, curDow = '';
  for (let r = H.row + 1; r < rows.length; r++) {
    const row = rows[r] || [];
    const md = mdOf(row[H.date]);
    if (md) { cur = md; curDow = clean(row[H.dow]); }     // 새 날짜
    const cat = clean(row[H.cat]);
    const title = clean(row[H.title]);
    const detail = clean(row[H.detail]);
    if (!cat && !title && !detail) continue;              // 빈 줄
    if (!cur) continue;                                   // 날짜가 아직 안 나왔다
    if (cat && cats.indexOf(cat) < 0) cats.push(cat);
    items.push({
      month: cur.month, day: cur.day, dow: curDow,
      cat: cat, title: title, detail: detail,
      done: H.done >= 0 && /^true$/i.test(clean(row[H.done]))
    });
  }
  return { items, cats, fetchedAt: new Date().toISOString() };
}

module.exports = { fetchPlan, parseUrl };
