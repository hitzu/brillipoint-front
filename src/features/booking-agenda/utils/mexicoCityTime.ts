const pad = (value: number) => String(value).padStart(2, "0");

/** Converts an API instant into the civil datetime shown to Mexico City staff. */
export const toMexicoCityDateTimeInput = (
  value: string | null | undefined,
  fallback: string
): string => {
  if (!value) return `${fallback}T12:00`;
  const date = new Date(Date.parse(value) - 6 * 60 * 60 * 1000);
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/** Interprets datetime-local values as America/Mexico_City civil time. */
export const fromMexicoCityDateTimeInput = (value: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return "";
  const [, year, month, day, hour, minute] = match;
  return new Date(
    Date.UTC(+year, +month - 1, +day, +hour + 6, +minute)
  ).toISOString();
};
