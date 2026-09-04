// 파일명: ticktick.js | @version 1.103.0
// 틱틱(TickTick) — 할 일을 읽고 만들고 완료한다 (진호알리미 전용).
//
// ★ 노션과 다른 점: 열쇠 한 줄이 아니라 «한 번 로그인해서 표를 받는» 방식(OAuth)이다.
//   그래서 처음에만 브라우저에서 틱틱 로그인·허용을 한다. 받은 표는 오래 간다.
//
// ★ 되돌림 주소(redirect_uri)는 «미리 등록한 것과 한 글자도 달라선 안 된다».
//   그래서 포트를 고정해 둔다 — 구글 로그인처럼 그때그때 빈 포트를 쓰면 안 맞는다.
//
// ★ 틱틱 공개 API 는 «목록(프로젝트)별로만» 할 일을 준다.
//   모든 할 일을 한 번에 주는 창구가 없어서 목록을 돌며 모은다.
//   받은 편지함(기본함·Inbox)은 목록 목록에 안 나오지만 /project/inbox/data 로 따로 읽는다.

const http = require('http');
const { request } = require('./httpx.js');

const API = 'https://api.ticktick.com/open/v1';
const AUTHZ = 'https://ticktick.com/oauth/authorize';
const TOKEN = 'https://ticktick.com/oauth/token';
const SCOPE = 'tasks:read tasks:write';
/* 등록한 되돌림 주소 — 개발자 화면에 이것과 «똑같이» 넣어야 한다 */
const PORT = 47921;
const REDIRECT = 'http://127.0.0.1:' + PORT + '/ticktick';

function redirectUri() { return REDIRECT; }

async function call(token, method, path, body) {
  if (!String(token || '').trim()) throw new Error('틱틱에 아직 연결되지 않았습니다');
  const r = await request({
    method: method, url: API + path,
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + String(token).trim() },
    body: body ? JSON.stringify(body) : null,
    timeout: 25000
  });
  let d = null;
  try { d = r.text ? JSON.parse(r.text) : null; } catch (e) { /* 글자 그대로 둔다 */ }
  if (r.status >= 200 && r.status < 300) return d;
  if (r.status === 401) throw new Error('틱틱 연결이 풀렸습니다 — 설정에서 다시 연결해 주세요');
  const msg = (d && (d.errorMessage || d.error_description || d.error))
    || (r.text || '').slice(0, 200) || ('오류 ' + r.status);
  throw new Error(msg);
}

/* ── 로그인(한 번만) ──────────────────────────────────────────
   브라우저를 열어 틱틱에 «허용» 을 받고, 되돌아온 표(code)를 토큰으로 바꾼다. */
function authUrl(clientId, state) {
  return AUTHZ + '?client_id=' + encodeURIComponent(clientId)
    + '&scope=' + encodeURIComponent(SCOPE)
    + '&state=' + encodeURIComponent(state)
    + '&redirect_uri=' + encodeURIComponent(REDIRECT)
    + '&response_type=code';
}
/* 되돌아오는 것을 받을 작은 문지기. 한 번 받으면 스스로 닫는다. */
function waitForCode(state, onOpen, log) {
  return new Promise((resolve, reject) => {
    let done = false;
    const finish = (fn, v) => {
      if (done) return;
      done = true;
      try { srv.close(); } catch (e) { /* 무시 */ }
      fn(v);
    };
    const srv = http.createServer((req, res) => {
      const u = new URL(req.url, 'http://127.0.0.1');
      if (u.pathname !== '/ticktick') { res.writeHead(404); res.end(); return; }
      const code = u.searchParams.get('code');
      const st = u.searchParams.get('state');
      const err = u.searchParams.get('error');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<meta charset="utf-8"><body style="font-family:sans-serif;padding:40px">'
        + (code && st === state
            ? '<h2>진호알리미에 연결됐습니다 ✅</h2><p>이 탭은 닫으셔도 됩니다.</p>'
            : '<h2>연결하지 못했습니다</h2><p>' + (err || '확인값이 맞지 않습니다') + '</p>')
        + '</body>');
      if (code && st === state) finish(resolve, code);
      else finish(reject, new Error(err || '확인값이 맞지 않습니다'));
    });
    srv.on('error', (e) => {
      finish(reject, new Error(e && e.code === 'EADDRINUSE'
        ? '포트 ' + PORT + ' 를 이미 쓰고 있습니다 (앱이 두 벌 떠 있는지 보세요)' : String(e.message || e)));
    });
    srv.listen(PORT, '127.0.0.1', () => {
      if (log) log('틱틱 로그인 대기 시작 (' + REDIRECT + ')');
      onOpen();
    });
    setTimeout(() => finish(reject, new Error('로그인 대기 시간이 지났습니다')), 5 * 60 * 1000);
  });
}
/* 표(code) → 토큰. 아이디·비밀은 헤더에 실어 보낸다(Basic). */
async function exchange(clientId, clientSecret, code) {
  const basic = Buffer.from(clientId + ':' + clientSecret, 'utf8').toString('base64');
  const body = 'code=' + encodeURIComponent(code)
    + '&grant_type=authorization_code'
    + '&scope=' + encodeURIComponent(SCOPE)
    + '&redirect_uri=' + encodeURIComponent(REDIRECT);
  const r = await request({
    method: 'POST', url: TOKEN,
    contentType: 'application/x-www-form-urlencoded',
    headers: { Authorization: 'Basic ' + basic },
    body: body, timeout: 25000
  });
  let d = null;
  try { d = r.text ? JSON.parse(r.text) : null; } catch (e) { /* 무시 */ }
  if (r.status < 200 || r.status >= 300 || !d || !d.access_token) {
    throw new Error((d && (d.error_description || d.error))
      || (r.text || '').slice(0, 200) || ('토큰을 받지 못했습니다 (' + r.status + ')'));
  }
  return { token: d.access_token, expiresIn: Number(d.expires_in) || 0 };
}

/* ── 읽기 ── */
function projects(token) { return call(token, 'GET', '/project'); }
/* 마감을 «우리 날짜» 로 — 틱틱은 2026-09-10 을 2026-09-09T15:00:00+0000 처럼 UTC 로 준다.
   앞 열 글자만 자르면 하루 이르게 보인다(실측). Date 로 풀어 현지 날짜를 쓴다. */
function dueLocal(v) {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v).slice(0, 10);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
/* 목록 하나의 할 일 (완료 안 된 것만 온다) */
async function projectTasks(token, pid) {
  const d = await call(token, 'GET', '/project/' + encodeURIComponent(pid) + '/data');
  return (d && d.tasks) || [];
}
/* 모든 목록을 돌며 모은다 — 한 번에 주는 창구가 없다.
   ★ 기본함(Inbox)은 목록 목록(/project)에 안 나오지만 /project/inbox/data 로는 읽힌다
     (실측 2026-09-03). 그 안의 할 일에 진짜 아이디(inbox+숫자)가 실려 오므로 그것을 쓴다.
     비어 있으면 «inbox» 그대로 — 만들기(projectId:inbox)도 그 이름으로 받아 준다. */
async function loadAll(token) {
  const ps = ((await projects(token)) || []).slice();
  let inboxTasks = [];
  try { inboxTasks = await projectTasks(token, 'inbox'); } catch (e) { /* 기본함을 못 열어도 나머지는 본다 */ }
  const inboxId = (inboxTasks[0] && inboxTasks[0].projectId) || 'inbox';
  ps.unshift({ id: inboxId, name: '기본함', __tasks: inboxTasks });
  const out = [];
  for (const p of ps) {
    let ts = p.__tasks || [];
    if (!p.__tasks) {
      try { ts = await projectTasks(token, p.id); } catch (e) { /* 한 목록이 막혀도 나머지는 본다 */ }
    }
    ts.forEach((t) => {
      out.push({
        id: t.id, projectId: t.projectId || p.id, project: p.name || '',
        title: t.title || '(제목 없음)',
        due: dueLocal(t.dueDate),
        priority: Number(t.priority) || 0,
        status: Number(t.status) || 0
      });
    });
  }
  out.sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999'));
  return { projects: ps.map((p) => ({ id: p.id, name: p.name })), tasks: out,
    at: new Date().toISOString() };
}

/* ── 고치기 ── */
function createTask(token, projectId, title, ymd, priority) {
  const body = { title: String(title || '').slice(0, 300) };
  if (projectId) body.projectId = projectId;
  if (Number(priority)) body.priority = Number(priority);    // 틱틱 값: 1 낮음 · 3 중간 · 5 높음
  /* 틱틱은 날짜를 ISO 로 받는다. 하루 종일 할 일로 넣는다. */
  if (ymd) { body.dueDate = ymd + 'T00:00:00+0900'; body.isAllDay = true; }
  return call(token, 'POST', '/task', body);
}
function completeTask(token, projectId, taskId) {
  return call(token, 'POST', '/project/' + encodeURIComponent(projectId)
    + '/task/' + encodeURIComponent(taskId) + '/complete');
}
function deleteTask(token, projectId, taskId) {
  return call(token, 'DELETE', '/project/' + encodeURIComponent(projectId)
    + '/task/' + encodeURIComponent(taskId));
}
/* 할 일 하나 읽기 — 완료된 것도 읽힌다(목록에는 안 오지만). 없으면 null */
async function getTask(token, projectId, taskId) {
  try {
    return await call(token, 'GET', '/project/' + encodeURIComponent(projectId)
      + '/task/' + encodeURIComponent(taskId));
  } catch (e) { return null; }
}
/* 완료를 되돌린다 — status 0 으로 고치면 다시 목록에 온다(실측 2026-09-04) */
function reopenTask(token, projectId, taskId) {
  return call(token, 'POST', '/task/' + encodeURIComponent(taskId),
    { id: taskId, projectId: projectId, status: 0 });
}
/* 아무 칸이나 고치기 — 우선순위·마감·보관함(projectId). id·projectId 는 늘 함께 보낸다 */
function updateTask(token, projectId, taskId, patch) {
  const body = Object.assign({ id: taskId, projectId: projectId }, patch || {});
  return call(token, 'POST', '/task/' + encodeURIComponent(taskId), body);
}
/* 마감일 옮기기 — 틱틱은 고칠 때도 id·projectId 를 함께 보내야 한다 */
function setDue(token, projectId, taskId, ymd) {
  const body = { id: taskId, projectId: projectId };
  if (ymd) { body.dueDate = ymd + 'T00:00:00+0900'; body.isAllDay = true; }
  else body.dueDate = null;
  return call(token, 'POST', '/task/' + encodeURIComponent(taskId), body);
}

/* 연결이 살아 있는지 그 자리에서 확인 */
async function test(token) {
  const ps = (await projects(token)) || [];
  return { projects: ps.length, names: ps.slice(0, 5).map((p) => p.name) };
}

module.exports = { authUrl, waitForCode, exchange, loadAll, projects,
  createTask, updateTask, completeTask, deleteTask, setDue, getTask, reopenTask, test, redirectUri, PORT };
