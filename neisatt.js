// 파일명: neisatt.js | @version 1.1.0 — 1.1.0: 업무포털 로그인만 하면 «[나이스]» 를 지비스가 눌러 들어간다(실제 확인) / 1.0.1: 실제 나이스로 확인(9~11월 칸 55건이 규칙과 일치) · 마감 판단을 저장 단추+화면 글로 · 공휴일은 «시간표 없음» · 다른 곳(구분/교시 칸/사유) 표시 — 지비스 출결 → 나이스 «일일출결관리(담임용)» 일괄입력·지우기·맞대 보기 (지비스 전용, 메인 프로세스)
/* ★ 어떻게 하나 (2026-11-12, 스쿨보드 1.2.7 «나이스 일괄입력» 방식을 참고해 새로 짬)
   1. PC 에 깔린 크롬(없으면 엣지)을 «지비스 전용 프로필»로 띄운다 — 선생님이 평소 쓰는 크롬과 섞이지 않는다.
   2. 업무포털 로그인(인증서·2차 인증)은 선생님이 그 창에서 «직접» 한다. 비밀번호는 받지도 저장하지도 않는다.
   3. 지비스는 크롬과 «파이프»(--remote-debugging-pipe)로만 이야기한다 — 포트를 열지 않아 다른 프로그램이 끼어들 수 없다.
   4. 나이스 화면은 eXBuilder6(window.cpr) 로 되어 있다. 화면 안의 자료 묶음(dsListDdAtte)에 값을 넣고
      나이스의 [저장] 단추와 확인창을 누른다 — 사람이 손으로 하는 것과 같은 길이다.
   5. ★ 교차 확인 — 넣기 «전» 에 나이스 값을 읽어 앱 출결과 맞대 보고(같음·비어 있음·다름),
      저장한 «뒤» 에 다시 조회해 넣으려던 값과 한 칸씩 같은지 본다. 같아야만 «저장됨» 이다.
   ★ 출결마감은 하지 않는다. 마감된 날·달은 손대지 않는다.
   ★ 화면 번호·칸 이름이 예상과 다르면 아무것도 쓰지 않고 멈춘다(나이스가 바뀌었을 수 있다). */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORTAL_URL = 'https://sen.eduptl.kr/';          // 서울시교육청 업무포털
const LOGIN_WAIT = 5 * 60 * 1000;                     // 로그인하고 나이스에 들어오기를 기다리는 시간
const MAX_ENTRIES = 100;                              // 한 번에 넣는 건수
const MAX_REASON_BYTES = 500;                         // 나이스 사유 칸(바이트)
const RECOGNIZED_MARK_CHASU = 795;                    // 이 차수부터 출석인정 표시는 «Ø»
const CELL_KEYS = ['jo'].concat(Array.from({ length: 12 }, (_, i) => 'gyo' + (i + 1))).concat(['jong']);
const CLOSINGS = /^(질병|미인정|기타|출석인정)(결석|지각|조퇴|결과)$/;

/* ── 크롬 찾기 ── */
function findBrowser() {
  const E = process.env, pf = E.ProgramFiles || 'C:\\Program Files', pf86 = E['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
  const list = [
    path.join(pf, 'Google\\Chrome\\Application\\chrome.exe'),
    path.join(pf86, 'Google\\Chrome\\Application\\chrome.exe'),
    E.LOCALAPPDATA ? path.join(E.LOCALAPPDATA, 'Google\\Chrome\\Application\\chrome.exe') : '',
    path.join(pf86, 'Microsoft\\Edge\\Application\\msedge.exe'),
    path.join(pf, 'Microsoft\\Edge\\Application\\msedge.exe')
  ];
  return list.find((p) => { try { return p && fs.statSync(p).isFile(); } catch (e) { return false; } }) || '';
}

/* ── 크롬과 파이프로 이야기하기(Chrome DevTools Protocol) ──
   fd3 = 크롬이 읽는 쪽, fd4 = 크롬이 쓰는 쪽. 한 마디는 JSON + NUL(\0) */
class Cdp {
  constructor(proc) {
    this.proc = proc; this.seq = 0; this.wait = new Map(); this.closed = false;
    let pend = Buffer.alloc(0);
    proc.stdio[4].on('data', (b) => {
      pend = Buffer.concat([pend, b]);
      let i;
      while ((i = pend.indexOf(0)) >= 0) {
        const msg = pend.subarray(0, i).toString('utf8');
        pend = pend.subarray(i + 1);
        this.onMsg(msg);
      }
    });
    const end = () => {
      if (this.closed) return;
      this.closed = true;
      for (const w of this.wait.values()) { clearTimeout(w.t); w.reject(new Error('나이스 창(크롬)이 닫혔습니다')); }
      this.wait.clear();
    };
    proc.on('exit', end);
    proc.on('error', end);
    proc.stdio[4].on('close', end);
    proc.stdio[3].on('error', end);
  }
  onMsg(msg) {
    let j; try { j = JSON.parse(msg); } catch (e) { return; }
    if (!j.id || !this.wait.has(j.id)) return;
    const w = this.wait.get(j.id); this.wait.delete(j.id); clearTimeout(w.t);
    if (j.error) w.reject(new Error(j.error.message || '크롬 오류')); else w.resolve(j.result || {});
  }
  send(method, params, sessionId, timeout) {
    if (this.closed) return Promise.reject(new Error('나이스 창(크롬)이 닫혔습니다'));
    const id = ++this.seq, m = { id, method, params: params || {} };
    if (sessionId) m.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => { this.wait.delete(id); reject(new Error('크롬이 답하지 않습니다 (' + method + ')')); }, timeout || 90000);
      this.wait.set(id, { resolve, reject, t });
      try { this.proc.stdio[3].write(JSON.stringify(m) + '\0'); }
      catch (e) { clearTimeout(t); this.wait.delete(id); reject(e); }
    });
  }
}

let CR = null;                 // { proc, cdp, sessions: Map(targetId → sessionId) }
let STOP = false;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
class Stopped extends Error {}
function checkStop() { if (STOP) throw new Stopped('멈추기를 눌러 멈췄습니다'); }

/* 지비스 전용 프로필로 떠 있는 «끈 떨어진» 크롬을 닫는다.
   ★ 지비스가 꺼졌다 켜지면 파이프는 끊겨도 그 크롬 창은 남는다. 같은 프로필로 새로 띄우면
     새 크롬이 남은 창에 일을 넘기고 곧바로 끝나 버려 연결할 수 없다 — 그래서 남은 창을 닫고 다시 띄운다.
     이 프로필은 지비스만 쓰므로 선생님의 평소 크롬은 건드리지 않는다. 경로(한글)는 환경 변수로 넘긴다. */
function closeStale(profileDir) {
  return new Promise((resolve) => {
    const ps = 'Get-CimInstance Win32_Process -Filter "Name=\'chrome.exe\' or Name=\'msedge.exe\'" | '
      + 'Where-Object { $_.CommandLine -and $_.CommandLine.IndexOf($env:JIVIS_NEIS_DIR, [StringComparison]::OrdinalIgnoreCase) -ge 0 } | '
      + 'ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }';
    const p = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps],
      { stdio: 'ignore', windowsHide: true, env: Object.assign({}, process.env, { JIVIS_NEIS_DIR: '--user-data-dir=' + profileDir }) });
    p.on('exit', () => setTimeout(resolve, 1500));
    p.on('error', () => resolve());
  });
}
async function ensureBrowser(profileDir) {
  if (CR && !CR.cdp.closed) return CR;
  try { return await launchBrowser(profileDir); }
  catch (e) {
    if (!e.handedOff) throw e;
    await closeStale(profileDir);
    return launchBrowser(profileDir);
  }
}
async function launchBrowser(profileDir) {
  const exe = findBrowser();
  if (!exe) throw new Error('이 PC 에서 크롬(또는 엣지)을 찾지 못했습니다');
  fs.mkdirSync(profileDir, { recursive: true });
  const t0 = Date.now();
  const proc = spawn(exe, ['--remote-debugging-pipe', '--user-data-dir=' + profileDir,
    '--no-first-run', '--no-default-browser-check', PORTAL_URL],
  { stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'], windowsHide: false });
  let errTail = '', spawnErr = '';
  proc.stderr.on('data', (d) => { errTail = (errTail + d).slice(-400); });   // 안 읽으면 버퍼가 차서 크롬이 멈출 수 있다
  proc.on('error', (e) => { spawnErr = e.message; });
  const cdp = new Cdp(proc);
  try { await cdp.send('Browser.getVersion', {}, null, 20000); }
  catch (e) {
    try { proc.kill(); } catch (_) {}
    if (spawnErr) throw new Error('크롬을 띄우지 못했습니다 — ' + spawnErr);
    /* 같은 프로필 크롬이 이미 떠 있으면(지비스를 다시 켠 경우 등) 새 크롬은 그쪽에 넘기고 곧바로 끝난다 */
    const hint = String(errTail).split(/\r?\n/).filter((l) => l && !/external_registry_loader/.test(l)).slice(-2).join(' / ');
    const err = new Error('지비스용 나이스 창(크롬)에 연결하지 못했습니다(' + e.message + (proc.exitCode !== null ? ', 크롬 종료 ' + proc.exitCode : '') + ')'
      + (hint ? ' — ' + hint.slice(0, 200) : '') + '. 지비스용 나이스 창이 떠 있으면 모두 닫은 뒤 다시 눌러 주세요');
    err.handedOff = proc.exitCode !== null && Date.now() - t0 < 15000;   // 곧바로 끝났다 = 남은 창에 넘겼다
    throw err;
  }
  CR = { proc, cdp, sessions: new Map() };
  return CR;
}

async function pageTargets(cr) {
  const r = await cr.cdp.send('Target.getTargets');
  return (r.targetInfos || []).filter((t) => t.type === 'page');
}
async function sessionOf(cr, targetId) {
  if (cr.sessions.has(targetId)) return cr.sessions.get(targetId);
  const r = await cr.cdp.send('Target.attachToTarget', { targetId, flatten: true });
  cr.sessions.set(targetId, r.sessionId);
  return r.sessionId;
}
/* 화면 안에서 함수 하나를 돌린다 — 함수는 바깥 변수를 쓰지 않아야 한다(글로 바뀌어 넘어간다) */
/* ★ 나이스는 메뉴를 열 때 화면(페이지)을 갈아 끼우기도 한다 — 그러면 붙어 있던 연결(session)이 사라진다(2026-11-12 실측
   «Session with given id not found»). 핸들({sid, targetId})로 부르면 나이스 탭을 다시 찾아 붙고 한 번 더 한다. */
const LOST = /Session with given id not found|No session with given id|Target closed|Cannot find context|Execution context was destroyed|Inspected target navigated|context with specified id/i;
async function reattach(cr, h) {
  cr.sessions.clear();
  for (let w = 0; w < 60000; w += 1000) {
    const pages = await pageTargets(cr);
    for (const t of pages.filter((x) => /^https:\/\/[a-z0-9-]+\.neis\.go\.kr\//.test(x.url || ''))) {
      try {
        const sid = await sessionOf(cr, t.targetId);
        const p = await evRaw(cr, sid, pProbe);
        if (p && p.root && p.menus > 0) { h.sid = sid; h.targetId = t.targetId; return; }
      } catch (e) { cr.sessions.delete(t.targetId); }
    }
    await sleep(1000);
  }
  throw new Error('나이스 화면과 연결이 끊겼습니다. 나이스 창이 열려 있는지 확인하고 다시 해 주세요');
}
async function ev(cr, h, fn, arg) {
  if (typeof h === 'string') return evRaw(cr, h, fn, arg);
  for (let i = 0; ; i++) {
    try { return await evRaw(cr, h.sid, fn, arg); }
    catch (e) {
      if (i >= 2 || !LOST.test(String(e && e.message))) throw e;
      await reattach(cr, h);
    }
  }
}
async function evRaw(cr, sid, fn, arg) {
  const expression = '(' + fn.toString() + ')(' + JSON.stringify(arg === undefined ? null : arg) + ')';
  const r = await cr.cdp.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true }, sid, 180000);
  if (r.exceptionDetails) {
    const d = r.exceptionDetails, msg = (d.exception && d.exception.description) || d.text || '';
    throw new Error('나이스 화면에서 오류 — ' + String(msg).split('\n')[0]);
  }
  return r.result ? r.result.value : undefined;
}

/* ══ 나이스 화면 안에서 도는 함수들 (eXBuilder6) ══ */
function pProbe() {
  try {
    const apps = (window.cpr && window.cpr.core && window.cpr.core.Platform.INSTANCE.getAllRunningAppInstances()) || [];
    const root = apps.find((a) => a.hasAppMethod && a.hasAppMethod('doOpenMenuToMdi'));
    if (!root) return { root: false };
    const menu = root.lookup('dsAllMenu');
    return { root: true, menus: menu ? menu.getRowCount() : 0 };
  } catch (e) { return { root: false }; }
}
/* 담임 «출결관리» 메뉴 후보 — 교과담임 쪽은 뺀다(중학교는 같은 화면 번호가 두 군데 있다) */
function pMenus() {
  const apps = window.cpr.core.Platform.INSTANCE.getAllRunningAppInstances();
  const root = apps.find((a) => a.hasAppMethod && a.hasAppMethod('doOpenMenuToMdi'));
  const menu = root && root.lookup('dsAllMenu');
  if (!menu || !menu.getRowCount()) return null;
  const rows = Array.from({ length: menu.getRowCount() }, (_, i) => menu.getRowData(i));
  const byId = new Map(rows.map((r) => [r.V_MENU_ID, r]));
  return rows.filter((r) => /^(his|mis)_srgaa02_m00$/.test(r.PGM_ID || '')).map((r) => {
    const p = [];
    for (let n = r; n && p.length < 10; n = byId.get(n.V_UP_MENU_ID)) p.unshift(n.MENU_NM);
    return { vMenuId: r.V_MENU_ID, pgmId: r.PGM_ID, path: p };
  }).filter((c) => c.path[0] !== '교과담임');
}
function pOpenMenu(vMenuId) {
  const apps = window.cpr.core.Platform.INSTANCE.getAllRunningAppInstances();
  const root = apps.find((a) => a.hasAppMethod && a.hasAppMethod('doOpenMenuToMdi'));
  if (!root) return false;
  setTimeout(() => root.callAppMethod('doOpenMenuToMdi', vMenuId));
  return true;
}
function pSelected() {
  const apps = window.cpr.core.Platform.INSTANCE.getAllRunningAppInstances();
  const root = apps.find((a) => a.hasAppMethod && a.hasAppMethod('doOpenMenuToMdi'));
  const tab = root && root.lookup('mdiCn') && root.lookup('mdiCn').getSelectedTabItem();
  let info = {};
  try { info = JSON.parse((tab && tab.userAttr('__menuInfo')) || '{}'); } catch (e) {}
  const screen = tab && tab.content && tab.content.getEmbeddedAppInstance && tab.content.getEmbeddedAppInstance();
  return { vMenuId: info.V_MENU_ID || '', loaded: !!screen, appId: (screen && screen.app && screen.app.id) || '' };
}
/* 출결관리 안의 «일일출결» 단계까지 — 아직이면 단계 단추를 누르고 다음 번에 다시 본다 */
function pStep() {
  const apps = window.cpr.core.Platform.INSTANCE.getAllRunningAppInstances();
  const root = apps.find((a) => a.hasAppMethod && a.hasAppMethod('doOpenMenuToMdi'));
  const tab = root && root.lookup('mdiCn').getSelectedTabItem();
  const screen = tab && tab.content && tab.content.getEmbeddedAppInstance && tab.content.getEmbeddedAppInstance();
  const m = screen && screen.app && String(screen.app.id || '').match(/^edu\/sw\/(his|mis)\/srg\/aa\/\1_srgaa02_m00$/);
  if (!m) return { ready: false, appId: (screen && screen.app && screen.app.id) || '' };
  const unit = m[1];
  const embed = screen.lookup('embMain');
  const daily = embed && embed.getEmbeddedAppInstance && embed.getEmbeddedAppInstance();
  if (daily && daily.app && daily.app.id !== 'edu/sw/' + unit + '/srg/aa/' + unit + '_srgaa02_m02') {
    screen.lookup('btnStep02').click();
    return { ready: false };
  }
  const search = daily && daily.lookup('dmSearch');
  if (!search || !search.getValue('shlCd') || !search.getValue('clsCd')) return { ready: false };
  const nc = window.cpr.core.NotificationCenter;
  if (nc && nc.INSTANCE.loadmask) return { ready: false };
  return { ready: true, unit, modified: daily.lookup('dsListDdAtte').isModified() };
}
async function pSearch(ymd) {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const apps = window.cpr.core.Platform.INSTANCE.getAllRunningAppInstances();
  const root = apps.find((a) => a.hasAppMethod && a.hasAppMethod('doOpenMenuToMdi'));
  const screen = root.lookup('mdiCn').getSelectedTabItem().content.getEmbeddedAppInstance();
  const m = screen && String(screen.app.id || '').match(/^edu\/sw\/(his|mis)\/srg\/aa\/\1_srgaa02_m00$/);
  const unit = m && m[1];
  const daily = unit && screen.lookup('embMain').getEmbeddedAppInstance();
  if (!unit || !daily || daily.app.id !== 'edu/sw/' + unit + '/srg/aa/' + unit + '_srgaa02_m02') return { fatal: true, error: '나이스 일일출결관리 화면이 닫혔습니다' };
  const ds = daily.lookup('dsListDdAtte'), search = daily.lookup('dmSearch'), sub = daily.lookup('subListDdAtte');
  const nc = window.cpr.core.NotificationCenter;
  for (let w = 0; nc && nc.INSTANCE.loadmask; w += 200) {
    if (w > 60000) return { fatal: true, error: '나이스가 이전 요청을 끝내지 않습니다' };
    await sleep(200);
  }
  let running = 0, finished = 0;
  const onStart = () => { running += 1; }, onDone = () => { running = Math.max(0, running - 1); finished += 1; };
  sub.addEventListener('before-submit', onStart);
  sub.addEventListener('submit-done', onDone);
  try {
    daily.lookup('udcswcdti1').getEmbeddedAppInstance().lookup('dtiAtteYmd').value = ymd;
    if (search.getValue('atteYmd') !== ymd) return { error: '나이스 조회 날짜를 바꾸지 못했습니다' };
    await sleep(300);
    if (!running && !finished) daily.lookup('btnSearch').click();
    for (let w = 0; running || !finished; w += 200) {
      if (w > 60000) return { fatal: true, error: '나이스 조회가 끝나지 않았습니다' };
      await sleep(200);
    }
  } finally {
    sub.removeEventListener('before-submit', onStart);
    sub.removeEventListener('submit-done', onDone);
  }
  const n = ds.getRowCount();
  if (n && ds.getValue(0, 'atteYmd') !== ymd) return { error: '나이스 조회 결과의 날짜가 다릅니다' };
  const keys = ['jo'].concat(Array.from({ length: 12 }, (_, i) => 'gyo' + (i + 1))).concat(['jong']);
  const cols = ds.getColumnNames();
  const chasu = search.isExistColumn('chasu') ? search.getValue('chasu') : null;
  const rows = Array.from({ length: n }, (_, i) => {
    const r = ds.getRowData(i);
    const cells = {}; keys.forEach((k) => { cells[k] = r[k] || ''; });
    return {
      index: i, number: Number(r.clsNo), name: r.stuFlnm || '',
      special: /\((공동|학교밖)\)/.test(r.stuFlnm || ''),
      totMax: Number(r.totMax) || 0, closing: r.chulgyulGb || '', reason: r.atteRmkCn || '', cells,
      g: Array.from({ length: 12 }, (_, p) => r['g' + (p + 1)] || ''),
      e: Array.from({ length: 12 }, (_, p) => r['e' + (p + 1)] || '')
    };
  });
  /* 넣을 수 있는지는 나이스 «저장» 단추로 본다. 마감 표시 값(atteDdlnYn)은 화면 글(«일출결마감미확인»)과 어긋나는 일이 있어
     (2026-11 실제 나이스: 일 마감 값 Y 인데 화면은 «미확인»), 단추가 꺼졌을 때 까닭을 알리는 데만 화면 글로 쓴다 */
  const label = (id) => { const o = daily.lookup(id); return String((o && o.value) || '').replace(/^[☞\s]+/, ''); };
  const mmTxt = label('optMmAtteFin'), ddTxt = label('optDayAtteFin');
  const closed = !n || daily.lookup('btnSave').enabled ? ''
    : /마감완료/.test(mmTxt) ? '나이스에서 이달 출결이 마감되어 있습니다(«' + mmTxt + '»)'
      : /마감완료/.test(ddTxt) ? '나이스에서 이날 출결이 마감되어 있습니다(«' + ddTxt + '»)'
        : '나이스 저장 단추가 꺼져 있어 넣을 수 없습니다';
  return { rows, cols, chasu, closed, ayr: search.getValue('ayr') || '', grd: search.getValue('grd') || '', cls: search.getValue('clsCd') || '', unit };
}
async function pAlert(timeout) {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  for (let w = 0; ; w += 200) {
    const apps = window.cpr.core.Platform.INSTANCE.getAllRunningAppInstances();
    const a = apps.find((x) => x.app && x.app.id === 'app/cmn/alert');
    const msg = a && a.lookup('optMsg') && a.lookup('optMsg').value;
    if (msg) { a.lookup('btnConfirm').click(); return msg; }
    if (w >= timeout) return '';
    await sleep(200);
  }
}
function pWrite(arg) {
  const apps = window.cpr.core.Platform.INSTANCE.getAllRunningAppInstances();
  const root = apps.find((a) => a.hasAppMethod && a.hasAppMethod('doOpenMenuToMdi'));
  const screen = root.lookup('mdiCn').getSelectedTabItem().content.getEmbeddedAppInstance();
  const m = screen && String(screen.app.id || '').match(/^edu\/sw\/(his|mis)\/srg\/aa\/\1_srgaa02_m00$/);
  const unit = m && m[1];
  const daily = unit && screen.lookup('embMain').getEmbeddedAppInstance();
  if (!unit || !daily || daily.app.id !== 'edu/sw/' + unit + '/srg/aa/' + unit + '_srgaa02_m02') return false;
  const ds = daily.lookup('dsListDdAtte');
  if (ds.isModified() || daily.lookup('dmSearch').getValue('atteYmd') !== arg.ymd) return false;
  if (arg.writes.some((w) => Number(ds.getValue(w.index, 'clsNo')) !== w.number || ds.getValue(w.index, 'atteYmd') !== arg.ymd)) return false;
  const cols = new Set(ds.getColumnNames());
  arg.writes.forEach((w) => {
    ds.setValue(w.index, 'chulgyulGb', w.closing);
    Object.keys(w.cells).forEach((k) => { if (cols.has(k)) ds.setValue(w.index, k, w.cells[k]); });
    ds.setValue(w.index, 'atteRmkCn', w.reason);
  });
  return ds.isModified();
}
async function pSave() {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const all = () => window.cpr.core.Platform.INSTANCE.getAllRunningAppInstances();
  const dialogs = () => all().filter((a) => a.app && (a.app.id === 'app/cmn/confirm' || a.app.id === 'app/cmn/alert'));
  const waitDialog = async (timeout, except) => {
    for (let w = 0; w <= timeout; w += 200) {
      const d = dialogs().find((x) => x !== except && x.lookup('optMsg') && x.lookup('optMsg').value);
      if (d) { await sleep(100); return d; }
      await sleep(200);
    }
    return null;
  };
  const root = all().find((a) => a.hasAppMethod && a.hasAppMethod('doOpenMenuToMdi'));
  const screen = root.lookup('mdiCn').getSelectedTabItem().content.getEmbeddedAppInstance();
  const m = screen && String(screen.app.id || '').match(/^edu\/sw\/(his|mis)\/srg\/aa\/\1_srgaa02_m00$/);
  const unit = m && m[1];
  const daily = unit && screen.lookup('embMain').getEmbeddedAppInstance();
  if (!unit || !daily || daily.app.id !== 'edu/sw/' + unit + '/srg/aa/' + unit + '_srgaa02_m02') return { ok: false, message: '나이스 일일출결관리 화면이 닫혔습니다' };
  if (dialogs().length) return { ok: false, message: '나이스에 닫히지 않은 알림창이 있습니다' };
  daily.lookup('btnSave').click();
  const confirm = await waitDialog(60000);
  if (!confirm) return { ok: false, message: '나이스 저장 확인창이 뜨지 않았습니다' };
  const isConfirm = confirm.app.id === 'app/cmn/confirm', cmsg = confirm.lookup('optMsg').value || '';
  confirm.lookup('btnConfirm').click();
  if (!isConfirm) return { ok: false, message: cmsg };
  const done = await waitDialog(120000, confirm);
  if (!done) return { ok: false, message: '나이스 저장 결과를 확인하지 못했습니다' };
  const msg = done.lookup('optMsg').value || '';
  done.lookup('btnConfirm').click();
  return { ok: msg === '저장했습니다.', message: msg };
}

/* ══ 맞대 보기·넣을 값 만들기 (여기 Node 쪽에서) ══ */
const bytes = (s) => Buffer.byteLength(String(s || ''), 'utf8');
const normName = (s) => String(s || '').replace(/\((공동|학교밖)\)/g, '').replace(/[\s*]+/g, '');
function findRow(e, rows) {
  const same = rows.filter((r) => r.number === e.number);
  if (!same.length) return { error: '나이스 명단에 ' + e.number + '번 학생이 없습니다' };
  /* 가린 이름(김*호) 이 와도 맞도록 «*» 는 아무 글자로 본다 */
  const want = normName(e.name);
  const ok = (r) => {
    const n = String(r.name || '').replace(/\((공동|학교밖)\)/g, '').replace(/\s+/g, '');
    if (!want || !n) return true;
    if (n.length !== want.length) return false;
    for (let i = 0; i < n.length; i++) if (n[i] !== '*' && n[i] !== want[i]) return false;
    return true;
  };
  const hit = same.filter(ok);
  if (!hit.length) return { error: e.number + '번 이름이 나이스와 다릅니다 (나이스: ' + same[0].name + ')' };
  if (hit.length > 1) return { error: e.number + '번 학생이 나이스에 둘 있습니다' };
  return { row: hit[0] };
}
/* 교시 칸 — 지각은 조회~N교시, 조퇴는 N교시~종례, 결과는 그 교시만, 결석은 조회~종례 모두 */
function buildTarget(e, row, cols) {
  const tot = row.totMax;
  if (!tot) return { error: '나이스에 이날 시간표가 없습니다', noday: true };
  const filled = (n) => row.special || (row.g[n - 1] === 'Y' && row.e[n - 1] === 'Y');
  const clickable = (n) => row.special || row.e[n - 1] === 'Y';
  const sign = (/^출석인정/.test(e.closing) && Number(row.chasu) >= RECOGNIZED_MARK_CHASU) ? 'Ø' : '/';
  const cells = {}; CELL_KEYS.forEach((k) => { cells[k] = ''; });
  const has = (k) => !cols || cols.indexOf(k) >= 0;
  const put = (k) => { if (has(k)) cells[k] = sign; };
  const per = (n) => { if (filled(n)) put('gyo' + n); };
  const p = e.p;
  if (e.kind !== '결석' && p > tot) return { error: '나이스 시간표는 ' + tot + '교시까지라 ' + p + '교시 ' + e.kind + '를 넣을 수 없습니다' };
  if (e.kind === '결석') { put('jo'); for (let n = 1; n <= tot; n++) per(n); put('jong'); }
  else if (e.kind === '지각') { put('jo'); for (let n = 1; n <= p; n++) per(n); }
  else if (e.kind === '조퇴') { for (let n = p; n <= tot; n++) per(n); put('jong'); }
  else if (e.kind === '결과') {
    if (!clickable(p)) return { error: '나이스에서 ' + p + '교시는 수업이 없는 교시(공강·행사)입니다' };
    put('gyo' + p);
  }
  if (!CELL_KEYS.some((k) => cells[k])) return { error: '나이스 시간표에 넣을 교시가 없습니다' };
  return { closing: e.closing, cells, reason: e.reason };
}
function cellLine(c) {
  const mk = (k) => (c && c[k]) || '·';
  return '조' + mk('jo') + ' ' + CELL_KEYS.slice(1, -1).map(mk).join('').replace(/·+$/, '') + ' 종' + mk('jong');
}
const isEmpty = (r) => !r.closing && !String(r.reason || '').trim() && CELL_KEYS.every((k) => !r.cells[k]);
function compare(row, t) {
  if (isEmpty(row)) return 'empty';
  const same = row.closing === t.closing && String(row.reason || '').trim() === t.reason
    && CELL_KEYS.every((k) => (row.cells[k] || '') === (t.cells[k] || ''));
  return same ? 'same' : 'diff';
}
/* 무엇이 다른지 — 구분 / 교시 칸 / 사유 (교시 칸만 같고 사유만 다른 경우가 실제로 흔하다) */
function diffWhat(row, t) {
  const w = [];
  if (row.closing !== t.closing) w.push('구분');
  if (!CELL_KEYS.every((k) => (row.cells[k] || '') === (t.cells[k] || ''))) w.push('교시 칸');
  if (String(row.reason || '').trim() !== t.reason) w.push('사유');
  return (w.join('·') || '값') + ' 다름';
}
const neisText = (r) => isEmpty(r) ? '비어 있음' : (r.closing || '(구분 없음)') + ' ' + cellLine(r.cells) + (String(r.reason || '').trim() ? ' · 사유 ' + String(r.reason).trim() : '');
const res = (e, status, message, extra) => Object.assign({ key: e.key, status, message: message || '' }, extra || {});
const fail = (list, msg, status) => list.map((e) => res(e, status || 'failed', msg));

function schoolYearOf(date) { const y = Number(date.slice(0, 4)), m = Number(date.slice(5, 7)); return m >= 3 ? y : y - 1; }

function normEntries(list) {
  if (!Array.isArray(list) || !list.length) throw new Error('나이스에 보낼 출결이 없습니다');
  if (list.length > MAX_ENTRIES) throw new Error('한 번에 ' + MAX_ENTRIES + '건까지 보낼 수 있습니다. 기간을 나눠 주세요');
  return list.map((x) => {
    const e = {
      key: String(x.key || ''), date: String(x.date || ''), number: Number(x.number), name: String(x.name || '').trim(),
      closing: String(x.closing || ''), kind: '', p: Math.round(Number(x.p) || 0), reason: String(x.reason || '').trim()
    };
    const m = e.closing.match(CLOSINGS);
    if (!e.key || !/^\d{4}-\d{2}-\d{2}$/.test(e.date) || !(e.number > 0) || !m) throw new Error('보낼 출결 값이 올바르지 않습니다');
    e.kind = m[2];
    if (e.kind !== '결석' && !(e.p >= 1 && e.p <= 12)) throw new Error(e.date + ' ' + e.number + '번 — 몇 교시인지 없습니다');
    if (bytes(e.reason) > MAX_REASON_BYTES) throw new Error(e.date + ' ' + e.number + '번 — 사유가 나이스 칸 한도를 넘습니다');
    return e;
  });
}

/* 하루치 — 맞대 보기(compare) · 넣기(input) · 지우기(delete) */
async function doDay(cr, sid, date, list, action, conflict) {
  const ymd = date.replace(/-/g, '');
  const day = await searchDay(cr, sid, ymd);
  if (day.fatal) throw new Error(day.error);
  if (day.error) return fail(list, day.error);
  if (day.ayr && Number(day.ayr) !== schoolYearOf(date)) {
    throw new Error('나이스 화면이 ' + day.ayr + '학년도라 ' + schoolYearOf(date) + '학년도 출결을 다룰 수 없습니다. 나이스에서 학년도를 바꾼 뒤 다시 해 주세요');
  }
  if (!day.rows.length) return list.map((e) => res(e, 'noday', day.noTimetable ? '나이스에 이날 시간표가 없습니다(공휴일·휴업일)' : '나이스에 이날 학생 줄이 없습니다(수업 없는 날)'));
  const out = [], writes = [], used = new Set();
  for (const e of list) {
    const f = findRow(e, day.rows);
    if (f.error) { out.push(res(e, 'failed', f.error)); continue; }
    const row = f.row;
    if (used.has(row.index)) { out.push(res(e, 'failed', e.number + '번 학생 출결이 이날 두 번 들어 있습니다')); continue; }
    used.add(row.index);
    const now = neisText(row);
    if (action !== 'compare' && day.closed) { out.push(res(e, 'failed', day.closed, { neis: now })); continue; }
    const t = buildTarget(e, row, day.cols);
    if (t.noday) { out.push(res(e, 'noday', '수업 없는 날입니다', { neis: now })); continue; }
    if (t.error) { out.push(res(e, 'failed', t.error, { neis: now })); continue; }
    const st = compare(row, t), want = t.closing + ' ' + cellLine(t.cells);
    if (action === 'compare') {
      out.push(res(e, st, st === 'same' ? '나이스와 같습니다' : st === 'empty' ? '나이스에 아직 없습니다' : '나이스 값이 다릅니다(' + diffWhat(row, t) + ')', { neis: now, want }));
      continue;
    }
    if (action === 'delete') {
      if (st === 'empty') out.push(res(e, 'empty', '나이스에 이미 없습니다', { neis: now }));
      else if (st === 'same') writes.push({ e, index: row.index, number: e.number, closing: '', cells: Object.fromEntries(CELL_KEYS.map((k) => [k, ''])), reason: '' });
      else out.push(res(e, 'skipped', '나이스 값이 앱 출결과 달라 지우지 않았습니다', { neis: now, want }));
      continue;
    }
    if (st === 'same') out.push(res(e, 'same', '나이스에 같은 출결이 이미 있습니다', { neis: now }));
    else if (st === 'diff' && conflict !== 'overwrite') out.push(res(e, 'skipped', '나이스에 다른 출결이 있어 건너뛰었습니다', { neis: now, want }));
    else writes.push({ e, index: row.index, number: e.number, closing: t.closing, cells: t.cells, reason: t.reason });
  }
  if (!writes.length) return out;
  checkStop();
  const pageWrites = writes.map((w) => ({ index: w.index, number: w.number, closing: w.closing, cells: w.cells, reason: w.reason }));
  if (!await ev(cr, sid, pWrite, { ymd, writes: pageWrites })) {
    throw new Error('넣는 동안 나이스 화면의 날짜나 칸이 바뀌었습니다. 나이스 화면을 건드리지 말고 다시 해 주세요');
  }
  const saved = await ev(cr, sid, pSave);
  /* ★ 교차 확인 — 다시 조회해서 넣으려던 값과 같은지 */
  const after = await searchDay(cr, sid, ymd);
  if (after.fatal || after.error) return out.concat(fail(writes.map((w) => w.e), '저장 뒤 확인 조회 실패: ' + after.error));
  for (const w of writes) {
    const r = after.rows.find((x) => x.index === w.index && x.number === w.number);
    if (action === 'delete') {
      out.push(r && isEmpty(r) ? res(w.e, 'deleted', '나이스에서 지웠습니다')
        : res(w.e, 'failed', saved.ok ? '지운 뒤 다시 조회한 나이스 값이 비어 있지 않습니다' : (saved.message || '나이스에 저장하지 못했습니다'), { neis: r ? neisText(r) : '' }));
    } else {
      out.push(r && compare(r, w) === 'same' ? res(w.e, 'saved', '나이스에 저장했습니다', { neis: neisText(r) })
        : res(w.e, 'failed', saved.ok ? '저장 뒤 다시 조회한 나이스 값이 다릅니다' : (saved.message || '나이스에 저장하지 못했습니다'), { neis: r ? neisText(r) : '' }));
    }
  }
  return out;
}
async function searchDay(cr, sid, ymd) {
  const day = await ev(cr, sid, pSearch, ymd);
  if (day.fatal) return day;
  const alert = await ev(cr, sid, pAlert, day.rows && day.rows.length ? 0 : 15000);
  if (alert) {
    const t = String(alert).replace(/^\[[^\]]*\]\s*:\s*/, '').replace(/\s+/g, ' ').replace(/\.$/, '');
    /* 공휴일·휴업일은 나이스가 «…에 해당하는 시간표를 확인 하세요» 라고만 한다(2026-09-24 추석 등 실제 확인) */
    if (!(day.rows && day.rows.length) && /해당하는 시간표를 확인/.test(t)) return Object.assign({}, day, { rows: [], noTimetable: true });
    return Object.assign({}, day, { error: '나이스 안내: «' + t + '»' + (/자료권한/.test(t) ? ' — 교과 선생님이 이날 출결을 먼저 넣었다면 나올 수 있으니 나이스에서 직접 확인해 주세요' : '') });
  }
  return day;
}

/* 나이스가 열린 탭을 찾는다 — 없으면 로그인하고 들어오기를 기다린다 */
/* 업무포털(로그인 뒤) 맨 위 메뉴의 «[나이스]» 링크를 찾아 누른다 — 2026-11-12 실제 화면:
   <a class="menuBtn" href="javascript:void(0)" id="https://sen.neis.go.kr/cmc_fcm_lg01_000.do?data=…">[나이스]</a>
   (주소는 id 에 들어 있고 누르면 포털 스크립트가 나이스를 연다). 나이스광장·원격지원·설문조사 링크는 고르지 않는다.
   로그인(인증서·2차 인증)은 선생님이 직접 한다 — 여기는 로그인이 «끝난» 뒤의 메뉴 누르기만 한다. */
function pPortalNeis(doClick) {
  const body = (document.body && document.body.innerText) || '';
  if (!/로그아웃/.test(body)) return { state: 'login' };
  const ok = (el) => {
    const t = (el.innerText || el.textContent || '').trim().replace(/\s+/g, '');
    const u = String(el.id || el.getAttribute('href') || '');
    return /^\[?나이스\]?$/.test(t) && /^https:\/\/[a-z0-9-]+\.neis\.go\.kr\//.test(u) && !/^https:\/\/(help|as\d*|esv-[a-z]+|www)\.neis\.go\.kr/.test(u);
  };
  const el = Array.from(document.querySelectorAll('a,button')).find(ok);
  if (!el) return { state: 'nolink' };
  if (doClick) el.click();
  return { state: 'found', clicked: !!doClick };
}
async function waitNeis(cr, say) {
  const until = Date.now() + LOGIN_WAIT;
  let opened = false, clickedAt = 0, clicks = 0;
  for (;;) {
    checkStop();
    const pages = await pageTargets(cr);
    for (const t of pages.filter((x) => /^https:\/\/[a-z0-9-]+\.neis\.go\.kr\//.test(x.url || ''))) {
      try {
        const sid = await sessionOf(cr, t.targetId);
        const p = await evRaw(cr, sid, pProbe);
        if (p && p.root && p.menus > 0) return { sid, targetId: t.targetId };
      } catch (e) { cr.sessions.delete(t.targetId); }
    }
    const hasNeis = pages.some((x) => /^https:\/\/[a-z0-9-]+\.neis\.go\.kr\//.test(x.url || '') && !/^https:\/\/(help|as\d*|esv-[a-z]+|www)\.neis\.go\.kr/.test(x.url || ''));
    /* 업무포털·나이스 탭이 하나도 없으면 업무포털을 새로 연다 */
    if (!opened && !pages.some((x) => /eduptl\.kr|neis\.go\.kr/.test(x.url || ''))) {
      opened = true;
      try { await cr.cdp.send('Target.createTarget', { url: PORTAL_URL }); } catch (e) {}
    }
    /* 로그인이 끝났으면 «[나이스]» 를 대신 누른다 — 나이스 탭이 뜨는 중이면 기다리고, 안 뜨면 30초 뒤 한 번 더(모두 두 번까지) */
    let portal = '';
    if (!hasNeis || Date.now() - clickedAt > 30000) {
      for (const t of pages.filter((x) => /^https:\/\/[a-z0-9-]+\.eduptl\.kr\//.test(x.url || ''))) {
        try {
          const sid = await sessionOf(cr, t.targetId);
          const click = !hasNeis && clicks < 2 && Date.now() - clickedAt > 30000;
          const r = await evRaw(cr, sid, pPortalNeis, click);
          if (r && r.state === 'found' && r.clicked) { clicks++; clickedAt = Date.now(); }
          if (r && (r.state === 'found' || !portal)) portal = r.state;
          if (portal === 'found') break;
        } catch (e) { cr.sessions.delete(t.targetId); }
      }
    }
    const left = Math.ceil((until - Date.now()) / 1000);
    if (left <= 0) throw new Error('5분 안에 나이스에 들어오지 않아 멈췄습니다. 나이스 창에서 로그인한 뒤 다시 눌러 주세요');
    const clock = ' (' + Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0') + ' 남음)';
    if (clickedAt || hasNeis) say('업무포털에서 나이스를 여는 중… 인증을 더 묻는 창이 뜨면 그것만 해 주세요' + clock);
    else if (portal === 'nolink') say('업무포털 화면에서 «나이스» 메뉴를 찾지 못했습니다 — 직접 «나이스» 를 눌러 들어가 주세요' + clock);
    else say('나이스 창에서 업무포털에 로그인해 주세요 — 로그인하면 나이스는 지비스가 열고 바로 이어서 합니다' + clock);
    await sleep(1500);
  }
}
/* 담임 «출결관리 → 일일출결» 화면까지 연다 */
async function openDaily(cr, sid, say) {
  say('나이스에서 담임 출결관리 메뉴를 찾는 중…');
  let menus = null;
  for (let w = 0; !(menus = await ev(cr, sid, pMenus)); w += 300) {
    checkStop();
    if (w > 60000) throw new Error('나이스 메뉴를 불러오지 못했습니다. 나이스 화면을 새로 고친 뒤 다시 해 주세요');
    await sleep(300);
  }
  if (!menus.length) throw new Error('나이스 메뉴에서 담임 «출결관리» 화면을 찾지 못했습니다. 이 계정에 담임 출결 권한이 있는지 확인해 주세요');
  const cur = await ev(cr, sid, pSelected);
  let pick = menus.find((c) => c.vMenuId === cur.vMenuId && cur.loaded) || menus.find((c) => c.path[0] === '학급담임') || (menus.length === 1 ? menus[0] : null);
  if (!pick) throw new Error('담임 출결관리 메뉴가 여럿이라 고르지 못했습니다. 나이스에서 «학급담임 → 출결관리» 를 열어 둔 뒤 다시 해 주세요');
  if (!(cur.vMenuId === pick.vMenuId && cur.loaded)) {
    say('나이스 «' + pick.path.join(' › ') + '» 화면을 여는 중…');
    if (!await ev(cr, sid, pOpenMenu, pick.vMenuId)) throw new Error('나이스 메뉴를 열지 못했습니다');
    for (let w = 0; ; w += 300) {
      checkStop();
      const s = await ev(cr, sid, pSelected);
      if (s.vMenuId === pick.vMenuId && s.loaded) break;
      if (w > 60000) throw new Error('나이스 출결관리 화면이 열리지 않았습니다');
      await sleep(300);
    }
  }
  say('일일출결관리 화면을 준비하는 중…');
  for (let w = 0; ; w += 300) {
    checkStop();
    const st = await ev(cr, sid, pStep);
    if (st.ready) {
      if (st.modified) throw new Error('나이스 일일출결관리 화면에 저장하지 않은 변경이 있습니다. 저장하거나 다시 조회한 뒤 해 주세요');
      break;
    }
    if (w > 60000) throw new Error('나이스 일일출결관리 화면이 열리지 않았습니다' + (st.appId ? ' (열린 화면 ' + st.appId + ')' : ''));
    await sleep(300);
  }
  await ev(cr, sid, pAlert, 0);
}

/* ══ 밖으로 내는 것 ══ */
const WORDS = { compare: '맞대 보는', input: '넣는', delete: '지우는' };
async function run(opt, say) {
  say = say || (() => {});
  STOP = false;
  const action = WORDS[opt.action] ? opt.action : 'compare';
  const conflict = opt.conflict === 'overwrite' ? 'overwrite' : 'skip';
  const entries = normEntries(opt.entries);
  say('나이스 창(크롬)을 여는 중…');
  const cr = await ensureBrowser(opt.profileDir);
  const results = [];
  try {
    const neis = await waitNeis(cr, say);
    try { await cr.cdp.send('Target.activateTarget', { targetId: neis.targetId }); } catch (e) {}
    await openDaily(cr, neis, say);
    const dates = Array.from(new Set(entries.map((e) => e.date))).sort();
    let stopMsg = '';
    for (let i = 0; i < dates.length; i++) {
      const list = entries.filter((e) => e.date === dates[i]);
      if (stopMsg) { results.push(...fail(list, stopMsg, 'stopped')); continue; }
      if (STOP) { stopMsg = '멈추기를 눌러 ' + (action === 'compare' ? '보지' : action === 'delete' ? '지우지' : '넣지') + ' 않았습니다'; results.push(...fail(list, stopMsg, 'stopped')); continue; }
      say('나이스 출결 ' + WORDS[action] + ' 중 (' + (i + 1) + '/' + dates.length + '일, ' + dates[i] + ')');
      try {
        results.push(...await doDay(cr, neis, dates[i], list, action, conflict));
      } catch (e) {
        stopMsg = e instanceof Stopped ? e.message : '나이스 작업을 멈췄습니다: ' + e.message;
        results.push(...fail(list, stopMsg, e instanceof Stopped ? 'stopped' : 'failed'));
      }
    }
    return { ok: true, results, stopped: !!stopMsg, stopMsg };
  } catch (e) {
    if (e instanceof Stopped) return { ok: true, results: results.concat(fail(entries.filter((x) => !results.some((r) => r.key === x.key)), e.message, 'stopped')), stopped: true, stopMsg: e.message };
    throw e;
  }
}
/* 미리 로그인해 두기 — 나이스 창만 띄운다 */
async function openWindow(profileDir) {
  const cr = await ensureBrowser(profileDir);
  const pages = await pageTargets(cr);
  const t = pages.find((x) => /neis\.go\.kr/.test(x.url || '')) || pages.find((x) => /eduptl\.kr/.test(x.url || ''));
  if (t) { try { await cr.cdp.send('Target.activateTarget', { targetId: t.targetId }); } catch (e) {} }
  else { try { await cr.cdp.send('Target.createTarget', { url: PORTAL_URL }); } catch (e) {} }
  return { ok: true };
}
function stop() { STOP = true; }

/* 점검용 — 나이스 일일출결을 날짜별로 «읽기만» 해서 칸 모양을 돌려준다(이름·사유 글은 빼고 번호·구분·칸·사유 길이만).
   지비스가 만드는 칸 규칙(지각=조회~N교시 등)이 선생님이 손으로 넣은 실제 값과 맞는지 보려고 쓴다. 나이스에는 아무것도 쓰지 않는다. */
async function peek(opt, say) {
  say = say || (() => {});
  STOP = false;
  const cr = await ensureBrowser(opt.profileDir);
  const neis = await waitNeis(cr, say);
  await openDaily(cr, neis, say);
  const out = [];
  for (const date of opt.dates || []) {
    say('읽는 중 ' + date);
    const day = await searchDay(cr, neis, String(date).replace(/-/g, ''));
    if (day.fatal || day.error) { out.push({ date, error: day.error }); continue; }
    const first = day.rows[0];
    out.push({
      date, ayr: day.ayr, grd: day.grd, cls: day.cls, chasu: day.chasu, closed: day.closed, unit: day.unit, students: day.rows.length,
      cols: (day.cols || []).filter((c) => /^(jo|jong|gyo\d+|chulgyulGb|atteRmkCn|totMax|g\d+|e\d+)$/.test(c)).join(','),
      sample: first ? { tot: first.totMax, g: first.g.join('|'), e: first.e.join('|') } : null,
      rows: day.rows.filter((r) => !isEmpty(r)).map((r) => ({ no: r.number, closing: r.closing, cells: cellLine(r.cells),
        raw: CELL_KEYS.map((k) => r.cells[k] || '').join('|'), reasonLen: String(r.reason || '').trim().length, tot: r.totMax,
        g: r.g.slice(0, r.totMax).join(''), e: r.e.slice(0, r.totMax).join('') }))
    });
  }
  return out;
}

module.exports = { run, openWindow, stop, peek, _cr: () => CR, _adopt: (c) => { CR = c; }, _test: { buildTarget, compare, findRow, cellLine, normEntries, schoolYearOf } };
