import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // スコアボードの筐体（見出し・ヘッダー・フッター）
        navy: '#191B1F',
        // アリーナの床のような、冷たいライトグレー（背景）
        paper: '#F4F5F1',
        // 本文の文字色
        ink: '#1B1D1E',
        // 早押しボタンの赤（主アクセント）
        akane: '#FF3B30',
        // 電光掲示板の琥珀色（副アクセント）
        gold: '#FFC845',
        // 罫線
        line: '#DEE0D9',
      },
      fontFamily: {
        // 見出し・ボタン: 丸ゴシックで勢いと親しみを出す
        display: ['"Zen Maru Gothic"', 'sans-serif'],
        // 本文: 引き続きNoto Sans JP（フォーム・管理画面の可読性を優先）
        body: ['"Noto Sans JP"', 'sans-serif'],
        // ラベル・数字・バッジ: スコアボードのLEDドット表示を想起させる書体
        mono: ['"DotGothic16"', 'monospace'],
      },
    },
  },
  plugins: [],
}
export default config
