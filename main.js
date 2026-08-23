// 파일명: main.js | @version 1.0.1
// 체육 수업진도 위젯 — 바탕화면에 항상 떠 있는 작은 카드
// 수정요약: v1.0.1 전체 앱은 크롬(없으면 엣지)으로 열기 · 로그인 창 UA 정리 · 로그인되면 창 자동 닫기
//
// 값을 어떻게 얻는가:
//   숨은 창으로 실제 웹앱(jindo-dashboard.web.app)을 띄워 놓고, 그 앱이 위젯용으로
//   내놓는 window.__widgetData() 를 불러 결과만 받아온다. 화면을 긁는 게 아니라
//   앱이 화면을 그릴 때 쓰는 것과 똑같은 계산 결과라서, 앱 화면이 바뀌어도 안 깨진다.
//   로그인(구글)도 그 창에서 한 번만 하면 세션이 저장된다.

const { app, BrowserWindow, Tray, Menu, ipcMain, shell, Notification, screen } = require('electron');
const { autoUpdater } = require('electron-updater');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const APP_URL = 'https://jindo-dashboard.web.app/';
const PARTITION = 'persist:jindo';
const POLL_INTERVAL_MS = 60 * 1000;          // 1분마다 값 갱신
const UPDATE_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
const RELEASES_PAGE_URL = 'https://github.com/Arete929/jindo-widget/releases/latest';

const userDataPath = app.getPath('userData');
const stateFile = path.join(userDataPath, 'widget-state.json');
const debugLogFile = path.join(userDataPath, 'debug.log');
const MAX_DEBUG_LOG_BYTES = 300 * 1024;

let debugLogTrimming = false;
function debugLog(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFile(debugLogFile, line, (err) => {
    if (err || debugLogTrimming) return;
    fs.stat(debugLogFile, (statErr, stat) => {
      if (statErr || !stat || stat.size <= MAX_DEBUG_LOG_BYTES) return;
      debugLogTrimming = true;
      fs.readFile(debugLogFile, 'utf-8', (readErr, content) => {
        if (!readErr) fs.writeFile(debugLogFile, content.slice(-MAX_DEBUG_LOG_BYTES / 2), () => { debugLogTrimming = false; });
        else debugLogTrimming = false;
      });
    });
  });
}

// 구글은 "앱 안에 끼워 넣은 브라우저"로 들어오는 로그인을 막는 일이 있다. 기본 UA 에는
// Electron/JindoWidget 표시가 붙는데, 그것만 떼면 평범한 크롬과 같은 문자열이 된다.
app.userAgentFallback = String(app.userAgentFallback || '')
  .replace(/ JindoWidget\/[^ ]+/g, '')
  .replace(/ Electron\/[^ ]+/g, '');

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
let loginWin = null;
let tray = null;
let pollTimer = null;
let lastData = null;
let rebuildTrayMenu = null;

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
function getView() { const v = loadState().view; return ['today', 'week', 'progress'].includes(v) ? v : 'today'; }

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
  if (updateState !== 'ready') return;
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
  if (!widgetWin || widgetWin.isDestroyed()) return;
  widgetWin.webContents.send('jindo-data', {
    data: lastData,
    view: getView(),
    scale: SIZES[getScale()],
    version: app.getVersion()
  });
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

/* ===================== 로그인 창 ===================== */
function openLoginWindow() {
  if (loginWin && !loginWin.isDestroyed()) { loginWin.show(); loginWin.focus(); return; }
  loginWin = new BrowserWindow({
    width: 1100, height: 820, title: '수업진도 로그인',
    webPreferences: { partition: PARTITION, contextIsolation: true, nodeIntegration: false }
  });
  // 구글 로그인은 팝업 창으로 열린다 — 같은 세션(partition)을 쓰는 진짜 창으로 열어줘야 한다
  loginWin.webContents.setWindowOpenHandler(() => ({
    action: 'allow',
    overrideBrowserWindowOptions: {
      width: 520, height: 650, autoHideMenuBar: true,
      webPreferences: { partition: PARTITION, contextIsolation: true, nodeIntegration: false }
    }
  }));
  loginWin.loadURL(APP_URL);

  // 로그인이 끝나면 알아서 창을 닫아 준다 — 사용자가 "이제 닫아도 되나" 고민할 필요가 없게.
  const watch = setInterval(async () => {
    if (!loginWin || loginWin.isDestroyed()) { clearInterval(watch); return; }
    try {
      const ok = await loginWin.webContents.executeJavaScript(
        'window.__widgetData ? !!window.__widgetData().ready : false', true);
      if (!ok) return;
      clearInterval(watch);
      debugLog('로그인 완료 감지 — 로그인 창을 닫는다');
      loginWin.close();
      notify('수업진도 위젯', '로그인됐어요. 이제 위젯에 오늘 수업이 표시됩니다.');
    } catch (e) { /* 페이지 이동 중이면 실패할 수 있다 — 다음 번에 다시 본다 */ }
  }, 2000);

  loginWin.on('closed', () => {
    clearInterval(watch);
    loginWin = null;
    // 로그인하고 닫았을 수 있으니 숨은 창을 새로 띄워 세션을 다시 읽는다
    if (workerWin && !workerWin.isDestroyed()) workerWin.webContents.reloadIgnoringCache();
    setTimeout(pollOnce, 3000);
  });
}

/* ===================== 위젯 창 ===================== */
function widgetSize() {
  const k = SIZES[getScale()];
  return { width: Math.round(360 * k), height: Math.round(300 * k) };
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
  widgetWin.webContents.once('did-finish-load', () => sendToWidget());
}

function applyScale(key) {
  saveState({ size: key });
  if (widgetWin && !widgetWin.isDestroyed()) {
    const s = widgetSize();
    const [x, y] = widgetWin.getPosition();
    widgetWin.setBounds({ x, y, width: s.width, height: s.height });
  }
  sendToWidget();
}
function applyOpacity(v) {
  saveState({ opacity: v });
  if (widgetWin && !widgetWin.isDestroyed()) widgetWin.setOpacity(v);
}
function applyAlwaysOnTop(on) {
  saveState({ alwaysOnTop: on });
  if (widgetWin && !widgetWin.isDestroyed()) widgetWin.setAlwaysOnTop(on, on ? 'screen-saver' : 'normal');
}

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
      { label: '지금 새로고침', click: () => pollOnce() },
      {
        // 다른 모니터를 뽑았거나 위젯을 어디 뒀는지 못 찾을 때 쓰는 탈출구
        label: '위젯 위치 초기화 (화면 가운데로)',
        click: () => {
          if (!widgetWin || widgetWin.isDestroyed()) { createWidgetWindow(); return; }
          const a = screen.getPrimaryDisplay().workArea;
          const b = widgetWin.getBounds();
          const x = Math.round(a.x + (a.width - b.width) / 2);
          const y = Math.round(a.y + (a.height - b.height) / 2);
          widgetWin.setBounds({ x, y, width: b.width, height: b.height });
          saveState({ x, y });
          widgetWin.show(); widgetWin.focus();
          debugLog('위젯 위치 초기화: 주 모니터 가운데(' + x + ', ' + y + ')');
        }
      },
      { label: '수업진도 앱 열기 (크롬)', click: () => openInBrowser(APP_URL) },
      { label: '로그인 창 열기', click: () => openLoginWindow() },
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
      { label: '종료', click: () => app.quit() }
    ]);
  };
  tray.setContextMenu(buildMenu());
  rebuildTrayMenu = () => tray.setContextMenu(buildMenu());
  tray.on('click', () => {
    if (!widgetWin || widgetWin.isDestroyed()) { createWidgetWindow(); return; }
    widgetWin.isVisible() ? widgetWin.hide() : widgetWin.show();
  });
  updateTrayTooltip();
}

/* ===================== IPC ===================== */
ipcMain.on('refresh-now', () => pollOnce());
ipcMain.on('open-login', () => openLoginWindow());
ipcMain.on('open-app', () => openInBrowser(APP_URL));
ipcMain.on('set-view', (_e, view) => {
  if (!['today', 'week', 'progress'].includes(view)) return;
  saveState({ view });
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
    debugLog('=== 시작 ===');
    createWidgetWindow();
    createTray();
    getWorkerWindow();
    // 앱이 로그인·자료 불러오기를 끝낼 시간을 조금 준 뒤 첫 조회
    setTimeout(pollOnce, 6000);
    pollTimer = setInterval(pollOnce, POLL_INTERVAL_MS);

    checkForUpdates();
    setInterval(checkForUpdates, UPDATE_CHECK_INTERVAL_MS);

    screen.on('display-removed', () => {
      if (!widgetWin || widgetWin.isDestroyed()) return;
      const b = widgetWin.getBounds();
      const p = safePosition({}, b);
      widgetWin.setBounds({ x: p.x, y: p.y, width: b.width, height: b.height });
    });
  });
}

app.on('window-all-closed', (e) => { e.preventDefault && e.preventDefault(); });
app.on('before-quit', () => { if (pollTimer) clearInterval(pollTimer); });
