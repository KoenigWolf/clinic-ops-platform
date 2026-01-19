# Karute - 電子カルテ × オンライン診療 統合SaaS

クリニック向けの電子カルテとオンライン診療を統合したSaaSアプリケーション。
マルチテナント対応で、複数のクリニックが同一システムを利用可能。

## 主な機能

### スタッフ向け機能

| 機能 | パス | 説明 |
|------|------|------|
| 患者管理 | /patients | 患者情報の登録・検索・編集 |
| 予約管理 | /appointments | 予約の作成・受付・ステータス管理 |
| 診療記録 | /records | SOAP形式でのカルテ記載 |
| オンライン診療 | /video | Daily.co によるビデオ通話 |
| 処方管理 | /prescriptions | 処方箋の作成・管理 |
| 請求管理 | /billing | 請求書の作成・支払い管理 |
| Web問診 | /questionnaire | 問診テンプレート作成・回答管理 |
| 文書テンプレート | /documents | 紹介状・診断書などのテンプレート |
| 経営分析 | /analytics | 売上・患者数などのダッシュボード |
| 耳鼻科専用 | /ent | 聴力検査・内視鏡所見など専門機能 |

### 患者ポータル

| 機能 | パス | 説明 |
|------|------|------|
| ダッシュボード | /portal | 概要表示・次回予約・通知 |
| 予約確認 | /portal/appointments | 予約一覧・オンライン診療入室 |
| メッセージ | /portal/messages | クリニックとのやり取り |
| 処方・お薬 | /portal/medications | 処方履歴・服薬中の薬 |
| 検査結果 | /portal/results | 検査結果の閲覧 |
| 通知 | /portal/notifications | お知らせ一覧 |

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| API | tRPC (型安全なAPI) |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | NextAuth.js v5 (Auth.js) |
| Video | Daily.co (HIPAA対応) |
| State | React Query (via tRPC) |

## ローカル開発

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数

`.env` ファイルを作成し、以下を設定:

```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
DAILY_API_KEY=your-daily-api-key  # オンライン診療用
```

### 3. データベースセットアップ

```bash
# スキーマをDBに反映
npx prisma db push

# Prisma Client生成
npx prisma generate

# シードデータ投入 (オプション)
npx prisma db seed
```

### 4. 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 でアクセス

### 5. ビルド

```bash
npm run build
```

## ディレクトリ構成

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 認証ページ
│   ├── (dashboard)/       # スタッフ向けダッシュボード
│   ├── (portal)/          # 患者ポータル
│   └── api/               # API Routes
├── components/            # UIコンポーネント
│   ├── ui/               # shadcn/ui
│   └── ...               # 機能別コンポーネント
├── lib/                   # ユーティリティ
├── server/
│   └── routers/          # tRPC routers
└── types/                # 型定義
```

## ドキュメント

- [設計ガイドライン](CLAUDE.md) - 技術仕様・コード規則
- [診療フローガイド](docs/WORKFLOW.md) - 業務フロー・操作手順

## ライセンス

MIT
