import assert from "node:assert/strict";
import test from "node:test";
import { inferMimeTypeFromExtension, sharePhoto, shareUrl } from "../mediaActions";

const setNavigator = (value: unknown) => {
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value,
  });
};

test("shareUrl sends text and url separately to native share", async () => {
  let sharePayload: unknown;

  setNavigator({
    share: async (payload: unknown) => {
      sharePayload = payload;
    },
  });

  const result = await shareUrl("https://example.com/sesion", "Fotos de Christian", {
    text: "Mira mis fotos de Christian 📸",
  });

  assert.equal(result, "shared");
  assert.deepEqual(sharePayload, {
    title: "Fotos de Christian",
    text: "Mira mis fotos de Christian 📸",
    url: "https://example.com/sesion",
  });
});

test("shareUrl copies fallback text when native share is unavailable", async () => {
  let copiedText = "";

  setNavigator({
    clipboard: {
      writeText: async (value: string) => {
        copiedText = value;
      },
    },
  });

  const result = await shareUrl("https://example.com/sesion", "Fotos de Christian", {
    fallbackText: "Mira mis fotos de Christian 📸 https://example.com/sesion",
    text: "Mira mis fotos de Christian 📸",
  });

  assert.equal(result, "copied");
  assert.equal(
    copiedText,
    "Mira mis fotos de Christian 📸 https://example.com/sesion",
  );
});

test("inferMimeTypeFromExtension resolves jpg to image/jpeg", () => {
  assert.equal(inferMimeTypeFromExtension("jpg"), "image/jpeg");
});

test("inferMimeTypeFromExtension no longer special-cases gif (GIF feature removed)", () => {
  assert.equal(inferMimeTypeFromExtension("gif"), "application/octet-stream");
});

test("sharePhoto uses the caller's translated title for the native share sheet", async () => {
  let sharePayload: { title?: string } | undefined;
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async () =>
    new Response(new Blob(["x"], { type: "image/jpeg" }), {
      status: 200,
      headers: { "content-type": "image/jpeg" },
    })) as typeof fetch;
  setNavigator({
    canShare: () => true,
    share: async (payload: { title?: string }) => {
      sharePayload = payload;
    },
  });

  try {
    const result = await sharePhoto(
      "https://example.com/photo.jpg",
      "Christian",
      "A keepsake from Christian",
    );

    assert.equal(result, "shared");
    assert.equal(sharePayload?.title, "A keepsake from Christian");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
