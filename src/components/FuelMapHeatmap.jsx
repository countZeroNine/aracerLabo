import { COLORS } from '../constants/colors.js';
import { AFR_TARGET } from '../constants/afr.js';
import { afrColor, devColor } from '../lib/colors.js';

export const FuelMapHeatmap = ({ cells, rpmRange, tpsRange, hoveredCell, setHoveredCell, colorMode = "afr" }) => {
  const tpsBins = cells.length;
  const rpmBins = cells[0]?.length || 0;
  if (!rpmBins) return null;

  const cellW = 50, cellH = 32;
  const padL = 60, padT = 14, padR = 14, padB = 36;
  const w = padL + rpmBins * cellW + padR;
  const h = padT + tpsBins * cellH + padB;

  const cellEl = (cell, ri, ti) => {
    const x = padL + ri * cellW;
    const y = padT + ti * cellH;
    const isHover = hoveredCell && hoveredCell.ri === ri && hoveredCell.ti === ti;

    let fill, displayVal, useLightText, hasData;
    if (colorMode === "dev") {
      hasData = cell.count > 0 && cell.devCount > 0 && cell.medianDev !== null;
      if (hasData) {
        fill = devColor(cell.medianDev);
        useLightText = Math.abs(cell.medianDev) > 1.2;
        displayVal = (cell.medianDev >= 0 ? "+" : "") + cell.medianDev.toFixed(2);
      } else {
        fill = COLORS.cell;
      }
    } else {
      hasData = cell.count > 0;
      if (hasData) {
        fill = afrColor(cell.medianAfr);
        useLightText = cell.medianAfr < 11.5 || cell.medianAfr > 15.5;
        displayVal = cell.medianAfr.toFixed(1);
      } else {
        fill = COLORS.cell;
      }
    }

    return (
      <g key={`${ri}-${ti}`}
         onMouseEnter={() => setHoveredCell({ cell, ri, ti })}
         onClick={() => setHoveredCell({ cell, ri, ti })}
         style={{ cursor: cell.count > 0 ? "pointer" : "default" }}>
        <rect x={x} y={y} width={cellW} height={cellH}
              fill={fill} stroke={isHover ? "var(--accent-bright)" : "#0a0a0d"}
              strokeWidth={isHover ? 2 : 0.5}
              className={isHover ? "cell-hot" : ""} />
        {hasData && (
          <>
            <text x={x + cellW / 2} y={y + cellH / 2 - 1}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize={11} fontFamily="JetBrains Mono" fontWeight={600}
                  fill={useLightText ? "#fff" : "rgba(0,0,0,0.85)"}
                  pointerEvents="none">
              {displayVal}
            </text>
            <text x={x + cellW / 2} y={y + cellH / 2 + 9}
                  textAnchor="middle"
                  fontSize={7} fontFamily="JetBrains Mono"
                  fill={useLightText ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)"}
                  pointerEvents="none">
              n={colorMode === "dev" ? cell.devCount : cell.count}
            </text>
          </>
        )}
      </g>
    );
  };

  const tpsLabels = [];
  for (let i = 0; i <= tpsBins; i++) {
    const tps = tpsRange[0] + i * (tpsRange[1] - tpsRange[0]) / tpsBins;
    tpsLabels.push(
      <text key={`ty${i}`} x={padL - 6} y={padT + i * cellH}
            textAnchor="end" dominantBaseline="middle"
            fontSize={9} fontFamily="JetBrains Mono" fill={COLORS.textDim}>
        {tps.toFixed(0)}%
      </text>
    );
  }
  const rpmLabels = [];
  for (let i = 0; i <= rpmBins; i++) {
    const rpm = rpmRange[0] + i * (rpmRange[1] - rpmRange[0]) / rpmBins;
    rpmLabels.push(
      <text key={`rx${i}`} x={padL + i * cellW} y={padT + tpsBins * cellH + 14}
            textAnchor="middle"
            fontSize={9} fontFamily="JetBrains Mono" fill={COLORS.textDim}>
        {rpm >= 1000 ? (rpm / 1000).toFixed(rpm % 1000 === 0 ? 0 : 1) + "k" : rpm.toFixed(0)}
      </text>
    );
  }

  return (
    <div className="p-3 overflow-x-auto" onMouseLeave={() => setHoveredCell(null)}>
      <svg viewBox={`0 0 ${w} ${h}`}
           preserveAspectRatio="xMinYMin meet"
           className="block"
           style={{ minWidth: w * 0.85, width: "100%", maxHeight: 600 }}>
        <text x={14} y={padT + tpsBins * cellH / 2}
              textAnchor="middle"
              transform={`rotate(-90, 14, ${padT + tpsBins * cellH / 2})`}
              fontSize={10} fontFamily="JetBrains Mono"
              fill={COLORS.textMuted} letterSpacing="0.18em">
          THROTTLE %
        </text>
        <text x={padL + rpmBins * cellW / 2} y={h - 4}
              textAnchor="middle"
              fontSize={10} fontFamily="JetBrains Mono"
              fill={COLORS.textMuted} letterSpacing="0.18em">
          RPM
        </text>
        {tpsLabels}
        {rpmLabels}
        {cells.flatMap((row, ti) => row.map((cell, ri) => cellEl(cell, ri, ti)))}
      </svg>
    </div>
  );
};
