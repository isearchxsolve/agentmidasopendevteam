import { FormEvent, useId, useState } from "react";
import { getTemplate, isValidEmail, LandingTemplate, safeHref, templates } from "./catalogue.js";

export interface LandingPageTemplateKitProps {
  initialTemplate?: LandingTemplate["id"];
  primaryHref?: string;
  secondaryHref?: string;
  onLead?: (email: string, template: LandingTemplate["id"]) => void;
}

function SecureLink({
  href,
  children,
  className
}: {
  href: string;
  children: string;
  className: string;
}) {
  const secureHref = safeHref(href);

  if (!secureHref) {
    return <span className={`${className} cursor-not-allowed opacity-50`} aria-disabled="true">{children}</span>;
  }

  const external = secureHref.startsWith("http");
  return (
    <a
      className={className}
      href={secureHref}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  );
}

export function LandingPageTemplateKit({
  initialTemplate = "saas",
  primaryHref = "#lead-capture",
  secondaryHref = "#value",
  onLead
}: LandingPageTemplateKitProps) {
  const [selectedId, setSelectedId] = useState<LandingTemplate["id"]>(initialTemplate);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const emailId = useId();
  const template = getTemplate(selectedId);

  function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = email.trim().toLowerCase();

    if (!isValidEmail(normalized)) {
      setMessage("Enter a valid email address.");
      return;
    }

    onLead?.(normalized, template.id);
    setMessage("You are on the priority list.");
    setEmail("");
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] px-4 py-5 font-sans text-[#F5F5F5] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between border-b border-[#2A2A2A] pb-5">
          <a href="#top" className="text-sm font-black tracking-[0.2em] text-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#E8C547]">
            AGENT MIDAS
          </a>
          <span className="text-xs font-medium text-[#9CA3AF]">Template Kit / 39</span>
        </header>

        <nav aria-label="Template selection" className="mt-6 flex gap-2 overflow-x-auto pb-2">
          {templates.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => { setSelectedId(item.id); setMessage(""); }}
              aria-pressed={item.id === template.id}
              className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wider transition focus:outline-none focus:ring-2 focus:ring-[#E8C547] ${
                item.id === template.id
                  ? "border-[#D4AF37] bg-[#D4AF37] text-[#0A0A0A]"
                  : "border-[#2A2A2A] bg-[#0D0D0D] text-[#9CA3AF] hover:border-[#D4AF37] hover:text-[#F5F5F5]"
              }`}
            >
              {item.id}
            </button>
          ))}
        </nav>

        <section id="top" className="grid gap-12 py-16 lg:grid-cols-[1.25fr_0.75fr] lg:py-24">
          <div>
            <p className="mb-5 text-xs font-bold tracking-[0.22em] text-[#D4AF37]">{template.eyebrow}</p>
            <h1 className="max-w-3xl text-4xl font-black leading-[1.02] tracking-tight sm:text-6xl">
              {template.headline}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-[#9CA3AF] sm:text-lg">{template.description}</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <SecureLink href={primaryHref} className="rounded-md bg-[#D4AF37] px-5 py-3 text-center text-sm font-black text-[#0A0A0A] transition hover:bg-[#E8C547] focus:outline-none focus:ring-2 focus:ring-[#F5F5F5]">
                {template.primaryCta}
              </SecureLink>
              <SecureLink href={secondaryHref} className="rounded-md border border-[#2A2A2A] bg-[#0D0D0D] px-5 py-3 text-center text-sm font-bold text-[#F5F5F5] transition hover:border-[#D4AF37] hover:bg-[#141414] focus:outline-none focus:ring-2 focus:ring-[#E8C547]">
                {template.secondaryCta}
              </SecureLink>
            </div>
          </div>

          <aside id="value" className="rounded-xl border border-[#2A2A2A] bg-[#0D0D0D] p-6 shadow-2xl shadow-black/30">
            <p className="text-sm font-bold text-[#D4AF37]">The operating signal</p>
            <div className="my-6 h-px bg-[#2A2A2A]" />
            <ul className="space-y-5">
              {template.proof.map((item, index) => (
                <li key={item} className="flex gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#141414] text-xs font-black text-[#D4AF37]">
                    0{index + 1}
                  </span>
                  <span className="pt-1 text-sm text-[#F5F5F5]">{item}</span>
                </li>
              ))}
            </ul>
          </aside>
        </section>

        <section id="lead-capture" className="border-y border-[#2A2A2A] py-12">
          <div className="max-w-xl">
            <h2 className="text-2xl font-black">Get the next signal first.</h2>
            <p className="mt-2 text-sm leading-6 text-[#9CA3AF]">Your email is used only for this requested update.</p>
            <form className="mt-6 flex flex-col gap-3 sm:flex-row" noValidate onSubmit={submitLead}>
              <label className="sr-only" htmlFor={emailId}>Email address</label>
              <input
                id={emailId}
                type="email"
                inputMode="email"
                autoComplete="email"
                maxLength={254}
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="min-w-0 flex-1 rounded-md border border-[#2A2A2A] bg-[#141414] px-4 py-3 text-sm text-[#F5F5F5] placeholder:text-[#6B7280] focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                placeholder="you@company.com"
              />
              <button type="submit" className="rounded-md bg-[#D4AF37] px-5 py-3 text-sm font-black text-[#0A0A0A] transition hover:bg-[#E8C547] focus:outline-none focus:ring-2 focus:ring-[#F5F5F5]">
                Request access
              </button>
            </form>
            <p className="mt-3 min-h-5 text-sm text-[#E8C547]" role="status" aria-live="polite">{message}</p>
          </div>
        </section>

        <footer className="py-8 text-xs text-[#6B7280]">Built for decisive products and teams.</footer>
      </div>
    </main>
  );
}
