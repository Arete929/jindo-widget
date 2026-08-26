// 파일명: recordsmain.js | @version 1.0.0
// 학생기록의 «뒤쪽 일» — 구글 연결, 시트 만들기·지우기, 기록 읽고 쓰기, 명렬표 받기.
//
// main.js 가 너무 길어져서 학생기록만 따로 뺐다. main.js 는 register() 한 번만 부른다.
//
// 저장해 두는 것 (widget-state.json)
//   gclient    { clientId, clientSecret }   구글 클라우드에서 만든 «데스크톱 앱» 정보
//   gauth      { refreshToken, email }      로그인해서 받은 것
//   recSheet   { id, url, createdAt, trashedAt }
//   recClasses ['3-1','3-2', …]             설정에서 고른 학급
//   rosterSheet '…'                          명렬표 시트 주소(기본값은 roster.js 에)

const path = require('path');
const fs = require('fs');
const gauth = require('./googleauth.js');
const rec = require('./records.js');
const roster = require('./roster.js');

let S = null;   // main 이 넣어 주는 도우미 모음

/* ── 구글 클라이언트 ──────────────────────────────────────────
   앱에 심어 둔 것(gclient.json)을 기본으로 쓴다. 그래서 받아 쓰는 사람은
   아무 준비도 필요 없다. 다른 학교에서 자기 것을 쓰고 싶으면 설정에 넣으면 되고,
   그때는 그것이 앞선다.
   gclient.json 은 공개 저장소에 올리지 않는다(.gitignore). */
function bundledClient() {
  try {
    const j = JSON.parse(fs.readFileSync(path.join(__dirname, 'gclient.json'), 'utf-8'));
    if (j && j.clientId && j.clientSecret) return j;
  } catch (e) { /* 없으면 없는 대로 */ }
  return null;
}
function clientInfo() {
  const own = (S.load().gclient) || {};
  if (own.clientId && own.clientSecret) return own;
  return bundledClient() || {};
}

/* ── 토큰 ── 액세스 토큰은 한 시간이면 만료되므로 필요할 때마다 새로 받아 쓴다 ── */
let access = { token: '', until: 0 };
async function token() {
  const now = Date.now();
  if (access.token && access.until > now + 60000) return access.token;
  const a = S.load().gauth || {};
  const c = clientInfo();
  if (!a.refreshToken) throw new Error('아직 구글에 연결되어 있지 않습니다');
  const t = await gauth.refresh(c, a.refreshToken);
  if (!gauth.hasDrive(t)) throw new Error(gauth.NEED_DRIVE_MSG);
  access = { token: t.access_token, until: now + (Number(t.expires_in || 3600) * 1000) };
  return access.token;
}

/* ── 명렬표 ── 자주 바뀌지 않으니 파일에 받아 둔다 ── */
function rosterFile() { return path.join(S.userDataPath, 'roster.json'); }
function loadRoster() {
  try { return JSON.parse(fs.readFileSync(rosterFile(), 'utf-8')); } catch (e) { return null; }
}
async function refreshRoster() {
  const r = await roster.fetchRoster(S.load().rosterSheet);
  try { fs.writeFileSync(rosterFile(), JSON.stringify(r)); } catch (e) { /* 무시 */ }
  S.log(`명렬표 받기 — ${r.count}명 / ${r.classes.length}개 반` + (r.error ? ' · ' + r.error : ''));
  return r;
}

/* ── 화면이 알아야 할 상태 한 덩어리 ── */
function recState() {
  // ★ 위젯 창이 뜨자마자 sendToWidget() 이 불리는데, 그때는 아직 register() 전이라
  //   S 가 없다. 예전에는 여기서 터져서 시작 직후 한 번씩 예외가 났다.
  if (!S) return { hasClient: false, linked: false, notReady: true, classes: [], roster: null };
  const st = S.load();
  const r = loadRoster();
  return {
    hasClient: !!(clientInfo().clientId && clientInfo().clientSecret),
    ownClient: !!(st.gclient && st.gclient.clientId),   // 자기 것을 넣어 뒀는가
    linked: !!(st.gauth && st.gauth.refreshToken),
    email: (st.gauth && st.gauth.email) || '',
    sheet: st.recSheet || null,
    classes: st.recClasses || [],
    rosterSheet: st.rosterSheet || roster.DEFAULT_SHEET,
    roster: r ? { classes: r.classes, count: r.count, error: r.error || '' } : null
  };
}

function register(helpers) {
  S = helpers;
  const { ipcMain } = S;

  ipcMain.handle('rec-state', () => recState());

  /* 구글 연결 */
  ipcMain.handle('rec-signin', async () => {
    const c = clientInfo();
    const t = await gauth.signIn(c, S.openInBrowser, S.log);
    S.log('학생기록 — 받은 권한: ' + (t.scope || '(없음)'));
    // 드라이브 권한을 안 켰으면 여기서 바로 알려 준다 — 나중에 조용히 실패하지 않게
    if (!gauth.hasDrive(t)) throw new Error(gauth.NEED_DRIVE_MSG);
    let email = '';
    try {
      const { json } = require('./httpx.js');
      const me = await json({ url: 'https://www.googleapis.com/oauth2/v3/userinfo', token: t.access_token });
      email = (me && me.email) || '';
    } catch (e) { /* 이메일은 없어도 그만이다 */ }
    S.save({ gauth: { refreshToken: t.refresh_token, email: email } });
    access = { token: t.access_token, until: Date.now() + (Number(t.expires_in || 3600) * 1000) };
    S.log('학생기록 — 구글 연결됨 ' + (email || ''));
    // ★ 다른 계정으로 들어왔다면 옛 시트는 이 계정에서 보이지 않는다.
    //   들고 있어 봤자 «File not found» 로 조용히 막히므로 여기서 놓아 준다.
    //   (시트 자체는 지워지지 않는다. 원래 계정으로 다시 연결하면 그대로 있다)
    const old = S.load().recSheet;
    if (old && old.id && old.email && email && old.email !== email) {
      S.log('학생기록 — 계정이 바뀌어 옛 시트를 놓음 (' + old.email + ' → ' + email + ')');
      S.save({ recSheet: null });
    }
    S.send();
    return recState();
  });

  ipcMain.handle('rec-signout', async () => {
    const a = S.load().gauth || {};
    if (access.token) await gauth.revoke(access.token);
    access = { token: '', until: 0 };
    S.save({ gauth: null });
    S.log('학생기록 — 구글 연결 끊음');
    S.send();
    return recState();
  });

  /* 시트 만들기 / 휴지통으로 */
  const SHEET_TITLE = '[혜원이지] 학생기록';
  // ★ 이름을 바꾸기 전(v1.28 이하)에 만든 시트도 찾아야 한다. 못 찾으면 시트가 갈린다.
  const SHEET_TITLES = [SHEET_TITLE, '[혜원 데스크] 학생기록'];

  /* 다른 PC 에서 이미 만들어 둔 것이 있는지 본다 (없으면 null) */
  ipcMain.handle('rec-find', async () => {
    const t = await token();
    const found = await rec.findSheet(t, SHEET_TITLES);
    if (found) S.log('학생기록 — 드라이브에 이미 있는 시트를 찾음: ' + found.id);
    return found;
  });

  ipcMain.handle('rec-create', async () => {
    const t = await token();
    // ★ 먼저 찾아본다. 다른 PC 에서 만들어 둔 것이 있으면 새로 만들지 않고 이어 쓴다.
    //   (안 그러면 PC 마다 시트가 하나씩 생겨 기록이 갈린다)
    const found = await rec.findSheet(t, SHEET_TITLES);
    if (found) {
      S.save({ recSheet: { id: found.id, url: found.url, createdAt: found.createdAt, trashedAt: '', email: (S.load().gauth || {}).email || '' } });
      S.log('학생기록 — 이미 있는 시트에 이어 붙임: ' + found.id);
      S.send();
      return recState();
    }
    const made = await rec.createSheet(t, SHEET_TITLE);
    S.save({ recSheet: { id: made.id, url: made.url, createdAt: made.createdAt, trashedAt: '', email: (S.load().gauth || {}).email || '' } });
    S.log('학생기록 시트 만듦 — ' + made.id);
    S.send();
    return recState();
  });

  ipcMain.handle('rec-trash', async () => {
    const st = S.load().recSheet;
    if (!st || !st.id) throw new Error('지울 시트가 없습니다');
    const t = await token();
    const when = await rec.trashSheet(t, st.id);
    S.save({ recSheet: Object.assign({}, st, { trashedAt: when }), recTrashLog: (S.load().recTrashLog || []).concat([{ id: st.id, at: when }]) });
    S.log('학생기록 시트를 휴지통으로 — ' + st.id);
    S.send();
    return recState();
  });

  /* 이미 있는 시트에 연결 (사본을 받았거나 시트를 옮겼을 때) */
  ipcMain.handle('rec-attach', (_e, url) => {
    const id = roster.sheetId(url);
    if (!id) throw new Error('시트 주소를 알아볼 수 없습니다');
    S.save({ recSheet: { id: id, url: `https://docs.google.com/spreadsheets/d/${id}/edit`, createdAt: '', trashedAt: '', email: (S.load().gauth || {}).email || '' } });
    S.send();
    return recState();
  });

  /* 기록 읽고 쓰기 */
  ipcMain.handle('rec-load', async () => {
    const st = S.load().recSheet;
    if (!st || !st.id) return { need: 'sheet' };
    const t = await token();
    let d;
    try {
      d = await rec.loadAll(t, st.id);
    } catch (e) {
      // 이 계정에서 안 보이는 시트다 (대개 다른 계정에서 만든 것).
      // 붙들고 있으면 계속 막히므로 놓아 주고, 다시 고르는 화면으로 보낸다.
      const msg = (e && e.message) || String(e);
      // ★ 실제로 오는 말은 두 가지다 — 직접 확인했다.
      //   드라이브 목록에서는 「File not found」, 시트 API 로 읽을 때는
      //   「The caller does not have permission」. 둘 다 «이 계정 것이 아니다» 라는 뜻이다.
      if (/not found|404|permission|찾을 수 없|권한/i.test(msg)) {
        S.log('학생기록 — 시트를 못 찾음(' + st.id + '). 계정이 다를 수 있어 기록을 놓는다');
        S.save({ recSheet: null });
        S.send();
        return { need: 'sheet', lost: st };
      }
      throw e;
    }
    d.sheet = st;
    return d;
  });

  ipcMain.handle('rec-save', async (_e, p) => {
    const st = S.load().recSheet;
    if (!st || !st.id) throw new Error('먼저 시트를 만들어 주세요');
    const t = await token();
    return rec.saveRecord(t, st.id, p.student, p.cat, p.text, p.row);
  });

  ipcMain.handle('rec-clear', async (_e, row) => {
    const st = S.load().recSheet;
    const t = await token();
    return rec.clearRecord(t, st.id, Number(row));
  });

  ipcMain.handle('rec-cats', async (_e, cats) => {
    const st = S.load().recSheet;
    const t = await token();
    return rec.saveCats(t, st.id, cats || []);
  });

  ipcMain.on('rec-open-sheet', () => {
    const st = S.load().recSheet;
    if (st && st.url) S.openInBrowser(st.url);
  });

  /* 명렬표 */
  ipcMain.handle('roster-get', () => loadRoster());
  ipcMain.handle('roster-fetch', async () => refreshRoster());
}

module.exports = { register, recState, loadRoster, refreshRoster };
