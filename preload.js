// 파일명: preload.js | @version 1.8.0
const { contextBridge, ipcRenderer } = require('electron');

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
  /* 사진 액자 */
  photoPick: () => ipcRenderer.invoke('photo-pick'),
  photoList: () => ipcRenderer.invoke('photo-list'),
  photoRead: (i) => ipcRenderer.invoke('photo-read', i),
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
  getWork: () => ipcRenderer.invoke('get-work'),
  workFetch: () => ipcRenderer.invoke('work-fetch'),
  printWork: (p) => ipcRenderer.invoke('work-print', p),
  onWorkChanged: (cb) => ipcRenderer.on('work-changed', () => cb()),
  setView: (view) => ipcRenderer.send('set-view', view),
  reportHeight: (h) => ipcRenderer.send('content-height', h),

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
