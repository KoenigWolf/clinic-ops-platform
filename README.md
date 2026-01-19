# clinic-karute (WIP)

クリニック向けのカルテ/患者/予約/請求/処方/オンライン診療を想定した Web アプリ（検証・学習用の土台）。

## 主な技術スタック

- Next.js (App Router) / React
- Prisma + PostgreSQL
- NextAuth (Credentials)
- tRPC + TanStack Query
- Tailwind CSS + Radix UI

## ローカル開発

### 1) 依存関係のインストール

```bash
npm i
```

### 2) 環境変数

最低限、以下を設定してください。

- `DATABASE_URL` (PostgreSQL)
- `AUTH_SECRET`（または `NEXTAUTH_SECRET`）
- `AUTH_URL`（または `NEXTAUTH_URL`）

### 3) DBマイグレーション

```bash
npm run db:migrate
```

### 4) 起動

```bash
npm run dev
```
