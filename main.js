// 파일명: main.js | @version 1.12.1
// 체육 수업진도 위젯 — 바탕화면에 항상 떠 있는 작은 카드
// 수정요약: v1.12.1 스크롤 안 되던 문제·한글 검색 입력 깨짐·받는 중 상태 표시 / v1.12.0 테마
//
// 값을 어떻게 얻는가:
//   숨은 창으로 실제 웹앱(jindo-dashboard.web.app)을 띄워 놓고, 그 앱이 위젯용으로
//   내놓는 window.__widgetData() 를 불러 결과만 받아온다. 화면을 긁는 게 아니라
//   앱이 화면을 그릴 때 쓰는 것과 똑같은 계산 결과라서, 앱 화면이 바뀌어도 안 깨진다.
//   로그인은 진짜 크롬에서 하고 그 결과(구글 ID 토큰)만 127.0.0.1 로 넘겨받는다 — startLogin() 참고.

const { app, BrowserWindow, Tray, Menu, ipcMain, shell, Notification, screen, powerMonitor } = require('electron');
const { autoUpdater } = require('electron-updater');
const { spawn } = require('child_process');
const http = require('http');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const APP_URL = 'https://jindo-dashboard.web.app/';
const APP_ORIGIN = 'https://jindo-dashboard.web.app';
const PARTITION = 'persist:jindo';
const POLL_INTERVAL_MS = 60 * 1000;          // 1분마다 값 갱신
// 2분마다 새 버전 확인. 확인은 latest.yml(350바이트 남짓) 하나를 받는 것이 전부라
// 이 정도 주기도 부담이 없다 — 새 버전이 나오면 사실상 바로 뜬다.
const UPDATE_CHECK_INTERVAL_MS = 2 * 60 * 1000;
const RELEASES_PAGE_URL = 'https://github.com/Arete929/jindo-widget/releases/latest';

const userDataPath = app.getPath('userData');
const stateFile = path.join(userDataPath, 'widget-state.json');
const debugLogFile = path.join(userDataPath, 'debug.log');
const MAX_DEBUG_LOG_BYTES = 300 * 1024;

// 로그는 동기로 쓴다. 예전엔 비동기(appendFile)였는데 어느 순간부터 조용히 실패해
// 몇 시간치 기록이 통째로 비었다 — 진단이 안 남으면 원인을 못 찾는다.
// 한 분에 몇 줄뿐이라 동기로 써도 부담이 없다.
function debugLog(msg) {
  const line = `[${new Date().toISOString()}] ${msg}
`;
  try {
    fs.appendFileSync(debugLogFile, line);
    const st = fs.statSync(debugLogFile);
    if (st.size > MAX_DEBUG_LOG_BYTES) {
      const keep = fs.readFileSync(debugLogFile, 'utf-8').slice(-MAX_DEBUG_LOG_BYTES / 2);
      fs.writeFileSync(debugLogFile, keep);
    }
  } catch (e) { /* 로그 때문에 앱이 멈추지는 않게 */ }
}

// 전체 앱을 브라우저로 열 때 — 기본 브라우저(이 PC 는 웨일)가 아니라 크롬을 쓴다.
// 크롬이 없으면 엣지, 그것도 없으면 기본 브라우저.
function browserPath() {
  const PF = process.env.ProgramFiles || 'C:\\Program Files';
  const PF86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
  const LOCAL = process.env.LOCALAPPDATA || '';
  const list = [
    path.join(PF, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(PF86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(LOCAL, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(PF, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(PF86, 'Microsoft', 'Edge', 'Application', 'msedge.exe')
  ];
  for (const p of list) { try { if (fs.existsSync(p)) return p; } catch (e) { /* 무시 */ } }
  return null;
}
function openInBrowser(url) {
  const exe = browserPath();
  if (!exe) { debugLog('크롬·엣지를 못 찾아 기본 브라우저로 엽니다'); shell.openExternal(url); return; }
  debugLog(`브라우저로 열기: ${path.basename(exe)}`);
  try {
    spawn(exe, [url], { detached: true, stdio: 'ignore', windowsHide: false }).unref();
  } catch (e) {
    debugLog(`브라우저 실행 실패(${e.message}) — 기본 브라우저로 대체`);
    shell.openExternal(url);
  }
}

let widgetWin = null;      // 화면에 보이는 카드
let workerWin = null;      // 값을 가져오는 숨은 창
let timetableWin = null;   // 주간 시간표 «크게 보기» 창
let settingsWin = null;    // 설정 창
let handoffServer = null;   // 크롬에서 로그인 결과를 받는 잠깐짜리 서버
let handoffNonce = null;    // 그때그때 만드는 일회용 확인값
let tray = null;
let pollTimer = null;
let lastData = null;
let rebuildTrayMenu = null;
let userQuit = false;        // 트레이 «종료»로 직접 끈 것인지
let installingUpdate = false; // 업데이트 설치 중(중복 방지)

/* ===================== 설정 저장 ===================== */
function loadState() {
  try { return JSON.parse(fs.readFileSync(stateFile, 'utf-8')); } catch (e) { return {}; }
}
function saveState(patch) {
  const next = Object.assign(loadState(), patch);
  try { fs.writeFileSync(stateFile, JSON.stringify(next)); } catch (e) { debugLog(`설정 저장 실패: ${e.message}`); }
  return next;
}
const SIZES = { small: 0.85, medium: 1, large: 1.2 };
function getScale() { const s = loadState().size; return SIZES[s] ? s : 'medium'; }
function getOpacity() { const o = loadState().opacity; return typeof o === 'number' ? o : 1; }
function getAlwaysOnTop() { const v = loadState().alwaysOnTop; return v === undefined ? true : !!v; }
function getTheme() { return loadState().theme || ''; }
function getView() { const v = loadState().view; return ['today', 'week', 'progress', 'work', 'comci', 'cal', 'meal'].includes(v) ? v : 'today'; }

/* ===================== 자동 업데이트 ===================== */
// 새 버전이 나오면 알아서 내려받고, 다 받으면 알림을 띄운다. 누르면 재시작하며 설치.
// 안 누르면 다음에 앱이 종료될 때 조용히 설치된다.
let updateState = 'idle';   // idle | available | ready
let updateVersion = null;
let manualUpdateCheck = false;

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.logger = {
  info: (m) => debugLog(`[updater] ${m}`),
  warn: (m) => debugLog(`[updater][warn] ${m}`),
  error: (m) => debugLog(`[updater][error] ${m}`),
  debug: () => {}
};

function notify(title, body, onClick) {
  if (!Notification.isSupported()) return;
  const n = new Notification({ title, body });
  if (onClick) n.on('click', onClick);
  n.show();
}
function setUpdateState(state, version) {
  updateState = state;
  if (version) updateVersion = version;
  if (rebuildTrayMenu) rebuildTrayMenu();
  sendToWidget();   // 띠를 바로 띄운다
}

autoUpdater.on('update-available', (info) => {
  debugLog(`새 버전 발견: v${info.version} — 백그라운드 다운로드 시작`);
  setUpdateState('available', info.version);
});
autoUpdater.on('update-not-available', () => {
  debugLog(`업데이트 없음 (현재 v${app.getVersion()}이 최신)`);
  if (manualUpdateCheck) { manualUpdateCheck = false; notify('수업진도 위젯', `이미 최신 버전이에요 (v${app.getVersion()}).`); }
});
let lastLoggedPercent = -1;
autoUpdater.on('download-progress', (p) => {
  const step = Math.floor(p.percent / 10) * 10;
  if (step !== lastLoggedPercent) { lastLoggedPercent = step; debugLog(`업데이트 다운로드 ${step}%`); }
});
autoUpdater.on('update-downloaded', (info) => {
  lastLoggedPercent = -1;
  manualUpdateCheck = false;
  setUpdateState('ready', info.version);
  notify('수업진도 위젯 업데이트 준비됨',
    `새 버전 v${info.version}을(를) 다 받았어요. 클릭하면 재시작하며 설치합니다.`,
    () => installUpdateNow());
});
autoUpdater.on('error', (err) => {
  lastLoggedPercent = -1;
  debugLog(`업데이트 오류: ${err && err.message ? err.message : err}`);
  if (manualUpdateCheck) {
    manualUpdateCheck = false;
    notify('수업진도 위젯', '업데이트 확인에 실패했어요. 클릭하면 릴리스 페이지를 엽니다.',
      () => shell.openExternal(RELEASES_PAGE_URL));
  }
});

function installUpdateNow() {
  if (updateState !== 'ready' || installingUpdate) return;
  installingUpdate = true;
  debugLog('업데이트 설치 — quitAndInstall');
  if (pollTimer) clearInterval(pollTimer);
  autoUpdater.quitAndInstall(true, true);
}
function checkForUpdates(manual) {
  if (!app.isPackaged) {
    debugLog('개발 모드라 업데이트 확인을 건너뜀');
    if (manual) notify('수업진도 위젯', '개발 모드에서는 업데이트를 확인하지 않아요.');
    return;
  }
  if (updateState === 'ready') {
    if (manual) notify('수업진도 위젯 업데이트 준비됨',
      `v${updateVersion} 설치 준비가 끝났어요. 클릭하면 재시작하며 설치합니다.`, () => installUpdateNow());
    return;
  }
  if (manual) manualUpdateCheck = true;
  autoUpdater.checkForUpdates().catch((e) => debugLog(`업데이트 확인 실패: ${e && e.message ? e.message : e}`));
}

/* ===================== 값 가져오기 ===================== */
// 숨은 창 하나를 계속 띄워 둔다. 앱이 Firestore 를 구독하고 있어서 자료가 바뀌면
// 이 창 안에서 저절로 갱신되고, 우리는 필요할 때 계산 결과만 꺼내 온다.
function getWorkerWindow() {
  if (workerWin && !workerWin.isDestroyed()) return workerWin;
  workerWin = new BrowserWindow({
    show: false,
    width: 1200,
    height: 900,
    webPreferences: { partition: PARTITION, contextIsolation: true, nodeIntegration: false }
  });
  workerWin.on('closed', () => { workerWin = null; });
  workerWin.loadURL(APP_URL).catch((e) => debugLog(`숨은 창 로드 실패: ${e.message}`));
  return workerWin;
}

async function pollOnce() {
  const win = getWorkerWindow();
  try {
    const data = await win.webContents.executeJavaScript(
      'window.__widgetData ? window.__widgetData() : { ready:false, noFn:true }', true);
    if (!data) return;
    if (data.noFn) {
      // 앱은 떴는데 위젯용 함수가 없다 — 옛 버전이 캐시로 떠 있는 경우
      debugLog('__widgetData 없음 — 앱을 다시 불러온다');
      win.webContents.reloadIgnoringCache();
      return;
    }
    if (data.needLogin) {
      debugLog('로그인 필요');
      lastData = { needLogin: true };
      sendToWidget();
      return;
    }
    if (!data.ready) return;                 // 아직 자료를 불러오는 중
    lastData = data;
    debugLog(`값 갱신 ok — 오늘 수업 ${(data.lessons || []).length}개`);
    sendToWidget();
  } catch (e) {
    debugLog(`값 가져오기 실패: ${e && e.message ? e.message : e}`);
  }
}

function sendToWidget() {
  const payload = {
    data: lastData,
    view: getView(),
    scale: SIZES[getScale()],
    version: app.getVersion(),
    theme: getTheme(),
    update: { state: updateState, version: updateVersion }
  };
  if (widgetWin && !widgetWin.isDestroyed()) widgetWin.webContents.send('jindo-data', payload);
  if (timetableWin && !timetableWin.isDestroyed()) timetableWin.webContents.send('jindo-data', payload);
  updateTrayTooltip();
}

function updateTrayTooltip() {
  if (!tray) return;
  if (!lastData || lastData.needLogin) { tray.setToolTip('수업진도 위젯 — 로그인이 필요합니다'); return; }
  const ls = lastData.lessons || [];
  if (!ls.length) { tray.setToolTip(`수업진도 — 오늘(${lastData.dow}) 수업 없음`); return; }
  const lines = ls.map((l) => `${l.period}교시 ${l.cls} ${l.unit}${l.n ? ' ' + l.n + '차시' : ''}`);
  tray.setToolTip(`오늘 수업 ${ls.length}개\n` + lines.join('\n'));
}

/* ===================== 로그인 (크롬으로) =====================
   위젯 안 창에서 구글 로그인을 하면 구글이 "브라우저 또는 앱이 안전하지 않을 수 있습니다"
   라며 막는다. 그래서 로그인만 진짜 크롬에서 하고, 거기서 받은 구글 ID 토큰을 넘겨받아
   위젯 쪽에서 로그인을 완성한다.

     1) 위젯이 127.0.0.1 에 잠깐 서버를 연다 (포트는 그때그때, 확인값 nonce 를 하나 만든다)
     2) 크롬으로 앱을 연다 — .../?widget=<포트>&nonce=<확인값>
     3) 사용자가 크롬에서 평소처럼 구글 로그인
     4) 앱이 그 포트로 ID 토큰을 보낸다 (확인값이 맞아야 받아준다)
     5) 위젯이 숨은 창의 __widgetSignIn(토큰) 을 불러 로그인을 마친다

   토큰은 바깥으로 안 나가고 내 컴퓨터 안(127.0.0.1)에서만 오간다. */
function stopHandoffServer() {
  if (!handoffServer) return;
  try { handoffServer.close(); } catch (e) { /* 무시 */ }
  handoffServer = null;
}

// 로그인이 끝나면 크롬 화면에 보여줄 쪽지 (폼 전송으로 왔을 때만 쓴다)
const DONE_HTML = '<!doctype html><meta charset="utf-8"><title>위젯 연결됨</title>'
  + '<style>body{margin:0;height:100vh;display:flex;align-items:center;justify-content:center;'
  + 'background:#27187E;color:#fff;font-family:"Segoe UI","Malgun Gothic",sans-serif;text-align:center}'
  + 'h1{font-size:24px;margin:0 0 10px}p{opacity:.85;font-size:14px;margin:0;line-height:1.6}</style>'
  + '<div><h1>위젯에 연결됐습니다 ✅</h1>'
  + '<p>이 탭은 닫으셔도 됩니다.<br>바탕화면 위젯에 오늘 수업이 표시됩니다.</p></div>';

function startLogin() {
  // 이미 기다리고 있으면 서버를 새로 만들지 않는다 — 버튼을 여러 번 눌러도
  // 앞서 연 크롬 탭이 무효가 되지 않게. (탭만 다시 띄운다)
  if (handoffServer && handoffServer.listening) {
    const p = handoffServer.address().port;
    debugLog(`이미 로그인을 기다리는 중 (127.0.0.1:${p}) — 크롬 탭만 다시 엽니다`);
    openInBrowser(`${APP_URL}?widget=${p}&nonce=${handoffNonce}`);
    return;
  }
  stopHandoffServer();
  handoffNonce = crypto.randomBytes(16).toString('hex');
  const nonce = handoffNonce;

  // 크롬은 인터넷 페이지가 내 컴퓨터 안(127.0.0.1)으로 보내는 요청을 막을 수 있어서
  // (사설망 접근 제한) 허용 헤더를 함께 내려준다. 그래도 막히면 앱이 폼 전송으로 바꾼다.
  const cors = {
    'Access-Control-Allow-Origin': APP_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Private-Network': 'true'
  };

  handoffServer = http.createServer((req, res) => {
    const url = String(req.url || '');
    if (req.method === 'OPTIONS') { res.writeHead(204, cors); res.end(); return; }

    // 크롬에서 통로가 열려 있는지 확인하는 신호
    if (req.method === 'GET' && url.startsWith('/ping')) {
      debugLog('크롬에서 연결 확인(ping) 도착 — 통로 정상');
      res.writeHead(200, Object.assign({ 'Content-Type': 'text/plain' }, cors));
      res.end('pong');
      return;
    }

    if (req.method !== 'POST' || !url.startsWith('/handoff')) {
      debugLog(`알 수 없는 요청 무시: ${req.method} ${url.slice(0, 40)}`);
      res.writeHead(404, cors); res.end('no');
      return;
    }

    let body = '';
    req.on('data', (c) => {
      body += c;
      if (body.length > 32 * 1024) req.destroy();   // 토큰은 훨씬 짧다 — 그 이상이면 끊는다
    });
    req.on('end', () => {
      // fetch 로 오면 JSON, 폼 전송으로 오면 form 형식이다
      const isForm = String(req.headers['content-type'] || '')
        .indexOf('application/x-www-form-urlencoded') >= 0;
      let gotNonce = null, idToken = null;
      if (isForm) {
        const p = new URLSearchParams(body);
        gotNonce = p.get('nonce'); idToken = p.get('idToken');
      } else {
        try { const j = JSON.parse(body); gotNonce = j.nonce; idToken = j.idToken; } catch (e) { /* 아래에서 걸러짐 */ }
      }

      if (gotNonce !== nonce || !idToken) {
        debugLog(`로그인 넘겨받기 거부 — 확인값이 맞지 않습니다 (${isForm ? '폼' : 'fetch'})`);
        res.writeHead(400, cors); res.end('bad');
        return;
      }

      if (isForm) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(DONE_HTML);
      } else {
        res.writeHead(200, Object.assign({ 'Content-Type': 'text/plain' }, cors));
        res.end('ok');
      }
      debugLog(`크롬에서 로그인 정보를 넘겨받았습니다 (${isForm ? '폼 전송' : 'fetch'})`);
      stopHandoffServer();
      finishLogin(idToken);
    });
  });

  handoffServer.on('error', (e) => {
    debugLog(`로그인 서버를 못 열었습니다: ${e.message}`);
    notify('수업진도 위젯', '로그인 창을 여는 데 실패했어요. 잠시 뒤 다시 시도해 주세요.');
    stopHandoffServer();
  });

  handoffServer.listen(0, '127.0.0.1', () => {
    const port = handoffServer.address().port;
    debugLog(`로그인 대기 시작 (127.0.0.1:${port}) — 크롬을 엽니다`);
    openInBrowser(`${APP_URL}?widget=${port}&nonce=${nonce}`);
    notify('수업진도 위젯', '크롬 탭을 열었어요. 거기서 구글 로그인해 주세요.');
  });

  // 5분 안에 안 끝나면 서버를 닫는다 (열어둔 채로 두지 않는다)
  setTimeout(() => {
    if (!handoffServer) return;
    debugLog('로그인 대기 시간 초과 — 서버를 닫습니다');
    stopHandoffServer();
  }, 5 * 60 * 1000);
}

async function finishLogin(idToken, retried) {
  const win = getWorkerWindow();
  try {
    const ok = await win.webContents.executeJavaScript(
      `window.__widgetSignIn ? window.__widgetSignIn(${JSON.stringify(idToken)}) : null`, true);
    if (ok === null) {
      // 앱이 아직 옛 버전(캐시)이면 이 함수가 없다 — 한 번만 새로 불러오고 다시 시도
      if (retried) { debugLog('앱에 __widgetSignIn 이 없습니다'); return; }
      debugLog('__widgetSignIn 없음 — 앱을 새로 불러오고 다시 시도');
      win.webContents.reloadIgnoringCache();
      win.webContents.once('did-finish-load', () => setTimeout(() => finishLogin(idToken, true), 2500));
      return;
    }
    debugLog('로그인 완료');
    notify('수업진도 위젯', '로그인됐어요. 이제 위젯에 오늘 수업이 표시됩니다.');
    setTimeout(pollOnce, 2500);
  } catch (e) {
    debugLog(`로그인 마무리 실패: ${e && e.message ? e.message : e}`);
    notify('수업진도 위젯', '로그인을 마무리하지 못했어요. 트레이 메뉴에서 다시 시도해 주세요.');
  }
}

/* ===================== 위젯 창 ===================== */
// 이번주 격자는 요일 다섯 칸이 들어가야 해서 카드가 넓어야 한다. 다른 화면은 좁게.
function baseWidthFor(view) { return ['week', 'work', 'comci', 'cal'].includes(view) ? 560 : 360; }
function widgetSize(view) {
  const k = SIZES[getScale()];
  return { width: Math.round(baseWidthFor(view || getView()) * k), height: Math.round(300 * k) };
}
function applyWidgetWidth(view) {
  if (!widgetWin || widgetWin.isDestroyed()) return;
  const want = Math.round(baseWidthFor(view) * SIZES[getScale()]);
  const b = widgetWin.getBounds();
  if (b.width === want) return;
  // 오른쪽 끝이 화면 밖으로 밀려나지 않게 필요하면 왼쪽으로 당긴다
  const a = screen.getPrimaryDisplay().workArea;
  let x = b.x;
  if (x + want > a.x + a.width) x = Math.max(a.x, a.x + a.width - want - 8);
  widgetWin.setBounds({ x, y: b.y, width: want, height: b.height });
  saveState({ x });
}
// 모니터를 뽑았거나 해상도가 바뀌어 저장된 위치가 화면 밖이면 주 모니터로 데려온다
function safePosition(state, size) {
  const displays = screen.getAllDisplays();
  const x = state.x, y = state.y;
  if (typeof x === 'number' && typeof y === 'number') {
    const inside = displays.some((d) => {
      const a = d.workArea;
      return x + size.width > a.x && x < a.x + a.width && y + size.height > a.y && y < a.y + a.height;
    });
    if (inside) return { x, y };
  }
  const a = screen.getPrimaryDisplay().workArea;
  return { x: a.x + a.width - size.width - 30, y: a.y + 60 };
}

function createWidgetWindow() {
  const size = widgetSize();
  const pos = safePosition(loadState(), size);
  widgetWin = new BrowserWindow({
    width: size.width, height: size.height, x: pos.x, y: pos.y,
    frame: false,
    backgroundColor: '#15181d',
    resizable: false,
    alwaysOnTop: getAlwaysOnTop(),
    skipTaskbar: true,
    opacity: getOpacity(),
    title: '',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  widgetWin.setTitle('');
  if (getAlwaysOnTop()) widgetWin.setAlwaysOnTop(true, 'screen-saver');
  widgetWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  widgetWin.loadFile('widget.html');

  let saveTimer = null;
  widgetWin.on('move', () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      if (!widgetWin || widgetWin.isDestroyed()) return;
      const [x, y] = widgetWin.getPosition();
      saveState({ x, y });
    }, 400);
  });
  widgetWin.on('closed', () => { widgetWin = null; });
  widgetWin.webContents.once('did-finish-load', () => { sendToWidget(); sendTasks(); });
}

function applyScale(key) {
  saveState({ size: key });
  if (widgetWin && !widgetWin.isDestroyed()) {
    const s = widgetSize(getView());
    const [x, y] = widgetWin.getPosition();
    widgetWin.setBounds({ x, y, width: s.width, height: s.height });
  }
  sendToWidget();
}
function resetWidgetPosition() {
  if (!widgetWin || widgetWin.isDestroyed()) { createWidgetWindow(); return; }
  const a = screen.getPrimaryDisplay().workArea;
  const b = widgetWin.getBounds();
  const x = Math.round(a.x + (a.width - b.width) / 2);
  const y = Math.round(a.y + (a.height - b.height) / 2);
  widgetWin.setBounds({ x, y, width: b.width, height: b.height });
  saveState({ x, y });
  widgetWin.show(); widgetWin.focus();
  debugLog(`위젯 위치 초기화: 주 모니터 가운데(${x}, ${y})`);
}
function applyOpacity(v) {
  saveState({ opacity: v });
  if (widgetWin && !widgetWin.isDestroyed()) widgetWin.setOpacity(v);
}
function applyAlwaysOnTop(on) {
  saveState({ alwaysOnTop: on });
  if (widgetWin && !widgetWin.isDestroyed()) widgetWin.setAlwaysOnTop(on, on ? 'screen-saver' : 'normal');
}

/* ===================== 주간 시간표 «크게 보기» ===================== */
// 위젯 카드는 좁아서 앱의 표를 그대로 담을 수 없다. 그래서 폭 제약이 없는 창을 따로 띄운다.
function openTimetableWindow() {
  if (timetableWin && !timetableWin.isDestroyed()) {
    timetableWin.show(); timetableWin.focus();
    return;
  }
  const a = screen.getPrimaryDisplay().workArea;
  timetableWin = new BrowserWindow({
    width: Math.min(1240, a.width - 60),
    height: Math.min(880, a.height - 60),
    title: '주간 시간표',
    backgroundColor: '#F7F7FF',
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  timetableWin.loadFile('timetable.html');
  timetableWin.on('closed', () => { timetableWin = null; });
  timetableWin.webContents.once('did-finish-load', () => sendToWidget());
  debugLog('주간 시간표 창을 열었습니다');
}

/* ===================== 컴시간알리미 ===================== */
// 학교 시간표를 한 번 받아 파일에 저장해 둔다 — 그 뒤로는 인터넷이 없어도 계속 보인다.
const comcigan = require('./comcigan.js');
const comciFile = path.join(userDataPath, 'comcigan.json');

function loadComci() {
  try { return JSON.parse(fs.readFileSync(comciFile, 'utf-8')); } catch (e) { return null; }
}
function saveComci(v) {
  try { fs.writeFileSync(comciFile, JSON.stringify(v)); } catch (e) { debugLog(`컴시간 저장 실패: ${e.message}`); }
}
function getComciConfig() {
  const s = loadState().comci || {};
  return {
    school: s.school || null,
    wantTeacher: s.wantTeacher === undefined ? true : !!s.wantTeacher,
    wantClasses: !!s.wantClasses,
    teacher: s.teacher || '',
    teacherIdx: Number(s.teacherIdx) || 0
  };
}

// 컴시간 자료나 설정이 바뀌면 위젯이 들고 있던 것을 버리고 다시 읽게 한다.
// (안 그러면 설정에서 교사를 바꿔도 위젯은 예전 자료를 계속 보여준다)
function comciChanged() {
  if (widgetWin && !widgetWin.isDestroyed()) widgetWin.webContents.send('comci-changed');
}
ipcMain.handle('comci-search', async (_e, name) => {
  try {
    debugLog(`컴시간 학교 검색: ${name}`);
    return { list: await comcigan.searchSchool(String(name || '')) };
  } catch (e) {
    debugLog(`컴시간 검색 실패: ${e && e.message ? e.message : e}`);
    return { error: (e && e.message) || '검색에 실패했습니다' };
  }
});

ipcMain.handle('comci-fetch', async () => {
  const cfg = getComciConfig();
  if (!cfg.school) return { error: '학교를 먼저 골라주세요' };
  try {
    debugLog(`컴시간 시간표 받기: ${cfg.school.name}`);
    // 한 번 부르면 교사·학급이 같이 온다 — 둘 다 저장해 두고, 무엇을 볼지는 위젯에서 고른다
    const data = await comcigan.fetchTimetable(cfg.school.code);
    data.schoolName = cfg.school.name;     // 컴시간이 학교명을 가려서 주므로 고른 이름을 쓴다
    saveComci(data);
    debugLog(`컴시간 받기 완료 — 교사 ${(data.teachers || []).length}명`);
    comciChanged();
    sendToWidget();
    return { data };
  } catch (e) {
    debugLog(`컴시간 받기 실패: ${e && e.message ? e.message : e}`);
    return { error: (e && e.message) || '불러오지 못했습니다' };
  }
});

ipcMain.handle('comci-get', () => ({ config: getComciConfig(), data: loadComci() }));
ipcMain.on('comci-config', (_e, cfg) => {
  if (!cfg || typeof cfg !== 'object') return;
  saveState({ comci: {
    school: cfg.school || null,
    wantTeacher: !!cfg.wantTeacher,
    wantClasses: !!cfg.wantClasses,
    teacher: String(cfg.teacher || ''),
    teacherIdx: Number(cfg.teacherIdx) || 0
  } });
  comciChanged();
  sendToWidget();
});

/* ===================== 학사일정 (구글 시트) ===================== */
// 학교 «연간 수업일수 계획표» 원본을 그대로 훑어본다. 권한 없이 받아진다.
const academic = require('./academic.js');
const academicFile = path.join(userDataPath, 'academic.json');

function loadAcademic() {
  try { return JSON.parse(fs.readFileSync(academicFile, 'utf-8')); } catch (e) { return null; }
}
let academicFetching = false;
async function refreshAcademic() {
  if (academicFetching) return loadAcademic();
  academicFetching = true;
  try {
    const sheetId = loadState().academicSheet || academic.DEFAULT_SHEET;
    debugLog('학사일정 받기 시작');
    const a = await academic.fetchYear(sheetId);
    try { fs.writeFileSync(academicFile, JSON.stringify(a)); } catch (e) { /* 무시 */ }
    debugLog(`학사일정 받기 완료 — ${a.months.length}개월`);
    if (widgetWin && !widgetWin.isDestroyed()) widgetWin.webContents.send('academic-changed');
    return a;
  } catch (e) {
    debugLog(`학사일정 받기 실패: ${e && e.message ? e.message : e}`);
    return loadAcademic();
  } finally { academicFetching = false; }
}
ipcMain.handle('get-academic', () => loadAcademic());
ipcMain.handle('academic-fetch', async () => {
  setTask('cal', '학사일정', 'busy');
  try { return await refreshAcademic(); } finally { setTask('cal', null, null); }
});

/* ===================== 급식 (나이스) ===================== */
const neis = require('./neis.js');
const mealFile = path.join(userDataPath, 'meals.json');

function loadMeals() {
  try { return JSON.parse(fs.readFileSync(mealFile, 'utf-8')); } catch (e) { return null; }
}
/* 나이스 학교는 컴시간에서 고른 학교 이름으로 자동으로 찾아둔다 */
async function neisSchool() {
  const st = loadState();
  if (st.neis && st.neis.code) return st.neis;
  const name = (st.comci && st.comci.school && st.comci.school.name) || '';
  if (!name) throw new Error('설정에서 학교를 먼저 골라주세요');
  const list = await neis.searchSchool(name);
  if (!list.length) throw new Error(`나이스에서 «${name}» 을 찾지 못했습니다`);
  const picked = list[0];
  saveState({ neis: picked });
  debugLog(`나이스 학교 찾음: ${picked.name} (${picked.atptName}/${picked.code})`);
  return picked;
}
let mealFetching = false;
async function refreshMeals(baseDate) {
  if (mealFetching) return loadMeals();
  mealFetching = true;
  try {
    const school = await neisSchool();
    const w = await neis.fetchWeekMeals(school, baseDate);
    w.school = school.name;
    try { fs.writeFileSync(mealFile, JSON.stringify(w)); } catch (e) { /* 무시 */ }
    debugLog(`급식 받기 완료 — ${w.meals.length}건 (${w.from}~${w.to})`);
    if (widgetWin && !widgetWin.isDestroyed()) widgetWin.webContents.send('meals-changed');
    return w;
  } catch (e) {
    debugLog(`급식 받기 실패: ${e && e.message ? e.message : e}`);
    const old = loadMeals() || {};
    return Object.assign({}, old, { error: (e && e.message) || '받지 못했습니다' });
  } finally { mealFetching = false; }
}
ipcMain.handle('neis-search', async (_e, name) => {
  try {
    debugLog(`나이스 학교 검색: ${name}`);
    return { list: await neis.searchSchool(String(name || '')) };
  } catch (e) {
    debugLog(`나이스 검색 실패: ${e && e.message ? e.message : e}`);
    return { error: (e && e.message) || '검색에 실패했습니다' };
  }
});
ipcMain.handle('get-meals', () => loadMeals());
ipcMain.handle('meals-fetch', async () => {
  setTask('meal', '급식', 'busy');
  try { return await refreshMeals(); } finally { setTask('meal', null, null); }
});

/* ===================== 설정 창 ===================== */
// 트레이 메뉴로는 담을 수 없는 것들(학교 검색·교사 고르기)을 위해 창을 따로 둔다.
function openSettingsWindow() {
  if (settingsWin && !settingsWin.isDestroyed()) { settingsWin.show(); settingsWin.focus(); return; }
  settingsWin = new BrowserWindow({
    width: 620, height: 760, title: '수업진도 위젯 설정',
    backgroundColor: '#F7F7FF', autoHideMenuBar: true, resizable: true,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false
    }
  });
  settingsWin.loadFile('settings.html');
  settingsWin.on('closed', () => { settingsWin = null; if (rebuildTrayMenu) rebuildTrayMenu(); });
  debugLog('설정 창을 열었습니다');
}

ipcMain.handle('get-settings', () => ({
  comci: getComciConfig(),
  timetable: loadComci(),
  ui: {
    size: getScale(), opacity: getOpacity(), alwaysOnTop: getAlwaysOnTop(),
    autoLaunch: app.getLoginItemSettings().openAtLogin,
    version: app.getVersion(),
    theme: getTheme(),
    academicSheet: loadState().academicSheet || academic.DEFAULT_SHEET,
    neis: loadState().neis || null,
    meals: loadMeals(),
    loggedIn: !!(lastData && !lastData.needLogin)
  }
}));

ipcMain.on('set-ui', (_e, v) => {
  if (!v || typeof v !== 'object') return;
  if (v.size) { applyScale(v.size); }
  if (v.opacity !== undefined) applyOpacity(Number(v.opacity));
  if (v.alwaysOnTop !== undefined) applyAlwaysOnTop(!!v.alwaysOnTop);
  if (v.autoLaunch !== undefined) app.setLoginItemSettings({ openAtLogin: !!v.autoLaunch });
  if (v.neis && v.neis.code) {
    saveState({ neis: v.neis });
    debugLog(`급식 학교 지정: ${v.neis.name} (${v.neis.atpt}/${v.neis.code})`);
  }
  if (v.theme !== undefined) { saveState({ theme: String(v.theme || '') }); sendToWidget(); }
  if (v.academicSheet !== undefined) {
    saveState({ academicSheet: String(v.academicSheet || '') });
    debugLog(`학사일정 시트 주소 변경: ${v.academicSheet}`);
  }
  if (v.resetPos) resetWidgetPosition();
  if (rebuildTrayMenu) rebuildTrayMenu();
});
ipcMain.on('check-update', () => checkForUpdates(true));
ipcMain.on('open-log', () => shell.openPath(debugLogFile));
ipcMain.on('open-settings', () => openSettingsWindow());
ipcMain.on('install-update', () => installUpdateNow());

/* ===================== 트레이 ===================== */
function createTray() {
  tray = new Tray(path.join(__dirname, 'assets', 'tray.png'));
  const buildMenu = () => {
    let updateItems = [];
    if (updateState === 'ready') {
      updateItems = [{ label: `🆕 v${updateVersion} 설치하고 재시작`, click: () => installUpdateNow() }, { type: 'separator' }];
    } else if (updateState === 'available') {
      updateItems = [{ label: `⬇ 새 버전 v${updateVersion} 내려받는 중…`, enabled: false }, { type: 'separator' }];
    }
    const opacityMenu = [1, 0.9, 0.8, 0.7].map((v) => ({
      label: `${Math.round(v * 100)}%`, type: 'radio', checked: getOpacity() === v,
      click: () => applyOpacity(v)
    }));
    const sizeMenu = [
      { key: 'small', label: '소' }, { key: 'medium', label: '중' }, { key: 'large', label: '대' }
    ].map((s) => ({
      label: s.label, type: 'radio', checked: getScale() === s.key,
      click: () => { applyScale(s.key); tray.setContextMenu(buildMenu()); }
    }));

    return Menu.buildFromTemplate([
      ...updateItems,
      { label: '⚙️ 설정', click: () => openSettingsWindow() },
      { type: 'separator' },
      {
        label: '위젯 보이기', type: 'checkbox',
        checked: !!(widgetWin && !widgetWin.isDestroyed() && widgetWin.isVisible()),
        click: (mi) => {
          if (!widgetWin || widgetWin.isDestroyed()) { createWidgetWindow(); return; }
          mi.checked ? widgetWin.show() : widgetWin.hide();
        }
      },
      { label: '항상 위로 고정', type: 'checkbox', checked: getAlwaysOnTop(), click: (mi) => applyAlwaysOnTop(mi.checked) },
      { label: '위젯 투명도', submenu: opacityMenu },
      { label: '위젯 크기', submenu: sizeMenu },
      { type: 'separator' },
      { label: '🗓️ 주간 시간표 크게 보기', click: () => openTimetableWindow() },
      { label: '지금 새로고침', click: () => pollOnce() },
      {
        // 다른 모니터를 뽑았거나 위젯을 어디 뒀는지 못 찾을 때 쓰는 탈출구
        label: '위젯 위치 초기화 (화면 가운데로)',
        click: () => resetWidgetPosition()
      },
      { label: '수업진도 앱 열기 (크롬)', click: () => openInBrowser(APP_URL) },
      { label: '크롬으로 로그인', click: () => startLogin() },
      {
        label: 'Windows 시작 시 자동 실행', type: 'checkbox',
        checked: app.getLoginItemSettings().openAtLogin,
        click: (mi) => app.setLoginItemSettings({ openAtLogin: mi.checked })
      },
      { label: '디버그 로그 열기', click: () => shell.openPath(debugLogFile) },
      { type: 'separator' },
      { label: `버전 v${app.getVersion()}`, enabled: false },
      { label: '업데이트 확인', click: () => checkForUpdates(true) },
      { type: 'separator' },
      { label: '종료', click: () => { userQuit = true; app.quit(); } }
    ]);
  };
  tray.setContextMenu(buildMenu());
  rebuildTrayMenu = () => tray.setContextMenu(buildMenu());
  tray.on('click', () => {
    checkForUpdates();   // 켜볼 때 한 번 — 새 버전이 있으면 바로 띠가 뜬다
    if (!widgetWin || widgetWin.isDestroyed()) { createWidgetWindow(); return; }
    widgetWin.isVisible() ? widgetWin.hide() : widgetWin.show();
  });
  updateTrayTooltip();
}

/* ===================== IPC ===================== */
ipcMain.on('refresh-now', () => pollOnce());
ipcMain.on('open-login', () => startLogin());
ipcMain.on('open-timetable', () => openTimetableWindow());
// 이전주·다음주 — 숨은 창의 앱에게 그 주 자료를 물어본다
/* ===================== 진행 상태 알리기 =====================
   무엇을 언제 받는지 화면에 보이게 한다. 그동안 조용히 실패하면
   사용자는 «안 된다»고만 알 수 있었다. */
const tasks = {};   // key -> { label, state:'wait'|'busy', at }

function sendTasks() {
  if (!widgetWin || widgetWin.isDestroyed()) return;
  const list = Object.keys(tasks).map((k) => Object.assign({ key: k }, tasks[k]));
  widgetWin.webContents.send('task-status', list);
}
function setTask(key, label, state, at) {
  if (!state) delete tasks[key];
  else tasks[key] = { label: label, state: state, at: at || 0 };
  sendTasks();
}

/* 잠시 뒤에 할 일을 예약하고, 그 사이 남은 시간을 화면에 보여준다 */
function scheduleTask(key, label, delayMs, run) {
  setTask(key, label, 'wait', Date.now() + delayMs);
  setTimeout(async () => {
    setTask(key, label, 'busy');
    try { await run(); } catch (e) { /* 각자 안에서 로그를 남긴다 */ }
    setTask(key, null, null);
  }, delayMs);
}

/* ===================== 주간업무계획 ===================== */
// ★드라이브 권한이 필요 없다. 구글 문서를 «링크 공유» 주소로 그냥 받아온다.
//   (drive.readonly 는 구글이 «제한된 권한»이라 검증 안 받은 앱엔 안 내준다 — 계속 403 이 났다)
const worknotice = require('./worknotice.js');
const workFile = path.join(userDataPath, 'work.json');
const WORK_REFRESH_MS = 6 * 60 * 60 * 1000;   // 6시간마다 조용히 다시 받는다

function loadWork() {
  try { return JSON.parse(fs.readFileSync(workFile, 'utf-8')); } catch (e) { return null; }
}
function saveWork(v) {
  try { fs.writeFileSync(workFile, JSON.stringify(v)); } catch (e) { debugLog(`주간업무 저장 실패: ${e.message}`); }
}
let workFetching = false;
async function refreshWork(why) {
  if (workFetching) return loadWork();
  workFetching = true;
  try {
    debugLog(`주간업무 받기 (${why})`);
    const w = await worknotice.fetchWork();
    saveWork(w);
    debugLog(`주간업무 받기 완료 — 입력본 ${(w.input || []).length}주 / 합본 ${(w.merged || []).length}주` + (w.error ? ` · ${w.error}` : ''));
    if (widgetWin && !widgetWin.isDestroyed()) widgetWin.webContents.send('work-changed');
    return w;
  } catch (e) {
    debugLog(`주간업무 받기 실패: ${e && e.message ? e.message : e}`);
    return loadWork();
  } finally { workFetching = false; }
}

ipcMain.handle('get-work', () => loadWork());
ipcMain.handle('work-fetch', async () => {
  setTask('work', '주간업무', 'busy');
  try { return await refreshWork('직접 요청'); } finally { setTask('work', null, null); }
});

ipcMain.handle('get-week', async (_e, off) => {
  const win = getWorkerWindow();
  try {
    return await win.webContents.executeJavaScript(
      `window.__widgetWeek ? window.__widgetWeek(${Number(off) || 0}) : null`, true);
  } catch (e) {
    debugLog(`주간 자료 가져오기 실패(${off}): ${e && e.message ? e.message : e}`);
    return null;
  }
});
ipcMain.on('open-app', () => openInBrowser(APP_URL));
ipcMain.on('set-view', (_e, view) => {
  if (!['today', 'week', 'progress', 'work', 'comci', 'cal', 'meal'].includes(view)) return;
  saveState({ view });
  applyWidgetWidth(view);
});
// 내용 높이에 맞춰 카드 높이를 조절한다 (가로는 고정)
ipcMain.on('content-height', (_e, h) => {
  if (!widgetWin || widgetWin.isDestroyed()) return;
  const k = SIZES[getScale()];
  const want = Math.round(Math.min(Math.max(h, 120), 620) * k);
  const b = widgetWin.getBounds();
  if (Math.abs(b.height - want) < 3) return;
  widgetWin.setBounds({ x: b.x, y: b.y, width: b.width, height: want });
});

process.on('uncaughtException', (err) => debugLog(`uncaughtException: ${err && err.stack ? err.stack : err}`));

/* ===================== 시작 ===================== */
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!widgetWin) { createWidgetWindow(); return; }
    widgetWin.show(); widgetWin.focus();
  });

  app.whenReady().then(() => {
    debugLog(`=== 시작 === v${app.getVersion()} · 로그: ${debugLogFile}`);
    createWidgetWindow();
    createTray();
    getWorkerWindow();
    // 앱이 로그인·자료 불러오기를 끝낼 시간을 조금 준 뒤 첫 조회
    setTimeout(pollOnce, 6000);
    pollTimer = setInterval(pollOnce, POLL_INTERVAL_MS);

    checkForUpdates();
    setInterval(checkForUpdates, UPDATE_CHECK_INTERVAL_MS);

    // 주간업무 — 오래됐거나 «실패로 저장된» 것이면 다시 받는다.
    // ★실패 기록을 성공처럼 붙들고 있으면, 문제가 고쳐진 뒤에도 옛 오류를 계속 보여준다.
    const w0 = loadWork();
    const age = w0 && w0.fetchedAt ? (Date.now() - new Date(w0.fetchedAt).getTime()) : Infinity;
    const wBad = !w0 || w0.error || !((w0.input || []).length || (w0.merged || []).length);
    if (wBad || age > WORK_REFRESH_MS) {
      scheduleTask('work', '주간업무', 2000, () => refreshWork(wBad ? '이전 실패' : '시작'));
    }
    setInterval(() => refreshWork('주기'), WORK_REFRESH_MS);

    // 학사일정 — 받아둔 것이 없거나 실패로 남아 있으면 한 번 받아 둔다
    const a0 = loadAcademic();
    if (!a0 || a0.error || !((a0.months || []).length)) {
      scheduleTask('cal', '학사일정', 4000, () => refreshAcademic());
    }

    // 급식 — 이번 주 것이 없거나 오래됐으면 조용히 받는다
    const m0 = loadMeals();
    const mAge = m0 && m0.fetchedAt ? (Date.now() - new Date(m0.fetchedAt).getTime()) : Infinity;
    const mBad = !m0 || m0.error || !((m0.meals || []).length);
    if (mBad || mAge > 12 * 60 * 60 * 1000) {
      scheduleTask('meal', '급식', 3000, () => refreshMeals());
    }
    setInterval(() => refreshMeals(), 12 * 60 * 60 * 1000);
    // 절전에서 깨거나 잠금을 풀었을 때도 한 번 본다 (그 사이 새 버전이 나왔을 수 있다)
    try {
      powerMonitor.on('resume', () => { debugLog('절전 해제 — 업데이트 확인'); checkForUpdates(); });
      powerMonitor.on('unlock-screen', () => checkForUpdates());
    } catch (e) { debugLog(`전원 감시 등록 실패: ${e.message}`); }

    screen.on('display-removed', () => {
      if (!widgetWin || widgetWin.isDestroyed()) return;
      const b = widgetWin.getBounds();
      const p = safePosition({}, b);
      widgetWin.setBounds({ x: p.x, y: p.y, width: b.width, height: b.height });
    });
  });
}

app.on('window-all-closed', (e) => { e.preventDefault && e.preventDefault(); });
app.on('before-quit', (e) => {
  if (pollTimer) clearInterval(pollTimer);
  // 받아둔 업데이트가 있으면 여기서 설치한다. 이때 반드시 다시 띄워야 한다 —
  // electron-updater 의 autoInstallOnAppQuit 은 설치만 하고 앱을 안 살려서,
  // 위젯이 조용히 사라진 채로 남는다(그러면 업데이트 확인도 영영 못 한다).
  // 사용자가 트레이 «종료»로 직접 끈 경우에는 되살리지 않는다.
  if (updateState === 'ready' && !userQuit && !installingUpdate) {
    installingUpdate = true;
    e.preventDefault();
    debugLog('종료 전에 업데이트를 설치하고 다시 띄웁니다');
    autoUpdater.quitAndInstall(true, true);
  }
});
