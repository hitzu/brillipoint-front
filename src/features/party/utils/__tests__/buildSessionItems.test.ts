import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSessionItems,
  getPhotoItems,
  localizeSessionItems,
} from "../buildSessionItems";
import { SessionResponse } from "../../../../interfaces/eventGallery";

const baseSession = (
  photos: SessionResponse["photos"],
): SessionResponse => ({
  sessionToken: "session-1",
  status: "active",
  photos,
  event: { honoreesNames: "Ana", date: "2026-01-01" },
});

test("buildSessionItems: src uses minimizedUrl when present, originalSrc always the original", () => {
  const items = buildSessionItems(
    baseSession([
      { url: "https://cdn.test/a.jpg", minimizedUrl: "https://cdn.test/a-min.jpg", position: 0 },
    ]),
  );

  assert.equal(items.length, 1);
  assert.equal(items[0].src, "https://cdn.test/a-min.jpg");
  assert.equal(items[0].originalSrc, "https://cdn.test/a.jpg");
  assert.equal(items[0].type, "photo");
});

test("buildSessionItems: falls back to url when minimizedUrl is absent — photo is never dropped", () => {
  const items = buildSessionItems(
    baseSession([{ url: "https://cdn.test/b.jpg", position: 0 }]),
  );

  assert.equal(items.length, 1);
  assert.equal(items[0].src, "https://cdn.test/b.jpg");
  assert.equal(items[0].originalSrc, "https://cdn.test/b.jpg");
});

test("buildSessionItems: keeps every photo, mixed minimized/absent", () => {
  const items = buildSessionItems(
    baseSession([
      { url: "https://cdn.test/a.jpg", minimizedUrl: "https://cdn.test/a-min.jpg", position: 0 },
      { url: "https://cdn.test/b.jpg", position: 1 },
      { url: "https://cdn.test/c.jpg", minimizedUrl: null, position: 2 },
    ]),
  );

  assert.equal(items.length, 3);
  assert.deepEqual(
    items.map((item) => item.src),
    [
      "https://cdn.test/a-min.jpg",
      "https://cdn.test/b.jpg",
      "https://cdn.test/c.jpg",
    ],
  );
});

test("buildSessionItems: never produces a gif type item", () => {
  const items = buildSessionItems(
    baseSession([{ url: "https://cdn.test/animated.gif", position: 0 }]),
  );

  assert.equal(items.length, 1);
  assert.equal(items[0].type, "photo");
});

test("buildSessionItems: returns an empty array when photos is missing", () => {
  const session = { ...baseSession([]), photos: undefined } as unknown as SessionResponse;
  const items = buildSessionItems(session);

  assert.deepEqual(items, []);
});

test("getPhotoItems: returns all items (type is always photo)", () => {
  const items = buildSessionItems(
    baseSession([
      { url: "https://cdn.test/a.jpg", position: 0 },
      { url: "https://cdn.test/b.jpg", position: 1 },
    ]),
  );

  assert.equal(getPhotoItems(items).length, 2);
});

test("buildSessionItems: alt text follows the locale and names the event", () => {
  const session = baseSession([{ url: "https://cdn.test/a.jpg", position: 0 }]);

  assert.equal(buildSessionItems(session)[0].alt, "Foto 1 de Ana");
  assert.equal(buildSessionItems(session, "en")[0].alt, "Photo 1 from Ana");
});

test("localizeSessionItems: rewrites alt text for a new locale, with a fallback event name", () => {
  const items = buildSessionItems(
    { ...baseSession([{ url: "https://cdn.test/a.jpg", position: 0 }]), event: undefined as unknown as SessionResponse["event"] },
  );

  assert.equal(items[0].alt, "Foto 1 de tu evento");
  assert.equal(localizeSessionItems(items, "en", null)[0].alt, "Photo 1 from your event");
  assert.equal(localizeSessionItems(items, "en", "Ana")[0].alt, "Photo 1 from Ana");
});
