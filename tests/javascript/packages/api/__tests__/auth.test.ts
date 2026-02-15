import { describe, it, expect } from "vitest";
import { authRouter } from "../src/routes/auth";

describe("authRouter", () => {
  const auth = authRouter();

  describe("login", () => {
    it("returns a token on valid credentials", async () => {
      const result = await auth.login({
        username: "admin",
        password: "secret",
      });
      expect(result.token).toBeTypeOf("string");
      expect(result.token.length).toBeGreaterThan(0);
      expect(result.expiresIn).toBe(3600);
    });

    it("throws on missing username", async () => {
      await expect(
        auth.login({ username: "", password: "secret" }),
      ).rejects.toThrow("Username and password are required");
    });

    it("throws on missing password", async () => {
      await expect(
        auth.login({ username: "admin", password: "" }),
      ).rejects.toThrow("Username and password are required");
    });
  });

  describe("verify", () => {
    it("returns true for non-empty token", async () => {
      expect(await auth.verify("some-token")).toBe(true);
    });

    it("returns false for empty token", async () => {
      expect(await auth.verify("")).toBe(false);
    });
  });

  describe("logout", () => {
    it("does not throw", async () => {
      await expect(auth.logout("some-token")).resolves.toBeUndefined();
    });
  });
});
