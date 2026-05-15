// AFR target band (4-stroke FI; aRacer は二輪FI用ECUのため4st決め打ち)
// 安全域(rich) ← target ← 危険域(lean)
export const AFR_TARGET = { low: 12.5, mid: 13.0, high: 13.5 };
export const AFR_DISPLAY_MIN = 8.0;
export const AFR_DISPLAY_MAX = 18.0;
// 偏差モード表示範囲
export const DEV_DISPLAY_MIN = -3.0;
export const DEV_DISPLAY_MAX = +3.0;
