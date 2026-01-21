# 患者モデル マイグレーションガイド

本ドキュメントは、患者(Patient)モデルの再設計に伴うマイグレーション手順を記載する。

## 変更概要

### 新規必須フィールド

| フィールド | 型 | 説明 | デフォルト値戦略 |
|-----------|-----|------|-----------------|
| `firstNameKana` | String | 名（カナ） | 既存: `firstName` をカタカナ変換、または空文字 |
| `lastNameKana` | String | 姓（カナ） | 既存: `lastName` をカタカナ変換、または空文字 |
| `phone` | String | 電話番号 | 既存: `"未登録"` |
| `address` | String | 住所 | 既存: `"未登録"` |
| `insurerNumber` | String | 保険者番号 | 既存: `"00000000"` |
| `insuredNumber` | String | 被保険者番号 | 既存: `"0000000000"` |

### 新規オプションフィールド

- `emergencyRelationship` - 緊急連絡先の続柄
- `myNumberConsent` - マイナンバーカード同意
- `firstVisitDate` / `lastVisitDate` - 初診日/最終来院日
- `familyHistory` - 家族歴
- `contraindications` - 禁忌情報
- `currentMedications` - 服薬中の薬
- `healthCheckInfo` - 特定健診情報
- `pregnant` - 妊娠中フラグ
- `insuranceSymbol` / `insuranceExpiration` / `insuranceCategory` - 保険詳細
- `limitCertification` - 限度額認定
- `publicPayerNumber` / `publicRecipientNumber` / `publicCategory` / `publicExpiration` - 公費情報

### 変更されたフィールド

| フィールド | 変更前 | 変更後 |
|-----------|--------|--------|
| `insuranceType` | String? | Enum (InsuranceType)? |

### 新規Enum

- `InsuranceType`: NATIONAL_HEALTH_INSURANCE, EMPLOYEES_INSURANCE, MUTUAL_AID_INSURANCE, LATE_STAGE_ELDERLY, OTHER
- `InsuranceCategory`: INSURED, DEPENDENT
- `PublicCategory`: LIVELIHOOD_PROTECTION, INTRACTABLE_DISEASE, MENTAL_HEALTH, CHILD_MEDICAL, ATOMIC_BOMB_SURVIVOR, SPECIFIED_DISEASE, MATERNAL_HEALTH, OTHER

---

## マイグレーション手順

### 1. 新規環境（データなし）

```bash
npx prisma db push
npx prisma db seed
```

### 2. 既存環境（データあり）

#### Step 1: マイグレーションファイル生成

```bash
npx prisma migrate dev --name patient_model_redesign
```

#### Step 2: マイグレーションSQLを編集

生成された `prisma/migrations/YYYYMMDD_patient_model_redesign/migration.sql` を以下のように編集:

```sql
-- 1. 新規オプションフィールドを追加（デフォルトなし）
ALTER TABLE "patients" ADD COLUMN "emergencyRelationship" TEXT;
ALTER TABLE "patients" ADD COLUMN "myNumberConsent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "patients" ADD COLUMN "firstVisitDate" TIMESTAMP(3);
ALTER TABLE "patients" ADD COLUMN "lastVisitDate" TIMESTAMP(3);
ALTER TABLE "patients" ADD COLUMN "familyHistory" TEXT;
ALTER TABLE "patients" ADD COLUMN "contraindications" TEXT;
ALTER TABLE "patients" ADD COLUMN "currentMedications" TEXT;
ALTER TABLE "patients" ADD COLUMN "healthCheckInfo" TEXT;
ALTER TABLE "patients" ADD COLUMN "pregnant" BOOLEAN;
ALTER TABLE "patients" ADD COLUMN "insuranceSymbol" TEXT;
ALTER TABLE "patients" ADD COLUMN "insuranceExpiration" TIMESTAMP(3);
ALTER TABLE "patients" ADD COLUMN "insuranceCategory" TEXT;
ALTER TABLE "patients" ADD COLUMN "limitCertification" TEXT;
ALTER TABLE "patients" ADD COLUMN "publicPayerNumber" TEXT;
ALTER TABLE "patients" ADD COLUMN "publicRecipientNumber" TEXT;
ALTER TABLE "patients" ADD COLUMN "publicCategory" TEXT;
ALTER TABLE "patients" ADD COLUMN "publicExpiration" TIMESTAMP(3);

-- 2. 新規必須フィールドをデフォルト付きで追加
ALTER TABLE "patients" ADD COLUMN "insurerNumber" TEXT NOT NULL DEFAULT '00000000';
ALTER TABLE "patients" ADD COLUMN "insuredNumber" TEXT NOT NULL DEFAULT '0000000000';

-- 3. 既存オプションフィールドを必須に変更（デフォルト設定後）
UPDATE "patients" SET "firstNameKana" = '' WHERE "firstNameKana" IS NULL;
UPDATE "patients" SET "lastNameKana" = '' WHERE "lastNameKana" IS NULL;
UPDATE "patients" SET "phone" = '未登録' WHERE "phone" IS NULL;
UPDATE "patients" SET "address" = '未登録' WHERE "address" IS NULL;

ALTER TABLE "patients" ALTER COLUMN "firstNameKana" SET NOT NULL;
ALTER TABLE "patients" ALTER COLUMN "lastNameKana" SET NOT NULL;
ALTER TABLE "patients" ALTER COLUMN "phone" SET NOT NULL;
ALTER TABLE "patients" ALTER COLUMN "address" SET NOT NULL;

-- 4. insuranceType を Enum に変換（既存データのマッピング）
UPDATE "patients" SET "insuranceType" = 'EMPLOYEES_INSURANCE' WHERE "insuranceType" = '社会保険';
UPDATE "patients" SET "insuranceType" = 'NATIONAL_HEALTH_INSURANCE' WHERE "insuranceType" = '国民健康保険';
UPDATE "patients" SET "insuranceType" = 'MUTUAL_AID_INSURANCE' WHERE "insuranceType" = '共済組合';
UPDATE "patients" SET "insuranceType" = 'LATE_STAGE_ELDERLY' WHERE "insuranceType" = '後期高齢者医療';
UPDATE "patients" SET "insuranceType" = 'OTHER' WHERE "insuranceType" IS NOT NULL
  AND "insuranceType" NOT IN ('EMPLOYEES_INSURANCE', 'NATIONAL_HEALTH_INSURANCE', 'MUTUAL_AID_INSURANCE', 'LATE_STAGE_ELDERLY');

-- 5. インデックス追加
CREATE INDEX "patients_lastNameKana_firstNameKana_idx" ON "patients"("lastNameKana", "firstNameKana");

-- 6. デフォルト値を削除（必須フィールドのみ）
ALTER TABLE "patients" ALTER COLUMN "insurerNumber" DROP DEFAULT;
ALTER TABLE "patients" ALTER COLUMN "insuredNumber" DROP DEFAULT;
```

#### Step 3: マイグレーション実行

```bash
npx prisma migrate deploy
```

#### Step 4: Prisma Client再生成

```bash
npx prisma generate
```

---

## ロールバック手順

問題が発生した場合のロールバック:

```sql
-- 新規フィールドを削除
ALTER TABLE "patients" DROP COLUMN IF EXISTS "emergencyRelationship";
ALTER TABLE "patients" DROP COLUMN IF EXISTS "myNumberConsent";
-- ... 他の新規フィールドも同様

-- 必須フィールドをオプションに戻す
ALTER TABLE "patients" ALTER COLUMN "firstNameKana" DROP NOT NULL;
ALTER TABLE "patients" ALTER COLUMN "lastNameKana" DROP NOT NULL;
ALTER TABLE "patients" ALTER COLUMN "phone" DROP NOT NULL;
ALTER TABLE "patients" ALTER COLUMN "address" DROP NOT NULL;

-- インデックス削除
DROP INDEX IF EXISTS "patients_lastNameKana_firstNameKana_idx";
```

---

## 検証チェックリスト

- [ ] マイグレーション完了後、全既存患者データが保持されている
- [ ] 新規患者登録が正常に動作する
- [ ] 既存患者の編集が正常に動作する
- [ ] 患者検索（カナ検索含む）が正常に動作する
- [ ] `npm run check-all` がパスする

---

## 注意事項

1. 本番環境では必ずバックアップを取得してからマイグレーションを実行すること
2. マイグレーション中はアプリケーションをメンテナンスモードにすることを推奨
3. 大量データがある場合、バッチ処理での更新を検討
