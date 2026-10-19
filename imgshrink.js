// 파일명: imgshrink.js | @version 1.0.0 — 사진 줄이기의 «화질을 지키는» 부품(메인 프로세스)
//
// ★ 순서 (화질 손실이 적은 것부터)
//   ① 이미 한도 이하인 JPEG → 그대로 복사(손실 0)             … main.js 가 판단
//   ② 무손실 정리 — 화소는 한 점도 안 바꾸고 부가정보(EXIF·GPS·미리보기 그림·메모)를 지우고
//      JPEG 압축표(허프만 표)를 다시 짠다(jpegtran -optimize). 색 프로파일(ICC)은 남긴다.
//      → 한도를 살짝 넘는 사진은 이것만으로 한도 안에 들어온다.
//   ③ mozjpeg(같은 용량에서 화질이 더 좋은 압축기)로 품질만 95→85% 안에서 맞춤
//   ④ 그래도 크면 품질 90% 를 지키며 Lanczos 로 가로·세로를 줄여 «한도에 들어가는 가장 큰 크기» 로
//
// ★ 부품: @jsquash/jpeg(mozjpeg WASM)·@jsquash/resize(Lanczos WASM) — asarUnpack 으로 풀려 있어야 import 된다.
//         jpegtran.exe(libjpeg-turbo, assets/jpegtran) — 없거나 막히면 JS 로 부가정보만 지우는 길로 물러선다.

const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');
const { pathToFileURL } = require('url');

const unpacked = (p) => p.replace(/app\.asar([\\/])/, 'app.asar.unpacked$1');

/* ── JPEG 마디 읽기 ───────────────────────────────────────── */
function isJpeg(b) { return b && b.length > 4 && b[0] === 0xFF && b[1] === 0xD8; }
/* 반환: { segs:[{m,s,e}], w,h, orient, prog } — s·e 는 마디(FF xx 길이 내용) 의 시작·끝(끝 미포함) */
function scanJpeg(b) {
  if (!isJpeg(b)) return null;
  const segs = []; let i = 2, w = 0, h = 0, orient = 1, prog = false;
  while (i + 4 <= b.length) {
    if (b[i] !== 0xFF) return null;
    let m = b[i + 1];
    while (m === 0xFF && i + 2 < b.length) { i++; m = b[i + 1]; }       // 채움 바이트
    if (m === 0xD9) break;
    if (m === 0x01 || (m >= 0xD0 && m <= 0xD7)) { i += 2; continue; }   // 길이 없는 표지
    const len = b.readUInt16BE(i + 2);
    if (len < 2 || i + 2 + len > b.length) return null;
    segs.push({ m, s: i, e: i + 2 + len });
    if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) {
      h = b.readUInt16BE(i + 5); w = b.readUInt16BE(i + 7); prog = (m === 0xC2 || m === 0xC6 || m === 0xCA || m === 0xCE);
    }
    if (m === 0xE1 && b.toString('latin1', i + 4, i + 10) === 'Exif\0\0') orient = exifOrient(b, i + 10, i + 2 + len) || 1;
    if (m === 0xDA) break;                                              // 이 뒤는 화소 자료
    i += 2 + len;
  }
  return { segs, w, h, orient, prog };
}
function exifOrient(b, t, end) {
  try {
    const le = b.toString('latin1', t, t + 2) === 'II';
    const u16 = (o) => (le ? b.readUInt16LE(o) : b.readUInt16BE(o));
    const u32 = (o) => (le ? b.readUInt32LE(o) : b.readUInt32BE(o));
    const ifd = t + u32(t + 4);
    const n = u16(ifd);
    for (let k = 0; k < n; k++) {
      const o = ifd + 2 + k * 12;
      if (o + 12 > end) break;
      if (u16(o) === 0x0112) return u16(o + 8);
    }
  } catch (e) { /* 못 읽으면 1 */ }
  return 1;
}
const isIcc = (b, sg) => sg.m === 0xE2 && b.toString('latin1', sg.s + 4, sg.s + 16) === 'ICC_PROFILE\0';

/* 화소는 두고 «꼭 필요한 마디(JFIF·ICC·Adobe)만» 남긴다 — jpegtran 이 없을 때의 물러선 길 */
function stripJs(b, info) {
  const keep = info.segs.filter((sg) => sg.m !== 0xDA && (sg.m < 0xE0 || sg.m > 0xFE || sg.m === 0xE0 || sg.m === 0xEE || isIcc(b, sg)) && sg.m !== 0xFE);
  const sos = info.segs.filter((sg) => sg.m === 0xDA)[0];
  if (!sos) return null;
  /* 머리 표(DQT·DHT·SOF…)는 원래 순서대로 — 위에서 APP/COM 만 걸렀으니 순서가 유지된다 */
  const parts = [Buffer.from([0xFF, 0xD8])];
  keep.forEach((sg) => parts.push(b.subarray(sg.s, sg.e)));
  parts.push(b.subarray(sos.s));                                         // SOS 부터 끝까지(화소 자료 포함)
  return Buffer.concat(parts);
}
/* jpegtran 이 뽑은 JPEG 에 원본의 ICC 마디를 되돌려 넣는다(JFIF 바로 뒤, 없으면 맨 앞) */
function putIcc(out, orig, origInfo) {
  const icc = origInfo.segs.filter((sg) => isIcc(orig, sg));
  if (!icc.length) return out;
  const oi = scanJpeg(out); if (!oi) return out;
  if (oi.segs.some((sg) => isIcc(out, sg))) return out;
  const at = oi.segs.length && oi.segs[0].m === 0xE0 ? oi.segs[0].e : 2;
  return Buffer.concat([out.subarray(0, at)].concat(icc.map((sg) => orig.subarray(sg.s, sg.e)), [out.subarray(at)]));
}

/* ── 무손실 정리 ──────────────────────────────────────────── */
function jpegtranPath() {
  const rel = path.join('assets', 'jpegtran', 'jpegtran.exe');
  const cands = [path.join(__dirname.replace(/app\.asar$/, 'app.asar.unpacked'), rel), unpacked(path.join(__dirname, rel)), path.join(__dirname, rel)];
  return cands.filter((p) => { try { return fs.statSync(p).isFile(); } catch (e) { return false; } })[0] || '';
}
/* 반환: { bytes, how:'jpegtran'|'js' } 또는 null(손대지 않는 게 안전할 때: 사진 방향 정보가 있는 경우 등) */
function losslessOptimize(buf) {
  const info = scanJpeg(buf);
  if (!info || !info.w) return null;
  /* ★ 사진 방향(EXIF Orientation)이 1 이 아니면 부가정보를 지울 때 «옆으로 누운 사진» 이 된다 — 건드리지 않고 ③로 */
  if (info.orient !== 1) return null;
  const exe = jpegtranPath();
  if (exe) {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'jtr-'));
    try {
      const fin = path.join(tmp, 'in.jpg'), fout = path.join(tmp, 'out.jpg');
      fs.writeFileSync(fin, buf);
      const r = cp.spawnSync(exe, ['-copy', 'none', '-optimize', '-outfile', fout, fin], { timeout: 60000, windowsHide: true });
      if (r.status === 0 && fs.existsSync(fout)) {
        const out = fs.readFileSync(fout);
        if (isJpeg(out)) return { bytes: putIcc(out, buf, info), how: 'jpegtran' };
      }
    } catch (e) { /* 아래 JS 길로 */ }
    finally { try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) { /* */ } }
  }
  const js = stripJs(buf, info);
  return js ? { bytes: js, how: 'js' } : null;
}

/* ── 압축기(mozjpeg)·크기 줄이기(Lanczos) ──────────────────── */
let codecP = null;
function codecs() {
  if (codecP) return codecP;
  codecP = (async () => {
    if (!globalThis.ImageData) {
      globalThis.ImageData = class ImageData { constructor(d, w, h) { this.data = d; this.width = w; this.height = h; this.colorSpace = 'srgb'; } };
    }
    const jdir = unpacked(path.dirname(require.resolve('@jsquash/jpeg/package.json')));
    const rdir = unpacked(path.dirname(require.resolve('@jsquash/resize/package.json')));
    const enc = await import(pathToFileURL(path.join(jdir, 'encode.js')).href);
    await enc.init(await WebAssembly.compile(fs.readFileSync(path.join(jdir, 'codec', 'enc', 'mozjpeg_enc.wasm'))));
    const rs = await import(pathToFileURL(path.join(rdir, 'index.js')).href);
    await rs.initResize(await WebAssembly.compile(fs.readFileSync(path.join(rdir, 'lib', 'resize', 'pkg', 'squoosh_resize_bg.wasm'))));
    return { encode: enc.default, resize: rs.default };
  })().catch((e) => { codecP = null; throw e; });
  return codecP;
}
async function encodeQ(c, img, q) {
  const ab = await c.encode(img, {
    quality: q, baseline: true, progressive: false, optimize_coding: true,     // 기본형(어디서나 열림) + 압축표 최적화
    trellis_multipass: true, trellis_opt_zero: true, trellis_opt_table: true, trellis_loops: 2,
    auto_subsample: true, chroma_subsample: 2
  });
  return Buffer.from(ab);
}
const Q = { max: 95, min: 85, fix: 90 };
/* rgba: 방향이 바로잡힌 전체 해상도 화소(흰 바탕) → { st: keep|quality|shrink|fail, bytes, w, h, q } */
async function fit(rgba, width, height, limit, side) {
  const c = await codecs();
  let px = rgba instanceof Uint8ClampedArray ? rgba : new Uint8ClampedArray(rgba.buffer, rgba.byteOffset || 0, rgba.length);
  if (px.byteOffset !== 0 || px.byteLength !== px.buffer.byteLength) px = new Uint8ClampedArray(px);     // 리사이저는 «자기 버퍼 전체» 를 본다
  const full = { data: px, width, height };
  const k0 = side ? Math.min(1, side / Math.max(width, height)) : 1;
  /* 큰 사진(500만 화소↑)을 많이 줄일 때는 먼저 절반으로 한 번 줄여 두고 거기서 줄인다(같은 Lanczos — 시간만 줄어든다) */
  let half = null;
  const at = async (k) => {
    if (k >= 0.9999) return full;
    const w = Math.max(1, Math.round(width * k)), h = Math.max(1, Math.round(height * k));
    if (width * height > 5e6 && k <= 0.45) {
      if (!half) half = await c.resize(new ImageData(full.data, width, height), { width: Math.round(width / 2), height: Math.round(height / 2), method: 'lanczos3' });
      return c.resize(new ImageData(half.data, half.width, half.height), { width: w, height: h, method: 'lanczos3' });
    }
    return c.resize(new ImageData(full.data, width, height), { width: w, height: h, method: 'lanczos3' });
  };
  const base = await at(k0);
  const mk = (st, bytes, img, q) => ({ st, bytes, w: img.width, h: img.height, q });
  const bpp = (n) => (limit * 8) / n;                       // 한도에서 화소 하나에 쓸 수 있는 비트
  /* ② 가로·세로는 두고 품질만 — «한도가 화소 수에 비해 넉넉할 때만» (12MP 를 200KB 에 넣는 일은 품질 85% 로는 불가능해 시간만 쓴다) */
  if (!limit || bpp(base.width * base.height) >= 0.35) {
    const r = await encodeQ(c, base, Q.max);
    if (!limit || r.length <= limit) return mk(k0 < 1 ? 'shrink' : 'keep', r, base, Q.max);
    const lo = await encodeQ(c, base, Q.min);
    if (lo.length <= limit) {
      let a = Q.min, b = Q.max, best = lo, bq = Q.min;
      while (b - a > 1) {
        const m = Math.round((a + b) / 2), t = await encodeQ(c, base, m);
        if (t.length <= limit) { best = t; bq = m; a = m; } else b = m;
      }
      return mk(k0 < 1 ? 'shrink' : 'quality', best, base, bq);
    }
  }
  /* ③ 품질 90% 를 지키며 크기를 줄인다 — 용량이 크기의 거듭제곱(≈ 면적^0.9)으로 변하는 것을 써서 4~6번 안에 맞춘다 */
  const kLow = k0 * 0.12;
  const enc = async (k) => { const im = await at(k); return { k, im, bytes: await encodeQ(c, im, Q.fix) }; };
  let kk = Math.min(k0, Math.max(kLow, Math.sqrt(limit * 8 / (width * height * 1.6))));   // 처음 짐작: 화소당 1.6비트
  let lo = null, hi = null;                                                              // lo = 들어가는 가장 큰 것, hi = 안 들어가는 가장 작은 것
  for (let it = 0; it < 9; it++) {
    const r = await enc(kk);
    if (r.bytes.length <= limit) { if (!lo || r.k > lo.k) lo = r; } else if (!hi || r.k < hi.k) hi = r;
    if (lo && lo.bytes.length >= limit * 0.96) break;                                    // 한도의 96% 이상 채웠으면 충분
    let kn;
    if (lo && hi) {
      if (hi.k / lo.k < 1.01) break;
      const p = Math.max(0.8, Math.min(3, Math.log(hi.bytes.length / lo.bytes.length) / Math.log(hi.k / lo.k)));
      kn = lo.k * Math.pow(limit * 0.985 / lo.bytes.length, 1 / p);
      kn = Math.min(Math.max(kn, lo.k * 1.003), hi.k * 0.997);
    } else if (lo) {
      if (lo.k >= k0 * 0.9999) break;
      kn = Math.min(k0, lo.k * Math.pow(limit * 0.985 / lo.bytes.length, 1 / 1.8));
      if (kn <= lo.k * 1.003) break;
    } else {
      if (hi.k <= kLow * 1.001) break;                                                   // 가장 작게 해도 안 들어간다
      kn = Math.max(kLow, Math.min(hi.k * 0.92, hi.k * Math.pow(limit * 0.985 / hi.bytes.length, 1 / 1.8)));
    }
    kk = kn;
  }
  if (!lo) return { st: 'fail', bytes: null, w: hi ? hi.im.width : 0, h: hi ? hi.im.height : 0, q: Q.fix };
  return mk('shrink', lo.bytes, lo.im, Q.fix);
}

module.exports = { scanJpeg, losslessOptimize, fit, jpegtranPath, isJpeg, _t: { codecs, encodeQ } };
