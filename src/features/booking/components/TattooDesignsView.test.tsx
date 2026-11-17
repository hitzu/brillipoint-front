// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
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

    expect(screen.getByText("2 de 10")).toBeTruthy();
    expect(screen.getAllByRole("img")).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: /Quitar de mis diseños/ })).toHaveLength(2);
    expect(screen.getByText(/te quedan/)).toBeTruthy();
  });

  it("hides the uploader once 10 designs are loaded", () => {
    render(
      <TattooDesignsView
        {...baseProps}
        designs={[1,2,3,4,5,6,7,8,9,10].map(design)}
      />,
    );

    expect(screen.getByText("10 de 10")).toBeTruthy();
    expect(screen.queryByText(/te quedan/)).toBeNull();
    expect(screen.getByText(/Ya tienes tus 10 fotos y diseños/)).toBeTruthy();
  });

  it("always shows 10 upload places and chosen templates never take one", () => {
    render(
      <TattooDesignsView {...baseProps} designs={[design(1)]} chosen={[choice(1), choice(2)]} />,
    );

    expect(screen.getAllByText("Lugar libre")).toHaveLength(9);
    expect(screen.getByText("1 de 10", { selector: "span" })).toBeTruthy();
    expect(screen.getByText("2 de 10", { selector: "span" })).toBeTruthy();
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
    expect(screen.queryByText(/te quedan/)).toBeNull();
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

  it("explains that only 5 final tattoos are printed and in which priority", () => {
    render(<TattooDesignsView {...baseProps} />);

    const note = screen.getByRole("note");
    expect(note.textContent).toContain("Solo se imprimen 5 tatuajes finales");
    const items = Array.from(note.querySelectorAll("li")).map((li) => li.textContent);
    expect(items).toEqual([
      "Diseño final que cargues.",
      "Personalizados: templates trabajados con tus fotos.",
      "Diseños propios de nuestro catálogo.",
    ]);
  });

  it("warns that photos may be used to personalize templates without guarantee", () => {
    render(<TattooDesignsView {...baseProps} />);

    expect(
      screen.getByText(/podrán usarse para personalizar los templates, pero no aseguramos/),
    ).toBeTruthy();
  });

  it("opens the photo examples in a modal from a button, and hides the button when read-only", () => {
    const examples = [catalogItem(1), catalogItem(2)];
    const { rerender } = render(<TattooDesignsView {...baseProps} examples={examples} />);

    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Ver ejemplos de buenas fotos" }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Ejemplos de buenas fotos")).toBeTruthy();
    expect(within(dialog).getAllByRole("img")).toHaveLength(2);

    fireEvent.click(within(dialog).getByRole("button", { name: "Cerrar" }));
    rerender(<TattooDesignsView {...baseProps} examples={examples} locked />);
    expect(screen.queryByRole("button", { name: "Ver ejemplos de buenas fotos" })).toBeNull();
  });

  it("has no examples button when there are no examples", () => {
    render(<TattooDesignsView {...baseProps} />);

    expect(screen.queryByRole("button", { name: "Ver ejemplos de buenas fotos" })).toBeNull();
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
      expect(groups).toEqual(["Templates personalizables", "Diseños finales"]);
    });

    it("hides a group when it has no designs", () => {
      render(
        <TattooDesignsView
          {...baseProps}
          catalog={[{ ...catalogItem(1), kind: "template" }]}
        />,
      );

      expect(screen.queryByText("Diseños finales")).toBeNull();
      expect(screen.getByText("Templates personalizables")).toBeTruthy();
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
      expect(screen.getByText(/te quedan 9 lugares/)).toBeTruthy();

      rerender(
        <TattooDesignsView
          {...baseProps}
          designs={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(design)}
          catalog={items}
          chosen={[choice(1)]}
        />,
      );
      expect(screen.queryByText(/te quedan/)).toBeNull();
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
