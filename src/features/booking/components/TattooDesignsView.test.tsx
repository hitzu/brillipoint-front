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
  onAddFiles: vi.fn(),
  onRemove: vi.fn(),
};

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
});
