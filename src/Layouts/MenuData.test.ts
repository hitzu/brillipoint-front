import { describe, expect, it } from "vitest";
import { menuItems } from "./MenuData";

describe("menuItems", () => {
  it("gives every top-level group a unique id so groups open and close independently", () => {
    const ids = menuItems.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every submenu entry a unique id", () => {
    const ids = menuItems.flatMap((item) => item.submenu.map((sub) => sub.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("tags the agenda entry with its own data page", () => {
    const agenda = menuItems.find((item) => item.label === "Agenda")!.submenu[0];
    expect(agenda.dataPage).toBe("agenda");
  });

  it("links the brand manual from the Marca group", () => {
    const marca = menuItems.find((item) => item.label === "Marca");
    expect(marca?.submenu).toEqual([
      expect.objectContaining({ label: "Manual de marca", link: "/brand-manual" }),
    ]);
  });
});
