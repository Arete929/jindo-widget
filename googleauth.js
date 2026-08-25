// 파일명: googleauth.js | @version 1.0.0
// 구글 로그인(OAuth) — 학생기록 시트를 «그 사람 계정에» 만들고 읽고 쓰기 위한 것.
//
// ★ 왜 이렇게 하나
//   위젯 안 창에서 구글 로그인을 하면 구글이 «안전하지 않은 앱» 이라며 막는다.
//   그래서 «설치형 앱» 방식(loopback + PKCE)을 쓴다 — 진짜 크롬에서 로그인하고,
//   구글이 127.0.0.1 로 코드를 돌려주면 그것을 토큰으로 바꾼다.
//   수업진도 로그인(startLogin)과 결이 같지만, 그쪽은 파이어베이스 ID 토큰을
//   넘겨받는 것이고 이쪽은 구글 API 를 부를 액세스 토큰을 받는 것이라 따로 둔다.
//
// ★ 권한(scope)
//   drive.file      — «이 앱이 만든 파일»만 다룰 수 있다. 남의 드라이브를 헤집지 못한다.
//                     구글이 «민감하지 않음» 으로 분류해 심사를 받지 않아도 된다.
//                     (전에 막혔던 drive.readonly 는 «제한됨» 이라 사정이 달랐다)
//   spreadsheets    — 그 시트의 칸을 읽고 쓴다
//
// ★ 준비물
//   구글 클라우드 콘솔에서 «데스크톱 앱» OAuth 클라이언트를 하나 만들어
//   clientId / clientSecret 을 설정에 넣어야 한다. 설치형 앱의 secret 은
//   비밀이 아니며(구글 문서에도 그렇게 적혀 있다) 코드를 토큰으로 바꿀 때만 쓴다.

const http = require('http');
const crypto = require('crypto');
const { json, form } = require('./httpx.js');

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const REVOKE_URL = 'https://oauth2.googleapis.com/revoke';
// ★ 권한은 «앱이 만든 파일» 하나로 충분하다.
//   시트 API 도 drive.file 로 그 파일들을 읽고 쓸 수 있다.
//   spreadsheets(전체) 는 구글이 «민감함» 으로 봐서 심사를 받아야 하지만,
//   drive.file 은 «민감하지 않음» 이라 심사도, 경고 화면도 없다.
//   userinfo.email 도 민감하지 않다 — 어느 계정에 연결됐는지 보여주려고 받는다.
const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.email'
].join(' ');

const DONE_HTML = `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<title>연결됨</title><style>
body{font-family:"Malgun Gothic",sans-serif;background:#F7F7FF;color:#27187E;
     display:flex;align-items:center;justify-content:center;height:100vh;margin:0}
div{text-align:center}h1{font-size:22px;margin:0 0 10px}p{color:#6b6a86;font-size:14px}
</style></head><body><div><h1>연결됐습니다</h1>
<p>이 탭은 닫으셔도 됩니다. 위젯으로 돌아가 주세요.</p></div></body></html>`;

function b64url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/* 크롬으로 로그인시키고 액세스·갱신 토큰을 받아 온다.
   openBrowser(url) 와 log(msg) 는 main 에서 넣어 준다. */
function signIn(cfg, openBrowser, log) {
  const say = log || (() => {});
  return new Promise((resolve, reject) => {
    if (!cfg || !cfg.clientId || !cfg.clientSecret) {
      reject(new Error('구글 클라이언트 정보가 아직 설정에 없습니다'));
      return;
    }
    const verifier = b64url(crypto.randomBytes(32));
    const challenge = b64url(crypto.createHash('sha256').update(verifier).digest());
    const state = b64url(crypto.randomBytes(16));
    let settled = false;
    const finish = (fn, v) => {
      if (settled) return;
      settled = true;
      try { server.close(); } catch (e) { /* 무시 */ }
      clearTimeout(timer);
      fn(v);
    };

    const server = http.createServer(async (req, res) => {
      const u = new URL(req.url, 'http://127.0.0.1');
      const code = u.searchParams.get('code');
      const err = u.searchParams.get('error');
      const st = u.searchParams.get('state');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(DONE_HTML);
      if (err) { finish(reject, new Error('구글에서 거절했습니다: ' + err)); return; }
      if (!code) return;
      if (st !== state) { finish(reject, new Error('확인값이 맞지 않습니다')); return; }
      try {
        const port = server.address().port;
        const tok = await json({
          method: 'POST', url: TOKEN_URL,
          contentType: 'application/x-www-form-urlencoded',
          body: form({
            code: code,
            client_id: cfg.clientId,
            client_secret: cfg.clientSecret,
            redirect_uri: 'http://127.0.0.1:' + port,
            grant_type: 'authorization_code',
            code_verifier: verifier
          })
        });
        say('구글 연결 완료');
        finish(resolve, tok);
      } catch (e) { finish(reject, e); }
    });

    server.on('error', (e) => finish(reject, new Error('연결 창구를 열지 못했습니다: ' + e.message)));
    // 포트는 구글이 «설치형 앱» 에 한해 아무 번호나 허용한다
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      const url = AUTH_URL + '?' + form({
        client_id: cfg.clientId,
        redirect_uri: 'http://127.0.0.1:' + port,
        response_type: 'code',
        scope: SCOPES,
        access_type: 'offline',
        prompt: 'consent',
        state: state,
        code_challenge: challenge,
        code_challenge_method: 'S256'
      });
      say('구글 로그인 창을 엽니다 (127.0.0.1:' + port + ')');
      openBrowser(url);
    });

    const timer = setTimeout(() => finish(reject, new Error('로그인 대기 시간이 지났습니다')), 5 * 60 * 1000);
  });
}

/* 갱신 토큰으로 액세스 토큰을 새로 받는다 (액세스 토큰은 한 시간이면 만료된다) */
async function refresh(cfg, refreshToken) {
  return json({
    method: 'POST', url: TOKEN_URL,
    contentType: 'application/x-www-form-urlencoded',
    body: form({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  });
}

/* 연결 끊기 — 구글 쪽에서도 권한을 지운다 */
async function revoke(token) {
  try {
    await json({
      method: 'POST', url: REVOKE_URL,
      contentType: 'application/x-www-form-urlencoded',
      body: form({ token: token })
    });
  } catch (e) { /* 이미 지워졌으면 그만이다 */ }
}

/* ★ 구글은 드라이브 권한을 «꺼져 있는 체크박스» 로 보여준다.
   그것을 안 켜고 «계속» 을 누르면 이메일 권한만 들어오고,
   그 뒤로는 시트를 만들려 할 때마다 조용히 403 이 난다.
   그래서 받아 온 토큰에 드라이브 권한이 들어 있는지 여기서 확인한다. */
function hasDrive(tok) {
  return String((tok && tok.scope) || '').indexOf('/auth/drive.file') >= 0;
}
const NEED_DRIVE_MSG = '드라이브 권한이 빠졌습니다.\n\n'
  + '다시 «구글 연결하기» 를 누르고, 크롬 화면에서\n'
  + '«Google Drive에서 이 앱으로 열거나 만든 파일 보기 및 관리»\n'
  + '체크상자를 반드시 켠 뒤 «계속» 을 눌러 주세요.\n'
  + '(«모두 선택» 을 눌러도 됩니다)';

module.exports = { signIn, refresh, revoke, hasDrive, NEED_DRIVE_MSG, SCOPES };
