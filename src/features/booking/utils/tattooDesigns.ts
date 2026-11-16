// Mirrors the API rules (bookandsign-api: tattoo-designs.policy.ts). The API is
// the authority; these helpers only decide what to show.
export const TATTOO_DESIGNS_QUESTION_ID = "tattoo_designs";
export const TATTOO_DESIGNS_MAX = 5;
// Products that enable the section when a contracted package delivers them:
// "Tatuajes personalizados" of Glitter bar (131) and Photobooth (122).
// Hardcoded for now (to move to the database); keep in sync with
// TATTOO_DESIGNS_TRIGGER_PRODUCT_IDS in bookandsign-api.
export const TATTOO_DESIGNS_TRIGGER_PRODUCT_IDS: readonly number[] = [131, 122];
// The API closes when the event is 7 days away or closer, so the last day the
// client can still change designs is 8 days before the event.
const LAST_OPEN_DAYS_BEFORE_EVENT = 8;

/** `deliverables` is the API's frozen product snapshot of each contract line. */
export const hasTattooDesignsProduct = (
  packages: ReadonlyArray<{
    deliverables?: ReadonlyArray<{ productId: number }>;
  }>,
): boolean =>
  packages.some((p) =>
    (p.deliverables ?? []).some((d) =>
      TATTOO_DESIGNS_TRIGGER_PRODUCT_IDS.includes(d.productId),
    ),
  );

/** Date (YYYY-MM-DD) of the booking whose purpose is `event`, if any. */
export const getTattooEventDate = (
  bookings: ReadonlyArray<{ purpose?: string | null; eventDate: string }> | undefined,
): string | null =>
  bookings?.find((b) => b.purpose === "event")?.eventDate ?? null;

/** Last day (YYYY-MM-DD) on which designs can still be added, replaced or deleted. */
export const getTattooClosingDay = (eventDate: string): string => {
  const [year, month, day] = eventDate.split("-").map(Number);
  const closing = new Date(
    Date.UTC(year, month - 1, day - LAST_OPEN_DAYS_BEFORE_EVENT),
  );
  return closing.toISOString().slice(0, 10);
};
