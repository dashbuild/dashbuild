import { describe, it, expect, beforeEach } from "vitest";
import { loadConfig, mergeConfigs, getConfig, resetConfig } from "../src/config";

describe("loadConfig", () => {
  it("returns default config when no overrides given", () => {
    const config = loadConfig();
    expect(config.port).toBe(3000);
    expect(config.host).toBe("localhost");
    expect(config.database.url).toBe("postgres://localhost:5432/app");
    expect(config.database.pool).toBe(10);
  });

  it("applies overrides", () => {
    const config = loadConfig({ port: 8080, host: "0.0.0.0" });
    expect(config.port).toBe(8080);
    expect(config.host).toBe("0.0.0.0");
  });

  it("applies database overrides", () => {
    const config = loadConfig({
      database: { url: "postgres://prod:5432/app", pool: 20 },
    });
    expect(config.database.url).toBe("postgres://prod:5432/app");
    expect(config.database.pool).toBe(20);
  });

  it("throws when database URL is empty", () => {
    expect(() => loadConfig({ database: { url: "", pool: 5 } })).toThrow(
      "Database URL is required",
    );
  });
});

describe("mergeConfigs", () => {
  it("merges base and override configs", () => {
    const base = loadConfig();
    const merged = mergeConfigs(base, { port: 9090 });
    expect(merged.port).toBe(9090);
    expect(merged.host).toBe("localhost");
    expect(merged.database.url).toBe(base.database.url);
  });

  it("deep merges database config", () => {
    const base = loadConfig();
    const merged = mergeConfigs(base, { database: { url: "new-url", pool: 5 } });
    expect(merged.database.url).toBe("new-url");
    expect(merged.database.pool).toBe(5);
  });
});

describe("getConfig / resetConfig", () => {
  beforeEach(() => {
    resetConfig();
  });

  it("returns cached config on subsequent calls", () => {
    const first = getConfig();
    const second = getConfig();
    expect(first).toBe(second);
  });

  it("returns fresh config after reset", () => {
    const first = getConfig();
    resetConfig();
    const second = getConfig();
    expect(first).not.toBe(second);
    expect(first).toEqual(second);
  });
});
