import { useMemo, useState } from 'react'
import { searchStores } from '../core/search'
import type { Store } from '../core/types'

type Props = {
  stores: Store[]
  selected: Store | undefined
  onSelect: (store: Store | undefined) => void
}

export const StoreSearch = ({ stores, selected, onSelect }: Props) => {
  const [query, setQuery] = useState('')

  const suggestions = useMemo(() => searchStores(stores, query), [stores, query])
  const showSuggestions = query.trim().length > 0 && selected === undefined

  return (
    <section className="card">
      <h2>お店をさがす</h2>

      {selected === undefined ? (
        <>
          <input
            className="text-input"
            type="search"
            value={query}
            placeholder="店名を入力（例：せぶん）"
            autoComplete="off"
            aria-label="店名"
            onChange={(event) => setQuery(event.target.value)}
          />

          {showSuggestions &&
            (suggestions.length > 0 ? (
              <ul className="suggestions">
                {suggestions.map((store) => (
                  <li key={store.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(store)
                        setQuery('')
                      }}
                    >
                      <span className="suggestion-name">{store.name}</span>
                      <span className="suggestion-kana">{store.kana}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty">
                「{query}」に当てはまるお店がありません。ひらがなでも探せます。
              </p>
            ))}
        </>
      ) : (
        <div className="selected-store">
          <strong>{selected.name}</strong>
          <button type="button" className="link-button" onClick={() => onSelect(undefined)}>
            変更する
          </button>
        </div>
      )}
    </section>
  )
}
