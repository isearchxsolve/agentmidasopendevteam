export type CompanySize = "solo" | "small" | "mid-market" | "enterprise";
export type LeadSource = "inbound" | "referral" | "event" | "outbound";

export interface Lead {
  id: string;
  name: string;
  company: string;
  title: string;
  companySize: CompanySize;
  source: LeadSource;
  estimatedBudget: number;
  emailOpens: number;
  websiteVisits: number;
  demoRequested: boolean;
  lastActivityAt: string;
}

export interface ScoringConfig {
  budgetWeight: number;
  engagementWeight: number;
  fitWeight: number;
  recencyWeight: number;
  hotThreshold: number;
  warmThreshold: number;
}

export interface ScoreReason {
  label: string;
  points: number;
}

export interface ScoreResult {
  score: number;
  tier: "Hot" | "Warm" | "Nurture";
  reasons: ScoreReason[];
}

export const DEFAULT_CONFIG: ScoringConfig = Object.freeze({
  budgetWeight: 1,
  engagementWeight: 1,
  fitWeight: 1,
  recencyWeight: 1,
  hotThreshold: 75,
  warmThreshold: 45
});

const sizePoints: Record<CompanySize, number> = {
  solo: 2,
  small: 7,
  "mid-market": 14,
  enterprise: 20
};

const sourcePoints: Record<LeadSource, number> = {
  inbound: 10,
  referral: 15,
  event: 7,
  outbound: 3
};

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));

function finiteNonNegative(value: number, field: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be a finite non-negative number.`);
  }
  return value;
}

function assertLead(lead: Lead): void {
  if (!lead.id.trim() || !lead.name.trim() || !lead.company.trim()) {
    throw new Error("Lead id, name, and company are required.");
  }
  finiteNonNegative(lead.estimatedBudget, "estimatedBudget");
  finiteNonNegative(lead.emailOpens, "emailOpens");
  finiteNonNegative(lead.websiteVisits, "websiteVisits");

  if (Number.isNaN(Date.parse(lead.lastActivityAt))) {
    throw new Error("lastActivityAt must be a valid ISO-8601 date.");
  }
}

function assertConfig(config: ScoringConfig): void {
  for (const [key, value] of Object.entries(config)) {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`${key} must be a finite non-negative number.`);
    }
  }
  if (config.warmThreshold > config.hotThreshold || config.hotThreshold > 100) {
    throw new Error("Thresholds must satisfy 0 ≤ warmThreshold ≤ hotThreshold ≤ 100.");
  }
}

export function scoreLead(
  lead: Lead,
  config: ScoringConfig = DEFAULT_CONFIG,
  now = new Date()
): ScoreResult {
  assertLead(lead);
  assertConfig(config);

  const reasons: ScoreReason[] = [];
  const add = (label: string, raw: number, weight: number): void => {
    const points = Math.round(raw * weight * 10) / 10;
    if (points > 0) reasons.push({ label, points });
  };

  add("Budget fit", clamp(lead.estimatedBudget / 500, 0, 25), config.budgetWeight);
  add("Company fit", sizePoints[lead.companySize] + sourcePoints[lead.source], config.fitWeight);
  add("Email engagement", clamp(lead.emailOpens * 2, 0, 12), config.engagementWeight);
  add("Website engagement", clamp(lead.websiteVisits * 0.75, 0, 10), config.engagementWeight);
  if (lead.demoRequested) add("Demo requested", 18, config.engagementWeight);

  const ageDays = Math.max(0, (now.getTime() - Date.parse(lead.lastActivityAt)) / 86_400_000);
  add("Recent activity", ageDays <= 7 ? 15 : ageDays <= 30 ? 8 : 2, config.recencyWeight);

  const score = Math.round(clamp(reasons.reduce((sum, reason) => sum + reason.points, 0), 0, 100));
  const tier = score >= config.hotThreshold ? "Hot" : score >= config.warmThreshold ? "Warm" : "Nurture";

  return { score, tier, reasons: reasons.sort((a, b) => b.points - a.points) };
}
