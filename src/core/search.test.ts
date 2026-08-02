/**
 * 店舗検索が正しく動くかを確かめるテスト。
 */
import { describe, expect, it } from 'vitest'
import { searchStores } from './search'
import type { Store } from './types'

const source = { url: 'https://example.com/', checkedOn: '2026-08-01' }

const stores: Store[] = [
  {
    id: 'seven-eleven',
    name: 'セブンイレブン',
    kana: 'せぶんいれぶん',
    aliases: [
      { name: 'セブン', kana: 'せぶん' },
      { name: '7-11', kana: 'せぶんいれぶん' },
    ],
    categoryId: 'convenience',
    source,
  },
  {
    id: 'familymart',
    name: 'ファミリーマート',
    kana: 'ふぁみりーまーと',
    aliases: [{ name: 'ファミマ', kana: 'ふぁみま' }],
    categoryId: 'convenience',
    source,
  },
  {
    id: 'matsumotokiyoshi',
    name: 'マツモトキヨシ',
    kana: 'まつもときよし',
    aliases: [{ name: 'マツキヨ', kana: 'まつきよ' }],
    categoryId: 'drugstore',
    source,
  },
]

const idsFor = (query: string): string[] =>
  searchStores(stores, query).map((store) => store.id)

describe('かなでの予測検索', () => {
  it('ひらがなの途中まででも候補が出る', () => {
    expect(idsFor('せ')).toEqual(['seven-eleven'])
    expect(idsFor('せぶん')).toEqual(['seven-eleven'])
    expect(idsFor('せぶんいれ')).toEqual(['seven-eleven'])
  })

  it('カタカナで入力しても当たる', () => {
    expect(idsFor('セブン')).toEqual(['seven-eleven'])
    expect(idsFor('マツキヨ')).toEqual(['matsumotokiyoshi'])
  })

  it('正式名称のよみがなでも別名のよみがなでも当たる', () => {
    expect(idsFor('ふぁみりー')).toEqual(['familymart'])
    expect(idsFor('ふぁみま')).toEqual(['familymart'])
  })

  it('複数の店が当たる場合はまとめて返す', () => {
    // 「ふぁみ」は「ふぁみりーまーと」「ふぁみま」の両方の先頭に一致する
    expect(idsFor('ふぁみ')).toEqual(['familymart'])
  })
})

describe('かな以外での検索', () => {
  it('正式名称そのままで当たる', () => {
    expect(idsFor('セブンイレブン')).toEqual(['seven-eleven'])
  })

  it('別名の表記で当たる', () => {
    expect(idsFor('ファミマ')).toEqual(['familymart'])
  })

  it('数字を含む別名でも当たる', () => {
    expect(idsFor('7-11')).toEqual(['seven-eleven'])
  })
})

describe('並び順', () => {
  it('先頭から一致した店が、途中で一致した店より上に出る', () => {
    const localStores: Store[] = [
      { id: 'b-mart', name: 'いれぶんストア', kana: 'いれぶんすとあ', aliases: [], categoryId: 'convenience', source },
      ...stores,
    ]

    // 「いれぶん」は「いれぶんすとあ」の先頭、「せぶんいれぶん」の途中に一致する
    const ids = searchStores(localStores, 'いれぶん').map((store) => store.id)
    expect(ids).toEqual(['b-mart', 'seven-eleven'])
  })
})

describe('入力のゆらぎ', () => {
  it('前後の空白は無視する', () => {
    expect(idsFor('  せぶん  ')).toEqual(['seven-eleven'])
  })

  it('中黒や長音の違いを無視する', () => {
    expect(idsFor('ふぁみりーまーと')).toEqual(['familymart'])
    expect(idsFor('ふぁみりまと')).toEqual(['familymart'])
  })

  it('英字の大文字小文字を区別しない', () => {
    const localStores: Store[] = [
      { id: 'aeon', name: 'AEON', kana: 'いおん', aliases: [], categoryId: 'convenience', source },
    ]

    expect(searchStores(localStores, 'aeon')).toHaveLength(1)
    expect(searchStores(localStores, 'AEON')).toHaveLength(1)
  })
})

describe('候補が無い場合', () => {
  it('空の入力では何も返さない', () => {
    expect(searchStores(stores, '')).toEqual([])
    expect(searchStores(stores, '   ')).toEqual([])
  })

  it('当てはまらない入力では何も返さない', () => {
    expect(searchStores(stores, 'ぜんぜんちがうみせ')).toEqual([])
  })
})

describe('件数の上限', () => {
  it('指定した件数までしか返さない', () => {
    const many: Store[] = Array.from({ length: 30 }, (_, index) => ({
      id: `store-${index}`,
      name: `あ商店${index}`,
      kana: `あしょうてん${index}`,
      aliases: [],
      categoryId: 'convenience',
      source,
    }))

    expect(searchStores(many, 'あ')).toHaveLength(10)
    expect(searchStores(many, 'あ', 3)).toHaveLength(3)
  })
})
