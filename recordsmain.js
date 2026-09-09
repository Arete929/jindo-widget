// 파일명: recordsmain.js | @version 1.114.3
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
const nrec = require('./notionrec.js');
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

/* ── 수업 메모 — 이 PC 에 담아 두는 곳 ────────────────────
   ★ 구글이 없어도 적을 수 있어야 한다. 시트는 «두 PC 맞추기» 용이다.
   키는 «날짜|교시» 다. 한 시간에 한 줄이면 넉넉하다. */
function noteFile() { return path.join(S.userDataPath, 'classnotes.json'); }
function loadLocalNotes() {
  try {
    const j = JSON.parse(fs.readFileSync(noteFile(), 'utf-8'));
    return (j && typeof j === 'object') ? j : {};
  } catch (e) { return {}; }
}
function saveLocalNotes(o) {
  try { fs.writeFileSync(noteFile(), JSON.stringify(o)); return true; }
  catch (e) { S.log('수업 메모 담기 실패 — ' + (e.message || e)); return false; }
}
function stampNow() {
  const t = new Date(), p = (n) => String(n).padStart(2, '0');
  return `${t.getFullYear()}.${p(t.getMonth() + 1)}.${p(t.getDate())} `
    + `${p(t.getHours())}:${p(t.getMinutes())}:${p(t.getSeconds())}`;
}
/* 담아 둔 것을 화면이 쓰는 목록 모양으로 */
function localList() {
  const m = loadLocalNotes();
  return Object.keys(m).map((k) => m[k]).filter((x) => x && x.date && x.cls);
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

  /* ── 수업 메모(진도표) ────────────────────────────────────
     컴시간 시간표가 «어느 수업인지» 를 채워 주므로, 사람은 한 줄만 적는다. */
  /* 읽기 — 이 PC 것이 먼저다. 시트에만 있는 것(다른 PC 에서 적은 것)은 보태 준다. */
  ipcMain.handle('note-load', async () => {
    const mine = loadLocalNotes();
    const out = Object.keys(mine).map((k) => mine[k]);
    const st = S.load();
    if (!st.recSheet || !st.recSheet.id) return { notes: out, sheet: false };
    try {
      const t = await token();
      const far = await rec.loadNotes(t, st.recSheet.id);
      let added = 0;
      far.forEach((x) => {
        const k = x.date + '|' + x.p;
        if (mine[k]) return;              // 이 PC 것이 앞선다
        out.push(x); mine[k] = x; added++;
      });
      if (added) { saveLocalNotes(mine); S.log(`수업 메모 — 시트에서 ${added}줄 받아 옴`); }
      return { notes: out, sheet: true };
    } catch (e) {
      // 시트가 안 되더라도 이 PC 것은 그대로 보여 준다
      S.log('수업 메모 — 시트 읽기 실패(이 PC 것만 씁니다) — ' + (e.message || e));
      return { notes: out, sheet: false, warn: '시트를 못 읽어 이 PC 에 담긴 것만 보입니다' };
    }
  });
  /* 담기 — ★ 이 PC 에 먼저 담고 곧바로 «됐다» 고 답한다.
     시트는 뒤에서 밀어 넣는다. 시트가 안 돼도 적은 것은 남는다. */
  ipcMain.handle('note-save', async (_e, o) => {
    if (!o || !o.date || !o.cls) return { ok: false, error: '어느 수업인지 알 수 없습니다' };
    const at = stampNow();
    const m = loadLocalNotes();
    const key = o.date + '|' + o.p;
    const text = String(o.text || '');
    if (!text) delete m[key];            // 비우면 지운다
    else {
      m[key] = { date: o.date, dow: o.dow || '', p: Number(o.p) || 0,
        cls: o.cls, subject: o.subject || '', text: text, at: at };
    }
    if (!saveLocalNotes(m)) return { ok: false, error: '이 PC 에 담지 못했습니다' };
    S.log(`수업 메모 — ${o.date} ${o.p}교시 ${o.cls} (이 PC 에 담음)`);

    // 시트는 «되면 좋고» — 기다리지 않는다
    const st = S.load();
    if (st.recSheet && st.recSheet.id && text) {
      token()
        .then((t) => rec.saveNote(t, st.recSheet.id, o))
        .then(() => S.log('수업 메모 — 시트에도 담음'))
        .catch((e) => S.log('수업 메모 — 시트에는 못 담음(이 PC 에는 담겼습니다) — '
          + (e.message || e)));
    }
    return { ok: true, at: at, local: true };
  });

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
    return rec.saveRecord(t, st.id, p.student, p.cat, p.text, p.row, p.when, p.note);
  });

  /* ── ↻ 변환 — 노션에 쓰고, AI 가 채우기를 기다렸다가, 도로 가져온다 ──
     ★ 진행 상황을 그때그때 화면에 보낸다(게이지). 끝나면 문장을 돌려준다. */
  ipcMain.handle('rec-notion-run', async (e, p) => {
    const key = S.load().notionKey || '';
    /* ★ «어느 줄» 인지 함께 보낸다 — 두 줄을 잇달아 변환하면 소식이 뒤섞인다 */
    const 줄 = (p && p.row) || '';
    const 알림 = (step, of, msg, extra) => {
      try { e.sender.send('rec-progress', Object.assign({ row: 줄, step, of, msg }, extra || {})); }
      catch (err) { /* 창이 닫혔으면 그만 */ }
    };
    const 총 = 6;
    try {
      알림(1, 총, '노션에 페이지 만드는 중…');
      const made = await nrec.send(key, p || {});
      알림(2, 총, made.linked ? '학생 연결됨' : '학생 연결 못 함 — 그대로 진행', { pageId: made.id, url: made.url });
      알림(3, 총, '노션 AI 가 쓰는 중…');
      const 문장 = await nrec.waitProp(key, made.id, p && p.prop ? p.prop : '누가기록',
        { seconds: Number((p && p.wait) || 360),
          onStep: (sec, all) => 알림(3, 총, '노션 AI 가 쓰는 중… (최대 ' + Math.round(all / 60) + '분까지 기다립니다)') });
      if (!문장) {
        알림(총, 총, '아직 안 채워졌습니다');
        return { ok: false, pageId: made.id, url: made.url,
          error: '노션 AI 가 아직 안 썼습니다 — 노션이 밀리는 듯합니다. 그 페이지를 열어 «누가기록» 을 보시거나, 조금 뒤 다시 눌러 주세요' };
      }
      알림(4, 총, '문장을 받았습니다');
      /* ★ 노션 AI 가 지은 한 줄 제목(«제목» 속성)이 있으면 «내용» 을 그것으로 바꾼다.
         없으면 그대로 둔다 — 만들 때 이미 단어 경계에서 잘라 넣었다.
         «제목» 은 «누가기록» 보다 짧아 대개 먼저 끝나 있다. 잠깐만 더 기다린다. */
      알림(5, 총, '기록 페이지에 남기는 중…');
      try {
        const 제목 = await nrec.waitProp(key, made.id, '제목', { seconds: 30 });
        if (제목) await nrec.setTitle(key, made.id, 제목);
      } catch (err) { S.log('노션 제목 채우기 건너뜀 — ' + ((err && err.message) || err)); }
      /* 그 기록 페이지 본문 콜아웃에도 같은 문장을 남긴다 — 노션에서 바로 읽히게 */
      try { await nrec.putNote(key, made.id, 문장); }
      catch (err) { S.log('노션 콜아웃 채우기 실패 — ' + ((err && err.message) || err)); }
      /* ★ 그 학생 페이지 본문에도 «날짜 · 구분 — 문장» 한 줄을 쌓는다.
         표 칸에만 남으면 학생별로 모아 볼 수가 없다. */
      let 쌓음 = false;
      if (made.student) {
        알림(6, 총, '학생 페이지에 쌓는 중…');
        try {
          쌓음 = await nrec.putStudent(key, made.student,
            { when: (p && p.when) || '', cat: (p && p.cat) || '', text: 문장, url: made.url });
        } catch (err) { S.log('학생 페이지 쌓기 실패 — ' + ((err && err.message) || err)); }
      }
      알림(총, 총, 쌓음 ? '다 됐습니다 — 학생 페이지에도 쌓았습니다' : '다 됐습니다');
      S.log('학생기록 → 노션 왕복 완료 (' + String(문장).length + '자)');
      return { ok: true, note: 문장, pageId: made.id, url: made.url,
        linked: made.linked, piled: 쌓음, student: made.student || '' };
    } catch (err) {
      const msg = (err && err.message) || String(err);
      알림(총, 총, '멈췄습니다 — ' + msg);
      return { ok: false, error: msg };
    }
  });

  /* ── 노션으로 보내기·가져오기 ── */
  ipcMain.handle('rec-notion-send', async (_e, p) => {
    const key = S.load().notionKey || '';
    const r = await nrec.send(key, p || {});
    S.log('학생기록 → 노션 페이지 만듦' + (r.linked ? ' (학생 연결됨)' : ' (학생 연결 못 함)'));
    return r;
  });
  ipcMain.handle('rec-notion-get', async (_e, p) => {
    const key = S.load().notionKey || '';
    let id = (p && p.pageId) || '';
    if (!id) id = await nrec.findPage(key, p || {});
    if (!id) return { ok: false, error: '노션에서 그 기록을 못 찾았습니다 — 먼저 «노션으로 보내기» 를 하세요' };
    const note = await nrec.fetchNote(key, id);
    if (!note) return { ok: false, error: '노션 쪽 누가기록이 아직 비어 있습니다 — 그 페이지에서 «#행특» 을 한 번 시켜 주세요', pageId: id };
    return { ok: true, note: note, pageId: id };
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

/* 위젯의 로그인 자동 복원이 쓴다 — 저장된 갱신 토큰으로 새 액세스 토큰을 받는다 */
module.exports = { register, recState, loadRoster, refreshRoster, accessToken: token };
