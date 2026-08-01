# kessai-optimizer

Vite + React + TypeScript で作ったアプリの土台です。
PWA に対応しているので、スマホやタブレットのホーム画面に追加してアプリのように使えます。

## これは何が入っているの？

| 名前 | 役割 |
| --- | --- |
| Vite | 書いたものを画面にすばやく表示してくれる道具 |
| React | 画面の部品を組み立てるための道具 |
| TypeScript | 書き間違いを事前に教えてくれる道具 |
| PWA | ホーム画面に追加でき、通信が不安定でも開けるようにする仕組み |

## ファイルの見どころ

| 場所 | 何が書いてあるか |
| --- | --- |
| `src/App.tsx` | 画面に出る文字やボタン |
| `src/App.css` | 見た目（色・余白・角の丸み） |
| `src/UpdateNotice.tsx` | 「新しい版があります」のお知らせ |
| `index.html` | ページの題名やアイコンの指定 |
| `vite.config.ts` | アプリ名やアイコンなど PWA の設定 |
| `public/` | アイコン画像 |

## 動かすときのコマンド

```bash
npm install     # 最初の1回だけ。必要な部品を用意する
npm run dev     # 作りながら画面を確認する
npm run build   # 公開用に書き出す
npm run preview # 書き出したものを確認する
npm run lint    # 書き方の間違いを探す
```

## ホーム画面に追加する（iPhone / iPad）

1. Safari で公開されたページを開く
2. 画面の共有ボタン（四角に上向きの矢印）を押す
3. 「ホーム画面に追加」を選ぶ

> ホーム画面への追加は、`https://` で公開されたページでのみできます。
> `npm run dev` の `localhost` でも動作確認はできます。

## インターネットに公開する

`main` ブランチが更新されると、GitHub Actions が自動で GitHub Pages に公開します
（`.github/workflows/deploy.yml`）。

**最初の1回だけ、次の設定が必要です。**

1. GitHub のリポジトリで **Settings** を開く
2. 左のメニューから **Pages** を選ぶ
3. **Source** を **GitHub Actions** に変える

公開先はこちらになります。

```
https://<ユーザー名>.github.io/kessai-optimizer/
```

## アイコンを作り直す

`public/` のアイコン画像は、次のコマンドで作り直せます。
色や形は `scripts/generate-icons.mjs` の中で変えられます。

```bash
node scripts/generate-icons.mjs
```
