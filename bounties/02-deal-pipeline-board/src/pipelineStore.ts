import {
  Deal,
  DealDraft,
  isPipelineStage,
  MAX_DEALS,
  PipelineStage,
  sanitizeText,
  validateDraft,
} from "./domain.js";

export const STORAGE_KEY = "agent-midas.deal-pipeline.v1";
const SCHEMA_VERSION = 1;

export interface PipelineState {
  deals: Deal[];
}

interface PersistedPipeline {
  version: number;
  deals: unknown;
}

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function safeTimestamp(value: unknown, fallback: string): string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function createDeal(
  draft: DealDraft,
  id: string,
  now = new Date().toISOString(),
): Deal {
  const valid = validateDraft(draft);
  if (!/^[a-zA-Z0-9_-]{8,128}$/.test(id)) {
    throw new Error("Generated deal identifier is invalid.");
  }

  return { ...valid, id, createdAt: now, updatedAt: now };
}

export function normalizeDeals(value: unknown, now = new Date().toISOString()): Deal[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const deals: Deal[] = [];

  for (const candidate of value) {
    if (!isRecord(candidate) || deals.length >= MAX_DEALS) continue;

    const id = typeof candidate.id === "string" ? candidate.id : "";
    const title = sanitizeText(candidate.title);
    const company = sanitizeText(candidate.company);
    const contactName = sanitizeText(candidate.contactName);
    const valueCents = candidate.valueCents;
    const stage = candidate.stage;

    if (!/^[a-zA-Z0-9_-]{8,128}$/.test(id) || seen.has(id) ||
      title.length < 2 || company.length < 2 || contactName.length < 2 ||
      !isPipelineStage(stage) || !Number.isSafeInteger(valueCents) ||
      valueCents < 0) continue;

    seen.add(id);
    deals.push({
      id,
      title,
      company,
      contactName,
      valueCents,
      stage,
      createdAt: safeTimestamp(candidate.createdAt, now),
      updatedAt: safeTimestamp(candidate.updatedAt, now),
    });
  }

  return deals;
}

export function loadPipeline(storage?: StorageAdapter): PipelineState {
  if (!storage) return { deals: [] };

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw || raw.length > 1_000_000) return { deals: [] };

    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== SCHEMA_VERSION) return { deals: [] };

    const persisted = parsed as PersistedPipeline;
    return { deals: normalizeDeals(persisted.deals) };
  } catch {
    return { deals: [] };
  }
}

export function persistPipeline(state: PipelineState, storage?: StorageAdapter): boolean {
  if (!storage) return false;

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({
      version: SCHEMA_VERSION,
      deals: state.deals.slice(0, MAX_DEALS),
    }));
    return true;
  } catch {
    return false;
  }
}

export function moveDeal(
  state: PipelineState,
  dealId: string,
  stage: PipelineStage,
  now = new Date().toISOString(),
): PipelineState {
  if (!isPipelineStage(stage)) throw new Error("Invalid destination stage.");

  const index = state.deals.findIndex((deal) => deal.id === dealId);
  if (index === -1) throw new Error("Deal was not found.");

  const current = state.deals[index];
  if (current.stage === stage) return state;

  const deals = [...state.deals];
  deals[index] = { ...current, stage, updatedAt: now };
  return { deals };
}

export function removeDeal(state: PipelineState, dealId: string): PipelineState {
  const deals = state.deals.filter((deal) => deal.id !== dealId);
  if (deals.length === state.deals.length) throw new Error("Deal was not found.");
  return { deals };
}
