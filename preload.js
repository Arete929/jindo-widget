// 파일명: preload.js | @version 1.102.1
const { contextBridge, ipcRenderer, webFrame } = require('electron');

contextBridge.exposeInMainWorld('widgetAPI', {
  onData: (cb) => ipcRenderer.on('jindo-data', (_e, payload) => cb(payload)),
  onTasks: (cb) => ipcRenderer.on('task-status', (_e, list) => cb(list)),
  refreshNow: () => ipcRenderer.send('refresh-now'),
  openLogin: () => ipcRenderer.send('open-login'),
  openApp: () => ipcRenderer.send('open-app'),
  openUrl: (url) => ipcRenderer.send('open-url', url),
  openTimetable: () => ipcRenderer.send('open-timetable'),
  /* 수업 메모(진도표) */
  noteLoad: () => ipcRenderer.invoke('note-load'),
  noteSave: (o) => ipcRenderer.invoke('note-save', o),
  feedRefresh: () => ipcRenderer.invoke('feed-refresh'),
  feedAct: (o) => ipcRenderer.invoke('feed-act', o),
  /* 사진 액자 */
  photoPick: () => ipcRenderer.invoke('photo-pick'),
  photoList: () => ipcRenderer.invoke('photo-list'),
  photoRead: (i) => ipcRenderer.invoke('photo-read', i),
  /* 전광판 */
  boardSend: (o) => ipcRenderer.invoke('board-send', o),
  boardRefresh: () => ipcRenderer.invoke('board-refresh'),
  boardDel: (at) => ipcRenderer.invoke('board-del', at),
  escClose: () => ipcRenderer.send('esc-close'),
  openEasy: () => ipcRenderer.send('open-easy'),
  showWidget: () => ipcRenderer.send('show-widget'),
  hideWidget: () => ipcRenderer.send('hide-widget'),

  /* 날씨·미세먼지 */
  wxRefresh: () => ipcRenderer.invoke('wx-refresh'),
  wxSpots: () => ipcRenderer.invoke('wx-spots'),

  /* 학년부 일지 */
  gradeGet: (g) => ipcRenderer.invoke('grade-get', g),
  gradeFetch: (g) => ipcRenderer.invoke('grade-fetch', g),
  openSettings: () => ipcRenderer.send('open-settings'),
  getWeek: (off) => ipcRenderer.invoke('get-week', off),
  getWeeks: (from, to) => ipcRenderer.invoke('get-weeks', { from, to }),
  getWork: () => ipcRenderer.invoke('get-work'),
  workFetch: () => ipcRenderer.invoke('work-fetch'),
  printWork: (p) => ipcRenderer.invoke('work-print', p),
  onWorkChanged: (cb) => ipcRenderer.on('work-changed', () => cb()),
  setView: (view) => ipcRenderer.send('set-view', view),
  toggleFull: () => ipcRenderer.send('toggle-full'),
  reportHeight: (h) => ipcRenderer.send('content-height', h),
  /* 창이 화면 아래로 넘쳤다고 알린다 — 재는 것은 «그리는 쪽» 이 한다.
     거기서는 innerHeight 와 screen.availHeight 가 둘 다 CSS 픽셀이라 같은 자다. */
  tooTall: (o) => ipcRenderer.send('too-tall', o),
  /* ★ 화면 크기(작게·보통·크게) — 반드시 이걸로 키운다.
     body 에 CSS zoom 을 걸면 100vh 로 잰 #app 이 «그려 놓고 확대» 되어
     화면 높이의 20% 가 창 밖으로 삐져나간다 — 하단이 어느 모니터에서든 잘리고,
     굴려도 그 부분은 영원히 못 본다. webFrame 확대는 vh 까지 함께 줄여 준다. */
  setZoom: (z) => webFrame.setZoomFactor(Number(z) || 1),

  /* 업무포털 — 도우미 목록·실행·폴더 고르기.
     ★ 인증서 비밀번호는 도우미의 config.ini 몫이다. 이 앱은 손대지 않는다. */
  portalInfo: () => ipcRenderer.invoke('portal-info'),
  portalOpen: (i) => ipcRenderer.invoke('portal-open', i),
  portalPick: () => ipcRenderer.invoke('portal-pick'),
  portalClear: () => ipcRenderer.invoke('portal-clear'),

  /* AI 사용량 (클로드·제미나이) */
  usageLogin: (key) => ipcRenderer.send('usage-login', key),
  usageRefresh: () => ipcRenderer.send('usage-refresh'),
  setUsageStyle: (style) => ipcRenderer.send('usage-style', style),

  /* 설정 창 */
  getSettings: () => ipcRenderer.invoke('get-settings'),
  setUi: (v) => ipcRenderer.send('set-ui', v),
  checkUpdate: () => ipcRenderer.send('check-update'),
  installUpdate: () => ipcRenderer.send('install-update'),
  notesSeen: () => ipcRenderer.send('notes-seen'),
  notesShow: () => ipcRenderer.send('notes-show'),
  openLog: () => ipcRenderer.send('open-log'),

  /* 컴시간알리미 */
  // 업무관리(노션)
  taskRefresh: () => ipcRenderer.invoke('task-refresh'),
  taskSetStatus: (id, name) => ipcRenderer.invoke('task-set-status', id, name),
  taskSetDue: (id, ymd) => ipcRenderer.invoke('task-set-due', id, ymd),
  taskCreate: (title, projectId, ymd) => ipcRenderer.invoke('task-create', title, projectId, ymd),
  taskTest: (key) => ipcRenderer.invoke('task-test', key),
  // 내 할 일 (이 PC 에만 저장)
  todoAdd: (text) => ipcRenderer.invoke('todo-add', text),
  todoToggle: (id) => ipcRenderer.invoke('todo-toggle', id),
  todoDel: (id) => ipcRenderer.invoke('todo-del', id),
  todoClearDone: () => ipcRenderer.invoke('todo-clear-done'),
  todoMove: (id, dir) => ipcRenderer.invoke('todo-move', id, dir),
  // 틱틱
  tickConnect: () => ipcRenderer.invoke('tick-connect'),
  tickRefresh: () => ipcRenderer.invoke('tick-refresh'),
  tickAdd: (title, ymd, pid, pri) => ipcRenderer.invoke('tick-add', title, ymd, pid, pri),
  tickUpdate: (pid, tid, patch) => ipcRenderer.invoke('tick-update', pid, tid, patch),
  tickDel: (pid, tid) => ipcRenderer.invoke('tick-del', pid, tid),
  tickUndone: (pid, tid) => ipcRenderer.invoke('tick-undone', pid, tid),
  tickDoneClear: () => ipcRenderer.invoke('tick-done-clear'),
  tickDone: (pid, tid) => ipcRenderer.invoke('tick-done', pid, tid),
  tickDue: (pid, tid, ymd) => ipcRenderer.invoke('tick-due', pid, tid, ymd),
  tickTest: () => ipcRenderer.invoke('tick-test'),
  tickRedirect: () => ipcRenderer.invoke('tick-redirect'),
  // 수업진도 대시보드 얹기
  dashShow: (screen, rect, colors) => ipcRenderer.send('dash-show', screen, rect, colors),
  dashHide: () => ipcRenderer.send('dash-hide'),
  dashReload: () => ipcRenderer.invoke('dash-reload'),
  // 열쇠·설정 백업
  backupExport: (opt) => ipcRenderer.invoke('backup-export', opt),
  backupImport: (opt) => ipcRenderer.invoke('backup-import', opt),

  comciSearch: (name) => ipcRenderer.invoke('comci-search', name),
  comciFetch: () => ipcRenderer.invoke('comci-fetch'),
  comciGet: () => ipcRenderer.invoke('comci-get'),
  onComciChanged: (cb) => ipcRenderer.on('comci-changed', () => cb()),
  setComciConfig: (cfg) => ipcRenderer.send('comci-config', cfg),
  setComciPick: (p) => ipcRenderer.send('comci-pick', p),

  /* 학생기록 */
  recState: () => ipcRenderer.invoke('rec-state'),
  recSignIn: () => ipcRenderer.invoke('rec-signin'),
  recSignOut: () => ipcRenderer.invoke('rec-signout'),
  recFind: () => ipcRenderer.invoke('rec-find'),
  recCreate: () => ipcRenderer.invoke('rec-create'),
  recTrash: () => ipcRenderer.invoke('rec-trash'),
  recAttach: (url) => ipcRenderer.invoke('rec-attach', url),
  recLoad: () => ipcRenderer.invoke('rec-load'),
  recSave: (p) => ipcRenderer.invoke('rec-save', p),
  recClear: (row) => ipcRenderer.invoke('rec-clear', row),
  recCats: (cats) => ipcRenderer.invoke('rec-cats', cats),
  recOpenSheet: () => ipcRenderer.send('rec-open-sheet'),
  rosterGet: () => ipcRenderer.invoke('roster-get'),
  rosterFetch: () => ipcRenderer.invoke('roster-fetch'),

  /* 학사일정·급식 */
  getAcademic: () => ipcRenderer.invoke('get-academic'),
  academicFetch: () => ipcRenderer.invoke('academic-fetch'),
  onAcademicChanged: (cb) => ipcRenderer.on('academic-changed', () => cb()),
  neisSearch: (name) => ipcRenderer.invoke('neis-search', name),
  getMeals: () => ipcRenderer.invoke('get-meals'),
  mealsFetch: (off) => ipcRenderer.invoke('meals-fetch', off),
  onMealsChanged: (cb) => ipcRenderer.on('meals-changed', () => cb())
});
