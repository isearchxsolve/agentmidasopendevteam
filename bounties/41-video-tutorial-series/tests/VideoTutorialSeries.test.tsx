import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { VideoTutorialSeries } from "../src/VideoTutorialSeries";
import type { VideoTutorial } from "../src/types";

const tutorials: VideoTutorial[] = [
  {
    id: "concurrency",
    title: "Concurrency Without Compromise",
    description: "Lock-free coordination and failure boundaries.",
    duration: "22 min",
    level: "Advanced",
    videoUrl: "https://www.youtube.com/watch?v=concurrency",
    thumbnailUrl: "https://www.youtube.com/thumbnail.jpg"
  }
];

describe("VideoTutorialSeries", () => {
  it("renders approved tutorial content with safe external link attributes", () => {
    render(<VideoTutorialSeries tutorials={tutorials} />);

    expect(screen.getByText("Concurrency Without Compromise")).toBeInTheDocument();

    const link = screen.getByRole("link", {
      name: /watch concurrency without compromise/i
    });

    expect(link).toHaveAttribute(
      "href",
      "https://www.youtube.com/watch?v=concurrency"
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("does not render malicious tutorial URLs", () => {
    render(
      <VideoTutorialSeries
        tutorials={[
          {
            ...tutorials[0],
            id: "malicious",
            videoUrl: "javascript:alert('xss')"
          }
        ]}
      />
    );

    expect(
      screen.getByText("No verified tutorials are currently available.")
    ).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("calls the optional telemetry callback only for verified tutorial opens", () => {
    const onTutorialOpen = vi.fn();

    render(
      <VideoTutorialSeries
        tutorials={tutorials}
        onTutorialOpen={onTutorialOpen}
      />
    );

    fireEvent.click(
      screen.getByRole("link", {
        name: /watch concurrency without compromise/i
      })
    );

    expect(onTutorialOpen).toHaveBeenCalledTimes(1);
    expect(onTutorialOpen).toHaveBeenCalledWith(tutorials[0]);
  });

  it("renders an accessible empty state when there are no approved tutorials", () => {
    render(<VideoTutorialSeries tutorials={[]} />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "No verified tutorials are currently available."
    );
  });
});
