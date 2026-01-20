/**
 * HIPAA-compliant audit logging utility
 * Tracks all access to Protected Health Information (PHI)
 */

import { prisma } from "./prisma";
import { isPhiEntity, type AuditAction, type AuditLogEntry } from "./security";

/**
 * Create an audit log entry
 * This should be called for all PHI access operations
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        userId: entry.userId,
        tenantId: entry.tenantId,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        oldData: entry.oldData !== undefined ? (entry.oldData as object) : undefined,
        newData: entry.newData !== undefined ? (entry.newData as object) : undefined,
      },
    });
  } catch (error) {
    // Log error but don't fail the main operation
    // In production, this would alert security team
    console.error("[AUDIT] Failed to create audit log:", error);
  }
}

/**
 * Log PHI access (read operations)
 */
export async function logPhiAccess(params: {
  entityType: string;
  entityId: string;
  userId: string;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  if (!isPhiEntity(params.entityType)) {
    return;
  }

  await createAuditLog({
    action: "PHI_ACCESS",
    ...params,
  });
}

/**
 * Log PHI modification (create/update/delete)
 */
export async function logPhiModification(params: {
  action: "CREATE" | "UPDATE" | "DELETE";
  entityType: string;
  entityId: string;
  userId: string;
  tenantId: string;
  oldData?: unknown;
  newData?: unknown;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  if (!isPhiEntity(params.entityType)) {
    return;
  }

  await createAuditLog(params);
}

/**
 * Log authentication events
 */
export async function logAuthEvent(params: {
  action: "LOGIN" | "LOGOUT" | "LOGIN_FAILED";
  userId?: string;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await createAuditLog({
    action: params.action,
    entityType: "User",
    entityId: params.userId || "unknown",
    userId: params.userId,
    tenantId: params.tenantId,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    newData: params.metadata as object | undefined,
  });
}

/**
 * Log security events (access denied, etc.)
 */
export async function logSecurityEvent(params: {
  action: "ACCESS_DENIED";
  entityType: string;
  entityId: string;
  userId?: string;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
}): Promise<void> {
  await createAuditLog({
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    userId: params.userId,
    tenantId: params.tenantId,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    newData: params.reason ? { reason: params.reason } : undefined,
  });
}

/**
 * Log data export events
 */
export async function logExportEvent(params: {
  entityType: string;
  entityIds: string[];
  userId: string;
  tenantId: string;
  exportFormat: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  await createAuditLog({
    action: "EXPORT",
    entityType: params.entityType,
    entityId: params.entityIds.join(","),
    userId: params.userId,
    tenantId: params.tenantId,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    newData: {
      exportFormat: params.exportFormat,
      recordCount: params.entityIds.length,
    },
  });
}

/**
 * Log print events
 */
export async function logPrintEvent(params: {
  entityType: string;
  entityId: string;
  userId: string;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  await createAuditLog({
    action: "PRINT",
    entityType: params.entityType,
    entityId: params.entityId,
    userId: params.userId,
    tenantId: params.tenantId,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  });
}

/**
 * Query audit logs with filters
 * Only accessible to admins
 */
export async function queryAuditLogs(params: {
  tenantId: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}): Promise<{
  logs: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    userId: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    oldData: unknown;
    newData: unknown;
    createdAt: Date;
    user: { name: string; email: string } | null;
  }>;
  total: number;
}> {
  const where = {
    tenantId: params.tenantId,
    ...(params.entityType && { entityType: params.entityType }),
    ...(params.entityId && { entityId: params.entityId }),
    ...(params.userId && { userId: params.userId }),
    ...(params.action && { action: params.action }),
    ...(params.startDate || params.endDate
      ? {
          createdAt: {
            ...(params.startDate && { gte: params.startDate }),
            ...(params.endDate && { lte: params.endDate }),
          },
        }
      : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: params.limit || 50,
      skip: params.offset || 0,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total };
}

/**
 * Get audit trail for a specific entity
 */
export async function getEntityAuditTrail(params: {
  tenantId: string;
  entityType: string;
  entityId: string;
}): Promise<
  Array<{
    id: string;
    action: string;
    userId: string | null;
    oldData: unknown;
    newData: unknown;
    createdAt: Date;
    user: { name: string } | null;
  }>
> {
  return prisma.auditLog.findMany({
    where: {
      tenantId: params.tenantId,
      entityType: params.entityType,
      entityId: params.entityId,
    },
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
