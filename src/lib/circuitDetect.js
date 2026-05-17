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
// 生の度数系では分母が〜1e-7 となり浮動小数点誤差が大きく端点付近で t が 1.0001 に
// なる。メートル系なら分母〜1e4 で精度が高く、ε で残る誤差も吸収できる。
const segmentsIntersect = (ax, ay, bx, by, cx, cy, dx, dy) => {
  const denom = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx);
  if (Math.abs(denom) < 1e-9) return false;
  const t = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / denom;
  const u = ((cx - ax) * (by - ay) - (cy - ay) * (bx - ax)) / denom;
  const ε = 0.001;
  return t >= -ε && t <= 1 + ε && u >= -ε && u <= 1 + ε;
};

export const detectLapsByFinishLine = (samples, finishLine) => {
  if (!finishLine || samples.length < 2) return [];

  // ローカル XY メートル系の原点（最初の有効 GPS 点）
  const validFirst = samples.find(s => !isNaN(s.Lat) && !isNaN(s.Lon));
  if (!validFirst) return [];
  const lat0 = validFirst.Lat, lon0 = validFirst.Lon;
  const cosLat = Math.cos(lat0 * Math.PI / 180);
  const toXY = (lat, lon) => [
    (lon - lon0) * 111320 * cosLat,
    (lat - lat0) * 111320,
  ];

  // ゲート生成：FL 線分をメートル系で 20m ずつ延長（drogger 準拠）
  const [fx1, fy1] = toXY(finishLine[0].lat, finishLine[0].lon);
  const [fx2, fy2] = toXY(finishLine[1].lat, finishLine[1].lon);
  const GATE_EXTEND_M = 20;
  const fLen = Math.hypot(fx2 - fx1, fy2 - fy1);
  const [fux, fuy] = fLen > 0 ? [(fx2 - fx1) / fLen, (fy2 - fy1) / fLen] : [1, 0];
  const gx1 = fx1 - fux * GATE_EXTEND_M, gy1 = fy1 - fuy * GATE_EXTEND_M;
  const gx2 = fx2 + fux * GATE_EXTEND_M, gy2 = fy2 + fuy * GATE_EXTEND_M;

  const COOLDOWN_S = 20; // drogger に合わせて 30→20 秒
  const laps = [];
  let lapStart = 0;
  let lastCrossTime = -1e9;

  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1], b = samples[i];
    if (isNaN(a.Lat) || isNaN(b.Lat)) continue;
    if (b.RunTime - lastCrossTime <= COOLDOWN_S) continue;
    const [ax, ay] = toXY(a.Lat, a.Lon);
    const [bx, by] = toXY(b.Lat, b.Lon);
    if (segmentsIntersect(ax, ay, bx, by, gx1, gy1, gx2, gy2)) {
      laps.push({ start: lapStart, end: i, t0: samples[lapStart].RunTime, t1: b.RunTime, durationSec: b.RunTime - samples[lapStart].RunTime });
      lapStart = i;
      lastCrossTime = b.RunTime;
    }
  }
  return laps;
};
