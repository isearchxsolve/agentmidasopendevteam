export const PIPELINE_STAGES = [
  "lead",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export interface Deal {
  id: string;
  title: string;
  company: string;
  contactName: string;
  valueCents: number;
  stage: PipelineStage;
  createdAt: string;
  updatedAt: string;
}

export interface DealDraft {
  title: string;
  company: string;
  contactName: string;
  valueCents: number;
  stage: PipelineStage;
}

export const STAGE_LABELS: Record<PipelineStage, string> = {
  lead: "Lead",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

export const MAX_DEALS = 500;
export const MAX_TEXT_LENGTH = 120;
export const MAX_VALUE_CENTS = 9_999_999_999_99;

export function isPipelineStage(value: unknown): value is PipelineStage {
  return typeof value === "string" &&
    (PIPELINE_STAGES as readonly string[]).includes(value);
}

export function sanitizeText(value: unknown): string {
  return typeof value === "string"
    ? value.trim().replace(/\s+/g, " ").slice(0, MAX_TEXT_LENGTH)
    : "";
}

export function formatCurrency(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatMoneyInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function parseMoneyToCents(value: string): number | null {
  if (!/^\d{1,10}(?:\.\d{1,2})?$/.test(value.trim())) {
    return null;
  }

  const cents = Math.round(Number(value) * 100);
  return Number.isSafeInteger(cents) && cents >= 0 && cents <= MAX_VALUE_CENTS
    ? cents
    : null;
}

export function validateDraft(input: DealDraft): DealDraft {
  const title = sanitizeText(input.title);
  const company = sanitizeText(input.company);
  const contactName = sanitizeText(input.contactName);

  if (title.length < 2) throw new Error("Deal title must contain at least 2 characters.");
  if (company.length < 2) throw new Error("Company must contain at least 2 characters.");
  if (contactName.length < 2) throw new Error("Contact name must contain at least 2 characters.");
  if (!isPipelineStage(input.stage)) throw new Error("A valid pipeline stage is required.");
  if (!Number.isSafeInteger(input.valueCents) || input.valueCents < 0 ||
      input.valueCents > MAX_VALUE_CENTS) {
    throw new Error("Deal value is outside the accepted range.");
  }

  return { title, company, contactName, valueCents: input.valueCents, stage: input.stage };
}
