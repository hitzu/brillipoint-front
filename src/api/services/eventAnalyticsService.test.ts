// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const post = vi.fn().mockResolvedValue({});
vi.mock("../config/axiosConfig", () => ({
  axiosInstanceWithoutToken: { post: (...a: unknown[]) => post(...a) },
}));

import { trackEvent } from "./eventAnalyticsService";

describe("trackEvent", () => {
  beforeEach(() => post.mockClear());
  afterEach(() => localStorage.clear());

  it("sends the event when the browser has no Brillipoint session", async () => {
    await trackEvent("gallery_opened" as never, "evt-1");
    expect(post).toHaveBeenCalledTimes(1);
  });

  it("sends nothing when the browser has a Brillipoint session", async () => {
    localStorage.setItem("authToken", "jwt");
    await trackEvent("gallery_opened" as never, "evt-1");
    expect(post).not.toHaveBeenCalled();
  });
});
