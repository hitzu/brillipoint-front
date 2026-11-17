// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PrepProfileAnswersView } from "./PrepProfileAnswersView";

afterEach(cleanup);

const asset = (n: number) => ({
  path: `7/x/${n}.png`,
  mime: "image/png",
  url: `https://cdn.example/${n}.png`,
});

describe("PrepProfileAnswersView", () => {
  it("tells the staff when the client has not answered anything yet", () => {
    render(<PrepProfileAnswersView answers={{}} />);

    expect(screen.getByText("Sin respuestas todavía.")).toBeTruthy();
  });

  it("shows each answer under its question label", () => {
    render(<PrepProfileAnswersView answers={{ makeup_idea: "Look natural" }} />);

    expect(
      screen.getByText("¿Qué idea general tienes para tu maquillaje?"),
    ).toBeTruthy();
    expect(screen.getByText("Look natural")).toBeTruthy();
  });

  it("shows the option label for radio answers and Sí/No for booleans", () => {
    render(
      <PrepProfileAnswersView
        answers={{ venue_type: "salon_eventos", prep_at_salon: true }}
      />,
    );

    expect(screen.getByText("Salón de eventos")).toBeTruthy();
    expect(screen.getByText("Sí")).toBeTruthy();
  });

  it("shows uploaded photos as thumbnails that open the image", () => {
    render(
      <PrepProfileAnswersView answers={{ face_photos: [asset(1), asset(2)] }} />,
    );

    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(2);
    expect(images[0].getAttribute("src")).toBe("https://cdn.example/1.png");
    expect(images[0].closest("a")?.getAttribute("href")).toBe(
      "https://cdn.example/1.png",
    );
  });

  it("shows the Glitter bar tattoo designs in their own section", () => {
    render(
      <PrepProfileAnswersView
        answers={{ tattoo_designs: [asset(1), asset(2), asset(3)] }}
      />,
    );

    const section = screen.getByRole("region", { name: "Diseños de tatuajes" });
    expect(within(section).getAllByRole("img")).toHaveLength(3);
    expect(within(section).getByText("3 de 10 fotos y diseños")).toBeTruthy();
  });

  it("renders nested object answers (dress, accessories)", () => {
    render(
      <PrepProfileAnswersView
        answers={{ dress: { has_dress: true, notes: "Escote corazón" } }}
      />,
    );

    expect(screen.getByText("Escote corazón")).toBeTruthy();
  });

  it("shows the designs chosen from the catalog with image and name", () => {
    render(
      <PrepProfileAnswersView
        answers={{
          tattoo_catalog_designs: [
            {
              carouselId: 3,
              title: "Mariposa",
              imageUrl: "https://cdn.example/mariposa.png",
            },
            {
              carouselId: 4,
              title: "Estrella",
              imageUrl: "https://cdn.example/estrella.png",
            },
          ],
        }}
      />,
    );

    const section = screen.getByRole("region", {
      name: "Diseños elegidos del catálogo",
    });
    expect(within(section).getAllByRole("img")).toHaveLength(2);
    expect(within(section).getByText("Mariposa")).toBeTruthy();
    expect(within(section).getByText("Estrella")).toBeTruthy();
    expect(
      within(section).getAllByRole("img")[0].closest("a")?.getAttribute("href"),
    ).toBe("https://cdn.example/mariposa.png");
  });

  it("counts uploaded designs and chosen templates separately", () => {
    render(
      <PrepProfileAnswersView
        answers={{
          tattoo_designs: [asset(1), asset(2)],
          tattoo_catalog_designs: [
            { carouselId: 3, title: "Mariposa", imageUrl: "https://cdn.example/m.png" },
          ],
        }}
      />,
    );

    expect(screen.getByText("2 de 10 fotos y diseños")).toBeTruthy();
    expect(screen.getByText("1 de 10 templates")).toBeTruthy();
  });

  it("does not print the raw catalog answer as an unknown field", () => {
    render(
      <PrepProfileAnswersView
        answers={{
          tattoo_catalog_designs: [
            { carouselId: 3, title: "Mariposa", imageUrl: "https://cdn.example/m.png" },
          ],
        }}
      />,
    );

    expect(screen.queryByText("tattoo_catalog_designs")).toBeNull();
  });
});
