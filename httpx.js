// 파일명: httpx.js | @version 1.0.0
// 구글 API 를 부를 때 쓰는 통로. fetchtext.js 와 같은 이유로 Electron 의 net 을 쓴다
// (학교 망의 SSL 검사 장비 때문에 Node 의 https 는 통째로 막힌다 — fetchtext.js 설명 참고).
//
// fetchText 와 다른 점: 보내는 방법(POST·PATCH)과 헤더를 마음대로 정할 수 있고,
// 200 이 아니어도 «몇 번이고 무슨 말인지» 를 그대로 돌려준다. 구글은 오류 내용을
// 본문에 자세히 적어 주는데, 그걸 버리면 무엇이 잘못됐는지 알 수가 없다.

const { net } = require('electron');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
  + '(KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36';

/* 한 번 부르고 { status, text } 를 돌려준다. 던지지 않는다(연결 자체가 안 될 때만 던진다). */
function request(opts) {
  const o = opts || {};
  return new Promise((resolve, reject) => {
    let done = false;
    const finish = (fn, v) => { if (!done) { done = true; fn(v); } };

    const req = net.request({ method: o.method || 'GET', url: o.url, redirect: 'follow' });
    req.setHeader('User-Agent', UA);
    if (o.token) req.setHeader('Authorization', 'Bearer ' + o.token);
    if (o.contentType) req.setHeader('Content-Type', o.contentType);
    req.setHeader('Accept', 'application/json');
    Object.keys(o.headers || {}).forEach((k) => req.setHeader(k, o.headers[k]));

    req.on('response', (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(Buffer.from(c)));
      res.on('end', () => finish(resolve, {
        status: res.statusCode,
        text: Buffer.concat(chunks).toString('utf8')
      }));
      res.on('error', (e) => finish(reject, e));
    });
    req.on('error', (e) => {
      const msg = String((e && e.message) || e);
      finish(reject, new Error(
        /certificate/i.test(msg) ? '보안 인증서 문제로 연결하지 못했습니다'
          : /ENOTFOUND|ENAME|DNS/i.test(msg) ? '인터넷에 연결되어 있지 않은 것 같습니다'
            : msg));
    });

    const t = setTimeout(() => {
      finish(reject, new Error('서버가 응답하지 않습니다'));
      try { req.abort(); } catch (e) { /* 무시 */ }
    }, o.timeout || 25000);
    req.on('close', () => clearTimeout(t));

    if (o.body) req.write(o.body);
    req.end();
  });
}

/* JSON 을 주고받는다. 구글이 오류를 내면 그 안의 message 를 그대로 사람에게 보여준다. */
async function json(opts) {
  const r = await request(opts);
  let data = null;
  try { data = r.text ? JSON.parse(r.text) : null; } catch (e) { /* 글자 그대로 둔다 */ }
  if (r.status < 200 || r.status >= 300) {
    const msg = (data && data.error && (data.error.message || data.error_description))
      || (data && data.error_description) || r.text.slice(0, 300) || ('오류 ' + r.status);
    const err = new Error(msg);
    err.status = r.status;
    err.data = data;
    throw err;
  }
  return data;
}

/* application/x-www-form-urlencoded 로 보낸다 (OAuth 토큰 주고받기에 쓴다) */
function form(obj) {
  return Object.keys(obj)
    .filter((k) => obj[k] !== undefined && obj[k] !== null)
    .map((k) => encodeURIComponent(k) + '=' + encodeURIComponent(obj[k]))
    .join('&');
}

module.exports = { request, json, form };
