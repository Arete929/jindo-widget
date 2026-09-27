// 파일명: phonesync.js | @version 1.0.1
// 수정요약: v1.0.1 통신을 Node fetch 에서 httpx.js(Electron net)로 — 학교 망 SSL 검사 장비에 Node 통신이 막혀 "fetch failed" 로 아무것도 안 올라갔다.
// 이 PC 의 CPU·램과 Claude·Gemini 사용량을 «폰 앱»이 읽어 갈 수 있게 중계(구글 스크립트)에 올린다.
// ★ 지비스 전용(main.js 가 HAS_TT 일 때만 부른다). 중계 주소·열쇠는 코드에 없다 —
//   OneDrive 의 두 PC 공용 설정(shared.json 의 usageRelay {url,key}, usageNames {컴퓨터이름: 표시이름}) 에서 읽는다.
//   설정이 없으면 아무것도 안 한다.
// ★ 올리는 것은 숫자뿐이다: CPU·램 %, 사용량 % 와 초기화 시각. 계정(이메일)·글·쿠키는 안 보낸다.
//
// 언제 올리나
//   · CPU·램 — 10초마다 재고, 값이 눈에 띄게 바뀌었거나(CPU ±3, 램 ±2) 45초가 지났으면 올린다(«켜져 있다» 신호도 겸함)
//   · AI 사용량 — aiusage 가 값을 새로 읽을 때마다(1분에 한 번보다 자주는 안 올림)
//   · 끌 때 — 「꺼짐」 을 바로 알린다(못 보내도 폰이 45초 안 올라오면 꺼진 것으로 본다)

const os = require('os');
const httpx = require('./httpx.js');

const SAMPLE_MS = 10 * 1000;
const HEARTBEAT_MS = 45 * 1000;
const AI_MIN_GAP_MS = 60 * 1000;
const POST_TIMEOUT_MS = 20 * 1000;

let getCfg = () => null;
let getAi = () => null;
let log = () => {};
let timer = null;
let busy = false;
let lastCpu = null, lastRam = null, lastSysAt = 0;
let lastAiAt = 0;
let cpuPrev = null;
let failMsgAt = 0;

function cpuSnapshot() {
  let idle = 0, total = 0;
  os.cpus().forEach((c) => { for (const k in c.times) total += c.times[k]; idle += c.times.idle; });
  return { idle, total };
}
/* 지난번 잰 때부터의 CPU 사용률 — sysinfo.js 와 따로 재서 화면 쪽 값과 서로 방해하지 않는다 */
function cpuPercent() {
  const now = cpuSnapshot();
  if (!cpuPrev) { cpuPrev = now; return null; }
  const dI = now.idle - cpuPrev.idle, dT = now.total - cpuPrev.total;
  cpuPrev = now;
  if (dT <= 0) return null;
  return Math.max(0, Math.min(100, Math.round(100 * (1 - dI / dT))));
}
const GB = 1024 * 1024 * 1024;
const gb = (n) => Math.round((n / GB) * 10) / 10;

function devInfo(cfg) {
  const host = String(os.hostname() || 'PC');
  const id = host.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 24) || 'PC';
  let name = cfg && cfg.names && cfg.names[host];
  if (!name) name = /LG/i.test(host) ? 'LG 학교 PC' : (/asus/i.test(host) ? '아수스 노트북' : host.replace(/[^ -~]/g, '') || 'PC');   // «김진호LG15UG50S» 처럼 한글이 앞에 붙기도 한다
  return { dev: id, name: String(name).slice(0, 24) };
}

async function post(cfg, body) {
  /* ★ Node 의 fetch/https 는 학교 망의 SSL 검사 장비에 막힌다 — 앱의 다른 통신처럼 Electron net(httpx.js)을 쓴다 */
  const r = await httpx.request({
    method: 'POST', url: cfg.url, contentType: 'text/plain;charset=utf-8', timeout: POST_TIMEOUT_MS,
    body: JSON.stringify(Object.assign({ key: cfg.key }, devInfo(cfg), body))
  });
  try { return JSON.parse(r.text); } catch (e) { return { ok: false, msg: '응답이 JSON 이 아님(' + r.status + ')' }; }
}
function complain(msg) {
  const now = Date.now();
  if (now - failMsgAt > 10 * 60 * 1000) { failMsgAt = now; log('[폰 사용량] 올리기 실패 — ' + msg); }   // 10분에 한 번만 적는다
}

async function tick() {
  if (busy) return;
  const cfg = getCfg();
  if (!cfg || !cfg.url || !cfg.key) return;
  const cpu = cpuPercent();
  const total = os.totalmem(), used = total - os.freemem();
  const ram = Math.round((used / total) * 100);
  if (cpu == null) return;                                   // 첫 재기는 기준만 잡는다
  const now = Date.now();
  const changed = lastCpu == null || Math.abs(cpu - lastCpu) >= 3 || Math.abs(ram - lastRam) >= 2;
  if (!changed && now - lastSysAt < HEARTBEAT_MS) return;
  busy = true;
  try {
    const j = await post(cfg, { op: 'sys', cpu, cores: os.cpus().length, ram: { pct: ram, usedGb: gb(used), totalGb: gb(total) } });
    if (j && j.ok) { lastCpu = cpu; lastRam = ram; lastSysAt = now; } else complain((j && j.msg) || '알 수 없음');
  } catch (e) { complain(e.message || String(e)); }
  finally { busy = false; }
}

/* aiusage.snapshot() → 숫자만 남긴다 */
function slimAi(snap) {
  const out = {}; let any = false;
  ['claude', 'gemini', 'gpt'].forEach((k) => {
    const u = snap && snap[k]; if (!u) return;
    const w = (m) => (m && m.pct != null ? { pct: m.pct, resetAt: m.resetAt || null, resetRel: m.resetRel || null } : null);
    const o = { label: u.label || k, needsLogin: !!u.needsLogin, session: w(u.session), weekly: w(u.weekly), fable: w(u.fable) };
    if (o.needsLogin || o.session || o.weekly || o.fable) { out[k] = o; any = true; }
  });
  return any ? out : null;
}
async function publishAi() {
  const cfg = getCfg();
  if (!cfg || !cfg.url || !cfg.key) return;
  const now = Date.now();
  if (now - lastAiAt < AI_MIN_GAP_MS) return;
  const ai = slimAi(getAi());
  if (!ai) return;
  lastAiAt = now;
  try {
    const j = await post(cfg, { op: 'ai', ai });
    if (!(j && j.ok)) complain((j && j.msg) || '알 수 없음');
  } catch (e) { complain(e.message || String(e)); }
}
async function bye() {
  const cfg = getCfg();
  if (!cfg || !cfg.url || !cfg.key) return;
  try { await post(cfg, { op: 'bye' }); } catch (e) { /* 못 보내도 폰이 45초 뒤 꺼진 것으로 본다 */ }
}

/* opts = { getCfg: () => ({url,key,names}) | null, getAi: () => aiusage.snapshot(), log } */
function start(opts) {
  getCfg = (opts && opts.getCfg) || getCfg;
  getAi = (opts && opts.getAi) || getAi;
  log = (opts && opts.log) || log;
  if (timer) clearInterval(timer);
  cpuPercent();                                              // 기준 잡기
  timer = setInterval(() => { tick(); }, SAMPLE_MS);
}
function stop() { if (timer) { clearInterval(timer); timer = null; } }

module.exports = { start, stop, publishAi, bye, slimAi, devInfo };
