// 파일명: login-preload.js | @version 1.0.2
// 로그인 창에만 붙는 preload.
//
// 구글은 "앱 안에 끼워 넣은 브라우저"로 들어오는 로그인을 거부한다("로그인할 수 없음 —
// 브라우저 또는 앱이 안전하지 않을 수 있습니다"). 판단 근거가 User-Agent 문자열 하나가
// 아니라서, UA 를 크롬처럼 바꿔도 navigator.userAgentData 의 브랜드 목록에 Electron 이
// 남아 있으면 그대로 막힌다. 여기서 그 목록을 정리한다.
//
// contextIsolation 이 켜져 있어서 preload 의 navigator 를 고쳐 봐야 페이지에는 안 보인다.
// webFrame.executeJavaScript 로 페이지 쪽(메인 월드)에서 실행해야 한다.
const { webFrame } = require('electron');

webFrame.executeJavaScript(`(function () {
  try {
    var uad = navigator.userAgentData;
    if (!uad) return;
    var drop = function (list) {
      return (list || []).filter(function (b) { return !/electron/i.test(b.brand || ''); });
    };
    var brands = drop(uad.brands);
    var high = uad.getHighEntropyValues.bind(uad);
    var shim = {
      brands: brands,
      mobile: uad.mobile,
      platform: uad.platform,
      getHighEntropyValues: function (hints) {
        return high(hints).then(function (r) {
          if (r.brands) r.brands = drop(r.brands);
          if (r.fullVersionList) r.fullVersionList = drop(r.fullVersionList);
          if (r.uaFullVersion && /electron/i.test(r.uaFullVersion)) delete r.uaFullVersion;
          return r;
        });
      },
      toJSON: function () {
        return { brands: brands, mobile: uad.mobile, platform: uad.platform };
      }
    };
    Object.defineProperty(navigator, 'userAgentData', {
      configurable: true,
      get: function () { return shim; }
    });
  } catch (e) { /* 실패해도 로그인 시도 자체는 막지 않는다 */ }
})();`).catch(function () { /* 무시 */ });
