import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { logPhiAccess, logPhiModification } from "@/lib/audit";
import { sanitizeHtml } from "@/lib/security";
import { patientInputSchema, type PatientInput } from "@/domain/patient/schema";

// テキストフィールドをサニタイズするヘルパー関数
function sanitizePatientTextFields<T extends Partial<PatientInput>>(input: T): T {
  return {
    ...input,
    ...(input.allergies !== undefined && {
      allergies: input.allergies ? sanitizeHtml(input.allergies) : null,
    }),
    ...(input.medicalHistory !== undefined && {
      medicalHistory: input.medicalHistory ? sanitizeHtml(input.medicalHistory) : null,
    }),
    ...(input.familyHistory !== undefined && {
      familyHistory: input.familyHistory ? sanitizeHtml(input.familyHistory) : null,
    }),
    ...(input.contraindications !== undefined && {
      contraindications: input.contraindications ? sanitizeHtml(input.contraindications) : null,
    }),
    ...(input.currentMedications !== undefined && {
      currentMedications: input.currentMedications ? sanitizeHtml(input.currentMedications) : null,
    }),
    ...(input.healthCheckInfo !== undefined && {
      healthCheckInfo: input.healthCheckInfo ? sanitizeHtml(input.healthCheckInfo) : null,
    }),
    ...(input.notes !== undefined && {
      notes: input.notes ? sanitizeHtml(input.notes) : null,
    }),
    ...(input.limitCertification !== undefined && {
      limitCertification: input.limitCertification ? sanitizeHtml(input.limitCertification) : null,
    }),
  };
}

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
    .input(patientInputSchema)
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

      const sanitizedInput = sanitizePatientTextFields(input);

      const patient = await ctx.prisma.patient.create({
        data: {
          ...sanitizedInput,
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
      data: patientInputSchema.partial(),
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

      const sanitizedData = sanitizePatientTextFields(input.data);

      const updatedPatient = await ctx.prisma.patient.update({
        where: {
          id: input.id,
          tenantId: ctx.tenantId,
        },
        data: {
          ...sanitizedData,
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
        where: {
          id: input.id,
          tenantId: ctx.tenantId,
        },
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
