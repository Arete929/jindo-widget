/* 파일명: pmread.js | @version 1.0.0
   품의 도우미 — 장바구니 캡처에서 품목·수량·단가·배송비를 읽는다 (메인 프로세스).
   이 PC 에 로그인된 `claude`(Claude Code)에 그림을 보내 JSON 으로 받는다. 지비스는 열쇠를 만지지 않는다.
   파일·명령은 못 쓰게(--tools "") 하고 대화 기록도 남기지 않는다(--no-session-persistence). */
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');

function claudeExe() {
  const p = path.join(os.homedir(), '.local', 'bin', process.platform === 'win32' ? 'claude.exe' : 'claude');
  return fs.existsSync(p) ? p : 'claude';
}

const PROMPT = [
  '이 그림은 쇼핑몰 장바구니(주문 전 확인) 화면 캡처입니다. 학교 품의(견적서)에 넣을 품목을 읽어 주세요.',
  '규칙:',
  '- 품목은 «옵션 줄» 하나가 한 줄입니다. 한 상품에 옵션 줄이 여러 개면 각각 따로 내보냅니다.',
  '- name: 상품 이름(쇼핑몰 표시 문구·광고 문구는 빼고 핵심만). option: 옵션 줄 글자(없으면 빈 글자).',
  '- qty: 그 옵션 줄의 수량(정수).',
  '- total: 그 옵션 줄 오른쪽에 적힌 금액(원, 숫자만). unit 은 쓰지 마세요 — 단가는 total ÷ qty 로 제가 계산합니다.',
  '  (옵션 추가금이 있으면 이미 total 에 들어 있습니다. 취소선 원래 가격이나 할인율 값을 total 로 쓰면 안 됩니다.)',
  '- shipping: «총 배송비» 금액(원). 무료이거나 안 보이면 0.',
  '- 글자가 잘려 읽을 수 없으면 그 줄은 빼고 notes 에 이유를 적습니다.',
  '반드시 JSON 한 덩어리만 출력하세요(설명·코드블록 표시 금지):',
  '{"items":[{"name":"","option":"","qty":1,"total":0}],"shipping":0,"notes":""}'
].join('\n');

function parseJson(text) {
  const s = String(text || ''), a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a < 0 || b <= a) throw new Error('읽은 결과를 해석하지 못했습니다');
  return JSON.parse(s.slice(a, b + 1));
}
const num = (v) => { const n = Number(String(v == null ? '' : v).replace(/[,\s원]/g, '')); return isFinite(n) && n > 0 ? Math.round(n) : 0; };

/* dataUrl(png/jpeg) → { ok, items:[{name,option,qty,p}], shipping, notes } | { ok:false, msg } */
function readCapture(dataUrl, opts) {
  opts = opts || {};
  return new Promise((resolve) => {
    const m = /^data:(image\/(?:png|jpeg|gif|webp));base64,(.+)$/.exec(String(dataUrl || ''));
    if (!m) return resolve({ ok: false, msg: '그림을 읽을 수 없는 형식입니다' });
    const args = ['-p', '--input-format', 'stream-json', '--output-format', 'stream-json', '--verbose', '--no-session-persistence', '--tools', ''];
    if (opts.model) args.push('--model', opts.model);
    let child, out = '', err = '', done = false, result = null;
    const fin = (r) => { if (done) return; done = true; clearTimeout(timer); try { child.kill(); } catch (e) { /* 이미 끝남 */ } resolve(r); };
    const timer = setTimeout(() => fin({ ok: false, msg: '시간이 너무 오래 걸립니다(90초). 다시 눌러 주세요' }), 90000);
    try { child = cp.spawn(opts.exe || claudeExe(), args, { cwd: os.tmpdir(), windowsHide: true, env: Object.assign({}, process.env, { CLAUDE_CODE_ENTRYPOINT: 'jibis-pmread' }) }); }
    catch (e) { return fin({ ok: false, msg: '`claude` 를 시작하지 못했습니다 — ' + ((e && e.message) || e) }); }
    child.on('error', (e) => fin({ ok: false, msg: '`claude` 를 찾지 못했습니다. Claude Code 가 이 PC 에 설치·로그인돼 있어야 합니다.' + (e && e.code ? ' (' + e.code + ')' : '') }));
    child.stderr.on('data', (d) => { err += d.toString('utf8'); });
    child.stdout.on('data', (d) => {
      out += d.toString('utf8'); let i;
      while ((i = out.indexOf('\n')) >= 0) {
        const l = out.slice(0, i).trim(); out = out.slice(i + 1); if (!l) continue;
        let j; try { j = JSON.parse(l); } catch (e) { continue; }
        if (j.type === 'result') result = j;
      }
    });
    child.on('exit', () => {
      if (done) return;
      if (!result || result.is_error || typeof result.result !== 'string') {
        const why = (result && result.result) || err.trim().slice(0, 200) || '답이 없습니다';
        return fin({ ok: false, msg: /login|auth|로그인/i.test(why) ? 'Claude 에 로그인돼 있지 않습니다. 지비스의 Claude 채팅 또는 터미널에서 먼저 로그인해 주세요.' : '캡처를 읽지 못했습니다 — ' + why });
      }
      try {
        const j = parseJson(result.result);
        const items = (Array.isArray(j.items) ? j.items : []).map((x) => {
          const q = Math.max(1, Math.round(Number(x.qty) || 1)), t = num(x.total);
          return { name: String(x.name || '').trim(), option: String(x.option || '').trim(), qty: q, p: t ? Math.round(t / q) : 0 };
        }).filter((x) => x.name && x.p);
        if (!items.length) return fin({ ok: false, msg: '캡처에서 품목을 찾지 못했습니다' + (j.notes ? ' — ' + String(j.notes).slice(0, 120) : '') });
        fin({ ok: true, items, shipping: num(j.shipping), notes: String(j.notes || '') });
      } catch (e) { fin({ ok: false, msg: '읽은 결과를 해석하지 못했습니다' }); }
    });
    child.stdin.on('error', () => { /* 먼저 끝난 경우 */ });
    child.stdin.write(JSON.stringify({ type: 'user', message: { role: 'user', content: [
      { type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } }, { type: 'text', text: PROMPT }] } }) + '\n');
    child.stdin.end();
  });
}

module.exports = { readCapture };
