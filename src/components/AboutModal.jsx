import { APP_VERSION } from '../version/version.js';
import { CHANGELOG } from '../version/changelog.js';
import { COLORS } from '../constants/colors.js';

export const AboutModal = ({ onClose }) => (
  <div className="fixed inset-0 flex items-center justify-center p-4 z-50"
       style={{ background: "rgba(0,0,0,0.85)" }} onClick={onClose}>
    <div onClick={(e) => e.stopPropagation()}
         className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-5"
         style={{ background: COLORS.panel, border: `1px solid ${COLORS.borderBright}` }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em]" style={{ color: COLORS.accent }}>aRacer Lab v{APP_VERSION}</div>
          <div className="font-mono text-lg mt-0.5">Fuel Map Studio</div>
        </div>
        <button onClick={onClose} className="font-mono text-sm hover:text-white" style={{ color: COLORS.textDim }}>× CLOSE</button>
      </div>
      <div className="text-sm space-y-3 mt-4" style={{ color: COLORS.textDim }}>
        <p>aRacer Smart アプリ（SP形式）／ ECUメモリエクスポート（ECU形式）／ Logger Module（LM形式）の <code className="font-mono text-xs" style={{ color: COLORS.accent }}>.loga</code> ファイルを読み込んで、燃調マップ（RPM × TPS × AFR）を可視化する診断ツールです。</p>
        <p>各セルの色は実走時の AFR 中央値。<span style={{ color: COLORS.cool }}>● 青=濃い（リッチ）</span> / <span style={{ color: COLORS.target }}>● 緑=目標帯域内（12.5–13.5）</span> / <span style={{ color: COLORS.danger }}>● 赤=薄い（リーン・危険）</span></p>
        <p><strong style={{ color: COLORS.text }}>Track Map</strong>：GPS データを含むログでサーキット軌跡を AFR 色塗り表示。ヒートマップ ⇔ 地図でセル選択を双方向リンク。筑波（2000/1000）・もてぎ（北ショート/ロード）を自動判定。</p>
        <p><strong style={{ color: COLORS.text }}>色塗りモード切替（v0.4.5〜）</strong>：AFR モード（絶対値）と偏差モード（WBO2 − Target）を切り替え可能。偏差モードは公式 SpeedTuning にない aracer_lab オリジナルの分析機能。</p>
        <p><strong style={{ color: COLORS.text }}>リーンスポット（v0.4.6〜）</strong>：Track Map に危険レベル別の薄さ地点を色丸表示。v0.4.7 から燃料カット中（FC）と実害候補を分離表示。</p>
        <p><strong style={{ color: COLORS.text }}>Lap KPI 表（v0.4.8〜）</strong>：ラップ別の診断指標（危険・警戒・注意・偏差・ターゲット内%）を一覧比較。</p>
        <p className="text-xs" style={{ color: COLORS.textMuted }}>
          データはブラウザ内で処理され、外部サーバーには送信されません。<br/>
          aRacer は <a href="https://www.aracer-speedtek.com/" target="_blank" rel="noopener noreferrer" style={{ color: COLORS.textDim, textDecoration: "underline" }}>aRacer SpeedTek</a>（艾銳斯動力科技）の製品ブランドです。本ツールは非公式な解析ツールです。
        </p>
      </div>

      <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${COLORS.border}` }}>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] mb-3" style={{ color: COLORS.textMuted }}>変更履歴</div>
        <div className="space-y-3">
          {CHANGELOG.map((entry) => (
            <div key={entry.version} className="border-l-2 pl-3"
                 style={{ borderColor: entry.version === APP_VERSION ? COLORS.accent : COLORS.border }}>
              <div className="font-mono text-xs flex items-baseline gap-2">
                <span style={{ color: entry.version === APP_VERSION ? COLORS.accentBright : COLORS.text }}>v{entry.version}</span>
                <span className="text-[10px]" style={{ color: COLORS.textMuted }}>{entry.date}</span>
              </div>
              <ul className="font-mono text-[11px] mt-1 space-y-0.5" style={{ color: COLORS.textDim }}>
                {entry.notes.map((n, i) => (
                  <li key={i} className="flex gap-1.5">
                    <span style={{ color: COLORS.textMuted }}>·</span>
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
