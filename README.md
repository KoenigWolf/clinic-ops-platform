# Karute - 電子カルテ × オンライン診療 統合SaaS

耳鼻科クリニック向けの電子カルテとオンライン診療を統合したSaaSアプリケーション。
マルチテナント対応で、複数のクリニックが同一システムを利用可能。

## 主な機能

### スタッフ向け機能

| 機能 | パス | 説明 |
|------|------|------|
| ダッシュボード | / | 本日の予約・統計サマリー |
| 患者管理 | /patients | 患者情報の登録・検索・編集 |
| 予約管理 | /appointments | 予約の作成・受付・ステータス管理 |
| 診療記録 | /records | SOAP形式でのカルテ記載 |
| オンライン診療 | /video | Daily.co によるビデオ通話 |
| 処方管理 | /prescriptions | 処方箋の作成・管理 |
| 請求管理 | /billing | 請求書の作成・支払い管理 |
| Web問診 | /questionnaire | 問診テンプレート作成・回答管理 |
| 文書テンプレート | /documents | 紹介状・診断書などのテンプレート |
| 経営分析 | /analytics | 売上・患者数などのダッシュボード |
| 耳鼻科専用 | /ent/* | 聴力検査・内視鏡所見など専門機能 |
| 設定 | /settings | クリニック設定 |

### 患者ポータル

| 機能 | パス | 説明 |
|------|------|------|
| ダッシュボード | /portal | 概要表示・次回予約・通知 |
| 予約確認 | /portal/appointments | 予約一覧・オンライン診療入室 |
| メッセージ | /portal/messages | クリニックとのやり取り |
| 処方・お薬 | /portal/medications | 処方履歴・服薬中の薬 |
| 検査結果 | /portal/results | 検査結果の閲覧 |
| 通知 | /portal/notifications | お知らせ一覧 |

### 耳鼻科専門機能

- 聴力検査（オージオメトリー）
- ティンパノメトリー
- 前庭機能検査
- 内視鏡検査
- アレルギー検査
- 診断テンプレート

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Runtime | React 19 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| API | tRPC 11 (型安全API、118エンドポイント) |
| ORM | Prisma 6 (35モデル) |
| Database | PostgreSQL |
| Auth | NextAuth.js 5 |
| Video | Daily.co (HIPAA対応) |
| Form | react-hook-form + Zod |
| Testing | Vitest + Testing Library |

## セットアップ

### 前提条件

- Node.js 20以上
- PostgreSQLデータベース（ローカル or クラウド）

### 1. リポジトリのクローン

```bash
git clone https://github.com/your-org/karute.git
cd karute
npm install
```

### 2. 環境変数の設定

`.env`ファイルをプロジェクトルートに作成：

```env
# Database（必須）
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

# NextAuth.js（必須）
AUTH_SECRET="ランダムな32文字以上の文字列"
NEXTAUTH_URL="http://localhost:3000"

# Daily.co ビデオ通話（オンライン診療に必要）
DAILY_API_KEY="your-daily-api-key"
DAILY_DOMAIN="your-domain.daily.co"

# S3 ストレージ（任意：ファイルアップロード用）
S3_BUCKET=""
S3_REGION=""
S3_ACCESS_KEY=""
S3_SECRET_KEY=""
```

#### 環境変数の取得方法

| 変数 | 取得先 |
|------|--------|
| DATABASE_URL | [Neon](https://neon.tech)、[Supabase](https://supabase.com)、[Railway](https://railway.app) などで無料PostgreSQLを作成 |
| AUTH_SECRET | `openssl rand -base64 32` で生成 |
| DAILY_API_KEY | [Daily.co](https://www.daily.co/) でアカウント作成後、Dashboard → Developers → API Keys |

### 3. データベースセットアップ

```bash
# Prisma Clientを生成
npx prisma generate

# スキーマをDBに反映
npx prisma db push

# デモデータを投入（任意）
npm run db:seed
```

### 4. 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 でアクセス

### デモアカウント

シード実行後、以下のアカウントでログイン可能：

| ロール | メールアドレス | パスワード |
|--------|---------------|-----------|
| 管理者 | admin@example.com | password |
| 医師 | doctor@example.com | password |
| 看護師 | nurse@example.com | password |

### 開発コマンド

```bash
npm run dev          # 開発サーバー起動
npm run build        # プロダクションビルド
npm run check-all    # 全チェック（lint + typecheck + test + build）
npm run db:studio    # Prisma Studio（DB GUI）
npm run db:seed      # デモデータ投入
```

---

## Vercelデプロイ

### 1. Vercelプロジェクト作成

1. [Vercel](https://vercel.com) にログイン
2. 「New Project」→ GitHubリポジトリを選択
3. Framework Preset: **Next.js**（自動検出）

### 2. 環境変数の設定

Vercel Dashboard → Settings → Environment Variables に以下を追加：

| 変数名 | 値 | 環境 |
|--------|-----|------|
| DATABASE_URL | PostgreSQL接続URL | Production, Preview |
| AUTH_SECRET | `openssl rand -base64 32` で生成した値 | Production, Preview |
| NEXTAUTH_URL | `https://your-domain.vercel.app` | Production |
| DAILY_API_KEY | Daily.co APIキー | Production, Preview |
| DAILY_DOMAIN | Daily.coドメイン | Production, Preview |

> **注意**: `NEXTAUTH_URL`はVercelのProduction環境では自動設定されるため省略可能。Preview環境では設定が必要。

### 3. データベース接続

推奨: **Neon** (Vercel統合あり)

1. Vercel Dashboard → Storage → Create Database → Neon
2. 自動で`DATABASE_URL`が設定される

### 4. デプロイ

```bash
git push origin main
```

Vercelが自動でビルド・デプロイを実行。

### 本番環境の初期設定

デプロイ後、Vercel Functions経由でDBをセットアップ：

```bash
# ローカルからVercelの本番DBに接続してシード実行
npx vercel env pull .env.production
npx prisma db push
npm run db:seed
```

---

## ローカル開発Tips

### データベースGUI

```bash
npm run db:studio
```

http://localhost:5555 でPrisma Studioが起動

### テスト実行

```bash
npm run test        # watchモード
npm run test:run    # 1回実行
```

### 品質チェック（コミット前に必ず実行）

```bash
npm run check-all
```

## ディレクトリ構成

```
src/
├── app/
│   ├── (auth)/              # 認証ページ
│   ├── (dashboard)/         # スタッフ向け (14ページ)
│   ├── (portal)/            # 患者ポータル (6ページ)
│   └── api/                 # API Routes
├── components/              # 57コンポーネント
│   ├── ui/                  # shadcn/ui
│   ├── ent/                 # 耳鼻科専用
│   ├── layout/              # レイアウト
│   └── ...
├── lib/
│   ├── auth.ts              # NextAuth設定
│   ├── security.ts          # セキュリティ
│   ├── audit.ts             # 監査ログ
│   ├── design-tokens.ts     # デザインシステム
│   ├── fonts.ts             # フォント設定
│   └── labels.ts            # UI文字列
├── server/routers/          # tRPC API (13ルーター)
└── types/                   # 型定義
```

## データベース

### マルチテナント

全テーブルに `tenantId` を持ち、データを分離。

### 主要モデル (35個)

- **認証**: Tenant, User, Account, Session
- **診療**: Patient, MedicalRecord, Appointment, Prescription
- **耳鼻科**: AudiometryTest, TympanometryTest, EndoscopyExam, AllergyTest
- **問診**: QuestionnaireTemplate, QuestionnaireResponse
- **請求**: Invoice, InvoiceItem
- **ポータル**: PatientMessage, PatientNotification

### ユーザーロール

ADMIN, DOCTOR, NURSE, STAFF, PATIENT

## セキュリティ

- HIPAA準拠監査ログ
- アカウントロックアウト (5回失敗で15分)
- レート制限 (認証5回/15分、API 100回/分)
- パスワードポリシー (12文字以上、複雑性要件)
- CSRFトークン、CSPヘッダー

詳細は [docs/SECURITY.md](docs/SECURITY.md) を参照。

## ドキュメント

- [設計ガイドライン](CLAUDE.md) - 技術仕様・コード規則
- [診療フローガイド](docs/WORKFLOW.md) - 業務フロー・操作手順
- [デザインシステム](docs/DESIGN.md) - カラー・タイポグラフィ
- [セキュリティ](docs/SECURITY.md) - 認証・監査ログ

## ライセンス

MIT
