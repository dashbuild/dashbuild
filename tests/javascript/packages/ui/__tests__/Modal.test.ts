import { describe, it, expect, vi } from "vitest";
import { Modal, isModalOpen } from "../src/components/Modal";

describe("Modal", () => {
  it("returns null when not open", () => {
    const result = Modal({ title: "Test", isOpen: false, onClose: () => {} });
    expect(result).toBeNull();
  });

  it("returns modal descriptor when open", () => {
    const onClose = vi.fn();
    const result = Modal({ title: "Confirm", isOpen: true, onClose });
    expect(result).not.toBeNull();
    expect(result!.type).toBe("div");
    expect(result!.className).toBe("modal-overlay");
    expect(result!.title).toBe("Confirm");
  });

  it("passes onClose handler", () => {
    const onClose = vi.fn();
    const result = Modal({ title: "Test", isOpen: true, onClose });
    expect(result!.onClose).toBe(onClose);
  });
});

describe("isModalOpen", () => {
  it("returns true for open modal", () => {
    const modal = Modal({ title: "X", isOpen: true, onClose: () => {} });
    expect(isModalOpen(modal)).toBe(true);
  });

  it("returns false for closed modal", () => {
    const modal = Modal({ title: "X", isOpen: false, onClose: () => {} });
    expect(isModalOpen(modal)).toBe(false);
  });
});
