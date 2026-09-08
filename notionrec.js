// 파일명: notionrec.js | @version 1.114.1
// 학생기록 ↔ 노션 [DB] 2026 학생기록 오가기 (지비스 전용).
//
// ★ [DB] 2026 학생기록 의 «누가기록» 속성이 «AI 자동 채우기 · 페이지 생성 시» 로
//   맞춰져 있다. 그래서 페이지를 만들기만 하면 노션 AI 가 알아서 쓴다 —
//   이 파일은 만들고 · 기다리고 · 읽어 오고 · 학생 페이지에 쌓는 일을 맡는다.

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
  /* ★ 원문은 «그냥 보이는 문단» 으로 둔다.
     토글 안에 감추면 AI 가 못 읽을 수 있고, 누가기록 초안을 미리 써 두면
     AI 가 내용을 다시 짜지 않고 그것을 베껴 버린다. 원문만 준다. */
  const 본문 = [{ object: 'block', type: 'heading_3',
    heading_3: { rich_text: nrRich('원문') } }].concat(
    String(s.text || '').split('\n').slice(0, 40).map((line) => ({
      object: 'block', type: 'paragraph', paragraph: { rich_text: nrRich(line || ' ') } })));
  const page = await nrCall(token, 'POST', '/pages',
    { parent: { database_id: REC_DB }, properties: props, children: 본문 });
  return { id: page.id, url: page.url, linked: !!학생, student: 학생 || '' };
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
/* 본문의 «생활기록부 누가기록» 콜아웃에 문장을 채운다 — 노션에서도 바로 읽히게 */
async function nrPutNote(token, pageId, text) {
  const bl = await nrCall(token, 'GET', '/blocks/' + pageId + '/children?page_size=50');
  const 콜 = ((bl && bl.results) || []).filter((b) => b.type === 'callout')
    .filter((b) => (b.callout.rich_text || []).map((x) => x.plain_text).join('').indexOf(CALLOUT_TITLE) >= 0)[0];
  if (콜) {
    await nrCall(token, 'PATCH', '/blocks/' + 콜.id,
      { callout: { rich_text: nrRich(CALLOUT_TITLE + '\n' + String(text || '')) } });
    return true;
  }
  /* 없으면 맨 위에 새로 만든다 */
  await nrCall(token, 'PATCH', '/blocks/' + pageId + '/children',
    { children: [{ object: 'block', type: 'callout',
      callout: { icon: { type: 'emoji', emoji: '🔵' }, color: 'blue_background',
        rich_text: nrRich(CALLOUT_TITLE + '\n' + String(text || '')) } }] });
  return true;
}

/* ── ★ 학생 페이지에 누가기록 한 줄 쌓기 ───────────────────
   표 칸에만 남으면 학생별로 모아 볼 수가 없다. 그 학생 페이지 본문에
   «날짜 · 구분 — 문장» 한 줄을 덧붙여 줄줄이 쌓이게 한다.
   문장에는 그 기록 페이지 링크를 걸어 원문으로 바로 갈 수 있게 한다. */
async function nrPutStudent(token, studentId, o) {
  if (!studentId) return false;
  const s = o || {};
  const 앞 = String(s.when || '') + (s.cat ? ' · ' + s.cat : '') + ' — ';
  const 줄 = [{ type: 'text', text: { content: 앞 }, annotations: { color: 'gray' } },
    { type: 'text', text: { content: String(s.text || '').slice(0, 1800),
      link: s.url ? { url: s.url } : null } }];
  await nrCall(token, 'PATCH', '/blocks/' + studentId + '/children',
    { children: [{ object: 'block', type: 'bulleted_list_item',
      bulleted_list_item: { rich_text: 줄 } }] });
  return true;
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


/* ── 속성 읽기 ─────────────────────────────────────────────
   «AI 자동 채우기» 속성은 종류가 무엇으로 오든(rich_text·formula·문자열)
   글자만 뽑아 쓴다 — 노션이 종류를 바꿔도 안 깨지게. */
function nrPropText(prop) {
  if (!prop) return '';
  const p = prop;
  const rich = (arr) => (arr || []).map((x) => x.plain_text || (x.text && x.text.content) || '').join('');
  if (p.type === 'rich_text') return rich(p.rich_text).trim();
  if (p.type === 'title') return rich(p.title).trim();
  if (p.type === 'formula') return String((p.formula && (p.formula.string || p.formula.number)) || '').trim();
  if (p.type === 'rollup') return String((p.rollup && p.rollup.string) || '').trim();
  if (typeof p.string === 'string') return p.string.trim();
  /* 모르는 종류 — 안에 글자가 있으면 긁어 온다 */
  const j = JSON.stringify(p);
  const m = j.match(/"plain_text":"([^"]{5,})"/);
  return m ? m[1] : '';
}
async function nrReadProp(token, pageId, name) {
  const page = await nrCall(token, 'GET', '/pages/' + pageId);
  const props = (page && page.properties) || {};
  if (props[name]) return nrPropText(props[name]);
  /* 이름이 조금 달라도 찾아 준다 */
  const key = Object.keys(props).filter((k) => k.replace(/\s/g, '').indexOf(String(name).replace(/\s/g, '')) >= 0)[0];
  return key ? nrPropText(props[key]) : '';
}
/* AI 가 채울 때까지 기다린다 — 채워지면 곧바로 돌려준다.
   onStep 으로 «몇 초째» 를 알려 주어 게이지가 움직이게 한다. */
async function nrWaitProp(token, pageId, name, opt) {
  const o = opt || {};
  /* ★ 실제로 재 보니 노션 AI 가 채우는 데 4분 30초가 걸렸다(2026-09-08).
     짧게 잡으면 «안 채워졌습니다» 로 헛물을 켠다. 넉넉히 기다리고,
     그동안 노션을 너무 두드리지 않도록 5초에 한 번만 본다. */
  const 총 = Number(o.seconds || 360), 간격 = 5000;
  const 끝 = Date.now() + 총 * 1000;
  let 첫값 = '';
  try { 첫값 = await nrReadProp(token, pageId, name); } catch (e) { /* 처음엔 없을 수 있다 */ }
  if (첫값) return 첫값;
  while (Date.now() < 끝) {
    await new Promise((r) => setTimeout(r, 간격));
    let v = '';
    try { v = await nrReadProp(token, pageId, name); } catch (e) { /* 잠깐 미끄러져도 계속 */ }
    if (v) return v;
    if (o.onStep) o.onStep(Math.round((총 * 1000 - (끝 - Date.now())) / 1000), 총);
  }
  return '';
}

module.exports = { send: nrSend, fetchNote: nrFetchNote, findPage: nrFindPage,
  readProp: nrReadProp, waitProp: nrWaitProp, putNote: nrPutNote, putStudent: nrPutStudent,
  studentDb: nrStudentDb, REC_DB };
