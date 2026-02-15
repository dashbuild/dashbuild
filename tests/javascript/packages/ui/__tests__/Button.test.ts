import { describe, it, expect } from "vitest";
import { Button, IconButton } from "../src/components/Button";

describe("Button", () => {
  it("creates a button with default variant", () => {
    const btn = Button({ label: "Click me" });
    expect(btn.type).toBe("button");
    expect(btn.className).toBe("btn btn-primary");
    expect(btn.label).toBe("Click me");
    expect(btn.disabled).toBe(false);
  });

  it("applies secondary variant", () => {
    const btn = Button({ label: "Cancel", variant: "secondary" });
    expect(btn.className).toBe("btn btn-secondary");
  });

  it("applies danger variant", () => {
    const btn = Button({ label: "Delete", variant: "danger" });
    expect(btn.className).toBe("btn btn-danger");
  });

  it("passes disabled state", () => {
    const btn = Button({ label: "Disabled", disabled: true });
    expect(btn.disabled).toBe(true);
  });

  it("passes onClick handler", () => {
    const handler = () => {};
    const btn = Button({ label: "Go", onClick: handler });
    expect(btn.onClick).toBe(handler);
  });
});

describe("IconButton", () => {
  it("creates an icon button", () => {
    const btn = IconButton({ icon: "★", label: "Star" });
    expect(btn.type).toBe("button");
    expect(btn.className).toBe("btn-icon");
    expect(btn.ariaLabel).toBe("Star");
    expect(btn.icon).toBe("★");
  });
});
