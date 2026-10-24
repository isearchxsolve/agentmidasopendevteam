"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ReferralLink,
  ReferralValidationError,
  createReferralLink,
  qrCodeUrl,
} from "../lib/referralDomain";

interface ReferralLinkManagerProps {
  referralBaseUrl: string;
  storageKey?: string;
}

interface FormState {
  slug: string;
  destinationUrl: string;
  source: string;
  medium: string;
  campaign: string;
  term: string;
  content: string;
}

const EMPTY_FORM: FormState = {
  slug: "",
  destinationUrl: "https://agentmidas.xyz/signup",
  source: "affiliate",
  medium: "referral",
  campaign: "",
  term: "",
  content: "",
};

const MAX_LINKS = 100;

function isReferralLink(value: unknown): value is ReferralLink {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ReferralLink>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.slug === "string" &&
    typeof candidate.destinationUrl === "string" &&
    typeof candidate.referralUrl === "string" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.clicks === "number" &&
    !!candidate.utm &&
    typeof candidate.utm.source === "string" &&
    typeof candidate.utm.medium === "string" &&
    typeof candidate.utm.campaign === "string"
  );
}

function safeLoad(storageKey: string): ReferralLink[] {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isReferralLink).slice(0, MAX_LINKS) : [];
  } catch {
    return [];
  }
}

function safePersist(storageKey: string, links: ReferralLink[]): void {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(links.slice(0, MAX_LINKS)));
  } catch {
    // Browser storage can be disabled or quota-constrained; UI remains usable.
  }
}

function createSecureId(): string {
  const values = new Uint32Array(4);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => value.toString(16).padStart(8, "0")).join("");
}

export function ReferralLinkManager({
  referralBaseUrl,
  storageKey = "agent-midas.referral-links.v1",
}: ReferralLinkManagerProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [links, setLinks] = useState<ReferralLink[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const restored = safeLoad(storageKey);
    setLinks(restored);
    setSelectedId(restored[0]?.id ?? null);
  }, [storageKey]);

  const selected = useMemo(
    () => links.find((link) => link.id === selectedId) ?? null,
    [links, selectedId],
  );

  function updateField(field: keyof FormState, value: string): void {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
    setNotice("");
  }

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setError("");
    setNotice("");

    try {
      if (!globalThis.crypto?.getRandomValues) {
        throw new ReferralValidationError(
          "Secure browser cryptography is required to create a referral link.",
        );
      }

      const created = createReferralLink(
        {
          slug: form.slug,
          destinationUrl: form.destinationUrl,
          baseReferralUrl: referralBaseUrl,
          utm: {
            source: form.source,
            medium: form.medium,
            campaign: form.campaign,
            term: form.term || undefined,
            content: form.content || undefined,
          },
        },
        createSecureId(),
        new Date().toISOString(),
      );

      if (links.some((link) => link.slug === created.slug)) {
        throw new ReferralValidationError("That custom slug already exists on this device.");
      }

      const next = [created, ...links].slice(0, MAX_LINKS);
      setLinks(next);
      safePersist(storageKey, next);
      setSelectedId(created.id);
      setForm((current) => ({ ...EMPTY_FORM, campaign: current.campaign }));
      setNotice("Referral link created.");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to create the referral link.",
      );
    }
  }

  async function copyLink(link: ReferralLink): Promise<void> {
    setError("");
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard access is unavailable in this browser.");
      }
      await navigator.clipboard.writeText(link.referralUrl);
      setNotice(`Copied ${link.slug}.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not copy the link.");
    }
  }

  async function shareLink(link: ReferralLink): Promise<void> {
    setError("");
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Agent Midas referral: ${link.slug}`,
          text: "Join Agent Midas using my referral link.",
          url: link.referralUrl,
        });
        setNotice("Share sheet opened.");
        return;
      }
      await copyLink(link);
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      setError(caught instanceof Error ? caught.message : "Could not share the link.");
    }
  }

  function deleteLink(id: string): void {
    const next = links.filter((link) => link.id !== id);
    setLinks(next);
    safePersist(storageKey, next);
    setSelectedId((current) => (current === id ? next[0]?.id ?? null : current));
    setNotice("Referral link deleted.");
  }

  return (
    <section className="min-h-screen bg-[#0A0A0A] px-4 py-8 text-[#F5F5F5] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 border-b border-[#2A2A2A] pb-6">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">
            Affiliate tools
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Referral Link Manager
          </h1>
          <p className="mt-3 max-w-2xl text-[#9CA3AF]">
            Build secure campaign links with UTM attribution and an instant QR code.
          </p>
        </header>

        <div aria-live="polite" className="mb-5 min-h-6">
          {notice && <p className="text-sm text-[#E8C547]">{notice}</p>}
          {error && <p className="text-sm text-red-300">{error}</p>}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <form
            onSubmit={submit}
            className="rounded-xl border border-[#2A2A2A] bg-[#0D0D0D] p-5 shadow-2xl"
          >
            <h2 className="text-xl font-semibold">Create a referral link</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Custom slug" value={form.slug} required placeholder="spring-partner" onChange={(value) => updateField("slug", value)} />
              <Field label="Campaign" value={form.campaign} required placeholder="launch-2026" onChange={(value) => updateField("campaign", value)} />
              <div className="sm:col-span-2">
                <Field label="Destination URL" value={form.destinationUrl} required type="url" placeholder="https://agentmidas.xyz/signup" onChange={(value) => updateField("destinationUrl", value)} />
              </div>
              <Field label="UTM source" value={form.source} required onChange={(value) => updateField("source", value)} />
              <Field label="UTM medium" value={form.medium} required onChange={(value) => updateField("medium", value)} />
              <Field label="UTM term" value={form.term} onChange={(value) => updateField("term", value)} />
              <Field label="UTM content" value={form.content} onChange={(value) => updateField("content", value)} />
            </div>
            <button type="submit" className="mt-6 w-full rounded-lg bg-[#D4AF37] px-4 py-3 font-semibold text-black transition hover:bg-[#E8C547] focus:outline-none focus:ring-2 focus:ring-[#E8C547] focus:ring-offset-2 focus:ring-offset-[#0D0D0D]">
              Create secure referral link
            </button>
          </form>

          <aside className="rounded-xl border border-[#2A2A2A] bg-[#0D0D0D] p-5">
            <h2 className="text-xl font-semibold">QR preview</h2>
            {selected ? (
              <div className="mt-5">
                <div className="rounded-lg bg-white p-3">
                  <img className="mx-auto h-52 w-52" src={qrCodeUrl(selected.referralUrl)} alt={`QR code for ${selected.slug}`} />
                </div>
                <p className="mt-4 break-all font-mono text-xs text-[#9CA3AF]">{selected.referralUrl}</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => void copyLink(selected)} className="rounded-lg border border-[#D4AF37] px-3 py-2 text-sm font-semibold text-[#E8C547] hover:bg-[#141414] focus:outline-none focus:ring-2 focus:ring-[#E8C547]">Copy</button>
                  <button type="button" onClick={() => void shareLink(selected)} className="rounded-lg border border-[#2A2A2A] px-3 py-2 text-sm font-semibold hover:bg-[#141414] focus:outline-none focus:ring-2 focus:ring-[#E8C547]">Share</button>
                </div>
              </div>
            ) : <p className="mt-5 text-sm text-[#6B7280]">Create a link to generate its QR code.</p>}
          </aside>
        </div>

        <div className="mt-6 rounded-xl border border-[#2A2A2A] bg-[#0D0D0D]">
          <div className="border-b border-[#2A2A2A] p-5"><h2 className="text-xl font-semibold">Saved links</h2></div>
          {links.length === 0 ? <p className="p-5 text-sm text-[#6B7280]">No referral links saved yet.</p> : (
            <ul className="divide-y divide-[#2A2A2A]">
              {links.map((link) => (
                <li key={link.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <button type="button" onClick={() => setSelectedId(link.id)} className="min-w-0 text-left focus:outline-none focus:ring-2 focus:ring-[#E8C547]">
                    <span className="block font-semibold text-[#E8C547]">/{link.slug}</span>
                    <span className="mt-1 block truncate text-sm text-[#9CA3AF]">{link.destinationUrl}</span>
                  </button>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => void copyLink(link)} className="rounded border border-[#2A2A2A] px-3 py-2 text-sm hover:bg-[#141414] focus:outline-none focus:ring-2 focus:ring-[#E8C547]">Copy</button>
                    <button type="button" onClick={() => deleteLink(link.id)} className="rounded border border-red-900 px-3 py-2 text-sm text-red-300 hover:bg-red-950 focus:outline-none focus:ring-2 focus:ring-red-300">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

interface FieldProps {
  label: string;
  value: string;
  required?: boolean;
  type?: "text" | "url";
  placeholder?: string;
  onChange: (value: string) => void;
}

function Field({ label, value, required = false, type = "text", placeholder, onChange }: FieldProps) {
  const id = label.toLowerCase().replaceAll(" ", "-");
  return (
    <label htmlFor={id} className="block text-sm font-medium">
      {label}{required && <span className="ml-1 text-[#D4AF37]">*</span>}
      <input id={id} type={type} value={value} required={required} maxLength={120} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2.5 text-[#F5F5F5] placeholder:text-[#6B7280] focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]" />
    </label>
  );
}
