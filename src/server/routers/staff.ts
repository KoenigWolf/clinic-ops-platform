import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const staffRouter = router({
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const staff = await ctx.prisma.user.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.tenantId,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          specialization: true,
          licenseNumber: true,
          image: true,
          createdAt: true,
          _count: {
            select: {
              appointments: true,
              medicalRecords: true,
              prescriptions: true,
            },
          },
        },
      });

      if (!staff) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "スタッフが見つかりません",
        });
      }

      return staff;
    }),

  list: protectedProcedure
    .input(z.object({
      role: z.enum(["ADMIN", "DOCTOR", "NURSE", "STAFF"]).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const staff = await ctx.prisma.user.findMany({
        where: {
          tenantId: ctx.tenantId,
          isActive: true,
          role: input?.role ?? { in: ["ADMIN", "DOCTOR", "NURSE", "STAFF"] },
        },
        select: {
          id: true,
          name: true,
          role: true,
          specialization: true,
        },
        orderBy: { name: "asc" },
      });

      return staff;
    }),
});
