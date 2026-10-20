/* 파일명: chat.js | @version 1.0.0 — 지비스 «Claude 채팅» 화면(지비스 전용)
   왼쪽 세션 목록 + 오른쪽 대화. 대화·첨부·허용 묻기·원격 제어 모두 이 PC 의 `claude` 가 하고, 이 파일은 보여 주고 전달할 뿐이다(claudechat.js).
   ★ alert·confirm·prompt·<select> 를 쓰지 않는다 — 확인은 화면 안 대화상자로. */
(function () {
  var API = window.widgetAPI;
  var S = { sessions: [], running: [], workDir: '', q: '', folder: '', convs: [], cur: null, view: 'list', dlg: null, toast: '', seq: 0, loaded: false, err: '' };
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function base(p) { return String(p || '').replace(/[\\/]+$/, '').split(/[\\/]/).pop() || String(p || ''); }
  function ago(ms) {
    var d = Date.now() - ms, m = Math.round(d / 60000);
    if (m < 2) return '방금'; if (m < 60) return m + '분 전'; var h = Math.round(m / 60); if (h < 24) return h + '시간 전';
    var dt = new Date(ms), n = new Date(); var y = new Date(n.getFullYear(), n.getMonth(), n.getDate() - 1);
    if (dt.getFullYear() === y.getFullYear() && dt.getMonth() === y.getMonth() && dt.getDate() === y.getDate()) return '어제';
    return (dt.getMonth() + 1) + '/' + dt.getDate();
  }
  function md(t) {      // 아주 가벼운 서식: ``` 코드 ``` · `코드` · **굵게** (나머지는 글자 그대로)
    return String(t == null ? '' : t).split(/(```[\s\S]*?```)/g).map(function (p) {
      if (/^```/.test(p)) { var m = p.match(/^```[^\n]*\n?([\s\S]*?)```$/); return '<pre><code>' + esc(m ? m[1] : p) + '</code></pre>'; }
      return esc(p).replace(/`([^`\n]+)`/g, '<code>$1</code>').replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>');
    }).join('');
  }
  function toast(t) { S.toast = t; renderLayer(); clearTimeout(toast.t); toast.t = setTimeout(function () { S.toast = ''; renderLayer(); }, 3200); }

  /* ── 대화 한 칸(conv) ──
     { cid, id(세션ID), key(실행 중이면), title, cwd, file, msgs, busy, remote:{on,url}|null, model, mode, draft, atts, ours, row }  */
  function newConv(o) { var c = { cid: 'n' + (++S.seq), id: o.id || '', key: '', title: o.title || '새 대화', cwd: o.cwd || '', file: o.file || '', msgs: [], blocks: {}, busy: false, remote: null, model: '', mode: '', draft: '', atts: [], ours: false, row: o.row || null }; S.convs.push(c); return c; }
  function convByKey(k) { return S.convs.filter(function (c) { return c.key === k; })[0]; }
  function convBySession(id) { return id ? S.convs.filter(function (c) { return c.id === id; })[0] : null; }
  function curConv() { return S.convs.filter(function (c) { return c.cid === S.cur; })[0] || null; }

  /* ── 목록 ── */
  function refresh() {
    return API.ccList().then(function (r) {
      if (!r || !r.ok) { S.err = (r && r.msg) || '세션 목록을 읽지 못했습니다'; renderList(); return; }
      S.err = ''; S.sessions = r.sessions || []; S.running = r.running || []; S.workDir = r.workDir || S.workDir; S.loaded = true;
      S.convs.forEach(function (c) { var rn = S.running.filter(function (x) { return x.key === c.key; })[0]; if (rn) { c.remote = rn.remote ? { on: true, url: rn.remote.url } : null; } });
      renderList(); renderHead();
    }).catch(function (e) { S.err = String((e && e.message) || e); renderList(); });
  }
  var rt = 0; function refreshSoon() { clearTimeout(rt); rt = setTimeout(refresh, 700); }
  function rowsView() {
    var q = S.q.trim().toLowerCase(), out = [];
    S.convs.filter(function (c) { return !c.id && !c.file; }).forEach(function (c) { out.push({ conv: c, title: c.title, cwd: c.cwd, last: Date.now(), isNew: true }); });
    S.sessions.forEach(function (s) { out.push(s); });
    return out.filter(function (s) {
      if (S.folder && base(s.cwd) !== S.folder) return false;
      return !q || (s.title + ' ' + s.cwd + ' ' + (s.lastPrompt || '')).toLowerCase().indexOf(q) >= 0;
    });
  }
  function folderChips() {
    var seen = {}, out = [];
    S.sessions.forEach(function (s) { var b = base(s.cwd); if (b && !seen[b]) { seen[b] = 1; out.push(b); } });
    return out.slice(0, 6);
  }
  function rcSwitch(on, dis, label) { return '<button type="button" class="rc' + (on ? ' on' : '') + '" role="switch" aria-checked="' + !!on + '"' + (dis ? ' disabled' : '') + ' data-rc="1"><u></u>📡 ' + esc(label || '원격 제어') + '</button>'; }
  function renderList() {
    var el = $('cl'); if (!el) return;
    var cur = curConv(), rows = rowsView(), chips = folderChips();
    var h = '<button class="cnew" data-act="new">＋ 새 대화</button>'
      + '<input class="cfind" id="q" placeholder="세션 찾기" value="' + esc(S.q) + '" aria-label="세션 찾기">'
      + '<div class="cchips"><button class="chip2' + (S.folder ? '' : ' on') + '" data-fold="">전체</button>'
      + chips.map(function (b) { return '<button class="chip2' + (S.folder === b ? ' on' : '') + '" data-fold="' + esc(b) + '">' + esc(b) + '</button>'; }).join('') + '</div>'
      + '<div class="clist">';
    if (S.err) h += '<div class="cempty">' + esc(S.err) + '</div>';
    else if (!S.loaded) h += '<div class="cempty">세션을 읽는 중…</div>';
    else if (!rows.length) h += '<div class="cempty">보이는 세션이 없어요.</div>';
    rows.forEach(function (s, i) {
      var cv = s.conv || convBySession(s.id), run = (cv && cv.key) || s.running, on = cur && ((cv && cv === cur) || (s.id && cur.id === s.id));
      var rcOn = !!(cv && cv.remote && cv.remote.on), busy = s.busy && !(cv && cv.ours) && !run;
      h += '<div class="cs' + (on ? ' on' : '') + '" data-i="' + i + '"><b>' + esc(s.title) + '</b><small>'
        + (run ? '<i class="run">● 실행 중</i>' : '') + (busy ? '<i class="app">다른 곳에서 열림</i>' : '')
        + '<span>' + esc(base(s.cwd)) + '</span>' + (s.isNew ? '' : '<span>' + ago(s.last) + '</span>')
        + (busy ? '' : rcSwitch(rcOn, false)) + '</small></div>';
    });
    el.innerHTML = h + '</div>';
    el.__rows = rows;
    var q = $('q'); if (q) q.addEventListener('input', function () { S.q = q.value; var p = q.selectionStart; renderList(); var q2 = $('q'); if (q2) { q2.focus(); try { q2.setSelectionRange(p, p); } catch (e) { /* */ } } });
    el.querySelectorAll('[data-fold]').forEach(function (b) { b.addEventListener('click', function () { S.folder = b.dataset.fold; renderList(); }); });
    el.querySelector('[data-act="new"]').addEventListener('click', openNewDlg);
    el.querySelectorAll('.cs').forEach(function (d) {
      d.addEventListener('click', function (e) {
        var row = el.__rows[Number(d.dataset.i)]; if (!row) return;
        if (e.target.closest && e.target.closest('[data-rc]')) { e.stopPropagation(); onRowRemote(row); return; }
        selectRow(row);
      });
    });
  }
  function selectRow(row) {
    var c = row.conv || convBySession(row.id);
    if (!c) {
      c = newConv({ id: row.id, title: row.title, cwd: row.cwd, file: row.file, row: row });
      if (row.file) API.ccHistory(row.file).then(function (r) { if (r && r.ok && r.items.length) { c.msgs = [{ t: 'hist', text: '지난 대화' }].concat(r.items.map(function (m) { return { t: m.role === 'user' ? 'u' : 'a', text: m.text }; }), [{ t: 'hist', text: '여기서부터 새 대화' }]); if (curConv() === c) renderMsgs(true); } });
    } else c.row = row.conv ? c.row : row;
    S.cur = c.cid; S.view = 'chat'; renderAll();
  }

  /* ── 오른쪽: 머리·안내·대화·입력 ── */
  function rowOf(c) { return c.row || S.sessions.filter(function (s) { return s.id === c.id; })[0] || null; }
  function renderHead() {
    var el = $('chd'), c = curConv(); if (!el) return;
    if (!c) { el.innerHTML = '<button class="btn2 only-narrow" data-act="list">☰ 세션</button><b>Claude 채팅</b>'; wireHead(); renderNote(); return; }
    var rcOn = !!(c.remote && c.remote.on);
    el.innerHTML = '<button class="btn2 only-narrow" data-act="list">☰ 세션</button><b>' + esc(c.title) + '</b>'
      + '<span class="chip2">📁 ' + esc(base(c.cwd)) + '</span>'
      + rcSwitch(rcOn, false, rcOn ? '원격 제어 켜짐' : '원격 제어')
      + (c.id ? '<button class="btn2" data-act="fork" title="이 대화를 건드리지 않고 복사본으로 이어갑니다">복사해서 이어가기</button>' : '')
      + (c.key ? '<button class="btn2" data-act="end" title="이 대화 프로세스를 끝냅니다(기록은 남습니다)">끝내기</button>' : '');
    wireHead(); renderNote();
  }
  function wireHead() {
    var el = $('chd'); if (!el) return;
    el.querySelectorAll('[data-act]').forEach(function (b) {
      b.addEventListener('click', function () {
        var c = curConv(), a = b.dataset.act;
        if (a === 'list') { S.view = 'list'; renderAll(); }
        else if (a === 'fork' && c) startConv(c, { fork: true }).then(function (ok) { if (ok) toast('복사본으로 이어갑니다 — 글을 보내 보세요'); });
        else if (a === 'end' && c) { API.ccStop(c.key); }
      });
    });
    var rc = el.querySelector('[data-rc]'); if (rc) rc.addEventListener('click', function () { var c = curConv(); if (c) toggleRemote(c); });
  }
  function renderNote() {
    var el = $('note'), c = curConv(); if (!el) return;
    el.innerHTML = c && c.remote && c.remote.on ? '<div class="rcnote">📱 폰의 Claude 앱·claude.ai/code 에 이 대화가 보이고 이어서 쓸 수 있어요 · 파일 수정 <b>승인은 이 PC 지비스에서만</b> 해요 · 이 PC 가 켜져 있어야 해요</div>' : '';
  }
  var TOOLS = { Read: ['📖', '읽기'], Edit: ['✏️', '수정'], Write: ['📝', '쓰기'], NotebookEdit: ['✏️', '수정'], Bash: ['⚙', '실행'], PowerShell: ['⚙', '실행'], Grep: ['🔎', '찾기'], Glob: ['🔎', '찾기'], WebFetch: ['🌐', '웹'], WebSearch: ['🌐', '웹 검색'], Task: ['🤖', '하위 작업'], Agent: ['🤖', '하위 작업'], Skill: ['🧩', '스킬'], TodoWrite: ['☑', '할 일'] };
  function toolSummary(name, input) {
    input = input || {};
    var v = input.file_path || input.path || input.command || input.pattern || input.url || input.query || input.description || input.prompt || input.skill || '';
    v = String(v).replace(/\s+/g, ' ');
    if ((input.file_path || input.path) && v.length > 40) v = base(v);
    return v.length > 90 ? v.slice(0, 90) + '…' : v;
  }
  function attHtml(atts) {
    if (!atts || !atts.length) return '';
    return '<div class="attl">' + atts.map(function (a) { return a.img ? '<img class="th" src="' + a.thumb + '" alt="">' : '<span class="fl">📄 <span>' + esc(base(a.path)) + '</span></span>'; }).join('') + '</div>';
  }
  function diffHtml(input) {
    var o = String(input.old_string || ''), n = String(input.new_string || '');
    var cut = function (s) { return s.length > 700 ? s.slice(0, 700) + '…' : s; };
    return '<pre class="df">' + (o ? '<span class="m">' + esc(cut(o).split('\n').map(function (l) { return '- ' + l; }).join('\n')) + '</span>\n' : '') + '<span class="p">' + esc(cut(n).split('\n').map(function (l) { return '+ ' + l; }).join('\n')) + '</span></pre>';
  }
  function permHtml(m, i) {
    var t = m.tool, inp = m.input || {}, done = m.st !== 'ask';
    var h = '<div class="ask' + (done ? ' done' : '') + '" data-mi="' + i + '">';
    if (t === 'AskUserQuestion') {
      h += '<b>❓ 질문이 왔어요</b>';
      (inp.questions || []).forEach(function (q, qi) {
        h += '<div class="q">' + esc(q.question || '') + (q.multiSelect ? ' <small>(여러 개 고를 수 있어요)</small>' : '') + '</div><div class="ops">'
          + (q.options || []).map(function (o, oi) { var on = (m.sel && m.sel[qi] || []).indexOf(oi) >= 0; return '<button class="chip2' + (on ? ' on' : '') + '" ' + (done ? 'disabled' : '') + ' data-qa="' + qi + '|' + oi + '" title="' + esc(o.description || '') + '">' + esc(o.label) + '</button>'; }).join('') + '</div>';
      });
      if (!done) h += '<div class="r"><button class="ok2" data-pm="answer">보내기</button><button class="no2" data-pm="deny">건너뛰기</button></div>';
      else h += '<small>' + (m.st === 'allow' ? '답을 보냈어요' : '건너뛰었어요') + '</small>';
      return h + '</div>';
    }
    if (t === 'Edit' || t === 'Write' || t === 'NotebookEdit') {
      h += '<b>✏️ 파일 ' + (t === 'Write' ? '쓰기' : '수정') + ' 허용할까요?</b>' + esc(inp.file_path || inp.notebook_path || '');
      h += t === 'Edit' ? diffHtml(inp) : '<pre>' + esc(String(inp.content || inp.new_source || '').slice(0, 600)) + '</pre>';
    } else if (t === 'Bash' || t === 'PowerShell') {
      h += '<b>⚙ 명령을 실행할까요?</b>' + (inp.description ? esc(inp.description) : '') + '<pre>' + esc(String(inp.command || '').slice(0, 900)) + '</pre>';
    } else if (t === 'ExitPlanMode') {
      h += '<b>📋 이 계획대로 진행할까요?</b><pre>' + esc(String(inp.plan || '').slice(0, 1800)) + '</pre>';
    } else {
      h += '<b>🔧 ' + esc(t) + ' 도구를 쓸까요?</b><pre>' + esc(JSON.stringify(inp).slice(0, 700)) + '</pre>';
    }
    if (!done) {
      h += '<div class="r"><button class="ok2" data-pm="allow">허용</button><button class="no2" data-pm="deny">거절</button>'
        + (t === 'Edit' || t === 'Write' || t === 'NotebookEdit' ? '<button class="no2" data-pm="edits">이번 대화는 파일 수정 계속 허용</button>' : '') + '</div>';
    } else h += '<small>' + (m.st === 'allow' ? '✅ 허용했어요' : '⛔ 거절했어요') + '</small>';
    return h + '</div>';
  }
  function msgHtml(m, i) {
    if (m.t === 'u') return '<div class="u">' + md(m.text) + attHtml(m.atts) + '</div>';
    if (m.t === 'a') return m.text || m.live ? '<div class="a">' + md(m.text) + (m.live ? '<span class="think">▍</span>' : '') + '</div>' : '';
    if (m.t === 'tool') { var tn = TOOLS[m.name] || ['🔧', m.name]; return '<div class="tool' + (m.bad ? ' bad' : '') + '">' + tn[0] + ' <b>' + esc(tn[1]) + (m.auto ? ' · 자동 허용' : '') + '</b><span>' + esc(toolSummary(m.name, m.input)) + '</span>' + (m.bad ? ' ⚠' : '') + '</div>'; }
    if (m.t === 'perm') return permHtml(m, i);
    if (m.t === 'hist') return '<div class="hist">── ' + esc(m.text) + ' ──</div>';
    if (m.t === 'info') return '<div class="info' + (m.err ? ' err' : '') + '">' + esc(m.text) + '</div>';
    return '';
  }
  function renderMsgs(forceBottom) {
    var el = $('msgs'), c = curConv(); if (!el) return;
    var atBottom = forceBottom || el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (!c) { el.innerHTML = '<div class="empty"><b>Claude 채팅</b>왼쪽에서 대화를 고르거나 <b style="display:inline">＋ 새 대화</b> 를 눌러 시작하세요.<br>이 PC 의 Claude 를 그대로 씁니다 — 파일도 붙일 수 있어요.</div>'; return; }
    var h = c.msgs.map(msgHtml).join('');
    if (c.busy && !(c.msgs.length && c.msgs[c.msgs.length - 1].live)) h += '<div class="think">생각하는 중…</div>';
    if (!c.msgs.length) h = '<div class="empty"><b>' + esc(c.title) + '</b>' + (c.id ? '이전 대화가 없거나 읽지 못했어요. 아래에 글을 보내면 이어집니다.' : '아래에 글을 쓰고 보내 보세요.<br>📎 로 파일·사진을 붙이거나 끌어다 놓을 수 있어요.') + '</div>';
    el.innerHTML = h;
    wireMsgs(el, c);
    if (atBottom) el.scrollTop = el.scrollHeight;
  }
  function wireMsgs(el, c) {
    el.querySelectorAll('[data-pm]').forEach(function (b) {
      b.addEventListener('click', function () {
        var card = b.closest('.ask'), i = Number(card.dataset.mi), m = c.msgs[i]; if (!m || m.st !== 'ask') return;
        var a = b.dataset.pm;
        if (a === 'allow' || a === 'edits') { m.st = 'allow'; API.ccPerm(c.key, m.id, 'allow', { allowEdits: a === 'edits' }); }
        else if (a === 'deny') { m.st = 'deny'; API.ccPerm(c.key, m.id, 'deny', { message: '지비스 화면에서 거절했습니다' }); }
        else if (a === 'answer') {
          var ans = {}; (m.input.questions || []).forEach(function (q, qi) { ans[q.question] = (m.sel && m.sel[qi] || []).map(function (oi) { return q.options[oi].label; }).join(', '); });
          if ((m.input.questions || []).some(function (q) { return !ans[q.question]; })) { toast('질문마다 하나 이상 골라 주세요'); return; }
          m.st = 'allow'; API.ccPerm(c.key, m.id, 'allow', { input: { questions: m.input.questions, answers: ans } });
        }
        renderMsgs();
      });
    });
    el.querySelectorAll('[data-qa]').forEach(function (b) {
      b.addEventListener('click', function () {
        var card = b.closest('.ask'), i = Number(card.dataset.mi), m = c.msgs[i], p = b.dataset.qa.split('|').map(Number); if (!m || m.st !== 'ask') return;
        m.sel = m.sel || []; var q = m.input.questions[p[0]], cur = m.sel[p[0]] || [];
        if (q.multiSelect) { var k = cur.indexOf(p[1]); if (k >= 0) cur.splice(k, 1); else cur.push(p[1]); } else cur = [p[1]];
        m.sel[p[0]] = cur; renderMsgs();
      });
    });
  }
  function renderComposer() {
    var el = $('cin'), c = curConv(); if (!el) return;
    if (!c) { el.innerHTML = ''; return; }
    var run = !!c.key;
    el.innerHTML = '<div class="drop">📎 여기에 놓으면 붙습니다</div>'
      + (c.atts.length ? '<div class="atts">' + c.atts.map(function (a, i) { return '<span class="att">' + (a.img ? '<img src="' + a.thumb + '" alt="">' : '📄') + '<span>' + esc(a.name || base(a.path)) + '</span><button data-rm="' + i + '" aria-label="빼기">✕</button></span>'; }).join('') + '</div>' : '')
      + '<div class="row"><button class="pin" data-act="pick" title="파일 붙이기" aria-label="파일 붙이기">📎</button>'
      + '<textarea class="ta" id="ta" rows="1" placeholder="메시지를 쓰세요 …  (Enter 보내기 · Shift+Enter 줄바꿈 · Ctrl+V 로 사진 붙이기)">' + esc(c.draft) + '</textarea>'
      + (c.busy ? '<button class="send stop" data-act="stop">■ 멈추기</button>' : '<button class="send" data-act="send">보내기</button>') + '</div>'
      + '<div class="foot"><span>이 PC · ' + esc(c.cwd) + (run ? '' : ' · 보내면 시작해요') + '</span><span>' + esc((c.model || '') + (c.mode ? ' · ' + c.mode : '')) + '</span></div>';
    var ta = $('ta');
    var fit = function () { ta.style.height = 'auto'; ta.style.height = Math.min(180, ta.scrollHeight) + 'px'; };
    ta.addEventListener('input', function () { c.draft = ta.value; fit(); });
    ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(c); } });
    ta.addEventListener('paste', function (e) { onPaste(e, c); });
    fit();
    el.querySelectorAll('[data-rm]').forEach(function (b) { b.addEventListener('click', function () { c.atts.splice(Number(b.dataset.rm), 1); renderComposer(); }); });
    el.querySelector('[data-act="pick"]').addEventListener('click', function () { API.ccPickFiles().then(function (r) { (r.files || []).forEach(function (p) { c.atts.push({ path: p, name: base(p) }); }); renderComposer(); }); });
    var sb = el.querySelector('[data-act="send"]'); if (sb) sb.addEventListener('click', function () { send(c); });
    var st = el.querySelector('[data-act="stop"]'); if (st) st.addEventListener('click', function () { API.ccInterrupt(c.key); });
  }
  function renderAll() { var cc = $('cc'); cc.className = 'cc ' + (S.view === 'chat' ? 'v-chat' : 'v-list'); renderList(); renderHead(); renderMsgs(true); renderComposer(); renderLayer(); }

  /* ── 첨부(끌어놓기·붙여넣기) ── */
  function shrink(file) {
    return new Promise(function (res, rej) {
      var fr = new FileReader();
      fr.onload = function () {
        var im = new Image();
        im.onload = function () {
          var k = Math.min(1, 1568 / Math.max(im.naturalWidth, im.naturalHeight)), w = Math.max(1, Math.round(im.naturalWidth * k)), h = Math.max(1, Math.round(im.naturalHeight * k));
          var cv = document.createElement('canvas'); cv.width = w; cv.height = h; var g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.drawImage(im, 0, 0, w, h);
          var url = cv.toDataURL('image/jpeg', 0.85), tk = Math.min(1, 80 / Math.max(w, h)), tc = document.createElement('canvas'); tc.width = Math.max(1, Math.round(w * tk)); tc.height = Math.max(1, Math.round(h * tk)); tc.getContext('2d').drawImage(im, 0, 0, tc.width, tc.height);
          res({ img: true, mt: 'image/jpeg', b64: url.split(',')[1], thumb: tc.toDataURL('image/jpeg', 0.7), name: file.name || '붙여넣은 그림' });
        };
        im.onerror = function () { rej(new Error('그림을 열 수 없어요')); };
        im.src = fr.result;
      };
      fr.onerror = function () { rej(new Error('읽지 못했어요')); };
      fr.readAsDataURL(file);
    });
  }
  function addFiles(c, files) {
    var list = Array.prototype.slice.call(files || []).slice(0, 12);
    return Promise.all(list.map(function (f) {
      if (/^image\//.test(f.type) && f.size < 25 * 1024 * 1024) return shrink(f).then(function (a) { c.atts.push(a); }).catch(function (e) { toast(f.name + ' — ' + e.message); });
      var p = API.tbImPathOf ? API.tbImPathOf(f) : '';
      if (p) { c.atts.push({ path: p, name: f.name || base(p) }); return null; }
      toast((f.name || '파일') + ' — 경로를 알 수 없어 붙이지 못했어요(탐색기에서 끌어다 놓아 주세요)'); return null;
    })).then(function () { if (curConv() === c) renderComposer(); });
  }
  function onPaste(e, c) {
    var items = (e.clipboardData && e.clipboardData.files) || [];
    if (items.length) { e.preventDefault(); addFiles(c, items); }
  }

  /* ── 시작·보내기 ── */
  function dlg(d) { S.dlg = d; renderLayer(); }
  function startConv(c, o) {          // 이 대화를 실행 중으로 — 이어하기(resume)·복사(fork)·새 대화. 성공하면 true
    o = o || {};
    return new Promise(function (resolve) {
      var go = function (fork) {
        API.ccOpen({ cwd: c.cwd, resume: c.id || '', fork: !!fork || !!o.fork }).then(function (r) {
          if (!r || !r.ok) { toast((r && r.msg) || '시작하지 못했어요'); resolve(false); return; }
          c.key = r.key; c.ours = true; if (fork || o.fork) { c.title = c.title.replace(/^(복사 · )?/, '복사 · '); c.id = ''; c.file = ''; c.msgs.push({ t: 'info', text: '복사본으로 이어갑니다 — 원래 대화는 그대로예요' }); }
          renderAll(); resolve(true);
        });
      };
      var row = rowOf(c), busy = row && row.busy && !c.ours && !o.fork && c.id;
      if (busy) dlg({ t: 'busy', c: c, go: go, no: function () { resolve(false); } });
      else go(false);
    });
  }
  function send(c) {
    var text = (c.draft || '').trim();
    if ((!text && !c.atts.length) || c.busy) return;
    var doSend = function () {
      var atts = c.atts.slice(), m = { text: text, images: atts.filter(function (a) { return a.img; }).map(function (a) { return { mediaType: a.mt, data: a.b64 }; }), files: atts.filter(function (a) { return a.path; }).map(function (a) { return a.path; }) };
      c.msgs.push({ t: 'u', text: text, atts: atts }); c.busy = true; c.draft = ''; c.atts = [];
      if (c.title === '새 대화') c.title = text.replace(/\s+/g, ' ').slice(0, 40) || '새 대화';
      renderAll();
      API.ccSend(c.key, m).then(function (r) { if (!r || !r.ok) { c.busy = false; c.msgs.push({ t: 'info', err: 1, text: (r && r.msg) || '보내지 못했어요' }); renderMsgs(true); renderComposer(); } });
    };
    if (c.key) doSend(); else startConv(c).then(function (ok) { if (ok) doSend(); });
  }
  function openNewDlg() {
    var dirs = [], seen = {};
    var add = function (d) { if (d && !seen[d]) { seen[d] = 1; dirs.push(d); } };
    add(S.workDir); S.sessions.forEach(function (s) { add(s.cwd); });
    dlg({ t: 'new', dirs: dirs.slice(0, 7), dir: dirs[0] || '' });
  }

  /* ── 원격 제어 ── */
  function toggleRemote(c) {
    if (c.remote && c.remote.on) { if (c.key) API.ccRemote(c.key, false).then(function (r) { if (!r || !r.ok) toast((r && r.msg) || '끄지 못했어요'); else { c.remote = null; renderAll(); } }); return; }
    dlg({ t: 'remote', c: c });
  }
  function onRowRemote(row) {
    var c = row.conv || convBySession(row.id);
    if (!c) { c = newConv({ id: row.id, title: row.title, cwd: row.cwd, file: row.file, row: row }); }
    S.cur = c.cid; S.view = 'chat'; renderAll(); toggleRemote(c);
  }
  function enableRemote(c) {
    var finish = function () { API.ccRemote(c.key, true).then(function (r) { if (!r || !r.ok) { toast((r && r.msg) || '켜지 못했어요'); return; } c.remote = { on: true, url: r.url }; renderAll(); toast('원격 제어를 켰어요 — 폰의 Claude 앱에서 보여요'); }); };
    if (c.key) finish(); else startConv(c).then(function (ok) { if (ok) finish(); });
  }

  /* ── 화면 안 대화상자·알림 ── */
  function renderLayer() {
    var el = $('layer'), d = S.dlg, h = '';
    if (d && d.t === 'remote') h = '<div class="dlg"><div class="dlgc"><b class="t">📡 이 대화의 원격 제어를 켤까요?</b><p>폰의 Claude 앱·claude.ai/code 에서 이 대화를 보고 이어서 쓸 수 있게 됩니다.</p><ul><li>이 PC 가 <b>켜져 있고 절전이 아닐 때</b>만 폰에서 이어져요</li><li>파일 수정·명령 실행 <b>승인은 이 PC 지비스에서만</b> 해요</li><li>이 창을 닫아도 지비스가 켜져 있으면 이어져요</li></ul><div class="r"><button class="no2" data-d="x">취소</button><button class="ok2" data-d="ok">켜기</button></div></div></div>';
    else if (d && d.t === 'busy') h = '<div class="dlg"><div class="dlgc"><b class="t">이 대화는 다른 곳에서 쓰는 중이에요</b><p>Claude 앱 같은 다른 곳에서 방금까지 이 대화를 썼어요. 같은 대화를 두 곳에서 이어가면 기록이 갈라질 수 있어요.</p><div class="r"><button class="no2" data-d="x">취소</button><button class="no2" data-d="same">그래도 이어하기</button><button class="ok2" data-d="fork">복사해서 이어가기</button></div></div></div>';
    else if (d && d.t === 'new') h = '<div class="dlg"><div class="dlgc"><b class="t">＋ 새 대화 — 어느 폴더에서 시작할까요?</b><p>Claude 는 이 폴더의 파일을 읽고 고칠 수 있어요.</p><div class="chips">' + d.dirs.map(function (x, i) { return '<button class="chip2' + (x === d.dir ? ' on' : '') + '" data-dd="' + i + '" title="' + esc(x) + '">' + esc(base(x)) + '</button>'; }).join('') + '<button class="chip2" data-d="pick">다른 폴더 고르기…</button></div><p style="font-size:12px;color:var(--dim)">' + esc(d.dir) + '</p><div class="r"><button class="no2" data-d="x">취소</button><button class="ok2" data-d="start"' + (d.dir ? '' : ' disabled') + '>시작</button></div></div></div>';
    el.innerHTML = h + (S.toast ? '<div class="toast">' + esc(S.toast) + '</div>' : '');
    el.querySelectorAll('[data-d]').forEach(function (b) {
      b.addEventListener('click', function () {
        var a = b.dataset.d, dd = S.dlg; if (!dd) return;
        if (a === 'x') { var no = dd.no; S.dlg = null; renderLayer(); if (no) no(); return; }
        if (dd.t === 'remote' && a === 'ok') { S.dlg = null; renderLayer(); enableRemote(dd.c); }
        else if (dd.t === 'busy') { S.dlg = null; renderLayer(); dd.go(a === 'fork'); }
        else if (dd.t === 'new' && a === 'pick') API.ccPickDir().then(function (r) { if (r && r.dir) { if (dd.dirs.indexOf(r.dir) < 0) dd.dirs.unshift(r.dir); dd.dir = r.dir; renderLayer(); } });
        else if (dd.t === 'new' && a === 'start') {
          S.dlg = null; var c = newConv({ cwd: dd.dir, title: '새 대화' }); S.cur = c.cid; S.view = 'chat'; renderAll(); var ta = $('ta'); if (ta) ta.focus();
        }
      });
    });
    el.querySelectorAll('[data-dd]').forEach(function (b) { b.addEventListener('click', function () { S.dlg.dir = S.dlg.dirs[Number(b.dataset.dd)]; renderLayer(); }); });
  }

  /* ── 뒤쪽에서 오는 이벤트 ── */
  var raf = 0; function later() { if (raf) return; raf = requestAnimationFrame(function () { raf = 0; renderMsgs(); }); }
  function onStream(c, e) {
    if (e.type === 'message_start') c.blocks = {};
    else if (e.type === 'content_block_start') {
      var b = e.content_block || {};
      if (b.type === 'text') { var m = { t: 'a', text: '', live: true }; c.msgs.push(m); c.blocks[e.index] = m; }
      else if (b.type === 'tool_use') { var tm = { t: 'tool', name: b.name, id: b.id, partial: '', input: null }; c.msgs.push(tm); c.blocks[e.index] = tm; }
    } else if (e.type === 'content_block_delta') {
      var t = c.blocks[e.index], d = e.delta || {};
      if (t && d.type === 'text_delta') t.text += d.text; else if (t && d.type === 'input_json_delta') t.partial += d.partial_json;
    } else if (e.type === 'content_block_stop') {
      var t2 = c.blocks[e.index];
      if (t2) { if (t2.t === 'a') t2.live = false; else if (t2.t === 'tool') { try { t2.input = JSON.parse(t2.partial || '{}'); } catch (x) { t2.input = {}; } } }
    }
  }
  function onEvent(m) {
    var c = convByKey(m.key); if (!c) return;
    if (m.init) { c.id = m.init.id || c.id; c.model = m.init.model || ''; c.mode = m.init.mode || ''; if (m.init.cwd) c.cwd = m.init.cwd; renderHead(); renderComposer(); refreshSoon(); return; }
    if (m.perm) { c.msgs.push({ t: 'perm', id: m.perm.id, tool: m.perm.tool, input: m.perm.input || {}, st: 'ask' }); if (document.hidden) { try { new Notification('지비스 Claude', { body: '허용할지 물어봐요 — ' + m.perm.tool }); } catch (e) { /* */ } } later(); return; }
    if (m.auto) { c.msgs.push({ t: 'tool', name: m.auto.tool, input: m.auto.input, auto: true }); later(); return; }
    if (m.remote) { c.remote = m.remote.on ? { on: true, url: m.remote.url } : null; renderHead(); renderList(); return; }
    if (m.stderr) { c.msgs.push({ t: 'info', err: 1, text: m.stderr }); later(); return; }
    if (m.err) { c.msgs.push({ t: 'info', err: 1, text: m.err }); c.busy = false; later(); renderComposer(); return; }
    if (m.exit !== undefined) { c.key = ''; c.remote = null; if (c.busy) c.msgs.push({ t: 'info', err: 1, text: '대화가 중간에 끝났어요' }); c.busy = false; renderAll(); refreshSoon(); return; }
    var j = m.ev; if (!j) return;
    if (j.type === 'stream_event') { onStream(c, j.event || {}); later(); }
    else if (j.type === 'user' && j.message && Array.isArray(j.message.content)) {
      j.message.content.forEach(function (b) { if (b.type === 'tool_result' && b.is_error) { c.msgs.forEach(function (x) { if (x.t === 'tool' && x.id === b.tool_use_id) x.bad = true; }); } });
      later();
    } else if (j.type === 'result') {
      c.busy = false;
      if (j.is_error) c.msgs.push({ t: 'info', err: 1, text: String(j.result || j.subtype || '오류가 났어요').slice(0, 300) });
      renderMsgs(); renderComposer(); refreshSoon();
    }
  }

  /* ── 끌어놓기 · 시작 ── */
  var dragN = 0;
  document.addEventListener('dragenter', function (e) { if (e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], 'Files') >= 0 && curConv()) { dragN++; $('cc').classList.add('dragging'); } });
  document.addEventListener('dragleave', function () { dragN = Math.max(0, dragN - 1); if (!dragN) $('cc').classList.remove('dragging'); });
  document.addEventListener('dragover', function (e) { e.preventDefault(); });
  document.addEventListener('drop', function (e) { e.preventDefault(); dragN = 0; $('cc').classList.remove('dragging'); var c = curConv(); if (c && e.dataTransfer && e.dataTransfer.files.length) addFiles(c, e.dataTransfer.files); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && S.dlg) { var no = S.dlg.no; S.dlg = null; renderLayer(); if (no) no(); } });
  window.addEventListener('focus', refresh);
  setInterval(function () { if (!S.dlg && !document.hidden) refresh(); }, 20000);

  $('cc').innerHTML = '<div class="cl" id="cl"></div><div class="cm"><div class="ch" id="chd"></div><div id="note"></div><div class="msgs" id="msgs"></div><div class="cin" id="cin"></div></div>';
  if (API.onData) API.onData(function (p) { if (p && p.theme) document.documentElement.dataset.theme = p.theme; else if (p) delete document.documentElement.dataset.theme; });
  API.onCcEvent(onEvent);
  window.CC = { S: S, refresh: refresh, onEvent: onEvent, send: send, selectRow: selectRow, newConv: newConv, renderAll: renderAll, toggleRemote: toggleRemote };
  renderAll();
  refresh();
})();
