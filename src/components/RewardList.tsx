import { useState } from 'react'
import { formatRate } from '../core/reward'
import type { Card, RewardBreakdown, RewardPartResult } from '../core/types'

type Props = {
  results: RewardBreakdown[]
  cards: Card[]
  amount: number | undefined
}

const PART_LABEL: Record<RewardPartResult['kind'], string> = {
  base: '基本',
  charge: 'チャージ',
  merchant: '特約店',
  campaign: 'イベント',
}

const yen = (value: number): string => `${value.toLocaleString('ja-JP')}円`

/** 「基本 1.0% ＋ 特約店 3.0%」という式の部分 */
const Formula = ({ parts }: { parts: RewardPartResult[] }) => (
  <p className="formula">
    {parts.map((part, index) => (
      <span key={`${part.kind}-${String(index)}`}>
        {index > 0 && <span className="plus"> ＋ </span>}
        <span className="formula-label">{PART_LABEL[part.kind]}</span>
        <span className="formula-rate">{formatRate(part.rate)}</span>
        {part.capped && <span className="capped-mark">上限</span>}
      </span>
    ))}
  </p>
)

const Details = ({ parts }: { parts: RewardPartResult[] }) => (
  <ul className="details">
    {parts.map((part, index) => (
      <li key={`${part.kind}-${String(index)}`}>
        <div className="details-head">
          <span className="details-label">{PART_LABEL[part.kind]}</span>
          <span>{formatRate(part.rate)}</span>
          {part.points !== undefined && <span className="details-points">{yen(part.points)}</span>}
        </div>

        {part.cap !== undefined && (
          <p className="details-note">
            月{yen(part.cap.maxPoints)}まで
            {part.capped && <strong>（この金額では上限に達します）</strong>}
          </p>
        )}

        {part.note !== undefined && <p className="details-note">{part.note}</p>}

        <a className="details-source" href={part.source.url} target="_blank" rel="noreferrer">
          出典（{part.source.checkedOn} 確認）
        </a>
      </li>
    ))}
  </ul>
)

export const RewardList = ({ results, cards, amount }: Props) => {
  const [openId, setOpenId] = useState<string | undefined>(undefined)

  const nameOf = (cardId: string): string =>
    cards.find((card) => card.id === cardId)?.name ?? cardId

  if (results.length === 0) {
    return (
      <section className="card">
        <p className="empty">
          「持っている決済手段」から、使えるものを選んでください。
        </p>
      </section>
    )
  }

  return (
    <section className="card">
      <h2>還元率の目安</h2>

      <ol className="results">
        {results.map((result, index) => {
          const key = `${result.cardId}/${result.chargeFromCardId ?? ''}`

          return (
            <li key={key} className={index === 0 ? 'result best' : 'result'}>
              <div className="result-head">
                <span className="rank">{index + 1}</span>
                <span className="result-name">
                  {nameOf(result.cardId)}
                  {result.chargeFromCardId !== undefined && (
                    <span className="charge-from">
                      ← {nameOf(result.chargeFromCardId)} からチャージ
                    </span>
                  )}
                </span>
                <span className="result-total">
                  {result.totalPoints !== undefined ? (
                    <>
                      <strong>{yen(result.totalPoints)}</strong>
                      <span className="result-rate">{formatRate(result.totalRate)}</span>
                    </>
                  ) : (
                    <strong>{formatRate(result.totalRate)}</strong>
                  )}
                </span>
              </div>

              <Formula parts={result.parts} />

              {result.capUnknown && (
                <p className="warn">金額を入れると、上限を反映した金額で比べられます</p>
              )}

              <button
                type="button"
                className="link-button"
                aria-expanded={openId === key}
                onClick={() => setOpenId(openId === key ? undefined : key)}
              >
                {openId === key ? '内訳を閉じる' : '内訳と出典を見る'}
              </button>

              {openId === key && <Details parts={result.parts} />}
            </li>
          )
        })}
      </ol>

      <div className="disclaimer">
        <p>
          表示はすべて<strong>目安</strong>です。実際の還元は各社の条件により変わります。
          支払う前に、出典のリンクで最新の条件をご確認ください。
        </p>
        <p>
          付与上限は<strong>その月にまだ使っていない前提</strong>で計算しています。
          すでに上限近くまで使っている場合、実際の還元は表示より少なくなります。
          {amount === undefined && '（金額を入れると上限を反映できます）'}
        </p>
      </div>
    </section>
  )
}
