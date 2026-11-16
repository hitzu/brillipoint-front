// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TattooDesignsView } from "./TattooDesignsView";

const design = (n: number) => ({
  path: `7/tattoo_designs/${n}.png`,
  mime: "image/png",
  url: `https://cdn.example/${n}.png`,
});

const baseProps = {
  designs: [],
  locked: false,
  closingDayLabel: null,
  isBusy: false,
  errorMessage: null,
  catalog: [],
  chosen: [],
  onAddFiles: vi.fn(),
  onRemove: vi.fn(),
  onToggleCatalog: vi.fn(),
};

const catalogItem = (n: number) => ({
  id: n,
  title: `Diseño catálogo ${n}`,
  imageUrl: `https://cdn.example/catalog-${n}.png`,
});
const choice = (n: number) => ({
  carouselId: n,
  title: `Diseño catálogo ${n}`,
  imageUrl: `https://cdn.example/catalog-${n}.png`,
});

afterEach(cleanup);

describe("TattooDesignsView", () => {
  it("shows the counter and lets the client add designs while open", () => {
    render(<TattooDesignsView {...baseProps} designs={[design(1), design(2)]} />);

    expect(screen.getByText("2 de 5 diseños")).toBeTruthy();
    expect(screen.getAllByRole("img")).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: /Eliminar diseño/ })).toHaveLength(2);
    expect(screen.getByText(/Toca para seleccionar/)).toBeTruthy();
  });

  it("hides the uploader once 5 designs are loaded", () => {
    render(
      <TattooDesignsView
        {...baseProps}
        designs={[1, 2, 3, 4, 5].map(design)}
      />,
    );

    expect(screen.getByText("5 de 5 diseños")).toBeTruthy();
    expect(screen.queryByText(/Toca para seleccionar/)).toBeNull();
    expect(screen.getByText(/Ya alcanzaste el máximo/)).toBeTruthy();
  });

  it("calls onRemove with the asset path", () => {
    const onRemove = vi.fn();
    render(<TattooDesignsView {...baseProps} designs={[design(1)]} onRemove={onRemove} />);

    fireEvent.click(screen.getByRole("button", { name: /Eliminar diseño 1/ }));

    expect(onRemove).toHaveBeenCalledWith("7/tattoo_designs/1.png");
  });

  it("is read-only with a notice once the window has closed", () => {
    render(
      <TattooDesignsView {...baseProps} designs={[design(1)]} locked />,
    );

    expect(screen.getAllByRole("img")).toHaveLength(1);
    expect(screen.queryByRole("button", { name: /Eliminar diseño/ })).toBeNull();
    expect(screen.queryByText(/Toca para seleccionar/)).toBeNull();
    expect(screen.getByRole("status").textContent).toContain(
      "Ya no se pueden modificar",
    );
  });

  it("tells the client until when designs can be changed", () => {
    render(<TattooDesignsView {...baseProps} closingDayLabel="12 de septiembre" />);

    expect(screen.getByText(/hasta el 12 de septiembre/)).toBeTruthy();
  });

  it("shows the error message", () => {
    render(<TattooDesignsView {...baseProps} errorMessage="No se pudo guardar" />);

    expect(screen.getByRole("alert").textContent).toBe("No se pudo guardar");
  });

  describe("catalog gallery", () => {
    it("shows the catalog designs by name and lets the client choose one", () => {
      const onToggleCatalog = vi.fn();
      render(
        <TattooDesignsView
          {...baseProps}
          catalog={[catalogItem(1), catalogItem(2)]}
          onToggleCatalog={onToggleCatalog}
        />,
      );

      expect(screen.getByText("Elige de nuestro catálogo")).toBeTruthy();
      fireEvent.click(
        screen.getByRole("button", { name: "Elegir Diseño catálogo 2" }),
      );

      expect(onToggleCatalog).toHaveBeenCalledWith(2);
    });

    it("marks the chosen designs as pressed and lets the client unchoose from the gallery", () => {
      const onToggleCatalog = vi.fn();
      render(
        <TattooDesignsView
          {...baseProps}
          catalog={[catalogItem(1), catalogItem(2)]}
          chosen={[choice(1)]}
          onToggleCatalog={onToggleCatalog}
        />,
      );

      const pressed = screen.getByRole("button", {
        name: "Quitar Diseño catálogo 1",
      });
      expect(pressed.getAttribute("aria-pressed")).toBe("true");
      fireEvent.click(pressed);

      expect(onToggleCatalog).toHaveBeenCalledWith(1);
    });

    it("counts chosen plus uploaded designs against the maximum of 5", () => {
      render(
        <TattooDesignsView
          {...baseProps}
          designs={[design(1)]}
          catalog={[catalogItem(1), catalogItem(2)]}
          chosen={[choice(1), choice(2)]}
        />,
      );

      expect(screen.getByText("3 de 5 diseños")).toBeTruthy();
    });

    it("disables unchosen catalog designs and hides the uploader once the total is 5", () => {
      render(
        <TattooDesignsView
          {...baseProps}
          designs={[design(1), design(2), design(3)]}
          catalog={[catalogItem(1), catalogItem(2), catalogItem(3)]}
          chosen={[choice(1), choice(2)]}
        />,
      );

      const free = screen.getByRole("button", {
        name: "Elegir Diseño catálogo 3",
      }) as HTMLButtonElement;
      expect(free.disabled).toBe(true);
      expect(screen.queryByText(/Toca para seleccionar/)).toBeNull();
      const chosenButton = screen.getByRole("button", {
        name: "Quitar Diseño catálogo 1",
      }) as HTMLButtonElement;
      expect(chosenButton.disabled).toBe(false);
    });

    it("still shows a chosen design whose catalog row is gone, and lets the client remove it", () => {
      const onToggleCatalog = vi.fn();
      render(
        <TattooDesignsView
          {...baseProps}
          catalog={[]}
          chosen={[choice(9)]}
          onToggleCatalog={onToggleCatalog}
        />,
      );

      expect(screen.getByText("1 de 5 diseños")).toBeTruthy();
      fireEvent.click(
        screen.getByRole("button", { name: "Eliminar Diseño catálogo 9" }),
      );

      expect(onToggleCatalog).toHaveBeenCalledWith(9);
    });

    it("hides the gallery when the catalog is empty", () => {
      render(<TattooDesignsView {...baseProps} catalog={[]} />);

      expect(screen.queryByText("Elige de nuestro catálogo")).toBeNull();
    });

    it("is read-only once the window closed: chosen designs stay visible, nothing can change", () => {
      render(
        <TattooDesignsView
          {...baseProps}
          locked
          catalog={[catalogItem(1), catalogItem(2)]}
          chosen={[choice(1)]}
        />,
      );

      expect(screen.getByText("Diseño catálogo 1")).toBeTruthy();
      expect(screen.queryByText("Elige de nuestro catálogo")).toBeNull();
      expect(screen.queryByRole("button", { name: /Eliminar|Quitar|Elegir/ })).toBeNull();
    });
  });
});
