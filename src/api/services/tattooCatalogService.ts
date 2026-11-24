import type { Carousel } from "../../interfaces";
import {
  TATTOO_CATALOG_PAGE,
  TATTOO_FINALS_SECTION,
  TATTOO_LEGACY_SECTION,
  TATTOO_TEMPLATES_SECTION,
  type TattooCatalogItem,
} from "../../features/booking/utils/tattooDesigns";
import { axiosInstanceWithoutToken } from "../config/axiosConfig";

const fetchSection = async (
  section: string,
  kind?: TattooCatalogItem["kind"],
): Promise<TattooCatalogItem[]> => {
  const response = await axiosInstanceWithoutToken.get<Carousel[]>(
    "/carousels",
    { params: { page: TATTOO_CATALOG_PAGE, section } },
  );
  return (Array.isArray(response.data) ? response.data : [])
    .filter((row) => row.imageUrl)
    .map((row) => ({
      id: row.id,
      title: row.title?.trim() || "Diseño",
      imageUrl: row.imageUrl as string,
      ...(kind ? { kind } : {}),
    }));
};

/**
 * Public catalog of tattoo designs (rows of the API `carousels` table):
 * templates first, then final designs (legacy rows count as final).
 */
export const getTattooCatalog = async (): Promise<TattooCatalogItem[]> => {
  const [templates, finals, legacy] = await Promise.all([
    fetchSection(TATTOO_TEMPLATES_SECTION, "template"),
    fetchSection(TATTOO_FINALS_SECTION, "final"),
    fetchSection(TATTOO_LEGACY_SECTION, "final"),
  ]);
  return [...templates, ...finals, ...legacy];
};
