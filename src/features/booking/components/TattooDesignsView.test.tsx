// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
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
  saveStatus: "idle" as const,
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

    expect(screen.getByText("2 de 10")).toBeTruthy();
    // Two uploaded designs plus the tutorial image.
    expect(screen.getAllByRole("img")).toHaveLength(3);
    expect(screen.getAllByRole("button", { name: /Quitar de mis diseños/ })).toHaveLength(2);
    expect(screen.getByText(/Te quedan/)).toBeTruthy();
  });

  it("hides the uploader once 10 designs are loaded", () => {
    render(
      <TattooDesignsView
        {...baseProps}
        designs={[1,2,3,4,5,6,7,8,9,10].map(design)}
      />,
    );

    expect(screen.getByText("10 de 10")).toBeTruthy();
    expect(screen.queryByText(/Te quedan/)).toBeNull();
    expect(screen.getByText(/Ya tienes tus 10 fotos y diseños/)).toBeTruthy();
  });

  it("shows the uploads only once there is one, a tile per file, and chosen templates never take a place", () => {
    const { rerender } = render(<TattooDesignsView {...baseProps} />);

    expect(screen.queryByText("Tus fotos y diseños")).toBeNull();
    expect(screen.queryByText("0 de 10")).toBeNull();

    rerender(
      <TattooDesignsView {...baseProps} designs={[design(1)]} chosen={[choice(1), choice(2)]} />,
    );

    expect(screen.getByText("Tus fotos y diseños")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /Quitar de mis diseños/ })).toHaveLength(1);
    // No placeholder boxes: the dropzone already says how many places are left.
    expect(screen.queryByText("Espacio libre")).toBeNull();
    expect(screen.queryByText("Lugar libre")).toBeNull();
    expect(screen.getByText("Te quedan 9 espacios")).toBeTruthy();
    expect(screen.getByText("1 de 10", { selector: "span" })).toBeTruthy();
    expect(screen.getByText("2 de 10", { selector: "span" })).toBeTruthy();
  });

  it("shows the print priority before the upload and catalog limits", () => {
    render(<TattooDesignsView {...baseProps} />);

    const note = screen.getByRole("note");
    const limits = screen.getByText("subir hasta 10 fotos o diseños");
    expect(note.compareDocumentPosition(limits) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("orders the steps: upload first, catalog second", () => {
    render(<TattooDesignsView {...baseProps} catalog={[catalogItem(1)]} />);

    const upload = screen.getByText("Sube tus fotos o diseños");
    const catalogTitle = screen.getByText("Elige de nuestro catálogo");
    expect(
      upload.compareDocumentPosition(catalogTitle) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("marks chosen templates with a check and blocks the rest once 10 are chosen", () => {
    const items = Array.from({ length: 11 }, (_, i) => catalogItem(i + 1));
    render(
      <TattooDesignsView
        {...baseProps}
        catalog={items}
        chosen={items.slice(0, 10).map((it) => choice(it.id))}
      />,
    );

    expect(screen.getAllByText("Seleccionado")).toHaveLength(10);
    expect(screen.getAllByText("✓")).toHaveLength(10);
    expect(screen.getByText("Sin lugares libres")).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: "Elegir Diseño catálogo 11" }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("calls onRemove with the asset path", () => {
    const onRemove = vi.fn();
    render(<TattooDesignsView {...baseProps} designs={[design(1)]} onRemove={onRemove} />);

    fireEvent.click(screen.getByRole("button", { name: /Quitar de mis diseños: Diseño 1/ }));

    expect(onRemove).toHaveBeenCalledWith("7/tattoo_designs/1.png");
  });

  it("is read-only with a notice once the window has closed", () => {
    render(
      <TattooDesignsView {...baseProps} designs={[design(1)]} locked />,
    );

    expect(screen.getAllByRole("img")).toHaveLength(1);
    expect(screen.queryByRole("button", { name: /Quitar de mis diseños/ })).toBeNull();
    expect(screen.queryByText(/Te quedan/)).toBeNull();
    expect(screen.getByRole("status").textContent).toContain(
      "Ya no se pueden modificar",
    );
  });

  it("tells the client until when designs can be changed", () => {
    render(<TattooDesignsView {...baseProps} closingDayLabel="12 de septiembre" />);

    expect(screen.getByText(/hasta el 12 de septiembre/)).toBeTruthy();
  });

  it("does not repeat the limits or the team's lead time as chips", () => {
    render(<TattooDesignsView {...baseProps} />);

    expect(screen.queryByText(/Subes hasta 10 · eliges hasta 10/)).toBeNull();
    expect(screen.queryByText(/Nuestro equipo necesita una semana/)).toBeNull();
  });

  it("shows the error message", () => {
    render(<TattooDesignsView {...baseProps} errorMessage="No se pudo guardar" />);

    expect(screen.getByRole("alert").textContent).toBe("No se pudo guardar");
  });

  it("explains that 5 tattoos are printed and in which priority", () => {
    render(<TattooDesignsView {...baseProps} />);

    const note = screen.getByRole("note");
    expect(note.textContent).toContain("Imprimimos 5 tatuajes");
    expect(note.textContent).toContain("Si eliges más, los escogemos en este orden:");
    const items = Array.from(note.querySelectorAll("li")).map((li) => li.textContent);
    expect(items).toEqual([
      "Diseños que subes túSi creaste tu propio tatuaje, se imprime primero.",
      "Templates con tus fotos(nosotros los diseñamos)",
      "Diseños del catálogo",
    ]);
  });

  it("explains what to upload inside the dropzone, without apologizing first", () => {
    const { rerender } = render(<TattooDesignsView {...baseProps} />);

    expect(
      screen.getByText("Pulsa aquí para agregar o arrastra tus selfies o diseños"),
    ).toBeTruthy();
    expect(screen.getByText("Te quedan 10 espacios")).toBeTruthy();
    expect(screen.queryByText(/Sube selfies o fotos de tu rostro/)).toBeNull();
    expect(screen.queryByText(/no aseguramos/)).toBeNull();

    rerender(
      <TattooDesignsView {...baseProps} designs={[1, 2, 3, 4, 5, 6, 7, 8, 9].map(design)} />,
    );
    expect(screen.getByText("Te queda 1 espacio")).toBeTruthy();
  });

  it("shows the photo tutorial in the open, with both kinds of upload explained", () => {
    render(<TattooDesignsView {...baseProps} />);

    expect(
      screen.getByRole("img", { name: /selfie clara y de frente funciona/ }).getAttribute("src"),
    ).toBe("/assets/tattoo/photo-tips.webp");
    expect(screen.getByText("Tus selfies:")).toBeTruthy();
    expect(screen.getByText("Tu propio diseño:")).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Ver el ejemplo en grande" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("img", { name: /selfie clara y de frente funciona/ })).toBeTruthy();
  });

  it("hides the tutorial when read-only", () => {
    render(<TattooDesignsView {...baseProps} locked />);

    expect(screen.queryByRole("img", { name: /selfie clara y de frente funciona/ })).toBeNull();
  });

  describe("selection bar", () => {
    const bar = () => screen.getByRole("region", { name: "Tu selección" });

    it("shows the upload and template counters and follows the selection", () => {
      const { rerender } = render(<TattooDesignsView {...baseProps} />);

      expect(within(bar()).getByText("Subidas 0 de 10")).toBeTruthy();
      expect(within(bar()).getByText("Templates 0 de 10")).toBeTruthy();

      rerender(
        <TattooDesignsView
          {...baseProps}
          designs={[design(1), design(2)]}
          chosen={[choice(1)]}
        />,
      );

      expect(within(bar()).getByText("Subidas 2 de 10")).toBeTruthy();
      expect(within(bar()).getByText("Templates 1 de 10")).toBeTruthy();
    });

    it("travels with the scroll: sticky at the bottom of the tab", () => {
      const { container } = render(<TattooDesignsView {...baseProps} />);

      expect(bar().style.position).toBe("sticky");
      const css = container.querySelector("style")?.textContent ?? "";
      expect(css).toMatch(/\.tattoo-selection-bar\s*{\s*bottom:\s*0;/);
    });

    it("stops above the fixed bottom nav the reservation page shows on phones", () => {
      const { container } = render(<TattooDesignsView {...baseProps} />);

      const css = container.querySelector("style")?.textContent ?? "";
      expect(css).toMatch(
        /@media \(max-width: 767\.98px\)[\s\S]*bottom:\s*calc\(4\.5rem \+ env\(safe-area-inset-bottom\)\)/,
      );
    });

    it("says the changes save by themselves before the first action", () => {
      render(<TattooDesignsView {...baseProps} saveStatus="idle" />);

      expect(within(bar()).getByText("Tus cambios se guardan solos")).toBeTruthy();
    });

    it("announces the save status politely", () => {
      render(<TattooDesignsView {...baseProps} saveStatus="saving" />);

      const status = within(bar()).getByText("Guardando…");
      expect(status.closest("[aria-live]")?.getAttribute("aria-live")).toBe("polite");
    });

    it("shows saving, saved and the failure in the bar, and keeps the card's error message", () => {
      const { rerender } = render(
        <TattooDesignsView {...baseProps} isBusy saveStatus="saving" />,
      );
      expect(within(bar()).getByText("Guardando…")).toBeTruthy();

      rerender(<TattooDesignsView {...baseProps} saveStatus="saved" />);
      expect(within(bar()).getByText("Guardado ✓")).toBeTruthy();

      rerender(
        <TattooDesignsView
          {...baseProps}
          saveStatus="error"
          errorMessage="No se pudieron guardar los diseños. Intenta de nuevo."
        />,
      );
      expect(within(bar()).getByText("No se pudo guardar")).toBeTruthy();
      expect(screen.getByRole("alert").textContent).toBe(
        "No se pudieron guardar los diseños. Intenta de nuevo.",
      );
    });

    it("no longer shows the old saving line at the bottom of the card", () => {
      render(<TattooDesignsView {...baseProps} isBusy saveStatus="saving" />);

      expect(screen.queryByText("Guardando...")).toBeNull();
      expect(screen.getAllByText("Guardando…")).toHaveLength(1);
    });

    it("says it is closed when read-only, with no editing controls", () => {
      render(
        <TattooDesignsView
          {...baseProps}
          locked
          saveStatus="locked"
          designs={[design(1)]}
          chosen={[choice(1)]}
        />,
      );

      expect(within(bar()).getByText("Cerrado: ya no se pueden modificar")).toBeTruthy();
      expect(screen.queryByRole("button", { name: /Quitar|Elegir/ })).toBeNull();
      expect(screen.queryByText(/Te quedan/)).toBeNull();
      expect(within(bar()).getByRole("button", { name: "Ver seleccionado" })).toBeTruthy();
    });

    it("gives the summary button a 44 px touch target", () => {
      render(<TattooDesignsView {...baseProps} />);

      const button = within(bar()).getByRole("button", { name: "Ver seleccionado" });
      expect(button.style.minHeight).toBe("44px");
    });
  });

  describe("selected summary", () => {
    const open = () =>
      fireEvent.click(screen.getByRole("button", { name: "Ver seleccionado" }));

    it("opens from the bar with the thumbnails and counters of uploads and templates", () => {
      render(
        <TattooDesignsView
          {...baseProps}
          designs={[design(1), design(2)]}
          chosen={[choice(7)]}
        />,
      );
      expect(screen.queryByRole("dialog")).toBeNull();

      open();

      const dialog = screen.getByRole("dialog", { name: "Lo que llevas elegido" });
      expect(within(dialog).getByRole("img", { name: "Diseño 1" }).getAttribute("src")).toBe(
        "https://cdn.example/1.png",
      );
      expect(within(dialog).getByRole("img", { name: "Diseño 2" })).toBeTruthy();
      expect(
        within(dialog).getByRole("img", { name: "Diseño catálogo 7" }).getAttribute("src"),
      ).toBe("https://cdn.example/catalog-7.png");
      expect(within(dialog).getByText("Tus fotos y diseños: 2 de 10")).toBeTruthy();
      expect(within(dialog).getByText("Tu selección del catálogo: 1 de 10")).toBeTruthy();
    });

    it("repeats the print notice: only 5 are printed, with their priority", () => {
      render(<TattooDesignsView {...baseProps} />);

      open();

      const note = within(screen.getByRole("dialog")).getByRole("note");
      expect(note.textContent).toContain("Imprimimos 5 tatuajes");
      expect(note.textContent).toContain("Si eliges más, los escogemos en este orden:");
    });

    it("tells until when changes are possible when the event has a date", () => {
      render(<TattooDesignsView {...baseProps} closingDayLabel="12 de septiembre" />);

      open();

      expect(
        within(screen.getByRole("dialog")).getByText(
          "Puedes hacer cambios hasta el 12 de septiembre.",
        ),
      ).toBeTruthy();
    });

    it("omits the deadline line when the reservation has no event date", () => {
      render(<TattooDesignsView {...baseProps} closingDayLabel={null} />);

      open();

      expect(
        within(screen.getByRole("dialog")).queryByText(/Puedes hacer cambios hasta/),
      ).toBeNull();
    });

    it("drops the deadline once the window closed", () => {
      render(
        <TattooDesignsView
          {...baseProps}
          locked
          saveStatus="locked"
          closingDayLabel="12 de septiembre"
        />,
      );

      open();

      expect(
        within(screen.getByRole("dialog")).queryByText(/Puedes hacer cambios hasta/),
      ).toBeNull();
    });

    it("is a view, not a step: no send or finish button, and closing keeps everything", async () => {
      render(<TattooDesignsView {...baseProps} designs={[design(1)]} />);

      open();
      const dialog = screen.getByRole("dialog");
      expect(within(dialog).queryByRole("button", { name: /Enviar|Finalizar|Confirmar/ })).toBeNull();

      fireEvent.click(within(dialog).getByRole("button", { name: "Cerrar" }));

      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      expect(screen.getByRole("button", { name: "Quitar de mis diseños: Diseño 1" })).toBeTruthy();
    });

    it("says so when nothing is selected yet", () => {
      render(<TattooDesignsView {...baseProps} />);

      open();

      const dialog = screen.getByRole("dialog");
      expect(within(dialog).getByText("Todavía no has subido nada.")).toBeTruthy();
      expect(within(dialog).getByText("Todavía no has elegido nada del catálogo.")).toBeTruthy();
    });
  });

  describe("catalog gallery", () => {
    it("splits the catalog into templates and final designs", () => {
      render(
        <TattooDesignsView
          {...baseProps}
          catalog={[
            { ...catalogItem(1), kind: "template" },
            { ...catalogItem(2), kind: "final" },
            catalogItem(3),
          ]}
        />,
      );

      const groups = screen.getAllByRole("heading", { level: 4 }).map((h) => h.textContent);
      expect(groups).toEqual(["Templates con tus fotos", "Diseños listos"]);
      expect(
        screen.getByText("Elige los que te gusten: les ponemos tu rostro usando tus selfies."),
      ).toBeTruthy();
      expect(screen.getByText("Se imprimen tal como los ves.")).toBeTruthy();
      expect(screen.getByText("Personalizable")).toBeTruthy();
      expect(screen.getByText("Listo para imprimir")).toBeTruthy();
      expect(screen.getByText("Toca un diseño para elegirlo.")).toBeTruthy();
    });

    it("hides a group when it has no designs", () => {
      render(
        <TattooDesignsView
          {...baseProps}
          catalog={[{ ...catalogItem(1), kind: "template" }]}
        />,
      );

      expect(screen.queryByRole("heading", { level: 4, name: "Diseños listos" })).toBeNull();
      expect(
        screen.getByRole("heading", { level: 4, name: "Templates con tus fotos" }),
      ).toBeTruthy();
    });

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

    it("counts uploads and chosen templates separately", () => {
      render(
        <TattooDesignsView
          {...baseProps}
          designs={[design(1)]}
          catalog={[catalogItem(1), catalogItem(2)]}
          chosen={[choice(1), choice(2)]}
        />,
      );

      expect(screen.getByText("1 de 10", { selector: "span" })).toBeTruthy();
      expect(screen.getByText("2 de 10", { selector: "span" })).toBeTruthy();
    });

    it("keeps uploading possible when the catalog choice is full, and the reverse", () => {
      const items = Array.from({ length: 11 }, (_, i) => catalogItem(i + 1));
      const { rerender } = render(
        <TattooDesignsView
          {...baseProps}
          designs={[design(1)]}
          catalog={items}
          chosen={items.slice(0, 10).map((it) => choice(it.id))}
        />,
      );
      expect(screen.getByText("Te quedan 9 espacios")).toBeTruthy();

      rerender(
        <TattooDesignsView
          {...baseProps}
          designs={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(design)}
          catalog={items}
          chosen={[choice(1)]}
        />,
      );
      expect(screen.queryByText(/Te quedan/)).toBeNull();
      expect(
        (screen.getByRole("button", { name: "Elegir Diseño catálogo 2" }) as HTMLButtonElement).disabled,
      ).toBe(false);
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

      expect(screen.getByText("1 de 10")).toBeTruthy();
      fireEvent.click(
        screen.getByRole("button", { name: "Quitar de mi selección: Diseño catálogo 9" }),
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
      expect(screen.queryByRole("button", { name: /Quitar|Elegir/ })).toBeNull();
    });
  });
});
