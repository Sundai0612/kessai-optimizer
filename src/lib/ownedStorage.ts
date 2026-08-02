/**
 * 持っている決済手段を、この端末の中だけに保存する部分。
 *
 * localStorage はブラウザが用意している保管場所で、外部には送られない。
 * この処理も src/core/ の外に置く。
 */
import type { OwnedPayment } from '../core/types'

const STORAGE_KEY = 'kessai-optimizer/owned-payments'

/** 保存されている決済手段を読み出す。壊れていた場合は空として扱う。 */
export const loadOwnedPayments = (): OwnedPayment[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === null) return []

    const parsed: unknown = JSON.parse(saved)
    if (!Array.isArray(parsed)) return []

    return parsed.filter(
      (entry): entry is OwnedPayment =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as OwnedPayment).cardId === 'string',
    )
  } catch {
    // 保存領域が使えない場合（プライベートブラウズなど）でも動き続ける
    return []
  }
}

/** 持っている決済手段を保存する。 */
export const saveOwnedPayments = (owned: OwnedPayment[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(owned))
  } catch {
    // 保存できなくても表示は続ける
  }
}
