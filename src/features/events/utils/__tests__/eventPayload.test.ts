import { describe, expect, it } from "vitest";
import {
  buildCreateEventPayload,
  buildUpdateEventPayload,
} from "../eventPayload";

const DEPRECATED_KEYS = [
  "serviceTypeId",
  "serviceType",
  "serviceLocationUrl",
  "serviceStartsAt",
  "serviceEndsAt",
  "venueName",
  "printTemplate",
  "printTemplates",
  "decorativeIcon",
];

describe("buildCreateEventPayload", () => {
  it("maps form values to the slim create payload", () => {
    const payload = buildCreateEventPayload({
      contractId: "10",
      key: "20",
      eventType: "3",
      eventThemeId: "5",
      honoreesNames: "Ana y Luis",
      albumPhrase: "Nuestro para siempre",
      delegateName: "Maria",
      photoCount: "3",
    });

    expect(payload).toEqual({
      contractId: 10,
      key: "20",
      eventTypeId: 3,
      eventThemeId: 5,
      honoreesNames: "Ana y Luis",
      albumPhrase: "Nuestro para siempre",
      delegateName: "Maria",
      photoCount: 3,
    });
  });

  it("omits optional fields left blank", () => {
    const payload = buildCreateEventPayload({
      contractId: "10",
      key: "20",
      eventType: "3",
      eventThemeId: "",
      honoreesNames: "Ana y Luis",
      albumPhrase: "",
      delegateName: "",
      photoCount: "",
    });

    expect(payload).not.toHaveProperty("eventThemeId");
    expect(payload).not.toHaveProperty("delegateName");
    expect(payload).not.toHaveProperty("photoCount");
  });

  it("never includes deprecated fields", () => {
    const payload = buildCreateEventPayload({
      contractId: "10",
      key: "20",
      eventType: "3",
      eventThemeId: "5",
      honoreesNames: "Ana y Luis",
      albumPhrase: "Nuestro para siempre",
      delegateName: "Maria",
      photoCount: "3",
    });

    DEPRECATED_KEYS.forEach((deprecatedKey) => {
      expect(payload).not.toHaveProperty(deprecatedKey);
    });
  });
});

describe("buildUpdateEventPayload", () => {
  it("maps form values to the slim update payload", () => {
    const payload = buildUpdateEventPayload({
      key: "20",
      eventType: "3",
      eventThemeId: "5",
      honoreesNames: "Ana y Luis",
      albumPhrase: "Nuestro para siempre",
      delegateName: "Maria",
      photoCount: "3",
    });

    expect(payload).toEqual({
      key: "20",
      eventTypeId: 3,
      eventThemeId: 5,
      honoreesNames: "Ana y Luis",
      albumPhrase: "Nuestro para siempre",
      delegateName: "Maria",
      photoCount: 3,
    });
  });

  it("never includes deprecated fields", () => {
    const payload = buildUpdateEventPayload({
      key: "20",
      eventType: "3",
      eventThemeId: "",
      honoreesNames: "Ana y Luis",
      albumPhrase: "Nuestro para siempre",
      delegateName: "",
      photoCount: "",
    });

    DEPRECATED_KEYS.forEach((deprecatedKey) => {
      expect(payload).not.toHaveProperty(deprecatedKey);
    });
  });
});
