import test from "node:test";
import assert from "node:assert/strict";
import {
  createDeal,
  loadPipeline,
  moveDeal,
  normalizeDeals,
  persistPipeline,
  removeDeal,
  STORAGE_KEY,
} from "../src/pipelineStore.js";
import { DealDraft } from "../src/domain.js";

const draft: DealDraft = {
  title: "Enterprise Routing Upgrade",
  company: "Keross",
  contactName: "Operations Director",
  valueCents: 3_300_000,
  stage: "lead",
};

class MemoryStorage {
  private readonly entries = new Map<string, string>();
  getItem(key: string): string | null { return this.entries.get(key) ?? null; }
  setItem(key: string, value: string): void { this.entries.set(key, value); }
}

test("creates validated, immutable deal records", () => {
  const deal = createDeal(draft, "deal_12345678", "2026-10-25T00:00:00.000Z");
  assert.equal(deal.company, "Keross");
  assert.equal(deal.stage, "lead");
  assert.equal(deal.createdAt, deal.updatedAt);
});

test("rejects invalid deal input at the domain boundary", () => {
  assert.throws(
    () => createDeal({ ...draft, title: "x" }, "deal_12345678"),
    /title must contain/i,
  );
  assert.throws(
    () => createDeal({ ...draft, valueCents: -1 }, "deal_12345678"),
    /outside the accepted range/i,
  );
});

test("moves a deal without mutating the previous state", () => {
  const deal = createDeal(draft, "deal_12345678", "2026-10-25T00:00:00.000Z");
  const before = { deals: [deal] };
  const after = moveDeal(before, deal.id, "proposal", "2026-10-25T01:00:00.000Z");

  assert.equal(before.deals[0].stage, "lead");
  assert.equal(after.deals[0].stage, "proposal");
  assert.notEqual(after.deals, before.deals);
  assert.equal(after.deals[0].updatedAt, "2026-10-25T01:00:00.000Z");
});

test("rejects unknown deal transitions", () => {
  const deal = createDeal(draft, "deal_12345678");
  assert.throws(() => moveDeal({ deals: [deal] }, "missing_id", "won"), /not found/i);
});

test("persists and restores valid state", () => {
  const storage = new MemoryStorage();
  const deal = createDeal(draft, "deal_12345678");
  assert.equal(persistPipeline({ deals: [deal] }, storage), true);

  const restored = loadPipeline(storage);
  assert.deepEqual(restored.deals, [deal]);
});

test("fails closed for malformed persisted JSON", () => {
  const storage = new MemoryStorage();
  storage.setItem(STORAGE_KEY, "{invalid json");
  assert.deepEqual(loadPipeline(storage), { deals: [] });
});

test("drops malformed, duplicate, and unsafe persisted entries", () => {
  const valid = createDeal(draft, "deal_12345678");
  const deals = normalizeDeals([
    valid,
    valid,
    { id: "bad", title: "x", company: "", contactName: "", valueCents: -2, stage: "wrong" },
  ]);

  assert.equal(deals.length, 1);
  assert.equal(deals[0].id, valid.id);
});

test("removes a deal and reports unknown removals", () => {
  const deal = createDeal(draft, "deal_12345678");
  assert.deepEqual(removeDeal({ deals: [deal] }, deal.id), { deals: [] });
  assert.throws(() => removeDeal({ deals: [] }, deal.id), /not found/i);
});
