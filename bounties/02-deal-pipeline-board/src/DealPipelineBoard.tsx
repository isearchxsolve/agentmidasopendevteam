"use client";

import { DragEvent, FormEvent, useEffect, useMemo, useState } from "react";
import {
  Deal,
  DealDraft,
  formatCurrency,
  formatMoneyInput,
  parseMoneyToCents,
  PIPELINE_STAGES,
  PipelineStage,
  STAGE_LABELS,
} from "./domain";
import {
  createDeal,
  loadPipeline,
  moveDeal,
  persistPipeline,
  removeDeal,
  PipelineState,
} from "./pipelineStore";

const emptyDraft: DealDraft = {
  title: "",
  company: "",
  contactName: "",
  valueCents: 0,
  stage: "lead",
};

function createId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function getBrowserStorage() {
  return typeof window === "undefined" ? undefined : window.localStorage;
}

export function DealPipelineBoard(): JSX.Element {
  const [state, setState] = useState<PipelineState>({ deals: [] });
  const [draft, setDraft] = useState<DealDraft>(emptyDraft);
  const [money, setMoney] = useState("0.00");
  const [isComposerOpen, setComposerOpen] = useState(false);
  const [status, setStatus] = useState("Pipeline ready.");
  const [error, setError] = useState("");

  useEffect(() => {
    setState(loadPipeline(getBrowserStorage()));
  }, []);

  function commit(next: PipelineState, message: string): void {
    setState(next);
    const saved = persistPipeline(next, getBrowserStorage());
    setStatus(saved ? message : `${message} Changes could not be saved locally.`);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setError("");

    const valueCents = parseMoneyToCents(money);
    if (valueCents === null) {
      setError("Enter a valid non-negative amount, for example 12500.00.");
      return;
    }

    try {
      const deal = createDeal({ ...draft, valueCents }, createId());
      commit({ deals: [deal, ...state.deals] }, `${deal.title} added to ${STAGE_LABELS[deal.stage]}.`);
      setDraft(emptyDraft);
      setMoney("0.00");
      setComposerOpen(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to create the deal.");
    }
  }

  function onDrop(event: DragEvent<HTMLElement>, destination: PipelineStage): void {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/plain");
    if (!id) return;

    try {
      const deal = state.deals.find((item) => item.id === id);
      if (!deal) return;
      commit(moveDeal(state, id, destination), `${deal.title} moved to ${STAGE_LABELS[destination]}.`);
    } catch {
      setError("The deal could not be moved. Refresh and try again.");
    }
  }

  const total = useMemo(
    () => state.deals.filter((deal) => deal.stage !== "lost")
      .reduce((sum, deal) => sum + deal.valueCents, 0),
    [state.deals],
  );

  return (
    <section className="min-h-screen bg-[#0A0A0A] px-4 py-6 text-[#F5F5F5] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1800px]">
        <header className="mb-6 flex flex-col gap-4 border-b border-[#2A2A2A] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-[#D4AF37]">Agent Midas · CRM</p>
            <h1 className="text-3xl font-semibold tracking-tight">Deal Pipeline</h1>
            <p className="mt-2 text-sm text-[#9CA3AF]">
              {state.deals.length} deals · {formatCurrency(total)} active pipeline
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setError(""); setComposerOpen((open) => !open); }}
            className="rounded-md bg-[#D4AF37] px-4 py-2.5 text-sm font-bold text-black transition hover:bg-[#E8C547] focus:outline-none focus:ring-2 focus:ring-[#E8C547] focus:ring-offset-2 focus:ring-offset-[#0A0A0A]"
            aria-expanded={isComposerOpen}
          >
            {isComposerOpen ? "Close composer" : "Add deal"}
          </button>
        </header>

        <p className="sr-only" aria-live="polite">{status}</p>

        {isComposerOpen && (
          <form onSubmit={onSubmit} className="mb-6 grid gap-3 rounded-lg border border-[#2A2A2A] bg-[#0D0D0D] p-4 md:grid-cols-5">
            <label className="text-sm text-[#9CA3AF]">Deal title
              <input required minLength={2} maxLength={120} value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                className="mt-1 w-full rounded border border-[#2A2A2A] bg-[#141414] px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] focus:outline-none" />
            </label>
            <label className="text-sm text-[#9CA3AF]">Company
              <input required minLength={2} maxLength={120} value={draft.company}
                onChange={(event) => setDraft({ ...draft, company: event.target.value })}
                className="mt-1 w-full rounded border border-[#2A2A2A] bg-[#141414] px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] focus:outline-none" />
            </label>
            <label className="text-sm text-[#9CA3AF]">Contact
              <input required minLength={2} maxLength={120} value={draft.contactName}
                onChange={(event) => setDraft({ ...draft, contactName: event.target.value })}
                className="mt-1 w-full rounded border border-[#2A2A2A] bg-[#141414] px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] focus:outline-none" />
            </label>
            <label className="text-sm text-[#9CA3AF]">Value (USD)
              <input required inputMode="decimal" value={money}
                onChange={(event) => setMoney(event.target.value)}
                className="mt-1 w-full rounded border border-[#2A2A2A] bg-[#141414] px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] focus:outline-none" />
            </label>
            <div className="flex items-end gap-2">
              <label className="flex-1 text-sm text-[#9CA3AF]">Stage
                <select value={draft.stage} onChange={(event) => setDraft({ ...draft, stage: event.target.value as PipelineStage })}
                  className="mt-1 w-full rounded border border-[#2A2A2A] bg-[#141414] px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] focus:outline-none">
                  {PIPELINE_STAGES.map((stage) => <option key={stage} value={stage}>{STAGE_LABELS[stage]}</option>)}
                </select>
              </label>
              <button type="submit" className="rounded bg-[#D4AF37] px-4 py-2 text-sm font-bold text-black hover:bg-[#E8C547] focus:outline-none focus:ring-2 focus:ring-[#E8C547]">Save</button>
            </div>
            {error && <p role="alert" className="md:col-span-5 text-sm text-red-400">{error}</p>}
          </form>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          {PIPELINE_STAGES.map((stage) => {
            const deals = state.deals.filter((deal) => deal.stage === stage);
            const value = deals.reduce((sum, deal) => sum + deal.valueCents, 0);

            return (
              <section key={stage} onDragOver={(event) => event.preventDefault()} onDrop={(event) => onDrop(event, stage)}
                className="min-h-64 rounded-lg border border-[#2A2A2A] bg-[#0D0D0D] p-3" aria-label={`${STAGE_LABELS[stage]} stage`}>
                <div className="mb-3 flex items-center justify-between border-b border-[#2A2A2A] pb-3">
                  <div>
                    <h2 className="font-medium text-[#F5F5F5]">{STAGE_LABELS[stage]}</h2>
                    <p className="text-xs text-[#6B7280]">{deals.length} · {formatCurrency(value)}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {deals.map((deal) => (
                    <DealCard key={deal.id} deal={deal} onMove={(destination) => {
                      try { commit(moveDeal(state, deal.id, destination), `${deal.title} moved to ${STAGE_LABELS[destination]}.`); }
                      catch { setError("The deal could not be moved."); }
                    }} onDelete={() => {
                      try { commit(removeDeal(state, deal.id), `${deal.title} removed.`); }
                      catch { setError("The deal could not be removed."); }
                    }} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function DealCard({ deal, onMove, onDelete }: {
  deal: Deal;
  onMove: (stage: PipelineStage) => void;
  onDelete: () => void;
}): JSX.Element {
  return (
    <article draggable onDragStart={(event) => event.dataTransfer.setData("text/plain", deal.id)}
      className="cursor-grab rounded-md border border-[#2A2A2A] bg-[#141414] p-3 shadow-sm transition hover:border-[#D4AF37] focus-within:ring-2 focus-within:ring-[#D4AF37]">
      <h3 className="font-medium text-[#F5F5F5]">{deal.title}</h3>
      <p className="mt-1 text-sm text-[#9CA3AF]">{deal.company}</p>
      <p className="mt-2 text-xs text-[#6B7280]">{deal.contactName}</p>
      <p className="mt-3 font-mono text-sm text-[#D4AF37]">{formatCurrency(deal.valueCents)}</p>
      <div className="mt-3 flex gap-2">
        <select aria-label={`Move ${deal.title}`} value={deal.stage} onChange={(event) => onMove(event.target.value as PipelineStage)}
          className="min-w-0 flex-1 rounded border border-[#2A2A2A] bg-[#0A0A0A] px-2 py-1 text-xs text-[#F5F5F5] focus:border-[#D4AF37] focus:outline-none">
          {PIPELINE_STAGES.map((stage) => <option key={stage} value={stage}>{STAGE_LABELS[stage]}</option>)}
        </select>
        <button type="button" onClick={onDelete} aria-label={`Remove ${deal.title}`}
          className="rounded px-2 text-xs text-[#9CA3AF] hover:bg-red-950 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]">
          Remove
        </button>
      </div>
    </article>
  );
}
