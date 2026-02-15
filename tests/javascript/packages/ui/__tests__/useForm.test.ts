import { describe, it, expect } from "vitest";
import { useForm } from "../src/hooks/useForm";

describe("useForm", () => {
  it("initializes with given values", () => {
    const form = useForm({ name: "", email: "" });
    expect(form.getValues()).toEqual({ name: "", email: "" });
  });

  it("sets individual values", () => {
    const form = useForm({ name: "", age: 0 });
    form.setValue("name", "Alice");
    form.setValue("age", 30);
    expect(form.getValues()).toEqual({ name: "Alice", age: 30 });
  });

  it("getValues returns a copy", () => {
    const form = useForm({ x: 1 });
    const v1 = form.getValues();
    const v2 = form.getValues();
    expect(v1).toEqual(v2);
    expect(v1).not.toBe(v2);
  });

  it("sets and clears errors", () => {
    const form = useForm({ email: "" });
    form.setError("email", "Required");
    expect(form.getErrors()).toEqual({ email: "Required" });
    expect(form.hasErrors()).toBe(true);
    form.clearErrors();
    expect(form.getErrors()).toEqual({});
    expect(form.hasErrors()).toBe(false);
  });

  it("submits with current values", async () => {
    const form = useForm({ name: "Bob" });
    let submitted: Record<string, unknown> | null = null;
    await form.submit(async (values) => {
      submitted = values;
    });
    expect(submitted).toEqual({ name: "Bob" });
  });
});
