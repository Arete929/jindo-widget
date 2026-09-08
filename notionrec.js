// 파일명: notionrec.js | @version 1.113.0
// 학생기록 ↔ 노션 [DB] 2026 학생기록 오가기 (지비스 전용).
//
// ★ API 로 만든 페이지에는 노셔나이가 저절로 붙지 않는다 — 노션에서 «#행특» 을
//   한 번 시키셔야 문장이 채워진다. 이 파일은 그 앞뒤(보내기·가져오기)만 맡는다.

const { request } = require('./httpx.js');

/* ── 학생기록 ↔ 노션 ────────────────────────────────────────
   [DB] 2026 학생기록 에 페이지를 만들고, 노셔나이가 채운 누가기록을 도로 읽어 온다.
   ★ API 로 만든 페이지에는 노셔나이가 «저절로» 붙지 않는다 — 노션에서 한 번
     «#행특» 을 시키셔야 한다. 그 사이를 오가는 두 길만 여기서 맡는다.
   ★ 속성은 실제 DB 그대로: 구분(select) · 내용(title) · 작성일(date) ·
     학번이름(relation → [DB] '26 혜원학생 INFO) · 학기(select) · NEIS(checkbox) */
const REC_DB = '322ff403-d746-80d8-96ac-fd34dbb23158';
const CALLOUT_TITLE = '생활기록부 누가기록';

function nrHead(token) {
  return { Authorization: 'Bearer ' + String(token || '').trim(),
    'Notion-Version': '2022-06-28' };
}
async function nrCall(token, method, path, body) {
  if (!String(token || '').trim()) throw new Error('노션 열쇠가 없습니다 (설정 → 업무관리)');
  const r = await request({ method: method, url: 'https://api.notion.com/v1' + path,
    contentType: 'application/json', headers: nrHead(token),
    body: body ? JSON.stringify(body) : null, timeout: 25000 });
  let j = null;
  try { j = r.text ? JSON.parse(r.text) : null; } catch (e) { /* 글자 그대로 */ }
  if (r.status >= 200 && r.status < 300) return j;
  const msg = (j && j.message) || ('오류 ' + r.status);
  if (r.status === 404) throw new Error('노션에서 못 찾음 — DB 를 통합 «진호알리미» 에 연결했는지 보세요');
  throw new Error(msg);
}
/* 학번이름 관계가 가리키는 학생 DB 를 DB 정의에서 직접 알아낸다 (해마다 바뀐다) */
let nrStudDb = '';
async function nrStudentDb(token) {
  if (nrStudDb) return nrStudDb;
  const db = await nrCall(token, 'GET', '/databases/' + REC_DB);
  const rel = ((db && db.properties) || {})['학번이름'];
  nrStudDb = (rel && rel.relation && rel.relation.database_id) || '';
  if (!nrStudDb) throw new Error('학생기록 DB 에서 «학번이름» 관계를 찾지 못했습니다');
  return nrStudDb;
}
/* «3201라마바» 로 학생 페이지를 찾는다. 없으면 '' (관계 없이 만든다) */
async function nrFindStudent(token, key) {
  const dbid = await nrStudentDb(token);
  const db = await nrCall(token, 'GET', '/databases/' + dbid);
  const titleProp = Object.keys(db.properties || {})
    .filter((k) => db.properties[k].type === 'title')[0];
  if (!titleProp) return '';
  const q = await nrCall(token, 'POST', '/databases/' + dbid + '/query',
    { page_size: 5, filter: { property: titleProp, title: { equals: String(key) } } });
  const hit = (q.results || [])[0];
  return hit ? hit.id : '';
}
function nrRich(s) { return [{ type: 'text', text: { content: String(s || '').slice(0, 1900) } }]; }
/* ① 노션으로 보내기 — 페이지를 만들고 페이지 id 를 돌려준다 */
async function nrSend(token, o) {
  const s = o || {};
  const 학생 = await nrFindStudent(token, String(s.sid || '') + String(s.name || ''));
  const 작성일 = /^\d{4}-\d{2}-\d{2}$/.test(String(s.when || '')) ? s.when : null;
  const 달 = 작성일 ? Number(작성일.slice(5, 7)) : (new Date()).getMonth() + 1;
  const props = {
    '내용': { title: nrRich(s.topic || '행동특성 기록') },
    '구분': { select: { name: s.cat || '행동특성' } },
    '학기': { select: { name: (달 >= 3 && 달 <= 8) ? '1학기' : '2학기' } },
    'NEIS': { checkbox: false }
  };
  if (작성일) props['작성일'] = { date: { start: 작성일 } };
  if (학생) props['학번이름'] = { relation: [{ id: 학생 }] };
  const 본문 = [
    { object: 'block', type: 'callout',
      callout: { icon: { type: 'emoji', emoji: '🔵' }, color: 'blue_background',
        rich_text: nrRich(CALLOUT_TITLE + '\n' + (s.note || '')) } },
    { object: 'block', type: 'toggle',
      toggle: { rich_text: nrRich('원문'),
        children: String(s.text || '').split('\n').slice(0, 40).map((line) => ({
          object: 'block', type: 'paragraph', paragraph: { rich_text: nrRich(line || ' ') } })) } },
    { object: 'block', type: 'paragraph', paragraph: { rich_text: nrRich('#행특') } }
  ];
  const page = await nrCall(token, 'POST', '/pages',
    { parent: { database_id: REC_DB }, properties: props, children: 본문 });
  return { id: page.id, url: page.url, linked: !!학생 };
}
/* ② 노션에서 가져오기 — 그 페이지의 «생활기록부 누가기록» 콜아웃 글을 읽는다 */
async function nrFetchNote(token, pageId) {
  const bl = await nrCall(token, 'GET', '/blocks/' + pageId + '/children?page_size=50');
  const 콜 = ((bl && bl.results) || []).filter((b) => b.type === 'callout');
  for (let i = 0; i < 콜.length; i++) {
    const t = (콜[i].callout.rich_text || []).map((x) => x.plain_text).join('');
    if (t.indexOf(CALLOUT_TITLE) >= 0) {
      let s = t.slice(t.indexOf(CALLOUT_TITLE) + CALLOUT_TITLE.length);
      s = s.replace(/^[\s:·\-]*/, '').trim();
      s = s.replace(/\(?\s*\d+\s*자\s*[·/]?\s*\d*\s*(?:B|바이트|Byte)?\s*\)?\s*$/i, '').trim();
      if (s) return s;
    }
  }
  /* 콜아웃이 비었으면 본문 문단에서 첫 긴 줄을 준다 */
  const 문단 = ((bl && bl.results) || []).filter((b) => b.type === 'paragraph')
    .map((b) => (b.paragraph.rich_text || []).map((x) => x.plain_text).join('').trim())
    .filter((s) => s && s.indexOf('#행특') < 0 && s.length > 20);
  return 문단[0] || '';
}
/* 학생·날짜로 페이지를 되찾는다 — 보낸 id 를 잃었을 때 */
async function nrFindPage(token, o) {
  const s = o || {};
  const and = [{ property: '구분', select: { equals: s.cat || '행동특성' } }];
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(s.when || ''))) {
    and.push({ property: '작성일', date: { equals: s.when } });
  }
  const q = await nrCall(token, 'POST', '/databases/' + REC_DB + '/query',
    { page_size: 20, filter: { and: and },
      sorts: [{ timestamp: 'created_time', direction: 'descending' }] });
  const 학생 = await nrFindStudent(token, String(s.sid || '') + String(s.name || ''));
  const 결과 = (q.results || []).filter((p) => {
    if (!학생) return true;
    const rel = (p.properties['학번이름'] || {}).relation || [];
    return rel.some((r) => r.id === 학생);
  });
  return 결과[0] ? 결과[0].id : '';
}

module.exports = { send: nrSend, fetchNote: nrFetchNote, findPage: nrFindPage,
  studentDb: nrStudentDb, REC_DB };
