// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { ApplicationsSection } from "./ApplicationsSection";
import { PrintSection } from "./PrintSection";
import { RulesSection } from "./RulesSection";
import { VoiceSection } from "./VoiceSection";

const noop = () => undefined;

describe("ApplicationsSection", () => {
  it("shows the six formats with the active line's copy", () => {
    const { rerender } = render(<ApplicationsSection line="light" onLineChange={noop} notify={noop} />);
    expect(screen.getAllByRole("figure").map((figure) => figure.querySelector("b")?.textContent)).toEqual([
      "Post de Instagram",
      "Story",
      "Foto impresa",
      "Llavero",
      "Tarjeta de presentación",
      "Señalética y letrero",
    ]);
    expect(screen.getByText("Momentos hoy, recuerdos siempre")).toBeTruthy();

    rerender(<ApplicationsSection line="dark" onLineChange={noop} notify={noop} />);
    expect(screen.getByText("Brilla toda la noche")).toBeTruthy();
    expect(screen.queryByText("Momentos hoy, recuerdos siempre")).toBeNull();
  });
});

describe("VoiceSection", () => {
  const result = () => screen.getByTestId("voice-result").textContent;

  it("flags the bad sample and passes the good one", () => {
    render(<VoiceSection line="light" onLineChange={noop} notify={noop} />);
    expect(result()).toMatch(/^7 COSASCambia esto antes de publicar\./);
    expect(result()).toContain("Un solo signo de admiración, o ninguno.");

    fireEvent.click(screen.getByRole("button", { name: "Ejemplo correcto" }));
    expect(result()).toMatch(/^SE PUEDESuena a Brillipoint/);
  });

  it("asks for a text when the box is empty and reviews whatever is typed", () => {
    render(<VoiceSection line="light" onLineChange={noop} notify={noop} />);
    const box = screen.getByLabelText("REVISA UN TEXTO ANTES DE PUBLICARLO");
    fireEvent.change(box, { target: { value: "" } });
    expect(result()).toMatch(/^VACÍO/);

    fireEvent.change(box, { target: { value: "Súper oferta" } });
    expect(result()).toMatch(/^2 COSAS/);
  });
});

describe("RulesSection", () => {
  it("groups the prohibitions by topic", () => {
    render(<RulesSection line="light" onLineChange={noop} notify={noop} />);
    expect(screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual([
      "Logo",
      "Color",
      "Tipografía",
      "Brillo",
      "Composición",
      "Precios y textos",
      "Fotografía",
    ]);
  });
});

describe("PrintSection", () => {
  beforeEach(() => window.localStorage.clear());

  it("tracks the checklist progress and remembers it", () => {
    const { unmount } = render(<PrintSection line="light" onLineChange={noop} notify={noop} />);
    const boxes = screen.getAllByRole("checkbox");
    expect(boxes).toHaveLength(9);
    expect(screen.getByText("0 de 9")).toBeTruthy();

    fireEvent.click(boxes[0]);
    fireEvent.click(boxes[3]);
    expect(screen.getByText("2 de 9")).toBeTruthy();
    unmount();

    render(<PrintSection line="light" onLineChange={noop} notify={noop} />);
    expect(screen.getByText("2 de 9")).toBeTruthy();
    expect((screen.getAllByRole("checkbox")[3] as HTMLInputElement).checked).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Empezar de nuevo" }));
    expect(screen.getByText("0 de 9")).toBeTruthy();
  });

  it("explains the printing side of the active line", () => {
    const { rerender } = render(<PrintSection line="light" onLineChange={noop} notify={noop} />);
    expect(screen.getByTestId("print-line").textContent).toMatch(/^CARA CLARA/);
    rerender(<PrintSection line="dark" onLineChange={noop} notify={noop} />);
    expect(screen.getByTestId("print-line").textContent).toMatch(/^CARA NOCHE.*C40 M30 Y30 K100/);
  });
});
