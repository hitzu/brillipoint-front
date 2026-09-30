import { describe, expect, it, vi, beforeEach, afterAll } from "vitest";

vi.mock("../../config/axiosConfig", () => ({
  axiosInstanceWithToken: {
    post: vi.fn(),
  },
}));

import { axiosInstanceWithToken } from "../../config/axiosConfig";
import {
  createThemeAssetUploadUrl,
  uploadThemeAssetBlobToSignedUrl,
} from "../themeAssetsService";

const mockedPost = axiosInstanceWithToken.post as unknown as ReturnType<
  typeof vi.fn
>;

beforeEach(() => {
  mockedPost.mockReset();
});

describe("createThemeAssetUploadUrl", () => {
  it("requests a signed upload url for the event background slot", async () => {
    const responseData = {
      bucket: "theme-assets",
      path: "events/7/background.png",
      signedUrl: "https://signed/put",
      token: "tok",
      publicUrl: "https://public/events/7/background.png",
    };
    mockedPost.mockResolvedValueOnce({ data: responseData });

    const payload = {
      ownerType: "event" as const,
      ownerId: 7,
      slot: "background" as const,
      fileName: "background.png",
      mime: "image/png" as const,
    };

    const result = await createThemeAssetUploadUrl(payload);

    expect(mockedPost).toHaveBeenCalledWith("/theme-assets/upload-url", payload);
    expect(result).toEqual(responseData);
  });
});

describe("uploadThemeAssetBlobToSignedUrl", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("PUTs the blob to the signed url with the given mime type", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
    });
    const blob = new Blob(["fake-bytes"], { type: "image/png" });

    await uploadThemeAssetBlobToSignedUrl({
      signedUrl: "https://signed/put",
      blob,
      mime: "image/png",
    });

    expect(global.fetch).toHaveBeenCalledWith("https://signed/put", {
      method: "PUT",
      headers: { "Content-Type": "image/png" },
      body: blob,
    });
  });

  it("throws when the PUT response is not ok", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 403,
    });
    const blob = new Blob(["fake-bytes"], { type: "image/png" });

    await expect(
      uploadThemeAssetBlobToSignedUrl({
        signedUrl: "https://signed/put",
        blob,
        mime: "image/png",
      }),
    ).rejects.toThrow("Theme asset upload failed with status 403");
  });
});
