/**
 * Centralized logging utility
 * In production, this should integrate with a logging service (Datadog, New Relic, etc.)
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...context,
    };

    // In development, use console
    if (process.env.NODE_ENV === 'development') {
      const consoleMethod = console[level] || console.log;
      consoleMethod(`[${timestamp}] [${level.toUpperCase()}]`, message, context || '');
    } else {
      // In production, send to logging service
      // TODO: Integrate with Datadog, New Relic, or similar
      console.log(JSON.stringify(logEntry));
    }
  }

  error(message: string, context?: LogContext) {
    this.log('error', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }
}

export const logger = new Logger();
