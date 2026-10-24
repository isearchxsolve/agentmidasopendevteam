export interface UTMParameters {
  source: string;
  medium: string;
  campaign: string;
  term?: string;
  content?: string;
}

export interface ReferralLink {
  id: string;
  slug: string;
  destinationUrl: string;
  referralUrl: string;
  utm: UTMParameters;
  createdAt: string;
  clicks: number;
}

export interface CreateReferralInput {
  slug: string;
  destinationUrl: string;
  baseReferralUrl: string;
  utm: UTMParameters;
}

const MAX_FIELD_LENGTH = 120;
const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SAFE_UTM = /^[a-zA-Z0-9._~-]+(?:[ -][a-zA-Z0-9._~-]+)*$/;
const PRIVATE_HOSTS = new Set(["localhost", "0.0.0.0", "::1"]);

export class ReferralValidationError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "ReferralValidationError";
  }
}

function assertSafeText(value: string, field: string, required = true): string {
  const normalized = value.trim();

  if (required && normalized.length === 0) {
    throw new ReferralValidationError(`${field} is required.`);
  }

  if (normalized.length > MAX_FIELD_LENGTH) {
    throw new ReferralValidationError(
      `${field} must be ${MAX_FIELD_LENGTH} characters or fewer.`,
    );
  }

  if (normalized.length > 0 && !SAFE_UTM.test(normalized)) {
    throw new ReferralValidationError(
      `${field} may only contain letters, numbers, spaces, dots, underscores, tildes, and hyphens.`,
    );
  }

  return normalized;
}

function isPrivateIpv4(hostname: string): boolean {
  const octets = hostname.split(".").map(Number);

  return (
    octets.length === 4 &&
    octets.every((octet) => Number.isInteger(octet) && octet >= 0 && octet <= 255) &&
    (octets[0] === 10 ||
      octets[0] === 127 ||
      (octets[0] === 169 && octets[1] === 254) ||
      (octets[0] === 192 && octets[1] === 168) ||
      (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31))
  );
}

export function normalizeSlug(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (slug.length < 3 || slug.length > 64 || !SAFE_SLUG.test(slug)) {
    throw new ReferralValidationError(
      "Custom slug must be 3–64 characters and use lowercase letters, numbers, and hyphens.",
    );
  }

  return slug;
}

export function validateDestinationUrl(value: string): URL {
  let url: URL;

  try {
    url = new URL(value.trim());
  } catch {
    throw new ReferralValidationError("Enter a valid destination URL.");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new ReferralValidationError("Destination URL must use HTTP or HTTPS.");
  }

  if (url.username || url.password) {
    throw new ReferralValidationError(
      "Destination URL must not contain embedded credentials.",
    );
  }

  const hostname = url.hostname.toLowerCase();

  if (
    PRIVATE_HOSTS.has(hostname) ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    isPrivateIpv4(hostname)
  ) {
    throw new ReferralValidationError(
      "Local, private, and internal destinations are not permitted.",
    );
  }

  url.hash = "";
  return url;
}

export function normalizeUtm(utm: UTMParameters): UTMParameters {
  return {
    source: assertSafeText(utm.source, "UTM source"),
    medium: assertSafeText(utm.medium, "UTM medium"),
    campaign: assertSafeText(utm.campaign, "UTM campaign"),
    term: assertSafeText(utm.term ?? "", "UTM term", false) || undefined,
    content: assertSafeText(utm.content ?? "", "UTM content", false) || undefined,
  };
}

export function buildReferralUrl(input: CreateReferralInput): string {
  const slug = normalizeSlug(input.slug);
  const destination = validateDestinationUrl(input.destinationUrl);
  const utm = normalizeUtm(input.utm);

  let base: URL;
  try {
    base = new URL(input.baseReferralUrl);
  } catch {
    throw new ReferralValidationError("Referral base URL is invalid.");
  }

  if (base.protocol !== "https:" && base.protocol !== "http:") {
    throw new ReferralValidationError("Referral base URL must use HTTP or HTTPS.");
  }

  base.pathname = `${base.pathname.replace(/\/$/, "")}/r/${slug}`;
  base.search = "";
  base.hash = "";
  base.searchParams.set("redirect", destination.toString());
  base.searchParams.set("utm_source", utm.source);
  base.searchParams.set("utm_medium", utm.medium);
  base.searchParams.set("utm_campaign", utm.campaign);

  if (utm.term) base.searchParams.set("utm_term", utm.term);
  if (utm.content) base.searchParams.set("utm_content", utm.content);

  return base.toString();
}

export function createReferralLink(
  input: CreateReferralInput,
  id: string,
  createdAt: string,
): ReferralLink {
  const slug = normalizeSlug(input.slug);
  const utm = normalizeUtm(input.utm);

  return {
    id,
    slug,
    destinationUrl: validateDestinationUrl(input.destinationUrl).toString(),
    referralUrl: buildReferralUrl({ ...input, slug, utm }),
    utm,
    createdAt,
    clicks: 0,
  };
}

export function qrCodeUrl(referralUrl: string): string {
  const validated = new URL(referralUrl);

  if (validated.protocol !== "https:" && validated.protocol !== "http:") {
    throw new ReferralValidationError("QR code can only represent an HTTP(S) URL.");
  }

  const endpoint = new URL("https://api.qrserver.com/v1/create-qr-code/");
  endpoint.searchParams.set("size", "240x240");
  endpoint.searchParams.set("format", "svg");
  endpoint.searchParams.set("data", validated.toString());
  return endpoint.toString();
}
