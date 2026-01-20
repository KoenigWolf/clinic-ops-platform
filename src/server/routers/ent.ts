import { z } from "zod";
import { router, doctorProcedure, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

// ==================== スキーマ定義 ====================

// 聴力検査スキーマ
const audiometrySchema = z.object({
  patientId: z.string(),
  medicalRecordId: z.string().optional(),
  testDate: z.date().optional(),
  testType: z.enum(["PURE_TONE", "SPEECH", "IMPEDANCE", "OAE", "ABR"]).default("PURE_TONE"),
  // 右耳気導
  rightAir125: z.number().nullable().optional(),
  rightAir250: z.number().nullable().optional(),
  rightAir500: z.number().nullable().optional(),
  rightAir1000: z.number().nullable().optional(),
  rightAir2000: z.number().nullable().optional(),
  rightAir4000: z.number().nullable().optional(),
  rightAir8000: z.number().nullable().optional(),
  // 左耳気導
  leftAir125: z.number().nullable().optional(),
  leftAir250: z.number().nullable().optional(),
  leftAir500: z.number().nullable().optional(),
  leftAir1000: z.number().nullable().optional(),
  leftAir2000: z.number().nullable().optional(),
  leftAir4000: z.number().nullable().optional(),
  leftAir8000: z.number().nullable().optional(),
  // 右耳骨導
  rightBone250: z.number().nullable().optional(),
  rightBone500: z.number().nullable().optional(),
  rightBone1000: z.number().nullable().optional(),
  rightBone2000: z.number().nullable().optional(),
  rightBone4000: z.number().nullable().optional(),
  // 左耳骨導
  leftBone250: z.number().nullable().optional(),
  leftBone500: z.number().nullable().optional(),
  leftBone1000: z.number().nullable().optional(),
  leftBone2000: z.number().nullable().optional(),
  leftBone4000: z.number().nullable().optional(),
  // 語音弁別能
  rightSpeechDiscrimination: z.number().nullable().optional(),
  leftSpeechDiscrimination: z.number().nullable().optional(),
  interpretation: z.string().optional(),
});

// ティンパノメトリースキーマ
const tympanometrySchema = z.object({
  patientId: z.string(),
  medicalRecordId: z.string().optional(),
  testDate: z.date().optional(),
  rightType: z.enum(["A", "As", "Ad", "B", "C"]).nullable().optional(),
  rightPeakPressure: z.number().nullable().optional(),
  rightCompliance: z.number().nullable().optional(),
  rightEarCanalVolume: z.number().nullable().optional(),
  leftType: z.enum(["A", "As", "Ad", "B", "C"]).nullable().optional(),
  leftPeakPressure: z.number().nullable().optional(),
  leftCompliance: z.number().nullable().optional(),
  leftEarCanalVolume: z.number().nullable().optional(),
  interpretation: z.string().optional(),
});

// 平衡機能検査スキーマ
const vestibularSchema = z.object({
  patientId: z.string(),
  medicalRecordId: z.string().optional(),
  testDate: z.date().optional(),
  testType: z.enum(["CALORIC", "POSTUROGRAPHY", "ENG", "VNG", "VHIT", "VEMP", "ROTATION"]).default("CALORIC"),
  chiefComplaint: z.string().optional(),
  vertigoType: z.string().optional(),
  nystagmusFindings: z.string().optional(),
  rombergTest: z.string().optional(),
  mannTest: z.string().optional(),
  caloricResponse: z.string().optional(),
  headImpulseTest: z.string().optional(),
  dixHallpikeResult: z.string().optional(),
  interpretation: z.string().optional(),
});

// 内視鏡検査スキーマ
const endoscopySchema = z.object({
  patientId: z.string(),
  medicalRecordId: z.string().optional(),
  examDate: z.date().optional(),
  examType: z.enum(["NASAL", "PHARYNGEAL", "LARYNGEAL", "OTOSCOPY"]).default("NASAL"),
  nasalFindings: z.string().optional(),
  nasalSeptum: z.string().optional(),
  inferiorTurbinate: z.string().optional(),
  middleMeatus: z.string().optional(),
  pharyngealFindings: z.string().optional(),
  tonsils: z.string().optional(),
  laryngealFindings: z.string().optional(),
  vocalCords: z.string().optional(),
  epiglottis: z.string().optional(),
  otoscopyRight: z.string().optional(),
  otoscopyLeft: z.string().optional(),
  imageUrls: z.array(z.string()).optional(),
  interpretation: z.string().optional(),
});

// アレルギー検査結果スキーマ（アレルゲン名 -> クラス値）
const allergyResultSchema = z.record(
  z.string(),
  z.string().regex(/^[0-6]$/, "クラスは0-6の値")
);

// アレルギー検査スキーマ
const allergyTestSchema = z.object({
  patientId: z.string(),
  medicalRecordId: z.string().optional(),
  testDate: z.date().optional(),
  testType: z.enum(["RAST", "SKIN_PRICK", "MAST", "CAP"]).default("RAST"),
  results: allergyResultSchema.optional(),
  totalIgE: z.number().nullable().optional(),
  interpretation: z.string().optional(),
});

// 処方スキーマ
const prescriptionItemSchema = z.object({
  name: z.string(),
  dosage: z.string(),
  frequency: z.string(),
  duration: z.string(),
});

// 診断テンプレートスキーマ
const diagnosisTemplateSchema = z.object({
  name: z.string(),
  category: z.enum(["EAR", "NOSE", "THROAT", "ALLERGY", "VERTIGO", "OTHER"]),
  icdCode: z.string().optional(),
  subjectiveTemplate: z.string().optional(),
  objectiveTemplate: z.string().optional(),
  assessmentTemplate: z.string().optional(),
  planTemplate: z.string().optional(),
  commonPrescriptions: z.array(prescriptionItemSchema).optional(),
  isActive: z.boolean().default(true),
});

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
        return test;
      }),

    create: doctorProcedure
      .input(audiometrySchema)
      .mutation(async ({ ctx, input }) => {
        const patient = await ctx.prisma.patient.findFirst({
          where: { id: input.patientId, tenantId: ctx.tenantId },
        });
        if (!patient) throw new TRPCError({ code: "NOT_FOUND" });

        return ctx.prisma.audiometryTest.create({
          data: input,
        });
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
        return ctx.prisma.audiometryTest.update({
          where: { id: input.id },
          data: input.data,
        });
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
        return ctx.prisma.audiometryTest.delete({ where: { id: input.id } });
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
