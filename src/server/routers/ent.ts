import { z } from "zod";
import { router, doctorProcedure, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { logPhiAccess, logPhiModification } from "@/lib/audit";
import {
  audiometrySchema,
  tympanometrySchema,
  vestibularSchema,
  endoscopySchema,
  allergyTestSchema,
  diagnosisTemplateSchema,
} from "./ent.schemas";

export const entRouter = router({
  // ==================== 統計・ダッシュボード ====================

  stats: protectedProcedure.query(async ({ ctx }) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get counts by test type
    const [audiometryCount, tympanometryCount, vestibularCount, endoscopyCount, allergyCount] =
      await Promise.all([
        ctx.prisma.audiometryTest.count({
          where: { patient: { tenantId: ctx.tenantId } },
        }),
        ctx.prisma.tympanometryTest.count({
          where: { patient: { tenantId: ctx.tenantId } },
        }),
        ctx.prisma.vestibularTest.count({
          where: { patient: { tenantId: ctx.tenantId } },
        }),
        ctx.prisma.endoscopyExam.count({
          where: { patient: { tenantId: ctx.tenantId } },
        }),
        ctx.prisma.allergyTest.count({
          where: { patient: { tenantId: ctx.tenantId } },
        }),
      ]);

    // Get recent counts (last 30 days)
    const [recentAudiometry, recentTympanometry, recentVestibular, recentEndoscopy, recentAllergy] =
      await Promise.all([
        ctx.prisma.audiometryTest.count({
          where: {
            patient: { tenantId: ctx.tenantId },
            testDate: { gte: thirtyDaysAgo },
          },
        }),
        ctx.prisma.tympanometryTest.count({
          where: {
            patient: { tenantId: ctx.tenantId },
            testDate: { gte: thirtyDaysAgo },
          },
        }),
        ctx.prisma.vestibularTest.count({
          where: {
            patient: { tenantId: ctx.tenantId },
            testDate: { gte: thirtyDaysAgo },
          },
        }),
        ctx.prisma.endoscopyExam.count({
          where: {
            patient: { tenantId: ctx.tenantId },
            examDate: { gte: thirtyDaysAgo },
          },
        }),
        ctx.prisma.allergyTest.count({
          where: {
            patient: { tenantId: ctx.tenantId },
            testDate: { gte: thirtyDaysAgo },
          },
        }),
      ]);

    return {
      totals: {
        audiometry: audiometryCount,
        tympanometry: tympanometryCount,
        vestibular: vestibularCount,
        endoscopy: endoscopyCount,
        allergy: allergyCount,
        total: audiometryCount + tympanometryCount + vestibularCount + endoscopyCount + allergyCount,
      },
      recent: {
        audiometry: recentAudiometry,
        tympanometry: recentTympanometry,
        vestibular: recentVestibular,
        endoscopy: recentEndoscopy,
        allergy: recentAllergy,
        total: recentAudiometry + recentTympanometry + recentVestibular + recentEndoscopy + recentAllergy,
      },
    };
  }),

  recentTests: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      // Get recent tests from all categories
      const [audiometry, tympanometry, vestibular, endoscopy, allergy] = await Promise.all([
        ctx.prisma.audiometryTest.findMany({
          where: { patient: { tenantId: ctx.tenantId } },
          orderBy: { testDate: "desc" },
          take: input.limit,
          include: { patient: { select: { id: true, firstName: true, lastName: true, patientNumber: true } } },
        }),
        ctx.prisma.tympanometryTest.findMany({
          where: { patient: { tenantId: ctx.tenantId } },
          orderBy: { testDate: "desc" },
          take: input.limit,
          include: { patient: { select: { id: true, firstName: true, lastName: true, patientNumber: true } } },
        }),
        ctx.prisma.vestibularTest.findMany({
          where: { patient: { tenantId: ctx.tenantId } },
          orderBy: { testDate: "desc" },
          take: input.limit,
          include: { patient: { select: { id: true, firstName: true, lastName: true, patientNumber: true } } },
        }),
        ctx.prisma.endoscopyExam.findMany({
          where: { patient: { tenantId: ctx.tenantId } },
          orderBy: { examDate: "desc" },
          take: input.limit,
          include: { patient: { select: { id: true, firstName: true, lastName: true, patientNumber: true } } },
        }),
        ctx.prisma.allergyTest.findMany({
          where: { patient: { tenantId: ctx.tenantId } },
          orderBy: { testDate: "desc" },
          take: input.limit,
          include: { patient: { select: { id: true, firstName: true, lastName: true, patientNumber: true } } },
        }),
      ]);

      // Combine and sort all tests by date
      const allTests = [
        ...audiometry.map((t) => ({ ...t, type: "audiometry" as const, date: t.testDate })),
        ...tympanometry.map((t) => ({ ...t, type: "tympanometry" as const, date: t.testDate })),
        ...vestibular.map((t) => ({ ...t, type: "vestibular" as const, date: t.testDate })),
        ...endoscopy.map((t) => ({ ...t, type: "endoscopy" as const, date: t.examDate })),
        ...allergy.map((t) => ({ ...t, type: "allergy" as const, date: t.testDate })),
      ]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, input.limit);

      return allTests;
    }),

  hearingLevelDistribution: protectedProcedure.query(async ({ ctx }) => {
    const audiometryTests = await ctx.prisma.audiometryTest.findMany({
      where: { patient: { tenantId: ctx.tenantId } },
      select: {
        rightAir500: true,
        rightAir1000: true,
        rightAir2000: true,
        rightAir4000: true,
        leftAir500: true,
        leftAir1000: true,
        leftAir2000: true,
        leftAir4000: true,
      },
    });

    // Calculate distribution
    const distribution = {
      normal: 0,
      mild: 0,
      moderate: 0,
      moderatelySevere: 0,
      severe: 0,
      profound: 0,
    };

    const getLevel = (avg: number | null) => {
      if (avg === null) return null;
      if (avg <= 25) return "normal";
      if (avg <= 40) return "mild";
      if (avg <= 55) return "moderate";
      if (avg <= 70) return "moderatelySevere";
      if (avg <= 90) return "severe";
      return "profound";
    };

    const calc4FreqAvg = (
      f500: number | null,
      f1000: number | null,
      f2000: number | null,
      f4000: number | null
    ) => {
      const values = [f500, f1000, f2000, f4000].filter((v) => v !== null) as number[];
      if (values.length < 4) return null;
      return (values[0] + values[1] + values[1] + values[2]) / 4;
    };

    audiometryTests.forEach((test) => {
      const rightAvg = calc4FreqAvg(test.rightAir500, test.rightAir1000, test.rightAir2000, test.rightAir4000);
      const leftAvg = calc4FreqAvg(test.leftAir500, test.leftAir1000, test.leftAir2000, test.leftAir4000);

      const rightLevel = getLevel(rightAvg);
      const leftLevel = getLevel(leftAvg);

      if (rightLevel) distribution[rightLevel]++;
      if (leftLevel) distribution[leftLevel]++;
    });

    return distribution;
  }),

  // ==================== 聴力検査 ====================

  audiometry: router({
    list: protectedProcedure
      .input(z.object({ patientId: z.string() }))
      .query(async ({ ctx, input }) => {
        const patient = await ctx.prisma.patient.findFirst({
          where: { id: input.patientId, tenantId: ctx.tenantId },
        });
        if (!patient) throw new TRPCError({ code: "NOT_FOUND" });

        return ctx.prisma.audiometryTest.findMany({
          where: { patientId: input.patientId },
          orderBy: { testDate: "desc" },
          include: { medicalRecord: true },
        });
      }),

    get: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
        const test = await ctx.prisma.audiometryTest.findFirst({
          where: { id: input.id },
          include: { patient: true, medicalRecord: true },
        });
        if (!test || test.patient.tenantId !== ctx.tenantId) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        await logPhiAccess({
          entityType: "AudiometryTest",
          entityId: test.id,
          userId: ctx.session.user.id,
          tenantId: ctx.tenantId,
          ipAddress: ctx.requestMeta.ipAddress,
          userAgent: ctx.requestMeta.userAgent,
        });

        return test;
      }),

    create: doctorProcedure
      .input(audiometrySchema)
      .mutation(async ({ ctx, input }) => {
        const patient = await ctx.prisma.patient.findFirst({
          where: { id: input.patientId, tenantId: ctx.tenantId },
        });
        if (!patient) throw new TRPCError({ code: "NOT_FOUND" });

        const test = await ctx.prisma.audiometryTest.create({
          data: input,
        });

        await logPhiModification({
          action: "CREATE",
          entityType: "AudiometryTest",
          entityId: test.id,
          userId: ctx.session.user.id,
          tenantId: ctx.tenantId,
          newData: { patientId: input.patientId, testDate: input.testDate },
          ipAddress: ctx.requestMeta.ipAddress,
          userAgent: ctx.requestMeta.userAgent,
        });

        return test;
      }),

    update: doctorProcedure
      .input(z.object({ id: z.string(), data: audiometrySchema.partial() }))
      .mutation(async ({ ctx, input }) => {
        const test = await ctx.prisma.audiometryTest.findFirst({
          where: { id: input.id },
          include: { patient: true },
        });
        if (!test || test.patient.tenantId !== ctx.tenantId) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        const updated = await ctx.prisma.audiometryTest.update({
          where: { id: input.id },
          data: input.data,
        });

        await logPhiModification({
          action: "UPDATE",
          entityType: "AudiometryTest",
          entityId: test.id,
          userId: ctx.session.user.id,
          tenantId: ctx.tenantId,
          newData: { updatedFields: Object.keys(input.data) },
          ipAddress: ctx.requestMeta.ipAddress,
          userAgent: ctx.requestMeta.userAgent,
        });

        return updated;
      }),

    delete: doctorProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const test = await ctx.prisma.audiometryTest.findFirst({
          where: { id: input.id },
          include: { patient: true },
        });
        if (!test || test.patient.tenantId !== ctx.tenantId) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        const deleted = await ctx.prisma.audiometryTest.delete({ where: { id: input.id } });

        await logPhiModification({
          action: "DELETE",
          entityType: "AudiometryTest",
          entityId: test.id,
          userId: ctx.session.user.id,
          tenantId: ctx.tenantId,
          oldData: { patientId: test.patientId, testDate: test.testDate },
          ipAddress: ctx.requestMeta.ipAddress,
          userAgent: ctx.requestMeta.userAgent,
        });

        return deleted;
      }),
  }),

  // ==================== ティンパノメトリー ====================

  tympanometry: router({
    list: protectedProcedure
      .input(z.object({ patientId: z.string() }))
      .query(async ({ ctx, input }) => {
        const patient = await ctx.prisma.patient.findFirst({
          where: { id: input.patientId, tenantId: ctx.tenantId },
        });
        if (!patient) throw new TRPCError({ code: "NOT_FOUND" });

        return ctx.prisma.tympanometryTest.findMany({
          where: { patientId: input.patientId },
          orderBy: { testDate: "desc" },
        });
      }),

    create: doctorProcedure
      .input(tympanometrySchema)
      .mutation(async ({ ctx, input }) => {
        const patient = await ctx.prisma.patient.findFirst({
          where: { id: input.patientId, tenantId: ctx.tenantId },
        });
        if (!patient) throw new TRPCError({ code: "NOT_FOUND" });

        return ctx.prisma.tympanometryTest.create({ data: input });
      }),

    update: doctorProcedure
      .input(z.object({ id: z.string(), data: tympanometrySchema.partial() }))
      .mutation(async ({ ctx, input }) => {
        const test = await ctx.prisma.tympanometryTest.findFirst({
          where: { id: input.id },
          include: { patient: true },
        });
        if (!test || test.patient.tenantId !== ctx.tenantId) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return ctx.prisma.tympanometryTest.update({
          where: { id: input.id },
          data: input.data,
        });
      }),
  }),

  // ==================== 平衡機能検査 ====================

  vestibular: router({
    list: protectedProcedure
      .input(z.object({ patientId: z.string() }))
      .query(async ({ ctx, input }) => {
        const patient = await ctx.prisma.patient.findFirst({
          where: { id: input.patientId, tenantId: ctx.tenantId },
        });
        if (!patient) throw new TRPCError({ code: "NOT_FOUND" });

        return ctx.prisma.vestibularTest.findMany({
          where: { patientId: input.patientId },
          orderBy: { testDate: "desc" },
        });
      }),

    create: doctorProcedure
      .input(vestibularSchema)
      .mutation(async ({ ctx, input }) => {
        const patient = await ctx.prisma.patient.findFirst({
          where: { id: input.patientId, tenantId: ctx.tenantId },
        });
        if (!patient) throw new TRPCError({ code: "NOT_FOUND" });

        return ctx.prisma.vestibularTest.create({ data: input });
      }),

    update: doctorProcedure
      .input(z.object({ id: z.string(), data: vestibularSchema.partial() }))
      .mutation(async ({ ctx, input }) => {
        const test = await ctx.prisma.vestibularTest.findFirst({
          where: { id: input.id },
          include: { patient: true },
        });
        if (!test || test.patient.tenantId !== ctx.tenantId) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return ctx.prisma.vestibularTest.update({
          where: { id: input.id },
          data: input.data,
        });
      }),
  }),

  // ==================== 内視鏡検査 ====================

  endoscopy: router({
    list: protectedProcedure
      .input(z.object({ patientId: z.string() }))
      .query(async ({ ctx, input }) => {
        const patient = await ctx.prisma.patient.findFirst({
          where: { id: input.patientId, tenantId: ctx.tenantId },
        });
        if (!patient) throw new TRPCError({ code: "NOT_FOUND" });

        return ctx.prisma.endoscopyExam.findMany({
          where: { patientId: input.patientId },
          orderBy: { examDate: "desc" },
        });
      }),

    create: doctorProcedure
      .input(endoscopySchema)
      .mutation(async ({ ctx, input }) => {
        const patient = await ctx.prisma.patient.findFirst({
          where: { id: input.patientId, tenantId: ctx.tenantId },
        });
        if (!patient) throw new TRPCError({ code: "NOT_FOUND" });

        return ctx.prisma.endoscopyExam.create({
          data: {
            ...input,
            imageUrls: input.imageUrls || [],
          },
        });
      }),

    update: doctorProcedure
      .input(z.object({ id: z.string(), data: endoscopySchema.partial() }))
      .mutation(async ({ ctx, input }) => {
        const exam = await ctx.prisma.endoscopyExam.findFirst({
          where: { id: input.id },
          include: { patient: true },
        });
        if (!exam || exam.patient.tenantId !== ctx.tenantId) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return ctx.prisma.endoscopyExam.update({
          where: { id: input.id },
          data: {
            ...input.data,
            imageUrls: input.data.imageUrls || undefined,
          },
        });
      }),
  }),

  // ==================== アレルギー検査 ====================

  allergy: router({
    list: protectedProcedure
      .input(z.object({ patientId: z.string() }))
      .query(async ({ ctx, input }) => {
        const patient = await ctx.prisma.patient.findFirst({
          where: { id: input.patientId, tenantId: ctx.tenantId },
        });
        if (!patient) throw new TRPCError({ code: "NOT_FOUND" });

        return ctx.prisma.allergyTest.findMany({
          where: { patientId: input.patientId },
          orderBy: { testDate: "desc" },
        });
      }),

    create: doctorProcedure
      .input(allergyTestSchema)
      .mutation(async ({ ctx, input }) => {
        const patient = await ctx.prisma.patient.findFirst({
          where: { id: input.patientId, tenantId: ctx.tenantId },
        });
        if (!patient) throw new TRPCError({ code: "NOT_FOUND" });

        return ctx.prisma.allergyTest.create({
          data: {
            ...input,
            results: input.results || {},
          },
        });
      }),

    update: doctorProcedure
      .input(z.object({ id: z.string(), data: allergyTestSchema.partial() }))
      .mutation(async ({ ctx, input }) => {
        const test = await ctx.prisma.allergyTest.findFirst({
          where: { id: input.id },
          include: { patient: true },
        });
        if (!test || test.patient.tenantId !== ctx.tenantId) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return ctx.prisma.allergyTest.update({
          where: { id: input.id },
          data: {
            ...input.data,
            results: input.data.results || undefined,
          },
        });
      }),
  }),

  // ==================== 診断テンプレート ====================

  template: router({
    list: protectedProcedure
      .input(z.object({
        category: z.enum(["EAR", "NOSE", "THROAT", "ALLERGY", "VERTIGO", "OTHER"]).optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        return ctx.prisma.entDiagnosisTemplate.findMany({
          where: {
            tenantId: ctx.tenantId,
            isActive: true,
            ...(input?.category ? { category: input.category } : {}),
          },
          orderBy: { name: "asc" },
        });
      }),

    get: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
        const template = await ctx.prisma.entDiagnosisTemplate.findFirst({
          where: { id: input.id, tenantId: ctx.tenantId },
        });
        if (!template) throw new TRPCError({ code: "NOT_FOUND" });
        return template;
      }),

    create: doctorProcedure
      .input(diagnosisTemplateSchema)
      .mutation(async ({ ctx, input }) => {
        return ctx.prisma.entDiagnosisTemplate.create({
          data: {
            ...input,
            tenantId: ctx.tenantId,
            commonPrescriptions: input.commonPrescriptions || [],
          },
        });
      }),

    update: doctorProcedure
      .input(z.object({ id: z.string(), data: diagnosisTemplateSchema.partial() }))
      .mutation(async ({ ctx, input }) => {
        const template = await ctx.prisma.entDiagnosisTemplate.findFirst({
          where: { id: input.id, tenantId: ctx.tenantId },
        });
        if (!template) throw new TRPCError({ code: "NOT_FOUND" });

        return ctx.prisma.entDiagnosisTemplate.update({
          where: { id: input.id },
          data: {
            ...input.data,
            commonPrescriptions: input.data.commonPrescriptions || undefined,
          },
        });
      }),

    delete: doctorProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const template = await ctx.prisma.entDiagnosisTemplate.findFirst({
          where: { id: input.id, tenantId: ctx.tenantId },
        });
        if (!template) throw new TRPCError({ code: "NOT_FOUND" });

        return ctx.prisma.entDiagnosisTemplate.update({
          where: { id: input.id },
          data: { isActive: false },
        });
      }),
  }),
});
