// 파일명: main.js | @version 1.104.0
// 수정요약: v1.104.0 틱틱 팔레트를 키보드로 — !높/^혜 처럼 이어 치면 걸러지고 Enter 로 고름, ↑↓ 옮기기, Esc 닫기 / v1.103.0 틱틱 입력칸에서 !·^ 를 치는 순간 우선순위·보관함 단추가 뜸(고르면 글자 지워지고 칩, Esc 닫기) — 칩 줄 위임 배선 / v1.102.1 틱틱 줄의 날짜·우선순위·보관함 칩이 밋밋한 글자로 보이던 것(.tdb 규칙이 덮음) — 버튼처럼 테두리·손가락 커서, 우선순위 없음은 «!없음» / v1.102.0 틱틱 완료함 — 위젯·틱틱 앱에서 완료한 것을 장부에 적어 접힌 «완료 N» 으로 보이고 복원·하나 지우기·전부 지우기(두 번) / v1.101.1 틱틱 마감일이 하루 이르게 보이던 것(UTC 문자열 자르기 → 현지 날짜) / v1.101.0 틱틱 손질 — 줄마다 날짜말·보관함·우선순위, 단축키(!높음 ^보관함 내일), 날짜·우선순위·보관함 팔레트(달력 포함), 지우기(두 번), 정렬, 목록 고르면 전체로 자동 전환 / v1.100.2 결제 크레딧 잔액이 늦게 그려져 비어 오던 것(잔액까지 기다림) / v1.100.1 틱틱 기본함을 /project/inbox/data 로 곧장 읽음(만들었다 지우는 우회 제거 — 그 길은 Unknown exception) / v1.100.0 클로드 결제 정보(플랜·다음 결제/취소 예정일 D-day·크레딧 잔액) 하루 1회 읽어 사용량 아래 표시 + 틱틱 기본함(Inbox) 목록에 포함 + 혜원이지 동시 배포 / v1.99.0 내 바로가기 «담기»→«저장», 저장하면 곧바로 타일로 보이고 저장시각(KST) 표시·기억 / v1.98.0 런처보드 머리줄에 «＋ 담기»(앱 고치기 없이 한 번에) + 없는 단추를 가리키던 안내문 정리 / v1.97.1 런처보드 담기가 한 번 미끄러지면 조용히 잠긴 채 남던 문제(잠금 항상 해제·40초 시한·까닭 표시) / v1.97.0 학년부 일지 세부사항(E열)을 내용(D열) 아래에 줄바꿈해 바로 보여줌(누르지 않아도) / v1.96.0 학사일정 학년 스위치가 새로고침에 꺼지던 문제(자료 다시 받는 동안 도구줄이 통째로 사라짐) + 마지막으로 켠 학년 기억 / v1.95.2 얹은 수업진도 로그인을 관문이 걷힐 때까지 지켜보며 다시 잇는다(늦게 뜨면 놓치던 것) + 못 이을 땐 헛단추 대신 까닭 안내 / v1.95.1 얹은 수업진도가 탭 줄을 덮던 문제(화면 배율을 자리 계산에 안 넣었다) + 웹앱 제 머리를 감추고 바탕색을 테마에 맞춤 / v1.95.0 «시간표» → «진호 시간표»(앱 로고). 그 안에 수업진도 대시보드 화면 셋(시간표계획·날짜별·진도표)을 웹앱 그대로 얹음(BrowserView) / v1.94.0 열쇠·설정 백업 — 파일 하나로 내보내기/가져오기, 암호(AES-256-GCM)로 잠금 / v1.93.0 오른쪽 단을 틱틱만으로 (내 할 일 화면 뺌 — 겹쳐서. 적어 둔 것은 상태 파일에 남아 있음) + 틱틱 로고 표시 / v1.92.1 틱틱 할 일이 스물몇 개씩 쏟아지던 것 — 기간(오늘·이번주·마감없음·전체)과 목록으로 거르기, 기본은 이번주 / v1.92.0 틱틱(TickTick) 연동 — 업무관리 오른쪽 단에서 «내 할 일»과 갈아 끼움. 핸드폰과 서로 반영 / v1.91.0 테마 둘 추가 — 한옥(한지 바탕·나무빛)·다크UI(짙은 남색·파랑). 대비를 재서 흐린 색은 짙게 조정 / v1.90.1 내 할 일 체크박스·✕ 와 업무관리 완료로·오늘로 단추가 눌러도 안 먹던 문제 — 단추 배선 목록에 새 종류가 빠져 있었다 / v1.90.0 학급 시간표에도 바뀐 수업 반영 — 컴시간이 변경분을 교사 시간표에만 줘서 학급 쪽은 옛 시간표였다. 교사 쪽 변경을 학급 칸에 옮겨 붙인다(빠짐·들어옴·맞바꿈) / v1.89.5 주간업무 가로 들여쓰기를 번호 단계로 통일 — 원문 앞 공백이 줄마다 달라 «2.» 와 그 아래 «가.» 가 같은 자리에 놓이던 문제 / v1.89.4 주간업무 해석기를 고쳐도 저장해 둔 옛 해석본이 그대로 보이던 문제 — 해석기 판(PARSE_VER)이 다르면 자동으로 다시 받는다 / v1.89.3 주간업무에서 «1.» 과 «가.» 가 같은 줄로 뭉개지던 문제 — 제 번호를 단 줄엔 목록 점을 안 붙인다 / v1.89.2 업무관리에서 «완료» 단추가 상태처럼 보이던 문제 — 모든 줄에 상태 배지(시작 전·진행 중) 표시, 단추는 «…로» 어미 외곽선으로 / v1.89.1 업무관리 2단 사이 칸막이를 끌어 너비 조절(시트처럼)·두 번 누르면 처음대로·너비 기억 / v1.89.0 업무관리 2단 — 오른쪽에 내가 쓰는 「내 할 일」(이 PC 저장·노션 무관). 완료는 접히고 복원·일괄삭제 가능 / v1.88.2 업무관리 탭을 눌러도 딴 탭으로 튕기던 문제(main VIEWS 에 task 누락) + 넓게 보기 차림표에도 업무관리 추가 / v1.88.1 v1.88.0 이 아예 안 켜지던 문제 — 새 파일 notion.js 가 빌드 목록에 빠졌었다(두 갈래 다 추가) / v1.88.0 업무관리 탭 신규(노션 PROJECTS·TASKS 연동 — 진호알리미 전용, 시간표와 주간업무 사이). 오늘·이번주/프로젝트별/마감없음 3갈래·완료·오늘로·진행중·추가 / v1.87.0 바뀐 수업(보강·교체)이 null-null 로 나오던 문제 — 컴시간이 «>11302» 같은 문자열로 주는 것을 못 읽었다. 파싱 보강 + 바뀐 칸 노란 테두리 표시 / v1.86.0 컴시간 자동 갱신(켤 때 1회 + 6시간마다) + 컴시간 탭 ⟳ 새로고침 버튼 / v1.85.0 숨은 창 로그인·캐시 메모리 전용(?widgetworker=1 — 격리로 손상되는 IndexedDB 회피, 로그인 몇 초 만에 풀리던 문제 뿌리 해결) + 켤 때 손상 창고·재기동 예약작업 찌꺼기 청소 / v1.84.0 구글 클라이언트를 파이어베이스와 같은 프로젝트 것으로 교체(audience 불일치 해소) + 판올림 재기동 wscript 숨김 실행(검은 콘솔 창 제거)
// 진호알리미 / 혜원 데스크 — 바탕화면에 항상 떠 있는 작은 카드 (한 벌의 코드에서 두 갈래로 빌드한다)
// 수정요약: v1.83.0 겹침 방지 두 번째 잠금(포트) — V3 그림자 격리가 파일 잠금을 무력화해도 두 벌이 못 겹치게. 늦게 뜬 쪽이 살아남고, 안 물러나는 좀비는 강제로 내린다
//
// 값을 어떻게 얻는가:
//   숨은 창으로 실제 웹앱(jindo-dashboard.web.app)을 띄워 놓고, 그 앱이 위젯용으로
//   내놓는 window.__widgetData() 를 불러 결과만 받아온다. 화면을 긁는 게 아니라
//   앱이 화면을 그릴 때 쓰는 것과 똑같은 계산 결과라서, 앱 화면이 바뀌어도 안 깨진다.
//   로그인은 진짜 크롬에서 하고 그 결과(구글 ID 토큰)만 127.0.0.1 로 넘겨받는다 — startLogin() 참고.

const { app, BrowserWindow, BrowserView, Tray, Menu, ipcMain, shell, Notification, screen, powerMonitor, dialog,
  globalShortcut } = require('electron');
const { autoUpdater } = require('electron-updater');
const { spawn } = require('child_process');
const http = require('http');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const aiusage = require('./aiusage.js');
const recordsmain = require('./recordsmain.js');
const notion = require('./notion.js');
const ticktick = require('./ticktick.js');
const backup = require('./backup.js');
const roster = require('./roster.js');
const gradeplan = require('./gradeplan.js');
const weather = require('./weather.js');
const sysinfo = require('./sysinfo.js');

/* ── 갈래(flavor) ──────────────────────────────────────────────
   한 벌의 코드로 두 프로그램을 만든다. 빌드할 때 package.json 에 flavor 를 심어 두고
   (electron-builder 의 extraMetadata), 여기서 읽어 화면과 동작을 가른다.

     jinho  진호알리미  — 지금까지 쓰던 것 그대로. 시간표(오늘·이번주·진도)가 있다.
     hyewon 혜원 데스크 — 시간표만 뺀 것. 시간표는 수업진도 앱에서 오는 «내» 자료라
                          나눠 줄 판에는 넣지 않는다. 덕분에 구글 로그인도 필요 없다.
     easy   혜원이지     — 같은 자료를 «넓은 창»으로 여는 것. 떠 있는 위젯이 아니라
                          열어서 일하는 작업실이다. 시간표는 없다(혜원 데스크와 같다).

   ★ 앞으로 고칠 때: 시간표에 딸린 것만 jinho 에, 나머지는 둘 다에 넣는다. */
const FLAVOR = (() => {
  try { return require('./package.json').flavor === 'hyewon' ? 'hyewon' : 'jinho'; }
  catch (e) { return 'jinho'; }
})();
const HAS_TT = FLAVOR === 'jinho';              // 시간표를 쓰는가
// ★ «넓은 창» 은 따로 설치하는 프로그램이 아니라 이 앱이 여는 두 번째 창이다.
//   전에는 easy 라는 갈래로 따로 냈는데, 설정·구글 로그인이 갈려서 하나로 합쳤다.
const APP_NAME = HAS_TT ? '진호알리미' : '혜원이지';
const ICON = HAS_TT ? 'icon.png' : 'hyewon-icon.png';
const TRAY_ICON = HAS_TT ? 'tray.png' : 'hyewon-tray.png';

const APP_URL = 'https://jindo-dashboard.web.app/';
const APP_ORIGIN = 'https://jindo-dashboard.web.app';
const PARTITION = 'persist:jindo';
const POLL_INTERVAL_MS = 60 * 1000;          // 1분마다 값 갱신
// 2분마다 새 버전 확인. 확인은 latest.yml(350바이트 남짓) 하나를 받는 것이 전부라
// 이 정도 주기도 부담이 없다 — 새 버전이 나오면 사실상 바로 뜬다.
const UPDATE_CHECK_INTERVAL_MS = 2 * 60 * 1000;
/* ★ 사용량은 분 단위로 볼 일이 드물다 — 5분이면 충분하다.
   숨은 브라우저 창이 claude.ai 같은 무거운 페이지를 매번 여는 일이라,
   주기를 늘리는 것이 램·네트워크를 그대로 아끼는 길이다. */
const USAGE_INTERVAL_MS = 5 * 60 * 1000;    // AI 사용량은 5분마다
const RELEASES_PAGE_URL = 'https://github.com/Arete929/jindo-widget/releases/latest';

const userDataPath = app.getPath('userData');
const stateFile = path.join(userDataPath, 'widget-state.json');
const debugLogFile = path.join(userDataPath, 'debug.log');
const MAX_DEBUG_LOG_BYTES = 300 * 1024;

// 로그는 동기로 쓴다. 예전엔 비동기(appendFile)였는데 어느 순간부터 조용히 실패해
// 몇 시간치 기록이 통째로 비었다 — 진단이 안 남으면 원인을 못 찾는다.
// 한 분에 몇 줄뿐이라 동기로 써도 부담이 없다.
function debugLog(msg) {
  const line = `[${new Date().toISOString()}] ${msg}
`;
  try {
    fs.appendFileSync(debugLogFile, line);
    const st = fs.statSync(debugLogFile);
    if (st.size > MAX_DEBUG_LOG_BYTES) {
      const keep = fs.readFileSync(debugLogFile, 'utf-8').slice(-MAX_DEBUG_LOG_BYTES / 2);
      fs.writeFileSync(debugLogFile, keep);
    }
  } catch (e) { /* 로그 때문에 앱이 멈추지는 않게 */ }
}

// 전체 앱을 브라우저로 열 때 — 기본 브라우저(이 PC 는 웨일)가 아니라 크롬을 쓴다.
// 크롬이 없으면 엣지, 그것도 없으면 기본 브라우저.
/* 브라우저마다 깔릴 만한 자리들 */
function browserCandidates(key) {
  const PF = process.env.ProgramFiles || 'C:\\Program Files';
  const PF86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
  const LOCAL = process.env.LOCALAPPDATA || '';
  const roots = [PF, PF86, LOCAL].filter(Boolean);
  const where = {
    whale: ['Naver', 'Naver Whale', 'Application', 'whale.exe'],
    chrome: ['Google', 'Chrome', 'Application', 'chrome.exe'],
    edge: ['Microsoft', 'Edge', 'Application', 'msedge.exe']
  }[key];
  if (!where) return [];
  return roots.map((r) => path.join(r, ...where));
}
function findBrowser(key) {
  for (const p of browserCandidates(key)) {
    try { if (fs.existsSync(p)) return p; } catch (e) { /* 무시 */ }
  }
  return null;
}
/* 이 PC 에 깔려 있는 것들 — 설정에서 고르게 보여준다 */
/* ★ 차례가 곧 «고르지 않았을 때 뽑히는 순서» 다.
   전에는 웨일이 맨 앞이라, 웨일이 깔린 뒤로는 «크롬으로 로그인하세요» 라면서
   웨일을 열었다. 바로 위 주석대로 크롬이 먼저다. */
const BROWSERS = [
  { key: 'chrome', label: '크롬' },
  { key: 'whale', label: '웨일' },
  { key: 'edge', label: '엣지' }
];
function browserList() {
  return BROWSERS.map((b) => ({ key: b.key, label: b.label, path: findBrowser(b.key) }))
    .filter((b) => b.path);
}
function getBrowserPick() { return String(loadState().browser || ''); }
/* 고른 것이 있으면 그것, 없으면 있는 것 중 앞에서부터 */
function browserPath() {
  const pick = getBrowserPick();
  if (pick === 'system') return null;            // 일부러 «기본 브라우저» 를 고른 경우
  if (pick) {
    const p = findBrowser(pick);
    if (p) return p;
    debugLog(`고른 브라우저(${pick})를 못 찾아 다른 것으로 엽니다`);
  }
  const have = browserList();
  return have.length ? have[0].path : null;
}
/* 지금 열리는 브라우저의 «사람이 부르는 이름» — 안내 글에 쓴다.
   ★ 전에는 어디에나 «크롬» 이라고 글자로 박아 두었다. 웨일이 열려도 «크롬 탭을 열었어요»
     라고 해서 어디를 봐야 할지 알 수 없었다. */
function browserName() {
  const exe = browserPath();
  if (!exe) return '기본 브라우저';
  const base = path.basename(exe).toLowerCase();
  const b = BROWSERS.filter((x) => base.indexOf(x.key === 'edge' ? 'msedge' : x.key) >= 0)[0];
  return b ? b.label : '브라우저';
}
/* 로그인 넘겨받기 주소 — 앱 이름을 함께 실어 보낸다.
   ★ 웹 대시보드 한 곳을 진호알리미·혜원이지가 같이 쓴다. 이름을 보내야
     그 화면이 «진호알리미 계정 연결» 로 제대로 적는다. */
function handoffUrl(port, nonce) {
  return `${APP_URL}?widget=${port}&nonce=${nonce}&app=${encodeURIComponent(APP_NAME)}`;
}
function openInBrowser(url) {
  const exe = browserPath();
  if (!exe) { debugLog('크롬·엣지를 못 찾아 기본 브라우저로 엽니다'); shell.openExternal(url); return; }
  debugLog(`브라우저로 열기: ${path.basename(exe)}`);
  try {
    spawn(exe, [url], { detached: true, stdio: 'ignore', windowsHide: false }).unref();
  } catch (e) {
    debugLog(`브라우저 실행 실패(${e.message}) — 기본 브라우저로 대체`);
    shell.openExternal(url);
  }
}

let widgetWin = null;      // 화면에 보이는 카드
let workerWin = null;      // 값을 가져오는 숨은 창
let timetableWin = null;   // 주간 시간표 «크게 보기» 창
let settingsWin = null;    // 설정 창
let handoffServer = null;   // 크롬에서 로그인 결과를 받는 잠깐짜리 서버
let handoffNonce = null;    // 그때그때 만드는 일회용 확인값
let handoffDone = false;    // 이번 로그인에서 이미 넘겨받았는가
let tray = null;
let pollTimer = null;
let lastData = null;
let rebuildTrayMenu = null;
let userQuit = false;        // 트레이 «종료»로 직접 끈 것인지
let installingUpdate = false; // 업데이트 설치 중(중복 방지)

/* ===================== 설정 저장 ===================== */
function loadState() {
  try { return JSON.parse(fs.readFileSync(stateFile, 'utf-8')); } catch (e) { return {}; }
}
function saveState(patch) {
  const next = Object.assign(loadState(), patch);
  try { fs.writeFileSync(stateFile, JSON.stringify(next)); } catch (e) { debugLog(`설정 저장 실패: ${e.message}`); }
  return next;
}
const SIZES = { small: 0.85, medium: 1, large: 1.2 };
function getScale() { const s = loadState().size; return SIZES[s] ? s : 'medium'; }
function getOpacity() { const o = loadState().opacity; return typeof o === 'number' ? o : 1; }
function getAlwaysOnTop() { const v = loadState().alwaysOnTop; return v === undefined ? true : !!v; }
// 테마는 다섯 — 고스트(기본, 빈 값) · 블랙 · 페르시안 · 칠화이트 · 나이트.
// 트루핑크·키위는 뺐다. 모르는 이름이 저장돼 있으면 기본(고스트)으로 되돌린다.
/* ★ 테마를 더할 때는 세 군데를 함께 고친다 — 여기(허용 목록)·settings.html 단추·ui.css 색.
   여기 빠지면 골라도 저장이 안 돼 늘 고스트로 돌아온다. */
const THEMES = ['', 'black', 'slate', 'slatelight', 'persian', 'chillwhite', 'night',
  'hanok', 'darkui'];
function getTheme() {
  let t = loadState().theme || '';
  if (t === 'ghost') t = '';        // 고스트가 곧 기본이다
  return THEMES.includes(t) ? t : '';
}

// 글씨체 — 고른 즉시 바뀐다. 화면 쪽에서 이 이름으로 글꼴을 가른다.
const FONTS = ['pretendard', 'nanum', 'gowunbatang', 'gowundodum', 'system'];
function getFont() {
  const f = loadState().font || 'pretendard';
  return FONTS.includes(f) ? f : 'pretendard';
}
// 탭마다 글자 크기 배율을 따로 기억한다 (주간업무·컴시간·학사일정·급식)
function getFontScale() {
  const v = loadState().fontScale;
  const out = { work: 1, comci: 1, cal: 1, meal: 1, rec: 1, home: 1, note: 1, link: 1,
    grid: 1, office: 1 };
  if (v && typeof v === 'object') {
    Object.keys(out).forEach((k) => {
      const n = Number(v[k]);
      if (n >= 0.7 && n <= 2) out[k] = n;
    });
  }
  return out;
}
// 처음 설치했을 때는 AI 사용량을 꺼 둔다 — 켜면 클로드·제미나이에 로그인해야 해서,
// 받자마자 쓰는 사람에게는 «로그인하기» 단추만 두 칸 보이는 셈이 된다.
/* 켜 놓은 AI 들. 예전에는 «다 켜기/다 끄기» 하나였다 — 그 값이 남아 있으면 옮겨 준다. */
const USAGE_KEYS = ['claude', 'gemini', 'gpt'];
function getUsageOn() {
  const st = loadState();
  if (Array.isArray(st.usageOn)) return st.usageOn.filter((k) => USAGE_KEYS.includes(k));
  return st.usageShow ? ['claude', 'gemini'] : [];   // 옛 설정 옮기기
}
function getUsageShow() { return getUsageOn().length > 0; }
/* 켜 둔 것만 읽는다 — 하나도 안 켰으면 아무 창도 안 띄운다 */
function pollUsageEnabled() {
  const on = getUsageOn();
  if (on.length) aiusage.pollAll(on);
}
function getUsageStyle() { return loadState().usageStyle === 'bar' ? 'bar' : 'ring'; }

/* ── 내 PC (CPU·램) ───────────────────────────────────────────
   인터넷도 열쇠도 필요 없다. 나눠 주는 판에서 굳이 보일 것은 아니라 기본은 꺼짐. */
function getSysShow() { return !!loadState().sysShow; }
let sysData = null;
let sysTimer = null;
function startSys() {
  if (sysTimer) { clearInterval(sysTimer); sysTimer = null; }
  if (!getSysShow()) { sysData = null; sendToWidget(); return; }
  const tick = () => { sysData = sysinfo.read(); sendToWidget(); };
  tick();
  sysTimer = setInterval(tick, 3000);   // 3초마다 — 이 정도면 앱에 부담이 없다
}

/* ── 날씨·미세먼지 ────────────────────────────────────────────
   Open-Meteo — 열쇠가 필요 없다. 학교망에서 막히면 조용히 안 보이게 둔다.
   지역은 혜원여자중학교가 기본이고, 설정에서 고르거나 좌표를 직접 넣을 수 있다. */
function getWxSpot() {
  const v = loadState().wxSpot;
  if (v && isFinite(Number(v.lat)) && isFinite(Number(v.lon))) {
    return { name: String(v.name || '고른 곳'), lat: Number(v.lat), lon: Number(v.lon) };
  }
  return weather.DEFAULT_SPOT;
}
function getWxShow() { const v = loadState().wxShow; return v === undefined ? true : !!v; }
let wxData = null;
async function refreshWeather() {
  const s = getWxSpot();
  try {
    const got = await weather.fetchWeather(s.lat, s.lon);
    got.spot = s.name;
    wxData = got;
    debugLog(`날씨 — ${s.name} ${got.now.temp}℃ ${got.now.text}`
      + (got.air ? ` · 미세 ${got.air.pm10.v}(${got.air.pm10.t})` : ' · 미세먼지 없음'));
  } catch (e) {
    // 인터넷이 막히면 지난 값을 그대로 둔다 — 갑자기 사라지는 것보다 낫다
    debugLog('날씨 받기 실패: ' + ((e && e.message) || e));
    if (!wxData) wxData = { error: (e && e.message) || String(e) };
  }
  sendToWidget();
}

/* ── 학년부 일지 ──────────────────────────────────────────────
   학년마다 시트가 따로 있다. 주소는 해마다 바뀌므로 설정에서 고칠 수 있게 둔다.
   3학년 것만 기본으로 넣어 두고 1·2학년은 빈 칸이다. */
const GRADE_SHEET_DEFAULT = {
  1: '',
  2: '',
  3: 'https://docs.google.com/spreadsheets/d/1Gl42JULgKo_s8iLXyDGoUY7hHOM5LCb2Op_BKUEKYSE/edit?gid=0#gid=0'
};
function getGradeSheets() {
  const v = loadState().gradeSheets || {};
  const out = {};
  [1, 2, 3].forEach((g) => {
    out[g] = (v[g] === undefined ? GRADE_SHEET_DEFAULT[g] : String(v[g] || ''));
  });
  return out;
}
function getGradePick() { const g = Number(loadState().gradePick); return [1, 2, 3].includes(g) ? g : 3; }
/* 켜 놓은 학년들. 예전에는 스위치 하나 + 보고 있는 학년이었다 —
   그때 값이 남아 있으면 그대로 옮겨 준다. */
/* ── 런처 목록 ─────────────────────────────────────────────
   «내 앱 대시보드»(런처 GAS) 에서 공유로 켜 둔 앱들을 받아 온다.
   ★ 이것 하나만 고치면 쓰는 사람 모두에게 반영된다 — 각자 넣을 필요가 없다.
   ★ 로그인은 필요 없다. 화면(HTML)이 아니라 알맹이만 받는다(?view=json). */
const { fetchText, postText } = require('./fetchtext.js');
const FEED_URL = 'https://script.google.com/macros/s/'
  + 'AKfycbwot9uum8L5CUb6ouJdI03nwg6jS8WPJ0zu91y8EthdYWf0mVSMLws4zV2I6cEWry_0/exec';
let feedData = null;   // { apps:[…], at, error, admin, cats }
function getFeedShow() { return loadState().feedShow !== false; }
/* 관리자 열쇠 — 런처를 «고칠 수» 있는 PC 에만 넣어 둔다.
   ★ 이 값은 화면으로 안 내려간다. 화면은 feed.admin(예/아니오) 만 안다. */
function getFeedKey() { return String(loadState().feedKey || '').trim(); }
/* 런처에 «고쳐 달라» 고 보내는 통로. 열쇠를 여기서 붙인다. */
async function feedPost(body) {
  const url = getFeedUrl(), key = getFeedKey();
  if (!url) throw new Error('런처 주소가 없습니다');
  if (!key) throw new Error('관리자 열쇠가 없습니다');
  const txt = await postText(url, JSON.stringify(Object.assign({ pass: key }, body)));
  const j = JSON.parse(txt);
  if (!j || !j.ok) throw new Error((j && j.error) || '런처가 받지 않았습니다');
  return j;
}
/* 런처가 준 줄 하나를 화면이 쓰는 꼴로 */
function feedApp(a) {
  return {
    t: String(a.t || '').trim(), u: tidyUrl(a.u), d: String(a.d || '').trim(),
    icon: String(a.icon || '').trim(), tab: String(a.tab || '').trim(),
    version: String(a.version || '').trim(), updated: String(a.updated || '').trim(),
    gas: tidyUrl(a.gas), sheet: tidyUrl(a.sheet),
    shared: !!a.shared, hidden: !!a.hidden,
    // 종류 — 'link' 면 담아 둔 주소, 아니면 내가 만든 앱
    color: String(a.color || '').trim(),         // 타일 배경색 (파스텔 이름)
    kind: a.kind === 'link' ? 'link' : 'app',
    // 타일이 몇 칸을 차지하나 — 1~3
    size: (function () { const n = Number(a.size); return (n >= 1 && n <= 3) ? n : 1; })()
  };
}
function getFeedUrl() {
  const v = loadState().feedUrl;
  return v === undefined ? FEED_URL : String(v || '');
}
async function refreshFeed() {
  const url = getFeedUrl();
  if (!url || !getFeedShow()) { feedData = null; sendToWidget(); return; }
  try {
    /* ★ 열쇠가 있으면 «나만·숨김까지 전부» 를 받는다(POST). 그게 런처보드다.
       열쇠가 없으면 예전처럼 «공유로 켠 것» 만 받는다(GET ?view=json). */
    let j, admin = false;
    if (getFeedKey()) {
      /* ★ 한 번 미끄러졌다고 포기하지 않는다 — GAS 는 첫 깨울 때 유난히 느리다 */
      for (let tries = 0; tries < 2 && !j; tries++) {
        try { j = await feedPost({ act: 'list' }); admin = true; }
        catch (e) {
          debugLog('런처 열쇠로 못 받음' + (tries ? '(두 번째)' : '') + ' — ' + (e.message || e));
          if (tries === 0) await new Promise((r) => setTimeout(r, 1200));
        }
      }
      /* ★ 여기서 공개 목록(?view=json)으로 떨어지면 안 된다.
         그것은 «공유로 켠 것만» 주고 shared 도 안 보낸다. 그대로 갈아치우면
         서른일곱이 넷으로 줄고 그 넷마저 «나만 보기» 로 보인다 — 실제로 그랬다.
         못 받았으면 있던 것을 그대로 두고 사정만 알린다. */
      if (!j) {
        if (feedData && feedData.apps && feedData.apps.length) {
          feedData = Object.assign({}, feedData,
            { error: '지금은 런처가 응답하지 않습니다 — 아까 받아 둔 것을 보여 줍니다' });
        } else {
          feedData = { apps: [], at: '', admin: true, cats: [],
            error: '런처가 응답하지 않습니다' };
        }
        debugLog('런처보드 — 못 받아서 있던 것을 그대로 둔다');
        sendToWidget();
        return;
      }
    }
    if (!j) {
      // 열쇠가 없는 사람(혜원이지) — 공개 목록이 «제 목록» 이다
      j = JSON.parse(await fetchText(url + (url.indexOf('?') >= 0 ? '&' : '?') + 'view=json'));
    }
    const apps = ((j && j.apps) || []).map(feedApp).filter((a) => a.t);
    feedData = { apps, at: (j && j.at) || '', error: '',
      admin, cats: ((j && j.cats) || []).map(String) };

    // ★ 런처 목록에 «전광판» 이 있으면 그 주소를 스스로 챙긴다.
    //   그러면 다른 선생님은 붙여넣지 않아도 전광판이 켜진다.
    //   손으로 넣어 둔 것이 있으면 건드리지 않는다.
    const bd = apps.filter((a) => /전광판/.test(a.t))[0];
    if (bd && bd.u && !loadState().boardUrlManual && getBoardUrl() !== bd.u) {
      saveState({ boardUrl: bd.u });
      debugLog('전광판 주소를 런처에서 받아 왔습니다');
      refreshBoard();
    }
    debugLog(`런처 목록 ${apps.length}개`);
  } catch (e) {
    feedData = { apps: [], at: '', error: (e && e.message) || String(e) };
    debugLog('런처 목록 못 받음 — ' + feedData.error);
  }
  sendToWidget();
}

/* ── 사진 액자 ─────────────────────────────────────────────
   폴더를 고르면 그 안의 사진을 돌아가며 보여 준다.
   ★ 사진은 목록만 넘기고, 화면이 한 장씩 달라고 할 때 읽어 준다.
     수백 장을 한꺼번에 넘기면 창이 굳는다. */
const PHOTO_EXT = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
function getPhotoDir() { return String(loadState().photoDir || ''); }
function getPhotoSec() {
  const n = Number(loadState().photoSec);
  return (n >= 3 && n <= 600) ? n : 12;
}
/* 폴더 안의 사진 목록 — 하위 폴더까지 한 겹만 본다 */
function photoList() {
  const dir = getPhotoDir();
  if (!dir) return [];
  const out = [];
  const scan = (d, deep) => {
    let names;
    try { names = fs.readdirSync(d, { withFileTypes: true }); } catch (e) { return; }
    for (const it of names) {
      if (out.length >= 500) return;
      const full = path.join(d, it.name);
      if (it.isDirectory()) { if (deep < 1) scan(full, deep + 1); continue; }
      const ext = path.extname(it.name).toLowerCase();
      if (PHOTO_EXT.indexOf(ext) >= 0) out.push(full);
    }
  };
  scan(dir, 0);
  out.sort();
  return out;
}

/* ── 차림표 순서 ───────────────────────────────────────────
   자주 쓰는 것을 앞으로 당겨 둔다. 위젯의 탭 줄과 넓게 보기의 왼쪽
   차림표가 «같은 순서» 를 쓴다 — 둘이 다르면 손이 헷갈린다.
   ★ 담아 둔 목록에 없는 화면(새로 생긴 것)은 뒤에 붙는다. */
/* ── 업무관리(노션) ─────────────────────────────────────────
   노션의 PROJECTS·TASKS 를 읽어 «오늘·이번주 할 일» 로 보여주고, 거기서 바로 고친다.
   ★ 진호알리미에만 있다(HAS_TT). 혜원이지에는 탭 자체가 안 보인다.
   ★ 열쇠는 화면으로 안 내려간다 — 화면은 «넣었는가(hasKey)» 만 안다. */
let taskData = null;   // { projects:[…], tasks:[…], at, error }
/* 표 주소는 앱에 박아 둔다 — 선생님은 열쇠만 넣으면 된다. 설정에서 바꿀 수도 있다. */
const TASK_DB = '2edff403d7468111bb56cc4626908a58';   // 🏐 TASKS
const PROJ_DB = '2edff403d74681e0b6bbfbb8c22c8888';   // PROJECTS
function getNotionKey() { return String(loadState().notionKey || '').trim(); }
function getTaskDb() { return String(loadState().taskDb || '').trim() || TASK_DB; }
function getProjDb() { return String(loadState().projDb || '').trim() || PROJ_DB; }
function getTaskShow() { return loadState().taskShow !== false; }
/* 2단 사이 칸막이를 끌어 정한 «내 할 일» 단의 너비(px). 시트처럼 손으로 맞춘다. */
function getTaskSplit() {
  const n = Number(loadState().taskSplit);
  return isFinite(n) && n >= 180 && n <= 620 ? Math.round(n) : 300;
}

async function refreshTasks(why) {
  if (!HAS_TT) return;                      // 혜원이지는 이 기능이 없다
  const key = getNotionKey();
  if (!key) { taskData = null; sendToWidget(); return; }
  try {
    const r = await notion.loadAll(key, getTaskDb(), getProjDb());
    taskData = { projects: r.projects, tasks: r.tasks, at: r.at, error: '' };
    debugLog(`업무관리 받기 완료 — 프로젝트 ${r.projects.length} · 태스크 ${r.tasks.length}`
      + (why ? ` (${why})` : ''));
  } catch (e) {
    const msg = (e && e.message) || String(e);
    taskData = { projects: (taskData && taskData.projects) || [],
      tasks: (taskData && taskData.tasks) || [], at: (taskData && taskData.at) || '', error: msg };
    debugLog('업무관리 받기 실패 — ' + msg);
  }
  sendToWidget();
}

/* ── 내 할 일(To-do) ────────────────────────────────────────
   업무관리 탭 오른쪽에 두는 «내가 직접 쓰는» 목록. 노션과 상관없이 이 PC 에만 있다.
   ★ 완료한 것은 지우지 않고 접어 둔다 — 나중에 되돌릴 수 있어야 하기 때문이다. */
function getTodos() {
  const a = loadState().todos;
  return Array.isArray(a) ? a : [];
}
function saveTodos(list) {
  saveState({ todos: list.slice(0, 300), todosAt: stampKST() });
  sendToWidget();
}
/* 저장시각 — 화면에 «마지막 저장» 으로 보여 준다(전역 규칙) */
function stampKST() {
  const d = new Date();
  const z = (n) => (n < 10 ? '0' : '') + n;
  return d.getFullYear() + '.' + z(d.getMonth() + 1) + '.' + z(d.getDate())
    + ' ' + z(d.getHours()) + ':' + z(d.getMinutes()) + ':' + z(d.getSeconds());
}

/* ── 틱틱 ───────────────────────────────────────────────────
   핸드폰과 함께 쓰는 할 일. «내 할 일»(이 PC 저장)과 따로 둔다 —
   틱틱 연결이 풀려도 이 PC 메모는 멀쩡해야 하기 때문이다. */
let tickData = null;   // { projects:[…], tasks:[…], at, error }
let tickAuthing = false;
function getTickKey() { const s = loadState().tick || {}; return String(s.token || '').trim(); }
function getTickApp() {
  const s = loadState().tick || {};
  return { id: String(s.clientId || '').trim(), secret: String(s.clientSecret || '').trim() };
}
function getTickList() { return String((loadState().tick || {}).listId || ''); }
function saveTick(patch) {
  saveState({ tick: Object.assign({}, loadState().tick || {}, patch) });
}
/* ── 완료함 장부 ────────────────────────────────────────────
   틱틱 공개 API 에는 «완료된 것 목록» 창구가 없다(실측 2026-09-04 — /completed 404).
   그래서 위젯이 따로 적어 둔다: 위젯에서 완료한 것은 그 자리에서, 틱틱 앱에서 완료해
   목록에서 사라진 것은 단건 조회(status 2)로 확인해 적는다. 최근 100개까지. */
function getTickDone() { return ((loadState().tick || {}).done || []).slice(0, 100); }
function tickDoneAdd(x) {
  const list = getTickDone().filter((d) => d.id !== x.id);
  list.unshift(Object.assign({ doneAt: stampKST() }, x));
  saveTick({ done: list.slice(0, 100) });
}
function tickDoneDrop(ids) {
  saveTick({ done: getTickDone().filter((d) => ids.indexOf(d.id) < 0) });
}
let tickDropped = {};              // 우리가 지운 것 — 사라졌다고 완료로 오해하지 않게
/* 지난번엔 있었는데 이번엔 없는 것 — 완료됐나 단건으로 물어본다 */
async function tickNoteVanished(prevTasks, nowTasks) {
  const now = {}; nowTasks.forEach((t) => { now[t.id] = true; });
  const gone = (prevTasks || []).filter((t) => !now[t.id] && !tickDropped[t.id]).slice(0, 8);
  for (const t of gone) {
    const one = await ticktick.getTask(getTickKey(), t.projectId, t.id);
    if (one && Number(one.status) === 2) {
      tickDoneAdd({ id: t.id, pid: t.projectId, title: t.title, project: t.project, due: t.due, priority: t.priority });
      debugLog('틱틱 — 틱틱 쪽에서 완료됨: ' + String(t.title).slice(0, 30));
    }
  }
  tickDropped = {};
}
async function refreshTick(why) {
  if (!HAS_TT) return;
  if (!getTickKey()) { tickData = null; sendToWidget(); return; }
  try {
    const prev = (tickData && tickData.tasks) || [];
    const r = await ticktick.loadAll(getTickKey());
    if (prev.length) { try { await tickNoteVanished(prev, r.tasks); } catch (e) { /* 장부는 곁다리 */ } }
    tickData = { projects: r.projects, tasks: r.tasks, at: r.at, error: '', done: getTickDone() };
    debugLog(`틱틱 받기 완료 — 목록 ${r.projects.length} · 할 일 ${r.tasks.length}`
      + (why ? ` (${why})` : ''));
  } catch (e) {
    const msg = (e && e.message) || String(e);
    tickData = { projects: (tickData && tickData.projects) || [],
      tasks: (tickData && tickData.tasks) || [], at: (tickData && tickData.at) || '', error: msg,
      done: getTickDone() };
    debugLog('틱틱 받기 실패 — ' + msg);
  }
  sendToWidget();
}
/* 처음 한 번 — 브라우저에서 틱틱 로그인·허용을 받는다 */
async function tickConnect() {
  const app0 = getTickApp();
  if (!app0.id || !app0.secret) return { ok: false, error: '틱틱 앱 아이디·비밀을 먼저 넣어 주세요' };
  if (tickAuthing) return { ok: false, error: '이미 로그인을 기다리는 중입니다' };
  tickAuthing = true;
  try {
    const state = crypto.randomBytes(8).toString('hex');
    const code = await ticktick.waitForCode(state,
      () => openInBrowser(ticktick.authUrl(app0.id, state)), debugLog);
    const t = await ticktick.exchange(app0.id, app0.secret, code);
    saveTick({ token: t.token, at: stampKST() });
    debugLog('틱틱 연결 완료');
    await refreshTick('연결 직후');
    return { ok: true, at: stampKST() };
  } catch (e) {
    debugLog('틱틱 연결 실패 — ' + ((e && e.message) || e));
    return { ok: false, error: (e && e.message) || String(e) };
  } finally { tickAuthing = false; }
}

/* ── 전광판 ────────────────────────────────────────────────
   같은 학교 선생님끼리 한 줄씩 주고받는다.
   ★ 이 앱에서 «바깥에 쓰는» 것은 이것뿐이다. 그래서 두 겹으로 막는다.
     ① 앱   — 컴시간 학교가 그 학교가 아니면 보내는 칸이 안 보인다
     ② GAS  — 학교 코드를 함께 받아 거기서 한 번 더 본다
   ★ 주소가 비어 있으면 그 자리가 아예 안 보인다 — 나눠 준 판에는 자연히 안 나온다. */
let boardData = null;   // { list:[{at,who,text}], school, at, error }
/* 우리 학교 전광판 주소 — 앱에 박아 둔다.
   ★ 이렇게 두면 «아무도 아무것도 안 해도» 켜진다. 붙여넣을 것도, 런처에 적을 것도 없다.
   ★ 대신 이 주소는 공개 저장소에 남는다. 그래서 GAS 쪽에서 학교 코드를 보고,
     한 사람이 하루에 보낼 수 있는 수도 막아 둔다. 그래도 성가신 일이 생기면
     GAS 를 새로 배포해 주소를 바꾸고 이 줄만 고치면 된다.
   ★ 설정에 손으로 넣은 것이 있으면 그것이 앞선다. */
const BOARD_URL = 'https://script.google.com/macros/s/AKfycbz48C5LdR49cq6_SA8wbeqZHU70Kco3XW39lr45U0_8L_ctGEAvX2XGoRrJYOmse3unfQ/exec';
function getBoardUrl() {
  const st = loadState();
  const v = st.boardUrl;
  // 아직 아무것도 안 정했으면 박아 둔 것을 쓴다.
  // 손으로 «비운» 것이라면(boardUrlManual) 그 뜻을 지켜 안 보여 준다.
  if (v === undefined) return BOARD_URL;
  const u = String(v || '').trim();
  if (u) return u;
  return st.boardUrlManual ? '' : BOARD_URL;
}
function getBoardNick() { return String(loadState().boardNick || '').trim(); }
/* 내 컴시간 학교 코드 — 이것과 전광판 학교가 같아야 보낼 수 있다 */
function mySchoolCode() {
  const c = getComciConfig();
  return String((c && c.school && c.school.code) || '');
}
async function refreshBoard() {
  const url = getBoardUrl();
  if (!url) { boardData = null; sendToWidget(); return; }
  try {
    const txt = await fetchText(url + (url.indexOf('?') >= 0 ? '&' : '?') + 'view=json');
    const j = JSON.parse(txt);
    boardData = {
      list: ((j && j.list) || []).slice(-30),
      school: String((j && j.school) || ''),
      at: (j && j.at) || '', error: ''
    };
  } catch (e) {
    boardData = { list: [], school: '', at: '', error: (e && e.message) || String(e) };
    debugLog('전광판 못 읽음 — ' + boardData.error);
  }
  sendToWidget();
}

/* 교무실 즐겨찾기 — 별표로 위에 고정해 둔 것 */
function getOfficeFav() {
  const v = loadState().officeFav;
  return Array.isArray(v) ? v.map(String).slice(0, 60) : [];
}
/* 접어 둔 묶음 — 이 PC 것. «공유/나만 / 종류 / 묶음» 을 한 열쇠로 담는다. */
function getFeedFold() {
  const v = loadState().feedFold;
  return Array.isArray(v) ? v.map(String).slice(0, 80) : [];
}
/* 런처보드 즐겨찾기 — 앱 «이름» 으로 담는다. 이 PC 것이라 시트엔 안 올라간다. */
function getFeedFav() {
  const v = loadState().feedFav;
  return Array.isArray(v) ? v.map(String).slice(0, 60) : [];
}
function getTabOrder() {
  const v = loadState().tabOrder;
  return Array.isArray(v) ? v.map(String).slice(0, 20) : [];
}
/* ── 대시보드 칸 ───────────────────────────────────────────
   순서를 바꾸고, 안 볼 것은 접어 둔다. */
function getDashOrder() {
  const v = loadState().dashOrder;
  return Array.isArray(v) ? v.map(String).slice(0, 20) : [];
}
/* 대시보드 칸 폭 — 칸마다 좁게(1) · 보통(2) · 넓게(3) 중 하나.
   여섯 칸짜리 격자에 1·2·3 칸씩 차지한다. */
/* 칸 크기 — «가로,세로» 두 숫자로 담는다 (예: {meal:'3,2'}).
   옛 판은 가로 하나만 숫자로 담았다 — 그것도 읽어 준다. */
function getDashSize() {
  const v = loadState().dashSize;
  if (!v || typeof v !== 'object') return {};
  const out = {};
  Object.keys(v).slice(0, 20).forEach((k) => {
    const s = String(v[k] || '');
    const m = s.match(/^(\d)[,x](\d)$/);
    if (m) { out[k] = m[1] + ',' + m[2]; return; }
    const n = Number(s);                       // 옛 판 — 가로만
    if (n >= 1 && n <= 3) out[k] = (n === 1 ? 2 : n === 2 ? 3 : 6) + ',1';
  });
  return out;
}
function getDashOff() {
  const v = loadState().dashOff;
  return Array.isArray(v) ? v.map(String).slice(0, 20) : [];
}

/* 차림표 모양 — 아이콘만 / 글자만 / 둘 다.
   위젯의 탭 줄과 넓게 보기의 왼쪽 차림표가 «함께» 이것을 따른다. */
function getNavStyle() {
  const v = String(loadState().navStyle || '');
  return (v === 'icon' || v === 'text') ? v : 'both';
}

/* 개학일 — 진도표의 «1주차» 를 여기서부터 센다.
   학사일정에서 «개학» 이라 적힌 날을 찾는 방법도 있지만, 표현이 해마다 달라
   놓치기 쉽다. 한 학기에 한 번 넣는 것이니 손으로 넣는 편이 확실하다. */
/* 아직 안 넣었으면 이 날부터 1주차로 본다 — 넣자마자 진도표가 나오게.
   학기가 바뀌면 설정에서 고치면 된다. */
const TERM_DEFAULT = '2026-08-18';
function getTermStart() {
  const st = loadState();
  const s = String(st.termStart === undefined ? TERM_DEFAULT : (st.termStart || '')).trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
}

/* ── 바로가기 ──────────────────────────────────────────────
   제목과 주소만 있으면 된다. 이 PC 에만 담긴다(남과 섞이지 않는다).
   공용 목록(런처 시트에서 오는 것)은 따로 온다 — 여기 것은 «내가 만든 것». */
function getLinks() {
  const raw = loadState().links;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x) => ({ t: String((x && x.t) || '').trim(), u: String((x && x.u) || '').trim() }))
    .filter((x) => x.t && x.u)
    .slice(0, 40);
}
/* 주소를 다듬는다 — 앞에 http 가 없으면 붙이고, 엉뚱한 것은 버린다.
   ★ file: 이나 javascript: 같은 것은 열지 않는다. */
function tidyUrl(u) {
  let s = String(u || '').trim();
  if (!s) return '';
  if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) s = 'https://' + s;
  try {
    const p = new URL(s);
    if (p.protocol !== 'http:' && p.protocol !== 'https:') return '';
    return p.toString();
  } catch (e) { return ''; }
}

function getGradeOn() {
  const st = loadState();
  if (Array.isArray(st.gradeOn)) {
    return st.gradeOn.map(Number).filter((g) => g >= 1 && g <= 3);
  }
  return st.gradeShow ? [Number(st.gradePick) || 3] : [];
}
const gradeFile = path.join(userDataPath, 'gradeplan.json');
function loadGradePlans() {
  try { return JSON.parse(fs.readFileSync(gradeFile, 'utf-8')); } catch (e) { return {}; }
}
function saveGradePlans(v) {
  try { fs.writeFileSync(gradeFile, JSON.stringify(v)); } catch (e) { /* 무시 */ }
}
/* 주소에서 시트 번호만 뽑는다 */
function sheetIdOf(u) {
  const s = String(u || '').trim();
  const m = s.match(/\/d\/([a-zA-Z0-9_-]{20,})/);
  if (m) return m[1];
  return /^[a-zA-Z0-9_-]{20,}$/.test(s) ? s : '';
}
async function refreshGradePlan(grade) {
  const url = getGradeSheets()[grade];
  if (!url) throw new Error(grade + '학년 시트 주소가 아직 없습니다');
  // ★ 두 시트가 헷갈려 학년부 칸에 «학사일정 시트» 가 들어가는 일이 잦다.
  //   그대로 두면 «머리글을 못 찾음» 이라는 알아듣기 어려운 말만 나온다.
  const acId = sheetIdOf(loadState().academicSheet || academic.DEFAULT_SHEET);
  if (acId && sheetIdOf(url) === acId) {
    throw new Error(grade + '학년 칸에 «학사일정 시트» 가 들어 있습니다 — '
      + '학년부 일지는 다른 시트입니다 (설정 → 학사일정 에서 고쳐 주세요)');
  }
  const got = await gradeplan.fetchPlan(url);
  const all = loadGradePlans();
  all[grade] = got;
  saveGradePlans(all);
  debugLog(`학년부 일지 ${grade}학년 — ${got.items.length}건 / 구분 ${got.cats.length}개`);
  return got;
}
// 마지막으로 보던 모습 — 'widget'(떠 있는 카드) 또는 'easy'(넓게 보기).
// 둘은 스위치처럼 한 번에 하나만 뜬다. 다음에 켤 때도 그 모습으로 시작한다.
function getViewMode() { return loadState().viewMode === 'easy' ? 'easy' : 'widget'; }
const VIEWS = HAS_TT
  ? ['today', 'week', 'progress', 'plan', 'daily', 'dgrid',
     'task', 'work', 'comci', 'cal', 'meal', 'rec', 'office', 'link']
  : ['work', 'comci', 'note', 'grid', 'cal', 'meal', 'rec', 'office', 'link'];
function getView() {
  const v = loadState().view;
  return VIEWS.includes(v) ? v : VIEWS[0];
}

/* ===================== 자동 업데이트 ===================== */
// 새 버전이 나오면 알아서 내려받고, 다 받으면 알림을 띄운다. 누르면 재시작하며 설치.
// 안 누르면 다음에 앱이 종료될 때 조용히 설치된다.
let updateState = 'idle';   // idle | available | ready
let updateVersion = null;
let manualUpdateCheck = false;

/* ── 업데이트 내역 ──────────────────────────────────────────────
   새 버전을 다 받으면 릴리스에 적어 둔 «무엇이 바뀌었는지» 가 같이 온다
   (electron-updater 의 releaseNotes). 그것을 파일에 적어 두었다가,
   새 버전으로 켜졌을 때 한 번 보여준다. 닫으면 다시 안 뜨고,
   그 뒤로는 설정의 «업데이트 내역 보기» 로만 다시 볼 수 있다. */
const notesFile = path.join(userDataPath, 'release-notes.json');
let showNotes = false;      // 지금 띄워야 하는가

function saveNotes(version, notes) {
  let text = '';
  if (typeof notes === 'string') text = notes;
  else if (Array.isArray(notes)) text = notes.map((n) => (n && n.note) || '').join('\n\n');
  text = String(text).replace(/\r/g, '').trim();
  try { fs.writeFileSync(notesFile, JSON.stringify({ version: version, text: text })); }
  catch (e) { debugLog('업데이트 내역 저장 실패: ' + e.message); }
}
function loadNotes() {
  try { return JSON.parse(fs.readFileSync(notesFile, 'utf-8')); } catch (e) { return null; }
}
/* 이 버전 것을 아직 안 봤으면 띄운다 */
function notesToShow() {
  const n = loadNotes();
  if (!n || !n.text) return null;
  if (n.version !== app.getVersion()) return null;
  if (!showNotes && loadState().seenNotesVersion === app.getVersion()) return null;
  return n;
}

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.logger = {
  info: (m) => debugLog(`[updater] ${m}`),
  warn: (m) => debugLog(`[updater][warn] ${m}`),
  error: (m) => debugLog(`[updater][error] ${m}`),
  debug: () => {}
};

function notify(title, body, onClick) {
  if (!Notification.isSupported()) return;
  const n = new Notification({ title, body });
  if (onClick) n.on('click', onClick);
  n.show();
}
function setUpdateState(state, version) {
  updateState = state;
  if (version) updateVersion = version;
  if (rebuildTrayMenu) rebuildTrayMenu();
  sendToWidget();   // 띠를 바로 띄운다
}

autoUpdater.on('update-available', (info) => {
  debugLog(`새 버전 발견: v${info.version} — 백그라운드 다운로드 시작`);
  setUpdateState('available', info.version);
});
autoUpdater.on('update-not-available', () => {
  debugLog(`업데이트 없음 (현재 v${app.getVersion()}이 최신)`);
  if (manualUpdateCheck) { manualUpdateCheck = false; notify(APP_NAME, `이미 최신 버전이에요 (v${app.getVersion()}).`); }
});
let lastLoggedPercent = -1;
autoUpdater.on('download-progress', (p) => {
  const step = Math.floor(p.percent / 10) * 10;
  if (step !== lastLoggedPercent) { lastLoggedPercent = step; debugLog(`업데이트 다운로드 ${step}%`); }
});
autoUpdater.on('update-available', (info) => {
  // 이미 «준비됨» 인데 더 새 것이 나왔다면, 그 새 것으로 갈아탄다
  const v = info && info.version;
  if (updateState === 'ready' && v && v !== updateVersion) {
    debugLog(`더 새 버전 발견 — v${updateVersion} 대신 v${v} 를 받습니다`);
  }
});
autoUpdater.on('update-downloaded', (info) => {
  lastLoggedPercent = -1;
  saveNotes(info.version, info.releaseNotes);
  manualUpdateCheck = false;
  setUpdateState('ready', info.version);
  notify(`${APP_NAME} 업데이트 준비됨`,
    `새 버전 v${info.version}을(를) 다 받았어요. 클릭하면 재시작하며 설치합니다.`,
    () => installUpdateNow());
});
autoUpdater.on('error', (err) => {
  lastLoggedPercent = -1;
  debugLog(`업데이트 오류: ${err && err.message ? err.message : err}`);
  if (manualUpdateCheck) {
    manualUpdateCheck = false;
    notify(APP_NAME, '업데이트 확인에 실패했어요. 클릭하면 릴리스 페이지를 엽니다.',
      () => shell.openExternal(RELEASES_PAGE_URL));
  }
});

function installUpdateNow() {
  if (updateState !== 'ready' || installingUpdate) return;
  installingUpdate = true;
  debugLog('업데이트 설치 — quitAndInstall');
  if (pollTimer) clearInterval(pollTimer);
  autoUpdater.quitAndInstall(true, true);
  /* ★ 이 프로세스가 «확실히» 죽어야 한다.
     설치본은 곧바로 새 앱을 띄우는데(--force-run), 그때 옛 프로세스가 살아 있으면
     새 것이 잠금을 못 얻고 조용히 물러난다. 그러면 화면에는 옛 «죽은 창» 만 남는다.
     트레이·숨은 창 때문에 저절로 안 죽는 일이 있어, 몇 초 뒤 손수 끝낸다. */
  setTimeout(function () {
    debugLog('업데이트 설치 — 옛 판을 확실히 끝냅니다');
    app.exit(0);
  }, 4000);
}
function checkForUpdates(manual) {
  if (!app.isPackaged) {
    debugLog('개발 모드라 업데이트 확인을 건너뜀');
    if (manual) notify(APP_NAME, '개발 모드에서는 업데이트를 확인하지 않아요.');
    return;
  }
  // ★ «준비됨» 이어도 확인은 계속한다.
  //   설치를 미루고 오래 켜 두면 그 사이 새 판이 여러 번 나오는데,
  //   예전에는 여기서 그냥 돌아가 버려서 낡은 것을 계속 «준비됨» 이라고 들고 있었다.
  //   (혜원이지가 v1.31.1 에 멈춘 채 1.37.1 까지 여섯 판을 못 본 일이 있다)
  if (updateState === 'ready' && manual) {
    notify(`${APP_NAME} 업데이트 준비됨`,
      `v${updateVersion} 설치 준비가 끝났어요. 클릭하면 재시작하며 설치합니다.`, () => installUpdateNow());
  }
  if (manual) manualUpdateCheck = true;
  autoUpdater.checkForUpdates().catch((e) => debugLog(`업데이트 확인 실패: ${e && e.message ? e.message : e}`));
}

/* ===================== 값 가져오기 ===================== */
// 숨은 창 하나를 계속 띄워 둔다. 앱이 Firestore 를 구독하고 있어서 자료가 바뀌면
// 이 창 안에서 저절로 갱신되고, 우리는 필요할 때 계산 결과만 꺼내 온다.
function getWorkerWindow() {
  if (workerWin && !workerWin.isDestroyed()) return workerWin;
  workerWin = new BrowserWindow({
    show: false,
    width: 1200,
    height: 900,
    webPreferences: { partition: PARTITION, contextIsolation: true, nodeIntegration: false }
  });
  workerWin.on('closed', () => { workerWin = null; });
  /* ★ ?widgetworker=1 — 웹이 이 표식을 보면 로그인·캐시를 «메모리 전용» 으로 돌린다.
     보안 프로그램 격리가 저장창고(IndexedDB)를 손상시켜 로그인이 몇 초 만에 풀리던
     문제(2026-09-01 실측)의 뿌리 해결 — 디스크에 저장할 것 자체를 없앤다. */
  workerWin.loadURL(APP_URL + '?widgetworker=1').catch((e) => debugLog(`숨은 창 로드 실패: ${e.message}`));
  /* ★ 램이 바닥나면 숨은 창의 렌더러가 먼저 죽는다(2026-08-31 실측 — 그 뒤로 poll 이
     영영 매달려 «로그인하세요» 만 남았다). 죽으면 버리고, 다음 poll 이 새로 만든다. */
  workerWin.webContents.on('render-process-gone', (_e, d) => {
    debugLog('숨은 일꾼 창이 죽음(' + (d && d.reason) + ') — 버리고 다음에 새로 만든다');
    try { workerWin.destroy(); } catch (e2) { /* 무시 */ }
    workerWin = null;
  });
  return workerWin;
}

let lastPollDone = Date.now();   // 심장 도장 — pollOnce 가 «끝난» 마지막 때
async function pollOnce() {
  // ★ 시간표가 없는 판(혜원 데스크·혜원이지)은 수업진도를 아예 안 쓴다.
  //   예전에는 화면의 ⟳ 단추가 이걸 불러서, 로그인이 없으니 needLogin 이 되고
  //   위젯 전체가 「수업진도에 로그인해 주세요」 한 장으로 덮여 탭이 사라졌다.
  if (!HAS_TT) return;
  const win = getWorkerWindow();
  try {
    const data = await win.webContents.executeJavaScript(
      'window.__widgetData ? window.__widgetData() : { ready:false, noFn:true }', true);
    if (!data) return;
    if (data.noFn) {
      // 앱은 떴는데 위젯용 함수가 없다 — 옛 버전이 캐시로 떠 있는 경우
      debugLog('__widgetData 없음 — 앱을 다시 불러온다');
      win.webContents.reloadIgnoringCache();
      return;
    }
    if (data.needLogin) {
      debugLog('로그인 필요');
      /* ★ 사람을 부르기 전에 «저장된 계정으로 스스로» 복원해 본다.
         숨은 창의 세션은 여러 이유로 풀린다 — 오래돼서, 저장이 막혀서(보안 프로그램이
         낯선 출신의 파일 고치기를 격리하는 일이 실제로 있었다), 램이 바닥나서.
         그러나 갱신 토큰은 상태 파일에 있고 «읽기» 는 언제나 되므로,
         새 액세스 토큰을 받아 숨은 창에 이어 붙이면 손 안 대고 돌아온다. */
      /* ★ 설치 직후엔 로그인 화면이 «바로» 걷혀야 한다. 그래서 처음에는 매 확인마다
         다시 해 보고, 열 번을 내리 실패하면 그때부터 5분에 한 번으로 물러선다. */
      const restoreGap = loginRestoreFails < 10 ? 45 * 1000 : 5 * 60 * 1000;
      if (Date.now() - lastLoginRestore > restoreGap) {
        lastLoginRestore = Date.now();
        loginRestoreFails++;
        debugLog('저장된 계정으로 로그인 자동 복원을 시도합니다 (' + loginRestoreFails + '번째)');
        recordsmain.accessToken().then((at) => {
          if (!at) { debugLog('자동 복원 — 토큰이 비어 있음'); return; }
          restoreLogin(at);
        }).catch((e) => debugLog('자동 복원 실패: ' + (e && e.message ? e.message : e)));
      }
      lastData = { needLogin: true };
      sendToWidget();
      return;
    }
    if (!data.ready) return;                 // 아직 자료를 불러오는 중
    lastData = data;
    debugLog(`값 갱신 ok — 오늘 수업 ${(data.lessons || []).length}개`);
    sendToWidget();
  } catch (e) {
    debugLog(`값 가져오기 실패: ${e && e.message ? e.message : e}`);
  } finally {
    lastPollDone = Date.now();
  }
}

function sendToWidget() {
  const payload = {
    data: lastData,
    view: getView(),
    scale: SIZES[getScale()],
    version: app.getVersion(),
    theme: getTheme(),
    font: getFont(),
    fontScale: getFontScale(),
    todayEvent: todayEventText(),
    notes: notesToShow(),
    rec: recordsmain.recState(),
    /* 그리는 쪽 안내 글이 «크롬» 이라고 못박지 않도록, 실제로 열리는 이름을 보낸다 */
    browserLabel: browserName(),
    flavor: FLAVOR,
    appName: APP_NAME,
    usage: { show: getUsageShow(), on: getUsageOn(), style: getUsageStyle(),
             data: aiusage.snapshot() },
    comciPick: loadState().comciPick || null,
    comciSide: loadState().comciSide === 'row' ? 'row' : 'col',
    grade: { on: getGradeOn(), sheets: getGradeSheets() },
    wx: { show: getWxShow(), spot: getWxSpot(), data: wxData },
    sys: { show: getSysShow(), data: sysData },
    duty: dutyForWidget(),                       // 급식지도 순서표
    easyFav: loadState().easyFav || [],          // 혜원이지 대시보드 즐겨찾기
    links: getLinks(), linksAt: String(loadState().linksAt || ''),                           // 바로가기 타일
    termStart: getTermStart(),                   // 진도표 1주차 기준
    navStyle: getNavStyle(),                     // 차림표 — 아이콘만/글자만/둘 다
    tabOrder: getTabOrder(),                     // 탭·차림표 순서
    officeFav: getOfficeFav(),                   // 교무실 즐겨찾기
    dashSize: getDashSize(),                     // 대시보드 칸 폭
    board: { url: getBoardUrl(), nick: getBoardNick(), school: mySchoolCode(),
             data: boardData },                  // 전광판
    dashOrder: getDashOrder(), dashOff: getDashOff(),   // 대시보드 칸
    photo: { dir: getPhotoDir(), sec: getPhotoSec() },  // 사진 액자
    feed: { show: getFeedShow(), url: getFeedUrl(), data: feedData,
           hasKey: !!getFeedKey(), fav: getFeedFav(), fold: getFeedFold() },   // 런처 목록
    task: HAS_TT ? { show: getTaskShow(), hasKey: !!getNotionKey(), data: taskData,
      todos: getTodos(), todosAt: String(loadState().todosAt || ''),
      split: getTaskSplit(),
      tick: { on: !!getTickKey(), hasApp: !!(getTickApp().id && getTickApp().secret),
              listId: getTickList(), data: tickData } } : null,
    update: { state: updateState, version: updateVersion }
  };
  if (widgetWin && !widgetWin.isDestroyed()) widgetWin.webContents.send('jindo-data', payload);
  if (easyWin && !easyWin.isDestroyed()) easyWin.webContents.send('jindo-data', payload);
  if (timetableWin && !timetableWin.isDestroyed()) timetableWin.webContents.send('jindo-data', payload);
  updateTrayTooltip();
}

function updateTrayTooltip() {
  if (!tray) return;
  if (!lastData || lastData.needLogin) { tray.setToolTip(`${APP_NAME} — 로그인이 필요합니다`); return; }
  const ls = lastData.lessons || [];
  if (!ls.length) { tray.setToolTip(`${APP_NAME} — 오늘(${lastData.dow}) 수업 없음`); return; }
  const lines = ls.map((l) => `${l.period}교시 ${l.cls} ${l.unit}${l.n ? ' ' + l.n + '차시' : ''}`);
  tray.setToolTip(`오늘 수업 ${ls.length}개\n` + lines.join('\n'));
}

/* ===================== 로그인 (크롬으로) =====================
   위젯 안 창에서 구글 로그인을 하면 구글이 "브라우저 또는 앱이 안전하지 않을 수 있습니다"
   라며 막는다. 그래서 로그인만 진짜 크롬에서 하고, 거기서 받은 구글 ID 토큰을 넘겨받아
   위젯 쪽에서 로그인을 완성한다.

     1) 위젯이 127.0.0.1 에 잠깐 서버를 연다 (포트는 그때그때, 확인값 nonce 를 하나 만든다)
     2) 크롬으로 앱을 연다 — .../?widget=<포트>&nonce=<확인값>
     3) 사용자가 크롬에서 평소처럼 구글 로그인
     4) 앱이 그 포트로 ID 토큰을 보낸다 (확인값이 맞아야 받아준다)
     5) 위젯이 숨은 창의 __widgetSignIn(토큰) 을 불러 로그인을 마친다

   토큰은 바깥으로 안 나가고 내 컴퓨터 안(127.0.0.1)에서만 오간다. */
function stopHandoffServer() {
  if (!handoffServer) return;
  try { handoffServer.close(); } catch (e) { /* 무시 */ }
  handoffServer = null;
}

// 로그인이 끝나면 크롬 화면에 보여줄 쪽지 (폼 전송으로 왔을 때만 쓴다)
const DONE_HTML = '<!doctype html><meta charset="utf-8"><title>위젯 연결됨</title>'
  + '<style>body{margin:0;height:100vh;display:flex;align-items:center;justify-content:center;'
  + 'background:#27187E;color:#fff;font-family:"Segoe UI","Malgun Gothic",sans-serif;text-align:center}'
  + 'h1{font-size:24px;margin:0 0 10px}p{opacity:.85;font-size:14px;margin:0;line-height:1.6}</style>'
  + '<div><h1>위젯에 연결됐습니다 ✅</h1>'
  + '<p>이 탭은 닫으셔도 됩니다.<br>바탕화면 위젯에 오늘 수업이 표시됩니다.</p></div>';

function startLogin() {
  // 이미 기다리고 있으면 서버를 새로 만들지 않는다 — 버튼을 여러 번 눌러도
  // 앞서 연 크롬 탭이 무효가 되지 않게. (탭만 다시 띄운다)
  if (handoffServer && handoffServer.listening) {
    const p = handoffServer.address().port;
    debugLog(`이미 로그인을 기다리는 중 (127.0.0.1:${p}) — ${browserName()} 탭만 다시 엽니다`);
    openInBrowser(handoffUrl(p, handoffNonce));
    return;
  }
  stopHandoffServer();
  handoffDone = false;
  handoffNonce = crypto.randomBytes(16).toString('hex');
  const nonce = handoffNonce;

  // 크롬은 인터넷 페이지가 내 컴퓨터 안(127.0.0.1)으로 보내는 요청을 막을 수 있어서
  // (사설망 접근 제한) 허용 헤더를 함께 내려준다. 그래도 막히면 앱이 폼 전송으로 바꾼다.
  const cors = {
    'Access-Control-Allow-Origin': APP_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Private-Network': 'true'
  };

  handoffServer = http.createServer((req, res) => {
    const url = String(req.url || '');
    if (req.method === 'OPTIONS') { res.writeHead(204, cors); res.end(); return; }

    // 크롬에서 통로가 열려 있는지 확인하는 신호
    if (req.method === 'GET' && url.startsWith('/ping')) {
      debugLog('크롬에서 연결 확인(ping) 도착 — 통로 정상');
      res.writeHead(200, Object.assign({ 'Content-Type': 'text/plain' }, cors));
      res.end('pong');
      return;
    }

    if (req.method !== 'POST' || !url.startsWith('/handoff')) {
      debugLog(`알 수 없는 요청 무시: ${req.method} ${url.slice(0, 40)}`);
      res.writeHead(404, cors); res.end('no');
      return;
    }

    let body = '';
    req.on('data', (c) => {
      body += c;
      if (body.length > 32 * 1024) req.destroy();   // 토큰은 훨씬 짧다 — 그 이상이면 끊는다
    });
    req.on('end', () => {
      // fetch 로 오면 JSON, 폼 전송으로 오면 form 형식이다
      const isForm = String(req.headers['content-type'] || '')
        .indexOf('application/x-www-form-urlencoded') >= 0;
      let gotNonce = null, idToken = null;
      if (isForm) {
        const p = new URLSearchParams(body);
        gotNonce = p.get('nonce'); idToken = p.get('idToken');
      } else {
        try { const j = JSON.parse(body); gotNonce = j.nonce; idToken = j.idToken; } catch (e) { /* 아래에서 걸러짐 */ }
      }

      /* ★ 이미 한 번 받았으면, 뒤따라온 폼 전송에도 «됐다» 고 답해 준다.
         안 그러면 화면에 «잘못된 요청» 이 뜬다 — 사실은 잘 된 것인데도. */
      if (handoffDone && idToken) {
        if (isForm) { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(DONE_HTML); }
        else { res.writeHead(200, Object.assign({ 'Content-Type': 'text/plain' }, cors)); res.end('ok'); }
        debugLog('로그인 정보가 한 번 더 왔습니다 — 이미 끝난 것이라 그냥 됐다고 답합니다');
        return;
      }
      if (gotNonce !== nonce || !idToken) {
        debugLog(`로그인 넘겨받기 거부 — 확인값이 맞지 않습니다 (${isForm ? '폼' : 'fetch'})`);
        res.writeHead(400, cors); res.end('bad');
        return;
      }

      if (isForm) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(DONE_HTML);
      } else {
        res.writeHead(200, Object.assign({ 'Content-Type': 'text/plain' }, cors));
        res.end('ok');
      }
      debugLog(`${browserName()}에서 로그인 정보를 넘겨받았습니다 (${isForm ? '폼 전송' : 'fetch'})`);
      /* ★ 바로 닫으면 안 된다. 웹 쪽은 fetch 가 막힐 때를 대비해 폼 전송을 «한 번 더» 보낸다.
         먼저 온 fetch 를 받고 곧장 닫아 버리면, 뒤따라온 폼 전송이 «연결 거부» 화면을 만난다.
         선생님이 본 그 화면이다. 조금 열어 두었다가 닫는다. */
      handoffDone = true;
      setTimeout(stopHandoffServer, 20 * 1000);
      finishLogin(idToken);
    });
  });

  handoffServer.on('error', (e) => {
    debugLog(`로그인 서버를 못 열었습니다: ${e.message}`);
    notify(APP_NAME, '로그인 창을 여는 데 실패했어요. 잠시 뒤 다시 시도해 주세요.');
    stopHandoffServer();
  });

  handoffServer.listen(0, '127.0.0.1', () => {
    const port = handoffServer.address().port;
    debugLog(`로그인 대기 시작 (127.0.0.1:${port}) — ${browserName()}을(를) 엽니다`);
    openInBrowser(handoffUrl(port, nonce));
    notify(APP_NAME, `${browserName()} 탭을 열었어요. 거기서 구글 로그인해 주세요.`);
  });

  /* 시간이 지나면 닫는다 — 열어둔 채로 두지 않는다.
     ★ 5분은 짧았다. 구글 로그인 뒤에 «주간업무계획 문서» 까지 읽고 나서야 결과를 보내는데,
       문서가 크면 그것만 한참이다. 그 사이에 통로가 닫혀 «연결 거부» 가 났다. */
  setTimeout(() => {
    if (!handoffServer) return;
    debugLog('로그인 대기 시간 초과(15분) — 통로를 닫습니다');
    stopHandoffServer();
  }, 15 * 60 * 1000);
}

let lastLoginRestore = 0;   // 실패가 이어질 때만 간격을 벌린다 — 처음엔 매 확인마다
let loginRestoreFails = 0;  // 내리 실패한 횟수 — 성공하면 0으로
/* 저장된 계정의 «액세스 토큰» 으로 숨은 창 로그인을 복원한다.
   ★ 위젯의 구글 연결에는 openid 가 없어 id 토큰은 못 받는다 — 액세스 토큰이 유일한 길.
     웹(boot.js v1.3.0)의 __widgetSignInAT 가 받아 준다. 옛 웹이 떠 있으면 새로 불러온다. */
async function restoreLogin(accessToken, retried) {
  const win = getWorkerWindow();
  try {
    if (win.webContents.isLoading()) {
      // 막 켠 직후엔 웹이 아직 뜨는 중이다 — 지금 던지면 헛발질이니 다 뜬 다음에 한다
      debugLog('자동 복원 — 웹이 뜨는 중이라 기다렸다 시도합니다');
      win.webContents.once('did-finish-load', () => setTimeout(() => restoreLogin(accessToken, retried), 1500));
      return;
    }
    const ok = await win.webContents.executeJavaScript(
      'window.__widgetSignInAT ? window.__widgetSignInAT(' + JSON.stringify(accessToken) + ') : null', true);
    if (ok === null) {
      if (retried) { debugLog('자동 복원 — 웹에 __widgetSignInAT 가 없습니다'); return; }
      debugLog('자동 복원 — 웹이 옛 판이라 새로 불러온 뒤 다시');
      win.webContents.reloadIgnoringCache();
      win.webContents.once('did-finish-load', () => setTimeout(() => restoreLogin(accessToken, true), 2500));
      return;
    }
    debugLog('로그인 자동 복원 완료 — 손댈 것 없이 이어집니다');
    loginRestoreFails = 0;
    setTimeout(pollOnce, 2000);
  } catch (e) {
    debugLog('자동 복원 마무리 실패: ' + (e && e.message ? e.message : e));
  }
}
async function finishLogin(idToken, retried) {
  const win = getWorkerWindow();
  try {
    const ok = await win.webContents.executeJavaScript(
      `window.__widgetSignIn ? window.__widgetSignIn(${JSON.stringify(idToken)}) : null`, true);
    if (ok === null) {
      // 앱이 아직 옛 버전(캐시)이면 이 함수가 없다 — 한 번만 새로 불러오고 다시 시도
      if (retried) { debugLog('앱에 __widgetSignIn 이 없습니다'); return; }
      debugLog('__widgetSignIn 없음 — 앱을 새로 불러오고 다시 시도');
      win.webContents.reloadIgnoringCache();
      win.webContents.once('did-finish-load', () => setTimeout(() => finishLogin(idToken, true), 2500));
      return;
    }
    debugLog('로그인 완료');
    notify(APP_NAME, '로그인됐어요. 이제 위젯에 오늘 수업이 표시됩니다.');
    setTimeout(pollOnce, 2500);
  } catch (e) {
    debugLog(`로그인 마무리 실패: ${e && e.message ? e.message : e}`);
    notify(APP_NAME, '로그인을 마무리하지 못했어요. 트레이 메뉴에서 다시 시도해 주세요.');
  }
}

/* ===================== 업무포털 =====================
   ★ 자동 로그인은 «업무포털접속도우미» 가 이미 하고 있다(셀레니움으로 진짜 브라우저를 몬다).
     그것을 앱에서 다시 만들지 않는다 — 한 번 눌러 대신 실행해 줄 뿐이다.
   ★ 도우미가 없거나 못 찾으면 «그냥 포털 열기» 로 내려간다. 되돌아갈 길은 늘 둔다.
   ★ 인증서 비밀번호는 도우미의 config.ini 가 들고 있다. 이 앱은 손대지 않는다 —
     읽지도, 옮기지도, 기록하지도 않는다. */
const PORTAL_URL = 'https://sen.eduptl.kr';        // 서울시교육청 업무포털
/* 도우미가 흔히 놓이는 자리 — 바탕화면과 OneDrive 바탕화면 */
function portalHelperRoots() {
  const home = app.getPath('home');
  const out = [];
  try { out.push(app.getPath('desktop')); } catch (e) { /* 무시 */ }
  try {
    fs.readdirSync(home).forEach(function (d) {
      if (d.indexOf('OneDrive') !== 0) return;
      ['바탕 화면', 'Desktop'].forEach(function (b) {
        out.push(path.join(home, d, b));
      });
    });
  } catch (e) { /* 무시 */ }
  return out;
}
/* 폴더 안에서 도우미 exe 를 찾는다.
   ★ 바탕화면을 통째로 뒤지면 느리다. «이름이 그럴듯한 폴더» 로만 들어간다.
     (업무포털접속도우미_v_102 › 업무포털접속도우미 › 나이스_크롬(1.02).exe 처럼 두 겹) */
const PORTAL_DIR_RE = /도우미|포털|eduptl|나이스|에듀파인/i;
const PORTAL_EXE_RE = /^(?=.*\.exe$)(?=.*(나이스|에듀파인|포털)).*$/i;
function portalScan(dir, depth) {
  const found = [];
  let names = [];
  try { names = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return found; }
  names.forEach(function (n) {
    const p = path.join(dir, n.name);
    if (n.isDirectory()) {
      if (depth > 0 && PORTAL_DIR_RE.test(n.name)) {
        portalScan(p, depth - 1).forEach(function (x) { found.push(x); });
      }
    } else if (PORTAL_EXE_RE.test(n.name)) {
      found.push(p);
    }
  });
  return found;
}
function portalHelpers() {
  const pick = String(loadState().portalHelperDir || '');
  const roots = pick ? [pick] : portalHelperRoots();
  const seen = {}, out = [];
  roots.forEach(function (r) {
    portalScan(r, pick ? 2 : 2).forEach(function (p) {
      if (seen[p]) return;
      seen[p] = 1;
      const base = path.basename(p).replace(/\.exe$/i, '');
      out.push({
        path: p,
        /* «나이스_크롬(1.02)» → 곳 «나이스» · 브라우저 «크롬» */
        where: /에듀파인/.test(base) ? '에듀파인' : (/나이스/.test(base) ? '나이스' : '포털'),
        via: /엣지/.test(base) ? '엣지' : (/크롬/.test(base) ? '크롬' : ''),
        name: base.replace(/\(.*\)$/, '').replace(/_/g, ' ')
      });
    });
  });
  return out;
}
function portalInfo() {
  const list = portalHelpers();
  return {
    url: PORTAL_URL,
    dir: String(loadState().portalHelperDir || ''),
    items: list.map(function (x, i) {
      return { i: i, where: x.where, via: x.via, name: x.name };
    })
  };
}
/* 도우미를 띄울 때 쓰는 조건.
   ★ 처음엔 그냥 stdio:'ignore' 로 띄웠다가 도우미가 죽었다 —
       UnicodeEncodeError: 'cp949' codec can't encode character '\U0001f517'
     도우미는 파이썬으로 만든 것이고, 진행 상황을 이모지(🔗)와 함께 찍는다.
     탐색기에서 두 번 눌러 띄우면 파이썬이 «진짜 콘솔» 을 알아보고 유니코드로 쓰지만,
     출력을 없애고 띄우면 콘솔이 아니어서 지역 문자표(cp949)로 바꾸려다 터진다.
     PYTHONIOENCODING/PYTHONUTF8 로 «출력은 UTF-8» 이라고 못박아 준다.
   ★ cwd 는 도우미 폴더 — 도우미가 제 폴더의 config.ini 를 읽는다. */
function portalSpawnOpts(dir) {
  return {
    cwd: dir,
    detached: true,
    stdio: 'ignore',
    windowsHide: false,
    env: Object.assign({}, process.env, {
      PYTHONIOENCODING: 'utf-8',
      PYTHONUTF8: '1',
      PYTHONLEGACYWINDOWSSTDIO: ''
    })
  };
}
function openPortal(i) {
  const list = portalHelpers();
  const x = (i === undefined || i === null || i < 0) ? null : list[i];
  if (!x) {
    debugLog('업무포털 — 도우미가 없어 ' + browserName() + '으로 그냥 엽니다');
    openInBrowser(PORTAL_URL);
    return { ok: true, how: 'browser' };
  }
  try {
    /* ★ «탐색기에서 두 번 누르는 것» 과 똑같이 띄운다.
       환경변수(PYTHONIOENCODING)만으로는 모자랐다 — LG 에서 여전히 cp949 로 죽었다.
       도우미는 파이썬이고, 파이썬은 «진짜 콘솔» 이 붙어 있을 때만 유니코드로 쓴다.
       cmd 의 start 는 새 콘솔을 만들어 주므로, 사람이 두 번 누른 것과 같은 자리가 된다.
       /D 로 도우미 폴더를 일터로 잡아 준다(거기서 config.ini 를 읽는다). */
    const dir = path.dirname(x.path);
    spawn(process.env.ComSpec || 'cmd.exe',
      ['/c', 'start', '', '/D', dir, x.path],
      Object.assign(portalSpawnOpts(dir), { windowsHide: true })).unref();
    debugLog('업무포털 도우미 실행(새 콘솔): ' + path.basename(x.path));
    return { ok: true, how: 'helper', name: x.name };
  } catch (e) {
    debugLog('도우미 실행 실패(' + e.message + ') — 그냥 포털을 엽니다');
    openInBrowser(PORTAL_URL);
    return { ok: false, how: 'browser', error: e.message };
  }
}

/* ===================== 위젯 창 ===================== */
// 이번주 격자는 요일 다섯 칸이 들어가야 해서 카드가 넓어야 한다. 다른 화면은 좁게.
// 사용자가 직접 크기를 바꿨으면 그 크기를 존중한다 — 화면을 옮길 때마다 되돌리면 곤란하다
/* ── 창을 화면 안에 가둔다 ────────────────────────────────
   ★ 창이 화면보다 크면 아래쪽이 모니터 밖으로 나간다. 그러면 맨 아래 내용이
     «잘려 보인다» — CSS 여백을 아무리 늘려도 그 여백째 화면 밖이라 소용없다.
     실제로 1024×1537 창이 1032 높이 화면에 놓여 344px 가 밖에 있었다.
   ★ 사람이 끌어 고치기도 어렵다 — 창 아래가 안 보이니 잡을 데가 없다.
     그래서 앱이 스스로 다듬는다. */
/* 모니터를 다 합친 «바탕» — 여러 대를 가로로 이어 붙인 전체 넓이.
   ★ 이것이 필요한 까닭: 이 PC 는 모니터가 셋이고(1920 + 1200 + 1024),
     선생님은 위젯을 1280 폭으로 두 모니터에 걸쳐 쓰신다.
     한계를 «모니터 한 대» 로 잡으면 그 창을 켤 때마다 1024 로 줄여 버리고,
     오른쪽 가장자리를 끌어도 꿈쩍하지 않는다 — v1.70.0 이 그랬다. */
function deskBox() {
  const ds = screen.getAllDisplays();
  const L = Math.min.apply(null, ds.map((d) => d.workArea.x));
  const T = Math.min.apply(null, ds.map((d) => d.workArea.y));
  const R = Math.max.apply(null, ds.map((d) => d.workArea.x + d.workArea.width));
  const B = Math.max.apply(null, ds.map((d) => d.workArea.y + d.workArea.height));
  return { x: L, y: T, width: R - L, height: B - T };
}
/* ★★ 크기는 «건드리지 않는다». 자리만 본다.
   여기서 크기를 줄이려던 것이 이 앱에서 가장 큰 말썽이었다.

   까닭 — 이 PC 는 모니터마다 배율이 다르다(세로 모니터만 1.25배).
   그러면 screen 이 알려 주는 작업 영역과 창이 알려 주는 크기가 «다른 단위» 다.
     세로 모니터의 작업 영역을 그대로 달라고 하면 (1024x1489)
     창은 1280x1293 이라고 답한다 — DIP 로는 1025x1035 다.
   이 둘을 곧바로 견주면 멀쩡한 창이 «작업 영역보다 크다» 로 나온다.
   그래서 켤 때마다 1280 → 1024 로 줄었고, 오른쪽·아래 가장자리를 끌어도
   꿈쩍하지 않았다. 기록에도 매번 남아 있었다.

   창이 화면보다 조금 크더라도 큰일이 아니다 — 안에서 굴려 볼 수 있고,
   맨 끝은 «여기가 끝입니다» 로 알 수 있다(v1.72.0).
   정작 위험한 것은 창이 통째로 화면 밖으로 나가 «잡을 데가 없어지는» 것이다.
   그것만 막는다. */
function fitToScreen(b) {
  let a;
  try { a = screen.getDisplayMatching(b).workArea; }
  catch (e) { a = screen.getPrimaryDisplay().workArea; }
  const u = deskBox();
  const width = Math.max(240, b.width);
  const height = Math.max(180, b.height);
  /* 제목 줄을 잡을 수 있어야 한다 — 왼쪽 위 모서리를 바탕 안에 두고,
     적어도 한 뼘(가로 160 · 세로 80)은 화면에 걸쳐 두게 한다. */
  let x = Math.min(Math.max(b.x, u.x), u.x + u.width - 160);
  let y = Math.min(Math.max(b.y, a.y), a.y + a.height - 80);
  /* ★ 가로·세로를 따로 다듬으면 «어느 화면에도 안 걸리는» 자리가 나올 수 있다.
     모니터가 ㄱ 자로 놓여 있어서 가운데가 비기 때문이다.
     (x=100, y=99999 인 창이 100,1248 로 왔는데 그 자리엔 모니터가 없었다)
     정말로 아무 화면에도 안 걸리면 주 화면 왼쪽 위로 데려온다. */
  const seen = screen.getAllDisplays().some(function (d) {
    const q = d.workArea;
    return x < q.x + q.width && x + width > q.x && y < q.y + q.height && y + height > q.y;
  });
  if (!seen) {
    const p = screen.getPrimaryDisplay().workArea;
    x = p.x + 40; y = p.y + 40;
  }
  return { x, y, width, height };
}
/* ★★ 한계를 «걸지 않는다». 오히려 전에 걸어 둔 한계를 푸는 자리다.

   v1.70.0 에서 «창이 화면보다 커지지 못하게» 한계를 걸었다.
   그 뒤로 세 가지가 한꺼번에 망가졌다 —
     · 두 모니터에 걸쳐 넓게 쓰던 창이 켤 때마다 줄었다 (1280 → 1024)
     · 아래 가장자리를 끌어도 세로가 더 안 늘었다
     · 백틱(`) 전체화면이 1488 에서 막혔다 (화면 전체는 1537)

   애초에 막으려던 «바닥이 잘림» 은 창 크기 탓이 아니었다.
   긴 화면에 «끝» 표시가 없어서 잘린 것처럼 보였을 뿐이고,
   그것은 v1.72.0 에서 «여기가 끝입니다» 로 고쳤다.
   있지도 않은 병을 고치려다 멀쩡한 세 군데를 망가뜨렸다. 걷어낸다.

   ★ setMaximumSize(0, 0) 은 «한계 없음» 이다.
     이미 깔려 있는 판에 걸어 둔 한계도 이걸로 풀린다. */
function clampWindow(win) {
  if (!win || win.isDestroyed()) return;
  try { win.setMaximumSize(0, 0); } catch (e) { /* 못 풀어도 그만 */ }
}
/* 두 창에 한꺼번에 */
function clampAll(why) {
  [widgetWin, easyWin].forEach(function (w) {
    if (!w || w.isDestroyed()) return;
    clampWindow(w);
    fitWindowNow(w, why);
  });
}

/* 지금 창이 화면 밖으로 나가 있으면 끌어들인다 */
function fitWindowNow(win, why) {
  if (!win || win.isDestroyed() || win.isFullScreen()) return;
  const b = win.getBounds();
  const n = fitToScreen(b);
  if (n.x === b.x && n.y === b.y && n.width === b.width && n.height === b.height) return;
  debugLog(`창을 화면 안으로 (${why}) — ${b.width}x${b.height}@${b.x},${b.y}`
    + ` → ${n.width}x${n.height}@${n.x},${n.y}`);
  win.setBounds(n);
  if (win === widgetWin) saveState({ userW: n.width, userH: n.height, x: n.x, y: n.y });
}

function userSized() { const s = loadState(); return !!(s.userW && s.userH); }
function baseWidthFor(view) { return ['week', 'work', 'comci', 'cal'].includes(view) ? 560 : 360; }
function widgetSize(view) {
  const s = loadState();
  if (s.userW && s.userH) {
    /* ★ 저장해 둔 크기가 지금 화면보다 클 수 있다 — 모니터를 바꿨거나,
       예전에 큰 화면에서 키워 둔 채로 왔거나. 그대로 되살리면 아래가 잘린다. */
    const f = fitToScreen({ x: s.x || 0, y: s.y || 0, width: s.userW, height: s.userH });
    return { width: f.width, height: f.height };
  }
  const k = SIZES[getScale()];
  return { width: Math.round(baseWidthFor(view || getView()) * k), height: Math.round(300 * k) };
}
function applyWidgetWidth(view) {
  if (!widgetWin || widgetWin.isDestroyed()) return;
  if (userSized()) return;   // 직접 맞춰 둔 크기를 건드리지 않는다
  const want = Math.round(baseWidthFor(view) * SIZES[getScale()]);
  const b = widgetWin.getBounds();
  if (b.width === want) return;
  // 오른쪽 끝이 화면 밖으로 밀려나지 않게 필요하면 왼쪽으로 당긴다
  const a = screen.getPrimaryDisplay().workArea;
  let x = b.x;
  if (x + want > a.x + a.width) x = Math.max(a.x, a.x + a.width - want - 8);
  widgetWin.setBounds({ x, y: b.y, width: want, height: b.height });
  saveState({ x });
}
// 저장된 위치가 «쓸 만하게 보이는지» 본다.
// ★예전에는 1픽셀만 겹쳐도 통과시켜서, 위젯이 옆 모니터 맨 위 모서리에 4분의 1만 걸친 채
//   사라진 것처럼 보인 적이 있다. 머리 줄을 잡을 수 있을 만큼은 보여야 한다.
const NEED_W = 200, NEED_H = 60;
function isUsablePos(x, y, size) {
  return screen.getAllDisplays().some((d) => {
    const a = d.workArea;
    const w = Math.min(x + size.width, a.x + a.width) - Math.max(x, a.x);
    const h = Math.min(y + size.height, a.y + a.height) - Math.max(y, a.y);
    return w >= Math.min(NEED_W, size.width) && h >= Math.min(NEED_H, size.height);
  });
}
function safePosition(state, size) {
  const x = state.x, y = state.y;
  if (typeof x === 'number' && typeof y === 'number' && isUsablePos(x, y, size)) return { x, y };
  const a = screen.getPrimaryDisplay().workArea;
  return { x: a.x + a.width - size.width - 30, y: a.y + 60 };
}
// 모니터를 뽑거나 배치가 바뀐 뒤 위젯이 화면 밖에 남지 않게 확인한다
/* ★ 전에는 «자리» 만 보고 «크기» 는 안 봤다.
   그래서 1024x1537 창이 1032 높이 화면에 그대로 남아, 아래 344px 가
   모니터 밖에 있었다 — 맨 아래 내용이 통째로 잘려 보였다.
   크기도 함께 다듬는다. */
function keepOnScreen() {
  fitWindowNow(widgetWin, '화면 살피기');
  fitWindowNow(easyWin, '화면 살피기');
  if (!widgetWin || widgetWin.isDestroyed()) return;
  const b = widgetWin.getBounds();
  if (isUsablePos(b.x, b.y, b)) return;
  const p = safePosition({}, b);
  widgetWin.setBounds({ x: p.x, y: p.y, width: b.width, height: b.height });
  saveState({ x: p.x, y: p.y });
  debugLog(`위젯이 화면 밖이라 되돌렸습니다 -> (${p.x}, ${p.y})`);
}
/* ── 넓은 창 ──────────────────────────────────────────────
   떠 있는 카드가 아니라 «열어서 일하는» 창. 담긴 것은 위젯과 똑같고,
   왼쪽 메뉴와 대시보드로 넓게 볼 뿐이다(easy.html · easy.js).
   ★ 별도 프로그램이 아니라 이 앱의 두 번째 창이다 — 설정·구글 로그인을 함께 쓴다. */
let easyWin = null;
function openEasyWindow() {
  // ★ 스위치다 — 넓게 보기를 열면 떠 있는 카드는 물러난다.
  //   둘이 함께 떠 있으면 같은 것이 두 군데 보여 헷갈린다.
  saveState({ viewMode: 'easy' });
  if (widgetWin && !widgetWin.isDestroyed()) widgetWin.hide();
  if (rebuildTrayMenu) rebuildTrayMenu();
  if (easyWin && !easyWin.isDestroyed()) { easyWin.show(); easyWin.focus(); return; }
  const st = loadState();
  easyWin = new BrowserWindow({
    /* ★ 저장해 둔 크기가 지금 화면보다 클 수 있다 — 그대로 되살리면 아래가 잘린다 */
    ...(function () {
      const f = fitToScreen({ x: Number(st.easyX) || 0, y: Number(st.easyY) || 0,
        width: Number(st.easyW) || 1100, height: Number(st.easyH) || 750 });
      return { width: f.width, height: f.height };
    })(),
    x: typeof st.easyX === 'number' ? st.easyX : undefined,
    y: typeof st.easyY === 'number' ? st.easyY : undefined,
    minWidth: 880, minHeight: 560,
    backgroundColor: '#0f172a',
    title: APP_NAME,
    icon: path.join(__dirname, 'assets', ICON),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  easyWin.setMenuBarVisibility(false);
  easyWin.loadFile('easy.html');

  let boundsTimer = null;
  const remember = () => {
    clearTimeout(boundsTimer);
    boundsTimer = setTimeout(() => {
      if (!easyWin || easyWin.isDestroyed() || easyWin.isMaximized()) return;
      const b = easyWin.getBounds();
      saveState({ easyW: b.width, easyH: b.height, easyX: b.x, easyY: b.y });
    }, 400);
  };
  easyWin.on('resize', remember);
  easyWin.on('move', remember);
  easyWin.on('closed', () => {
    easyWin = null;
    // 창을 닫으면 떠 있는 카드로 돌아간다 — 아무것도 안 남으면 앱이 사라진 것처럼 보인다
    showWidgetOnly();
  });
  clampWindow(easyWin);
  easyWin.on('moved', () => clampWindow(easyWin));
  easyWin.webContents.once('did-finish-load', () => {
    sendToWidget(); sendTasks();
    clampWindow(easyWin);
    fitWindowNow(easyWin, '넓게 보기를 띄운 뒤');
  });
}

/* 넓게 보기를 접고 떠 있는 카드로 돌아간다 */
function showWidgetOnly() {
  saveState({ viewMode: 'widget' });
  if (easyWin && !easyWin.isDestroyed()) { const w = easyWin; easyWin = null; w.destroy(); }
  if (!widgetWin || widgetWin.isDestroyed()) createWidgetWindow();
  else { widgetWin.show(); widgetWin.focus(); }
  if (rebuildTrayMenu) rebuildTrayMenu();
}

/* ── 전역 단축키 ───────────────────────────────────────────
   부르기 · 감추기를 따로 정한다. 같은 키면 번갈아 된다.
   ★ 윈도우 전체에서 가로채는 것이라, 이미 쓰는 키면 등록이 «조용히» 실패한다.
     register() 가 false 를 돌려주는데 그걸 놓치면 «왜 안 되지» 가 된다. */
let hotErr = '';
function getHot() {
  const s = loadState();
  return { show: String(s.hotShow || '').trim(), hide: String(s.hotHide || '').trim() };
}
function hideWidgetNow() {
  if (easyWin && !easyWin.isDestroyed()) easyWin.hide();
  if (widgetWin && !widgetWin.isDestroyed()) widgetWin.hide();
}
function anyShown() {
  if (easyWin && !easyWin.isDestroyed() && easyWin.isVisible()) return true;
  return !!(widgetWin && !widgetWin.isDestroyed() && widgetWin.isVisible());
}
function applyHotkeys() {
  try { globalShortcut.unregisterAll(); } catch (e) {}
  const h = getHot();
  const bad = [];
  const put = (key, fn) => {
    if (!key) return;
    let ok = false;
    try { ok = globalShortcut.register(key, fn); } catch (e) { ok = false; }
    if (!ok) bad.push(key);
  };
  if (h.show && h.show === h.hide) {
    // 같은 키 하나로 번갈아
    put(h.show, () => { if (anyShown()) hideWidgetNow(); else showWidgetOnly(); });
  } else {
    put(h.show, () => showWidgetOnly());
    put(h.hide, () => hideWidgetNow());
  }
  hotErr = bad.length
    ? bad.join(' , ') + ' 는 다른 프로그램이 이미 쓰고 있습니다'
    : '';
  if (bad.length) debugLog('전역 단축키 등록 실패 — ' + bad.join(', '));
  else if (h.show || h.hide) debugLog('전역 단축키 — 부르기 ' + (h.show || '없음')
    + ' / 감추기 ' + (h.hide || '없음'));
}

function createWidgetWindow() {
  const size = widgetSize();
  const pos = safePosition(loadState(), size);
  widgetWin = new BrowserWindow({
    width: size.width, height: size.height, x: pos.x, y: pos.y,
    frame: false,
    backgroundColor: '#15181d',
    resizable: true,
    minWidth: 300, minHeight: 180,
    alwaysOnTop: getAlwaysOnTop(),
    skipTaskbar: true,
    opacity: getOpacity(),
    title: '',
    icon: path.join(__dirname, 'assets', ICON),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  widgetWin.setTitle('');
  if (getAlwaysOnTop()) widgetWin.setAlwaysOnTop(true, 'screen-saver');
  widgetWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  widgetWin.loadFile('widget.html');

  let sizeTimer = null;
  widgetWin.on('resize', () => {
    clearTimeout(sizeTimer);
    sizeTimer = setTimeout(() => {
      if (!widgetWin || widgetWin.isDestroyed()) return;
      const b = widgetWin.getBounds();
      saveState({ userW: b.width, userH: b.height });
    }, 400);
  });

  let saveTimer = null;
  widgetWin.on('move', () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      if (!widgetWin || widgetWin.isDestroyed()) return;
      const [x, y] = widgetWin.getPosition();
      saveState({ x, y });
    }, 400);
  });
  widgetWin.on('closed', () => { widgetWin = null; });
  /* ★ 끌어도 작업 영역을 못 넘게 한계를 건다 — 이게 근본이다 */
  clampWindow(widgetWin);
  /* 창을 옮기면 다른 모니터일 수 있다 — 그 화면 기준으로 한계를 다시 잡는다 */
  widgetWin.on('moved', () => clampWindow(widgetWin));
  widgetWin.webContents.once('did-finish-load', () => {
    sendToWidget(); sendTasks();
    /* ★ 이미 어긋나 저장된 크기·자리를 한 번 바로잡는다.
       사람이 끌어 고치기 어렵다 — 창 아래가 화면 밖이면 잡을 데가 없다. */
    clampWindow(widgetWin);
    fitWindowNow(widgetWin, '창을 띄운 뒤');
  });
}

function applyScale(key) {
  saveState({ size: key });
  if (widgetWin && !widgetWin.isDestroyed()) {
    const s = widgetSize(getView());
    const [x, y] = widgetWin.getPosition();
    widgetWin.setBounds({ x, y, width: s.width, height: s.height });
  }
  sendToWidget();
}
function resetWidgetPosition() {
  if (!widgetWin || widgetWin.isDestroyed()) { createWidgetWindow(); return; }
  const a = screen.getPrimaryDisplay().workArea;
  const b = widgetWin.getBounds();
  const x = Math.round(a.x + (a.width - b.width) / 2);
  const y = Math.round(a.y + (a.height - b.height) / 2);
  widgetWin.setBounds({ x, y, width: b.width, height: b.height });
  saveState({ x, y });
  widgetWin.show(); widgetWin.focus();
  debugLog(`위젯 위치 초기화: 주 모니터 가운데(${x}, ${y})`);
}
function applyOpacity(v) {
  saveState({ opacity: v });
  if (widgetWin && !widgetWin.isDestroyed()) widgetWin.setOpacity(v);
}
function applyAlwaysOnTop(on) {
  saveState({ alwaysOnTop: on });
  if (widgetWin && !widgetWin.isDestroyed()) widgetWin.setAlwaysOnTop(on, on ? 'screen-saver' : 'normal');
}

/* ===================== 주간 시간표 «크게 보기» ===================== */
// 위젯 카드는 좁아서 앱의 표를 그대로 담을 수 없다. 그래서 폭 제약이 없는 창을 따로 띄운다.
function openTimetableWindow() {
  if (timetableWin && !timetableWin.isDestroyed()) {
    timetableWin.show(); timetableWin.focus();
    return;
  }
  const a = screen.getPrimaryDisplay().workArea;
  timetableWin = new BrowserWindow({
    width: Math.min(1240, a.width - 60),
    height: Math.min(880, a.height - 60),
    title: '주간 시간표',
    backgroundColor: '#F7F7FF',
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'assets', ICON),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  timetableWin.loadFile('timetable.html');
  timetableWin.on('closed', () => { timetableWin = null; });
  timetableWin.webContents.once('did-finish-load', () => sendToWidget());
  debugLog('주간 시간표 창을 열었습니다');
}

/* ===================== 컴시간알리미 ===================== */
// 학교 시간표를 한 번 받아 파일에 저장해 둔다 — 그 뒤로는 인터넷이 없어도 계속 보인다.
const comcigan = require('./comcigan.js');
const comciFile = path.join(userDataPath, 'comcigan.json');

function loadComci() {
  try { return JSON.parse(fs.readFileSync(comciFile, 'utf-8')); } catch (e) { return null; }
}
function saveComci(v) {
  try { fs.writeFileSync(comciFile, JSON.stringify(v)); } catch (e) { debugLog(`컴시간 저장 실패: ${e.message}`); }
}
function getComciConfig() {
  const s = loadState().comci || {};
  return {
    school: s.school || null,
    wantTeacher: s.wantTeacher === undefined ? true : !!s.wantTeacher,
    wantClasses: !!s.wantClasses,
    teacher: s.teacher || '',
    teacherIdx: Number(s.teacherIdx) || 0
  };
}

// 컴시간 자료나 설정이 바뀌면 위젯이 들고 있던 것을 버리고 다시 읽게 한다.
// (안 그러면 설정에서 교사를 바꿔도 위젯은 예전 자료를 계속 보여준다)
function comciChanged() {
  if (widgetWin && !widgetWin.isDestroyed()) widgetWin.webContents.send('comci-changed');
}
ipcMain.handle('comci-search', async (_e, name) => {
  try {
    debugLog(`컴시간 학교 검색: ${name}`);
    return { list: await comcigan.searchSchool(String(name || '')) };
  } catch (e) {
    debugLog(`컴시간 검색 실패: ${e && e.message ? e.message : e}`);
    return { error: (e && e.message) || '검색에 실패했습니다' };
  }
});

async function comciFetchNow(why) {
  const cfg = getComciConfig();
  if (!cfg.school) return { error: '학교를 먼저 골라주세요' };
  try {
    debugLog(`컴시간 시간표 받기: ${cfg.school.name}` + (why ? ` (${why})` : ''));
    // 한 번 부르면 교사·학급이 같이 온다 — 둘 다 저장해 두고, 무엇을 볼지는 위젯에서 고른다
    const data = await comcigan.fetchTimetable(cfg.school.code);
    data.schoolName = cfg.school.name;     // 컴시간이 학교명을 가려서 주므로 고른 이름을 쓴다
    saveComci(data);
    debugLog(`컴시간 받기 완료 — 교사 ${(data.teachers || []).length}명`);
    comciChanged();
    sendToWidget();
    return { data };
  } catch (e) {
    debugLog(`컴시간 받기 실패: ${e && e.message ? e.message : e}`);
    return { error: (e && e.message) || '불러오지 못했습니다' };
  }
}
ipcMain.handle('comci-fetch', () => comciFetchNow(''));

/* ── 업무관리(노션) 창구 ── */
ipcMain.handle('task-refresh', async () => { await refreshTasks('눌러서'); return taskData; });
ipcMain.handle('task-set-status', async (_e, id, name) => {
  try {
    await notion.setStatus(getNotionKey(), id, name);
    debugLog('업무관리 — 상태 바꿈: ' + name);
    await refreshTasks('고친 뒤');
    return { ok: true };
  } catch (e) { return { ok: false, error: (e && e.message) || String(e) }; }
});
ipcMain.handle('task-set-due', async (_e, id, ymd) => {
  try {
    await notion.setDue(getNotionKey(), id, ymd);
    debugLog('업무관리 — 마감일 바꿈: ' + (ymd || '(지움)'));
    await refreshTasks('고친 뒤');
    return { ok: true };
  } catch (e) { return { ok: false, error: (e && e.message) || String(e) }; }
});
ipcMain.handle('task-create', async (_e, title, projectId, ymd) => {
  try {
    if (!String(title || '').trim()) return { ok: false, error: '내용을 적어 주세요' };
    await notion.createTask(getNotionKey(), getTaskDb(), title, projectId, ymd);
    debugLog('업무관리 — 새 태스크: ' + String(title).slice(0, 30));
    await refreshTasks('만든 뒤');
    return { ok: true };
  } catch (e) { return { ok: false, error: (e && e.message) || String(e) }; }
});
/* ── 내 할 일 창구 ── (노션과 무관, 이 PC 에만 저장) */
ipcMain.handle('todo-add', (_e, text) => {
  const t = String(text || '').trim().slice(0, 200);
  if (!t) return { ok: false, error: '내용을 적어 주세요' };
  const list = getTodos();
  /* 겹치지 않는 번호 — 시각만 쓰면 빨리 두 번 누를 때 같은 번호가 났다 */
  const id = 'td' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
  list.unshift({ id: id, text: t, done: false, at: stampKST(), doneAt: '' });
  saveTodos(list);
  return { ok: true, at: stampKST() };
});
ipcMain.handle('todo-toggle', (_e, id) => {
  const list = getTodos();
  const x = list.filter((v) => v.id === id)[0];
  if (!x) return { ok: false, error: '없는 항목입니다' };
  x.done = !x.done;
  x.doneAt = x.done ? stampKST() : '';
  saveTodos(list);
  return { ok: true, at: stampKST() };
});
ipcMain.handle('todo-del', (_e, id) => {
  saveTodos(getTodos().filter((v) => v.id !== id));
  return { ok: true, at: stampKST() };
});
/* 완료한 것 «모두» 지우기 — 접어 둔 아코디언 안의 단추 */
ipcMain.handle('todo-clear-done', () => {
  const left = getTodos().filter((v) => !v.done);
  saveTodos(left);
  return { ok: true, at: stampKST() };
});
/* 순서 바꾸기 — 안 끝난 것들 사이에서만 위·아래로 */
ipcMain.handle('todo-move', (_e, id, dir) => {
  const list = getTodos();
  const live = list.filter((v) => !v.done);
  const i = live.findIndex((v) => v.id === id);
  const j = i + (dir === 'up' ? -1 : 1);
  if (i < 0 || j < 0 || j >= live.length) return { ok: true };
  const tmp = live[i]; live[i] = live[j]; live[j] = tmp;
  saveTodos(live.concat(list.filter((v) => v.done)));
  return { ok: true, at: stampKST() };
});

/* ── 수업진도 대시보드 얹기 ──────────────────────────────────
   ★ 4천 줄짜리 웹앱을 위젯 화면으로 «옮겨 적지» 않는다. 그러면 웹앱을 고칠 때마다
     양쪽을 따로 고쳐야 하고, 오늘 겪은 «한쪽만 고쳐 안 맞는» 일이 늘 생긴다.
     대신 그 앱을 «진짜 그대로» 탭 안에 얹는다(BrowserView). 웹앱을 고치면 여기도 따라온다.
   ★ 로그인은 숨은 창과 같은 길을 쓴다 — 저장창고가 격리로 깨지는 PC 가 있어
     이 창도 메모리 전용(?widgetworker=1)으로 띄우고, 액세스 토큰으로 이어 붙인다. */
let dashView = null, dashOwner = null, dashScreen = '';
const DASH_SCREENS = { plan: 'plan', daily: 'daily', grid: 'grid' };

function dashDetach() {
  if (!dashView) return;
  try { if (dashOwner && !dashOwner.isDestroyed()) dashOwner.removeBrowserView(dashView); }
  catch (e) { /* 무시 */ }
  dashOwner = null;
}
function dashDestroy() {
  dashDetach();
  try { if (dashView && dashView.webContents && !dashView.webContents.isDestroyed()) dashView.webContents.destroy(); }
  catch (e) { /* 무시 */ }
  dashView = null; dashScreen = '';
}
/* 그 앱 안에서 화면을 갈아 끼운다 — 위쪽 탭 단추를 눌러 주는 것과 같다 */
function dashGo(screen) {
  if (!dashView) return;
  const v = DASH_SCREENS[screen] || 'plan';
  dashView.webContents.executeJavaScript(
    '(function(){var b=document.querySelector(\'[data-view="' + v + '"]\');'
    + 'if(b){ b.click(); return true; } return false; })()', true)
    .catch(() => { /* 아직 안 떴으면 다 뜬 뒤에 다시 부른다 */ });
}
/* 로그인이 필요하면 숨은 창과 같은 방법으로 이어 붙인다 */
/* 얹은 화면 로그인 — 한 번 해 보고 마는 것이 아니라 관문이 걷힐 때까지 지켜본다.
   ★ 이 창(?widgetworker=1)의 auth 는 디스크에 아무것도 안 남기려고
     popupRedirectResolver 없이 만든다. 그래서 화면 안의 «구글 계정으로 로그인»
     단추는 눌러도 auth/argument-error 로 반드시 실패한다 — 헛단추다.
     로그인은 오직 위젯이 넘겨 주는 토큰으로만 된다. 못 넘기면 까닭을 보여 준다. */
let dashTimer = null, dashTries = 0, dashWatchAt = 0;
function dashGateOpen() {
  return dashView.webContents.executeJavaScript(
    '(function(){var g=document.getElementById("loginGate");'
    + 'return !!(g && !g.classList.contains("hidden"));})()', true);
}
/* 헛단추를 감추고 진짜 할 일을 적어 준다 */
function dashSay(msg, sub) {
  if (!dashView || dashView.webContents.isDestroyed()) return;
  dashView.webContents.executeJavaScript(
    '(function(){var m=document.getElementById("gateMsg"),s=document.getElementById("gateSub");'
    + 'if(m) m.textContent=' + JSON.stringify(msg) + ';'
    + 'if(s) s.innerHTML=' + JSON.stringify(sub) + ';'
    + '["gateBtn","gateImport","gateRetry"].forEach(function(id){'
    + 'var b=document.getElementById(id); if(b) b.classList.add("hidden");});})()', true)
    .catch(() => { /* 아직 안 떴으면 다음 차례에 */ });
}
/* 돌려주는 값: true = 더 해 볼 것 없음(들어갔거나, 해 봐야 소용없음) */
async function dashLogin() {
  if (!dashView || dashView.webContents.isDestroyed()) return true;
  let open;
  try { open = await dashGateOpen(); } catch (e) { return false; }
  /* ★ 관문이 «안 보인다» 는 «들어가 있다» 가 아니다 — 웹이 아직 준비 중일 수도 있다.
     여기서 그만두는 바람에 늦게 뜬 관문을 통째로 놓쳤다(LG 증상). 계속 지켜본다. */
  if (!open) return false;
  let at = '';
  try { at = await recordsmain.accessToken(); } catch (e) {
    const why = String((e && e.message) || e);
    dashSay('구글 연결이 필요합니다',
      '위젯의 «학생기록» 탭에서 구글 계정을 연결하면 여기도 함께 열립니다.'
      + '<br><small>' + why + '</small>');
    debugLog('수업진도 — 토큰을 못 얻음: ' + why);
    return true;                                // 더 기다려도 소용없다
  }
  if (!at) {
    dashSay('구글 연결이 필요합니다', '위젯의 «학생기록» 탭에서 구글 계정을 연결해 주세요.');
    return true;
  }
  try {
    const ok = await dashView.webContents.executeJavaScript(
      'window.__widgetSignInAT ? window.__widgetSignInAT(' + JSON.stringify(at) + ') : null', true);
    if (!ok) { debugLog('수업진도 — 옛 웹이라 이어 붙일 창구가 없음'); return false; }
    debugLog('수업진도 — 로그인 이어 붙임');
    return true;
  } catch (e) {
    debugLog('수업진도 로그인 실패 — ' + ((e && e.message) || e));
    return false;
  }
}
/* 2초마다 다시 — 웹이 늦게 뜨든, 관문이 늦게 나타나든 놓치지 않는다 */
function dashWatch(force) {
  const now = Date.now();
  if (!force && now - dashWatchAt < 15000) return;
  dashWatchAt = now;
  clearTimeout(dashTimer); dashTries = 0;
  const step = async () => {
    if (!dashView || dashView.webContents.isDestroyed()) return;
    let done = false;
    try { done = await dashLogin(); } catch (e) { done = false; }
    if (done || ++dashTries > 12) return;
    dashTimer = setTimeout(step, 2000);
  };
  step();
}
function dashEnsure() {
  if (dashView && dashView.webContents && !dashView.webContents.isDestroyed()) return dashView;
  dashView = new BrowserView({
    webPreferences: { partition: PARTITION, contextIsolation: true, nodeIntegration: false }
  });
  dashView.webContents.loadURL(APP_URL + '?widgetworker=1');
  dashView.webContents.on('did-finish-load', () => {
    dashSkinNow = '';                      // 새로 불렀으니 옷을 다시 입힌다
    setTimeout(() => { dashWatch(true); dashGo(dashScreen); }, 600);
  });
  /* 앱 안에서 바깥 링크를 누르면 진짜 브라우저로 */
  dashView.webContents.setWindowOpenHandler(({ url }) => { openInBrowser(url); return { action: 'deny' }; });
  return dashView;
}
/* 화면에 얹기 — 어느 창에서 불렀는지는 보낸 쪽을 보고 안다 */
/* 얹은 화면이 «탭 안에 녹아들게» — 웹앱 제 머리를 감추고 바탕색을 테마에 맞춘다.
   ★ 웹앱에는 제 제목줄·제 탭이 있는데, 위젯에도 같은 탭이 있어 두 겹으로 보였다.
     감추고 «본문만» 얹어야 한 화면처럼 보인다. */
let dashSkinNow = '';
function dashSkin(c) {
  if (!dashView || !c) return;
  const ok = (s) => /^#[0-9a-fA-F]{3,8}$|^rgba?\([\d.,\s%]+\)$/.test(String(s || '')) ? s : '';
  const bg = ok(c.bg), fg = ok(c.fg), line = ok(c.line);
  const css = 'header.hero{display:none!important}'
    + (bg ? 'html,body{background:' + bg + '!important}' : '')
    + (fg ? 'body{color:' + fg + '}' : '')
    + (line ? '::-webkit-scrollbar-thumb{background:' + line + '!important}' : '')
    + '::-webkit-scrollbar{width:10px;height:10px}'
    + 'body{padding-top:6px!important}';
  if (css === dashSkinNow) return;
  dashSkinNow = css;
  dashView.webContents.insertCSS(css).catch(() => { /* 아직 안 떴으면 다 뜬 뒤에 */ });
}

ipcMain.on('dash-show', (e, screen, r, colors) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  if (!win || win.isDestroyed()) return;
  const v = dashEnsure();
  if (dashOwner !== win) { dashDetach(); win.addBrowserView(v); dashOwner = win; }
  /* ★ 화면 크기를 «크게» 로 두면 renderer 는 배율이 걸린 자를 쓴다.
     BrowserView 의 자는 배율이 없어서, 곱해 주지 않으면 자리가 밀려 탭 줄을 덮었다. */
  const z = (typeof e.sender.getZoomFactor === 'function' ? e.sender.getZoomFactor() : 1) || 1;
  const b = { x: Math.round(r.x * z), y: Math.round(r.y * z),
    width: Math.max(80, Math.round(r.w * z)), height: Math.max(80, Math.round(r.h * z)) };
  v.setBounds(b);
  dashSkin(colors);
  dashWatch(false);            // 탭을 볼 때마다 — 아직 관문이 서 있으면 다시 이어 붙인다
  if (dashScreen !== screen) { dashScreen = screen; dashGo(screen); }
});
ipcMain.on('dash-hide', () => dashDetach());
ipcMain.handle('dash-reload', async () => {
  if (!dashView) return { ok: false };
  dashView.webContents.reloadIgnoringCache();
  return { ok: true };
});

/* ── 열쇠·설정 백업 ──────────────────────────────────────────
   ★ 이 파일 하나에 열쇠가 다 모이므로 «암호를 걸어» 내보낸다. */
ipcMain.handle('backup-export', async (_e, opt) => {
  const o = opt || {};
  try {
    const body = backup.collect(loadState(), o);
    const text = backup.lock(body, o.pass || '', app.getVersion());
    const z = (n) => (n < 10 ? '0' : '') + n;
    const d = new Date();
    const name = '진호알리미-백업-' + d.getFullYear() + z(d.getMonth() + 1) + z(d.getDate()) + '.json';
    const r = await dialog.showSaveDialog({
      title: '열쇠·설정 내보내기', defaultPath: name,
      filters: [{ name: '백업 파일', extensions: ['json'] }]
    });
    if (r.canceled || !r.filePath) return { ok: false, error: '' };   // 그냥 닫은 것은 오류가 아니다
    fs.writeFileSync(r.filePath, text, 'utf8');
    const s = backup.summary(body);
    debugLog('백업 내보냄 — ' + r.filePath + (o.pass ? ' (암호 걸림)' : ' (평문)'));
    return { ok: true, path: r.filePath, at: stampKST(),
      msg: '열쇠 ' + s.secrets + '개 · 설정 ' + s.settings + '개를 담았습니다'
        + (o.pass ? ' (암호 걸림)' : ' — ★암호 없이 저장했습니다') };
  } catch (e) {
    debugLog('백업 내보내기 실패 — ' + ((e && e.message) || e));
    return { ok: false, error: (e && e.message) || String(e) };
  }
});
ipcMain.handle('backup-import', async (_e, opt) => {
  const o = opt || {};
  try {
    const r = await dialog.showOpenDialog({
      title: '백업 가져오기', properties: ['openFile'],
      filters: [{ name: '백업 파일', extensions: ['json'] }]
    });
    if (r.canceled || !r.filePaths || !r.filePaths[0]) return { ok: false, error: '' };
    const text = fs.readFileSync(r.filePaths[0], 'utf8');
    const got = backup.unlock(text, o.pass || '');
    /* 고른 갈래만 되살린다 — 열쇠만, 설정만, 둘 다 */
    const body = backup.collect(got.body, o);
    saveState(body);
    const s = backup.summary(body);
    debugLog('백업 가져옴 — 열쇠 ' + s.secrets + ' · 설정 ' + s.settings);
    /* 되살린 열쇠로 곧바로 다시 받아 온다 */
    taskData = null; tickData = null;
    refreshTasks('백업 가져온 뒤');
    refreshTick('백업 가져온 뒤');
    comciChanged();
    sendToWidget();
    return { ok: true, at: stampKST(),
      msg: '열쇠 ' + s.secrets + '개 · 설정 ' + s.settings + '개를 되살렸습니다'
        + (got.at ? ' (만든 날 ' + String(got.at).slice(0, 10) + ')' : '') };
  } catch (e) {
    return { ok: false, error: (e && e.message) || String(e) };
  }
});

/* ── 틱틱 창구 ── */
ipcMain.handle('tick-connect', () => tickConnect());
ipcMain.handle('tick-refresh', async () => { await refreshTick('눌러서'); return tickData; });
ipcMain.handle('tick-add', async (_e, title, ymd, pid, pri) => {
  try {
    if (!String(title || '').trim()) return { ok: false, error: '내용을 적어 주세요' };
    await ticktick.createTask(getTickKey(), pid || getTickList(), title, ymd, Number(pri) || 0);
    debugLog('틱틱 — 새 할 일: ' + String(title).slice(0, 30));
    await refreshTick('만든 뒤');
    return { ok: true, at: stampKST() };
  } catch (e) { return { ok: false, error: (e && e.message) || String(e) }; }
});
ipcMain.handle('tick-done', async (_e, pid, tid) => {
  try {
    const t = ((tickData && tickData.tasks) || []).filter((x) => x.id === tid)[0];
    await ticktick.completeTask(getTickKey(), pid, tid);
    tickDropped[tid] = true;
    if (t) tickDoneAdd({ id: t.id, pid: t.projectId, title: t.title, project: t.project, due: t.due, priority: t.priority });
    debugLog('틱틱 — 완료 처리');
    await refreshTick('고친 뒤');
    return { ok: true, at: stampKST() };
  } catch (e) { return { ok: false, error: (e && e.message) || String(e) }; }
});
ipcMain.handle('tick-due', async (_e, pid, tid, ymd) => {
  try {
    await ticktick.setDue(getTickKey(), pid, tid, ymd);
    debugLog('틱틱 — 마감일 바꿈: ' + (ymd || '(지움)'));
    await refreshTick('고친 뒤');
    return { ok: true, at: stampKST() };
  } catch (e) { return { ok: false, error: (e && e.message) || String(e) }; }
});
/* 고치기 — 우선순위·마감·보관함. 보관함 옮기기는 API 가 받아 주면 그대로,
   받는 척만 하면(옮겨지지 않으면) «새로 만들고 옛것을 지워» 옮긴다. */
ipcMain.handle('tick-update', async (_e, pid, tid, patch) => {
  try {
    const p = patch || {};
    if (p.projectId && p.projectId !== pid) {
      let moved = false;
      try {
        await ticktick.updateTask(getTickKey(), pid, tid, { projectId: p.projectId });
        await refreshTick('옮긴 뒤');
        moved = ((tickData && tickData.tasks) || []).some((t) => t.id === tid && t.projectId === p.projectId);
      } catch (e) { debugLog('틱틱 — 옮기기(고치기로) 실패: ' + ((e && e.message) || e)); }
      if (!moved) {
        await ticktick.createTask(getTickKey(), p.projectId, p.title || '(제목 없음)', p.due || '', Number(p.priority) || 0);
        await ticktick.deleteTask(getTickKey(), pid, tid);
        await refreshTick('옮긴 뒤');
        debugLog('틱틱 — 보관함 옮김(새로 만들고 옛것 지움)');
      } else debugLog('틱틱 — 보관함 옮김');
      return { ok: true, at: stampKST() };
    }
    const body = {};
    if (p.priority !== undefined) body.priority = Number(p.priority) || 0;
    if (p.due !== undefined) {
      if (p.due) { body.dueDate = p.due + 'T00:00:00+0900'; body.isAllDay = true; }
      else body.dueDate = null;
    }
    await ticktick.updateTask(getTickKey(), pid, tid, body);
    debugLog('틱틱 — 고침: ' + Object.keys(body).join(','));
    await refreshTick('고친 뒤');
    return { ok: true, at: stampKST() };
  } catch (e) { return { ok: false, error: (e && e.message) || String(e) }; }
});
ipcMain.handle('tick-undone', async (_e, pid, tid) => {
  try {
    await ticktick.reopenTask(getTickKey(), pid, tid);
    tickDoneDrop([tid]);
    debugLog('틱틱 — 완료 되돌림');
    await refreshTick('되돌린 뒤');
    return { ok: true, at: stampKST() };
  } catch (e) { return { ok: false, error: (e && e.message) || String(e) }; }
});
ipcMain.handle('tick-done-clear', async () => {
  try {
    const list = getTickDone();
    let n = 0;
    for (const d of list) {
      try { await ticktick.deleteTask(getTickKey(), d.pid, d.id); n++; }
      catch (e) { debugLog('틱틱 — 완료함 지우기 하나 실패: ' + ((e && e.message) || e)); }
    }
    tickDoneDrop(list.map((d) => d.id));
    debugLog('틱틱 — 완료함 비움 ' + n + '개');
    await refreshTick('완료함 비운 뒤');
    return { ok: true, at: stampKST(), n: n };
  } catch (e) { return { ok: false, error: (e && e.message) || String(e) }; }
});
ipcMain.handle('tick-del', async (_e, pid, tid) => {
  try {
    await ticktick.deleteTask(getTickKey(), pid, tid);
    tickDropped[tid] = true; tickDoneDrop([tid]);
    debugLog('틱틱 — 지움');
    await refreshTick('지운 뒤');
    return { ok: true, at: stampKST() };
  } catch (e) { return { ok: false, error: (e && e.message) || String(e) }; }
});
ipcMain.handle('tick-test', async () => {
  try {
    const r = await ticktick.test(getTickKey());
    return { ok: true, msg: '연결됐습니다 — 목록 ' + r.projects + '개 (' + r.names.join(', ') + ')' };
  } catch (e) { return { ok: false, error: (e && e.message) || String(e) }; }
});
/* 되돌림 주소 — 설정 화면에서 그대로 베껴 넣게 보여 준다 */
ipcMain.handle('tick-redirect', () => ticktick.redirectUri());

/* 설정의 «지금 확인» — 열쇠와 연결이 맞는지 그 자리에서 알려 준다 */
ipcMain.handle('task-test', async (_e, key) => {
  try {
    const r = await notion.test(String(key || '').trim() || getNotionKey(), getTaskDb(), getProjDb());
    return { ok: true, msg: `연결됐습니다 — 프로젝트 ${r.projects}개 · 태스크 ${r.tasks}개를 읽었습니다` };
  } catch (e) { return { ok: false, error: (e && e.message) || String(e) }; }
});

ipcMain.handle('comci-get', () => ({ config: getComciConfig(), data: loadComci() }));
ipcMain.on('comci-pick', (_e, p) => {   // 마지막으로 본 학년·반
  saveState({ comciPick: { grade: Number(p && p.grade) || 1, cls: Number(p && p.cls) || 1 } });
});
ipcMain.on('comci-config', (_e, cfg) => {
  if (!cfg || typeof cfg !== 'object') return;
  saveState({ comci: {
    school: cfg.school || null,
    wantTeacher: !!cfg.wantTeacher,
    wantClasses: !!cfg.wantClasses,
    teacher: String(cfg.teacher || ''),
    teacherIdx: Number(cfg.teacherIdx) || 0
  } });
  comciChanged();
  sendToWidget();
});

/* ===================== 학사일정 (구글 시트) ===================== */
// 학교 «연간 수업일수 계획표» 원본을 그대로 훑어본다. 권한 없이 받아진다.
const academic = require('./academic.js');
const mealduty = require('./mealduty.js');
const academicFile = path.join(userDataPath, 'academic.json');

function loadAcademic() {
  try { return JSON.parse(fs.readFileSync(academicFile, 'utf-8')); } catch (e) { return null; }
}
let academicFetching = false;
async function refreshAcademic() {
  if (academicFetching) return loadAcademic();
  academicFetching = true;
  try {
    const sheetId = loadState().academicSheet || academic.DEFAULT_SHEET;
    debugLog('학사일정 받기 시작');
    const a = await academic.fetchYear(sheetId);
    try { fs.writeFileSync(academicFile, JSON.stringify(a)); } catch (e) { /* 무시 */ }
    debugLog(`학사일정 받기 완료 — ${a.months.length}개월`);
    if (widgetWin && !widgetWin.isDestroyed()) widgetWin.webContents.send('academic-changed');
    return a;
  } catch (e) {
    debugLog(`학사일정 받기 실패: ${e && e.message ? e.message : e}`);
    return loadAcademic();
  } finally { academicFetching = false; }
}
/* ★ v1.14.3 에서 «달»을 탭 이름에서 뽑도록 고쳤다.
   그 전에 받아 둔 자료는 시트 안 글자를 보고 달을 정해서, 예를 들어 «8» 탭이 «3월» 로
   잡혀 월 단추가 겹쳐 보였다. 탭 이름과 달이 어긋나 있으면 다시 받는다. */
function academicIsOld(a) {
  if (!a || !(a.months || []).length) return false;   // 아예 없는 건 따로 처리한다
  return a.months.some((m) => {
    const fromTab = (String(m.tab).match(/^(\d{1,2})/) || [])[1];
    return fromTab && String(m.month) !== fromTab;
  });
}
/* 오늘이 며칠인지로 학사일정에서 오늘 일정을 뽑는다.
   한 달이 8-1·8-2 로 나뉜 시트가 있어서, 일정이 적혀 있는 쪽을 고른다. */
function todayEventText() {
  try {
    const a = loadAcademic();
    if (!a || !(a.months || []).length) return '';
    const now = new Date();
    const mm = String(now.getMonth() + 1), dd = now.getDate();
    let found = '';
    a.months.forEach((m) => {
      if (String(m.month) !== mm) return;
      // ★ 다른 해 탭이 섞여 있으면 그쪽을 읽어 엉뚱한 일정이 뜬다 (실제로 겪었다)
      if (m.ok === false) return;
      (m.days || []).forEach((d) => {
        if (d.day !== dd) return;
        const t = String(d.event || '').trim();
        if (t) found = t;              // 뒤쪽(8-2 등)에 적힌 것이 지금 쓰는 달이다
      });
    });
    return found;
  } catch (e) { return ''; }
}

ipcMain.handle('get-academic', () => {
  const a = loadAcademic();
  if (academicIsOld(a)) {
    scheduleTask('cal', '학사일정', 200, () => refreshAcademic());
    debugLog('학사일정: 달 표시가 어긋난 옛 자료라 다시 받습니다');
  }
  return a;
});
ipcMain.handle('academic-fetch', async () => {
  setTask('cal', '학사일정', 'busy');
  try { return await refreshAcademic(); } finally { setTask('cal', null, null); }
});

/* ===================== 급식 (나이스) ===================== */
const neis = require('./neis.js');

/* ── 급식지도 순서표 ────────────────────────────────────────
   ★ 하루에 한 번이면 넉넉하다 — 순서표는 학기에 한 번 만들고 잘 안 바뀐다.
   ★ 못 받아도 급식은 멀쩡히 보여야 한다. 실패를 조용히 삼키고 옛것을 쓴다. */
const dutyFile = path.join(userDataPath, 'mealduty.json');
let dutyData = null, dutyFetching = false;
function getDutySheet() {
  const v = loadState().dutySheet;
  return v === undefined ? mealduty.DEFAULT_SHEET : String(v || '');
}
function loadDuty() {
  if (dutyData) return dutyData;
  try { dutyData = JSON.parse(fs.readFileSync(dutyFile, 'utf-8')); } catch (e) { dutyData = null; }
  return dutyData;
}
async function refreshDuty(why) {
  if (dutyFetching) return loadDuty();
  const id = getDutySheet();
  if (!id) { dutyData = null; return null; }
  dutyFetching = true;
  try {
    debugLog(`급식지도 순서표 받기 (${why})`);
    const v = await mealduty.fetchDuty(id);
    dutyData = v;
    try { fs.writeFileSync(dutyFile, JSON.stringify(v)); } catch (e) { /* 못 적어도 그만 */ }
    debugLog(`급식지도 — 날 ${Object.keys(v.days).length}개 · 사람 ${Object.keys(v.names).length}명`
      + (v.warn.length ? ` · ${v.warn.join(' / ')}` : ''));
    sendToWidget();
    return v;
  } catch (e) {
    debugLog(`급식지도 받기 실패: ${(e && e.message) || e}`);
    return loadDuty();
  } finally { dutyFetching = false; }
}
/* 화면이 쓰기 좋은 꼴로 — «내 것» 은 미리 추려서 보낸다.
   ★ 시트에 이름이 아예 없는 분(시간강사·보건교사 등)은 대상이 아니다.
     «없다» 와 «대상이 아니다» 는 다르다 — 화면에서 달리 말해야 한다. */
function dutyForWidget() {
  const d = loadDuty();
  if (!d) return null;
  /* ★ 순서표의 «지도교사» 칸에는 사람 이름만 있는 것이 아니다 —
     입학식·개천절·수련활동 처럼 그날의 사정도 적혀 있고, 그것들도
     «두세 글자 한글» 이라 이름 거르기를 그냥 통과했다.
     컴시간 교사 명단과 맞춰 본다 — 진짜 선생님은 거기 있다. */
  const tt = loadComci();
  const masks = ((tt && tt.teachers) || []).map((t) => String(t.name || ''))
    .filter(Boolean);
  const isTeacher = (full) => !masks.length || masks.some((m) => {
    if (m.length !== full.length) return false;
    for (let i = 0; i < m.length; i++) {
      if (m[i] === '*' || m[i] === '＊') continue;
      if (m[i] !== full[i]) return false;
    }
    return true;
  });
  const st = loadState();
  const masked = (st.comci && st.comci.teacher) || '';
  const picked = String(st.dutyName || '').trim();
  const me = picked || mealduty.matchName(masked, d.names || {});
  return {
    days: d.days || {},
    names: Object.keys(d.names || {}).filter(isTeacher),
    me: me,                       // 시트에서 찾은 내 이름 ('' 면 대상이 아님)
    masked: masked,               // 컴시간에 적힌 (가려진) 이름
    picked: !!picked,             // 손으로 고른 것인가
    mine: me ? mealduty.nextFor(d, me) : [],
    all: me ? (d.names[me] || []) : [],
    fetchedAt: d.fetchedAt || '', error: d.error || '', warn: d.warn || []
  };
}
const mealFile = path.join(userDataPath, 'meals.json');

function loadMeals() {
  try { return JSON.parse(fs.readFileSync(mealFile, 'utf-8')); } catch (e) { return null; }
}
/* ★ 급식은 학교를 «여럿» 담을 수 있다.
   사립이라 학교는 여중인데 교사 급식은 여고 것을 먹는 경우가 있다 — 둘 다 본다.
   예전에는 한 곳(neis)만 담았다. 그 값이 남아 있으면 목록의 첫 칸으로 옮겨 준다. */
function getNeisList() {
  const st = loadState();
  if (Array.isArray(st.neisList) && st.neisList.length) return st.neisList;
  if (st.neis && st.neis.code) return [st.neis];
  return [];
}
/* 담아 둔 곳이 없으면 컴시간에서 고른 학교 이름으로 한 번 찾아 둔다 */
async function neisSchools() {
  const have = getNeisList();
  if (have.length) return have;
  const st = loadState();
  const name = (st.comci && st.comci.school && st.comci.school.name) || '';
  if (!name) throw new Error('설정에서 학교를 먼저 골라주세요');
  const list = await neis.searchSchool(name);
  if (!list.length) throw new Error(`나이스에서 «${name}» 을 찾지 못했습니다`);
  const picked = [list[0]];
  saveState({ neisList: picked });
  debugLog(`나이스 학교 찾음: ${list[0].name} (${list[0].atptName}/${list[0].code})`);
  return picked;
}
let mealFetching = false;
async function refreshMeals(baseDate, weekOff) {
  if (mealFetching) return loadMeals();
  mealFetching = true;
  try {
    const schools = await neisSchools();
    // 학교마다 받아서 한 덩어리로 묶는다. 한 곳이 막혀도 나머지는 보여준다.
    const got = [];
    for (const s of schools) {
      try {
        const one = await neis.fetchWeekMeals(s, baseDate);
        got.push({ name: s.name, code: s.code, meals: one.meals,
                   from: one.from, to: one.to });
      } catch (e) {
        debugLog(`급식 «${s.name}» 실패: ${(e && e.message) || e}`);
        got.push({ name: s.name, code: s.code, meals: [],
                   error: (e && e.message) || '받지 못했습니다' });
      }
    }
    const first = got.find((g) => g.from) || {};
    const w = {
      schools: got,
      school: got.map((g) => g.name).join(' · '),
      // 옛 화면도 읽을 수 있게 첫 학교 것을 그대로 둔다
      meals: (got[0] && got[0].meals) || [],
      from: first.from || '', to: first.to || '',
      fetchedAt: new Date().toISOString()
    };
    w.weekOff = Number(weekOff) || 0;   // 몇 주 옮겨 본 것인지 화면이 알아야 한다
    try { fs.writeFileSync(mealFile, JSON.stringify(w)); } catch (e) { /* 무시 */ }
    debugLog('급식 받기 완료 — '
      + got.map((g) => `${g.name} ${g.meals.length}건`).join(' · ') + ` (${w.from}~${w.to})`);
    if (widgetWin && !widgetWin.isDestroyed()) widgetWin.webContents.send('meals-changed');
    return w;
  } catch (e) {
    debugLog(`급식 받기 실패: ${e && e.message ? e.message : e}`);
    const old = loadMeals() || {};
    return Object.assign({}, old, { error: (e && e.message) || '받지 못했습니다' });
  } finally { mealFetching = false; }
}
ipcMain.handle('neis-search', async (_e, name) => {
  try {
    debugLog(`나이스 학교 검색: ${name}`);
    return { list: await neis.searchSchool(String(name || '')) };
  } catch (e) {
    debugLog(`나이스 검색 실패: ${e && e.message ? e.message : e}`);
    return { error: (e && e.message) || '검색에 실패했습니다' };
  }
});
ipcMain.handle('get-meals', () => loadMeals());
// off = 0 이번주, 1 다음주, -1 지난주 …
ipcMain.handle('meals-fetch', async (_e, off) => {
  const n = Number(off) || 0;
  const base = new Date();
  base.setDate(base.getDate() + n * 7);
  setTask('meal', '급식', 'busy');
  try { return await refreshMeals(n === 0 ? null : base, n); } finally { setTask('meal', null, null); }
});

/* ===================== 설정 창 ===================== */
// 트레이 메뉴로는 담을 수 없는 것들(학교 검색·교사 고르기)을 위해 창을 따로 둔다.
function openSettingsWindow(from) {
  if (settingsWin && !settingsWin.isDestroyed()) { settingsWin.show(); settingsWin.focus(); return; }
  // ★ «어디서 눌렀는가» 에 딸린 창으로 띄운다.
  //   그러면 그 창 위에만 뜨고, 작업표시줄에 따로 잡히지 않고, 부모를 닫으면 같이 닫힌다.
  //   전에는 늘 620px 짜리가 따로 떠서, 1100px 넓은 창에서 누르면 엉뚱해 보였다.
  const parent = (from && !from.isDestroyed()) ? from
    : (easyWin && !easyWin.isDestroyed() && easyWin.isVisible()) ? easyWin
    : (widgetWin && !widgetWin.isDestroyed()) ? widgetWin : null;
  // 넓은 창에서 열었으면 그 창에 어울리게 크게, 위젯에서 열었으면 지금 크기 그대로
  const big = parent === easyWin;
  const w = big ? 820 : 620;
  const h = big ? 820 : 760;
  const opts = {
    width: w, height: h, title: APP_NAME + ' 설정',
    backgroundColor: '#F7F7FF', autoHideMenuBar: true, resizable: true,
    minWidth: 520, minHeight: 420,
    icon: path.join(__dirname, 'assets', ICON),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false
    }
  };
  if (parent) {
    opts.parent = parent;
    opts.skipTaskbar = true;          // 부모에 딸린 창이라 따로 잡히지 않게
    // ★ 부모가 «있는 모니터» 한가운데에 놓는다.
    //   예전에는 y 를 Math.max(0, …) 로 잘랐는데, 위쪽·왼쪽에 놓인 모니터는
    //   좌표가 음수라 0 으로 잘리면서 창이 주 모니터로 끌려갔다.
    //   («듀얼 모니터인데 반대편에 뜬다» 가 이것이었다)
    const b = parent.getBounds();
    const area = screen.getDisplayMatching(b).workArea;
    let x = Math.round(b.x + (b.width - w) / 2);
    let y = Math.round(b.y + (b.height - h) / 2);
    // 그 모니터 안으로만 밀어 넣는다 (화면 밖으로 나가지 않게)
    x = Math.min(Math.max(x, area.x), area.x + area.width - w);
    y = Math.min(Math.max(y, area.y), area.y + area.height - h);
    opts.x = x;
    opts.y = y;
  }
  settingsWin = new BrowserWindow(opts);
  settingsWin.loadFile('settings.html');
  settingsWin.on('closed', () => { settingsWin = null; if (rebuildTrayMenu) rebuildTrayMenu(); });
  debugLog('설정 창을 열었습니다' + (parent ? (big ? ' (넓은 창에 딸려서)' : ' (위젯에 딸려서)') : ''));
}

ipcMain.handle('get-settings', () => ({
  comci: getComciConfig(),
  timetable: loadComci(),
  ui: {
    size: getScale(), opacity: getOpacity(), alwaysOnTop: getAlwaysOnTop(),
    autoLaunch: app.getLoginItemSettings().openAtLogin,
    version: app.getVersion(),
    /* 그리는 쪽 안내 글이 «크롬» 이라고 못박지 않도록, 실제로 열리는 이름을 보낸다 */
    browserLabel: browserName(),
    flavor: FLAVOR,
    appName: APP_NAME,
    theme: getTheme(),
    font: getFont(),
    usageShow: getUsageShow(),
    usageStyle: getUsageStyle(),
    // ★ 설정 창은 위젯과 «다른 자료» 를 받는다. 새 항목을 넣을 때 여기도 넣어야
    //   설정에서 지금 값이 보이고, 스위치를 눌렀을 때 나머지가 안 지워진다.
    //   (usage 가 빠져 있어서 스위치가 늘 꺼짐으로 보이고, 누르면 빈 목록에
    //    하나만 담겨 «한 번에 하나만» 켜졌다)
    usage: { show: getUsageShow(), on: getUsageOn(), style: getUsageStyle(),
             data: aiusage.snapshot() },
    sys: { show: getSysShow(), data: sysData },
    // 업무관리(노션)·틱틱 — 열쇠 자체는 안 보낸다. «넣었는가» 와 읽어 둔 자료만.
    tick: HAS_TT ? { on: !!getTickKey(), hasApp: !!(getTickApp().id && getTickApp().secret),
      listId: getTickList(), data: tickData, redirect: ticktick.redirectUri(),
      at: String((loadState().tick || {}).at || '') } : null,
    task: HAS_TT ? { show: getTaskShow(), hasKey: !!getNotionKey(), data: taskData,
      todos: getTodos(), todosAt: String(loadState().todosAt || ''),
      split: getTaskSplit(),
      tick: { on: !!getTickKey(), hasApp: !!(getTickApp().id && getTickApp().secret),
              listId: getTickList(), data: tickData } } : null,
    wx: { show: getWxShow(), spot: getWxSpot(), data: wxData },
    grade: { on: getGradeOn(), sheets: getGradeSheets() },
    rec: recordsmain.recState(),
    academicSheet: loadState().academicSheet || academic.DEFAULT_SHEET,
    dutySheet: getDutySheet(),
    dutyName: String(loadState().dutyName || ''),
    duty: dutyForWidget(),                       // 설정에서 «내 이름» 을 고르려면 필요하다
    neis: loadState().neis || null,
    neisList: getNeisList(),
    links: getLinks(), linksAt: String(loadState().linksAt || ''),
    termStart: getTermStart(),
    navStyle: getNavStyle(),
    tabOrder: getTabOrder(), dashOrder: getDashOrder(), dashOff: getDashOff(),
    officeFav: getOfficeFav(), dashSize: getDashSize(),
    board: { url: getBoardUrl(), nick: getBoardNick(), school: mySchoolCode(),
             data: boardData },
    photo: { dir: getPhotoDir(), sec: getPhotoSec(), count: photoList().length },
    feed: { show: getFeedShow(), url: getFeedUrl(), data: feedData,
           hasKey: !!getFeedKey(), fav: getFeedFav(), fold: getFeedFold() },
    hot: Object.assign(getHot(), { error: hotErr }),
    browsers: browserList().map((b) => ({ key: b.key, label: b.label })),
    browser: getBrowserPick(),
    meals: loadMeals(),
    loggedIn: !!(lastData && !lastData.needLogin)
  }
}));

ipcMain.on('set-ui', (_e, v) => {
  if (!v || typeof v !== 'object') return;
  if (v.size) { applyScale(v.size); }
  if (v.opacity !== undefined) applyOpacity(Number(v.opacity));
  if (v.alwaysOnTop !== undefined) applyAlwaysOnTop(!!v.alwaysOnTop);
  if (v.autoLaunch !== undefined) app.setLoginItemSettings({ openAtLogin: !!v.autoLaunch });
  if (v.browser !== undefined) {
    saveState({ browser: String(v.browser || '') });
    debugLog('바깥 주소를 열 브라우저: ' + (v.browser || '(있는 것 중에서)'));
  }
  if (v.neisList !== undefined) {
    const list = (v.neisList || []).filter((x) => x && x.code);
    saveState({ neisList: list });
    debugLog('급식 학교 목록: ' + (list.map((x) => x.name).join(' · ') || '(빔)'));
    sendToWidget();
  }
  if (v.neis && v.neis.code) {
    saveState({ neis: v.neis });
    debugLog(`급식 학교 지정: ${v.neis.name} (${v.neis.atpt}/${v.neis.code})`);
  }
  if (v.theme !== undefined) { saveState({ theme: String(v.theme || '') }); sendToWidget(); }
  if (v.font !== undefined) { saveState({ font: String(v.font || 'pretendard') }); sendToWidget(); }
  if (v.gclient !== undefined) {
    saveState({ gclient: { clientId: String(v.gclient.clientId || '').trim(), clientSecret: String(v.gclient.clientSecret || '').trim() } });
    debugLog('학생기록 — 구글 클라이언트 정보 저장');
  }
  /* ── 업무관리(노션) ── 열쇠는 저장만 하고 화면으로 되돌리지 않는다 */
  if (v.notionKey !== undefined) {
    saveState({ notionKey: String(v.notionKey || '').trim().slice(0, 120) });
    debugLog('업무관리 — 노션 열쇠 ' + (String(v.notionKey || '').trim() ? '저장' : '지움'));
    taskData = null;
    refreshTasks('열쇠 바뀜');
  }
  if (v.taskDb !== undefined || v.projDb !== undefined) {
    const s = {};
    if (v.taskDb !== undefined) s.taskDb = notion.idOf(v.taskDb);
    if (v.projDb !== undefined) s.projDb = notion.idOf(v.projDb);
    saveState(s);
    debugLog('업무관리 — 표 주소 바꿈');
    taskData = null;
    refreshTasks('표 바뀜');
  }
  if (v.taskShow !== undefined) { saveState({ taskShow: !!v.taskShow }); sendToWidget(); }
  /* 틱틱 — 앱 아이디·비밀은 저장만 하고 화면으로 되돌리지 않는다 */
  if (v.tickApp !== undefined) {
    const a = v.tickApp || {};
    saveTick({ clientId: String(a.clientId || '').trim().slice(0, 120),
      clientSecret: String(a.clientSecret || '').trim().slice(0, 120) });
    debugLog('틱틱 — 앱 정보 저장');
    sendToWidget();
  }
  if (v.tickList !== undefined) {
    saveTick({ listId: String(v.tickList || '') });
    debugLog('틱틱 — 담을 목록 바꿈');
    sendToWidget();
  }
  if (v.tickOff) {                      // 연결 끊기
    saveTick({ token: '' });
    tickData = null;
    debugLog('틱틱 — 연결 끊음');
    sendToWidget();
  }
  /* 칸막이 너비 — 자주 바뀌므로 화면을 다시 그리지는 않는다(끌던 중에 깜빡이면 안 된다) */
  if (v.taskSplit !== undefined) {
    const n = Number(v.taskSplit);
    if (isFinite(n)) saveState({ taskSplit: Math.min(620, Math.max(180, Math.round(n))) });
  }
  if (v.recClasses !== undefined) { saveState({ recClasses: v.recClasses || [] }); sendToWidget(); }
  if (v.rosterSheet !== undefined) {
    saveState({ rosterSheet: String(v.rosterSheet || '') });
    debugLog('명렬표 시트 주소 변경');
  }
  if (v.fontScale !== undefined) {
    saveState({ fontScale: Object.assign(getFontScale(), v.fontScale) });
    sendToWidget();
  }
  if (v.wxSpot !== undefined) {
    const p = v.wxSpot || {};
    if (isFinite(Number(p.lat)) && isFinite(Number(p.lon))) {
      saveState({ wxSpot: { name: String(p.name || '고른 곳'), lat: Number(p.lat), lon: Number(p.lon) } });
      debugLog('날씨 지역 바꿈: ' + p.name);
      wxData = null;
      refreshWeather();
    }
  }
  if (v.wxShow !== undefined) { saveState({ wxShow: !!v.wxShow }); sendToWidget(); }
  if (v.sysShow !== undefined) { saveState({ sysShow: !!v.sysShow }); startSys(); }
  if (v.gradeSheets !== undefined) {
    const cur = getGradeSheets();
    [1, 2, 3].forEach((g) => { if (v.gradeSheets[g] !== undefined) cur[g] = String(v.gradeSheets[g] || ''); });
    saveState({ gradeSheets: cur });
    debugLog('학년부 일지 시트 주소 변경');
    sendToWidget();
  }
  if (v.gradeOn !== undefined) {
    saveState({ gradeOn: (v.gradeOn || []).map(Number).filter((g) => g >= 1 && g <= 3) });
    sendToWidget();
  }
  if (v.comciSide !== undefined) {
    saveState({ comciSide: v.comciSide === 'row' ? 'row' : 'col' });
    sendToWidget();
  }
  if (v.feedShow !== undefined) {
    saveState({ feedShow: !!v.feedShow });
    refreshFeed();
  }
  if (v.feedKey !== undefined) {
    saveState({ feedKey: String(v.feedKey || '').trim().slice(0, 80) });
    sendToWidget();
    refreshFeed();
  }
  if (v.feedUrl !== undefined) {
    saveState({ feedUrl: String(v.feedUrl || '') });
    debugLog('런처 주소 바꿈');
    refreshFeed();
  }
  if (v.photoSec !== undefined) {
    const n = Number(v.photoSec);
    saveState({ photoSec: (n >= 3 && n <= 600) ? n : 12 });
    sendToWidget();
  }
  if (v.photoClear) { saveState({ photoDir: '' }); sendToWidget(); }
  if (v.boardUrl !== undefined) {
    const u = String(v.boardUrl || '').trim();
    // 손으로 넣었으면 그 뒤로는 런처가 덮지 않는다
    saveState({ boardUrl: u, boardUrlManual: !!u });
    debugLog('전광판 주소 바꿈' + (u ? '' : ' (비움 — 다시 런처를 따릅니다)'));
    refreshBoard();
  }
  if (v.boardNick !== undefined) {
    saveState({ boardNick: String(v.boardNick || '').trim().slice(0, 20) });
  }
  if (v.officeFav !== undefined) {
    saveState({ officeFav: (v.officeFav || []).map(String).slice(0, 60) });
    sendToWidget();
  }
  if (v.hotShow !== undefined || v.hotHide !== undefined) {
    const patch = {};
    if (v.hotShow !== undefined) patch.hotShow = String(v.hotShow || '').trim().slice(0, 60);
    if (v.hotHide !== undefined) patch.hotHide = String(v.hotHide || '').trim().slice(0, 60);
    saveState(patch);
    applyHotkeys();
    sendToWidget();
  }
  if (v.feedFold !== undefined) {
    saveState({ feedFold: (v.feedFold || []).map(String).slice(0, 80) });
    sendToWidget();
  }
  if (v.feedFav !== undefined) {
    saveState({ feedFav: (v.feedFav || []).map(String).slice(0, 60) });
    sendToWidget();
  }
  if (v.tabOrder !== undefined) {
    saveState({ tabOrder: (v.tabOrder || []).map(String).slice(0, 20) });
    sendToWidget();
  }
  if (v.dashOrder !== undefined) {
    saveState({ dashOrder: (v.dashOrder || []).map(String).slice(0, 20) });
    sendToWidget();
  }
  if (v.dashSize !== undefined) {
    const out = {};
    Object.keys(v.dashSize || {}).slice(0, 20).forEach((k) => {
      const m = String(v.dashSize[k] || '').match(/^(\d)[,x](\d)$/);
      if (!m) return;
      const w = Math.max(1, Math.min(6, Number(m[1])));
      const h = Math.max(1, Math.min(3, Number(m[2])));
      out[String(k)] = w + ',' + h;
    });
    saveState({ dashSize: out });
    sendToWidget();
  }
  if (v.dashOff !== undefined) {
    saveState({ dashOff: (v.dashOff || []).map(String).slice(0, 20) });
    sendToWidget();
  }
  if (v.navStyle !== undefined) {
    const t = String(v.navStyle || '');
    saveState({ navStyle: (t === 'icon' || t === 'text') ? t : 'both' });
    sendToWidget();
  }
  if (v.termStart !== undefined) {
    const s = String(v.termStart || '').trim();
    saveState({ termStart: /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '' });
    debugLog('개학일: ' + (s || '(빔)'));
    sendToWidget();
  }
  if (v.links !== undefined) {
    const list = (v.links || [])
      .map((x) => ({ t: String((x && x.t) || '').trim().slice(0, 40), u: tidyUrl(x && x.u) }))
      .filter((x) => x.t && x.u)
      .slice(0, 40);
    saveState({ links: list, linksAt: stampKST() });
    debugLog('바로가기 ' + list.length + '개');
    sendToWidget();
  }
  if (v.easyFav !== undefined) {
    saveState({ easyFav: (v.easyFav || []).map(String).slice(0, 12) });
    sendToWidget();
  }
  if (v.usageOn !== undefined) {
    const before = getUsageOn();
    saveState({ usageOn: (v.usageOn || []).filter((k) => USAGE_KEYS.includes(k)) });
    /* 방금 켠 것은 바로 읽어 준다 — 5분을 기다리게 하지 않는다.
       끈 것의 숨은 창은 접는다(램을 돌려받는다). */
    const now = getUsageOn();
    const 새로켠 = now.filter((k) => before.indexOf(k) < 0);
    if (새로켠.length) aiusage.pollAll(새로켠);
    if (aiusage.prune) aiusage.prune(now);
    sendToWidget();
  }
  if (v.usageShow !== undefined) { saveState({ usageShow: !!v.usageShow }); sendToWidget(); }
  if (v.usageStyle !== undefined) {
    saveState({ usageStyle: v.usageStyle === 'bar' ? 'bar' : 'ring' });
    sendToWidget();
  }
  if (v.dutySheet !== undefined) {
    /* 주소를 통째로 붙여넣어도 되게 — 시트 ID 만 꺼내 담는다 */
    const id = mealduty.sheetIdOf(v.dutySheet) || String(v.dutySheet || '').trim();
    saveState({ dutySheet: id });
    debugLog(`급식지도 순서표 주소 변경: ${id}`);
    dutyData = null;
    scheduleTask('duty', '급식지도', 200, () => refreshDuty('주소가 바뀜'));
  }
  if (v.dutyName !== undefined) {
    saveState({ dutyName: String(v.dutyName || '').trim() });
    debugLog(`급식지도 내 이름: ${v.dutyName}`);
    sendToWidget();
  }
  if (v.academicSheet !== undefined) {
    saveState({ academicSheet: String(v.academicSheet || '') });
    debugLog(`학사일정 시트 주소 변경: ${v.academicSheet}`);
  }
  if (v.autoSize) {
    saveState({ userW: 0, userH: 0 });
    if (widgetWin && !widgetWin.isDestroyed()) {
      const s = widgetSize(getView());
      const b = widgetWin.getBounds();
      widgetWin.setBounds({ x: b.x, y: b.y, width: s.width, height: s.height });
    }
    debugLog('위젯 크기를 자동 맞춤으로 되돌렸습니다');
  }
  if (v.resetPos) resetWidgetPosition();
  if (rebuildTrayMenu) rebuildTrayMenu();
});
ipcMain.on('check-update', () => checkForUpdates(true));
ipcMain.on('open-log', () => shell.openPath(debugLogFile));
ipcMain.on('open-settings', (e) => {
  // 누른 창을 그대로 부모로 삼는다 (위젯에서 눌렀나, 넓은 창에서 눌렀나)
  openSettingsWindow(BrowserWindow.fromWebContents(e.sender));
});
ipcMain.on('install-update', () => installUpdateNow());
ipcMain.on('notes-seen', () => {              // 닫으면 이 버전은 다시 안 띄운다
  showNotes = false;
  saveState({ seenNotesVersion: app.getVersion() });
  sendToWidget();
});
ipcMain.on('notes-show', () => {              // 설정의 «업데이트 내역 보기»
  showNotes = true;
  sendToWidget();
  if (widgetWin && !widgetWin.isDestroyed()) { widgetWin.show(); widgetWin.focus(); }
});

/* ===================== 트레이 ===================== */
function createTray() {
  tray = new Tray(path.join(__dirname, 'assets', TRAY_ICON));
  const buildMenu = () => {
    let updateItems = [];
    if (updateState === 'ready') {
      updateItems = [{ label: `🆕 v${updateVersion} 설치하고 재시작`, click: () => installUpdateNow() }, { type: 'separator' }];
    } else if (updateState === 'available') {
      updateItems = [{ label: `⬇ 새 버전 v${updateVersion} 내려받는 중…`, enabled: false }, { type: 'separator' }];
    }
    const opacityMenu = [1, 0.9, 0.8, 0.7].map((v) => ({
      label: `${Math.round(v * 100)}%`, type: 'radio', checked: getOpacity() === v,
      click: () => applyOpacity(v)
    }));
    const sizeMenu = [
      { key: 'small', label: '소' }, { key: 'medium', label: '중' }, { key: 'large', label: '대' }
    ].map((s) => ({
      label: s.label, type: 'radio', checked: getScale() === s.key,
      click: () => { applyScale(s.key); tray.setContextMenu(buildMenu()); }
    }));

    return Menu.buildFromTemplate([
      ...updateItems,
      { label: '⚙️ 설정', click: () => openSettingsWindow() },
      { type: 'separator' },
      {
        label: '⊟ 위젯 보기', type: 'radio',
        checked: !(easyWin && !easyWin.isDestroyed()),
        click: () => showWidgetOnly()
      },
      {
        label: '⊞ 넓게 보기', type: 'radio',
        checked: !!(easyWin && !easyWin.isDestroyed()),
        click: () => openEasyWindow()
      },
      { label: '항상 위로 고정', type: 'checkbox', checked: getAlwaysOnTop(), click: (mi) => applyAlwaysOnTop(mi.checked) },
      { label: '위젯 투명도', submenu: opacityMenu },
      { label: '위젯 크기', submenu: sizeMenu },
      { type: 'separator' },
      // 시간표에 딸린 것들은 진호알리미에만 넣는다
      ...(HAS_TT ? [
        { label: '🗓️ 주간 시간표 크게 보기', click: () => openTimetableWindow() },
        { label: '지금 새로고침', click: () => pollOnce() }
      ] : []),
      /* 업무포털 — 도우미가 있으면 곳마다 한 줄, 없으면 «그냥 열기» 한 줄 */
      ...(portalHelpers().length
        ? [{
            label: '업무포털',
            submenu: portalHelpers().map(function (x, i) {
              return { label: x.name, click: () => openPortal(i) };
            }).concat([
              { type: 'separator' },
              { label: '도우미 없이 그냥 열기', click: () => openPortal(-1) }
            ])
          }]
        : [{ label: '업무포털 열기', click: () => openPortal(-1) }]),
      {
        // 다른 모니터를 뽑았거나 위젯을 어디 뒀는지 못 찾을 때 쓰는 탈출구
        label: '위젯 위치 초기화 (화면 가운데로)',
        click: () => resetWidgetPosition()
      },
      ...(HAS_TT ? [
        { label: `수업진도 앱 열기 (${browserName()})`, click: () => openInBrowser(APP_URL) },
        { label: `${browserName()}으로 로그인`, click: () => startLogin() }
      ] : []),
      {
        label: 'Windows 시작 시 자동 실행', type: 'checkbox',
        checked: app.getLoginItemSettings().openAtLogin,
        click: (mi) => app.setLoginItemSettings({ openAtLogin: mi.checked })
      },
      { label: '디버그 로그 열기', click: () => shell.openPath(debugLogFile) },
      { type: 'separator' },
      { label: `버전 v${app.getVersion()}`, enabled: false },
      { label: '업데이트 확인', click: () => checkForUpdates(true) },
      { type: 'separator' },
      { label: '종료', click: () => { userQuit = true; app.quit(); } }
    ]);
  };
  tray.setContextMenu(buildMenu());
  rebuildTrayMenu = () => tray.setContextMenu(buildMenu());
  tray.on('click', () => {
    checkForUpdates();   // 켜볼 때 한 번 — 새 버전이 있으면 바로 띠가 뜬다
    if (easyWin && !easyWin.isDestroyed()) { easyWin.show(); easyWin.focus(); return; }
    if (!widgetWin || widgetWin.isDestroyed()) { createWidgetWindow(); return; }
    widgetWin.isVisible() ? widgetWin.hide() : widgetWin.show();
  });
  updateTrayTooltip();
}

/* ===================== IPC ===================== */
ipcMain.on('refresh-now', () => pollOnce());
ipcMain.on('open-login', () => startLogin());
/* 업무포털 — 도우미로 열거나, 없으면 그냥 포털을 연다 */
ipcMain.handle('portal-info', () => portalInfo());
ipcMain.handle('portal-open', (_e, i) => openPortal(Number(i)));
/* 도우미가 든 폴더를 손수 고른다 (동료 PC 는 자리가 다르다) */
ipcMain.handle('portal-pick', async () => {
  const r = await dialog.showOpenDialog({
    title: '업무포털접속도우미가 든 폴더를 골라 주세요',
    properties: ['openDirectory'],
    defaultPath: loadState().portalHelperDir || app.getPath('desktop')
  });
  if (r.canceled || !r.filePaths.length) return portalInfo();
  saveState({ portalHelperDir: r.filePaths[0] });
  debugLog('업무포털 도우미 폴더: ' + r.filePaths[0]);
  return portalInfo();
});
ipcMain.handle('portal-clear', () => {
  saveState({ portalHelperDir: '' });
  return portalInfo();
});
ipcMain.on('open-timetable', () => openTimetableWindow());
/* 닫기 — «끄는 것» 이 아니라 감추는 것이다. 트레이에서 다시 부른다. */
ipcMain.on('hide-widget', () => {
  if (widgetWin && !widgetWin.isDestroyed()) widgetWin.hide();
});
/* 사진 액자 — 폴더 고르기 · 목록 · 한 장 읽기 */
ipcMain.handle('photo-pick', async () => {
  const r = await dialog.showOpenDialog({
    title: '사진이 든 폴더를 골라 주세요',
    properties: ['openDirectory'],
    defaultPath: getPhotoDir() || app.getPath('pictures')
  });
  if (r.canceled || !r.filePaths.length) return { dir: getPhotoDir(), count: photoList().length };
  saveState({ photoDir: r.filePaths[0] });
  const n = photoList().length;
  debugLog('사진 액자 폴더: ' + r.filePaths[0] + ' — ' + n + '장');
  sendToWidget();
  return { dir: r.filePaths[0], count: n };
});
ipcMain.handle('photo-list', () => ({
  dir: getPhotoDir(), sec: getPhotoSec(),
  files: photoList().map((f) => path.basename(f))
}));
/* 한 장을 그림 자료로 읽어 준다 — 목록의 몇 번째인지로 고른다.
   ★ 화면이 준 «파일 이름» 을 그대로 믿지 않고, 우리가 만든 목록에서 고른다. */
ipcMain.handle('photo-read', (_e, i) => {
  const list = photoList();
  const n = Number(i);
  if (!list.length || !(n >= 0) || n >= list.length) return null;
  const f = list[n];
  try {
    const b = fs.readFileSync(f);
    if (b.length > 12 * 1024 * 1024) return null;   // 너무 큰 것은 건너뛴다
    const ext = path.extname(f).toLowerCase().replace('.', '');
    const mime = ext === 'jpg' ? 'jpeg' : ext;
    return { name: path.basename(f),
      data: 'data:image/' + mime + ';base64,' + b.toString('base64') };
  } catch (e) { return null; }
});
/* ESC 로 창 닫기 — 화면이 «닫아 달라» 고 보내면 그 창을 감춘다.
   ★ 「닫기」 이지 「끄기」 가 아니다. 뒤에서는 계속 돌고, 트레이로 다시 부른다. */
ipcMain.on('esc-close', (e) => {
  const w = BrowserWindow.fromWebContents(e.sender);
  if (!w || w.isDestroyed()) return;
  if (widgetWin && w === widgetWin) { w.hide(); return; }
  if (easyWin && w === easyWin) { w.hide(); return; }
  w.close();                       // 설정·시간표 같은 창은 그냥 닫는다
});
/* 전광판 — 한 줄 보내기. 보내고 나면 새 목록을 그대로 돌려준다. */
ipcMain.handle('board-send', async (_e, o) => {
  const url = getBoardUrl();
  if (!url) return { ok: false, error: '전광판 주소가 없습니다' };
  const who = String((o && o.who) || '').trim().slice(0, 20);
  const text = String((o && o.text) || '').trim().slice(0, 120);
  if (!who) return { ok: false, error: '닉네임을 적어 주세요' };
  if (!text) return { ok: false, error: '하고 싶은 말을 적어 주세요' };
  saveState({ boardNick: who });          // 닉네임은 기억해 둔다
  try {
    const txt = await postText(url, JSON.stringify({
      school: mySchoolCode(), who: who, text: text
    }));
    const j = JSON.parse(txt);
    if (!j || !j.ok) return { ok: false, error: (j && j.error) || '보내지 못했습니다' };
    boardData = { list: (j.list || []).slice(-30),
      school: (boardData && boardData.school) || mySchoolCode(), at: j.at || '', error: '' };
    debugLog('전광판 보냄 — ' + who + ': ' + text.slice(0, 30));
    sendToWidget();
    return { ok: true, at: j.at || '' };
  } catch (e) {
    debugLog('전광판 보내기 실패 — ' + (e.message || e));
    return { ok: false, error: (e && e.message) || String(e) };
  }
});
/* 전광판 — 내가 쓴 것 지우기. 보낸때와 닉네임이 둘 다 맞아야 지워진다. */
ipcMain.handle('board-del', async (_e, at) => {
  const url = getBoardUrl();
  const who = getBoardNick();
  if (!url || !who || !at) return { ok: false, error: '지울 수 없습니다' };
  try {
    const txt = await postText(url, JSON.stringify({
      school: mySchoolCode(), who: who, del: String(at)
    }));
    const j = JSON.parse(txt);
    if (!j || !j.ok) return { ok: false, error: (j && j.error) || '지우지 못했습니다' };
    boardData = { list: (j.list || []).slice(-30),
      school: (boardData && boardData.school) || mySchoolCode(), at: j.at || '', error: '' };
    debugLog('전광판 지움 — ' + at);
    sendToWidget();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e && e.message) || String(e) };
  }
});
ipcMain.handle('board-refresh', async () => { await refreshBoard(); return boardData; });
ipcMain.on('open-easy', () => openEasyWindow());
ipcMain.handle('feed-refresh', async () => { await refreshFeed(); return feedData; });
/* 런처보드에서 고친 것 — 열쇠가 있는 PC 에서만 통한다.
   ★ 고친 뒤에는 곧바로 다시 받아 화면을 맞춘다. */
/* 목록을 다시 안 받았을 때, 바뀐 줄만 손으로 고친다.
   ★ 열쇠는 «고치기 전» 이름·주소다(런처가 줄을 찾는 것과 같은 기준). */
function patchFeed(act, o) {
  if (!feedData || !feedData.apps) return;
  const k = (o && o.key) || {};
  const hit = feedData.apps.filter((a) =>
    a.t === String(k.name || '') && a.u === tidyUrl(k.appUrl))[0];
  if (!hit) return;
  if (act === 'share') hit.shared = !!o.shared;
  else if (act === 'hide') hit.hidden = !!o.hidden;
  else if (act === 'color') hit.color = String(o.color || '').trim();
  else if (act === 'size') {
    const n = Number(o.size);
    hit.size = (n >= 1 && n <= 3) ? n : 1;
  }
}
ipcMain.handle('feed-act', async (_e, o) => {
  const act = String((o && o.act) || '');
  if (['add', 'edit', 'del', 'share', 'hide', 'scan', 'order', 'size', 'color',
        'catAdd', 'catRename', 'catDel'].indexOf(act) < 0) {
    return { ok: false, error: '모르는 일입니다' };
  }
  try {
    /* ★ 켜고 끄는 일에는 목록 전체가 필요 없다 — light 로 부탁하면
       런처가 한 칸만 고치고 곧바로 답한다(왕복 5초 → 1초쯤). */
    const light = ['share', 'hide', 'size', 'color'].indexOf(act) >= 0;
    const j = await feedPost(light ? Object.assign({ light: 1 }, o) : o);

    if (Array.isArray(j.apps)) {
      feedData = { apps: j.apps.map(feedApp).filter((a) => a.t),
        at: j.at || '', error: '', admin: true, cats: (j.cats || []).map(String) };
      debugLog('런처보드 ' + act + ' — 앱 ' + feedData.apps.length + '개');
    } else {
      /* ★ 목록이 안 왔다. 여기서 apps 를 빈 배열로 두면 화면이 통째로 비어
         «앱이 다 사라졌다» 처럼 보인다 — 실제로 그런 일이 있었다.
         있던 것을 그대로 두고 바뀐 줄만 손으로 고친다. */
      patchFeed(act, o);
      if (feedData) feedData.at = j.at || feedData.at;
      debugLog('런처보드 ' + act + ' — 가볍게 답받음(목록은 그대로)');
    }
    sendToWidget();
    return { ok: true, added: j.added, touched: j.touched, at: j.at || '' };
  } catch (e) {
    debugLog('런처보드 ' + act + ' 실패 — ' + (e.message || e));
    return { ok: false, error: (e && e.message) || String(e) };
  }
});
ipcMain.on('show-widget', () => showWidgetOnly());

/* 학년부 일지 — 받아 둔 것 주기 / 새로 받기 */
/* 날씨 — 지금 다시 받기 · 고를 수 있는 지역 목록 */
ipcMain.handle('wx-refresh', async () => { await refreshWeather(); return wxData; });
ipcMain.handle('wx-spots', () => weather.SPOTS);

ipcMain.handle('grade-get', (_e, grade) => {
  const g = Number(grade) || 3;
  return loadGradePlans()[g] || null;
});
ipcMain.handle('grade-fetch', async (_e, grade) => {
  const g = Number(grade) || 3;
  try {
    return await refreshGradePlan(g);
  } catch (e) {
    const msg = (e && e.message) || String(e);
    debugLog('학년부 일지 받기 실패: ' + msg);
    return { items: [], cats: [], error: msg };
  }
});

/* ── 주간업무 인쇄 ──────────────────────────────────────────────
   화면을 그대로 인쇄하면 탭·검색줄·어두운 바탕까지 나온다. 그래서 화면 쪽에서
   «흰 종이» 용 조각을 따로 만들어 보내면, 여기서 숨은 창에 담아 인쇄한다.
   silent:false 라서 윈도우 인쇄 대화상자가 뜬다 — 프린터를 고르거나
   «Microsoft Print to PDF» 로 파일로 저장할 수 있다. */
const PRINT_CSS = `
  @page { size: A4; margin: 12mm 12mm 14mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: #fff; color: #111;
    font-family: "Pretendard Variable", Pretendard, "Malgun Gothic", sans-serif;
    font-size: 10.5pt; line-height: 1.55;
  }
  .head { border-bottom: 1.6pt solid #111; padding-bottom: 5pt; margin-bottom: 11pt; }
  .head h1 { margin: 0; font-size: 15pt; letter-spacing: -.3pt; }
  .head .sub { margin-top: 2pt; font-size: 9pt; color: #555; }
  .dept { margin-bottom: 11pt; break-inside: avoid; page-break-inside: avoid; }
  .dept h2 {
    margin: 0 0 5pt; font-size: 11.5pt; letter-spacing: -.3pt; color: #000;
    border-left: 3pt solid #111; padding-left: 6pt;
  }
  .wkp { margin: 0 0 1.5pt; color: #111; white-space: pre-wrap; word-break: break-word; }
  .wkp.lv1 { margin-top: 7pt; }
  .wkp.lv2 { margin-top: 4pt; }
  .wkp.lv3 { margin-top: 2pt; }
  .wkp.lv4 { margin-top: 1pt; }
  .dept h2 + .wkp.lv1 { margin-top: 0; }
  .wkp.a-center { text-align: center; }
  .wkp.a-right { text-align: right; }
  .wtbw { margin: 4pt 0 5pt; }
  .wtb { border-collapse: collapse; width: 100%; break-inside: avoid; page-break-inside: avoid; }
  .wtb td {
    border: .6pt solid #999; padding: 2.5pt 4pt; vertical-align: top; color: #111;
    font-size: 9.5pt; line-height: 1.45; white-space: pre-wrap; word-break: break-word;
  }
  .wtb tr:first-child td { background: #eee; color: #000; font-weight: 700; text-align: center; }
  .wtb .wkp { margin: 0; font-size: inherit; }
  .wtb .wkp.lv1 { margin-top: 3pt; }
  .wtb .wkp.lv2, .wtb .wkp.lv3, .wtb .wkp.lv4 { margin-top: 1pt; }
  .wtb td > .wkp:first-child { margin-top: 0; }
  u { text-decoration: underline; }
`;

/* 미리보기 창 위에 붙는 줄. 인쇄할 때는 @media print 로 사라진다. */
const PAPER_BAR_CSS = `
  .pbar { position: sticky; top: 0; z-index: 9;
    display: flex; align-items: center; gap: 10px;
    padding: 10px 14px; margin: -14px -14px 14px;
    background: #27187E; color: #F7F7FF;
    font-size: 13px; font-weight: 700; }
  .pbar b { font-weight: 800; }
  .pbar .sp { flex: 1; }
  .pbar button { font-family: inherit; font-size: 13px; font-weight: 800;
    border: 0; border-radius: 8px; padding: 7px 16px; cursor: pointer; }
  .pbar .go { background: #F7F7FF; color: #27187E; }
  .pbar .no { background: rgba(255,255,255,.16); color: #F7F7FF; }
  @media print { .pbar { display: none !important; } }
`;
const PAPER_BAR_HTML = '<div class="pbar">'
  + '<b>미리보기</b><span>실제로 나올 종이 그대로입니다</span><span class="sp"></span>'
  + '<button class="no" onclick="paper.close()">닫기</button>'
  + '<button class="go" onclick="paper.print()">🖨 인쇄</button></div>';

function printPaper(p) {
  return new Promise((resolve) => {
    // ★ 이제 «보여 주는» 창이다 — 눈으로 보고 나서 인쇄를 누른다
    const win = new BrowserWindow({
      width: 900, height: 1000, show: false,
      title: (p.range || '주간업무') + ' — 미리보기',
      icon: path.join(__dirname, 'assets', ICON),
      webPreferences: {
        preload: path.join(__dirname, 'paperload.js'),
        nodeIntegration: false, contextIsolation: true
      }
    });
    win.setMenuBarVisibility(false);
    const html = '<!doctype html><html lang="ko"><head><meta charset="utf-8">'
      + '<title>' + escHtml(p.title) + '</title>'
      + '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9'
      + '/dist/web/variable/pretendardvariable-dynamic-subset.min.css">'
      + '<style>' + PRINT_CSS + PAPER_BAR_CSS + '</style></head><body>'
      + PAPER_BAR_HTML
      + '<div class="head"><h1>' + escHtml(p.range || '주간업무') + '</h1>'
      + '<div class="sub">' + escHtml(p.doc || '') + ' · ' + escHtml(APP_NAME)
      + ' · 뽑은 날 ' + stampNow() + '</div></div>'
      + (p.body || '')
      + '</body></html>';

    const done = (ok) => {
      paperWin = null;
      if (!win.isDestroyed()) win.destroy();
      resolve(ok);
    };
    // 창이 닫히면(엑스를 눌러도) 기다리던 쪽을 풀어 준다
    win.once('closed', () => { paperWin = null; resolve(true); });
    win.webContents.once('did-finish-load', () => {
      // 글꼴이 늦게 올 수 있어 조금 기다렸다가 보여 준다 (글자가 깨져 보이는 것을 막는다)
      setTimeout(() => {
        if (win.isDestroyed()) return;
        win.center();
        win.show();
      }, 400);
    });
    win.webContents.once('did-fail-load', () => { debugLog('인쇄용 종이를 못 그림'); done(false); });
    paperWin = win;
    win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
  });
}
function escHtml(t) {
  return String(t == null ? '' : t)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function stampNow() {
  const d = new Date(), p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '.' + p(d.getMonth() + 1) + '.' + p(d.getDate())
    + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}

/* 미리보기 창에서 오는 두 가지 */
let paperWin = null;
ipcMain.on('paper-print', () => {
  if (!paperWin || paperWin.isDestroyed()) return;
  paperWin.webContents.print({ silent: false, printBackground: true }, (ok, why) => {
    if (!ok && why && why !== 'cancelled') debugLog('주간업무 인쇄 실패: ' + why);
    else debugLog('주간업무 인쇄 — ' + (ok ? '보냄' : '취소'));
  });
});
ipcMain.on('paper-close', () => {
  if (paperWin && !paperWin.isDestroyed()) paperWin.close();
});

ipcMain.handle('work-print', async (_e, p) => {
  if (!p || !p.body) return false;
  return printPaper(p);
});

/* ── AI 사용량 ── */
ipcMain.on('usage-login', (_e, key) => aiusage.openLogin(String(key || '')));
ipcMain.on('usage-refresh', () => pollUsageEnabled());
ipcMain.on('usage-style', (_e, style) => {
  saveState({ usageStyle: style === 'bar' ? 'bar' : 'ring' });
  sendToWidget();
});
// 이전주·다음주 — 숨은 창의 앱에게 그 주 자료를 물어본다
/* ===================== 진행 상태 알리기 =====================
   무엇을 언제 받는지 화면에 보이게 한다. 그동안 조용히 실패하면
   사용자는 «안 된다»고만 알 수 있었다. */
const tasks = {};   // key -> { label, state:'wait'|'busy', at }

function sendTasks() {
  if (!widgetWin || widgetWin.isDestroyed()) return;
  const list = Object.keys(tasks).map((k) => Object.assign({ key: k }, tasks[k]));
  widgetWin.webContents.send('task-status', list);
}
function setTask(key, label, state, at) {
  if (!state) delete tasks[key];
  else tasks[key] = { label: label, state: state, at: at || 0 };
  sendTasks();
}

/* 잠시 뒤에 할 일을 예약하고, 그 사이 남은 시간을 화면에 보여준다 */
function scheduleTask(key, label, delayMs, run) {
  setTask(key, label, 'wait', Date.now() + delayMs);
  setTimeout(async () => {
    setTask(key, label, 'busy');
    try { await run(); } catch (e) { /* 각자 안에서 로그를 남긴다 */ }
    setTask(key, null, null);
  }, delayMs);
}

/* ===================== 주간업무계획 ===================== */
// ★드라이브 권한이 필요 없다. 구글 문서를 «링크 공유» 주소로 그냥 받아온다.
//   (drive.readonly 는 구글이 «제한된 권한»이라 검증 안 받은 앱엔 안 내준다 — 계속 403 이 났다)
const worknotice = require('./worknotice.js');
const workFile = path.join(userDataPath, 'work.json');
const WORK_REFRESH_MS = 6 * 60 * 60 * 1000;   // 6시간마다 조용히 다시 받는다

function loadWork() {
  try { return JSON.parse(fs.readFileSync(workFile, 'utf-8')); } catch (e) { return null; }
}
/* ★ v1.14 에서 주간업무를 «표까지 살리는 새 모양»으로 바꿨다.
   예전에 받아 둔 파일은 부서마다 lines(글줄만)를 들고 있어서, 그대로 그리면
   부서 이름만 있고 속은 텅 빈 카드가 된다. 옛 모양이면 다시 받아야 한다. */
function workIsOld(w) {
  if (!w) return true;
  /* ★ 해석기(worknotice.js)를 고쳐도 «이미 저장된 해석본» 이 그대로 보였다.
     받을 때 한 번 해석해 두는 구조라, 고친 규칙이 옛 자료에는 안 먹는다
     (2026-09-02 번호 단계 고침이 안 보이던 까닭). 해석기 판이 다르면 새로 받는다. */
  if (w.parseVer !== worknotice.PARSE_VER) return true;
  const wk = ((w.input || [])[0]) || ((w.merged || [])[0]);
  if (!wk) return true;
  const d = (wk.depts || [])[0];
  return !!(d && !d.blocks);
}
function saveWork(v) {
  const out = Object.assign({}, v, { parseVer: worknotice.PARSE_VER });
  try { fs.writeFileSync(workFile, JSON.stringify(out)); } catch (e) { debugLog(`주간업무 저장 실패: ${e.message}`); }
}
let workFetching = false;
async function refreshWork(why) {
  if (workFetching) return loadWork();
  workFetching = true;
  try {
    debugLog(`주간업무 받기 (${why})`);
    const w = await worknotice.fetchWork();
    saveWork(w);
    debugLog(`주간업무 받기 완료 — 입력본 ${(w.input || []).length}주 / 합본 ${(w.merged || []).length}주` + (w.error ? ` · ${w.error}` : ''));
    if (widgetWin && !widgetWin.isDestroyed()) widgetWin.webContents.send('work-changed');
    return w;
  } catch (e) {
    debugLog(`주간업무 받기 실패: ${e && e.message ? e.message : e}`);
    return loadWork();
  } finally { workFetching = false; }
}

ipcMain.handle('get-work', () => {
  const w = loadWork();
  // 옛 모양이면 그리지 말고 곧바로 다시 받는다 — 다 받으면 work-changed 로 알려 준다
  if (workIsOld(w)) {
    scheduleTask('work', '주간업무', 200, () => refreshWork('옛 모양이라 새로 받음'));
    return { input: [], merged: [], error: '', refreshing: true };
  }
  return w;
});
ipcMain.handle('work-fetch', async () => {
  setTask('work', '주간업무', 'busy');
  try { return await refreshWork('직접 요청'); } finally { setTask('work', null, null); }
});

ipcMain.handle('get-week', async (_e, off) => {
  const win = getWorkerWindow();
  try {
    return await win.webContents.executeJavaScript(
      `window.__widgetWeek ? window.__widgetWeek(${Number(off) || 0}) : null`, true);
  } catch (e) {
    debugLog(`주간 자료 가져오기 실패(${off}): ${e && e.message ? e.message : e}`);
    return null;
  }
});
/* 여러 주를 한 번에 — 학기 진도표는 스물다섯 주쯤 된다.
   한 주씩 부르면 그만큼 오가야 해서 화면이 늦게 뜬다.
   ★ 숨은 창 안에서 도는 셈이라 무겁지 않다(서버에 다시 묻지 않는다). */
ipcMain.handle('get-weeks', async (_e, o) => {
  const win = getWorkerWindow();
  const from = Math.max(-60, Math.min(60, Number(o && o.from) || 0));
  const to = Math.max(from, Math.min(from + 40, Number(o && o.to) || from));
  try {
    return await win.webContents.executeJavaScript(
      `(function(){ if(!window.__widgetWeek) return null;`
      + ` var out=[]; for (var i=${from}; i<=${to}; i++) { try { out.push(window.__widgetWeek(i)); }`
      + ` catch(e) { out.push(null); } } return out; })()`, true);
  } catch (e) {
    debugLog(`학기 주간 자료 가져오기 실패(${from}~${to}): ${e && e.message ? e.message : e}`);
    return null;
  }
});
app.on('will-quit', () => { try { globalShortcut.unregisterAll(); } catch (e) {} });
/* 전체화면 ↔ 원래 크기 — 백틱(`) 으로 오간다.
   ★ 어느 창에서 눌렀는지 보고 그 창만 바꾼다. 위젯과 넓게 보기가 따로 논다. */
ipcMain.on('toggle-full', (e) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  if (!win || win.isDestroyed()) return;
  const want = !win.isFullScreen();
  win.setFullScreen(want);
  debugLog('전체화면 ' + (want ? '켬' : '끔'));
});
/* 창 아래가 모니터 밖으로 나갔다고 «그리는 쪽» 이 알려 왔다.
   ★ 값은 모두 CSS 픽셀이다. 여기서는 창 높이와 안쪽 높이를 견주어
     배율을 스스로 알아낸다(창높이 ÷ inner). 그래야 배율 섞인 PC 에서도 안 틀린다.
   ★ 먼저 위로 올려 본다 — 사람이 정한 크기를 함부로 줄이지 않는다.
     올릴 자리가 모자란 만큼만 높이를 깎는다. */
ipcMain.on('too-tall', (e, o) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  if (!win || win.isDestroyed() || win.isFullScreen()) return;
  const inner = Number(o && o.inner) || 0;
  const over = Number(o && o.over) || 0;
  const room = Math.max(0, Number(o && o.room) || 0);
  if (inner <= 0 || over <= 2) return;
  const b = win.getBounds();
  const k = b.height / inner;                 // 창이 쓰는 단위 ÷ CSS 픽셀
  if (!isFinite(k) || k <= 0) return;
  const 올릴것 = Math.min(over, room);
  const 깎을것 = over - 올릴것;
  const y = Math.round(b.y - 올릴것 * k);
  const h = Math.max(200, Math.round(b.height - 깎을것 * k) - 2);
  if (y === b.y && h >= b.height) return;
  debugLog(`창 아래가 화면 밖 — ${b.height}@${b.y} → ${h}@${y}`
    + ` (넘친 ${over}css · 위로 ${올릴것} · 깎은 ${깎을것})`);
  win.setBounds({ x: b.x, y: y, width: b.width, height: h });
  if (win === widgetWin) saveState({ userH: h, y: y });
});
ipcMain.on('open-app', () => openInBrowser(APP_URL));
// 주간업무 글 안에 걸린 링크 — 크롬으로 연다.
// 어디로든 열어 주면 안 되므로 http(s) 인지 한 번 보고 연다.
ipcMain.on('open-url', (_e, url) => {
  const u = String(url || '');
  if (!/^https?:\/\//i.test(u)) { debugLog('열 수 없는 주소: ' + u.slice(0, 60)); return; }
  openInBrowser(u);
});
ipcMain.on('set-view', (_e, view) => {
  // ★ 여기 목록이 VIEWS 와 어긋나면, 새 탭(학생기록)에 있어도 저장이 안 돼서
  //   다음 갱신 때 «마지막으로 저장된 탭»으로 되돌아가 버린다. 목록을 한 곳에서 쓴다.
  if (!VIEWS.includes(view)) return;
  saveState({ view });
  applyWidgetWidth(view);
});
// 내용 높이에 맞춰 카드 높이를 조절한다 (가로는 고정)
ipcMain.on('content-height', (_e, h) => {
  if (!widgetWin || widgetWin.isDestroyed()) return;
  const k = SIZES[getScale()];
  if (userSized()) return;   // 직접 맞춰 둔 크기를 건드리지 않는다
  const want = Math.round(Math.min(Math.max(h, 120), 620) * k);
  const b = widgetWin.getBounds();
  if (Math.abs(b.height - want) < 3) return;
  widgetWin.setBounds({ x: b.x, y: b.y, width: b.width, height: want });
});

process.on('uncaughtException', (err) => debugLog(`uncaughtException: ${err && err.stack ? err.stack : err}`));

/* ===================== 시작 ===================== */
/* ── 설치기가 띄운 판은 «징검다리» 로만 쓴다 ──────────────────
   ★ 업데이트 설치기(--updated 로 띄움)가 낳은 프로세스는 병들어 태어난다 —
     돌기는 도는데 제 폴더(Roaming\JindoWidget)에 아무것도 못 쓴다.
     기록이 안 남고, 로그인해도 저장이 안 되고(widget-state 가 안 바뀜),
     세션 저장이 안 되니 매번 «로그인하세요» 가 떴다. (2026-08-31 두 번 실측)
     손으로 켠 프로세스는 늘 멀쩡했다 — 껐다 켜면 즉시 낫던 까닭이다.
   ★ 그래서 그 병든 판은 일을 하지 않는다. 자기를 «깨끗한 조건으로» 다시 켜고
     곧장 물러난다. relaunch 는 이 판이 끝난 뒤에 도니 잠금도 안 부딪친다. */
if (process.argv.indexOf('--updated') >= 0) {
  try {
    fs.appendFileSync(debugLogFile,
      '[' + new Date().toISOString() + '] 설치기가 띄운 판(--updated) — 깨끗하게 다시 켜고 물러납니다'
      + ' (v' + app.getVersion() + ')' + String.fromCharCode(10));
  } catch (e) { /* 병든 판은 이 기록조차 못 쓸 수 있다 — 그래도 다시 켜는 것이 일이다 */ }
  /* ★★ 다시 켜기는 «작업 스케줄러» 에게 부탁한다.
     처음엔 cmd(ping 뒤 탐색기) 자식으로 했는데 — Electron 은 끝날 때
     «떼어 놓은(detached) 자식까지 몰살» 한다는 것을 결정 실험으로 확인했다
     (2026-09-01 t-jobkill: ping 3초짜리 자식이 파일 하나 못 남기고 딸려 죽음).
     그래서 어제 판올림마다 앱이 증발했다 — 램 탓이라 짚었던 것도 절반은 이것이었다.
     작업 스케줄러는 시스템 서비스 소속이라 몰살에서 벗어난다(t-jobkill2 로 확인).
     차림: 각본(.cmd)을 적어 두고 → 스케줄러에 등록 → 곧장 실행시키고 → 물러난다.
     각본은 2초 기다렸다(이 판이 죽을 틈) 앱을 켜고 제 등록을 지운다. */
  try {
    const { execSync } = require('child_process');
    const CR = String.fromCharCode(13);
    const cmdFile = path.join(userDataPath, 'relaunch.cmd');
    fs.writeFileSync(cmdFile, ['@echo off',
      'ping -n 3 127.0.0.1 >nul',
      'start "" "' + process.execPath + '"',
      'schtasks /delete /tn JindoWidgetRelaunch /f >nul 2>&1'
    ].join(CR + String.fromCharCode(10)) + CR + String.fromCharCode(10));
    /* ★ 스케줄러가 .cmd 를 곧장 돌리면 검은 콘솔 창이 뜨고, 앱의 오류 글줄이
       그 창에 붙는다 — 사람이 그 창을 닫으면 앱이 같이 죽는다(2026-09-01 실제로).
       wscript 로 감싸 창 없이(0) 돌린다. */
    const vbsFile = path.join(userDataPath, 'relaunch.vbs');
    fs.writeFileSync(vbsFile,
      'CreateObject("WScript.Shell").Run "cmd /c ""' + cmdFile + '""", 0, False' + CR + String.fromCharCode(10));
    execSync('schtasks /create /f /tn JindoWidgetRelaunch /tr "wscript.exe \\"' + vbsFile
      + '\\"" /sc once /st 23:59', { stdio: 'ignore', windowsHide: true });
    execSync('schtasks /run /tn JindoWidgetRelaunch', { stdio: 'ignore', windowsHide: true });
  } catch (e) {
    try {
      fs.appendFileSync(debugLogFile, '[' + new Date().toISOString()
        + '] 스케줄러 부탁 실패(' + e.message + ') — relaunch 로 대신' + String.fromCharCode(10));
    } catch (e2) { /* 무시 */ }
    app.relaunch({ args: [] });   // 이 길은 병들 수 있지만 없는 것보단 낫다
  }
  app.exit(0);
}

/* ── 시작 파수꾼 ─────────────────────────────────────────
   ★ 업데이트 직후 «좀비» 가 생기는 일이 있었다 (2026-08-31 아수스에서 실제로).
     설치기가 새 판을 띄웠는데 옛 판이 아직 죽는 중이라, 새 판의 시작 절차(whenReady)가
     영영 안 돌았다 — 이벤트에는 반응하면서(찌르면 창을 만든다) 자료 갱신·로그인 마무리·
     기록은 하나도 안 하는 상태. 겉보기엔 «로그인이 안 된다» 로 나타났다.
   ★ 좀비는 스스로 못 알아챈다. 그래서 밖에서 지킨다 —
     30초 안에 시작 절차가 완료(bootOk)되지 않으면 기록을 남기고 스스로 다시 켠다.
     정상 시작은 몇 초면 끝나므로 멀쩡한 앱을 건드릴 일은 없다. */
let bootOk = false;
setTimeout(() => {
  if (bootOk) return;
  try {
    fs.appendFileSync(debugLogFile,
      '[' + new Date().toISOString() + '] ★ 시작 절차가 30초 안에 안 끝남(좀비) — 다시 켭니다'
      + ' (v' + app.getVersion() + ')' + String.fromCharCode(10));
  } catch (e) { /* 무시 */ }
  try { app.relaunch(); } catch (e) { /* 무시 */ }
  app.exit(1);
}, 30 * 1000);

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  /* 물러나는 것은 «일부러» 끝나는 것이다 — 파수꾼이 다시 켜면 무한 고리가 된다 */
  bootOk = true;
  /* ★ 여기서 조용히 사라지면 «앱은 도는데 기록이 한 줄도 안 남는» 상태가 된다.
     실제로 아수스에서 일곱 시간을 그렇게 보냈다 — 업데이트가 앱을 다시 띄웠는데
     옛 프로세스가 아직 안 죽어 잠금을 쥐고 있었고, 새 것은 여기서 조용히 끝났다.
     그 사이 화면에는 옛 프로세스의 «죽은 창» 이 남아 로그인 화면만 보였다.
     적어도 흔적은 남긴다. */
  try {
    fs.appendFileSync(path.join(app.getPath('userData'), 'debug.log'),
      '[' + new Date().toISOString() + '] 이미 떠 있는 진호알리미가 있어 이 판은 물러납니다'
      + ' (v' + app.getVersion() + ')' + String.fromCharCode(10));
  } catch (e) { /* 무시 */ }
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!widgetWin) { createWidgetWindow(); return; }
    widgetWin.show(); widgetWin.focus();
  });

  /* ── 겹침 방지 두 번째 잠금 (포트) ──
     Electron 의 단일 실행 잠금은 «파일» 로 되어 있다. 보안 프로그램(V3)이
     낯선 출신 프로세스의 파일을 그림자로 격리하면 서로의 잠금이 안 보여서,
     실제로 아수스에서 두 벌이 겹쳐 떴고 위에 올라온 죽은 벌이 로그인 화면만 보여줬다.
     포트는 커널이 쥐고 있어 그림자로 못 가린다 — 여기에 한 번 더 잠근다.
     ★ 늦게 뜬 쪽이 살아남는다. 화면이 이상해서 사람이 다시 켜면
       «새 것으로 바뀌는» 것이 맞기 때문이다. */
  const GUARD_PORT = HAS_TT ? 47291 : 47292;   // 진호알리미 / 혜원이지 — 둘이 같이 뜨는 건 된다
  function startInstanceGuard(tries) {
    const left = (tries === undefined) ? 5 : tries;
    const srv = http.createServer((req, res) => {
      if (req.url === '/quit-for-new') {
        debugLog('새 판이 떠서 이 판은 물러납니다 (포트 잠금)');
        res.end('ok');
        setTimeout(() => app.exit(0), 150);
        return;
      }
      res.end('guard v' + app.getVersion());
    });
    srv.once('error', (e) => {
      if (e && e.code === 'EADDRINUSE') {
        if (left <= 0) { killGuardHolder(); return; }
        // 먼저 뜬 벌에게 물러나라고 말하고, 잠시 뒤 다시 잡아 본다
        const rq = http.get({ host: '127.0.0.1', port: GUARD_PORT,
          path: '/quit-for-new', timeout: 2000 }, () => {});
        rq.on('error', () => {});
        rq.on('timeout', () => rq.destroy());
        setTimeout(() => startInstanceGuard(left - 1), 1500);
      } else {
        debugLog('포트 잠금 실패 — ' + ((e && e.message) || e));
      }
    });
    srv.listen(GUARD_PORT, '127.0.0.1', () => {
      debugLog('포트 잠금 잡음 (' + GUARD_PORT + ')');
    });
  }
  /* 물러나라고 해도 안 물러난다 = 일손이 멈춘 좀비다. 포트 주인을 찾아 강제로 내린다. */
  function killGuardHolder() {
    try {
      const { execSync } = require('child_process');
      const out = execSync('netstat -ano -p tcp', { encoding: 'utf8' });
      const line = out.split(/\r?\n/).filter((l) =>
        l.indexOf('127.0.0.1:' + GUARD_PORT) >= 0 && /LISTENING/i.test(l))[0];
      const pid = line && Number(line.trim().split(/\s+/).pop());
      if (pid && pid !== process.pid) {
        debugLog('좀비(' + pid + ')가 포트를 쥐고 있어 강제로 내립니다');
        execSync('taskkill /PID ' + pid + ' /T /F');
        setTimeout(() => startInstanceGuard(1), 1200);
        return;
      }
    } catch (e) { debugLog('좀비 내리기 실패 — ' + ((e && e.message) || e)); }
    debugLog('포트 잠금을 끝내 못 잡았습니다 — 잠금 없이 갑니다');
  }
  startInstanceGuard();

  app.whenReady().then(() => {
    bootOk = true;   // 파수꾼에게 «심장이 뛰기 시작했다» 고 알린다
    debugLog(`=== 시작 === v${app.getVersion()} · 로그: ${debugLogFile}`);
    /* ★ 손상된 저장창고 청소 — 격리가 IndexedDB 파일을 빼돌려 «손상→삭제→재생성» 이
       반복되던 자리(2026-09-01 실측). 숨은 창은 이제 메모리 전용이라 이 창고가 필요
       없다. 숨은 창을 만들기 전에 비워서 손상 고리를 끊는다. */
    try {
      fs.rmSync(path.join(userDataPath, 'Partitions', 'jindo', 'IndexedDB'),
        { recursive: true, force: true });
    } catch (e) { /* 무시 */ }
    /* ★ 옛 판이 남긴 재기동 예약 작업 찌꺼기 — 뒤늦게 빈 검은 창을 띄운다. 지운다. */
    try {
      require('child_process').exec('schtasks /delete /tn JindoWidgetRelaunch /f',
        { windowsHide: true }, () => { });
    } catch (e) { /* 무시 */ }
    // ★ 창보다 «먼저» 등록한다 — 창이 뜨자마자 sendToWidget() 이 불리는데
    //   그때 학생기록 준비가 안 돼 있으면 예외가 났다
    // 학생기록 — 구글 연결·시트·명렬표는 이 모듈이 맡는다
    recordsmain.register({
      ipcMain: ipcMain,
      userDataPath: userDataPath,
      load: loadState,
      save: saveState,
      log: debugLog,
      send: sendToWidget,
      openInBrowser: openInBrowser
    });
    // 명렬표가 아직 없으면 조용히 한 번 받아 둔다
    if (!recordsmain.loadRoster()) {
      scheduleTask('roster', '명렬표', 5000, () => recordsmain.refreshRoster());
    }

    createWidgetWindow();
    // 지난번에 넓게 보기로 두었으면 그 모습으로 시작한다
    if (getViewMode() === 'easy') openEasyWindow();
    createTray();
    applyHotkeys();
    if (HAS_TT) {
      getWorkerWindow();
      // 앱이 로그인·자료 불러오기를 끝낼 시간을 조금 준 뒤 첫 조회
      setTimeout(pollOnce, 6000);
      pollTimer = setInterval(pollOnce, POLL_INTERVAL_MS);
      /* ★ 심장 감시 — poll 이 «끝나지» 못한 채 5분이 지나면 스스로 다시 켠다.
         램이 바닥났을 때 숨은 창·네트워크가 죽고, poll 이 대답 없는 창을 기다리며
         영영 매달렸다(2026-08-31 실측). 매달린 앱은 겉만 살아 있다 —
         창 이동은 되는데 자료·로그인·기록이 전부 멎어 «로그인하세요» 만 남는다.
         그 상태는 안에서 못 고친다. 다시 태어나는 것이 답이다. */
      setInterval(() => {
        if (Date.now() - lastPollDone < 5 * 60 * 1000) return;
        try {
          fs.appendFileSync(debugLogFile,
            '[' + new Date().toISOString() + '] ★ 심장이 5분째 안 뜀(poll 매달림) — 다시 켭니다'
            + String.fromCharCode(10));
        } catch (e) { /* 무시 */ }
        try { app.relaunch(); } catch (e) { /* 무시 */ }
        app.exit(1);
      }, 60 * 1000);
    } else {
      // 혜원 데스크는 시간표를 안 쓴다 — 수업진도 앱을 띄우지도, 로그인하지도 않는다.
      // 화면 쪽은 «자료가 준비됐다»는 표시만 있으면 되므로 빈 껍데기를 넣어 둔다.
      lastData = { ready: true, needLogin: false, lessons: [], dow: '', date: '' };
      debugLog(`${APP_NAME} — 시간표 없이 시작합니다 (구글 로그인 불필요)`);
      sendToWidget();
    }

    startSys();          // 내 PC (켜 두었을 때만 돈다)
    // 날씨 — 켜고 잠시 뒤 한 번, 그 뒤로는 30분마다
    scheduleTask('wx', '날씨', 3000, () => refreshWeather());
    setInterval(() => refreshWeather(), 30 * 60 * 1000);

    // 런처 목록 — 자주 바뀌지 않으니 켤 때 한 번, 그 뒤로는 6시간마다
    scheduleTask('feed', '내 앱 목록', 6000, () => refreshFeed());
    setInterval(() => refreshFeed(), 6 * 60 * 60 * 1000);

    // 전광판 — 켤 때 한 번, 그 뒤로는 5분마다
    scheduleTask('board', '전광판', 8000, () => refreshBoard());
    setInterval(() => refreshBoard(), 5 * 60 * 1000);

    /* 컴시간 — 켤 때 한 번(닫았다 열면 자동 새로고침) + 6시간마다.
       학교를 안 골랐으면 조용히 지나간다. 시간표가 바뀌어도 하루 안에는 따라온다. */
    scheduleTask('comci', '컴시간', 25 * 1000, () => comciFetchNow('켤 때'));
    setInterval(() => comciFetchNow('6시간 주기'), 6 * 60 * 60 * 1000);

    /* 업무관리 — 켤 때 한 번 + 30분마다. 열쇠가 없으면 조용히 지나간다. */
    if (HAS_TT) {
      scheduleTask('task', '업무관리', 12 * 1000, () => refreshTasks('켤 때'));
      setInterval(() => refreshTasks('30분 주기'), 30 * 60 * 1000);
      scheduleTask('tick', '틱틱', 18 * 1000, () => refreshTick('켤 때'));
      setInterval(() => refreshTick('30분 주기'), 30 * 60 * 1000);
    }

    checkForUpdates();
    setInterval(checkForUpdates, UPDATE_CHECK_INTERVAL_MS);

    // AI 사용량 — 값이 들어오면 그때그때 위젯에 밀어 준다.
    // 숨은 창으로 claude.ai · gemini.google.com 을 열어 읽는 것이라 시작 직후는 피한다.
aiusage.setLogger(debugLog);
    aiusage.onUpdate(() => sendToWidget());
    /* ★ «켜 둔 것만» 읽는다. 전에는 설정과 무관하게 셋 다 읽어서,
       로그인도 안 한 GPT 를 1분마다(하루 1,440번) 헛걸음했다 —
       숨은 창 세 개가 램 수십~백 MB 씩 물고 있었다.
       끈 것은 창도 안 만들어진다(poll 이 안 불리면 worker 도 없다). */
    setTimeout(() => pollUsageEnabled(), 9000);
    setInterval(() => pollUsageEnabled(), USAGE_INTERVAL_MS);

    // 주간업무 — 오래됐거나 «실패로 저장된» 것이면 다시 받는다.
    // ★실패 기록을 성공처럼 붙들고 있으면, 문제가 고쳐진 뒤에도 옛 오류를 계속 보여준다.
    const w0 = loadWork();
    const age = w0 && w0.fetchedAt ? (Date.now() - new Date(w0.fetchedAt).getTime()) : Infinity;
    const wBad = !w0 || w0.error || workIsOld(w0)
      || !((w0.input || []).length || (w0.merged || []).length);
    if (wBad || age > WORK_REFRESH_MS) {
      scheduleTask('work', '주간업무', 2000, () => refreshWork(wBad ? '이전 실패' : '시작'));
    }
    setInterval(() => refreshWork('주기'), WORK_REFRESH_MS);

    // 학사일정 — 받아둔 것이 없거나 실패로 남아 있으면 한 번 받아 둔다
    const a0 = loadAcademic();
    // ★ v1.28.0 이전에 받아 둔 것은 «어느 해인지»(year·ok)를 안 갖고 있다.
    //   그러면 시트에 섞인 다른 해 탭을 못 걸러서, 오늘이 엉뚱한 요일로 나오고
    //   「오늘 일정」에도 다른 해 것이 뜬다(2027년 8월 탭이 이겼던 일이 있다).
    //   낡은 모양이면 조용히 다시 받는다 — 사람이 ⟳ 를 눌러야 하는 것은 고침이 아니다.
    const acOld = a0 && (a0.months || []).length
      && a0.months.some((m) => m.ok === undefined && m.year === undefined);
    if (!a0 || a0.error || !((a0.months || []).length) || acOld) {
      if (acOld) debugLog('학사일정 — 옛 모양(어느 해인지 모름)이라 새로 받습니다');
      scheduleTask('cal', '학사일정', 4000, () => refreshAcademic());
    }

    // 급식 — 이번 주 것이 없거나 오래됐으면 조용히 받는다
    const m0 = loadMeals();
    const mAge = m0 && m0.fetchedAt ? (Date.now() - new Date(m0.fetchedAt).getTime()) : Infinity;
    const mBad = !m0 || m0.error || !((m0.meals || []).length);
    if (mBad || mAge > 12 * 60 * 60 * 1000) {
      scheduleTask('meal', '급식', 3000, () => refreshMeals());
    }
    setInterval(() => refreshMeals(), 12 * 60 * 60 * 1000);

    /* 급식지도 순서표 — 학기에 한 번 만들고 잘 안 바뀐다. 하루에 한 번이면 넉넉하다. */
    const d0 = loadDuty();
    const dAge = d0 && d0.fetchedAt ? (Date.now() - new Date(d0.fetchedAt).getTime()) : Infinity;
    if (!d0 || d0.error || dAge > 24 * 60 * 60 * 1000) {
      scheduleTask('duty', '급식지도', 5000, () => refreshDuty('처음'));
    }
    setInterval(() => refreshDuty('하루에 한 번'), 24 * 60 * 60 * 1000);
    // 절전에서 깨거나 잠금을 풀었을 때도 한 번 본다 (그 사이 새 버전이 나왔을 수 있다)
    try {
      powerMonitor.on('resume', () => { debugLog('절전 해제 — 업데이트 확인'); checkForUpdates(); });
      powerMonitor.on('unlock-screen', () => checkForUpdates());
    } catch (e) { debugLog(`전원 감시 등록 실패: ${e.message}`); }

    /* ★ 모니터를 뽑거나 해상도가 바뀌면 «작업 영역» 도 바뀐다 —
       한계를 다시 걸어야 그 화면에 맞는다. */
    ['display-removed', 'display-added', 'display-metrics-changed'].forEach((ev) => {
      screen.on(ev, () => setTimeout(() => { clampAll('화면이 바뀜'); keepOnScreen(); }, 400));
    });
  });
}

app.on('window-all-closed', (e) => { e.preventDefault && e.preventDefault(); });
app.on('before-quit', (e) => {
  if (pollTimer) clearInterval(pollTimer);
  aiusage.stop();
  // 받아둔 업데이트가 있으면 여기서 설치한다. 이때 반드시 다시 띄워야 한다 —
  // electron-updater 의 autoInstallOnAppQuit 은 설치만 하고 앱을 안 살려서,
  // 위젯이 조용히 사라진 채로 남는다(그러면 업데이트 확인도 영영 못 한다).
  // 사용자가 트레이 «종료»로 직접 끈 경우에는 되살리지 않는다.
  if (updateState === 'ready' && !userQuit && !installingUpdate) {
    installingUpdate = true;
    e.preventDefault();
    debugLog('종료 전에 업데이트를 설치하고 다시 띄웁니다');
    autoUpdater.quitAndInstall(true, true);
  }
});
