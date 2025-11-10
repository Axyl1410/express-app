export type AuditLogType = {
  id: string;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  message: string;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
};
