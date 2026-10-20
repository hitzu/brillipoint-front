// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReservationExtrasSection } from "./ReservationExtrasSection";
import { ReservationServicesSection } from "./ReservationServicesSection";

const signature = {
  id: 1,
  contractId: 1,
  packageId: 1,
  quantity: 1,
  nameSnapshot: "Brillipoint Signature",
  basePriceSnapshot: 2700,
  discountPercentageSnapshot: 0,
  finalPriceSnapshot: 2700,
  package: {
    packageProducts: [{ product: { name: "Impresión polaroid" } }],
  },
  promotion: null,
} as any;

const canvas = {
  id: 7,
  contractId: 1,
  extraId: 3,
  contractPackageId: 1,
  quantity: 1,
  nameSnapshot: "Lienzo personalizado",
  basePriceSnapshot: 700,
  discountPercentageSnapshot: 0,
  finalPriceSnapshot: 700,
  extra: { name: "Lienzo personalizado" },
  promotion: null,
  isGift: false,
  deliverables: [
    { productId: 10, name: "Lienzo para el anfitrión", quantity: 1 },
    { productId: 11, name: "Tira de fotos para invitados", quantity: 1 },
  ],
} as any;

describe("ReservationServicesSection", () => {
  it("lists the frozen deliverables instead of the current catalog", () => {
    render(
      <ReservationServicesSection
        items={[
          {
            ...signature,
            deliverables: [
              { productId: 1, name: "Back con letrero LED", quantity: 1 },
            ],
          },
        ]}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Ver detalles" }));

    expect(screen.getByText("Back con letrero LED")).toBeTruthy();
    expect(screen.queryByText("Impresión polaroid")).toBeNull();
  });

  it("falls back to the catalog products when there are no deliverables", () => {
    render(<ReservationServicesSection items={[signature]} />);
    fireEvent.click(screen.getByRole("button", { name: "Ver detalles" }));

    expect(screen.getByText("Impresión polaroid")).toBeTruthy();
  });
});

describe("ReservationExtrasSection", () => {
  it("lists what each extra delivers", () => {
    render(<ReservationExtrasSection items={[canvas]} />);

    expect(screen.getByText("Tira de fotos para invitados")).toBeTruthy();
  });

  it("shows a gifted extra as a gift at no cost", () => {
    render(
      <ReservationExtrasSection
        items={[
          {
            ...canvas,
            isGift: true,
            discountPercentageSnapshot: 100,
            finalPriceSnapshot: 0,
          },
        ]}
      />
    );

    expect(screen.getByText("Regalo")).toBeTruthy();
    expect(screen.queryByText("100% off")).toBeNull();
  });
});
