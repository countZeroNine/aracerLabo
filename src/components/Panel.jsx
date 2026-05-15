import { COLORS } from '../constants/colors.js';

export const Panel = ({ title, accent, children, className = "", actions = null }) => (
  <div className={`relative ${className}`} style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
    {title && (
      <div className="px-3 py-2 flex items-center justify-between" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
        <div className="flex items-center gap-2">
          {accent && <div style={{ width: 3, height: 14, background: COLORS.accent }} />}
          <div className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: COLORS.textDim }}>{title}</div>
        </div>
        {actions}
      </div>
    )}
    {children}
  </div>
);

export const Stat = ({ label, value, unit, color }) => (
  <div className="flex flex-col gap-0.5">
    <div className="font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color: COLORS.textMuted }}>{label}</div>
    <div className="flex items-baseline gap-1">
      <div className="font-mono text-xl tnum" style={{ color: color || COLORS.text }}>{value}</div>
      {unit && <div className="font-mono text-[10px]" style={{ color: COLORS.textMuted }}>{unit}</div>}
    </div>
  </div>
);
