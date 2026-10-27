/* 파일명: xlsfill.js | @version 1.0.0
   «품목내역» 엑셀(.xls, BIFF8) 틀을 «그대로 두고» 안의 내용만 채운다.
   ★ 틀(칸 너비·글꼴·테두리·머리 칸·숫자 서식)을 바꾸지 않는다 — 학교에서 받은 양식 파일의 글꼴·서식 표(XF)를 그대로 두고,
     데이터 줄(내용·규격·단위·수량·예상단가)만 새로 쓴다. 양식 파일은 assets/품목내역_틀.xls.
   ★ 외부 라이브러리 없이 BIFF 레코드를 직접 다룬다(SheetJS 같은 쓰기 도구는 서식을 지워 버린다).
   items: [{ n: 내용, spec: 규격, unit: 단위, q: 수량, p: 예상단가 }]  →  Buffer(.xls)
   검증: _tools/pm-preview/xls_check.py (xlrd 로 틀·값을 양식 파일과 비교) */
'use strict';
const SEC = 512, FREE = 0xFFFFFFFF, EOC = 0xFFFFFFFE, FATSECT = 0xFFFFFFFD;

/* ── CFB(복합 파일) 읽기 — Workbook 스트림만 꺼낸다 ── */
function cfbReadStream(buf, name) {
  if (buf.readUInt32LE(0) !== 0xE011CFD0) throw new Error('엑셀(.xls) 양식 파일이 아닙니다');
  const shift = buf.readUInt16LE(30), ss = 1 << shift;
  const sec = (i) => buf.subarray((i + 1) * ss, (i + 2) * ss);
  const nfat = buf.readUInt32LE(44), dirStart = buf.readUInt32LE(48);
  let difat = []; for (let i = 0; i < 109; i++) { const v = buf.readUInt32LE(76 + i * 4); if (v !== FREE) difat.push(v); }
  let nextDif = buf.readUInt32LE(68), ndif = buf.readUInt32LE(72);
  while (ndif-- > 0 && nextDif !== EOC && nextDif !== FREE) { const s = sec(nextDif); for (let i = 0; i < ss / 4 - 1; i++) { const v = s.readUInt32LE(i * 4); if (v !== FREE) difat.push(v); } nextDif = s.readUInt32LE(ss - 4); }
  const fat = []; difat.slice(0, nfat).forEach((fs) => { const s = sec(fs); for (let i = 0; i < ss / 4; i++) fat.push(s.readUInt32LE(i * 4)); });
  const chain = (start) => { const out = []; let c = start; while (c !== EOC && c !== FREE && out.length <= fat.length) { out.push(c); c = fat[c]; } return out; };
  const dir = Buffer.concat(chain(dirStart).map(sec));
  for (let o = 0; o + 128 <= dir.length; o += 128) {
    const nl = dir.readUInt16LE(o + 64); if (!nl) continue;
    const nm = dir.toString('utf16le', o, o + nl - 2);
    if (nm === name) {
      const start = dir.readUInt32LE(o + 116), size = dir.readUInt32LE(o + 120);
      if (size < 4096) throw new Error('양식 파일 구조를 읽지 못했습니다');
      return Buffer.concat(chain(start).map(sec)).subarray(0, size);
    }
  }
  throw new Error('양식 파일에 Workbook 이 없습니다');
}

/* ── CFB 쓰기 — Workbook 스트림 하나짜리(엑셀이 그대로 연다) ── */
function cfbWrite(stream) {
  if (stream.length < 4096) stream = Buffer.concat([stream, Buffer.alloc(4096 - stream.length)]);
  const nd = Math.ceil(stream.length / SEC);
  let nf = 1; while (nf * 128 < nd + 1 + nf) nf++;
  const total = nd + nf + 1, out = Buffer.alloc(SEC * (1 + total), 0);
  // 머리
  Buffer.from('D0CF11E0A1B11AE1', 'hex').copy(out, 0);
  out.writeUInt16LE(0x3E, 24); out.writeUInt16LE(3, 26); out.writeUInt16LE(0xFFFE, 28); out.writeUInt16LE(9, 30); out.writeUInt16LE(6, 32);
  out.writeUInt32LE(nf, 44); out.writeUInt32LE(nd + nf, 48); out.writeUInt32LE(4096, 56); out.writeUInt32LE(EOC, 60); out.writeUInt32LE(0, 64); out.writeUInt32LE(EOC, 68); out.writeUInt32LE(0, 72);
  for (let i = 0; i < 109; i++) out.writeUInt32LE(i < nf ? nd + i : FREE, 76 + i * 4);
  // 데이터 / FAT / 디렉터리
  stream.copy(out, SEC);
  const fat = new Array(nf * 128).fill(FREE);
  for (let i = 0; i < nd; i++) fat[i] = i === nd - 1 ? EOC : i + 1;
  for (let i = 0; i < nf; i++) fat[nd + i] = FATSECT;
  fat[nd + nf] = EOC;
  fat.forEach((v, i) => out.writeUInt32LE(v, SEC * (1 + nd) + i * 4));
  const d0 = SEC * (1 + nd + nf);
  const ent = (o, name, type, child, start, size) => {
    out.write(name, o, 'utf16le'); out.writeUInt16LE(name ? (name.length + 1) * 2 : 0, o + 64);
    out.writeUInt8(type, o + 66); out.writeUInt8(1, o + 67);
    out.writeUInt32LE(FREE, o + 68); out.writeUInt32LE(FREE, o + 72); out.writeUInt32LE(child, o + 76);
    out.writeUInt32LE(start, o + 116); out.writeUInt32LE(size, o + 120);
  };
  ent(d0, 'Root Entry', 5, 1, EOC, 0);
  ent(d0 + 128, 'Workbook', 2, FREE, 0, stream.length);
  ent(d0 + 256, '', 0, FREE, 0, 0); out.writeUInt8(0, d0 + 256 + 67);
  ent(d0 + 384, '', 0, FREE, 0, 0); out.writeUInt8(0, d0 + 384 + 67);
  return out;
}

/* ── BIFF 레코드 ── */
const T = { BOF: 0x809, EOF: 0x0A, BOUNDSHEET: 0x85, SST: 0xFC, EXTSST: 0xFF, INDEX: 0x20B, DIM: 0x200, ROW: 0x208, LABELSST: 0xFD, NUMBER: 0x203, BLANK: 0x201, MULRK: 0xBD, MULBLANK: 0xBE, RK: 0x27E, DBCELL: 0xD7, CONTINUE: 0x3C, COLINFO: 0x7D };
function parseRecs(d) { const r = []; let i = 0; while (i + 4 <= d.length) { const t = d.readUInt16LE(i), l = d.readUInt16LE(i + 2); r.push({ t, data: d.subarray(i + 4, i + 4 + l) }); i += 4 + l; } return r; }
function rec(t, data) { const h = Buffer.alloc(4); h.writeUInt16LE(t, 0); h.writeUInt16LE(data.length, 2); return Buffer.concat([h, data]); }

/* 공유 문자열 표(SST) — 8224 바이트를 넘으면 CONTINUE 로 잇는다 */
function buildSst(strs, totalRefs) {
  const MAX = 8224, recs = []; let cur = Buffer.alloc(8); cur.writeUInt32LE(totalRefs, 0); cur.writeUInt32LE(strs.length, 4);
  let first = true;
  const flush = () => { recs.push(rec(first ? T.SST : T.CONTINUE, cur)); first = false; cur = Buffer.alloc(0); };
  strs.forEach((s) => {
    const wide = /[^\x00-\xFF]/.test(s), enc = wide ? 'utf16le' : 'latin1', bytes = Buffer.from(s, enc), per = wide ? 2 : 1;
    const head = Buffer.alloc(3); head.writeUInt16LE(Math.min(s.length, 0xFFFF), 0); head.writeUInt8(wide ? 1 : 0, 2);
    if (cur.length + 3 + per > MAX) flush();
    cur = Buffer.concat([cur, head]); let pos = 0;
    while (pos < bytes.length) {
      const room = MAX - cur.length, take = Math.min(bytes.length - pos, room - (room % per));
      cur = Buffer.concat([cur, bytes.subarray(pos, pos + take)]); pos += take;
      if (pos < bytes.length) { flush(); cur = Buffer.from([wide ? 1 : 0]); }
    }
  });
  if (cur.length) flush();
  return Buffer.concat(recs);
}

function fillTemplate(templateBuf, items) {
  const wb = cfbReadStream(templateBuf, 'Workbook'), recs = parseRecs(wb);
  const firstEof = recs.findIndex((r) => r.t === T.EOF), sheetBof = firstEof + 1;
  if (recs[sheetBof].t !== T.BOF) throw new Error('양식 파일의 시트를 찾지 못했습니다');
  const g = recs.slice(0, firstEof + 1), sh = recs.slice(sheetBof);
  // 틀에서 그대로 가져올 것: 머리 줄·데이터 줄의 서식 번호(XF), ROW 모양
  const sstOld = (() => { // 양식의 문자열 읽기(머리 칸 글자를 그대로 쓰려고)
    const sr = g.filter((r) => r.t === T.SST || (r.t === T.CONTINUE)); const raw = Buffer.concat(sr.map((r, i) => i === 0 ? r.data : r.data.subarray(1)));
    const n = raw.readUInt32LE(4), out = []; let p = 8;
    for (let k = 0; k < n; k++) { const cch = raw.readUInt16LE(p), fl = raw[p + 2]; p += 3; if (fl & 8) p += 2; if (fl & 4) p += 4; const wide = fl & 1, len = cch * (wide ? 2 : 1); out.push(raw.toString(wide ? 'utf16le' : 'latin1', p, p + len)); p += len; if (fl & 8) p += 0; }
    return out;
  })();
  const cells = sh.filter((r) => r.t === T.LABELSST || r.t === T.NUMBER || r.t === T.BLANK || r.t === T.MULRK || r.t === T.RK);
  const xfAt = (row, col) => { for (const r of cells) { if (r.data.readUInt16LE(0) === row && r.data.readUInt16LE(2) === col) return r.data.readUInt16LE(4); if (r.t === T.MULRK && r.data.readUInt16LE(0) === row) { const c1 = r.data.readUInt16LE(2), c2 = r.data.readUInt16LE(r.data.length - 2); if (col >= c1 && col <= c2) return r.data.readUInt16LE(4 + (col - c1) * 6); } } return -1; };
  const headXf = [0, 1, 2, 3, 4].map((c) => xfAt(0, c)), dataXf = [0, 1, 2, 3, 4].map((c) => xfAt(1, c));
  if (headXf.some((x) => x < 0) || dataXf[0] < 0 || dataXf[3] < 0 || dataXf[4] < 0) throw new Error('양식 파일의 서식 번호를 읽지 못했습니다');
  const rowTpl = sh.find((r) => r.t === T.ROW);
  const heads = [0, 1, 2, 3, 4].map((c) => { const r = cells.find((x) => x.t === T.LABELSST && x.data.readUInt16LE(0) === 0 && x.data.readUInt16LE(2) === c); return sstOld[r.data.readUInt32LE(6)]; });

  // 새 문자열 표
  const strs = [], idx = {}; let refs = 0;
  const sid = (s) => { refs++; if (!(s in idx)) { idx[s] = strs.length; strs.push(s); } return idx[s]; };
  const body = []; // {row, bufs[]}
  const lab = (r, c, xf, s) => { const b = Buffer.alloc(10); b.writeUInt16LE(r, 0); b.writeUInt16LE(c, 2); b.writeUInt16LE(xf, 4); b.writeUInt32LE(sid(s), 6); return rec(T.LABELSST, b); };
  const num = (r, c, xf, v) => { const b = Buffer.alloc(14); b.writeUInt16LE(r, 0); b.writeUInt16LE(c, 2); b.writeUInt16LE(xf, 4); b.writeDoubleLE(v, 6); return rec(T.NUMBER, b); };
  const blank = (r, c, xf) => { const b = Buffer.alloc(6); b.writeUInt16LE(r, 0); b.writeUInt16LE(c, 2); b.writeUInt16LE(xf, 4); return rec(T.BLANK, b); };
  body.push({ row: 0, bufs: heads.map((h, c) => lab(0, c, headXf[c], h)) });
  items.forEach((it, i) => {
    const r = i + 1, b = [lab(r, 0, dataXf[0], String(it.n || '')), String(it.spec || '') ? lab(r, 1, dataXf[1], String(it.spec)) : blank(r, 1, dataXf[1])];
    if (String(it.unit || '')) b.push(lab(r, 2, dataXf[1], String(it.unit)));   // 단위는 양식에 비어 있다 — 쓸 때만, 옆 칸(규격)과 같은 서식으로
    b.push(num(r, 3, dataXf[3], Number(it.q) || 0), num(r, 4, dataXf[4], Number(it.p) || 0));
    body.push({ row: r, bufs: b });
  });
  const nrows = body.length;

  // 시트 레코드 조립(절대 위치가 필요해서 앞에서부터 순서대로)
  const sstBuf = buildSst(strs, refs);
  const gOut = []; g.forEach((r) => { if (r.t === T.SST) gOut.push(sstBuf); else if (r.t !== T.EXTSST) gOut.push(rec(r.t, Buffer.from(r.data))); });
  const globalLen = gOut.reduce((a, b) => a + b.length, 0);
  // BOUNDSHEET 의 시트 시작 위치는 전역 영역 길이와 같다
  const bsIdx = g.filter((r) => r.t !== T.SST && r.t !== T.EXTSST).findIndex((r) => r.t === T.BOUNDSHEET);
  const bsBuf = Buffer.from(g.find((r) => r.t === T.BOUNDSHEET).data); bsBuf.writeUInt32LE(globalLen, 0);
  const gFinal = []; let gi = 0; g.forEach((r) => { if (r.t === T.EXTSST) return; if (r.t === T.SST) { gFinal.push(sstBuf); return; } gFinal.push(rec(r.t, r.t === T.BOUNDSHEET ? bsBuf : Buffer.from(r.data))); gi++; });

  const di = sh.findIndex((r) => r.t === T.DIM), pre = sh.slice(1, di).filter((r) => r.t !== T.INDEX), dbcI = sh.findIndex((r) => r.t === T.DBCELL), post = sh.slice(dbcI + 1);
  const bof = rec(sh[0].t, Buffer.from(sh[0].data));
  const preBufs = pre.map((r) => rec(r.t, Buffer.from(r.data)));
  const dimData = Buffer.alloc(14); dimData.writeUInt32LE(0, 0); dimData.writeUInt32LE(nrows, 4); dimData.writeUInt16LE(0, 8); dimData.writeUInt16LE(5, 10);
  const dim = rec(T.DIM, dimData);
  const blocks = []; for (let i = 0; i < nrows; i += 32) blocks.push(body.slice(i, i + 32));
  const indexLen = 4 + 16 + 4 * blocks.length;
  let pos = globalLen + bof.length + indexLen + preBufs.reduce((a, b) => a + b.length, 0);
  const defcolPos = (() => { let p = globalLen + bof.length + indexLen; for (let i = 0; i < pre.length; i++) { if (pre[i].t === 0x55) return p; p += preBufs[i].length; } return 0; })();
  pos += dim.length;
  const outBlocks = [], dbcPos = [];
  blocks.forEach((blk) => {
    const rowBufs = blk.map((x) => { const d = Buffer.from(rowTpl.data); d.writeUInt16LE(x.row, 0); d.writeUInt16LE(0, 2); d.writeUInt16LE(5, 4); return rec(T.ROW, d); });
    const rowLen = rowBufs.reduce((a, b) => a + b.length, 0), cellLens = blk.map((x) => x.bufs.reduce((a, b) => a + b.length, 0)), cellLen = cellLens.reduce((a, b) => a + b, 0);
    const dbDataLen = 4 + 2 * blk.length, dbStart = pos + rowLen + cellLen;
    const dd = Buffer.alloc(dbDataLen); dd.writeUInt32LE(dbStart - pos, 0);
    blk.forEach((x, i) => dd.writeUInt16LE(i === 0 ? rowBufs[0].length * (blk.length - 1) : cellLens[i - 1], 4 + 2 * i));
    dbcPos.push(dbStart);
    outBlocks.push(Buffer.concat([...rowBufs, ...blk.flatMap((x) => x.bufs), rec(T.DBCELL, dd)]));
    pos = dbStart + 4 + dbDataLen;
  });
  const ix = Buffer.alloc(16 + 4 * blocks.length); ix.writeUInt32LE(0, 0); ix.writeUInt32LE(0, 4); ix.writeUInt32LE(nrows, 8); ix.writeUInt32LE(defcolPos, 12);
  dbcPos.forEach((p, i) => ix.writeUInt32LE(p, 16 + 4 * i));
  const sheet = Buffer.concat([bof, rec(T.INDEX, ix), ...preBufs, dim, ...outBlocks, ...post.map((r) => rec(r.t, Buffer.from(r.data)))]);
  return cfbWrite(Buffer.concat([...gFinal, sheet]));
}

module.exports = { fillTemplate, cfbReadStream };
