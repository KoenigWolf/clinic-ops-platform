# 電子カルテ × オンライン診療 統合SaaS

医療機関向けの電子カルテとオンライン診療を統合したSaaSアプリケーション。
マルチテナント対応で、複数のクリニックが同一システムを利用可能。

## 技術スタック

- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- tRPC
- Prisma + PostgreSQL
- NextAuth.js v5
- Daily.co (ビデオ通話)
- react-hook-form + zod (フォーム)
- date-fns (日付)
- lucide-react (アイコン)
- sonner (トースト)

## ディレクトリ構成

```
src/
├── app/
│   ├── (auth)/              # 認証ページ
│   ├── (dashboard)/         # スタッフ向けダッシュボード
│   └── (portal)/            # 患者ポータル
├── components/
│   └── ui/                  # shadcn/ui (変更禁止)
├── lib/                     # ユーティリティ
└── server/routers/          # tRPC API
```

## データベース

### マルチテナント

すべてのテーブルに tenantId を持ち、データを分離。

### 主要モデル

Tenant, User, Patient, Appointment, MedicalRecord, Prescription, VideoSession, LabResult, Invoice

### User ロール

ADMIN, DOCTOR, NURSE, STAFF, PATIENT

### 予約ステータスフロー

```
SCHEDULED → CONFIRMED → WAITING → IN_PROGRESS → COMPLETED
                ↓           ↓
            CANCELLED    NO_SHOW
```

## tRPC API

### Procedure種別

- protectedProcedure: 認証必須
- doctorProcedure: 医師のみ
- adminProcedure: 管理者のみ

### 命名規則

list, get, create, update, delete
患者ポータル用は my* prefix (myAppointments, myMessages)

### tenantIDフィルタ必須

```typescript
// Good
where: { tenantId: ctx.tenantId }

// Bad - セキュリティホール
where: {}
```

## セキュリティ

### 主要ファイル

- `src/lib/security.ts` - ヘッダー、レート制限、サニタイズ
- `src/lib/audit.ts` - HIPAA準拠監査ログ（`logPhiAccess`, `logPhiModification`）

### 必須ルール

- PHIエンティティへのアクセスは監査ログ記録
- 入力は `sanitizeHtml`, `sanitizeEmail` でサニタイズ
- パスワードは `validatePassword` で検証

詳細は [docs/SECURITY.md](docs/SECURITY.md) を参照。

## 開発時の注意点

1. テナントID - 全クエリで必ず tenantId フィルタを適用
2. 型安全 - tRPC + Prisma で型を活用、any 禁止
3. エラーハンドリング - ユーザーフレンドリーな日本語メッセージ
4. セキュリティ - 患者データは当該患者のみアクセス可、PHIアクセスは監査ログ必須
5. レスポンシブ - モバイル対応を考慮
6. パフォーマンス - 必要なフィールドのみ select/include
7. コメント - コードで表現できることはコメントに書かない（リーダブルコード原則）

## コマンド

```bash
npm run dev          # 開発サーバー
npm run build        # ビルド
npm run check-all    # 全チェック（lint, typecheck, test, build）
npx prisma generate  # Client生成
npx prisma db push   # スキーマ反映
npx prisma studio    # GUI
npx prisma db seed   # シード
```

## 開発ワークフロー

**変更後は必ず `npm run check-all` を実行して、すべてのチェックがパスすることを確認する。**

```bash
npm run check-all
```

これにより以下が実行される:
- ESLint
- TypeScript型チェック
- Vitestテスト
- Next.jsビルド

## 環境変数

DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, DAILY_API_KEY

## ドキュメント作成ガイドライン

ガイドやドキュメントを作成する際は以下に従う:

- **コードは最小限に** - 説明に必要な最小限のコード例のみ記載。冗長なコードブロックは避ける
- **AI向けに書く** - 人間よりもAIが読むことを前提に、曖昧さを排除し、明確で構造化された記述を心がける
- **ASCII図は不要** - フローや構造はテキストやリストで表現。ASCII アートは使わない

## 関連ドキュメント

- [docs/WORKFLOW.md](docs/WORKFLOW.md) - 対面診療・オンライン診療・会計等の業務フロー
- [docs/SECURITY.md](docs/SECURITY.md) - セキュリティガイドライン（HIPAA準拠、認証、監査ログ等）
