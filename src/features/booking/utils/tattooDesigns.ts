// Mirrors the API rules (bookandsign-api: tattoo-designs.policy.ts). The API is
// the authority; these helpers only decide what to show.
export const TATTOO_DESIGNS_QUESTION_ID = "tattoo_designs";
// Chosen catalog designs and uploaded designs share the same maximum.
/** Uploaded photos and final designs (mixed). */
export const TATTOO_UPLOADS_MAX = 10;
/** Catalog templates and final designs the client chooses. Independent of the uploads cap. */
export const TATTOO_CATALOG_MAX = 10;
export const TATTOO_CATALOG_QUESTION_ID = "tattoo_catalog_designs";
// The catalog is a page/section of the API `carousels` table (global).
export const TATTOO_CATALOG_PAGE = "reservation";
/** Customizable templates: the team personalizes them with the client's photos. */
export const TATTOO_TEMPLATES_SECTION = "tattoo-templates";
/** Final designs proposed by Brillipoint. */
export const TATTOO_FINALS_SECTION = "tattoo-finals";
/** Legacy section of the first catalog rows; shown as final designs. */
export const TATTOO_LEGACY_SECTION = "tattoo-designs";
/** Reference photos that show what a good upload looks like; not selectable. */
export const PHOTO_EXAMPLES_SECTION = "photos-examples";
/** Only this many final tattoos are printed, whatever the client uploads or chooses. */
export const TATTOO_PRINT_MAX = 5;

/** A design the client can choose, from the live catalog. */
export type TattooCatalogItem = {
  id: number;
  title: string;
  imageUrl: string;
  /** Customizable template or final design; legacy rows count as final. */
  kind?: "template" | "final";
};

/** Frozen copy the API stores when the client chooses a catalog design. */
export type TattooCatalogChoice = {
  carouselId: number;
  title: string;
  imageUrl: string;
};
// The API closes when the event is 7 days away or closer, so the last day the
// client can still change designs is 8 days before the event.
const LAST_OPEN_DAYS_BEFORE_EVENT = 8;

/**
 * The section is enabled by NAME, not by ids (ids differ between stages and
 * change when a product is recreated): any contracted product or paid extra
 * whose name says both "tatuajes" and "personalizados". Keep in sync with
 * isTattooDesignsName in bookandsign-api; a stable product key is planned.
 */
export const isTattooDesignsName = (name: string | null | undefined): boolean => {
  const normalized = (name ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  return normalized.includes("tatuaj") && normalized.includes("personaliz");
};

type DeliveringLine = {
  /** The API's frozen product snapshot of the contract line. */
  deliverables?: ReadonlyArray<{ name: string }>;
  /** Paid extras are also matched by their own name. */
  nameSnapshot?: string | null;
};

/** Packages and paid extras both deliver products, so either can enable the section. */
export const hasTattooDesignsInContract = (
  contract:
    | {
        packages?: ReadonlyArray<DeliveringLine>;
        extras?: ReadonlyArray<DeliveringLine>;
      }
    | undefined,
): boolean => {
  const deliversTattoos = (line: DeliveringLine) =>
    (line.deliverables ?? []).some((d) => isTattooDesignsName(d.name));
  return (
    (contract?.packages ?? []).some(deliversTattoos) ||
    (contract?.extras ?? []).some(
      (line) => isTattooDesignsName(line.nameSnapshot) || deliversTattoos(line),
    )
  );
};

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
