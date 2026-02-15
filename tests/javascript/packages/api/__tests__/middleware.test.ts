import { describe, it, expect, vi } from "vitest";
import { corsMiddleware, rateLimitMiddleware } from "../src/middleware";

describe("corsMiddleware", () => {
  it("calls next()", () => {
    const mw = corsMiddleware(["http://localhost"]);
    const next = vi.fn();
    mw({}, {}, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("works with empty origins (wildcard fallback)", () => {
    const mw = corsMiddleware([]);
    const next = vi.fn();
    mw({}, {}, next);
    expect(next).toHaveBeenCalledOnce();
  });
});

describe("rateLimitMiddleware", () => {
  it("allows requests under the limit", () => {
    const mw = rateLimitMiddleware(5, 60_000);
    const next = vi.fn();
    mw({ ip: "1.2.3.4" }, {}, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("throws when rate limit exceeded", () => {
    const mw = rateLimitMiddleware(2, 60_000);
    const next = vi.fn();
    mw({ ip: "1.2.3.4" }, {}, next);
    mw({ ip: "1.2.3.4" }, {}, next);
    expect(() => mw({ ip: "1.2.3.4" }, {}, next)).toThrow(
      "Rate limit exceeded",
    );
  });

  it("tracks limits per IP", () => {
    const mw = rateLimitMiddleware(1, 60_000);
    const next = vi.fn();
    mw({ ip: "1.1.1.1" }, {}, next);
    mw({ ip: "2.2.2.2" }, {}, next);
    expect(next).toHaveBeenCalledTimes(2);
  });
});
