# mirage web toolbox

ブラウザで使えるmirageのWebツール集。最初のツールは、Splatoonプリセットページ用のバナーメーカーです。

公開先: https://exatrines.github.io/mirage-web-toolbox/

## バナーメーカー

- 8コンテンツのテンプレート、録画から切り出した52背景と公式コンテンツ画像
- 背景画像の持ち込み、拡大率と上下位置の調整
- タイトル・概要・署名の編集
- プレビューと同じHTML/CSSを1200×630のPNGとして保存

画像と編集内容はブラウザ内で処理します。サーバーへの画像アップロード、アカウント登録、外部APIキーは不要です。標準画像とフォントはこのサイトから読み込みます。

## ローカルで使う

`site` を静的HTTPサーバーで配信してください。例：

```sh
python -m http.server 8769 --directory site
```

`http://localhost:8769/` を開きます。Chrome / EdgeでPNG保存を確認しています。

## 公開と構成

GitHub PagesのSourceを **GitHub Actions** に設定します。`main` へのpushで `.github/workflows/pages.yml` が `site/` を公開します。ビルドは不要です。

- `site/index.html` / `app.css` / `app.js`: ツールの画面、バナーテンプレート、編集・保存処理
- `site/presets.js`: コンテンツ、背景候補、既定の選択
- `site/assets`: 背景画像、署名アイコン、フォント
- `site/vendor`: html-to-image 1.11.13（MIT、ライセンス同梱）

すべて相対パスのため、同じ `site/` をS3 + CloudFrontでも配信できます。現時点ではGitHub Pagesを使用します。

## 既定の背景

| コンテンツ | 録画時刻 |
| --- | --- |
| 絶バハムート | 00:51.5（金色バハムート、暫定） |
| 絶アルテマ | 04:07 |
| 絶アレキサンダー | 02:46 |
| 絶竜詩 | 06:14（05:20も候補に収録） |
| 絶オメガ | 10:30 |
| 絶もうひとつの未来 | 13:28 |
| 絶妖星乱舞 | 14:34 |
| クルーザー級4 | 公式コンテンツ画像 |

## 画像・フォントについて

ゲーム画像の著作権はSQUARE ENIXに帰属します。© SQUARE ENIX
署名アイコンとゲーム画像に、本リポジトリによる追加の再利用許諾は付与しません。
Figtree、M PLUS Rounded 1c、Noto Sans JPのライセンスは `site/assets/fonts/*-OFL.txt` に同梱しています。

実装にはAIの支援を使用しています。
