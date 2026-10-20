import { describe, expect, it } from "vitest";
import { fromExtraProducts, toExtraProductsPayload } from "../extraProducts";

describe("toExtraProductsPayload", () => {
  it("sends included products as add and replaced products as remove", () => {
    const payload = toExtraProductsPayload(
      [{ value: 10, label: "Lienzo" }],
      [{ value: 20, label: "Polaroid" }]
    );

    expect(payload).toEqual([
      { productId: 10, quantity: 1, action: "add" },
      { productId: 20, quantity: 1, action: "remove" },
    ]);
  });
});

describe("fromExtraProducts", () => {
  it("splits stored products into included and replaced options", () => {
    const result = fromExtraProducts([
      {
        productId: 10,
        quantity: 1,
        action: "add",
        product: { id: 10, name: "Lienzo" },
      },
      {
        productId: 20,
        quantity: 1,
        action: "remove",
        product: { id: 20, name: "Polaroid" },
      },
    ]);

    expect(result).toEqual({
      includes: [{ value: 10, label: "Lienzo" }],
      replaces: [{ value: 20, label: "Polaroid" }],
    });
  });
});
