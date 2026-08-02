/**
 * public/data/ のJSONを読み込む部分。
 *
 * 通信するのは同じ端末に置かれたこのファイルだけ。外部のサーバーには一切送らない。
 * この処理は src/core/ の外に置く（core をブラウザから切り離しておくため）。
 */
import type { BonusesFile, CardsFile, PaymentData, StoresFile } from '../core/types'

/** GitHub Pages では '/kessai-optimizer/' になる */
const base = import.meta.env.BASE_URL

const fetchJson = async <T>(fileName: string): Promise<T> => {
  const response = await fetch(`${base}data/${fileName}`)

  if (!response.ok) {
    throw new Error(`${fileName} を読み込めませんでした（${String(response.status)}）`)
  }

  return (await response.json()) as T
}

export const loadPaymentData = async (): Promise<PaymentData> => {
  const [cardsFile, storesFile, bonusesFile] = await Promise.all([
    fetchJson<CardsFile>('cards.json'),
    fetchJson<StoresFile>('stores.json'),
    fetchJson<BonusesFile>('bonuses.json'),
  ])

  return {
    cards: cardsFile.cards,
    categories: storesFile.categories,
    stores: storesFile.stores,
    bonuses: bonusesFile.bonuses,
  }
}
