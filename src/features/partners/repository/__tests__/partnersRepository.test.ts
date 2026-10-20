import { describe, expect, it } from "vitest";
import { resolvePartnerLandingRoute } from "../partnersRepository";
import { PartnerConfig } from "../../types";
import { PARTNER_OCCASION_CONTENT } from "../../data/occasionContent";

const basePartner: PartnerConfig = {
  slug: "partner-demo",
  displayName: "Partner Demo",
  visibleName: "Partner Demo",
  organizerName: "Partner Demo",
  status: "active",
  defaultOccasion: "xv-anos",
  enabledOccasions: ["bodas", "xv-anos"],
};

describe("resolvePartnerLandingRoute", () => {
  it("redirects /con/{slug} to the configured default occasion", () => {
    const result = resolvePartnerLandingRoute("partner-demo", undefined, [basePartner]);

    expect(result).toEqual({
      state: "redirect",
      destination: "/con/partner-demo/xv-anos",
    });
  });

  it("resolves enabled occasions with organizer placeholders replaced", () => {
    const result = resolvePartnerLandingRoute("partner-demo", "bodas", [basePartner]);

    expect(result.state).toBe("ready");
    if (result.state !== "ready") return;
    expect(result.content.heroLead).toContain(basePartner.organizerName);
    expect(result.content.heroLead).not.toContain("{organizerName}");
  });

  it("returns not_found for unknown partners", () => {
    const result = resolvePartnerLandingRoute("missing", "bodas", [basePartner]);

    expect(result.state).toBe("not_found");
  });

  it("returns inactive before rendering an active experience", () => {
    const result = resolvePartnerLandingRoute("partner-demo", "bodas", [
      { ...basePartner, status: "inactive" },
    ]);

    expect(result.state).toBe("inactive");
  });

  it("returns occasion_unavailable for disabled occasions", () => {
    const result = resolvePartnerLandingRoute("partner-demo", "xv-anos", [
      { ...basePartner, enabledOccasions: ["bodas"], defaultOccasion: "bodas" },
    ]);

    expect(result.state).toBe("occasion_unavailable");
  });

  it("fails safely when the default occasion is not enabled", () => {
    const result = resolvePartnerLandingRoute("partner-demo", undefined, [
      { ...basePartner, defaultOccasion: "xv-anos", enabledOccasions: ["bodas"] },
    ]);

    expect(result.state).toBe("invalid_config");
  });

  it("fails safely when enabled content is missing", () => {
    const result = resolvePartnerLandingRoute("partner-demo", "bodas", [basePartner], {
      bodas: PARTNER_OCCASION_CONTENT.bodas,
    });

    expect(result.state).toBe("invalid_config");
  });
});
