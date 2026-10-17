// @vitest-environment jsdom
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { BrandManualPage } from ".";

const nav = () => screen.getByRole("navigation", { name: "Secciones del manual" });
const stage = () => screen.getByRole("main");

describe("BrandManualPage", () => {
  beforeEach(() => window.localStorage.clear());

  it("lists the nine sections and opens La marca by default", () => {
    render(<BrandManualPage />);
    const items = within(nav()).getAllByRole("button");
    expect(items.map((item) => item.textContent)).toEqual([
      "La marca",
      "Logotipo",
      "Color",
      "Tipografía",
      "Piezas",
      "Aplicaciones",
      "Voz",
      "Prohibiciones",
      "Antes de imprimir",
    ]);
    expect(within(nav()).getByRole("button", { name: "La marca" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("heading", { name: "Brillo nocturno, cálido y elegante." })).toBeTruthy();
  });

  it("starts in Photobooth light and switches the whole stage to Glitter Bar night", () => {
    render(<BrandManualPage />);
    expect(stage().getAttribute("data-theme")).toBe("light");
    expect(stage().style.getPropertyValue("--surface-100")).toBe("#fbf8f3");

    fireEvent.click(screen.getByRole("radio", { name: "GLITTER BAR" }));

    expect(stage().getAttribute("data-theme")).toBe("dark");
    expect(stage().style.getPropertyValue("--surface-100")).toBe("#0c0b0a");
    expect(screen.getByRole("radio", { name: "GLITTER BAR" }).getAttribute("aria-checked")).toBe("true");
  });

  it("switches the line from the line cards in La marca", () => {
    render(<BrandManualPage />);
    fireEvent.click(screen.getByRole("button", { name: /GLITTER BAR · NOCHE/ }));
    expect(stage().getAttribute("data-theme")).toBe("dark");
    expect(screen.getByRole("button", { name: /GLITTER BAR · NOCHE/ }).getAttribute("aria-pressed")).toBe("true");
  });

  it("renders every section from the sidebar", () => {
    render(<BrandManualPage />);
    const titles: Record<string, string> = {
      "La marca": "Brillo nocturno, cálido y elegante.",
      Logotipo: "La B no se toca",
      Color: "Un solo brillo",
      Tipografía: "Dos familias, nunca más",
      Piezas: "Las piezas que se repiten",
      Aplicaciones: "De la pantalla al llavero",
      Voz: "Hablamos de tú",
      Prohibiciones: "Lo que nunca hacemos",
      "Antes de imprimir": "Checklist de imprenta",
    };
    Object.entries(titles).forEach(([label, title]) => {
      fireEvent.click(within(nav()).getByRole("button", { name: label }));
      expect(screen.getByRole("heading", { level: 2, name: title })).toBeTruthy();
    });
  });

  it("no longer lists the Amsterdam One license as pending", () => {
    render(<BrandManualPage />);
    expect(screen.queryByText(/licencia comercial de Amsterdam One/i)).toBeNull();
    fireEvent.click(within(nav()).getByRole("button", { name: "Tipografía" }));
    expect(screen.queryByText(/licencia comercial de Amsterdam One/i)).toBeNull();
  });

  it("updates the breadcrumb and remembers the open section", () => {
    const { unmount } = render(<BrandManualPage />);
    fireEvent.click(within(nav()).getByRole("button", { name: "Voz" }));
    expect(screen.getByText("VOZ", { selector: "b" })).toBeTruthy();
    unmount();

    render(<BrandManualPage />);
    expect(within(nav()).getByRole("button", { name: "Voz" }).getAttribute("aria-current")).toBe("page");
  });
});
