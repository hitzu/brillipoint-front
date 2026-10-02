import type {
  LocalizedText,
  SocialCta,
  SocialCtaPrimaryAction,
  SocialCtaSocials,
  ThemeText,
} from "../../party/types/themeContract";

export type SocialNetwork = keyof Required<SocialCtaSocials>;

/** Locale edited (and later previewed) in the editor. */
export type SocialCtaLocale = keyof Required<LocalizedText>;

export const SOCIAL_NETWORKS: SocialNetwork[] = [
  "whatsapp",
  "instagram",
  "tiktok",
  "facebook",
  "url",
];

/** Staff-facing (Spanish) name of each network. */
export const SOCIAL_NETWORK_LABELS: Record<SocialNetwork, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  url: "Sitio web",
};

export interface SocialNetworkField {
  enabled: boolean;
  value: string;
}

/**
 * Editable shape of the `socialCta` block. Texts are kept per locale so the
 * editor can switch the edited locale without losing the other one; the CTA
 * only stores its channel, its url/phone is derived from that network.
 */
export interface SocialCtaFormState {
  socials: Record<SocialNetwork, SocialNetworkField>;
  headline: LocalizedText;
  subtitle: LocalizedText;
  followText: LocalizedText;
  primaryAction: {
    channel: SocialNetwork | null;
    label: LocalizedText;
    message: LocalizedText;
  };
}

export const emptySocialCtaForm = (): SocialCtaFormState => ({
  socials: {
    whatsapp: { enabled: false, value: "" },
    instagram: { enabled: false, value: "" },
    tiktok: { enabled: false, value: "" },
    facebook: { enabled: false, value: "" },
    url: { enabled: false, value: "" },
  },
  headline: {},
  subtitle: {},
  followText: {},
  primaryAction: { channel: null, label: {}, message: {} },
});

const HAS_SCHEME = /^https?:\/\//i;

const PROFILE_BASE: Record<"instagram" | "tiktok" | "facebook", { domain: string; base: string }> = {
  instagram: { domain: "instagram.com", base: "https://instagram.com/" },
  tiktok: { domain: "tiktok.com", base: "https://www.tiktok.com/@" },
  facebook: { domain: "facebook.com", base: "https://facebook.com/" },
};

const whatsappDigits = (raw: string): string | null => {
  const waLink = raw.match(/wa\.me\/(\d+)/i);
  const digits = waLink ? waLink[1] : raw.replace(/\D/g, "");
  return digits || null;
};

/**
 * Turns what staff typed (`@user`, `user`, `lusso.mx`, `+52 55 ...`) into the
 * full href the public `SocialCta` renders as-is. Returns `null` when nothing
 * usable was typed.
 */
export function normalizeSocialValue(network: SocialNetwork, input: string): string | null {
  const value = input.trim();
  if (!value) return null;

  if (network === "whatsapp") {
    const digits = whatsappDigits(value);
    return digits ? `https://wa.me/${digits}` : null;
  }

  // The backend only accepts https links.
  if (HAS_SCHEME.test(value)) return value.replace(/^http:\/\//i, "https://");

  if (network === "url") return `https://${value}`;

  const { domain, base } = PROFILE_BASE[network];
  if (value.toLowerCase().includes(domain)) return `https://${value}`;

  const handle = value.replace(/^@+/, "").trim();
  return handle ? `${base}${handle}` : null;
}

const toThemeText = (localized: LocalizedText): ThemeText | undefined => {
  const text: LocalizedText = {};
  const es = localized.es?.trim();
  const en = localized.en?.trim();
  if (es) text.es = es;
  if (en) text.en = en;
  return text.es || text.en ? { text } : undefined;
};

const fromThemeText = (themeText: ThemeText | undefined): LocalizedText =>
  themeText && "text" in themeText ? { ...themeText.text } : {};

const buildPrimaryAction = (
  form: SocialCtaFormState,
  socials: SocialCtaSocials,
): SocialCtaPrimaryAction | null => {
  const { channel } = form.primaryAction;
  const label = toThemeText(form.primaryAction.label);
  const href = channel ? socials[channel] : undefined;
  if (!channel || !label || !href) return null;

  if (channel === "whatsapp") {
    const message = toThemeText(form.primaryAction.message);
    return {
      channel,
      label,
      phone: whatsappDigits(href) as string,
      ...(message ? { message } : {}),
    };
  }

  return { channel, label, url: href };
};

/** Builds the `socialCta` override from the editor form. */
export function formToSocialCta(form: SocialCtaFormState): SocialCta {
  const socials: SocialCtaSocials = {};
  for (const network of SOCIAL_NETWORKS) {
    const field = form.socials[network];
    const href = field.enabled ? normalizeSocialValue(network, field.value) : null;
    if (href) socials[network] = href;
  }

  const result: SocialCta = {};
  const headline = toThemeText(form.headline);
  const subtitle = toThemeText(form.subtitle);
  const followText = toThemeText(form.followText);
  if (headline) result.headline = headline;
  if (subtitle) result.subtitle = subtitle;
  if (followText) result.followText = followText;
  result.primaryAction = buildPrimaryAction(form, socials);
  if (Object.keys(socials).length > 0) result.socials = socials;

  return result;
}

/**
 * Builds the editor form from an existing `socialCta`. Key-based (i18n)
 * texts cannot be edited as plain text, so they start empty.
 */
export function socialCtaToForm(socialCta: SocialCta | null | undefined): SocialCtaFormState {
  const form = emptySocialCtaForm();
  if (!socialCta) return form;

  for (const network of SOCIAL_NETWORKS) {
    const href = socialCta.socials?.[network];
    if (href) form.socials[network] = { enabled: true, value: href };
  }

  form.headline = fromThemeText(socialCta.headline);
  form.subtitle = fromThemeText(socialCta.subtitle);
  form.followText = fromThemeText(socialCta.followText);

  const action = socialCta.primaryAction;
  if (action) {
    if (!form.socials[action.channel].enabled) {
      const value = action.channel === "whatsapp" ? action.phone : action.url;
      form.socials[action.channel] = { enabled: true, value };
    }
    form.primaryAction = {
      channel: action.channel,
      label: fromThemeText(action.label),
      message: action.channel === "whatsapp" ? fromThemeText(action.message) : {},
    };
  }

  return form;
}

/** Per-field Spanish messages; an empty `socials` map and no other key means valid. */
export interface SocialCtaFormErrors {
  socials: Partial<Record<SocialNetwork, string>>;
  primaryChannel?: string;
  primaryLabel?: string;
}

const WHATSAPP_DIGITS = /^\d{8,15}$/;

const hasText = (localized: LocalizedText): boolean =>
  Boolean(localized.es?.trim() || localized.en?.trim());

const socialValueError = (network: SocialNetwork, value: string): string | undefined => {
  if (network === "whatsapp") {
    if (!value.trim()) return "Escribe el número de WhatsApp.";
    const digits = whatsappDigits(value.trim()) ?? "";
    return WHATSAPP_DIGITS.test(digits)
      ? undefined
      : "El número de WhatsApp debe tener entre 8 y 15 dígitos.";
  }
  if (normalizeSocialValue(network, value)) return undefined;
  return network === "url"
    ? `Escribe el enlace de ${SOCIAL_NETWORK_LABELS[network]}.`
    : `Escribe el usuario o enlace de ${SOCIAL_NETWORK_LABELS[network]}.`;
};

/**
 * Mirrors the backend `socialCta` validation so staff see the problem inline
 * instead of a rejected save.
 */
export function validateSocialCtaForm(form: SocialCtaFormState): SocialCtaFormErrors {
  const errors: SocialCtaFormErrors = { socials: {} };

  for (const network of SOCIAL_NETWORKS) {
    const field = form.socials[network];
    if (!field.enabled) continue;
    const error = socialValueError(network, field.value);
    if (error) errors.socials[network] = error;
  }

  const { channel, label } = form.primaryAction;
  if (channel) {
    if (!form.socials[channel].enabled) {
      errors.primaryChannel = "El botón debe usar una red activa.";
    }
    if (!hasText(label)) {
      errors.primaryLabel = "Escribe el texto del botón en español o inglés.";
    }
  }

  return errors;
}

export const hasSocialCtaErrors = (errors: SocialCtaFormErrors): boolean =>
  Object.keys(errors.socials).length > 0 ||
  Boolean(errors.primaryChannel) ||
  Boolean(errors.primaryLabel);
