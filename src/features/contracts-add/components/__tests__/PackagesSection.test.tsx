// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PackagesSection } from "../PackagesSection";

const photobooth = {
  id: 1,
  name: "Fotobooth Clásico",
  basePrice: 5000,
  discount: null,
  status: "active",
  brandId: 1,
  brand: { id: 1, name: "Marca Uno" },
  packageProducts: [],
} as any;

describe("PackagesSection", () => {
  it("shows a hint instead of the picker when no brand is selected", () => {
    render(
      <PackagesSection
        packages={[]}
        cart={[]}
        brandSelected={false}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onQuantityChange={vi.fn()}
      />,
    );
    expect(screen.getByText(/selecciona una marca/i)).toBeTruthy();
    expect(screen.queryByLabelText("Paquete")).toBeNull();
  });

  it("lists the selected brand's packages once a brand is chosen", () => {
    render(
      <PackagesSection
        packages={[photobooth]}
        cart={[]}
        brandSelected
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onQuantityChange={vi.fn()}
      />,
    );
    expect(screen.getByText(/Fotobooth Clásico/)).toBeTruthy();
    expect(screen.getByText(/Marca Uno/)).toBeTruthy();
  });

  it("renders the package picker on its own full-width row", () => {
    render(
      <PackagesSection
        packages={[photobooth]}
        cart={[]}
        brandSelected
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onQuantityChange={vi.fn()}
      />,
    );
    const picker = screen.getByLabelText("Paquete");
    // The picker's own column spans the full 12-column grid instead of
    // sharing the row with the Add button — the layout bug this fixes.
    expect(picker.closest(".col-12")).toBeTruthy();
    expect(picker.closest(".col-md-8")).toBeNull();
  });

  it("adds the selected package to the cart", () => {
    const onAdd = vi.fn();
    render(
      <PackagesSection
        packages={[photobooth]}
        cart={[]}
        brandSelected
        onAdd={onAdd}
        onRemove={vi.fn()}
        onQuantityChange={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText("Paquete"), {
      target: { value: "1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /agregar/i }));
    expect(onAdd).toHaveBeenCalledWith(1);
  });

  it("removes a cart line and changes its quantity", () => {
    const onRemove = vi.fn();
    const onQuantityChange = vi.fn();
    render(
      <PackagesSection
        packages={[photobooth]}
        cart={[{ pkg: photobooth, quantity: 2, clientRef: "pkg-1" }]}
        brandSelected
        onAdd={vi.fn()}
        onRemove={onRemove}
        onQuantityChange={onQuantityChange}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /eliminar fotobooth clásico/i }),
    );
    expect(onRemove).toHaveBeenCalledWith(1);

    fireEvent.click(
      screen.getByRole("button", {
        name: /agregar una unidad de fotobooth clásico/i,
      }),
    );
    expect(onQuantityChange).toHaveBeenCalledWith(1, 3);
  });
});
