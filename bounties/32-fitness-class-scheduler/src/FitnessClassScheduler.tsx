"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Booking,
  SchedulerError,
  SchedulerState,
  availableSpots,
  bookClass,
  cancelBooking,
  seedState,
  validateState,
} from "./domain";

const STORAGE_KEY = "agent-midas.fitness-scheduler.v1";

function newId(): string {
  return `booking-${crypto.randomUUID().replace(/[^a-z0-9-]/gi, "").toLowerCase()}`;
}

function loadState(): SchedulerState {
  if (typeof window === "undefined") return seedState;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? validateState(JSON.parse(raw) as SchedulerState) : seedState;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return seedState;
  }
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default function FitnessClassScheduler(): JSX.Element {
  const [state, setState] = useState<SchedulerState>(seedState);
  const [memberName, setMemberName] = useState("");
  const [notice, setNotice] = useState("Choose a class to reserve your spot.");

  useEffect(() => setState(loadState()), []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  const instructors = useMemo(
    () => new Map(state.instructors.map((instructor) => [instructor.id, instructor])),
    [state.instructors],
  );

  function reserve(event: FormEvent<HTMLFormElement>, classId: string): void {
    event.preventDefault();

    try {
      const next = bookClass(state, {
        bookingId: newId(),
        classId,
        memberName,
        now: new Date().toISOString(),
      });
      setState(next);
      setNotice(`Reserved: ${state.classes.find((item) => item.id === classId)?.title}.`);
    } catch (error) {
      setNotice(error instanceof SchedulerError ? error.message : "Unable to create booking.");
    }
  }

  function cancel(booking: Booking): void {
    try {
      setState(cancelBooking(state, booking.id, new Date().toISOString()));
      setNotice("Booking cancelled. The spot is available again.");
    } catch (error) {
      setNotice(error instanceof SchedulerError ? error.message : "Unable to cancel booking.");
    }
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] px-4 py-8 text-zinc-100 sm:px-8">
      <section className="mx-auto max-w-5xl">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#D4AF37]">
          Agent Midas Fitness
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">
          Find your next <span className="text-[#D4AF37]">session.</span>
        </h1>
        <p className="mt-3 max-w-2xl text-zinc-400">
          Reserve a gym class in seconds. Live availability prevents overbooking.
        </p>

        <p
          aria-live="polite"
          className="mt-6 rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-3 text-sm text-[#f6dda0]"
        >
          {notice}
        </p>

        <label className="mt-6 block max-w-md text-sm font-semibold text-zinc-200" htmlFor="member-name">
          Your name
          <input
            id="member-name"
            value={memberName}
            maxLength={80}
            onChange={(event) => setMemberName(event.target.value)}
            placeholder="e.g. Alex Morgan"
            autoComplete="name"
            className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30"
          />
        </label>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {state.classes.map((fitnessClass) => {
            const instructor = instructors.get(fitnessClass.instructorId);
            const spots = availableSpots(state, fitnessClass.id);

            return (
              <article
                key={fitnessClass.id}
                className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl shadow-black/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-xl font-bold">{fitnessClass.title}</h2>
                  <span className="rounded-full bg-[#D4AF37]/15 px-2 py-1 text-xs font-bold text-[#D4AF37]">
                    {fitnessClass.level}
                  </span>
                </div>
                <dl className="mt-5 space-y-2 text-sm text-zinc-400">
                  <div className="flex justify-between gap-4">
                    <dt>When</dt><dd className="text-right text-zinc-200">{formatDate(fitnessClass.startsAt)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Instructor</dt><dd className="text-right text-zinc-200">{instructor?.name}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Duration</dt><dd className="text-zinc-200">{fitnessClass.durationMinutes} min</dd>
                  </div>
                </dl>

                <form onSubmit={(event) => reserve(event, fitnessClass.id)} className="mt-6">
                  <button
                    type="submit"
                    disabled={spots === 0}
                    className="w-full rounded-md bg-[#D4AF37] px-4 py-2 font-bold text-black transition hover:bg-[#edcf65] disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
                  >
                    {spots === 0 ? "Class full" : `Reserve · ${spots} spot${spots === 1 ? "" : "s"} left`}
                  </button>
                </form>
              </article>
            );
          })}
        </div>

        <section aria-labelledby="my-bookings" className="mt-10">
          <h2 id="my-bookings" className="text-2xl font-bold">My bookings</h2>
          {state.bookings.length === 0 ? (
            <p className="mt-3 text-zinc-400">No reservations yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {state.bookings.map((booking) => {
                const fitnessClass = state.classes.find((item) => item.id === booking.classId);
                return (
                  <li key={booking.id} className="flex items-center justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                    <div>
                      <p className="font-bold">{fitnessClass?.title}</p>
                      <p className="text-sm text-zinc-400">{booking.memberName} · {fitnessClass && formatDate(fitnessClass.startsAt)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => cancel(booking)}
                      className="rounded-md border border-red-400/50 px-3 py-2 text-sm font-semibold text-red-300 hover:bg-red-400/10"
                    >
                      Cancel
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </section>
    </main>
  );
}
