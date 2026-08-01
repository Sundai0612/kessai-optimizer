import { useState } from 'react'
import { UpdateNotice } from './UpdateNotice'
import './App.css'

export default function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <main className="app">
        <header className="app__header">
          <img
            className="app__logo"
            src={`${import.meta.env.BASE_URL}pwa-192x192.png`}
            alt=""
          />
          <div>
            <h1 className="app__title">Kessai Optimizer</h1>
            <p className="app__subtitle">Vite + React + TypeScript / PWA 対応</p>
          </div>
        </header>

        <section className="card">
          <h2 className="card__title">準備ができました</h2>
          <p>
            この画面が見えていれば、アプリの土台は正しく動いています。ここから中身を作っていけます。
          </p>
          <div className="counter">
            <button className="counter__button" onClick={() => setCount(count + 1)}>
              タップしてみる
            </button>
            <span className="counter__value">押した回数: {count} 回</span>
          </div>
        </section>

        <section className="card">
          <h2 className="card__title">ホーム画面に追加する</h2>
          <p>アプリのように、アイコンから開けるようになります。</p>
          <ol>
            <li>Safari でこのページを開く</li>
            <li>画面の共有ボタン（四角に上向きの矢印）を押す</li>
            <li>「ホーム画面に追加」を選ぶ</li>
          </ol>
        </section>

        <section className="card">
          <h2 className="card__title">画面を作るときは</h2>
          <p>
            見た目や文章は <code>src/App.tsx</code>、色や余白は <code>src/App.css</code>{' '}
            を書き換えます。保存すると表示もすぐに切り替わります。
          </p>
        </section>
      </main>

      <UpdateNotice />
    </>
  )
}
