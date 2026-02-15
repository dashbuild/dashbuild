import { describe, it, expect } from "vitest";
import { createServer } from "../src/server";

describe("createServer", () => {
  it("creates a server instance", () => {
    const server = createServer();
    expect(server).toBeDefined();
    expect(server.listen).toBeTypeOf("function");
    expect(server.close).toBeTypeOf("function");
    expect(server.isRunning).toBeTypeOf("function");
  });

  it("starts not running", () => {
    const server = createServer();
    expect(server.isRunning()).toBe(false);
  });

  it("is running after listen()", () => {
    const server = createServer();
    server.listen();
    expect(server.isRunning()).toBe(true);
  });

  it("throws if listen() called twice", () => {
    const server = createServer();
    server.listen();
    expect(() => server.listen()).toThrow("Server is already running");
  });

  it("stops running after close()", () => {
    const server = createServer();
    server.listen();
    server.close();
    expect(server.isRunning()).toBe(false);
  });
});
