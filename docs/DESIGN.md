# デザインガイドライン

モダン・ミニマル・モノクロマティックなUIデザインシステム。

## デザイン原則

1. **モノクロマティック** - グレースケール中心、カラーは意味のある場面のみ
2. **余白重視** - 十分なスペーシングで視認性確保
3. **控えめなシャドウ** - `shadow-sm`で奥行きを表現
4. **一貫したラディウス** - `rounded-xl`で統一感

## スタイリング方針

Tailwindクラスを直接使用。過度な中央管理は行わない。

### 例外：中央管理が有効なケース

| ファイル | 管理対象 |
|---------|---------|
| `src/lib/design-tokens.ts` | sidebar スタイル、ステータス設定 |
| `src/app/globals.css` | サイドバー幅（CSS変数） |

## カラー規約

Tailwindのグレースケールを直接使用。

| 用途 | クラス |
|------|--------|
| ページ背景 | `bg-gray-100` |
| カード背景 | `bg-white` |
| ホバー | `bg-gray-50/50` |
| テキスト（メイン） | `text-gray-900` |
| テキスト（補助） | `text-gray-600` |
| テキスト（ミュート） | `text-gray-500` |
| テキスト（薄い） | `text-gray-400` |

### セマンティックカラー

| 意味 | 背景 | テキスト |
|------|------|----------|
| 成功 | `bg-emerald-50` | `text-emerald-600` |
| 警告 | `bg-amber-50` | `text-amber-600` |
| エラー | `bg-red-50` | `text-red-600` |
| 情報 | `bg-blue-50` | `text-blue-600` |

## ステータス設定

`design-tokens.ts` で定義。label, dot, text, bg を持つ。

| 設定名 | 対象 |
|--------|------|
| `appointmentStatusConfig` | SCHEDULED, CONFIRMED, WAITING, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW |
| `prescriptionStatusConfig` | PENDING, DISPENSED, CANCELLED |
| `invoiceStatusConfig` | DRAFT, SENT, PENDING, PAID, OVERDUE, CANCELLED |

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

## 使用方法

```tsx
import { appointmentStatusConfig } from "@/lib/design-tokens";
import { PageHeader, StatCard, StatusBadge } from "@/components/layout";
```

## NG事項

- `shadow-md`以上の強いシャドウ
- 装飾目的のカラー使用
- Tailwindで直接書けるものを過度に中央管理
