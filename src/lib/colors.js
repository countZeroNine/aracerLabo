import { AFR_TARGET, AFR_DISPLAY_MIN, AFR_DISPLAY_MAX, DEV_DISPLAY_MIN, DEV_DISPLAY_MAX } from '../constants/afr.js';

// 8-stop HSL gradient for AFR colormap, calibrated to engine target band
// 配色慣例：青=濃い（リッチ・安全域）、赤=薄い（リーン・危険域）
// aRacer SpeedTuning / HONDA 燃調ソフトの慣例に準拠
export const afrColor = (afr) => {
  if (afr <= 0 || isNaN(afr)) return null;
  const t = AFR_TARGET;
  const stops = [
    { afr: AFR_DISPLAY_MIN, color: [220, 80, 50] },
    { afr: 11.0,            color: [200, 70, 50] },
    { afr: t.low,           color: [170, 65, 45] },
    { afr: t.mid,           color: [110, 70, 45] },
    { afr: t.high,          color: [80,  70, 50] },
    { afr: 14.7,            color: [50,  85, 55] },
    { afr: 16.5,            color: [25,  85, 55] },
    { afr: AFR_DISPLAY_MAX, color: [0,   80, 50] },
  ];
  for (let i = 1; i < stops.length; i++) {
    if (afr <= stops[i].afr) {
      const a = stops[i-1], b = stops[i];
      const f = (afr - a.afr) / (b.afr - a.afr || 1);
      const h = a.color[0] + (b.color[0] - a.color[0]) * f;
      const s = a.color[1] + (b.color[1] - a.color[1]) * f;
      const l = a.color[2] + (b.color[2] - a.color[2]) * f;
      return `hsl(${h}, ${s}%, ${l}%)`;
    }
  }
  return `hsl(0, 80%, 50%)`;
};

// Deviation color: WBO2 - Target
// 0=green (target合致), +=warm (lean/danger), -=cool (rich/safe)
export const devColor = (dev) => {
  if (!Number.isFinite(dev)) return null;
  const stops = [
    { dev: DEV_DISPLAY_MIN, color: [220, 80, 50] },
    { dev: -2.0,            color: [200, 75, 50] },
    { dev: -1.0,            color: [180, 70, 48] },
    { dev: -0.3,            color: [140, 70, 45] },
    { dev:  0.0,            color: [120, 80, 45] },
    { dev: +0.3,            color: [ 80, 75, 48] },
    { dev: +1.0,            color: [ 50, 85, 52] },
    { dev: +2.0,            color: [ 25, 85, 52] },
    { dev: DEV_DISPLAY_MAX, color: [  0, 80, 48] },
  ];
  if (dev <= stops[0].dev) {
    const c = stops[0].color;
    return `hsl(${c[0]}, ${c[1]}%, ${c[2]}%)`;
  }
  for (let i = 1; i < stops.length; i++) {
    if (dev <= stops[i].dev) {
      const a = stops[i-1], b = stops[i];
      const f = (dev - a.dev) / (b.dev - a.dev || 1);
      const h = a.color[0] + (b.color[0] - a.color[0]) * f;
      const s = a.color[1] + (b.color[1] - a.color[1]) * f;
      const l = a.color[2] + (b.color[2] - a.color[2]) * f;
      return `hsl(${h}, ${s}%, ${l}%)`;
    }
  }
  const c = stops[stops.length-1].color;
  return `hsl(${c[0]}, ${c[1]}%, ${c[2]}%)`;
};
