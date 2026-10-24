import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FunnelVisualizer } from "./FunnelVisualizer";

describe("FunnelVisualizer", () => {
  const stages = [
    { id: "visit", label: "Visitors", value: 1000 },
    { id: "buy", label: "Customers", value: 125 },
  ];

  it("renders accessible stage metrics", () => {
    render(<FunnelVisualizer title="Revenue Funnel" stages={stages} />);

    expect(screen.getByRole("heading", { name: "Revenue Funnel" })).toBeInTheDocument();
    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getByRole("listitem", { name: /Visitors: 1,000/i })).toBeInTheDocument();
    expect(screen.getByRole("listitem", { name: /Customers: 125/i })).toBeInTheDocument();
    expect(screen.getByText("12.5% from prior")).toBeInTheDocument();
  });

  it("calls the explicit stage selection callback", () => {
    const onStageSelect = vi.fn();

    render(<FunnelVisualizer stages={stages} onStageSelect={onStageSelect} />);
    fireEvent.click(screen.getByRole("listitem", { name: /Customers/i }));

    expect(onStageSelect).toHaveBeenCalledWith("buy");
  });

  it("renders a safe empty state", () => {
    render(<FunnelVisualizer stages={[]} />);
    expect(screen.getByText("No funnel stages are available.")).toBeInTheDocument();
  });

  it("contains invalid external input in an error state", () => {
    render(
      <FunnelVisualizer
        stages={[{ id: "x", label: "Invalid", value: -3 }]}
      />,
    );

    expect(screen.getByText("Funnel unavailable")).toBeInTheDocument();
    expect(screen.getByText(/value must be a safe integer/i)).toBeInTheDocument();
  });
});
