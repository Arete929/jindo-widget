/* 영상 내려받기 도구가 쓰는 외부 프로그램을 «vendor/» 에 받아 둔다 (설치 파일 빌드 전에 한 번).
     · yt-dlp.exe  — 오픈소스(Unlicense), 공식 GitHub 릴리스
     · ffmpeg      — 오픈소스(LGPL 빌드, BtbN FFmpeg-Builds 의 «win64-lgpl-shared»)
   ★ 큰 파일이라 저장소에는 올리지 않는다(.gitignore 의 vendor/). 이 스크립트로 언제든 다시 받는다.
   ★ 받은 파일은 공식 체크섬(SHA-256)과 맞는지 확인한 뒤에만 쓴다.
   사용:  node tools/fetch-vendor.js          (이미 있으면 건너뜀)
          node tools/fetch-vendor.js --force   (다시 받음) */
const fs = require('fs'), path = require('path'), crypto = require('crypto'), cp = require('child_process');
const ROOT = path.join(__dirname, '..', 'vendor');
const FORCE = process.argv.includes('--force');
const YT = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/';
const FF = 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/';
const FF_ZIP = 'ffmpeg-master-latest-win64-lgpl-shared.zip';

async function get(url) {
  const r = await fetch(url, { redirect: 'follow' });
  if (!r.ok) throw new Error(url + ' → ' + r.status);
  return Buffer.from(await r.arrayBuffer());
}
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
function sumOf(text, name) {
  const line = text.split(/\r?\n/).map((l) => l.trim().split(/\s+/)).filter((p) => p.length >= 2 && p[1].replace(/^\*/, '') === name)[0];
  if (!line) throw new Error('체크섬 목록에 ' + name + ' 이 없습니다');
  return line[0].toLowerCase();
}

(async () => {
  fs.mkdirSync(ROOT, { recursive: true });
  /* yt-dlp */
  const ytPath = path.join(ROOT, 'yt-dlp.exe');
  if (FORCE || !fs.existsSync(ytPath)) {
    console.log('yt-dlp.exe 받는 중…');
    const sums = (await get(YT + 'SHA2-256SUMS')).toString('utf8');
    const buf = await get(YT + 'yt-dlp.exe');
    if (sha(buf) !== sumOf(sums, 'yt-dlp.exe')) throw new Error('yt-dlp.exe 체크섬이 맞지 않습니다');
    fs.writeFileSync(ytPath, buf);
    console.log('  ✓ ' + Math.round(buf.length / 1048576) + 'MB, 체크섬 확인');
  } else console.log('yt-dlp.exe 있음');
  /* ffmpeg */
  const ffDir = path.join(ROOT, 'ffmpeg');
  if (FORCE || !fs.existsSync(path.join(ffDir, 'ffmpeg.exe'))) {
    console.log('ffmpeg 받는 중… (약 80MB)');
    const sums = (await get(FF + 'checksums.sha256')).toString('utf8');
    const buf = await get(FF + FF_ZIP);
    if (sha(buf) !== sumOf(sums, FF_ZIP)) throw new Error('ffmpeg 체크섬이 맞지 않습니다');
    const zip = path.join(ROOT, FF_ZIP);
    fs.writeFileSync(zip, buf);
    const tmp = path.join(ROOT, '_ffx');
    fs.rmSync(tmp, { recursive: true, force: true }); fs.mkdirSync(tmp, { recursive: true });
    /* ★ 경로에 «C:» 가 들어 있으면 GNU tar 가 원격 주소로 읽는다 — 작업 폴더를 vendor 로 옮겨 상대 경로로 푼다 */
    /* ★ git bash 의 GNU tar 는 zip 을 못 푼다 — Windows 기본 bsdtar(System32) 를 쓴다 */
    const tarExe = path.join(process.env.SystemRoot || 'C:\Windows', 'System32', 'tar.exe');
    cp.execFileSync(fs.existsSync(tarExe) ? tarExe : 'tar', ['-xf', path.basename(zip), '-C', '_ffx'], { cwd: ROOT });
    const top = fs.readdirSync(tmp)[0], bin = path.join(tmp, top, 'bin');
    fs.rmSync(ffDir, { recursive: true, force: true }); fs.mkdirSync(ffDir, { recursive: true });
    /* ffmpeg.exe 와 dll 만 — ffplay·ffprobe 는 쓰지 않는다 */
    fs.readdirSync(bin).filter((f) => /^ffmpeg\.exe$/i.test(f) || /\.dll$/i.test(f)).forEach((f) => fs.copyFileSync(path.join(bin, f), path.join(ffDir, f)));
    const lic = path.join(tmp, top, 'LICENSE.txt');
    if (fs.existsSync(lic)) fs.copyFileSync(lic, path.join(ffDir, 'LICENSE.txt'));
    fs.rmSync(tmp, { recursive: true, force: true }); fs.rmSync(zip, { force: true });
    const out = cp.execFileSync(path.join(ffDir, 'ffmpeg.exe'), ['-version']).toString().split('\n')[0];
    console.log('  ✓ ' + out + ' · 체크섬 확인');
  } else console.log('ffmpeg 있음');
  console.log('vendor/ 준비 끝: ' + fs.readdirSync(ROOT).join(', '));
})().catch((e) => { console.error('실패: ' + e.message); process.exit(1); });
