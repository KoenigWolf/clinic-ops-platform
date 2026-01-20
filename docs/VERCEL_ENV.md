# Vercelデプロイ環境変数設定ガイド

Vercelにデプロイする際に必要な環境変数の一覧と設定方法です。

## 必須環境変数

### DATABASE_URL
**説明**: PostgreSQLデータベースの接続文字列  
**例**: `postgresql://user:password@host:5432/database?sslmode=require`  
**取得方法**: 
- Vercel Postgresを使用する場合: Vercelダッシュボードの「Storage」→「Create Database」→「Postgres」で作成後、自動的に環境変数として追加されます
- 外部PostgreSQLを使用する場合: データベースプロバイダー（Supabase、Neon、Railway等）から接続文字列を取得

**重要**: 本番環境では必ずSSL接続（`?sslmode=require`）を使用してください。

---

### NEXTAUTH_SECRET
**説明**: NextAuth.jsのセッション暗号化に使用するシークレットキー  
**生成方法**: 
```bash
openssl rand -base64 32
```
または
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**重要**: 
- 本番環境では必ずランダムな文字列を使用してください
- この値が漏洩するとセッションが危険にさらされます
- 開発環境と本番環境で異なる値を使用してください

---

### NEXTAUTH_URL
**説明**: アプリケーションの公開URL  
**設定値**: 
- **Production**: `https://your-app.vercel.app` またはカスタムドメイン `https://yourdomain.com`
- **Preview**: Vercelが自動的に設定（通常は変更不要）
- **Development**: `http://localhost:3000`

**重要**: 
- 本番環境では必ず `https://` で始まるURLを設定してください
- カスタムドメインを使用する場合は、そのドメインを設定してください

---

## オプション環境変数

### DAILY_API_KEY
**説明**: Daily.co APIキー（オンライン診療のビデオ通話機能で使用）  
**取得方法**: [Daily.co](https://www.daily.co/) にアカウントを作成し、ダッシュボードからAPIキーを取得  
**注意**: 
- この環境変数が設定されていない場合、ビデオ通話機能は動作しませんが、アプリケーション自体は起動します
- 開発時は空でも動作しますが、実際のビデオ通話は使用できません

---

### DAILY_DOMAIN
**説明**: Daily.coのドメイン（例: `your-domain.daily.co`）  
**取得方法**: Daily.coダッシュボードで確認  
**注意**: 
- `DAILY_API_KEY` と併せて設定する必要があります
- この環境変数が設定されていない場合、ビデオ通話機能は動作しません

---

## Vercelでの設定方法

### 1. プロジェクト設定から設定

1. Vercelダッシュボードでプロジェクトを開く
2. 「Settings」→「Environment Variables」を選択
3. 各環境変数を追加:
   - **Key**: 環境変数名（例: `DATABASE_URL`）
   - **Value**: 環境変数の値
   - **Environment**: 適用する環境を選択
     - Production（本番環境）
     - Preview（プレビュー環境）
     - Development（開発環境）

### 2. 環境別の推奨設定

| 環境変数 | Production | Preview | Development |
|---------|-----------|---------|-------------|
| DATABASE_URL | ✅ 必須 | ✅ 必須 | ✅ 必須 |
| NEXTAUTH_SECRET | ✅ 必須 | ✅ 必須 | ✅ 必須 |
| NEXTAUTH_URL | ✅ 必須 | ⚠️ 自動設定 | ✅ 必須 |
| DAILY_API_KEY | ⚠️ オプション | ⚠️ オプション | ⚠️ オプション |
| DAILY_DOMAIN | ⚠️ オプション | ⚠️ オプション | ⚠️ オプション |

---

## 設定後の確認

環境変数を設定したら、以下の手順で確認してください:

1. **再デプロイ**: 環境変数を追加・変更した後は、再デプロイが必要です
   ```bash
   # Vercel CLIを使用する場合
   vercel --prod
   ```

2. **ビルドログの確認**: デプロイ時にビルドログを確認し、エラーがないか確認してください

3. **動作確認**: 
   - アプリケーションが正常に起動するか
   - ログイン機能が動作するか
   - データベース接続が正常か

---

## トラブルシューティング

### エラー: `Missing required environment variable: DATABASE_URL`
**原因**: `DATABASE_URL` が設定されていない  
**解決策**: Vercelダッシュボードで `DATABASE_URL` を設定し、再デプロイ

### エラー: `NEXTAUTH_SECRET is not set`
**原因**: `NEXTAUTH_SECRET` が設定されていない  
**解決策**: ランダムな文字列を生成して設定し、再デプロイ

### ログインできない
**原因**: 
- `NEXTAUTH_URL` が正しく設定されていない
- データベースにユーザーが存在しない（シードが実行されていない）

**解決策**: 
1. `NEXTAUTH_URL` が正しいURL（`https://`で始まる）になっているか確認
2. データベースにシードデータが投入されているか確認

### ビデオ通話が動作しない
**原因**: `DAILY_API_KEY` または `DAILY_DOMAIN` が設定されていない  
**解決策**: Daily.coのAPIキーとドメインを設定し、再デプロイ

---

## セキュリティのベストプラクティス

1. **シークレットキーの管理**
   - `NEXTAUTH_SECRET` は必ずランダムな文字列を使用
   - 環境変数はGitにコミットしない（`.env` は `.gitignore` に含まれている）

2. **データベース接続**
   - 本番環境では必ずSSL接続を使用
   - 接続文字列にパスワードが含まれるため、環境変数として安全に管理

3. **環境の分離**
   - 開発環境、プレビュー環境、本番環境で異なる環境変数を使用
   - 特に `NEXTAUTH_SECRET` は環境ごとに異なる値を使用

---

## 関連ドキュメント

- [NextAuth.js Documentation](https://next-auth.js.org/configuration/options)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Daily.co Documentation](https://docs.daily.co/)
