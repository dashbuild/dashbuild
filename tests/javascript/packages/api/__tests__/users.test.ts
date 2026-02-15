import { describe, it, expect } from "vitest";
import { usersRouter } from "../src/routes/users";

describe("usersRouter", () => {
  it("starts with empty user list", () => {
    const router = usersRouter();
    expect(router.listUsers()).toEqual([]);
  });

  it("creates a user with an id", () => {
    const router = usersRouter();
    const user = router.createUser({
      name: "Alice",
      email: "alice@example.com",
      role: "admin",
    });
    expect(user.id).toBeTypeOf("string");
    expect(user.name).toBe("Alice");
    expect(user.email).toBe("alice@example.com");
    expect(user.role).toBe("admin");
  });

  it("retrieves a created user by id", () => {
    const router = usersRouter();
    const created = router.createUser({
      name: "Bob",
      email: "bob@example.com",
      role: "user",
    });
    const found = router.getUser(created.id);
    expect(found).toEqual(created);
  });

  it("returns undefined for unknown id", () => {
    const router = usersRouter();
    expect(router.getUser("nonexistent")).toBeUndefined();
  });

  it("lists all created users", () => {
    const router = usersRouter();
    router.createUser({ name: "A", email: "a@x.com", role: "user" });
    router.createUser({ name: "B", email: "b@x.com", role: "guest" });
    expect(router.listUsers()).toHaveLength(2);
  });

  it("deletes a user", () => {
    const router = usersRouter();
    const user = router.createUser({
      name: "Del",
      email: "del@x.com",
      role: "user",
    });
    expect(router.deleteUser(user.id)).toBe(true);
    expect(router.getUser(user.id)).toBeUndefined();
  });

  it("returns false when deleting nonexistent user", () => {
    const router = usersRouter();
    expect(router.deleteUser("nope")).toBe(false);
  });
});
