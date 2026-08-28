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
  { v: 'rec', p: 'nav-rec', t: '학생기록', d: '학급 → 학생 → 분류로 쓰고 모아 보기', g: '기록' },
  { v: 'office', p: 'nav-office', t: '교무실', d: '부서별 자료·서식·링크', g: '오늘 볼 것' },
  { v: 'link', p: 'nav-link', t: '바로가기', d: '자주 가는 곳을 담아 두고 한 번에', g: '바로가기' },
  // ★ 진호알리미에서는 이 칸이 «런처보드» 다 — 이름만 갈아 끼운다(menus 에서).
  // ★ 진도표는 혜원이지에만 — 진호알리미에는 수업진도 대시보드가 따로 있다
  { v: 'grid', p: 'nav-comci', t: '진도표', d: '칸을 눌러 그 자리에서 적습니다', g: '기록', hyewon: true }
];
function navImg(m) { return '<img src="assets/' + m.p + '.png" alt="">'; }
/* 이 갈래에서 쓸 수 있는 화면만 — 진도표는 혜원이지 것이다 */
function menus() {
  var list = MENU.filter(function (m) { return !(m.hyewon && HAS_TT); })
    .map(function (m) {
      // 진호알리미의 «바로가기» 는 런처보드다 — 내 앱을 담고 고치는 곳
      if (m.v === 'link' && FLAVOR === 'jinho') {
        return { v: m.v, p: m.p, t: '런처보드', g: m.g,
                 d: '내 GAS 앱을 담고 고치고, 공유를 켜면 혜원이지에도' };
      }
      return m;
    });
  // 대시보드는 늘 맨 앞에 둔다 — 순서를 바꿔도 «집» 은 첫 자리다
  var home = list.filter(function (m) { return m.v === 'home'; });
  var rest = inOrder(list.filter(function (m) { return m.v !== 'home'; }),
    TABORDER, function (m) { return m.v; });
  return home.concat(rest);
}
function menuOf(v) { return MENU.filter(function (m) { return m.v === v; })[0] || MENU[0]; }
function known(v) { return menus().some(function (m) { return m.v === v; }); }

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
    var body;
    if (USGSTYLE === 'ring') {
      body = '<div class="rings">' + ms.map(function (x) {
        var p = pctOf(x.m);
        return '<div class="ring">' + ringSvg(p)
          + '<div class="lb">' + esc(x.lb) + '</div>'
          + '<div class="rs">' + (leftOf(x.m) ? esc(leftOf(x.m)) + ' 남음' : esc(atOf(x.m))) + '</div>'
          + '</div>';
      }).join('') + '</div>';
    } else {
      body = ms.map(function (x) {
        var p = pctOf(x.m);
        return '<div class="sub"><span class="subt">' + esc(x.lb) + '<b>' + p + '%</b></span>'
          + '<span class="subk"><i style="width:' + Math.min(100, p) + '%;background:' + usgFill(p) + '"></i></span>'
          + '<span class="subr">' + (leftOf(x.m) ? esc(leftOf(x.m)) + ' 남음' : esc(atOf(x.m))) + '</span>'
          + '</div>';
      }).join('');
    }
    return '<div class="sut"><div class="sun">' + esc(u.label || k) + '</div>'
      + body + '</div>';
  }).join('');
  // 내 PC — 같은 막대 모양으로
  if (ms.length) {
    h += '<div class="sut"><div class="sun">내 PC</div>'
      + (USGSTYLE === 'ring'
        ? '<div class="rings">' + ms.map(function (x) {
            return '<div class="ring">' + ringSvg(x.pct)
              + '<div class="lb">' + esc(x.lb) + '</div>'
              + '<div class="rs">' + esc(x.sub) + '</div></div>';
          }).join('') + '</div>'
        : ms.map(function (x) {
            return '<div class="sub"><span class="subt">' + esc(x.lb) + '<b>' + x.pct + '%</b></span>'
              + '<span class="subk"><i style="width:' + x.pct + '%;background:' + usgFill(x.pct) + '"></i></span>'
              + '<span class="subr">' + esc(x.sub) + '</span></div>';
          }).join(''))
      + '</div>';
  }
  return h + (keys.length ? '<button class="sulg wide" id="usgGet">⟳ 다시 읽기</button>' : '')
    + '</div>';
}

/* 맨 위 띠 — 업데이트 안내와 «바뀐 내역». 사이드바 위까지 지나간다.
   위젯에서는 머리 안에 들어가지만, 넓은 창은 사이드바가 있어 따로 둔다. */
function drawTop() {
  if (!EBAR) return;
  EBAR.innerHTML = boardBar() + updBar() + notesCard();
  wireBoard(EBAR);   // 전광판 — 넓게 보기는 맨 위 띠에 있다
  var nx = EBAR.querySelector('#notesX');
  if (nx) nx.addEventListener('click', function () {
    NOTES = null; widgetAPI.notesSeen(); render();
  });
}

/* ── 왼쪽 메뉴 ── */
function drawSide() {
  // ★ 이름·아이콘은 갈래대로 (박아 두면 진호알리미가 혜원이지로 보인다)
  // ★ 운영체제 아이콘(icon.png)은 흰 네모가 꽉 차 있다 — 위젯 제목 줄과 같은
  //   투명한 로고를 쓴다
  var h = '<div class="brand"><img src="assets/'
    + (HAS_TT ? 'logo-jinho.png' : 'logo-hyewon.png') + '" alt="">'
    + '<span><b>' + brandHtml() + '</b></span></div>';
  h += sideUsage();
  h += menus().map(function (m, i) {
    return '<button class="nav nav' + NAVSTYLE + (VIEW === m.v ? ' on' : '')
      + '" data-go="' + m.v + '" title="' + esc(m.t)
      + (i < 9 ? ' — 숫자 ' + (i + 1) : '') + '">'
      + (NAVSTYLE === 'text' ? '' : navImg(m))
      + (NAVSTYLE === 'icon' ? '' : esc(m.t)) + '</button>';
  }).join('');
  h += '<div class="navgap"></div>'
    + '<button class="nav nav' + NAVSTYLE + '" id="goWid" title="위젯 보기">'
    + (NAVSTYLE === 'text' ? '' : '<img src="assets/widget.png" alt="">')
    + (NAVSTYLE === 'icon' ? '' : '위젯 보기') + '</button>'
    + '<button class="nav nav' + NAVSTYLE + '" id="goSet" title="설정">'
    + (NAVSTYLE === 'text' ? '' : '<img src="assets/nav-set.png" alt="">')
    + (NAVSTYLE === 'icon' ? '' : '설정') + '</button>'
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

/* ── 대시보드 칸 ──────────────────────────────────────────
   내용이 없으면 그 칸은 아예 안 나온다. 빈 상자는 자리만 먹는다. */
/* ── 대시보드 꾸미기 ──────────────────────────────────────
   ✎ 편집하기를 켜면 ⠿ 로 차례를 바꾸고 ◢ 로 크기를 늘인다.
   ★ 자리는 «차례» 로만 기억한다 — 격자가 알아서 흘려 채운다.
     좌표로 못박으면 창 폭이 바뀔 때마다 어긋난다. */
var dashEdit = false;
var DCOLS = 6;   // 격자 가로 칸 수
var DROWH = 84;  // 격자 한 줄 높이(px) — easy.html 의 grid-auto-rows 와 같아야 한다
var DGAP = 10;   // 칸 사이(px) — 같은 곳의 gap
var DMAXH = 8;   // 세로 최대 칸수. 내 앱은 서른 몇 개라 3칸으로는 모자랐다
/* 칸 크기 — [가로, 세로].
   ★ 안 정한 칸은 내용 양에 맞춰 다르게 준다 — 모두 1칸이면 처음 켤 때
     급식도 내 앱도 한 줄만 보여 «망가진 것» 처럼 보인다. */
var DDEF = { today: [3, 1], lesson: [3, 2], meal: [3, 2], next: [3, 2],
             link: [3, 3], feed: [3, 3] };
function dcSize(k) {
  var m = String(DASHSIZE[k] || '').match(/^(\d+)[,x](\d+)$/);
  if (!m) return (DDEF[k] || [3, 1]).slice();
  return [Math.max(1, Math.min(DCOLS, Number(m[1]))),
          Math.max(1, Math.min(DMAXH, Number(m[2])))];
}
function dcSetSize(k, w, h) {
  DASHSIZE[k] = Math.max(1, Math.min(DCOLS, w)) + ','
    + Math.max(1, Math.min(DMAXH, h));
  widgetAPI.setUi({ dashSize: DASHSIZE });
}
function dcard(title, body, goTo, key) {
  if (!body) return '';
  var s = key ? dcSize(key) : [3, 1];
  var st = ' style="grid-column:span ' + s[0] + ';grid-row:span ' + s[1] + '"';
  return '<div class="dc" data-dck="' + (key || '') + '"' + st + '>'
    + (dashEdit && key ? '<span class="dcgrip" draggable="true">⠿</span>' : '')
    + '<div class="dch">' + esc(title)
    + (dashEdit && key ? '<em class="dcwh">' + s[0] + '×' + s[1] + '</em>' : '')
    + (goTo && !dashEdit ? '<button class="dcgo" data-go="' + goTo + '">더 보기 ›</button>' : '')
    + '</div><div class="dcb">' + body + '</div>'
    + (dashEdit && key ? '<span class="dccor"></span>' : '')
    + '</div>';
}
/* ① 오늘 일정 — 학사일정 + 켜 놓은 학년부 일지 */
function dcToday() {
  if (!AC) { loadAcademic(); return ''; }
  var now = new Date();
  var d = acDayOf(now);
  var gp = gpOf(String(now.getMonth() + 1), now.getDate());
  var ev = (d && d.event) || '';
  if (!ev && !gp.length) return '';
  var h = ev ? '<div class="dbig">' + esc(ev) + '</div>' : '';
  if (gp.length) {
    h += '<div class="dgp">' + gp.map(function (o) {
      return '<div class="dgpr"><i class="gl">' + o.g + '학년</i>'
        + '<b class="gpc h' + gpHue(o.x.cat) + '">' + esc(o.x.cat || '') + '</b>'
        + '<span>' + esc(o.x.title || '') + '</span></div>';
    }).join('') + '</div>';
  }
  return h;
}
/* ② 오늘 급식 — 학사일정 «오늘» 처럼 글자를 키운다 */
function dcMeal() {
  if (!ML) { loadMeals(); return ''; }
  var list = mealToday();
  if (!list.length) return '';
  return list.map(function (s) {
    return '<div class="dmr"><div class="dmn">' + esc(s.name)
      + (s.kcal ? '<em>' + esc(s.kcal) + '</em>' : '') + '</div>'
      + '<div class="dmd">' + s.dishes.map(function (t) {
          return '<span>' + esc(t) + '</span>';
        }).join('') + '</div></div>';
  }).join('');
}
/* ③ 오늘 수업 — 시간표가 있는 갈래(진호알리미)에서만 */
function dcLesson() {
  if (!HAS_TT || !STATE) return '';
  var ls = STATE.lessons || [];
  if (!ls.length) return '';
  return '<div class="dls">' + ls.map(function (l) {
    return '<div class="dlr"><i>' + esc(String(l.period)) + '교시</i>'
      + '<b>' + esc(l.cls || '') + '</b>'
      + '<span>' + esc(l.unit || '') + (l.n ? ' · ' + l.n + '차시' : '') + '</span></div>';
  }).join('') + '</div>';
}
/* ④ 앞으로 7일 */
function dcNext() {
  if (!AC) return '';
  var list = acNext(7);
  if (!list.length) return '';
  var DOW = ['일', '월', '화', '수', '목', '금', '토'];
  return '<div class="dnx">' + list.map(function (o) {
    var extra = o.gp.map(function (g) { return g.x.title || ''; })
      .filter(Boolean).join(' · ');
    return '<div class="dnr"><i>' + (o.dt.getMonth() + 1) + '/' + o.dt.getDate()
      + '<small>' + DOW[o.dt.getDay()] + '</small></i>'
      + '<span>' + esc(o.event || extra) + '</span></div>';
  }).join('') + '</div>';
}


/* ── 꾸미기 — 끌어 옮기고 늘이기 ──────────────────────────
   ★ 차례만 기억한다. 격자는 알아서 흘려 채운다.
   ★ 크기는 «칸 단위» 로 딱딱 붙는다 — 픽셀로 두면 창 폭이 바뀔 때 어긋난다. */
function dashKeys() {
  var el = document.getElementById('main');
  if (!el) return [];
  return [].map.call(el.querySelectorAll('.dc[data-dck]'), function (d) {
    return d.dataset.dck;
  }).filter(Boolean);
}
/* 지금 보이는 차례를 그대로 담는다. 안 보이는(접은) 것은 뒤에 붙여 안 잃는다. */
function dashSaveOrder(keys) {
  var tail = (DASHORDER || []).filter(function (k) { return keys.indexOf(k) < 0; });
  DASHORDER = keys.concat(tail);
  widgetAPI.setUi({ dashOrder: DASHORDER });
}
/* 격자 한 칸의 폭 — 창 크기에 따라 달라지므로 그때그때 잰다 */
function dashCellW(grid) {
  var cs = getComputedStyle(grid);
  var cols = cs.gridTemplateColumns.split(' ').filter(Boolean);
  var gap = parseFloat(cs.columnGap) || 0;
  if (!cols.length) return { w: 200, gap: gap, n: DCOLS };
  return { w: parseFloat(cols[0]) || 200, gap: gap, n: cols.length };
}

function wireDashEdit() {
  var grid = document.querySelector('#main .dcs');
  if (!grid) return;

  /* ① ⠿ 를 끌어 차례 바꾸기 */
  var dragKey = null;
  grid.querySelectorAll('.dcgrip').forEach(function (g) {
    var card = g.closest('.dc');
    g.addEventListener('dragstart', function (e) {
      dragKey = card.dataset.dck;
      card.classList.add('dragging');
      try { e.dataTransfer.setData('text/plain', dragKey); } catch (err) { /* 무시 */ }
      e.dataTransfer.effectAllowed = 'move';
    });
    g.addEventListener('dragend', function () {
      card.classList.remove('dragging');
      grid.querySelectorAll('.dc').forEach(function (d) { d.classList.remove('over'); });
      if (dragKey) { dashSaveOrder(dashKeys()); dragKey = null; render(); }
    });
  });
  grid.querySelectorAll('.dc[data-dck]').forEach(function (card) {
    card.addEventListener('dragover', function (e) {
      if (!dragKey || card.dataset.dck === dragKey) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      var from = grid.querySelector('.dc.dragging');
      if (!from || from === card) return;
      // 마우스가 카드의 앞쪽이면 앞에, 뒤쪽이면 뒤에 끼운다
      var r = card.getBoundingClientRect();
      var before = (e.clientX - r.left) < r.width / 2;
      grid.insertBefore(from, before ? card : card.nextSibling);
      card.classList.add('over');
    });
    card.addEventListener('dragleave', function () { card.classList.remove('over'); });
    card.addEventListener('drop', function (e) { e.preventDefault(); });
  });

  /* ② ◢ 를 끌어 크기 늘이기 — 칸 단위로 딱딱 붙는다 */
  grid.querySelectorAll('.dccor').forEach(function (cor) {
    var card = cor.closest('.dc');
    cor.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var key = card.dataset.dck;
      if (!key) return;
      var cell = dashCellW(grid);
      /* ★ 여기가 세로가 아예 안 먹던 자리다.
         gridAutoRows 가 «minmax(84px, auto)» 라 parseFloat 이 NaN 을 냈고,
         바로 아래 «rowH ? … : s0[1]» 에서 늘 처음 값으로 빠져나갔다.
         이제 줄 높이가 한 값으로 못박혀 있으니 그대로 읽되,
         혹시 못 읽으면 아는 값(DROWH)으로 받친다. */
      var rowH = parseFloat(getComputedStyle(grid).gridAutoRows) || DROWH;
      var gapY = parseFloat(getComputedStyle(grid).rowGap);
      if (!(gapY >= 0)) gapY = DGAP;
      var r0 = card.getBoundingClientRect();
      var s0 = dcSize(key);
      var lab = card.querySelector('.dcwh');
      cor.setPointerCapture(e.pointerId);
      card.classList.add('sizing');

      var last = s0.slice();
      function move(ev) {
        var dx = ev.clientX - e.clientX, dy = ev.clientY - e.clientY;
        var w = Math.round((r0.width + dx + cell.gap) / (cell.w + cell.gap));
        var h = Math.round((r0.height + dy + gapY) / (rowH + gapY));
        w = Math.max(1, Math.min(cell.n, w));
        h = Math.max(1, Math.min(DMAXH, h));
        if (w === last[0] && h === last[1]) return;
        last = [w, h];
        card.style.gridColumn = 'span ' + w;
        card.style.gridRow = 'span ' + h;
        if (lab) lab.textContent = w + '×' + h;
      }
      function up() {
        card.classList.remove('sizing');
        cor.removeEventListener('pointermove', move);
        cor.removeEventListener('pointerup', up);
        cor.removeEventListener('pointercancel', up);
        dcSetSize(key, last[0], last[1]);
        /* ★ 잡아 늘이는 동안 붙여 둔 인라인 자리를 걷어내고 다시 그린다 —
           안 그러면 저장한 값과 화면이 어긋난 채로 남는다. */
        card.style.gridColumn = ''; card.style.gridRow = '';
        render();
      }
      cor.addEventListener('pointermove', move);
      cor.addEventListener('pointerup', up);
      cor.addEventListener('pointercancel', up);
    });
  });
}

function viewHome() {
  var h = todayLine();
  h += wxCard();   // 사용량은 사이드바에 있다

  // ★ 여기가 «대시보드다운» 부분 — 사이드바에 없는 것들이다.
  var CARDS = [
    { k: 'today', t: '오늘 일정', go: 'cal', body: dcToday },
    { k: 'lesson', t: '오늘 수업', go: '', body: dcLesson },
    { k: 'meal', t: '오늘 급식', go: 'meal', body: dcMeal },
    { k: 'next', t: '앞으로 7일', go: 'cal', body: dcNext },
    { k: 'link', t: '바로가기', go: 'link', body: linkTiles },
    { k: 'feed', t: feedName(), go: 'link', body: feedTiles }
  ];
  var ordered = inOrder(CARDS, DASHORDER, function (c) { return c.k; });
  h += '<div class="dcbar">'
    + '<button class="dced' + (dashEdit ? ' on' : '') + '" id="dcEdit">'
    + (dashEdit ? '✓ 다 됐어요' : '✎ 편집하기') + '</button>';
  if (dashEdit) {
    h += '<span class="dcsw">' + ordered.map(function (c) {
      var on = DASHOFF.indexOf(c.k) < 0;
      return '<button class="sw' + (on ? ' on' : '') + '" data-dcoff="' + c.k + '">'
        + '<span class="track"><span class="knob"></span></span>' + esc(c.t) + '</button>';
    }).join('') + '</span>';
  }
  h += '</div>';
  if (dashEdit) {
    h += '<div class="dchint">⠿ 를 끌어 차례를 바꾸고, 오른쪽 아래 모서리를 끌어 크기를 정합니다.</div>';
  }
  var cards = ordered
    .filter(function (c) { return DASHOFF.indexOf(c.k) < 0; })
    .map(function (c) { return dcard(c.t, c.body(), c.go, c.k); })
    .join('');
  if (cards) h += '<div class="dcs' + (dashEdit ? ' editing' : '') + '">' + cards + '</div>';

  var favs = EASYFAV.filter(known).map(menuOf).filter(function (m) { return m.v !== 'home'; });
  if (favs.length) {
    h += '<div class="grp">즐겨찾기</div><div class="tiles">' + favs.map(tile).join('') + '</div>';
  }
  var groups = [];
  menus().forEach(function (m) { if (m.g && groups.indexOf(m.g) < 0) groups.push(m.g); });
  groups.forEach(function (g) {
    h += '<div class="grp">' + esc(g) + '</div><div class="tiles">'
      + menus().filter(function (m) { return m.g === g; }).map(tile).join('') + '</div>';
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
    h = '<div class="ehead"><div class="ph"><h1>' + brandHtml() + '</h1>'
      + '<span class="sp"></span>'
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
              : VIEW === 'rec' ? viewRec()
              : VIEW === 'link' ? viewLinks()
                : VIEW === 'note' ? viewNote()
                  : VIEW === 'grid' ? viewGrid()
                    : VIEW === 'office' ? viewOffice() : '')
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

  // 대시보드 꾸미기
  var de = MAIN.querySelector('#dcEdit');
  if (de) de.addEventListener('click', function () { dashEdit = !dashEdit; render(); });
  MAIN.querySelectorAll('[data-dcoff]').forEach(function (b) {
    b.addEventListener('click', function () {
      var k = b.dataset.dcoff, i = DASHOFF.indexOf(k);
      if (i >= 0) DASHOFF.splice(i, 1); else DASHOFF.push(k);
      widgetAPI.setUi({ dashOff: DASHOFF });
      render();
    });
  });
  if (dashEdit) wireDashEdit();
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
