// 파일명: usagetray.js | @version 2.0.0
// AI 사용량(과 내 PC)을 작업표시줄 알림 영역에 「자리마다 작은 글자 배지」로 나란히 띄운다.
// ★ 지비스 전용(main.js 가 HAS_TT 일 때만 부른다). 앱 대표 트레이 아이콘(로고)은 그대로 두고,
//   옆에 사용량 아이콘을 Tray 를 여러 개 만들어 따로 붙인다.
// ★ v2.0.0 — 링(도넛) 그림 대신 **글자 그대로**(«5시간 Claude 20» 꼴, 다른 사용량 위젯 참고 —
//   선생님이 그쪽 모양을 지비스에 가져와 달라 함). 링은 완전히 없앰.
//   무엇을 몇 개·무슨 글자로 보여줄지는 main.js 의 usageTrayItems() 가 정한다 — 이 파일은
//   {key, parts:[{t,c}...], tip} 목록을 받아 그리고 트레이를 맞출 뿐, 어떤 서비스인지는 모른다.
//
// 그림을 어떻게 만드나
//   숨은 창 하나를 계속 재사용해 작은 HTML(글자 여러 색)을 그리고, 글자 줄의 실제 크기(getBoundingClientRect)를
//   재서 그만큼만 오려 낸다(폭이 글자 길이마다 다르므로). 4배 크게 그려 축소해 넣는다(수퍼샘플링, 작은 글씨가 뭉개지지 않게).
//   글자는 밝은·어두운 작업표시줄 어디서나 보이게 옅은 테두리(그림자)를 살짝 깐다.

const { BrowserWindow, Tray } = require('electron');

const SCALE = 4;         // 이 배로 크게 그려서 줄인다
const FONT_PX = 15;      // «최종 높이» 기준 글자 크기(대략) — 실제로는 SCALE 만큼 키워서 그림
const OUT_H = 20;         // 최종 아이콘 높이(px) — 한 줄 텍스트 트레이 아이콘 표준에 가까움

/* 40% 부터 노랑, 오를수록 붉어짐 — views.js 의 usgTone() 과 같은 기준 */
const TONE = [
  { at: 0, c: '#3f6fd1' }, { at: 40, c: '#c99a06' }, { at: 60, c: '#d9791e' },
  { at: 80, c: '#d3541f' }, { at: 90, c: '#c22222' }
];
function toneColor(pct) {
  let c = TONE[0].c;
  const p = Number(pct) || 0;
  for (let i = 0; i < TONE.length; i++) { if (p >= TONE[i].at) c = TONE[i].c; }
  return c;
}
const MUTED = '#8a8a93';

let renderWin = null;
function getRenderWin() {
  if (renderWin && !renderWin.isDestroyed()) return renderWin;
  renderWin = new BrowserWindow({ width: 800, height: 200, show: false, frame: false,
    transparent: true, resizable: false, skipTaskbar: true,
    webPreferences: { backgroundThrottling: false } });
  return renderWin;
}
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

/* parts = [{ t: '5시간', c: '#8a8a93' }, { t: 'Claude', c: '#d97757' }, { t: '20', c: '#3f6fd1' }] 처럼
   한 줄에 이어 붙일 글자 조각들. 반환값은 24px 안팎 높이의 트레이용 그림(NativeImage, 폭은 글자 길이대로 다름) */
async function renderBadge(parts) {
  const w = getRenderWin();
  const spans = (parts || []).map((p) => '<span style="color:' + (p.c || MUTED) + '">' + esc(p.t) + '</span>').join(' ');
  const html = 'data:text/html;charset=utf-8,' + encodeURIComponent(
    '<!doctype html><html><head><meta charset="utf-8"><style>'
    + 'html,body{margin:0;padding:0;background:transparent}'
    + '#row{display:inline-flex;align-items:baseline;gap:' + (4 * SCALE) + 'px;white-space:nowrap;'
    + 'font-family:"Segoe UI",Pretendard,sans-serif;font-weight:800;font-size:' + (FONT_PX * SCALE) + 'px;'
    + 'letter-spacing:-.3px;'
    /* 밝은·어두운 작업표시줄 어디서나 읽히게 — 반대색 옅은 그림자를 사방에 깐다 */
    + 'text-shadow:0 0 ' + SCALE + 'px rgba(255,255,255,.9), 0 0 ' + SCALE + 'px rgba(0,0,0,.55);'
    + 'padding:' + SCALE + 'px}'
    + '</style></head><body><span id="row">' + spans + '</span></body></html>');
  await w.loadURL(html);
  const box = await w.webContents.executeJavaScript(
    '(function(){var r=document.getElementById("row").getBoundingClientRect();return {w:Math.ceil(r.width),h:Math.ceil(r.height)};})()');
  if (!box.w || !box.h) return null;
  await w.setContentSize(box.w, box.h);
  /* 창 크기를 바꾸면 살짝 재배치되므로 한 프레임 기다렸다 찍는다 */
  try { await w.webContents.executeJavaScript('new Promise(function(r){requestAnimationFrame(function(){requestAnimationFrame(r);});})'); }
  catch (e) { /* 그냥 찍는다 */ }
  let img = await w.webContents.capturePage();
  for (let i = 0; i < 4 && (img.isEmpty() || img.getSize().width < 2); i++) {
    await new Promise((r) => setTimeout(r, 80));
    img = await w.webContents.capturePage();
  }
  const ratio = OUT_H / box.h;
  return img.resize({ width: Math.max(1, Math.round(box.w * ratio)), height: OUT_H, quality: 'best' });
}

const trays = {};        // key → Tray
const sigs = {};         // key → 마지막으로 그린 «모양 열쇠» — 같으면 다시 안 그린다
let onOpen = () => {};   // 눌렀을 때 할 일(main.js 가 넣어 준다 — 위젯 열기·로그인)
function setOpener(fn) { onOpen = fn || (() => {}); }

let busy = false, pending = null;
/* items = [{ key, parts:[{t,c}], tip, ...아무거나(눌렀을 때 onOpen 에 그대로 넘어감) }, …]
   순서대로 트레이를 만들고, 목록에 없어진 key 는 지운다.
   ★ 그림 만들기(capturePage)는 비동기라 겹쳐 부르면 꼬인다 — 한 번에 하나씩만, 밀린 건 마지막 것만 다시 */
async function reconcile(items) {
  if (busy) { pending = items; return; }
  busy = true;
  try {
    const list = items || [];
    for (const it of list) {
      const sig = JSON.stringify(it.parts);
      let t = trays[it.key];
      if (!t || t.isDestroyed() || sigs[it.key] !== sig) {
        const img = await renderBadge(it.parts);
        if (!img) continue;
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
    if (pending) { const p = pending; pending = null; reconcile(p); }
  }
}
function destroyAll() {
  Object.keys(trays).forEach((k) => { try { trays[k].destroy(); } catch (e) { /* 무시 */ } delete trays[k]; delete sigs[k]; });
  if (renderWin && !renderWin.isDestroyed()) { try { renderWin.destroy(); } catch (e) { /* 무시 */ } }
  renderWin = null;
}

module.exports = { reconcile, setOpener, destroyAll, renderBadge, toneColor, MUTED };
