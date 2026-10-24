import assert from "node:assert/strict";
import test from "node:test";
import {
  ReferralValidationError,
  buildReferralUrl,
  normalizeSlug,
  validateDestinationUrl,
} from "./referralDomain";

const input = {
  slug: "Spring Partner",
  destinationUrl: "https://agentmidas.xyz/signup?plan=pro#ignored",
  baseReferralUrl: "https://agentmidas.xyz",
  utm: {
    source: "newsletter",
    medium: "email",
    campaign: "spring-launch",
    term: "enterprise",
    content: "hero-banner",
  },
};

test("buildReferralUrl normalizes slug, encodes values, and removes destination fragments", () => {
  const result = new URL(buildReferralUrl(input));

  assert.equal(result.pathname, "/r/spring-partner");
  assert.equal(result.searchParams.get("utm_source"), "newsletter");
  assert.equal(result.searchParams.get("utm_medium"), "email");
  assert.equal(result.searchParams.get("utm_campaign"), "spring-launch");
  assert.equal(result.searchParams.get("utm_term"), "enterprise");
  assert.equal(result.searchParams.get("utm_content"), "hero-banner");
  assert.equal(
    result.searchParams.get("redirect"),
    "https://agentmidas.xyz/signup?plan=pro",
  );
});

test("normalizeSlug produces safe URL path segments", () => {
  assert.equal(normalizeSlug("  My Partner!!!  "), "my-partner");
  assert.throws(() => normalizeSlug("ab"), ReferralValidationError);
  assert.throws(() => normalizeSlug("x".repeat(65)), ReferralValidationError);
});

test("destination validation blocks non-web protocols", () => {
  assert.throws(
    () => validateDestinationUrl("javascript:alert(1)"),
    ReferralValidationError,
  );
  assert.throws(
    () => validateDestinationUrl("data:text/html,owned"),
    ReferralValidationError,
  );
  assert.throws(
    () => validateDestinationUrl("ftp://example.com/file"),
    ReferralValidationError,
  );
});

test("destination validation blocks credentials and private targets", () => {
  assert.throws(
    () => validateDestinationUrl("https://user:password@example.com"),
    ReferralValidationError,
  );
  assert.throws(
    () => validateDestinationUrl("http://127.0.0.1:3000"),
    ReferralValidationError,
  );
  assert.throws(
    () => validateDestinationUrl("https://localhost/admin"),
    ReferralValidationError,
  );
  assert.throws(
    () => validateDestinationUrl("https://10.0.0.4/private"),
    ReferralValidationError,
  );
});

test("required UTM fields cannot be blank or injection-shaped", () => {
  assert.throws(
    () =>
      buildReferralUrl({
        ...input,
        utm: { ...input.utm, campaign: "" },
      }),
    ReferralValidationError,
  );
  assert.throws(
    () =>
      buildReferralUrl({
        ...input,
        utm: { ...input.utm, source: "<script>alert(1)</script>" },
      }),
    ReferralValidationError,
  );
});
