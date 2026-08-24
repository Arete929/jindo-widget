// 파일명: preload.js | @version 1.7.0
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('widgetAPI', {
  onData: (cb) => ipcRenderer.on('jindo-data', (_e, payload) => cb(payload)),
  onTasks: (cb) => ipcRenderer.on('task-status', (_e, list) => cb(list)),
  refreshNow: () => ipcRenderer.send('refresh-now'),
  openLogin: () => ipcRenderer.send('open-login'),
  openApp: () => ipcRenderer.send('open-app'),
  openTimetable: () => ipcRenderer.send('open-timetable'),
  openSettings: () => ipcRenderer.send('open-settings'),
  getWeek: (off) => ipcRenderer.invoke('get-week', off),
  getWork: () => ipcRenderer.invoke('get-work'),
  workFetch: () => ipcRenderer.invoke('work-fetch'),
  onWorkChanged: (cb) => ipcRenderer.on('work-changed', () => cb()),
  setView: (view) => ipcRenderer.send('set-view', view),
  reportHeight: (h) => ipcRenderer.send('content-height', h),

  /* 설정 창 */
  getSettings: () => ipcRenderer.invoke('get-settings'),
  setUi: (v) => ipcRenderer.send('set-ui', v),
  checkUpdate: () => ipcRenderer.send('check-update'),
  installUpdate: () => ipcRenderer.send('install-update'),
  openLog: () => ipcRenderer.send('open-log'),

  /* 컴시간알리미 */
  comciSearch: (name) => ipcRenderer.invoke('comci-search', name),
  comciFetch: () => ipcRenderer.invoke('comci-fetch'),
  comciGet: () => ipcRenderer.invoke('comci-get'),
  onComciChanged: (cb) => ipcRenderer.on('comci-changed', () => cb()),
  setComciConfig: (cfg) => ipcRenderer.send('comci-config', cfg),

  /* 학사일정·급식 */
  getAcademic: () => ipcRenderer.invoke('get-academic'),
  academicFetch: () => ipcRenderer.invoke('academic-fetch'),
  onAcademicChanged: (cb) => ipcRenderer.on('academic-changed', () => cb()),
  neisSearch: (name) => ipcRenderer.invoke('neis-search', name),
  getMeals: () => ipcRenderer.invoke('get-meals'),
  mealsFetch: () => ipcRenderer.invoke('meals-fetch'),
  onMealsChanged: (cb) => ipcRenderer.on('meals-changed', () => cb())
});
