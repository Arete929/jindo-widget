// 파일명: notionatt.js | @version 1.2.0 — v1.2.0 증빙서류 첨부(이미지·영상·PDF 무엇이든: 노션 파일 올리기 API, 20MB 넘는 것은 나눠서) · 이미 있는 기록에는 «증빙만 더하기» · «증빙서류» 칸 만들기 / v1.1.0 «시간» 칸(시트의 시간·정문확인) 함께 · «못 찾음» 안내에 노션에서 할 일을 적음 / v1.0.0 — 출결 → 노션 [DB]’26 3-2 출결 로 «바로» 보내기 (지비스 전용)
//
// ★ 예전에는 학년 출결 시트의 우리 반 줄을 복사해 노션에 붙여 넣으면 «출결 입력 트리거» 가 줄을 읽어 기록을 만들었다.
//   이 파일은 그 일을 앱이 대신한다 — 트리거의 규칙을 그대로 따른다:
//   · 특기사항(제목) = «MMDD 유형» · 연번 · 분류 · 시작날짜 · 월(날짜 기준) · 유형 · 메모(원문 전체) · 시간(시트의 시간 칸, 기존 기록과 같게)
//   · 학번이름(관계) = 학생 INFO 에서 «학번+이름» 이 정확히 같은 학생 — 못 찾으면 «만들지 않는다»(관계를 비운 채 만들지 않는다)
//   · 출석부·NEIS 는 늘 미체크 · 기존 기록은 고치거나 지우지 않는다(새로 만들기만)
//   · 이미 노션에 같은 «학생·날짜·유형» 이 있으면 건너뛴다(같은 단추를 또 눌러도 겹치지 않게)
//   · 미인정지각·미인정결석은 서류가 없어도 되고 분류를 비워도 된다
//
// ★ 노션 쪽에서 [DB]’26 3-2 출결 을 통합(진호알리미)에 «연결» 해 두어야 한다(안 하면 404).
// ★ 통신은 httpx(Electron net) — 학교 망의 SSL 검사 장비 때문에 Node https 는 막힌다.

const fs = require('fs');
const { request } = require('./httpx.js');

const API = 'https://api.notion.com/v1';
const VER = '2022-06-28';
/* 출결 DB — 트리거의 «collection://31bff403-…-812c-…» 는 데이터소스 번호이고, 데이터베이스 번호는 주소의 31bff403…42ef.
   어느 쪽으로든 열리는 것으로 쓴다. */
const ATT_DB_IDS = ['31bff403-d746-8021-97d1-ffef761d42ef', '31bff403-d746-812c-bd7a-000b020f64bf'];

const TYPES = ['질병결석', '질병지각', '질병조퇴', '질병결과', '인정결석', '인정지각', '인정조퇴', '인정결과',
  '기타결석', '기타지각', '기타조퇴', '기타결과', '미인정지각', '미인정결석'];
/* 시트의 «구분» 글자 → 노션 «분류» 이름 */
const GUBUN = { '나이스': 'NEIS', 'NEIS': 'NEIS', '종이서류': '종이서류', '서류없음': '서류없음', '참고서류': '참고서류', '병원진료': '병원진료' };

const FILE_PROP = '증빙서류';            // 노션 출결 DB 의 «파일» 칸 이름
const SINGLE_MAX = 20 * 1024 * 1024;       // 한 번에 올릴 수 있는 크기 — 넘으면 나눠서(multi_part)
const PART = 10 * 1024 * 1024;             // 나눌 때 한 조각(노션: 5~20MB)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const plain = (arr) => (arr || []).map((t) => (t && t.plain_text) || '').join('');
const squash = (s) => String(s || '').replace(/[\s​]+/g, '');

async function call(token, method, path, body, tries) {
  if (!String(token || '').trim()) throw new Error('노션 열쇠가 없습니다 — 설정의 «업무관리» 에 넣어 주세요');
  const r = await request({
    method, url: API + path, contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + String(token).trim(), 'Notion-Version': VER },
    body: body ? JSON.stringify(body) : null, timeout: 30000
  });
  let j = null;
  try { j = r.text ? JSON.parse(r.text) : null; } catch (e) { /* 글자 그대로 */ }
  if (r.status >= 200 && r.status < 300) return j;
  if (r.status === 429 && (tries || 0) < 5) {                    // 노션이 «잠깐만» 이라고 하면 그만큼 쉬었다 다시
    const wait = Math.min(15, Number((r.headers && (r.headers['retry-after'] || r.headers['Retry-After'])) || 2));
    await sleep(wait * 1000);
    return call(token, method, path, body, (tries || 0) + 1);
  }
  const e = new Error((j && j.message) || ('노션 오류 ' + r.status));
  e.status = r.status;
  throw e;
}

/* 출결 DB 정의 — 어느 번호로 열리는지 찾고, 선택 목록(월·분류)과 «학번이름» 관계가 가리키는 학생 DB 를 알아낸다 */
async function attSchema(token) {
  let last = null;
  for (const id of ATT_DB_IDS) {
    try {
      const db = await call(token, 'GET', '/databases/' + id);
      const P = db.properties || {};
      const need = ['특기사항', '시작날짜', '유형', '학번이름'];
      const miss = need.filter((k) => !P[k]);
      if (miss.length) throw new Error('출결 DB 에서 «' + miss.join('·') + '» 속성을 찾지 못했습니다');
      const opts = (k) => new Set(((P[k] && P[k].select && P[k].select.options) || []).map((o) => o.name));
      return {
        id: db.id,
        studentDb: (P['학번이름'].relation && P['학번이름'].relation.database_id) || '',
        month: opts('월'), gubun: opts('분류'), type: opts('유형'),
        has: { 증빙서류: !!(P[FILE_PROP] && P[FILE_PROP].type === 'files'), 연번: !!P['연번'], 분류: !!P['분류'], 월: !!P['월'], 메모: !!P['메모'], 시간: !!P['시간'], 출석부: !!P['출석부'], NEIS: !!P['NEIS'] }
      };
    } catch (e) {
      last = e;
      if (e.status !== 404 && e.status !== 400) throw e;
    }
  }
  if (last && last.status === 404) throw new Error('노션에서 출결 DB 를 못 찾음 — 노션에서 ‘26 3-2 학생 출결 페이지의 ••• → 연결 → «진호알리미» 를 추가해 주세요(안의 DB 에도 적용됩니다)');
  throw last || new Error('출결 DB 를 열지 못했습니다');
}

/* «증빙서류» 칸(파일)을 노션 DB 에 만든다 — 사용자가 단추로 허락했을 때만 부른다 */
async function addFileProp(token) {
  const sch = await attSchema(token);
  if (sch.has.증빙서류) return { ok: true, already: true };
  await call(token, 'PATCH', '/databases/' + sch.id, { properties: { [FILE_PROP]: { files: {} } } });
  return { ok: true };
}
/* 이 작업 공간이 허락하는 파일 크기(바이트) — 알 수 없으면 0 */
async function fileLimit(token) {
  try {
    const me = await call(token, 'GET', '/users/me');
    const n = Number(me && me.bot && me.bot.workspace_limits && me.bot.workspace_limits.max_file_upload_size_in_bytes);
    return n > 0 ? n : 0;
  } catch (e) { return 0; }
}
async function sendPart(token, id, buf, f, partNo) {
  const b = '----jvfile' + Math.random().toString(16).slice(2) + Date.now().toString(16);
  const CRLF = '\r\n';
  const head = (name, extra) => Buffer.from('--' + b + CRLF + 'Content-Disposition: form-data; name="' + name + '"' + (extra || '') + CRLF);
  const parts = [];
  if (partNo) parts.push(head('part_number'), Buffer.from(CRLF + partNo + CRLF));
  parts.push(head('file', '; filename="' + String(f.name).replace(/["\r\n]/g, '_') + '"'),
    Buffer.from('Content-Type: ' + (f.mime || 'application/octet-stream') + CRLF + CRLF), buf, Buffer.from(CRLF + '--' + b + '--' + CRLF));
  const r = await request({ method: 'POST', url: API + '/file_uploads/' + id + '/send', contentType: 'multipart/form-data; boundary=' + b,
    headers: { Authorization: 'Bearer ' + String(token).trim(), 'Notion-Version': VER }, body: Buffer.concat(parts), timeout: 300000 });
  if (r.status < 200 || r.status >= 300) {
    let m = ''; try { m = (JSON.parse(r.text) || {}).message; } catch (e) { /* */ }
    const e = new Error(m || ('파일 올리기 오류 ' + r.status)); e.status = r.status; throw e;
  }
}
/* 파일 하나를 노션에 올리고 «올린 파일 번호» 를 돌려준다(1시간 안에 페이지에 붙여야 한다) */
async function uploadFile(token, f) {
  const size = fs.statSync(f.path).size;
  if (size <= SINGLE_MAX) {
    const up = await call(token, 'POST', '/file_uploads', { filename: f.name, content_type: f.mime || 'application/octet-stream' });
    await sendPart(token, up.id, fs.readFileSync(f.path), f, 0);
    return up.id;
  }
  const n = Math.ceil(size / PART);
  const up = await call(token, 'POST', '/file_uploads', { mode: 'multi_part', number_of_parts: n, filename: f.name, content_type: f.mime || 'application/octet-stream' });
  const fd = fs.openSync(f.path, 'r');
  try {
    for (let i = 1; i <= n; i++) {
      const len = Math.min(PART, size - (i - 1) * PART), buf = Buffer.alloc(len);
      fs.readSync(fd, buf, 0, len, (i - 1) * PART);
      await sendPart(token, up.id, buf, f, i);
    }
  } finally { fs.closeSync(fd); }
  await call(token, 'POST', '/file_uploads/' + up.id + '/complete', {});
  return up.id;
}

async function queryAll(token, dbId, body) {
  const out = []; let cursor = null;
  for (let n = 0; n < 60; n++) {                                  // 쪽당 100 → 최대 6,000 줄
    const j = await call(token, 'POST', '/databases/' + dbId + '/query',
      Object.assign({ page_size: 100 }, body || {}, cursor ? { start_cursor: cursor } : {}));
    (j.results || []).forEach((p) => out.push(p));
    if (!j.has_more || !j.next_cursor) break;
    cursor = j.next_cursor;
  }
  return out;
}

/* 학생 INFO → { «3221허가은»(공백 뺀 제목) : 페이지번호 } */
async function loadStudents(token, studentDb) {
  const pages = await queryAll(token, studentDb);
  const map = new Map();
  pages.forEach((p) => {
    const tp = Object.keys(p.properties || {}).filter((k) => p.properties[k].type === 'title')[0];
    const t = squash(plain(tp ? p.properties[tp].title : []));
    if (t) map.set(t, p.id);
  });
  return map;
}
/* 노션에 이미 있는 기록 → «학생|날짜|유형» 묶음 */
async function loadExisting(token, dbId) {
  const pages = await queryAll(token, dbId);
  const keys = new Set(), byKey = new Map();
  pages.forEach((p) => {
    const P = p.properties || {};
    const stu = ((P['학번이름'] && P['학번이름'].relation) || []).map((x) => x.id);
    const d = P['시작날짜'] && P['시작날짜'].date && P['시작날짜'].date.start;
    const ty = P['유형'] && P['유형'].select && P['유형'].select.name;
    const nf = (P[FILE_PROP] && P[FILE_PROP].files) ? P[FILE_PROP].files.length : 0;
    if (d && ty) stu.forEach((s) => { const k = s + '|' + String(d).slice(0, 10) + '|' + ty; keys.add(k); if (!byKey.has(k)) byKey.set(k, { page: p.id, files: nf }); });
  });
  return { keys, byKey, count: pages.length };
}

const rich = (s) => {
  const t = String(s || ''), out = [];
  for (let i = 0; i < t.length; i += 1900) out.push({ type: 'text', text: { content: t.slice(i, i + 1900) } });   // 한 조각 2000자 한도
  return out;
};
/* 줄 하나 → 노션 속성. 못 보내는 까닭이 있으면 { bad } */
function mapRow(r, sch, studentId) {
  const id = String(r.id || '').trim(), name = String(r.name || '').trim();
  const date = String(r.start || '').trim();
  const type = String(r.type || '').trim();
  const label = (id + name) + ' ' + date.slice(5).replace('-', '/') + ' ' + type;
  if (!/^\d{4}$/.test(id) || !name) return { bad: '학번·이름이 없습니다', label };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { bad: '날짜를 읽지 못했습니다(' + date + ')', label };
  if (TYPES.indexOf(type) < 0 || !sch.type.has(type)) return { bad: '유형 «' + type + '» 을 노션 선택 목록에서 찾지 못했습니다', label };
  if (!studentId) return { bad: '학생 INFO 에서 «' + id + name + '» 을 찾지 못했습니다 — 확인이 필요합니다', label };
  const mm = Number(date.slice(5, 7)), yy = date.slice(2, 4);
  const monthName = (mm >= 3 && mm <= 12) ? mm + '월' : (yy + '.1-2월');
  const gub = GUBUN[String(r.gubun || '').trim()] || '';
  const props = {
    '특기사항': { title: rich(date.slice(5, 7) + date.slice(8, 10) + ' ' + type) },
    '시작날짜': { date: { start: date } },
    '유형': { select: { name: type } },
    '학번이름': { relation: [{ id: studentId }] }
  };
  if (sch.has.연번 && String(r.seq || '').trim()) props['연번'] = { rich_text: rich(String(r.seq).trim()) };
  if (sch.has.분류 && gub && sch.gubun.has(gub)) props['분류'] = { select: { name: gub } };
  if (sch.has.월 && sch.month.has(monthName)) props['월'] = { select: { name: monthName } };      // 없는 선택값은 새로 만들지 않는다
  if (sch.has.메모 && String(r.reason || '').trim()) props['메모'] = { rich_text: rich(String(r.reason).trim()) };
  /* 시간 — 기존 기록에도 시트의 «시간» 칸이 그대로 들어 있다(예: «13:00 정문확인», «5교시~») */
  if (sch.has.시간 && String(r.time || '').trim()) props['시간'] = { rich_text: rich(String(r.time).trim()) };
  if (sch.has.출석부) props['출석부'] = { checkbox: false };
  if (sch.has.NEIS) props['NEIS'] = { checkbox: false };
  return { props, label };
}

const fileEntry = (name, id) => ({ name: String(name).slice(0, 100), type: 'file_upload', file_upload: { id } });
const MB = (n) => (n / 1048576).toFixed(n >= 10485760 ? 0 : 1) + 'MB';

/* 보낼 것·이미 있는 것·못 보내는 것을 가른다. dry 이면 읽기만 한다.
   rows[i].files = [{ id, name, size, mime, path, sent }] — 증빙(이 PC 보관함). 새 기록에는 전부, 이미 있는 기록에는 «아직 안 보낸 것» 만(그 기록에 첨부가 비어 있을 때). */
async function run(token, rows, opts) {
  opts = opts || {};
  const sch = await attSchema(token);
  if (!sch.studentDb) throw new Error('출결 DB 의 «학번이름» 관계가 가리키는 학생 DB 를 찾지 못했습니다');
  const [students, existing] = await Promise.all([loadStudents(token, sch.studentDb), loadExisting(token, sch.id)]);
  const seen = new Set(existing.keys);
  const send = [], dup = [], bad = [], addOnly = [], addSkip = [];
  let limit = 0; const tooBig = [];
  const wantsFiles = (Array.isArray(rows) ? rows : []).some((r) => r.files && r.files.length);
  if (wantsFiles) limit = await fileLimit(token);
  const usable = (list) => {
    const ok = [];
    (list || []).forEach((f) => {
      if (limit && f.size > limit) tooBig.push(f.name + ' (' + MB(f.size) + ' — 노션 한도 ' + MB(limit) + ')'); else ok.push(f);
    });
    return ok;
  };
  (Array.isArray(rows) ? rows : []).slice(0, 1500).forEach((r) => {
    const sid = students.get(squash(String(r.id || '') + String(r.name || ''))) || '';
    const m = mapRow(r, sch, sid);
    if (m.bad) { bad.push({ label: m.label, why: m.bad }); return; }
    const k = sid + '|' + String(r.start).slice(0, 10) + '|' + String(r.type).trim();
    if (seen.has(k)) {
      dup.push({ label: m.label });
      const un = (r.files || []).filter((f) => !f.sent);
      if (un.length) {
        const ex = existing.byKey.get(k);
        if (ex && ex.files === 0) { const fl = usable(un); if (fl.length) addOnly.push({ label: m.label, page: ex.page, files: fl, key: r.fileKey }); }
        else if (ex) addSkip.push(m.label);                       // 노션 쪽에 이미 첨부가 있다 — 덮지 않는다
      }
      return;
    }
    seen.add(k);
    send.push({ label: m.label, props: m.props, files: usable(r.files), key: r.fileKey });
  });
  const fileCount = send.reduce((a, x) => a + x.files.length, 0) + addOnly.reduce((a, x) => a + x.files.length, 0);
  const fileBytes = send.concat(addOnly).reduce((a, x) => a + x.files.reduce((b2, f) => b2 + f.size, 0), 0);
  const needProp = fileCount > 0 && !sch.has.증빙서류;
  const summary = { ok: true, send: send.length, dup: dup.length, bad: bad.length, existing: existing.count, students: students.size,
    sendList: send.map((x) => x.label + (x.files.length ? ' · 증빙 ' + x.files.length : '')), dupList: dup.map((x) => x.label).slice(0, 300), badList: bad.slice(0, 300),
    files: { count: fileCount, bytes: fileBytes, addOnly: addOnly.length, addOnlyList: addOnly.map((x) => x.label + ' · 증빙 ' + x.files.length), addSkip: addSkip.length, tooBig, needProp, hasProp: sch.has.증빙서류, limit } };
  if (opts.dry) return summary;
  if (needProp) throw new Error('노션 출결 DB 에 «' + FILE_PROP + '» 칸(파일)이 없습니다 — 미리보기의 «칸 만들기» 단추로 먼저 만들어 주세요');
  /* ── 실제로 만든다 — 한 줄씩, 노션 속도 제한(초당 3번 안팎)에 맞춰 쉬면서 ── */
  const made = [], failed = [], uploaded = [], fileFail = [];
  const total = send.length + addOnly.length;
  let done = 0;
  const pace = () => sleep(opts.pace === undefined ? 340 : opts.pace);
  const step = (what) => { done++; if (opts.progress) opts.progress({ done, total, what: what || '' }); };
  /* 증빙을 올려 «파일 칸에 넣을 항목» 으로 — 올리다 실패한 파일은 빼고 알린다 */
  const upAll = async (label, files) => {
    const entries = [], okFiles = [];
    for (const f of files) {
      try { const id = await uploadFile(token, f); entries.push(fileEntry(f.name, id)); okFiles.push(f); }
      catch (e) { fileFail.push({ label: label + ' — ' + f.name, why: (e && e.message) || String(e) }); }
      await pace();
    }
    return { entries, okFiles };
  };
  for (let i = 0; i < send.length; i++) {
    if (opts.cancel && opts.cancel()) break;
    const it = send[i];
    try {
      let okFiles = [];
      if (it.files.length) {
        const u = await upAll(it.label, it.files);
        okFiles = u.okFiles;
        if (u.entries.length) it.props[FILE_PROP] = { files: u.entries };
      }
      const pg = await call(token, 'POST', '/pages', { parent: { database_id: sch.id }, properties: it.props });
      made.push(it.label);
      okFiles.forEach((f) => uploaded.push({ key: it.key, id: f.id, page: (pg && pg.id) || '' }));
    } catch (e) {
      failed.push({ label: it.label, why: (e && e.message) || String(e) });
      if (e && (e.status === 401 || e.status === 403)) break;                   // 열쇠·권한 문제면 더 해 봐야 같다
    }
    step(it.label);
    await pace();
  }
  for (let i = 0; i < addOnly.length; i++) {
    if (opts.cancel && opts.cancel()) break;
    const it = addOnly[i];
    try {
      const u = await upAll(it.label, it.files);
      if (u.entries.length) {
        await call(token, 'PATCH', '/pages/' + it.page, { properties: { [FILE_PROP]: { files: u.entries } } });
        u.okFiles.forEach((f) => uploaded.push({ key: it.key, id: f.id, page: it.page }));
      }
    } catch (e) {
      failed.push({ label: it.label + ' (증빙만)', why: (e && e.message) || String(e) });
      if (e && (e.status === 401 || e.status === 403)) break;
    }
    step(it.label);
    await pace();
  }
  return Object.assign(summary, { made: made.length, madeList: made, failed, uploaded, fileFail, filesSent: uploaded.length });
}

module.exports = { run, mapRow, attSchema, addFileProp, uploadFile, fileLimit, TYPES, GUBUN, ATT_DB_IDS, FILE_PROP };
