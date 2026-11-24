import { beforeEach, describe, expect, it, vi } from "vitest";

const http = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("../config/axiosConfig", () => ({ axiosInstanceWithoutToken: http }));

import { getTattooCatalog } from "./tattooCatalogService";

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
});
