import { COLORS } from '../constants/colors.js';

const NumInput = ({ label, value, onChange, min = 0, max = 99999, step = 1 }) => (
  <div className="flex flex-col gap-1">
    <label className="font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color: COLORS.textMuted }}>{label}</label>
    <input type="number" value={value} min={min} max={max} step={step}
           onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
           className="font-mono text-sm tnum px-2 py-1 outline-none w-full"
           style={{ background: COLORS.cell, border: `1px solid ${COLORS.border}`, color: COLORS.text, fontSize: 13 }} />
  </div>
);

export const SettingsPanel = ({ rpmBins, setRpmBins, tpsBins, setTpsBins, rpmRange, setRpmRange, tpsRange, setTpsRange, autoRange, setAutoRange }) => (
  <div className="p-3 grid grid-cols-2 gap-x-3 gap-y-2.5">
    <NumInput label="RPM bins" value={rpmBins} onChange={setRpmBins} min={4} max={32} />
    <NumInput label="TPS bins" value={tpsBins} onChange={setTpsBins} min={4} max={20} />
    <NumInput label="RPM min" value={rpmRange[0]} onChange={(v) => setRpmRange([v, rpmRange[1]])} min={0} max={20000} step={500} />
    <NumInput label="RPM max" value={rpmRange[1]} onChange={(v) => setRpmRange([rpmRange[0], v])} min={0} max={20000} step={500} />
    <NumInput label="TPS min %" value={tpsRange[0]} onChange={(v) => setTpsRange([v, tpsRange[1]])} min={0} max={100} step={5} />
    <NumInput label="TPS max %" value={tpsRange[1]} onChange={(v) => setTpsRange([tpsRange[0], v])} min={0} max={100} step={5} />
    <label className="col-span-2 flex items-center gap-2 mt-1 cursor-pointer">
      <input type="checkbox" checked={autoRange} onChange={(e) => setAutoRange(e.target.checked)} className="cursor-pointer" />
      <span className="font-mono text-[10px]" style={{ color: COLORS.textDim }}>RPM 範囲をデータから自動設定</span>
    </label>
  </div>
);
