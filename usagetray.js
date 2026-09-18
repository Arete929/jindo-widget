// 파일명: usagetray.js | @version 1.0.0
// AI 사용량을 작업표시줄 알림 영역에 「서비스마다 작은 숫자 아이콘」으로 나란히 띄운다.
// ★ 지비스 전용(main.js 가 HAS_TT 일 때만 부른다). 앱 대표 트레이 아이콘(로고)은 그대로 두고,
//   옆에 사용량 아이콘을 Tray 를 여러 개 만들어 따로 붙인다(SPECTRA 참고).
//
// 그림을 어떻게 만드나
//   숨은 창 하나를 계속 재사용해 작은 HTML(숫자+색 배경)을 그린 뒤 capturePage 로 사진을 찍는다.
//   찍은 사진(32px)을 24px 로 줄여 넣는다 — 그대로 넣는 것보다 살짝 또렷하다(수퍼샘플링).
//   글자는 테두리 없이 숫자만 — 16~24px 짜리 아이콘에 글자·숫자를 같이 넣으면 뭉갠다.

const { BrowserWindow, Tray } = require('electron');

const ORDER = ['claude', 'gemini', 'gpt'];   // 나오는 차례(앱 아이콘 옆)
const RENDER = 32, ICON = 24;

/* 40% 부터 노랑, 오를수록 붉어짐 — views.js 의 usgTone() 과 같은 기준을 여기(메인 프로세스)에도 둔다 */
const TONE = [
  { at: 0, c: '#5b7fd6' }, { at: 40, c: '#eab308' }, { at: 60, c: '#ef8b1e' },
  { at: 80, c: '#e85f22' }, { at: 90, c: '#d31f26' }
];
function toneColor(pct) {
  let c = TONE[0].c;
  const p = Number(pct) || 0;
  for (let i = 0; i < TONE.length; i++) { if (p >= TONE[i].at) c = TONE[i].c; }
  return c;
}
const OFF = '#8a8a93';   // 로그인 필요·불러오는 중 — 회색

let renderWin = null;
function getRenderWin() {
  if (renderWin && !renderWin.isDestroyed()) return renderWin;
  renderWin = new BrowserWindow({ width: RENDER, height: RENDER, show: false, frame: false,
    transparent: true, resizable: false, skipTaskbar: true,
    webPreferences: { backgroundThrottling: false } });
  return renderWin;
}
async function renderBadge(text, bg) {
  const w = getRenderWin();
  const html = 'data:text/html;charset=utf-8,' + encodeURIComponent(
    '<!doctype html><html><head><meta charset="utf-8"><style>'
    + 'html,body{margin:0;padding:0;background:transparent;width:' + RENDER + 'px;height:' + RENDER + 'px;overflow:hidden}'
    + '.b{width:' + RENDER + 'px;height:' + RENDER + 'px;display:flex;align-items:center;justify-content:center;'
    + 'font-family:"Segoe UI",Pretendard,sans-serif;font-weight:800;color:#fff;'
    + 'background:' + bg + ';border-radius:8px;font-size:14px;letter-spacing:-.4px}'
    + '</style></head><body><div class="b">' + text + '</div></body></html>');
  await w.loadURL(html);
  const img = await w.webContents.capturePage();
  return img.resize({ width: ICON, height: ICON, quality: 'best' });
}

/* 한 서비스의 상태 → { text, bg, tip } */
function badgeOf(label, u) {
  if (!u) return { text: '·', bg: OFF, tip: label };
  if (u.needsLogin) return { text: '!', bg: OFF, tip: label + ' — 로그인 필요(눌러서 열기)' };
  const m = (u.session && u.session.pct != null) ? u.session : (u.weekly && u.weekly.pct != null ? u.weekly : null);
  if (!m) return { text: '…', bg: OFF, tip: label + ' — 불러오는 중…' };
  let left = '';
  if (m.resetAt) {
    const ms = m.resetAt - Date.now();
    if (ms > 0) {
      const mi = Math.floor(ms / 60000), hh = Math.floor(mi / 60);
      left = ' · ' + (hh >= 1 ? hh + '시간 ' + (mi % 60) + '분 남음' : mi + '분 남음');
    }
  }
  return { text: String(Math.round(m.pct)), bg: toneColor(m.pct), tip: label + ' ' + Math.round(m.pct) + '%' + left };
}

const trays = {};        // key → Tray
let onOpen = () => {};   // 눌렀을 때 할 일(main.js 가 넣어 준다 — 위젯 열기)
function setOpener(fn) { onOpen = fn || (() => {}); }

let busy = false, pending = null;
/* onKeys=켜 놓은 것(claude/gemini/gpt), snap=aiusage.snapshot() 그대로.
   ★ 그림 만들기(capturePage)는 비동기라 겹쳐 부르면 꼬인다 — 한 번에 하나씩만, 밀린 건 마지막 것만 다시 */
async function reconcile(onKeys, snap) {
  if (busy) { pending = [onKeys, snap]; return; }
  busy = true;
  try {
    const keys = ORDER.filter((k) => onKeys.indexOf(k) >= 0);
    for (const k of keys) {
      const u = snap && snap[k];
      const label = (u && u.label) || k;
      const b = badgeOf(label, u);
      const img = await renderBadge(b.text, b.bg);
      let t = trays[k];
      if (!t || t.isDestroyed()) {
        t = new Tray(img);
        t.on('click', () => onOpen(k, u));
        trays[k] = t;
      } else {
        t.setImage(img);
      }
      t.setToolTip(b.tip);
    }
    Object.keys(trays).forEach((k) => {
      if (keys.indexOf(k) < 0) { try { trays[k].destroy(); } catch (e) { /* 이미 없어짐 */ } delete trays[k]; }
    });
  } finally {
    busy = false;
    if (pending) { const p = pending; pending = null; reconcile(p[0], p[1]); }
  }
}
function destroyAll() {
  Object.keys(trays).forEach((k) => { try { trays[k].destroy(); } catch (e) { /* 무시 */ } delete trays[k]; });
  if (renderWin && !renderWin.isDestroyed()) { try { renderWin.destroy(); } catch (e) { /* 무시 */ } }
  renderWin = null;
}

module.exports = { reconcile, setOpener, destroyAll, renderBadge, badgeOf };   // renderBadge·badgeOf 는 시험용
