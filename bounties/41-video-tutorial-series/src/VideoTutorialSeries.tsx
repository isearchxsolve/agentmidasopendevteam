import { useMemo, useState } from "react";
import { safeExternalUrl, validTutorials } from "./security";
import type { VideoTutorial, VideoTutorialSeriesProps } from "./types";

const levelStyles: Record<VideoTutorial["level"], string> = {
  Foundation: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  Intermediate: "border-amber-400/40 bg-amber-400/10 text-amber-200",
  Advanced: "border-rose-400/40 bg-rose-400/10 text-rose-200"
};

function TutorialCard({
  tutorial,
  allowedVideoHosts,
  onTutorialOpen
}: {
  tutorial: VideoTutorial;
  allowedVideoHosts?: readonly string[];
  onTutorialOpen?: (tutorial: VideoTutorial) => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const videoUrl = safeExternalUrl(tutorial.videoUrl, allowedVideoHosts);
  const thumbnailUrl = tutorial.thumbnailUrl
    ? safeExternalUrl(tutorial.thumbnailUrl, allowedVideoHosts)
    : null;

  if (!videoUrl) {
    return null;
  }

  const handleOpen = () => {
    onTutorialOpen?.(tutorial);
  };

  return (
    <article
      className="group overflow-hidden rounded-2xl border border-amber-400/20 bg-zinc-950 shadow-[0_0_30px_rgba(251,191,36,0.06)] transition hover:-translate-y-1 hover:border-amber-300/60"
      aria-labelledby={`tutorial-${tutorial.id}`}
    >
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-zinc-800 to-black">
        {thumbnailUrl && !imageFailed ? (
          <img
            src={thumbnailUrl}
            alt=""
            className="h-full w-full object-cover opacity-80 transition duration-300 group-hover:scale-105 group-hover:opacity-100"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div
            className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_center,_rgba(251,191,36,0.18),_transparent_58%)]"
            aria-hidden="true"
          >
            <span className="rounded-full border border-amber-300/40 bg-black/70 px-5 py-3 text-sm font-semibold tracking-[0.16em] text-amber-200">
              AGENT MIDAS
            </span>
          </div>
        )}

        <span className="absolute bottom-3 left-3 rounded-full bg-black/80 px-3 py-1 text-xs font-semibold text-amber-100">
          {tutorial.duration}
        </span>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3
            id={`tutorial-${tutorial.id}`}
            className="text-lg font-bold leading-tight text-zinc-100"
          >
            {tutorial.title}
          </h3>
          <span
            className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${levelStyles[tutorial.level]}`}
          >
            {tutorial.level}
          </span>
        </div>

        <p className="text-sm leading-6 text-zinc-400">{tutorial.description}</p>

        <a
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          referrerPolicy="no-referrer"
          onClick={handleOpen}
          className="inline-flex min-h-11 items-center rounded-lg bg-amber-300 px-4 py-2 text-sm font-bold text-black transition hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:ring-offset-2 focus:ring-offset-zinc-950"
          aria-label={`Watch ${tutorial.title} in a new tab`}
        >
          Watch tutorial
          <span aria-hidden="true" className="ml-2">↗</span>
        </a>
      </div>
    </article>
  );
}

export function VideoTutorialSeries({
  title = "Agent Midas Video Tutorials",
  subtitle = "Production patterns, security boundaries, and practical implementation guidance.",
  tutorials,
  allowedVideoHosts,
  onTutorialOpen
}: VideoTutorialSeriesProps) {
  const safeTutorials = useMemo(
    () => validTutorials(tutorials, allowedVideoHosts),
    [tutorials, allowedVideoHosts]
  );

  return (
    <section
      className="bg-black px-4 py-12 text-zinc-100 sm:px-6 lg:px-8"
      aria-labelledby="video-tutorial-series-title"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 max-w-3xl">
          <p className="mb-3 text-xs font-bold tracking-[0.24em] text-amber-300">
            AGENT MIDAS ACADEMY
          </p>
          <h2
            id="video-tutorial-series-title"
            className="text-3xl font-black tracking-tight text-white sm:text-4xl"
          >
            {title}
          </h2>
          <p className="mt-4 text-base leading-7 text-zinc-400">{subtitle}</p>
        </div>

        {safeTutorials.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {safeTutorials.map((tutorial) => (
              <TutorialCard
                key={tutorial.id}
                tutorial={tutorial}
                allowedVideoHosts={allowedVideoHosts}
                onTutorialOpen={onTutorialOpen}
              />
            ))}
          </div>
        ) : (
          <div
            role="status"
            className="rounded-2xl border border-amber-400/20 bg-zinc-950 p-8 text-zinc-400"
          >
            No verified tutorials are currently available.
          </div>
        )}
      </div>
    </section>
  );
}
