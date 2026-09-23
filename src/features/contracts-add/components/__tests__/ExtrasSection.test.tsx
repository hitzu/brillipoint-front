// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ExtrasSection } from "../ExtrasSection";

const drinkExtra = {
  id: 5,
  brandId: 1,
  name: "Barra de bebidas",
  description: null,
  price: 800,
  status: "active",
  brand: { id: 1, name: "Marca" },
} as any;

const photobooth = {
  id: 1,
  name: "Fotobooth Clásico",
  basePrice: 5000,
  discount: null,
  status: "active",
  brandId: 1,
  brand: { id: 1, name: "Marca" },
  packageProducts: [],
} as any;

describe("ExtrasSection", () => {
  it("adds the selected extra unlinked when there's no target picker", () => {
    const onAdd = vi.fn();
    render(
      <ExtrasSection
        extras={[drinkExtra]}
        cart={[{ pkg: photobooth, quantity: 1, clientRef: "pkg-1" }]}
        extraCart={[]}
        onAdd={onAdd}
        onRemove={vi.fn()}
        onQuantityChange={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText("Extra"), {
      target: { value: "5" },
    });
    fireEvent.click(screen.getByRole("button", { name: /agregar/i }));
    expect(onAdd).toHaveBeenCalledWith(5, null);
  });

  it("links the extra to the chosen cart package when more than one is in the cart", () => {
    const onAdd = vi.fn();
    const secondPackage = { ...photobooth, id: 2 };
    render(
      <ExtrasSection
        extras={[drinkExtra]}
        cart={[
          { pkg: photobooth, quantity: 1, clientRef: "pkg-1" },
          { pkg: secondPackage, quantity: 1, clientRef: "pkg-2" },
        ]}
        extraCart={[]}
        onAdd={onAdd}
        onRemove={vi.fn()}
        onQuantityChange={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText("Paquete al que pertenece"), {
      target: { value: "pkg-2" },
    });
    fireEvent.change(screen.getByLabelText("Extra"), {
      target: { value: "5" },
    });
    fireEvent.click(screen.getByRole("button", { name: /agregar/i }));
    expect(onAdd).toHaveBeenCalledWith(5, "pkg-2");
  });

  it("removes an extra line and changes its quantity", () => {
    const onRemove = vi.fn();
    const onQuantityChange = vi.fn();
    render(
      <ExtrasSection
        extras={[drinkExtra]}
        cart={[{ pkg: photobooth, quantity: 1, clientRef: "pkg-1" }]}
        extraCart={[
          { extra: drinkExtra, quantity: 2, packageClientRef: "pkg-1" },
        ]}
        onAdd={vi.fn()}
        onRemove={onRemove}
        onQuantityChange={onQuantityChange}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /eliminar barra de bebidas/i }),
    );
    expect(onRemove).toHaveBeenCalledWith(5);

    fireEvent.click(
      screen.getByRole("button", {
        name: /agregar una unidad de barra de bebidas/i,
      }),
    );
    expect(onQuantityChange).toHaveBeenCalledWith(5, 3);
  });
});
