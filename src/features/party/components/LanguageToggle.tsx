import React from "react";
import { useLocale, useT } from "../i18n/LocaleProvider";
import { SUPPORTED_LOCALES } from "../i18n/resolveLocale";
import type { Locale } from "../theme/resolveThemeText";
import styles from "./LanguageToggle.module.css";

/** Language names stay in their own language so each guest recognizes theirs. */
const LANGUAGE_NAMES: Record<Locale, string> = { es: "Español", en: "English" };

type LanguageToggleProps = {
  /** `inline` sits in a header row; `floating` pins to the top-right corner. */
  variant: "inline" | "floating";
  className?: string;
};

/** "ES · EN" text pill that switches the party pages' language. */
const LanguageToggle = ({ variant, className }: LanguageToggleProps) => {
  const { locale, setLocale } = useLocale();
  const { t } = useT();
  const rootClassName = [
    styles.toggle,
    variant === "floating" ? styles.floating : undefined,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div role="group" aria-label={t("common.languageToggle")} className={rootClassName}>
      {SUPPORTED_LOCALES.map((option, index) => (
        <React.Fragment key={option}>
          {index > 0 && (
            <span className={styles.separator} aria-hidden="true">
              ·
            </span>
          )}
          <button
            type="button"
            lang={option}
            className={styles.option}
            aria-pressed={option === locale}
            aria-label={LANGUAGE_NAMES[option]}
            onClick={() => setLocale(option)}
          >
            {option.toUpperCase()}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};

export default LanguageToggle;
