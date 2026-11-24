import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CROP_JPEG_QUALITY,
  canDecodeImage,
  canvasToCroppedFile,
  getCropOutput,
  isFullImageCrop,
} from "./cropImage";

const natural = { naturalWidth: 4000, naturalHeight: 3000 };

describe("isFullImageCrop", () => {
  it("is true when the box still covers the whole image", () => {
    expect(isFullImageCrop({ x: 0, y: 0, width: 4000, height: 3000 }, natural)).toBe(true);
  });

  it("absorbs one pixel of rounding noise", () => {
    expect(isFullImageCrop({ x: 1, y: 0, width: 3999, height: 3000 }, natural)).toBe(true);
  });

  it("is false as soon as the box was narrowed or moved", () => {
    expect(isFullImageCrop({ x: 0, y: 0, width: 3000, height: 3000 }, natural)).toBe(false);
    expect(isFullImageCrop({ x: 0, y: 200, width: 4000, height: 2800 }, natural)).toBe(false);
  });
});

describe("getCropOutput", () => {
  it("keeps a PNG as PNG so transparency survives", () => {
    expect(getCropOutput({ name: "diseno.png", type: "image/png" })).toEqual({
      mime: "image/png",
      fileName: "diseno.png",
    });
  });

  it("exports any other image as JPEG and fixes the extension", () => {
    expect(getCropOutput({ name: "selfie.HEIC", type: "image/heic" })).toEqual({
      mime: "image/jpeg",
      fileName: "selfie.jpg",
    });
    expect(getCropOutput({ name: "foto.webp", type: "image/webp" }).fileName).toBe("foto.jpg");
    expect(getCropOutput({ name: "sin-extension", type: "image/gif" }).fileName).toBe(
      "sin-extension.jpg",
    );
  });
});

describe("canvasToCroppedFile", () => {
  const fakeCanvas = (blob: Blob | null) => {
    const toBlob = vi.fn((cb: (b: Blob | null) => void) => cb(blob));
    return { canvas: { toBlob } as unknown as HTMLCanvasElement, toBlob };
  };

  it("encodes a photo as JPEG at 0.92 with the new name and mime", async () => {
    const original = new File(["orig"], "selfie.png.heic", { type: "image/heic" });
    const { canvas, toBlob } = fakeCanvas(new Blob(["x"], { type: "image/jpeg" }));

    const file = await canvasToCroppedFile(canvas, original);

    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), "image/jpeg", CROP_JPEG_QUALITY);
    expect(CROP_JPEG_QUALITY).toBe(0.92);
    expect(file.name).toBe("selfie.png.jpg");
    expect(file.type).toBe("image/jpeg");
  });

  it("encodes a PNG as PNG without a quality argument", async () => {
    const original = new File(["orig"], "diseno.png", { type: "image/png" });
    const { canvas, toBlob } = fakeCanvas(new Blob(["x"], { type: "image/png" }));

    const file = await canvasToCroppedFile(canvas, original);

    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), "image/png", undefined);
    expect(file.name).toBe("diseno.png");
    expect(file.type).toBe("image/png");
  });

  it("rejects when the browser cannot produce a blob", async () => {
    const original = new File(["orig"], "a.png", { type: "image/png" });
    const { canvas } = fakeCanvas(null);

    await expect(canvasToCroppedFile(canvas, original)).rejects.toThrow();
  });
});

describe("canDecodeImage", () => {
  afterEach(() => vi.unstubAllGlobals());

  const stubImage = (outcome: "load" | "error", size = { w: 10, h: 10 }) => {
    class FakeImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      naturalWidth = size.w;
      naturalHeight = size.h;
      set src(_value: string) {
        queueMicrotask(() => (outcome === "load" ? this.onload?.() : this.onerror?.()));
      }
    }
    vi.stubGlobal("Image", FakeImage);
  };

  it("is true when the browser decodes the image", async () => {
    stubImage("load");
    await expect(canDecodeImage("blob:ok")).resolves.toBe(true);
  });

  it("is false when the browser cannot open it (e.g. HEIC on desktop)", async () => {
    stubImage("error");
    await expect(canDecodeImage("blob:heic")).resolves.toBe(false);
  });

  it("is false when it loads with no size", async () => {
    stubImage("load", { w: 0, h: 0 });
    await expect(canDecodeImage("blob:empty")).resolves.toBe(false);
  });
});
