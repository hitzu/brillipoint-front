import { useEffect, useRef, useState } from "react";
import { getEventTheme } from "../../../../api/services/partyPublicService";
import type { EventTheme, SocialCta } from "../../../party/types/themeContract";
import { clearSocialCta, RawThemeOverrides, setSocialCta } from "../mergeThemeOverrides";
import {
  formToSocialCta,
  hasSocialCtaErrors,
  socialCtaToForm,
  SocialCtaFormErrors,
  SocialCtaFormState,
  SocialCtaLocale,
  validateSocialCtaForm,
} from "../socialCtaForm";

/** The event's own stored `socialCta` override, if any. */
export const storedSocialCtaFrom = (
  themeOverrides: RawThemeOverrides | null | undefined,
): SocialCta | null => {
  const socialCta = themeOverrides?.socialCta;
  return socialCta && typeof socialCta === "object" ? (socialCta as SocialCta) : null;
};

const NO_SOCIAL_CTA_ERRORS: SocialCtaFormErrors = { socials: {} };

interface UseSocialCtaEditorOptions {
  eventId: number;
  initialThemeOverrides: RawThemeOverrides | null | undefined;
  /** Public event token, used to fetch the resolved theme. */
  token?: string;
}

/**
 * State and rules of the event's `socialCta` editor. The override is written
 * only when staff edited it (dirty) or chose "Usar el heredado" (cleared).
 * The resolved theme is fetched once per event for the live preview; it only
 * prefills the form when the event has no stored override.
 */
export function useSocialCtaEditor({
  eventId,
  initialThemeOverrides,
  token,
}: UseSocialCtaEditorOptions) {
  const [form, setForm] = useState<SocialCtaFormState>(() =>
    socialCtaToForm(storedSocialCtaFrom(initialThemeOverrides)),
  );
  const [dirty, setDirty] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [inherited, setInherited] = useState(false);
  const [locale, setLocale] = useState<SocialCtaLocale>("es");
  const [eventTheme, setEventTheme] = useState<EventTheme | null>(null);
  const dirtyRef = useRef(false);
  dirtyRef.current = dirty;

  useEffect(() => {
    setForm(socialCtaToForm(storedSocialCtaFrom(initialThemeOverrides)));
    setDirty(false);
    setCleared(false);
    setInherited(false);
    setEventTheme(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const loadResolvedTheme = ({
    prefill,
    isCancelled = () => false,
  }: {
    prefill: boolean;
    isCancelled?: () => boolean;
  }) => {
    if (!token) return;
    getEventTheme(token, true)
      .then(({ eventTheme: resolved }) => {
        if (isCancelled()) return;
        setEventTheme(resolved ?? null);
        // Never overwrite a stored override or something staff already started editing.
        if (!prefill || dirtyRef.current || !resolved?.socialCta) return;
        setForm(socialCtaToForm(resolved.socialCta));
        setInherited(true);
      })
      .catch((error) => {
        // Non-blocking: staff can still author the block from an empty form.
        console.error("Error loading the resolved event theme:", error);
      });
  };

  useEffect(() => {
    let cancelled = false;
    loadResolvedTheme({
      prefill: !storedSocialCtaFrom(initialThemeOverrides),
      isCancelled: () => cancelled,
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, token]);

  const onChange = (next: SocialCtaFormState) => {
    setForm(next);
    setDirty(true);
    setCleared(false);
  };

  const onUseInherited = () => {
    setCleared(true);
    setDirty(false);
  };

  const errors = dirty ? validateSocialCtaForm(form) : NO_SOCIAL_CTA_ERRORS;
  const invalid = hasSocialCtaErrors(errors);

  /** Writes (or removes) the override on the freshly fetched overrides before saving. */
  const applyTo = (overrides: RawThemeOverrides): RawThemeOverrides => {
    if (dirty) return setSocialCta(overrides, formToSocialCta(form));
    if (cleared) return clearSocialCta(overrides);
    return overrides;
  };

  /** Re-syncs the editor with what was just saved. */
  const resetAfterSave = (saved: RawThemeOverrides) => {
    const savedSocialCta = storedSocialCtaFrom(saved);
    setForm(socialCtaToForm(savedSocialCta));
    setDirty(false);
    dirtyRef.current = false;
    setCleared(false);
    setInherited(false);
    if (!savedSocialCta) loadResolvedTheme({ prefill: true });
  };

  return {
    form,
    errors,
    invalid,
    locale,
    setLocale,
    inherited,
    cleared,
    eventTheme,
    onChange,
    onUseInherited,
    applyTo,
    resetAfterSave,
  };
}
