import { z } from "zod";
import { router, doctorProcedure, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { logPhiAccess, logPhiModification } from "@/lib/audit";

const vitalSignsSchema = z.object({
  bloodPressureSystolic: z.number().optional(),
  bloodPressureDiastolic: z.number().optional(),
  heartRate: z.number().optional(),
  temperature: z.number().optional(),
  respiratoryRate: z.number().optional(),
  oxygenSaturation: z.number().optional(),
  weight: z.number().optional(),
  height: z.number().optional(),
});

const recordSchema = z.object({
  patientId: z.string(),
  recordDate: z.date().optional(),
  subjective: z.string().optional(),
  objective: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
  chiefComplaint: z.string().optional(),
  diagnosis: z.string().optional(),
  vitalSigns: vitalSignsSchema.optional(),
});

export const recordRouter = router({
  // List records for a patient
  listByPatient: protectedProcedure
    .input(z.object({
      patientId: z.string(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ ctx, input }) => {
      const { patientId, page, limit } = input;
      const skip = (page - 1) * limit;

      // Verify patient belongs to tenant
      const patient = await ctx.prisma.patient.findFirst({
        where: { id: patientId, tenantId: ctx.tenantId },
      });

      if (!patient) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const [records, total] = await Promise.all([
        ctx.prisma.medicalRecord.findMany({
          where: { patientId, patient: { tenantId: ctx.tenantId } },
          skip,
          take: limit,
          orderBy: { recordDate: "desc" },
          include: {
            doctor: { select: { id: true, name: true } },
            prescriptions: true,
          },
        }),
        ctx.prisma.medicalRecord.count({
          where: { patientId, patient: { tenantId: ctx.tenantId } },
        }),
      ]);

      return {
        records,
        total,
        pages: Math.ceil(total / limit),
      };
    }),

  // Get single record
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const record = await ctx.prisma.medicalRecord.findFirst({
        where: {
          id: input.id,
          patient: { tenantId: ctx.tenantId },
        },
        include: {
          patient: true,
          doctor: true,
          prescriptions: true,
          labResults: true,
          medicalImages: true,
        },
      });

      if (!record) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await logPhiAccess({
        entityType: "MedicalRecord",
        entityId: record.id,
        userId: ctx.session.user.id,
        tenantId: ctx.tenantId,
        ipAddress: ctx.requestMeta.ipAddress,
        userAgent: ctx.requestMeta.userAgent,
      });

      return record;
    }),

  // Create record (doctors only)
  create: doctorProcedure
    .input(recordSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify patient belongs to tenant
      const patient = await ctx.prisma.patient.findFirst({
        where: { id: input.patientId, tenantId: ctx.tenantId },
      });

      if (!patient) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const record = await ctx.prisma.medicalRecord.create({
        data: {
          ...input,
          vitalSigns: input.vitalSigns || undefined,
          doctorId: ctx.session.user.id,
        },
      });

      await logPhiModification({
        action: "CREATE",
        entityType: "MedicalRecord",
        entityId: record.id,
        userId: ctx.session.user.id,
        tenantId: ctx.tenantId,
        newData: { patientId: input.patientId, diagnosis: input.diagnosis },
        ipAddress: ctx.requestMeta.ipAddress,
        userAgent: ctx.requestMeta.userAgent,
      });

      return record;
    }),

  // Update record (doctors only)
  update: doctorProcedure
    .input(z.object({
      id: z.string(),
      data: recordSchema.omit({ patientId: true }).partial(),
    }))
    .mutation(async ({ ctx, input }) => {
      const record = await ctx.prisma.medicalRecord.findFirst({
        where: {
          id: input.id,
          patient: { tenantId: ctx.tenantId },
        },
      });

      if (!record) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const updatedRecord = await ctx.prisma.medicalRecord.update({
        where: { id: input.id },
        data: {
          ...input.data,
          vitalSigns: input.data.vitalSigns || undefined,
        },
      });

      await logPhiModification({
        action: "UPDATE",
        entityType: "MedicalRecord",
        entityId: record.id,
        userId: ctx.session.user.id,
        tenantId: ctx.tenantId,
        newData: { updatedFields: Object.keys(input.data) },
        ipAddress: ctx.requestMeta.ipAddress,
        userAgent: ctx.requestMeta.userAgent,
      });

      return updatedRecord;
    }),

  // Delete record (doctors only)
  delete: doctorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const record = await ctx.prisma.medicalRecord.findFirst({
        where: {
          id: input.id,
          patient: { tenantId: ctx.tenantId },
        },
      });

      if (!record) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const deletedRecord = await ctx.prisma.medicalRecord.delete({
        where: { id: input.id },
      });

      await logPhiModification({
        action: "DELETE",
        entityType: "MedicalRecord",
        entityId: record.id,
        userId: ctx.session.user.id,
        tenantId: ctx.tenantId,
        oldData: { patientId: record.patientId, diagnosis: record.diagnosis },
        ipAddress: ctx.requestMeta.ipAddress,
        userAgent: ctx.requestMeta.userAgent,
      });

      return deletedRecord;
    }),
});
