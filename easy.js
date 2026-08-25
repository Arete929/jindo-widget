/* 파일명: easy.js | @version 1.0.0
   혜원이지 — 넓은 창의 뼈대. 왼쪽 메뉴 · 대시보드 · 화면 갈아 끼우기.

   ★ 자료를 읽어 오고 화면 조각을 만드는 일은 views.js 가 그대로 한다.
     여기서는 render() 만 «우리 것»으로 바꿔 끼운다. 그래서 위젯 쪽을 고치면
     혜원이지도 같이 고쳐진다 — 두 번 고칠 일이 없다.
     (이 파일은 views.js 다음에 읽힌다. 그래야 바꿔 끼우기가 먹는다.) */

var SIDE = document.getElementById('side');
var MAIN = document.getElementById('main');

/* 담긴 화면. v 값은 위젯이 쓰는 이름 그대로다 — 설정·기억이 서로 통한다. */
var MENU = [
  { v: 'home', i: '🏠', t: '대시보드', d: '오늘 것을 한눈에', g: '' },
  { v: 'work', i: '📋', t: '주간업무', d: '표·들여쓰기까지 원문 그대로', g: '오늘 볼 것' },
  { v: 'cal', i: '📅', t: '학사일정', d: '3월부터 이듬해 2월까지', g: '오늘 볼 것' },
  { v: 'meal', i: '🍚', t: '급식', d: '주 단위로 넘겨 보기', g: '오늘 볼 것' },
  { v: 'comci', i: '🕘', t: '컴시간', d: '교사·학급 시간표', g: '오늘 볼 것' },
  { v: 'rec', i: '✍', t: '학생기록', d: '학급 → 학생 → 분류로 쓰고 모아 보기', g: '기록' }
];
function menuOf(v) { return MENU.filter(function (m) { return m.v === v; })[0] || MENU[0]; }
function known(v) { return MENU.some(function (m) { return m.v === v; }); }

/* ── 왼쪽 메뉴 ── */
function drawSide() {
  var h = '<div class="brand"><img src="assets/hyewon-icon.png" alt="">'
    + '<span><b>혜원이지</b><small>HYEWON EASY</small></span></div>';
  h += MENU.map(function (m) {
    return '<button class="nav' + (VIEW === m.v ? ' on' : '') + '" data-go="' + m.v + '">'
      + '<i>' + m.i + '</i>' + esc(m.t) + '</button>';
  }).join('');
  h += '<div class="navgap"></div>'
    + '<button class="nav" id="goSet"><i>⚙</i>설정</button>'
    + '<div class="sfoot">v' + esc(VER) + ' · made by KIMJINHO</div>';
  SIDE.innerHTML = h;
  SIDE.querySelectorAll('[data-go]').forEach(function (b) {
    b.addEventListener('click', function () { go(b.dataset.go); });
  });
  var gs = SIDE.querySelector('#goSet');
  if (gs) gs.addEventListener('click', function () { widgetAPI.openSettings(); });
}

function go(v) {
  VIEW = v;
  if (v !== 'home') widgetAPI.setView(v);   // 위젯과 같은 자리에 기억해 둔다
  render();
}

/* ── 대시보드 ── */
function todayLine() {
  var now = new Date();
  var dow = ['일', '월', '화', '수', '목', '금', '토'][now.getDay()];
  var h = '<div class="today"><span class="big">'
    + (now.getMonth() + 1) + '월 ' + now.getDate() + '일 (' + dow + ')</span>';
  var note = (STATE && STATE.note) || TODAYEV || '';
  if (note) h += '<span class="it"><b>오늘 일정</b>' + esc(note) + '</span>';
  var wk = WORK && WORK[workDoc];
  if (wk && wk.length) h += '<span class="it"><b>주간업무</b>' + esc(wk[0].label || '') + '</span>';
  if (REC && REC.sheet && REC.sheet.name) {
    h += '<span class="it"><b>학생기록</b>' + esc(REC.sheet.name) + '</span>';
  }
  return h + '</div>';
}

function tile(m) {
  var on = EASYFAV.indexOf(m.v) >= 0;
  return '<div class="tile" data-go="' + m.v + '">'
    + '<button class="fav' + (on ? ' on' : '') + '" data-fav="' + m.v + '" '
    + 'title="' + (on ? '즐겨찾기에서 빼기' : '즐겨찾기에 넣기') + '">' + (on ? '★' : '☆') + '</button>'
    + '<div class="ic">' + m.i + '</div>'
    + '<div class="tt">' + esc(m.t) + '</div>'
    + '<div class="td">' + esc(m.d) + '</div></div>';
}

function viewHome() {
  var h = '<div class="ph"><h1>혜원이지</h1><span class="sub">HYEWON EASY</span></div>';
  h += todayLine();

  var favs = EASYFAV.filter(known).map(menuOf).filter(function (m) { return m.v !== 'home'; });
  if (favs.length) {
    h += '<div class="grp">즐겨찾기</div><div class="tiles">' + favs.map(tile).join('') + '</div>';
  }
  var groups = [];
  MENU.forEach(function (m) { if (m.g && groups.indexOf(m.g) < 0) groups.push(m.g); });
  groups.forEach(function (g) {
    h += '<div class="grp">' + esc(g) + '</div><div class="tiles">'
      + MENU.filter(function (m) { return m.g === g; }).map(tile).join('') + '</div>';
  });
  return h;
}

/* ── 화면 그리기 — views.js 의 render() 를 이것으로 바꿔 끼운다 ── */
render = function () {
  if (composing) return;   // 한글 조합 중에는 화면을 건드리지 않는다
  if (!known(VIEW)) VIEW = 'home';
  drawSide();
  if (!STATE) { MAIN.innerHTML = '<div class="loading">불러오는 중…</div>'; return; }

  var m = menuOf(VIEW);
  var h;
  if (VIEW === 'home') {
    h = viewHome();
  } else {
    h = '<div class="ph"><h1>' + esc(m.t) + '</h1><span class="sub">' + esc(m.d) + '</span></div>'
      + '<div id="view">'
      + (VIEW === 'work' ? viewWork()
        : VIEW === 'cal' ? viewAcademic()
          : VIEW === 'meal' ? viewMeals()
            : VIEW === 'comci' ? viewComci()
              : VIEW === 'rec' ? viewRec() : '')
      + '</div>';
  }
  MAIN.style.setProperty('--wf', String(FS[fsKey()] || 1));
  MAIN.style.setProperty('--toph', '0px');   // 머리에 붙여 놓은 줄이 없다
  MAIN.innerHTML = h;

  // 즐겨찾기 별표 — 타일을 여는 것보다 «먼저» 가로챈다
  MAIN.querySelectorAll('[data-fav]').forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      var v = b.dataset.fav, i = EASYFAV.indexOf(v);
      if (i >= 0) EASYFAV.splice(i, 1); else EASYFAV.push(v);
      widgetAPI.setUi({ easyFav: EASYFAV });
      render();
    });
  });
  MAIN.querySelectorAll('[data-go]').forEach(function (b) {
    b.addEventListener('click', function () { go(b.dataset.go); });
  });

  wireViews(MAIN);   // 안쪽 화면의 단추·입력칸 — 위젯이 쓰는 연결 그대로

  // 학사일정을 처음 열면 오늘 자리에서 시작한다
  if (VIEW === 'cal' && !acScrolled) { if (goToday()) acScrolled = true; }
  if (VIEW !== 'cal') acScrolled = false;
};

/* 카드 높이를 알려 줄 필요가 없는 창이다 (그 일은 떠 있는 위젯만 한다) */
report = function () {};

/* «지금 보고 있는 달»로 월 단추 표시를 옮긴다 — 스크롤하는 곳이 위젯과 다르다 */
var __easyTimer = null;
MAIN.addEventListener('scroll', function () {
  if (__easyTimer) return;
  __easyTimer = setTimeout(function () { __easyTimer = null; acSpyScroll(); }, 90);
}, { passive: true });

VIEW = 'home';
render();
