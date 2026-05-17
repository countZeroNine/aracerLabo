export const fmtNum = (n, d = 1) => n == null || isNaN(n) ? "—" : n.toFixed(d);

export const fmtTime = (s) => {
  if (!s || s < 0) return "—";
  const m = Math.floor(s / 60), sec = (s % 60).toFixed(3).padStart(6, "0");
  return `${m}:${sec}`;
};

// File reader with FileReader fallback for older browsers
export const readFileAsText = (file) => new Promise((resolve, reject) => {
  if (typeof file.text === "function") {
    file.text().then(resolve).catch(reject);
  } else {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("ファイル読み込みエラー"));
    reader.readAsText(file);
  }
});
