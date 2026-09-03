// 파일명: aiusage.js | @version 1.100.0
// 클로드·제미나이 사용량을 위젯이 «직접» 읽어 온다.
//
// 어떻게 읽나
//   보이지 않는 창을 하나씩 띄워 claude.ai / gemini.google.com/usage 를 열고,
//   그 페이지 글자에서 «몇 % 썼는지»와 «언제 초기화되는지»를 긁는다.
//   로그인 쿠키는 서비스마다 다른 칸(partition)에 담아 서로 섞이지 않게 한다.
//
// ★ 페이지를 읽는 스크립트 네 개는 «AI 사용량 위젯»(Desktop/ai-usage-widget/main.js)에서
//   글자 그대로 옮겨 온 것이다 — 그쪽에 화면 구조 대응이 이미 다듬어져 있다.
//   손으로 베끼면 정규식 역슬래시가 어긋나기 쉬워서, 만들 때 스크립트로 떼어 왔다.
//   딱 한 군데만 고쳤다: 원본은 «1시간 39분 후»를 절대시각으로 바꾸며 원래 문구를 버리는데,
//   우리는 남은 시간과 초기화 시각을 둘 다 보여야 해서 원래 문구를 resetRel 로 남긴다.
//   저쪽 스크립트가 바뀌면 여기도 같이 맞춰 주는 편이 좋다.

const { BrowserWindow } = require('electron');

const POLL_TIMEOUT_MS = 25 * 1000;

const CLAUDE_EXTRACT_SCRIPT = `(function(){
  const text = document.body.innerText || '';
  // 로그인한 계정 이메일을 찾는다 — 계정 버튼의 aria-label/title에 있는 경우를 먼저 보고,
  // 없으면 화면에 보이는 텍스트 전체에서 이메일 형태를 찾는다. support@ 같은 안내용 주소는 제외.
  function findAccountEmail() {
    try {
      const re = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}/;
      const blocked = /^(support|help|privacy|legal|press|security|admin|no-?reply|abuse|feedback|billing|sales|info|contact|hello|team|noreply)@/i;
      const candidates = document.querySelectorAll('[aria-label*="@"], [title*="@"]');
      for (const el of candidates) {
        const attr = el.getAttribute('aria-label') || el.getAttribute('title') || '';
        const m = attr.match(re);
        if (m && !blocked.test(m[0])) return m[0];
      }
      const all = text.match(new RegExp(re.source, 'g')) || [];
      for (const em of all) {
        if (!blocked.test(em)) return em;
      }
    } catch (e) { /* 무시 */ }
    return null;
  }
  function grab(label) {
    const m = text.match(new RegExp(label + '\\\\s*\\\\n([^\\\\n]+)\\\\s*\\\\n(\\\\d+)%\\\\s*(?:사용됨|used)', 'i'));
    return m ? { reset: m[1].trim(), pct: parseInt(m[2], 10) } : null;
  }
  // claude.ai가 5시간 세션 재설정 시각을 "1시간 39분 후"처럼 상대 시간으로만 보여주는데,
  // 위젯은 KST 절대 날짜/시간으로 보고 싶다는 요청이 있어 여기서 직접 계산한다.
  // 위젯이 실행되는 PC의 시계가 곧 KST(사용자 시간대)라는 전제 — 별도 타임존 변환은 필요 없다.
  // 파싱 못하는 문구(형식이 바뀌었거나 이미 절대시간인 경우 등)를 만나면 원래 문구를 그대로 둔다.
  function toAbsoluteKST(relativeText) {
    if (!relativeText) return relativeText;
    const dayM = relativeText.match(/(\\d+)\\s*(?:일|days?)/i);
    const hourM = relativeText.match(/(\\d+)\\s*(?:시간|hours?|hrs?)/i);
    const minM = relativeText.match(/(\\d+)\\s*(?:분|minutes?|mins?)/i);
    const days = dayM ? parseInt(dayM[1], 10) : 0;
    const hours = hourM ? parseInt(hourM[1], 10) : 0;
    const mins = minM ? parseInt(minM[1], 10) : 0;
    const totalMs = days * 86400000 + hours * 3600000 + mins * 60000;
    if (!totalMs) return relativeText;
    const target = new Date(Date.now() + totalMs);
    const dow = ['일', '월', '화', '수', '목', '금', '토'][target.getDay()];
    const ampm = target.getHours() < 12 ? '오전' : '오후';
    let h12 = target.getHours() % 12;
    if (h12 === 0) h12 = 12;
    const mm = String(target.getMinutes()).padStart(2, '0');
    return (target.getMonth() + 1) + '월 ' + target.getDate() + '일(' + dow + ') ' + ampm + ' ' + h12 + ':' + mm;
  }
  const session = grab('(?:현재\\\\s*세션|Current\\\\s*session)');
  if (session) { session.resetRel = session.reset; session.reset = toAbsoluteKST(session.reset); }
  const weekly = grab('(?:모든\\\\s*모델|All\\\\s*models)');
  if (weekly) { weekly.resetRel = weekly.reset; weekly.reset = toAbsoluteKST(weekly.reset); }
  const fable = grab('Fable');
  const hasLoginForm = !!document.querySelector('input[type="password"], input[name="email"]') ||
    /계속하려면 로그인|Continue with|Log in to Claude|로 계속하기|로그인 또는 회원가입|빠르게 생각하고/i.test(text);
  return {
    ok: !!(session && weekly),
    needsLogin: !session && !weekly && hasLoginForm,
    session: session,
    weekly: weekly,
    fable: fable,
    account: findAccountEmail()
  };
})()`;

const CLAUDE_LOGIN_CHECK_SCRIPT = `(!location.href.includes('/login') && (
  !!document.querySelector('div[contenteditable="true"], textarea') ||
  /안녕하세요/.test(document.body.innerText || '')
))`;

const GEMINI_EXTRACT_SCRIPT = `(function(){
  const text = document.body.innerText || '';
  // 로그인한 계정 이메일을 찾는다 — Google 계정 아바타 버튼은 보통 aria-label에 이메일이 있고,
  // 없으면 화면에 보이는 텍스트 전체에서 이메일 형태를 찾는다. support@ 같은 안내용 주소는 제외.
  function findAccountEmail() {
    try {
      const re = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}/;
      const blocked = /^(support|help|privacy|legal|press|security|admin|no-?reply|abuse|feedback|billing|sales|info|contact|hello|team|noreply)@/i;
      const candidates = document.querySelectorAll('[aria-label*="@"], [title*="@"]');
      for (const el of candidates) {
        const attr = el.getAttribute('aria-label') || el.getAttribute('title') || '';
        const m = attr.match(re);
        if (m && !blocked.test(m[0])) return m[0];
      }
      const all = text.match(new RegExp(re.source, 'g')) || [];
      for (const em of all) {
        if (!blocked.test(em)) return em;
      }
    } catch (e) { /* 무시 */ }
    return null;
  }
  function findLabel(labels) {
    for (const label of labels) {
      const i = text.search(new RegExp(label, 'i'));
      if (i !== -1) return i;
    }
    return -1;
  }
  function block(startLabels, endLabels) {
    const s = findLabel(startLabels);
    if (s === -1) return '';
    const from = s + 4;
    let e = endLabels ? findLabel(endLabels) : -1;
    if (e === -1 || e <= from) e = from + 400;
    return text.slice(from, e);
  }
  function parse(blockText) {
    const pctM = blockText.match(/(\\d+)%\\s*(?:사용됨|used)/i);
    const resetM = blockText.match(/([^\\n]*(?:초기화|[Rr]esets?[^\\n]*))/);
    if (!pctM) return null;
    return { pct: parseInt(pctM[1], 10), reset: resetM ? resetM[1].trim() : '' };
  }
  const SESSION_LABELS = ['현재 사용량', 'Current usage'];
  const WEEKLY_LABELS = ['주간 한도', 'Weekly limit'];
  const session = parse(block(SESSION_LABELS, WEEKLY_LABELS));
  const weekly = parse(block(WEEKLY_LABELS, null));
  const hasLoginForm = !session && !weekly &&
    /Sign in|로그인|Google 계정으로 로그인/i.test(text);
  return {
    ok: !!(session && weekly),
    needsLogin: !session && !weekly && hasLoginForm,
    session: session,
    weekly: weekly,
    fable: null,
    account: findAccountEmail()
  };
})()`;

const GEMINI_LOGIN_CHECK_SCRIPT = `(function(){
  try {
    if (location.href.includes('accounts.google.com')) return false;
    var text = document.body.innerText || '';
    if (/Sign\\s*in|로그인|Google\\s*계정으로 로그인|개인 AI 어시스턴트인 Gemini를 만나 보세요/i.test(text)) return false;
    return !!document.querySelector('rich-textarea, div[contenteditable="true"], textarea');
  } catch (e) { return false; }
})()`;

const GPT_EXTRACT_SCRIPT = `(function(){
  const text = document.body.innerText || '';
  function email() {
    try {
      const re = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}/;
      const blocked = /^(support|help|privacy|legal|security|admin|no-?reply|billing|sales|info|contact)@/i;
      const all = text.match(new RegExp(re.source, 'g')) || [];
      for (const em of all) if (!blocked.test(em)) return em;
    } catch (e) {}
    return null;
  }
  // 흔한 꼴들을 두루 찾아본다 —
  //   «12 / 160 messages» · «45% used» · «160개 중 12개»
  function pick() {
    let m = text.match(/(\\d+)\\s*%\\s*(?:used|사용)/i);
    if (m) return { pct: parseInt(m[1], 10) };
    m = text.match(/(\\d+)\\s*\\/\\s*(\\d+)\\s*(?:messages|메시지)/i);
    if (m) {
      const a = parseInt(m[1], 10), b = parseInt(m[2], 10);
      if (b > 0) return { pct: Math.round(a / b * 100), note: a + ' / ' + b };
    }
    m = text.match(/(\\d+)\\s*(?:개|건)?\\s*중\\s*(\\d+)/);
    if (m) {
      const b = parseInt(m[1], 10), a = parseInt(m[2], 10);
      if (b > 0) return { pct: Math.round(a / b * 100), note: a + ' / ' + b };
    }
    return null;
  }
  function resetOf() {
    const m = text.match(/(?:resets?|재설정|초기화)[^\\n]{0,40}/i);
    return m ? m[0].trim().slice(0, 40) : '';
  }
  const got = pick();
  if (!got) {
    // 못 읽었을 때 — 무엇이 보였는지 조금 남긴다(다음에 맞추려고)
    return { ok: false, unread: true, account: email(),
             seen: text.replace(/\\s+/g, ' ').slice(0, 240) };
  }
  return { ok: true, account: email(),
           session: { pct: got.pct, reset: resetOf() || (got.note || '') } };
})()`;

const GPT_LOGIN_CHECK_SCRIPT = `(function(){
  try {
    const t = document.body.innerText || '';
    if (/Log\\s*in|Sign\\s*up|로그인|시작하기/i.test(t) && !/Settings|설정/i.test(t)) return false;
    return true;
  } catch (e) { return false; }
})()`;

/* ── 결제 화면 읽기(클로드) ──────────────────────────────────
   «설정 → 결제» 페이지 글자에서 플랜·다음 결제일(또는 취소 예정일)·사용 크레딧 잔액만 긁는다.
   ★ 카드 번호 같은 것은 보지도 담지도 않는다.
   ★ 함수를 통째로 문자열로 바꿔 페이지에 넣는다 — 템플릿 문자열 안에서 역슬래시를
     두 겹으로 쓰다 틀리는 일이 잦아서(실제로 여러 번), 그냥 진짜 함수로 적는다. */
function claudeBillingExtract() {
  var text = document.body.innerText || '';
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var ymd = function (m) { return m ? (m[1] + '.' + pad(m[2]) + '.' + pad(m[3])) : ''; };
  var K = '(\\d{4})년\\s*(\\d{1,2})월\\s*(\\d{1,2})일';
  var out = { ok: false, plan: '', kind: '', date: '', credit: '', invoiceDate: '', invoiceAmt: '' };
  var planM = text.match(/(맥스|Max|프로|Pro|무료|Free|팀|Team)\s*(?:플랜|plan)/i);
  if (planM) {
    out.plan = planM[1].replace(/^Max$/i, '맥스').replace(/^Pro$/i, '프로')
      .replace(/^Free$/i, '무료').replace(/^Team$/i, '팀');
  }
  var m = text.match(new RegExp('구독이\\s*' + K + '에\\s*취소될\\s*예정'));
  if (m) { out.kind = '취소'; out.date = ymd(m); }
  if (!out.date) {
    m = text.match(new RegExp('(?:갱신|다음\\s*결제|renew\\w*|next\\s*billing)[^\\n]{0,40}?' + K, 'i'));
    if (m) { out.kind = '갱신'; out.date = ymd(m); }
  }
  if (!out.date) {
    var MO = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august',
      'september', 'october', 'november', 'december'];
    var E = text.match(/(renews?|cancel\w*|billing)[^\n]{0,60}?(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s*(\d{4})/i);
    if (E) {
      out.kind = /cancel/i.test(E[1]) ? '취소' : '갱신';
      out.date = E[4] + '.' + pad(MO.indexOf(E[2].toLowerCase()) + 1) + '.' + pad(E[3]);
    }
  }
  var c = text.match(/US\$\s*([\d,]+(?:\.\d+)?)\s*\n\s*(?:현재\s*잔액|Current\s*balance)/i);
  if (c) out.credit = 'US$' + c[1];
  var inv = text.split(/청구서|Invoices/i)[1] || '';
  var im = inv.match(new RegExp(K));
  var ia = inv.match(/-?US\$\s*[\d,]+(?:\.\d+)?/);
  if (im) out.invoiceDate = ymd(im);
  if (ia) out.invoiceAmt = ia[0].replace(/\s+/g, '');
  out.ok = !!(out.plan || out.date || out.credit);
  return out;
}
const CLAUDE_BILLING_SCRIPT = '(' + claudeBillingExtract.toString() + ')()';

const PROVIDERS = {
  claude: {
    key: 'claude',
    label: 'Claude',
    partition: 'persist:claudeusage',
    loginUrl: 'https://claude.ai/login',
    usageUrl: () => `https://claude.ai/new?_w=${Date.now()}#settings/usage`,
    extract: CLAUDE_EXTRACT_SCRIPT,
    loginCheck: CLAUDE_LOGIN_CHECK_SCRIPT,
    settle: 2600,
    // 결제일·크레딧 — 하루 한 번 «설정 → 결제» 를 따로 읽는다
    billingUrl: () => `https://claude.ai/settings/billing?_w=${Date.now()}`,
    billing: CLAUDE_BILLING_SCRIPT,
    billingSettle: 3500
  },
  gemini: {
    key: 'gemini',
    label: 'Gemini',
    partition: 'persist:geminiusage',
    loginUrl: 'https://gemini.google.com/app',
    usageUrl: () => `https://gemini.google.com/usage?_w=${Date.now()}`,
    extract: GEMINI_EXTRACT_SCRIPT,
    loginCheck: GEMINI_LOGIN_CHECK_SCRIPT,
    settle: 2600
  },
  // ★ ChatGPT 는 «남은 양» 화면이 클로드·제미나이만큼 또렷하지 않다.
  //   설정 → 사용량을 열어 흔한 꼴을 찾아보고, 못 찾으면 솔직히 «못 읽었다» 고 한다.
  gpt: {
    key: 'gpt',
    label: 'ChatGPT',
    partition: 'persist:gptusage',
    loginUrl: 'https://chatgpt.com/auth/login',
    usageUrl: () => `https://chatgpt.com/#settings/Usage?_w=${Date.now()}`,
    extract: GPT_EXTRACT_SCRIPT,
    loginCheck: GPT_LOGIN_CHECK_SCRIPT,
    settle: 3200
  }
};
const KEYS = Object.keys(PROVIDERS);

const wins = {};        // 보이지 않는 일꾼 창
const last = {};        // 마지막으로 «성공한» 값 — 잠깐 실패했다고 지우지 않는다
const busy = {};        // 지금 읽는 중인가
const loggingIn = {};   // 로그인 창을 띄워 둔 동안은 일꾼 창을 건드리지 않는다
let onChange = () => {};

function log() { /* main 에서 갈아끼운다 */ }
let debug = log;
function setLogger(fn) { debug = fn || log; }
function onUpdate(fn) { onChange = fn || (() => {}); }

function worker(key) {
  const p = PROVIDERS[key];
  if (wins[key] && !wins[key].isDestroyed()) return wins[key];
  const w = new BrowserWindow({
    show: false,
    width: 1180,
    height: 900,
    webPreferences: { partition: p.partition, backgroundThrottling: false }
  });
  w.on('closed', () => { wins[key] = null; loggingIn[key] = false; });
  wins[key] = w;
  return w;
}

/* ── 초기화 시점을 «시각»으로 바꿔 둔다 ──────────────────────────
   화면에서 남은 시간을 계속 세어 보여주려면 «몇 분 남았다»가 아니라
   «언제 초기화된다»를 알아야 한다. 창을 켜 둔 채 시간이 흐르기 때문이다.
   서비스마다 문구가 달라서 두 가지를 다 본다.
     클로드   «1시간 39분 후»  → 지금부터 그만큼 뒤
     제미나이 «오후 10:00에 초기화» → 오늘(이미 지났으면 내일) 그 시각 */
function relMs(t) {
  if (!t) return 0;
  const d = String(t).match(/(\d+)\s*(?:일|days?)/i);
  const h = String(t).match(/(\d+)\s*(?:시간|hours?|hrs?)/i);
  const m = String(t).match(/(\d+)\s*(?:분|minutes?|mins?)/i);
  return (d ? +d[1] : 0) * 86400000 + (h ? +h[1] : 0) * 3600000 + (m ? +m[1] : 0) * 60000;
}
function clockAt(t) {
  const m = String(t || '').match(/(오전|오후|AM|PM)?\s*(\d{1,2})\s*:\s*(\d{2})\s*(AM|PM)?/i);
  if (!m) return null;
  let h = Number(m[2]);
  const ap = (m[1] || m[4] || '').toUpperCase();
  if (ap === '오후' || ap === 'PM') { if (h < 12) h += 12; }
  if (ap === '오전' || ap === 'AM') { if (h === 12) h = 0; }
  const now = new Date();
  const at = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, Number(m[3]), 0, 0);
  if (at.getTime() <= now.getTime()) at.setDate(at.getDate() + 1);   // 이미 지났으면 내일 그 시각
  return at.getTime();
}
function enrich(x) {
  if (!x) return x;
  const ms = relMs(x.resetRel || x.reset);
  x.resetAt = ms ? Date.now() + ms : clockAt(x.reset);
  return x;
}

function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }
function withTimeout(promise, ms, what) {
  return Promise.race([
    promise,
    new Promise((_, bad) => setTimeout(() => bad(new Error(what + ' 시간 초과')), ms))
  ]);
}

/* ── 결제 정보는 하루 한 번만 ─────────────────────────────────
   창을 하나 더 여는 셈이라 매번 읽으면 갱신이 2~3초 늦는다. 20시간 지나면 다시 읽는다.
   못 읽으면 지난 값을 그대로 두고 «못 읽었다» 만 적어 둔다. */
const BILL_TTL_MS = 20 * 3600 * 1000;
async function readBilling(key, w) {
  const p = PROVIDERS[key];
  if (!p.billingUrl || !last[key] || !last[key].ok) return;
  const prev = last[key].billing;
  if (prev && prev.at && !prev.error && Date.now() - prev.at < BILL_TTL_MS) return;
  try {
    await withTimeout((async () => {
      await w.loadURL(p.billingUrl());
      let got = null;
      for (let i = 0; i < 4; i++) {
        await wait(i === 0 ? p.billingSettle : 800);
        got = await w.webContents.executeJavaScript(p.billing);
        if (got && got.ok) break;
      }
      if (got && got.ok) {
        got.at = Date.now();
        last[key].billing = got;
        debug(`[사용량:${key}] 결제 정보 읽음 — ${got.plan || ''} ${got.kind || ''} ${got.date || ''} ${got.credit || ''}`);
      } else {
        last[key].billing = Object.assign({}, prev || {}, { error: '결제 화면을 못 읽음' });
        debug(`[사용량:${key}] 결제 화면을 못 읽음 — 지난 값 유지`);
      }
    })(), 20000, p.label + ' 결제');
  } catch (e) {
    last[key].billing = Object.assign({}, prev || {}, { error: String((e && e.message) || e) });
    debug(`[사용량:${key}] 결제 정보 — ${(e && e.message) || e}`);
  }
}

/* 한 곳을 읽는다. 잠깐 실패하면 마지막 값을 그대로 둔다 —
   화면이 갑자기 텅 비어 보이는 것보다 조금 지난 값이 낫다. */
async function poll(key) {
  if (busy[key] || loggingIn[key]) return;
  busy[key] = true;
  const p = PROVIDERS[key];
  const w = worker(key);
  try {
    await withTimeout((async () => {
      await w.loadURL(p.usageUrl());
      // 값이 자리를 잡을 때까지 조금 기다렸다가, 두 번 연속 같은 값이 나오면 그것으로 본다
      let prev = null, got = null;
      for (let i = 0; i < 6; i++) {
        await wait(i === 0 ? p.settle : 700);
        got = await w.webContents.executeJavaScript(p.extract);
        const now = JSON.stringify(got);
        if (got && got.ok && now === prev) break;
        prev = now;
      }
      if (got && (got.ok || got.needsLogin)) {
        got.at = Date.now();
        enrich(got.session); enrich(got.weekly); enrich(got.fable);
        got.billing = (last[key] && last[key].billing) || null;   // 결제 정보는 이어받는다
        last[key] = got;
        debug(`[사용량:${key}] ${got.ok ? '읽음' : '로그인 필요'}`);
      } else {
        debug(`[사용량:${key}] 이번엔 못 읽음 — 지난 값 유지`);
      }
    })(), POLL_TIMEOUT_MS, p.label);
    await readBilling(key, w);          // 결제일 — 하루 한 번만, 사용량과 따로 시한을 잰다
  } catch (e) {
    debug(`[사용량:${key}] ${(e && e.message) || e}`);
    try { if (w && !w.isDestroyed()) w.webContents.stop(); } catch (_) { /* 무시 */ }
  } finally {
    busy[key] = false;
    // 다 읽고 나면 빈 페이지로 돌려놔서 뒤에서 계속 돌아가는 일이 없게 한다
    if (!loggingIn[key] && wins[key] && !wins[key].isDestroyed()) {
      wins[key].loadURL('about:blank').catch(() => { /* 무시 */ });
    }
    onChange(snapshot());
  }
}

async function pollAll(keys) {
  await Promise.all((keys || KEYS).map(poll));
}

/* 로그인 — 일꾼 창을 그대로 띄워서 사람이 직접 로그인하게 한다.
   로그인이 끝난 것이 확인되면 창을 감추고 바로 한 번 읽는다. */
function openLogin(key) {
  const p = PROVIDERS[key];
  if (!p) return;
  const w = worker(key);
  loggingIn[key] = true;
  w.setTitle(`${p.label} 로그인 — 끝나면 이 창은 저절로 닫힙니다`);
  w.show();
  w.focus();
  w.loadURL(p.loginUrl);
  const timer = setInterval(async () => {
    if (!wins[key] || wins[key].isDestroyed()) { clearInterval(timer); return; }
    let ok = false;
    try { ok = await w.webContents.executeJavaScript(p.loginCheck); } catch (_) { ok = false; }
    if (!ok) return;
    clearInterval(timer);
    loggingIn[key] = false;
    try { w.hide(); } catch (_) { /* 무시 */ }
    debug(`[사용량:${key}] 로그인 확인 — 바로 읽습니다`);
    poll(key);
  }, 1500);
  // 사람이 창을 그냥 닫아도 잠금이 풀리게 한다
  w.once('closed', () => { clearInterval(timer); loggingIn[key] = false; });
}

function snapshot() {
  const out = {};
  KEYS.forEach((k) => {
    out[k] = last[k] ? Object.assign({ label: PROVIDERS[k].label }, last[k])
      : { label: PROVIDERS[k].label, ok: false, needsLogin: false, loading: !!busy[k] };
  });
  return out;
}

function stop() {
  KEYS.forEach((k) => {
    if (wins[k] && !wins[k].isDestroyed()) { try { wins[k].destroy(); } catch (_) { /* 무시 */ } }
    wins[k] = null;
  });
}

/* 끈 것의 숨은 창을 접는다 — 램을 돌려받는다.
   ★ 켜 둔 것(keep)만 남긴다. 로그인 창이 떠 있는 것은 건드리지 않는다. */
function prune(keep) {
  const k2 = keep || [];
  KEYS.forEach((k) => {
    if (k2.indexOf(k) >= 0) return;
    if (loggingIn[k]) return;                    // 사람이 로그인하는 중이면 그대로
    if (wins[k] && !wins[k].isDestroyed()) {
      try { wins[k].destroy(); } catch (_) { /* 무시 */ }
      debug(`[사용량:${k}] 꺼짐 — 숨은 창을 접었습니다`);
    }
    wins[k] = null;
  });
}

module.exports = { KEYS, PROVIDERS, poll, pollAll, openLogin, snapshot, stop, prune, setLogger, onUpdate };
