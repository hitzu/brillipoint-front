import type { Carousel } from "../../interfaces";
import {
  TATTOO_CATALOG_PAGE,
  TATTOO_CATALOG_SECTION,
  type TattooCatalogItem,
} from "../../features/booking/utils/tattooDesigns";
import { axiosInstanceWithoutToken } from "../config/axiosConfig";

/** Public catalog of tattoo designs (rows of the API `carousels` table). */
export const getTattooCatalog = async (): Promise<TattooCatalogItem[]> => {
  const response = await axiosInstanceWithoutToken.get<Carousel[]>(
    "/carousels",
    { params: { page: TATTOO_CATALOG_PAGE, section: TATTOO_CATALOG_SECTION } },
  );
  return (Array.isArray(response.data) ? response.data : [])
    .filter((row) => row.imageUrl)
    .map((row) => ({
      id: row.id,
      title: row.title?.trim() || "Diseño",
      imageUrl: row.imageUrl as string,
    }));
};
