# セキュリティガイドライン

医療情報システムとしてHIPAA準拠およびグローバルセキュリティ基準に基づいて設計。

## 主要セキュリティファイル

| ファイル | 目的 |
|---------|------|
| `src/lib/security.ts` | ヘッダー、レート制限、サニタイズ、パスワードポリシー |
| `src/lib/audit.ts` | HIPAA準拠監査ログ |
| `src/lib/auth.ts` | 認証、セッション管理、アカウントロックアウト |
| `src/middleware.ts` | セキュリティヘッダー適用、レート制限実行 |

---

## 認証・認可

### セッション設定

- 絶対最大: 24時間
- アイドルタイムアウト: 30分
- 更新間隔: 5分

### アカウントロックアウト

5回連続失敗で15分間ロック。

### ロールベースアクセス制御

| Procedure | アクセス可能ロール |
|-----------|------------------|
| `protectedProcedure` | 認証済み全員 |
| `doctorProcedure` | ADMIN, DOCTOR |
| `adminProcedure` | ADMIN |

### Cookie設定（本番環境）

`__Secure-` prefix、HttpOnly、SameSite=lax、Secure

---

## HIPAA準拠

### PHI（保護対象医療情報）エンティティ

Patient, MedicalRecord, Prescription, LabResult, MedicalImage, AudiometryTest, TympanometryTest, VestibularTest, EndoscopyExam, AllergyTest, QuestionnaireResponse, Document, PatientMessage, MedicationRecord

### 監査ログ必須タイミング

- PHI読み取り時: `logPhiAccess()`
- PHI作成・更新・削除時: `logPhiModification()`
- 認証イベント: `logAuthEvent()`

### 監査ログに記録される情報

action, entityType, entityId, userId, tenantId, ipAddress, userAgent, oldData, newData

---

## セキュリティヘッダー

middlewareで全レスポンスに適用:

- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Content-Security-Policy: default-src 'self' + Daily.co許可
- Strict-Transport-Security: 本番環境のみ
- Permissions-Policy: 危険な機能を無効化

---

## レート制限

| エンドポイント種別 | 制限 |
|------------------|------|
| 認証 (`/api/auth`, `/login`) | 15分で5回 |
| API一般 | 1分で100回 |
| アップロード | 1分で10回 |

超過時は429 Too Many Requestsを返却。

---

## ファイルアップロード

`src/app/api/upload/route.ts` で実装:

1. 認証・ロールチェック（ADMIN/DOCTOR/NURSE/STAFF）
2. MIMEタイプホワイトリスト（JPEG, PNG, WebP, GIF）
3. 拡張子とMIMEタイプの整合性チェック
4. Magic Bytes検証（実ファイル内容確認）
5. サイズ制限（10MB）
6. パストラバーサル防止
7. 暗号学的に安全なファイル名生成

---

## 入力検証

### Zodスキーマ

全API入力は必ずZodで検証。

### サニタイズユーティリティ

| 関数 | 用途 |
|-----|------|
| `sanitizeHtml()` | XSS防止 |
| `sanitizeEmail()` | メール検証・正規化 |
| `sanitizePhone()` | 電話番号検証（日本形式） |
| `sanitizeErrorMessage()` | エラーメッセージから機密情報除去 |
| `validatePassword()` | パスワードポリシー検証 |

### パスワードポリシー

最小12文字、大文字・小文字・数字・特殊文字必須

---

## 開発ルール

### 必須

- 全クエリに `tenantId` フィルタ
- PHIアクセスは監査ログ記録
- 入力はZodで検証
- エラーメッセージはサニタイズ
- 機密データはレスポンスから除外

### 禁止

- tenantIDなしのクエリ
- 生SQL（`$executeRaw`）
- エラー詳細の露出
- ユーザー入力をそのまま使用
- 機密情報のログ出力

---

## チェックリスト

### 新機能追加時

- [ ] 適切なProcedure（protected/doctor/admin）を使用
- [ ] tenantIdフィルタを含める
- [ ] 入力をZodで検証
- [ ] PHIアクセスに監査ログ追加
- [ ] エラーメッセージが機密情報を漏洩しない

### コードレビュー時

- [ ] SQLi/XSS/認可バイパスの可能性なし
- [ ] テナント分離が維持されている
- [ ] 機密データがレスポンスに含まれていない
