import { initTRPC, TRPCError } from "@trpc/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import superjson from "superjson";
import type { Session } from "next-auth";
import { headers } from "next/headers";

export const createTRPCContext = async () => {
  // cache()でラップされたgetSession()を使用
  // 同一リクエスト内で複数回呼ばれても1回だけ実行される
  const session = await getSession();

  // Get request metadata for audit logging
  const headersList = await headers();
  const ipAddress =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    undefined;
  const userAgent = headersList.get("user-agent") || undefined;

  return {
    prisma,
    session,
    requestMeta: {
      ipAddress,
      userAgent,
    },
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Request metadata for audit logging
type RequestMeta = {
  ipAddress?: string;
  userAgent?: string;
};

// 認証済みコンテキストの型 (前提: session, tenantIdは必ず存在)
type AuthenticatedContext = {
  prisma: typeof prisma;
  session: Session;
  tenantId: string;
  requestMeta: RequestMeta;
};

// Authenticated procedure
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  // 前提違反: 認証必須なのにセッションがない
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  // 前提違反: 認証済みユーザーにtenantIdがない
  const tenantId = ctx.session.user.tenantId;
  if (!tenantId) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "認証済みユーザーにtenantIdがありません",
    });
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      tenantId,
      requestMeta: ctx.requestMeta,
    } satisfies AuthenticatedContext,
  });
});

// Admin only procedure
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.session.user.role !== "ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }

  return next({ ctx });
});

// Doctor procedure
export const doctorProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!["ADMIN", "DOCTOR"].includes(ctx.session.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }

  return next({ ctx });
});
