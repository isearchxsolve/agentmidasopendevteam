import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG, Lead, scoreLead } from "../src/scoring";

const now = new Date("2026-10-25T12:00:00.000Z");

const lead: Lead = {
  id: "l-1",
  name: "Priya Shah",
  company: "Atlas Corp",
  title: "CTO",
  companySize: "enterprise",
  source: "referral",
  estimatedBudget: 15000,
  emailOpens: 8,
  websiteVisits: 30,
  demoRequested: true,
  lastActivityAt: "2026-10-24T12:00:00.000Z"
};

describe("scoreLead", () => {
  it("scores, ranks, and explains a high-intent enterprise lead", () => {
    const result = scoreLead(lead, DEFAULT_CONFIG, now);

    expect(result.score).toBe(100);
    expect(result.tier).toBe("Hot");
    expect(result.reasons[0].label).toBe("Budget fit");
    expect(result.reasons.some((reason) => reason.label === "Demo requested")).toBe(true);
  });

  it("enforces configured tier thresholds", () => {
    const result = scoreLead(
      { ...lead, estimatedBudget: 0, emailOpens: 0, websiteVisits: 0, demoRequested: false },
      { ...DEFAULT_CONFIG, hotThreshold: 100, warmThreshold: 90 },
      now
    );

    expect(result.score).toBeLessThan(90);
    expect(result.tier).toBe("Nurture");
  });

  it("caps excessive activity and budget so one field cannot overflow score", () => {
    const result = scoreLead(
      { ...lead, estimatedBudget: Number.MAX_SAFE_INTEGER, emailOpens: 1_000_000, websiteVisits: 1_000_000 },
      DEFAULT_CONFIG,
      now
    );

    expect(result.score).toBe(100);
    expect(Number.isFinite(result.score)).toBe(true);
  });

  it("rejects malformed business data at the boundary", () => {
    expect(() => scoreLead({ ...lead, estimatedBudget: -1 }, DEFAULT_CONFIG, now))
      .toThrow("estimatedBudget must be a finite non-negative number.");
    expect(() => scoreLead({ ...lead, lastActivityAt: "not-a-date" }, DEFAULT_CONFIG, now))
      .toThrow("lastActivityAt must be a valid ISO-8601 date.");
    expect(() => scoreLead({ ...lead, name: " " }, DEFAULT_CONFIG, now))
      .toThrow("Lead id, name, and company are required.");
  });

  it("rejects invalid configurations rather than silently producing misleading results", () => {
    expect(() => scoreLead(lead, { ...DEFAULT_CONFIG, warmThreshold: 90, hotThreshold: 80 }, now))
      .toThrow("Thresholds must satisfy");
    expect(() => scoreLead(lead, { ...DEFAULT_CONFIG, engagementWeight: Number.NaN }, now))
      .toThrow("engagementWeight must be a finite non-negative number.");
  });

  it("is deterministic for identical lead, configuration, and clock inputs", () => {
    expect(scoreLead(lead, DEFAULT_CONFIG, now)).toEqual(scoreLead(lead, DEFAULT_CONFIG, now));
  });
});
