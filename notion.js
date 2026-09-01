// 파일명: notion.js | @version 1.0.0
// 업무관리 — 노션의 PROJECTS·TASKS 를 읽고 고친다 (진호알리미 전용).
//
// ★ 왜 «내부 통합 열쇠(토큰)» 인가
//   구글처럼 로그인 창을 띄우는 방식(OAuth)이 아니다. 노션은 열쇠 한 줄이면 되고,
//   그 열쇠는 만료되지 않는다. 그래서 «켤 때마다 로그인이 풀리는» 종류의 문제가 없다.
//   대신 노션 쪽에서 그 데이터베이스를 통합에 «연결» 해 두어야 읽힌다(안 하면 404).
//
// ★ 통신은 httpx(Electron net)를 쓴다 — 학교 망의 SSL 검사 장비 때문에
//   Node 의 https 는 막힌다(fetchtext.js 설명 참고).

const { request } = require('./httpx.js');

const API = 'https://api.notion.com/v1';
const VER = '2022-06-28';   // 안정 판. 데이터소스 개념이 없는 대신 오래 유지된다.

/* 사람이 붙여넣는 주소·아이디에서 32자리 아이디만 뽑는다 */
function idOf(s) {
  const m = String(s || '').replace(/-/g, '').match(/[0-9a-f]{32}/i);
  return m ? m[0] : '';
}
function dash(id) {
  const s = idOf(id);
  return s ? s.slice(0, 8) + '-' + s.slice(8, 12) + '-' + s.slice(12, 16) + '-'
    + s.slice(16, 20) + '-' + s.slice(20) : '';
}

async function call(token, method, path, body) {
  if (!String(token || '').trim()) throw new Error('노션 열쇠가 없습니다 — 설정에 넣어 주세요');
  /* ★ httpx.json 은 200 이 아니면 던져 버려서 노션이 적어 준 까닭을 잃는다.
     request 를 써서 상태와 본문을 그대로 받아 우리가 읽는다. */
  const r = await request({
    method: method, url: API + path,
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + String(token || '').trim(), 'Notion-Version': VER },
    body: body ? JSON.stringify(body) : null,
    timeout: 25000
  });
  let d = null;
  try { d = r.text ? JSON.parse(r.text) : null; } catch (e) { /* 글자 그대로 둔다 */ }
  if (r.status >= 200 && r.status < 300) return d;
  /* 노션은 무엇이 잘못됐는지 본문에 적어 준다 — 그대로 사람 말로 옮긴다 */
  const msg = (d && d.message) || (r.text || '').slice(0, 300) || ('오류 ' + r.status);
  if (r.status === 401) throw new Error('열쇠가 맞지 않습니다 (노션 통합 토큰을 다시 확인해 주세요)');
  if (r.status === 404) {
    throw new Error('데이터베이스를 찾지 못했습니다 — 노션에서 그 표의 «연결»에 이 통합을 추가해 주세요');
  }
  throw new Error(msg);
}

/* ── 값 꺼내기 도우미 ── */
function txt(p) {
  if (!p) return '';
  const a = p.title || p.rich_text || [];
  return a.map((x) => (x && x.plain_text) || '').join('').trim();
}
function pickDate(p) {
  const d = p && p.date;
  return d ? { start: d.start || '', end: d.end || '' } : { start: '', end: '' };
}

/* ── 프로젝트 목록 ── */
async function projects(token, dbId) {
  const out = [];
  let cursor = null;
  do {
    const r = await call(token, 'POST', '/databases/' + dash(dbId) + '/query',
      cursor ? { page_size: 100, start_cursor: cursor } : { page_size: 100 });
    (r.results || []).forEach((pg) => {
      const p = pg.properties || {};
      out.push({ id: pg.id, title: txt(p['제목']) || '(이름 없음)', url: pg.url || '' });
    });
    cursor = r.has_more ? r.next_cursor : null;
  } while (cursor);
  return out;
}

/* ── 태스크 목록 (완료된 것은 «최근 것만» 가져와 가볍게 둔다) ── */
async function tasks(token, dbId) {
  const out = [];
  let cursor = null;
  do {
    const body = { page_size: 100, sorts: [{ property: '마감일', direction: 'ascending' }] };
    if (cursor) body.start_cursor = cursor;
    const r = await call(token, 'POST', '/databases/' + dash(dbId) + '/query', body);
    (r.results || []).forEach((pg) => {
      const p = pg.properties || {};
      const st = (p['상태'] && p['상태'].status && p['상태'].status.name) || '';
      const due = pickDate(p['마감일']);
      out.push({
        id: pg.id,
        title: txt(p['내용']) || '(제목 없음)',
        status: st,
        due: due.start, dueEnd: due.end,
        note: txt(p['비고']),
        tags: ((p['태그'] && p['태그'].multi_select) || []).map((t) => t.name),
        projects: ((p['PROJECTS'] && p['PROJECTS'].relation) || []).map((x) => x.id),
        url: pg.url || ''
      });
    });
    cursor = r.has_more ? r.next_cursor : null;
  } while (cursor);
  return out;
}

/* 프로젝트·태스크를 한 번에 — 화면이 쓰기 좋은 모양으로 */
async function loadAll(token, taskDb, projDb) {
  const [ps, ts] = await Promise.all([projects(token, projDb), tasks(token, taskDb)]);
  const byId = {};
  ps.forEach((p) => { byId[String(p.id).replace(/-/g, '')] = p.title; });
  ts.forEach((t) => {
    t.projectNames = (t.projects || [])
      .map((id) => byId[String(id).replace(/-/g, '')] || '')
      .filter(Boolean);
  });
  return { projects: ps, tasks: ts, at: new Date().toISOString() };
}

/* ── 고치기 ── */
function setStatus(token, pageId, name) {
  return call(token, 'PATCH', '/pages/' + dash(pageId),
    { properties: { '상태': { status: { name: name } } } });
}
/* 마감일 옮기기 — ymd 가 비면 마감일을 지운다 */
function setDue(token, pageId, ymd) {
  return call(token, 'PATCH', '/pages/' + dash(pageId),
    { properties: { '마감일': ymd ? { date: { start: ymd } } : { date: null } } });
}
/* 새 태스크 — 프로젝트는 골라도 되고 안 골라도 된다 */
function createTask(token, taskDb, title, projectId, ymd) {
  const props = {
    '내용': { title: [{ text: { content: String(title || '').slice(0, 200) } }] },
    '상태': { status: { name: '시작 전' } }
  };
  if (projectId) props['PROJECTS'] = { relation: [{ id: dash(projectId) }] };
  if (ymd) props['마감일'] = { date: { start: ymd } };
  return call(token, 'POST', '/pages',
    { parent: { database_id: dash(taskDb) }, properties: props });
}

/* 열쇠·연결이 맞는지 그 자리에서 확인한다 (설정 화면의 «지금 확인») */
async function test(token, taskDb, projDb) {
  const me = await call(token, 'GET', '/users/me');
  const r = await loadAll(token, taskDb, projDb);
  return {
    who: (me && me.name) || (me && me.bot && me.bot.owner && '통합') || '연결됨',
    projects: r.projects.length, tasks: r.tasks.length
  };
}

module.exports = { loadAll, setStatus, setDue, createTask, test, idOf, dash };
