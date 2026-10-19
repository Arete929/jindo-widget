// 파일명: drivebox.js | @version 1.1.0 — 올릴 때 큰 사진을 줄인다(폰에서 바로 열리게)
// 출결 «증빙서류» 를 구글 드라이브(luckyday929@hyewon.sen.ms.kr 학교 계정)에 올리는 통로.
// 새로 만든 드라이브가 아니라 «혜원핏 사진 창고» 중계(구글 스크립트)를 그대로 쓴다 — 거기서 폴더(sub)를 만들어 준다.
//   · 올리기: { op:'save', files:[{ b64, mime, name, sub }] }  → { files:[{ ok, id, url }] }
//   · 지우기: { op:'trash', ids:[…] }  (휴지통 — 30일 안엔 되살릴 수 있다)
// 주소·열쇠는 코드에 두지 않는다 — 선생님 OneDrive 설정(shared.json 의 photoRelay {url,key})에서만 읽는다.
// 파일은 비공개다(링크 공유 없음). 주소를 아는 사람이 아니라 «계정 주인» 만 볼 수 있다.

const httpx = require('./httpx');
const imgshrink = require('./imgshrink');

const FOLDER = '지비스 출결 증빙서류';
const MAX_BYTES = 20 * 1024 * 1024;     // 한 파일 20MB 까지 — 중계(구글 스크립트)가 한 번에 받는 크기에 한계가 있다
const SHRINK_OVER = 1200000;            // 이보다 큰 사진은 줄여서 올린다
const SHRINK_PX = 1600, SHRINK_Q = 88;  // 서류 글씨가 읽히는 선

/* ── 올릴 사진 줄이기 ──────────────────────────────────────────
   붙여넣은 화면 캡처는 7~13MB 짜리 PNG 인 일이 흔하다. 그대로 올리면 드라이브가 금세 차고,
   폰에서는 원본을 못 받아 «줄인 그림» 을 따로 받아야 한다. 올릴 때 한 번 줄여 두면 둘 다 없어진다.
   ★ 원본은 이 PC 의 보관함에 그대로 남는다 — 줄이는 것은 «드라이브로 보내는 사본» 뿐이다.
   ★ nativeImage 는 EXIF 돌림 정보를 무시해 휴대폰 세로 사진을 눕힌다(main.js 의 사진 줄이기 설명과 같은 이유).
     그래서 돌림 정보가 있는 JPEG 은 건드리지 않고 그대로 올린다. */
function shrinkable(buf, mime) {
  if (!/^image\//.test(String(mime || ''))) return false;
  if (/gif|svg|heic|heif/i.test(String(mime))) return false;          // 움직이는 그림·벡터·아이폰 사진은 손대지 않는다
  if (imgshrink.isJpeg(buf)) {
    const s = imgshrink.scanJpeg(buf);
    return !!s && (!s.orient || s.orient === 1);
  }
  return true;                                                         // png·webp·bmp — 돌림 정보가 없다
}
function shrink(buf, px, q) {
  const { nativeImage } = require('electron');
  const img = nativeImage.createFromBuffer(buf);
  if (img.isEmpty()) return null;
  const s = img.getSize();
  if (!s.width || !s.height) return null;
  const m = Math.max(s.width, s.height), k = Math.min(1, (px || SHRINK_PX) / m);
  const small = k < 1
    ? img.resize({ width: Math.max(1, Math.round(s.width * k)), height: Math.max(1, Math.round(s.height * k)), quality: 'best' })
    : img;
  const out = small.toJPEG(q || SHRINK_Q);
  return (out && out.length) ? { buf: out, w: small.getSize().width, h: small.getSize().height } : null;
}
/* 올릴 것 고르기 — { buf, mime, name, shrunk } */
function forUpload(file) {
  const out = { buf: file.buf, mime: file.mime || 'application/octet-stream', name: file.name, shrunk: false };
  if (file.buf.length <= SHRINK_OVER || !shrinkable(file.buf, out.mime)) return out;
  let sm = null;
  try { sm = shrink(file.buf, SHRINK_PX, SHRINK_Q); } catch (e) { sm = null; }
  if (!sm || sm.buf.length >= file.buf.length * 0.8) return out;        // 별로 안 줄면 원본 그대로
  out.buf = sm.buf; out.mime = 'image/jpeg'; out.shrunk = true;
  out.name = String(file.name || '증빙').replace(/\.[A-Za-z0-9]{1,5}$/, '') + '.jpg';
  return out;
}

async function post(cfg, body, timeout) {
  const r = await httpx.request({
    method: 'POST', url: cfg.url, contentType: 'text/plain;charset=utf-8',
    body: JSON.stringify(Object.assign({ key: cfg.key }, body)), timeout: timeout || 120000
  });
  let d = null;
  try { d = JSON.parse(r.text); } catch (e) { /* 아래에서 처리 */ }
  if (!d) throw new Error(r.status >= 400 ? '드라이브 중계가 오류를 냈습니다(' + r.status + ')' : '드라이브 중계의 답을 읽지 못했습니다');
  if (!d.ok) throw new Error(d.msg === 'denied' ? '드라이브 중계가 열쇠를 거절했습니다' : (d.msg || '드라이브 중계가 거절했습니다'));
  return d;
}

/* 연결 확인 — 어느 계정인지(user)와 쓴 용량(used) */
async function ping(cfg) {
  const d = await post(cfg, { op: 'ping' }, 30000);
  return { user: d.user || '', used: d.used || 0 };
}

/* 파일 하나 올리기 — { id, url } */
async function upload(cfg, file) {
  if (!file || !file.buf || !file.buf.length) throw new Error('내용이 비어 있습니다');
  if (file.buf.length > MAX_BYTES) throw new Error('파일이 커서(20MB 초과) 드라이브에는 올리지 않았습니다 — 이 PC 에는 있습니다');
  const d = await post(cfg, { op: 'save', files: [{ b64: file.buf.toString('base64'), mime: file.mime || 'application/octet-stream', name: file.name, sub: FOLDER }] });
  const f = (d.files || [])[0];
  if (!f || !f.ok) throw new Error((f && f.msg) || '드라이브에 저장하지 못했습니다');
  return { id: f.id, url: f.url };
}

/* 휴지통으로 — 몇 개를 보냈는지 */
async function trash(cfg, ids) {
  const list = (ids || []).filter(Boolean);
  if (!list.length) return 0;
  const d = await post(cfg, { op: 'trash', ids: list }, 60000);
  return d.trashed || 0;
}

/* 설정에서 주소·열쇠 꺼내기 — 없으면 null (드라이브 없이 이 PC 에만 보관) */
function cfgOf(shared) {
  const r = (shared && shared.photoRelay) || {};
  return r.url && r.key ? { url: String(r.url), key: String(r.key) } : null;
}

module.exports = { FOLDER, MAX_BYTES, SHRINK_OVER, SHRINK_PX, ping, upload, trash, cfgOf, shrinkable, shrink, forUpload };
