import { describe, expect, it, vi } from "vitest";
import { menuItems } from "../../../Layouts/MenuData";

vi.mock("@layout/NonLayout", () => ({ default: () => null }));
vi.mock("./ExpoBebePage", () => ({ ExpoBebePage: () => null }));

import Expo from "../../../pages/expo";
import LegacyExpo from "../../../pages/expo-bebe";

describe("Expo navigation", () => {
  it("keeps the legacy route as the same page and layout", () => {
    expect(LegacyExpo).toBe(Expo);
    expect(LegacyExpo.getLayout).toBe(Expo.getLayout);
  });

  it("defaults all three branded links to the general Expo without animals or photo buttons", () => {
    const entries = menuItems.find((item) => item.label === "Expos")!.submenu!;
    expect(entries).toHaveLength(3);
    const brands = ["3", "4", "1"];
    entries.forEach((entry, index) => {
      const url = new URL(entry.link, "https://example.test");
      expect(url.pathname).toBe("/expo");
      expect(url.searchParams.get("hideIcons")).toBe("1");
      expect(url.searchParams.get("hidePhotos")).toBe("1");
      expect(
        url.searchParams.get("brandId") ?? url.searchParams.get("brand")
      ).toBe(brands[index]);
      expect(entry.label).not.toMatch(/beb[eé]/i);
      expect(entry.dataPage).toBe("expo");
    });
  });
});
