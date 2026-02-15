export type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export class Logger {
  private level: LogLevel;
  private prefix: string;

  constructor(prefix: string = "", level: LogLevel = "info") {
    this.prefix = prefix;
    this.level = level;
  }

  // FIXME: Log output should be structured JSON in production mode
  private log(level: LogLevel, message: string, ...args: unknown[]): void {
    if (LOG_LEVELS[level] < LOG_LEVELS[this.level]) return;

    const timestamp = new Date().toISOString();
    const tag = this.prefix ? `[${this.prefix}]` : "";
    const fn = level === "debug" ? "log" : level;
    console[fn](`${timestamp} ${level.toUpperCase()} ${tag} ${message}`, ...args);
  }

  debug(message: string, ...args: unknown[]): void {
    this.log("debug", message, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    this.log("info", message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.log("warn", message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    this.log("error", message, ...args);
  }

  // TODO: Add child logger support for scoped logging
  child(prefix: string): Logger {
    const combined = this.prefix ? `${this.prefix}:${prefix}` : prefix;
    return new Logger(combined, this.level);
  }
}
