import { GetBrandsResponse } from "./brands";

export type ExtraStatus = "active" | "inactive";

/** `add`: the extra delivers this product. `remove`: the linked package stops delivering it. */
export type ExtraProductAction = "add" | "remove";

export interface ExtraProductInput {
  productId: number;
  quantity?: number;
  action: ExtraProductAction;
}

export interface ExtraProduct {
  productId: number;
  quantity: number;
  action: ExtraProductAction;
  product?: { id: number; name: string };
}

export interface Extra {
  id: number;
  brandId: number;
  name: string;
  description: string | null;
  price: number;
  status: ExtraStatus;
  brand: GetBrandsResponse;
  products?: ExtraProduct[];
}

export interface CreateExtraPayload {
  brandId: number;
  name: string;
  description?: string | null;
  price: number;
  status?: ExtraStatus;
  products?: ExtraProductInput[];
}

export interface UpdateExtraPayload extends CreateExtraPayload {}
