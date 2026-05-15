import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { APP_VERSION } from './version/version.js';
import { COLORS } from './constants/colors.js';
import { readFileAsText, fmtTime } from './lib/format.js';
import { detectLogFormat, parseAracerLog } from './lib/parser.js';
import { computeFuelMapCells, computeMapStats } from './lib/fuelMap.js';
import { computeLeanSpots } from './lib/leanSpots.js';
import { detectCircuit, detectLapsByFinishLine } from './lib/circuitDetect.js';
import { Panel } from './components/Panel.jsx';
import { LapFilter } from './components/LapFilter.jsx';
import { LapKpiTable } from './components/LapKpiTable.jsx';
import { FuelMapHeatmap } from './components/FuelMapHeatmap.jsx';
import { TrackView } from './components/TrackView.jsx';
import { AfrLegend } from './components/AfrLegend.jsx';
import { CellDetail } from './components/CellDetail.jsx';
import { StatsPanel } from './components/StatsPanel.jsx';
import { SettingsPanel } from './components/SettingsPanel.jsx';
import { AboutModal } from './components/AboutModal.jsx';

export default function App() {
  const [session, setSession] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [rpmBins, setRpmBins] = useState(16);
  const [tpsBins, setTpsBins] = useState(16);
  const [rpmRange, setRpmRange] = useState([1000, 14000]);
  const [tpsRange, setTpsRange] = useState([0, 100]);
  const [autoRange, setAutoRange] = useState(true);
  const [lapFilter, setLapFilter] = useState(new Set());
  const [hoveredCell, setHoveredCell] = useState(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [viewMode, setViewMode] = useState("heatmap");
  const [colorMode, setColorMode] = useState("afr");
  const [showLeanSpots, setShowLeanSpots] = useState(false);
  const fileInputRef = useRef(null);

  // Auto-adjust RPM range when a new file is loaded
  useEffect(() => {
    if (!session || !autoRange) return;
    const rpms = session.data.map(d => d.Rpm).filter(r => r > 200);
    if (!rpms.length) return;
    const maxRpm = Math.max(...rpms);
    const ceiling = Math.ceil((maxRpm + 500) / 1000) * 1000;
    setRpmRange([1000, Math.max(8000, Math.min(20000, ceiling))]);
  }, [session, autoRange]);

  const handleFile = useCallback(async (file) => {
    setParseError(null);
    try {
      const text = await readFileAsText(file);
      const fmt = detectLogFormat(text);
      if (fmt !== "aracer_sp" && fmt !== "aracer_ecu" && fmt !== "aracer_lm") {
        setParseError(`${file.name}: aRacer .loga 形式ではありません`);
        return;
      }
      const { data, format, sampleStride, totalRows, hasValidGps, gpsValidCount } = parseAracerLog(text, fmt);
      if (!data.length) {
        setParseError(`${file.name}: データ行が空です`);
        return;
      }
      const validAfr = data.filter(d => d.Afr > 5 && d.Afr < 25).length;
      const validRpm = data.filter(d => d.Rpm > 200).length;
      const validTps = data.filter(d => d.Tps >= 0).length;
      if (validAfr === 0) {
        setParseError(`${file.name}: 有効な AFR データがありません（センサー未接続？）`);
        return;
      }

      let circuitDetection = null;
      let autoLaps = [];
      if (hasValidGps) {
        circuitDetection = detectCircuit(data);
        if (circuitDetection?.circuit?.finishLine) {
          autoLaps = detectLapsByFinishLine(data, circuitDetection.circuit.finishLine);
          if (autoLaps.length > 0) {
            for (let lapI = 0; lapI < autoLaps.length; lapI++) {
              for (let i = autoLaps[lapI].start; i < autoLaps[lapI].end; i++) {
                data[i].Lap = lapI + 1;
              }
            }
          }
        }
      }

      setSession({
        name: file.name.replace(/\.loga$/i, ""),
        format,
        data,
        sampleStride,
        totalRows,
        hasValidGps,
        gpsValidCount,
        circuitDetection,
        autoLaps,
        stats: {
          validAfr, validRpm, validTps,
          duration: data[data.length - 1].RunTime - data[0].RunTime,
        },
      });
      setLapFilter(new Set());
      setHoveredCell(null);
    } catch (e) {
      setParseError(`${file.name}: ${e.message}`);
    }
  }, []);

  const filteredSamples = useMemo(() => {
    if (!session) return [];
    if (lapFilter.size === 0) return session.data;
    return session.data.filter(d => lapFilter.has(d.Lap));
  }, [session, lapFilter]);

  const cells = useMemo(
    () => computeFuelMapCells(filteredSamples, rpmBins, tpsBins, rpmRange, tpsRange),
    [filteredSamples, rpmBins, tpsBins, rpmRange, tpsRange]
  );
  const stats = useMemo(() => computeMapStats(cells), [cells]);
  const leanSpots = useMemo(() => computeLeanSpots(filteredSamples), [filteredSamples]);

  const handleSelectFromMap = useCallback((sample) => {
    if (!sample) return;
    const rpmStep = (rpmRange[1] - rpmRange[0]) / rpmBins;
    const tpsStep = (tpsRange[1] - tpsRange[0]) / tpsBins;
    const ri = Math.floor((sample.Rpm - rpmRange[0]) / rpmStep);
    const ti = Math.floor((sample.Tps - tpsRange[0]) / tpsStep);
    if (ri < 0 || ri >= rpmBins || ti < 0 || ti >= tpsBins) return;
    const cell = cells[ti]?.[ri];
    if (!cell) return;
    setHoveredCell({ cell, ri, ti });
    if (window.innerWidth < 1024) setViewMode("heatmap");
  }, [cells, rpmRange, tpsRange, rpmBins, tpsBins]);

  const sourceLabel = {
    aracer_sp:  { short: "SP",  full: "aRacer App (smartphone)" },
    aracer_ecu: { short: "ECU", full: "ECU Memory" },
    aracer_lm:  { short: "LM",  full: "Logger Module" },
  };
  const srcInfo = session ? sourceLabel[session.format] : null;

  return (
    <div className="min-h-screen relative">
      {/* Header */}
      <header className="px-4 sm:px-5 py-3 flex flex-wrap items-center gap-3 justify-between"
              style={{ background: COLORS.panel, borderBottom: `1px solid ${COLORS.border}` }}>
        <div className="flex items-center gap-3">
          <div style={{ width: 4, height: 28, background: COLORS.accent }} />
          <div>
            <div className="font-mono uppercase tracking-[0.32em] text-base font-semibold" style={{ color: COLORS.text }}>
              <span style={{ color: COLORS.accent }}>aRacer</span> // LAB
            </div>
            <div className="font-mono text-[9px] uppercase tracking-[0.25em] mt-0.5" style={{ color: COLORS.textMuted }}>
              FUEL MAP STUDIO · v{APP_VERSION}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button onClick={() => setAboutOpen(true)}
                  className="font-mono text-[10px] uppercase tracking-wider px-2 py-1.5 transition hover:text-white"
                  style={{ color: COLORS.textDim, border: `1px solid ${COLORS.border}` }}>
            ?
          </button>
          <input ref={fileInputRef} type="file" accept=".loga,text/plain,text/csv,application/octet-stream"
                 className="hidden"
                 onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
          <button onClick={() => fileInputRef.current?.click()}
                  className="font-mono uppercase tracking-wider px-3 py-1.5 transition"
                  style={{ background: COLORS.accent, color: "#000", fontSize: 11 }}>
            ↑ LOAD .loga
          </button>
        </div>
      </header>

      {/* Empty state */}
      {!session && (
        <main className="p-4 sm:p-8 max-w-3xl mx-auto">
          <div className="mb-4 p-4 sm:p-5" style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] mb-2" style={{ color: COLORS.accent }}>▸ このツールの目的</div>
            <div className="text-sm space-y-2" style={{ color: COLORS.textDim }}>
              <p>aRacer システムで走った後の <code className="font-mono text-xs px-1" style={{ background: COLORS.cell, color: COLORS.accent }}>.loga</code> ログを読み、<strong style={{ color: COLORS.text }}>実走時の AFR がどこで濃すぎ／薄すぎたかを特定する</strong>診断ツール。SpeedTuning で燃料マップを修正する前段階で使う。</p>
              <div className="font-mono text-[11px] mt-3 px-3 py-2" style={{ background: COLORS.cell, color: COLORS.textMuted }}>
                走行 → .loga 出力 → <span style={{ color: COLORS.accent }}>[ここで診断]</span> → SpeedTuning で修正 → 走行で検証
              </div>
            </div>
          </div>

          <div className="mb-4 p-4 sm:p-5" style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] mb-3" style={{ color: COLORS.accent }}>▸ 操作の流れ</div>
            <ol className="text-sm space-y-1.5 pl-1" style={{ color: COLORS.textDim }}>
              <li><span className="font-mono text-[10px] mr-2" style={{ color: COLORS.accent }}>01</span>下のエリアに <code className="font-mono text-xs px-1" style={{ background: COLORS.cell, color: COLORS.accent }}>.loga</code> をドロップ、または ↑LOAD ボタンで開く</li>
              <li><span className="font-mono text-[10px] mr-2" style={{ color: COLORS.accent }}>02</span>ヒートマップで <span style={{ color: COLORS.danger }}>赤いセル（リーン＝危険）</span>を最優先、続いて <span style={{ color: COLORS.cool }}>濃すぎる青</span>を探す</li>
              <li><span className="font-mono text-[10px] mr-2" style={{ color: COLORS.accent }}>03</span>気になるセルをタップ／ホバー → <strong style={{ color: COLORS.accent }}>Track Map タブ</strong>に切り替えて、それがサーキット上のどこで起きたかを確認</li>
              <li><span className="font-mono text-[10px] mr-2" style={{ color: COLORS.accent }}>04</span>SpeedTuning 側で対応セルの燃料補正を調整</li>
            </ol>
            <div className="mt-3 px-3 py-2 font-mono text-[10px]" style={{ background: COLORS.cell, color: COLORS.textMuted }}>
              Track Map は GPS データがあるログ（Logger Module / RFM2.5 装着 ECU）でのみ有効。サーキット位置から自動で筑波・もてぎを判定します。
            </div>
          </div>

          <div className="text-center py-12 sm:py-14 scanlines relative"
               style={{ background: COLORS.panel, border: `1px dashed ${COLORS.border}` }}
               onDragOver={(e) => e.preventDefault()}
               onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]); }}>
            <div className="font-mono uppercase tracking-[0.3em] text-xs mb-3" style={{ color: COLORS.accent }}>READY · NO LOG LOADED</div>
            <div className="text-sm mb-6 px-4" style={{ color: COLORS.textDim }}>
              <code className="font-mono text-xs px-1" style={{ background: COLORS.cell, color: COLORS.accent }}>.loga</code> をドラッグ＆ドロップ、または ↑LOAD ボタンで開く
            </div>
            <div className="font-mono text-[10px] space-y-1" style={{ color: COLORS.textMuted }}>
              <div>SUPPORTED FORMATS</div>
              <div>SP（Smartアプリ） · ECU（メモリエクスポート） · LM（Logger Module）</div>
            </div>
          </div>
          {parseError && (
            <div className="mt-4 px-4 py-3 font-mono text-xs"
                 style={{ background: "rgba(239,68,68,0.1)", border: `1px solid ${COLORS.danger}`, color: COLORS.danger }}>
              ! {parseError}
            </div>
          )}
        </main>
      )}

      {/* Session loaded */}
      {session && (
        <main className="p-3 sm:p-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* LEFT column */}
          <div className="space-y-3">
            {/* Session info */}
            <Panel title="Session" accent>
              <div className="px-3 py-2.5 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="font-mono text-sm truncate" style={{ color: COLORS.text }}>{session.name}</div>
                  {srcInfo && (
                    <span className="font-mono text-[9px] px-1.5 py-0.5 flex-shrink-0"
                          style={{ background: "rgba(251,146,60,0.18)", color: COLORS.accent, border: `1px solid ${COLORS.accent}` }}>
                      aR-{srcInfo.short}
                    </span>
                  )}
                  <span className="font-mono text-[10px]" style={{ color: COLORS.textMuted }}>
                    · {fmtTime(session.stats.duration)}
                    · {session.data.length.toLocaleString()} samples
                    {session.sampleStride > 1 && ` (1/${session.sampleStride} downsampled)`}
                  </span>
                </div>
                <div className="font-mono text-[10px] flex items-center gap-3" style={{ color: COLORS.textMuted }}>
                  <span>AFR: <span style={{ color: COLORS.text }}>{session.stats.validAfr.toLocaleString()}</span></span>
                  <span>RPM: <span style={{ color: COLORS.text }}>{session.stats.validRpm.toLocaleString()}</span></span>
                  <span>TPS: <span style={{ color: COLORS.text }}>{session.stats.validTps.toLocaleString()}</span></span>
                </div>
              </div>
            </Panel>

            {/* Lap filter */}
            {filteredSamples.length > 0 && session.data.some(d => d.Lap > 0) && (
              <Panel title="Lap filter" accent>
                <LapFilter samples={session.data} lapFilter={lapFilter} setLapFilter={setLapFilter} />
              </Panel>
            )}

            {/* Lap KPI */}
            {filteredSamples.length > 0 && session.data.some(d => d.Lap > 0) && (
              <Panel title="Lap KPI" accent
                     actions={
                       <div className="font-mono text-[10px]" style={{ color: COLORS.textMuted }}>
                         行クリックで該当ラップに絞り込み・★=ベスト
                       </div>
                     }>
                <LapKpiTable samples={session.data} lapFilter={lapFilter} setLapFilter={setLapFilter} />
              </Panel>
            )}

            {/* View toggle */}
            <Panel title="View" accent
                   actions={
                     <div className="flex items-center gap-3 flex-wrap justify-end font-mono text-[10px]">
                       <div className="flex items-center gap-1">
                         <span style={{ color: COLORS.textMuted }}>色:</span>
                         <button onClick={() => setColorMode("afr")}
                                 style={{ color: colorMode === "afr" ? COLORS.accent : COLORS.textMuted, fontWeight: colorMode === "afr" ? "bold" : "normal", textDecoration: colorMode === "afr" ? "underline" : "none" }}>AFR</button>
                         <span style={{ color: COLORS.textMuted }}>/</span>
                         <button onClick={() => setColorMode("dev")}
                                 style={{ color: colorMode === "dev" ? COLORS.accent : COLORS.textMuted, fontWeight: colorMode === "dev" ? "bold" : "normal", textDecoration: colorMode === "dev" ? "underline" : "none" }}>偏差</button>
                       </div>
                       {session.hasValidGps && (
                         <label className="flex items-center gap-1 cursor-pointer select-none" style={{ color: COLORS.textMuted }}>
                           <input type="checkbox" checked={showLeanSpots}
                                  onChange={(e) => setShowLeanSpots(e.target.checked)}
                                  style={{ accentColor: COLORS.danger }} />
                           <span>リーンスポット</span>
                           {showLeanSpots && leanSpots.total > 0 && (
                             <span className="ml-1">
                               (<span style={{ color: "#ef4444" }}>危{leanSpots.dangerReal}{leanSpots.dangerFC > 0 && <span style={{ opacity: 0.6 }}>+{leanSpots.dangerFC}FC</span>}</span>
                               {" "}<span style={{ color: "#f97316" }}>警{leanSpots.warningReal}{leanSpots.warningFC > 0 && <span style={{ opacity: 0.6 }}>+{leanSpots.warningFC}FC</span>}</span>
                               {" "}<span style={{ color: "#eab308" }}>注{leanSpots.cautionReal}{leanSpots.cautionFC > 0 && <span style={{ opacity: 0.6 }}>+{leanSpots.cautionFC}FC</span>}</span>)
                             </span>
                           )}
                         </label>
                       )}
                       <div style={{ color: COLORS.textMuted }}>
                         {viewMode === "heatmap"
                           ? (colorMode === "afr"
                               ? `target 12.5–13.5 (mid 13.0)`
                               : `偏差 = WBO2 − Target  (0=合致 / +=リーン / −=リッチ)`)
                           : (session.hasValidGps
                               ? `${session.gpsValidCount} GPS pts · ${session.autoLaps?.length || 0} laps detected`
                               : "GPS データなし")}
                       </div>
                     </div>
                   }>
              <div className="flex border-b" style={{ borderColor: COLORS.border }}>
                <button onClick={() => setViewMode("heatmap")}
                        className="font-mono text-[10px] uppercase tracking-wider px-4 py-2 transition flex-1"
                        style={{ background: viewMode === "heatmap" ? COLORS.cell : "transparent", color: viewMode === "heatmap" ? COLORS.accent : COLORS.textMuted, borderBottom: viewMode === "heatmap" ? `2px solid ${COLORS.accent}` : "2px solid transparent" }}>
                  ▦ Heatmap
                </button>
                <button onClick={() => setViewMode("track")}
                        disabled={!session.hasValidGps}
                        className="font-mono text-[10px] uppercase tracking-wider px-4 py-2 transition flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: viewMode === "track" ? COLORS.cell : "transparent", color: viewMode === "track" ? COLORS.accent : COLORS.textMuted, borderBottom: viewMode === "track" ? `2px solid ${COLORS.accent}` : "2px solid transparent" }}>
                  ◉ Track Map {!session.hasValidGps && "(GPS なし)"}
                </button>
              </div>

              {viewMode === "heatmap" && (
                <FuelMapHeatmap cells={cells} rpmRange={rpmRange} tpsRange={tpsRange}
                                hoveredCell={hoveredCell} setHoveredCell={setHoveredCell}
                                colorMode={colorMode} />
              )}
              {viewMode === "track" && session.hasValidGps && (
                <TrackView samples={filteredSamples}
                           circuitDetection={session.circuitDetection}
                           hoveredCell={hoveredCell}
                           rpmRange={rpmRange} tpsRange={tpsRange}
                           rpmBins={rpmBins} tpsBins={tpsBins}
                           onSelectFromMap={handleSelectFromMap}
                           colorMode={colorMode}
                           leanSpots={leanSpots}
                           showLeanSpots={showLeanSpots} />
              )}
            </Panel>

            {/* Cell detail */}
            <Panel title="Cell detail" accent>
              <CellDetail hovered={hoveredCell} rpmRange={rpmRange} tpsRange={tpsRange}
                          rpmBins={rpmBins} tpsBins={tpsBins} />
            </Panel>
          </div>

          {/* RIGHT sidebar */}
          <div className="space-y-3">
            <Panel title="Map stats" accent>
              <StatsPanel stats={stats} rpmBins={rpmBins} tpsBins={tpsBins} rpmRange={rpmRange} tpsRange={tpsRange} />
            </Panel>
            <Panel title={colorMode === "dev" ? "Deviation colour scale" : "AFR colour scale"} accent>
              <div className="p-3">
                <AfrLegend colorMode={colorMode} />
              </div>
            </Panel>
            <Panel title="Grid settings" accent>
              <SettingsPanel rpmBins={rpmBins} setRpmBins={setRpmBins}
                             tpsBins={tpsBins} setTpsBins={setTpsBins}
                             rpmRange={rpmRange} setRpmRange={setRpmRange}
                             tpsRange={tpsRange} setTpsRange={setTpsRange}
                             autoRange={autoRange} setAutoRange={setAutoRange} />
            </Panel>
          </div>
        </main>
      )}

      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}
    </div>
  );
}
