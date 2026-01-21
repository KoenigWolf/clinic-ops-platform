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

  users     User[]
  patients  Patient[]
}

model User {
  id        String   @id @default(cuid())
  tenantId  String
  role      UserRole
  email     String
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant    Tenant   @relation(fields: [tenantId], references: [id])

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

  appointments Appointment[]
  visits       Visit[]
  records      MedicalRecord[]
  prescriptions Prescription[]
  invoices      Invoice[]

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

  visit     Visit?

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

  // 取り込んだ問診（監査目的）
  attachedQuestionnaireResponseId String?

  tenant  Tenant  @relation(fields: [tenantId], references: [id])
  patient Patient @relation(fields: [patientId], references: [id])
  visit   Visit?  @relation(fields: [visitId], references: [id])

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
  recordId    String?

  tenant     Tenant                @relation(fields: [tenantId], references: [id])
  template   QuestionnaireTemplate @relation(fields: [templateId], references: [id])
  patient    Patient?              @relation(fields: [patientId], references: [id])
  appointment Appointment?         @relation(fields: [appointmentId], references: [id])

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
  answersJson: z.unknown(), // schemaJson で検証するならここで refine
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

# tRPC ルータ I/F 草案（意図ベース）

> 置き場所例: `src/server/routers/*.ts`
> ポイント：updateStatusのような汎用は作らない。必ずユースケース名で。

```ts
// appointment router
appointment.create(input: appointmentCreateInput)
appointment.confirm(input: appointmentConfirmInput)
appointment.cancel(input: appointmentCancelInput)
appointment.markNoShow({ appointmentId })

// visit router
visit.checkIn(input: visitCheckInInput)            // creates Visit if not exists, sets checkedInAt, WAITING
visit.start(input: visitStartInput)                // WAITING -> IN_PROGRESS, sets startedAt
visit.complete(input: visitCompleteInput)          // IN_PROGRESS -> COMPLETED, sets completedAt
visit.startOnline(input: visitStartOnlineInput)    // creates VideoSession + Daily room, keeps Visit IN_PROGRESS

// video router
video.getToken({ videoSessionId })                 // Daily token
video.endSession({ videoSessionId })               // sets ENDED (optional: called by server on webhook)

// questionnaire router
questionnaire.submitResponse(input: questionnaireSubmitResponseInput)
questionnaire.markReviewed(input: questionnaireMarkReviewedInput)
questionnaire.attachToRecord(input: questionnaireAttachToRecordInput)

// record router
record.create(input: recordCreateInput)

// billing router
billing.createInvoice(input: invoiceCreateInput)   // creates Invoice + InvoiceItems (DRAFT)
billing.issueInvoice(input: invoiceIssueInput)     // DRAFT -> ISSUED, sets issuedAt
billing.markPaid(input: invoiceMarkPaidInput)      // ISSUED/SENT -> PAID, sets paidAt
billing.cancelInvoice(input: invoiceCancelInput)   // -> CANCELLED

// portal router (patient-scoped)
portal.myAppointments()
portal.myMessages()
portal.myMedications()
portal.myInvoices() // planned
```

---

# 実装時の必須ガード（最短で効くやつ）

* 全 procedure で tenantId フィルタ必須
* Visit系は AppointmentとtenantId一致を必ず確認
* Questionnaire attach は RecordとtenantId一致 + ResponseとtenantId一致 を必ず確認
* PHI対象（Patient/Record/Prescription/Invoice/QuestionnaireResponse）はアクセス・変更で監査ログ
