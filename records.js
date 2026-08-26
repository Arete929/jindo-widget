// 파일명: records.js | @version 1.1.0
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
const TAB_CAT = '카테고리';
const TAB_CFG = '설정';

const REC_HEAD = ['학번', '이름', '학년', '반', '번호', '카테고리', '내용', '작성일시', '수정일시'];
const DEFAULT_CATS = ['행발', '세특', '자율', '동아리', '진로', '자유학기'];

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
        { properties: { title: TAB_CFG } }
      ]
    })
  });
  const id = made.spreadsheetId;
  const now = stamp();
  await writeRange(token, id, TAB_REC + '!A1', [REC_HEAD]);
  await writeRange(token, id, TAB_CAT + '!A1',
    [['순서', '이름', '사용']].concat(DEFAULT_CATS.map((c, i) => [i + 1, c, 'Y'])));
  await writeRange(token, id, TAB_CFG + '!A1', [['항목', '값'], ['만든날짜', now]]);
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
async function saveRecord(token, id, s, cat, text, existingRow) {
  const now = stamp();
  if (existingRow) {
    // 내용·수정일시만 바꾼다 (작성일시는 그대로 둔다)
    await writeRange(token, id, `${TAB_REC}!G${existingRow}:I${existingRow}`, [[text, '', now]]);
    // 작성일시 칸을 비우지 않도록 다시 채운다
    const back = await readRange(token, id, `${TAB_REC}!H${existingRow}`);
    if (!back.length || !back[0][0]) await writeRange(token, id, `${TAB_REC}!H${existingRow}`, [[now]]);
    return { at: now, row: existingRow };
  }
  await appendRow(token, id, `${TAB_REC}!A1`,
    [s.id, s.name, s.grade, s.cls, s.no, cat, text, now, now]);
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
  readRange, writeRange, stamp, DEFAULT_CATS, TAB_REC, TAB_CAT, TAB_CFG
};
