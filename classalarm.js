// 파일명: classalarm.js | @version 1.0.0
/* ── 수업 알림 ────────────────────────────────────────────────────────────
   컴시간에서 받아 둔 «내 시간표» 를 보고, 수업이 시작하기 전에 한 번 알린다.
   알리는 방법은 둘 — 윈도우 작은 알림(토스트)과 화면 전체를 덮는 창(alarm.html).

   ★ 알리는 조건
     · 설정에서 켜 두었고(cfg.on)
     · 컴시간 설정에서 «내 이름»(teacherIdx)을 골라 두었을 때만 알린다.
       안 골라 둔 선생님(혜원이지를 막 깐 분)에게는 아무것도 안 뜬다.
     · 월~금, 그 날 시간표에 있는 수업만. 같은 교시는 하루에 한 번만.

   ★ 컴시간 자료는 «주» 단위다 (comcigan.js shape — start = 그 자료의 월요일).
     이번 주 월요일과 맞는 자료를 쓴다. 자료가 지난 주 것이면 바뀐 수업 표시는
     못 믿으니 기본 시간표(byTeacher)로만 본다.

   ★ «발표 중» — 수업 중에 PPT·영상을 전체 화면으로 띄워 두었을 때 화면 전체 알림이
     뜨면 학생들이 다 본다. 그래서 맨 앞 창이 화면을 통째로 덮고 있으면 작은 알림만 띄운다.
     윈도우의 집중 지원 상태는 공개된 길로 읽을 수 없어서 «전체 화면 창» 으로 가늠한다.
     못 알아보면 발표 중이 아니라고 본다 — 못 알리는 쪽보다 알리는 쪽이 낫다.
*/
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

let D = null;            // 바깥에서 받은 것들 (main.js 가 넘겨 준다)
let timer = null;
let fired = {};          // '2026-10-28:5' → 이 교시는 알렸다
let snooze = {};         // 같은 교시를 «5분 뒤 다시» 로 미룬 시각(ms)
let wins = [];           // 열려 있는 화면 전체 알림 창
let firstDone = '';      // «오늘 첫 수업» 을 알린 날

const DEF = { on: true, before: 10, how: 'full', hold: 15, where: 'cursor',
              quiet: 'toast', changed: true, first: false, sound: true };
const BEFORE = [0, 3, 5, 10, 15];
const HOLD = [0, 5, 15, 30];

/* ── 설정 ── */
function cfg() {
  const s = (D.loadState().alarm) || {};
  const pick = (list, v, d) => (list.indexOf(Number(v)) >= 0 ? Number(v) : d);
  const bool = (v, d) => (v === undefined ? d : !!v);
  return {
    on: bool(s.on, DEF.on),
    before: pick(BEFORE, s.before, DEF.before),
    how: ['toast', 'full', 'both'].indexOf(s.how) >= 0 ? s.how : DEF.how,
    hold: pick(HOLD, s.hold, DEF.hold),
    where: s.where === 'all' ? 'all' : 'cursor',
    quiet: s.quiet === 'asis' ? 'asis' : 'toast',      // toast = 발표 중엔 작은 알림만
    changed: bool(s.changed, DEF.changed),
    first: bool(s.first, DEF.first),
    sound: bool(s.sound, DEF.sound),
    at: String(s.at || '')
  };
}
function setCfg(v) {
  const cur = cfg(), next = {};
  ['on', 'before', 'how', 'hold', 'where', 'quiet', 'changed', 'first', 'sound']
    .forEach((k) => { next[k] = (v && v[k] !== undefined) ? v[k] : cur[k]; });
  D.saveState({ alarm: Object.assign(next, { at: D.stampKST() }) });
  const c = cfg();
  D.debugLog('수업 알림 설정 — ' + (c.on ? '켬' : '끔') + ' · ' + c.before + '분 전 · ' + c.how);
  if (c.on) start(); else { stop(); closeAll(); }
  return c;
}

/* ── 날짜 ── */
function z(n) { return (n < 10 ? '0' : '') + n; }
function ymd(d) { return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()); }
function mondayOf(d) {
  const x = new Date(d), w = x.getDay();
  x.setDate(x.getDate() + (w === 0 ? -6 : 1 - w));
  x.setHours(0, 0, 0, 0);
  return x;
}

/* ── 오늘 내 수업 ──
   [{ p, subject, grade, cls, changed, start:'14:20', at: 분 }] — 시각 순서.
   null = 알릴 수 없는 상태(자료 없음·내 이름 안 고름), [] = 오늘은 수업 없음. */
function todayLessons(when) {
  const c = D.loadComci();
  if (!c) return null;
  const idx = Number(D.getComciConfig().teacherIdx) || 0;
  if (!idx) return null;
  const now = when || new Date(), dow = now.getDay();
  if (dow < 1 || dow > 5) return [];
  const mon = ymd(mondayOf(now));
  /* 이번 주에 맞는 자료 — 다음 주 덩이가 이번 주면 그것을, 아니면 기본 시간표 */
  let src = c.byTeacher, sure = (c.start === mon);
  if (c.next && c.next.start === mon && c.next.byTeacher) { src = c.next.byTeacher; sure = true; }
  const me = (src || []).filter((t) => t.i === idx)[0];
  if (!me) return null;
  const day = (me.days || [])[dow - 1];
  const out = [];
  ((day && day.periods) || []).forEach((x) => {
    if (!x || !x.subject) return;
    const m = String((c.times || {})[x.p] || '').match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return;                                  // 교시 시각을 모르면 알릴 수 없다
    out.push({ p: x.p, subject: x.subject, grade: x.grade, cls: x.cls,
      changed: sure && !!x.changed, start: m[1] + ':' + m[2],
      at: Number(m[1]) * 60 + Number(m[2]) });
  });
  out.sort((a, b) => a.at - b.at);
  return out;
}

/* ── 30초마다 ── */
function tick() {
  const c = cfg();
  if (!c.on) return;
  const ls = todayLessons();
  if (!ls) return;
  const now = new Date(), today = ymd(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();

  /* 어제 것은 버린다 — 켜 둔 채 날이 바뀌어도 쌓이지 않게 */
  Object.keys(fired).forEach((k) => { if (k.indexOf(today) !== 0) delete fired[k]; });
  Object.keys(snooze).forEach((k) => { if (k.indexOf(today) !== 0) delete snooze[k]; });

  if (!ls.length) return;

  /* 오늘 첫 수업 안내 — 아침에 한 번, 작은 알림으로만 */
  if (c.first && firstDone !== today && nowMin >= 7 * 60 && nowMin < ls[0].at - c.before) {
    firstDone = today;
    const f = ls[0];
    notify('오늘 수업 ' + ls.length + '개', '첫 수업은 ' + f.start + ' ' + f.p + '교시 · '
      + f.grade + '학년 ' + f.cls + '반 ' + f.subject, c.sound);
  }

  for (let i = 0; i < ls.length; i++) {
    const l = ls[i], key = today + ':' + l.p, sn = snooze[key] || 0;
    if (sn) {
      if (Date.now() < sn) continue;
      delete snooze[key];
    } else {
      if (fired[key]) continue;
      if (nowMin < l.at - c.before || nowMin > l.at) continue;
    }
    fired[key] = true;
    show(l, Math.max(0, l.at - nowMin), key, false);
    return;                                           // 한 번에 하나만
  }
}

/* ── 알리기 ── */
function notify(title, body, sound) {
  try {
    if (!D.Notification.isSupported()) return;
    const n = new D.Notification({ title: title, body: body, silent: !sound });
    n.on('click', () => { try { D.showWidget(); } catch (e) { /* */ } });
    n.show();
  } catch (e) { D.debugLog('수업 알림 — 작은 알림 실패: ' + e.message); }
}

async function show(l, left, key, force) {
  const c = cfg();
  let full = (c.how === 'full' || c.how === 'both');
  let toast = (c.how === 'toast' || c.how === 'both');
  if (full && !force && c.quiet === 'toast' && await presenting()) {
    full = false; toast = true;
    D.debugLog('수업 알림 — 발표 중(전체 화면)이라 작은 알림만');
  }
  const who = l.grade + '학년 ' + l.cls + '반';
  const when = left > 0 ? (left + '분 뒤') : '지금';
  const chg = !!l.changed && c.changed;      // «함께 알림 — 바뀐 수업» 을 켜 두었을 때만
  if (toast) {
    notify(when + ' ' + who + ' 수업',
      l.p + '교시 ' + l.subject + ' · ' + l.start + ' 시작'
      + (chg ? '\n컴시간에서 바뀐 수업입니다' : ''), c.sound);
  }
  if (full) {
    openAlarm({ key: key, when: when, who: who, p: l.p, subject: l.subject,
      start: l.start, changed: chg, hold: c.hold, sound: c.sound,
      app: D.APP_NAME });
  }
  D.debugLog('수업 알림 — ' + when + ' ' + who + ' ' + l.subject
    + ' (' + (full ? '화면 전체' : '') + (full && toast ? '+' : '') + (toast ? '작은 알림' : '') + ')');
}

/* ── 화면 전체 알림 창 ── */
function openAlarm(info) {
  closeAll();
  const c = cfg();
  const list = c.where === 'all'
    ? D.screen.getAllDisplays()
    : [D.screen.getDisplayNearestPoint(D.screen.getCursorScreenPoint())];
  list.forEach((dsp, i) => {
    const b = dsp.bounds;
    let w = null;
    try {
      w = new D.BrowserWindow({
        x: b.x, y: b.y, width: b.width, height: b.height,
        frame: false, transparent: true, backgroundColor: '#00000000',
        resizable: false, movable: false, minimizable: false, maximizable: false,
        fullscreenable: false, skipTaskbar: true, show: false, hasShadow: false,
        alwaysOnTop: true, title: '수업 알림',
        webPreferences: { preload: path.join(__dirname, 'preload.js'),
          contextIsolation: true, nodeIntegration: false }
      });
    } catch (e) { D.debugLog('수업 알림 창 실패: ' + e.message); return; }
    /* screen-saver 로 올려야 작업표시줄·다른 «항상 위» 창보다 앞에 온다 */
    try { w.setAlwaysOnTop(true, 'screen-saver'); } catch (e) { /* */ }
    try { w.setVisibleOnAllWorkspaces(true); } catch (e) { /* */ }
    w.loadFile(path.join(__dirname, 'alarm.html'),
      { query: { d: JSON.stringify(Object.assign({ first: i === 0 }, info)) } });
    w.once('ready-to-show', () => { try { w.show(); if (i === 0) w.focus(); } catch (e) { /* */ } });
    w.on('closed', () => { wins = wins.filter((x) => x !== w); });
    wins.push(w);
  });
}
function closeAll() {
  wins.slice().forEach((w) => { try { if (!w.isDestroyed()) w.close(); } catch (e) { /* */ } });
  wins = [];
}

/* ── «발표 중» 가늠하기 (윈도우만) ──
   맨 앞 창의 자리를 읽어 화면을 통째로 덮고 있으면 발표 중으로 본다.
   스크립트는 앱 폴더에 한 번 써 두고 -File 로 부른다(한 줄 명령은 따옴표가 깨진다). */
const PS = [
  '$ErrorActionPreference = "Stop"',
  'Add-Type -TypeDefinition @"',
  'using System;using System.Runtime.InteropServices;',
  'public class JvFg{',
  ' [StructLayout(LayoutKind.Sequential)] public struct R{public int L,T,Rg,B;}',
  ' [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();',
  ' [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out R x);',
  ' public static string Go(){ IntPtr h=GetForegroundWindow(); R x;',
  '  if(h==IntPtr.Zero || !GetWindowRect(h, out x)) return "";',
  '  return x.L+" "+x.T+" "+x.Rg+" "+x.B; }',
  '}',
  '"@',
  '[JvFg]::Go()'
].join('\n');

function psFile() {
  const p = path.join(D.userDataPath, 'presenting.ps1');
  try {
    if (!fs.existsSync(p) || fs.readFileSync(p, 'utf-8') !== PS) fs.writeFileSync(p, PS, 'utf-8');
    return p;
  } catch (e) { return ''; }
}

function presenting() {
  return new Promise((done) => {
    if (process.platform !== 'win32') return done(false);
    const f = psFile();
    if (!f) return done(false);
    let over = false;
    const kid = execFile('powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', f],
      { timeout: 3000, windowsHide: true },
      (err, out) => {
        if (over) return;
        over = true;
        if (err) return done(false);
        const m = String(out || '').trim().match(/^(-?\d+) (-?\d+) (-?\d+) (-?\d+)$/);
        if (!m) return done(false);
        const L = +m[1], T = +m[2], R = +m[3], B = +m[4];
        /* 어느 모니터든 그 화면을 꽉 덮고 있으면 발표 중 (테두리 몇 픽셀은 봐 준다) */
        const hit = D.screen.getAllDisplays().some((d) => {
          const b = d.bounds;
          return L <= b.x + 2 && T <= b.y + 2
            && R >= b.x + b.width - 2 && B >= b.y + b.height - 2;
        });
        done(hit);
      });
    kid.on('error', () => { if (!over) { over = true; done(false); } });
  });
}

/* ── 시험해 보기 ──
   다음 수업(없으면 오늘 첫 수업, 그것도 없으면 보기글)으로 지금 한 번 띄운다.
   «알렸다» 표시는 남기지 않아서 실제 알림에 영향이 없다. */
function test() {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const ls = todayLessons() || [];
  const nx = ls.filter((l) => l.at >= nowMin)[0] || ls[0];
  const l = nx || { p: 5, subject: '체육', grade: 3, cls: 2, start: '14:20',
    at: nowMin + 10, changed: false };
  show(l, Math.max(0, l.at - nowMin), 'test', true);
  return { ok: true, real: !!nx };
}

/* ── 켜고 끄기 ── */
function start() {
  stop();
  timer = setInterval(tick, 30 * 1000);
  setTimeout(() => { try { tick(); } catch (e) { D.debugLog('수업 알림 tick: ' + e.message); } }, 5000);
}
function stop() { if (timer) clearInterval(timer); timer = null; }

function register(deps) {
  D = deps;
  D.ipcMain.on('alarm-done', (_e, how, key) => {
    if (how === 'snooze' && key && key !== 'test') snooze[key] = Date.now() + 5 * 60 * 1000;
    if (how === 'widget') { try { D.showWidget(); } catch (e) { /* */ } }
    closeAll();
  });
  D.ipcMain.on('alarm-test', () => { try { test(); } catch (e) { D.debugLog('수업 알림 시험: ' + e.message); } });
  if (cfg().on) start();
  return { cfg: cfg, setCfg: setCfg, test: test, start: start, stop: stop, closeAll: closeAll,
    today: todayLessons, tick: tick, snooze: snooze };
}

module.exports = { register };
