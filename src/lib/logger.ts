/**
 * Centralized Enterprise Cloud Logging & Alerting Utility — Sintesa / Teknopark
 * Standard: R-039 (Audit Logging, Security Events, AI Error Tracking & Alert Webhook)
 */

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'SECURITY';

export interface LogPayload {
  level: LogLevel;
  module: string;
  message: string;
  userId?: string;
  role?: string;
  action?: string;
  durationMs?: number;
  metadata?: Record<string, any>;
  error?: string | Error;
  timestamp: string;
}

const ALERT_WEBHOOK_URL = process.env.ALERT_WEBHOOK_URL;

class EnterpriseLogger {
  private formatLog(payload: LogPayload): string {
    return JSON.stringify({
      ...payload,
      error: payload.error instanceof Error ? {
        message: payload.error.message,
        stack: payload.error.stack,
        name: payload.error.name,
      } : payload.error,
    });
  }

  private async dispatchAlertWebhook(payload: LogPayload): Promise<void> {
    if (!ALERT_WEBHOOK_URL) return;
    try {
      await fetch(ALERT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 [${payload.level}] ${payload.module}: ${payload.message}`,
          details: payload,
        }),
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      // Abaikan kegagalan alert webhook agar tidak memblokir alur bisnis
    }
  }

  info(module: string, message: string, metadata?: Record<string, any>): void {
    const payload: LogPayload = {
      level: 'INFO',
      module,
      message,
      metadata,
      timestamp: new Date().toISOString(),
    };
    console.log(`[INFO] [${module}]: ${message}`, metadata || '');
  }

  warn(module: string, message: string, metadata?: Record<string, any>): void {
    const payload: LogPayload = {
      level: 'WARN',
      module,
      message,
      metadata,
      timestamp: new Date().toISOString(),
    };
    console.warn(`[WARN] [${module}]: ${message}`, metadata || '');
  }

  error(module: string, message: string, error?: unknown, metadata?: Record<string, any>): void {
    const payload: LogPayload = {
      level: 'ERROR',
      module,
      message,
      error: error instanceof Error ? error : String(error),
      metadata,
      timestamp: new Date().toISOString(),
    };
    console.error(`[ERROR] [${module}]: ${message}`, error, metadata || '');
    this.dispatchAlertWebhook(payload);
  }

  security(action: string, userId: string, role: string, message: string, metadata?: Record<string, any>): void {
    const payload: LogPayload = {
      level: 'SECURITY',
      module: 'SECURITY_AUDIT',
      action,
      userId,
      role,
      message,
      metadata,
      timestamp: new Date().toISOString(),
    };
    console.warn(`🔒 [SECURITY AUDIT] [${action}] User: ${userId} (${role}) — ${message}`, metadata || '');
    this.dispatchAlertWebhook(payload);
  }

  aiMetric(model: string, operation: string, durationMs: number, success: boolean, extra?: Record<string, any>): void {
    const payload: LogPayload = {
      level: success ? 'INFO' : 'WARN',
      module: 'AI_METRIC',
      message: `Model: ${model} | Operation: ${operation} | Duration: ${durationMs}ms | Success: ${success}`,
      durationMs,
      metadata: { model, operation, success, ...extra },
      timestamp: new Date().toISOString(),
    };
    console.log(`🤖 [AI METRIC] ${model} - ${operation}: ${durationMs}ms (Success: ${success})`);
  }
}

export const logger = new EnterpriseLogger();
