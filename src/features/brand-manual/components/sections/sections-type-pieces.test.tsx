// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PiecesSection } from "./PiecesSection";
import { TypeSection } from "./TypeSection";

const noop = () => undefined;

describe("TypeSection", () => {
  const input = () => screen.getByLabelText("TU FRASE") as HTMLInputElement;
  const verdict = () => screen.getByTestId("type-verdict").textContent;

  it("starts with the title style and its sample phrase", () => {
    render(<TypeSection line="light" onLineChange={noop} notify={noop} />);
    expect(screen.getByRole("radio", { name: "Título" }).getAttribute("aria-checked")).toBe("true");
    expect(input().value).toBe("Momentos hoy, recuerdos siempre");
    expect(screen.getByText("Jost 500 · 56 px · interlínea 1.05 · impreso 36–48 pt")).toBeTruthy();
    expect(verdict()).toMatch(/^SE PUEDE/);
  });

  it("swaps in each style's sample until the viewer types their own phrase", () => {
    render(<TypeSection line="light" onLineChange={noop} notify={noop} />);
    fireEvent.click(screen.getByRole("radio", { name: "Acento" }));
    expect(input().value).toBe("un recuerdo que sí se queda");

    fireEvent.change(input(), { target: { value: "UN RECUERDO" } });
    expect(verdict()).toMatch(/^NOAmsterdam One nunca va en mayúsculas/);

    fireEvent.click(screen.getByRole("radio", { name: "Precio" }));
    expect(input().value).toBe("UN RECUERDO");
  });

  it("previews the eyebrow already in uppercase", () => {
    render(<TypeSection line="light" onLineChange={noop} notify={noop} />);
    fireEvent.click(screen.getByRole("radio", { name: "Sobretítulo" }));
    expect(screen.getByTestId("type-preview").textContent).toBe("BRILLIPOINT EXPERIENCE · PHOTOBOOTH");
  });

  it("lists the type scale for screen and print", () => {
    render(<TypeSection line="light" onLineChange={noop} notify={noop} />);
    expect(screen.getByText("h3 · 20 px · 14 pt")).toBeTruthy();
    expect(screen.getByText("small · 13 px · 7–8 pt")).toBeTruthy();
  });
});

describe("PiecesSection", () => {
  it("shows the package card of the active line", () => {
    const { rerender } = render(<PiecesSection line="light" onLineChange={noop} notify={noop} />);
    expect(screen.getByRole("heading", { name: "Instants" })).toBeTruthy();
    rerender(<PiecesSection line="dark" onLineChange={noop} notify={noop} />);
    expect(screen.getByRole("heading", { name: "Glitter Bar" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Instants" })).toBeNull();
  });

  it("draws one spark per step and rejects more than five", () => {
    render(<PiecesSection line="light" onLineChange={noop} notify={noop} />);
    const art = screen.getByTestId("spark-art");
    expect(art.querySelectorAll("svg")).toHaveLength(4);
    expect(screen.getByTestId("spark-verdict").textContent).toMatch(/^SE PUEDE4 destellos/);

    fireEvent.change(screen.getByRole("slider"), { target: { value: "6" } });

    expect(art.querySelectorAll("svg")).toHaveLength(6);
    expect(screen.getByTestId("spark-verdict").textContent).toMatch(/^NOSaturación/);
  });
});
