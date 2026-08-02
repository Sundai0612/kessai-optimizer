/**
 * 還元率などのデータの「形」を決めるファイル。
 *
 * ここには計算も画面も書かない。「データはこういう項目を持つ」という取り決めだけを置く。
 * 実際の数値は public/data/ 配下のJSONに入れる（コードには書かない）。
 */

/**
 * 還元率。**0.1% を 1 とする整数**で持つ。
 *
 * 例: 1.0% → 10 ／ 0.5% → 5 ／ 7.0% → 70
 *
 * 小数を使わないのは、コンピュータの小数計算にわずかなズレがあるため。
 * （0.1 + 0.2 が 0.30000000000000004 になるような現象。整数なら必ず正確。）
 */
export type RewardRate = number

/** 情報の出どころ。どのデータにも必ず付ける。 */
export type Source = {
  /** 公式ページなど、根拠になるURL */
  url: string
  /** 最終確認日。'2026-08-02' の形式（年-月-日）。 */
  checkedOn: string
}

/** いつからいつまで有効か。期間限定キャンペーンで使う。 */
export type Period = {
  /** 開始日。'2026-08-01' の形式。 */
  from: string
  /** 終了日（この日を含む）。'2026-08-31' の形式。 */
  to: string
}

/**
 * もらえるポイントの上限。
 * 「月500ポイントまで」のような制限を表す。上限がなければ項目ごと省く。
 */
export type Cap = {
  /** 集計の単位。今はひと月単位のみ。 */
  period: 'month'
  /** ひと月にもらえるポイントの上限（円相当） */
  maxPoints: number
}

/** 決済手段の種類 */
export type PaymentKind =
  /** クレジットカード */
  | 'credit'
  /** コード決済（PayPayなど） */
  | 'code'
  /** プリペイド・電子マネー */
  | 'prepaid'

/**
 * コード決済への「チャージ元」。二重取りの計算に使う。
 *
 * チャージでもらえる還元率はカードごとに違う（0%のカードも多い）ため、
 * 「コード決済とカードの組み合わせ」ごとに率を持たせる。
 */
export type ChargeSource = {
  /** チャージに使うカードのid */
  cardId: string
  /** チャージ時にもらえる還元率 */
  rate: RewardRate
  /** チャージ分の付与上限 */
  cap?: Cap
  /** 補足（「本人認証の設定が必要」など） */
  note?: string
  source: Source
}

/** 決済手段1つ分（カード名簿の1件） */
export type Card = {
  /** 英数字の識別子。'rakuten-card' のような形。重複してはいけない。 */
  id: string
  /** 表示する名前 */
  name: string
  /** よみがな（ひらがな）。かな検索に使う。 */
  kana: string
  kind: PaymentKind
  /** どこで使っても最低限もらえる還元率。優遇がない店ではこれを使う。 */
  baseRate: RewardRate
  /** 基本還元分の付与上限 */
  cap?: Cap
  /** チャージ元の一覧。コード決済のみ。 */
  chargeFrom?: ChargeSource[]
  note?: string
  source: Source
}

/** 店舗の別名。「セブン」で「セブンイレブン」に当たるようにする。 */
export type StoreAlias = {
  /** 別名の表記 */
  name: string
  /** 別名のよみがな（ひらがな）。かな検索に使う。 */
  kana: string
}

/** 店舗の分類（コンビニ、ドラッグストアなど） */
export type Category = {
  id: string
  name: string
  kana: string
}

/** 店舗1つ分（店舗名簿の1件） */
export type Store = {
  id: string
  name: string
  /** よみがな（ひらがな）。かな検索に使う。 */
  kana: string
  /** 別名の一覧。無ければ空の配列。 */
  aliases: StoreAlias[]
  /** 所属する分類のid */
  categoryId: string
  source: Source
}

/**
 * 優遇が「誰に効くか」の指定。
 *
 * - store: この店だけ
 * - category: この分類の店すべて（「コンビニ全般」など）
 *
 * 両方が当てはまる場合は、細かい指定である store が勝つ。
 */
export type BonusTarget =
  | { kind: 'store'; id: string }
  | { kind: 'category'; id: string }

/**
 * 優遇情報の1件。
 *
 * 「優遇がある組み合わせだけ」を記録する。ここに無い組み合わせは、
 * カードの baseRate（基本還元率）がそのまま使われる。
 */
export type Bonus = {
  /** どのカードの話か */
  cardId: string
  /** どこで効くか */
  target: BonusTarget
  /** そのときの還元率。baseRate を置き換える（足すのではない）。 */
  rate: RewardRate
  cap?: Cap
  /** 期間限定のときだけ指定する。無い場合は常時有効。 */
  period?: Period
  note?: string
  source: Source
}

/** public/data/cards.json 全体の形 */
export type CardsFile = {
  /** ファイル冒頭の注意書き。計算には使わない。 */
  _note?: string
  cards: Card[]
}

/** public/data/stores.json 全体の形 */
export type StoresFile = {
  _note?: string
  categories: Category[]
  stores: Store[]
}

/** public/data/bonuses.json 全体の形 */
export type BonusesFile = {
  _note?: string
  bonuses: Bonus[]
}
