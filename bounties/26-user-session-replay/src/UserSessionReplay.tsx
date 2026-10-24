"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  createSessionReplayRecorder,
  type ReplayEvent,
  type ReplaySession,
} from "./sessionReplay";

export interface UserSessionReplayProps {
  readonly initialSessions?: readonly ReplaySession[];
  readonly maxEvents?: number;
}

const labels: Record<ReplayEvent["kind"], string> = {
  click: "Click",
  pointer: "Pointer",
  scroll: "Scroll",
  navigation: "Navigation",
  input: "Input",
};

function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(timestamp));
}

function duration(session: ReplaySession): number {
  return Math.max(0, (session.endedAt ?? Date.now()) - session.startedAt);
}

function durationLabel(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  return `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, "0")}s`;
}

export function UserSessionReplay({
  initialSessions = [],
  maxEvents = 2_000,
}: UserSessionReplayProps): JSX.Element {
  const [sessions, setSessions] = useState<readonly ReplaySession[]>(initialSessions);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSessions[0]?.id ?? null,
  );
  const [hasConsent, setHasConsent] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [cursor, setCursor] = useState(0);
  const recorderRef = useRef<ReturnType<typeof createSessionReplayRecorder> | null>(null);

  const selected = useMemo(
    () => sessions.find((session) => session.id === selectedId) ?? null,
    [selectedId, sessions],
  );

  const visibleEvents = selected?.events.slice(0, cursor + 1) ?? [];
  const currentEvent = visibleEvents.at(-1) ?? null;

  useEffect(() => {
    return () => {
      recorderRef.current?.stop();
    };
  }, []);

  const beginRecording = (): void => {
    if (!hasConsent || isRecording) {
      return;
    }

    const recorder = createSessionReplayRecorder({
      maxEvents,
      onUpdate: (session) => {
        setSessions((existing) => {
          const withoutCurrent = existing.filter((item) => item.id !== session.id);
          return [session, ...withoutCurrent].slice(0, 25);
        });
        setSelectedId(session.id);
      },
    });

    recorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
    setCursor(0);
  };

  const stopRecording = (): void => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setIsRecording(false);
  };

  const deleteSelected = (): void => {
    if (!selected) {
      return;
    }

    setSessions((existing) => existing.filter((session) => session.id !== selected.id));
    setSelectedId(null);
    setCursor(0);
  };

  return (
    <section className="min-h-screen bg-[#0A0A0A] px-4 py-6 text-[#F5F5F5] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 border-b border-[#2A2A2A] pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-xs tracking-[0.2em] text-[#D4AF37]">ANALYTICS / REPLAY</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">User Session Replay</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#9CA3AF]">
              Consent-based interaction telemetry. Sensitive fields, text values, tokens, DOM
              content, and query parameters are never captured.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-[#9CA3AF]">
              <input
                checked={hasConsent}
                className="h-4 w-4 accent-[#D4AF37]"
                onChange={(event) => setHasConsent(event.target.checked)}
                type="checkbox"
              />
              I have capture consent
            </label>
            <button
              className="rounded-md border border-[#D4AF37] bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-[#0A0A0A] transition hover:bg-[#E8C547] focus:outline-none focus:ring-2 focus:ring-[#E8C547] focus:ring-offset-2 focus:ring-offset-[#0A0A0A] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!hasConsent || isRecording}
              onClick={beginRecording}
              type="button"
            >
              Start recording
            </button>
            <button
              className="rounded-md border border-[#2A2A2A] bg-[#0D0D0D] px-4 py-2 text-sm font-semibold transition hover:bg-[#141414] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2 focus:ring-offset-[#0A0A0A] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!isRecording}
              onClick={stopRecording}
              type="button"
            >
              Stop
            </button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-lg border border-[#2A2A2A] bg-[#0D0D0D] p-3">
            <div className="mb-3 flex items-center justify-between px-2">
              <h2 className="text-sm font-semibold">Sessions</h2>
              <span className="font-mono text-xs text-[#9CA3AF]">{sessions.length}</span>
            </div>

            <div className="space-y-2">
              {sessions.length === 0 ? (
                <p className="rounded-md border border-dashed border-[#2A2A2A] p-4 text-sm text-[#6B7280]">
                  No captured sessions.
                </p>
              ) : (
                sessions.map((session) => (
                  <button
                    aria-pressed={session.id === selectedId}
                    className={`w-full rounded-md border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-[#D4AF37] ${
                      session.id === selectedId
                        ? "border-[#D4AF37] bg-[#141414]"
                        : "border-[#2A2A2A] hover:bg-[#141414]"
                    }`}
                    key={session.id}
                    onClick={() => {
                      setSelectedId(session.id);
                      setCursor(0);
                    }}
                    type="button"
                  >
                    <span className="block font-mono text-xs text-[#D4AF37]">
                      {session.id.slice(0, 18)}
                    </span>
                    <span className="mt-1 block text-xs text-[#9CA3AF]">
                      {session.events.length} events · {durationLabel(duration(session))}
                    </span>
                  </button>
                ))
              )}
            </div>
          </aside>

          <main className="space-y-6">
            <div className="rounded-lg border border-[#2A2A2A] bg-[#0D0D0D] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold">Replay timeline</h2>
                  <p className="mt-1 text-sm text-[#9CA3AF]">
                    {selected
                      ? `${selected.events.length} privacy-filtered events`
                      : "Select a session to inspect its event timeline."}
                  </p>
                </div>
                <button
                  className="rounded-md border border-[#2A2A2A] px-3 py-2 text-sm text-[#9CA3AF] transition hover:bg-[#141414] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] disabled:opacity-40"
                  disabled={!selected}
                  onClick={deleteSelected}
                  type="button"
                >
                  Delete session
                </button>
              </div>

              {selected && (
                <>
                  <input
                    aria-label="Replay position"
                    className="mt-6 w-full accent-[#D4AF37]"
                    max={Math.max(selected.events.length - 1, 0)}
                    min="0"
                    onChange={(event) => setCursor(Number(event.target.value))}
                    type="range"
                    value={Math.min(cursor, Math.max(selected.events.length - 1, 0))}
                  />

                  <div className="mt-4 rounded-md border border-[#2A2A2A] bg-[#0A0A0A] p-4">
                    <p className="font-mono text-xs text-[#D4AF37]">
                      {currentEvent ? formatTime(currentEvent.at) : "No events"}
                    </p>
                    <p className="mt-2 text-lg font-medium">
                      {currentEvent ? labels[currentEvent.kind] : "Waiting"}
                    </p>
                    <p className="mt-1 text-sm text-[#9CA3AF]">
                      {currentEvent?.route ??
                        currentEvent?.target ??
                        "No content or field value was recorded."}
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="rounded-lg border border-[#2A2A2A] bg-[#0D0D0D] p-5">
              <h2 className="font-semibold">Interaction heatmap</h2>
              <p className="mt-1 text-sm text-[#9CA3AF]">
                Normalized pointer and click positions from the selected session.
              </p>

              <div
                aria-label="Interaction heatmap"
                className="relative mt-5 aspect-video overflow-hidden rounded-md border border-[#2A2A2A] bg-[radial-gradient(circle_at_center,_#141414_0,_#0A0A0A_70%)]"
              >
                {visibleEvents
                  .filter(
                    (event) =>
                      (event.kind === "click" || event.kind === "pointer") &&
                      event.x !== undefined &&
                      event.y !== undefined,
                  )
                  .map((event) => (
                    <span
                      aria-label={`${labels[event.kind]} interaction`}
                      className={`absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                        event.kind === "click"
                          ? "bg-[#D4AF37]/80 ring-4 ring-[#D4AF37]/20"
                          : "bg-[#E8C547]/30"
                      }`}
                      key={event.id}
                      style={{ left: `${event.x}%`, top: `${event.y}%` }}
                    />
                  ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </section>
  );
}
