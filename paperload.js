// 파일명: paperload.js | @version 1.1.0 — PDF 저장 더함
// 인쇄 미리보기 창이 쓰는 아주 작은 다리.
//
// 미리보기 종이는 «data: 주소» 로 띄운 낯선 쪽이라, 위젯이 쓰는 preload.js 를
// 그대로 물리지 않는다. 여기서는 «인쇄» 와 «닫기» 두 가지만 내준다.

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('paper', {
  print: () => ipcRenderer.send('paper-print'),
  pdf: () => ipcRenderer.send('paper-pdf'),
  close: () => ipcRenderer.send('paper-close')
});
