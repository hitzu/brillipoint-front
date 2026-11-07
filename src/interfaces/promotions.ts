export interface PromotionTier {
  order: number;
  discountPercentage: number;
}

export interface PromotionPackage {
  packageId: number;
  packageName: string;
  tiers: PromotionTier[];
}

export interface Promotion {
  id: number;
  brandId: number;
  name: string;
  status: string;
  /** Flat discount applied to packages of this brand. */
  type: "percentage" | "fixed";
  value: number;
  /** Per-package tiered discount applied to extras, by order added. Not present on the lightweight promotion summary nested in contract responses. */
  packages?: PromotionPackage[];
}

export type PromotionType = Promotion["type"];
export type PromotionStatus = "active" | "inactive";

export interface PromotionPackageRow {
  packageId: number;
  tierOrder: number;
  discountPercentage: number;
  package?: { id: number; name: string };
}

export interface PromotionDetail {
  id: number;
  brandId: number;
  name: string;
  status: PromotionStatus;
  type: PromotionType;
  value: number;
  validFrom: string | null;
  validUntil: string | null;
  promotionPackages: PromotionPackageRow[];
}

export interface CreatePromotionPayload {
  brandId: number;
  name: string;
  type: PromotionType;
  value: number;
  status?: PromotionStatus;
  validFrom?: string;
  validUntil?: string;
}

export type UpdatePromotionPayload = Partial<CreatePromotionPayload>;

export interface SetPromotionPackagesPayload {
  packages: { packageId: number; tiers: PromotionTier[] }[];
}
