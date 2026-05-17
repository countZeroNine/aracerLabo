import { CIRCUITS } from '../constants/circuits.js';

const haversine = (la1, lo1, la2, lo2) => {
  const R = 6371000;
  const r = (x) => x * Math.PI / 180;
  const dLa = r(la2 - la1), dLo = r(lo2 - lo1);
  const a = Math.sin(dLa/2)**2 + Math.cos(r(la1))*Math.cos(r(la2))*Math.sin(dLo/2)**2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

export const detectCircuit = (samples) => {
  const valid = samples.filter(s => !isNaN(s.Lat) && !isNaN(s.Lon));
  if (valid.length === 0) return null;
  const cLat = valid.reduce((a, s) => a + s.Lat, 0) / valid.length;
  const cLon = valid.reduce((a, s) => a + s.Lon, 0) / valid.length;
  let best = null, bestDist = Infinity;
  for (const c of CIRCUITS) {
    const fLat = (c.finishLine[0].lat + c.finishLine[1].lat) / 2;
    const fLon = (c.finishLine[0].lon + c.finishLine[1].lon) / 2;
    const d = haversine(cLat, cLon, fLat, fLon);
    if (d < bestDist) { bestDist = d; best = c; }
  }
  return bestDist < 5000 ? { circuit: best, distFromFinishM: bestDist, centroid: { lat: cLat, lon: cLon } } : null;
};

// drogger v1.7.0 準拠：ε 許容付き、XY メートル系で計算
const segmentsIntersect = (ax, ay, bx, by, cx, cy, dx, dy) => {
  const denom = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx);
  if (Math.abs(denom) < 1e-9) return false;
  const t = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / denom;
  const u = ((cx - ax) * (by - ay) - (cy - ay) * (bx - ax)) / denom;
  const ε = 0.001;
  return t >= -ε && t <= 1 + ε && u >= -ε && u <= 1 + ε;
};

// drogger v1.7.0 Pass 1 の完全移植版
// 戻り値: crossTimes（各フィニッシュライン通過の補間時刻の配列）
// App.jsx 側で RunTime 比較により data[].Lap を直接書き換える（drogger 準拠）
export const detectLapsByFinishLine = (samples, finishLine) => {
  if (!finishLine || samples.length < 2) return [];

  const validGps = samples.filter(s => Number.isFinite(s.Lat) && Number.isFinite(s.Lon));
  if (!validGps.length) return [];

  // ローカル XY メートル系（drogger は validGps[0] を原点にする）
  const lat0 = validGps[0].Lat, lon0 = validGps[0].Lon;
  const cosLat = Math.cos(lat0 * Math.PI / 180);
  const toXY = (lat, lon) => [
    (lon - lon0) * 111320 * cosLat,
    (lat - lat0) * 111320,
  ];

  // ゲート生成（FL 線分を 20m ずつ延長）
  const [fx1, fy1] = toXY(finishLine[0].lat, finishLine[0].lon);
  const [fx2, fy2] = toXY(finishLine[1].lat, finishLine[1].lon);
  const GATE_EXTEND_M = 20;
  const fLen = Math.hypot(fx2 - fx1, fy2 - fy1);
  const [fux, fuy] = fLen > 0 ? [(fx2 - fx1) / fLen, (fy2 - fy1) / fLen] : [1, 0];
  const gx1 = fx1 - fux * GATE_EXTEND_M, gy1 = fy1 - fuy * GATE_EXTEND_M;
  const gx2 = fx2 + fux * GATE_EXTEND_M, gy2 = fy2 + fuy * GATE_EXTEND_M;

  // drogger と同じ prevR=null パターン：GPS ギャップ後は前点をリセット
  const COOLDOWN_S = 20;
  const crossTimes = [];
  let prevS = null;
  let lastCrossTime = -1e9;

  for (const s of samples) {
    if (!Number.isFinite(s.Lat) || !Number.isFinite(s.Lon)) { prevS = null; continue; }
    if (prevS && s.RunTime - lastCrossTime > COOLDOWN_S) {
      const [px, py] = toXY(prevS.Lat, prevS.Lon);
      const [cx, cy] = toXY(s.Lat, s.Lon);
      if (segmentsIntersect(px, py, cx, cy, gx1, gy1, gx2, gy2)) {
        crossTimes.push((prevS.RunTime + s.RunTime) / 2); // 補間通過時刻
        lastCrossTime = s.RunTime;
      }
    }
    prevS = s;
  }
  return crossTimes;
};
