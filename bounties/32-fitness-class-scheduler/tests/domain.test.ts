import assert from "node:assert/strict";
import test from "node:test";
import {
  SchedulerError,
  availableSpots,
  bookClass,
  cancelBooking,
  normalizeMemberName,
  seedState,
  validateState,
} from "../src/domain";

const FUTURE = "2026-11-01T00:00:00.000Z";
const PAST = "2026-12-01T00:00:00.000Z";

test("creates a valid booking and reduces available capacity", () => {
  const next = bookClass(seedState, {
    bookingId: "booking-alex",
    classId: "golden-flow",
    memberName: "  Alex   Morgan ",
    now: FUTURE,
  });

  assert.equal(next.bookings.length, 1);
  assert.equal(next.bookings[0].memberName, "Alex Morgan");
  assert.equal(availableSpots(next, "golden-flow"), 15);
});

test("rejects a duplicate member booking for the same class", () => {
  const booked = bookClass(seedState, {
    bookingId: "booking-alex",
    classId: "golden-flow",
    memberName: "Alex Morgan",
    now: FUTURE,
  });

  assert.throws(
    () => bookClass(booked, {
      bookingId: "booking-alex-2",
      classId: "golden-flow",
      memberName: "Alex Morgan",
      now: FUTURE,
    }),
    SchedulerError,
  );
});

test("rejects a booking after its class starts", () => {
  assert.throws(
    () => bookClass(seedState, {
      bookingId: "booking-late",
      classId: "golden-flow",
      memberName: "Maya Stone",
      now: PAST,
    }),
    /Bookings close/,
  );
});

test("enforces class capacity", () => {
  const classId = "golden-flow";
  let state = {
    ...seedState,
    classes: seedState.classes.map((item) =>
      item.id === classId ? { ...item, capacity: 1 } : item,
    ),
  };

  state = bookClass(state, {
    bookingId: "booking-one",
    classId,
    memberName: "Jamie Lee",
    now: FUTURE,
  });

  assert.throws(
    () => bookClass(state, {
      bookingId: "booking-two",
      classId,
      memberName: "Taylor Reed",
      now: FUTURE,
    }),
    /fully booked/,
  );
});

test("cancels a future booking and restores capacity", () => {
  const booked = bookClass(seedState, {
    bookingId: "booking-cancel",
    classId: "power-circuit",
    memberName: "Jordan Kim",
    now: FUTURE,
  });

  const cancelled = cancelBooking(booked, "booking-cancel", FUTURE);

  assert.equal(cancelled.bookings.length, 0);
  assert.equal(availableSpots(cancelled, "power-circuit"), 12);
});

test("rejects malformed member input and corrupted persisted state", () => {
  assert.throws(() => normalizeMemberName("<script>alert(1)</script>"), SchedulerError);

  assert.throws(
    () => validateState({
      ...seedState,
      bookings: [{
        id: "bad-booking",
        classId: "missing-class",
        memberName: "Alex Morgan",
        createdAt: FUTURE,
      }],
    }),
    /unknown class/,
  );
});
