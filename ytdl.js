// 파일명: ytdl.js | @version 1.0.0
// 영상 내려받기 — 도구상자의 «영상 내려받기» 뒤쪽(메인 프로세스). 지비스·혜원이지 공통.
//
// ★ 받아 주는 일은 오픈소스 «yt-dlp», 영상과 소리를 합치는 일은 «ffmpeg» 가 한다. 둘 다 설치 파일에 담겨 온다
//   (vendor/ → 설치된 resources/vendor/). 받을 때 따로 준비할 것이 없다.
// ★ 로그인이 필요한 영상(나이 제한·비공개·멤버십)은 지원하지 않는다 — 쿠키를 건드리지 않는다.
// ★ 화질은 1080p 까지(H.264 MP4). 소리만은 M4A.
// ★ 주소는 유튜브(youtube.com · youtu.be)만 받는다. 영상 ID 11자만 뽑아 «https://www.youtube.com/watch?v=ID» 로
//   다시 만들어 쓰므로 재생목록·시간·그 밖의 꼬리표는 모두 떨어진다. 프로그램은 셸 없이 인자 배열로만 부른다.
// ★ 학교 망의 보안 장비(SSL 검사)가 유튜브 통신을 가로채면 yt-dlp 의 인증서 확인이 실패한다(이 PC 에서 실측: ePrism SSL).
//   Windows 가 믿는 장비라면(= 앱 안의 크로미엄이 같은 주소를 정상으로 열면) 그때만 인증서 확인을 건너뛰고 다시 해 본다.
const path = require('path');
const fs = require('fs');
const cp = require('child_process');
const crypto = require('crypto');

let H = null;                      // main 이 넣어 주는 도우미: { app, ipcMain, dialog, shell, net, BrowserWindow, load, save, log, appLabel }
let job = null;                    // 받는 중인 일 하나 { child, tmp, canceled }
let trustSkip = false;             // 이번 실행 동안: 보안 장비 인증서를 믿고 확인을 건너뛰기로 했는가

/* ── 주소 → 영상 ID ── */
function parseVideo(input) {
  let u;
  try { u = new URL(String(input || '').trim()); } catch (e) { return null; }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
  const host = u.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '').replace(/^music\./, '');
  let id = '';
  if (host === 'youtu.be') id = u.pathname.split('/')[1] || '';
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (u.pathname === '/watch') id = u.searchParams.get('v') || '';
    else { const m = u.pathname.match(/^\/(shorts|embed|live|v)\/([^/?#]+)/); id = m ? m[2] : ''; }
  }
  return /^[A-Za-z0-9_-]{11}$/.test(id) ? { id, url: 'https://www.youtube.com/watch?v=' + id } : null;
}

/* ── 프로그램 자리 ── */
function vendorDir() {
  const packed = path.join(process.resourcesPath || '', 'vendor');
  if (process.resourcesPath && fs.existsSync(packed)) return packed;
  return path.join(__dirname, 'vendor');                         // 개발 중
}
function engineDir() { return path.join(H.app.getPath('userData'), 'yt'); }
function ytExe() {
  const up = path.join(engineDir(), 'yt-dlp.exe');               // «엔진 새로 받기» 로 받은 것이 있으면 그것이 앞선다
  if (fs.existsSync(up)) return up;
  return path.join(vendorDir(), 'yt-dlp.exe');
}
function ffDir() { return path.join(vendorDir(), 'ffmpeg'); }
function tmpRoot() { return path.join(H.app.getPath('userData'), 'yt-tmp'); }
function defaultDir() { return path.join(H.app.getPath('videos'), H.appLabel + ' 영상'); }
function saveDir() {
  const d = String((H.load() || {}).ytDir || '').trim();
  return d || defaultDir();
}

/* ── 실행 ── */
function baseArgs() {
  return ['--ignore-config', '--no-playlist', '--no-warnings', '--no-colors', '--encoding', 'utf-8',
    '--socket-timeout', '30', '--retries', '5', '--fragment-retries', '5'];
}
/* 프로그램을 돌려 stdout·stderr 를 모은다 — onLine 이 있으면 줄마다 알려 준다 */
function run(args, opt) {
  opt = opt || {};
  return new Promise((resolve) => {
    let child;
    try {
      child = cp.spawn(ytExe(), args, { windowsHide: true, env: Object.assign({}, process.env, { PYTHONIOENCODING: 'utf-8' }) });
    } catch (e) { resolve({ code: -1, out: '', err: String(e && e.message || e) }); return; }
    let out = '', err = '', buf = '';
    if (opt.hold) opt.hold(child);
    const timer = opt.timeout ? setTimeout(() => { try { child.kill(); } catch (e) { /* */ } }, opt.timeout) : null;
    child.stdout.on('data', (d) => {
      const s = d.toString('utf8'); out += s;
      if (opt.onLine) { buf += s; let i; while ((i = buf.indexOf('\n')) >= 0) { opt.onLine(buf.slice(0, i).replace(/\r$/, '')); buf = buf.slice(i + 1); } }
    });
    child.stderr.on('data', (d) => { err += d.toString('utf8'); if (err.length > 20000) err = err.slice(-20000); });
    child.on('error', (e) => { if (timer) clearTimeout(timer); resolve({ code: -1, out, err: err + String(e && e.message || e) }); });
    child.on('close', (code) => { if (timer) clearTimeout(timer); resolve({ code, out, err }); });
  });
}
const CERT_RE = /CERTIFICATE_VERIFY_FAILED|self[- ]signed certificate|unable to get local issuer/i;
/* 인증서 때문에 막히면 «이 PC(Windows)가 믿는 장비인가» 를 보고 한 번 더 */
async function osTrustsYoutube() {
  try {
    const r = await H.net.fetch('https://www.youtube.com/', { method: 'HEAD' });
    return r.status > 0;
  } catch (e) { return false; }
}
async function runSmart(args, opt) {
  const extra = trustSkip ? ['--no-check-certificates'] : [];
  let r = await run(extra.concat(args), opt);
  if (r.code !== 0 && !trustSkip && CERT_RE.test(r.err) && !(job && job.canceled)) {
    if (await osTrustsYoutube()) {
      trustSkip = true;
      H.log('영상 내려받기 — 학교 망 보안 장비 인증서를 Windows 가 믿어서, 이번 실행에서는 인증서 확인을 건너뜁니다');
      r = await run(['--no-check-certificates'].concat(args), opt);
    } else {
      r.err += '\n(이 PC 가 믿지 않는 인증서입니다 — 연결을 막았습니다)';
    }
  }
  return r;
}

/* 오류 글 → 선생님이 읽을 말 */
function friendly(err) {
  const t = String(err || '');
  const lines = t.split('\n').map((s) => s.trim()).filter(Boolean);
  const last = (lines.filter((s) => /^ERROR/.test(s)).pop() || lines.pop() || '').replace(/^ERROR:\s*(\[[^\]]+\]\s*[\w-]+:\s*)?/, '');
  if (/confirm your age|age[- ]restricted|inappropriate for some users/i.test(t)) return '나이 제한이 있는 영상이라 받을 수 없습니다(로그인이 필요합니다).';
  if (/not a bot/i.test(t)) return '유튜브가 «로봇이 아님 확인»을 요구해 받을 수 없습니다. 잠시 뒤 다시 시도해 주세요.';
  if (/Private video|members[- ]only|Join this channel|private/i.test(t)) return '비공개 또는 멤버십 영상은 받을 수 없습니다.';
  if (/live event|is live|will begin|Premiere/i.test(t)) return '생방송·프리미어 영상은 끝난 뒤에 받을 수 있습니다.';
  if (/Video unavailable|has been removed|not available in your country|no longer available|blocked it/i.test(t)) return '영상을 찾을 수 없습니다(삭제·비공개·지역 제한).';
  if (/HTTP Error 429|Too Many Requests/i.test(t)) return '요청이 너무 많습니다. 잠시 뒤 다시 시도해 주세요.';
  if (/Requested format is not available/i.test(t)) return '이 화질로는 받을 수 없습니다 — 다른 화질을 골라 보세요.';
  if (CERT_RE.test(t)) return '이 네트워크의 보안 인증서를 믿을 수 없어 연결하지 않았습니다.';
  if (/getaddrinfo|Temporary failure|Network is unreachable|timed out|Unable to download|urlopen error|Connection (reset|refused|aborted)/i.test(t)) return '인터넷에 연결하지 못했습니다. 연결을 확인하거나 학교 망이 막고 있지 않은지 확인해 주세요.';
  if (/ffmpeg/i.test(t) && /not found|No such file|not installed/i.test(t)) return '영상을 합치는 프로그램(ffmpeg)을 찾지 못했습니다 — 프로그램을 다시 설치해 주세요.';
  if (/HTTP Error 403|nsig|signature|Unable to extract|Sign in/i.test(t)) return '유튜브가 바뀌어 지금 엔진으로는 받지 못합니다 — «엔진 새로 받기» 를 눌러 보세요.';
  return '받지 못했습니다' + (last ? ' — ' + last.slice(0, 140) : '');
}

/* ── 영상 정보 ── */
async function info(url) {
  const v = parseVideo(url);
  if (!v) return { ok: false, msg: '유튜브 영상 주소가 아닙니다. 주소(https://www.youtube.com/watch?v=… 또는 https://youtu.be/…)를 붙여 넣어 주세요.' };
  if (!fs.existsSync(ytExe())) return { ok: false, msg: '내려받기 엔진(yt-dlp)이 없습니다 — «엔진 새로 받기» 를 눌러 주세요.' };
  const r = await runSmart(baseArgs().concat(['--skip-download', '-J', '--', v.url]), { timeout: 90000 });
  if (r.code !== 0) return { ok: false, msg: friendly(r.err) };
  let j;
  try { j = JSON.parse(r.out); } catch (e) { return { ok: false, msg: '영상 정보를 읽지 못했습니다.' }; }
  if (j.is_live || j.live_status === 'is_live' || j.live_status === 'is_upcoming') return { ok: false, msg: '생방송·예정 영상은 끝난 뒤에 받을 수 있습니다.' };
  const heights = Array.from(new Set((j.formats || []).filter((f) => f.vcodec && f.vcodec !== 'none' && f.height).map((f) => f.height))).sort((a, b) => b - a);
  return {
    ok: true, id: v.id, url: v.url, title: String(j.title || v.id), channel: String(j.uploader || j.channel || ''),
    duration: Number(j.duration) || 0, thumb: /^https:\/\//.test(j.thumbnail || '') ? j.thumbnail : '', heights,
    license: String(j.license || '')
  };
}

/* ── 받기 ── */
const FORMATS = {
  '1080': 'bv*[height<=1080][vcodec^=avc1]+ba[ext=m4a]/bv*[height<=1080]+ba/b[height<=1080]',
  '720': 'bv*[height<=720][vcodec^=avc1]+ba[ext=m4a]/bv*[height<=720]+ba/b[height<=720]',
  '480': 'bv*[height<=480][vcodec^=avc1]+ba[ext=m4a]/bv*[height<=480]+ba/b[height<=480]',
  audio: 'ba[ext=m4a]/ba'
};
function killTree(child) {
  if (!child || !child.pid) return;
  try { cp.spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true }); } catch (e) { try { child.kill(); } catch (x) { /* */ } }
}
function sendTo(wc, ch, payload) { try { if (wc && !wc.isDestroyed()) wc.send(ch, payload); } catch (e) { /* 창이 닫혔으면 그만 */ } }

async function get(e, o) {
  if (job) return { ok: false, msg: '이미 받는 중인 영상이 있습니다. 끝나면 다시 눌러 주세요.' };
  const v = parseVideo(o && o.url);
  if (!v) return { ok: false, msg: '유튜브 영상 주소가 아닙니다.' };
  const q = FORMATS[o && o.q] ? String(o.q) : '1080';
  const dir = saveDir();
  try { fs.mkdirSync(dir, { recursive: true }); fs.accessSync(dir, fs.constants.W_OK); }
  catch (er) { return { ok: false, msg: '저장 폴더를 쓸 수 없습니다 — 다른 폴더를 골라 주세요. (' + dir + ')' }; }
  const tmp = path.join(tmpRoot(), crypto.randomBytes(6).toString('hex'));
  fs.mkdirSync(tmp, { recursive: true });
  job = { child: null, tmp, canceled: false };
  const wc = e.sender;
  const prog = { stage: '준비하는 중…', pct: 0, speed: '', eta: '' };
  const seen = []; let finalFile = '';
  const push = () => sendTo(wc, 'yt-progress', { ok: true, stage: prog.stage, pct: prog.pct, speed: prog.speed, eta: prog.eta });
  push();
  const args = baseArgs().concat([
    '-f', FORMATS[q], '--merge-output-format', 'mp4/mkv',
    ...(q === 'audio' ? [] : []),
    '--ffmpeg-location', ffDir(), '--windows-filenames', '--trim-filenames', '140', '--no-mtime',
    '--concurrent-fragments', '4', '--no-overwrites',
    '-P', 'home:' + dir, '-P', 'temp:' + tmp, '-o', '%(title).100B.%(ext)s',
    '--newline', '--no-quiet', '--progress', '--no-simulate',
    '--progress-template', 'download:PROG|%(progress.status)s|%(progress._percent_str)s|%(progress._speed_str)s|%(progress._eta_str)s|%(info.format_id)s',
    '--print', 'after_move:DONE|%(filepath)s',
    '--', v.url
  ]);
  const onLine = (ln) => {
    let m;
    if ((m = ln.match(/^PROG\|([^|]*)\|\s*([\d.]+)%\|\s*([^|]*)\|\s*([^|]*)\|(.*)$/))) {
      const fid = m[5].trim();
      if (seen.indexOf(fid) < 0) seen.push(fid);
      const idx = seen.indexOf(fid), isAudioOnly = q === 'audio', pct = Math.min(100, Number(m[2]) || 0);
      if (isAudioOnly) { prog.stage = '소리 받는 중…'; prog.pct = pct; }
      else if (idx === 0) { prog.stage = '영상 받는 중…'; prog.pct = Math.round(pct * 0.9); }
      else { prog.stage = '소리 받는 중…'; prog.pct = Math.round(90 + pct * 0.08); }
      prog.speed = m[3].trim(); prog.eta = m[4].trim();
      push();
    } else if (/^\[Merger\]|^\[VideoRemuxer\]|^\[ExtractAudio\]|^\[Fixup/.test(ln)) {
      prog.stage = '합치는 중…'; prog.pct = 98; prog.speed = ''; prog.eta = ''; push();
    } else if ((m = ln.match(/^DONE\|(.+)$/))) {
      finalFile = m[1].trim();
    } else if (/has already been downloaded/.test(ln)) {
      const mm = ln.match(/\[download\]\s+(.+?) has already been downloaded/);
      if (mm) finalFile = mm[1].trim();
    }
  };
  let r;
  try {
    r = await runSmart(args, { onLine, hold: (c) => { job.child = c; } });
  } finally {
    const canceled = job && job.canceled;
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (er) { /* */ }
    job = null;
    if (canceled) { sendTo(wc, 'yt-progress', { ok: true, stage: '취소했습니다', pct: 0 }); return { ok: false, canceled: true, msg: '취소했습니다.' }; }
  }
  if (r.code !== 0) return { ok: false, msg: friendly(r.err) };
  if (!finalFile || !fs.existsSync(finalFile)) {
    /* 그래도 폴더에서 제일 새 파일을 찾아 본다 */
    try {
      const fresh = fs.readdirSync(dir).map((f) => ({ f, t: fs.statSync(path.join(dir, f)).mtimeMs })).sort((a, b) => b.t - a.t)[0];
      if (fresh && Date.now() - fresh.t < 10 * 60 * 1000) finalFile = path.join(dir, fresh.f);
    } catch (er) { /* */ }
  }
  if (!finalFile || !fs.existsSync(finalFile)) return { ok: false, msg: '받았다고 하는데 파일을 찾지 못했습니다 — 저장 폴더를 열어 확인해 주세요.' };
  const at = stampNow();
  const size = (() => { try { return fs.statSync(finalFile).size; } catch (er) { return 0; } })();
  const rec = { title: String(o.title || path.basename(finalFile, path.extname(finalFile))), file: finalFile, q, at, size };
  const hist = ((H.load() || {}).ytHist || []).filter((x) => x && x.file !== finalFile);
  hist.unshift(rec);
  H.save({ ytHist: hist.slice(0, 20) });
  H.log('영상 내려받기 — ' + path.basename(finalFile) + ' (' + q + ', ' + Math.round(size / 1048576) + 'MB)');
  return { ok: true, file: finalFile, name: path.basename(finalFile), size, at, hist: hist.slice(0, 20) };
}
function stampNow() {
  const t = new Date(), p = (n) => String(n).padStart(2, '0');
  return t.getFullYear() + '.' + p(t.getMonth() + 1) + '.' + p(t.getDate()) + ' ' + p(t.getHours()) + ':' + p(t.getMinutes()) + ':' + p(t.getSeconds());
}

/* ── 엔진 새로 받기 — 공식 릴리스 + SHA-256 확인 ── */
async function updateEngine() {
  if (job) return { ok: false, msg: '받는 중에는 바꿀 수 없습니다.' };
  const base = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/';
  try {
    const sums = await (await H.net.fetch(base + 'SHA2-256SUMS')).text();
    const line = sums.split(/\r?\n/).map((l) => l.trim().split(/\s+/)).filter((p) => p.length >= 2 && p[1].replace(/^\*/, '') === 'yt-dlp.exe')[0];
    if (!line) return { ok: false, msg: '공식 체크섬 목록에서 yt-dlp.exe 를 찾지 못했습니다.' };
    const res = await H.net.fetch(base + 'yt-dlp.exe');
    if (!res.ok) return { ok: false, msg: '내려받지 못했습니다(' + res.status + ').' };
    const buf = Buffer.from(await res.arrayBuffer());
    if (crypto.createHash('sha256').update(buf).digest('hex') !== line[0].toLowerCase()) return { ok: false, msg: '내려받은 파일이 공식 체크섬과 달라 쓰지 않았습니다.' };
    fs.mkdirSync(engineDir(), { recursive: true });
    const dest = path.join(engineDir(), 'yt-dlp.exe'), part = dest + '.new';
    fs.writeFileSync(part, buf);
    fs.renameSync(part, dest);
    const ver = await engineVersion();
    H.log('영상 내려받기 엔진 새로 받음 — ' + ver);
    return { ok: true, version: ver, at: stampNow() };
  } catch (e) { return { ok: false, msg: '엔진을 받지 못했습니다 — ' + String((e && e.message) || e).slice(0, 120) }; }
}
async function engineVersion() {
  if (!fs.existsSync(ytExe())) return '';
  const r = await run(['--version'], { timeout: 20000 });
  return r.code === 0 ? r.out.trim() : '';
}

function register(helpers) {
  H = helpers;
  const { ipcMain, dialog, shell } = H;
  const win = (e) => H.BrowserWindow.fromWebContents(e.sender) || undefined;
  ipcMain.handle('yt-state', async () => {
    const st = H.load() || {};
    return {
      ok: true, dir: saveDir(), hist: (st.ytHist || []).filter((x) => x && x.file && fs.existsSync(x.file)),
      engine: { ok: fs.existsSync(ytExe()), ffmpeg: fs.existsSync(path.join(ffDir(), 'ffmpeg.exe')), version: await engineVersion(), updated: ytExe().indexOf(engineDir()) === 0 },
      busy: !!job
    };
  });
  ipcMain.handle('yt-info', (_e, url) => info(url));
  ipcMain.handle('yt-get', (e, o) => get(e, o));
  ipcMain.handle('yt-cancel', () => { if (job) { job.canceled = true; killTree(job.child); } return { ok: true }; });
  ipcMain.handle('yt-engine-update', () => updateEngine());
  ipcMain.handle('yt-pick-dir', async (e) => {
    const r = await dialog.showOpenDialog(win(e), { title: '영상을 저장할 폴더', properties: ['openDirectory', 'createDirectory'], defaultPath: saveDir() });
    if (r.canceled || !r.filePaths.length) return { ok: true, canceled: true, dir: saveDir() };
    H.save({ ytDir: r.filePaths[0] });
    return { ok: true, dir: r.filePaths[0] };
  });
  ipcMain.handle('yt-open', (_e, o) => {
    try {
      if (o && o.what === 'file' && o.file && fs.existsSync(o.file)) { const st = H.load() || {}; if ((st.ytHist || []).some((x) => x.file === o.file)) { shell.showItemInFolder(o.file); return { ok: true }; } }
      if (o && o.what === 'open' && o.file && fs.existsSync(o.file)) { const st = H.load() || {}; if ((st.ytHist || []).some((x) => x.file === o.file)) { shell.openPath(o.file); return { ok: true }; } }
      fs.mkdirSync(saveDir(), { recursive: true });
      shell.openPath(saveDir());
      return { ok: true };
    } catch (er) { return { ok: false, msg: String((er && er.message) || er) }; }
  });
}
module.exports = { register, parseVideo, friendly, FORMATS };
