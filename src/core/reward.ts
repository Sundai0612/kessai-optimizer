/**
 * 還元率・還元額を計算する部分。
 *
 * ここには画面のコードを一切書かない（React・DOM・localStorage を使わない）。
 * データはすべて引数で受け取り、外から読み込んだりしない。
 */
import type {
  Bonus,
  Card,
  PaymentData,
  RewardBreakdown,
  RewardPartResult,
  RewardQuery,
  RewardRate,
  Store,
} from './types'

/**
 * 還元率は「0.1% を 1」とする整数なので、
 * 還元額 = 金額 × rate ÷ 1000 で求まる。（rate 10 = 1.0% → 1000円で10円）
 */
const RATE_SCALE = 1000

/** 優遇の rate を「基本への上乗せ分」に揃える */
const toAddedRate = (bonus: Bonus, card: Card): RewardRate =>
  bonus.rateBasis === 'total' ? Math.max(0, bonus.rate - card.baseRate) : bonus.rate

/** 基準日の時点で有効な優遇か */
const isActiveOn = (bonus: Bonus, date: string): boolean =>
  bonus.period === undefined || (bonus.period.from <= date && date <= bonus.period.to)

/** その優遇がこの店に当てはまるか */
const matchesStore = (bonus: Bonus, store: Store): boolean =>
  bonus.target.kind === 'store'
    ? bonus.target.id === store.id
    : bonus.target.id === store.categoryId

/**
 * 特約店の上乗せを1つだけ選ぶ。
 *
 * 店を名指しした指定が、分類まるごとの指定に勝つ（細かい方が優先）。
 * 同じ強さのものが複数あった場合は、実際より高く見積もらないよう**低い方**を採る。
 * （そもそも重複はデータ検査テストで防いでいるので、これは念のための保険。）
 */
const pickMerchantBonus = (
  bonuses: Bonus[],
  card: Card,
  store: Store,
  date: string,
): Bonus | undefined => {
  const applicable = bonuses.filter(
    (bonus) =>
      bonus.cardId === card.id &&
      bonus.kind === 'merchant' &&
      isActiveOn(bonus, date) &&
      matchesStore(bonus, store),
  )

  const byStore = applicable.filter((bonus) => bonus.target.kind === 'store')
  const pool = byStore.length > 0 ? byStore : applicable

  if (pool.length === 0) return undefined

  return pool.reduce((lowest, bonus) =>
    toAddedRate(bonus, card) < toAddedRate(lowest, card) ? bonus : lowest,
  )
}

/**
 * この項目の還元額を求める。
 *
 * 1円未満は切り捨てる（実際より多く見せないため）。
 * 付与上限があれば上限で頭打ちにする。
 */
const calculatePoints = (
  part: Pick<RewardPartResult, 'rate' | 'cap'>,
  amount: number,
): { points: number; capped: boolean } => {
  const raw = Math.floor((amount * part.rate) / RATE_SCALE)

  if (part.cap === undefined) return { points: raw, capped: false }

  const limited = Math.min(raw, part.cap.maxPoints)
  return { points: limited, capped: limited < raw }
}

/** 1つの決済手段について、内訳を組み立てる */
const buildBreakdown = (
  data: PaymentData,
  card: Card,
  store: Store,
  query: RewardQuery,
  chargeFromCardId: string | undefined,
): RewardBreakdown => {
  const parts: RewardPartResult[] = []

  // 1. 基本還元率（どこで使ってももらえる分）
  parts.push({
    kind: 'base',
    rate: card.baseRate,
    cap: card.cap,
    note: card.note,
    source: card.source,
    capped: false,
  })

  // 2. チャージ分（二重取り）。チャージ元が指定されているときだけ加算する。
  if (chargeFromCardId !== undefined) {
    const charge = card.chargeFrom?.find((entry) => entry.cardId === chargeFromCardId)

    if (charge !== undefined) {
      parts.push({
        kind: 'charge',
        rate: charge.rate,
        cap: charge.cap,
        note: charge.note,
        source: charge.source,
        capped: false,
      })
    }
  }

  // 3. 特約店の上乗せ（最大1つ）
  const merchant = pickMerchantBonus(data.bonuses, card, store, query.date)

  if (merchant !== undefined) {
    parts.push({
      kind: 'merchant',
      rate: toAddedRate(merchant, card),
      cap: merchant.cap,
      note: merchant.note,
      source: merchant.source,
      capped: false,
    })
  }

  // 4. 期間限定イベント（当てはまるものはすべて加算）
  for (const bonus of data.bonuses) {
    const applies =
      bonus.cardId === card.id &&
      bonus.kind === 'campaign' &&
      isActiveOn(bonus, query.date) &&
      matchesStore(bonus, store)

    if (!applies) continue

    parts.push({
      kind: 'campaign',
      rate: toAddedRate(bonus, card),
      cap: bonus.cap,
      note: bonus.note,
      source: bonus.source,
      capped: false,
    })
  }

  const totalRate = parts.reduce((sum, part) => sum + part.rate, 0)

  // 金額が分からないときは、還元額を出さずに率だけで比べる
  if (query.amount === undefined) {
    return {
      cardId: card.id,
      chargeFromCardId,
      parts,
      totalRate,
      capped: false,
      capUnknown: parts.some((part) => part.cap !== undefined),
    }
  }

  const amount = query.amount
  const calculated = parts.map((part) => {
    const { points, capped } = calculatePoints(part, amount)
    return { ...part, points, capped }
  })

  return {
    cardId: card.id,
    chargeFromCardId,
    parts: calculated,
    totalRate,
    totalPoints: calculated.reduce((sum, part) => sum + (part.points ?? 0), 0),
    capped: calculated.some((part) => part.capped),
    capUnknown: false,
  }
}

/**
 * 店と持っている決済手段を渡すと、お得な順に並べて返す。
 *
 * - 金額を指定した場合 → 還元額（円）の高い順
 * - 金額を指定しない場合 → 還元率の高い順（付与上限は反映できないため注意）
 *
 * 見つからない決済手段は、結果から除いて返す（データから消えたカードを
 * 端末に保存し続けている場合があるため、エラーにはしない）。
 *
 * @throws 店舗idがデータに存在しない場合
 */
export const estimateRewards = (data: PaymentData, query: RewardQuery): RewardBreakdown[] => {
  const store = data.stores.find((candidate) => candidate.id === query.storeId)

  if (store === undefined) {
    throw new Error(`店舗id「${query.storeId}」がデータに見つかりません`)
  }

  if (query.amount !== undefined && (!Number.isFinite(query.amount) || query.amount < 0)) {
    throw new Error(`金額「${String(query.amount)}」が正しくありません（0以上の数値が必要です）`)
  }

  const results: RewardBreakdown[] = []

  for (const owned of query.owned) {
    const card = data.cards.find((candidate) => candidate.id === owned.cardId)
    if (card === undefined) continue

    results.push(buildBreakdown(data, card, store, query, owned.chargeFromCardId))
  }

  return results.sort(compareBreakdown)
}

/** お得な順（同点なら決済手段のid順）に並べるための比較 */
const compareBreakdown = (a: RewardBreakdown, b: RewardBreakdown): number => {
  if (a.totalPoints !== undefined && b.totalPoints !== undefined && a.totalPoints !== b.totalPoints) {
    return b.totalPoints - a.totalPoints
  }

  if (a.totalRate !== b.totalRate) return b.totalRate - a.totalRate

  return a.cardId < b.cardId ? -1 : a.cardId > b.cardId ? 1 : 0
}

/**
 * 還元率を「1.0%」のような表示用の文字列にする。
 * 0.1%単位で、四捨五入ではなく切り捨て（実際より高く見せないため）。
 */
export const formatRate = (rate: RewardRate): string => `${(Math.floor(rate) / 10).toFixed(1)}%`
