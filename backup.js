// 파일명: backup.js | @version 1.0.0
// 열쇠·설정 내보내기/가져오기 — 두 PC 를 옮겨 다닐 때 한 번에 챙긴다.
//
// ★ 왜 암호를 거는가
//   이 파일 하나에 노션 열쇠·틱틱 앱 비밀·구글 갱신 토큰·런처 관리자 열쇠가 모인다.
//   평문으로 두면 그 파일을 얻은 사람이 그대로 쓸 수 있다. 그래서 암호로 잠근다.
//   («런처보드 관리자 열쇠» 는 다른 데 원본이 없어, 잃어버리면 못 되찾는다)
//
// ★ 잠그는 법: 암호 → scrypt 로 열쇠를 뽑고 → AES-256-GCM 으로 잠근다.
//   GCM 은 «내용이 바뀌었는지» 도 함께 확인해 준다(암호가 틀리면 바로 안다).

const crypto = require('crypto');

/* 열쇠(비밀) 자리 — 이 값들은 «따로» 고를 수 있게 나눠 둔다 */
const SECRETS = ['notionKey', 'feedKey', 'tick', 'gauth'];
/* 열쇠는 아니지만 옮기면 편한 설정 */
const SETTINGS = ['comci', 'comciPick', 'neis', 'dutySheet', 'dutyName',
  'academicSheet', 'rosterSheet', 'recSheet', 'recClasses',
  'boardUrl', 'boardNick', 'boardUrlManual', 'taskDb', 'projDb',
  'theme', 'font', 'fontScale', 'links', 'usageOn', 'usageShow', 'usageStyle',
  'tabOrder', 'officeFav', 'dashOrder', 'dashOff', 'dashSize',
  'feedUrl', 'feedFav', 'feedFold', 'browser', 'taskSplit', 'wxSpot'];

function pick(state, keys) {
  const out = {};
  keys.forEach((k) => { if (state[k] !== undefined) out[k] = state[k]; });
  return out;
}

/* 담을 것을 고른다 — { secrets:true, settings:true } */
function collect(state, want) {
  const body = {};
  if (want.secrets !== false) Object.assign(body, pick(state, SECRETS));
  if (want.settings !== false) Object.assign(body, pick(state, SETTINGS));
  return body;
}

/* 잠그기 — 암호가 비면 «평문»으로 둔다(사용자가 일부러 고른 때만) */
function lock(body, pass, appVersion) {
  const head = { kind: 'jindo-backup', v: 1, at: new Date().toISOString(),
    app: appVersion || '', enc: false };
  if (!String(pass || '')) return JSON.stringify(Object.assign(head, { data: body }), null, 2);

  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = crypto.scryptSync(String(pass), salt, 32);
  const c = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([c.update(JSON.stringify(body), 'utf8'), c.final()]);
  return JSON.stringify(Object.assign(head, {
    enc: true, salt: salt.toString('base64'), iv: iv.toString('base64'),
    tag: c.getAuthTag().toString('base64'), data: enc.toString('base64')
  }), null, 2);
}

/* 열기 — 암호가 틀리면 그렇다고 말해 준다 */
function unlock(text, pass) {
  let j = null;
  try { j = JSON.parse(String(text || '')); } catch (e) { throw new Error('백업 파일이 아닙니다'); }
  if (!j || j.kind !== 'jindo-backup') throw new Error('진호알리미 백업 파일이 아닙니다');
  if (!j.enc) return { body: j.data || {}, at: j.at || '', app: j.app || '' };
  if (!String(pass || '')) throw new Error('암호가 걸린 파일입니다 — 암호를 넣어 주세요');
  try {
    const key = crypto.scryptSync(String(pass), Buffer.from(j.salt, 'base64'), 32);
    const d = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(j.iv, 'base64'));
    d.setAuthTag(Buffer.from(j.tag, 'base64'));
    const out = Buffer.concat([d.update(Buffer.from(j.data, 'base64')), d.final()]);
    return { body: JSON.parse(out.toString('utf8')), at: j.at || '', app: j.app || '' };
  } catch (e) {
    throw new Error('암호가 맞지 않습니다');
  }
}

/* 무엇이 들어 있는지 세어 준다 (값은 안 보여 준다) */
function summary(body) {
  const b = body || {};
  const has = (v) => (v ? 1 : 0);
  return {
    secrets: has(b.notionKey) + has(b.feedKey)
      + has(b.tick && (b.tick.clientId || b.tick.token))
      + has(b.gauth && b.gauth.refreshToken),
    settings: SETTINGS.filter((k) => b[k] !== undefined).length
  };
}

module.exports = { collect, lock, unlock, summary, SECRETS, SETTINGS };
