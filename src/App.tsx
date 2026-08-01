import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [online, setOnline] = useState(navigator.onLine)
  const [installed, setInstalled] = useState(false)

  // ネットにつながっているかどうかを見張る
  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  // ホーム画面から起動されているか（＝アプリとして開いているか）を判定する
  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    const iosStandalone = (
      window.navigator as Navigator & { standalone?: boolean }
    ).standalone
    setInstalled(standalone || iosStandalone === true)
  }, [])

  return (
    <main className="app">
      <header className="app-header">
        <img
          className="app-logo"
          src="./pwa-192x192.png"
          alt=""
          width="72"
          height="72"
        />
        <h1>決済オプティマイザー</h1>
        <p className="app-lead">
          Vite + React + TypeScript の土台ができました。ここから中身を作っていきます。
        </p>
      </header>

      <section className="card">
        <h2>動作チェック</h2>
        <p>ボタンを押して数字が増えれば、画面のしくみは正しく動いています。</p>
        <button
          type="button"
          className="counter"
          onClick={() => setCount((n) => n + 1)}
        >
          押した回数：{count}
        </button>
      </section>

      <section className="card">
        <h2>いまの状態</h2>
        <ul className="status">
          <li>
            <span className={online ? 'badge badge-ok' : 'badge badge-warn'}>
              {online ? 'オンライン' : 'オフライン'}
            </span>
            <span>
              {online
                ? 'ネットにつながっています。'
                : 'ネットがなくても、この画面は表示できています。'}
            </span>
          </li>
          <li>
            <span className={installed ? 'badge badge-ok' : 'badge badge-idle'}>
              {installed ? 'アプリとして起動中' : 'ブラウザで表示中'}
            </span>
            <span>
              {installed
                ? 'ホーム画面から開いています。'
                : '共有ボタン →「ホーム画面に追加」でアプリのように使えます。'}
            </span>
          </li>
        </ul>
      </section>

      <section className="card">
        <h2>次にやること</h2>
        <p>
          <code>src/App.tsx</code> の文章を書きかえると、この画面がそのまま変わります。
        </p>
      </section>
    </main>
  )
}

export default App
