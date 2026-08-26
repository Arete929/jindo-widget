// 파일명: records.js | @version 1.2.0
// 학생기록 — 구글 시트를 만들고 읽고 쓴다.
//
// 시트 짜임
//   기록      학번 · 이름 · 학년 · 반 · 번호 · 카테고리 · 내용 · 작성일시 · 수정일시
//   카테고리  순서 · 이름 · 사용
//   설정      항목 · 값        (만든날짜 등)
//
// ★ 시트는 «앱이 만든 것» 이라 drive.file 권한만으로 읽고 쓰고 휴지통에 보낼 수 있다.
//   지우기는 완전삭제가 아니라 휴지통이다 — 30일 안에 되살릴 수 있다.

const { json } = require('./httpx.js');

const SHEETS = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE = 'https://www.googleapis.com/drive/v3/files';

const TAB_REC = '기록';
const TAB_NOTE = '수업메모';   // 컴시간 시간표로 적는 수업 메모(=진도표)
const TAB_CAT = '카테고리';
const TAB_CFG = '설정';

const REC_HEAD = ['학번', '이름', '학년', '반', '번호', '카테고리', '내용', '작성일시', '수정일시'];
const DEFAULT_CATS = ['행발', '세특', '자율', '동아리', '진로', '자유학기'];
/* 수업메모 — 날짜와 교시가 «어느 수업인지» 를 가리키고, 메모 한 줄이 알맹이다.
   차시는 그 학급에 적은 메모의 순번이다(시간표로 세면 휴업일까지 따져야 해서). */
const NOTE_HEAD = ['날짜', '요일', '교시', '학급', '과목', '차시', '메모', '적은때'];

/* 화면에 보여줄 «2026.08.25 10:42:03» 꼴 (KST 는 이 PC 시계를 그대로 쓴다) */
function stamp(d) {
  const t = d || new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${t.getFullYear()}.${p(t.getMonth() + 1)}.${p(t.getDate())} `
    + `${p(t.getHours())}:${p(t.getMinutes())}:${p(t.getSeconds())}`;
}
function esc(name) { return encodeURIComponent(name); }

/* ── 이미 있는 것 찾기 ──
   ★ 두 PC 에서 쓸 때를 위한 것이다. 두 번째 PC 는 «시트 기록» 이 비어 있어서
     그냥 두면 «시트 만들기» 를 눌러 시트가 하나 더 생기고, 기록이 두 곳으로 갈린다.
     drive.file 권한은 «이 앱이 만든 파일» 을 볼 수 있으니, 만들기 전에 먼저 찾아본다. */
async function findSheet(token, title) {
  // 이름은 여러 개를 받을 수 있다 — 앱 이름이 바뀌어도 옛 시트를 찾아야 하기 때문이다
  const names = (Array.isArray(title) ? title : [title || '[혜원이지] 학생기록'])
    .map((n) => String(n).replace(/'/g, "\\'"));
  const q = "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false and ("
    + names.map((n) => "name='" + n + "'").join(' or ') + ')';
  const r = await json({
    url: DRIVE + '?q=' + esc(q)
      + '&fields=' + esc('files(id,name,createdTime,modifiedTime)')
      + '&orderBy=createdTime&pageSize=10',
    token: token
  });
  const f = ((r && r.files) || [])[0];
  if (!f) return null;
  return {
    id: f.id,
    url: 'https://docs.google.com/spreadsheets/d/' + f.id + '/edit',
    createdAt: f.createdTime ? stamp(new Date(f.createdTime)) : ''
  };
}

/* ── 만들기 ── */
async function createSheet(token, title) {
  const made = await json({
    method: 'POST', url: SHEETS, token: token,
    contentType: 'application/json',
    body: JSON.stringify({
      properties: { title: title || '[혜원이지] 학생기록' },
      sheets: [
        { properties: { title: TAB_REC } },
        { properties: { title: TAB_CAT } },
        { properties: { title: TAB_CFG } },
        { properties: { title: TAB_NOTE } }
      ]
    })
  });
  const id = made.spreadsheetId;
  const now = stamp();
  await writeRange(token, id, TAB_REC + '!A1', [REC_HEAD]);
  await writeRange(token, id, TAB_CAT + '!A1',
    [['순서', '이름', '사용']].concat(DEFAULT_CATS.map((c, i) => [i + 1, c, 'Y'])));
  await writeRange(token, id, TAB_CFG + '!A1', [['항목', '값'], ['만든날짜', now]]);
  await writeRange(token, id, TAB_NOTE + '!A1', [NOTE_HEAD]);
  return { id: id, url: made.spreadsheetUrl || (`https://docs.google.com/spreadsheets/d/${id}/edit`), createdAt: now };
}

/* ── 휴지통으로 ── */
async function trashSheet(token, id) {
  await json({
    method: 'PATCH', url: `${DRIVE}/${id}?supportsAllDrives=true`, token: token,
    contentType: 'application/json',
    body: JSON.stringify({ trashed: true })
  });
  return stamp();
}

/* ── 칸 읽기·쓰기 ── */
async function readRange(token, id, range) {
  const r = await json({ url: `${SHEETS}/${id}/values/${esc(range)}`, token: token });
  return (r && r.values) || [];
}
async function writeRange(token, id, range, values) {
  return json({
    method: 'PUT',
    url: `${SHEETS}/${id}/values/${esc(range)}?valueInputOption=USER_ENTERED`,
    token: token, contentType: 'application/json',
    body: JSON.stringify({ values: values })
  });
}
async function appendRow(token, id, range, row) {
  return json({
    method: 'POST',
    url: `${SHEETS}/${id}/values/${esc(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    token: token, contentType: 'application/json',
    body: JSON.stringify({ values: [row] })
  });
}

/* ── 수업메모 ──────────────────────────────────────────────
   ★ 옛 시트에는 「수업메모」 탭이 없다. 쓰기 전에 한 번 확인해서 없으면 만든다.
     (없는 탭에 쓰면 «Unable to parse range» 로 조용히 실패한다) */
async function tabNames(token, id) {
  const r = await json({
    url: `${SHEETS}/${id}?fields=` + esc('sheets(properties(title))'),
    token: token
  });
  return ((r && r.sheets) || []).map((s) => (s.properties || {}).title || '');
}
async function ensureNoteTab(token, id) {
  const names = await tabNames(token, id);
  if (names.indexOf(TAB_NOTE) >= 0) return false;
  await json({
    method: 'POST', url: `${SHEETS}/${id}:batchUpdate`, token: token,
    contentType: 'application/json',
    body: JSON.stringify({ requests: [{ addSheet: { properties: { title: TAB_NOTE } } }] })
  });
  await writeRange(token, id, TAB_NOTE + '!A1', [NOTE_HEAD]);
  return true;
}
async function loadNotes(token, id) {
  let rows;
  try { rows = await readRange(token, id, `${TAB_NOTE}!A2:H`); }
  catch (e) { await ensureNoteTab(token, id); rows = []; }
  return rows.map((r, i) => ({
    row: i + 2,
    date: String(r[0] || ''), dow: String(r[1] || ''),
    p: Number(r[2]) || 0, cls: String(r[3] || ''), subject: String(r[4] || ''),
    n: Number(r[5]) || 0, text: String(r[6] || ''), at: String(r[7] || '')
  })).filter((x) => x.date && x.cls);
}
/* 한 줄 담기 — 같은 날·같은 교시가 이미 있으면 그 줄을 고친다 */
async function saveNote(token, id, o) {
  await ensureNoteTab(token, id);
  const all = await loadNotes(token, id);
  const mine = all.filter((x) => x.date === o.date && x.p === o.p);
  // 차시 — 그 학급에 적은 «몇 번째» 메모인가. 고치는 것이면 본래 차시를 지킨다.
  const n = mine.length ? mine[0].n
    : all.filter((x) => x.cls === o.cls).length + 1;
  const at = stamp();
  const row = [o.date, o.dow, o.p, o.cls, o.subject || '', n, o.text || '', at];
  if (mine.length) await writeRange(token, id, `${TAB_NOTE}!A${mine[0].row}`, [row]);
  else await appendRow(token, id, `${TAB_NOTE}!A1`, row);
  return { at: at, n: n };
}

/* ── 통째로 읽어 오기 ── */
async function loadAll(token, id) {
  const [rec, cat, cfg] = await Promise.all([
    readRange(token, id, `${TAB_REC}!A2:I`),
    readRange(token, id, `${TAB_CAT}!A2:C`),
    readRange(token, id, `${TAB_CFG}!A2:B`)
  ]);
  const records = rec.map((r, i) => ({
    row: i + 2,                   // 시트에서 몇 번째 줄인지 — 고칠 때 쓴다
    id: String(r[0] || ''), name: String(r[1] || ''),
    grade: Number(r[2]) || 0, cls: Number(r[3]) || 0, no: Number(r[4]) || 0,
    cat: String(r[5] || ''), text: String(r[6] || ''),
    at: String(r[7] || ''), edited: String(r[8] || '')
  })).filter((x) => x.id && x.cat);
  const cats = cat
    .map((r) => ({ order: Number(r[0]) || 0, name: String(r[1] || '').trim(), on: String(r[2] || 'Y') !== 'N' }))
    .filter((c) => c.name)
    .sort((a, b) => a.order - b.order);
  const conf = {};
  cfg.forEach((r) => { if (r[0]) conf[String(r[0]).trim()] = String(r[1] || ''); });
  return { records: records, cats: cats.length ? cats : DEFAULT_CATS.map((c, i) => ({ order: i + 1, name: c, on: true })), conf: conf };
}

/* ── 한 건 저장 ── 같은 학생·같은 카테고리 것이 있으면 고쳐 쓴다 ── */
async function saveRecord(token, id, s, cat, text, existingRow, when) {
  const now = stamp();
  // 고른 날짜가 있으면 «작성일시» 는 그 날로 적는다. 시각까지는 안 정하므로
  // 그 날 09:00 으로 둔다 — 시트에서 날짜만 보고 줄을 세울 수 있으면 된다.
  const at = /^\d{4}\.\d{2}\.\d{2}$/.test(String(when || '')) ? when + ' 09:00:00' : now;
  if (existingRow) {
    // 내용·수정일시만 바꾼다 (작성일시는 그대로 둔다)
    await writeRange(token, id, `${TAB_REC}!G${existingRow}:I${existingRow}`, [[text, '', now]]);
    // 작성일시 칸을 비우지 않도록 다시 채운다
    const back = await readRange(token, id, `${TAB_REC}!H${existingRow}`);
    if (!back.length || !back[0][0]) await writeRange(token, id, `${TAB_REC}!H${existingRow}`, [[now]]);
    return { at: now, row: existingRow };
  }
  await appendRow(token, id, `${TAB_REC}!A1`,
    [s.id, s.name, s.grade, s.cls, s.no, cat, text, at, now]);
  return { at: now, row: 0 };
}

/* ── 한 건 지우기 (내용을 비운다 — 줄을 없애면 다른 줄 번호가 밀린다) ── */
async function clearRecord(token, id, row) {
  await writeRange(token, id, `${TAB_REC}!G${row}:I${row}`, [['', '', stamp()]]);
  return stamp();
}

/* ── 카테고리 저장 ── */
async function saveCats(token, id, cats) {
  const rows = cats.map((c, i) => [i + 1, c.name, c.on === false ? 'N' : 'Y']);
  // 넉넉히 지우고 다시 쓴다 (줄 수가 줄어들 수 있다)
  await writeRange(token, id, `${TAB_CAT}!A2:C200`,
    rows.concat(Array.from({ length: Math.max(0, 199 - rows.length) }, () => ['', '', ''])));
  return stamp();
}

/* ── 설정 칸에 한 줄 적기 (만든날짜·지운날짜 등) ── */
async function putConf(token, id, key, value) {
  const cur = await readRange(token, id, `${TAB_CFG}!A2:B`);
  const i = cur.findIndex((r) => String(r[0]).trim() === key);
  if (i >= 0) await writeRange(token, id, `${TAB_CFG}!A${i + 2}:B${i + 2}`, [[key, value]]);
  else await appendRow(token, id, `${TAB_CFG}!A1`, [key, value]);
}

module.exports = {
  findSheet, createSheet, trashSheet, loadAll, saveRecord, clearRecord, saveCats, putConf,
  readRange, writeRange, stamp, DEFAULT_CATS, TAB_REC, TAB_CAT, TAB_CFG,
  TAB_NOTE, NOTE_HEAD, ensureNoteTab, loadNotes, saveNote
};
