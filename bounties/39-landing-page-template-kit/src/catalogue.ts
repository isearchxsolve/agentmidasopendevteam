export interface LandingTemplate {
  readonly id: "saas" | "agency" | "creator" | "launch" | "waitlist";
  readonly eyebrow: string;
  readonly headline: string;
  readonly description: string;
  readonly primaryCta: string;
  readonly secondaryCta: string;
  readonly proof: readonly string[];
}

export const templates: readonly LandingTemplate[] = [
  {
    id: "saas",
    eyebrow: "SYSTEMS THAT COMPOUND",
    headline: "Turn operational drag into a durable advantage.",
    description: "A decisive SaaS landing page for teams that measure every workflow against revenue and reliability.",
    primaryCta: "Start building",
    secondaryCta: "View architecture",
    proof: ["99.99% ready", "SOC2-minded", "Global routing"]
  },
  {
    id: "agency",
    eyebrow: "ELITE DELIVERY",
    headline: "Your next growth chapter deserves senior engineering.",
    description: "A services template for technical agencies positioning strategy, execution, and measurable outcomes.",
    primaryCta: "Plan the engagement",
    secondaryCta: "See capabilities",
    proof: ["Senior-led", "Weekly signals", "Clear scope"]
  },
  {
    id: "creator",
    eyebrow: "OWN THE AUDIENCE",
    headline: "Build a brand people remember after the scroll.",
    description: "A creator-first template that makes an offer, proof, and next action impossible to miss.",
    primaryCta: "Join the inner circle",
    secondaryCta: "Meet the creator",
    proof: ["Direct access", "Practical playbooks", "New weekly"]
  },
  {
    id: "launch",
    eyebrow: "PRODUCT LAUNCH",
    headline: "Make the first impression feel inevitable.",
    description: "A high-clarity launch page designed to concentrate attention on a product’s sharpest promise.",
    primaryCta: "Get early access",
    secondaryCta: "Explore the release",
    proof: ["Fast onboarding", "Private beta", "Founder support"]
  },
  {
    id: "waitlist",
    eyebrow: "PRIVATE ACCESS",
    headline: "The next cohort opens when the signal is right.",
    description: "A focused waitlist template that collects consented leads without diluting the message.",
    primaryCta: "Reserve a place",
    secondaryCta: "Why now",
    proof: ["No spam", "Priority invites", "Leave anytime"]
  }
] as const;

const allowedProtocols = new Set(["https:", "http:", "mailto:"]);

export function safeHref(value: string): string | null {
  try {
    const url = new URL(value, "https://agentmidas.local");
    return allowedProtocols.has(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export function isValidEmail(value: string): boolean {
  const email = value.trim();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function getTemplate(id: string): LandingTemplate {
  return templates.find((template) => template.id === id) ?? templates[0];
}
