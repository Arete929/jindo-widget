// 파일명: usagetray.js | @version 1.3.0
// AI 사용량(과 내 PC)을 작업표시줄 알림 영역에 「자리마다 작은 원형 게이지 아이콘」으로 나란히 띄운다.
// ★ 지비스 전용(main.js 가 HAS_TT 일 때만 부른다). 앱 대표 트레이 아이콘(로고)은 그대로 두고,
//   옆에 사용량 아이콘을 Tray 를 여러 개 만들어 따로 붙인다(SPECTRA 참고 + 사용량 화면의 ringSvg 모양).
// ★ v1.2.0 — «서비스 하나에 아이콘 하나» 가 아니라 «사용량 큰 화면에 보이는 자리마다 하나» 로.
//   무엇을 몇 개 보여줄지는 main.js 의 usageTrayItems() 가 정한다(5시간·주간·Fable·내 PC CPU·RAM…) —
//   이 파일은 받은 목록대로 그리고 트레이를 맞출 뿐, 어떤 서비스인지는 모른다(item.key 만 안다).
// ★ v1.3.0 — 숫자가 안 보이던 것을 고침. 원인: 글자가 «흰색» 인데 가운데가 투명이라, 밝은 작업표시줄에서는
//   흰 글씨가 바탕에 묻혔다(어두운 바탕에서만 시험했었다). 이제 «흰 원판 + 진한 글씨» — 밝은·어두운 작업표시줄
//   어디서나 읽힌다. 숫자도 크게(링 안쪽을 거의 채움), 링 색은 앱 테마 강조색(accent)을 따른다(사용량 화면과 같게).
//
// 그림을 어떻게 만드나
//   숨은 창 하나를 계속 재사용해 작은 HTML(SVG 링+숫자)을 그린 뒤 capturePage 로 사진을 찍는다.
//   64px 로 크게 그려서 32px 로 줄여 넣는다 — 그대로 그리는 것보다 훨씬 또렷하다(수퍼샘플링).

const { BrowserWindow, Tray } = require('electron');

const RENDER = 64, ICON = 32;

/* 40% 부터 노랑, 오를수록 붉어짐 — views.js 의 usgTone() 과 같은 기준. 0~40% 는 앱 테마 강조색(accent) */
const TONE = [
  { at: 40, c: '#eab308' }, { at: 60, c: '#ef8b1e' },
  { at: 80, c: '#e85f22' }, { at: 90, c: '#d31f26' }
];
const ACCENT_DEFAULT = '#8b5cf6';
function toneColor(pct, accent) {
  let c = accent || ACCENT_DEFAULT;
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
/* pct 가 숫자면 «흰 원판 + 링 + 큰 숫자», 아니면(로그인 필요·불러오는 중) 회색 원 + 글자 하나 */
async function renderBadge(text, pct, accent) {
  const w = getRenderWin();
  const cx = RENDER / 2, r = RENDER / 2 - 8, sw = 6;
  const c = 2 * Math.PI * r;
  let svg;
  if (pct == null) {
    svg = '<circle cx="' + cx + '" cy="' + cx + '" r="' + (cx - 1) + '" fill="' + OFF + '"/>'
      + '<text x="' + cx + '" y="' + (cx + 1) + '" text-anchor="middle" dominant-baseline="central" font-size="' + (RENDER * 0.6) + '" style="fill:#fff">' + text + '</text>';
  } else {
    const p = Math.max(0, Math.min(100, Number(pct) || 0));
    const off = c * (1 - p / 100);
    const col = toneColor(p, accent);
    /* 자릿수에 따라 글자 크기 — 1~2자리는 링 안쪽을 거의 채우게, 3자리(100)는 조금 줄임 */
    const fs = String(text).length >= 3 ? RENDER * 0.34 : (String(text).length === 2 ? RENDER * 0.46 : RENDER * 0.54);
    svg = '<circle cx="' + cx + '" cy="' + cx + '" r="' + (cx - 1) + '" fill="#fff" stroke="#c9ccd6" stroke-width="2"/>'
      + '<circle cx="' + cx + '" cy="' + cx + '" r="' + r + '" fill="none" stroke="#e4e6ee" stroke-width="' + sw + '"/>'
      + '<circle cx="' + cx + '" cy="' + cx + '" r="' + r + '" fill="none" stroke="' + col + '" stroke-width="' + sw + '"'
      + ' stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"'
      + ' transform="rotate(-90 ' + cx + ' ' + cx + ')"/>'
      + '<text x="' + cx + '" y="' + (cx + 1) + '" text-anchor="middle" dominant-baseline="central" font-size="' + fs + '" style="fill:#14161c">' + text + '</text>';
  }
  const html = 'data:text/html;charset=utf-8,' + encodeURIComponent(
    '<!doctype html><html><head><meta charset="utf-8"><style>'
    + 'html,body{margin:0;padding:0;background:transparent;width:' + RENDER + 'px;height:' + RENDER + 'px;overflow:hidden}'
    + 'svg{display:block}'
    + 'text{font-family:"Segoe UI",Pretendard,sans-serif;font-weight:800;letter-spacing:-1px}'
    + '</style></head><body>'
    + '<svg width="' + RENDER + '" height="' + RENDER + '" viewBox="0 0 ' + RENDER + ' ' + RENDER + '">' + svg + '</svg>'
    + '</body></html>');
  await w.loadURL(html);
  /* ★ 첫 그림은 «아직 안 그려진» 빈 사진이 올 때가 있다(시험에서 실제로 0바이트가 나왔다) —
     두 프레임 기다린 뒤 찍고, 비어 있으면 잠깐 쉬었다 다시 찍는다 */
  try { await w.webContents.executeJavaScript('new Promise(function(r){requestAnimationFrame(function(){requestAnimationFrame(r);});})'); }
  catch (e) { /* 그냥 찍는다 */ }
  let img = await w.webContents.capturePage();
  for (let i = 0; i < 4 && (img.isEmpty() || img.getSize().width < 2); i++) {
    await new Promise((r) => setTimeout(r, 80));
    img = await w.webContents.capturePage();
  }
  return img.resize({ width: ICON, height: ICON, quality: 'best' });
}

const trays = {};        // key → Tray
const sigs = {};         // key → 마지막으로 그린 «모양 열쇠» — 같으면 다시 안 그린다(3초마다 불려도 가볍게)
let onOpen = () => {};   // 눌렀을 때 할 일(main.js 가 넣어 준다 — 위젯 열기·로그인)
function setOpener(fn) { onOpen = fn || (() => {}); }

let busy = false, pending = null;
/* items = [{ key, text, pct(숫자 또는 null), tip, ...아무거나(눌렀을 때 onOpen 에 그대로 넘어감) }, …]
   accent = 앱 테마 강조색(링 0~40% 색). 순서대로 트레이를 만들고, 목록에 없어진 key 는 지운다.
   ★ 그림 만들기(capturePage)는 비동기라 겹쳐 부르면 꼬인다 — 한 번에 하나씩만, 밀린 건 마지막 것만 다시 */
async function reconcile(items, accent) {
  if (busy) { pending = [items, accent]; return; }
  busy = true;
  try {
    const list = items || [];
    for (const it of list) {
      const sig = it.text + '|' + it.pct + '|' + (accent || '');
      let t = trays[it.key];
      if (!t || t.isDestroyed() || sigs[it.key] !== sig) {
        const img = await renderBadge(it.text, it.pct, accent);
        if (!t || t.isDestroyed()) {
          t = new Tray(img);
          t.on('click', () => onOpen(it));
          trays[it.key] = t;
        } else {
          t.setImage(img);
        }
        sigs[it.key] = sig;
      }
      t.setToolTip(it.tip || '');
    }
    const keep = list.map((it) => it.key);
    Object.keys(trays).forEach((k) => {
      if (keep.indexOf(k) < 0) { try { trays[k].destroy(); } catch (e) { /* 이미 없어짐 */ } delete trays[k]; delete sigs[k]; }
    });
  } finally {
    busy = false;
    if (pending) { const p = pending; pending = null; reconcile(p[0], p[1]); }
  }
}
function destroyAll() {
  Object.keys(trays).forEach((k) => { try { trays[k].destroy(); } catch (e) { /* 무시 */ } delete trays[k]; delete sigs[k]; });
  if (renderWin && !renderWin.isDestroyed()) { try { renderWin.destroy(); } catch (e) { /* 무시 */ } }
  renderWin = null;
}

module.exports = { reconcile, setOpener, destroyAll, renderBadge };   // renderBadge 는 시험용
