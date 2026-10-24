import { useMemo, useState } from "react";
import { DEFAULT_CONFIG, Lead, ScoringConfig, scoreLead } from "./scoring";

const leads: Lead[] = [
  {
    id: "lead-001", name: "Ava Patel", company: "Northstar Systems",
    title: "VP Engineering", companySize: "enterprise", source: "referral",
    estimatedBudget: 14000, emailOpens: 6, websiteVisits: 11, demoRequested: true,
    lastActivityAt: "2026-10-24T09:00:00.000Z"
  },
  {
    id: "lead-002", name: "Marcus Reed", company: "Cobalt Labs",
    title: "Founder", companySize: "mid-market", source: "inbound",
    estimatedBudget: 5000, emailOpens: 2, websiteVisits: 5, demoRequested: false,
    lastActivityAt: "2026-10-13T09:00:00.000Z"
  },
  {
    id: "lead-003", name: "Lin Chen", company: "Brightworks",
    title: "Operations Manager", companySize: "small", source: "outbound",
    estimatedBudget: 900, emailOpens: 0, websiteVisits: 1, demoRequested: false,
    lastActivityAt: "2026-08-01T09:00:00.000Z"
  }
];

const tierStyle = {
  Hot: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  Warm: "border-amber-400/40 bg-amber-400/10 text-amber-200",
  Nurture: "border-slate-500/40 bg-slate-500/10 text-slate-300"
};

export function LeadScoringEngine() {
  const [config, setConfig] = useState<ScoringConfig>(DEFAULT_CONFIG);
  const ranked = useMemo(
    () => leads.map((lead) => ({ lead, result: scoreLead(lead, config) }))
      .sort((a, b) => b.result.score - a.result.score),
    [config]
  );

  const updateThreshold = (key: "hotThreshold" | "warmThreshold", value: number) => {
    if (!Number.isFinite(value)) return;
    setConfig((current) => ({
      ...current,
      [key]: Math.max(0, Math.min(100, value))
    }));
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A] p-5 text-slate-100 sm:p-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 border-b border-[#D4AF37]/30 pb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">Agent Midas</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Lead Scoring Engine</h1>
          <p className="mt-2 max-w-2xl text-slate-400">
            Explainable scoring, bounded inference, and immediate sales prioritization.
          </p>
        </header>

        <section className="mb-6 grid gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-5 sm:grid-cols-2">
          {(["hotThreshold", "warmThreshold"] as const).map((key) => (
            <label key={key} className="text-sm font-medium text-slate-300">
              {key === "hotThreshold" ? "Hot threshold" : "Warm threshold"}
              <input
                aria-label={key}
                className="mt-2 block w-full rounded-md border border-white/15 bg-black px-3 py-2 text-white outline-none focus:border-[#D4AF37]"
                type="number"
                min="0"
                max="100"
                value={config[key]}
                onChange={(event) => updateThreshold(key, Number(event.target.value))}
              />
            </label>
          ))}
        </section>

        <section aria-label="Ranked leads" className="grid gap-4">
          {ranked.map(({ lead, result }) => (
            <article key={lead.id} className="rounded-xl border border-white/10 bg-[#121212] p-5 shadow-xl">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">{lead.name}</h2>
                  <p className="text-sm text-slate-400">{lead.title} · {lead.company}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${tierStyle[result.tier]}`}>
                    {result.tier}
                  </span>
                  <span className="text-3xl font-black text-[#D4AF37]">{result.score}</span>
                </div>
              </div>

              <ul className="mt-5 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                {result.reasons.map((reason) => (
                  <li key={reason.label} className="flex justify-between rounded bg-white/[0.04] px-3 py-2">
                    <span>{reason.label}</span><strong className="text-[#D4AF37]">+{reason.points}</strong>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
