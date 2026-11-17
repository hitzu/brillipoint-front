// Mirrors the API rules (bookandsign-api: tattoo-designs.policy.ts). The API is
// the authority; these helpers only decide what to show.
export const TATTOO_DESIGNS_QUESTION_ID = "tattoo_designs";
// Chosen catalog designs and uploaded designs share the same maximum.
export const TATTOO_DESIGNS_MAX = 5;
export const TATTOO_CATALOG_QUESTION_ID = "tattoo_catalog_designs";
// The catalog is a page/section of the API `carousels` table (global).
export const TATTOO_CATALOG_PAGE = "reservation";
export const TATTOO_CATALOG_SECTION = "tattoo-designs";

/** A design the client can choose, from the live catalog. */
export type TattooCatalogItem = { id: number; title: string; imageUrl: string };

/** Frozen copy the API stores when the client chooses a catalog design. */
export type TattooCatalogChoice = {
  carouselId: number;
  title: string;
  imageUrl: string;
};
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

type DeliveringLine = {
  deliverables?: ReadonlyArray<{ productId: number }>;
};

/** Packages and paid extras both deliver products, so either can enable the section. */
export const hasTattooDesignsInContract = (
  contract:
    | {
        packages?: ReadonlyArray<DeliveringLine>;
        extras?: ReadonlyArray<DeliveringLine>;
      }
    | undefined,
): boolean =>
  hasTattooDesignsProduct([
    ...(contract?.packages ?? []),
    ...(contract?.extras ?? []),
  ]);

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
