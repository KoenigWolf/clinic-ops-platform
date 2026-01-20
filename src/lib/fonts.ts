/**
 * フォント設定の中央管理
 *
 * 全ページで使用するフォントをここで一元管理する。
 * フォントを変更する場合はこのファイルのみを編集する。
 */

import { Noto_Sans_JP, Inter } from "next/font/google";

/**
 * 日本語フォント（メイン）
 */
export const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sans-jp",
  preload: true,
});

/**
 * 英語フォント（サブ）
 */
export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sans",
  preload: true,
});

/**
 * フォントのCSS変数クラス名を結合したもの
 * layout.tsxのhtml/bodyに適用する
 */
export const fontVariables = `${notoSansJP.variable} ${inter.variable}`;
