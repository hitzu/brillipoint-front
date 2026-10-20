import type {
  ExtraProduct,
  ExtraProductInput,
} from "../../../interfaces/extras";

export interface ProductOption {
  value: number;
  label: string;
}

/** Builds the API `products` list from the "Incluye" and "Reemplaza a" selections. */
export const toExtraProductsPayload = (
  includes: readonly ProductOption[],
  replaces: readonly ProductOption[]
): ExtraProductInput[] => [
  ...includes.map((option) => ({
    productId: option.value,
    quantity: 1,
    action: "add" as const,
  })),
  ...replaces.map((option) => ({
    productId: option.value,
    quantity: 1,
    action: "remove" as const,
  })),
];

export const fromExtraProducts = (
  products: ExtraProduct[]
): { includes: ProductOption[]; replaces: ProductOption[] } => {
  const toOption = (product: ExtraProduct): ProductOption => ({
    value: product.productId,
    label: product.product?.name ?? `Producto ${product.productId}`,
  });
  return {
    includes: products.filter((p) => p.action === "add").map(toOption),
    replaces: products.filter((p) => p.action === "remove").map(toOption),
  };
};
