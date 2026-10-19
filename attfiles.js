// 파일명: attfiles.js | @version 1.4.0 — 출결 «증빙서류» 보관함 (지비스 전용, 이 PC) — v1.4.0 드라이브에 «무엇을 올렸는지»(drive.src) 를 적어 둔다(줄여서 올려도 다시 올리지 않게) / v1.3.0 구글 드라이브에 올린 기록(drive) / v1.2.0 원래 이름(orig)을 기억(이름을 바꿔도 같은 파일 중복 방지) / v1.1.0 이름 바꾸기(rename) 추가
//
// ★ 출결 줄마다 증빙(이미지·영상·PDF·무엇이든)을 붙여 두는 곳. 줄의 열쇠는 «학번|날짜|유형»
//   (노션 겹침 검사와 같은 열쇠 — 줄을 고쳐 날짜·유형이 바뀌면 move 로 따라 옮긴다).
// ★ 파일은 이 PC 의 앱 폴더(userData\\att-files)에만 둔다. 서버·OneDrive 로 나가지 않는다 —
//   «노션으로» 를 눌러 노션에 올릴 때만 나간다. (학생 서류라 두 PC 에 따로 있다.)
// ★ 이 파일은 Electron 을 쓰지 않는다 — 폴더만 받아서 일한다(시험이 쉽다).

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MAX_BYTES = 500 * 1024 * 1024;       // 한 파일 500MB — 영상까지
const MIME = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp', heic: 'image/heic', heif: 'image/heif', svg: 'image/svg+xml', tif: 'image/tiff', tiff: 'image/tiff',
  mp4: 'video/mp4', mov: 'video/quicktime', m4v: 'video/x-m4v', avi: 'video/x-msvideo', wmv: 'video/x-ms-wmv', mkv: 'video/x-matroska', webm: 'video/webm', '3gp': 'video/3gpp',
  pdf: 'application/pdf', hwp: 'application/x-hwp', hwpx: 'application/vnd.hancom.hwpx', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain', csv: 'text/csv', zip: 'application/zip', mp3: 'audio/mpeg', m4a: 'audio/mp4', wav: 'audio/wav'
};
const extOf = (n) => path.extname(String(n || '')).slice(1).toLowerCase();
const mimeOf = (n) => MIME[extOf(n)] || 'application/octet-stream';
const kindOf = (n) => { const m = mimeOf(n); return m.indexOf('image/') === 0 ? 'image' : m.indexOf('video/') === 0 ? 'video' : m === 'application/pdf' ? 'pdf' : 'file'; };
/* 윈도우 파일 이름에 못 쓰는 글자를 바꾼다 */
const cleanName = (n) => String(n || '파일').replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/^\.+/, '').slice(0, 120) || '파일';
const keyOf = (id, date, type) => String(id || '').trim() + '|' + String(date || '').trim() + '|' + String(type || '').trim();

function open(rootDir) {
  const dir = path.join(rootDir, 'att-files');
  const idx = path.join(dir, 'index.json');
  let db = {};
  try { db = JSON.parse(fs.readFileSync(idx, 'utf8')) || {}; } catch (e) { db = {}; }
  const save = () => { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(idx + '.tmp', JSON.stringify(db)); fs.renameSync(idx + '.tmp', idx); };
  const fileOf = (e) => path.join(dir, e.id + (extOf(e.name) ? '.' + extOf(e.name) : ''));
  const pub = (e) => ({ id: e.id, name: e.name, size: e.size, mime: e.mime, kind: e.kind, addedAt: e.addedAt, sent: e.sent || null, drive: e.drive || null });
  const newId = () => crypto.randomBytes(6).toString('hex');
  const stamp = () => new Date().toISOString();

  function push(key, e) {
    (db[key] = db[key] || []).push(e); save(); return pub(e);
  }
  return {
    dir,
    /* 모든 줄의 목록 { key: [ {id,name,size,mime,kind,sent} ] } */
    list() { const out = {}; Object.keys(db).forEach((k) => { if (db[k].length) out[k] = db[k].map(pub); }); return out; },
    filesOf(key) { return (db[key] || []).map((e) => Object.assign(pub(e), { path: fileOf(e) })); },
    /* 파일 하나를 복사해 둔다 — 같은 이름·같은 크기가 이미 붙어 있으면 건너뛴다(두 번 끌어다 놓아도 겹치지 않게) */
    addPath(key, src) {
      const st = fs.statSync(src);
      if (!st.isFile()) throw new Error('파일이 아닙니다');
      if (st.size > MAX_BYTES) throw new Error('파일이 너무 큽니다(500MB 초과): ' + path.basename(src));
      const name = cleanName(path.basename(src));
      const dup = (db[key] || []).filter((e) => (e.name === name || e.orig === name) && e.size === st.size)[0];
      if (dup) return Object.assign(pub(dup), { dup: true });
      const e = { id: newId(), name, orig: name, size: st.size, mime: mimeOf(name), kind: kindOf(name), addedAt: stamp(), sent: null };
      fs.mkdirSync(dir, { recursive: true });
      fs.copyFileSync(src, fileOf(e));
      return push(key, e);
    },
    /* 붙여넣은 그림처럼 «경로 없이 내용만» 온 것 */
    addBytes(key, nameIn, bytes) {
      const buf = Buffer.from(bytes || []);
      if (!buf.length) throw new Error('내용이 비어 있습니다');
      if (buf.length > MAX_BYTES) throw new Error('파일이 너무 큽니다(500MB 초과)');
      const name = cleanName(nameIn);
      const dup = (db[key] || []).filter((e) => (e.name === name || e.orig === name) && e.size === buf.length)[0];
      if (dup) return Object.assign(pub(dup), { dup: true });
      const e = { id: newId(), name, orig: name, size: buf.length, mime: mimeOf(name), kind: kindOf(name), addedAt: stamp(), sent: null };
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(fileOf(e), buf);
      return push(key, e);
    },
    del(key, id) {
      const list = db[key] || [], e = list.filter((x) => x.id === id)[0];
      if (!e) return false;
      try { fs.unlinkSync(fileOf(e)); } catch (err) { /* 이미 없어도 목록에서는 뺀다 */ }
      db[key] = list.filter((x) => x.id !== id);
      if (!db[key].length) delete db[key];
      save(); return true;
    },
    /* 드라이브 기록 — { id, url, name, at } 올렸음 / { err, name } 못 올렸음 / null 지움 */
    setDrive(key, id, info) { const e = (db[key] || []).filter((x) => x.id === id)[0]; if (!e) return false; if (info) e.drive = info; else delete e.drive; save(); return true; },
    entry(key, id) { const e = (db[key] || []).filter((x) => x.id === id)[0]; return e ? Object.assign(pub(e), { path: fileOf(e) }) : null; },
    /* 드라이브에 올려야 하는데 아직(또는 이름이 바뀌어) 안 올라간 것들 */
    pending() {
      const out = [];
      Object.keys(db).forEach((k) => db[k].forEach((e) => { if (!e.drive || (e.drive.id && (e.drive.src || e.drive.name) !== e.name) || (e.drive.retry)) out.push({ key: k, id: e.id }); }));
      return out;
    },
    pathOf(key, id) { const e = (db[key] || []).filter((x) => x.id === id)[0]; return e ? fileOf(e) : ''; },
    /* 줄의 열쇠가 바뀌면(날짜·유형·학생을 고침) 붙여 둔 것도 따라간다 */
    move(oldKey, newKey) {
      if (!oldKey || !newKey || oldKey === newKey || !db[oldKey]) return false;
      db[newKey] = (db[newKey] || []).concat(db[oldKey]); delete db[oldKey]; save(); return true;
    },
    /* 이름 바꾸기 — 확장자는 그대로(파일 종류가 달라지면 안 된다). 같은 줄에 같은 이름이 있으면 (2) 를 붙인다.
       디스크의 파일(<id>.<확장자>)은 그대로고 목록의 이름만 바뀐다 — 노션에 올릴 때·열 때 이 이름이 쓰인다. */
    rename(key, id, nameIn) {
      const list = db[key] || [], e = list.filter((x) => x.id === id)[0];
      if (!e) throw new Error('파일을 찾지 못했습니다');
      const ext = extOf(e.name);
      let base = String(nameIn == null ? '' : nameIn).trim();
      const typed = extOf(base);
      if (typed && MIME[typed] && typed !== ext) throw new Error('확장자는 바꿀 수 없습니다 (.' + ext + ')');
      if (typed && typed === ext) base = base.slice(0, base.length - typed.length - 1);
      base = base.replace(/[.\s]+$/, '');
      if (!base) throw new Error('이름을 적어 주세요');
      base = cleanName(base).slice(0, 110);
      let name = base + (ext ? '.' + ext : ''), n = 2;
      while (list.some((x) => x.id !== id && x.name === name)) name = base + ' (' + (n++) + ')' + (ext ? '.' + ext : '');
      e.name = name; save(); return pub(e);
    },
    /* 노션에 올렸다는 표시 — { page, at } */
    markSent(key, id, info) { const e = (db[key] || []).filter((x) => x.id === id)[0]; if (!e) return false; e.sent = info; save(); return true; }
  };
}

module.exports = { open, mimeOf, kindOf, extOf, cleanName, keyOf, MAX_BYTES };
