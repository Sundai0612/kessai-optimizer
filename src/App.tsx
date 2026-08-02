import { useEffect, useMemo, useState } from 'react'
import { estimateRewards } from './core/reward'
import type { OwnedPayment, PaymentData, Store } from './core/types'
import { PaymentSettings } from './components/PaymentSettings'
import { RewardList } from './components/RewardList'
import { StoreSearch } from './components/StoreSearch'
import { loadPaymentData } from './lib/loadPaymentData'
import { loadOwnedPayments, saveOwnedPayments } from './lib/ownedStorage'
import { todayString } from './lib/today'
import './App.css'

/** 入力された金額を数値にする。空欄や正しくない入力は「未入力」として扱う。 */
const parseAmount = (text: string): number | undefined => {
  const trimmed = text.trim()
  if (trimmed === '') return undefined

  const value = Number(trimmed)
  return Number.isFinite(value) && value >= 0 ? value : undefined
}

function App() {
  const [data, setData] = useState<PaymentData | undefined>(undefined)
  const [loadError, setLoadError] = useState<string | undefined>(undefined)
  const [owned, setOwned] = useState<OwnedPayment[]>([])
  const [store, setStore] = useState<Store | undefined>(undefined)
  const [amountText, setAmountText] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)

  // 起動時に、還元率データと保存済みの決済手段を読み込む
  useEffect(() => {
    setOwned(loadOwnedPayments())

    loadPaymentData()
      .then(setData)
      .catch((error: unknown) => {
        setLoadError(error instanceof Error ? error.message : 'データを読み込めませんでした')
      })
  }, [])

  const updateOwned = (next: OwnedPayment[]): void => {
    setOwned(next)
    saveOwnedPayments(next)
  }

  const amount = parseAmount(amountText)

  const results = useMemo(() => {
    if (data === undefined || store === undefined) return []

    return estimateRewards(data, {
      storeId: store.id,
      amount,
      owned,
      date: todayString(),
    })
  }, [data, store, amount, owned])

  // 決済手段を1つも選んでいなければ、最初から設定を開いておく
  useEffect(() => {
    if (data !== undefined && owned.length === 0) setSettingsOpen(true)
  }, [data, owned.length])

  if (loadError !== undefined) {
    return (
      <main className="app">
        <section className="card">
          <h2>データを読み込めませんでした</h2>
          <p>{loadError}</p>
          <p className="hint">通信できる状態で、もう一度開き直してください。</p>
        </section>
      </main>
    )
  }

  if (data === undefined) {
    return (
      <main className="app">
        <p className="loading">読み込み中…</p>
      </main>
    )
  }

  return (
    <main className="app">
      <header className="app-header">
        <h1>決済オプティマイザー</h1>
        <p className="app-lead">お店ごとに、どれで払うのがお得かの目安を出します。</p>
      </header>

      <StoreSearch stores={data.stores} selected={store} onSelect={setStore} />

      {store !== undefined && (
        <>
          <section className="card">
            <h2>金額（任意）</h2>
            <p className="hint">
              入れると還元額（円）で比べられます。空欄のままでも還元率で比べられます。
            </p>
            <div className="amount-row">
              <input
                className="text-input"
                type="number"
                inputMode="numeric"
                min="0"
                value={amountText}
                placeholder="例：1500"
                aria-label="金額（円）"
                onChange={(event) => setAmountText(event.target.value)}
              />
              <span className="amount-unit">円</span>
            </div>
          </section>

          <RewardList results={results} cards={data.cards} amount={amount} />
        </>
      )}

      <section className="card settings-toggle">
        <button
          type="button"
          className="link-button"
          aria-expanded={settingsOpen}
          onClick={() => setSettingsOpen(!settingsOpen)}
        >
          {settingsOpen ? '設定を閉じる' : `持っている決済手段を選ぶ（${String(owned.length)}件）`}
        </button>
      </section>

      {settingsOpen && (
        <PaymentSettings cards={data.cards} owned={owned} onChange={updateOwned} />
      )}
    </main>
  )
}

export default App
