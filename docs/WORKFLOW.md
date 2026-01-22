# docs/WORKFLOW.md

## 0. このドキュメントの目的

本ドキュメントは、電子カルテ × オンライン診療 統合SaaSにおける 診療フロー（対面/オンライン）を、実装に落とせる粒度で定義する。
特に 状態（Status）を責務単位で分離し、予約・受付・診療・通話・会計が1つのステータスに混ざらないようにする。

---

## 1. ドメインモデル（SSoT）

### 1.1 エンティティと責務

* Appointment: 診療枠（予約としての存在）
* Visit: 受付〜診療行為の進行（来院/オンラインを問わない）
* VideoSession: 通話（オンライン診療の通信手段、診療そのものではない）
* MedicalRecord: カルテ（診療記録）
* QuestionnaireTemplate / QuestionnaireResponse: Web問診（回答のライフサイクルを持つ）
* Prescription: 処方
* Invoice / InvoiceItem: 会計（請求のライフサイクル）

### 1.2 重要原則

* Appointment = 予約、Visit = 診療進行、Invoice = 会計 を分離する
* 通話（VideoSession）と診療（Visit/Record）は別物
* 監査・セキュリティ上、PHIアクセスは必ず監査ログ（実装は `audit.ts`）

---

## 2. ステータス定義と状態遷移

### 2.1 AppointmentStatus（予約枠）

| Status    | 意味           | 主な遷移                              |
| --------- | ------------ | --------------------------------- |
| SCHEDULED | 予約成立         | → CONFIRMED / CANCELLED / NO_SHOW |
| CONFIRMED | 予約確認済        | → CANCELLED / NO_SHOW             |
| CANCELLED | 取消           | 終端                                |
| NO_SHOW   | 未来院（時間経過で確定） | 終端                                |

備考

* WAITING / IN_PROGRESS / COMPLETED は Visit の責務。

---

### 2.2 VisitStatus（受付〜診療）

| Status      | 意味            | 次のアクション     |
| ----------- | ------------- | ----------- |
| NOT_STARTED | Visit未開始（受付前） | check-in    |
| WAITING     | 受付完了・待機       | start       |
| IN_PROGRESS | 診療中           | complete    |
| COMPLETED   | 診療行為完了        | 会計（Invoice） |

---

### 2.3 VideoSessionStatus（通信）

| Status      | 意味          |
| ----------- | ----------- |
| CREATED     | ルーム作成済（未接続） |
| WAITING     | 参加者接続待ち     |
| IN_PROGRESS | 通話中         |
| ENDED       | 通話終了        |
| FAILED      | 失敗（再作成可）    |

重要

* VideoSessionは Visitに付随するが、Visitの状態はVideoSessionに依存しない
  （通話終了 ≠ 診療完了）

---

### 2.4 QuestionnaireResponseStatus（問診）

| Status             | 意味                 |
| ------------------ | ------------------ |
| SUBMITTED          | 患者送信済              |
| REVIEWED           | 医療者が確認済            |
| ATTACHED_TO_RECORD | カルテに取り込み済（参照関係が存在） |

---

### 2.5 InvoiceStatus（請求）

| Status    | 意味               |
| --------- | ---------------- |
| DRAFT     | 作成中              |
| ISSUED    | 請求確定（発行）         |
| SENT      | 送付済（ポータル提示/メール等） |
| PAID      | 入金済              |
| CANCELLED | 取消               |

---

## 3. 標準フロー（概念）

Appointment（予約） → Visit（受付〜診療） → MedicalRecord（カルテ） → Invoice（会計）
オンラインの場合のみ VideoSession が介在する。

---

## 4. 対面診療フロー

### 4.1 新規患者（初診）

1. 来院
2. `/patients` 新規患者登録（保険証含む）
3. `/appointments` 予約作成

   * Appointment: `SCHEDULED`
4. 受付（check-in）

   * Visit作成: `WAITING`
5. 診療開始

   * Visit: `IN_PROGRESS`
6. `/records` カルテ作成/更新（SOAP）
7. `/prescriptions`（必要時）
8. 診療完了

   * Visit: `COMPLETED`
9. `/billing` 請求（Invoice）

   * `DRAFT → ISSUED → PAID`（運用により `SENT` を挟む）

### 4.2 再診患者

* `/patients` 検索 → `/appointments` 予約 → check-in → start → 記録/処方 → complete → 請求

---

## 5. オンライン診療フロー

### 5.1 スタッフ/医師側

1. `/appointments` 予約作成（`isOnline=true`）
2. 当日 check-in（オンライン受付）

   * Visit: `WAITING`
3. `startOnline`

   * Visit: `IN_PROGRESS`
   * VideoSession作成 + Daily room生成（`CREATED → WAITING`）
   * `/video` 遷移
4. 通話（`IN_PROGRESS`）
5. 通話終了（`ENDED/FAILED`）
6. 診療完了（Visit: `COMPLETED`）
7. カルテ/処方/会計

### 5.2 患者（ポータル）

1. `/portal/appointments` で予約確認
2. 「受付する」（check-in をサーバで実行）※運用により自動受付も可
3. 「診療室に入る」（token取得 → `/video`）
4. 通話
5. 終了後：処方/請求を確認（請求は将来 `/portal/billing`）

---

## 6. Web問診フロー

### 6.1 作成（スタッフ）

* `/questionnaire` でテンプレ作成 → URL配布

### 6.2 回答（患者）

* 回答送信 → Response: `SUBMITTED`

### 6.3 確認〜カルテ取り込み（医療者）

* 確認 → `REVIEWED`
* 診療時、カルテに取り込み

  * `attachToRecord(recordId, responseId)` → `ATTACHED_TO_RECORD`
* MedicalRecordは取り込んだresponseIdを保持（監査・再現性）

---

## 7. 会計（Invoice）フロー

* Visitが `COMPLETED` になったら会計が可能
* `createInvoice` で DRAFT
* `issueInvoice` で確定（ISSUED）
* 運用により `sendInvoice`（SENT）
* `markPaid` で PAID
* 取消は `cancelInvoice`（CANCELLED）

---

## 8. 権限（最小）

* 患者：自分の Appointment/VideoSession参加/自分の処方・請求閲覧
* スタッフ：患者登録、予約作成、check-in、請求作成
* 医師：診療開始、カルテ、処方、オンライン開始

---

## 9. API（意図ベース）

「状態を直接更新」ではなく「ユースケース名」で提供する。

* visit.checkIn / visit.start / visit.complete
* visit.startOnline（VideoSession作成を内包）
* appointment.confirm / cancel / markNoShow
* questionnaire.submitResponse / markReviewed / attachToRecord
* billing.createInvoice / issueInvoice / markPaid / cancelInvoice

---

## 10. テナント・監査（必須）

* 全データは tenantId で分離される
* 全クエリは tenantId フィルタ必須
* PHIアクセス・変更は監査ログ必須（`audit.ts`）

---

# Prisma スキーマ草案（必要最小 + 実装可能）

> 置き場所例: `prisma/schema.prisma`（既存があるなら該当部分だけマージ）

```prisma
enum AppointmentStatus {
  SCHEDULED
  CONFIRMED
  CANCELLED
  NO_SHOW
}

enum VisitStatus {
  NOT_STARTED
  WAITING
  IN_PROGRESS
  COMPLETED
}

enum VideoSessionStatus {
  CREATED
  WAITING
  IN_PROGRESS
  ENDED
  FAILED
}

enum QuestionnaireResponseStatus {
  SUBMITTED
  REVIEWED
  ATTACHED_TO_RECORD
}

enum InvoiceStatus {
  DRAFT
  ISSUED
  SENT
  PAID
  CANCELLED
}

enum UserRole {
  ADMIN
  DOCTOR
  NURSE
  STAFF
  PATIENT
}

enum AppointmentType {
  INITIAL
  FOLLOWUP
}

model Tenant {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users                  User[]
  patients               Patient[]
  appointments           Appointment[]
  visits                 Visit[]
  videoSessions          VideoSession[]
  medicalRecords         MedicalRecord[]
  questionnaireTemplates QuestionnaireTemplate[]
  questionnaireResponses QuestionnaireResponse[]
  prescriptions          Prescription[]
  invoices               Invoice[]
  invoiceItems           InvoiceItem[]
}

model User {
  id        String   @id @default(cuid())
  tenantId  String
  role      UserRole
  email     String
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant       Tenant        @relation(fields: [tenantId], references: [id])
  appointments Appointment[]

  @@index([tenantId])
  @@unique([tenantId, email])
}

model Patient {
  id        String   @id @default(cuid())
  tenantId  String
  patientNo String   // 自動発行
  name      String
  birthDate DateTime
  gender    String?
  phone     String?
  email     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant    Tenant   @relation(fields: [tenantId], references: [id])

  appointments           Appointment[]
  visits                 Visit[]
  records                MedicalRecord[]
  prescriptions          Prescription[]
  invoices               Invoice[]
  questionnaireResponses QuestionnaireResponse[]

  @@index([tenantId])
  @@unique([tenantId, patientNo])
}

model Appointment {
  id          String            @id @default(cuid())
  tenantId    String
  patientId   String
  doctorId    String?
  scheduledAt DateTime
  type        AppointmentType
  isOnline    Boolean           @default(false)
  status      AppointmentStatus @default(SCHEDULED)
  notes       String?
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  tenant    Tenant  @relation(fields: [tenantId], references: [id])
  patient   Patient @relation(fields: [patientId], references: [id])
  doctor    User?   @relation(fields: [doctorId], references: [id])

  visit                  Visit?
  questionnaireResponses QuestionnaireResponse[]

  @@index([tenantId])
  @@index([tenantId, patientId, scheduledAt])
  @@index([tenantId, status, scheduledAt])
}

model Visit {
  id            String      @id @default(cuid())
  tenantId      String
  appointmentId String      @unique
  patientId     String
  status        VisitStatus @default(WAITING)
  checkedInAt   DateTime?
  startedAt     DateTime?
  completedAt   DateTime?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  tenant      Tenant      @relation(fields: [tenantId], references: [id])
  appointment Appointment @relation(fields: [appointmentId], references: [id])
  patient     Patient     @relation(fields: [patientId], references: [id])

  videoSessions  VideoSession[]
  record         MedicalRecord?
  invoice        Invoice?

  @@index([tenantId])
  @@index([tenantId, patientId, createdAt])
  @@index([tenantId, status, createdAt])
}

model VideoSession {
  id           String            @id @default(cuid())
  tenantId     String
  visitId      String
  provider     String            @default("DAILY")
  roomName     String
  status       VideoSessionStatus @default(CREATED)
  startedAt    DateTime?
  endedAt      DateTime?
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt

  tenant       Tenant @relation(fields: [tenantId], references: [id])
  visit        Visit  @relation(fields: [visitId], references: [id])

  @@index([tenantId])
  @@index([tenantId, visitId])
  @@index([tenantId, status, createdAt])
}

model MedicalRecord {
  id        String   @id @default(cuid())
  tenantId  String
  patientId String
  visitId   String?  @unique
  soapS     String?
  soapO     String?
  soapA     String?
  soapP     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant  Tenant  @relation(fields: [tenantId], references: [id])
  patient Patient @relation(fields: [patientId], references: [id])
  visit   Visit?  @relation(fields: [visitId], references: [id])

  // 取り込んだ問診（一対多）- QuestionnaireResponse側でonDelete: Restrictを設定
  questionnaireResponses QuestionnaireResponse[]

  @@index([tenantId])
  @@index([tenantId, patientId, createdAt])
}

model QuestionnaireTemplate {
  id        String   @id @default(cuid())
  tenantId  String
  name      String
  // JSONで質問定義（最小実装）。将来、Question/Choiceに正規化可能
  schemaJson Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant Tenant @relation(fields: [tenantId], references: [id])
  responses QuestionnaireResponse[]

  @@index([tenantId])
}

model QuestionnaireResponse {
  id          String                     @id @default(cuid())
  tenantId    String
  templateId  String
  patientId   String?
  appointmentId String?
  status      QuestionnaireResponseStatus @default(SUBMITTED)
  answersJson Json
  submittedAt DateTime                    @default(now())
  reviewedAt  DateTime?
  attachedAt  DateTime?

  tenant      Tenant                @relation(fields: [tenantId], references: [id])
  template    QuestionnaireTemplate @relation(fields: [templateId], references: [id])
  patient     Patient?              @relation(fields: [patientId], references: [id])
  appointment Appointment?          @relation(fields: [appointmentId], references: [id])

  // カルテへの取り込み - onDelete: Restrict により削除不可（監査保全）
  medicalRecordId String?
  medicalRecord   MedicalRecord? @relation(fields: [medicalRecordId], references: [id], onDelete: Restrict)

  @@index([tenantId])
  @@index([tenantId, templateId, submittedAt])
  @@index([tenantId, patientId, submittedAt])
  @@index([tenantId, status, submittedAt])
}

model Prescription {
  id        String   @id @default(cuid())
  tenantId  String
  patientId String
  recordId  String?
  // 最小：JSON。将来 MedicationItem に正規化
  itemsJson Json
  notes     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant  Tenant  @relation(fields: [tenantId], references: [id])
  patient Patient @relation(fields: [patientId], references: [id])

  @@index([tenantId])
  @@index([tenantId, patientId, createdAt])
}

model Invoice {
  id        String      @id @default(cuid())
  tenantId  String
  patientId String
  visitId   String?     @unique
  status    InvoiceStatus @default(DRAFT)
  issuedAt  DateTime?
  sentAt    DateTime?
  paidAt    DateTime?
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt

  tenant  Tenant  @relation(fields: [tenantId], references: [id])
  patient Patient @relation(fields: [patientId], references: [id])
  visit   Visit?  @relation(fields: [visitId], references: [id])

  items   InvoiceItem[]

  @@index([tenantId])
  @@index([tenantId, patientId, createdAt])
  @@index([tenantId, status, createdAt])
}

model InvoiceItem {
  id        String   @id @default(cuid())
  tenantId  String
  invoiceId String
  name      String
  quantity  Int      @default(1)
  unitPrice Int      // 金額（最小）
  createdAt DateTime @default(now())

  tenant  Tenant  @relation(fields: [tenantId], references: [id])
  invoice Invoice @relation(fields: [invoiceId], references: [id])

  @@index([tenantId])
  @@index([tenantId, invoiceId])
}
```

---

# Zod スキーマ草案（入力境界の最小セット）

> 置き場所例: `src/server/schemas/*.ts`

```ts
import { z } from "zod"

export const appointmentCreateInput = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().min(1).optional(),
  scheduledAt: z.coerce.date(),
  type: z.enum(["INITIAL", "FOLLOWUP"]),
  isOnline: z.boolean().default(false),
  notes: z.string().max(2000).optional(),
})

export const appointmentConfirmInput = z.object({
  appointmentId: z.string().min(1),
})

export const appointmentCancelInput = z.object({
  appointmentId: z.string().min(1),
  reason: z.string().max(2000).optional(),
})

export const visitCheckInInput = z.object({
  appointmentId: z.string().min(1),
})

export const visitStartInput = z.object({
  visitId: z.string().min(1),
})

export const visitCompleteInput = z.object({
  visitId: z.string().min(1),
})

export const visitStartOnlineInput = z.object({
  visitId: z.string().min(1),
})

export const questionnaireSubmitResponseInput = z.object({
  templateId: z.string().min(1),
  patientId: z.string().min(1).optional(),
  appointmentId: z.string().min(1).optional(),
  answersJson: z.record(z.unknown()), // 実行時にtemplate.schemaJsonで検証（下記参照）
})

export const questionnaireMarkReviewedInput = z.object({
  responseId: z.string().min(1),
})

export const questionnaireAttachToRecordInput = z.object({
  responseId: z.string().min(1),
  recordId: z.string().min(1),
})

export const recordCreateInput = z.object({
  patientId: z.string().min(1),
  visitId: z.string().min(1).optional(),
  soapS: z.string().max(20000).optional(),
  soapO: z.string().max(20000).optional(),
  soapA: z.string().max(20000).optional(),
  soapP: z.string().max(20000).optional(),
  attachedQuestionnaireResponseId: z.string().min(1).optional(),
})

export const invoiceCreateInput = z.object({
  patientId: z.string().min(1),
  visitId: z.string().min(1).optional(),
  items: z.array(z.object({
    name: z.string().min(1).max(200),
    quantity: z.number().int().min(1).max(999).default(1),
    unitPrice: z.number().int().min(0).max(10_000_000),
  })).min(1),
})

export const invoiceIssueInput = z.object({
  invoiceId: z.string().min(1),
})

export const invoiceMarkPaidInput = z.object({
  invoiceId: z.string().min(1),
})

export const invoiceCancelInput = z.object({
  invoiceId: z.string().min(1),
  reason: z.string().max(2000).optional(),
})
```

---

# tRPC ルータ I/F 草案

> 置き場所例: `src/server/routers/*.ts`
> 原則：updateStatusのような汎用は作らない。必ずユースケース名で。

## 共通パラメータ

```ts
// ページネーション（全list系で使用）
type PaginationInput = {
  page?: number      // default: 1
  limit?: number     // default: 20, max: 100
}

// 日付範囲フィルタ
type DateRangeInput = {
  from?: Date
  to?: Date
}
```

## patient router

```ts
// CRUD
patient.create(input: patientInputSchema)
patient.update({ id: string, data: patientInputSchema.partial() })
patient.get({ id: string })
patient.delete({ id: string })  // soft delete

// Query
patient.list({
  search?: string,              // 氏名・カナ・患者番号・電話番号
  isActive?: boolean,           // default: true
  ...PaginationInput
})
// Returns: { patients: Patient[], total: number, pages: number }
```

## appointment router

```ts
// CRUD
appointment.create(input: appointmentCreateInput)
appointment.update({ id: string, data: appointmentUpdateInput })
appointment.get({ id: string })

// Query
appointment.list({
  patientId?: string,
  doctorId?: string,
  status?: AppointmentStatus | AppointmentStatus[],
  isOnline?: boolean,
  ...DateRangeInput,            // scheduledAt range
  ...PaginationInput
})
// Returns: { appointments: Appointment[], total: number, pages: number }

// State transitions
appointment.confirm({ appointmentId: string })
appointment.cancel({ appointmentId: string, reason?: string })
appointment.markNoShow({ appointmentId: string })
appointment.markNoShowBatch({ appointmentIds: string[] })  // batch
```

## visit router

```ts
// Query
visit.get({ id: string })
visit.getByAppointment({ appointmentId: string })
visit.listByPatient({
  patientId: string,
  status?: VisitStatus | VisitStatus[],
  ...DateRangeInput,            // createdAt range
  ...PaginationInput
})
// Returns: { visits: Visit[], total: number, pages: number }

// State transitions
visit.checkIn({ appointmentId: string })        // creates Visit, WAITING
visit.start({ visitId: string })                // WAITING -> IN_PROGRESS
visit.complete({ visitId: string })             // IN_PROGRESS -> COMPLETED
visit.startOnline({ visitId: string })          // creates VideoSession + Daily room
```

## video router

```ts
video.getToken({ videoSessionId: string })      // Daily token for participant
video.endSession({ videoSessionId: string })    // ENDED (or via webhook)
video.getSession({ id: string })
video.listByVisit({ visitId: string })
```

## record router (MedicalRecord)

```ts
// CRUD
record.create(input: recordCreateInput)
record.update({ id: string, data: recordUpdateInput })
record.get({ id: string })

// Query
record.listByPatient({
  patientId: string,
  doctorId?: string,
  ...DateRangeInput,            // recordDate range
  ...PaginationInput
})
// Returns: { records: MedicalRecord[], total: number, pages: number }

record.getByVisit({ visitId: string })
```

## questionnaire router

```ts
// Template CRUD
questionnaire.createTemplate(input: templateCreateInput)
questionnaire.updateTemplate({ id: string, data: templateUpdateInput })
questionnaire.getTemplate({ id: string })
questionnaire.listTemplates({ ...PaginationInput })

// Response
questionnaire.submitResponse(input: questionnaireSubmitResponseInput)
questionnaire.getResponse({ id: string })
questionnaire.listResponses({
  patientId?: string,
  templateId?: string,
  status?: QuestionnaireResponseStatus,
  ...DateRangeInput,
  ...PaginationInput
})

// State transitions
questionnaire.markReviewed({ responseId: string })
questionnaire.attachToRecord({ responseId: string, recordId: string })
```

## billing router (Invoice)

```ts
// CRUD
billing.createInvoice(input: invoiceCreateInput)
billing.updateInvoice({ id: string, data: invoiceUpdateInput })  // DRAFT only
billing.getInvoice({ id: string })

// Query
billing.listByPatient({
  patientId: string,
  status?: InvoiceStatus | InvoiceStatus[],
  ...DateRangeInput,
  ...PaginationInput
})
billing.listByStatus({
  status: InvoiceStatus | InvoiceStatus[],
  ...DateRangeInput,
  ...PaginationInput
})
// Returns: { invoices: Invoice[], total: number, pages: number }

// State transitions
billing.issueInvoice({ invoiceId: string })     // DRAFT -> ISSUED
billing.sendInvoice({ invoiceId: string })      // ISSUED -> SENT (optional)
billing.markPaid({ invoiceId: string })         // ISSUED/SENT -> PAID
billing.cancelInvoice({ invoiceId: string, reason?: string })
```

## portal router (patient-scoped)

```ts
// 患者自身のデータのみアクセス可能（セッションからpatientIdを取得）
portal.myAppointments({
  status?: AppointmentStatus[],
  ...DateRangeInput,
  ...PaginationInput
})
portal.myVisits({ ...PaginationInput })
portal.myRecords({ ...PaginationInput })
portal.myMessages({ unreadOnly?: boolean, ...PaginationInput })
portal.myMedications({ ...PaginationInput })
portal.myInvoices({ status?: InvoiceStatus[], ...PaginationInput })
portal.myQuestionnaireResponses({ ...PaginationInput })
```

---

# 実装時の必須ガード

* 全 procedure で tenantId フィルタ必須
* Visit系は AppointmentとtenantId一致を必ず確認
* Questionnaire attach は RecordとtenantId一致 + ResponseとtenantId一致 を必ず確認
* PHI対象（Patient/Record/Prescription/Invoice/QuestionnaireResponse）はアクセス・変更で監査ログ
* **QuestionnaireResponse削除禁止**: カルテに取り込まれた問診回答は `onDelete: Restrict` により削除不可（監査整合性のため）

## 問診回答とカルテの関係（監査整合性）

```
MedicalRecord (1) ←─── (0..1) QuestionnaireResponse
                  attachedQuestionnaireResponseId (FK, unique)
                  onDelete: Restrict
```

* MedicalRecordは最大1つのQuestionnaireResponseを参照可能
* QuestionnaireResponseがカルテに取り込まれると、そのResponseは削除不可
* 削除を試みるとDBレベルでエラー（Prisma: P2003）
* 監査目的で問診内容の改ざん・消失を防止

---

# 問診回答バリデーション実装ガイド

## 背景

`answersJson`はテンプレートごとに異なる構造を持つため、Zodスキーマでは`z.record(z.unknown())`として受け入れる。
ただし、PHIを含む可能性があるため、永続化前に必ず`template.schemaJson`に対して検証を行う。

## 実装パターン（AJV使用）

```ts
import Ajv from "ajv"
import { TRPCError } from "@trpc/server"

const ajv = new Ajv({ allErrors: true })

// questionnaire.submitResponse の実装
submitResponse: protectedProcedure
  .input(questionnaireSubmitResponseInput)
  .mutation(async ({ ctx, input }) => {
    // 1. テンプレート取得
    const template = await ctx.prisma.questionnaireTemplate.findFirst({
      where: {
        id: input.templateId,
        tenantId: ctx.tenantId,
      },
    })

    if (!template) {
      throw new TRPCError({ code: "NOT_FOUND", message: "テンプレートが見つかりません" })
    }

    // 2. schemaJsonでanswersJsonを検証
    const validate = ajv.compile(template.schemaJson as object)
    const valid = validate(input.answersJson)

    if (!valid) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "回答内容がテンプレートの形式に一致しません",
        cause: validate.errors,
      })
    }

    // 3. 検証成功後のみ永続化
    const response = await ctx.prisma.questionnaireResponse.create({
      data: {
        tenantId: ctx.tenantId,
        templateId: input.templateId,
        patientId: input.patientId,
        appointmentId: input.appointmentId,
        answersJson: input.answersJson,
        status: "SUBMITTED",
      },
    })

    // 4. PHI監査ログ
    await logPhiModification({
      action: "CREATE",
      entityType: "QuestionnaireResponse",
      entityId: response.id,
      userId: ctx.session.user.id,
      tenantId: ctx.tenantId,
      newData: { templateId: input.templateId },
      ipAddress: ctx.requestMeta.ipAddress,
      userAgent: ctx.requestMeta.userAgent,
    })

    return response
  })
```

## schemaJson の形式例

テンプレート作成時に保存する JSON Schema:

```json
{
  "type": "object",
  "required": ["chiefComplaint", "symptomDuration"],
  "properties": {
    "chiefComplaint": {
      "type": "string",
      "minLength": 1,
      "maxLength": 2000
    },
    "symptomDuration": {
      "type": "string",
      "enum": ["today", "2-3days", "1week", "2weeks", "1month", "longer"]
    },
    "painLevel": {
      "type": "integer",
      "minimum": 0,
      "maximum": 10
    },
    "allergies": {
      "type": "array",
      "items": { "type": "string" }
    },
    "currentMedications": {
      "type": "string",
      "maxLength": 2000
    }
  },
  "additionalProperties": false
}
```

## 必須チェック項目

1. テンプレートが存在し、同一テナントに属すること
2. answersJsonがschemaJsonに適合すること
3. `additionalProperties: false`で予期しないフィールドを拒否
4. 文字列フィールドには`maxLength`を設定してDoS対策
5. 検証失敗時は詳細なエラーを返さない（攻撃者へのヒント防止）
