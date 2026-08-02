/**
 * public/data/ 配下のJSONが、types.ts で決めた形どおりに書けているかを確かめるテスト。
 *
 * データを手で書き足したときの typo（打ち間違い）や書き忘れを、ここで自動的に見つける。
 * 「存在しないカードidを指している」といった食い違いも検出する。
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { BonusesFile, Cap, CardsFile, Source, StoresFile } from './types'

const read = <T>(name: string): T =>
  JSON.parse(readFileSync(new URL(`../../public/data/${name}`, import.meta.url), 'utf-8')) as T

const cardsFile = read<CardsFile>('cards.json')
const storesFile = read<StoresFile>('stores.json')
const bonusesFile = read<BonusesFile>('bonuses.json')

/** '2026-08-02' の形式で、実在する日付か */
const isValidDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value)
}

/** ひらがな・長音符・空白だけでできているか */
const isHiragana = (value: string): boolean => /^[ぁ-ゖー　 ]+$/.test(value)

const expectValidSource = (source: Source, where: string): void => {
  expect(source.url, `${where} の出典URL`).toMatch(/^https:\/\/\S+$/)
  expect(isValidDate(source.checkedOn), `${where} の最終確認日「${source.checkedOn}」`).toBe(true)
}

const expectValidCap = (cap: Cap | undefined, where: string): void => {
  if (cap === undefined) return
  expect(cap.period, `${where} の上限の期間`).toBe('month')
  expect(Number.isInteger(cap.maxPoints), `${where} の上限ポイント`).toBe(true)
  expect(cap.maxPoints, `${where} の上限ポイント`).toBeGreaterThan(0)
}

const cardIds = new Set(cardsFile.cards.map((card) => card.id))
const storeIds = new Set(storesFile.stores.map((store) => store.id))
const categoryIds = new Set(storesFile.categories.map((category) => category.id))

describe('カード名簿（cards.json）', () => {
  it('idが重複していない', () => {
    expect(cardIds.size).toBe(cardsFile.cards.length)
  })

  it('すべてのカードが必要な項目を正しく持っている', () => {
    expect(cardsFile.cards.length).toBeGreaterThan(0)

    for (const card of cardsFile.cards) {
      const where = `カード「${card.name}」`

      expect(card.id, `${where} のid`).toMatch(/^[a-z0-9-]+$/)
      expect(card.name.length, `${where} の名前`).toBeGreaterThan(0)
      expect(isHiragana(card.kana), `${where} のよみがな「${card.kana}」`).toBe(true)
      expect(['credit', 'code', 'prepaid'], `${where} の種類`).toContain(card.kind)

      // 還元率は「0.1%を1とする整数」。小数が紛れ込んでいないか確かめる。
      expect(Number.isInteger(card.baseRate), `${where} の基本還元率`).toBe(true)
      expect(card.baseRate, `${where} の基本還元率`).toBeGreaterThanOrEqual(0)

      expectValidCap(card.cap, where)
      expectValidSource(card.source, where)
    }
  })

  it('チャージ元が実在するカードを指している', () => {
    for (const card of cardsFile.cards) {
      for (const charge of card.chargeFrom ?? []) {
        const where = `カード「${card.name}」のチャージ元`

        expect(cardIds, `${where}「${charge.cardId}」`).toContain(charge.cardId)
        expect(charge.cardId, `${where}`).not.toBe(card.id)
        expect(Number.isInteger(charge.rate), `${where} の還元率`).toBe(true)
        expect(charge.rate, `${where} の還元率`).toBeGreaterThanOrEqual(0)

        expectValidCap(charge.cap, where)
        expectValidSource(charge.source, where)
      }
    }
  })

  it('チャージ元を持つのはコード決済とプリペイドだけ', () => {
    for (const card of cardsFile.cards) {
      if (card.chargeFrom === undefined) continue
      expect(['code', 'prepaid'], `カード「${card.name}」の種類`).toContain(card.kind)
    }
  })
})

describe('店舗名簿（stores.json）', () => {
  it('idが重複していない', () => {
    expect(storeIds.size).toBe(storesFile.stores.length)
    expect(categoryIds.size).toBe(storesFile.categories.length)
  })

  it('すべての分類が必要な項目を正しく持っている', () => {
    expect(storesFile.categories.length).toBeGreaterThan(0)

    for (const category of storesFile.categories) {
      expect(category.id, `分類「${category.name}」のid`).toMatch(/^[a-z0-9-]+$/)
      expect(
        isHiragana(category.kana),
        `分類「${category.name}」のよみがな「${category.kana}」`,
      ).toBe(true)
    }
  })

  it('すべての店舗が必要な項目を正しく持っている', () => {
    expect(storesFile.stores.length).toBeGreaterThan(0)

    for (const store of storesFile.stores) {
      const where = `店舗「${store.name}」`

      expect(store.id, `${where} のid`).toMatch(/^[a-z0-9-]+$/)
      expect(store.name.length, `${where} の名前`).toBeGreaterThan(0)
      expect(isHiragana(store.kana), `${where} のよみがな「${store.kana}」`).toBe(true)
      expect(categoryIds, `${where} の分類「${store.categoryId}」`).toContain(store.categoryId)
      expectValidSource(store.source, where)
    }
  })

  it('別名にもよみがなが付いている', () => {
    for (const store of storesFile.stores) {
      for (const alias of store.aliases) {
        const where = `店舗「${store.name}」の別名「${alias.name}」`

        expect(alias.name.length, `${where}`).toBeGreaterThan(0)
        expect(isHiragana(alias.kana), `${where} のよみがな「${alias.kana}」`).toBe(true)
      }
    }
  })
})

describe('優遇情報（bonuses.json）', () => {
  it('すべての優遇が必要な項目を正しく持っている', () => {
    expect(bonusesFile.bonuses.length).toBeGreaterThan(0)

    for (const bonus of bonusesFile.bonuses) {
      const where = `優遇（${bonus.cardId} × ${bonus.target.kind}:${bonus.target.id}）`

      expect(cardIds, `${where} のカードid`).toContain(bonus.cardId)
      expect(Number.isInteger(bonus.rate), `${where} の還元率`).toBe(true)
      expect(bonus.rate, `${where} の還元率`).toBeGreaterThanOrEqual(0)

      expectValidCap(bonus.cap, where)
      expectValidSource(bonus.source, where)
    }
  })

  it('優遇の対象が実在する店舗・分類を指している', () => {
    for (const bonus of bonusesFile.bonuses) {
      const where = `優遇（${bonus.cardId}）の対象`

      if (bonus.target.kind === 'store') {
        expect(storeIds, `${where}「${bonus.target.id}」`).toContain(bonus.target.id)
      } else {
        expect(categoryIds, `${where}「${bonus.target.id}」`).toContain(bonus.target.id)
      }
    }
  })

  it('期間の指定が正しい（開始日が終了日より後になっていない）', () => {
    for (const bonus of bonusesFile.bonuses) {
      if (bonus.period === undefined) continue
      const where = `優遇（${bonus.cardId}）の期間`

      expect(isValidDate(bonus.period.from), `${where} の開始日「${bonus.period.from}」`).toBe(true)
      expect(isValidDate(bonus.period.to), `${where} の終了日「${bonus.period.to}」`).toBe(true)
      expect(bonus.period.from <= bonus.period.to, `${where}`).toBe(true)
    }
  })

  it('同じカード・同じ対象の優遇が重複していない', () => {
    const seen = new Set<string>()

    for (const bonus of bonusesFile.bonuses) {
      // 期間限定は同じ対象に複数あってよいので、常時有効なものだけを見る
      if (bonus.period !== undefined) continue

      const key = `${bonus.cardId}|${bonus.target.kind}|${bonus.target.id}`
      expect(seen, `優遇の重複（${key}）`).not.toContain(key)
      seen.add(key)
    }
  })
})
