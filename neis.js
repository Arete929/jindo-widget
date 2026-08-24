// 파일명: neis.js | @version 1.0.0
// 나이스 교육정보 개방포털(open.neis.go.kr)에서 급식을 받아온다.
//
// ★ 인증키가 없어도 된다. 키 없이 부르면 한 번에 가져올 수 있는 줄 수만 제한되는데,
//   한 주 급식은 5줄이라 넉넉하다.
// ★ 학교 코드는 이름으로 찾는다 — 시도교육청코드(B10 등) + 표준학교코드 두 개가 필요하다.

const { fetchText } = require('./fetchtext.js');

const BASE = 'https://open.neis.go.kr';

async function getJson(path) {
  // ★나이스는 낯선 User-Agent 에 500 을 돌려준다 — 브라우저처럼 보낸다
  const t = await fetchText(BASE + path, { accept: 'application/json, text/plain, */*' });
  try { return JSON.parse(t); } catch (e) { throw new Error('나이스 응답을 해석하지 못했습니다'); }
}
/* 나이스는 «자료 없음»도 200 으로 돌려준다 — RESULT.CODE 를 봐야 한다 */
function rowsOf(j, key) {
  const box = j && j[key];
  if (!Array.isArray(box)) {
    const msg = (j && j.RESULT && j.RESULT.MESSAGE) || '자료가 없습니다';
    throw new Error(msg);
  }
  const found = box.find((x) => x && x.row);
  return (found && found.row) || [];
}

/* 학교 이름으로 찾기 → [{atpt, atptName, code, name, kind}] */
async function searchSchool(name) {
  const j = await getJson('/hub/schoolInfo?Type=json&pIndex=1&pSize=20&SCHUL_NM='
    + encodeURIComponent(String(name || '')));
  return rowsOf(j, 'schoolInfo').map((r) => ({
    atpt: r.ATPT_OFCDC_SC_CODE, atptName: r.ATPT_OFCDC_SC_NM,
    code: r.SD_SCHUL_CODE, name: r.SCHUL_NM, kind: r.SCHUL_KND_SC_NM
  }));
}

function ymd(d) {
  const p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate());
}

/* 기간 급식 → [{date:'2026-08-24', type:'중식', dishes:[...], kcal:'733.8 Kcal'}] */
async function fetchMeals(school, from, to) {
  if (!school || !school.atpt || !school.code) throw new Error('학교를 먼저 골라주세요');
  const j = await getJson('/hub/mealServiceDietInfo?Type=json&pIndex=1&pSize=100'
    + '&ATPT_OFCDC_SC_CODE=' + encodeURIComponent(school.atpt)
    + '&SD_SCHUL_CODE=' + encodeURIComponent(school.code)
    + '&MLSV_FROM_YMD=' + ymd(from) + '&MLSV_TO_YMD=' + ymd(to));
  let rows = [];
  try { rows = rowsOf(j, 'mealServiceDietInfo'); } catch (e) { rows = []; }   // 방학이면 비어 있다
  return rows.map((r) => {
    const s = String(r.DDISH_NM || '');
    return {
      date: String(r.MLSV_YMD || '').replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3'),
      type: r.MMEAL_SC_NM || '중식',
      kcal: r.CAL_INFO || '',
      // 메뉴는 <br/> 로 이어져 있고 뒤에 알레르기 번호가 붙는다 — 번호는 떼어낸다
      dishes: s.split(/<br\s*\/?>/i)
        .map((x) => x.replace(/\([0-9.,\s]*\)/g, '').replace(/\s+/g, ' ').trim())
        .filter(Boolean)
    };
  }).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/* 이번 주(월~금) 급식 */
async function fetchWeekMeals(school, baseDate) {
  const d = baseDate ? new Date(baseDate) : new Date();
  const day = d.getDay();
  const mon = new Date(d);
  mon.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  const fri = new Date(mon);
  fri.setDate(mon.getDate() + 4);
  const meals = await fetchMeals(school, mon, fri);
  return { from: ymd(mon), to: ymd(fri), meals: meals, fetchedAt: new Date().toISOString() };
}

module.exports = { searchSchool, fetchMeals, fetchWeekMeals };
