/**
 * 還元率・還元額の計算が正しいかを確かめるテスト。
 *
 * ここで使うデータは、計算のしかたを確かめるための架空のものです。
 * 実在のカードや店の還元率ではありません（public/data/ のJSONとは別物）。
 */
import { describe, expect, it } from 'vitest'
import { estimateRewards, formatRate } from './reward'
import type { PaymentData, RewardBreakdown } from './types'

const source = { url: 'https://example.com/', checkedOn: '2026-08-01' }

/** 計算の確認用の架空データ */
const data: PaymentData = {
  categories: [
    { id: 'convenience', name: 'コンビニ', kana: 'こんびに' },
    { id: 'drugstore', name: 'ドラッグストア', kana: 'どらっぐすとあ' },
  ],
  stores: [
    { id: 'store-a', name: 'A商店', kana: 'えーしょうてん', aliases: [], categoryId: 'convenience', source },
    { id: 'store-b', name: 'B商店', kana: 'びーしょうてん', aliases: [], categoryId: 'convenience', source },
    { id: 'store-c', name: 'C薬局', kana: 'しーやっきょく', aliases: [], categoryId: 'drugstore', source },
  ],
  cards: [
    // 基本1.0%のクレジットカード
    { id: 'plain-card', name: '素のカード', kana: 'すのかーど', kind: 'credit', baseRate: 10, source },
    // 基本0.5%。チャージ元になるカード
    { id: 'charge-card', name: 'チャージ元カード', kana: 'ちゃーじもとかーど', kind: 'credit', baseRate: 5, source },
    // 基本0.5%のコード決済。チャージ元カードからのチャージで0.5%
    {
      id: 'code-pay',
      name: 'コード決済',
      kana: 'こーどけっさい',
      kind: 'code',
      baseRate: 5,
      chargeFrom: [{ cardId: 'charge-card', rate: 5, source }],
      source,
    },
    // 基本0.5%だが、基本にも月100円の上限があるカード
    { id: 'capped-card', name: '上限つきカード', kana: 'じょうげんつきかーど', kind: 'credit', baseRate: 5, cap: { period: 'month', maxPoints: 100 }, source },
  ],
  bonuses: [
    // 分類まるごと（コンビニ）で +1.0%
    { cardId: 'plain-card', target: { kind: 'category', id: 'convenience' }, kind: 'merchant', rateBasis: 'add', rate: 10, source },
    // A商店を名指しで +3.0%（上の分類指定より優先されるはず）
    { cardId: 'plain-card', target: { kind: 'store', id: 'store-a' }, kind: 'merchant', rateBasis: 'add', rate: 30, source },
    // 合計での書き方。基本0.5% + 上乗せ2.5% = 合計3.0%
    { cardId: 'charge-card', target: { kind: 'store', id: 'store-a' }, kind: 'merchant', rateBasis: 'total', rate: 30, source },
    // 期間限定イベント +2.0%
    {
      cardId: 'code-pay',
      target: { kind: 'store', id: 'store-a' },
      kind: 'campaign',
      rateBasis: 'add',
      rate: 20,
      period: { from: '2026-08-01', to: '2026-08-31' },
      source,
    },
    // 上限つきの特約店上乗せ +5.0%（月200円まで）
    {
      cardId: 'capped-card',
      target: { kind: 'store', id: 'store-a' },
      kind: 'merchant',
      rateBasis: 'add',
      rate: 50,
      cap: { period: 'month', maxPoints: 200 },
      source,
    },
  ],
}

const during = '2026-08-15'
const after = '2026-09-15'

/** 結果から1件を取り出す */
const pick = (results: RewardBreakdown[], cardId: string): RewardBreakdown => {
  const found = results.find((result) => result.cardId === cardId)
  if (found === undefined) throw new Error(`結果に ${cardId} がありません`)
  return found
}

/** 内訳を「種類:率」の一覧にする（見比べやすくするため） */
const partsOf = (result: RewardBreakdown): string[] =>
  result.parts.map((part) => `${part.kind}:${part.rate}`)

describe('基本還元率だけの場合', () => {
  it('優遇のない店では、基本還元率がそのまま合計になる', () => {
    const results = estimateRewards(data, {
      storeId: 'store-c',
      owned: [{ cardId: 'plain-card' }],
      date: during,
    })

    expect(results).toHaveLength(1)
    expect(results[0].totalRate).toBe(10)
    expect(partsOf(results[0])).toEqual(['base:10'])
  })
})

describe('特約店の上乗せ', () => {
  it('分類まるごとの指定が、その分類の店に効く', () => {
    const results = estimateRewards(data, {
      storeId: 'store-b',
      owned: [{ cardId: 'plain-card' }],
      date: during,
    })

    // 基本1.0% + コンビニ1.0% = 2.0%
    expect(partsOf(results[0])).toEqual(['base:10', 'merchant:10'])
    expect(results[0].totalRate).toBe(20)
  })

  it('店を名指しした指定が、分類の指定に勝つ（両方は足さない）', () => {
    const results = estimateRewards(data, {
      storeId: 'store-a',
      owned: [{ cardId: 'plain-card' }],
      date: during,
    })

    // 基本1.0% + A商店3.0% = 4.0%。分類の1.0%は加算されない。
    expect(partsOf(results[0])).toEqual(['base:10', 'merchant:30'])
    expect(results[0].totalRate).toBe(40)
  })

  it('合計で書かれた優遇は、基本を二重に数えない', () => {
    const results = estimateRewards(data, {
      storeId: 'store-a',
      owned: [{ cardId: 'charge-card' }],
      date: during,
    })

    // 「合計3.0%（基本0.5%含む）」なので、上乗せ分は2.5%。合計は3.0%のまま。
    expect(partsOf(results[0])).toEqual(['base:5', 'merchant:25'])
    expect(results[0].totalRate).toBe(30)
  })
})

describe('期間限定イベント', () => {
  it('期間内なら加算される', () => {
    const results = estimateRewards(data, {
      storeId: 'store-a',
      owned: [{ cardId: 'code-pay' }],
      date: during,
    })

    // 基本0.5% + イベント2.0% = 2.5%
    expect(partsOf(results[0])).toEqual(['base:5', 'campaign:20'])
    expect(results[0].totalRate).toBe(25)
  })

  it('期間が過ぎていれば加算されない', () => {
    const results = estimateRewards(data, {
      storeId: 'store-a',
      owned: [{ cardId: 'code-pay' }],
      date: after,
    })

    expect(partsOf(results[0])).toEqual(['base:5'])
    expect(results[0].totalRate).toBe(5)
  })

  it('期間の初日と最終日は「期間内」として扱う', () => {
    const first = estimateRewards(data, {
      storeId: 'store-a',
      owned: [{ cardId: 'code-pay' }],
      date: '2026-08-01',
    })
    const last = estimateRewards(data, {
      storeId: 'store-a',
      owned: [{ cardId: 'code-pay' }],
      date: '2026-08-31',
    })

    expect(first[0].totalRate).toBe(25)
    expect(last[0].totalRate).toBe(25)
  })
})

describe('二重取り（コード決済＋チャージ元カード）', () => {
  it('チャージ元を指定すると、チャージ分が加算される', () => {
    const results = estimateRewards(data, {
      storeId: 'store-a',
      owned: [{ cardId: 'code-pay', chargeFromCardId: 'charge-card' }],
      date: during,
    })

    // 基本0.5% + チャージ0.5% + イベント2.0% = 3.0%
    expect(partsOf(results[0])).toEqual(['base:5', 'charge:5', 'campaign:20'])
    expect(results[0].totalRate).toBe(30)
  })

  it('チャージ元を指定しなければ、チャージ分は加算しない', () => {
    const results = estimateRewards(data, {
      storeId: 'store-a',
      owned: [{ cardId: 'code-pay' }],
      date: during,
    })

    expect(partsOf(results[0])).not.toContain('charge:5')
    expect(results[0].totalRate).toBe(25)
  })

  it('チャージで還元がないカードを指定した場合は加算しない', () => {
    const results = estimateRewards(data, {
      storeId: 'store-a',
      owned: [{ cardId: 'code-pay', chargeFromCardId: 'plain-card' }],
      date: during,
    })

    // 'plain-card' は code-pay の chargeFrom に載っていない
    expect(partsOf(results[0])).toEqual(['base:5', 'campaign:20'])
  })
})

describe('金額を指定したときの還元額', () => {
  it('還元額を計算する', () => {
    const results = estimateRewards(data, {
      storeId: 'store-a',
      amount: 1000,
      owned: [{ cardId: 'code-pay', chargeFromCardId: 'charge-card' }],
      date: during,
    })

    // 1000円 × 3.0% = 30円（基本5円 + チャージ5円 + イベント20円）
    expect(results[0].totalPoints).toBe(30)
    expect(results[0].parts.map((part) => part.points)).toEqual([5, 5, 20])
  })

  it('1円未満は切り捨てる（多く見せない）', () => {
    const results = estimateRewards(data, {
      storeId: 'store-c',
      amount: 199,
      owned: [{ cardId: 'plain-card' }],
      date: during,
    })

    // 199円 × 1.0% = 1.99円 → 1円
    expect(results[0].totalPoints).toBe(1)
  })

  it('金額0円なら還元額も0円', () => {
    const results = estimateRewards(data, {
      storeId: 'store-a',
      amount: 0,
      owned: [{ cardId: 'plain-card' }],
      date: during,
    })

    expect(results[0].totalPoints).toBe(0)
  })
})

describe('付与上限', () => {
  it('上限を超える場合は上限で頭打ちにする', () => {
    const results = estimateRewards(data, {
      storeId: 'store-a',
      amount: 100000,
      owned: [{ cardId: 'capped-card' }],
      date: during,
    })

    const result = results[0]
    // 基本0.5% → 500円だが上限100円。特約店5.0% → 5000円だが上限200円。
    expect(result.parts.map((part) => part.points)).toEqual([100, 200])
    expect(result.totalPoints).toBe(300)
    expect(result.capped).toBe(true)
  })

  it('上限に届かない場合はそのままの金額', () => {
    const results = estimateRewards(data, {
      storeId: 'store-a',
      amount: 1000,
      owned: [{ cardId: 'capped-card' }],
      date: during,
    })

    // 基本5円、特約店50円。どちらも上限内。
    expect(results[0].totalPoints).toBe(55)
    expect(results[0].capped).toBe(false)
  })

  it('上限で頭打ちになった項目だけに印が付く', () => {
    const results = estimateRewards(data, {
      storeId: 'store-a',
      amount: 30000,
      owned: [{ cardId: 'capped-card' }],
      date: during,
    })

    // 基本0.5% → 150円で上限100円を超える。特約店5.0% → 1500円で上限200円を超える。
    expect(results[0].parts.map((part) => part.capped)).toEqual([true, true])
  })
})

describe('金額が未入力の場合', () => {
  it('還元額は出さず、還元率だけで順位をつける', () => {
    const results = estimateRewards(data, {
      storeId: 'store-a',
      owned: [{ cardId: 'capped-card' }, { cardId: 'plain-card' }],
      date: during,
    })

    // 上限つきカードは率だけなら5.5%、素のカードは4.0%
    expect(results.map((result) => result.cardId)).toEqual(['capped-card', 'plain-card'])
    expect(results[0].totalPoints).toBeUndefined()
    expect(results[0].parts.every((part) => part.points === undefined)).toBe(true)
  })

  it('上限が反映できていないことを印で示す', () => {
    const results = estimateRewards(data, {
      storeId: 'store-a',
      owned: [{ cardId: 'capped-card' }, { cardId: 'plain-card' }],
      date: during,
    })

    // 上限つきカードは上限があるので印が付く。素のカードには上限がないので付かない。
    expect(pick(results, 'capped-card').capUnknown).toBe(true)
    expect(pick(results, 'plain-card').capUnknown).toBe(false)
  })

  it('金額を入れると順位が入れ替わることがある', () => {
    const withoutAmount = estimateRewards(data, {
      storeId: 'store-a',
      owned: [{ cardId: 'capped-card' }, { cardId: 'plain-card' }],
      date: during,
    })
    const withAmount = estimateRewards(data, {
      storeId: 'store-a',
      amount: 100000,
      owned: [{ cardId: 'capped-card' }, { cardId: 'plain-card' }],
      date: during,
    })

    // 率では上限つきカードが上。しかし10万円では上限に当たり300円しかもらえず、
    // 素のカード（4.0% = 4000円）に逆転される。
    expect(withoutAmount[0].cardId).toBe('capped-card')
    expect(withAmount[0].cardId).toBe('plain-card')
    expect(pick(withAmount, 'plain-card').totalPoints).toBe(4000)
    expect(pick(withAmount, 'capped-card').totalPoints).toBe(300)
  })
})

describe('並び順', () => {
  it('金額を指定した場合、還元額の高い順に並ぶ', () => {
    const results = estimateRewards(data, {
      storeId: 'store-a',
      amount: 10000,
      owned: [
        { cardId: 'charge-card' },
        { cardId: 'plain-card' },
        { cardId: 'code-pay', chargeFromCardId: 'charge-card' },
      ],
      date: during,
    })

    const points = results.map((result) => result.totalPoints ?? 0)
    expect(points).toEqual([...points].sort((a, b) => b - a))
    expect(results[0].cardId).toBe('plain-card')
  })

  it('金額を指定しない場合、還元率の高い順に並ぶ', () => {
    const results = estimateRewards(data, {
      storeId: 'store-a',
      owned: [{ cardId: 'charge-card' }, { cardId: 'plain-card' }, { cardId: 'code-pay' }],
      date: during,
    })

    const rates = results.map((result) => result.totalRate)
    expect(rates).toEqual([...rates].sort((a, b) => b - a))
  })

  it('同じ還元率なら決済手段のid順で安定して並ぶ', () => {
    const results = estimateRewards(data, {
      storeId: 'store-c',
      owned: [{ cardId: 'code-pay' }, { cardId: 'charge-card' }],
      date: during,
    })

    // どちらも基本0.5%だけ。id順で 'charge-card' が先。
    expect(results.map((result) => result.cardId)).toEqual(['charge-card', 'code-pay'])
  })
})

describe('おかしな入力への対応', () => {
  it('存在しない店舗idはエラーになる', () => {
    expect(() =>
      estimateRewards(data, { storeId: 'no-such-store', owned: [{ cardId: 'plain-card' }], date: during }),
    ).toThrow('店舗id')
  })

  it('マイナスの金額はエラーになる', () => {
    expect(() =>
      estimateRewards(data, {
        storeId: 'store-a',
        amount: -100,
        owned: [{ cardId: 'plain-card' }],
        date: during,
      }),
    ).toThrow('金額')
  })

  it('データに無い決済手段は、エラーにせず結果から除く', () => {
    const results = estimateRewards(data, {
      storeId: 'store-a',
      owned: [{ cardId: 'deleted-card' }, { cardId: 'plain-card' }],
      date: during,
    })

    expect(results.map((result) => result.cardId)).toEqual(['plain-card'])
  })

  it('決済手段を1つも持っていなければ空の結果を返す', () => {
    const results = estimateRewards(data, { storeId: 'store-a', owned: [], date: during })

    expect(results).toEqual([])
  })
})

describe('表示用の書式', () => {
  it('0.1%単位の文字列にする', () => {
    expect(formatRate(10)).toBe('1.0%')
    expect(formatRate(5)).toBe('0.5%')
    expect(formatRate(70)).toBe('7.0%')
    expect(formatRate(0)).toBe('0.0%')
    expect(formatRate(125)).toBe('12.5%')
  })
})
