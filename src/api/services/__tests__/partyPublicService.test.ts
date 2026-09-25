import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../config/axiosConfig", () => ({
  axiosInstanceWithoutToken: {
    get: vi.fn(),
  },
}));

import { axiosInstanceWithoutToken } from "../../config/axiosConfig";
import { getEventPhotosPage, getPublicEventByToken } from "../partyPublicService";

const mockedGet = axiosInstanceWithoutToken.get as unknown as ReturnType<
  typeof vi.fn
>;

describe("getEventPhotosPage", () => {
  it("never drops a photo when minimizedPublicUrl is absent (approval test — pass-through by design)", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        items: [
          {
            id: 1,
            storagePath: "a.jpg",
            publicUrl: "https://cdn.test/a.jpg",
            minimizedPublicUrl: "https://cdn.test/a-min.jpg",
            consentAt: "2026-01-01",
            createdAt: "2026-01-01",
          },
          {
            id: 2,
            storagePath: "b.jpg",
            publicUrl: "https://cdn.test/b.jpg",
            consentAt: "2026-01-01",
            createdAt: "2026-01-01",
          },
        ],
        hasMore: false,
        nextCursor: null,
      },
    });

    const result = await getEventPhotosPage("tok123");

    expect(result.items).toHaveLength(2);
    expect(result.items[0].minimizedPublicUrl).toBe(
      "https://cdn.test/a-min.jpg",
    );
    expect(result.items[0].publicUrl).toBe("https://cdn.test/a.jpg");
    expect(result.items[1].minimizedPublicUrl).toBeUndefined();
    expect(result.items[1].publicUrl).toBe("https://cdn.test/b.jpg");
  });
});

describe("getPublicEventByToken", () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it("reads the public event from the v2 endpoint", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        id: 1,
        key: "20",
        token: "tok123",
        contractId: 5,
        honoreesNames: "Ana y Luis",
        albumPhrase: "Nuestro para siempre",
        bookingId: 3,
        status: "active",
        photoCount: 3,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    });

    await getPublicEventByToken("tok123");

    expect(mockedGet).toHaveBeenCalledWith("/v2/events/tok123");
  });

  it("normalizes the v2 response into a PublicEvent", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        id: 1,
        key: "20",
        token: "tok123",
        contractId: 5,
        honoreesNames: "Ana y Luis",
        albumPhrase: "Nuestro para siempre",
        bookingId: 3,
        status: "active",
        photoCount: 3,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-02",
      },
    });

    const result = await getPublicEventByToken("tok123");

    expect(result).toEqual({
      id: 1,
      token: "tok123",
      name: "Ana y Luis",
      description: "Nuestro para siempre",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-02",
    });
  });
});
