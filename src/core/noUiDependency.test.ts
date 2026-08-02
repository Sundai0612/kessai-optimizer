/**
 * 「src/core/ にUIのコードを入れない」というルールを、機械的に見張るテスト。
 *
 * 将来スマホアプリへ移すとき、src/core/ をそのまま持っていけるようにするため、
 * React・画面（DOM）・localStorage などブラウザ専用の機能に頼っていないことを確かめる。
 */
import { readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const coreDir = new URL('.', import.meta.url)

/**
 * 説明文（コメント）を取り除いて、実際のコードだけを残す。
 * 「localStorage を使わない」という説明文まで違反として拾ってしまうのを防ぐため。
 * '://' は URL の一部なので、行コメントとして扱わない。
 */
const stripComments = (code: string): string =>
  code.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1')

/** テスト以外の、src/core/ 直下のソースファイル */
const sourceFiles = readdirSync(coreDir)
  .filter((name) => name.endsWith('.ts') && !name.endsWith('.test.ts'))
  .map((name) => ({
    name,
    code: stripComments(readFileSync(new URL(name, coreDir), 'utf-8')),
  }))

/** 使ってはいけないものと、その説明 */
const forbidden: { label: string; pattern: RegExp }[] = [
  { label: 'React', pattern: /\bfrom\s+['"]react/ },
  { label: 'React Native', pattern: /\bfrom\s+['"]react-native/ },
  { label: '画面の操作（document）', pattern: /\bdocument\b/ },
  { label: 'ブラウザの window', pattern: /\bwindow\b/ },
  { label: '端末への保存（localStorage）', pattern: /\blocalStorage\b/ },
  { label: '端末への保存（sessionStorage）', pattern: /\bsessionStorage\b/ },
  { label: 'ブラウザ情報（navigator）', pattern: /\bnavigator\b/ },
  { label: '通信（fetch）', pattern: /\bfetch\s*\(/ },
  { label: '通信（XMLHttpRequest）', pattern: /\bXMLHttpRequest\b/ },
  { label: 'Node.js のファイル読み込み', pattern: /\bfrom\s+['"]node:/ },
]

describe('src/core/ にUIコードが混ざっていないか', () => {
  it('確認対象のファイルが存在する', () => {
    expect(sourceFiles.length).toBeGreaterThan(0)
  })

  for (const { label, pattern } of forbidden) {
    it(`${label} を使っていない`, () => {
      const offenders = sourceFiles
        .filter((file) => pattern.test(file.code))
        .map((file) => file.name)

      expect(offenders, `${label} を使っているファイル`).toEqual([])
    })
  }
})
