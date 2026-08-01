// テストのしくみが正しく動くことを確かめるためだけのファイルです。
// src/core/ に本物の計算ロジックとそのテストを書いたら、このファイルは削除して構いません。
import { describe, expect, it } from 'vitest'

describe('テスト環境', () => {
  it('テストが実行できる', () => {
    expect(1 + 1).toBe(2)
  })
})
