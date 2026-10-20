// 파일명: claudechat.js | @version 1.0.0 — 지비스 «Claude 채팅» 뒤쪽(지비스 전용, 메인 프로세스)
/* 이 PC 에 설치된 `claude`(Claude Code)를 화면 없이 돌려서 지비스 창에서 대화하게 한다.
     대화·이어하기·첨부·허용 묻기·원격 제어 모두 `claude` 가 하는 것이고, 여기서는 실행을 맡기고 이벤트를 전달할 뿐이다.
   ★ 계정은 `claude` 에 로그인된 그대로 — 지비스는 열쇠를 만지지 않는다.
   ★ 세션 목록은 이 PC 의 ~/.claude/projects/<폴더>/<세션ID>.jsonl 에서 읽는다(제목·마지막 질문·원격 제어 흔적은 파일 끝에 있다).
   ★ 파일 수정·명령 실행은 `claude` 가 묻고(control_request), 지비스 화면에서 허용/거절한다 — 여기서는 전달만.
   ★ 같은 세션을 다른 곳(Claude 앱 등)이 쓰는 중이면 이어하지 않고 «복사해서 이어가기» 를 권한다(기록이 갈라지는 것을 막으려고).
   이 모듈은 electron 없이도 돈다(시험용) — register() 만 electron 을 쓴다. */
const fs = require('fs');
const path = require('path');
const os = require('os');
const cp = require('child_process');

const HOME = os.homedir();
const PROJECTS = path.join(HOME, '.claude', 'projects');
const BUSY_MS = 90 * 1000;          // 이만큼 안에 파일이 바뀌었는데 우리가 돌린 게 아니면 «다른 곳에서 쓰는 중»
const HEAD_BYTES = 64 * 1024;
const TAIL_BYTES = 400 * 1024;

function claudeExe() {
  const p = path.join(HOME, '.local', 'bin', process.platform === 'win32' ? 'claude.exe' : 'claude');
  return fs.existsSync(p) ? p : 'claude';
}

/* ── 세션 목록 ── */
function readRange(fd, size, pos, n) {
  const len = Math.min(n, Math.max(0, size - pos)); if (len <= 0) return '';
  const b = Buffer.alloc(len); fs.readSync(fd, b, 0, len, pos);
  return b.toString('utf8');
}
function textOf(content) {
  if (typeof content === 'string') return content;
  return (Array.isArray(content) ? content : []).filter((c) => c && c.type === 'text').map((c) => c.text).join('\n');
}
const cache = new Map();            // 파일 → { m, s, info }
function sessionInfo(file, st) {
  const c = cache.get(file);
  if (c && c.m === st.mtimeMs && c.s === st.size) return c.info;
  const info = { id: path.basename(file, '.jsonl'), cwd: '', title: '', first: '', lastPrompt: '', remote: false, users: 0 };
  let fd;
  try {
    fd = fs.openSync(file, 'r');
    const head = readRange(fd, st.size, 0, HEAD_BYTES).split('\n');
    for (const l of head) {
      if (!l || l[0] !== '{') continue;
      let j; try { j = JSON.parse(l); } catch (e) { continue; }       // 잘린 마지막 줄은 건너뜀
      if (j.cwd && !info.cwd) info.cwd = j.cwd;
      if (j.type === 'user' && !j.isMeta && j.message && !j.toolUseResult) {
        const t = textOf(j.message.content).trim();
        if (t && !/^<(command|local-command|system-reminder)/.test(t)) { info.users++; if (!info.first) info.first = t; }
      }
      if (info.cwd && info.first) break;
    }
    const tail = readRange(fd, st.size, Math.max(0, st.size - TAIL_BYTES), TAIL_BYTES).split('\n');
    for (let i = tail.length - 1; i >= 0; i--) {
      const l = tail[i]; if (!l || l[0] !== '{') continue;
      let j; try { j = JSON.parse(l); } catch (e) { continue; }
      if (!info.title && j.type === 'custom-title' && j.customTitle) info.title = j.customTitle;
      if (!info.title && j.type === 'agent-name' && j.agentName) info.title = j.agentName;
      if (!info.lastPrompt && j.type === 'last-prompt' && j.lastPrompt) info.lastPrompt = j.lastPrompt;
      if (!info.cwd && j.cwd) info.cwd = j.cwd;
      if (!info.remote && j.type === 'bridge-session') info.remote = true;
      if (!info.users && j.type === 'user' && !j.isMeta && j.message && !j.toolUseResult && textOf(j.message.content).trim()) info.users = 1;   // 앞쪽에 첫 질문이 없는 큰 기록은 끝쪽에서 확인
      if (info.title && info.lastPrompt && info.cwd && info.users) break;
    }
  } catch (e) { /* 못 읽은 건 빈 정보 */ } finally { try { if (fd !== undefined) fs.closeSync(fd); } catch (e) { /* */ } }
  cache.set(file, { m: st.mtimeMs, s: st.size, info });
  return info;
}
function listSessions(opts) {
  const out = [], now = Date.now();
  let dirs = [];
  try { dirs = fs.readdirSync(PROJECTS); } catch (e) { return out; }
  dirs.forEach((d) => {
    const dir = path.join(PROJECTS, d);
    let files = [];
    try { files = fs.readdirSync(dir).filter((f) => /^[0-9a-f-]{36}\.jsonl$/i.test(f)); } catch (e) { return; }
    files.forEach((f) => {
      const file = path.join(dir, f);
      let st; try { st = fs.statSync(file); } catch (e) { return; }
      if (!st.size) return;
      const info = sessionInfo(file, st);
      if (!info.users) return;                                          // 대화가 없는 빈 세션은 뺀다
      if (/[\\/]Temp[\\/]claude[\\/]/i.test(info.cwd || '')) return;   // 시험용 임시 폴더
      out.push({
        id: info.id, cwd: info.cwd, dir: d, file, last: st.mtimeMs, size: st.size,
        /* «[LG]» 같은 말머리뿐인 제목은 이름을 안 붙인 세션이다 → 첫 질문(없으면 마지막 질문)을 제목으로 */
        title: (info.title && !/^\[[^\]]{1,12}\]$/.test(info.title.trim()) ? info.title : (info.first || info.lastPrompt || '').replace(/\s+/g, ' ').slice(0, 60)) || '(제목 없음)',
        lastPrompt: String(info.lastPrompt || '').replace(/\s+/g, ' ').slice(0, 100),
        remote: info.remote, busy: now - st.mtimeMs < BUSY_MS
      });
    });
  });
  out.sort((a, b) => b.last - a.last);
  return out.slice(0, (opts && opts.limit) || 120);
}
/* 이어하기 전에 화면에 깔 지난 대화(글만, 마지막 n 개) */
function history(file, n) {
  const out = [];
  let fd;
  try {
    const st = fs.statSync(file); fd = fs.openSync(file, 'r');
    const lines = readRange(fd, st.size, Math.max(0, st.size - 1500 * 1024), 1500 * 1024).split('\n');
    for (const l of lines) {
      if (!l || l[0] !== '{') continue;
      let j; try { j = JSON.parse(l); } catch (e) { continue; }
      if (j.isSidechain || j.isMeta) continue;
      if (j.type === 'user' && j.message && !j.toolUseResult) {
        const t = textOf(j.message.content).trim();
        if (t && !/^<(command|local-command|system-reminder|ide_)/.test(t)) out.push({ role: 'user', text: t.slice(0, 4000) });
      } else if (j.type === 'assistant' && j.message) {
        const t = textOf(j.message.content).trim();
        if (t) out.push({ role: 'assistant', text: t.slice(0, 8000) });
      }
    }
  } catch (e) { /* 못 읽으면 빈 목록 */ } finally { try { if (fd !== undefined) fs.closeSync(fd); } catch (e) { /* */ } }
  return out.slice(-(n || 30));
}

/* ── 실행 관리 ── */
const EDIT_TOOLS = ['Edit', 'Write', 'NotebookEdit'];
function createManager(emit, opts) {
  opts = opts || {};
  const procs = new Map();             // key → { child, key, id, cwd, remote, allowEdits, pending, buf }
  let seq = 0;
  const send = (e, line) => { try { if (e.child && !e.child.killed && e.child.stdin.writable) e.child.stdin.write(JSON.stringify(line) + '\n'); return true; } catch (err) { return false; } };
  function handle(e, j) {
    if (j.type === 'system' && j.subtype === 'init') {
      e.id = j.session_id || e.id; e.model = j.model || ''; e.mode = j.permissionMode || '';
      emit({ key: e.key, init: { id: e.id, cwd: j.cwd, model: e.model, mode: e.mode } });
      return;
    }
    if (j.type === 'control_request' && j.request) {
      const r = j.request;
      if (r.subtype === 'can_use_tool') {
        const tool = r.tool_name || '';
        if (e.allowEdits && EDIT_TOOLS.indexOf(tool) >= 0) {                     // «이번 대화는 파일 수정 계속 허용»
          send(e, { type: 'control_response', response: { subtype: 'success', request_id: j.request_id, response: { behavior: 'allow', updatedInput: r.input } } });
          emit({ key: e.key, auto: { tool, input: r.input } });
          return;
        }
        e.pending.set(j.request_id, r);
        emit({ key: e.key, perm: { id: j.request_id, tool, input: r.input, title: r.title || r.display_name || '', desc: r.description || '' } });
      } else {
        send(e, { type: 'control_response', response: { subtype: 'error', request_id: j.request_id, error: '지비스 채팅에서는 지원하지 않는 요청입니다' } });
      }
      return;
    }
    if (j.type === 'control_response') {            // remote_control 같은 우리가 보낸 요청의 답
      const rid = j.response && j.response.request_id, w = e.waiting && e.waiting.get(rid);
      if (w) { e.waiting.delete(rid); w(j.response); }
      return;
    }
    emit({ key: e.key, ev: j });
  }
  function open(o) {
    const key = 'c' + (++seq);
    if (!o.cwd || !fs.existsSync(o.cwd)) return { ok: false, msg: '그 폴더가 없습니다: ' + (o.cwd || '(비어 있음)') };
    const args = ['-p', '--input-format', 'stream-json', '--output-format', 'stream-json', '--verbose', '--include-partial-messages', '--permission-prompt-tool', 'stdio'];
    if (o.resume) args.push('--resume', o.resume);
    if (o.resume && o.fork) args.push('--fork-session');
    (opts.extraArgs || []).forEach((a) => args.push(a));
    let child;
    try { child = cp.spawn(opts.exe || claudeExe(), args, { cwd: o.cwd, windowsHide: true, env: Object.assign({}, process.env, { CLAUDE_CODE_ENTRYPOINT: 'jibis-chat' }) }); }
    catch (err) { return { ok: false, msg: '`claude` 를 시작하지 못했습니다 — ' + ((err && err.message) || err) }; }
    const e = { child, key, id: o.resume && !o.fork ? o.resume : '', cwd: o.cwd, remote: null, allowEdits: false, pending: new Map(), waiting: new Map(), buf: '', model: '', mode: '' };
    procs.set(key, e);
    child.stdout.on('data', (d) => {
      e.buf += d.toString('utf8'); let i;
      while ((i = e.buf.indexOf('\n')) >= 0) {
        const l = e.buf.slice(0, i).trim(); e.buf = e.buf.slice(i + 1); if (!l) continue;
        let j; try { j = JSON.parse(l); } catch (err) { continue; }
        try { handle(e, j); } catch (err) { emit({ key, err: String((err && err.message) || err) }); }
      }
    });
    child.stderr.on('data', (d) => { const t = d.toString('utf8').trim(); if (t) emit({ key, stderr: t.slice(0, 400) }); });
    child.on('error', (err) => emit({ key, err: String((err && err.message) || err) }));
    child.on('exit', (code) => { procs.delete(key); emit({ key, exit: code }); });
    return { ok: true, key };
  }
  function message(key, m) {
    const e = procs.get(key); if (!e) return { ok: false, msg: '이 대화는 이미 끝났습니다' };
    const content = [];
    (m.images || []).slice(0, 10).forEach((im) => {
      if (/^image\/(png|jpeg|gif|webp)$/.test(im.mediaType) && typeof im.data === 'string' && im.data.length < 14 * 1024 * 1024)
        content.push({ type: 'image', source: { type: 'base64', media_type: im.mediaType, data: im.data } });
    });
    let text = String(m.text || '');
    const files = (m.files || []).filter((f) => typeof f === 'string').slice(0, 20);
    if (files.length) text += (text ? '\n\n' : '') + '[첨부 파일 — 경로로 읽어 주세요]\n' + files.map((f) => '- ' + f).join('\n');
    content.push({ type: 'text', text: text || '(첨부만 보냄)' });
    return send(e, { type: 'user', message: { role: 'user', content } }) ? { ok: true } : { ok: false, msg: '보내지 못했습니다' };
  }
  function perm(key, id, behavior, o) {
    const e = procs.get(key); if (!e) return { ok: false };
    const r = e.pending.get(id); if (!r) return { ok: false, msg: '이미 처리된 요청입니다' };
    e.pending.delete(id);
    if (o && o.allowEdits && EDIT_TOOLS.indexOf(r.tool_name) >= 0) e.allowEdits = true;
    const body = behavior === 'allow'
      ? { behavior: 'allow', updatedInput: (o && o.input) || r.input }
      : { behavior: 'deny', message: (o && o.message) || '지비스 화면에서 거절했습니다' };
    send(e, { type: 'control_response', response: { subtype: 'success', request_id: id, response: body } });
    return { ok: true };
  }
  function ask(e, request, timeout) {
    return new Promise((resolve) => {
      const id = 'r' + (++seq);
      const t = setTimeout(() => { e.waiting.delete(id); resolve({ subtype: 'error', error: '답이 없습니다' }); }, timeout || 20000);
      e.waiting.set(id, (r) => { clearTimeout(t); resolve(r); });
      send(e, { type: 'control_request', request_id: id, request });
    });
  }
  async function remote(key, enabled) {
    const e = procs.get(key); if (!e) return { ok: false, msg: '이 대화는 실행 중이 아닙니다' };
    const r = await ask(e, { subtype: 'remote_control', enabled: !!enabled }, 30000);
    if (r.subtype === 'success') {
      const url = (r.response && r.response.session_url) || '';
      e.remote = enabled ? { url } : null;
      emit({ key, remote: { on: !!enabled, url } });
      return { ok: true, on: !!enabled, url };
    }
    return { ok: false, msg: String(r.error || '원격 제어를 바꾸지 못했습니다') };
  }
  function interrupt(key) { const e = procs.get(key); if (!e) return { ok: false }; send(e, { type: 'control_request', request_id: 'i' + (++seq), request: { subtype: 'interrupt' } }); return { ok: true }; }
  function stop(key) { const e = procs.get(key); if (!e) return { ok: true }; try { e.child.stdin.end(); } catch (err) { /* */ } setTimeout(() => { try { e.child.kill(); } catch (err) { /* */ } }, 1500); return { ok: true }; }
  function stopAll() { Array.from(procs.keys()).forEach((k) => { const e = procs.get(k); try { e.child.kill(); } catch (err) { /* */ } }); }
  function running() { return Array.from(procs.values()).map((e) => ({ key: e.key, id: e.id, cwd: e.cwd, remote: e.remote, model: e.model, mode: e.mode, allowEdits: e.allowEdits })); }
  return { open, message, perm, remote, interrupt, stop, stopAll, running };
}

/* 코딩 작업 폴더(OneDrive 아래 «!!@Claud CODE_작업폴더») — 새 대화의 기본 폴더 */
function findWorkDir() {
  try { const n = fs.readdirSync(HOME).filter((x) => /^OneDrive - /.test(x))[0]; if (!n) return ''; const p = path.join(HOME, n, '!!@Claud CODE_작업폴더'); return fs.existsSync(p) ? p : ''; } catch (e) { return ''; }
}

/* ── electron 연결 ── */
function register(deps) {
  const { ipcMain, dialog, getWin, debugLog } = deps;
  const log = debugLog || (() => {});
  const emit = (m) => { const w = getWin(); if (w && !w.isDestroyed()) { try { w.webContents.send('cc-event', m); } catch (e) { /* */ } } };
  const mgr = createManager(emit, { extraArgs: deps.extraArgs });   // extraArgs 는 시험용(예: 모델 지정)
  ipcMain.handle('cc-list', () => { try { const run = mgr.running(), l = listSessions(); const workDir = findWorkDir(); l.forEach((s) => { const r = run.filter((x) => x.id === s.id)[0]; if (r) { s.running = r.key; s.remoteOn = !!r.remote; s.busy = false; } }); return { ok: true, sessions: l, running: run, workDir }; } catch (e) { return { ok: false, msg: String((e && e.message) || e) }; } });
  ipcMain.handle('cc-history', (_e, file) => { try { const f = path.resolve(String(file || '')); if (!f.startsWith(PROJECTS) || !/\.jsonl$/.test(f)) return { ok: false }; return { ok: true, items: history(f, 30) }; } catch (e) { return { ok: false }; } });
  ipcMain.handle('cc-open', (_e, o) => { log('Claude 채팅 열기: ' + ((o && o.cwd) || '') + (o && o.resume ? ' (이어하기)' : '')); return mgr.open(o || {}); });
  ipcMain.handle('cc-send', (_e, key, m) => mgr.message(String(key), m || {}));
  ipcMain.handle('cc-perm', (_e, key, id, behavior, o) => mgr.perm(String(key), String(id), behavior === 'allow' ? 'allow' : 'deny', o));
  ipcMain.handle('cc-remote', (_e, key, on) => mgr.remote(String(key), !!on));
  ipcMain.handle('cc-interrupt', (_e, key) => mgr.interrupt(String(key)));
  ipcMain.handle('cc-stop', (_e, key) => mgr.stop(String(key)));
  ipcMain.handle('cc-pick-dir', async (e) => {
    try { const r = await dialog.showOpenDialog(getWin() || undefined, { title: '대화를 시작할 폴더 고르기', properties: ['openDirectory'] }); return r.canceled || !r.filePaths.length ? { ok: true, dir: '' } : { ok: true, dir: r.filePaths[0] }; }
    catch (err) { return { ok: false, msg: String((err && err.message) || err) }; }
  });
  ipcMain.handle('cc-pick-files', async () => {
    try { const r = await dialog.showOpenDialog(getWin() || undefined, { title: '붙일 파일 고르기', properties: ['openFile', 'multiSelections'] }); return { ok: true, files: r.canceled ? [] : r.filePaths }; }
    catch (err) { return { ok: false, files: [] }; }
  });
  return mgr;
}

module.exports = { register, createManager, listSessions, history, claudeExe, PROJECTS };
