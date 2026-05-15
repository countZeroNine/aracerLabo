import { COLORS } from '../constants/colors.js';
import { Stat } from './Panel.jsx';

export const StatsPanel = ({ stats, rpmBins, tpsBins, rpmRange, tpsRange }) => {
  const coverage = stats.total > 0 ? (stats.withData / stats.total * 100) : 0;
  const inTargetPct = stats.withData > 0 ? (stats.inTarget / stats.withData * 100) : 0;
  return (
    <div className="p-3 grid grid-cols-2 gap-x-4 gap-y-3">
      <Stat label="Cells covered" value={`${stats.withData}/${stats.total}`} unit={`(${coverage.toFixed(0)}%)`} />
      <Stat label="In target" value={`${stats.inTarget}/${stats.withData}`} unit={`(${inTargetPct.toFixed(0)}%)`} color={COLORS.target} />
      <Stat label="Too rich" value={stats.tooRich} color={COLORS.cool} />
      <Stat label="Too lean" value={stats.tooLean} color={COLORS.danger} />
      {stats.busyCell && (
        <div className="col-span-2 mt-1 pt-2" style={{ borderTop: `1px dashed ${COLORS.border}` }}>
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] mb-0.5" style={{ color: COLORS.textMuted }}>Busiest cell</div>
          <div className="font-mono text-xs tnum">
            {(rpmRange[0] + stats.busyCell.ri * (rpmRange[1] - rpmRange[0]) / rpmBins).toFixed(0)} RPM ·{" "}
            {(tpsRange[0] + stats.busyCell.ti * (tpsRange[1] - tpsRange[0]) / tpsBins).toFixed(0)}%{" "}
            <span style={{ color: COLORS.textMuted }}>·</span>{" "}
            <span style={{ color: COLORS.accent }}>AFR {stats.busyCell.afr.toFixed(2)}</span>{" "}
            <span style={{ color: COLORS.textMuted }}>(n={stats.busyCell.count})</span>
          </div>
        </div>
      )}
    </div>
  );
};
