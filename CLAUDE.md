# 電子カルテ × オンライン診療 統合SaaS - 設計ガイドライン

## プロジェクト概要

医療機関向けの電子カルテとオンライン診療を統合したSaaSアプリケーション。
マルチテナント対応で、複数のクリニックが同一システムを利用可能。

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

## ディレクトリ構成

```
karute/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/              # 認証ページ (login, register)
│   │   ├── (dashboard)/         # スタッフ向けダッシュボード
│   │   │   ├── patients/        # 患者管理
│   │   │   ├── records/         # 診療記録
│   │   │   ├── appointments/    # 予約管理
│   │   │   ├── video/           # オンライン診療
│   │   │   ├── prescriptions/   # 処方管理
│   │   │   ├── billing/         # 請求管理
│   │   │   ├── documents/       # 文書テンプレート
│   │   │   ├── ent/             # 耳鼻科専用機能
│   │   │   ├── questionnaire/   # Web問診
│   │   │   └── settings/        # 設定
│   │   ├── (portal)/            # 患者ポータル
│   │   │   └── portal/
│   │   │       ├── appointments/
│   │   │       ├── messages/
│   │   │       ├── medications/
│   │   │       ├── results/
│   │   │       └── notifications/
│   │   └── api/
│   │       ├── auth/            # NextAuth
│   │       ├── trpc/            # tRPC endpoint
│   │       └── upload/          # ファイルアップロード
│   ├── components/              # UIコンポーネント
│   │   ├── ui/                  # shadcn/ui (変更禁止)
│   │   ├── patients/
│   │   ├── records/
│   │   ├── appointments/
│   │   ├── video/
│   │   └── ...
│   ├── lib/                     # ユーティリティ
│   │   ├── prisma.ts           # Prisma client
│   │   ├── auth.ts             # Auth config
│   │   ├── trpc.ts             # tRPC client
│   │   └── daily.ts            # Daily.co helper
│   ├── server/
│   │   ├── trpc.ts             # tRPC setup
│   │   └── routers/            # API routers
│   │       ├── index.ts        # Root router
│   │       ├── patient.ts
│   │       ├── appointment.ts
│   │       ├── record.ts
│   │       ├── video.ts
│   │       ├── portal.ts       # 患者向けAPI
│   │       └── ...
│   └── types/                   # 型定義
├── prisma/
│   ├── schema.prisma           # DBスキーマ
│   └── seed.ts                 # シードデータ
└── public/
```

## データベース設計原則

### マルチテナント

すべてのテーブルに `tenantId` を持ち、データを分離:

```prisma
model Patient {
  id        String   @id @default(cuid())
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  // ... other fields
}
```

### 主要モデル

| モデル | 説明 |
|--------|------|
| Tenant | クリニック (テナント) |
| User | 医師・スタッフ・患者 (role で区別) |
| Patient | 患者情報 |
| Appointment | 予約 |
| MedicalRecord | 診療記録 (SOAP形式) |
| Prescription | 処方 |
| VideoSession | ビデオ診療セッション |
| LabResult | 検査結果 |
| Invoice | 請求書 |

### User ロール

```typescript
enum Role {
  ADMIN     // システム管理者
  DOCTOR    // 医師
  NURSE     // 看護師
  STAFF     // 事務スタッフ
  PATIENT   // 患者
}
```

### 予約ステータスフロー

```
SCHEDULED → CONFIRMED → WAITING → IN_PROGRESS → COMPLETED
                ↓           ↓
            CANCELLED    NO_SHOW
```

## API設計 (tRPC)

### Router構成

```typescript
// src/server/routers/index.ts
export const appRouter = router({
  patient: patientRouter,
  appointment: appointmentRouter,
  record: recordRouter,
  video: videoRouter,
  portal: portalRouter,  // 患者向け
  // ...
});
```

### Procedure種別

| 種別 | 用途 |
|------|------|
| `protectedProcedure` | 認証必須 |
| `doctorProcedure` | 医師のみ |
| `adminProcedure` | 管理者のみ |

### 命名規則

```typescript
// Router内のprocedure
router({
  list: ...,      // 一覧取得
  get: ...,       // 単一取得
  create: ...,    // 作成
  update: ...,    // 更新
  delete: ...,    // 削除

  // 患者ポータル用 (portal router)
  myAppointments: ...,  // 自分のデータは my* prefix
  myMessages: ...,
});
```

### 必ずテナントIDでフィルタ

```typescript
// Good
const patients = await ctx.prisma.patient.findMany({
  where: { tenantId: ctx.tenantId },  // 必須
});

// Bad - セキュリティホール
const patients = await ctx.prisma.patient.findMany();
```

## UIコンポーネント規則

### shadcn/ui の使用

```typescript
// components/ui/ 配下は自動生成、直接編集しない
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
```

### フォーム

react-hook-form + zod を使用:

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "必須です"),
});

const form = useForm({
  resolver: zodResolver(schema),
});
```

### トースト通知

```typescript
import { toast } from "sonner";

toast.success("保存しました");
toast.error("エラーが発生しました");
```

### アイコン

lucide-react を使用:

```typescript
import { User, Calendar, Video, Phone } from "lucide-react";
```

## 認証・認可

### NextAuth設定

```typescript
// src/lib/auth.ts
export const authOptions: NextAuthOptions = {
  providers: [CredentialsProvider(...)],
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub,
        tenantId: token.tenantId,
        role: token.role,
      },
    }),
  },
};
```

### tRPCでの認証チェック

```typescript
// ctx.session から取得
const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      session: ctx.session,
      tenantId: ctx.session.user.tenantId,
    },
  });
});
```

## オンライン診療 (Daily.co)

### フロー

1. 予約作成時に `isOnline: true`
2. 受付 → ステータス WAITING
3. 「オンライン診療開始」クリック
4. VideoSession 作成 → Daily.co room 作成
5. token 取得 → ビデオ通話開始

### セッション管理

```typescript
// VideoSession モデル
model VideoSession {
  id            String    @id @default(cuid())
  appointmentId String    @unique
  roomName      String
  roomUrl       String
  status        VideoSessionStatus
  startedAt     DateTime?
  endedAt       DateTime?
}
```

## 患者ポータル

### アクセス制御

患者は自分のデータのみアクセス可能:

```typescript
// portal.ts router
myAppointments: patientProcedure.query(async ({ ctx }) => {
  // ctx.session.user.patientId を使用
  return ctx.prisma.appointment.findMany({
    where: {
      patientId: ctx.session.user.patientId,  // 自分のみ
      tenantId: ctx.tenantId,
    },
  });
}),
```

## 日本語ラベル

### ステータス

```typescript
const statusLabels = {
  SCHEDULED: "予約済",
  CONFIRMED: "確認済",
  WAITING: "待機中",
  IN_PROGRESS: "診療中",
  COMPLETED: "完了",
  CANCELLED: "キャンセル",
  NO_SHOW: "未来院",
};
```

### 診療種別

```typescript
const typeLabels = {
  INITIAL: "初診",
  FOLLOWUP: "再診",
  CONSULTATION: "相談",
  CHECKUP: "健診",
  EMERGENCY: "緊急",
};
```

## よくある実装パターン

### ページ構成

```typescript
"use client";

export default function SomePage() {
  const { data, isLoading, refetch } = trpc.xxx.list.useQuery();
  const mutation = trpc.xxx.create.useMutation({
    onSuccess: () => {
      toast.success("保存しました");
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">タイトル</h1>
        <Button>アクション</Button>
      </div>
      {/* Content */}
    </div>
  );
}
```

### 日付フォーマット

```typescript
import { format, formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

format(date, "yyyy年M月d日", { locale: ja });
format(date, "HH:mm");
formatDistanceToNow(date, { addSuffix: true, locale: ja });
```

### 日付クエリ (本日のデータ)

```typescript
// Router側
const startOfDay = new Date(date);
startOfDay.setHours(0, 0, 0, 0);
const endOfDay = new Date(date);
endOfDay.setHours(23, 59, 59, 999);

where: {
  appointmentDate: {
    gte: startOfDay,
    lt: endOfDay,
  },
}
```

## 開発時の注意点

1. **テナントID** - 全クエリで必ず `tenantId` フィルタを適用
2. **型安全** - tRPC + Prisma で型を活用、`any` 禁止
3. **エラーハンドリング** - ユーザーフレンドリーな日本語メッセージ
4. **セキュリティ** - 患者データは当該患者のみアクセス可
5. **レスポンシブ** - モバイル対応を考慮
6. **パフォーマンス** - 必要なフィールドのみ select/include

## コマンド

```bash
# 開発サーバー
npm run dev

# ビルド
npm run build

# Prisma
npx prisma generate    # Client生成
npx prisma db push     # スキーマ反映
npx prisma studio      # GUI

# シード
npx prisma db seed
```

## 環境変数

```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
DAILY_API_KEY=         # Daily.co
```
