import { beforeEach, describe, expect, it, vi } from "vitest";

const http = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("../config/axiosConfig", () => ({ axiosInstanceWithoutToken: http }));

import { getPhotoExamples, getTattooCatalog } from "./tattooCatalogService";

const row = (id: number, title: string) => ({ id, title, imageUrl: `https://cdn/${id}.png` });

beforeEach(() => http.get.mockReset());

describe("tattooCatalogService", () => {
  it("reads templates, finals and legacy rows, tagging each kind", async () => {
    http.get
      .mockResolvedValueOnce({ data: [row(1, "Alas")] })
      .mockResolvedValueOnce({ data: [row(2, "Luna")] })
      .mockResolvedValueOnce({ data: [row(3, "Viejo")] });

    const items = await getTattooCatalog();

    expect(items.map((i) => [i.id, i.kind])).toEqual([
      [1, "template"],
      [2, "final"],
      [3, "final"],
    ]);
    expect(http.get.mock.calls.map((c) => c[1].params.section)).toEqual([
      "tattoo-templates",
      "tattoo-finals",
      "tattoo-designs",
    ]);
  });

  it("reads the photo examples from their own section, without a kind", async () => {
    http.get.mockResolvedValue({ data: [row(9, "Selfie de frente")] });

    const items = await getPhotoExamples();

    expect(http.get).toHaveBeenCalledWith("/carousels", {
      params: { page: "reservation", section: "photos-examples" },
    });
    expect(items).toEqual([
      { id: 9, title: "Selfie de frente", imageUrl: "https://cdn/9.png" },
    ]);
  });
});
