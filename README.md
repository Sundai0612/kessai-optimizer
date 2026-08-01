# 決済オプティマイザー（kessai-optimizer）

支払い方法をかしこく選ぶためのアプリです。まだ土台だけの状態で、これから中身を作っていきます。

スマホやiPadの「ホーム画面に追加」で、ふつうのアプリのように使えるようになっています（PWA）。

## このリポジトリに入っているもの

| 場所 | 中身 |
| --- | --- |
| `index.html` | ページの入れ物。タイトルやアイコンの指定 |
| `src/App.tsx` | 画面に出る文字やボタン。**ふだん直すのはここ** |
| `src/App.css` | 画面の見た目（色・余白・角の丸みなど） |
| `src/index.css` | 全体で共通の色や文字の設定 |
| `vite.config.ts` | 全体の設定。ホーム画面用のアイコンやアプリ名もここ |
| `public/` | アイコン画像 |
| `.github/workflows/deploy.yml` | GitHub Pages へ自動で公開するための手順書 |

## インターネットに公開する（初回だけの設定）

このリポジトリの **Settings → Pages** を開き、**Source** を **GitHub Actions** に変えて保存します。

そのあと `main` ブランチに変更が入るたび、自動でビルドされて次のURLで公開されます。

```
https://sundai0612.github.io/kessai-optimizer/
```

（反映まで1〜2分ほどかかります。うまくいったかは **Actions** タブで確認できます。）

## ホーム画面に追加する

- **iPhone / iPad（Safari）**: 上記URLを開く → 共有ボタン → 「ホーム画面に追加」
- **Android（Chrome）**: 上記URLを開く → メニュー → 「アプリをインストール」

追加したアイコンから開くと、ブラウザのアドレスバーが消えてアプリらしい見た目になります。一度開いたあとは、電波がないところでも画面が表示されます。

## パソコンで動かす場合（参考）

```bash
npm install     # 必要な部品をそろえる（最初の一回だけ）
npm run dev     # 手元で動かして確認する
npm run build   # 公開用に書き出す
npm run preview # 書き出したものを確認する
```

## 使っている技術

Vite 8 / React 19 / TypeScript 6 / vite-plugin-pwa
