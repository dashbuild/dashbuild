import { describe, it, expect, vi, beforeEach } from "vitest";
import { Logger } from "../src/logger";

describe("Logger", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("logs info messages", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    const logger = new Logger("test", "info");
    logger.info("hello");
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0]).toContain("INFO");
    expect(spy.mock.calls[0][0]).toContain("[test]");
    expect(spy.mock.calls[0][0]).toContain("hello");
  });

  it("logs warn messages", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const logger = new Logger("", "warn");
    logger.warn("warning!");
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0]).toContain("WARN");
  });

  it("logs error messages", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const logger = new Logger("app", "error");
    logger.error("fail");
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0]).toContain("ERROR");
  });

  it("suppresses messages below configured level", () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const logger = new Logger("", "warn");
    logger.info("should not appear");
    logger.debug("should not appear");
    expect(infoSpy).not.toHaveBeenCalled();
    expect(logSpy).not.toHaveBeenCalled();
  });

  it("child creates a scoped logger", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    const parent = new Logger("app", "info");
    const child = parent.child("db");
    child.info("connected");
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0]).toContain("[app:db]");
  });
});
