/**
 * Interpolates `{{key}}` placeholders in a template string with values
 * from `params`. A missing or nullish param renders as an empty string;
 * numbers are stringified. Whitespace inside the braces (`{{ key }}`) is
 * tolerated.
 */
export type TranslateParams = Record<string, string | number | null | undefined>;

const PLACEHOLDER = /\{\{\s*(\w+)\s*\}\}/g;

export function translate(template: string, params: TranslateParams = {}): string {
  return template.replace(PLACEHOLDER, (_m, key: string) => {
    const v = params[key];
    return v === null || v === undefined ? "" : String(v);
  });
}
