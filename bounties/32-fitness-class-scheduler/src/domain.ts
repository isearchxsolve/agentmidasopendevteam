export type ClassLevel = "Beginner" | "Intermediate" | "Advanced";

export interface Instructor {
  id: string;
  name: string;
  specialty: string;
}

export interface FitnessClass {
  id: string;
  title: string;
  startsAt: string;
  durationMinutes: number;
  capacity: number;
  instructorId: string;
  level: ClassLevel;
}

export interface Booking {
  id: string;
  classId: string;
  memberName: string;
  createdAt: string;
}

export interface SchedulerState {
  version: 1;
  instructors: Instructor[];
  classes: FitnessClass[];
  bookings: Booking[];
}

const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;
const ISO_UTC_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const MAX_MEMBER_NAME_LENGTH = 80;

export class SchedulerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SchedulerError";
  }
}

function assertId(value: string, label: string): void {
  if (!ID_PATTERN.test(value)) {
    throw new SchedulerError(`${label} must be a lowercase URL-safe identifier.`);
  }
}

function assertUtcIso(value: string, label: string): void {
  if (!ISO_UTC_PATTERN.test(value) || Number.isNaN(Date.parse(value))) {
    throw new SchedulerError(`${label} must be an ISO-8601 UTC timestamp.`);
  }
}

export function normalizeMemberName(value: string): string {
  const normalized = value.trim().replace(/\s+/g, " ");

  if (normalized.length < 2 || normalized.length > MAX_MEMBER_NAME_LENGTH) {
    throw new SchedulerError(
      `Member name must contain between 2 and ${MAX_MEMBER_NAME_LENGTH} characters.`,
    );
  }

  if (!/^[\p{L}\p{M}][\p{L}\p{M}' -]*$/u.test(normalized)) {
    throw new SchedulerError("Member name contains unsupported characters.");
  }

  return normalized;
}

export function validateState(state: SchedulerState): SchedulerState {
  if (state.version !== 1 || !Array.isArray(state.instructors) ||
      !Array.isArray(state.classes) || !Array.isArray(state.bookings)) {
    throw new SchedulerError("Scheduler data has an unsupported schema.");
  }

  const instructorIds = new Set<string>();
  for (const instructor of state.instructors) {
    assertId(instructor.id, "Instructor id");
    if (!instructor.name.trim() || instructor.name.length > 80) {
      throw new SchedulerError("Instructor name is invalid.");
    }
    if (instructorIds.has(instructor.id)) {
      throw new SchedulerError("Instructor identifiers must be unique.");
    }
    instructorIds.add(instructor.id);
  }

  const classIds = new Set<string>();
  for (const fitnessClass of state.classes) {
    assertId(fitnessClass.id, "Class id");
    assertUtcIso(fitnessClass.startsAt, "Class start time");

    if (!fitnessClass.title.trim() || fitnessClass.title.length > 100) {
      throw new SchedulerError("Class title is invalid.");
    }
    if (!Number.isInteger(fitnessClass.durationMinutes) ||
        fitnessClass.durationMinutes < 15 ||
        fitnessClass.durationMinutes > 240) {
      throw new SchedulerError("Class duration must be between 15 and 240 minutes.");
    }
    if (!Number.isInteger(fitnessClass.capacity) ||
        fitnessClass.capacity < 1 ||
        fitnessClass.capacity > 500) {
      throw new SchedulerError("Class capacity must be between 1 and 500.");
    }
    if (!instructorIds.has(fitnessClass.instructorId)) {
      throw new SchedulerError("Every class must have a known instructor.");
    }
    if (classIds.has(fitnessClass.id)) {
      throw new SchedulerError("Class identifiers must be unique.");
    }
    classIds.add(fitnessClass.id);
  }

  const bookingIds = new Set<string>();
  const memberClassPairs = new Set<string>();
  const bookingCountByClass = new Map<string, number>();

  for (const booking of state.bookings) {
    assertId(booking.id, "Booking id");
    assertId(booking.classId, "Booking class id");
    assertUtcIso(booking.createdAt, "Booking creation time");
    normalizeMemberName(booking.memberName);

    if (!classIds.has(booking.classId)) {
      throw new SchedulerError("A booking refers to an unknown class.");
    }
    if (bookingIds.has(booking.id)) {
      throw new SchedulerError("Booking identifiers must be unique.");
    }

    const pair = `${booking.classId}:${booking.memberName.toLocaleLowerCase()}`;
    if (memberClassPairs.has(pair)) {
      throw new SchedulerError("A member may only book a class once.");
    }

    bookingIds.add(booking.id);
    memberClassPairs.add(pair);
    bookingCountByClass.set(
      booking.classId,
      (bookingCountByClass.get(booking.classId) ?? 0) + 1,
    );
  }

  for (const fitnessClass of state.classes) {
    if ((bookingCountByClass.get(fitnessClass.id) ?? 0) > fitnessClass.capacity) {
      throw new SchedulerError(`Class "${fitnessClass.title}" exceeds capacity.`);
    }
  }

  return state;
}

export function availableSpots(state: SchedulerState, classId: string): number {
  const fitnessClass = state.classes.find((item) => item.id === classId);
  if (!fitnessClass) {
    throw new SchedulerError("Class was not found.");
  }

  return fitnessClass.capacity -
    state.bookings.filter((booking) => booking.classId === classId).length;
}

export function bookClass(
  state: SchedulerState,
  input: { bookingId: string; classId: string; memberName: string; now: string },
): SchedulerState {
  validateState(state);
  assertId(input.bookingId, "Booking id");
  assertId(input.classId, "Class id");
  assertUtcIso(input.now, "Booking time");

  const memberName = normalizeMemberName(input.memberName);
  const fitnessClass = state.classes.find((item) => item.id === input.classId);

  if (!fitnessClass) {
    throw new SchedulerError("This class is no longer available.");
  }
  if (Date.parse(fitnessClass.startsAt) <= Date.parse(input.now)) {
    throw new SchedulerError("Bookings close once a class has started.");
  }
  if (availableSpots(state, fitnessClass.id) <= 0) {
    throw new SchedulerError("This class is fully booked.");
  }
  if (state.bookings.some((booking) => booking.id === input.bookingId)) {
    throw new SchedulerError("Booking identifier already exists.");
  }
  if (
    state.bookings.some(
      (booking) =>
        booking.classId === input.classId &&
        booking.memberName.localeCompare(memberName, undefined, {
          sensitivity: "accent",
          usage: "search",
        }) === 0,
    )
  ) {
    throw new SchedulerError("You already have a booking for this class.");
  }

  return validateState({
    ...state,
    bookings: [
      ...state.bookings,
      {
        id: input.bookingId,
        classId: input.classId,
        memberName,
        createdAt: input.now,
      },
    ],
  });
}

export function cancelBooking(
  state: SchedulerState,
  bookingId: string,
  now: string,
): SchedulerState {
  validateState(state);
  assertId(bookingId, "Booking id");
  assertUtcIso(now, "Cancellation time");

  const booking = state.bookings.find((item) => item.id === bookingId);
  if (!booking) {
    throw new SchedulerError("Booking was not found.");
  }

  const fitnessClass = state.classes.find((item) => item.id === booking.classId);
  if (!fitnessClass || Date.parse(fitnessClass.startsAt) <= Date.parse(now)) {
    throw new SchedulerError("Started classes cannot be cancelled.");
  }

  return validateState({
    ...state,
    bookings: state.bookings.filter((item) => item.id !== bookingId),
  });
}

export const seedState: SchedulerState = {
  version: 1,
  instructors: [
    { id: "maya-patel", name: "Maya Patel", specialty: "Strength & Mobility" },
    { id: "leo-martin", name: "Leo Martin", specialty: "Yoga & Recovery" },
    { id: "amina-owusu", name: "Amina Owusu", specialty: "Cardio & HIIT" },
  ],
  classes: [
    {
      id: "golden-flow",
      title: "Golden Flow Yoga",
      startsAt: "2026-11-03T06:30:00.000Z",
      durationMinutes: 60,
      capacity: 16,
      instructorId: "leo-martin",
      level: "Beginner",
    },
    {
      id: "power-circuit",
      title: "Power Circuit",
      startsAt: "2026-11-03T17:30:00.000Z",
      durationMinutes: 45,
      capacity: 12,
      instructorId: "amina-owusu",
      level: "Intermediate",
    },
    {
      id: "barbell-foundations",
      title: "Barbell Foundations",
      startsAt: "2026-11-04T06:00:00.000Z",
      durationMinutes: 75,
      capacity: 10,
      instructorId: "maya-patel",
      level: "Advanced",
    },
  ],
  bookings: [],
};
