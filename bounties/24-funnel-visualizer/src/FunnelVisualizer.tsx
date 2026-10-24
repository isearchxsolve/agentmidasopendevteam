import { useId, useMemo } from "react";
import {
  buildFunnelStages,
  formatMetric,
  FunnelValidationError,
  type FunnelStageInput,
} from "./funnel";

export type FunnelVisualizerProps = Readonly<{
  stages: readonly FunnelStageInput[];
  title?: string;
  locale?: string;
  className?: string;
  onStageSelect?: (stageId: string) => void;
}>;

function mergeClassNames(...classes: Array<string | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function FunnelVisualizer({
  stages,
  title = "Conversion Funnel",
  locale = "en-US",
  className,
  onStageSelect,
}: FunnelVisualizerProps): JSX.Element {
  const generatedId = useId();
  const chartId = `funnel-${generatedId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const result = useMemo(() => {
    try {
      return { stages: buildFunnelStages(stages), error: null as string | null };
    } catch (error) {
      return {
        stages: [],
        error:
          error instanceof FunnelValidationError
            ? error.message
            : "Unable to render funnel data.",
      };
    }
  }, [stages]);

  if (result.error) {
    return (
      <section
        aria-live="polite"
        className={mergeClassNames(
          "rounded-xl border border-red-900 bg-black p-5 text-red-300",
          className,
        )}
      >
        <h2 className="text-lg font-semibold">Funnel unavailable</h2>
        <p className="mt-1 text-sm">{result.error}</p>
      </section>
    );
  }

  if (result.stages.length === 0) {
    return (
      <section
        aria-label={title}
        className={mergeClassNames(
          "rounded-xl border border-[#4A3B13] bg-black p-8 text-center text-[#C5B98C]",
          className,
        )}
      >
        <h2 className="text-lg font-semibold text-[#D4AF37]">{title}</h2>
        <p className="mt-2 text-sm">No funnel stages are available.</p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby={`${chartId}-title`}
      className={mergeClassNames(
        "rounded-xl border border-[#4A3B13] bg-[#090909] p-5 text-[#F6E7B0] shadow-[0_0_30px_rgba(212,175,55,0.08)]",
        className,
      )}
    >
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={`${chartId}-title`} className="text-xl font-bold text-[#D4AF37]">
          {title}
        </h2>
        <span className="text-xs uppercase tracking-[0.16em] text-[#A99555]">
          {result.stages.length} stages
        </span>
      </div>

      <div
        aria-label={`${title} visualization`}
        className="space-y-3"
        role="list"
      >
        {result.stages.map((stage, index) => {
          const conversion =
            stage.conversionFromPrevious === null
              ? "Baseline"
              : `${stage.conversionFromPrevious}% from prior`;

          return (
            <button
              type="button"
              key={stage.id}
              role="listitem"
              aria-label={`${stage.label}: ${formatMetric(stage.value, locale)}. ${conversion}.`}
              onClick={() => onStageSelect?.(stage.id)}
              className="group block w-full rounded-lg text-left outline-none ring-[#D4AF37] transition focus-visible:ring-2"
            >
              <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                <span className="truncate font-medium text-[#F6E7B0]">
                  {index + 1}. {stage.label}
                </span>
                <span className="shrink-0 font-mono text-[#D4AF37]">
                  {formatMetric(stage.value, locale)}
                </span>
              </div>

              <div
                className="h-11 overflow-hidden rounded-md border border-[#3B3013] bg-[#15120A]"
                aria-hidden="true"
              >
                <div
                  className="flex h-full min-w-[2.5rem] items-center justify-end px-3 transition-[width] duration-300 group-hover:brightness-125"
                  style={{
                    width: `${Math.max(stage.widthPercent, 2.5)}%`,
                    backgroundColor: stage.color,
                  }}
                >
                  <span className="text-xs font-bold text-black">
                    {stage.conversionFromFirst}%
                  </span>
                </div>
              </div>

              <p className="mt-1 text-xs text-[#A99555]">{conversion}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
