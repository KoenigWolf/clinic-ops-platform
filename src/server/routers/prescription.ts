import { z } from "zod";
import { router, doctorProcedure, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

const prescriptionSchema = z.object({
  patientId: z.string(),
  medicalRecordId: z.string().optional(),
  medicationName: z.string().min(1),
  dosage: z.string().min(1),
  frequency: z.string().min(1),
  duration: z.number().min(1),
  quantity: z.number().min(1),
  unit: z.string().min(1),
  instructions: z.string().optional(),
});

export const prescriptionRouter = router({
  // List prescriptions
  list: protectedProcedure
    .input(z.object({
      patientId: z.string().optional(),
      status: z.enum(["PENDING", "DISPENSED", "CANCELLED"]).optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ ctx, input }) => {
      const { patientId, status, page, limit } = input;
      const skip = (page - 1) * limit;

      // Build where clause with tenant filter through patient
      const where = {
        patient: { tenantId: ctx.tenantId },
        ...(patientId && { patientId }),
        ...(status && { status }),
      };

      const [prescriptions, total] = await Promise.all([
        ctx.prisma.prescription.findMany({
          where,
          skip,
          take: limit,
          orderBy: { prescriptionDate: "desc" },
          include: {
            patient: { select: { id: true, firstName: true, lastName: true, patientNumber: true } },
            doctor: { select: { id: true, name: true } },
          },
        }),
        ctx.prisma.prescription.count({ where }),
      ]);

      return {
        prescriptions,
        total,
        pages: Math.ceil(total / limit),
      };
    }),

  // Get pending prescriptions count
  pendingCount: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.prescription.count({
      where: {
        patient: { tenantId: ctx.tenantId },
        status: "PENDING",
      },
    });
  }),

  // Create prescription (doctors only)
  create: doctorProcedure
    .input(prescriptionSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify patient belongs to tenant
      const patient = await ctx.prisma.patient.findFirst({
        where: { id: input.patientId, tenantId: ctx.tenantId },
      });

      if (!patient) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.prisma.prescription.create({
        data: {
          ...input,
          doctorId: ctx.session.user.id,
        },
      });
    }),

  // Create multiple prescriptions at once
  createMany: doctorProcedure
    .input(z.object({
      patientId: z.string(),
      medicalRecordId: z.string().optional(),
      prescriptions: z.array(prescriptionSchema.omit({ patientId: true, medicalRecordId: true })),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify patient belongs to tenant
      const patient = await ctx.prisma.patient.findFirst({
        where: { id: input.patientId, tenantId: ctx.tenantId },
      });

      if (!patient) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const data = input.prescriptions.map((p) => ({
        ...p,
        patientId: input.patientId,
        medicalRecordId: input.medicalRecordId,
        doctorId: ctx.session.user.id,
      }));

      return ctx.prisma.prescription.createMany({ data });
    }),

  // Mark as dispensed
  dispense: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const prescription = await ctx.prisma.prescription.findFirst({
        where: { id: input.id },
        include: { patient: true },
      });

      if (!prescription || prescription.patient.tenantId !== ctx.tenantId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.prisma.prescription.update({
        where: { id: input.id },
        data: {
          status: "DISPENSED",
          dispensedAt: new Date(),
        },
      });
    }),

  // Cancel prescription
  cancel: doctorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const prescription = await ctx.prisma.prescription.findFirst({
        where: { id: input.id },
        include: { patient: true },
      });

      if (!prescription || prescription.patient.tenantId !== ctx.tenantId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.prisma.prescription.update({
        where: { id: input.id },
        data: { status: "CANCELLED" },
      });
    }),
});
