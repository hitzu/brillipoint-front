import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../../config/axiosConfig", () => ({
  axiosInstanceWithToken: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { axiosInstanceWithToken } from "../../config/axiosConfig";
import {
  createEvent,
  deleteEventById,
  getEventById,
  getEvents,
  updateEventById,
} from "../eventsService";

const mockedGet = axiosInstanceWithToken.get as unknown as ReturnType<
  typeof vi.fn
>;
const mockedPost = axiosInstanceWithToken.post as unknown as ReturnType<
  typeof vi.fn
>;
const mockedPatch = axiosInstanceWithToken.patch as unknown as ReturnType<
  typeof vi.fn
>;
const mockedDelete = axiosInstanceWithToken.delete as unknown as ReturnType<
  typeof vi.fn
>;

beforeEach(() => {
  mockedGet.mockReset();
  mockedPost.mockReset();
  mockedPatch.mockReset();
  mockedDelete.mockReset();
});

describe("getEvents", () => {
  it("reads the event list from the v2 endpoint", async () => {
    mockedGet.mockResolvedValueOnce({ data: [] });

    await getEvents();

    expect(mockedGet).toHaveBeenCalledWith("/v2/events");
  });
});

describe("getEventById", () => {
  it("reads a single event from the v2 endpoint", async () => {
    mockedGet.mockResolvedValueOnce({ data: {} });

    await getEventById(42);

    expect(mockedGet).toHaveBeenCalledWith("/v2/events/id/42");
  });
});

describe("createEvent", () => {
  it("sends only the allowed writable fields to the v1 create endpoint", async () => {
    mockedPost.mockResolvedValueOnce({ data: {} });

    const payload = {
      contractId: 1,
      key: "20",
      eventTypeId: 3,
      honoreesNames: "Ana y Luis",
      albumPhrase: "Nuestro para siempre",
      delegateName: "Maria",
      photoCount: 3,
      eventThemeId: 5,
    };

    await createEvent(payload);

    expect(mockedPost).toHaveBeenCalledWith("/events", payload);
    const sentPayload = mockedPost.mock.calls[0][1];
    const sentKeys = Object.keys(sentPayload);
    expect(sentKeys).not.toContain("serviceTypeId");
    expect(sentKeys).not.toContain("serviceType");
    expect(sentKeys).not.toContain("venueName");
    expect(sentKeys).not.toContain("serviceLocationUrl");
    expect(sentKeys).not.toContain("serviceStartsAt");
    expect(sentKeys).not.toContain("serviceEndsAt");
    expect(sentKeys).not.toContain("printTemplate");
    expect(sentKeys).not.toContain("printTemplates");
  });
});

describe("updateEventById", () => {
  it("sends only the allowed writable fields to the v1 patch endpoint", async () => {
    mockedPatch.mockResolvedValueOnce({ data: undefined });

    const payload = {
      key: "20",
      eventTypeId: 3,
      honoreesNames: "Ana y Luis",
      albumPhrase: "Nuestro para siempre",
      delegateName: "Maria",
      photoCount: 3,
      eventThemeId: 5,
    };

    await updateEventById(7, payload);

    expect(mockedPatch).toHaveBeenCalledWith("/events/7", payload);
    const sentPayload = mockedPatch.mock.calls[0][1];
    const sentKeys = Object.keys(sentPayload);
    expect(sentKeys).not.toContain("serviceTypeId");
    expect(sentKeys).not.toContain("venueName");
    expect(sentKeys).not.toContain("serviceStartsAt");
    expect(sentKeys).not.toContain("serviceEndsAt");
    expect(sentKeys).not.toContain("printTemplate");
    expect(sentKeys).not.toContain("printTemplates");
  });
});

describe("deleteEventById", () => {
  it("deletes through the v1 endpoint", async () => {
    mockedDelete.mockResolvedValueOnce({});

    await deleteEventById(9);

    expect(mockedDelete).toHaveBeenCalledWith("/events/9");
  });
});
