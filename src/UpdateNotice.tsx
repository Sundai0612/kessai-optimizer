import { useRegisterSW } from 'virtual:pwa-register/react'

/**
 * 「もう新しい版があります」「インターネットがなくても開けます」を
 * 画面の下に小さく知らせる部品です。
 */
export function UpdateNotice() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!offlineReady && !needRefresh) return null

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  return (
    <div className="toast" role="status">
      <span className="toast__message">
        {needRefresh
          ? '新しいバージョンがあります。'
          : 'インターネットがなくても開けるようになりました。'}
      </span>
      {needRefresh && (
        <button
          className="toast__button toast__button--primary"
          onClick={() => updateServiceWorker(true)}
        >
          更新する
        </button>
      )}
      <button className="toast__button" onClick={close}>
        閉じる
      </button>
    </div>
  )
}
