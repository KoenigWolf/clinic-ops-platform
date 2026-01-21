# 技術スタック

電子カルテ × オンライン診療 統合SaaS の技術構成。

## フレームワーク・ランタイム

| 技術 | バージョン | 用途 |
|------|-----------|------|
| Next.js | 16 (App Router) | フルスタックフレームワーク |
| React | 19 | UIライブラリ |
| TypeScript | 5.x | 型安全な開発 |
| Node.js | 20+ | ランタイム |

## データベース・ORM

| 技術 | 用途 |
|------|------|
| PostgreSQL | メインデータベース |
| Prisma | ORM・マイグレーション |

## 認証・セキュリティ

| 技術 | 用途 |
|------|------|
| NextAuth.js v5 | 認証 |
| bcrypt | パスワードハッシュ |

## API

| 技術 | 用途 |
|------|------|
| tRPC | 型安全なAPI |

## UI・スタイリング

| 技術 | 用途 |
|------|------|
| Tailwind CSS 4 | スタイリング |
| shadcn/ui | UIコンポーネント |
| lucide-react | アイコン |
| sonner | トースト通知 |

## フォーム・バリデーション

| 技術 | 用途 |
|------|------|
| react-hook-form | フォーム管理 |
| zod | スキーマバリデーション |

## 外部サービス

| 技術 | 用途 |
|------|------|
| Daily.co | ビデオ通話（オンライン診療） |
| Vercel | ホスティング・デプロイ |

## ユーティリティ

| 技術 | 用途 |
|------|------|
| date-fns | 日付操作 |

## テスト

| 技術 | 用途 |
|------|------|
| Vitest | ユニットテスト |

---

## ディレクトリ構成

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # 認証ページ（ログイン等）
│   ├── (dashboard)/        # スタッフ向けダッシュボード
│   └── (portal)/           # 患者ポータル
├── components/
│   ├── ui/                 # shadcn/ui（変更禁止）
│   ├── layout/             # 共通レイアウト
│   └── [feature]/          # 機能別コンポーネント
├── domain/                 # ドメイン層（スキーマ・型定義）
│   └── patient/            # 患者ドメイン
├── lib/                    # ユーティリティ
│   ├── trpc.ts             # tRPCクライアント
│   ├── auth.ts             # 認証設定
│   ├── security.ts         # セキュリティ関数
│   ├── audit.ts            # 監査ログ
│   └── labels.ts           # UIラベル
└── server/
    ├── trpc.ts             # tRPCサーバー設定
    └── routers/            # tRPC APIルーター
```

---

## コマンド

### 開発

```bash
npm run dev          # 開発サーバー起動
npm run build        # 本番ビルド
npm run check-all    # 全チェック（lint, typecheck, test, build）
```

### データベース

```bash
npx prisma generate  # Prisma Client生成
npx prisma db push   # スキーマをDBに反映
npx prisma studio    # DB GUI
npx prisma db seed   # シードデータ投入
```

### テスト

```bash
npm run test:run     # テスト実行
npm run lint         # ESLint
npm run typecheck    # 型チェック
```

---

## 環境変数

| 変数名 | 必須 | 説明 |
|--------|------|------|
| `DATABASE_URL` | Yes | PostgreSQL接続文字列 |
| `NEXTAUTH_SECRET` | Yes | セッション暗号化キー |
| `NEXTAUTH_URL` | Yes | アプリケーションURL |
| `DAILY_API_KEY` | No | Daily.co APIキー |
| `DAILY_DOMAIN` | No | Daily.coドメイン |

詳細は [docs/VERCEL_ENV.md](./VERCEL_ENV.md) を参照。

---

## データベース設計

### マルチテナント

すべてのテーブルに `tenantId` を持ち、データを論理的に分離。

### 主要モデル

- コア: Tenant, User, Patient, Appointment, MedicalRecord, Prescription, LabResult, Invoice
- ビデオ: VideoSession
- 耳鼻科(ENT): AudiometryTest, TympanometryTest, VestibularTest, EndoscopyExam, AllergyTest
- 問診・文書: QuestionnaireTemplate, QuestionnaireResponse, DocumentTemplate, Document
- 患者ポータル: PatientMessage, PatientNotification, MedicationRecord

### Userロール

| ロール | 説明 |
|--------|------|
| ADMIN | 管理者 |
| DOCTOR | 医師 |
| NURSE | 看護師 |
| STAFF | スタッフ |
| PATIENT | 患者 |

---

## tRPC API規約

### Procedure種別

| 種別 | 用途 |
|------|------|
| `protectedProcedure` | 認証必須 |
| `doctorProcedure` | 医師のみ |
| `adminProcedure` | 管理者のみ |

### 命名規則

- CRUD: `list`, `get`, `create`, `update`, `delete`
- 患者ポータル: `my*` prefix（例: `myAppointments`）

### tenantIdフィルタ

```typescript
// 必須パターン
where: { tenantId: ctx.tenantId, ... }

// 禁止（セキュリティホール）
where: { id: input.id }  // tenantIdなし
```

---

## セキュリティ

### 主要ファイル

| ファイル | 責務 |
|----------|------|
| `src/lib/security.ts` | レート制限、サニタイズ、PHI判定 |
| `src/lib/audit.ts` | HIPAA準拠監査ログ |

### PHIエンティティ（監査ログ必須）

Patient, MedicalRecord, Prescription, LabResult, AudiometryTest

### 必須ルール

1. PHIエンティティへのアクセス・変更は監査ログ記録
2. 入力は `sanitizeHtml`, `sanitizeEmail` でサニタイズ
3. パスワードは `validatePassword` で検証

詳細は [docs/SECURITY.md](./SECURITY.md) を参照。
