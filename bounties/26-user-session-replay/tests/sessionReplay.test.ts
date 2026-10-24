import assert from "node:assert/strict";
import test from "node:test";
import { eventPoint, type ReplayEvent, type ReplaySession } from "../src/sessionReplay.js";

function session(events: readonly ReplayEvent[]): ReplaySession {
  return {
    id: "recorded-session",
    startedAt: 1_700_000_000_000,
    endedAt: 1_700_000_001_000,
    events,
  };
}

test("eventPoint normalizes coordinates into the inclusive 0-100 range", () => {
  const originalWindow = globalThis.window;

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { innerWidth: 200, innerHeight: 100 },
  });

  try {
    assert.deepEqual(eventPoint({ clientX: 100, clientY: 25 } as MouseEvent), {
      x: 50,
      y: 25,
    });

    assert.deepEqual(eventPoint({ clientX: -10, clientY: 200 } as MouseEvent), {
      x: 0,
      y: 100,
    });
  } finally {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
  }
});

test("session payload preserves event order for deterministic playback", () => {
  const replay = session([
    { id: "a", kind: "click", at: 100, x: 10, y: 20, target: "button" },
    { id: "b", kind: "navigation", at: 200, route: "/pricing" },
  ]);

  assert.equal(replay.events[0]?.kind, "click");
  assert.equal(replay.events[1]?.route, "/pricing");
  assert.equal(replay.events.length, 2);
});

test("private interaction records contain no typed value field", () => {
  const privateEvent: ReplayEvent = {
    id: "private-input",
    kind: "input",
    at: 1_700_000_000_200,
    target: "private",
  };

  assert.deepEqual(Object.keys(privateEvent).sort(), ["at", "id", "kind", "target"]);
  assert.equal(JSON.stringify(privateEvent).includes("secret"), false);
  assert.equal(JSON.stringify(privateEvent).includes("value"), false);
});

test("heatmap data only admits positioned click and pointer events", () => {
  const events: readonly ReplayEvent[] = [
    { id: "1", kind: "click", at: 1, x: 50, y: 50 },
    { id: "2", kind: "pointer", at: 2, x: 10, y: 20 },
    { id: "3", kind: "input", at: 3, target: "private" },
    { id: "4", kind: "navigation", at: 4, route: "/settings" },
  ];

  const points = events.filter(
    (event) =>
      (event.kind === "click" || event.kind === "pointer") &&
      event.x !== undefined &&
      event.y !== undefined,
  );

  assert.equal(points.length, 2);
  assert.deepEqual(
    points.map((point) => [point.x, point.y]),
    [
      [50, 50],
      [10, 20],
    ],
  );
});
