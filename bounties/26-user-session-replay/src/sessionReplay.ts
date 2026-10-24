export type ReplayEventKind = "click" | "pointer" | "scroll" | "navigation" | "input";

export interface ReplayEvent {
  readonly id: string;
  readonly kind: ReplayEventKind;
  readonly at: number;
  readonly x?: number;
  readonly y?: number;
  readonly target?: string;
  readonly route?: string;
}

export interface ReplaySession {
  readonly id: string;
  readonly startedAt: number;
  readonly endedAt?: number;
  readonly events: readonly ReplayEvent[];
}

export interface RecorderOptions {
  readonly maxEvents?: number;
  readonly pointerThrottleMs?: number;
  readonly now?: () => number;
  readonly onUpdate: (session: ReplaySession) => void;
}

const SENSITIVE_INPUT_TYPES = new Set([
  "password",
  "email",
  "tel",
  "number",
  "credit-card",
  "one-time-code",
]);

const DEFAULT_MAX_EVENTS = 2_000;
const DEFAULT_POINTER_THROTTLE_MS = 100;

function safeNow(now: () => number): number {
  const value = now();
  return Number.isFinite(value) && value > 0 ? value : Date.now();
}

function randomId(prefix: string): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.randomUUID) {
    return `${prefix}_${cryptoApi.randomUUID()}`;
  }

  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
}

function safeRoute(location: Location): string {
  return location.pathname.slice(0, 500) || "/";
}

function targetLabel(target: EventTarget | null): string | undefined {
  if (!(target instanceof HTMLElement)) {
    return undefined;
  }

  if (target.closest("[data-replay-mask]")) {
    return "masked";
  }

  const inputType =
    target instanceof HTMLInputElement ? target.type.toLowerCase() : "";

  if (
    target.hasAttribute("data-replay-private") ||
    target instanceof HTMLTextAreaElement ||
    SENSITIVE_INPUT_TYPES.has(inputType)
  ) {
    return "private";
  }

  const suppliedName = target.getAttribute("data-replay-name");
  if (suppliedName) {
    return suppliedName
      .replace(/[^a-zA-Z0-9:_-]/g, "")
      .slice(0, 80) || undefined;
  }

  const role = target.getAttribute("role");
  return (role || target.tagName.toLowerCase()).slice(0, 80);
}

function isPrivateTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const inputType =
    target instanceof HTMLInputElement ? target.type.toLowerCase() : "";

  return Boolean(
    target.closest("[data-replay-mask]") ||
      target.hasAttribute("data-replay-private") ||
      target instanceof HTMLTextAreaElement ||
      SENSITIVE_INPUT_TYPES.has(inputType),
  );
}

export function eventPoint(event: MouseEvent | PointerEvent): Pick<ReplayEvent, "x" | "y"> {
  const width = Math.max(window.innerWidth, 1);
  const height = Math.max(window.innerHeight, 1);

  return {
    x: clampPercent((event.clientX / width) * 100),
    y: clampPercent((event.clientY / height) * 100),
  };
}

export function createSessionReplayRecorder(options: RecorderOptions): {
  start: () => void;
  stop: () => ReplaySession | null;
  getSession: () => ReplaySession | null;
} {
  const maxEvents = Math.max(1, Math.floor(options.maxEvents ?? DEFAULT_MAX_EVENTS));
  const pointerThrottleMs = Math.max(
    0,
    Math.floor(options.pointerThrottleMs ?? DEFAULT_POINTER_THROTTLE_MS),
  );
  const now = options.now ?? Date.now;

  let active = false;
  let lastPointerAt = 0;
  let session: ReplaySession | null = null;
  const cleanups: Array<() => void> = [];

  const publish = (): void => {
    if (session) {
      options.onUpdate(session);
    }
  };

  const append = (event: Omit<ReplayEvent, "id">): void => {
    if (!session) {
      return;
    }

    const events =
      session.events.length >= maxEvents
        ? [...session.events.slice(1), { ...event, id: randomId("evt") }]
        : [...session.events, { ...event, id: randomId("evt") }];

    session = { ...session, events };
    publish();
  };

  const listen = <K extends keyof DocumentEventMap>(
    type: K,
    handler: (event: DocumentEventMap[K]) => void,
  ): void => {
    document.addEventListener(type, handler, { passive: true });
    cleanups.push(() => document.removeEventListener(type, handler));
  };

  return {
    start: (): void => {
      if (active) {
        return;
      }

      active = true;
      lastPointerAt = 0;
      session = {
        id: randomId("session"),
        startedAt: safeNow(now),
        events: [],
      };
      publish();

      listen("click", (event) => {
        if (isPrivateTarget(event.target)) {
          return;
        }

        append({
          kind: "click",
          at: safeNow(now),
          target: targetLabel(event.target),
          ...eventPoint(event),
        });
      });

      listen("pointermove", (event) => {
        const timestamp = safeNow(now);
        if (timestamp - lastPointerAt < pointerThrottleMs || isPrivateTarget(event.target)) {
          return;
        }

        lastPointerAt = timestamp;
        append({
          kind: "pointer",
          at: timestamp,
          target: targetLabel(event.target),
          ...eventPoint(event),
        });
      });

      listen("scroll", () => {
        append({
          kind: "scroll",
          at: safeNow(now),
          x: clampPercent(
            (window.scrollX / Math.max(document.documentElement.scrollWidth, 1)) * 100,
          ),
          y: clampPercent(
            (window.scrollY / Math.max(document.documentElement.scrollHeight, 1)) * 100,
          ),
        });
      });

      listen("input", (event) => {
        append({
          kind: "input",
          at: safeNow(now),
          target: isPrivateTarget(event.target) ? "private" : targetLabel(event.target),
        });
      });

      const historyHandler = (): void => {
        append({
          kind: "navigation",
          at: safeNow(now),
          route: safeRoute(window.location),
        });
      };

      window.addEventListener("popstate", historyHandler, { passive: true });
      cleanups.push(() => window.removeEventListener("popstate", historyHandler));
    },

    stop: (): ReplaySession | null => {
      if (!active) {
        return session;
      }

      active = false;
      cleanups.splice(0).forEach((cleanup) => cleanup());

      if (session) {
        session = { ...session, endedAt: safeNow(now) };
        publish();
      }

      return session;
    },

    getSession: (): ReplaySession | null => session,
  };
}
