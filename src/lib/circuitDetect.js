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

const segmentsIntersect = (p1, p2, p3, p4) => {
  const cross = (a, b) => a.x * b.y - a.y * b.x;
  const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
  const r = sub(p2, p1), s = sub(p4, p3);
  const rxs = cross(r, s);
  if (Math.abs(rxs) < 1e-12) return false;
  const t = cross(sub(p3, p1), s) / rxs;
  const u = cross(sub(p3, p1), r) / rxs;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
};

export const detectLapsByFinishLine = (samples, finishLine) => {
  if (!finishLine || samples.length < 2) return [];
  const fA = { x: finishLine[0].lon, y: finishLine[0].lat };
  const fB = { x: finishLine[1].lon, y: finishLine[1].lat };
  const laps = [];
  let lapStart = 0;
  const MIN_LAP_SEC = 30;
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i-1], b = samples[i];
    if (isNaN(a.Lat) || isNaN(b.Lat)) continue;
    const p1 = { x: a.Lon, y: a.Lat };
    const p2 = { x: b.Lon, y: b.Lat };
    if (segmentsIntersect(p1, p2, fA, fB)) {
      const lapDuration = b.RunTime - samples[lapStart].RunTime;
      if (lapDuration >= MIN_LAP_SEC) {
        laps.push({ start: lapStart, end: i, t0: samples[lapStart].RunTime, t1: b.RunTime, durationSec: lapDuration });
        lapStart = i;
      }
    }
  }
  return laps;
};
