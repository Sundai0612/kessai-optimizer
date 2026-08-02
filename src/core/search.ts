/**
 * 店舗を名前・よみがな・別名から探す部分。
 *
 * ここにも画面のコードは書かない。
 */
import type { Store } from './types'

/** カタカナをひらがなに変える（「セブン」と「せぶん」を同じ扱いにするため） */
const katakanaToHiragana = (text: string): string =>
  text.replace(/[ァ-ヶ]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60))

/**
 * 比較用に文字を揃える。
 * 大文字小文字・全角半角の空白の違いで見つからなくなるのを防ぐ。
 */
const normalize = (text: string): string =>
  katakanaToHiragana(text.trim().toLowerCase()).replace(/[\s　ー・]/g, '')

/**
 * 濁点・半濁点を取り除く。
 * 「はまずし」を「すし」で探せるようにするため（連濁で読みが変わる店名が多い）。
 */
const stripDakuten = (text: string): string =>
  text.normalize('NFD').replace(/[゙゚]/g, '').normalize('NFC')

/** 1つの店について、検索に使う文字列をすべて集める */
const keysOf = (store: Store): string[] => [
  store.name,
  store.kana,
  ...store.aliases.flatMap((alias) => [alias.name, alias.kana]),
]

/**
 * 一致の強さ。小さいほど上に出す。
 * 0 = 先頭から一致（「せぶん」→「せぶんいれぶん」）
 * 1 = 濁点を無視すれば先頭から一致
 * 2 = 途中に含まれる（「いれぶん」→「せぶんいれぶん」）
 * 3 = 濁点を無視すれば途中に含まれる（「すし」→「はまずし」）
 * 該当なしは undefined
 */
const matchScore = (store: Store, query: string): number | undefined => {
  const looseQuery = stripDakuten(query)
  let best: number | undefined

  const consider = (score: number): void => {
    if (best === undefined || score < best) best = score
  }

  for (const key of keysOf(store)) {
    const normalized = normalize(key)
    const loose = stripDakuten(normalized)

    if (normalized.startsWith(query)) return 0
    if (loose.startsWith(looseQuery)) consider(1)
    else if (normalized.includes(query)) consider(2)
    else if (loose.includes(looseQuery)) consider(3)
  }

  return best
}

/**
 * 店舗を探す。入力の途中でも候補を出す（予測検索）。
 *
 * ひらがな・カタカナ・漢字・別名のいずれでも当たる。
 * 「せぶん」でも「セブン」でも「セブンイレブン」に当たる。
 *
 * @param limit 返す件数の上限
 */
export const searchStores = (stores: Store[], query: string, limit = 10): Store[] => {
  const normalized = normalize(query)

  if (normalized.length === 0) return []

  return stores
    .map((store) => ({ store, score: matchScore(store, normalized) }))
    .filter((entry): entry is { store: Store; score: number } => entry.score !== undefined)
    .sort((a, b) => a.score - b.score || (a.store.name < b.store.name ? -1 : 1))
    .slice(0, limit)
    .map((entry) => entry.store)
}
