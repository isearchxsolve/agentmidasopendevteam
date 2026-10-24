export const MAX_STAGES = 20;
export const MAX_LABEL_LENGTH = 120;
export const MAX_VALUE = 1_000_000_000_000;

export type FunnelStageInput = Readonly<{
  id: string;
  label: string;
  value: number;
  color?: string;
}>;

export type FunnelStage = Readonly<{
  id: string;
  label: string;
  value: number;
  color: string;
  widthPercent: number;
  conversionFromPrevious: number | null;
  conversionFromFirst: number;
}>;

const DEFAULT_COLORS = [
  "#D4AF37",
  "#B88A21",
  "#96701B",
  "#735516",
  "#513B10",
] as const;

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const SAFE_ID = /^[a-zA-Z0-9_-]{1,64}$/;

export class FunnelValidationError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "FunnelValidationError";
  }
}

function percentage(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 10_000) / 100;
}

function assertStage(input: FunnelStageInput, index: number): void {
  if (!input || typeof input !== "object") {
    throw new FunnelValidationError(`Stage ${index + 1} must be an object.`);
  }

  if (typeof input.id !== "string" || !SAFE_ID.test(input.id)) {
    throw new FunnelValidationError(
      `Stage ${index + 1} id must contain only letters, digits, underscores, or hyphens.`,
    );
  }

  if (
    typeof input.label !== "string" ||
    input.label.trim().length === 0 ||
    input.label.length > MAX_LABEL_LENGTH
  ) {
    throw new FunnelValidationError(
      `Stage ${index + 1} label must be between 1 and ${MAX_LABEL_LENGTH} characters.`,
    );
  }

  if (
    typeof input.value !== "number" ||
    !Number.isSafeInteger(input.value) ||
    input.value < 0 ||
    input.value > MAX_VALUE
  ) {
    throw new FunnelValidationError(
      `Stage ${index + 1} value must be a safe integer between 0 and ${MAX_VALUE}.`,
    );
  }

  if (input.color !== undefined && !HEX_COLOR.test(input.color)) {
    throw new FunnelValidationError(
      `Stage ${index + 1} color must be a six-digit hexadecimal color.`,
    );
  }
}

export function buildFunnelStages(
  input: readonly FunnelStageInput[],
): readonly FunnelStage[] {
  if (!Array.isArray(input)) {
    throw new FunnelValidationError("Stages must be an array.");
  }

  if (input.length === 0) return [];

  if (input.length > MAX_STAGES) {
    throw new FunnelValidationError(`A funnel can contain at most ${MAX_STAGES} stages.`);
  }

  const seenIds = new Set<string>();

  input.forEach((stage, index) => {
    assertStage(stage, index);
    if (seenIds.has(stage.id)) {
      throw new FunnelValidationError(`Duplicate stage id: ${stage.id}.`);
    }
    seenIds.add(stage.id);
  });

  const firstValue = input[0].value;
  const maximum = Math.max(...input.map((stage) => stage.value), 1);

  return input.map((stage, index) => {
    const previous = index > 0 ? input[index - 1].value : null;

    return Object.freeze({
      id: stage.id,
      label: stage.label.trim(),
      value: stage.value,
      color: stage.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length],
      widthPercent: percentage(stage.value, maximum),
      conversionFromPrevious:
        previous === null ? null : percentage(stage.value, previous),
      conversionFromFirst: percentage(stage.value, firstValue),
    });
  });
}

export function formatMetric(value: number, locale = "en-US"): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);
}
