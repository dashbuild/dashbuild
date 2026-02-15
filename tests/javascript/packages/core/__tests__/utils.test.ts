import { describe, it, expect } from "vitest";
import { validate, sanitize, slugify, clamp, deepClone } from "../src/utils";

describe("validate", () => {
  it("returns false for null", () => {
    expect(validate(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(validate(undefined)).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(validate("")).toBe(false);
    expect(validate("   ")).toBe(false);
  });

  it("returns true for non-empty values", () => {
    expect(validate("hello")).toBe(true);
    expect(validate(0)).toBe(true);
    expect(validate(false)).toBe(true);
    expect(validate([])).toBe(true);
  });
});

describe("sanitize", () => {
  it("escapes HTML special characters", () => {
    expect(sanitize("<script>alert('xss')</script>")).toBe(
      "&lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt;",
    );
  });

  it("escapes ampersands", () => {
    expect(sanitize("a & b")).toBe("a &amp; b");
  });

  it("escapes quotes", () => {
    expect(sanitize('"hello"')).toBe("&quot;hello&quot;");
  });

  it("returns plain text unchanged", () => {
    expect(sanitize("hello world")).toBe("hello world");
  });
});

describe("slugify", () => {
  it("converts to lowercase kebab-case", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("strips special characters", () => {
    expect(slugify("Hello, World! #2024")).toBe("hello-world-2024");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("--hello--")).toBe("hello");
  });
});

describe("clamp", () => {
  it("returns value when within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("clamps to min", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it("clamps to max", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe("deepClone", () => {
  it("creates a deep copy of an object", () => {
    const original = { a: 1, b: { c: 2 } };
    const clone = deepClone(original);
    expect(clone).toEqual(original);
    expect(clone).not.toBe(original);
    expect(clone.b).not.toBe(original.b);
  });

  it("clones arrays", () => {
    const original = [1, [2, 3]];
    const clone = deepClone(original);
    expect(clone).toEqual(original);
    expect(clone).not.toBe(original);
  });
});
