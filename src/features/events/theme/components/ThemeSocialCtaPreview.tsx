import React, { CSSProperties } from "react";
import { SocialCta } from "../../../party/components/SocialCta";
import { LocaleProvider } from "../../../party/i18n/LocaleProvider";
import {
  buildSocialCtaViewModel,
  SocialCtaViewModel,
} from "../../../party/theme/buildSocialCtaViewModel";
import type { EventTheme } from "../../../party/types/themeContract";
import { buildThemeVars } from "../../../party/utils/themeVars";
import { tokensToEventPageTheme } from "../../../party/utils/tokensToEventPageTheme";
import { formToSocialCta, SocialCtaFormState, SocialCtaLocale } from "../socialCtaForm";
import styles from "./ThemeSocialCtaPreview.module.css";

interface ThemeSocialCtaPreviewProps {
  form: SocialCtaFormState;
  /** Locale toggled in the editor; missing English texts fall back to Spanish. */
  locale: SocialCtaLocale;
  /** Raw `event.honoreesNames`, interpolated as `{{honoreesName}}`. */
  honoreesNames?: string | null;
  /** Resolved theme for colors and params; `null`/absent renders with the component defaults. */
  eventTheme?: EventTheme | null;
}

const hasContent = (viewModel: SocialCtaViewModel | null): viewModel is SocialCtaViewModel => {
  if (!viewModel) return false;
  const { headline, subtitle, followText, primaryAction, socials } = viewModel;
  const secondarySocials = Object.entries(socials).filter(
    ([network, href]) => Boolean(href) && network !== primaryAction?.channel,
  );
  return Boolean(
    headline || subtitle || followText || primaryAction || secondarySocials.length > 0,
  );
};

const themeStyle = (eventTheme: EventTheme | null | undefined): CSSProperties | undefined =>
  eventTheme?.tokens
    ? buildThemeVars(tokensToEventPageTheme(eventTheme.tokens, eventTheme.images))
    : undefined;

/**
 * Live preview of the event's social CTA, rendered with the same public
 * `SocialCta` (page variant) and theme variables guests see.
 */
const ThemeSocialCtaPreview = ({
  form,
  locale,
  honoreesNames,
  eventTheme,
}: ThemeSocialCtaPreviewProps) => {
  // The event's own honorees win over the resolved `honoreesName` param.
  const honoreesName = honoreesNames?.trim();
  const params = { ...eventTheme?.params, ...(honoreesName ? { honoreesName } : {}) };
  const viewModel = buildSocialCtaViewModel(formToSocialCta(form), locale, params);

  return (
    <section className={styles.preview} aria-label="Vista previa de redes sociales y CTA">
      <div className={styles.header}>
        <span className={styles.title}>Vista previa</span>
        <span className={styles.localeBadge}>{locale.toUpperCase()}</span>
      </div>

      <div
        className={styles.surface}
        style={themeStyle(eventTheme)}
        data-testid="social-cta-preview-surface"
      >
        {hasContent(viewModel) ? (
          // Pins the component's own labels (e.g. "Website") to the editor locale.
          <LocaleProvider locale={locale}>
            <SocialCta variant="page" viewModel={viewModel} />
          </LocaleProvider>
        ) : (
          <p className={styles.empty}>Agrega una red o un texto para ver la vista previa</p>
        )}
      </div>

      <p className={styles.hint}>Los enlaces se abren en una pestaña nueva.</p>
    </section>
  );
};

export default ThemeSocialCtaPreview;
