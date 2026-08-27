// 파일명: fetchtext.js | @version 1.0.0
// 바깥에서 글자를 받아오는 공용 통로.
//
// ★ 왜 Node 의 https 를 안 쓰고 Electron 의 net 을 쓰는가:
//   학교·회사 망은 SSL 검사 장비를 두는 곳이 많다. 그러면 인증서가 그 장비 것으로
//   바뀌는데, Node 는 윈도우 인증서 저장소를 보지 않아서
//     «self signed certificate in certificate chain»
//   으로 통째로 막힌다. Electron 의 net 은 크롬과 같은 통신망을 써서 OS 에 깔린
//   인증서를 그대로 믿고, 시스템 프록시 설정도 따른다.
//   (컴시간만 멀쩡했던 이유는 그쪽이 http 라 TLS 를 안 타기 때문이다)

const { net } = require('electron');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
  + '(KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36';

/* url 에서 글자를 받아온다. 실패하면 사람이 읽을 수 있는 말로 던진다. */
function fetchText(url, opts) {
  const o = opts || {};
  return new Promise((resolve, reject) => {
    let done = false;
    const finish = (fn, v) => { if (!done) { done = true; fn(v); } };

    const req = net.request({ method: 'GET', url: url, redirect: 'follow' });
    req.setHeader('User-Agent', o.userAgent || UA);
    req.setHeader('Accept', o.accept || '*/*');
    req.setHeader('Accept-Language', 'ko-KR,ko;q=0.9');

    req.on('response', (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(Buffer.from(c)));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        if (res.statusCode !== 200) {
          finish(reject, new Error(
            res.statusCode === 404 ? '찾을 수 없습니다'
              : res.statusCode === 403 ? '공유되어 있지 않습니다(권한 없음)'
                : `오류 ${res.statusCode}`));
          return;
        }
        finish(resolve, o.raw ? buf : buf.toString(o.encoding || 'utf8'));
      });
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
    const clear = () => clearTimeout(t);
    req.on('close', clear);

    req.end();
  });
}

/* 글자를 보내고 답을 받는다 — 전광판이 한 줄 올릴 때 쓴다.
   ★ GAS 웹앱은 POST 를 받고 나서 «다른 주소로 넘긴다»(302 → googleusercontent).
     redirect:follow 로 그냥 따라가면 POST 를 다시 보내려다
     «411 Length Required» 가 난다 — 글은 이미 담겼는데 실패한 줄 안다.
     그래서 넘김을 손수 받아, 넘어간 주소는 GET 으로 읽는다.
   ★ Content-Type 은 text/plain 으로 둔다. application/json 이면 GAS 가 안 받는다. */
function postText(url, body, opts) {
  const o = opts || {};
  const text = String(body == null ? '' : body);
  const buf = Buffer.from(text, 'utf8');
  return new Promise((resolve, reject) => {
    let done = false;
    const finish = (fn, v) => { if (!done) { done = true; fn(v); } };
    const t = setTimeout(() => {
      finish(reject, new Error('서버가 응답하지 않습니다'));
    }, o.timeout || 25000);
    const ok = (v) => { clearTimeout(t); finish(resolve, v); };
    const no = (e) => { clearTimeout(t); finish(reject, e); };

    const req = net.request({ method: 'POST', url: url, redirect: 'manual' });
    req.setHeader('User-Agent', o.userAgent || UA);
    req.setHeader('Content-Type', 'text/plain;charset=utf-8');
    // ★ Content-Length 는 손대지 않는다 — 크로미움이 스스로 넣는다.
    //   직접 넣으면 net::ERR_INVALID_ARGUMENT 로 막힌다.

    // 넘기라고 하면 그 주소를 GET 으로 읽는다
    req.on('redirect', (status, method, redirectUrl) => {
      try { req.abort(); } catch (e) { /* 무시 */ }
      fetchText(redirectUrl, { timeout: o.timeout || 25000 }).then(ok).catch(no);
    });
    req.on('response', (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(Buffer.from(c)));
      res.on('end', () => {
        const txt = Buffer.concat(chunks).toString('utf8');
        if (res.statusCode !== 200) { no(new Error('오류 ' + res.statusCode)); return; }
        ok(txt);
      });
      res.on('error', (e) => no(e));
    });
    req.on('error', (e) => no(new Error(String((e && e.message) || e))));
    req.write(buf);
    req.end();
  });
}

module.exports = { fetchText, postText };
