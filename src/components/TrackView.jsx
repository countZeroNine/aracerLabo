import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { COLORS } from '../constants/colors.js';
import { LEAN_SPOT_THRESHOLDS, LEAN_SPOT_MAX_MARKERS } from '../constants/leanSpots.js';
import { afrColor, devColor } from '../lib/colors.js';
import { samplesInCell } from '../lib/fuelMap.js';

export const TrackView = ({
  samples, circuitDetection, hoveredCell,
  rpmRange, tpsRange, rpmBins, tpsBins,
  onSelectFromMap, colorMode = "afr",
  leanSpots = null, showLeanSpots = false,
}) => {
  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const layersRef = useRef({ track: null, highlight: null, finishLine: null, leanSpots: null });
  const [initError, setInitError] = useState(null);
  const [renderStats, setRenderStats] = useState({ valid: 0, segments: 0, afrColored: 0, gray: 0, rendered: false });

  // 地図初期化（マウント時一回のみ）
  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return;
    try {
      const map = L.map(mapDivRef.current, {
        zoomControl: true,
        attributionControl: true,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap',
      }).addTo(map);
      mapRef.current = map;
      setTimeout(() => { try { map.invalidateSize(); } catch(e){} }, 100);
    } catch (e) {
      console.error("[aRacer Lab] Leaflet init failed:", e);
      setInitError(e.message || String(e));
    }
    return () => {
      try { mapRef.current?.remove(); } catch(e) {}
      mapRef.current = null;
    };
  }, []);

  // GPS ライン描画（AFR / 偏差 色塗り）
  useEffect(() => {
    const map = mapRef.current;
    if (!map || samples.length === 0) return;
    try {
      if (Array.isArray(layersRef.current.track)) {
        layersRef.current.track.forEach(l => { try { map.removeLayer(l); } catch(e){} });
        layersRef.current.track = null;
      }
      if (layersRef.current.finishLine) {
        try { map.removeLayer(layersRef.current.finishLine); } catch(e){}
        layersRef.current.finishLine = null;
      }

      const validSamples = samples.filter(s => Number.isFinite(s.Lat) && Number.isFinite(s.Lon));
      console.log("[aRacer Lab] GPS samples valid/total:", validSamples.length, "/", samples.length);
      if (validSamples.length < 2) {
        setRenderStats({ valid: validSamples.length, segments: 0, afrColored: 0, gray: 0, rendered: false });
        return;
      }

      const TARGET_SEGMENTS = 1500;
      const stride = Math.max(1, Math.floor(validSamples.length / TARGET_SEGMENTS));
      const allLayers = [];

      // ベースライン（視認保険 + bounds 計算用）
      const baseCoords = [];
      for (let i = 0; i < validSamples.length; i += stride) {
        baseCoords.push([validSamples[i].Lat, validSamples[i].Lon]);
      }
      let baseLine = null;
      if (baseCoords.length >= 2) {
        baseLine = L.polyline(baseCoords, { color: "#fb923c", weight: 6, opacity: 0.55, lineCap: "round", lineJoin: "round" });
        baseLine.addTo(map);
        allLayers.push(baseLine);
      }

      // AFR / 偏差 色塗りセグメント
      let afrColored = 0, gray = 0;
      for (let i = stride; i < validSamples.length; i += stride) {
        const a = validSamples[i - stride];
        const b = validSamples[i];
        let color, isAfr = false;
        if (colorMode === "dev") {
          const aDev = (a.AfrTarget && a.AfrTarget > 5 && a.AfrTarget < 25 && a.Afr > 5 && a.Afr < 25)
                       ? a.Afr - a.AfrTarget : null;
          const bDev = (b.AfrTarget && b.AfrTarget > 5 && b.AfrTarget < 25 && b.Afr > 5 && b.Afr < 25)
                       ? b.Afr - b.AfrTarget : null;
          if (aDev !== null && bDev !== null) {
            const devCol = devColor((aDev + bDev) / 2);
            if (devCol) { color = devCol; isAfr = true; } else color = "#666";
          } else {
            color = "#666";
          }
        } else {
          const avgAfr = (a.Afr + b.Afr) / 2;
          if (avgAfr > 5 && avgAfr < 25) {
            const afrCol = afrColor(avgAfr);
            if (afrCol) { color = afrCol; isAfr = true; } else color = "#666";
          } else {
            color = "#666";
          }
        }
        const seg = L.polyline([[a.Lat, a.Lon], [b.Lat, b.Lon]], { color, weight: 4, opacity: 1, lineCap: "round" });
        seg.addTo(map);
        allLayers.push(seg);
        if (isAfr) afrColored++; else gray++;
      }

      layersRef.current.track = allLayers;
      console.log("[aRacer Lab] segments rendered: AFR=" + afrColored + " gray=" + gray);

      // フィニッシュライン
      if (circuitDetection?.circuit) {
        const fl = circuitDetection.circuit.finishLine;
        const finishLine = L.polyline([[fl[0].lat, fl[0].lon], [fl[1].lat, fl[1].lon]], {
          color: "#facc15", weight: 6, opacity: 1, dashArray: "8,5",
        }).bindTooltip("FINISH LINE", { permanent: false, direction: "top" });
        finishLine.addTo(map);
        layersRef.current.finishLine = finishLine;
      }

      // ビューを走行軌跡にフィット
      try {
        if (baseLine) {
          map.invalidateSize();
          const bounds = baseLine.getBounds();
          if (bounds.isValid()) map.fitBounds(bounds, { padding: [30, 30] });
        }
      } catch(e) { console.warn("fitBounds failed:", e); }

      setRenderStats({ valid: validSamples.length, segments: afrColored + gray, afrColored, gray, rendered: true });

      // 地図クリックでセル選択
      const clickHandler = (e) => {
        const click = e.latlng;
        let best = null, bestD = Infinity;
        for (const s of validSamples) {
          const d = (s.Lat - click.lat) ** 2 + (s.Lon - click.lng) ** 2;
          if (d < bestD) { bestD = d; best = s; }
        }
        if (best && onSelectFromMap) onSelectFromMap(best);
      };
      map.on("click", clickHandler);
      return () => { try { map.off("click", clickHandler); } catch(e){} };
    } catch (e) {
      console.error("[aRacer Lab] Track render failed:", e);
      setRenderStats({ valid: 0, segments: 0, afrColored: 0, gray: 0, rendered: false });
    }
  }, [samples, circuitDetection, onSelectFromMap, colorMode]);

  // リーンスポット描画
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    try {
      if (layersRef.current.leanSpots) {
        for (const m of layersRef.current.leanSpots) { try { map.removeLayer(m); } catch(e){} }
        layersRef.current.leanSpots = null;
      }
      if (!showLeanSpots || !leanSpots || leanSpots.total === 0) return;

      const ordered = [
        ...leanSpots.danger.map(s => ({...s, level: "danger"})),
        ...leanSpots.warning.map(s => ({...s, level: "warning"})),
        ...leanSpots.caution.map(s => ({...s, level: "caution"})),
      ];
      const capped = ordered.slice(0, LEAN_SPOT_MAX_MARKERS);
      const markers = [];
      for (const s of capped) {
        const cfg = LEAN_SPOT_THRESHOLDS[s.level];
        const fc = !!s.fuelCut;
        const m = L.circleMarker([s.lat, s.lon], {
          radius:      fc ? Math.max(2, cfg.radius - 2) : cfg.radius,
          color:       fc ? cfg.color : "#000",
          weight:      1,
          opacity:     fc ? 0.55 : 0.85,
          fillColor:   cfg.color,
          fillOpacity: fc ? 0.18 : 0.92,
        }).bindTooltip(
          `${cfg.label}${fc ? " (FC中・燃焼なし)" : ""} · AFR ${s.afr.toFixed(1)} · RPM ${Math.round(s.rpm)} · TPS ${Math.round(s.tps)}%`,
          { direction: "top", offset: [0, -2] }
        );
        m.addTo(map);
        markers.push(m);
      }
      layersRef.current.leanSpots = markers;
    } catch (e) {
      console.error("[aRacer Lab] Lean spot render failed:", e);
    }
  }, [showLeanSpots, leanSpots]);

  // セル選択ハイライト
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    try {
      if (layersRef.current.highlight) {
        map.removeLayer(layersRef.current.highlight);
        layersRef.current.highlight = null;
      }
      if (!hoveredCell) return;
      const matched = samplesInCell(samples, rpmRange, tpsRange, rpmBins, tpsBins, hoveredCell.ri, hoveredCell.ti);
      if (matched.length === 0) return;
      const highlight = L.featureGroup();
      for (const s of matched) {
        L.circleMarker([s.Lat, s.Lon], {
          radius: 6, color: "#fff", weight: 2, opacity: 1,
          fillColor: "#fb923c", fillOpacity: 0.95,
        }).addTo(highlight);
      }
      highlight.addTo(map);
      layersRef.current.highlight = highlight;
    } catch (e) {
      console.error("[aRacer Lab] Highlight render failed:", e);
    }
  }, [hoveredCell, samples, rpmRange, tpsRange, rpmBins, tpsBins]);

  return (
    <div className="relative">
      <div ref={mapDivRef} style={{ height: 520, background: "#0a0c10" }} />
      {initError && (
        <div className="absolute inset-0 flex items-center justify-center font-mono text-xs px-4 text-center"
             style={{ color: COLORS.danger, background: "rgba(10,12,16,0.85)" }}>
          地図初期化エラー: {initError}
        </div>
      )}
      {circuitDetection?.circuit && (
        <div className="absolute top-2 right-2 px-2 py-1 z-[400] font-mono text-[10px] uppercase tracking-wider"
             style={{ background: "rgba(15,17,21,0.92)", color: COLORS.accent, border: `1px solid ${COLORS.borderBright}` }}>
          {circuitDetection.circuit.name}
        </div>
      )}
      {!circuitDetection && samples.length > 0 && (
        <div className="absolute top-2 right-2 px-2 py-1 z-[400] font-mono text-[10px] uppercase tracking-wider"
             style={{ background: "rgba(15,17,21,0.92)", color: COLORS.textMuted, border: `1px solid ${COLORS.border}` }}>
          サーキット未登録 / GPS 範囲外
        </div>
      )}
      {samples.length > 0 && (
        <div className="absolute top-2 left-2 px-2 py-1 z-[400] font-mono text-[10px]"
             style={{ background: "rgba(15,17,21,0.92)",
                      color: renderStats.rendered ? COLORS.target : COLORS.danger,
                      border: `1px solid ${renderStats.rendered ? COLORS.target : COLORS.danger}` }}>
          {renderStats.rendered
            ? `✓ AFR色 ${renderStats.afrColored} / 灰 ${renderStats.gray} + base 1 · GPS ${renderStats.valid} pts`
            : `⚠ 描画失敗: GPS ${renderStats.valid} pts`}
        </div>
      )}
      {samples.length > 0 && (
        <div className="absolute bottom-2 left-2 px-2 py-1.5 z-[400] font-mono text-[10px] leading-tight"
             style={{ background: "rgba(15,17,21,0.92)", color: COLORS.textDim, border: `1px solid ${COLORS.border}`, maxWidth: 280 }}>
          <div style={{ color: COLORS.accent, marginBottom: 2 }}>▸ AFR連携</div>
          ベース線=オレンジ、AFR色塗り=<span style={{ color: COLORS.cool }}>青(濃)</span>/<span style={{ color: COLORS.target }}>緑(目標)</span>/<span style={{ color: COLORS.danger }}>赤(薄)</span><br/>
          ヒートマップでセル選択→該当区間がオレンジ円で強調<br/>
          地図クリック→最寄り点をヒートマップでハイライト
        </div>
      )}
    </div>
  );
};
