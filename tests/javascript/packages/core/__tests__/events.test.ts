import { describe, it, expect, vi } from "vitest";
import { EventEmitter } from "../src/events";

describe("EventEmitter", () => {
  it("calls handler when event is emitted", () => {
    const emitter = new EventEmitter();
    const handler = vi.fn();
    emitter.on("test", handler);
    emitter.emit("test", "arg1", "arg2");
    expect(handler).toHaveBeenCalledWith("arg1", "arg2");
  });

  it("supports multiple handlers for the same event", () => {
    const emitter = new EventEmitter();
    const h1 = vi.fn();
    const h2 = vi.fn();
    emitter.on("test", h1);
    emitter.on("test", h2);
    emitter.emit("test");
    expect(h1).toHaveBeenCalledOnce();
    expect(h2).toHaveBeenCalledOnce();
  });

  it("does not call handler after off()", () => {
    const emitter = new EventEmitter();
    const handler = vi.fn();
    emitter.on("test", handler);
    emitter.off("test", handler);
    emitter.emit("test");
    expect(handler).not.toHaveBeenCalled();
  });

  it("does nothing when emitting event with no handlers", () => {
    const emitter = new EventEmitter();
    expect(() => emitter.emit("nonexistent")).not.toThrow();
  });

  it("removeAllListeners clears specific event", () => {
    const emitter = new EventEmitter();
    const h1 = vi.fn();
    const h2 = vi.fn();
    emitter.on("a", h1);
    emitter.on("b", h2);
    emitter.removeAllListeners("a");
    emitter.emit("a");
    emitter.emit("b");
    expect(h1).not.toHaveBeenCalled();
    expect(h2).toHaveBeenCalledOnce();
  });

  it("removeAllListeners with no arg clears all events", () => {
    const emitter = new EventEmitter();
    const h1 = vi.fn();
    const h2 = vi.fn();
    emitter.on("a", h1);
    emitter.on("b", h2);
    emitter.removeAllListeners();
    emitter.emit("a");
    emitter.emit("b");
    expect(h1).not.toHaveBeenCalled();
    expect(h2).not.toHaveBeenCalled();
  });

  it("listenerCount returns correct count", () => {
    const emitter = new EventEmitter();
    expect(emitter.listenerCount("test")).toBe(0);
    emitter.on("test", () => {});
    expect(emitter.listenerCount("test")).toBe(1);
    emitter.on("test", () => {});
    expect(emitter.listenerCount("test")).toBe(2);
  });
});
