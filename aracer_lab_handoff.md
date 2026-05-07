# aRacer Lab — 新スレッド引継ぎ仕様書

このドキュメントは「aRacer Lab」プロジェクトを新しい Claude スレッドに引き継ぐための仕様書です。
このまま新スレッドの最初のメッセージに貼り付けてください。

---

## 1. プロジェクト概要

**aRacer Lab** は、**aRacer SpeedTek**（艾銳斯動力科技、公式サイト https://www.aracer-speedtek.com/ ）のシステムが出力する `.loga` ファイル（Smart アプリ・ECU メモリエクスポート・Logger Module の3形式）を解析する**単一ファイル HTML アプリ**。目的は「**燃調セッティングのための診断**」。

実装上の対応判定基準は**フォーマット**（先頭マーカー）であり、特定機種名に依存しない。`.loga` の SP/ECU/LM 形式マーカーが検出できれば、機種を問わず読み込み対象となる。

姉妹アプリ「**drogger_analyzer**」（別リポジトリ・別 Vercel デプロイ）とは独立。両者の関心領域：

| アプリ | 関心領域 | 主入力 | 状態 |
|---|---|---|---|
| drogger_analyzer | ラップタイム・走行ライン・スティント | Drogger CSV / aRacer .loga | v1.5.8 運用中 |
| aRacer Lab（本案件）| 燃調マップ・WBO2 補正・燃料系 | aRacer .loga のみ | **v0.1（Phase 1 完了）** |

両アプリは **同じユーザーが併用**する想定。コード共有なし、aRacer パーサーだけ同一実装をコピー。

---

## 2. ユーザー情報

- ハンドル：**れべるゼロ**（GitHub: `countZeroNine`）
- 言語：日本語（技術用語の英語混在 OK）
- バックグラウンド：LAMP/PHP、技術系
- **「律儀」と呼ばないこと**
- 目標：**FSW Mini Roku 125-I class race**（筑波サーキット、2026年7月）
- チーム：**Team G-Thunder**（リーダー）

### 対象車両（本プロジェクトのスコープ）
- **3号機（れべるゼロさんの主機）：Kawasaki Z125 Pro** ← 唯一の対象
  - aRacer **RC Super2 ECU**
  - **Race Function Module**（リーン角・ピットリミット・ランチコントロール用）
  - **RFM 用 GPS センサー**（座標・速度を ECU 経由で記録）
  - **Logger Module**（独立ロガー、走行データの長時間記録用）
  - → **すべての `.loga` 形式（SP/ECU/LM）で GPS 座標が実データとして記録される**構成

### 対象外（再議論・サポートしない）
- **1号機・2号機**：両方とも武川サブコン搭載・れべるゼロさんの管理外
- 他車両（aRacer 非搭載）

### チューニング方針（3号機・決定済の主要アイテム）
- Takumi 高圧縮ピストン（**12.5:1**, P/N 01-02-0013）
- Takumi N-10 sports cam
- パワーフィルタ（125-I レギュレーション内で許容確認済）
- Ninja 400 インジェクタ（**265cc/min**）への大型化検討中
- 純正インジェクタ流量：**105cc/min**（誤情報「112cc/min」は要修正）

### Claude との運用ルール
- 「お任せ」と言われたら：**根拠を示しつつデフォルトを決めて進める**
- ソース重視：ユーザーが提供する一次資料（マニュアルPDF、実測値、レギュ原文）を Claude の知識より優先する

---

## 3. v0.1 現状（Phase 1 + Phase A 完了済み）

### 成果物
- `aracer_lab.html`（単一 HTML、約 930 行）
- 動作確認済：実 `.loga` ファイル 11 種類で動作テスト済

### 実装済み機能
1. **aRacer .loga 読込**（ドラッグ＆ドロップ＋ファイルピッカー）
2. **形式自動判別** SP / ECU / LM 全 3 種
3. **カラム数バリエーション吸収**（17/19/26/115/206/237 cols 全対応）
4. **燃調マップヒートマップ**（中核機能）
   - RPM × TPS の 16×16 グリッド（変更可能）
   - 各セル：AFR 中央値 + サンプル数 (n=N)
   - 8 段階 HSL カラースケール（**rich=blue（安全）→ target=green → lean=red（危険）**）
   - aRacer Race Panel の燃料マップ編集画面と同一の縦横軸
5. **4st 専用**（aRacer は二輪 FI 用 ECU のため 2st 非対応）
6. **セル詳細パネル**（hover/tap 時）：RPM 範囲、TPS 範囲、AFR 中央値・最小最大・分布、サンプル数、RICH/TARGET/LEAN ステータス
7. **マップ全体統計**：カバー率、目標帯域内セル数、リッチ/リーン分布、最頻セル
8. **AFR カラースケール凡例**（目標帯域は太枠強調、stoich 14.7 ティック、方向ヒント付き）
9. **ラップフィルタ**（IR_LapNumber 有効時のみ機能）
10. **グリッド設定**：RPM bins、TPS bins、各範囲手動調整、RPM 範囲自動算出
11. **モバイル対応**（タブレット・スマホ対応、タッチでセル選択、レスポンシブレイアウト、ヒートマップ横スクロール）
12. **オンボーディング画面**（空状態に「目的・操作の流れ」を明示）

### 配色慣例（重要・aRacer SpeedTuning と HONDA 燃調ソフトに準拠）

| 領域 | 状態 | 色 | 安全性 |
|---|---|---|---|
| AFR < 12.5 | RICH（濃い） | **青** | 安全域 |
| 12.5 ≤ AFR ≤ 13.5 | TARGET | **緑** | 目標 |
| AFR > 13.5 | LEAN（薄い） | **赤** | **危険域** |

**前バージョン（前スレ作成）で「青寄りはリーン、赤寄りはリッチ」と書いていたのは誤り**。aRacer/HONDA の慣例は逆で、リーンが危険域として赤、リッチが安全域として青。これはオペレーター（チューナー）が判断を誤らないため標準化されている。Phase A で修正済み。

### 検証済み実データ結果
```
LM motegi 26min:    16,636 samples | 61% cell coverage | busiest 11,300rpm × 94%TPS, AFR 11.4
04_ALL motegi 50min: 16,000 samples | 58% coverage | 74% in target band（綺麗な燃調）
20210416_ALL 50min:  16,000 samples | 66% coverage | 38% in target（パーシャル域でリッチ多い）
```

---

## 4. アーキテクチャ・実装方針

### 単一ファイル原則（厳守）
- ビルドステップなし
- 依存パッケージなし（CDN のみ）
- `aracer_lab.html` 一個で完結
- ローカルでファイル開くだけで動く / GitHub に置いて Vercel デプロイで即公開

### 技術スタック
```
React 18 UMD（production build）
Tailwind CSS JIT CDN
Babel Standalone（type="text/babel" で JSX 直書き）
Google Fonts: JetBrains Mono + IBM Plex Sans
SVG by hand（チャートライブラリなし）
```

### ファイル構造（参考）
```
aracer_lab.html
├── HTML head（CDN imports + CSS変数定義）
├── Body > #root
└── <script type="text/babel">
    ├── COLORS 定数（CSS変数参照）
    ├── AFR_TARGETS（2st/4st 目標帯域）
    ├── afrColor(afr, engineType)（HSLグラデーション）
    ├── detectLogFormat(text)
    ├── parseAracerLog(text, format)
    ├── computeFuelMapCells(samples, rpmBins, tpsBins, ...)
    ├── computeMapStats(cells, engineType)
    ├── UI primitives: Panel, Stat
    └── Components: App, FuelMapHeatmap, AfrLegend, CellDetail, StatsPanel,
                    SettingsPanel, LapFilter, AboutModal
```

### Aesthetic（drogger_analyzer との差別化）
- **主アクセント**：アンバー `#fb923c`（燃料・熱・ダイノセル照明）／drogger は黄色なので意図的に変える
- **副カラー**：sky blue `#38bdf8`（**rich/safe**）、lime `#84cc16`（target）、red `#ef4444`（**lean/danger**）
- **タイポ**：`JetBrains Mono`（読出し）+ `IBM Plex Sans`（説明文）
- **背景**：`#08090b` 深い黒、パネル `#0f1115`、セル `#15171c`
- 角丸なし（ECU/工業デザイン）、サブトルなスキャンライン（空状態のみ）
- フォントの `tnum`（tabular-nums）で数値を整列

---

## 5. aRacer .loga フォーマット仕様（重要参照）

### 形式判別（先頭1行のマーカー）
| ファーストライン | 内部識別子 | 出元 | 一般カラム数 | GPS座標 | IR_LapNumber |
|---|---|---|---|---|---|
| `<aRacer APP Log Data for RaceAMP>` | `aracer_sp` | スマホアプリ | ~2075 | RFM接続次第 ※1 | 通常0 |
| `<Cycling Memory Log Data of Super ECU>` | `aracer_ecu` | ECU 内部循環バッファ | 17/19/26/206 | RFM接続次第 ※1 | 通常0 |
| `<ECU Memory Log Data of Super ECU>` | `aracer_ecu` | ECU 全エクスポート | 17/26/239 | RFM接続次第 ※1 | 通常0 |
| `<aRacer ECU_Memory Log Data for RaceAMP>` | `aracer_lm` | aRacer Logger Module | 115 | LMが内蔵GPS搭載のため**あり** | 通常0 |

### ※1 GPS座標記録のハードウェア要件（重要）
**スマホアプリ単体では `.loga` に GPS 座標は記録されない**。アプリは速度表示用にスマホGPSを読むだけ。実データとして座標を `.loga` に記録するには、aRacer ハードウェア追加モジュールが必要：

| 製品 | 機能 | 対応ECU |
|---|---|---|
| **Race Function Module 2.5**（RFM2.5） | GPSセンサー＋ジャイロ。ECUのペリフェラルとして座標・速度・リーン角を供給 | RC Super2 / RC SuperX |
| **Logger Module 2**（LM2） | 独立ハードウェア。GPS含む走行ログを単独で記録 | 対応モデルあり |
| **bLink2 + スマホアプリ単体** | GPS座標は記録されない（速度表示用のみ） | 全般 |

**3号機の構成は Super2 + RFM + GPS + LM の全部入り**なので、SPでも ECUメモリエクスポートでも GPS座標が乗る。前スレで「SPは値0」と書いたのは、テストデータが偶々RFM未装着機のものだった可能性が高い。実データで再確認のこと。

### 共通構造
```
L1: <type marker>
L2: Created Date: ... または Creased Date: ...
L3: Product ID: ... または Ex ID: ...
L4: AMP Version: ... または AMS Version: ...
L5: Stage_1,Stage_2,Stage_3,Flag,...（カラム優先度分類、無視可）
L6: 実カラム名（カンマ区切り、Time/Timer が0番目）
L7+: 実データ
```

### カラム名命名のクセ（パーサー設計上の重要点）
同じ意味のカラムでも書式がバラつく：
- 単純：`RPM/`（スラッシュで終わる）
- サブシステム接頭：`Fuel.NBO2_BL_En/`（ドット区切り、最後が実名）
- 中国語注記付き：`IR_LapNumber/圈數`（スラッシュ後に翻訳）

→ パーサー正規化：`split('/')[0].split('.').pop().toLowerCase()`

### 燃調分析で使うカラム
| 標準名 | aRacer 命名（候補） | 用途 |
|---|---|---|
| RPM | `rpm` | エンジン回転数 |
| TPS | `tps_percent` | スロットル開度 % |
| AFR | `afr_wbo2_cal`（優先）, `afr` | 空燃比（WBO2 calibrated 優先） |
| AFR alt | `af1_afr` | チャネルA wideband |
| NBO2 voltage | `nbo2_volt` | 純正 narrowband 電圧 |
| TPS AD | `tps_ad` | 生 ADC 値 |
| Air temp | `t_air_indx` | 吸気温度 |
| Battery | `volt_batt_indx` | バッテリ電圧 |
| Gear | `gearnum` | ギア位置 |
| Lean angle | `tc_lean_angle` | リーン角（LM のみ） |
| Map number | `mapnum` | 燃料マップ番号 |
| WBO2 AT enable | `wbo2_at_en` | オートチューン作動 |
| WBO2 ready | `wbo2_ready` | センサーレディ |
| RPM limit | `rpm_limit` | リミッター作動 |
| Power mode | `power_en` | パワーモード |

### GPS デコード（2系統のカラム命名規則に対応必須）

**SP形式（aRacer Smart アプリ公式マニュアル `aRacerApp_202052821616.pdf` page 4 準拠）**：
単一カラムで十進度を直接保持する流儀
```
GPS_latitude    NA    GPS 緯度（十進度、例: 36.150167）
GPS_longitude   NA    GPS 経度（十進度、例: 139.919417）
GPS_Altitude    m     GPS 高度
GPS_Time        NA    GPS 時間
GPS_Speed       k     GPS 速度
```

**LM/ECU 形式（NMEA 0183 風 multi-column DMS）**：
```javascript
lat = GPS_Lat_deg + (GPS_Lat_min + GPS_Lat_mmmm/10000) / 60
lon = GPS_Lon_deg + (GPS_Lon_min + GPS_Lon_mmmm/10000) / 60
// NS/EW は ASCII コード：N=78, S=83, E=69, W=87
if (GPS_Lat_NS === 83) lat = -lat  // 南緯
if (GPS_Lon_EW === 87) lon = -lon  // 西経
```

**実装方針**：パーサーは両方のカラム命名を試し、見つかった方を使う（フォールバック）。十進度系を優先し、無ければ DMS 系へ。
妥当性チェック必須：`-90 ≤ lat ≤ 90` および `-180 ≤ lon ≤ 180` 外はノイズ除外。0,0 付近もノイズ扱い。

---

## 6. AFR 目標帯域

```javascript
// aRacer は二輪 FI 車両用 ECU のため 4-stroke 決め打ち（2st は対応外）
const AFR_TARGET = { low: 12.5, mid: 13.0, high: 13.5 };
const AFR_DISPLAY_MIN = 8.0;
const AFR_DISPLAY_MAX = 18.0;
```

- 表示範囲広め（8〜18）：燃調が全然合っていないケースも想定
- Stoich（化学量論比）= 14.7（ガソリン）
- 2st は現代日本では事例ほぼゼロのため非対応（Phase A で削除）

### 配色マッピング（ヒートマップ・凡例・ステータス全部統一）

```
AFR  8 ─── 11 ─── 12.5 ─── 13.0 ─── 13.5 ─── 14.7 ─── 16.5 ─── 18
    青     青       青緑    緑(target) 黄緑    黄(stoich) 橙       赤
    ↑ 安全域（リッチ）       ↑ 目標         ↑ 危険域（リーン）↑
```

オペレーター（チューナー）が色から直感的に「危険／安全」を判断できるよう、aRacer SpeedTuning と HONDA 燃調ソフトの慣例に準拠（赤＝危険＝薄い、青＝安全＝濃い）。これは内部統計パネル（Too rich / Too lean）とセル詳細（RICH / LEAN ステータス）でも同じ色対応。

---

## 7. ロードマップ（Phase 2 以降）

### Phase A：致命傷フィックス（**完了済み**）
- ステータス側配色反転（赤=リーン=危険、青=リッチ=安全 で統一）
- セル文字色のコントラスト調整（リーン側=赤背景にも白文字適用）
- 2st 完全排除（AFR_TARGETS、エンジントグル、関連 props 全削除）
- モバイル対応（レスポンシブグリッド、ヒートマップ横スクロール、タッチでセル選択）
- オンボーディング画面追加（空状態に「目的・操作の流れ」を明示）
- About モーダル更新（配色慣例の明記）

### Phase 2：GPS 連携と地図ビュー（**完了済み**）

**背景**：Phase 1 完了時点では「リーン／リッチがどこ（RPM×TPS）」までしか分からず、「サーキットのどの区間で発生したか」が不明で、SpeedTuning での修正判断に直結しなかった。これを解消したのが Phase 2。

**目的（達成）**：燃調セルとサーキット位置を双方向リンクして「ホームストレートWOTでリーン」「シケイン入口で一瞬掠めただけ」を区別可能にする

**実装済み内容**：
1. ✅ **GPS座標パース**：NMEA 0183 風 deg/min/mmmm + NS/EW ASCII デコード
2. ✅ **地図ビュー追加**：Leaflet 1.9.4 + OpenStreetMap タイル（CDN、APIキー不要、ダークテーマ調整済み）
3. ✅ **AFR色塗りライン**：`afrColor()` 再利用、最大2000セグメントに自動間引きしてパフォーマンス確保
4. ✅ **タブ切替UI**：Heatmap / Track Map（GPS無しログでは Track タブ disabled）
5. ✅ **双方向ハイライト**：
   - セル選択 → 該当サンプルを地図上にオレンジ円でマーク
   - 地図クリック → 最近傍点のRPM/TPSセルをヒートマップでハイライト
   - モバイル時のみ地図クリック→ヒートマップ自動切替（ピット片手操作対応）
6. ✅ **サーキット自動判定**：GPS重心からの最近傍CIRCUITSエントリ、5km以内なら適用
7. ✅ **フィニッシュライン基準ラップ自動分割**：IR_LapNumber 無しログでも線分交差判定でラップ分割

**実装ファイル**：`aracer_lab.html` 単一ファイル（外部依存はLeaflet CDNのみ）

**主要関数・コンポーネント**：
- `parseAracerLog()`: GPSカラム検出 + デコード + `hasValidGps`/`gpsValidCount`返却
- `haversine()`: 2点間距離（メートル）
- `detectCircuit(samples)`: サーキット自動判定
- `segmentsIntersect()`: 2線分交差判定
- `detectLapsByFinishLine(samples, finishLine)`: ラップ自動分割
- `samplesInCell()`: セル該当サンプル抽出（地図ハイライト用）
- `<TrackView>`: 地図表示コンポーネント

**サーキット DB（コード内固定・座標確定済み）**：
ログのGPSから自動でサーキットを判定し、地図中心・ズーム・フィニッシュラインを自動適用する。手動設定不要。

| ID | 名称 | 用途 | フィニッシュライン (DMS) |
|---|---|---|---|
| `tsukuba_2000` | 筑波サーキット コース2000 | 本戦・練習想定 | A: 36°09'00.6"N 139°55'09.9"E<br>B: 36°09'00.2"N 139°55'12.2"E |
| `tsukuba_1000` | 筑波サーキット コース1000 | 練習・ミニバイク戦 | A: 36°09'03.9"N 139°55'29.2"E<br>B: 36°09'03.6"N 139°55'30.5"E |
| `motegi_kart_north` | モビリティリゾートもてぎ 北ショートコース | カート場 | A: 36°32'18.6"N 140°13'54.9"E<br>B: 36°32'18.5"N 140°13'56.5"E |
| `motegi_road` | モビリティリゾートもてぎ ロードコース | フルコース走行用 | A: 36°31'58.8"N 140°13'35.9"E<br>B: 36°31'59.3"N 140°13'37.0"E |

**十進度版（aracer_lab.html の `CIRCUITS` 定数に実装済み）**：

```javascript
const CIRCUITS = [
  { id: "tsukuba_2000",      name: "筑波サーキット コース2000",
    finishLine: [{lat: 36.1501667, lon: 139.9194167},
                 {lat: 36.1500556, lon: 139.9200556}] },
  { id: "tsukuba_1000",      name: "筑波サーキット コース1000",
    finishLine: [{lat: 36.1510833, lon: 139.9247778},
                 {lat: 36.1510000, lon: 139.9251389}] },
  { id: "motegi_kart_north", name: "モビリティリゾートもてぎ 北ショートコース",
    finishLine: [{lat: 36.5385000, lon: 140.2319167},
                 {lat: 36.5384722, lon: 140.2323611}] },
  { id: "motegi_road",       name: "モビリティリゾートもてぎ ロードコース",
    finishLine: [{lat: 36.5330000, lon: 140.2266389},
                 {lat: 36.5331389, lon: 140.2269444}] },
];
```

各フィニッシュライン線分長は 30〜60m（カート場・ミニサーキット相応の妥当な値）。

該当サーキットなしの場合のみ画面上で2点クリック手動定義（フォールバック）。フィニッシュラインの2点定義は IR_LapNumber が無いログでもラップ自動分割可能にする。

### Phase 3：WBO2 オートチューン作動マップ

**目的**：自動補正済み（信頼）セルと、手動補正必要セルを区別

**実装方針**：
- 同じ RPM × TPS グリッドで第二のヒートマップ
- 各セルの色 = `Wbo2AtEn` フラグの作動率（0〜100%）
- 灰 → 緑のグラデーション（緑＝高頻度オートチューン作動）
- AFR ヒートマップとのタブ切替で見せる

**実装単位**：新コンポーネント `AutoTuneHeatmap` を追加、`computeAutoTuneCells()` ヘルパー新規

**注意点**：オートチューン作動条件は warm-up 完了・定常状態・FCM のホットゾーン該当などで決まる。`Wbo2CLCWarmArea`、`Wbo2CLC2DRunArea` 等のフラグも参考になる（が Phase 3 時点では `Wbo2AtEn` だけで十分）

### Phase 4：ギア別 AFR 分布

**目的**：ギア毎にエンジン負荷が違うため、低ギア濃い／高ギア薄いといったギア依存問題を検出

**実装方針**：
- `GearNum` 毎にサブセット
- 縦並びで WOT（Tps > 80%）時の AFR ヒストグラム
- 各ギアの AFR 中央値・分布幅を比較しやすく

**注意点**：`GearNum` はニュートラル＝0 を含む。WOT 判定の閾値（80% or 90%）は設定可能にすると良い。

### Phase 5 候補（優先度低）
- **複数ファイル比較**：パーツ交換前後の燃調マップを並べて差分表示（Z125 Pro のピストン交換前後など）
- **マップ番号タイムライン**：`MapNum` 切替を時系列で可視化
- **エクスポート**：燃調マップを PNG / CSV で書き出し（チーム共有用）
- **フューエル補正提案**：各セルの目標 AFR との乖離から補正値を逆算（実機反映は手動）
- **コーナリング解析（別タブ Dynamics）**：LeanAngle・Gセンサー・Wheelie 等の走行解析（チューニング外）

---

## 8. デプロイ手順

drogger_analyzer の運用パターンを踏襲：
1. GitHub に新リポジトリ作成（推奨：`countZeroNine/aracer_lab`）
2. `aracer_lab.html` を `index.html` として配置（リネーム可、または vercel.json で routing）
3. Vercel に新プロジェクトとして連携 → 自動 Static デプロイ
4. 推奨URL：`aracer-lab.vercel.app`
5. Vercel Analytics（無料の匿名ページビュー集計）を有効化推奨

---

## 9. 既決事項（再議論不要）

これらは前スレッド／本スレッドで合意済み：

1. **単一ファイル HTML 維持**（ビルドステップ・依存パッケージ禁止）
2. **drogger_analyzer とは独立アプリ**（コード共有なし、aRacer parser だけ同一実装をコピー）
3. **AFR は WBO2 を優先**（`afr_wbo2_cal` → `afr` フォールバック）
4. **巨大ファイル対策**：32Hz 超のソースは自動で 10Hz 程度に間引き（`sampleStride`）
5. **GPS 座標妥当性チェック必須**（緯度 -90～90、経度 -180～180 範囲外は除外）
6. **「お任せ」運用**：根拠付き Claude 決定 → 後から調整 OK
7. **データプライバシー**：すべてブラウザ内処理、外部送信なし
8. **2-stroke 対応しない**（aRacer は二輪 FI 用 ECU）
9. **配色慣例**：赤=リーン=危険、青=リッチ=安全（aRacer SpeedTuning / HONDA 燃調ソフト準拠）
10. **モバイル対応必須**（ピット現場でスマホ／タブレットから見る）
11. **対象車両は 3号機（Z125 Pro）のみ**。1号機・2号機は管理外で対象外
12. **このアプリは診断ツール**（修正は SpeedTuning 側で行う、本ツールは ECU に書かない）
13. **BOM 対応不要**（テキストエディタ経由の汚染想定なし）
14. **対応判定はフォーマット主体・機種名非依存**：UI 文言や説明には特定機種名（RC Super2、RC Mini5 等）を列挙しない。`.loga` のマーカー（SP/ECU/LM）が判別できれば機種を問わず対応扱い。これは将来機種追加時の文言メンテ負荷を下げるためと、未検証機種を「対応」と謳うことのクレームリスクを避けるため
15. **ヒートマップ軸方向は aRacer SpeedTuning 公式 D3Cyl1_VM と統一**：横軸=RPM（左→右増加）、**縦軸=TPS（上→下増加、低TPSが上）**。れべるゼろさんが SpeedTuning と並べて参照する想定での認知負荷低減のため

---

## 10. 新スレッドの始め方

このドキュメント全文を新スレッドの最初に貼り、続けて：

> 「aRacer Lab は Phase 1 + Phase A + Phase 2（GPS連携・地図ビュー）まで完成しています。`aracer_lab.html` は別途共有します。Phase 3（WBO2 オートチューン作動マップ）から進めたい」

のように具体的な要望を伝えれば、新スレッドの Claude が文脈を理解してすぐ実装に入れます。

実ファイルでの動作確認をやり直す場合は、以下のような `.loga` ファイルが手元にあれば再テストできます：
- `LoggerModule_20210416_02.loga`（aRacer LM, もてぎ 26分）
- `20201110CBR250RR_04_ALL.loga`（aRacer ECU ALL, もてぎ 50分）
- `20210416CBR250RR_ALL.loga`（aRacer ECU ALL, もてぎ 50分）
- `20201110CBR250RR_04_GPS_Last10min.loga`（aRacer ECU GPS Last10min）

---

## 11. 引継ぎ成果物

- **`aracer_lab.html`**（Phase 1 + Phase A + Phase 2 完成、動作確認済）
- **`aracer_lab_handoff.md`**（このドキュメント、Phase 2 反映済み）
- **`北ショーフィニッシュライン_単純化.png`**（モビリティリゾートもてぎ 北ショート、フィニッシュライン定義の参考画像）

新スレッド向けの引継ぎは以上です。Phase 3（WBO2 オートチューン作動マップ）以降、引継ぎ先の Claude さんがうまく文脈を吸って続けてくれることを願っています。
