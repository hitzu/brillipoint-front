import { AxiosError } from "axios";

/**
 * Reads the conflicting-booking message off an Axios error raised by
 * `POST /bookings`, when the API rejects the request as a 409 overlap.
 *
 * ASSUMPTION — UNVERIFIED AGAINST A LIVE API: the backend overlap guard
 * (`HANDOFF-backend-overlap-guard.md`) had not shipped when this was written.
 * It only promises that the 409 body names the conflicting booking's id,
 * range and title — not their field names or nesting. This function guesses
 * a few plausible shapes (a nested `conflict`/`conflictingBooking`/`booking`
 * object, or the fields flat on the body) and reads whichever one matches.
 * Confirm the real shape once the API ships and simplify this accordingly.
 *
 * Deliberately defensive: any status other than 409, or a body that matches
 * none of the guessed shapes, degrades to a generic Spanish message instead
 * of throwing. Never returns the raw Axios/HTTP text.
 *
 * @returns `null` when `error` is not a 409 (any other status, or a
 * non-Axios failure) — callers should use their own generic message then.
 */
export function bookingConflictMessage(error: unknown): string | null {
  if (!(error instanceof AxiosError)) return null;
  if (error.response?.status !== 409) return null;

  const FALLBACK =
    "Ya existe una reserva que se cruza con este horario. Actualiza la disponibilidad y elige otro horario.";

  const data = error.response?.data;
  const body = data != null && typeof data === "object" ? (data as Record<string, unknown>) : {};

  const nested =
    pickObject(body, "conflict") ??
    pickObject(body, "conflictingBooking") ??
    pickObject(body, "booking") ??
    body;

  const title = pickString(nested, ["title", "name"]);
  const startsAt = pickString(nested, ["serviceStartsAt", "startsAt", "start"]);
  const endsAt = pickString(nested, ["serviceEndsAt", "endsAt", "end"]);
  const range = formatRange(startsAt, endsAt);

  if (!title && !range) return FALLBACK;

  const parts = ["Ya existe una reserva"];
  if (title) parts.push(`("${title}")`);
  if (range) parts.push(`en ${range}`);
  parts.push("que se cruza con este horario.");
  return parts.join(" ");
}

function pickObject(
  source: Record<string, unknown>,
  key: string
): Record<string, unknown> | null {
  const value = source[key];
  return value != null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function pickString(source: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function formatRange(startsAt: string | null, endsAt: string | null): string | null {
  const start = formatMexicoCityDateTime(startsAt);
  const end = formatMexicoCityDateTime(endsAt);
  if (start && end) return `${start} – ${end}`;
  return start ?? end;
}

function formatMexicoCityDateTime(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  try {
    return new Intl.DateTimeFormat("es-MX", {
      timeZone: "America/Mexico_City",
      dateStyle: "long",
      timeStyle: "short",
    }).format(date);
  } catch {
    return null;
  }
}
