import { z } from "zod";
import { router, protectedProcedure, doctorProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

const templateSchema = z.object({
  name: z.string(),
  category: z.enum([
    "REFERRAL", "CERTIFICATE", "MEDICAL_CERT", "PRESCRIPTION",
    "CONSENT", "SICK_LEAVE", "INSURANCE", "OTHER"
  ]),
  content: z.string(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

const documentSchema = z.object({
  title: z.string(),
  content: z.string(),
  category: z.enum([
    "REFERRAL", "CERTIFICATE", "MEDICAL_CERT", "PRESCRIPTION",
    "CONSENT", "SICK_LEAVE", "INSURANCE", "OTHER"
  ]),
  patientId: z.string(),
  templateId: z.string().optional(),
  medicalRecordId: z.string().optional(),
});

export const documentRouter = router({
  // ==================== テンプレート管理 ====================

  template: router({
    list: protectedProcedure
      .input(z.object({
        category: z.enum([
          "REFERRAL", "CERTIFICATE", "MEDICAL_CERT", "PRESCRIPTION",
          "CONSENT", "SICK_LEAVE", "INSURANCE", "OTHER"
        ]).optional(),
        activeOnly: z.boolean().default(true),
      }).optional())
      .query(async ({ ctx, input }) => {
        return ctx.prisma.documentTemplate.findMany({
          where: {
            tenantId: ctx.tenantId,
            ...(input?.activeOnly !== false ? { isActive: true } : {}),
            ...(input?.category ? { category: input.category } : {}),
          },
          orderBy: { name: "asc" },
        });
      }),

    get: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
        const template = await ctx.prisma.documentTemplate.findFirst({
          where: { id: input.id, tenantId: ctx.tenantId },
        });
        if (!template) throw new TRPCError({ code: "NOT_FOUND" });
        return template;
      }),

    create: doctorProcedure
      .input(templateSchema)
      .mutation(async ({ ctx, input }) => {
        return ctx.prisma.documentTemplate.create({
          data: {
            ...input,
            tenantId: ctx.tenantId,
          },
        });
      }),

    update: doctorProcedure
      .input(z.object({ id: z.string(), data: templateSchema.partial() }))
      .mutation(async ({ ctx, input }) => {
        const template = await ctx.prisma.documentTemplate.findFirst({
          where: { id: input.id, tenantId: ctx.tenantId },
        });
        if (!template) throw new TRPCError({ code: "NOT_FOUND" });

        return ctx.prisma.documentTemplate.update({
          where: { id: input.id },
          data: input.data,
        });
      }),

    delete: doctorProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const template = await ctx.prisma.documentTemplate.findFirst({
          where: { id: input.id, tenantId: ctx.tenantId },
        });
        if (!template) throw new TRPCError({ code: "NOT_FOUND" });

        return ctx.prisma.documentTemplate.update({
          where: { id: input.id },
          data: { isActive: false },
        });
      }),
  }),

  // ==================== 文書管理 ====================

  list: protectedProcedure
    .input(z.object({
      patientId: z.string().optional(),
      category: z.enum([
        "REFERRAL", "CERTIFICATE", "MEDICAL_CERT", "PRESCRIPTION",
        "CONSENT", "SICK_LEAVE", "INSURANCE", "OTHER"
      ]).optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.document.findMany({
        where: {
          ...(input.patientId ? { patientId: input.patientId } : {}),
          ...(input.category ? { category: input.category } : {}),
          patient: { tenantId: ctx.tenantId },
        },
        include: {
          patient: {
            select: { id: true, firstName: true, lastName: true, patientNumber: true },
          },
          template: { select: { name: true } },
        },
        orderBy: { issuedAt: "desc" },
        take: input.limit,
      });
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const document = await ctx.prisma.document.findFirst({
        where: {
          id: input.id,
          patient: { tenantId: ctx.tenantId },
        },
        include: {
          patient: true,
          template: true,
          medicalRecord: true,
        },
      });
      if (!document) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return document;
    }),

  create: doctorProcedure
    .input(documentSchema)
    .mutation(async ({ ctx, input }) => {
      const patient = await ctx.prisma.patient.findFirst({
        where: { id: input.patientId, tenantId: ctx.tenantId },
      });
      if (!patient) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.prisma.document.create({
        data: {
          ...input,
          issuedBy: ctx.session.user.id,
        },
      });
    }),

  update: doctorProcedure
    .input(z.object({ id: z.string(), data: documentSchema.partial() }))
    .mutation(async ({ ctx, input }) => {
      const document = await ctx.prisma.document.findFirst({
        where: { id: input.id },
        include: { patient: true },
      });
      if (!document || document.patient.tenantId !== ctx.tenantId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.prisma.document.update({
        where: { id: input.id },
        data: input.data,
      });
    }),

  delete: doctorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const document = await ctx.prisma.document.findFirst({
        where: { id: input.id },
        include: { patient: true },
      });
      if (!document || document.patient.tenantId !== ctx.tenantId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.prisma.document.delete({
        where: { id: input.id },
      });
    }),

  // テンプレートから文書を生成
  createFromTemplate: doctorProcedure
    .input(z.object({
      templateId: z.string(),
      patientId: z.string(),
      medicalRecordId: z.string().optional(),
      variables: z.record(z.string(), z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const template = await ctx.prisma.documentTemplate.findFirst({
        where: { id: input.templateId, tenantId: ctx.tenantId },
      });
      if (!template) throw new TRPCError({ code: "NOT_FOUND" });

      const patient = await ctx.prisma.patient.findFirst({
        where: { id: input.patientId, tenantId: ctx.tenantId },
      });
      if (!patient) throw new TRPCError({ code: "NOT_FOUND" });

      // プレースホルダーを置換
      let content = template.content;
      const defaultVariables: Record<string, string> = {
        "{{患者名}}": `${patient.lastName} ${patient.firstName}`,
        "{{患者番号}}": patient.patientNumber,
        "{{生年月日}}": patient.dateOfBirth.toLocaleDateString("ja-JP"),
        "{{発行日}}": new Date().toLocaleDateString("ja-JP"),
        "{{年齢}}": calculateAge(patient.dateOfBirth).toString(),
      };

      // デフォルト変数を適用
      Object.entries(defaultVariables).forEach(([key, value]) => {
        content = content.replace(new RegExp(key, "g"), value);
      });

      // カスタム変数を適用
      if (input.variables) {
        Object.entries(input.variables).forEach(([key, value]) => {
          content = content.replace(new RegExp(`{{${key}}}`, "g"), value);
        });
      }

      return ctx.prisma.document.create({
        data: {
          title: template.name,
          content,
          category: template.category,
          patientId: input.patientId,
          templateId: input.templateId,
          medicalRecordId: input.medicalRecordId,
          issuedBy: ctx.session.user.id,
        },
      });
    }),

  // 患者の文書一覧
  byPatient: protectedProcedure
    .input(z.object({ patientId: z.string() }))
    .query(async ({ ctx, input }) => {
      const patient = await ctx.prisma.patient.findFirst({
        where: { id: input.patientId, tenantId: ctx.tenantId },
      });
      if (!patient) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.prisma.document.findMany({
        where: { patientId: input.patientId },
        include: {
          template: { select: { name: true } },
        },
        orderBy: { issuedAt: "desc" },
      });
    }),
});

function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}
