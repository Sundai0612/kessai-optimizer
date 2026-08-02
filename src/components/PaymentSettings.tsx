import type { Card, OwnedPayment } from '../core/types'

type Props = {
  cards: Card[]
  owned: OwnedPayment[]
  onChange: (owned: OwnedPayment[]) => void
}

/** チャージ元に選べるカードを取り出す */
const chargeOptions = (card: Card, cards: Card[]): Card[] =>
  (card.chargeFrom ?? [])
    .map((entry) => cards.find((candidate) => candidate.id === entry.cardId))
    .filter((found): found is Card => found !== undefined)

export const PaymentSettings = ({ cards, owned, onChange }: Props) => {
  const ownedOf = (cardId: string): OwnedPayment | undefined =>
    owned.find((entry) => entry.cardId === cardId)

  const toggle = (cardId: string): void => {
    onChange(
      ownedOf(cardId) === undefined
        ? [...owned, { cardId }]
        : owned.filter((entry) => entry.cardId !== cardId),
    )
  }

  const setChargeFrom = (cardId: string, chargeFromCardId: string): void => {
    onChange(
      owned.map((entry) =>
        entry.cardId === cardId
          ? {
              cardId,
              ...(chargeFromCardId === '' ? {} : { chargeFromCardId }),
            }
          : entry,
      ),
    )
  }

  return (
    <section className="card">
      <h2>持っている決済手段</h2>
      <p className="hint">選んだものだけが比較の対象になります。この端末の中だけに保存されます。</p>

      <ul className="payment-list">
        {cards.map((card) => {
          const entry = ownedOf(card.id)
          const options = chargeOptions(card, cards)

          return (
            <li key={card.id}>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={entry !== undefined}
                  onChange={() => toggle(card.id)}
                />
                <span>{card.name}</span>
              </label>

              {entry !== undefined && options.length > 0 && (
                <label className="charge-row">
                  <span className="charge-label">チャージ元</span>
                  <select
                    value={entry.chargeFromCardId ?? ''}
                    onChange={(event) => setChargeFrom(card.id, event.target.value)}
                  >
                    <option value="">指定しない</option>
                    {options.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
