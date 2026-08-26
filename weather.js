// 파일명: weather.js | @version 1.0.0
// 날씨 · 미세먼지 (Open-Meteo — 열쇠가 필요 없다)
//
//   날씨      https://api.open-meteo.com/v1/forecast
//   미세먼지  https://air-quality-api.open-meteo.com/v1/air-quality
//
// ★ 지역 고르기는 «심어 둔 목록» 으로 한다.
//   Open-Meteo 의 지역 찾기는 한국 «구» 이름을 못 찾는다(«중랑구»·«노원구» 다 없음).
//   그래서 서울 25개 구와 시·도 대표 지점을 표로 들고 있고,
//   그 밖은 위도·경도를 직접 넣게 한다.

const { fetchText } = require('./fetchtext.js');

/* 혜원여자중학교(서울 중랑구) 언저리 — 기본값 */
const DEFAULT_SPOT = { name: '혜원여자중학교', lat: 37.6063, lon: 127.0925 };

/* 심어 둔 지역. 날씨·미세먼지는 몇 킬로미터 차이로는 거의 같으므로 구 단위면 넉넉하다. */
const SPOTS = [
  { g: '서울', list: [
    ['중랑구', 37.606, 127.093], ['노원구', 37.654, 127.056], ['도봉구', 37.669, 127.047],
    ['강북구', 37.640, 127.026], ['성북구', 37.589, 127.017], ['동대문구', 37.574, 127.040],
    ['광진구', 37.538, 127.082], ['성동구', 37.563, 127.037], ['종로구', 37.573, 126.979],
    ['중구', 37.564, 126.998], ['용산구', 37.532, 126.990], ['서대문구', 37.579, 126.937],
    ['마포구', 37.566, 126.902], ['은평구', 37.603, 126.929], ['강서구', 37.551, 126.850],
    ['양천구', 37.517, 126.867], ['구로구', 37.495, 126.888], ['금천구', 37.457, 126.895],
    ['영등포구', 37.526, 126.896], ['동작구', 37.512, 126.940], ['관악구', 37.478, 126.952],
    ['서초구', 37.484, 127.033], ['강남구', 37.517, 127.047], ['송파구', 37.515, 127.106],
    ['강동구', 37.530, 127.124]
  ] },
  { g: '경기·인천', list: [
    ['인천', 37.456, 126.705], ['수원', 37.263, 127.029], ['성남', 37.420, 127.127],
    ['고양', 37.658, 126.832], ['용인', 37.241, 127.178], ['부천', 37.503, 126.766],
    ['남양주', 37.636, 127.216], ['안산', 37.322, 126.831], ['의정부', 37.738, 127.034],
    ['구리', 37.594, 127.130]
  ] },
  { g: '그 밖', list: [
    ['부산', 35.180, 129.075], ['대구', 35.872, 128.601], ['광주', 35.160, 126.851],
    ['대전', 36.350, 127.385], ['울산', 35.539, 129.311], ['세종', 36.480, 127.289],
    ['춘천', 37.881, 127.730], ['강릉', 37.752, 128.876], ['청주', 36.642, 127.489],
    ['전주', 35.824, 127.148], ['목포', 34.812, 126.392], ['포항', 36.019, 129.343],
    ['창원', 35.228, 128.682], ['제주', 33.499, 126.531]
  ] }
];

/* WMO 날씨 코드 → 우리 말과 그림 */
const CODES = {
  0: ['맑음', '☀'], 1: ['대체로 맑음', '🌤'], 2: ['구름 조금', '⛅'], 3: ['흐림', '☁'],
  45: ['안개', '🌫'], 48: ['서리 안개', '🌫'],
  51: ['가랑비', '🌦'], 53: ['가랑비', '🌦'], 55: ['가랑비', '🌦'],
  56: ['어는 가랑비', '🌧'], 57: ['어는 가랑비', '🌧'],
  61: ['비', '🌧'], 63: ['비', '🌧'], 65: ['강한 비', '🌧'],
  66: ['어는 비', '🌧'], 67: ['어는 비', '🌧'],
  71: ['눈', '🌨'], 73: ['눈', '🌨'], 75: ['많은 눈', '🌨'], 77: ['싸락눈', '🌨'],
  80: ['소나기', '🌦'], 81: ['소나기', '🌦'], 82: ['강한 소나기', '🌧'],
  85: ['소낙눈', '🌨'], 86: ['소낙눈', '🌨'],
  95: ['천둥번개', '⛈'], 96: ['우박 천둥', '⛈'], 99: ['우박 천둥', '⛈']
};
function codeOf(c) { return CODES[Number(c)] || ['—', '·']; }

/* 환경부 기준 등급 — 좋음 / 보통 / 나쁨 / 매우 나쁨 */
function pmGrade(v, fine) {
  const n = Number(v);
  if (!isFinite(n)) return null;
  const cut = fine ? [15, 35, 75] : [30, 80, 150];
  const i = n <= cut[0] ? 0 : n <= cut[1] ? 1 : n <= cut[2] ? 2 : 3;
  return { v: Math.round(n), lv: i, t: ['좋음', '보통', '나쁨', '매우 나쁨'][i] };
}

async function fetchWeather(lat, lon) {
  const q = `latitude=${lat}&longitude=${lon}&timezone=Asia%2FSeoul`;
  const w = JSON.parse(await fetchText(
    'https://api.open-meteo.com/v1/forecast?' + q
    + '&current=temperature_2m,apparent_temperature,weather_code,relative_humidity_2m'
    + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max'
    + '&forecast_days=2'));
  // 미세먼지는 따로 받는다. 여기서 막혀도 날씨는 보여준다.
  let air = null;
  try {
    const a = JSON.parse(await fetchText(
      'https://air-quality-api.open-meteo.com/v1/air-quality?' + q + '&current=pm10,pm2_5'));
    const c = (a && a.current) || {};
    air = { pm10: pmGrade(c.pm10, false), pm25: pmGrade(c.pm2_5, true) };
  } catch (e) { /* 미세먼지만 없이 간다 */ }

  const c = w.current || {}, d = w.daily || {};
  const code = codeOf(c.weather_code);
  return {
    now: {
      temp: Math.round(Number(c.temperature_2m)),
      feels: Math.round(Number(c.apparent_temperature)),
      hum: Math.round(Number(c.relative_humidity_2m)),
      text: code[0], icon: code[1]
    },
    today: {
      min: Math.round(Number((d.temperature_2m_min || [])[0])),
      max: Math.round(Number((d.temperature_2m_max || [])[0])),
      rain: Number((d.precipitation_probability_max || [])[0]) || 0
    },
    tomorrow: {
      min: Math.round(Number((d.temperature_2m_min || [])[1])),
      max: Math.round(Number((d.temperature_2m_max || [])[1])),
      rain: Number((d.precipitation_probability_max || [])[1]) || 0,
      text: codeOf((d.weather_code || [])[1])[0], icon: codeOf((d.weather_code || [])[1])[1]
    },
    air: air,
    fetchedAt: new Date().toISOString()
  };
}

module.exports = { fetchWeather, SPOTS, DEFAULT_SPOT, pmGrade, codeOf };
