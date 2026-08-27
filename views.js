/* 파일명: views.js | @version 1.0.0
   위젯(진호알리미·혜원 데스크)과 혜원이지가 «함께 쓰는» 화면 코드.
   자료를 읽어 오고(loadWork·loadAcademic…) 화면 조각을 만드는(viewWork·viewAcademic…) 일을 한다.
   ★ 창의 뼈대는 각자 다르다 — 혜원이지는 easy.js 에서 render() 를 자기 것으로 바꿔 쓴다. */

var STATE = null, VIEW = 'today', SCALE = 1, VER = '', UPD = null, LASTTT = 'today', THEME = '';
var FONT = 'pretendard';
/* 오늘 일정 — 수업진도 앱이 주는 note 가 없을 때 학사일정에서 뽑아 온 것.
   혜원 데스크에는 수업진도 자료가 아예 없으므로 이것이 유일한 길이다. */
var TODAYEV = '';
/* 업데이트 내역 — 새 버전으로 켜졌을 때 한 번 보여주고, 닫으면 다시 안 뜬다 */
var NOTES = null;
/* 탭마다 글자 크기 배율을 따로 둔다. 메인이 저장해 두므로 껐다 켜도 그대로다. */
var FS = { work: 1, comci: 1, cal: 1, meal: 1, rec: 1, home: 1 };
function fsKey() {
  return ({ work: 'work', comci: 'comci', cal: 'cal', meal: 'meal', rec: 'rec',
    home: 'home', note: 'note', link: 'link', grid: 'grid', tool: 'tool' })[VIEW] || '';
}
function fontBtns(key) {
  return '<span class="wfs">'
    + '<button class="wkb" data-fs="' + key + ',-1" title="글자 작게">A−</button>'
    + '<button class="wkb" data-fs="' + key + ',1" title="글자 크게">A+</button></span>';
}
function bumpFont(key, dir) {
  var v = Math.round((Math.min(1.8, Math.max(0.8, (FS[key] || 1) + dir * 0.1))) * 100) / 100;
  FS[key] = v;
  var patch = {}; patch[key] = v;
  widgetAPI.setUi({ fontScale: patch });
  render();
}
/* 갈래 — jinho(진호알리미, 시간표 있음) / hyewon(혜원 데스크, 시간표 없음).
   메인이 그릴 때마다 알려 준다. 시간표에 딸린 것만 가리고 나머지는 둘 다 같다. */
var FLAVOR = 'jinho', HAS_TT = true, APPNAME = '진호알리미';
// 지금 그리고 있는 창이 «넓은 창»(easy.html)인가. 왼쪽 메뉴가 있으면 넓은 창이다.
// ★ 갈래로 가르지 않는다 — 한 프로그램이 위젯 창과 넓은 창을 함께 띄우기 때문이다.
var IS_EASY = !!document.getElementById('side');
var EASYFAV = [];         // 혜원이지 대시보드 즐겨찾기

/* 화면이 담기는 통. 위젯은 #app, 혜원이지는 #main 이다.
   스크롤·자리 재기를 하는 곳이 서로 다르므로 여기서 한 번에 가른다. */
function appEl() {
  return document.getElementById('app') || document.getElementById('main');
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function pad(n) { return String(n).padStart(2, '0'); }
function nowMin() { var d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
/* "11:00~11:45" 또는 "11:00" 을 분 단위로 */
function parseTime(t) {
  if (!t) return null;
  var m = String(t).match(/^(\d{1,2}):(\d{2})(?:~(\d{1,2}):(\d{2}))?/);
  if (!m) return null;
  var s = Number(m[1]) * 60 + Number(m[2]);
  var e = m[3] ? Number(m[3]) * 60 + Number(m[4]) : s + 45;
  return { s: s, e: e };
}
function human(min) {
  if (min >= 60) return Math.floor(min / 60) + '시간 ' + (min % 60) + '분';
  return min + '분';
}

/* ── 오늘 ── */
function viewToday(d) {
  var ls = d.lessons || [];
  if (d.holiday) return '<div class="empty">휴업일이라 수업이 없습니다.</div>';
  if (!d.weekday) return '<div class="empty">주말입니다. 푹 쉬세요.</div>';
  if (!ls.length) return '<div class="empty">오늘은 배정된 수업이 없습니다.</div>';

  var n = nowMin(), html = '';
  // 지금 진행 중인 수업 / 아직 안 한 첫 수업 찾기
  var curIdx = -1, nextIdx = -1;
  ls.forEach(function (l, i) {
    var t = parseTime(l.time);
    if (!t) return;
    if (n >= t.s && n < t.e) curIdx = i;
    else if (n < t.s && nextIdx < 0) nextIdx = i;
  });

  ls.forEach(function (l, i) {
    var t = parseTime(l.time);
    var past = t && n >= t.e;
    var cls = 'lesson' + (i === curIdx ? ' now' : past ? ' past' : '');
    var badges = '';
    if (l.type && l.type !== '수업') badges += '<span class="badge b-' + esc(l.type) + '">' + esc(l.type) + '</span>';
    if (l.shifted) badges += '<span class="badge b-순연">↷순연</span>';
    if (l.movedIn) badges += '<span class="badge b-이동">이동</span>';

    var what = l.n
      ? '<b>' + esc(l.unit) + ' ' + l.n + '차시</b>' + (l.topic ? ' · ' + esc(l.topic) : '')
      : '차시 미지정';

    var when = '';
    if (i === curIdx && t) when = '<div class="when">지금 수업 중 · ' + human(t.e - n) + ' 남음</div>';
    else if (i === nextIdx && t) when = '<div class="when soon">' + human(t.s - n) + ' 뒤 시작</div>';

    html += '<div class="' + cls + '">'
      + '<div class="per">' + l.period + '<small>' + esc((l.time || '').split('~')[0]) + '</small></div>'
      + '<div class="body"><div class="who">' + esc(l.grade) + ' ' + esc(l.cls) + badges + '</div>'
      + '<div class="what">' + what + '</div>' + when + '</div></div>';
  });
  return html;
}

/* ── 이번 주 : 압축 격자 (교시 × 요일) ──
   앱의 표를 좁은 카드에 맞게 줄인 것. 자세히 볼 때는 ⤢ 로 큰 창을 연다.
   ◀ ▶ 로 다른 주도 볼 수 있다 (그 주 자료는 앱에게 그때 물어본다). */
var WEEKOFF = 0, WK = null, wkBusy = false;

function loadWeek(off) {
  if (wkBusy) return;
  wkBusy = true;
  WEEKOFF = off;
  widgetAPI.getWeek(off).then(function (d) {
    wkBusy = false;
    WK = d || null;
    render();
  }).catch(function () { wkBusy = false; WK = null; render(); });
}
function whenTxt(date, period) {
  var p = String(date || '').split('-');
  var md = p.length === 3 ? Number(p[1]) + '/' + Number(p[2]) : '';
  return md + (period ? ' ' + period + '교시' : '');
}
function cellTip(c, l) {
  if (l.blocked) {
    return l.cls + ' · ' + ((c.cellCal && c.cellCal.lbl) || '수업 없음')
      + ((c.cellCal && c.cellCal.note) ? ' · ' + c.cellCal.note : '')
      + (c.pushedTo ? '\n→ ' + whenTxt(c.pushedTo.date, c.pushedTo.period) + '로 밀림' : '')
      + (l.orig ? '\n원래 ' + l.orig + '교시' : '')
      + (c.time ? '\n' + c.time : '');
  }
  return l.cls + ' · ' + (l.unit || '') + (l.n ? ' ' + l.n + '차시' : ' 차시미정')
    + (l.topic ? ' · ' + l.topic : '') + (l.detail ? '\n' + l.detail : '')
    + (l.orig ? '\n원래 ' + l.orig + '교시' : '')
    + (l.movedIn ? '\n(수업이동)' : '') + (l.assigned ? '\n(직접 배정)' : '')
    + (l.shifted ? '\n(순연)' : '') + (c.time ? '\n' + c.time : '');
}

/* 학사일정 메모는 콤마로 나뉜 여러 건이다 — 한 줄에 하나씩 보여준다 */
function noteLines(note) {
  if (!note) return '';
  var parts = String(note).split(',').map(function (t) { return t.trim(); })
    .filter(function (t) { return t; });
  if (!parts.length) return '';
  return '<i title="' + esc(parts.join(' / ')) + '">'
    + parts.map(function (t) { return '<em>' + esc(t) + '</em>'; }).join('') + '</i>';
}

function viewWeek(d) {
  if (!WK) {
    if (!wkBusy) loadWeek(WEEKOFF);
    return '<div class="empty">시간표를 불러오는 중…</div>';
  }
  var days = WK.days || [];
  if (!days.length) return '<div class="empty">시간표가 없습니다.</div>';

  // 주 이동 줄
  var nav = '<div class="wknav">'
    + '<button class="wkb" data-off="' + (WEEKOFF - 1) + '" title="이전 주">◀</button>'
    + '<span class="wklab">' + esc(WK.label || '') + '<small>' + esc(WK.range || '') + '</small></span>'
    + '<button class="wkb" data-off="' + (WEEKOFF + 1) + '" title="다음 주">▶</button>'
    + (WEEKOFF !== 0 ? '<button class="wkb now" data-off="0">이번주</button>' : '')
    + '</div>';

  // ★ 자정을 넘겨 켜 두면 서버가 붙여 준 today 표시가 «어제»에 머문다 — 지금 날짜로 다시 본다
  var nowD = new Date(), tMD = (nowD.getMonth() + 1) + '/' + nowD.getDate();
  var isTdy = function (x) { return String(x.md || '') === tMD; };
  var h = nav + '<table class="gr"><thead><tr><th class="pc"></th>';
  days.forEach(function (w) {
    h += '<th class="' + (isTdy(w) ? 'tdy' : '') + '">' + esc(w.dow)
      + '<small>' + esc(w.md) + '</small>'
      + noteLines(w.note)
      + '</th>';
  });
  h += '</tr></thead><tbody>';

  for (var p = 1; p <= 7; p++) {
    h += '<tr><td class="pc">' + p + '</td>';
    days.forEach(function (w) {
      var c = (w.cells || [])[p - 1] || {};
      var klass = isTdy(w) ? ' tdy' : '';
      if (w.holiday) { h += '<td class="hol' + klass + '"></td>'; return; }
      if (c.lesson) {
        var l = c.lesson;
        // 학사일정(동아리 등)으로 수업이 없어진 칸 — 수업처럼 그리면 안 된다
        if (l.blocked) {
          h += '<td class="c blk' + klass + '" title="' + esc(cellTip(c, l)) + '">'
            + '<b>' + esc(l.cls) + '</b><u>'
            + esc((c.cellCal && c.cellCal.lbl) || '수업 없음') + '</u></td>';
          return;
        }
        // 차시 번호 뒤에 주제(또는 상세)를 함께 — "1 개학 후 측정" 처럼
        var what = l.n ? String(l.n) : '';
        var extra = l.topic || l.detail || '';
        if (extra) what += (what ? ' ' : '') + extra;
        if (!what) what = '차시미정';
        h += '<td class="c u' + (l.u % 6) + klass + '" title="' + esc(cellTip(c, l)) + '">'
          + '<b>' + esc(l.cls) + '</b><u>' + esc(what) + '</u>'
          + (l.movedIn || l.assigned || l.shifted ? '<s></s>' : '') + '</td>';
        return;
      }
      if (c.movedOut) {
        h += '<td class="c out' + klass + '" title="' + esc(c.movedOut.cls + ' → 다른 날로 옮김') + '">'
          + '<b>' + esc(c.movedOut.cls) + '</b></td>';
        return;
      }
      if (c.cal) {
        h += '<td class="c cal' + klass + '" title="' + esc(c.cal.lbl + (c.cal.note ? ' · ' + c.cal.note : '')) + '">'
          + esc(c.cal.lbl) + (c.cal.note ? '<u>' + esc(c.cal.note) + '</u>' : '') + '</td>';
        return;
      }
      h += '<td class="' + (klass || '') + '"></td>';
    });
    h += '</tr>';
  }
  h += '</tbody></table>';
  return h;
}

/* ── 주간업무 ──
   구글 문서를 «원문 모양 그대로» 그린다 — 표는 표로, 들여쓰기·띄어쓰기는 그대로.
   검색은 목록을 따로 보여주지 않고 그 자리로 데려간다. 여럿이면 ▲▼ 로 옮겨 다닌다.
   합본은 주차 단추를 늘어놓고, 누르면 그 주로 간다. */
var WORK = null, workBusy = false, workDoc = 'input', workOff = 0, workQ = '';
var workHits = 0, workHitIdx = 0, wantScrollHit = false;   // 글자 크기는 FS 로 옮겼다
var composing = false, renderTimer = null;
var HITN = 0;          // 그리는 동안 찾은 자리에 번호를 매긴다
var followHit = true;  // 찾은 자리를 따라갈 것인가 (주차 단추를 누르면 잠시 꺼진다)
var HITBASE = 0;       // 지금 보고 있는 주차 «앞»에 있는 찾은 자리 개수

function laterRender() {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(function () { if (!composing) render(); }, 250);
}
function loadWork() {
  if (workBusy) return;
  workBusy = true;
  widgetAPI.getWork().then(function (d) {
    workBusy = false; WORK = d || { empty: true }; render();
  }).catch(function () { workBusy = false; WORK = { empty: true }; render(); });
}

/* 찾은 글자에 표시를 하면서 번호를 매긴다.
   번호가 지금 고른 것과 같으면 «여기»라고 테두리를 두른다. */
function mk(t) {
  var s = esc(t);
  if (!workQ) return s;
  var q = esc(workQ).toLowerCase();
  if (!q) return s;
  var low = s.toLowerCase(), out = '', i = 0;
  for (;;) {
    var j = low.indexOf(q, i);
    if (j < 0) { out += s.slice(i); break; }
    var no = HITBASE + HITN;
    out += s.slice(i, j)
      + '<mark id="hit-' + no + '"' + (no === workHitIdx ? ' class="cur"' : '') + '>'
      + s.slice(j, j + q.length) + '</mark>';
    HITN++;
    i = j + q.length;
  }
  return out;
}
/* 그리지 않고 개수만 센다 — 어느 주차에 몇 개가 있는지 알아야 ▲▼ 가 주를 넘나든다.
   반드시 그리는 차례와 «같은 차례»로 세야 번호가 어긋나지 않는다. */
function countQ(t, q) {
  var s = esc(t).toLowerCase();
  if (!q) return 0;
  var n = 0, i = 0;
  for (;;) { var j = s.indexOf(q, i); if (j < 0) break; n++; i = j + q.length; }
  return n;
}
function countBlocks(bs, q) {
  return (bs || []).reduce(function (n, b) {
    if (b.k === 'p') return n + countQ(b.t, q);
    return n + (b.rows || []).reduce(function (m, r) {
      return m + r.reduce(function (k, c) { return k + countBlocks(c.blocks, q); }, 0);
    }, 0);
  }, 0);
}
function countWeek(w, q) {
  var n = w.cal ? countBlocks([w.cal], q) : 0;
  w.depts.forEach(function (p) {
    n += countQ(p.name, q);
    n += p.blocks ? countBlocks(p.blocks, q)
      : (p.lines || []).reduce(function (a, l) {
          return a + countQ(l && l.t !== undefined ? l.t : l, q);
        }, 0);
  });
  return n;
}

/* 덩어리 그리기 — 글은 원문 공백 그대로, 표는 표 그대로 */
/* 원문에 걸려 있던 링크를 눌리는 글자로 바꾼다.
   찾기 표시(<mark>)가 이미 들어간 뒤라, 태그 밖의 글자에서만 자리를 찾는다. */
function withLinks(html, links) {
  if (!links || !links.length) return html;
  var out = html;
  links.forEach(function (lk) {
    var t = esc(lk.t);
    var i = out.indexOf(t);
    if (i < 0) return;
    out = out.slice(0, i)
      + '<a class="wlink" data-url="' + esc(lk.url) + '" title="' + esc(lk.url) + '">' + t + '</a>'
      + out.slice(i + t.length);
  });
  return out;
}
function wblocks(bs) { return (bs || []).map(wblock).join(''); }

/* 글머리 단계를 앞머리표로 알아본다.
   학교 문서는 «1. → 가. → 1) → 가)» 네 단계를 쓴다. 단계마다 위 여백을 달리 주면
   덩어리가 눈에 갈려서 훨씬 읽기 좋다. ★글자는 원문 그대로 두고 «간격만» 손댄다. */
function wlevel(t) {
  var x = String(t || '').replace(/^[\s\u00a0]+/, '');
  if (!x) return 0;
  if (/^\d{1,2}\s*[.．]/.test(x)) return 1;          // 1.  2.  3.
  if (/^[가-힣]\s*[.．]/.test(x)) return 2;     // 가.  나.
  if (/^\d{1,2}\s*[)）]/.test(x)) return 3;          // 1)  2)
  if (/^[가-힣]\s*[)）]/.test(x)) return 4;     // 가)  나)
  return 0;
}
function wblock(b) {
  // 원문이 가운데(또는 오른쪽) 정렬이면 그대로 따라간다 — 급식지도 안내표의 이름 등
  if (b.k === 'p') {
    var lv = wlevel(b.t);
    return '<div class="wkp' + (b.al ? ' a-' + b.al : '') + (lv ? ' lv' + lv : '')
      + '">' + withLinks(mk(b.t), b.links) + '</div>';
  }
  return '<div class="wtbw"><table class="wtb">'
    + (b.rows || []).map(function (r) {
        return '<tr>' + r.map(function (c) {
          return '<td' + (c.cs > 1 ? ' colspan="' + c.cs + '"' : '')
            + (c.rs > 1 ? ' rowspan="' + c.rs + '"' : '') + '>'
            + wblocks(c.blocks) + '</td>';
        }).join('') + '</tr>';
      }).join('')
    + '</table></div>';
}

function viewWork() {
  if (!WORK) { loadWork(); return '<div class="empty">주간업무를 불러오는 중…</div>'; }
  var weeks = (workDoc === 'input' ? WORK.input : WORK.merged) || [];
  var q = esc(workQ).toLowerCase();

  // 주차별로 찾은 개수를 세어 두면, 어느 주차의 몇 번째인지 바로 알 수 있다
  var per = weeks.map(function (w) { return countWeek(w, q); });
  workHits = per.reduce(function (a, b) { return a + b; }, 0);
  if (workHitIdx >= workHits) workHitIdx = 0;

  // 지금 고른 찾은 자리가 들어 있는 주차로 저절로 옮겨 간다
  var i = Math.min(Math.max(workOff, 0), Math.max(0, weeks.length - 1));
  if (workQ && workHits && followHit) {
    var acc = 0;
    for (var k = 0; k < per.length; k++) {
      if (workHitIdx < acc + per[k]) { i = k; break; }
      acc += per[k];
    }
    HITBASE = acc;
  } else {
    // 주차 단추로 직접 옮겨 온 경우 — 그 주차 앞까지의 개수를 세어 번호를 이어 준다
    HITBASE = per.slice(0, i).reduce(function (a, b) { return a + b; }, 0);
  }
  HITN = 0;

  var w = weeks[i];

  /* ── 고정되는 머리: 문서 고르기 · 검색 · 글자 크기 · 주차 단추 · 날짜 ── */
  var h = '<div class="top2">';
  h += '<div class="wknav">'
    + '<button class="wkb' + (workDoc === 'input' ? ' now' : '') + '" data-doc="input">입력본</button>'
    + '<button class="wkb' + (workDoc === 'merged' ? ' now' : '') + '" data-doc="merged">합본</button>'
    + '<input class="wq" type="text" placeholder="검색" value="' + esc(workQ) + '">';
  if (workQ) {
    h += '<span class="wkfind">'
      + (workHits ? '<em>' + (workHitIdx + 1) + '</em>/' + workHits : '0') + '</span>'
      + '<button class="wkb" id="wkPrev" title="이전 (Shift+Enter)">▲</button>'
      + '<button class="wkb" id="wkNext" title="다음 (Enter)">▼</button>';
  }
  h += fontBtns('work')
    + '<button class="wkb prt" id="workPrint" title="이 주간업무를 인쇄합니다">'
    + '<img src="assets/print.png" alt="">출력</button>'
    + '<button class="wkb" id="workGet" title="다시 가져오기">⟳</button></div>';

  if (!weeks.length && WORK.refreshing) {
    return h + '</div><div class="empty">주간업무를 새 모양(표·들여쓰기까지)으로 다시 받는 중…'
      + '<div style="margin-top:8px;font-size:10.5px;opacity:.8">'
      + '십몇 초쯤 걸립니다. 다 받으면 저절로 나타납니다.</div></div>';
  }
  if (!weeks.length) {
    return h + '</div><div class="empty">아직 가져온 주간업무가 없습니다.<br>'
      + '<button class="btn" id="workGetBig">지금 가져오기</button>'
      + '<div style="margin-top:8px;font-size:10.5px;opacity:.8">'
      + '구글 문서에서 바로 받아옵니다. 로그인은 필요 없습니다.'
      + (WORK.error ? '<br>' + esc(WORK.error) : '') + '</div></div>';
  }

  // 합본은 주차를 단추로 늘어놓는다 — 누르면 그 주로 간다
  if (weeks.length > 1) {
    h += '<div class="wkwk">' + weeks.map(function (x, n) {
      return '<button class="wkb' + (n === i ? ' now' : '') + '" data-woff="' + n + '">'
        + esc(shortRange(x.range)) + (per[n] ? '<small>' + per[n] + '</small>' : '') + '</button>';
    }).join('') + '</div>';
  }
  h += '<div class="wkhead">' + esc(w.range) + '</div>';
  h += '</div>';   // 고정 머리 끝

  if (w.cal) h += wblock(w.cal);
  h += w.depts.map(function (p) {
    // 예전에 받아 둔 자료는 blocks 대신 lines(글줄만)를 들고 있다 — 그것도 그려는 준다
    var inner = p.blocks ? wblocks(p.blocks)
      : (p.lines || []).map(function (l) {
          return '<div class="wkp">' + mk(l && l.t !== undefined ? l.t : l) + '</div>';
        }).join('');
    return '<div class="wkdt"><b>' + mk(p.name) + '</b>' + inner + '</div>';
  }).join('') || '<div class="empty">이 주차에는 등록된 업무가 없습니다.</div>';
  return h;
}
/* ── 인쇄용 종이 ──────────────────────────────────────────────
   화면을 그대로 인쇄하면 탭·검색줄·어두운 바탕까지 따라 나온다.
   여기서는 «흰 종이에 검은 글씨» 로 내용만 다시 짠다.
   찾은 자리 표시(mark)와 단추는 빼고, 표·들여쓰기·글머리 단계는 그대로 살린다. */
function workPrintHtml() {
  if (!WORK) return null;
  var weeks = (workDoc === 'input' ? WORK.input : WORK.merged) || [];
  if (!weeks.length) return null;
  var i = Math.min(Math.max(workOff, 0), weeks.length - 1);
  var w = weeks[i];

  // 찾기 표시가 섞이지 않게 잠시 꺼 두고 그린다
  var keepQ = workQ, keepN = HITN;
  workQ = ''; HITN = 0;
  var body = '';
  try {
    if (w.cal) body += wblock(w.cal);
    body += (w.depts || []).map(function (p) {
      var inner = p.blocks ? wblocks(p.blocks)
        : (p.lines || []).map(function (l) {
            return '<div class="wkp">' + mk(l && l.t !== undefined ? l.t : l) + '</div>';
          }).join('');
      return '<section class="dept"><h2>' + mk(p.name) + '</h2>' + inner + '</section>';
    }).join('');
  } finally {
    workQ = keepQ; HITN = keepN;
  }
  // 링크는 인쇄물에서 누를 수 없으니 밑줄만 남기고 글씨로 둔다
  body = body.replace(/<a class="wlink"[^>]*>/g, '<u>').replace(/<\/a>/g, '</u>');
  return {
    title: (workDoc === 'input' ? '주간업무' : '주간업무(합본)') + ' ' + (w.range || ''),
    range: w.range || '',
    doc: workDoc === 'input' ? '입력본' : '합본',
    body: body
  };
}

function shortRange(r) {
  var m = String(r || '').match(/(\d{1,2})\s*\.\s*(\d{1,2})\s*\.?\s*\([월화수목금토일]\)\s*[~〜～]\s*20\d\d\s*\.\s*(\d{1,2})\s*\.\s*(\d{1,2})/);
  if (!m) return String(r || '').slice(0, 22);
  return m[1] + '/' + m[2] + '~' + m[3] + '/' + m[4];
}
function moveHit(step) {
  if (!workHits) return;
  followHit = true;
  workHitIdx = (workHitIdx + step + workHits) % workHits;
  wantScrollHit = true;
  render();
}

/* ── 컴시간 ──
   설정 창에서 한 번 불러온 학교 시간표를 보여준다. 교사·학급 중 불러온 것만 나온다. */
var CM = null, cmBusy = false, cmMode = '', cmGrade = 1, cmCls = 1, cmPicked = false;
// 교사표와 학급표를 나란히 볼 것인가(가로) 위아래로 볼 것인가(세로)
var cmSide = 'col';   // col = 세로(교사표 밑에 학급표) · row = 가로(나란히)

function loadComci() {
  if (cmBusy) return;
  cmBusy = true;
  widgetAPI.comciGet().then(function (r) {
    cmBusy = false; CM = r || { empty: true }; render();
  }).catch(function () { cmBusy = false; CM = { empty: true }; render(); });
}

function cmTable(days, cell) {
  var maxP = 1;
  days.forEach(function (d) { maxP = Math.max(maxP, (d.periods || []).length); });
  var h = '<table class="gr"><thead><tr><th class="pc"></th>'
    + days.map(function (d) { return '<th>' + esc(d.dow) + '</th>'; }).join('') + '</tr></thead><tbody>';
  for (var p = 0; p < maxP; p++) {
    h += '<tr><td class="pc">' + (p + 1) + '</td>';
    days.forEach(function (d) {
      var x = (d.periods || [])[p];
      h += x ? cell(x) : '<td></td>';
    });
    h += '</tr>';
  }
  return h + '</tbody></table>';
}

function viewComci() {
  if (!CM) { loadComci(); return '<div class="empty">컴시간 자료를 불러오는 중…</div>'; }
  var cfg = CM.config || {}, d = CM.data;
  if (!d) {
    return '<div class="empty">아직 불러온 컴시간 시간표가 없습니다.<br>'
      + '<button class="btn" onclick="widgetAPI.openSettings()">설정에서 불러오기</button>'
      + '<div style="margin-top:8px;font-size:10.5px;color:#6f7885">'
      + '학교를 고르고 «지금 불러오기» 를 누르면 됩니다.</div></div>';
  }
  // 자료는 둘 다 받아 두고, 설정의 «볼 것» 으로 무엇을 보여줄지 고른다
  var hasT = !!(d.byTeacher && d.byTeacher.length) && cfg.wantTeacher !== false;
  var hasC = !!(d.classes && d.classes.length) && cfg.wantClasses !== false;
  if (!hasT && !hasC) {
    hasT = !!(d.byTeacher && d.byTeacher.length);
    hasC = !!(d.classes && d.classes.length);
  }
  if (!hasT && !hasC) {
    return '<div class="empty">받아둔 시간표에 교사·학급 자료가 없습니다.<br>'
      + '<button class="btn" onclick="widgetAPI.openSettings()">설정에서 다시 불러오기</button></div>';
  }
  var h = '<div class="wknav"><span class="wklab" style="text-align:left">'
    + esc(d.schoolName || d.school || '')
    + '<small>' + esc((d.updatedAt || '').slice(0, 10)) + ' 기준</small></span>'
    + fontBtns('comci')
    + '<button class="wkb" id="cmGet" title="설정에서 다시 불러오기">⚙</button></div>';

  // 둘 다 있으면 나란히(가로) / 위아래(세로) 를 고를 수 있다
  if (hasT && hasC) {
    h += '<div class="wknav"><span class="slab">보기</span>'
      + '<button class="wkb' + (cmSide === 'col' ? ' now' : '') + '" data-cs="col" '
      + 'title="교사 시간표 밑에 학급 시간표">⬍ 세로</button>'
      + '<button class="wkb' + (cmSide === 'row' ? ' now' : '') + '" data-cs="row" '
      + 'title="교사 시간표 옆에 학급 시간표">⬌ 가로</button></div>';
  }
  h += '<div class="cmwrap ' + ((hasT && hasC) ? cmSide : 'col') + '">';

  // ★ 둘 다 골라 두었으면 둘 다 보여준다 (전에는 하나만 골라 볼 수 있었다)
  if (hasT) {
    h += '<div class="cmcol">';
    // 저장은 번호로 한다 — 가려진 이름은 겹칠 수 있다(김진호·김민호 → 둘 다 김*호)
    var me = d.byTeacher.filter(function (t) { return t.i === cfg.teacherIdx; })[0]
      || d.byTeacher.filter(function (t) { return t.name === cfg.teacher; })[0]
      || d.byTeacher[0];
    h += '<div class="cmh">' + me.i + ' ' + esc(me.name) + ' 선생님'
      + (hasC ? '' : '<small>설정에서 내 이름을 바꿀 수 있어요</small>') + '</div>';
    h += cmTable(me.days, function (x) {
      return '<td class="c u1" title="' + esc(x.grade + '-' + x.cls + ' ' + x.subject) + '">'
        + '<b>' + x.grade + '-' + x.cls + '</b><u>' + esc(x.subject) + '</u></td>';
    });
    h += '</div>';
  }

  if (hasC) {
    h += '<div class="cmcol">';
    var gsel = d.classes.filter(function (g) { return g.grade === cmGrade; })[0] || d.classes[0];
    cmGrade = gsel.grade;
    h += '<div class="cmh">학급 시간표</div>';
    h += '<div class="wknav">'
      + d.classes.map(function (g) {
          return '<button class="wkb' + (g.grade === cmGrade ? ' now' : '') + '" data-cg="' + g.grade + '">'
            + g.grade + '학년</button>';
        }).join('')
      + '<span class="spacer"></span>'
      + gsel.classes.map(function (c) {
          return '<button class="wkb' + (c.cls === cmCls ? ' now' : '') + '" data-cc="' + c.cls + '">'
            + c.cls + '반</button>';
        }).join('') + '</div>';
    var cl = gsel.classes.filter(function (c) { return c.cls === cmCls; })[0] || gsel.classes[0];
    cmCls = cl.cls;
    h += cmTable(cl.days, function (x) {
      return '<td class="c u0" title="' + esc(x.subject + ' / ' + x.teacher) + '">'
        + '<b>' + esc(x.subject) + '</b><u>' + esc(x.teacher) + '</u></td>';
    });
    h += '</div>';
  }
  return h + '</div>';
}

/* ── 학사일정 ── */
/* ── 학사일정 ──
   한 달씩 갈아끼우지 않고 3월부터 2월까지 쭉 이어 놓는다.
   월 단추는 «그 자리로 데려가는» 역할이고, 스크롤을 하면 단추도 따라 움직인다.
   «오늘» 단추를 누르면 오늘 날짜로 간다 — 탭을 처음 열 때도 저절로 오늘로 간다. */
var AC = null, acBusy = false, acScrolled = false, acSpy = '';
/* ── 학년부 일지 ── 학사일정 위에 얹어 보는 «그 학년만의 할 일» ── */
var GPD = {};                // 학년별로 받아 둔 일지 { 1:{items,cats}, … }
var gpOn = [];               // 켜 놓은 학년 (여러 학년을 함께 볼 수 있다)
var gpSheets = {};           // 학년별 시트 주소 (설정에서 넣는다)
var gpCat = [];              // 골라 놓은 구분 (비면 전체)
var gpOpen = '';             // 세부사항을 펼쳐 놓은 항목
var gpBusy = {}, gpErr = {}; // 학년마다 따로
var gpTouched = false;       // 화면에서 스위치를 건드렸는가 (메인 값이 덮어쓰지 않게)
var acAllYears = false;   // «다른 해» 탭까지 펼쳐 볼 것인가

/* 학년부 일지를 받아 온다. 받아 둔 것이 있으면 그것부터 쓰고, 없으면 시트에서 */
function gpLoad(g, force) {
  if (gpBusy[g]) return;
  gpBusy[g] = true; gpErr[g] = '';
  var call = force ? widgetAPI.gradeFetch(g) : widgetAPI.gradeGet(g);
  call.then(function (d) {
    gpBusy[g] = false;
    if (!d && !force) { gpLoad(g, true); return; }   // 받아 둔 것이 없으면 시트에서
    GPD[g] = d || { items: [], cats: [] };
    gpErr[g] = (d && d.error) || '';
    render();
  }).catch(function (e) {
    gpBusy[g] = false; GPD[g] = { items: [], cats: [] };
    gpErr[g] = (e && e.message) || String(e);
    render();
  });
}
/* 주소가 있는 학년만 스위치를 준다 */
function gpGrades() {
  return [1, 2, 3].filter(function (g) { return String(gpSheets[g] || '').trim(); });
}
/* 켜 놓은 학년들의 구분을 모은다 */
function gpCats() {
  var out = [];
  gpOn.forEach(function (g) {
    ((GPD[g] || {}).cats || []).forEach(function (c) { if (out.indexOf(c) < 0) out.push(c); });
  });
  return out;
}
/* 그 날짜의 학년부 항목 — 켜 놓은 학년을 모두 모은다 (고른 구분만) */
function gpOf(month, day) {
  var out = [];
  gpOn.forEach(function (g) {
    ((GPD[g] || {}).items || []).forEach(function (x) {
      if (x.month !== Number(month) || x.day !== day) return;
      if (gpCat.length && gpCat.indexOf(x.cat) < 0) return;
      out.push({ g: g, x: x });
    });
  });
  return out;
}
/* 구분마다 색을 달리한다 — 이름을 숫자로 바꿔 여덟 색에 돌려 쓴다 */
function gpHue(cat) {
  var n = 0, s = String(cat || '');
  for (var i = 0; i < s.length; i++) n = (n * 31 + s.charCodeAt(i)) % 8;
  return n;
}

/* 그 날의 학사일정 한 줄 — 대시보드가 쓴다.
   ★ 시트에 다른 해 탭이 섞여 있으므로 ok !== false 인 달만 본다
     (8월이 셋이라 목요일 일정이 수요일에 뜨던 일이 있었다). */
function acDayOf(dt) {
  if (!AC || !AC.months) return null;
  var m = String(dt.getMonth() + 1), day = dt.getDate();
  var ms = AC.months.filter(function (x) { return x.ok !== false && x.month === m; });
  if (!ms.length) ms = AC.months.filter(function (x) { return x.month === m; });
  for (var i = ms.length - 1; i >= 0; i--) {
    var hit = (ms[i].days || []).filter(function (d) { return d.day === day; })[0];
    if (hit) return hit;
  }
  return null;
}
/* 오늘부터 n일 — 일정이 있는 날만 추린다 */
function acNext(n) {
  var out = [], now = new Date();
  for (var i = 1; i <= n; i++) {
    var dt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    var d = acDayOf(dt);
    var gp = gpOf(String(dt.getMonth() + 1), dt.getDate());
    var ev = (d && d.event) || '';
    if (!ev && !gp.length) continue;
    out.push({ dt: dt, event: ev, gp: gp });
  }
  return out;
}
/* 오늘 급식 — 학교마다 한 덩이 */
function mealToday() {
  if (!ML) return [];
  var t = todayYmd();
  var schools = ML.schools && ML.schools.length ? ML.schools
    : [{ name: ML.school || '급식', meals: ML.meals || [] }];
  return schools.map(function (s) {
    var hit = (s.meals || []).filter(function (x) { return x.date === t; })[0];
    return hit ? { name: s.name, dishes: hit.dishes || [], kcal: hit.kcal || '' } : null;
  }).filter(Boolean);
}

function loadAcademic() {
  if (acBusy) return;
  acBusy = true;
  widgetAPI.getAcademic().then(function (d) {
    acBusy = false; AC = d || { empty: true }; render();
  }).catch(function () { acBusy = false; AC = { empty: true }; render(); });
}
/* 오늘이 낀 주(월~일) — 그 주를 은은하게 칠한다 */
function weekRange() {
  var d = new Date(), day = d.getDay();
  var mon = new Date(d.getFullYear(), d.getMonth(), d.getDate() + (day === 0 ? -6 : 1 - day));
  var sun = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6);
  return { from: mon, to: sun };
}
/* 학년도라 3~12월은 올해, 1~2월은 다음 해로 본다 */
function acYear(month) {
  var now = new Date(), m = Number(month);
  if (now.getMonth() + 1 >= 3) return m <= 2 ? now.getFullYear() + 1 : now.getFullYear();
  return m <= 2 ? now.getFullYear() : now.getFullYear() - 1;
}
function viewAcademic() {
  if (!AC) { loadAcademic(); return '<div class="empty">학사일정을 불러오는 중…</div>'; }
  var ms = (AC.months) || [];
  if (!ms.length) {
    return '<div class="empty">아직 가져온 학사일정이 없습니다.'
      + (acBusy ? '<div style="margin-top:8px">받는 중…</div>' : '')
      + '<br><button class="btn" id="acGetBig">지금 가져오기</button>'
      + '<div style="margin-top:8px;font-size:10.5px;opacity:.8">'
      + '학교 «연간 수업일수 계획표» 시트에서 받아옵니다. 한 해치라 20초쯤 걸립니다.'
      + (AC.error ? '<br>' + esc(AC.error) : '') + '</div></div>';
  }

  var now = new Date(), todayD = now.getDate(), todayM = String(now.getMonth() + 1);
  var wr = weekRange();
  // ★ 시트에 «다른 해» 탭이 섞여 있을 수 있다. 실제로 8월이 셋이었다
  //   (8-1=2025 · 8-2=2026 · 8=2027). 요일로 알아낸 해가 어긋나면 감춘다.
  //   academic.js 가 달마다 ok 를 매겨 준다. 옛 자료에는 ok 가 없으니 그때는 다 쓴다.
  var other = ms.filter(function (x) { return x.ok === false; });
  if (!acAllYears && other.length) {
    ms = ms.filter(function (x) { return x.ok !== false; });
    if (!ms.length) ms = (AC.months) || [];      // 다 어긋나면 차라리 다 보여준다
  }
  var mine = ms.filter(function (x) { return x.month === todayM; });
  if (!acSpy || !ms.some(function (x) { return x.tab === acSpy; })) {
    acSpy = (mine.length ? mine[mine.length - 1] : ms[0]).tab;
  }

  var h = '<div class="top2"><div class="wknav">'
    + ms.map(function (x) {
        var tag = (x.ok === false && x.year) ? String(x.year) + '년'
          : (/-/.test(x.tab) ? esc(x.tab) : '');
        return '<button class="wkb' + (x.tab === acSpy ? ' now' : '')
          + (x.ok === false ? ' oldyr' : '') + '" data-ac="' + esc(x.tab) + '">'
          + esc(x.month) + '월' + (tag ? '<small>' + esc(tag) + '</small>' : '') + '</button>';
      }).join('')
    + (other.length
        ? '<button class="wkb" id="acYrs" title="시트에 다른 해 탭이 섞여 있습니다">'
          + (acAllYears ? '− 올해만' : '+ 다른 해 ' + other.length + '개') + '</button>'
        : '')
    + '<span class="spacer"></span>'
    + gpGrades().map(function (g) {
        return '<button class="wkb sw' + (gpOn.indexOf(g) >= 0 ? ' now' : '') + '" '
          + 'data-gs="' + g + '" title="' + g + '학년부 일지를 학사일정 위에 함께 보기">'
          + '<span class="track"><span class="knob"></span></span>' + g + '학년</button>';
      }).join('')
    + fontBtns('cal')
    + '<button class="wkb go" id="acToday" title="오늘 날짜로">오늘로</button>'
    + '<button class="wkb" id="acGet" title="다시 가져오기">⟳</button></div></div>';

  // 구분 고르개 — 학년을 하나라도 켰을 때만 나온다
  if (gpOn.length) {
    h += '<div class="wknav gpbar">';
    var errs = gpOn.filter(function (g) { return gpErr[g]; });
    var wait = gpOn.filter(function (g) { return !GPD[g]; });
    if (errs.length) {
      // ★ 까닭을 여기서 바로 알려 준다 — 설정까지 들어가 봐야 알 수 있으면 안 된다
      h += '<span class="shint warnfg">' + errs[0] + '학년 — ' + esc(gpErr[errs[0]]) + '</span>'
        + '<button class="wkb" onclick="widgetAPI.openSettings()">설정 열기</button>';
    } else if (gpOn.some(function (g) { return (GPD[g] || {}).items && !GPD[g].items.length; })) {
      var empty = gpOn.filter(function (g) { return (GPD[g] || {}).items && !GPD[g].items.length; });
      h += '<span class="shint warnfg">' + empty.join('·') + '학년 일지에서 읽어 온 것이 없습니다</span>'
        + '<button class="wkb" id="gpGet2">다시 받기</button>'
        + '<button class="wkb" onclick="widgetAPI.openSettings()">설정 열기</button>';
    } else if (wait.length) {
      h += '<span class="shint">' + wait.join('·') + '학년 일지를 받는 중…</span>';
    }
    var cats = gpCats();
    if (cats.length) {
      h += '<span class="slab">구분</span>'
        + '<button class="wkb' + (gpCat.length ? '' : ' now') + '" data-ga="1">전체</button>'
        + cats.map(function (c) {
            return '<button class="wkb gpc h' + gpHue(c) + (gpCat.indexOf(c) >= 0 ? ' now' : '')
              + '" data-gc="' + esc(c) + '">' + esc(c) + '</button>';
          }).join('');
    }
    h += '<span class="spacer"></span>'
      + '<button class="wkb" id="gpGet" title="학년부 일지 다시 받기">⟳</button></div>';
  }

  h += ms.map(function (m) {
    var year = acYear(m.month);
    var rowObjs = m.days.map(function (d) {
      var isToday = (m.month === todayM && d.day === todayD);
      var weekend = (d.dow === '토' || d.dow === '일');
      var dt = new Date(year, Number(m.month) - 1, d.day);
      var inWeek = dt >= wr.from && dt <= wr.to;
      // 학년마다 수업 일정이 다를 수 있다 — 1·2·3학년을 각각 줄지어 보여준다
      var gs = d.grades || {};
      var lit = [1, 2, 3].map(function (g) {
        var codes = gs[g];
        if (!codes || !codes.some(Boolean)) return '';
        return '<span class="acg"><i class="gl">' + g + '학년</i>'
          + codes.map(function (c, i) {
              return c ? '<i class="cd" title="' + g + '학년 ' + (i + 1) + '교시">' + esc(c) + '</i>'
                : '<i class="cd off"></i>';
            }).join('') + '</span>';
      }).join('');
      // ★ 같은 달이 8-1·8-2 로 나뉘어 있으면 «오늘»이 여러 군데 생긴다.
      //   id 는 달마다 다르게 주고, 어디로 갈지는 goToday() 가 고른다.
      return {
        inWeek: inWeek,
        html: '<div class="acr' + (isToday ? ' tdy' : '') + (weekend ? ' wknd' : '') + '"'
          + (isToday ? ' data-today="1" id="actoday-' + esc(m.tab) + '"' : '') + '>'
          + '<span class="acd">' + d.day + '<small>' + esc(d.dow) + '</small></span>'
          + '<span class="ace">' + esc(d.event || '') + '</span>'
          + (lit ? '<span class="acc">' + lit + '</span>' : '') + '</div>'
          + gpRows(m.month, d.day)
      };
    });
    // 이번 주는 «날짜마다» 가 아니라 «한 주를 통째로» 테두리로 묶는다.
    // 오늘 칸은 그 안에서 다른 색 테두리로 한 번 더 구분한다.
    var pack = [], run = [];
    var flush = function () {
      if (!run.length) return;
      pack.push('<div class="acweek">' + run.join('') + '</div>');
      run = [];
    };
    rowObjs.forEach(function (r) {
      if (r.inWeek) { run.push(r.html); return; }
      flush();
      pack.push(r.html);
    });
    flush();
    var rows = pack.join('');
    return '<div class="acmon" id="acm-' + esc(m.tab) + '" data-mon="' + esc(m.tab) + '">'
      + esc(m.month) + '월' + (/-/.test(m.tab) ? ' (' + esc(m.tab) + ')' : '') + '</div>'
      + '<div class="acl">' + rows + '</div>';
  }).join('');
  return h;
}
/* 그 날의 학년부 항목을 줄로 그린다. 세부사항은 눌러야 펼쳐진다(여러 줄이라 길다) */
function gpRows(month, day) {
  var list = gpOf(month, day);
  if (!list.length) return '';
  var many = gpOn.length > 1;   // 여러 학년을 켰으면 어느 학년 것인지 밝힌다
  return '<div class="gpl">' + list.map(function (it, i) {
    var x = it.x;
    var key = month + '-' + day + '-' + i;
    var open = gpOpen === key;
    return '<div class="gpi' + (open ? ' on' : '') + '">'
      + '<button class="gph" data-gp="' + esc(key) + '">'
      + (many ? '<i class="gpg">' + it.g + '</i>' : '')
      + '<i class="gpk h' + gpHue(x.cat) + '">' + esc(x.cat || '·') + '</i>'
      + '<span class="gpt">' + esc(x.title || '') + '</span>'
      + (x.done ? '<em class="gpd" title="확인함">✔</em>' : '')
      + (x.detail ? '<em class="gpa">' + (open ? '▾' : '▸') + '</em>' : '')
      + '</button>'
      + (open && x.detail ? '<div class="gpb">' + esc(x.detail) + '</div>' : '')
      + '</div>';
  }).join('') + '</div>';
}

/* 스크롤한 만큼 «지금 보고 있는 달»을 골라 단추에 표시한다.
   다시 그리면 입력·스크롤이 튀므로, 여기서는 단추의 표시만 갈아 끼운다. */
function acSpyScroll() {
  if (VIEW !== 'cal') return;
  var app = appEl();
  if (!app) return;
  var heads = app.querySelectorAll('.acmon');
  if (!heads.length) return;
  var line = app.getBoundingClientRect().top + (parseFloat(
    getComputedStyle(app).getPropertyValue('--toph')) || 46) + 34;
  var pick = heads[0].dataset.mon;
  heads.forEach(function (el) { if (el.getBoundingClientRect().top <= line) pick = el.dataset.mon; });
  if (pick === acSpy) return;
  acSpy = pick;
  app.querySelectorAll('[data-ac]').forEach(function (b) {
    b.classList.toggle('now', b.dataset.ac === acSpy);
  });
}
/* 고정된 머리(날짜·탭 줄 + 월 단추 줄) 아래로 오도록 손수 자리를 잡는다.
   scrollIntoView 는 그 머리에 가려서 «오늘»이 위쪽에 숨어 버린다. */
function scrollToEl(el, gap) {
  var app = appEl();
  if (!el || !app) return false;
  var top = el.getBoundingClientRect().top - app.getBoundingClientRect().top + app.scrollTop;
  var head = parseFloat(getComputedStyle(app).getPropertyValue('--toph')) || 46;
  // 머리에 «붙어 있는» 줄만 빼 준다. 혜원이지는 이 줄이 같이 흘러가므로 뺄 것이 없다.
  var nav = app.querySelector('.top2');
  var stuck = nav && getComputedStyle(nav).position !== 'static';
  app.scrollTop = Math.max(0, top - head - (stuck ? nav.offsetHeight : 0) - (gap || 6));
  return true;
}
/* 8-1·8-2 처럼 같은 달이 둘로 나뉘면 «오늘»이 두 군데다.
   일정이 적혀 있는 쪽이 지금 쓰는 달이고, 그것도 없으면 뒤쪽을 쓴다. */
function todayEl() {
  var app = appEl();
  var list = app ? app.querySelectorAll('[data-today]') : [];
  if (!list.length) return null;
  for (var i = list.length - 1; i >= 0; i--) {
    var e = list[i].querySelector('.ace');
    if (e && e.textContent.trim()) return list[i];
  }
  return list[list.length - 1];
}
function goToday() {
  var el = todayEl();
  if (!el) return false;
  scrollToEl(el, 6);
  // 글꼴이 늦게 오거나 창 높이가 맞춰지면 자리가 밀린다 — 조금 뒤 한 번 더 맞춘다
  setTimeout(function () { var e2 = todayEl(); if (e2) scrollToEl(e2, 6); }, 280);
  return true;
}

/* ── 급식 ── */
var ML = null, mlBusy = false;

function loadMeals() {
  if (mlBusy) return;
  mlBusy = true;
  widgetAPI.getMeals().then(function (d) {
    mlBusy = false; ML = d || { empty: true }; render();
  }).catch(function () { mlBusy = false; ML = { empty: true }; render(); });
}
function viewMeals() {
  if (!ML) { loadMeals(); return '<div class="empty">급식을 불러오는 중…</div>'; }
  var schools = ML.schools || null;
  var multi = !!(schools && schools.length > 1);
  var list = multi ? [] : ((schools && schools[0] && schools[0].meals) || ML.meals || []);
  var off = Number(ML.weekOff) || 0;
  var head = '<div class="top2"><div class="wknav">'
    + '<button class="wkb" data-ml="' + (off - 1) + '" title="지난 주">◀</button>'
    + '<span class="wklab">' + esc(ML.school || '급식')
    + '<small>' + (ML.from ? esc(fmtYmd(ML.from)) + ' ~ ' + esc(fmtYmd(ML.to)) : '') + '</small></span>'
    + '<button class="wkb" data-ml="' + (off + 1) + '" title="다음 주">▶</button>'
    + (off !== 0 ? '<button class="wkb go" data-ml="0">이번주</button>' : '')
    + fontBtns('meal')
    + '<button class="wkb" id="mlGet" title="다시 가져오기">⟳</button></div></div>';
  if (!multi && !list.length) {
    return head + '<div class="empty">' + (ML.error ? esc(ML.error) : '이 주에는 급식이 없습니다.')
      + '<br><button class="btn" id="mlGetBig">지금 가져오기</button></div>';
  }
  var todayStr = todayYmd();
  // ★ 오늘 것은 학사일정의 «오늘» 처럼 크게 키워 눈에 먼저 들어오게 한다
  function days(rows) {
    return (rows || []).map(function (x) {
      var on = (x.date === todayStr);
      return '<div class="ml' + (on ? ' tdy' : '') + '">'
        + '<div class="mlh">' + esc(mdDow(x.date)) + (on ? ' <em>오늘</em>' : '')
        + '<span>' + esc(x.kcal || '') + '</span></div>'
        + '<div class="mld">' + (x.dishes || []).map(function (t) {
            return '<span>' + esc(t) + '</span>';
          }).join('') + '</div></div>';
    }).join('');
  }
  // 학교를 여럿 담아 두었으면 학교마다 갈라 보여준다
  if (multi) {
    return head + ML.schools.map(function (s) {
      return '<div class="mlsch">' + esc(s.name) + '</div>'
        + (s.error ? '<div class="empty">' + esc(s.error) + '</div>'
          : (s.meals && s.meals.length ? days(s.meals)
            : '<div class="empty">이 주에는 급식이 없습니다.</div>'));
    }).join('');
  }
  return head + days(list);
}
function fmtYmd(s) {
  var m = String(s || '').match(/^(\d{4})(\d{2})(\d{2})$/);
  return m ? Number(m[2]) + '/' + Number(m[3]) : String(s || '');
}
function todayYmd() {
  var d = new Date(), p = function (n) { return String(n).padStart(2, '0'); };
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}
function mdDow(iso) {
  var p = String(iso || '').split('-');
  if (p.length !== 3) return String(iso || '');
  var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  return Number(p[1]) + '/' + Number(p[2]) + ' (' + ['일', '월', '화', '수', '목', '금', '토'][d.getDay()] + ')';
}

/* ── 반별 진도 ── */
function viewProgress(d) {
  var ps = (d.progress || []).filter(function (p) { return p.total > 0; });
  if (!ps.length) return '<div class="empty">진도 자료가 아직 없습니다.</div>';
  var max = Math.max.apply(null, ps.map(function (p) { return p.total; }));
  return ps.map(function (p) {
    var w = max ? Math.round(p.done / max * 100) : 0;
    var gap = p.gap < 0 ? '<span class="gap"> ' + p.gap + '</span>' : '';
    return '<div class="pg"><div class="pgc">' + esc(p.cls) + '</div>'
      + '<div class="bar"><i style="width:' + w + '%"></i></div>'
      + '<div class="pgn"><em>' + p.done + '</em>/' + p.total + '차시' + gap + '</div></div>';
  }).join('');
}

/* 업데이트가 준비되면 맨 위에 눌러서 설치할 수 있는 띠를 띄운다.
   윈도우 알림과 트레이 메뉴만으로는 계속 놓치기 쉬워서 화면에 직접 둔다. */
/* 무엇을 언제 받는지 보여준다 — 조용히 실패하면 «안 된다»고만 알게 되니까 */
/* ── 날씨·미세먼지 ── */
var WX = null, WXSHOW = true, WXSPOT = '';
function wxCard() {
  if (!WXSHOW || !WX || WX.error || !WX.now) return '';
  var n = WX.now, t = WX.today, a = WX.air;
  var h = '<div class="wx" title="' + esc(WXSPOT || '') + ' · 눌러서 다시 받기">'
    + '<button class="wxb" id="wxGet">'
    + '<span class="wxi">' + n.icon + '</span>'
    + '<span class="wxt"><b>' + n.temp + '°</b>'
    + '<i>' + esc(n.text) + '</i></span>'
    + '<span class="wxs">' + t.min + '° / ' + t.max + '°'
    + (t.rain >= 30 ? ' · 비 ' + t.rain + '%' : '') + '</span>';
  if (a && a.pm10) {
    h += '<span class="wxp g' + a.pm10.lv + '">미세 <b>' + esc(a.pm10.t) + '</b></span>';
  }
  if (a && a.pm25) {
    h += '<span class="wxp g' + a.pm25.lv + '">초미세 <b>' + esc(a.pm25.t) + '</b></span>';
  }
  return h + '</button></div>';
}

/* ── 내 PC (CPU·램) ── AI 사용량과 같은 모양으로 그린다 ── */
var SYS = null, SYSSHOW = false;
function sysMetrics() {
  if (!SYSSHOW || !SYS) return [];
  var out = [];
  if (SYS.cpu !== null && SYS.cpu !== undefined) {
    out.push({ lb: 'CPU', pct: SYS.cpu, sub: (SYS.cores || 0) + '코어' });
  }
  if (SYS.ram) {
    out.push({ lb: 'RAM', pct: SYS.ram.pct,
      sub: SYS.ram.usedGb + ' / ' + SYS.ram.totalGb + ' GB' });
  }
  return out;
}
function sysBox() {
  var ms = sysMetrics();
  if (!ms.length) return '';
  var h = '<div class="box"><div class="nm">내 PC</div>';
  if (USGSTYLE === 'ring') {
    h += '<div class="rings">' + ms.map(function (x) {
      return '<div class="ring">' + ringSvg(x.pct)
        + '<div class="lb">' + esc(x.lb) + '</div>'
        + '<div class="rs">' + esc(x.sub) + '</div></div>';
    }).join('') + '</div>';
  } else {
    h += '<div class="bars">' + ms.map(function (x) {
      return '<div class="brow"><div class="bt">' + esc(x.lb) + '<b>' + x.pct + '%</b></div>'
        + '<div class="bk"><i style="width:' + x.pct + '%;background:' + usgFill(x.pct) + '"></i></div>'
        + '<div class="rs">' + esc(x.sub) + '</div></div>';
    }).join('') + '</div>';
  }
  return h + '</div>';
}

var TASKS = [];
/* ── AI 사용량 (클로드·제미나이) ──────────────────────────────
   위젯이 보이지 않는 창으로 직접 읽어 온다. 원형과 막대 중에 고를 수 있고,
   «얼마나 남았는지»와 «언제 초기화되는지»를 함께 보여준다. */
var USG = null, USGSHOW = true, USGSTYLE = 'ring';
var USGON = [];   // 켜 놓은 AI 들

function pctOf(m) { return m && m.pct !== null && m.pct !== undefined ? Number(m.pct) : null; }
/* 남은 시간은 창을 켜 둔 채로도 계속 줄어야 한다 — 그래서 «초기화 시각»에서 매번 다시 센다 */
function leftOf(m) {
  if (!m || !m.resetAt) return '';
  var ms = m.resetAt - Date.now();
  if (ms <= 0) return '';
  var mi = Math.floor(ms / 60000), hh = Math.floor(mi / 60), dd = Math.floor(hh / 24);
  if (dd >= 1) return dd + '일 ' + (hh % 24) + '시간';
  if (hh >= 1) return hh + '시간 ' + (mi % 60) + '분';
  return mi + '분';
}
function atOf(m) {
  if (!m) return '';
  if (m.resetAt) {
    var d = new Date(m.resetAt);
    var dow = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
    var ap = d.getHours() < 12 ? '오전' : '오후';
    var h12 = d.getHours() % 12 || 12;
    return (d.getMonth() + 1) + '/' + d.getDate() + '(' + dow + ') ' + ap + ' ' + h12 + ':' + pad(d.getMinutes());
  }
  return String(m.reset || '');
}
/* «1시간 39분 남음 · 8/25(화) 오후 3:20 초기화» */
function resetTxt(m) {
  var bits = [];
  var l = leftOf(m);
  if (l) bits.push('<em>' + esc(l) + ' 남음</em>');
  var a = atOf(m);
  if (a) bits.push(esc(a) + ' 초기화');
  return bits.join(' · ');
}
/* ── 사용량 색 ────────────────────────────────────────────────
   40% 부터 노랑, 오를수록 붉어지고 90% 넘으면 빨강.
   ★ 테마와 상관없이 늘 같은 색이다 — «많이 썼다» 는 신호는 옷이 바뀌어도 같아야 한다.
   40% 아래에서만 테마 강조색을 써서 평소에는 화면과 겉돌지 않게 한다. */
var USGTONE = [
  { at: 0,  a: 'var(--accent)', b: 'var(--accent)' },   // 여유
  { at: 40, a: '#f5d02a', b: '#eab308' },               // 노랑
  { at: 60, a: '#f0a92a', b: '#ef8b1e' },               // 주황
  { at: 80, a: '#ef7a22', b: '#e85f22' },               // 진주황
  { at: 90, a: '#e0452e', b: '#d31f26' }                // 빨강
];
function usgTone(pct) {
  var p = Number(pct) || 0, t = USGTONE[0];
  for (var i = 0; i < USGTONE.length; i++) { if (p >= USGTONE[i].at) t = USGTONE[i]; }
  return t;
}
/* 막대에 쓸 그라데이션 한 줄 */
function usgFill(pct) {
  var t = usgTone(pct);
  return 'linear-gradient(90deg,' + t.a + ',' + t.b + ')';
}

var RINGN = 0;   // 그라데이션마다 이름이 달라야 해서
function ringSvg(pct) {
  var r = 15, c = 2 * Math.PI * r, off = c * (1 - Math.min(100, Math.max(0, pct)) / 100);
  var t = usgTone(pct), id = 'ug' + (++RINGN);
  return '<svg width="42" height="42" viewBox="0 0 42 42">'
    + '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1">'
    + '<stop offset="0" style="stop-color:' + t.a + '"/>'
    + '<stop offset="1" style="stop-color:' + t.b + '"/></linearGradient></defs>'
    + '<circle cx="21" cy="21" r="' + r + '" fill="none" stroke="var(--card2)" stroke-width="5"/>'
    + '<circle cx="21" cy="21" r="' + r + '" fill="none" stroke="url(#' + id + ')" stroke-width="5"'
    + ' stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '"'
    + ' stroke-dashoffset="' + off.toFixed(1) + '" transform="rotate(-90 21 21)"/>'
    + '<text x="21" y="25" text-anchor="middle">' + pct + '</text></svg>';
}
function usgMetrics(u) {
  var list = [];
  if (pctOf(u.session) !== null) list.push({ lb: '5시간', m: u.session });
  if (pctOf(u.weekly) !== null) list.push({ lb: '주간', m: u.weekly });
  if (u.fable && pctOf(u.fable) !== null) list.push({ lb: 'Fable', m: u.fable });
  return list;
}
function usgBox(key, u) {
  var h = '<div class="box"><div class="nm">' + esc(u.label || key)
    + (u.account ? '<i>' + esc(u.account) + '</i>' : '') + '</div>';
  if (u.needsLogin || (!u.ok && !usgMetrics(u).length)) {
    h += '<button class="lg" data-usglogin="' + key + '">'
      + (u.needsLogin ? '로그인하기' : '불러오는 중… 다시 시도') + '</button>';
    return h + '</div>';
  }
  var ms = usgMetrics(u);
  if (USGSTYLE === 'ring') {
    h += '<div class="rings">' + ms.map(function (x) {
      return '<div class="ring">' + ringSvg(pctOf(x.m))
        + '<div class="lb">' + esc(x.lb) + '</div>'
        + '<div class="rs" title="' + esc(atOf(x.m)) + '">' + (leftOf(x.m) ? esc(leftOf(x.m)) + ' 남음' : esc(atOf(x.m))) + '</div>'
        + '</div>';
    }).join('') + '</div>';
    // 원형은 좁아서 초기화 시각을 아래에 한 줄로 따로 적는다
    if (ms.length) h += '<div class="rs" style="font-size:8.5px;color:var(--dim);margin-top:3px">'
      + esc(atOf(ms[0].m)) + ' 초기화</div>';
  } else {
    h += '<div class="bars">' + ms.map(function (x) {
      var p = pctOf(x.m);
      return '<div class="brow"><div class="bt">' + esc(x.lb) + '<b>' + p + '%</b></div>'
        + '<div class="bk"><i style="width:' + Math.min(100, p) + '%;background:' + usgFill(p) + '"></i></div>'
        + '<div class="rs">' + resetTxt(x.m) + '</div></div>';
    }).join('') + '</div>';
  }
  return h + '</div>';
}
function usageBar() {
  var keys = (USG ? Object.keys(USG) : []).filter(function (k) { return USGON.indexOf(k) >= 0; });
  var sys = sysBox();
  if (!keys.length && !sys) return '';
  return '<div class="usg">'
    + keys.map(function (k) { return usgBox(k, USG[k] || {}); }).join('')
    + sys
    + '<div class="usgset">'
    + '<button class="wkb' + (USGSTYLE === 'ring' ? ' now' : '') + '" data-usgstyle="ring" title="원형">◍</button>'
    + '<button class="wkb' + (USGSTYLE === 'bar' ? ' now' : '') + '" data-usgstyle="bar" title="막대">▤</button>'
    + '<button class="wkb" id="usgGet" title="지금 다시 읽기">⟳</button>'
    + '</div></div>';
}

/* ── 학생기록 ──────────────────────────────────────────────────
   학급 → 학생 타일 → 카테고리 → 작성. «통계» 로 넘기면 학생·카테고리·날짜를
   각각 여러 개 골라 걸러 볼 수 있다.

   기록은 구글 시트에 쌓인다. 시트에서 직접 고쳐도 여기에 반영되고,
   여기서 쓴 것도 시트에 그대로 남는다. */
var REC = null;          // 메인이 알려 주는 상태(연결·시트·학급·명렬표)
var RECDATA = null;      // 시트에서 읽어 온 기록·카테고리
var recBusy = false, recErr = '';
var recMode = 'write';   // write | stat | cats
var recCls = '', recSid = '', recCat = '';
var recDraft = '', recSavedAt = '', recOpen = 0;   // recOpen = 펼쳐 놓은 기록의 줄 번호
var recWhen = '';        // 기록한 날 (yyyy.MM.dd). 비어 있으면 «오늘»
var statStu = [], statCat = [], statMon = [], statCls = [];   // 통계에서 고른 것들 (여러 개)
var statMore = false;    // 학생 줄을 펼쳐 놓았는가
var catEdit = null;      // 카테고리 편집 중인 목록
// 다른 PC 에서 만들어 둔 시트가 드라이브에 있는지 — null=아직 안 봄, false=없음, {…}=있음
var recFound = null, recFinding = false;

function recLoad(force) {
  if (recBusy) return;
  if (RECDATA && !force) return;
  recBusy = true; recErr = '';
  widgetAPI.recLoad().then(function (d) {
    recBusy = false;
    if (d && d.need === 'sheet') {
      RECDATA = null;
      recFound = null;                 // 드라이브를 다시 훑어본다
      if (d.lost) {
        recErr = '지난 시트를 이 계정에서는 볼 수 없습니다.\n'
          + (d.lost.email ? '그 시트는 ' + d.lost.email + ' 계정에 있습니다.\n' : '')
          + '\n그 계정으로 다시 연결하시거나, 여기서 새로 만드시면 됩니다.';
      }
      render(); return;
    }
    RECDATA = d || null; render();
  }).catch(function (e) {
    recBusy = false; RECDATA = null;
    recErr = (e && e.message) || String(e);
    render();
  });
}
/* 드라이브에 이미 만들어 둔 시트가 있는지 한 번만 훑어본다 (두 PC 로 쓸 때를 위한 것) */
function recFindSheet() {
  if (recFinding) return;
  recFinding = true;
  widgetAPI.recFind().then(function (f) {
    recFinding = false; recFound = f || false; render();
  }).catch(function () { recFinding = false; recFound = false; render(); });
}

function recCats() {
  var c = (RECDATA && RECDATA.cats) || [];
  var on = c.filter(function (x) { return x.on !== false; });
  return on.length ? on : [{ name: '행발' }, { name: '세특' }, { name: '자율' },
    { name: '동아리' }, { name: '진로' }, { name: '자유학기' }];
}
function recClassList() {
  var all = (REC && REC.roster && REC.roster.classes) || [];
  var pick = (REC && REC.classes) || [];
  if (!pick.length) return all;                      // 아직 안 골랐으면 전부
  return all.filter(function (c) { return pick.indexOf(c.key) >= 0; });
}
function recStudents() {
  var c = recClassList().filter(function (x) { return x.key === recCls; })[0];
  return (c && c.students) || [];
}
/* 한 학생에게 쌓인 기록 (새것이 위로).
   cat 을 주면 그 분류만, 안 주면 전부 — 타일에 분류를 함께 보여주므로 기본은 전부다. */
function recList(sid, cat) {
  var rs = (RECDATA && RECDATA.records) || [];
  return rs.filter(function (r) {
    return r.id === sid && r.text && (!cat || r.cat === cat);
  }).sort(function (a, b) { return String(b.at).localeCompare(String(a.at)); });
}
function recFind(sid, cat) { return recList(sid, cat)[0] || null; }
/* 나이스 글자 수 — 한글3 · 영숫1 · 엔터1 바이트 */
/* ── 기록한 날 고르개 ──────────────────────────────────────────
   며칠 지나 몰아 쓸 때 «그날» 로 남겨야 한다. 전에는 무조건 저장하는 순간이 박혔다.
   이번 주 월요일부터 어제까지 날짜 단추를 늘어놓고, 맨 끝이 «오늘» 이다.
   월요일이면 «오늘» 하나, 금요일이면 24월 25화 26수 27목 오늘 이 된다. */
function ymd(d) {
  var p = function (n) { return String(n).padStart(2, '0'); };
  return d.getFullYear() + '.' + p(d.getMonth() + 1) + '.' + p(d.getDate());
}
function recDays() {
  var DOWK = ['일', '월', '화', '수', '목', '금', '토'];
  var now = new Date();
  var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // 이번 주 월요일 (일요일이면 지난 월요일부터 — 한 주가 끊기지 않게)
  var back = (today.getDay() + 6) % 7;
  var out = [];
  for (var k = back; k >= 1; k--) {
    var d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - k);
    out.push({ v: ymd(d), t: d.getDate() + DOWK[d.getDay()] });
  }
  out.push({ v: ymd(today), t: '오늘', today: true });
  return out;
}
function recDateBar() {
  var days = recDays();
  var pick = recWhen || days[days.length - 1].v;
  var known = days.some(function (d) { return d.v === pick; });
  var h = '<div class="wknav rdates"><span class="slab">기록한 날</span>'
    + days.map(function (d) {
        return '<button class="wkb' + (d.v === pick ? ' now' : '') + '" data-rw="' + d.v + '">'
          + esc(d.t) + '</button>';
      }).join('');
  // 지난 주 것이나 아주 옛날 것은 달력으로 (드롭다운은 쓰지 않는다)
  h += '<input class="wq rwd" type="date" id="recWhenIn" value="'
    + esc(pick.replace(/\./g, '-')) + '" title="다른 날을 고르려면">';
  if (!known) h += '<span class="shint">' + esc(pick) + '</span>';
  return h + '</div>';
}

function neisBytes(t) {
  var n = 0;
  String(t || '').split('').forEach(function (ch) {
    if (ch === '\n') n += 1;
    else if (ch.charCodeAt(0) > 127) n += 3;
    else n += 1;
  });
  return n;
}
function sheetBtn() {
  if (!(REC && REC.sheet && REC.sheet.id)) return '';
  return '<button class="shbtn" title="연결된 구글 시트 열기" onclick="widgetAPI.recOpenSheet()">'
    + '<img src="assets/sheet.png" alt=""></button>';
}

/* ── 아직 준비가 안 됐을 때 보여주는 안내 ── */
function recSetup() {
  var st = REC || {};
  var h = '<div class="recintro">'
    + '<div class="rt">학생기록</div>'
    + '<div class="rp">학생기록 시트는 <b>지금 로그인한 구글 계정</b>에 만들어집니다.<br>'
    + '시트와 위젯에서 쓴 내용은 <b>서로 연동</b>되어 어느 쪽에서 고쳐도 함께 바뀝니다.</div>';

  // ★ 오류를 이 화면에서도 보여준다. 전에는 시트 만들기가 실패해도 아무 말이 없어서
  //   «눌리는데 안 만들어진다» 처럼 보였다.
  if (recErr) {
    h += '<div class="rw" style="white-space:pre-wrap;text-align:left">'
      + '<b>안 됐습니다.</b>\n' + esc(recErr) + '</div>';
    // 드라이브 권한이 빠졌을 때는 «옛 허락 기록» 이 원인인 경우가 많다.
    // 말로만 설명하면 찾아가기 어려워서, 그 페이지로 가는 단추를 바로 놓는다.
    if (recErr.indexOf('드라이브 권한') >= 0) {
      h += '<div class="wknav" style="justify-content:center;margin-bottom:10px">'
        + '<button class="wkb" id="recPerm">구글 계정에서 이 앱 지우기</button>'
        + '<button class="wkb" id="recIn2">다시 연결하기</button></div>';
    }
  }
  if (!st.hasClient) {
    h += '<div class="rw">먼저 설정에서 <b>구글 연결 정보</b>를 넣어 주세요.<br>'
      + '설정 → 학생기록 에 넣는 방법이 적혀 있습니다.</div>'
      + '<button class="btn" onclick="widgetAPI.openSettings()">설정 열기</button>';
    return h + '</div>';
  }
  if (!st.linked) {
    h += '<div class="rw">구글에 한 번 연결해 주세요. 크롬이 열리고, 허용하면 끝납니다.</div>'
      + '<button class="btn" id="recIn">구글 연결하기</button>';
    return h + '</div>';
  }
  h += '<div class="rok">연결됨 · ' + esc(st.email || '') + '</div>';
  if (!st.sheet || !st.sheet.id || st.sheet.trashedAt) {
    if (st.sheet && st.sheet.trashedAt) {
      h += '<div class="rw">지난 시트는 ' + esc(st.sheet.trashedAt) + ' 에 휴지통으로 보냈습니다.</div>';
    }
    if (recFound === null) { recFindSheet(); }   // 드라이브를 한 번 훑어본다
    if (recFinding) {
      h += '<div class="rp">이미 만들어 둔 시트가 있는지 찾아보는 중…</div>';
    } else if (recFound) {
      // ★ 다른 PC 에서 이미 만들었다. 새로 만들면 기록이 두 곳으로 갈린다.
      h += '<div class="rok">이미 만들어 둔 시트를 찾았습니다'
        + (recFound.createdAt ? ' · 만든날 ' + esc(recFound.createdAt) : '') + '</div>'
        + '<div class="rp">다른 PC 에서 만드신 것입니다. 그대로 <b>이어서</b> 쓰시면 됩니다.</div>'
        + '<button class="btn" id="recNew">이 시트 이어 쓰기</button>';
    } else {
      h += '<button class="btn" id="recNew">시트 만들기</button>';
    }
    h += '<div class="rp" style="margin-top:10px">다른 시트를 쓰시려면 주소를 붙여 넣으세요.</div>'
      + '<div class="wknav"><input class="wq" id="recUrl" type="text" placeholder="구글 시트 주소">'
      + '<button class="wkb" id="recAt">연결</button></div>';
  }
  return h + '</div>';
}

/* ── 쓰기 ── */
function recWrite() {
  var classes = recClassList();
  if (!classes.length) {
    return '<div class="empty">명렬표를 아직 못 읽었습니다.<br>'
      + '<button class="btn" id="recRoster">지금 받아오기</button></div>';
  }
  if (!recCls) recCls = classes[0].key;

  var h = '<div class="wknav">' + classes.map(function (c) {
    return '<button class="wkb' + (c.key === recCls ? ' now' : '') + '" data-rc="' + esc(c.key) + '">'
      + c.grade + '-' + c.cls + '</button>';
  }).join('') + '</div>';

  var studs = recStudents();
  h += '<div class="stiles">' + studs.map(function (s) {
    var n = ((RECDATA && RECDATA.records) || []).filter(function (r) {
      return r.id === s.id && r.text;
    }).length;
    return '<button class="stile' + (s.id === recSid ? ' on' : '') + '" data-rs="' + s.id + '">'
      + '<b>' + esc(s.id) + '</b> ' + esc(s.name)
      + (n ? '<i>' + n + '</i>' : '') + '</button>';
  }).join('') + '</div>';

  if (!recSid) return h;
  var me = studs.filter(function (s) { return s.id === recSid; })[0];
  if (!me) return h;

  var cats = recCats();
  if (!recCat) recCat = cats[0].name;
  h += '<div class="rhead">' + esc(me.id) + ' ' + esc(me.name) + '</div>';
  h += '<div class="wknav">' + cats.map(function (c) {
    var n = recList(me.id, c.name).length;
    return '<button class="wkb' + (c.name === recCat ? ' now' : '') + '" data-rk="' + esc(c.name) + '">'
      + esc(c.name) + (n ? '<small>' + n + '</small>' : '') + '</button>';
  }).join('')
    + '<span class="spacer"></span>'
    + '<button class="wkb" id="recCatEdit" title="카테고리 편집">⚙</button></div>';

  // ── 이미 저장한 것들 — 접힌 타일로 쌓아 두고, 누르면 펼쳐진다
  var list = recList(me.id);   // 분류를 가리지 않고 모두
  if (list.length) {
    h += '<div class="racs">' + list.map(function (r) {
      var open = recOpen === r.row;
      var one = String(r.text).split('\n')[0];
      return '<div class="rac' + (open ? ' on' : '') + '">'
        + '<button class="rach" data-ro="' + r.row + '">'
        + '<i>' + (open ? '▾' : '▸') + '</i>'
        + '<span class="racd">' + esc(String(r.at).slice(2, 10)) + '</span>'
        + '<span class="racc">' + esc(r.cat) + '</span>'
        + '<span class="racs1">' + esc(one.slice(0, 60)) + (one.length > 60 ? '…' : '') + '</span>'
        + '<em>' + neisBytes(r.text) + 'B</em></button>'
        + (open
          ? '<div class="racb">'
            + '<textarea class="rta" id="recEdit" data-row="' + r.row + '">' + esc(r.text) + '</textarea>'
            + '<div class="wknav">'
            + '<button class="wkb go" data-rup="' + r.row + '">고쳐 저장</button>'
            + '<span class="rbyte">' + neisBytes(r.text) + ' Byte · ' + r.text.length + '자</span>'
            + '<span class="spacer"></span>'
            + '<button class="wkb" data-rcp="' + r.row + '" title="복사">⧉</button>'
            + '<button class="wkb" data-rdel="' + r.row + '">지우기</button>'
            + '</div>'
            + (r.edited ? '<div class="rsaved">마지막 저장 · ' + esc(r.edited) + '</div>' : '')
            + '</div>'
          : '')
        + '</div>';
    }).join('') + '</div>';
  }

  // ── 새로 쓰는 칸 (지난 기록은 위에 그대로 남는다)
  h += '<div class="rnew">새로 쓰기</div>';
  h += recDateBar();
  h += '<textarea class="rta" id="recText" placeholder="' + esc(recCat) + ' 내용을 적어 주세요">'
    + esc(recDraft || '') + '</textarea>';
  h += '<div class="wknav"><button class="wkb go" id="recSave">저장</button>'
    + '<span class="rbyte">' + neisBytes(recDraft || '') + ' Byte · ' + (recDraft || '').length + '자</span>'
    + '</div>';
  if (recSavedAt) h += '<div class="rsaved">✅ 저장됨 · ' + esc(recSavedAt) + '</div>';
  return h;
}

/* ── 통계 ── */
function recStat() {
  var rs = ((RECDATA && RECDATA.records) || []).filter(function (r) { return r.text; });
  if (!rs.length) return '<div class="empty">아직 쌓인 기록이 없습니다.</div>';

  function clsOf(r) { return (r.grade || 0) + '-' + (r.cls || 0); }

  // ★ 기록이 «있는» 것만 모은다. 열 학급 중 셋만 썼으면 셋만 나온다.
  function tally(list, keyOf, textOf) {
    var seen = {}, out = [];
    list.forEach(function (r) {
      var k = keyOf(r);
      if (!k) return;
      if (!seen[k]) { seen[k] = { v: k, t: textOf(r), n: 0 }; out.push(seen[k]); }
      seen[k].n++;
    });
    return out;
  }
  function chips(list, chosen, key, label, hint) {
    if (!list.length) return '';
    return '<div class="wknav"><span class="slab">' + label + '</span>'
      + '<button class="wkb' + (chosen.length ? '' : ' now') + '" data-sa="' + key + '">전체</button>'
      + list.map(function (v) {
          return '<button class="wkb' + (chosen.indexOf(v.v) >= 0 ? ' now' : '')
            + '" data-s' + key + '="' + esc(v.v) + '">' + esc(v.t)
            + '<em class="scnt">' + v.n + '</em></button>';
        }).join('')
      + (hint ? '<span class="shint">' + esc(hint) + '</span>' : '')
      + '</div>';
  }

  // ── 학급 : 기록이 있는 학급만, 번호 순
  var clsList = tally(rs, clsOf, clsOf).sort(function (a, b) { return a.v.localeCompare(b.v); });
  // ── 분류 : 고른 학급 안에서 실제로 쓰인 것만
  var inCls = rs.filter(function (r) { return !statCls.length || statCls.indexOf(clsOf(r)) >= 0; });
  var catList = tally(inCls, function (r) { return r.cat; }, function (r) { return r.cat; });
  // ── 학생 : 학급·분류로 좁힌 뒤 «기록이 있는 사람»만. 명렬표를 늘어놓지 않는다.
  var inCat = inCls.filter(function (r) { return !statCat.length || statCat.indexOf(r.cat) >= 0; });
  var stuList = tally(inCat, function (r) { return r.id; },
    function (r) { return r.id + ' ' + r.name; })
    .sort(function (a, b) { return String(a.v).localeCompare(String(b.v)); });
  // ── 날짜(달)
  var monList = tally(inCat, function (r) { return String(r.at || '').slice(0, 7); },
    function (r) { return String(r.at || '').slice(0, 7).replace('.', '년 ') + '월'; })
    .sort(function (a, b) { return b.v.localeCompare(a.v); });

  // 학생이 많으면 처음엔 한 줄만 보이고 «더 보기» 로 편다
  var STU_FOLD = 12;
  var stuShow = (statMore || stuList.length <= STU_FOLD) ? stuList : stuList.slice(0, STU_FOLD);

  var h = '<div class="top2">'
    + chips(clsList, statCls, 'l', '학급')
    + chips(catList, statCat, 'c', '분류')
    + chips(stuShow, statStu, 'u', '학생')
    + (stuList.length > STU_FOLD
        ? '<div class="wknav"><span class="slab"></span><button class="wkb" id="stuMore">'
          + (statMore ? '− 접기' : '+ 더 보기 (' + (stuList.length - STU_FOLD) + '명)') + '</button></div>'
        : '')
    + chips(monList, statMon, 'm', '날짜')
    + '</div>';

  var out = inCat.filter(function (r) {
    if (statStu.length && statStu.indexOf(r.id) < 0) return false;
    if (statMon.length && statMon.indexOf(String(r.at).slice(0, 7)) < 0) return false;
    return true;
  });
  var picked = statCls.length || statCat.length || statStu.length || statMon.length;
  h += '<div class="rsum">모두 ' + out.length + '건'
    + (picked ? ' (걸러 봄)' : ' · 학급 ' + clsList.length + '개') + '</div>';
  if (!out.length) return h + '<div class="empty">해당하는 기록이 없습니다.</div>';

  h += out.map(function (r, i) {
    return '<div class="rcard"><div class="rch">' + esc(r.id) + ' ' + esc(r.name)
      + ' · ' + esc(r.cat) + ' · ' + esc(String(r.at).slice(0, 10))
      + '<span class="spacer"></span><span class="rbyte">' + neisBytes(r.text) + ' Byte</span>'
      + '<button class="wkb" data-cp="' + i + '" title="복사">⧉</button></div>'
      + '<div class="rcb" id="rcb-' + i + '">' + esc(r.text) + '</div></div>';
  }).join('');
  return h;
}


/* ── 카테고리 편집 ── */
function recCatsEdit() {
  var list = catEdit || recCats().map(function (c) { return { name: c.name, on: c.on !== false }; });
  var h = '<div class="rhead">카테고리 편집</div>';
  h += list.map(function (c, i) {
    return '<div class="crow">'
      + '<input class="wq" data-ci="' + i + '" value="' + esc(c.name) + '">'
      + '<button class="wkb" data-cu="' + i + '" title="위로">▲</button>'
      + '<button class="wkb" data-cd="' + i + '" title="아래로">▼</button>'
      + '<button class="wkb" data-cx="' + i + '" title="지우기">✕</button></div>';
  }).join('');
  h += '<div class="wknav"><button class="wkb" id="cAdd">+ 추가</button>'
    + '<span class="spacer"></span>'
    + '<button class="wkb go" id="cSave">저장</button>'
    + '<button class="wkb" id="cCancel">그만두기</button></div>';
  return h;
}

function viewRec() {
  if (!REC) return '<div class="empty">준비 중…</div>';
  if (!REC.hasClient || !REC.linked || !REC.sheet || !REC.sheet.id || REC.sheet.trashedAt) {
    return recSetup();
  }
  if (!RECDATA && !recErr) { recLoad(); return '<div class="empty">학생기록을 불러오는 중…</div>'; }
  if (recErr) {
    return '<div class="empty">기록을 읽지 못했습니다.<br><span style="font-size:10.5px">'
      + esc(recErr) + '</span><br><button class="btn" id="recRetry">다시 시도</button></div>';
  }

  var h = '<div class="wknav">'
    + '<button class="wkb' + (recMode === 'write' ? ' now' : '') + '" data-rm="write">쓰기</button>'
    + '<button class="wkb' + (recMode === 'stat' ? ' now' : '') + '" data-rm="stat">통계</button>'
    + '<span class="spacer"></span>' + sheetBtn()
    + fontBtns('rec')
    + '<button class="wkb" id="recReload" title="다시 읽기">⟳</button></div>';

  if (recMode === 'cats') return h + recCatsEdit();
  return h + (recMode === 'stat' ? recStat() : recWrite());
}

function taskBar() {
  if (!TASKS.length) return '';
  var now = Date.now();
  return TASKS.map(function (t) {
    if (t.state === 'busy') {
      return '<div class="task">⏳ <b>' + esc(t.label) + '</b> 받는 중<span class="dots"></span></div>';
    }
    var left = Math.max(0, Math.ceil(((t.at || 0) - now) / 1000));
    return '<div class="task">⏳ <b>' + esc(t.label) + '</b><span class="sp"></span>'
      + '<span class="cnt">' + left + '초</span> 뒤 받아옵니다</div>';
  }).join('');
}

/* 맨 위 제목 줄 — 여기를 잡고 끌면 위젯이 움직인다 */
/* 업데이트 내역 카드 — 무엇이 바뀌었는지 릴리스에 적어 둔 글이 그대로 온다 */
function notesCard() {
  if (!NOTES || !NOTES.text) return '';
  // ★ 깃허브가 내역을 HTML 로 내려준다 — 태그를 걷어내고 글자만 남긴다
  var plain = String(NOTES.text)
    .replace(/<\/(p|div|li|h\d)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ');
  var lines = plain.split('\n').filter(function (t) { return t.trim(); });
  return '<div class="notes"><div class="nh">🆕 v' + esc(NOTES.version) + ' 에서 바뀐 것'
    // 오른쪽에 자리가 넉넉하니 닫기를 크게 — 그리고 닫으면 어떻게 되는지 미리 알린다
    + '<button class="nx" id="notesX" title="이 안내를 닫습니다">✕ 닫기</button></div>'
    + lines.map(function (t) { return '<div class="nl">' + esc(t) + '</div>'; }).join('')
    + '<div class="nfoot">닫으면 이 안내는 <b>다시 나오지 않습니다.</b> '
    + '지난 내역은 <b>설정 → 정보 → «업데이트 내역 보기»</b> 에서 언제든 볼 수 있어요.</div>'
    + '</div>';
}
/* 이름 — 혜원이지는 뒤 두 글자를 색 상자로 준다. 진호알리미는 그대로.
   ★ 위젯 제목 줄과 넓은 창이 같이 쓴다(한 곳에서만 고치도록). */
/* 담아 둔 순서대로 늘어놓는다. 목록에 없는 것(새로 생긴 화면)은 뒤에 붙는다.
   ★ 순서를 담아 두는 곳이 하나뿐이라, 위젯과 넓게 보기가 늘 같은 순서가 된다. */
function inOrder(list, order, keyOf) {
  if (!order || !order.length) return list;
  var rank = {};
  order.forEach(function (k, i) { rank[k] = i; });
  var head = [], tail = [];
  list.forEach(function (x) {
    (rank[keyOf(x)] === undefined ? tail : head).push(x);
  });
  head.sort(function (a, b) { return rank[keyOf(a)] - rank[keyOf(b)]; });
  return head.concat(tail);
}

/* ── 도구 ──────────────────────────────────────────────────
   자주 쓰는 잔일 둘을 한 화면에 모았다.
     · 명렬표 — 학급 고르면 번호·이름을 죽 보여 준다
     · 글자수 세기 — 나이스 기재요령대로 «바이트» 까지 센다 */
var toolTab = 'roster', RS = null, rsBusy = false, rsCls = '';
var cntText = '';
var PH = null, phI = 0, phBusy = false, phSrc = '', phTimer = null;
function rsLoad(force) {
  if (rsBusy) return;
  if (RS && !force) return;
  rsBusy = true;
  widgetAPI.rosterGet().then(function (r) {
    rsBusy = false; RS = r || { students: [], classes: [] }; render();
  }).catch(function (e) {
    rsBusy = false; RS = { students: [], classes: [], error: (e && e.message) || String(e) };
    render();
  });
}
/* 나이스 기재요령(중학교) — 한글 3바이트 · 영문/숫자/기호 1바이트 · 엔터 1바이트.
   ★ 흔히 쓰는 셈틀은 엔터를 2로 세는데 그것은 틀렸다. 과세특 500자 = 1500바이트. */
function neisBytes(s) {
  var n = 0;
  for (var i = 0; i < s.length; i++) {
    var c = s.charCodeAt(i);
    if (c === 10) { n += 1; continue; }        // 엔터
    if (c === 13) continue;                    // 캐리지리턴은 안 센다
    n += (c > 127) ? 3 : 1;
  }
  return n;
}
function viewTools() {
  var h = '<div class="top2"><div class="wknav">'
    + ['roster,명렬표', 'count,글자수 세기', 'photo,사진 액자'].map(function (s) {
        var p = s.split(',');
        return '<button class="wkb' + (toolTab === p[0] ? ' now' : '') + '" data-tool="'
          + p[0] + '">' + p[1] + '</button>';
      }).join('')
    + '<span class="spacer"></span>' + fontBtns('tool')
    + (toolTab === 'roster' ? '<button class="wkb" id="rsGet" title="다시 받기">⟳</button>' : '')
    + '</div></div>';
  if (toolTab === 'count') return h + toolCount();
  if (toolTab === 'photo') return h + toolPhoto();
  return h + toolRoster();
}
function toolRoster() {
  if (!RS) { rsLoad(); return '<div class="empty">명렬표를 불러오는 중…</div>'; }
  // 자료 모양: { classes:[{key:'3-1', students:[{id,no,name}]}], count }
  var cls = RS.classes || [];
  if (RS.error || !cls.length) {
    return '<div class="empty">' + esc(RS.error || '명렬표가 비어 있습니다.') + '<br>'
      + '<button class="btn" id="rsGetBig">지금 받기</button><br>'
      + '<button class="btn" onclick="widgetAPI.openSettings()">설정에서 주소 고치기</button></div>';
  }
  if (!rsCls || !cls.some(function (c) { return c.key === rsCls; })) rsCls = cls[0].key;
  var h = '<div class="wknav"><span class="slab">학급</span>'
    + cls.map(function (c) {
        return '<button class="wkb' + (rsCls === c.key ? ' now' : '') + '" data-rc="'
          + esc(c.key) + '">' + esc(c.key) + '</button>';
      }).join('') + '</div>';
  var one = cls.filter(function (c) { return c.key === rsCls; })[0];
  var mine = (one.students || []).slice()
    .sort(function (a, b) { return (a.no || 0) - (b.no || 0); });
  h += '<div class="rsh">' + esc(rsCls) + ' · ' + mine.length + '명'
    + '<small>모두 ' + (RS.count || 0) + '명</small></div>';
  h += '<div class="rslist">' + mine.map(function (s) {
    return '<div class="rsr"><i>' + (s.no || '') + '</i>'
      + '<b>' + esc(s.name || '') + '</b>'
      + (s.id ? '<u>' + esc(String(s.id)) + '</u>' : '') + '</div>';
  }).join('') + '</div>';
  return h;
}
/* ── 사진 액자 ─────────────────────────────────────────────
   폴더를 고르면 그 안의 사진이 돌아가며 뜬다.
   ★ 목록만 받아 두고 «한 장씩» 읽는다 — 수백 장을 한꺼번에 받으면 창이 굳는다. */
function phLoad(force) {
  if (phBusy) return;
  if (PH && !force) return;
  phBusy = true;
  widgetAPI.photoList().then(function (r) {
    phBusy = false;
    PH = r || { dir: '', files: [], sec: 12 };
    if (phI >= (PH.files || []).length) phI = 0;
    render();
    phShow();
  }).catch(function () { phBusy = false; PH = { dir: '', files: [], sec: 12 }; render(); });
}
/* 지금 차례의 사진을 읽어 화면에 얹는다 */
function phShow() {
  if (!PH || !(PH.files || []).length) return;
  var want = phI;
  widgetAPI.photoRead(want).then(function (p) {
    if (!p || want !== phI) return;
    phSrc = p.data;
    var el = (typeof appEl === 'function' ? appEl() : document.getElementById('app'));
    var img = el && el.querySelector('#phImg');
    if (img) { img.src = p.data; }
    var nm = el && el.querySelector('#phName');
    if (nm) nm.textContent = p.name;
  }).catch(function () {});
}
function phGo(d) {
  if (!PH || !(PH.files || []).length) return;
  var n = PH.files.length;
  phI = ((phI + d) % n + n) % n;
  phSrc = '';
  phShow();
  var el = (typeof appEl === 'function' ? appEl() : document.getElementById('app'));
  var c = el && el.querySelector('#phNo');
  if (c) c.textContent = (phI + 1) + ' / ' + n;
}
/* 저절로 넘기기 — 액자 화면을 보고 있을 때만 돈다 */
function phTick() {
  if (phTimer) { clearInterval(phTimer); phTimer = null; }
  if (VIEW !== 'tool' || toolTab !== 'photo') return;
  var sec = (PH && PH.sec) || 12;
  phTimer = setInterval(function () {
    if (VIEW !== 'tool' || toolTab !== 'photo') { clearInterval(phTimer); phTimer = null; return; }
    phGo(1);
  }, sec * 1000);
}
function toolPhoto() {
  if (!PH) { phLoad(); return '<div class="empty">사진을 찾는 중…</div>'; }
  var files = PH.files || [];
  if (!PH.dir) {
    return '<div class="empty">사진이 든 <b>폴더</b>를 골라 주세요.<br>'
      + '<button class="btn" id="phPick">폴더 고르기</button>'
      + '<div style="margin-top:8px;font-size:10.5px;opacity:.8">'
      + '고른 폴더와 그 아래 한 겹까지 봅니다 (최대 500장).</div></div>';
  }
  if (!files.length) {
    return '<div class="empty">그 폴더에 사진이 없습니다.<br>'
      + '<span style="font-size:10.5px;opacity:.8">' + esc(PH.dir) + '</span><br>'
      + '<button class="btn" id="phPick">다른 폴더 고르기</button></div>';
  }
  return '<div class="ph">'
    + '<div class="phbox"><img id="phImg"'
    + (phSrc ? ' src="' + phSrc + '"' : '') + ' alt=""></div>'
    + '<div class="phbar">'
    + '<button class="wkb" id="phPrev">◀</button>'
    + '<span class="phno" id="phNo">' + (phI + 1) + ' / ' + files.length + '</span>'
    + '<button class="wkb" id="phNext">▶</button>'
    + '<span class="phnm" id="phName"></span>'
    + '<span class="spacer"></span>'
    + '<button class="wkb" id="phPick">폴더 바꾸기</button></div>'
    + '<div class="phdir">' + esc(PH.dir) + ' · ' + files.length + '장 · '
    + ((PH.sec || 12)) + '초마다 넘어감</div>'
    + '</div>';
}

function toolCount() {
  var t = cntText;
  var chars = t.replace(/\r/g, '').length;
  var noSpace = t.replace(/\s/g, '').length;
  var bytes = neisBytes(t);
  var lines = t ? t.replace(/\r/g, '').split('\n').length : 0;
  var pct = Math.min(100, Math.round(bytes / 1500 * 100));
  return '<div class="cnt">'
    + '<textarea id="cntIn" placeholder="여기에 붙여넣으세요">' + esc(t) + '</textarea>'
    + '<div class="cntg">'
    + '<div class="cntb"><b>' + bytes + '</b><span>Byte</span></div>'
    + '<div class="cntb"><b>' + chars + '</b><span>글자</span></div>'
    + '<div class="cntb"><b>' + noSpace + '</b><span>공백 빼고</span></div>'
    + '<div class="cntb"><b>' + lines + '</b><span>줄</span></div>'
    + '</div>'
    + '<div class="cntbar"><i style="width:' + pct + '%;background:' + usgFill(pct) + '"></i></div>'
    + '<div class="cnth">과세특 <b>500자 = 1500Byte</b> 기준 <b>' + pct + '%</b>'
    + (bytes > 1500 ? ' <em class="over">— ' + (bytes - 1500) + 'Byte 넘었습니다</em>' : '') + '</div>'
    + '<div class="cnth dim">나이스 기재요령(중학교) — 한글 3 · 영문/숫자/기호 1 · <b>엔터 1</b> Byte.'
    + ' 흔히 쓰는 셈틀은 엔터를 2로 세는데 그것은 틀립니다.</div>'
    + '</div>';
}

function brandHtml() {
  var n = String(APPNAME || '');
  if (HAS_TT || n.length < 3) return esc(n);
  return '<em class="bchip">' + esc(n.slice(0, 2)) + '</em>' + esc(n.slice(2));
}
/* ── 바로가기 ──────────────────────────────────────────────
   제목과 주소만 담긴 타일. 누르면 «설정에서 고른 브라우저» 로 열린다.
   ★ 그림은 인터넷에서 받아 오지 않는다 — 첫 글자를 동그라미에 넣는다.
     (파비콘을 받아 오면 인터넷이 없을 때 빈칸이 되고, 켤 때마다 느려진다) */
var LINKS = [];
var TERMSTART = '';
var NAVSTYLE = 'both';
var TABORDER = [], DASHORDER = [], DASHOFF = [];
var FEED = null;
/* 이름에서 한 글자 — 한글이면 첫 글자, 영문이면 대문자 한 자 */
function linkLetter(t) {
  var s = String(t || '').replace(/^[\s\[({<]+/, '');
  return s ? s.charAt(0).toUpperCase() : '·';
}
/* 제목마다 늘 같은 색이 나오도록 — 글자값을 더해서 고른다 */
var LINKHUE = ['#5b6ee1', '#e07a3f', '#3fa07a', '#c1508e', '#7a5bd6', '#3f8fc1', '#c9a227'];
function linkColor(t) {
  var s = String(t || ''), n = 0;
  for (var i = 0; i < s.length; i++) n = (n + s.charCodeAt(i)) % 9973;
  return LINKHUE[n % LINKHUE.length];
}
function linkTile(x, key) {
  // 런처에서 온 것은 시트에 적어 둔 그림글자(이모지)를 쓴다
  var ico = x.icon
    ? '<span class="lico emo">' + esc(x.icon) + '</span>'
    : '<span class="lico" style="background:' + linkColor(x.t) + '">'
      + esc(linkLetter(x.t)) + '</span>';
  return '<button class="lnk" data-' + key + '" title="' + esc(x.u) + '">'
    + ico + '<span class="ltx"><b>' + esc(x.t) + '</b>'
    + '<i>' + esc(x.d || linkHost(x.u)) + '</i></span></button>';
}
function linkTiles() {
  if (!LINKS.length) return '';
  return LINKS.map(function (x, i) {
    return linkTile(x, 'lnk="' + i);
  }).join('');
}
/* 런처에서 온 것 — 내가 만든 것과 섞지 않고 따로 묶는다 */
function feedTiles() {
  if (!FEED || !FEED.apps || !FEED.apps.length) return '';
  return FEED.apps.map(function (x, i) {
    return linkTile(x, 'fd="' + i);
  }).join('');
}
/* 주소에서 «어디인지» 만 짧게 보여 준다 */
function linkHost(u) {
  var s = String(u || '').replace(/^https?:\/\//i, '').replace(/^www\./i, '');
  var i = s.indexOf('/');
  return i > 0 ? s.slice(0, i) : s;
}
function viewLinks() {
  var mine = linkTiles(), feed = feedTiles();
  if (!mine && !feed) {
    return '<div class="empty">담아 둔 바로가기가 없습니다.<br>'
      + '<b>설정 → 바로가기</b> 에서 제목과 주소를 넣어 주세요.</div>';
  }
  var h = '';
  if (mine) h += '<div class="lgrp">내 바로가기</div><div class="lnks">' + mine + '</div>';
  if (feed) {
    h += '<div class="lgrp">내 앱 <button class="wkb" id="fdGet" title="다시 읽기">⟳</button>'
      + (FEED.at ? '<small>' + esc(FEED.at) + '</small>' : '') + '</div>'
      + '<div class="lnks">' + feed + '</div>';
  } else if (FEED && FEED.error) {
    h += '<div class="lgrp">내 앱</div><div class="empty">' + esc(FEED.error) + '</div>';
  }
  return h;
}

/* ── 진도표 ────────────────────────────────────────────────
   컴시간이 «몇 교시 · 어느 반 · 무슨 과목» 을 이미 알려 준다.
   사람이 넣을 것은 «이번 시간에 뭘 했나» 한 줄뿐이다.
   차시는 그 학급에 적은 메모의 순번이라 저절로 붙는다.
   ★ 혜원이지에만 있다 — 진호알리미에는 수업진도 대시보드가 따로 있다. */
var NT = null, ntBusy = false, ntErr = '', ntCls = '', ntSaved = {};
var NTDOW = ['일', '월', '화', '수', '목', '금', '토'];
function ntLoad(force) {
  if (ntBusy) return;
  if (NT && !force) return;
  ntBusy = true;
  widgetAPI.noteLoad().then(function (r) {
    ntBusy = false;
    NT = (r && r.notes) || [];
    ntErr = (r && (r.error || (r.noSheet ? 'nosheet' : ''))) || '';
    render();
  }).catch(function (e) {
    ntBusy = false; NT = []; ntErr = (e && e.message) || String(e); render();
  });
}
/* 오늘 내 수업 — 컴시간 교사 시간표에서 오늘 요일만 꺼낸다 */
function ntToday() {
  var d = CM && CM.data;
  if (!d || !d.byTeacher || !d.byTeacher.length) return null;
  var cfg = (CM.config) || {};
  var me = d.byTeacher.filter(function (t) { return t.i === cfg.teacherIdx; })[0]
    || d.byTeacher.filter(function (t) { return t.name === cfg.teacher; })[0];
  if (!me) return null;
  var dow = NTDOW[new Date().getDay()];
  var day = (me.days || []).filter(function (x) { return x.dow === dow; })[0];
  var out = [];
  ((day && day.periods) || []).forEach(function (x) {
    if (x) out.push({ p: x.p, cls: x.grade + '-' + x.cls, subject: x.subject || '' });
  });
  return { name: me.name, i: me.i, dow: dow, list: out };
}
function ntYmd() {
  var d = new Date(), p = function (n) { return String(n).padStart(2, '0'); };
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}
function ntOf(date, p) {
  return (NT || []).filter(function (x) { return x.date === date && x.p === p; })[0] || null;
}
function viewNote() {
  if (!CM) { loadComci(); return '<div class="empty">컴시간 시간표를 불러오는 중…</div>'; }
  if (NT === null) { ntLoad(); }
  var me = ntToday();
  if (!me) {
    return '<div class="empty">먼저 <b>설정 → 컴시간</b> 에서 학교를 고르고<br>'
      + '<b>내 이름</b> 을 골라 주세요.<br>'
      + '<button class="btn" onclick="widgetAPI.openSettings()">설정 열기</button>'
      + '<div style="margin-top:8px;font-size:10.5px;opacity:.8">'
      + '내 시간표가 있어야 «몇 교시 어느 반» 을 저절로 채울 수 있습니다.</div></div>';
  }
  if (ntErr === 'nosheet') {
    return '<div class="empty">메모를 담을 곳이 없습니다.<br>'
      + '<b>설정 → 학생기록</b> 에서 시트를 만들어 주세요.<br>'
      + '<button class="btn" onclick="widgetAPI.openSettings()">설정 열기</button>'
      + '<div style="margin-top:8px;font-size:10.5px;opacity:.8">'
      + '학생기록 시트 안에 「수업메모」 칸이 저절로 생깁니다.</div></div>';
  }
  var today = ntYmd(), now = new Date();
  var h = '<div class="top2"><div class="wknav">'
    + '<span class="wklab" style="text-align:left">' + (now.getMonth() + 1) + '월 '
    + now.getDate() + '일 (' + me.dow + ')<small>' + esc(me.name) + ' 선생님</small></span>'
    + fontBtns('note')
    + '<button class="wkb" id="ntGet" title="다시 읽기">⟳</button></div></div>';
  if (ntErr && ntErr !== 'nosheet') {
    h += '<div class="note hol">' + esc(ntErr) + '</div>';
  }
  if (!me.list.length) {
    h += '<div class="empty">오늘(' + esc(me.dow) + ')은 수업이 없습니다.</div>';
  } else {
    h += '<div class="nts">' + me.list.map(function (x) {
      var had = ntOf(today, x.p);
      var key = today + '_' + x.p;
      var stamped = ntSaved[key] || (had && had.at) || '';
      var fresh = !!ntSaved[key];
      return '<div class="ntr' + (had ? ' done' : '') + '" data-ntc="' + esc(x.cls) + '">'
        + '<div class="ntt"><i>' + x.p + '교시</i>'
        + '<b class="ntcls" data-ntgo="' + esc(x.cls) + '" title="이 학급 지난 기록">'
        + esc(x.cls) + '</b>'
        + '<u>' + esc(x.subject) + '</u>'
        + (had ? '<em>' + had.n + '차시</em>' : '') + '</div>'
        + '<div class="ntw">'
        + '<input class="nti" data-ntp="' + x.p + '" data-ntcls="' + esc(x.cls) + '" '
        + 'data-ntsub="' + esc(x.subject) + '" maxlength="120" '
        + 'placeholder="이번 시간에 한 것 한 줄" value="' + esc((had && had.text) || '') + '">'
        + '<button class="ntb" data-ntsave="' + x.p + '">저장</button></div>'
        + (stamped ? '<div class="ntat">' + (fresh ? '✅ 저장됨 · ' : '마지막 저장 · ')
            + esc(stamped) + '</div>' : '')
        + '</div>';
    }).join('') + '</div>';
  }
  // 학급 하나를 고르면 그 학급 지난 기록 — 이것이 «진도표» 다
  var classes = [];
  (NT || []).forEach(function (x) { if (classes.indexOf(x.cls) < 0) classes.push(x.cls); });
  me.list.forEach(function (x) { if (classes.indexOf(x.cls) < 0) classes.push(x.cls); });
  classes.sort();
  if (classes.length) {
    h += '<div class="wknav ntbar"><span class="slab">지난 기록</span>'
      + classes.map(function (c) {
          return '<button class="wkb' + (ntCls === c ? ' now' : '') + '" data-ntgo="'
            + esc(c) + '">' + esc(c) + '</button>';
        }).join('') + '</div>';
  }
  if (ntCls) {
    var mine = (NT || []).filter(function (x) { return x.cls === ntCls; })
      .sort(function (a, b) { return a.date < b.date ? 1 : (a.date > b.date ? -1 : b.p - a.p); });
    h += mine.length
      ? '<div class="ntl">' + mine.map(function (x) {
          return '<div class="ntlr"><i>' + esc(mdDow(x.date)) + '</i>'
            + '<em>' + x.n + '차시</em>'
            + '<span>' + esc(x.text || '') + '</span></div>';
        }).join('') + '</div>'
      : '<div class="empty">' + esc(ntCls) + ' 은 아직 적은 것이 없습니다.</div>';
  }
  return h;
}


/* ── 진도표 ────────────────────────────────────────────────
   한 주를 «교시 × 요일» 격자로 짜고, 학기 전체를 주차별로 쌓는다.

   재료는 셋 다 이미 있는 것이다 — 새로 받아 오는 자료가 없다.
     · 컴시간 시간표 → 그 요일·교시에 내가 «어느 반» 에 들어가는가
     · 학사일정     → 그 날의 행사, 휴업, 그리고 «학년별 창체 코드»
     · 수업 메모    → 그 시간에 무엇을 했는가

   ★ 차시는 «실제로 수업이 있었던 칸» 만 센다.
     휴업일과 창체(자율·진로·동아리)가 걸린 교시는 세지 않는다 —
     그래서 동아리가 든 주에는 차시가 안 올라간다.
*/
var GDOW = ['월', '화', '수', '목', '금'];
var gAll = false;      // false = 이번 주만 · true = 학기 전체
var gWeekOff = 0;      // 이번 주에서 몇 주 옮겨 보는가
var GRIDW = 25;        // 한 학기 = 25주

/* 휴업으로 볼 만한 말들. 학사일정 글에 이런 말이 있으면 그 날은 수업이 없다. */
var OFFWORD = /휴업|방학|공휴일|개교기념|현충일|광복절|개천절|한글날|성탄|신정|설날|추석|어린이날|부처님|선거|재량/;
function gOff(ev) { return OFFWORD.test(String(ev || '')); }

function ymdOf(dt) {
  var p = function (n) { return String(n).padStart(2, '0'); };
  return dt.getFullYear() + '-' + p(dt.getMonth() + 1) + '-' + p(dt.getDate());
}
/* 그 날이 낀 주의 월요일 */
function monOf(dt) {
  var k = dt.getDay();
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + (k === 0 ? -6 : 1 - k));
}
/* 내 시간표 — 요일별 교시별 { 학급, 학년, 과목 } */
function gMine() {
  var d = CM && CM.data;
  if (!d || !d.byTeacher || !d.byTeacher.length) return null;
  var cfg = (CM.config) || {};
  var me = d.byTeacher.filter(function (t) { return t.i === cfg.teacherIdx; })[0]
    || d.byTeacher.filter(function (t) { return t.name === cfg.teacher; })[0];
  if (!me) return null;
  var by = {}, maxP = 0;
  (me.days || []).forEach(function (day) {
    var one = {};
    ((day && day.periods) || []).forEach(function (x) {
      if (!x) return;
      one[x.p] = { cls: x.grade + '-' + x.cls, g: x.grade, subject: x.subject || '' };
      if (x.p > maxP) maxP = x.p;
    });
    by[day.dow] = one;
  });
  return { name: me.name, by: by, maxP: Math.max(maxP, 6) };
}
/* ── 학사일정 코드 ─────────────────────────────────────────
   학사일정 시트는 교시마다 한 글자씩 적어 둔다. 실제 자료로 확인한 뜻:
     L(1010번)  교과 수업        ← 이것이 «보통» 이다
     G(34번)    동아리활동       (그 날 행사도 «동아리(123)»)
     A(20번)    자율활동         (창체의날)
     CE(7번)    진로활동
     T(19번)    고사             (중간·기말고사 날)
     J(31번)    자치             (모두 금요일 1교시)
     S(3번)     봉사활동
     빈칸       적어 두지 않은 칸 → 컴시간 시간표를 그대로 따른다
   ★ 전에는 «글자가 있으면 창체» 로 보아 L 까지 수업을 막았다.
     그래서 멀쩡한 수업이 죄다 «수업 없음» 이 되었다. */
var CVOC = { L: '', G: '동아리', A: '자율', CE: '진로', T: '고사', J: '자치', S: '봉사' };
function codeName(c) {
  var k = String(c || '').toUpperCase();
  if (!k) return '';
  return CVOC[k] === undefined ? k : CVOC[k];
}
/* 그 교시에 수업을 하는가 — 빈칸이나 L 이면 한다 */
function codeIsLesson(c) { return !codeName(c); }

/* ── 동아리·진로 날 «자리 ↔ 교시» ──────────────────────────
   하루는 1·2·3·4 — 점심 — 5·6·7 이고, 동아리·진로는 늘 오후(뒤 자리)에 한다.
   매번 같은 교시만 빠지지 않게 그 날은 «교시 순서» 를 바꾼다.
     학사일정 글이 «동아리(123)» 이면
       뒤 세 자리 = 동아리 (원래 1·2·3교시 수업은 그 날 없어진다)
       앞 네 자리 = 남은 4·5·6·7 교시를 차례로   → 수업 순서가 4567123 이 된다
   ★ 수업진도 대시보드(server.js 의 seatPlanOfNote) 와 «같은 규칙» 이어야 한다.
     둘이 어긋나면 차시가 갈린다. */
var LASTP = 7;
var SEATACT = [
  { name: '동아리', re: /동아리\s*\(\s*([0-9]+)\s*[,)]/ },
  { name: '진로', re: /진로\s*\(\s*([0-9]+)\s*[,)]/ }
];
/* 괄호 안이 «712, 진로박람회» 처럼 뒤에 글자가 붙기도 한다 — 앞의 숫자만 읽는다 */
function seatPlan(ev) {
  var txt = String(ev || '');
  for (var i = 0; i < SEATACT.length; i++) {
    var m = txt.match(SEATACT[i].re);
    if (!m) continue;
    var digits = (m[1].match(/[1-7]/g) || []).map(Number);
    if (!digits.length || digits.length >= LASTP) continue;
    var head = LASTP - digits.length, rest = [];
    for (var p = 1; p <= LASTP; p++) if (digits.indexOf(p) < 0) rest.push(p);
    var seat2per = {}, clubSeat = {};
    rest.forEach(function (q, k) { seat2per[k + 1] = q; });
    digits.forEach(function (q, k) {
      var seat = head + 1 + k;
      seat2per[seat] = q; clubSeat[seat] = true;
    });
    return { seat2per: seat2per, clubSeat: clubSeat, name: SEATACT[i].name, periods: digits };
  }
  return null;
}

/* 그 날 그 교시의 학년별 코드 — 수업이 아닌 것만 모은다 */
function gCodes(ac, p) {
  if (!ac || !ac.grades) return [];
  var out = [];
  [1, 2, 3].forEach(function (g) {
    var c = ac.grades[g] && ac.grades[g][p - 1];
    var nm = codeName(c);
    if (nm) out.push({ g: g, code: nm });
  });
  return out;
}

/* 학기 전체를 한 번에 훑어 «차시» 까지 매겨 둔다.
   ★ 차시는 앞에서부터 세야 나오는 값이라, 보는 주만 따로 계산할 수 없다. */
function gridBuild() {
  var me = gMine();
  if (!me) return null;
  var start = String(TERMSTART || '').trim();
  if (!start) return { needStart: true };
  var sp = start.split('-');
  var mon0 = monOf(new Date(Number(sp[0]), Number(sp[1]) - 1, Number(sp[2])));
  var notes = {};
  (NT || []).forEach(function (x) { notes[x.date + '_' + x.p] = x; });

  var counts = {}, weeks = [], maxSeat = me.maxP;
  // 학급마다 «못 한 자리» 를 차례로 담아 둔다 → 다음 수업 칸에 하나씩 붙는다
  var skipQ = {};
  function skipPush(cls, cell) { (skipQ[cls] = skipQ[cls] || []).push(cell); }
  function skipTake(cls, iso, seat) {
    var q = skipQ[cls];
    if (!q || !q.length) return;
    q.shift().to = { iso: iso, seat: seat };   // 밀린 칸에 «어디로 갔는지» 를 적어 둔다
  }
  for (var w = 0; w < GRIDW; w++) {
    var days = [];
    for (var k = 0; k < 5; k++) {
      var dt = new Date(mon0.getFullYear(), mon0.getMonth(), mon0.getDate() + w * 7 + k);
      var iso = ymdOf(dt);
      var ac = acDayOf(dt);
      var ev = (ac && ac.event) || '';
      var off = gOff(ev);
      var cells = {};
      // ★ 동아리·진로 날은 «자리 규칙» 이 전부를 정한다 — 학사일정 글자보다 앞선다
      var plan = off ? null : seatPlan(ev);
      var last = plan ? LASTP : me.maxP;
      for (var seat = 1; seat <= last; seat++) {
        var per = plan ? plan.seat2per[seat] : seat;   // 이 자리가 실제 몇 교시인가
        var slot = per ? (me.by[GDOW[k]] || {})[per] : null;
        if (off) { cells[seat] = slot ? { cls: slot.cls, off: true } : null; continue; }
        if (plan && plan.clubSeat[seat]) {
          // 이 자리는 그 활동을 한다. 원래 이 교시에 있던 내 수업은 그 날 없어진다.
          cells[seat] = { act: plan.name, per: per, pushed: slot ? slot.cls : '' };
          if (slot) skipPush(slot.cls, cells[seat]);
          continue;
        }
        var codes = gCodes(ac, seat);
        if (!slot) { cells[seat] = codes.length ? { codes: codes } : null; continue; }
        // ★ 그 교시에 수업을 하는가.
        //   «적어 둔 글자» 가 L 이 아닐 때만 막는다. 빈칸은 막지 않는다 —
        //   우리 시트는 모든 교시를 채워 두지 않는다(1·4 자리가 늘 비어 있는데
        //   거기에도 수업이 있다). 빈칸을 막으면 차시가 통째로 어긋난다.
        var mineCode = codes.filter(function (c) { return c.g === slot.g; })[0];
        if (mineCode) {
          cells[seat] = { cls: slot.cls, none: true, code: mineCode.code, codes: codes };
          skipPush(slot.cls, cells[seat]);
          continue;
        }
        skipTake(slot.cls, iso, seat);   // 밀려 있던 것이 있으면 여기로 왔다고 적는다
        counts[slot.cls] = (counts[slot.cls] || 0) + 1;
        var got = notes[iso + '_' + seat];
        cells[seat] = {
          cls: slot.cls, n: counts[slot.cls], subject: slot.subject,
          text: (got && got.text) || '', codes: plan ? [] : codes,
          at: (got && got.at) || '',
          per: (plan && per !== seat) ? per : 0    // 자리와 교시가 다르면 알려 준다
        };
      }
      if (plan) maxSeat = LASTP;
      days.push({ dt: dt, iso: iso, dow: GDOW[k], event: ev, off: off, cells: cells });
    }
    weeks.push({ no: w + 1, mon: days[0].dt, days: days });
  }
  return { me: me, weeks: weeks, maxP: maxSeat, start: start };
}
/* 오늘이 몇 주차인가 (없으면 1) */
function gThisWeek(G) {
  var t = ymdOf(new Date());
  for (var i = 0; i < G.weeks.length; i++) {
    var d = G.weeks[i].days;
    if (t >= d[0].iso && t <= d[4].iso) return i;
    if (t < d[0].iso) return i;      // 주말이라 그 주에 안 걸리면 다음 주로
  }
  return G.weeks.length - 1;
}

/* 밀린 칸에 붙일 «→ 9/3(목) 2교시로 밀림» 한 줄.
   갈 곳을 못 찾았으면(학기 안에 다음 수업이 없으면) 그냥 «밀림» 만 적는다. */
function gTo(c) {
  if (!c.to) return '<i class="gmove">밀림</i>';
  var p = String(c.to.iso).split('-');
  var dt = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  return '<i class="gmove">→ ' + Number(p[1]) + '/' + Number(p[2])
    + '(' + ['일', '월', '화', '수', '목', '금', '토'][dt.getDay()] + ') '
    + c.to.seat + '교시로 밀림</i>';
}

function gWeekTable(G, wk) {
  var todayIso = ymdOf(new Date());
  var h = '<div class="gw" id="gw' + wk.no + '"'
    + (wk.days.some(function (d) { return d.iso === todayIso; }) ? ' data-gnow="1"' : '') + '>';
  h += '<div class="gwh"><b>' + wk.no + '주차</b>'
    + '<span>' + (wk.days[0].dt.getMonth() + 1) + '/' + wk.days[0].dt.getDate() + '(월)'
    + ' ~ ' + (wk.days[4].dt.getMonth() + 1) + '/' + wk.days[4].dt.getDate() + '(금)</span></div>';
  h += '<table class="gt"><thead><tr><th class="gp">교시</th>'
    + wk.days.map(function (d) {
        return '<th class="' + (d.off ? 'goff' : '') + (d.iso === todayIso ? ' gtdy' : '') + '">'
          + (d.event ? '<i>' + esc(d.event) + '</i>' : '')
          + '<b>' + esc(d.dow) + '요일</b>'
          + '<span>' + (d.dt.getMonth() + 1) + '/' + d.dt.getDate() + '</span>'
          + (d.off ? '<em>휴업</em>' : '') + '</th>';
      }).join('')
    + '</tr></thead><tbody>';
  for (var p = 1; p <= G.maxP; p++) {
    h += '<tr><td class="gp">' + p + '교시</td>';
    wk.days.forEach(function (d) {
      var c = d.cells[p];
      var tdy = (d.iso === todayIso ? ' gtdy' : '');
      if (d.off) { h += '<td class="goff' + tdy + '">휴업</td>'; return; }
      if (!c) { h += '<td class="' + tdy.replace(/^ /, '') + '"></td>'; return; }
      if (c.off) { h += '<td class="goff' + tdy + '">휴업</td>'; return; }
      if (c.act) {
        // 동아리·진로 자리 — 그 바람에 밀린 수업이 어디로 갔는지 함께 알려 준다
        h += '<td class="gact' + tdy + '">'
          + '<u class="gbadge">' + esc(c.act) + '</u>'
          + (c.pushed
            ? '<i class="gpush">' + esc(c.pushed) + ' ' + c.per + '교시</i>' + gTo(c) : '')
          + '</td>';
        return;
      }
      if (c.none) {
        h += '<td class="gnone' + tdy + '"><b>' + esc(c.cls) + '</b>'
          + '<u class="gbadge">' + esc(c.code) + '</u>' + gTo(c) + '</td>';
        return;
      }
      if (!c.cls) {
        // 내 수업은 없지만 그 교시에 «다른 학년» 창체가 있는 칸 — 알려만 준다
        h += '<td class="getc' + tdy + '">'
          + (c.codes || []).map(function (x) { return x.g + ':' + esc(x.code); }).join(' ')
          + '</td>';
        return;
      }
      var cd = (c.codes || []).filter(function (x) { return x.g + '' !== (c.cls.split('-')[0]); });
      // ★ 누르면 그 자리에서 바로 적는다 — 수업과 진도표가 한 화면이다
      h += '<td class="gon' + tdy + '" data-gd="' + esc(d.iso) + '" data-gdow="' + esc(d.dow)
        + '" data-gp="' + p + '" data-gc="' + esc(c.cls) + '" data-gs="' + esc(c.subject || '')
        + '" title="눌러서 적기">'
        + '<span class="ghd"><b>' + esc(c.cls) + '</b><em>' + c.n + '</em></span>'
        + (c.per ? '<i class="gper">' + c.per + '교시</i>' : '')
        + '<u class="gtx' + (c.text ? '' : ' dimtx') + '">' + esc(c.text || '＋ 적기') + '</u>'
        + (cd.length ? '<i>' + cd.map(function (x) { return x.g + ':' + esc(x.code); }).join(' ') + '</i>' : '')
        + '</td>';
    });
    h += '</tr>';
  }
  return h + '</tbody></table></div>';
}

function viewGrid() {
  if (!CM) { loadComci(); return '<div class="empty">컴시간 시간표를 불러오는 중…</div>'; }
  if (!AC) { loadAcademic(); return '<div class="empty">학사일정을 불러오는 중…</div>'; }
  if (NT === null) ntLoad();
  var G = gridBuild();
  if (!G) {
    return '<div class="empty">먼저 <b>설정 → 컴시간</b> 에서 학교와 <b>내 이름</b> 을 골라 주세요.<br>'
      + '<button class="btn" onclick="widgetAPI.openSettings()">설정 열기</button></div>';
  }
  if (G.needStart) {
    return '<div class="empty"><b>개학일</b> 을 넣어 주세요.<br>'
      + '개학한 주가 1주차가 됩니다.<br>'
      + '<button class="btn" onclick="widgetAPI.openSettings()">설정 → 진도표</button></div>';
  }
  var here = gThisWeek(G);
  var h = '<div class="top2"><div class="wknav">'
    + '<button class="wkb' + (gAll ? '' : ' now') + '" data-gv="0">이번 주</button>'
    + '<button class="wkb' + (gAll ? ' now' : '') + '" data-gv="1">전체</button>'
    + (gAll ? '' :
        '<button class="wkb" data-gwk="-1" title="지난 주">◀</button>'
        + '<span class="wklab">' + (here + gWeekOff + 1) + '주차'
        + '<small>' + esc(G.me.name) + ' 선생님</small></span>'
        + '<button class="wkb" data-gwk="1" title="다음 주">▶</button>')
    + '<span class="spacer"></span>'
    + '<button class="wkb go" id="gNow" title="이번 주로">이번주</button>'
    + fontBtns('grid')
    + '<button class="wkb" id="gGet" title="다시 읽기">⟳</button></div></div>';

  if (gAll) {
    h += '<div class="ghint">개학한 주가 <b>1주차</b> 입니다. 학급 옆 작은 숫자는 '
      + '그 학급이 학기 들어 <b>몇 번째 수업</b> 인지입니다. '
      + '칸을 <b>누르면 그 자리에서 적습니다</b>.<br>'
      + '<b>동아리·진로 날</b> 은 교시 순서가 바뀝니다 — 예를 들어 «동아리(123)» 이면 '
      + '수업을 <b>4·5·6·7</b> 교시 차례로 하고 1·2·3교시는 동아리입니다.</div>';
    h += G.weeks.map(function (wk) { return gWeekTable(G, wk); }).join('');
  } else {
    var i = Math.max(0, Math.min(G.weeks.length - 1, here + gWeekOff));
    h += gWeekTable(G, G.weeks[i]);
  }
  return h;
}

function titleBar() {
  // ★ 두 번 누르면 넓게 보기로 — 창 제목 줄에서 흔히 하는 몸짓이다
  return '<div class="tbar" ondblclick="widgetAPI.openEasy()" '
    + 'title="두 번 누르면 넓게 보기">'
    + '<img class="tlogo" src="assets/' + (HAS_TT ? 'logo-jinho.png' : 'logo-hyewon.png') + '" alt="">'
    + '<span class="ttl">' + brandHtml() + '</span>'
    + '<button class="gear" title="설정" onclick="widgetAPI.openSettings()"></button>'
    + '<button class="tclose" title="닫기 — 끄는 것이 아니라 감춥니다.'
    + ' 트레이 아이콘을 누르면 다시 나옵니다" onclick="widgetAPI.hideWidget()">✕</button>'
    + (VER ? '<span class="tver">v' + esc(VER) + '</span>' : '')
    + '<span class="grip" title="여기를 잡고 끌면 위젯이 움직입니다">⠿⠿</span></div>';
}
function updBar() {
  if (!UPD || !UPD.state) return '';
  if (UPD.state === 'ready') {
    return '<button class="upd ready" onclick="widgetAPI.installUpdate()">'
      + '🆕 v' + esc(UPD.version || '') + ' 준비됨 · 눌러서 설치'
      + '</button>';
  }
  if (UPD.state === 'available') {
    return '<div class="upd busy">⬇ 새 버전 v' + esc(UPD.version || '') + ' 내려받는 중…</div>';
  }
  return '';
}

function render() {
  if (composing) return;   // 한글 조합 중에는 화면을 건드리지 않는다
  var app = document.getElementById('app');
  if (!STATE) { app.innerHTML = titleBar() + updBar() + taskBar() + '<div class="empty">불러오는 중…</div>'; return report(); }

  if (STATE.needLogin && HAS_TT) {
    // 구글이 앱 안 브라우저 로그인을 막기 때문에, 크롬을 열어 거기서 로그인하고
    // 결과만 위젯이 넘겨받는다 (main.js 의 startLogin 참고).
    app.innerHTML = titleBar() + updBar() + taskBar() + '<div class="empty">수업진도에 로그인해 주세요.'
      + '<br><button class="btn" onclick="widgetAPI.openLogin()">크롬으로 로그인</button>'
      + '<div style="margin-top:9px;font-size:10.5px;line-height:1.5;color:#6f7885">'
      + '크롬 탭이 열립니다. 거기서 구글 로그인하면<br>'
      + '위젯이 자동으로 이어받아요.</div></div>';
    return report();
  }

  var d = STATE, html = '<div class="top">' + titleBar() + notesCard() + wxCard() + usageBar() + updBar() + taskBar();
  // 혜원 데스크는 수업진도 자료를 안 받으므로 날짜·요일을 스스로 만든다
  var nd = new Date();
  var dText = d.date ? d.date.slice(5).replace('-', '월 ') + '일'
    : pad(nd.getMonth() + 1) + '월 ' + pad(nd.getDate()) + '일';
  var dowText = (d.dow || ['일', '월', '화', '수', '목', '금', '토'][nd.getDay()]) + '요일';
  html += '<div class="head"><span class="date">' + esc(dText) + '</span>'
    + '<span class="dow">' + esc(dowText) + '</span><span class="spacer"></span>'
    + '<button class="ico img" title="넓게 보기 — 사이드바가 있는 큰 창" onclick="widgetAPI.openEasy()">'
    + '<img src="assets/wide.png" alt="넓게 보기"></button>'
    + (HAS_TT ? '<button class="ico" title="주간 시간표 크게 보기" onclick="widgetAPI.openTimetable()">⤢</button>' : '')
    // ★ 혜원 데스크·혜원이지는 수업진도를 안 쓴다. 예전에는 여기서도 refreshNow() 를
    //   불러서 위젯이 통째로 「수업진도에 로그인해 주세요」로 덮였다.
    + (HAS_TT
        ? '<button class="ico" title="지금 새로고침" onclick="widgetAPI.refreshNow()">⟳</button>'
        : '<button class="ico" id="reGet" title="보고 있는 탭을 다시 읽기">⟳</button>')
    + (HAS_TT ? '<button class="ico" title="수업진도 앱 열기(크롬)" onclick="widgetAPI.openApp()">↗</button>' : '')
    + '</div>';

  var noteTxt = d.note || TODAYEV || '';
  if (noteTxt || d.holiday) {
    html += '<div class="note' + (d.holiday ? ' hol' : '') + '">'
      + (d.holiday ? '🚫 휴업일' : '📌 오늘 일정')
      + (noteTxt ? ' · ' + esc(noteTxt) : '') + '</div>';
  }

  // 탭마다 그림 — 넓게 보기의 차림표와 «같은 그림» 을 쓴다
  var NAVIMG = { tt: 'nav-home', work: 'nav-work', comci: 'nav-comci', grid: 'nav-rec',
                 cal: 'nav-cal', meal: 'nav-meal', rec: 'nav-rec', link: 'nav-home' };
  function chipInner(v, label) {
    var img = NAVIMG[v]
      ? '<img src="assets/' + NAVIMG[v] + '.png" alt="">' : '';
    if (NAVSTYLE === 'text' || !img) return esc(label);
    if (NAVSTYLE === 'icon') return img;
    return img + esc(label);
  }
  // 큰 탭 5개. «시간표» 안에서 오늘·이번주·진도를 다시 고른다.
  var TT_SUB = ['today', 'week', 'progress'];
  var tab = TT_SUB.indexOf(VIEW) >= 0 ? 'tt' : VIEW;
  html += '<div class="chips">'
    + inOrder(
        HAS_TT ? ['tt,시간표', 'work,주간업무', 'comci,컴시간', 'cal,학사일정', 'meal,급식', 'rec,학생기록', 'tool,도구', 'link,바로가기']
               : ['work,주간업무', 'comci,컴시간', 'grid,진도표', 'cal,학사일정', 'meal,급식', 'rec,학생기록', 'tool,도구', 'link,바로가기'],
        TABORDER, function (s) { return s.split(',')[0]; }).map(function (s) {
        var p = s.split(',');
        return '<button class="chip nav' + NAVSTYLE + (tab === p[0] ? ' on' : '')
          + '" data-v="' + p[0] + '" title="' + esc(p[1]) + '">' + chipInner(p[0], p[1]) + '</button>';
      }).join('') + '</div>';

  if (tab === 'tt') {
    html += '<div class="chips sub">'
      + ['today,오늘', 'week,이번주', 'progress,진도'].map(function (s) {
          var p = s.split(',');
          return '<button class="chip' + (VIEW === p[0] ? ' on' : '') + '" data-v="' + p[0] + '">' + p[1] + '</button>';
        }).join('') + '</div>';
  }

  html += '</div>';   // 머리 끝 — 여기부터는 스크롤된다
  html += VIEW === 'week' ? viewWeek(d)
    : VIEW === 'progress' ? viewProgress(d)
    : VIEW === 'work' ? viewWork()
    : VIEW === 'comci' ? viewComci()
    : VIEW === 'cal' ? viewAcademic()
    : VIEW === 'meal' ? viewMeals()
    : VIEW === 'rec' ? viewRec()
    : VIEW === 'link' ? viewLinks()
    : VIEW === 'note' ? viewNote()
    : VIEW === 'grid' ? viewGrid()
    : VIEW === 'tool' ? viewTools()
    : viewToday(d);
  html += '<div class="foot">@JINHOKIM</div>';   // 버전은 제목 줄 오른쪽 끝에 있다
  app.style.setProperty('--wf', String(FS[fsKey()] || 1));
  app.innerHTML = html;
  // 두 번째 고정 줄이 머리 «바로 아래»에 붙도록, 머리 높이를 재서 알려 준다.
  // 머리는 업데이트 띠·사용량 띠가 있고 없고에 따라 높이가 달라져서 고정값을 쓸 수 없다.
  // 검색줄·주차 단추·날짜 줄을 머리 안으로 옮겨 «날짜까지» 통째로 고정한다.
  // (따로 두 번째 고정 층으로 두면 머리 높이를 한 픽셀만 잘못 재도 밑으로 숨는다)
  var topEl = app.querySelector('.top');
  var t2 = app.querySelector('.top2');
  if (topEl && t2) topEl.appendChild(t2);
  app.style.setProperty('--toph', (topEl ? topEl.offsetHeight : 46) + 'px');

  wireViews(app);
  report();
}

/* 글자수 — 다시 그리지 않고 숫자만 갈아 끼운다 */
function cntPaint(app) {
  var t = cntText;
  var bytes = neisBytes(t);
  var v = [bytes, t.replace(/\r/g, '').length, t.replace(/\s/g, '').length,
    t ? t.replace(/\r/g, '').split('\n').length : 0];
  app.querySelectorAll('.cntb b').forEach(function (b, i) { b.textContent = v[i]; });
  var pct = Math.min(100, Math.round(bytes / 1500 * 100));
  var bar = app.querySelector('.cntbar i');
  if (bar) { bar.style.width = pct + '%'; bar.style.background = usgFill(pct); }
  var hint = app.querySelector('.cnth');
  if (hint) {
    hint.innerHTML = '과세특 <b>500자 = 1500Byte</b> 기준 <b>' + pct + '%</b>'
      + (bytes > 1500 ? ' <em class="over">— ' + (bytes - 1500) + 'Byte 넘었습니다</em>' : '');
  }
}

/* 격자 칸을 눌러 그 자리에서 적는다.
   엔터로 담고, Esc 로 그만둔다. 딴 데를 눌러도 담긴다. */
function gEdit(td) {
  if (td.querySelector('.gti')) return;
  var u = td.querySelector('.gtx');
  if (!u) return;
  var old = u.classList.contains('dimtx') ? '' : u.textContent;
  var inp = document.createElement('input');
  inp.className = 'gti';
  inp.value = old;
  inp.maxLength = 120;
  u.style.display = 'none';
  td.appendChild(inp);
  inp.focus();
  inp.select();
  var done = false;
  function fin(save) {
    if (done) return;
    var v = inp.value.trim();
    if (!save || v === old) { done = true; inp.remove(); u.style.display = ''; return; }
    done = true;
    inp.disabled = true;
    widgetAPI.noteSave({
      date: td.dataset.gd, dow: td.dataset.gdow, p: Number(td.dataset.gp),
      cls: td.dataset.gc, subject: td.dataset.gs, text: v
    }).then(function (r) {
      if (r && r.ok) { ntLoad(true); }
      else { ntErr = (r && r.error) || '담지 못했습니다'; done = false; inp.disabled = false; render(); }
    }).catch(function (e) {
      ntErr = (e && e.message) || String(e); done = false; inp.disabled = false; render();
    });
  }
  inp.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); fin(true); }
    else if (e.key === 'Escape') { e.preventDefault(); fin(false); }
    e.stopPropagation();
  });
  inp.addEventListener('click', function (e) { e.stopPropagation(); });
  inp.addEventListener('blur', function () { fin(true); });
}

/* 전체 보기에서 «이번주» 를 누르면 그 주 표로 미끄러져 간다.
   25주를 죽 늘어놓았으니 이 단추가 없으면 찾아 내려가야 한다. */
function gGoNow() {
  var el = (typeof appEl === 'function' ? appEl() : document.getElementById('app'));
  if (!el) return;
  var t = el.querySelector('[data-gnow]');
  if (t && t.scrollIntoView) t.scrollIntoView({ block: 'start' });
}

/* 진도표 한 줄 담기 — 담고 나면 저장시각을 그 줄 밑에 보여 준다 */
function ntSave(app, p) {
  var inp = app.querySelector('.nti[data-ntp="' + p + '"]');
  if (!inp) return;
  var btn = app.querySelector('[data-ntsave="' + p + '"]');
  if (btn) { btn.disabled = true; btn.textContent = '담는 중…'; }
  var o = {
    date: ntYmd(), dow: NTDOW[new Date().getDay()], p: Number(p),
    cls: inp.dataset.ntcls, subject: inp.dataset.ntsub, text: inp.value.trim()
  };
  widgetAPI.noteSave(o).then(function (r) {
    if (r && r.ok) {
      ntSaved[o.date + '_' + o.p] = r.at;
      ntErr = '';
      ntLoad(true);            // 담은 것을 다시 읽어 차시까지 맞춘다
    } else {
      ntErr = (r && r.error) || '담지 못했습니다';
      if (btn) { btn.disabled = false; btn.textContent = '저장'; }
      render();
    }
  }).catch(function (e) {
    ntErr = (e && e.message) || String(e);
    if (btn) { btn.disabled = false; btn.textContent = '저장'; }
    render();
  });
}

/* 스크롤을 하면 «지금 보고 있는 달»로 월 단추 표시를 옮긴다 */
var __appEl = document.getElementById('app');
if (__appEl) __appEl.addEventListener('scroll', function () {
  if (acSpyTimer) return;
  acSpyTimer = setTimeout(function () { acSpyTimer = null; acSpyScroll(); }, 90);
}, { passive: true });
var acSpyTimer = null;

/* 내용 높이를 알려주면 메인이 카드 높이를 맞춰준다 */
/* 카테고리 편집 화면에 적힌 것을 그대로 읽어 온다 */
function readCatEdit(app) {
  var out = [];
  app.querySelectorAll('input[data-ci]').forEach(function (el) {
    out.push({ name: String(el.value || '').trim(), on: true });
  });
  return out.length ? out : (catEdit || []);
}

function report() {
  requestAnimationFrame(function () {
    var app = appEl();
    if (app) widgetAPI.reportHeight(app.scrollHeight + 4);
  });
}

// 설정에서 컴시간을 바꾸거나 다시 불러오면, 들고 있던 자료를 버리고 새로 읽는다
widgetAPI.onTasks(function (list) { TASKS = list || []; render(); });
setInterval(function () { if (TASKS.some(function (t) { return t.state === 'wait'; })) render(); }, 1000);
widgetAPI.onComciChanged(function () { CM = null; if (VIEW === 'comci') render(); });
widgetAPI.onWorkChanged(function () { WORK = null; if (VIEW === 'work') render(); });
widgetAPI.onAcademicChanged(function () { AC = null; if (VIEW === 'cal') render(); });
widgetAPI.onMealsChanged(function () { ML = null; if (VIEW === 'meal') render(); });

widgetAPI.onData(function (p) {
  if (p.flavor) FLAVOR = p.flavor;
  STATE = p.data;
  // 혜원이지는 대시보드라는 «위젯에 없는» 화면이 있어서, 보던 화면을 스스로 챙긴다
  if (!IS_EASY) VIEW = p.view || VIEW;
  VER = p.version || '';
  UPD = p.update || null;
  LINKS = p.links || [];
  TERMSTART = p.termStart || '';
  NAVSTYLE = p.navStyle || 'both';
  TABORDER = p.tabOrder || [];
  DASHORDER = p.dashOrder || [];
  DASHOFF = p.dashOff || [];
  FEED = (p.feed && p.feed.show && p.feed.data) ? p.feed.data : null;
  if (p.font && p.font !== FONT) {
    FONT = p.font;
    if (FONT === 'pretendard') delete document.documentElement.dataset.font;
    else document.documentElement.dataset.font = FONT;
  }
  if (p.fontScale) FS = Object.assign(FS, p.fontScale);
  // 껐다 켜도 마지막으로 보던 학급이 그대로이게
  if (p.comciPick && !cmPicked) {
    cmGrade = p.comciPick.grade; cmCls = p.comciPick.cls; cmPicked = true;
  }
  if (p.todayEvent !== undefined) TODAYEV = p.todayEvent;
  if (p.notes !== undefined) NOTES = p.notes;
  if (p.rec) {
    var wasSheet = REC && REC.sheet && REC.sheet.id;
    REC = p.rec;
    // 시트가 바뀌었으면 들고 있던 기록은 버린다
    if ((REC.sheet && REC.sheet.id) !== wasSheet) RECDATA = null;
  }
  if (p.flavor) {
    HAS_TT = FLAVOR === 'jinho';
    APPNAME = p.appName || (HAS_TT ? '진호알리미' : '혜원이지');
    if (!HAS_TT && ['today', 'week', 'progress'].indexOf(VIEW) >= 0) VIEW = IS_EASY ? 'home' : 'work';
  }
  if (p.easyFav) EASYFAV = p.easyFav;
  if (p.comciSide) cmSide = p.comciSide === 'row' ? 'row' : 'col';
  if (p.sys) {
    SYSSHOW = !!p.sys.show;
    SYS = p.sys.data || null;
  }
  if (p.wx) {
    WXSHOW = p.wx.show !== false;
    WXSPOT = (p.wx.spot && p.wx.spot.name) || '';
    if (p.wx.data) WX = p.wx.data;
  }
  if (p.grade) {
    gpSheets = p.grade.sheets || {};
    if (!gpTouched) {
      gpOn = (p.grade.on || []).map(Number).filter(function (g) { return g >= 1 && g <= 3; });
      gpOn.forEach(function (g) { if (!GPD[g]) gpLoad(g, false); });
    }
  }
  if (p.usage) {
    USG = p.usage.data || null;
    USGSHOW = p.usage.show !== false;
    USGON = p.usage.on || [];
    USGSTYLE = p.usage.style === 'bar' ? 'bar' : 'ring';
  }
  if (p.theme !== undefined && p.theme !== THEME) {
    THEME = p.theme || '';
    if (THEME) document.documentElement.dataset.theme = THEME;
    else delete document.documentElement.dataset.theme;
  }
  if (!IS_EASY && p.scale && p.scale !== SCALE) {
    SCALE = p.scale;
    document.body.style.zoom = SCALE;
  }
  if (VIEW === 'week' && STATE && STATE.ready) { WK = null; loadWeek(WEEKOFF); }
  // 창 제목 — 세 갈래가 각자 제 이름을 단다 (html 의 <title> 은 갈래를 모른다)
  var want = APPNAME + (IS_EASY ? ' — 넓게 보기' : '');
  if (APPNAME && document.title !== want) document.title = want;
  render();
});

// 남은 시간·지금 수업 표시는 30초마다 다시 그린다 (자료는 그대로, 시계만 흐른다).
// 사용량의 «몇 분 남음»도 같이 줄어들어야 해서, 사용량 띠가 보이면 늘 다시 그린다.
setInterval(function () {
  if (!STATE || STATE.needLogin) return;
  if (VIEW === 'today' || (USGSHOW && USG)) render();
}, 30 * 1000);

// 날짜가 바뀌면(자정을 넘기면) 오늘 표시가 어제에 머물지 않도록 자료를 새로 읽는다
var lastDay = new Date().getDate();
setInterval(function () {
  var d = new Date().getDate();
  if (d === lastDay) return;
  lastDay = d;
  WK = null; ML = null; acScrolled = false;
  widgetAPI.refreshNow();
  render();
}, 60 * 1000);


/* ── 화면 안의 단추·입력칸 연결 ──
   위젯(#app)과 혜원이지(#main)가 «같은 연결»을 쓴다. 화면 조각이 같으니
   단추도 같아야 한다 — 한 군데만 고치면 두 프로그램이 같이 고쳐진다. */
function wireViews(app) {
  // 진도표 격자 — 이번 주 / 전체 · 주 넘기기 · 이번주로
  app.querySelectorAll('[data-gv]').forEach(function (b) {
    b.addEventListener('click', function () {
      gAll = b.dataset.gv === '1'; gWeekOff = 0; render();
      if (gAll) setTimeout(gGoNow, 60);   // 전체로 바꾸면 이번 주가 보이게
    });
  });
  app.querySelectorAll('[data-gwk]').forEach(function (b) {
    b.addEventListener('click', function () {
      gWeekOff += Number(b.dataset.gwk) || 0; render();
    });
  });
  var gn = app.querySelector('#gNow');
  if (gn) gn.addEventListener('click', function () {
    gWeekOff = 0;
    if (gAll) gGoNow(); else render();
  });
  var gg = app.querySelector('#gGet');
  if (gg) gg.addEventListener('click', function () { ntLoad(true); });
  app.querySelectorAll('td.gon').forEach(function (td) {
    td.addEventListener('click', function () { gEdit(td); });
  });
  // 진도표 — 저장·다시 읽기·학급 고르기
  var ntg = app.querySelector('#ntGet');
  if (ntg) ntg.addEventListener('click', function () { ntLoad(true); });
  app.querySelectorAll('[data-ntgo]').forEach(function (b) {
    b.addEventListener('click', function () {
      ntCls = (ntCls === b.dataset.ntgo) ? '' : b.dataset.ntgo;
      render();
    });
  });
  app.querySelectorAll('[data-ntsave]').forEach(function (b) {
    b.addEventListener('click', function () { ntSave(app, b.dataset.ntsave); });
  });
  app.querySelectorAll('.nti').forEach(function (i) {
    // 엔터로도 담기게 — 수업 끝나고 빨리 적는 자리다
    i.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') ntSave(app, i.dataset.ntp);
    });
  });
  // 바로가기 — 설정에서 고른 브라우저로 연다
  app.querySelectorAll('[data-lnk]').forEach(function (b) {
    b.addEventListener('click', function () {
      var x = LINKS[Number(b.dataset.lnk)];
      if (x && x.u) widgetAPI.openUrl(x.u);
    });
  });
  app.querySelectorAll('[data-fd]').forEach(function (b) {
    b.addEventListener('click', function () {
      var x = (FEED && FEED.apps) ? FEED.apps[Number(b.dataset.fd)] : null;
      if (x && x.u) widgetAPI.openUrl(x.u);
    });
  });
  var fdb = app.querySelector('#fdGet');
  if (fdb) fdb.addEventListener('click', function () {
    fdb.textContent = '…'; widgetAPI.feedRefresh();
  });
  // ★ .rach 도 함께 훑는다 — 학생기록 아코디언의 «머리» 단추다.
  //   .wkb 만 훑던 때에는 눌러도 아무 일이 없어서 «펼쳐지지 않는다» 였다.
  app.querySelectorAll('.wkb, .rach, .gph').forEach(function (b) {
    b.addEventListener('click', function () {
      if (b.dataset.off !== undefined) { WK = null; loadWeek(Number(b.dataset.off)); return; }
      if (b.dataset.doc) { workDoc = b.dataset.doc; workOff = 0; render(); return; }
      if (b.dataset.woff !== undefined) { workOff = Number(b.dataset.woff); followHit = false; render(); return; }
      if (b.id === 'workPrint') {
        var p = workPrintHtml();
        if (!p) return;
        b.disabled = true;
        widgetAPI.printWork(p).then(function () { b.disabled = false; })
          .catch(function () { b.disabled = false; });
        return;
      }
      if (b.id === 'workGet') { WORK = null; workBusy = true; render();
        widgetAPI.workFetch().then(function (d) { workBusy = false; WORK = d || { empty: true }; render(); });
        return; }
      if (b.id === 'cmGet') { widgetAPI.openSettings(); return; }
      // 학생기록
      if (b.dataset.rm) { recMode = b.dataset.rm; render(); return; }
      if (b.dataset.rc) { recCls = b.dataset.rc; recSid = ''; recDraft = ''; recSavedAt = ''; render(); return; }
      if (b.dataset.rk) { recCat = b.dataset.rk; recDraft = ''; recSavedAt = ''; render(); return; }
      if (b.dataset.rw) {          // 기록한 날 고르기
        var ta0 = app.querySelector('#recText');
        if (ta0) recDraft = ta0.value;      // 쓰던 글을 지키고 다시 그린다
        recWhen = b.dataset.rw;
        render(); return;
      }
      if (b.dataset.gp) {                        // 학년부 세부사항 펼치기·접기
        gpOpen = (gpOpen === b.dataset.gp) ? '' : b.dataset.gp;
        render(); return;
      }
      if (b.dataset.ro !== undefined) {          // 타일 펼치기·접기
        var row = Number(b.dataset.ro);
        recOpen = (recOpen === row) ? 0 : row;
        render(); return;
      }
      if (b.dataset.rup !== undefined) {         // 펼친 것을 고쳐 저장
        var te = app.querySelector('#recEdit');
        if (!te) return;
        recBusy = true;
        widgetAPI.recSave({ student: {}, cat: recCat, text: te.value, row: Number(b.dataset.rup) })
          .then(function (r) {
            recBusy = false; recSavedAt = (r && r.at) || ''; RECDATA = null; recLoad(true);
          })
          .catch(function (e) { recBusy = false; recErr = (e && e.message) || String(e); render(); });
        return;
      }
      if (b.dataset.rcp !== undefined) {         // 나이스에 붙여넣기용 복사
        var te2 = app.querySelector('#recEdit');
        if (te2) { navigator.clipboard.writeText(te2.value); b.textContent = '✓'; }
        return;
      }
      if (b.dataset.rdel !== undefined) {
        if (!confirm('이 기록을 지울까요?')) return;
        widgetAPI.recClear(Number(b.dataset.rdel)).then(function () {
          recOpen = 0; RECDATA = null; recLoad(true);
        });
        return;
      }
      if (b.id === 'recCatEdit') { catEdit = null; recMode = 'cats'; render(); return; }
      if (b.id === 'recReload') { RECDATA = null; recLoad(true); return; }
      if (b.id === 'recRetry') { recErr = ''; RECDATA = null; recLoad(true); return; }
      if (b.id === 'recAt') {
        var u = (app.querySelector('#recUrl') || {}).value || '';
        widgetAPI.recAttach(u).then(function (st) { REC = st; RECDATA = null; render(); });
        return;
      }
      if (b.dataset.sa !== undefined) {          // 통계 «전체»
        if (b.dataset.sa === 'u') statStu = [];
        if (b.dataset.sa === 'c') statCat = [];
        if (b.dataset.sa === 'm') statMon = [];
        if (b.dataset.sa === 'l') { statCls = []; statStu = []; }
        render(); return;
      }
      if (b.dataset.sl) {
        var k2 = statCls.indexOf(b.dataset.sl);
        if (k2 >= 0) statCls.splice(k2, 1); else statCls.push(b.dataset.sl);
        statStu = [];            // 학급이 바뀌면 학생 고름은 뜻을 잃는다
        statMore = false;
        render(); return;
      }
      if (b.id === 'stuMore') { statMore = !statMore; render(); return; }
      if (b.dataset.su || b.dataset.sc || b.dataset.sm) {
        var arr = b.dataset.su ? statStu : (b.dataset.sc ? statCat : statMon);
        var v = b.dataset.su || b.dataset.sc || b.dataset.sm;
        var k = arr.indexOf(v);
        if (k >= 0) arr.splice(k, 1); else arr.push(v);
        render(); return;
      }
      if (b.dataset.cp !== undefined) {          // 통계 — 내용 복사
        var el = document.getElementById('rcb-' + b.dataset.cp);
        if (el) { navigator.clipboard.writeText(el.textContent || ''); b.textContent = '✓'; }
        return;
      }
      if (b.dataset.cu !== undefined || b.dataset.cd !== undefined || b.dataset.cx !== undefined) {
        catEdit = readCatEdit(app);
        var i = Number(b.dataset.cu !== undefined ? b.dataset.cu
          : (b.dataset.cd !== undefined ? b.dataset.cd : b.dataset.cx));
        if (b.dataset.cx !== undefined) catEdit.splice(i, 1);
        else {
          var j = b.dataset.cu !== undefined ? i - 1 : i + 1;
          if (j >= 0 && j < catEdit.length) {
            var tmp = catEdit[i]; catEdit[i] = catEdit[j]; catEdit[j] = tmp;
          }
        }
        render(); return;
      }
      if (b.id === 'cAdd') { catEdit = readCatEdit(app).concat([{ name: '새 항목', on: true }]); render(); return; }
      if (b.id === 'cCancel') { catEdit = null; recMode = 'write'; render(); return; }
      if (b.id === 'cSave') {
        var list = readCatEdit(app).filter(function (c) { return c.name; });
        recBusy = true; render();
        widgetAPI.recCats(list).then(function () {
          catEdit = null; recMode = 'write'; recBusy = false; RECDATA = null; recLoad(true);
        }).catch(function (e) { recBusy = false; recErr = (e && e.message) || String(e); render(); });
        return;
      }
      if (b.id === 'recSave') {
        var ta = app.querySelector('#recText');
        var txt = ta ? ta.value : '';
        var studs = recStudents();
        var me = studs.filter(function (x) { return x.id === recSid; })[0];
        if (!me || !txt.trim()) return;
        recBusy = true;
        // 늘 «새 줄»로 쌓는다 — 지난 기록은 위쪽 아코디언에 그대로 남는다
        widgetAPI.recSave({ student: me, cat: recCat, text: txt, row: 0, when: recWhen })
          .then(function (r) {
            recBusy = false; recSavedAt = (r && r.at) || ''; recDraft = '';
            recWhen = '';                    // 다음 기록이 엉뚱한 날로 가지 않게 되돌린다
            RECDATA = null; recLoad(true);
          })
          .catch(function (e) { recBusy = false; recErr = (e && e.message) || String(e); render(); });
        return;
      }
      if (b.id === 'recDel') {
        var cur2 = recFind(recSid, recCat);
        if (!cur2) return;
        if (!confirm('이 기록을 지울까요?\n\n' + recCat + ' — ' + recSid)) return;
        widgetAPI.recClear(cur2.row).then(function () { recDraft = ''; RECDATA = null; recLoad(true); });
        return;
      }
      if (b.dataset.fs) {
        var fp = b.dataset.fs.split(',');
        bumpFont(fp[0], Number(fp[1]));
        return;
      }
      if (b.dataset.ml !== undefined) {
        mlBusy = true; render();
        widgetAPI.mealsFetch(Number(b.dataset.ml)).then(function (d) {
          mlBusy = false; ML = d || { empty: true }; render();
        });
        return;
      }
      if (b.id === 'wkNext') { moveHit(1); return; }
      if (b.id === 'wkPrev') { moveHit(-1); return; }
      if (b.dataset.cm) { cmMode = b.dataset.cm; render(); return; }
      if (b.dataset.gs) {                       // 학년 스위치 켜고 끄기
        var g = Number(b.dataset.gs);
        var k = gpOn.indexOf(g);
        if (k >= 0) gpOn.splice(k, 1); else gpOn.push(g);
        gpOn.sort();
        gpTouched = true; gpOpen = '';
        widgetAPI.setUi({ gradeOn: gpOn });
        if (k < 0 && !GPD[g]) gpLoad(g, false);
        render(); return;
      }
      if (b.dataset.ga) { gpCat = []; render(); return; }
      if (b.dataset.gc) {                       // 구분 고르기
        var gk = gpCat.indexOf(b.dataset.gc);
        if (gk >= 0) gpCat.splice(gk, 1); else gpCat.push(b.dataset.gc);
        render(); return;
      }
      if (b.dataset.cs) {
        cmSide = b.dataset.cs === 'row' ? 'row' : 'col';
        widgetAPI.setUi({ comciSide: cmSide });
        render(); return;
      }
      if (b.dataset.cg) {
        cmGrade = Number(b.dataset.cg); cmCls = 1;
        widgetAPI.setComciPick({ grade: cmGrade, cls: cmCls });   // 마지막으로 본 반을 기억
        render(); return;
      }
      if (b.dataset.cc) {
        cmCls = Number(b.dataset.cc);
        widgetAPI.setComciPick({ grade: cmGrade, cls: cmCls });
        render(); return;
      }
    });
  });
  var wq = app.querySelector('.wq');
  if (wq) {
    // ★한글은 여러 번의 입력이 모여 한 글자가 된다(조합). 그 도중에 화면을 다시 그리면
    //   입력칸이 통째로 새로 만들어져서 «ㅊㅊㅐㅐㄹㄹ» 처럼 깨진다.
    //   그래서 조합 중에는 그리지 않고, 조합이 끝난 뒤 잠깐 기다렸다가 그린다.
    wq.addEventListener('compositionstart', function () { composing = true; });
    wq.addEventListener('compositionend', function () {
      composing = false; workQ = wq.value.trim(); workOff = 0; workHitIdx = 0; followHit = true; laterRender();
    });
    wq.addEventListener('input', function () {
      if (composing) return;
      workQ = wq.value.trim(); workOff = 0; workHitIdx = 0; followHit = true; laterRender();
    });
    wq.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      moveHit(e.shiftKey ? -1 : 1);
    });
    if (workQ) { wq.focus(); wq.setSelectionRange(wq.value.length, wq.value.length); }
  }

  app.querySelectorAll('.chip').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = b.dataset.v;
      if (v === 'tt') v = (['today', 'week', 'progress'].indexOf(LASTTT) >= 0) ? LASTTT : 'today';
      if (['today', 'week', 'progress'].indexOf(v) >= 0) LASTTT = v;
      VIEW = v;
      widgetAPI.setView(VIEW);
      render();
    });
  });
  var acB = app.querySelector('#acGet') || app.querySelector('#acGetBig');
  if (acB) acB.addEventListener('click', function () {
    acBusy = true; AC = { months: [], error: '' }; render();
    widgetAPI.academicFetch().then(function (d) { acBusy = false; AC = d || { empty: true }; render(); });
  });
  var mlB = app.querySelector('#mlGet') || app.querySelector('#mlGetBig');
  if (mlB) mlB.addEventListener('click', function () {
    mlBusy = true; render();
    widgetAPI.mealsFetch().then(function (d) { mlBusy = false; ML = d || { empty: true }; render(); });
  });
  // 월 단추 — 그 달 자리로 데려간다
  app.querySelectorAll('[data-ac]').forEach(function (b) {
    b.addEventListener('click', function () {
      scrollToEl(document.getElementById('acm-' + b.dataset.ac), 2);
    });
  });
  // 도구 — 명렬표·글자수
  app.querySelectorAll('[data-tool]').forEach(function (b) {
    b.addEventListener('click', function () { toolTab = b.dataset.tool; render(); });
  });
  app.querySelectorAll('[data-rc]').forEach(function (b) {
    b.addEventListener('click', function () { rsCls = b.dataset.rc; render(); });
  });
  var rsb = app.querySelector('#rsGet') || app.querySelector('#rsGetBig');
  if (rsb) rsb.addEventListener('click', function () { RS = null; rsLoad(true); });
  // 사진 액자
  var pk = app.querySelector('#phPick');
  if (pk) pk.addEventListener('click', function () {
    widgetAPI.photoPick().then(function () { PH = null; phI = 0; phSrc = ''; phLoad(true); });
  });
  var pp = app.querySelector('#phPrev');
  if (pp) pp.addEventListener('click', function () { phGo(-1); phTick(); });
  var pn = app.querySelector('#phNext');
  if (pn) pn.addEventListener('click', function () { phGo(1); phTick(); });
  if (app.querySelector('#phImg')) { phTick(); if (!phSrc) phShow(); }
  var ci = app.querySelector('#cntIn');
  if (ci) {
    // ★ 한 자 칠 때마다 다시 그리면 한글 조합이 깨진다 — 값만 담고 숫자만 고친다
    ci.addEventListener('input', function () { cntText = ci.value; cntPaint(app); });
    ci.addEventListener('blur', function () { cntText = ci.value; });
  }
  var gpb2 = app.querySelector('#gpGet2');
  if (gpb2) gpb2.addEventListener('click', function () {
    gpOn.forEach(function (g) { GPD[g] = null; gpErr[g] = ''; gpLoad(g, true); });
  });
  var gge = app.querySelector('#gpGet');
  if (gge) gge.addEventListener('click', function () {
    gpOn.forEach(function (g) { GPD[g] = null; gpLoad(g, true); });
    render();
  });
  var acY = app.querySelector('#acYrs');
  if (acY) acY.addEventListener('click', function () {
    acAllYears = !acAllYears; acSpy = ''; acScrolled = false; render();
  });
  var acT = app.querySelector('#acToday');
  if (acT) acT.addEventListener('click', goToday);

  // AI 사용량 — 로그인·모양 고르기·다시 읽기
  app.querySelectorAll('[data-usglogin]').forEach(function (b) {
    b.addEventListener('click', function () { widgetAPI.usageLogin(b.dataset.usglogin); });
  });
  app.querySelectorAll('[data-usgstyle]').forEach(function (b) {
    b.addEventListener('click', function () {
      USGSTYLE = b.dataset.usgstyle; widgetAPI.setUsageStyle(USGSTYLE); render();
    });
  });
  app.querySelectorAll('[data-rs]').forEach(function (b) {
    b.addEventListener('click', function () {
      recSid = b.dataset.rs; recDraft = ''; recSavedAt = ''; render();
    });
  });
  var rin = app.querySelector('#recIn');
  if (rin) rin.addEventListener('click', function () {
    rin.textContent = '크롬에서 허용해 주세요…';
    recErr = '';
    widgetAPI.recSignIn().then(function (st) { REC = st; recErr = ''; render(); })
      .catch(function (e) { recErr = (e && e.message) || String(e); render(); });
  });
  var rpm = app.querySelector('#recPerm');
  if (rpm) rpm.addEventListener('click', function () {
    widgetAPI.openUrl('https://myaccount.google.com/permissions');
    rpm.textContent = '크롬에서 «혜원데스크2026» 을 지워 주세요';
  });
  var rin2 = app.querySelector('#recIn2');
  if (rin2) rin2.addEventListener('click', function () {
    rin2.textContent = '크롬에서 허용해 주세요…';
    recErr = '';
    widgetAPI.recSignIn().then(function (st) { REC = st; recErr = ''; render(); })
      .catch(function (e) { recErr = (e && e.message) || String(e); render(); });
  });
  var rnew = app.querySelector('#recNew');
  if (rnew) rnew.addEventListener('click', function () {
    rnew.textContent = recFound ? '이어 붙이는 중…' : '만드는 중…';
    rnew.disabled = true;
    recErr = '';
    widgetAPI.recCreate().then(function (st) { REC = st; RECDATA = null; render(); })
      // 구글이 돌려준 말을 그대로 보여준다 — 무엇이 막혔는지 알아야 고칠 수 있다
      .catch(function (e) { recErr = (e && e.message) || String(e); render(); });
  });
  var rro = app.querySelector('#recRoster');
  if (rro) rro.addEventListener('click', function () {
    rro.textContent = '받는 중…';
    widgetAPI.rosterFetch().then(function () { widgetAPI.recState().then(function (st) { REC = st; render(); }); });
  });
  var rte = app.querySelector('#recEdit');
  if (rte) {
    rte.addEventListener('keyup', function () {
      var by = rte.parentNode.querySelector('.rbyte');
      if (by) by.textContent = neisBytes(rte.value) + ' Byte · ' + rte.value.length + '자';
    });
  }
  var rwd = app.querySelector('#recWhenIn');
  if (rwd) rwd.addEventListener('change', function () {
    var v = String(rwd.value || '').replace(/-/g, '.');
    if (!/^\d{4}\.\d{2}\.\d{2}$/.test(v)) return;
    var ta1 = app.querySelector('#recText');
    if (ta1) recDraft = ta1.value;
    recWhen = v;
    render();
  });
  var rta = app.querySelector('#recText');
  if (rta) {
    rta.addEventListener('input', function () { recDraft = rta.value; });
    // 글자 수만 다시 그린다 (통째로 그리면 쓰던 글이 튄다)
    rta.addEventListener('keyup', function () {
      var by = app.querySelector('.rbyte');
      if (by) by.textContent = neisBytes(rta.value) + ' Byte · ' + rta.value.length + '자';
    });
  }
  app.querySelectorAll('.wlink').forEach(function (a) {
    a.addEventListener('click', function () { widgetAPI.openUrl(a.dataset.url); });
  });
  var nx = app.querySelector('#notesX');
  if (nx) nx.addEventListener('click', function () { NOTES = null; widgetAPI.notesSeen(); render(); });
  // ⟳ — 보고 있는 탭의 자료를 다시 받는다 (혜원 데스크·혜원이지)
  var reB = app.querySelector('#reGet');
  if (reB) reB.addEventListener('click', function () {
    reB.textContent = '…';
    if (VIEW === 'work') {
      WORK = null; workBusy = true; render();
      widgetAPI.workFetch().then(function (d) { workBusy = false; WORK = d || { empty: true }; render(); });
    } else if (VIEW === 'cal') {
      acBusy = true; AC = { months: [], error: '' }; render();
      widgetAPI.academicFetch().then(function (d) { acBusy = false; AC = d || { empty: true }; render(); });
    } else if (VIEW === 'meal') {
      mlBusy = true; render();
      widgetAPI.mealsFetch().then(function (d) { mlBusy = false; ML = d || { empty: true }; render(); });
    } else if (VIEW === 'comci') {
      cmBusy = true; render();
      widgetAPI.comciFetch().then(function (d) { cmBusy = false; CM = d || null; render(); });
    } else if (VIEW === 'rec') {
      RECDATA = null; recLoad(true);
    } else { render(); }
  });
  var wxg = app.querySelector('#wxGet');
  if (wxg) wxg.addEventListener('click', function () {
    wxg.classList.add('busy');
    widgetAPI.wxRefresh().then(function (d) { if (d) WX = d; render(); })
      .catch(function () { render(); });
  });
  var ug = app.querySelector('#usgGet');
  if (ug) ug.addEventListener('click', function () { widgetAPI.usageRefresh(); });

  // 찾은 자리로 데려간다
  if (wantScrollHit) {
    wantScrollHit = false;
    var hit = document.getElementById('hit-' + workHitIdx);
    if (hit && hit.scrollIntoView) hit.scrollIntoView({ block: 'center' });
  }
  // 학사일정을 처음 열면 오늘 자리에서 시작한다
  if (VIEW === 'cal' && !acScrolled) {
    if (goToday()) acScrolled = true;
  }
  if (VIEW !== 'cal') acScrolled = false;
}
