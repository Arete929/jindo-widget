// 파일명: comcigan.js | @version 1.0.0
// 컴시간알리미(http://comci.net:4082) 에서 학교 시간표를 받아온다.
//
// ★ 왜 위젯(메인 프로세스)에서 하나:
//   컴시간은 암호화 없는 http + 비표준 포트(4082) 라서 https 웹앱은 브라우저가 막는다.
//   Electron 메인 프로세스는 제약 없이 부를 수 있다.
//
// ★ 규약은 공식 문서가 아니라 /st 페이지의 스크립트에서 읽어낸다.
//   라우트 번호(예: 36179)와 접두어(예: 17384l, 73629_)가 수시로 바뀌기 때문에
//   미리 적어두지 않고 부를 때마다 새로 읽는다. 그래야 바뀌어도 안 깨진다.
//
// ★ 자료 짜임 (분리=1000 기준)
//   자료481[학년][반][요일][교시] = 과목번호 * 분리 + 교사번호
//   자료542[교사][요일][교시]     = 과목번호 * 분리 + 학년 * 100 + 반
//   (둘 다 «과목이 앞자리». 두 화면을 서로 대조해서 확인했다 —
//    3학년 1반 월 2교시 = 국어/김*환 이고, 교사 김*환의 월 2교시 = 3-1 국어 로 일치한다)
//   자료446 = 교사 이름 (컴시간이 «김*환» 처럼 가려서 준다 — 그대로 쓴다)
//   자료492 = 과목 이름 / 일과시간 = 교시별 시각

const http = require('http');

const HOST = 'comci.net';
const PORT = 4082;
const DOW = ['', '월', '화', '수', '목', '금'];

function get(path, timeoutMs) {
  return new Promise((resolve, reject) => {
    const req = http.get({
      host: HOST, port: PORT, path: path,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
        Accept: '*/*',
        'Accept-Language': 'ko-KR,ko;q=0.9'
      }
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, buf: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs || 15000, () => { req.destroy(new Error('컴시간 서버가 응답하지 않습니다')); });
  });
}

/* 컴시간이 주는 JSON 은 뒤에 쓰레기가 붙어 있고, 인코딩이 상황에 따라 다르다 */
function parseJson(buf) {
  let s = buf.toString('utf8');
  let cut = s.lastIndexOf('}');
  if (cut > 0) {
    try { return JSON.parse(s.slice(0, cut + 1)); } catch (e) { /* 아래에서 재시도 */ }
  }
  s = new TextDecoder('euc-kr').decode(buf);
  cut = s.lastIndexOf('}');
  if (cut > 0) {
    try { return JSON.parse(s.slice(0, cut + 1)); } catch (e) { /* 실패 */ }
  }
  return null;
}

/* 한글을 EUC-KR 로 URL 인코딩한다 (검색어를 보낼 때 필요) */
let euckrTable = null;
function euckrEscape(s) {
  if (!euckrTable) {
    const dec = new TextDecoder('euc-kr');
    euckrTable = new Map();
    for (let hi = 0xA1; hi <= 0xFE; hi++) {
      for (let lo = 0xA1; lo <= 0xFE; lo++) {
        const ch = dec.decode(new Uint8Array([hi, lo]));
        if (ch && ch.length === 1 && ch !== '�' && !euckrTable.has(ch)) euckrTable.set(ch, [hi, lo]);
      }
    }
  }
  let out = '';
  for (const ch of String(s)) {
    if (/[A-Za-z0-9_.!~*'()-]/.test(ch)) { out += ch; continue; }
    const b = euckrTable.get(ch);
    out += b ? b.map((x) => '%' + x.toString(16).toUpperCase().padStart(2, '0')).join('')
      : encodeURIComponent(ch);
  }
  return out;
}

/* /st 페이지에서 그때그때의 규약을 읽어낸다 */
async function readProtocol() {
  const r = await get('/st');
  if (r.status !== 200) throw new Error(`컴시간 접속 실패 (HTTP ${r.status})`);
  const html = r.buf.toString('latin1');
  const route = (html.match(/url\s*:\s*'\.\/(\d+)\?/) || [])[1];
  const searchPrefix = (html.match(/'\.\/\d+\?(\w+)'\s*\+\s*sc/) || [])[1];
  const dataPrefix = (html.match(/sc_data\('(\d+_)'/) || [])[1];
  if (!route || !searchPrefix || !dataPrefix) {
    throw new Error('컴시간 규약을 읽지 못했습니다 (서비스가 바뀐 것 같습니다)');
  }
  return { route, searchPrefix, dataPrefix };
}

/* 학교 이름으로 찾기 → [{code, region, name}] */
async function searchSchool(name) {
  const p = await readProtocol();
  const r = await get('/' + p.route + '?' + p.searchPrefix + euckrEscape(name));
  const j = parseJson(r.buf);
  const list = (j && (j['학교검색'] || j.school_list)) || [];
  return list.map((row) => ({
    code: row[3], region: row[1], name: row[2], id: row[0]
  })).filter((x) => x.code && x.name);
}

/* 학교 코드로 시간표 한 벌 받기 (r=1 학급 기준, r=2 교사 기준 — 알맹이는 같다) */
async function fetchRaw(schoolCode, r) {
  const p = await readProtocol();
  const key = Buffer.from(p.dataPrefix + schoolCode + '_0_' + (r || 1), 'utf8').toString('base64');
  const res = await get('/' + p.route + '?' + key, 20000);
  const j = parseJson(res.buf);
  if (!j) throw new Error('시간표를 해석하지 못했습니다');
  if (!j['자료481'] && !j['자료542']) throw new Error('시간표 자료가 비어 있습니다');
  return j;
}

/* 교시별 시각: "1(09:10)" -> {1:'09:10'} */
function periodTimes(j) {
  const out = {};
  (j['일과시간'] || []).forEach((s) => {
    const m = String(s).match(/^(\d+)\((\d{1,2}:\d{2})\)/);
    if (m) out[Number(m[1])] = m[2];
  });
  return out;
}

/* 받은 자료를 위젯이 쓰기 좋은 모양으로 정리한다 */
function shape(j, want) {
  const sep = j['분리'] || 1000;
  const subs = j['자료492'] || [];
  const teachers = j['자료446'] || [];
  const subName = (i) => subs[i] || '';
  const out = {
    fetchedAt: new Date().toISOString(),
    school: j['학교명'] || '', region: j['지역명'] || '',
    year: j['학년도'] || '', updatedAt: j['자료244'] || '',
    times: periodTimes(j),
    teachers: teachers.map((t, i) => ({ i, name: t })).filter((t) => t.i > 0 && t.name),
    classes: null, byTeacher: null
  };

  if (want.classes && j['자료481']) {
    const T = j['자료481'], counts = j['학급수'] || [];
    const grades = [];
    for (let g = 1; g < T.length; g++) {
      const gcls = [];
      const n = Number(counts[g]) || (T[g] ? T[g].length - 1 : 0);
      for (let c = 1; c <= n; c++) {
        const days = [];
        for (let d = 1; d <= 5; d++) {
          const row = (T[g] && T[g][c] && T[g][c][d]) || [];
          const periods = [];
          for (let p = 1; p < row.length; p++) {
            const v = row[p];
            if (!v) { periods.push(null); continue; }
            periods.push({ p, subject: subName(Math.floor(v / sep)), teacher: teachers[v % sep] || '' });
          }
          days.push({ dow: DOW[d], periods });
        }
        gcls.push({ grade: g, cls: c, days });
      }
      grades.push({ grade: g, classes: gcls });
    }
    out.classes = grades;
  }

  if (want.teacher && j['자료542']) {
    const T = j['자료542'];
    const list = [];
    for (let t = 1; t < T.length; t++) {
      const days = [];
      for (let d = 1; d <= 5; d++) {
        const row = (T[t] && T[t][d]) || [];
        const periods = [];
        for (let p = 1; p < row.length; p++) {
          const v = row[p];
          if (!v) { periods.push(null); continue; }
          const gc = v % sep;
          periods.push({
            p, subject: subName(Math.floor(v / sep)),
            grade: Math.floor(gc / 100), cls: gc % 100
          });
        }
        days.push({ dow: DOW[d], periods });
      }
      list.push({ i: t, name: teachers[t] || ('교사' + t), days });
    }
    out.byTeacher = list;
  }
  return out;
}

/* 학교 코드로 시간표를 받아 정리한다.
   ★ 한 번 요청하면 교사·학급 자료가 같이 오므로 언제나 둘 다 만들어 둔다.
     («무엇을 볼지» 는 위젯에서 고르면 되고, 그때 다시 받을 필요가 없다) */
async function fetchTimetable(schoolCode) {
  const j = await fetchRaw(schoolCode, 1);
  return shape(j, { teacher: true, classes: true });
}

module.exports = { searchSchool, fetchTimetable, readProtocol };
