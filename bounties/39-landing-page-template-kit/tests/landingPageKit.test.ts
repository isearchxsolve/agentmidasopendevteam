import assert from "node:assert/strict";
import test from "node:test";
import { getTemplate, isValidEmail, safeHref, templates } from "../src/catalogue.js";

test("catalogue exposes exactly five uniquely identified templates", () => {
  assert.equal(templates.length, 5);
  assert.equal(new Set(templates.map((template) => template.id)).size, 5);

  for (const template of templates) {
    assert.ok(template.headline.length > 20);
    assert.ok(template.description.length > 30);
    assert.equal(template.proof.length, 3);
  }
});

test("getTemplate resolves known templates and safely falls back", () => {
  assert.equal(getTemplate("creator").id, "creator");
  assert.equal(getTemplate("untrusted-input").id, "saas");
});

test("safeHref permits only explicit web and mail protocols", () => {
  assert.match(safeHref("https://agentmidas.xyz") ?? "", /^https:/);
  assert.match(safeHref("mailto:team@agentmidas.xyz") ?? "", /^mailto:/);
  assert.equal(safeHref("javascript:alert(1)"), null);
  assert.equal(safeHref("data:text/html,<script>alert(1)</script>"), null);
  assert.equal(safeHref("file:///etc/passwd"), null);
});

test("email validation accepts conventional addresses and rejects hostile boundaries", () => {
  assert.equal(isValidEmail("architect@example.com"), true);
  assert.equal(isValidEmail("  architect@example.com  "), true);
  assert.equal(isValidEmail("not-an-email"), false);
  assert.equal(isValidEmail("user@localhost"), false);
  assert.equal(isValidEmail("a".repeat(255) + "@example.com"), false);
});
