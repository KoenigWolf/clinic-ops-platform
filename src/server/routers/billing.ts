import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { logPhiAccess, logPhiModification } from "@/lib/audit";

const invoiceItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
});

const invoiceSchema = z.object({
  patientId: z.string(),
  dueDate: z.date().optional(),
  items: z.array(invoiceItemSchema).min(1),
  notes: z.string().optional(),
});

function generateInvoiceNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `INV-${year}${month}-${random}`;
}

export const billingRouter = router({
  // List invoices with stats
  list: protectedProcedure
    .input(z.object({
      patientId: z.string().optional(),
      status: z.enum(["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"]).optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ ctx, input }) => {
      const { patientId, status, page, limit } = input;
      const skip = (page - 1) * limit;

      const where = {
        tenantId: ctx.tenantId,
        ...(patientId && { patientId }),
        ...(status && { status }),
      };

      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const [invoices, total, monthlyRevenueResult, unpaidCount, overdueCount] = await Promise.all([
        ctx.prisma.invoice.findMany({
          where,
          skip,
          take: limit,
          orderBy: { invoiceDate: "desc" },
          include: {
            patient: { select: { id: true, firstName: true, lastName: true, patientNumber: true } },
            items: true,
          },
        }),
        ctx.prisma.invoice.count({ where }),
        // 今月の売上
        ctx.prisma.invoice.aggregate({
          where: {
            tenantId: ctx.tenantId,
            status: "PAID",
            paidAt: { gte: firstDayOfMonth, lte: lastDayOfMonth },
          },
          _sum: { total: true },
        }),
        // 未払い件数
        ctx.prisma.invoice.count({
          where: { tenantId: ctx.tenantId, status: "SENT" },
        }),
        // 期限超過件数
        ctx.prisma.invoice.count({
          where: { tenantId: ctx.tenantId, status: "OVERDUE" },
        }),
      ]);

      return {
        invoices,
        total,
        pages: Math.ceil(total / limit),
        monthlyRevenue: monthlyRevenueResult._sum.total || 0,
        unpaidCount,
        overdueCount,
      };
    }),

  // Get single invoice
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const invoice = await ctx.prisma.invoice.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: {
          patient: true,
          items: true,
        },
      });

      if (!invoice) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await logPhiAccess({
        entityType: "Invoice",
        entityId: invoice.id,
        userId: ctx.session.user.id,
        tenantId: ctx.tenantId,
        ipAddress: ctx.requestMeta.ipAddress,
        userAgent: ctx.requestMeta.userAgent,
      });

      return invoice;
    }),

  // Get monthly revenue
  monthlyRevenue: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const result = await ctx.prisma.invoice.aggregate({
      where: {
        tenantId: ctx.tenantId,
        status: "PAID",
        paidAt: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
      },
      _sum: { total: true },
    });

    return result._sum.total || 0;
  }),

  // Create invoice
  create: protectedProcedure
    .input(invoiceSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify patient belongs to tenant
      const patient = await ctx.prisma.patient.findFirst({
        where: { id: input.patientId, tenantId: ctx.tenantId },
      });

      if (!patient) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Calculate totals
      const items = input.items.map((item) => ({
        ...item,
        amount: item.quantity * item.unitPrice,
      }));

      const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
      const tax = Math.floor(subtotal * 0.1); // 10% tax
      const total = subtotal + tax;

      const invoice = await ctx.prisma.invoice.create({
        data: {
          invoiceNumber: generateInvoiceNumber(),
          patientId: input.patientId,
          tenantId: ctx.tenantId,
          dueDate: input.dueDate,
          subtotal,
          tax,
          total,
          notes: input.notes,
          items: {
            create: items,
          },
        },
        include: { items: true },
      });

      await logPhiModification({
        action: "CREATE",
        entityType: "Invoice",
        entityId: invoice.id,
        userId: ctx.session.user.id,
        tenantId: ctx.tenantId,
        newData: { invoiceNumber: invoice.invoiceNumber, patientId: input.patientId, total },
        ipAddress: ctx.requestMeta.ipAddress,
        userAgent: ctx.requestMeta.userAgent,
      });

      return invoice;
    }),

  // Update invoice status
  updateStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const invoice = await ctx.prisma.invoice.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });

      if (!invoice) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const updateData: { status: typeof input.status; paidAt?: Date | null; paymentMethod?: string } = {
        status: input.status,
      };

      if (input.status === "PAID") {
        updateData.paidAt = new Date();
      }

      const updatedInvoice = await ctx.prisma.invoice.update({
        where: { id: input.id },
        data: updateData,
      });

      await logPhiModification({
        action: "UPDATE",
        entityType: "Invoice",
        entityId: invoice.id,
        userId: ctx.session.user.id,
        tenantId: ctx.tenantId,
        oldData: { status: invoice.status },
        newData: { status: input.status },
        ipAddress: ctx.requestMeta.ipAddress,
        userAgent: ctx.requestMeta.userAgent,
      });

      return updatedInvoice;
    }),

  // Record payment
  recordPayment: protectedProcedure
    .input(z.object({
      id: z.string(),
      paymentMethod: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const invoice = await ctx.prisma.invoice.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });

      if (!invoice) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const updatedInvoice = await ctx.prisma.invoice.update({
        where: { id: input.id },
        data: {
          status: "PAID",
          paidAt: new Date(),
          paymentMethod: input.paymentMethod,
        },
      });

      await logPhiModification({
        action: "UPDATE",
        entityType: "Invoice",
        entityId: invoice.id,
        userId: ctx.session.user.id,
        tenantId: ctx.tenantId,
        oldData: { status: invoice.status, paymentMethod: invoice.paymentMethod },
        newData: { status: "PAID", paymentMethod: input.paymentMethod },
        ipAddress: ctx.requestMeta.ipAddress,
        userAgent: ctx.requestMeta.userAgent,
      });

      return updatedInvoice;
    }),
});
