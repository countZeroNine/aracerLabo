# aRacer Lab — Fuel Map Studio

aRacer `.loga` ログを読み込んで燃調マップ（RPM × TPS × AFR）を可視化する診断ツール。

## 対応フォーマット

| フォーマット | 識別子 | 概要 |
|---|---|---|
| SP | `aracer_sp` | aRacer Smart アプリ出力 |
| ECU | `aracer_ecu` | ECU メモリエクスポート |
| LM | `aracer_lm` | Logger Module |

## 開発環境セットアップ

Node.js v22+ と pnpm v11+ が必要です。

```bash
# 依存インストール（lockfile 厳守）
pnpm install --frozen-lockfile

# 開発サーバー起動
pnpm dev

# 本番ビルド
pnpm build

# ビルド結果のローカル確認
pnpm preview
```

## セキュリティ

- **pnpm v11**: `strict-dep-builds=true` / `minimum-release-age=1440` がデフォルト有効
- **依存バージョン**: `package.json` で exact pin（`^` `~` 不使用）
- **lockfile**: `pnpm-lock.yaml` を commit して決定性を確保
- **CSP**: Vercel 配信時にセキュリティヘッダを自動付与（`vercel.json` 参照）
- **外部通信**: ビルド後の配信物は OSM タイル取得以外の外部通信なし

詳細は `SECURITY.md` を参照。

## バージョン履歴

`src/version/changelog.js` および About モーダル（`?` ボタン）を参照。

## ライセンス

非公式ツール。aRacer は [aRacer SpeedTek](https://www.aracer-speedtek.com/)（艾銳斯動力科技）の製品ブランドです。
