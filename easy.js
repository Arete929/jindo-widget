/* 파일명: easy.js | @version 1.7.0
   혜원이지 — 넓은 창의 뼈대. 왼쪽 메뉴 · 대시보드 · 화면 갈아 끼우기.

   ★ 자료를 읽어 오고 화면 조각을 만드는 일은 views.js 가 그대로 한다.
     여기서는 render() 만 «우리 것»으로 바꿔 끼운다. 그래서 위젯 쪽을 고치면
     혜원이지도 같이 고쳐진다 — 두 번 고칠 일이 없다.
     (이 파일은 views.js 다음에 읽힌다. 그래야 바꿔 끼우기가 먹는다.) */

var SIDE = document.getElementById('side');
var MAIN = document.getElementById('main');
var EBAR = document.getElementById('ebar');   // 맨 위를 가로지르는 띠

/* 담긴 화면. v 값은 위젯이 쓰는 이름 그대로다 — 설정·기억이 서로 통한다. */
// 그림 아이콘은 Music\\진호아이콘 에서 가져와 assets/nav-*.png 로 넣어 두었다
var MENU = [
  { v: 'home', p: 'nav-home', t: '대시보드', d: '오늘 것을 한눈에', g: '' },
  { v: 'work', p: 'nav-work', t: '주간업무', d: '표·들여쓰기까지 원문 그대로', g: '오늘 볼 것' },
  { v: 'cal', p: 'nav-cal', t: '학사일정', d: '3월부터 이듬해 2월까지', g: '오늘 볼 것' },
  { v: 'meal', p: 'nav-meal', t: '급식', d: '주 단위로 넘겨 보기', g: '오늘 볼 것' },
  { v: 'comci', p: 'nav-comci', t: '컴시간', d: '교사·학급 시간표', g: '오늘 볼 것' },
  { v: 'rec', p: 'nav-rec', t: '학생기록', d: '학급 → 학생 → 분류로 쓰고 모아 보기', g: '기록' }
];
function navImg(m) { return '<img src="assets/' + m.p + '.png" alt="">'; }
function menuOf(v) { return MENU.filter(function (m) { return m.v === v; })[0] || MENU[0]; }
function known(v) { return MENU.some(function (m) { return m.v === v; }); }

/* AI 사용량 — 사이드바 맨 위 타일.
   위젯은 머리에 띠로 붙이지만 넓은 창은 본문이 넓어야 하니 옆으로 뺀다.
   좁은 자리라 «막대» 하나로만 보여준다(원형은 글씨가 뭉갠다). */
function sideUsage() {
  if (!USG) return '';
  var keys = Object.keys(USG).filter(function (k) { return USGON.indexOf(k) >= 0; });
  var ms = sysMetrics();
  if (!keys.length && !ms.length) return '';
  var h = '<div class="sgrp">사용량</div><div class="sus">';
  h += keys.map(function (k) {
    var u = USG[k] || {};
    var ms = usgMetrics(u);
    if (u.needsLogin || (!u.ok && !ms.length)) {
      return '<div class="sut"><div class="sun">' + esc(u.label || k) + '</div>'
        + '<button class="sulg" data-usglogin="' + esc(k) + '">'
        + (u.needsLogin ? '로그인하기' : '다시 시도') + '</button></div>';
    }
    return '<div class="sut"><div class="sun">' + esc(u.label || k) + '</div>'
      + ms.map(function (x) {
          var p = pctOf(x.m);
          return '<div class="sub"><span class="subt">' + esc(x.lb) + '<b>' + p + '%</b></span>'
            + '<span class="subk"><i style="width:' + Math.min(100, p) + '%"></i></span>'
            + '<span class="subr">' + (leftOf(x.m) ? esc(leftOf(x.m)) + ' 남음' : esc(atOf(x.m))) + '</span>'
            + '</div>';
        }).join('')
      + '</div>';
  }).join('');
  // 내 PC — 같은 막대 모양으로
  if (ms.length) {
    h += '<div class="sut"><div class="sun">내 PC</div>'
      + ms.map(function (x) {
          return '<div class="sub"><span class="subt">' + esc(x.lb) + '<b>' + x.pct + '%</b></span>'
            + '<span class="subk' + sysHot(x.pct) + '"><i style="width:' + x.pct + '%"></i></span>'
            + '<span class="subr">' + esc(x.sub) + '</span></div>';
        }).join('')
      + '</div>';
  }
  return h + (keys.length ? '<button class="sulg wide" id="usgGet">⟳ 다시 읽기</button>' : '')
    + '</div>';
}

/* 맨 위 띠 — 업데이트 안내와 «바뀐 내역». 사이드바 위까지 지나간다.
   위젯에서는 머리 안에 들어가지만, 넓은 창은 사이드바가 있어 따로 둔다. */
function drawTop() {
  if (!EBAR) return;
  EBAR.innerHTML = updBar() + notesCard();
  var nx = EBAR.querySelector('#notesX');
  if (nx) nx.addEventListener('click', function () {
    NOTES = null; widgetAPI.notesSeen(); render();
  });
}

/* ── 왼쪽 메뉴 ── */
function drawSide() {
  var h = '<div class="brand"><img src="assets/hyewon-icon.png" alt="">'
    + '<span><b>혜원이지</b><small>HYEWON EASY</small></span></div>';
  h += sideUsage();
  h += MENU.map(function (m) {
    return '<button class="nav' + (VIEW === m.v ? ' on' : '') + '" data-go="' + m.v + '">'
      + navImg(m) + esc(m.t) + '</button>';
  }).join('');
  h += '<div class="navgap"></div>'
    + '<button class="nav" id="goWid"><img src="assets/widget.png" alt="">위젯 보기</button>'
    + '<button class="nav" id="goSet"><img src="assets/nav-set.png" alt="">설정</button>'
    + '<div class="sfoot">v' + esc(VER) + ' · made by KIMJINHO</div>';
  SIDE.innerHTML = h;
  SIDE.querySelectorAll('[data-go]').forEach(function (b) {
    b.addEventListener('click', function () { go(b.dataset.go); });
  });
  // 사용량 타일의 단추 — 본문이 아니라 사이드바에 있으니 여기서 잇는다
  SIDE.querySelectorAll('[data-usglogin]').forEach(function (b) {
    b.addEventListener('click', function () { widgetAPI.usageLogin(b.dataset.usglogin); });
  });
  var ug = SIDE.querySelector('#usgGet');
  if (ug) ug.addEventListener('click', function () {
    ug.textContent = '읽는 중…';
    widgetAPI.usageRefresh();
  });
  var gw = SIDE.querySelector('#goWid');
  if (gw) gw.addEventListener('click', function () { widgetAPI.showWidget(); });
  var gs = SIDE.querySelector('#goSet');
  if (gs) gs.addEventListener('click', function () { widgetAPI.openSettings(); });
}

function go(v) {
  // ★ 위젯과 «보던 탭» 을 나눠 갖지 않는다. 나눠 가지면 넓은 창에서 옮길 때
  //   뒤에 떠 있는 위젯 탭까지 같이 바뀌어 헷갈린다. 이 창은 늘 대시보드에서 시작한다.
  VIEW = v;
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
    + '<div class="ic">' + navImg(m) + '</div>'
    + '<div class="tt">' + esc(m.t) + '</div>'
    + '<div class="td">' + esc(m.d) + '</div></div>';
}

function viewHome() {
  var h = todayLine();
  h += wxCard();   // 사용량은 사이드바에 있다

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
  drawTop();
  drawSide();
  if (!STATE) { MAIN.innerHTML = '<div class="loading">불러오는 중…</div>'; return; }

  var m = menuOf(VIEW);
  var h;
  if (VIEW === 'home') {
    h = '<div class="ehead"><div class="ph"><h1>혜원이지</h1>'
      + '<span class="sub">HYEWON EASY</span><span class="sp"></span>'
      + fontBtns('home') + '</div></div>' + viewHome();
  } else {
    // 머리는 «제목 + 그 화면의 조작 줄» 이다. 조작 줄(.top2)은 그린 뒤에 옮겨 넣는다.
    h = '<div class="ehead"><div class="ph"><h1>' + esc(m.t) + '</h1>'
      + '<span class="sub">' + esc(m.d) + '</span></div></div>'
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
  // ★ 조작 줄을 머리 안으로 옮긴다 — 스크롤해도 월 단추·글자크기·오늘로가 늘 보인다.
  //   (위젯도 같은 방법을 쓴다. 따로 «두 번째 층» 을 두면 높이를 한 픽셀만 잘못 재도 숨는다)
  var eh = MAIN.querySelector('.ehead');
  var et = MAIN.querySelector('.top2');
  if (eh && et) eh.appendChild(et);

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
