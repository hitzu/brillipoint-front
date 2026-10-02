import assert from "node:assert/strict";
import test from "node:test";
import {
  LOCALE_STORAGE_KEY,
  LocaleStorage,
  readStoredLocale,
  writeStoredLocale,
} from "../localeStorage";

const createMemoryStorage = (initial: Record<string, string> = {}) => {
  const values = new Map(Object.entries(initial));
  const storage: LocaleStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
  return { storage, values };
};

const throwingStorage: LocaleStorage = {
  getItem: () => {
    throw new Error("SecurityError: storage blocked");
  },
  setItem: () => {
    throw new Error("QuotaExceededError");
  },
};

test("readStoredLocale returns a stored supported locale", () => {
  const { storage } = createMemoryStorage({ [LOCALE_STORAGE_KEY]: "en" });
  assert.equal(readStoredLocale(storage), "en");
});

test("readStoredLocale ignores unsupported or missing values", () => {
  assert.equal(readStoredLocale(createMemoryStorage({ [LOCALE_STORAGE_KEY]: "fr" }).storage), null);
  assert.equal(readStoredLocale(createMemoryStorage().storage), null);
});

test("readStoredLocale returns null when storage is unavailable or throws", () => {
  assert.equal(readStoredLocale(undefined), null);
  assert.equal(readStoredLocale(null), null);
  assert.equal(readStoredLocale(throwingStorage), null);
});

test("writeStoredLocale persists a supported locale under the party key", () => {
  const { storage, values } = createMemoryStorage();
  assert.equal(writeStoredLocale(storage, "en"), true);
  assert.equal(values.get(LOCALE_STORAGE_KEY), "en");
  assert.equal(readStoredLocale(storage), "en");
});

test("writeStoredLocale refuses unsupported locales", () => {
  const { storage, values } = createMemoryStorage();
  assert.equal(writeStoredLocale(storage, "fr"), false);
  assert.equal(values.has(LOCALE_STORAGE_KEY), false);
});

test("writeStoredLocale does not throw when storage is blocked", () => {
  assert.equal(writeStoredLocale(throwingStorage, "es"), false);
  assert.equal(writeStoredLocale(undefined, "es"), false);
});
