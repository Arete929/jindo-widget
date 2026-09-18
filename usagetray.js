// 파일명: usagetray.js | @version 1.1.0
// AI 사용량을 작업표시줄 알림 영역에 「서비스마다 작은 원형 게이지 아이콘」으로 나란히 띄운다.
// ★ 지비스 전용(main.js 가 HAS_TT 일 때만 부른다). 앱 대표 트레이 아이콘(로고)은 그대로 두고,
//   옆에 사용량 아이콘을 Tray 를 여러 개 만들어 따로 붙인다(SPECTRA 참고 + 사용량 화면의 ringSvg 모양).
//
// 그림을 어떻게 만드나
//   숨은 창 하나를 계속 재사용해 작은 HTML(SVG 링+숫자)을 그린 뒤 capturePage 로 사진을 찍는다.
//   64px 로 크게 그려서 24px 로 줄여 넣는다 — 그대로 그리는 것보다 훨씬 또렷하다(수퍼샘플링,
//   특히 가는 링 테두리는 작게 그리면 계단이 진다).
// v1.1.0: 납작한 사각 배지 → 링(도넛) 모양으로. 사용량 큰 화면의 ringSvg() 와 같은 생김새(선생님이 «이 모양이 좋다»).

const { BrowserWindow, Tray } = require('electron');

const ORDER = ['claude', 'gemini', 'gpt'];   // 나오는 차례(앱 아이콘 옆)
const RENDER = 64, ICON = 24;

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
/* pct 가 숫자면 링(도넛)+가운데 숫자, 아니면(로그인 필요·불러오는 중) 민무늬 원+글자 하나 */
async function renderBadge(text, pct) {
  const w = getRenderWin();
  const cx = RENDER / 2, r = RENDER / 2 - 7, sw = 8;
  const c = 2 * Math.PI * r;
  let svg;
  if (pct == null) {
    svg = '<circle cx="' + cx + '" cy="' + cx + '" r="' + (RENDER / 2 - 2) + '" fill="' + OFF + '"/>'
      + '<text x="' + cx + '" y="' + (cx + RENDER * 0.15) + '" text-anchor="middle" font-size="' + (RENDER * 0.5) + '">' + text + '</text>';
  } else {
    const p = Math.max(0, Math.min(100, Number(pct) || 0));
    const off = c * (1 - p / 100);
    const col = toneColor(p);
    svg = '<circle cx="' + cx + '" cy="' + cx + '" r="' + r + '" fill="none" stroke="rgba(255,255,255,.28)" stroke-width="' + sw + '"/>'
      + '<circle cx="' + cx + '" cy="' + cx + '" r="' + r + '" fill="none" stroke="' + col + '" stroke-width="' + sw + '"'
      + ' stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"'
      + ' transform="rotate(-90 ' + cx + ' ' + cx + ')"/>'
      + '<text x="' + cx + '" y="' + (cx + RENDER * 0.13) + '" text-anchor="middle" font-size="' + (RENDER * 0.34) + '">' + text + '</text>';
  }
  const html = 'data:text/html;charset=utf-8,' + encodeURIComponent(
    '<!doctype html><html><head><meta charset="utf-8"><style>'
    + 'html,body{margin:0;padding:0;background:transparent;width:' + RENDER + 'px;height:' + RENDER + 'px;overflow:hidden}'
    + 'svg{display:block}'
    + 'text{font-family:"Segoe UI",Pretendard,sans-serif;font-weight:800;fill:#fff;letter-spacing:-.5px}'
    + '</style></head><body>'
    + '<svg width="' + RENDER + '" height="' + RENDER + '" viewBox="0 0 ' + RENDER + ' ' + RENDER + '">' + svg + '</svg>'
    + '</body></html>');
  await w.loadURL(html);
  const img = await w.webContents.capturePage();
  return img.resize({ width: ICON, height: ICON, quality: 'best' });
}

/* 한 서비스의 상태 → { text, pct(null 이면 민무늬), tip } */
function badgeOf(label, u) {
  if (!u) return { text: '·', pct: null, tip: label };
  if (u.needsLogin) return { text: '!', pct: null, tip: label + ' — 로그인 필요(눌러서 열기)' };
  const m = (u.session && u.session.pct != null) ? u.session : (u.weekly && u.weekly.pct != null ? u.weekly : null);
  if (!m) return { text: '…', pct: null, tip: label + ' — 불러오는 중…' };
  let left = '';
  if (m.resetAt) {
    const ms = m.resetAt - Date.now();
    if (ms > 0) {
      const mi = Math.floor(ms / 60000), hh = Math.floor(mi / 60);
      left = ' · ' + (hh >= 1 ? hh + '시간 ' + (mi % 60) + '분 남음' : mi + '분 남음');
    }
  }
  return { text: String(Math.round(m.pct)), pct: m.pct, tip: label + ' ' + Math.round(m.pct) + '%' + left };
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
      const img = await renderBadge(b.text, b.pct);
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
