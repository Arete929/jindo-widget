// 파일명: preload.js | @version 1.0.0
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('widgetAPI', {
  onData: (cb) => ipcRenderer.on('jindo-data', (_e, payload) => cb(payload)),
  refreshNow: () => ipcRenderer.send('refresh-now'),
  openLogin: () => ipcRenderer.send('open-login'),
  openApp: () => ipcRenderer.send('open-app'),
  openTimetable: () => ipcRenderer.send('open-timetable'),
  getWeek: (off) => ipcRenderer.invoke('get-week', off),
  setView: (view) => ipcRenderer.send('set-view', view),
  reportHeight: (h) => ipcRenderer.send('content-height', h)
});
