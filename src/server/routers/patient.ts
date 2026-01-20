import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { logPhiAccess, logPhiModification } from "@/lib/audit";

const patientSchema = z.object({
  patientNumber: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  firstNameKana: z.string().optional(),
  lastNameKana: z.string().optional(),
  dateOfBirth: z.date(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  bloodType: z.enum([
    "A_POSITIVE", "A_NEGATIVE", "B_POSITIVE", "B_NEGATIVE",
    "O_POSITIVE", "O_NEGATIVE", "AB_POSITIVE", "AB_NEGATIVE"
  ]).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  allergies: z.string().optional(),
  medicalHistory: z.string().optional(),
  insuranceNumber: z.string().optional(),
  insuranceType: z.string().optional(),
  notes: z.string().optional(),
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

      // Log PHI access for HIPAA compliance
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
      // Check for duplicate patient number
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
          email: input.email || null,
          tenantId: ctx.tenantId,
        },
      });

      // Log PHI creation for HIPAA compliance
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
          email: input.data.email || null,
        },
      });

      // Log PHI modification for HIPAA compliance
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

      // Log PHI deletion for HIPAA compliance
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
