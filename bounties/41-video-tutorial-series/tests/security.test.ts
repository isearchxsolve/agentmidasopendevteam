import { describe, expect, it } from "vitest";
import { safeExternalUrl, validTutorials } from "../src/security";
import type { VideoTutorial } from "../src/types";

const validTutorial: VideoTutorial = {
  id: "routing-foundations",
  title: "High Throughput Routing",
  description: "Safe routing patterns for distributed services.",
  duration: "18 min",
  level: "Foundation",
  videoUrl: "https://www.youtube.com/watch?v=abc123",
  thumbnailUrl: "https://www.youtube.com/thumbnail.jpg"
};

describe("safeExternalUrl", () => {
  it("accepts HTTPS URLs from approved video hosts", () => {
    expect(safeExternalUrl(validTutorial.videoUrl)).toBe(
      "https://www.youtube.com/watch?v=abc123"
    );
  });

  it("rejects script and data URL injection", () => {
    expect(safeExternalUrl("javascript:alert(1)")).toBeNull();
    expect(safeExternalUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
  });

  it("rejects insecure, credentialed, and unapproved hosts", () => {
    expect(safeExternalUrl("http://youtube.com/watch?v=abc")).toBeNull();
    expect(safeExternalUrl("https://evil.example/watch?v=abc")).toBeNull();
    expect(safeExternalUrl("https://user:secret@youtube.com/watch?v=abc")).toBe(
      "https://youtube.com/watch?v=abc"
    );
  });

  it("supports explicit host boundaries", () => {
    expect(
      safeExternalUrl("https://training.example.com/video/1", ["training.example.com"])
    ).toBe("https://training.example.com/video/1");

    expect(
      safeExternalUrl("https://youtube.com/watch?v=abc", ["training.example.com"])
    ).toBeNull();
  });
});

describe("validTutorials", () => {
  it("keeps valid unique records and drops invalid or duplicate records", () => {
    const tutorials = validTutorials([
      validTutorial,
      validTutorial,
      { ...validTutorial, id: "unsafe", videoUrl: "javascript:alert(1)" },
      { ...validTutorial, id: "missing-title", title: "" }
    ]);

    expect(tutorials).toHaveLength(1);
    expect(tutorials[0]?.id).toBe("routing-foundations");
  });
});
