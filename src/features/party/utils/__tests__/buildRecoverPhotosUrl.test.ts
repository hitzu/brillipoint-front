import assert from "node:assert/strict";
import test from "node:test";
import { buildRecoverPhotosUrl } from "../buildRecoverPhotosUrl";

const messageOf = (url: string) =>
  decodeURIComponent(new URL(url).searchParams.get("text") ?? "");

test("buildRecoverPhotosUrl writes the Spanish request with a long date", () => {
  const url = buildRecoverPhotosUrl("es", {
    phone: "+52 1 221 577 5211",
    eventName: "Ana y Luis",
    eventDate: "2026-05-30",
  });

  assert.ok(url.startsWith("https://wa.me/5212215775211?text="));
  assert.equal(
    messageOf(url),
    "Hola Brillipoint, necesito recuperar las fotos del evento Ana y Luis del 30 de mayo de 2026. Mi nombre es...",
  );
});

test("buildRecoverPhotosUrl writes the English request with a long date", () => {
  const url = buildRecoverPhotosUrl("en", {
    phone: "5212215775211",
    eventName: "Ana y Luis",
    eventDate: "2026-05-30T00:00:00.000Z",
  });

  assert.equal(
    messageOf(url),
    "Hi Brillipoint, I need to recover the photos from the Ana y Luis event on May 30, 2026. My name is...",
  );
});

test("buildRecoverPhotosUrl keeps an unparseable date as-is", () => {
  const url = buildRecoverPhotosUrl("en", {
    phone: "5212215775211",
    eventName: "Ana",
    eventDate: "soon",
  });

  assert.match(messageOf(url), /event on soon\./);
});
