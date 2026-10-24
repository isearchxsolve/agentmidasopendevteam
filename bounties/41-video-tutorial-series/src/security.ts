import type { VideoTutorial } from "./types";

const DEFAULT_VIDEO_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
  "vimeo.com",
  "www.vimeo.com"
]);

const MAX_TEXT_LENGTH = 500;
const ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/;

function isTrustedHost(hostname: string, allowedHosts: ReadonlySet<string>): boolean {
  const normalized = hostname.toLowerCase();
  return [...allowedHosts].some(
    (host) => normalized === host || normalized.endsWith(`.${host}`)
  );
}

export function safeExternalUrl(
  candidate: string,
  allowedHosts: readonly string[] = [...DEFAULT_VIDEO_HOSTS]
): string | null {
  if (typeof candidate !== "string" || candidate.length === 0 || candidate.length > 2048) {
    return null;
  }

  try {
    const url = new URL(candidate);
    const hosts = new Set(allowedHosts.map((host) => host.toLowerCase()));

    if (url.protocol !== "https:" || !isTrustedHost(url.hostname, hosts)) {
      return null;
    }

    url.username = "";
    url.password = "";
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function isSafeText(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= MAX_TEXT_LENGTH
  );
}

export function isValidTutorial(
  tutorial: VideoTutorial,
  allowedVideoHosts?: readonly string[]
): boolean {
  return (
    ID_PATTERN.test(tutorial.id) &&
    isSafeText(tutorial.title) &&
    isSafeText(tutorial.description) &&
    isSafeText(tutorial.duration) &&
    ["Foundation", "Intermediate", "Advanced"].includes(tutorial.level) &&
    safeExternalUrl(tutorial.videoUrl, allowedVideoHosts) !== null &&
    (tutorial.thumbnailUrl === undefined ||
      safeExternalUrl(tutorial.thumbnailUrl, allowedVideoHosts) !== null)
  );
}

export function validTutorials(
  tutorials: readonly VideoTutorial[],
  allowedVideoHosts?: readonly string[]
): VideoTutorial[] {
  if (!Array.isArray(tutorials)) {
    return [];
  }

  const ids = new Set<string>();

  return tutorials.filter((tutorial) => {
    if (!isValidTutorial(tutorial, allowedVideoHosts) || ids.has(tutorial.id)) {
      return false;
    }

    ids.add(tutorial.id);
    return true;
  });
}
