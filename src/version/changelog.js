export const CHANGELOG = [
  {
    version: "0.5.7",
    date: "2026-05-18",
    notes: [
      "ラップフィルター: drogger 準拠の中央値ベースフィルター追加（中央値×0.55〜1.7 の範囲のみ表示）",
      "短い最終断片（L24=18.281s）と異常に長いラップが自動除外されるようになった",
    ],
  },
  {
    version: "0.5.6",
    date: "2026-05-18",
    notes: [
      "ラップタイム計算: 最初/最後サンプル差分から『次ラップの最初サンプル − 現ラップの最初サンプル』に変更（drogger と一致）",
      "ベストラップ判定も同様に修正（30秒未満は除外）",
    ],
  },
  {
    version: "0.5.5",
    date: "2026-05-18",
    notes: [
      "GPS パース: DMS（gps_lat_deg）優先に変更、decimal は DMS 不在時のフォールバックに格下げ（drogger と統一）",
      "同一 LM ログで drogger と aracer-lab の GPS 座標値が一致するようになり、ラップ検出の精度が揃う",
    ],
  },
  {
    version: "0.5.4",
    date: "2026-05-18",
    notes: [
      "ラップタイム表示を 1/10秒 → 1/1000秒（ミリ秒）に変更（aRacer 30Hz 分解能に対応）",
      "Lap Filter / KPI 表から Lap 0（検出前断片）を除外（ALL には含む）",
    ],
  },
  {
    version: "0.5.3",
    date: "2026-05-18",
    notes: [
      "GPS ラップ検出: drogger v1.7.0 と完全同一方式に移行（prevS=null + crossTimes RunTime ベース）",
      "インデックスベースのラップ番号付けを廃止し、補間通過時刻（crossTimes）による RunTime 比較方式に変更",
    ],
  },
  {
    version: "0.5.2",
    date: "2026-05-18",
    notes: [
      "GPS ラップ検出: segmentsIntersect を XY メートル系＋ε許容（0.001）に全面置き換え（drogger v1.7.0 準拠）",
      "生の度数系では分母が〜1e-7 で浮動小数点誤差が大きく端点付近で検出漏れが発生していた",
      "メートル系では分母〜1e4 で精度が高く、もてぎ北ショートで L1 = 4:48 の誤検出が解消",
      "COOLDOWN_S を 30s → 20s に変更（drogger に合わせる）",
    ],
  },
  {
    version: "0.5.1",
    date: "2026-05-18",
    notes: [
      "GPS ラップ検出: フィニッシュライン線分を両端各 20m 延長（GATE_EXTEND_M）— GPS 軌跡が線分端をかすめる場合の検出漏れを修正（drogger v1.7.0 で実証済みのロジックを移植）",
      "Lap KPI 表: ベストラップ（★）判定から 30 秒未満の断片ラップを除外",
    ],
  },
  {
    version: "0.5.0",
    date: "2026-05-15",
    notes: [
      "Vite 8 ビルドシステムへ移行（CDN 依存を完全撤廃）",
      "pnpm 11 を採用（strict-dep-builds / minimumReleaseAge デフォルト有効）",
      "React / ReactDOM / Leaflet を npm パッケージとしてバンドル（外部リクエストなし）",
      "Tailwind v4 CSS-first 設定（@import / @theme ディレクティブ）",
      "Vercel CSP ヘッダ完備（script-src 'self' のみ、eval 不可）",
      "Leaflet: window.L ポーリングを廃止し import L from 'leaflet' に移行",
      "ビルド後の dist/ は完全自己完結（OSM タイル取得を除き外部通信なし）",
    ],
  },
  {
    version: "0.4.9",
    date: "2026-05-11",
    notes: [
      "セキュリティ強化: CDN 経由依存ライブラリに version pin + SRI ハッシュ適用",
      "React 18.3.1 / ReactDOM 18.3.1 / @babel/standalone 7.25.6 / Leaflet 1.9.4（CSS/JS）",
      "残課題: cdn.tailwindcss.com は pin/SRI 不可 → v0.5.0 で Vite 移行と同時に解消",
    ],
  },
  {
    version: "0.4.8",
    date: "2026-05-11",
    notes: [
      "新機能: Lap KPI 表（ラップ別の診断比較テーブル）",
      "各ラップで「危険(実害)・危険(FC)・警戒・注意・平均偏差・ターゲット内%・サンプル数」を一覧表示",
      "ベストラップ（最短時間）に ★ マーク＋緑表示、実害件数・偏差を色付き表示",
      "行クリックでラップ絞り込み（Lap filter と同期）",
    ],
  },
  {
    version: "0.4.7",
    date: "2026-05-11",
    notes: [
      "リーンスポットの「燃料カット中（FC）」分類対応",
      "Fuel1.Dec_FC_En フラグでリーンスポットを benign（FC中）と実害候補（燃焼中なのに薄い）に分離",
      "FC 中は半透明ゴースト表示、FC OFF は強色表示",
      "カウンタ表示を「危19+110FC」のように分離",
    ],
  },
  {
    version: "0.4.6",
    date: "2026-05-11",
    notes: [
      "新機能: Track Map にリーンスポット重ね表示（View パネル右上の「☐ リーンスポット」トグル）",
      "3段階の重要度で色分け：注意（黄）= AFR 14.7–16.5 / TPS≥30% / RPM≥4,000",
      "警戒（橙）= AFR 16.5–18.0、危険（赤）= AFR ≥18.0（TPS gate なし）",
      "各マーカーに AFR / RPM / TPS の正確値ツールチップ",
    ],
  },
  {
    version: "0.4.5",
    date: "2026-05-11",
    notes: [
      "新機能: 「色: AFR / 偏差」モード切替（View パネル右上）",
      "偏差モード = WBO2 実測 − Target AFR（0=合致/+=リーン/−=リッチ）",
      "Heatmap と Track Map の両方に適用、凡例パネルも連動",
    ],
  },
  {
    version: "0.4.4",
    date: "2026-05-07",
    notes: [
      "AFR フィルタ撤廃：avgAfr 範囲外セグメントも灰色で必ず描画",
      "FeatureGroup を経由せず各 polyline を直接 map.addLayer する方式に変更",
    ],
  },
  {
    version: "0.4.0",
    date: "2026-05-07",
    notes: [
      "About モーダルに変更履歴パネルを追加",
    ],
  },
  {
    version: "0.3.0",
    date: "2026-05-07",
    notes: [
      "Phase 2: GPS 連携と地図ビューを実装",
      "Leaflet + OpenStreetMap で走行軌跡を AFR 色塗り表示",
      "サーキット自動判定・ラップ自動分割",
    ],
  },
  {
    version: "0.1.0",
    date: "2026-05-06",
    notes: [
      "初版リリース",
      "aRacer .loga ログ読込（SP / ECU / LM 全3形式自動判別）",
      "燃調マップヒートマップ（RPM × TPS × AFR）",
    ],
  },
];
