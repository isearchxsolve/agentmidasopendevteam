import assert from "node:assert/strict";
import test from "node:test";
import {
  createI18n,
  detectLocale,
  interpolate,
  isSupportedLocale,
  loadLocale,
  normalizeLocale
} from "../src/i18n/core.js";

test("accepts only the audited locale allowlist", () => {
  assert.equal(isSupportedLocale("en"), true);
  assert.equal(isSupportedLocale("de"), false);
  assert.equal(isSupportedLocale("__proto__"), false);
  assert.equal(isSupportedLocale(null), false);
});

test("normalizes browser locale formats and safely falls back", () => {
  assert.equal(normalizeLocale("ES_mx"), "es");
  assert.equal(normalizeLocale("fr-CA"), "fr");
  assert.equal(normalizeLocale("javascript:alert(1)"), "en");
  assert.equal(normalizeLocale({}), "en");
  assert.equal(detectLocale(["zz-ZZ", "pt-BR"]), "pt");
});

test("loads only statically mapped catalog modules", async () => {
  const catalog = await loadLocale("fr");
  assert.equal(catalog["action.save"], "Enregistrer");
  assert.equal((await loadLocale("en"))["app.name"], "Agent Midas");
});

test("falls back to English, then to the literal key", () => {
  const i18n = createI18n("es", { "action.save": "Guardar" });

  assert.equal(i18n.t("action.save"), "Guardar");
  assert.equal(i18n.t("action.cancel"), "Cancel");
  assert.equal(i18n.t("unknown.key"), "unknown.key");
  assert.equal(i18n.t("__proto__"), "__proto__");
});

test("interpolation handles primitives and preserves unresolved tokens", () => {
  assert.equal(
    interpolate("Hello, {name}; {count}; {enabled}.", {
      name: "Ada",
      count: 3,
      enabled: false
    }),
    "Hello, Ada; 3; false."
  );

  assert.equal(
    interpolate("Hello {name}; {missing}.", { name: "<script>alert(1)</script>" }),
    "Hello <script>alert(1)</script>; {missing}."
  );

  assert.equal(interpolate("Invalid {name}.", { name: Infinity }), "Invalid .");
});

test("formatters reject invalid values without throwing", () => {
  const i18n = createI18n("en", {});
  assert.equal(i18n.formatNumber(Number.NaN), "");
  assert.equal(i18n.formatDate(Number.NaN), "");
  assert.match(i18n.formatNumber(1234), /1[,.]?234/);
});
