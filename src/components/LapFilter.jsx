import { useMemo } from 'react';
import { COLORS } from '../constants/colors.js';
import { fmtTime } from '../lib/format.js';

export const LapFilter = ({ samples, lapFilter, setLapFilter }) => {
  const laps = useMemo(() => {
    const m = new Map();
    for (const s of samples) {
      if (!m.has(s.Lap)) m.set(s.Lap, { lap: s.Lap, n: 0, t0: s.RunTime, t1: s.RunTime });
      const e = m.get(s.Lap);
      e.n++;
      e.t1 = s.RunTime;
    }
    return [...m.values()].sort((a, b) => a.lap - b.lap);
  }, [samples]);

  if (laps.length <= 1) return null;

  return (
    <div className="p-3">
      <div className="flex flex-wrap gap-1.5">
        <button onClick={() => setLapFilter(new Set())}
                className="font-mono text-[10px] uppercase tracking-wider px-2 py-1 transition"
                style={{
                  background: lapFilter.size === 0 ? COLORS.accent : "transparent",
                  color: lapFilter.size === 0 ? "#000" : COLORS.textDim,
                  border: `1px solid ${lapFilter.size === 0 ? COLORS.accent : COLORS.border}`,
                }}>
          ALL
        </button>
        {laps.map((l) => {
          const dur = l.t1 - l.t0;
          const active = lapFilter.has(l.lap);
          return (
            <button key={l.lap}
                    onClick={() => {
                      const next = new Set(lapFilter);
                      if (next.has(l.lap)) next.delete(l.lap); else next.add(l.lap);
                      setLapFilter(next);
                    }}
                    className="font-mono text-[10px] uppercase tracking-wider px-2 py-1 transition"
                    style={{
                      background: active ? COLORS.accent : "transparent",
                      color: active ? "#000" : COLORS.textDim,
                      border: `1px solid ${active ? COLORS.accent : COLORS.border}`,
                    }}>
              L{l.lap} · {fmtTime(dur)}
            </button>
          );
        })}
      </div>
    </div>
  );
};
