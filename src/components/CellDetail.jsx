import { AFR_TARGET } from '../constants/afr.js';
import { COLORS } from '../constants/colors.js';

export const CellDetail = ({ hovered, rpmRange, tpsRange, rpmBins, tpsBins }) => {
  if (!hovered) {
    return (
      <div className="p-3 font-mono text-[10px]" style={{ color: COLORS.textMuted }}>
        セルをタップ／ホバーすると詳細が表示されます
      </div>
    );
  }
  const { cell, ri, ti } = hovered;
  const rpmLo = rpmRange[0] + ri * (rpmRange[1] - rpmRange[0]) / rpmBins;
  const rpmHi = rpmRange[0] + (ri + 1) * (rpmRange[1] - rpmRange[0]) / rpmBins;
  const tpsLo = tpsRange[0] + ti * (tpsRange[1] - tpsRange[0]) / tpsBins;
  const tpsHi = tpsRange[0] + (ti + 1) * (tpsRange[1] - tpsRange[0]) / tpsBins;
  const target = AFR_TARGET;

  let band = "—", bandColor = COLORS.textMuted;
  if (cell.count > 0) {
    if (cell.medianAfr < target.low) { band = "RICH"; bandColor = COLORS.cool; }
    else if (cell.medianAfr > target.high) { band = "LEAN"; bandColor = COLORS.danger; }
    else { band = "TARGET"; bandColor = COLORS.target; }
  }

  return (
    <div className="p-3 grid grid-cols-2 gap-x-4 gap-y-2">
      <div>
        <div className="font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color: COLORS.textMuted }}>RPM Cell</div>
        <div className="font-mono text-sm tnum">{rpmLo.toFixed(0)} - {rpmHi.toFixed(0)}</div>
      </div>
      <div>
        <div className="font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color: COLORS.textMuted }}>TPS Cell</div>
        <div className="font-mono text-sm tnum">{tpsLo.toFixed(0)} - {tpsHi.toFixed(0)} %</div>
      </div>
      {cell.count > 0 ? (
        <>
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color: COLORS.textMuted }}>AFR median</div>
            <div className="font-mono text-2xl tnum" style={{ color: bandColor }}>{cell.medianAfr.toFixed(2)}</div>
          </div>
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color: COLORS.textMuted }}>Status</div>
            <div className="font-mono text-sm" style={{ color: bandColor }}>{band}</div>
          </div>
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color: COLORS.textMuted }}>Range</div>
            <div className="font-mono text-xs tnum">{cell.minAfr.toFixed(2)} ~ {cell.maxAfr.toFixed(2)}</div>
          </div>
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color: COLORS.textMuted }}>Samples</div>
            <div className="font-mono text-sm tnum">{cell.count}</div>
          </div>
        </>
      ) : (
        <div className="col-span-2">
          <div className="font-mono text-[10px]" style={{ color: COLORS.textMuted }}>このセルにはデータが乗っていません（実走で通っていない RPM × TPS の組み合わせ）</div>
        </div>
      )}
    </div>
  );
};
