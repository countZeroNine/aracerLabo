// リーンスポット判定定義
// 別スレの実走分析で確立された定義をベース：
//   注意・警戒は TPS≥30% / RPM≥4000 でアクセル開いている時の燃調不足を検出
//   危険（AFR≥18.0、センサ振り切れ）は TPS gate なし → エンブレ中の致命的リーンもキャッチ
export const LEAN_SPOT_THRESHOLDS = {
  caution: { afrMin: 14.7, afrMax: 16.5, tpsMin: 30, rpmMin: 4000, color: "#eab308", radius: 4, label: "注意" },
  warning: { afrMin: 16.5, afrMax: 18.0, tpsMin: 30, rpmMin: 4000, color: "#f97316", radius: 5, label: "警戒" },
  danger:  { afrMin: 18.0, afrMax: 99.0, tpsMin:  0, rpmMin: 4000, color: "#ef4444", radius: 6, label: "危険" },
};
export const LEAN_SPOT_MAX_MARKERS = 500;
