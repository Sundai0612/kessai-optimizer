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
  /** 現金。還元は常に0%で、比較の基準になる。 */
  | 'cash'

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
  /** 出典。現金のように出典が存在しないものだけ省略できる。 */
  source?: Source
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
  /** 出典。店名と分類だけの場合は省略できる。 */
  source?: Source
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
 * 優遇の種類。画面に出す計算式の見出しになる。
 *
 * - merchant: 特約店・優待店としての上乗せ（常時）
 * - campaign: 期間限定のイベント
 */
export type BonusKind = 'merchant' | 'campaign'

/**
 * rate に書いた数字が「何を指しているか」。
 *
 * 公式サイトの書き方が2通りあるため、どちらで書いたかを明示する。
 *
 * - 'add'   : 基本還元率への**上乗せ分**。「+1%」と書かれていたらこちら。
 * - 'total' : 基本還元率を**含んだ合計**。「最大7%（基本0.5%を含む）」ならこちら。
 *
 * 'total' の場合、上乗せ分は「rate - カードのbaseRate」で計算する。
 * 公式サイトの数字をそのまま写せるようにするための仕組み。
 */
export type RateBasis = 'add' | 'total'

/**
 * 優遇情報の1件。
 *
 * 「優遇がある組み合わせだけ」を記録する。ここに無い組み合わせは、
 * カードの baseRate（基本還元率）だけが使われる。
 *
 * 当てはまる優遇は**すべて足し合わせる**。
 * 例: 基本0.5% + 特約店1.0% + イベント1.0% = 2.5%
 */
export type Bonus = {
  /** どのカードの話か */
  cardId: string
  /** どこで効くか */
  target: BonusTarget
  /** 特約店の上乗せか、期間限定イベントか */
  kind: BonusKind
  /** rate が「上乗せ分」か「基本込みの合計」か */
  rateBasis: RateBasis
  /** 還元率。rateBasis によって意味が変わる。 */
  rate: RewardRate
  cap?: Cap
  /** 期間限定のときだけ指定する。無い場合は常時有効。 */
  period?: Period
  note?: string
  source: Source
}

/**
 * 還元率の内訳の1項目。
 * 画面に「基本 0.5%」「特約店 1.0%」のように並べて見せるためのもの。
 */
export type RewardPart = {
  /** この項目が何によるものか */
  kind: 'base' | 'charge' | 'merchant' | 'campaign'
  /** この項目でもらえる還元率（上乗せ分） */
  rate: RewardRate
  /** この項目にかかる付与上限 */
  cap?: Cap
  /** 補足 */
  note?: string
  /** この項目の根拠。現金など出典が無いものでは省略される。 */
  source?: Source
}

/**
 * 内訳の1項目の計算結果。RewardPart に、金額を入れたときの還元額を足したもの。
 */
export type RewardPartResult = RewardPart & {
  /**
   * この項目でもらえる還元額（円）。金額を指定したときだけ入る。
   * 1円未満は切り捨て、付与上限があれば上限で頭打ちにした後の値。
   */
  points?: number
  /** 付与上限で頭打ちになったか */
  capped: boolean
}

/**
 * ある店で、ある決済手段を使ったときの計算結果。
 *
 * parts に内訳が入るので、「0.5 + 1.0 + 1.0 = 2.5%」という式をそのまま組み立てられる。
 */
export type RewardBreakdown = {
  cardId: string
  /** コード決済のとき、チャージに使ったカードのid */
  chargeFromCardId?: string
  parts: RewardPartResult[]
  /** parts の rate をすべて足した合計（付与上限は考慮していない） */
  totalRate: RewardRate
  /** 還元額の合計（円）。金額を指定したときだけ入る。 */
  totalPoints?: number
  /** 付与上限で頭打ちになった項目があるか */
  capped: boolean
  /**
   * 付与上限はあるが、金額が未入力のため反映できていない項目があるか。
   * true のときは、実際には表示より少なくなる可能性がある。
   */
  capUnknown: boolean
}

/** 利用者が持っている決済手段1つ分 */
export type OwnedPayment = {
  /** 決済手段のid */
  cardId: string
  /**
   * コード決済のとき、チャージに使うカードのid。
   * 指定しない場合、チャージ分は加算しない（不明な要素は足さないため）。
   */
  chargeFromCardId?: string
}

/** 計算に渡す条件 */
export type RewardQuery = {
  /** どの店か */
  storeId: string
  /** 支払い金額（円）。分からない場合は指定しない。 */
  amount?: number
  /** 持っている決済手段の一覧 */
  owned: OwnedPayment[]
  /** 判定の基準日。'2026-08-02' の形式。キャンペーンが有効かの判断に使う。 */
  date: string
}

/** 計算に使うデータ一式（JSONから読み込んだもの） */
export type PaymentData = {
  cards: Card[]
  categories: Category[]
  stores: Store[]
  bonuses: Bonus[]
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
