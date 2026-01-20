import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

const appointmentSchema = z.object({
  patientId: z.string(),
  doctorId: z.string(),
  appointmentDate: z.date(),
  startTime: z.date(),
  endTime: z.date(),
  type: z.enum(["INITIAL", "FOLLOWUP", "CONSULTATION", "CHECKUP", "EMERGENCY"]),
  reason: z.string().optional(),
  notes: z.string().optional(),
  isOnline: z.boolean().default(false),
});

export const appointmentRouter = router({
  // Get doctors (users with DOCTOR role)
  doctors: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.user.findMany({
      where: {
        tenantId: ctx.tenantId,
        role: "DOCTOR",
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: { name: "asc" },
    });
  }),

  // List appointments by date range (for week view)
  listByDateRange: protectedProcedure
    .input(z.object({
      startDate: z.date(),
      endDate: z.date(),
    }))
    .query(async ({ ctx, input }) => {
      const { startDate, endDate } = input;

      return ctx.prisma.appointment.findMany({
        where: {
          tenantId: ctx.tenantId,
          appointmentDate: {
            gte: startDate,
            lt: endDate,
          },
        },
        orderBy: { startTime: "asc" },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, patientNumber: true } },
          doctor: { select: { id: true, name: true } },
        },
      });
    }),

  // List appointments
  list: protectedProcedure
    .input(z.object({
      date: z.date().optional(),
      doctorId: z.string().optional(),
      patientId: z.string().optional(),
      status: z.enum([
        "SCHEDULED", "CONFIRMED", "WAITING", "IN_PROGRESS",
        "COMPLETED", "CANCELLED", "NO_SHOW"
      ]).optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ ctx, input }) => {
      const { date, doctorId, patientId, status, page, limit } = input;
      const skip = (page - 1) * limit;

      // Build date range filter properly without mutating input
      let dateFilter = {};
      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        dateFilter = {
          appointmentDate: {
            gte: startOfDay,
            lt: endOfDay,
          },
        };
      }

      const where = {
        tenantId: ctx.tenantId,
        ...dateFilter,
        ...(doctorId && { doctorId }),
        ...(patientId && { patientId }),
        ...(status && { status }),
      };

      const [appointments, total] = await Promise.all([
        ctx.prisma.appointment.findMany({
          where,
          skip,
          take: limit,
          orderBy: { startTime: "asc" },
          include: {
            patient: { select: { id: true, firstName: true, lastName: true, patientNumber: true } },
            doctor: { select: { id: true, name: true } },
          },
        }),
        ctx.prisma.appointment.count({ where }),
      ]);

      return {
        appointments,
        total,
        pages: Math.ceil(total / limit),
      };
    }),

  // Get today's appointments
  today: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return ctx.prisma.appointment.findMany({
      where: {
        tenantId: ctx.tenantId,
        appointmentDate: {
          gte: today,
          lt: tomorrow,
        },
      },
      orderBy: { startTime: "asc" },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, patientNumber: true } },
        doctor: { select: { id: true, name: true } },
      },
    });
  }),

  // Get single appointment
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const appointment = await ctx.prisma.appointment.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.tenantId,
        },
        include: {
          patient: true,
          doctor: true,
          videoSession: true,
        },
      });

      if (!appointment) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return appointment;
    }),

  // Create appointment
  create: protectedProcedure
    .input(appointmentSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify patient belongs to tenant
      const patient = await ctx.prisma.patient.findFirst({
        where: { id: input.patientId, tenantId: ctx.tenantId },
      });

      if (!patient) {
        throw new TRPCError({ code: "NOT_FOUND", message: "患者が見つかりません" });
      }

      // Verify doctor belongs to tenant
      const doctor = await ctx.prisma.user.findFirst({
        where: { id: input.doctorId, tenantId: ctx.tenantId, role: "DOCTOR" },
      });

      if (!doctor) {
        throw new TRPCError({ code: "NOT_FOUND", message: "医師が見つかりません" });
      }

      // Check for overlapping appointments
      const overlapping = await ctx.prisma.appointment.findFirst({
        where: {
          tenantId: ctx.tenantId,
          doctorId: input.doctorId,
          status: { notIn: ["CANCELLED", "NO_SHOW"] },
          OR: [
            {
              startTime: { lte: input.startTime },
              endTime: { gt: input.startTime },
            },
            {
              startTime: { lt: input.endTime },
              endTime: { gte: input.endTime },
            },
          ],
        },
      });

      if (overlapping) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "この時間帯には既に予約があります",
        });
      }

      return ctx.prisma.appointment.create({
        data: {
          ...input,
          tenantId: ctx.tenantId,
        },
      });
    }),

  // Update appointment status
  updateStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum([
        "SCHEDULED", "CONFIRMED", "WAITING", "IN_PROGRESS",
        "COMPLETED", "CANCELLED", "NO_SHOW"
      ]),
    }))
    .mutation(async ({ ctx, input }) => {
      const appointment = await ctx.prisma.appointment.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });

      if (!appointment) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.prisma.appointment.update({
        where: { id: input.id },
        data: { status: input.status },
      });
    }),

  // Cancel appointment
  cancel: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const appointment = await ctx.prisma.appointment.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });

      if (!appointment) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.prisma.appointment.update({
        where: { id: input.id },
        data: { status: "CANCELLED" },
      });
    }),
});
