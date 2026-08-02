/**
 * 今日の日付を '2026-08-02' の形で返す。キャンペーンが有効かの判定に使う。
 *
 * 端末の時計をそのまま使う（時差でずれないよう、世界標準時ではなく現地の日付）。
 */
export const todayString = (): string => {
  const now = new Date()
  const pad = (value: number): string => String(value).padStart(2, '0')

  return `${String(now.getFullYear())}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}
