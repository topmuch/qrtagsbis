/**
 * Centralized logger for QRTags monitoring.
 * Writes to console (sync) + database (async fire-and-forget).
 */

import { logMetric } from './logger-metrics';

// ─── Types ───
type LogLevel = 'info' | 'warn' | 'error' | 'fatal';

interface LogEntry {
  level: LogLevel;
  message: string;
  source: string;
  metadata?: Record<string, unknown>;
}

// ─── Metadata Sanitization ───
const SENSITIVE_KEYS = /key|secret|token|password|authorization|cookie|session|credit|card/i;

function sanitizeMeta(obj?: Record<string, unknown>): string | undefined {
  if (!obj || Object.keys(obj).length === 0) return undefined;
  
  const sanitized: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.test(k)) {
      sanitized[k] = '***REDACTED***';
    } else if (typeof v === 'string' && v.length > 500) {
      sanitized[k] = v.substring(0, 500) + '...[truncated]';
    } else {
      sanitized[k] = v;
    }
  }
  return JSON.stringify(sanitized);
}

// ─── Fire-and-forget DB writer ───
function writeToDb(entry: LogEntry): void {
  // Dynamic import to avoid circular dependencies
  import('@prisma/client').then(({ PrismaClient }) => {
    const db = new PrismaClient();
    db.systemLog.create({
      data: {
        level: entry.level,
        message: entry.message,
        source: entry.source,
        metadata: sanitizeMeta(entry.metadata),
      },
    }).catch(() => {
      // Silently fail - logging should never break the app
    }).finally(() => {
      db.$disconnect().catch(() => {});
    });
  }).catch(() => {
    // If even the import fails, just ignore
  });
}

// ─── Console formatting ───
const LEVEL_ICONS: Record<LogLevel, string> = {
  info: 'ℹ️',
  warn: '⚠️',
  error: '❌',
  fatal: '🔥',
};

const LEVEL_CONSOLE: Record<LogLevel, 'log' | 'warn' | 'error'> = {
  info: 'log',
  warn: 'warn',
  error: 'error',
  fatal: 'error',
};

function formatConsole(entry: LogEntry): string {
  const icon = LEVEL_ICONS[entry.level];
  const meta = entry.metadata ? ` ${JSON.stringify(entry.metadata)}` : '';
  return `[${entry.source}] ${icon} ${entry.message}${meta}`;
}

// ─── Main Logger API ───
export const log = {
  info(message: string, source: string = 'app', metadata?: Record<string, unknown>): void {
    const entry: LogEntry = { level: 'info', message, source, metadata };
    console[LEVEL_CONSOLE.info](formatConsole(entry));
    writeToDb(entry);
  },

  warn(message: string, source: string = 'app', metadata?: Record<string, unknown>): void {
    const entry: LogEntry = { level: 'warn', message, source, metadata };
    console[LEVEL_CONSOLE.warn](formatConsole(entry));
    writeToDb(entry);
  },

  error(message: string, source: string = 'app', metadata?: Record<string, unknown>): void {
    const entry: LogEntry = { level: 'error', message, source, metadata };
    console[LEVEL_CONSOLE.error](formatConsole(entry));
    writeToDb(entry);
  },

  fatal(message: string, source: string = 'app', metadata?: Record<string, unknown>): void {
    const entry: LogEntry = { level: 'fatal', message, source, metadata };
    console[LEVEL_CONSOLE.error](formatConsole(entry));
    writeToDb(entry);
  },
};

// ─── Re-export logMetric for backward compatibility ───
export { logMetric } from './logger-metrics';
