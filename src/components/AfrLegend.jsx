import { AFR_TARGET, AFR_DISPLAY_MIN, AFR_DISPLAY_MAX, DEV_DISPLAY_MIN, DEV_DISPLAY_MAX } from '../constants/afr.js';
import { COLORS } from '../constants/colors.js';
import { afrColor, devColor } from '../lib/colors.js';

export const AfrLegend = ({ colorMode = "afr" }) => {
  const w = 320, h = 50;
  const stops = 60;

  if (colorMode === "dev") {
    const devMin = DEV_DISPLAY_MIN, devMax = DEV_DISPLAY_MAX;
    const steps = [];
    for (let i = 0; i < stops; i++) {
      const t = i / (stops - 1);
      const dev = devMin + t * (devMax - devMin);
      steps.push({ x: (i * w) / stops, color: devColor(dev) });
    }
    const devX = (d) => ((d - devMin) / (devMax - devMin)) * w;
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxWidth: 360 }}>
        {steps.map((s, i) => (
          <rect key={i} x={s.x} y={6} width={w / stops + 0.5} height={14} fill={s.color} />
        ))}
        <line x1={devX(0)} y1={3} x2={devX(0)} y2={23} stroke={COLORS.accentBright} strokeWidth={1.5} />
        {[-3, -2, -1, 0, 1, 2, 3].map((dev) => (
          <g key={dev}>
            <line x1={devX(dev)} y1={20} x2={devX(dev)} y2={26} stroke={COLORS.textMuted} strokeWidth={0.5} />
            <text x={devX(dev)} y={36} textAnchor="middle" fontSize={9} fontFamily="JetBrains Mono" fill={COLORS.textDim}>
              {dev > 0 ? `+${dev}` : `${dev}`}
            </text>
          </g>
        ))}
        <text x={devX(-2)} y={48} textAnchor="middle" fontSize={8} fontFamily="JetBrains Mono" fill={COLORS.cool} letterSpacing="0.1em">← RICH (safe)</text>
        <text x={devX(0)} y={48} textAnchor="middle" fontSize={8} fontFamily="JetBrains Mono" fill={COLORS.accent} letterSpacing="0.15em">TARGET</text>
        <text x={devX(2)} y={48} textAnchor="middle" fontSize={8} fontFamily="JetBrains Mono" fill={COLORS.danger} letterSpacing="0.1em">LEAN (danger) →</text>
      </svg>
    );
  }

  const target = AFR_TARGET;
  const steps = [];
  for (let i = 0; i < stops; i++) {
    const t = i / (stops - 1);
    const afr = AFR_DISPLAY_MIN + t * (AFR_DISPLAY_MAX - AFR_DISPLAY_MIN);
    steps.push({ x: (i * w) / stops, color: afrColor(afr) });
  }
  const targetX = (afr) => ((afr - AFR_DISPLAY_MIN) / (AFR_DISPLAY_MAX - AFR_DISPLAY_MIN)) * w;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxWidth: 360 }}>
      {steps.map((s, i) => (
        <rect key={i} x={s.x} y={6} width={w / stops + 0.5} height={14} fill={s.color} />
      ))}
      <rect x={targetX(target.low)} y={3} width={targetX(target.high) - targetX(target.low)} height={20}
            fill="none" stroke={COLORS.accentBright} strokeWidth={1.2} />
      <line x1={targetX(target.mid)} y1={3} x2={targetX(target.mid)} y2={23} stroke={COLORS.accentBright} strokeWidth={1} />
      {[8, 10, 12, 13, 14.7, 17, 18].map((afr) => (
        <g key={afr}>
          <line x1={targetX(afr)} y1={20} x2={targetX(afr)} y2={26} stroke={COLORS.textMuted} strokeWidth={0.5} />
          <text x={targetX(afr)} y={36} textAnchor="middle" fontSize={9} fontFamily="JetBrains Mono" fill={COLORS.textDim}>{afr}</text>
        </g>
      ))}
      <text x={targetX(9)} y={48} textAnchor="middle" fontSize={8} fontFamily="JetBrains Mono" fill={COLORS.cool} letterSpacing="0.1em">← RICH (safe)</text>
      <text x={targetX(target.mid)} y={48} textAnchor="middle" fontSize={8} fontFamily="JetBrains Mono" fill={COLORS.accent} letterSpacing="0.15em">TARGET</text>
      <text x={targetX(17)} y={48} textAnchor="middle" fontSize={8} fontFamily="JetBrains Mono" fill={COLORS.danger} letterSpacing="0.1em">LEAN (danger) →</text>
    </svg>
  );
};
