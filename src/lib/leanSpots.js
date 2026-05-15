import { LEAN_SPOT_THRESHOLDS } from '../constants/leanSpots.js';

export const computeLeanSpots = (samples) => {
  if (!samples?.length) return { caution: [], warning: [], danger: [], total: 0, fcTotal: 0 };
  const out = { caution: [], warning: [], danger: [], total: 0, fcTotal: 0 };
  for (const s of samples) {
    if (!Number.isFinite(s.Lat) || !Number.isFinite(s.Lon)) continue;
    if (!s.Afr || s.Afr < 14.7) continue;
    if (!s.Rpm || s.Rpm < 4000) continue;
    const fuelCut = !!s.FuelCutDec;
    const spot = { lat: s.Lat, lon: s.Lon, afr: s.Afr, rpm: s.Rpm, tps: s.Tps, time: s.RunTime, fuelCut };
    if (s.Afr >= LEAN_SPOT_THRESHOLDS.danger.afrMin) {
      out.danger.push(spot);
    } else if (s.Afr >= LEAN_SPOT_THRESHOLDS.warning.afrMin && s.Tps >= LEAN_SPOT_THRESHOLDS.warning.tpsMin) {
      out.warning.push(spot);
    } else if (s.Afr >= LEAN_SPOT_THRESHOLDS.caution.afrMin && s.Tps >= LEAN_SPOT_THRESHOLDS.caution.tpsMin) {
      out.caution.push(spot);
    } else {
      continue;
    }
    if (fuelCut) out.fcTotal++;
  }
  out.total = out.caution.length + out.warning.length + out.danger.length;
  out.dangerReal  = out.danger.filter(s => !s.fuelCut).length;
  out.warningReal = out.warning.filter(s => !s.fuelCut).length;
  out.cautionReal = out.caution.filter(s => !s.fuelCut).length;
  out.dangerFC    = out.danger.length - out.dangerReal;
  out.warningFC   = out.warning.length - out.warningReal;
  out.cautionFC   = out.caution.length - out.cautionReal;
  return out;
};
