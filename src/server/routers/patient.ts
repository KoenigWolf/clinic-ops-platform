import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { logPhiAccess, logPhiModification } from "@/lib/audit";

const patientSchema = z.object({
  // 基本情報
  patientNumber: z.string().min(1, "患者番号は必須です"),
  lastName: z.string().min(1, "姓は必須です"),
  firstName: z.string().min(1, "名は必須です"),
  lastNameKana: z.string().min(1, "セイは必須です"),
  firstNameKana: z.string().min(1, "メイは必須です"),
  dateOfBirth: z.string().min(1, "生年月日は必須です"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),

  bloodType: z.enum([
    "A_POSITIVE", "A_NEGATIVE",
    "B_POSITIVE", "B_NEGATIVE",
    "O_POSITIVE", "O_NEGATIVE",
    "AB_POSITIVE", "AB_NEGATIVE"
  ]).nullable().optional(),

  address: z.string().min(1, "住所は必須です"),
  postalCode: z.string().nullable().optional(),

  // マイナンバーカード同意
  myNumberConsent: z.boolean(),

  // 初診日・最終来院日
  firstVisitDate: z.string().nullable().optional(),
  lastVisitDate: z.string().nullable().optional(),

  // 連絡先
  phone: z.string().min(1, "電話番号は必須です"),
  email: z.string().email().nullable().optional().or(z.literal("")),
  emergencyContact: z.string().nullable().optional(),
  emergencyRelationship: z.string().nullable().optional(),
  emergencyPhone: z.string().nullable().optional(),

  // 医療情報
  allergies: z.string().nullable().optional(),
  medicalHistory: z.string().nullable().optional(),
  familyHistory: z.string().nullable().optional(),
  contraindications: z.string().nullable().optional(),
  currentMedications: z.string().nullable().optional(),
  healthCheckInfo: z.string().nullable().optional(),
  pregnant: z.boolean().nullable().optional(),

  // 保険情報（オンライン資格確認）
  insurerNumber: z.string().min(1, "保険者番号は必須です"),
  insuredNumber: z.string().min(1, "被保険者番号は必須です"),

  insuranceType: z.enum([
    "NATIONAL_HEALTH_INSURANCE",
    "EMPLOYEES_INSURANCE",
    "MUTUAL_AID_INSURANCE",
    "LATE_STAGE_ELDERLY",
    "OTHER"
  ]).nullable().optional(),

  insuranceSymbol: z.string().nullable().optional(),
  insuranceNumber: z.string().nullable().optional(),
  insuranceExpiration: z.string().nullable().optional(),

  insuranceCategory: z.enum(["INSURED", "DEPENDENT"]).nullable().optional(),
  limitCertification: z.string().nullable().optional(),

  // 公費負担医療
  publicPayerNumber: z.string().nullable().optional(),
  publicRecipientNumber: z.string().nullable().optional(),

  publicCategory: z.enum([
    "LIVELIHOOD_PROTECTION",
    "INTRACTABLE_DISEASE",
    "MENTAL_HEALTH",
    "CHILD_MEDICAL",
    "ATOMIC_BOMB_SURVIVOR",
    "SPECIFIED_DISEASE",
    "MATERNAL_HEALTH",
    "OTHER"
  ]).nullable().optional(),

  publicExpiration: z.string().nullable().optional(),

  // その他
  notes: z.string().nullable().optional(),
});

export const patientRouter = router({
  // List patients
  list: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ ctx, input }) => {
      const { search, page, limit } = input;
      const skip = (page - 1) * limit;

      const where = {
        tenantId: ctx.tenantId,
        isActive: true,
        ...(search && {
          OR: [
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
            { patientNumber: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search } },
          ],
        }),
      };

      const [patients, total] = await Promise.all([
        ctx.prisma.patient.findMany({
          where,
          skip,
          take: limit,
          orderBy: { updatedAt: "desc" },
        }),
        ctx.prisma.patient.count({ where }),
      ]);

      return {
        patients,
        total,
        pages: Math.ceil(total / limit),
      };
    }),

  // Get single patient
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const patient = await ctx.prisma.patient.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.tenantId,
        },
        include: {
          medicalRecords: {
            orderBy: { recordDate: "desc" },
            take: 10,
            include: { doctor: true },
          },
          appointments: {
            orderBy: { appointmentDate: "desc" },
            take: 5,
            include: { doctor: true },
          },
          prescriptions: {
            orderBy: { prescriptionDate: "desc" },
            take: 10,
          },
        },
      });

      if (!patient) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await logPhiAccess({
        entityType: "Patient",
        entityId: patient.id,
        userId: ctx.session.user.id,
        tenantId: ctx.tenantId,
        ipAddress: ctx.requestMeta.ipAddress,
        userAgent: ctx.requestMeta.userAgent,
      });

      return patient;
    }),

  // Create patient
    create: protectedProcedure
    .input(patientSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.patient.findFirst({
        where: {
          tenantId: ctx.tenantId,
          patientNumber: input.patientNumber,
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "患者番号が既に存在します",
        });
      }

      const patient = await ctx.prisma.patient.create({
        data: {
          ...input,
          dateOfBirth: new Date(input.dateOfBirth),
          firstVisitDate: input.firstVisitDate ? new Date(input.firstVisitDate) : null,
          lastVisitDate: input.lastVisitDate ? new Date(input.lastVisitDate) : null,
          insuranceExpiration: input.insuranceExpiration ? new Date(input.insuranceExpiration) : null,
          publicExpiration: input.publicExpiration ? new Date(input.publicExpiration) : null,
          email: input.email || null,
          tenantId: ctx.tenantId,
        },
      });

      await logPhiModification({
        action: "CREATE",
        entityType: "Patient",
        entityId: patient.id,
        userId: ctx.session.user.id,
        tenantId: ctx.tenantId,
        newData: { patientNumber: input.patientNumber, name: `${input.lastName} ${input.firstName}` },
        ipAddress: ctx.requestMeta.ipAddress,
        userAgent: ctx.requestMeta.userAgent,
      });

      return patient;
    }),

    // Update patient
    update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: patientSchema.partial(),
    }))
    .mutation(async ({ ctx, input }) => {
      const patient = await ctx.prisma.patient.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.tenantId,
        },
      });

      if (!patient) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const updatedPatient = await ctx.prisma.patient.update({
        where: { id: input.id },
        data: {
          ...input.data,
          // 日付フィールドの変換
          ...(input.data.dateOfBirth && {
            dateOfBirth: new Date(input.data.dateOfBirth),
          }),
          ...(input.data.firstVisitDate !== undefined && {
            firstVisitDate: input.data.firstVisitDate ? new Date(input.data.firstVisitDate) : null,
          }),
          ...(input.data.lastVisitDate !== undefined && {
            lastVisitDate: input.data.lastVisitDate ? new Date(input.data.lastVisitDate) : null,
          }),
          ...(input.data.insuranceExpiration !== undefined && {
            insuranceExpiration: input.data.insuranceExpiration ? new Date(input.data.insuranceExpiration) : null,
          }),
          ...(input.data.publicExpiration !== undefined && {
            publicExpiration: input.data.publicExpiration ? new Date(input.data.publicExpiration) : null,
          }),
          email: input.data.email || null,
        },
      });

      await logPhiModification({
        action: "UPDATE",
        entityType: "Patient",
        entityId: patient.id,
        userId: ctx.session.user.id,
        tenantId: ctx.tenantId,
        oldData: { patientNumber: patient.patientNumber },
        newData: { updatedFields: Object.keys(input.data) },
        ipAddress: ctx.requestMeta.ipAddress,
        userAgent: ctx.requestMeta.userAgent,
      });

      return updatedPatient;
    }),

  // Delete (soft delete)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const patient = await ctx.prisma.patient.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.tenantId,
        },
      });

      if (!patient) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const deletedPatient = await ctx.prisma.patient.update({
        where: { id: input.id },
        data: { isActive: false },
      });

      await logPhiModification({
        action: "DELETE",
        entityType: "Patient",
        entityId: patient.id,
        userId: ctx.session.user.id,
        tenantId: ctx.tenantId,
        oldData: { patientNumber: patient.patientNumber, name: `${patient.lastName} ${patient.firstName}` },
        ipAddress: ctx.requestMeta.ipAddress,
        userAgent: ctx.requestMeta.userAgent,
      });

      return deletedPatient;
    }),
});