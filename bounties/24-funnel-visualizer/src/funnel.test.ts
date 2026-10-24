import { describe, expect, it } from "vitest";
import {
  buildFunnelStages,
  formatMetric,
  FunnelValidationError,
  MAX_STAGES,
} from "./funnel";

describe("buildFunnelStages", () => {
  const stages = [
    { id: "visited", label: "Visitors", value: 1000 },
    { id: "trial", label: "Trial Started", value: 250 },
    { id: "paid", label: "Paid Customer", value: 50, color: "#00AA88" },
  ] as const;

  it("calculates widths and conversion ratios deterministically", () => {
    const result = buildFunnelStages(stages);

    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({
      widthPercent: 100,
      conversionFromPrevious: null,
      conversionFromFirst: 100,
    });
    expect(result[1]).toMatchObject({
      widthPercent: 25,
      conversionFromPrevious: 25,
      conversionFromFirst: 25,
    });
    expect(result[2]).toMatchObject({
      widthPercent: 5,
      conversionFromPrevious: 20,
      conversionFromFirst: 5,
      color: "#00AA88",
    });
  });

  it("handles a zero baseline without division errors", () => {
    const result = buildFunnelStages([
      { id: "first", label: "First", value: 0 },
      { id: "second", label: "Second", value: 0 },
    ]);

    expect(result[0].widthPercent).toBe(0);
    expect(result[1].conversionFromPrevious).toBe(0);
    expect(result[1].conversionFromFirst).toBe(0);
  });

  it("returns an empty funnel for an empty dataset", () => {
    expect(buildFunnelStages([])).toEqual([]);
  });

  it("rejects duplicate IDs", () => {
    expect(() =>
      buildFunnelStages([
        { id: "same", label: "One", value: 1 },
        { id: "same", label: "Two", value: 2 },
      ]),
    ).toThrow(FunnelValidationError);
  });

  it("rejects unsafe labels, invalid IDs, colors, and values", () => {
    expect(() =>
      buildFunnelStages([{ id: "<script>", label: "Safe", value: 1 }]),
    ).toThrow("id must contain only");

    expect(() =>
      buildFunnelStages([{ id: "one", label: "", value: 1 }]),
    ).toThrow("label must be");

    expect(() =>
      buildFunnelStages([{ id: "one", label: "One", value: -1 }]),
    ).toThrow("value must be");

    expect(() =>
      buildFunnelStages([
        { id: "one", label: "One", value: 1, color: "url(javascript:bad)" },
      ]),
    ).toThrow("color must be");
  });

  it("enforces the maximum stage boundary", () => {
    const input = Array.from({ length: MAX_STAGES + 1 }, (_, index) => ({
      id: `stage-${index}`,
      label: `Stage ${index}`,
      value: index,
    }));

    expect(() => buildFunnelStages(input)).toThrow("at most");
  });

  it("formats metrics safely for display", () => {
    expect(formatMetric(1234567, "en-US")).toBe("1,234,567");
  });
});
