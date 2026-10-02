import { describe, expect, it } from "vitest";
import type { SocialCta } from "../../../party/types/themeContract";
import {
  emptySocialCtaForm,
  formToSocialCta,
  hasSocialCtaErrors,
  normalizeSocialValue,
  socialCtaToForm,
  SocialCtaFormState,
  validateSocialCtaForm,
} from "../socialCtaForm";

const withNetworks = (
  networks: Partial<Record<keyof SocialCtaFormState["socials"], string>>,
): SocialCtaFormState => {
  const form = emptySocialCtaForm();
  for (const [network, value] of Object.entries(networks)) {
    form.socials[network as keyof SocialCtaFormState["socials"]] = {
      enabled: true,
      value: value as string,
    };
  }
  return form;
};

describe("normalizeSocialValue", () => {
  it.each([
    ["instagram", "@lusso.mx", "https://instagram.com/lusso.mx"],
    ["instagram", "lusso.mx", "https://instagram.com/lusso.mx"],
    ["instagram", "https://www.instagram.com/lusso.mx/", "https://www.instagram.com/lusso.mx/"],
    ["tiktok", "@lusso", "https://www.tiktok.com/@lusso"],
    ["tiktok", "lusso", "https://www.tiktok.com/@lusso"],
    ["facebook", "lussomx", "https://facebook.com/lussomx"],
    ["url", "lusso.mx", "https://lusso.mx"],
    ["url", "http://lusso.mx/landing", "https://lusso.mx/landing"],
    ["instagram", "HTTP://instagram.com/lusso", "https://instagram.com/lusso"],
    ["whatsapp", "+52 55 1234 5678", "https://wa.me/525512345678"],
    ["whatsapp", "https://wa.me/525512345678", "https://wa.me/525512345678"],
  ] as const)("%s %s → %s", (network, input, expected) => {
    expect(normalizeSocialValue(network, input)).toBe(expected);
  });

  it("returns null for blank input", () => {
    expect(normalizeSocialValue("instagram", "   ")).toBeNull();
    expect(normalizeSocialValue("whatsapp", "@ ")).toBeNull();
  });
});

describe("formToSocialCta", () => {
  it("omits disabled networks and networks with empty values", () => {
    const form = withNetworks({ instagram: "@lusso", tiktok: "" });
    form.socials.facebook = { enabled: false, value: "lussomx" };

    expect(formToSocialCta(form).socials).toEqual({
      instagram: "https://instagram.com/lusso",
    });
  });

  it("maps localized texts, trimming and omitting empty locales and fields", () => {
    const form = emptySocialCtaForm();
    form.headline = { es: "  ¡Gracias!  ", en: "" };
    form.subtitle = { es: "", en: "" };
    form.followText = { es: "Síguenos", en: "Follow us" };

    const result = formToSocialCta(form);

    expect(result.headline).toEqual({ text: { es: "¡Gracias!" } });
    expect(result).not.toHaveProperty("subtitle");
    expect(result.followText).toEqual({ text: { es: "Síguenos", en: "Follow us" } });
  });

  it("derives a link primary action url from the selected active network", () => {
    const form = withNetworks({ url: "lusso.mx", instagram: "@lusso" });
    form.primaryAction = { channel: "url", label: { es: "Visítanos" }, message: {} };

    expect(formToSocialCta(form).primaryAction).toEqual({
      channel: "url",
      label: { text: { es: "Visítanos" } },
      url: "https://lusso.mx",
    });
  });

  it("derives a whatsapp primary action phone (digits) and optional message", () => {
    const form = withNetworks({ whatsapp: "+52 55 1234 5678" });
    form.primaryAction = {
      channel: "whatsapp",
      label: { es: "Escríbenos" },
      message: { es: "Hola, vi las fotos de {{honoreesName}}" },
    };

    expect(formToSocialCta(form).primaryAction).toEqual({
      channel: "whatsapp",
      label: { text: { es: "Escríbenos" } },
      phone: "525512345678",
      message: { text: { es: "Hola, vi las fotos de {{honoreesName}}" } },
    });
  });

  it("sets primaryAction to null when the channel is missing, inactive or unlabeled", () => {
    const noChannel = withNetworks({ instagram: "@lusso" });
    noChannel.primaryAction = { channel: null, label: { es: "Ver" }, message: {} };

    const inactive = withNetworks({ instagram: "@lusso" });
    inactive.primaryAction = { channel: "tiktok", label: { es: "Ver" }, message: {} };

    const unlabeled = withNetworks({ instagram: "@lusso" });
    unlabeled.primaryAction = { channel: "instagram", label: { es: " " }, message: {} };

    expect(formToSocialCta(noChannel).primaryAction).toBeNull();
    expect(formToSocialCta(inactive).primaryAction).toBeNull();
    expect(formToSocialCta(unlabeled).primaryAction).toBeNull();
  });
});

describe("socialCtaToForm", () => {
  it("returns an empty form for null/undefined", () => {
    expect(socialCtaToForm(null)).toEqual(emptySocialCtaForm());
    expect(socialCtaToForm(undefined)).toEqual(emptySocialCtaForm());
  });

  it("round-trips a text-based socialCta", () => {
    const socialCta: SocialCta = {
      headline: { text: { es: "¡Gracias!", en: "Thanks!" } },
      followText: { text: { es: "Síguenos" } },
      primaryAction: {
        channel: "whatsapp",
        label: { text: { es: "Escríbenos" } },
        phone: "525512345678",
        message: { text: { es: "Hola" } },
      },
      socials: {
        whatsapp: "https://wa.me/525512345678",
        instagram: "https://instagram.com/lusso",
      },
    };

    const form = socialCtaToForm(socialCta);

    expect(form.socials.instagram).toEqual({
      enabled: true,
      value: "https://instagram.com/lusso",
    });
    expect(form.socials.tiktok).toEqual({ enabled: false, value: "" });
    expect(form.primaryAction.channel).toBe("whatsapp");
    expect(formToSocialCta(form)).toEqual(socialCta);
  });

  it("enables the primary action network when it is missing from socials", () => {
    const form = socialCtaToForm({
      primaryAction: {
        channel: "url",
        label: { text: { es: "Visítanos" } },
        url: "https://lusso.mx",
      },
    });

    expect(form.socials.url).toEqual({ enabled: true, value: "https://lusso.mx" });
    expect(form.primaryAction.channel).toBe("url");
  });

  it("leaves key-based (i18n) texts empty", () => {
    const form = socialCtaToForm({ headline: { key: "party.cta.headline" } });

    expect(form.headline).toEqual({});
  });
});

describe("validateSocialCtaForm", () => {
  it("returns no errors for an empty form", () => {
    const errors = validateSocialCtaForm(emptySocialCtaForm());

    expect(errors).toEqual({ socials: {} });
    expect(hasSocialCtaErrors(errors)).toBe(false);
  });

  it("flags enabled networks without a usable value", () => {
    const form = withNetworks({ instagram: "  ", url: "", whatsapp: "" });

    const errors = validateSocialCtaForm(form);

    expect(errors.socials.instagram).toBe("Escribe el usuario o enlace de Instagram.");
    expect(errors.socials.url).toBe("Escribe el enlace de Sitio web.");
    expect(errors.socials.whatsapp).toBe("Escribe el número de WhatsApp.");
    expect(hasSocialCtaErrors(errors)).toBe(true);
  });

  it("ignores disabled networks", () => {
    const form = emptySocialCtaForm();
    form.socials.tiktok = { enabled: false, value: "" };

    expect(hasSocialCtaErrors(validateSocialCtaForm(form))).toBe(false);
  });

  it.each([
    ["1234567", true],
    ["12345678", false],
    ["+52 55 1234 5678", false],
    ["123456789012345", false],
    ["1234567890123456", true],
  ])("whatsapp %s → error %s", (value, hasError) => {
    const errors = validateSocialCtaForm(withNetworks({ whatsapp: value }));

    expect(Boolean(errors.socials.whatsapp)).toBe(hasError);
    if (hasError) {
      expect(errors.socials.whatsapp).toBe(
        "El número de WhatsApp debe tener entre 8 y 15 dígitos.",
      );
    }
  });

  it("requires an ES or EN label when a CTA channel is chosen", () => {
    const form = withNetworks({ instagram: "@lusso" });
    form.primaryAction = { channel: "instagram", label: { es: " ", en: "" }, message: {} };

    expect(validateSocialCtaForm(form).primaryLabel).toBe(
      "Escribe el texto del botón en español o inglés.",
    );

    form.primaryAction.label = { en: "Follow" };
    expect(validateSocialCtaForm(form).primaryLabel).toBeUndefined();
  });

  it("requires the CTA channel to be an enabled network", () => {
    const form = withNetworks({ instagram: "@lusso" });
    form.primaryAction = { channel: "tiktok", label: { es: "Ver" }, message: {} };

    expect(validateSocialCtaForm(form).primaryChannel).toBe(
      "El botón debe usar una red activa.",
    );
  });

  it("does not require a label when there is no CTA", () => {
    const form = withNetworks({ instagram: "@lusso" });

    const errors = validateSocialCtaForm(form);

    expect(errors.primaryLabel).toBeUndefined();
    expect(errors.primaryChannel).toBeUndefined();
  });
});
