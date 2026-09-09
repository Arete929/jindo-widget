// 파일명: tools/stamp-docs.js | @version 1.0.0
// 내려받기 안내 페이지(docs/index.html)에 «지금 판·크기·날짜» 를 글자로 박는다.
//
// ★ 왜 박아 넣나 — 페이지는 깃허브에 물어 최신 판을 채우지만, 학교 망에서 막히거나
//   시간당 한도(60번)에 걸리면 아무것도 안 뜬다. 그래서 낼 때의 값을 글자로 남겨 두고,
//   물어보기가 되면 그때 덮어쓰게 한다. 못 물어봐도 «판 1.114.3» 은 늘 보인다.
//
// 쓰는 법 — 빌드가 끝난 뒤, 릴리스 만들기 전에:  node tools/stamp-docs.js

const fs = require('fs');
const path = require('path');

const 뿌리 = path.join(__dirname, '..');
const 판 = JSON.parse(fs.readFileSync(path.join(뿌리, 'package.json'), 'utf8')).version;
const 설치본 = path.join(뿌리, 'dist', 'HyewonDesk-Setup-' + 판 + '.exe');

if (!fs.existsSync(설치본)) {
  console.error('★ ' + path.basename(설치본) + ' 이 없습니다 — 혜비스를 먼저 빌드하세요');
  process.exit(1);
}
const 메가 = Math.round(fs.statSync(설치본).size / 1048576) + 'MB';
const d = new Date();
const 두자리 = (n) => String(n).padStart(2, '0');
const 날 = d.getFullYear() + '. ' + 두자리(d.getMonth() + 1) + '. ' + 두자리(d.getDate());

const F = path.join(뿌리, 'docs', 'index.html');
let h = fs.readFileSync(F, 'utf8');
const 바꾸기 = (딱지, 값) => {
  const 열기 = '<!--' + 딱지 + '-->';
  const 닫기 = '<!--/' + 딱지 + '-->';
  let 자리 = 0, 셈 = 0;
  for (;;) {
    const a = h.indexOf(열기, 자리);
    if (a < 0) break;
    const b = h.indexOf(닫기, a + 열기.length);
    if (b < 0) { console.error('★ ' + 닫기 + ' 가 짝이 없습니다'); process.exit(1); }
    h = h.slice(0, a + 열기.length) + 값 + h.slice(b);
    자리 = a + 열기.length + String(값).length + 닫기.length;
    셈++;
  }
  if (!셈) { console.error('★ ' + 딱지 + ' 딱지를 못 찾았습니다'); process.exit(1); }
  return 셈;
};
바꾸기('VER', 판);
바꾸기('SIZE', 메가);
바꾸기('DATE', 날);
fs.writeFileSync(F, h);
console.log('안내 페이지에 박음 — 판 ' + 판 + ' · ' + 메가 + ' · ' + 날);
