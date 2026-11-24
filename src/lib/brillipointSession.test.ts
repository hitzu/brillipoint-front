// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { hasBrillipointSession } from "./brillipointSession";

describe("hasBrillipointSession", () => {
  afterEach(() => localStorage.clear());

  it("is true when the browser holds a staff authToken", () => {
    localStorage.setItem("authToken", "jwt");
    expect(hasBrillipointSession()).toBe(true);
  });

  it("is false without authToken", () => {
    expect(hasBrillipointSession()).toBe(false);
  });

  it("is false when localStorage throws", () => {
    const original = Object.getOwnPropertyDescriptor(window, "localStorage")!;
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get: () => {
        throw new Error("blocked");
      },
    });
    try {
      expect(hasBrillipointSession()).toBe(false);
    } finally {
      Object.defineProperty(window, "localStorage", original);
    }
  });
});
