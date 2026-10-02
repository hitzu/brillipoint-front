import React, {
  ComponentType,
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/router";
import { DEFAULT_LOCALE, Locale, ThemeI18nLookup } from "../theme/resolveThemeText";
import type { TranslateParams } from "../theme/translate";
import { readStoredLocale, writeStoredLocale, LocaleStorage } from "./localeStorage";
import { resolveLocale } from "./resolveLocale";
import {
  createThemeI18nLookup,
  formatDate as formatDateFor,
  t as translateFor,
  tPlural as translatePluralFor,
} from "./translate";
import type { PluralKey, TranslationKey } from "./types";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

/** Outside a provider: default locale, and switching is a no-op (no crash). */
const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => undefined,
});

/** `window.localStorage` itself can throw when site data is blocked. */
const getBrowserStorage = (): LocaleStorage | null => {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
};

const getQueryValue = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

/** `?lang` from the parsed query, or from `asPath` before the router is ready. */
const readLangQuery = (query: Record<string, string | string[] | undefined>, asPath: string) => {
  const fromQuery = getQueryValue(query.lang);
  if (fromQuery) return fromQuery;
  const search = asPath.split("?")[1]?.split("#")[0];
  return search ? new URLSearchParams(search).get("lang") : null;
};

const applyDocumentLang = (locale: Locale) => {
  if (typeof document !== "undefined") {
    document.documentElement.lang = locale;
  }
};

interface LocaleProviderProps {
  children: ReactNode;
  /**
   * Pins the locale (e.g. an admin preview driven by its own toggle). When
   * set, nothing is read from the URL, storage or browser, the choice is not
   * persisted, and `<html lang>` is left untouched.
   */
  locale?: Locale;
}

/**
 * Provides the guest's language to the public party pages. The first render
 * always uses `DEFAULT_LOCALE` so server and client markup match; after mount
 * the locale resolves from `?lang` → stored choice → `navigator.languages`.
 * With a fixed `locale` prop, that locale is used as-is.
 */
export function LocaleProvider({ children, locale }: LocaleProviderProps) {
  return locale ? (
    <FixedLocaleProvider locale={locale}>{children}</FixedLocaleProvider>
  ) : (
    <ResolvedLocaleProvider>{children}</ResolvedLocaleProvider>
  );
}

const noopSetLocale = () => undefined;

function FixedLocaleProvider({ children, locale }: { children: ReactNode; locale: Locale }) {
  const value = useMemo(() => ({ locale, setLocale: noopSetLocale }), [locale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

function ResolvedLocaleProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const langQuery = readLangQuery(router.query, router.asPath);

  useEffect(() => {
    setLocaleState(
      resolveLocale({
        query: langQuery,
        stored: readStoredLocale(getBrowserStorage()),
        browserLanguages: typeof navigator === "undefined" ? [] : navigator.languages,
      }),
    );
  }, [langQuery]);

  useEffect(() => {
    applyDocumentLang(locale);
  }, [locale]);

  const setLocale = useCallback(
    (next: Locale) => {
      writeStoredLocale(getBrowserStorage(), next);
      setLocaleState(next);
      // `?lang` outranks the stored choice, so drop it once the guest picks a
      // language; otherwise a reload would undo their choice.
      if (langQuery) {
        const { lang: _lang, ...query } = router.query;
        router.replace({ pathname: router.pathname, query }, undefined, {
          shallow: true,
          scroll: false,
        });
      }
    },
    [langQuery, router],
  );

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/** Wraps a page component so it and its hooks read the guest's locale. */
export function withLocaleProvider<P extends object>(Page: ComponentType<P>) {
  const WithLocaleProvider = (props: P) => (
    <LocaleProvider>
      <Page {...props} />
    </LocaleProvider>
  );
  WithLocaleProvider.displayName = `withLocaleProvider(${Page.displayName || Page.name || "Page"})`;
  return WithLocaleProvider;
}

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext);
}

export interface Translator {
  locale: Locale;
  t: (key: TranslationKey, params?: TranslateParams) => string;
  tPlural: (key: PluralKey, count: number, params?: TranslateParams) => string;
  formatDate: (date: Date, options: Intl.DateTimeFormatOptions) => string;
  /** The dictionary as the theme's `ThemeI18nLookup` for `{ key }` texts. */
  themeI18n: ThemeI18nLookup;
}

/** Translation helpers bound to the current locale (stable per locale). */
export function useT(): Translator {
  const { locale } = useLocale();
  return useMemo(
    () => ({
      locale,
      t: (key, params) => translateFor(locale, key, params),
      tPlural: (key, count, params) => translatePluralFor(locale, key, count, params),
      formatDate: (date, options) => formatDateFor(locale, date, options),
      themeI18n: createThemeI18nLookup(locale),
    }),
    [locale],
  );
}
