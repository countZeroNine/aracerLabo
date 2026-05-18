import { useMemo } from 'react';
import { COLORS } from '../constants/colors.js';
import { AFR_TARGET } from '../constants/afr.js';
import { LEAN_SPOT_THRESHOLDS } from '../constants/leanSpots.js';
import { fmtTime } from '../lib/format.js';

export const LapKpiTable = ({ samples, lapFilter, setLapFilter }) => {
  const lapKpis = useMemo(() => {
    const m = new Map();
    for (const s of samples) {
      if (!m.has(s.Lap)) m.set(s.Lap, {
        lap: s.Lap, n: 0,
        t0: s.RunTime, t1: s.RunTime,
        afrSum: 0, afrN: 0,
        devSum: 0, devN: 0,
        inTarget: 0,
        dangerReal: 0, dangerFC: 0, warning: 0, caution: 0,
      });
      const e = m.get(s.Lap);
      e.n++;
      e.t1 = s.RunTime;
      if (Number.isFinite(s.Afr) && s.Afr > 5 && s.Afr < 25) {
        e.afrSum += s.Afr;
        e.afrN++;
        if (s.Afr >= AFR_TARGET.low && s.Afr <= AFR_TARGET.high) e.inTarget++;
        if (Number.isFinite(s.AfrTarget) && s.AfrTarget > 5 && s.AfrTarget < 25) {
          e.devSum += (s.Afr - s.AfrTarget);
          e.devN++;
        }
        if (s.Rpm && s.Rpm >= 4000) {
          const fc = !!s.FuelCutDec;
          if (s.Afr >= LEAN_SPOT_THRESHOLDS.danger.afrMin) {
            if (fc) e.dangerFC++; else e.dangerReal++;
          } else if (s.Tps >= LEAN_SPOT_THRESHOLDS.warning.tpsMin) {
            if (s.Afr >= LEAN_SPOT_THRESHOLDS.warning.afrMin) e.warning++;
            else if (s.Afr >= LEAN_SPOT_THRESHOLDS.caution.afrMin) e.caution++;
          }
        }
      }
    }
    const all = [...m.values()].filter(l => l.lap > 0).sort((a, b) => a.lap - b.lap);
    // drogger 準拠: 中央値 × 0.55〜1.7 でレーシングラップのみ表示
    const durs = all.map((l, i) => {
      const next = all[i + 1];
      return next ? next.t0 - l.t0 : l.t1 - l.t0;
    });
    const sorted = [...durs].sort((a, b) => a - b);
    const med = sorted[Math.floor(sorted.length / 2)] || 60;
    return all.filter((_, i) => durs[i] >= med * 0.55 && durs[i] <= med * 1.7);
  }, [samples]);

  if (lapKpis.length <= 1) return null;

  let bestLap = null, bestDur = Infinity;
  for (let i = 0; i < lapKpis.length; i++) {
    const l = lapKpis[i];
    const nextL = lapKpis[i + 1];
    const dur = nextL ? nextL.t0 - l.t0 : l.t1 - l.t0;
    if (dur >= 30 && dur < bestDur) { bestDur = dur; bestLap = l.lap; }
  }

  const devColorOf = (dev) => {
    if (!Number.isFinite(dev)) return COLORS.textDim;
    if (Math.abs(dev) < 0.3) return "#22c55e";
    if (Math.abs(dev) < 0.8) return "#eab308";
    return "#ef4444";
  };
  const realColorOf = (n) => {
    if (n === 0) return COLORS.textDim;
    if (n <= 5)  return "#eab308";
    if (n <= 20) return "#f97316";
    return "#ef4444";
  };

  return (
    <div className="p-2 overflow-auto" style={{ maxHeight: 260 }}>
      <table className="w-full font-mono text-[10px]" style={{ borderCollapse: "collapse" }}>
        <thead style={{ position: "sticky", top: 0, background: COLORS.panel, zIndex: 1 }}>
          <tr style={{ color: COLORS.textMuted }}>
            <th className="px-1.5 py-1 text-left"  style={{ borderBottom: `1px solid ${COLORS.border}` }}>L</th>
            <th className="px-1.5 py-1 text-right" style={{ borderBottom: `1px solid ${COLORS.border}` }}>Time</th>
            <th className="px-1.5 py-1 text-right" style={{ borderBottom: `1px solid ${COLORS.border}`, color: "#ef4444" }}>危</th>
            <th className="px-1 py-1 text-right"   style={{ borderBottom: `1px solid ${COLORS.border}`, color: COLORS.textMuted }}>FC</th>
            <th className="px-1 py-1 text-right"   style={{ borderBottom: `1px solid ${COLORS.border}`, color: "#f97316" }}>警</th>
            <th className="px-1 py-1 text-right"   style={{ borderBottom: `1px solid ${COLORS.border}`, color: "#eab308" }}>注</th>
            <th className="px-1.5 py-1 text-right" style={{ borderBottom: `1px solid ${COLORS.border}` }}>偏差</th>
            <th className="px-1.5 py-1 text-right" style={{ borderBottom: `1px solid ${COLORS.border}` }}>Tgt%</th>
            <th className="px-1.5 py-1 text-right" style={{ borderBottom: `1px solid ${COLORS.border}` }}>n</th>
          </tr>
        </thead>
        <tbody>
          {lapKpis.map((l, idx) => {
            const nextL = lapKpis[idx + 1];
            const dur = nextL ? nextL.t0 - l.t0 : l.t1 - l.t0;
            const meanDev = l.devN > 0 ? l.devSum / l.devN : null;
            const inTargetPct = l.afrN > 0 ? 100 * l.inTarget / l.afrN : 0;
            const active = lapFilter.has(l.lap);
            const isBest = l.lap === bestLap;
            return (
              <tr key={l.lap}
                  onClick={() => {
                    const next = new Set(lapFilter);
                    if (next.has(l.lap)) next.delete(l.lap); else next.add(l.lap);
                    setLapFilter(next);
                  }}
                  style={{ background: active ? COLORS.cell : "transparent", cursor: "pointer", color: active ? COLORS.text : COLORS.textDim }}>
                <td className="px-1.5 py-0.5" style={{ color: active ? COLORS.accent : (isBest ? "#22c55e" : COLORS.textDim) }}>
                  L{l.lap}{isBest && <span style={{ color: "#22c55e" }}>★</span>}
                </td>
                <td className="px-1.5 py-0.5 text-right tnum" style={{ color: isBest ? "#22c55e" : "inherit" }}>{fmtTime(dur)}</td>
                <td className="px-1.5 py-0.5 text-right tnum" style={{ color: realColorOf(l.dangerReal), fontWeight: l.dangerReal > 0 ? 600 : 400 }}>{l.dangerReal}</td>
                <td className="px-1 py-0.5 text-right tnum"   style={{ color: COLORS.textMuted, opacity: 0.6 }}>{l.dangerFC}</td>
                <td className="px-1 py-0.5 text-right tnum"   style={{ color: l.warning > 0 ? "#f97316" : COLORS.textDim }}>{l.warning}</td>
                <td className="px-1 py-0.5 text-right tnum"   style={{ color: l.caution > 0 ? "#eab308" : COLORS.textDim }}>{l.caution}</td>
                <td className="px-1.5 py-0.5 text-right tnum" style={{ color: devColorOf(meanDev) }}>
                  {meanDev !== null ? (meanDev >= 0 ? `+${meanDev.toFixed(2)}` : meanDev.toFixed(2)) : "—"}
                </td>
                <td className="px-1.5 py-0.5 text-right tnum">{inTargetPct.toFixed(0)}%</td>
                <td className="px-1.5 py-0.5 text-right tnum" style={{ color: COLORS.textMuted }}>{l.n}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
