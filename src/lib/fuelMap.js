import { AFR_TARGET } from '../constants/afr.js';

export const computeFuelMapCells = (samples, rpmBins, tpsBins, rpmRange, tpsRange) => {
  const cells = [];
  for (let t = 0; t < tpsBins; t++) {
    const row = [];
    for (let r = 0; r < rpmBins; r++) row.push({ afrs: [], devs: [], count: 0 });
    cells.push(row);
  }
  const rpmStep = (rpmRange[1] - rpmRange[0]) / rpmBins;
  const tpsStep = (tpsRange[1] - tpsRange[0]) / tpsBins;

  for (const s of samples) {
    if (!s.Afr || s.Afr <= 5 || s.Afr > 25) continue;
    if (!s.Rpm || s.Rpm < rpmRange[0] || s.Rpm > rpmRange[1]) continue;
    if (s.Tps < tpsRange[0] || s.Tps > tpsRange[1]) continue;
    const ri = Math.min(rpmBins - 1, Math.floor((s.Rpm - rpmRange[0]) / rpmStep));
    const ti = Math.min(tpsBins - 1, Math.floor((s.Tps - tpsRange[0]) / tpsStep));
    cells[ti][ri].afrs.push(s.Afr);
    cells[ti][ri].count++;
    if (s.AfrTarget && s.AfrTarget > 5 && s.AfrTarget < 25) {
      cells[ti][ri].devs.push(s.Afr - s.AfrTarget);
    }
  }

  for (const row of cells) {
    for (const cell of row) {
      if (cell.count === 0) continue;
      cell.afrs.sort((a, b) => a - b);
      cell.medianAfr = cell.afrs[Math.floor(cell.afrs.length / 2)];
      cell.minAfr = cell.afrs[0];
      cell.maxAfr = cell.afrs[cell.afrs.length - 1];
      cell.meanAfr = cell.afrs.reduce((a, b) => a + b, 0) / cell.afrs.length;
      if (cell.devs.length > 0) {
        const devsSorted = [...cell.devs].sort((a, b) => a - b);
        cell.medianDev = devsSorted[Math.floor(devsSorted.length / 2)];
        cell.meanDev = cell.devs.reduce((a, b) => a + b, 0) / cell.devs.length;
        cell.devCount = cell.devs.length;
      } else {
        cell.medianDev = null;
        cell.meanDev = null;
        cell.devCount = 0;
      }
    }
  }
  return cells;
};

export const computeMapStats = (cells) => {
  const target = AFR_TARGET;
  let total = 0, withData = 0, inTarget = 0, tooRich = 0, tooLean = 0;
  let maxCount = 0, busyCell = null;
  for (let ti = 0; ti < cells.length; ti++) {
    for (let ri = 0; ri < cells[ti].length; ri++) {
      const cell = cells[ti][ri];
      total++;
      if (cell.count === 0) continue;
      withData++;
      if (cell.medianAfr >= target.low && cell.medianAfr <= target.high) inTarget++;
      else if (cell.medianAfr < target.low) tooRich++;
      else if (cell.medianAfr > target.high) tooLean++;
      if (cell.count > maxCount) {
        maxCount = cell.count;
        busyCell = { ri, ti, count: cell.count, afr: cell.medianAfr };
      }
    }
  }
  return { total, withData, inTarget, tooRich, tooLean, maxCount, busyCell };
};

// セルに該当するサンプルを抽出（地図ハイライト用）
export const samplesInCell = (samples, rpmRange, tpsRange, rpmBins, tpsBins, ri, ti) => {
  const rpmStep = (rpmRange[1] - rpmRange[0]) / rpmBins;
  const tpsStep = (tpsRange[1] - tpsRange[0]) / tpsBins;
  const rpmLo = rpmRange[0] + ri * rpmStep, rpmHi = rpmLo + rpmStep;
  const tpsLo = tpsRange[0] + ti * tpsStep, tpsHi = tpsLo + tpsStep;
  return samples.filter(s =>
    s.Rpm >= rpmLo && s.Rpm < rpmHi &&
    s.Tps >= tpsLo && s.Tps < tpsHi &&
    !isNaN(s.Lat) && !isNaN(s.Lon)
  );
};
