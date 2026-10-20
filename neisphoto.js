// 파일명: neisphoto.js | @version 1.0.0 — NEIS «사진명렬표» PDF → 학급별 사진(JPEG) 뽑기 (지비스 전용, 메인 프로세스)
/* NEIS 에서 «사진명렬표» 로 내려받은 PDF(반마다 한 파일, 사진 격자 + «N번 이름»)에서 학생 사진을 읽어 순서대로 돌려준다.
   ★ 글(번호·이름)은 PDF 글꼴이 글자 번호만 담고 있어 읽을 수 없다 → 쓰지 않는다.
     대신 «사진이 놓인 자리» 로 순서(왼쪽→오른쪽, 위→아래, 쪽 차례)를 정하고, 그 순서가 곧 번호 순서다.
     짝짓기는 호출하는 쪽이 학급 명단(번호순)과 «사람 수가 같을 때만» 한다.
   ★ 학생 얼굴이다 — 이 모듈은 읽기만 하고 아무 데도 쓰지 않는다. 결과는 호출한 쪽(화면)으로만 간다.
   ★ 반은 파일 이름(2-1.pdf · 2학년 1반.pdf · 2학년/1반.pdf)으로 알아낸다. 알 수 없으면 key 를 비워 돌려준다(화면이 알린다). */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const MAX_PDF = 60;                 // 한 번에 읽을 PDF 개수
const MAX_BYTES = 60 * 1024 * 1024; // PDF 하나의 크기 한도
const MAX_PHOTOS = 80;              // PDF 하나에서 뽑을 사진 수 한도(한 반은 많아야 40명대)

/* ── 반 알아내기 ── */
function classKeyOf(label) {
  const s = String(label || '').replace(/\\/g, '/');
  let m = s.match(/(?:^|[^0-9])([1-6])\s*[-_·.]\s*(\d{1,2})(?:[^0-9]|$)/);          // 2-1 · 2_1 · 2.1
  if (m) return m[1] + '-' + Number(m[2]);
  m = s.match(/([1-6])\s*학년\s*[-_ /]*\s*(\d{1,2})\s*반/);                           // 2학년 1반 · 2학년_1반
  if (m) return m[1] + '-' + Number(m[2]);
  const parts = s.split('/'), base = parts[parts.length - 1] || '';
  const mb = base.match(/(\d{1,2})\s*반/), mg = parts.slice(0, -1).join('/').match(/([1-6])\s*학년/);   // 2학년/1반.pdf
  if (mb && mg) return mg[1] + '-' + Number(mb[1]);
  return '';
}

/* ── 아주 작은 zip 읽기(중앙 디렉터리 + inflateRaw) — 새 패키지 없이 ── */
function zipEntries(buf) {
  let e = buf.length - 22;
  while (e >= 0 && buf.readUInt32LE(e) !== 0x06054b50) e--;
  if (e < 0) throw new Error('zip 파일이 아닙니다');
  const n = buf.readUInt16LE(e + 10);
  let p = buf.readUInt32LE(e + 16);
  const out = [];
  for (let i = 0; i < n; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) break;
    const flags = buf.readUInt16LE(p + 8), method = buf.readUInt16LE(p + 10);
    const csize = buf.readUInt32LE(p + 20), usize = buf.readUInt32LE(p + 24);
    const nl = buf.readUInt16LE(p + 28), xl = buf.readUInt16LE(p + 30), cl = buf.readUInt16LE(p + 32);
    const lho = buf.readUInt32LE(p + 42);
    const raw = buf.slice(p + 46, p + 46 + nl);
    let name;
    if (flags & 0x800) name = raw.toString('utf8');
    else { try { name = new TextDecoder('euc-kr').decode(raw); } catch (err) { name = raw.toString('latin1'); } }
    out.push({ name, method, csize, usize, lho });
    p += 46 + nl + xl + cl;
  }
  return out;
}
function zipRead(buf, ent) {
  const p = ent.lho;
  if (buf.readUInt32LE(p) !== 0x04034b50) throw new Error('zip 안의 파일이 깨졌습니다');
  const nl = buf.readUInt16LE(p + 26), xl = buf.readUInt16LE(p + 28);
  const data = buf.slice(p + 30 + nl + xl, p + 30 + nl + xl + ent.csize);
  if (ent.method === 0) return data;
  if (ent.method === 8) return zlib.inflateRawSync(data);
  throw new Error('지원하지 않는 zip 압축 방식');
}

/* ── 고른 것(PDF·ZIP·폴더)에서 PDF 모으기 → [{ label, key, buf }] ── */
function collect(paths) {
  const found = [], notes = [];
  const add = (label, buf) => {
    if (found.length >= MAX_PDF) { notes.push('PDF 가 너무 많아 ' + MAX_PDF + '개까지만 읽었습니다'); return; }
    found.push({ label, key: classKeyOf(label), buf });
  };
  const walk = (p, rel, depth) => {
    let st;
    try { st = fs.statSync(p); } catch (err) { notes.push(path.basename(p) + ' — 읽을 수 없습니다'); return; }
    if (st.isDirectory()) {
      if (depth > 4) return;
      fs.readdirSync(p).sort().forEach((n) => walk(path.join(p, n), (rel ? rel + '/' : '') + n, depth + 1));
      return;
    }
    const ext = path.extname(p).toLowerCase();
    if (ext === '.pdf') {
      if (st.size > MAX_BYTES) { notes.push(path.basename(p) + ' — 너무 큽니다'); return; }
      add(rel || path.basename(p), fs.readFileSync(p));
    } else if (ext === '.zip') {
      if (st.size > 400 * 1024 * 1024) { notes.push(path.basename(p) + ' — 너무 큽니다'); return; }
      let zb;
      try { zb = fs.readFileSync(p); zipEntries(zb).forEach((en) => {
        if (!/\.pdf$/i.test(en.name) || /\/$/.test(en.name) || en.usize > MAX_BYTES) return;
        const pre = path.basename(p, '.zip');
        add(pre + '/' + en.name, zipRead(zb, en));
      }); } catch (err) { notes.push(path.basename(p) + ' — ' + ((err && err.message) || err)); }
    }
  };
  (Array.isArray(paths) ? paths : []).forEach((p) => walk(String(p), path.basename(String(p)), 0));
  return { found, notes };
}

/* ── PDF 한 개 → 사진(JPEG 바이트) 읽는 순서대로 ── */
function lex(bytes) {                       // 내용 스트림 → 토큰 [{t:'num'|'name'|'op', v}] (글·배열·사전은 건너뜀)
  const s = Buffer.from(bytes).toString('latin1'), out = [];
  const n = s.length;
  let i = 0;
  const isWs = (c) => c === 32 || c === 10 || c === 13 || c === 9 || c === 12 || c === 0;
  const isDelim = (c) => c === 40 || c === 41 || c === 60 || c === 62 || c === 91 || c === 93 || c === 123 || c === 125 || c === 47 || c === 37;
  while (i < n) {
    const c = s.charCodeAt(i);
    if (isWs(c)) { i++; continue; }
    if (c === 37) { while (i < n && s.charCodeAt(i) !== 10 && s.charCodeAt(i) !== 13) i++; continue; }
    if (c === 40) {                         // ( … ) 글자 — 겹괄호·역슬래시 처리
      let d = 1; i++;
      while (i < n && d > 0) { const k = s.charCodeAt(i); if (k === 92) i += 2; else { if (k === 40) d++; else if (k === 41) d--; i++; } }
      continue;
    }
    if (c === 60) {                         // << 사전 / < 16진 글자 >
      if (s.charCodeAt(i + 1) === 60) { i += 2; continue; }
      while (i < n && s.charCodeAt(i) !== 62) i++;
      i++; continue;
    }
    if (c === 62 || c === 91 || c === 93 || c === 123 || c === 125 || c === 41) { i++; continue; }
    if (c === 47) {                         // /이름
      let j = i + 1; while (j < n && !isWs(s.charCodeAt(j)) && !isDelim(s.charCodeAt(j))) j++;
      out.push({ t: 'name', v: s.slice(i + 1, j) }); i = j; continue;
    }
    let j = i; while (j < n && !isWs(s.charCodeAt(j)) && !isDelim(s.charCodeAt(j))) j++;
    const w = s.slice(i, j);
    if (/^[+-]?(\d+\.?\d*|\.\d+)$/.test(w)) out.push({ t: 'num', v: parseFloat(w) });
    else out.push({ t: 'op', v: w });
    i = j;
  }
  return out;
}
const mul = (m, n) => [   // 행렬 곱 m × n (PDF 는 [a b c d e f], 새 cm 이 앞에 곱해진다: CTM' = cm × CTM)
  m[0] * n[0] + m[1] * n[2], m[0] * n[1] + m[1] * n[3],
  m[2] * n[0] + m[3] * n[2], m[2] * n[1] + m[3] * n[3],
  m[4] * n[0] + m[5] * n[2] + n[4], m[4] * n[1] + m[5] * n[3] + n[5]];

/* PNG 예측(Predictor 10~15) 풀기 — 줄마다 맨 앞 1바이트가 «필터 종류»(0 없음 · 1 왼쪽 · 2 위 · 3 평균 · 4 파스) */
function pngUnfilter(raw, w, h, ncomp) {
  const rb = w * ncomp, stride = rb + 1;
  if (raw.length < h * stride) return null;
  const out = Buffer.alloc(rb * h);
  for (let y = 0; y < h; y++) {
    const ft = raw[y * stride], src = y * stride + 1, dst = y * rb, up = (y - 1) * rb;
    for (let x = 0; x < rb; x++) {
      const v = raw[src + x];
      const a = x >= ncomp ? out[dst + x - ncomp] : 0;
      const b = y ? out[up + x] : 0;
      const c = (y && x >= ncomp) ? out[up + x - ncomp] : 0;
      let r;
      if (ft === 0) r = v; else if (ft === 1) r = v + a; else if (ft === 2) r = v + b; else if (ft === 3) r = v + ((a + b) >> 1);
      else if (ft === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); r = v + (pa <= pb && pa <= pc ? a : (pb <= pc ? b : c)); }
      else return null;
      out[dst + x] = r & 255;
    }
  }
  return out;
}
async function photosOf(buf, opts) {
  const { PDFDocument, PDFName, PDFArray, PDFDict, PDFRawStream, decodePDFRawStream } = require('pdf-lib');
  const doc = await PDFDocument.load(buf, { ignoreEncryption: true, updateMetadata: false });
  const pages = doc.getPages(), photos = [], skipped = [];
  for (let pi = 0; pi < pages.length; pi++) {
    const page = pages[pi], W = page.getWidth(), H = page.getHeight();
    const rot = ((page.getRotation().angle % 360) + 360) % 360;
    const toView = (x, y) => (rot === 90 ? [y, x] : rot === 180 ? [W - x, y] : rot === 270 ? [H - y, W - x] : [x, H - y]);   // 보이는 쪽 좌표(왼쪽 위가 0)
    const res = page.node.Resources();
    const xo = res && res.lookup(PDFName.of('XObject'), PDFDict);
    if (!xo) continue;
    let ct = page.node.Contents(), streams = [];
    if (ct instanceof PDFArray) streams = ct.asArray().map((r) => doc.context.lookup(r)); else if (ct) streams = [ct];
    let bytes = [];
    streams.forEach((st) => { try { bytes.push(Buffer.from(decodePDFRawStream(st).decode())); bytes.push(Buffer.from('\n')); } catch (err) { /* 못 푼 조각은 건너뜀 */ } });
    const toks = lex(Buffer.concat(bytes));
    let ctm = [1, 0, 0, 1, 0, 0]; const stack = []; const nums = []; const placed = [];
    for (const k of toks) {
      if (k.t === 'num') { nums.push(k.v); if (nums.length > 8) nums.shift(); continue; }
      if (k.t === 'name') { nums.length = 0; nums.push(k); continue; }
      const op = k.v;
      if (op === 'q') stack.push(ctm.slice());
      else if (op === 'Q') { if (stack.length) ctm = stack.pop(); }
      else if (op === 'cm' && nums.length >= 6 && nums.slice(-6).every((x) => typeof x === 'number')) ctm = mul(nums.slice(-6), ctm);
      else if (op === 'Do' && nums.length && nums[nums.length - 1].t === 'name') {
        const nm = nums[nums.length - 1].v;
        const ref = xo.get(PDFName.of(nm)), obj = ref && doc.context.lookup(ref);
        if (obj instanceof PDFRawStream) {
          const d = obj.dict, sub = d.lookup(PDFName.of('Subtype')), flt = d.lookup(PDFName.of('Filter'));
          const isImg = sub && sub.toString() === '/Image';
          const fl = flt instanceof PDFArray ? flt.asArray().map((x) => String(doc.context.lookup(x))) : (flt ? [String(flt)] : []);
          if (isImg) {
            const wpx = Number(String(d.lookup(PDFName.of('Width')))) || 0, hpx = Number(String(d.lookup(PDFName.of('Height')))) || 0;
            const cx = ctm[4] + (ctm[0] + ctm[2]) / 2, cy = ctm[5] + (ctm[1] + ctm[3]) / 2;
            const vw = Math.hypot(ctm[0], ctm[1]), vh = Math.hypot(ctm[2], ctm[3]);
            if (wpx >= 60 && hpx >= 60 && vw >= 25 && vh >= 25 && vw <= 300 && vh <= 400) {   // 로고·점 같은 작은 그림은 제외
              if (fl.length === 1 && fl[0] === '/DCTDecode') placed.push({ pos: toView(cx, cy), h: Math.max(vw, vh), jpg: Buffer.from(obj.contents) });
              else {                                  // JPEG 가 아닌 사진(압축한 원본 픽셀) — 풀어서 JPEG 로 다시 만든다
                let jpg = null, why = '';
                try {
                  const cs = d.lookup(PDFName.of('ColorSpace')); let csn = cs && String(cs);
                  let ncomp = 0;
                  if (cs instanceof PDFArray) { const a0 = String(cs.lookup(0)); csn = a0; if (a0 === '/ICCBased') { const ic = cs.lookup(1); ncomp = Number(String(ic.dict.lookup(PDFName.of('N')))) || 0; } }
                  if (csn === '/DeviceRGB' || csn === '/CalRGB') ncomp = 3; else if (csn === '/DeviceGray' || csn === '/CalGray') ncomp = 1;
                  const bpc = Number(String(d.lookup(PDFName.of('BitsPerComponent')))) || 8;
                  if (!opts || typeof opts.encode !== 'function') why = '변환 도구가 없음';
                  else if (bpc !== 8 || (ncomp !== 3 && ncomp !== 1)) why = '지원하지 않는 색 방식(' + csn + ', ' + bpc + '비트)';
                  else {
                    let raw = Buffer.from(decodePDFRawStream(obj).decode());
                    const dp = d.lookup(PDFName.of('DecodeParms')), pred = dp instanceof PDFDict ? Number(String(dp.lookup(PDFName.of('Predictor')))) || 1 : 1;
                    if (pred >= 10) { const u = pngUnfilter(raw, wpx, hpx, ncomp); if (!u) why = 'PNG 예측을 풀지 못함'; else raw = u; }
                    else if (pred === 2) why = 'TIFF 예측은 지원하지 않음';
                    if (!why) {
                      if (raw.length < wpx * hpx * ncomp) why = '픽셀 크기가 맞지 않음';
                      else jpg = await opts.encode(raw, wpx, hpx, ncomp);
                    }
                  }
                } catch (err) { why = (err && err.message) || String(err); }
                if (jpg) placed.push({ pos: toView(cx, cy), h: Math.max(vw, vh), jpg: Buffer.from(jpg), conv: true });
                else skipped.push('사진 ' + (placed.length + 1) + ' — JPEG 가 아닌 그림(' + (fl.join('+') || '무압축') + ')을 바꾸지 못했습니다 — ' + why);
              }
            }
          }
        }
      }
      nums.length = 0;
    }
    /* 읽는 순서 — 줄(위→아래)로 묶고 줄 안에서 왼쪽→오른쪽 */
    const hAvg = placed.length ? placed.reduce((a, b) => a + b.h, 0) / placed.length : 80;
    const sorted = placed.slice().sort((a, b) => a.pos[1] - b.pos[1]);
    const rows = [];
    sorted.forEach((p) => { const r = rows[rows.length - 1]; if (r && Math.abs(p.pos[1] - r.y) < hAvg * 0.5) { r.items.push(p); } else rows.push({ y: p.pos[1], items: [p] }); });
    rows.forEach((r) => r.items.sort((a, b) => a.pos[0] - b.pos[0]).forEach((p) => photos.push(p.jpg)));
    if (photos.length > MAX_PHOTOS) break;
  }
  return { photos: photos.slice(0, MAX_PHOTOS), skipped, pages: pages.length };
}

/* 고른 것 → { classes:[{ key, label, photos:[Buffer] }], notes:[글] } — 같은 반이 두 번 들어오면 먼저 온 것만 */
async function scan(paths, opts) {
  const { found, notes } = collect(paths);
  const classes = [], seen = {};
  for (const f of found) {
    try {
      const r = await photosOf(f.buf, opts);
      if (!r.photos.length) { notes.push(f.label + ' — 사진을 찾지 못했습니다(NEIS «사진명렬표» PDF 가 맞는지 확인)'); continue; }
      if (f.key && seen[f.key]) { notes.push(f.label + ' — ' + f.key + ' 은(는) 이미 읽어서 건너뜀'); continue; }
      if (f.key) seen[f.key] = 1;
      r.skipped.forEach((x) => notes.push(f.label + ' · ' + x));
      classes.push({ key: f.key, label: f.label, photos: r.photos });
    } catch (err) { notes.push(f.label + ' — 읽지 못했습니다(' + ((err && err.message) || err) + ')'); }
  }
  classes.sort((a, b) => (a.key || '9') < (b.key || '9') ? -1 : 1);
  return { classes, notes };
}

module.exports = { scan, classKeyOf, photosOf, collect };
