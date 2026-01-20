# デザインガイドライン

モダン・ミニマル・モノクロマティックなUIデザインシステム。

## デザイン原則

1. **モノクロマティック** - グレースケール中心、カラーは意味のある場面のみ
2. **余白重視** - 十分なスペーシングで視認性確保
3. **控えめなシャドウ** - `shadow-sm`で奥行きを表現
4. **一貫したラディウス** - `rounded-xl`で統一感

## ファイル構成

| ファイル | 目的 |
|---------|------|
| `src/lib/design-tokens.ts` | カラー、タイポグラフィ、ステータス設定 |
| `src/components/layout/` | 再利用可能レイアウトコンポーネント |

## カラーシステム

すべてのカラーは `design-tokens.ts` の `colors` オブジェクトで管理。

### ベースカラー

| 用途 | トークン |
|------|---------|
| ページ背景 | `colors.bg.page` |
| カード背景 | `colors.bg.card` |
| ホバー | `colors.bg.hover` |
| テキスト（メイン） | `colors.text.primary` |
| テキスト（補助） | `colors.text.muted` |

### セマンティックカラー

| 意味 | 背景トークン | テキストトークン |
|------|-------------|-----------------|
| 成功/アクティブ | `colors.success.bgLight` | `colors.success.text` |
| 警告/待機 | `colors.warning.bgLight` | `colors.warning.text` |
| エラー/危険 | `colors.error.bgLight` | `colors.error.text` |
| 情報 | `colors.info.bgLight` | `colors.info.text` |

### ステータスカラー

| 状態 | 用途 |
|------|------|
| `colors.status.active` | アクティブ（emerald系） |
| `colors.status.pending` | 待機中（amber系） |
| `colors.status.inactive` | 非アクティブ（gray系） |

## ステータス設定

`design-tokens.ts` で定義済み。label, dot, text, bg を持つ。

| 設定名 | 対象ステータス |
|--------|---------------|
| `appointmentStatusConfig` | SCHEDULED, CONFIRMED, WAITING, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW |
| `prescriptionStatusConfig` | PENDING, DISPENSED, CANCELLED |
| `invoiceStatusConfig` | PENDING, PAID, OVERDUE, CANCELLED |

## レイアウトコンポーネント

`src/components/layout/` からエクスポート。

| コンポーネント | 用途 |
|---------------|------|
| `PageHeader` | ページタイトル・アクション |
| `SectionHeader` | セクション見出し・リンク |
| `StatCard` / `StatGrid` | 統計表示 |
| `ContentCard` / `ContentCardItem` | リスト・コンテンツ表示 |
| `EmptyState` | データなし状態 |
| `Avatar` | ユーザーアイコン |
| `StatusBadge` | 予約ステータス表示 |
| `GenericStatusBadge` | 汎用ステータス（variant: success/warning/error/info/neutral） |
| `OnlineBadge` | オンラインラベル |
| `TimeDisplay` | 時刻表示 |
| `DateDisplay` | 日付表示 |
| `VerticalSeparator` | 縦区切り線 |

## タイポグラフィ

`typography` オブジェクトで管理。

| 用途 | トークン |
|------|---------|
| ページタイトル | `typography.pageTitle` |
| セクションヘッダー | `typography.sectionHeader` |
| カードタイトル | `typography.cardTitle` |
| 統計値 | `typography.statValue` |
| 時刻 | `typography.time` |
| ラベル | `typography.label` |

## 使用方法

```tsx
import { colors, typography, appointmentStatusConfig } from "@/lib/design-tokens";
import { PageHeader, StatCard, StatusBadge } from "@/components/layout";
```

カラーやタイポグラフィは className に直接適用。ステータス設定は label, dot, text, bg プロパティを持つ。

## 禁止事項

- ハードコードカラー（`bg-blue-500`等）を直接使用 → `colors` を使用
- `shadow-md`以上の強いシャドウ
- 装飾目的のカラー使用

## 拡張時

1. 新しいカラー → `design-tokens.ts` の `colors` に追加
2. 新しいステータス → `*StatusConfig` に追加
3. 新しいコンポーネント → `layout/` に配置してexport
4. このガイドラインに追記
