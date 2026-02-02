import { z } from "zod";
import { router, protectedProcedure, doctorProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { logPhiAccess, logPhiModification } from "@/lib/audit";

const questionSchema = z.object({
  id: z.string(),
  type: z.enum(["TEXT", "TEXTAREA", "SELECT", "RADIO", "CHECKBOX", "NUMBER", "DATE", "SCALE"]),
  question: z.string(),
  options: z.array(z.string()).optional(),
  required: z.boolean().default(false),
  category: z.string().optional(),
  placeholder: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
});

const templateSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  category: z.enum([
    "GENERAL", "FIRST_VISIT", "FOLLOW_UP", "PEDIATRIC", "INTERNAL",
    "ENT", "DERMATOLOGY", "ORTHOPEDIC", "MENTAL", "OTHER"
  ]).default("GENERAL"),
  questions: z.array(questionSchema),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  sortOrder: z.number().default(0),
});

// 回答値スキーマ（質問タイプに応じた値）
const answerValueSchema = z.union([
  z.string(),                    // TEXT, TEXTAREA, SELECT, RADIO, DATE
  z.number(),                    // NUMBER, SCALE
  z.array(z.string()),           // CHECKBOX
  z.boolean(),                   // Yes/No type
]);

const responseSchema = z.object({
  templateId: z.string(),
  patientId: z.string(),
  appointmentId: z.string().optional(),
  answers: z.record(z.string(), answerValueSchema),
});

export const questionnaireRouter = router({
  // ==================== ダッシュボード用 ====================

  // 問診ページ初期表示用 - templates / pending / list を一括取得
  dashboard: protectedProcedure.query(async ({ ctx }) => {
    const [templates, pendingResponses, allResponses] = await Promise.all([
      // テンプレート一覧
      ctx.prisma.questionnaireTemplate.findMany({
        where: { tenantId: ctx.tenantId, isActive: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      // 未確認の問診
      ctx.prisma.questionnaireResponse.findMany({
        where: {
          status: "SUBMITTED",
          patient: { tenantId: ctx.tenantId },
        },
        include: {
          template: { select: { name: true, category: true } },
          patient: {
            select: { id: true, firstName: true, lastName: true, patientNumber: true },
          },
          appointment: {
            select: { appointmentDate: true, startTime: true },
          },
        },
        orderBy: { submittedAt: "asc" },
        take: 20,
      }),
      // 回答一覧
      ctx.prisma.questionnaireResponse.findMany({
        where: { patient: { tenantId: ctx.tenantId } },
        include: {
          template: true,
          patient: {
            select: { id: true, firstName: true, lastName: true, patientNumber: true },
          },
          appointment: true,
        },
        orderBy: { submittedAt: "desc" },
        take: 50,
      }),
    ]);

    return { templates, pendingResponses, allResponses };
  }),

  // ==================== テンプレート管理 ====================

  template: router({
    list: protectedProcedure
      .input(z.object({
        category: z.enum([
          "GENERAL", "FIRST_VISIT", "FOLLOW_UP", "PEDIATRIC", "INTERNAL",
          "ENT", "DERMATOLOGY", "ORTHOPEDIC", "MENTAL", "OTHER"
        ]).optional(),
        activeOnly: z.boolean().default(true),
      }).optional())
      .query(async ({ ctx, input }) => {
        return ctx.prisma.questionnaireTemplate.findMany({
          where: {
            tenantId: ctx.tenantId,
            ...(input?.activeOnly !== false ? { isActive: true } : {}),
            ...(input?.category ? { category: input.category } : {}),
          },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        });
      }),

    get: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
        const template = await ctx.prisma.questionnaireTemplate.findFirst({
          where: { id: input.id, tenantId: ctx.tenantId },
        });
        if (!template) throw new TRPCError({ code: "NOT_FOUND" });
        return template;
      }),

    create: doctorProcedure
      .input(templateSchema)
      .mutation(async ({ ctx, input }) => {
        return ctx.prisma.questionnaireTemplate.create({
          data: {
            ...input,
            tenantId: ctx.tenantId,
          },
        });
      }),

    update: doctorProcedure
      .input(z.object({ id: z.string(), data: templateSchema.partial() }))
      .mutation(async ({ ctx, input }) => {
        const template = await ctx.prisma.questionnaireTemplate.findFirst({
          where: { id: input.id, tenantId: ctx.tenantId },
        });
        if (!template) throw new TRPCError({ code: "NOT_FOUND" });

        return ctx.prisma.questionnaireTemplate.update({
          where: { id: input.id },
          data: input.data,
        });
      }),

    delete: doctorProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const template = await ctx.prisma.questionnaireTemplate.findFirst({
          where: { id: input.id, tenantId: ctx.tenantId },
        });
        if (!template) throw new TRPCError({ code: "NOT_FOUND" });

        return ctx.prisma.questionnaireTemplate.update({
          where: { id: input.id },
          data: { isActive: false },
        });
      }),

    setDefault: doctorProcedure
      .input(z.object({ id: z.string(), category: z.string() }))
      .mutation(async ({ ctx, input }) => {
        // 同じカテゴリの他のテンプレートのデフォルトを解除
        await ctx.prisma.questionnaireTemplate.updateMany({
          where: {
            tenantId: ctx.tenantId,
            category: input.category as never,
            isDefault: true,
          },
          data: { isDefault: false },
        });

        return ctx.prisma.questionnaireTemplate.update({
          where: { id: input.id },
          data: { isDefault: true },
        });
      }),
  }),

  // ==================== 回答管理 ====================

  response: router({
    list: protectedProcedure
      .input(z.object({
        patientId: z.string().optional(),
        appointmentId: z.string().optional(),
        status: z.enum(["DRAFT", "SUBMITTED", "REVIEWED", "APPLIED"]).optional(),
        limit: z.number().default(50),
      }))
      .query(async ({ ctx, input }) => {
        return ctx.prisma.questionnaireResponse.findMany({
          where: {
            ...(input.patientId ? { patientId: input.patientId } : {}),
            ...(input.appointmentId ? { appointmentId: input.appointmentId } : {}),
            ...(input.status ? { status: input.status } : {}),
            patient: { tenantId: ctx.tenantId },
          },
          include: {
            template: true,
            patient: {
              select: { id: true, firstName: true, lastName: true, patientNumber: true },
            },
            appointment: true,
          },
          orderBy: { submittedAt: "desc" },
          take: input.limit,
        });
      }),

    get: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
        const response = await ctx.prisma.questionnaireResponse.findFirst({
          where: { id: input.id },
          include: {
            template: true,
            patient: true,
            appointment: true,
          },
        });
        if (!response || response.patient.tenantId !== ctx.tenantId) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        await logPhiAccess({
          entityType: "QuestionnaireResponse",
          entityId: response.id,
          userId: ctx.session.user.id,
          tenantId: ctx.tenantId,
          ipAddress: ctx.requestMeta.ipAddress,
          userAgent: ctx.requestMeta.userAgent,
        });

        return response;
      }),

    // 患者が問診を提出
    submit: protectedProcedure
      .input(responseSchema)
      .mutation(async ({ ctx, input }) => {
        const patient = await ctx.prisma.patient.findFirst({
          where: { id: input.patientId, tenantId: ctx.tenantId },
        });
        if (!patient) throw new TRPCError({ code: "NOT_FOUND" });

        const template = await ctx.prisma.questionnaireTemplate.findFirst({
          where: { id: input.templateId, tenantId: ctx.tenantId },
        });
        if (!template) throw new TRPCError({ code: "NOT_FOUND" });

        // 回答からサマリーを生成
        const summary = generateSummary(template.questions as unknown as z.infer<typeof questionSchema>[], input.answers);
        const subjective = generateSubjective(template.questions as unknown as z.infer<typeof questionSchema>[], input.answers);

        const questionnaireResponse = await ctx.prisma.questionnaireResponse.create({
          data: {
            templateId: input.templateId,
            patientId: input.patientId,
            appointmentId: input.appointmentId,
            answers: input.answers,
            summary,
            subjective,
            status: "SUBMITTED",
          },
        });

        await logPhiModification({
          action: "CREATE",
          entityType: "QuestionnaireResponse",
          entityId: questionnaireResponse.id,
          userId: ctx.session.user.id,
          tenantId: ctx.tenantId,
          newData: { templateId: input.templateId, patientId: input.patientId, appointmentId: input.appointmentId },
          ipAddress: ctx.requestMeta.ipAddress,
          userAgent: ctx.requestMeta.userAgent,
        });

        return questionnaireResponse;
      }),

    // 医師が問診を確認済みにする
    review: doctorProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const response = await ctx.prisma.questionnaireResponse.findFirst({
          where: { id: input.id },
          include: { patient: true },
        });
        if (!response || response.patient.tenantId !== ctx.tenantId) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        const updatedResponse = await ctx.prisma.questionnaireResponse.update({
          where: { id: input.id },
          data: {
            status: "REVIEWED",
            reviewedAt: new Date(),
            reviewedBy: ctx.session.user.id,
          },
        });

        await logPhiModification({
          action: "UPDATE",
          entityType: "QuestionnaireResponse",
          entityId: response.id,
          userId: ctx.session.user.id,
          tenantId: ctx.tenantId,
          oldData: { status: response.status },
          newData: { status: "REVIEWED", reviewedBy: ctx.session.user.id },
          ipAddress: ctx.requestMeta.ipAddress,
          userAgent: ctx.requestMeta.userAgent,
        });

        return updatedResponse;
      }),

    // カルテに適用
    applyToRecord: doctorProcedure
      .input(z.object({
        responseId: z.string(),
        medicalRecordId: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const response = await ctx.prisma.questionnaireResponse.findFirst({
          where: { id: input.responseId },
          include: { patient: true },
        });
        if (!response || response.patient.tenantId !== ctx.tenantId) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        // カルテのテナント検証
        const medicalRecord = await ctx.prisma.medicalRecord.findFirst({
          where: {
            id: input.medicalRecordId,
            patient: { tenantId: ctx.tenantId },
          },
        });
        if (!medicalRecord) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        // 問診の内容をカルテの主訴に追記
        if (response.subjective) {
          await ctx.prisma.medicalRecord.update({
            where: { id: input.medicalRecordId },
            data: {
              subjective: {
                set: response.subjective,
              },
            },
          });

          await logPhiModification({
            action: "UPDATE",
            entityType: "MedicalRecord",
            entityId: medicalRecord.id,
            userId: ctx.session.user.id,
            tenantId: ctx.tenantId,
            oldData: { subjective: medicalRecord.subjective },
            newData: { subjective: response.subjective, appliedFromQuestionnaireResponseId: response.id },
            ipAddress: ctx.requestMeta.ipAddress,
            userAgent: ctx.requestMeta.userAgent,
          });
        }

        const updatedResponse = await ctx.prisma.questionnaireResponse.update({
          where: { id: input.responseId },
          data: {
            status: "APPLIED",
            medicalRecordId: input.medicalRecordId,
          },
        });

        await logPhiModification({
          action: "UPDATE",
          entityType: "QuestionnaireResponse",
          entityId: response.id,
          userId: ctx.session.user.id,
          tenantId: ctx.tenantId,
          oldData: { status: response.status, medicalRecordId: response.medicalRecordId },
          newData: { status: "APPLIED", medicalRecordId: input.medicalRecordId },
          ipAddress: ctx.requestMeta.ipAddress,
          userAgent: ctx.requestMeta.userAgent,
        });

        return updatedResponse;
      }),

    // 未確認の問診一覧 (ダッシュボード用)
    pending: protectedProcedure.query(async ({ ctx }) => {
      return ctx.prisma.questionnaireResponse.findMany({
        where: {
          status: "SUBMITTED",
          patient: { tenantId: ctx.tenantId },
        },
        include: {
          template: { select: { name: true, category: true } },
          patient: {
            select: { id: true, firstName: true, lastName: true, patientNumber: true },
          },
          appointment: {
            select: { appointmentDate: true, startTime: true },
          },
        },
        orderBy: { submittedAt: "asc" },
        take: 20,
      });
    }),
  }),
});

// ヘルパー関数: 回答からサマリーを生成
function generateSummary(
  questions: z.infer<typeof questionSchema>[],
  answers: Record<string, unknown>
): string {
  const lines: string[] = [];

  questions.forEach((q) => {
    const answer = answers[q.id];
    if (answer !== undefined && answer !== null && answer !== "") {
      let answerText = "";
      if (Array.isArray(answer)) {
        answerText = answer.join(", ");
      } else {
        answerText = String(answer);
      }
      lines.push(`【${q.question}】${answerText}`);
    }
  });

  return lines.join("\n");
}

// ヘルパー関数: SOAP形式の主訴テキストを生成
function generateSubjective(
  questions: z.infer<typeof questionSchema>[],
  answers: Record<string, unknown>
): string {
  const sections: string[] = [];

  // カテゴリ別にグループ化
  const categorized: Record<string, string[]> = {};

  questions.forEach((q) => {
    const answer = answers[q.id];
    if (answer !== undefined && answer !== null && answer !== "") {
      const category = q.category || "その他";
      if (!categorized[category]) {
        categorized[category] = [];
      }

      let answerText = "";
      if (Array.isArray(answer)) {
        answerText = answer.join("、");
      } else {
        answerText = String(answer);
      }
      categorized[category].push(`${q.question}: ${answerText}`);
    }
  });

  Object.entries(categorized).forEach(([category, items]) => {
    sections.push(`[${category}]\n${items.join("\n")}`);
  });

  return sections.join("\n\n");
}
