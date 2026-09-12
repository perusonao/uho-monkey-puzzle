# てっちゃん Room-life HOME 全身素材統合 結果報告

- 対象ブランチ: `claude/techchan-room-home-assets-bk81c3`
- Commit SHA: `edced6632c01e1f10b695e55a5757cb1df255d4c`
- Pull Request: [#5](https://github.com/perusonao/uho-monkey-puzzle/pull/5)
- 作業日: 2026-09-12

## 1. 目的

`tecchan.html` の仮画像 `assets/monkey-face.webp`（顔のみ、192x192）を廃止し、提供された `tecchan-assets.zip` の素材を使って「部屋で生活するてっちゃん」HOMEへ更新する。

## 2. 受領アセットの内容と前提の見直し

`tecchan-assets.zip` を展開すると以下のみが含まれていた。

```
README.md
manifest.json
assets/tecchan/room-home-reference.png   (1536x1024, 承認済み合成リファレンス)
```

同梱の `manifest.json` / `README.md` には明記の通り、
- `room-home-reference.png` は **承認済みの合成ビジュアルリファレンスであり、ランタイム用に分離されたスプライトではない**
- キャラクターと部屋は別レイヤーとして扱うこと。合成リファレンスを「すでに分離済みのスプライト」であるかのように扱わないこと
- 将来的に `room-background` / `tecchan-standing` / `tecchan-sitting` / `tecchan-eating` / `tecchan-playing` / `tecchan-sleeping` 等の個別素材が届く前提でコードを準備すること

と指示されていたため、**単一の合成画像をそのままキャラクター画像として使う実装は行っていない**。代わりに、リファレンス画像から「全身・立ちポーズ」のてっちゃんのみを画像セグメンテーション（OpenCV GrabCut＋手動クリーンアップ）で1枚切り出し、暫定の全身スプライトとして使用した。

## 3. 変更ファイル

| ファイル | 内容 |
|---|---|
| `tecchan.html` | `.character` 要素を `.room` の外（`.app` 直下）へ移動し、部屋レイヤーとキャラクターレイヤーを分離。`img src` を `assets/monkey-face.webp` → `assets/tecchan/tecchan-standing.webp` に変更。`.character.bedSpot` の `left` を `79%→70%` に調整し、右側メニューボタンとの重なりを解消。 |
| `assets/tecchan/room-home-reference.png` | 承認済み合成リファレンス（原本、将来の追加ポーズ切り出し用に保存） |
| `assets/tecchan/tecchan-standing.webp` | リファレンスから切り出した全身・立ちポーズの暫定スプライト（386x676、透過PNG相当をWebP化、約57KB） |

`assets/monkey-face.webp` 自体は `game.js` / `combo-prototype.html`（既存の落下パズル）から引き続き参照されているため削除していない。`tecchan.html` からの参照のみを差し替えた。

ZIP本体・`manifest.json`・`README.md`・作業用の中間画像（GrabCutマスク、グリッド確認画像等）はリポジトリにコミットしていない（作業ディレクトリ外のスクラッチ領域のみに保持）。

## 4. 実装内容

- 部屋背景（窓・ソファ・テーブル・ベッド・本棚・テレビ・ラグ・観葉植物・おもちゃ）は既存のCSSレイアウトを維持しつつ、`.character` を独立レイヤーとして配置
- 「ごはん」→テーブル付近（`tableSpot`）／「なでる」→ソファ付近・プレイヤー側（`sofaSpot`）／「遊ぶ」→おもちゃ付近（`playSpot`）／「ねる」→ベッド付近（`bedSpot`）へ、全身てっちゃんが移動するスポット遷移ロジックは既存実装を踏襲（今回のアセット差し替えに合わせて `bedSpot` の位置のみ微調整）
- セリフ・ヒント文言は既存のまま自然な日本語（「ウホ」「ウホウホ」は不使用）
- 本名「テナガサルオ」・呼び名「てっちゃん」の表記は変更なし
- `localStorage` キー `tecchanGrowthV2` のスキーマ・読み込みロジックは無変更
- 既存の落下パズル（`game.js`, `combo-prototype.html`, `index.html` 等）には一切手を加えていない

## 5. テスト結果

Playwright（Chromium, headless）を用いて `python3 -m http.server` でローカル配信した `tecchan.html` を検証。

- **画面幅**: 360x740 / 390x844 の両方で確認
- **オーバーフロー**: `document.documentElement.scrollWidth/scrollHeight` が viewport と一致し、横スクロール・縦はみ出しなし
- **4アクション動作確認**: ごはん／なでる／遊ぶ／ねる の各ボタンをクリックし、てっちゃんの位置（CSSクラス）・吹き出し・ヒント文言が変化することを確認
  - ごはん→「テーブルでごはんを食べています」
  - なでる→「ソファの近くでうれしそうにしています」
  - 遊ぶ→「おもちゃのところへ移動しました」
  - ねる→「ベッドでひと休みします」
- **画像404 / JSエラー**: `console`・`pageerror`・`requestfailed`・HTTP 4xx応答を監視。ページ自体の資産（`tecchan.html`, `assets/tecchan/tecchan-standing.webp` 等）に404・JSエラーは無し。ブラウザが自動送出する `favicon.ico` の404のみ検出されたが、これは `tecchan.html` 側に `<link rel="icon">` の定義がなく元々存在しない挙動であり、本改修に起因する問題ではない
- **既存localStorage互換性**: `tecchanGrowthV2` に旧スキーマ相当のテストデータ（`day:5, hunger:33, friendship:60` 等）を注入した状態でページを再読み込みし、値が壊れずに反映されることを確認

## 6. スクリーンショット確認結果

- 変更前（`assets/monkey-face.webp` 使用時）: 部屋の中心に顔だけの円形画像が浮いている状態で、「全身のてっちゃんが部屋で暮らしている」とは認識できない見た目だった
- 変更後: 全身のてっちゃん（茶色い毛並み・丸い目・ベージュの口元・黒白ボーダー長袖・青いオーバーオール）が部屋の中に立って見え、4つのお世話操作でテーブル／ソファ付近／おもちゃ／ベッドへ実際に移動することを画面キャプチャで確認した
- 360px/390px幅どちらでも、プロフィール・ステータス・吹き出し・サイドメニュー・アクションボタンがスマホ縦1画面に収まり、てっちゃんとメニューが重ならないことを確認（`bedSpot` 調整後）

## 7. 残課題

1. **専用ポーズ素材が未納品**: 座る／食べる／遊ぶ／寝るの専用イラスト（`tecchan-sitting` / `tecchan-eating` / `tecchan-playing` / `tecchan-sleeping`）はまだ提供されておらず、現状は「立ちポーズ1種」を全スポットで使い回している。ポーズ間の行動の違いは移動先・セリフでのみ表現されている。
2. **暫定スプライトの切り出し精度**: `tecchan-standing.webp` はリファレンス画像からのセグメンテーション（GrabCut＋手動補正）による暫定生成であり、実運用のゲーム内表示サイズ（幅150px前後）では目立たないが、拡大表示や別レイアウトで使う場合は縁に微小なノイズが残る可能性がある。将来的に透過済み公式素材へ差し替えることを推奨。
3. **部屋背景素材**: 今回は既存のCSS製の部屋背景をそのまま使用しており、リファレンス画像のような実写風の部屋背景（`room-background`）には未対応。SSOTの家具リストのうち「クローゼット」も未実装（Phase 1Bの完成条件には含まれないため今回は対象外）。
4. **自発行動・AI移動**: SSOTが将来像として挙げている「プレイヤー操作を待たない自発行動（ソファに座る、テレビを見る等）」は本ラウンドの対象外（Phase 1B範囲内での状態遷移のみ）。
