// 파일명: sysinfo.js | @version 1.0.0
// 이 PC 의 CPU · 램 사용량.
//
// 인터넷도 열쇠도 필요 없다 — Node 의 os 가 그냥 알려 준다.
//
// ★ CPU 는 «지금 몇 %» 라는 값이 따로 없다. os.cpus() 가 주는 것은 켜진 뒤로 쌓인
//   «일한 시간 / 논 시간» 이라서, 두 번 재서 그 사이의 차이로 셈해야 한다.
//   한 번만 재면 «켠 뒤 평균» 이 나와서 늘 비슷한 값만 보인다.

const os = require('os');

/* 지금까지 쌓인 시간을 한 덩어리로 */
function snapshot() {
  let idle = 0, total = 0;
  os.cpus().forEach((c) => {
    for (const k in c.times) total += c.times[k];
    idle += c.times.idle;
  });
  return { idle, total };
}

let last = snapshot();

/* 지난번 잰 때부터 지금까지의 CPU 사용률(%) */
function cpuPercent() {
  const now = snapshot();
  const dIdle = now.idle - last.idle;
  const dTotal = now.total - last.total;
  last = now;
  if (dTotal <= 0) return null;              // 너무 빨리 두 번 부르면 잴 것이 없다
  const p = 100 * (1 - dIdle / dTotal);
  return Math.max(0, Math.min(100, Math.round(p)));
}

const GB = 1024 * 1024 * 1024;
function gb(n) { return Math.round((n / GB) * 10) / 10; }

/* 화면에 보낼 한 덩어리 */
function read() {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  return {
    cpu: cpuPercent(),
    ram: {
      pct: Math.round((used / total) * 100),
      usedGb: gb(used),
      totalGb: gb(total)
    },
    cores: os.cpus().length
  };
}

module.exports = { read };
