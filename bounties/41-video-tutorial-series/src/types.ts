export interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  level: "Foundation" | "Intermediate" | "Advanced";
  videoUrl: string;
  thumbnailUrl?: string;
}

export interface VideoTutorialSeriesProps {
  title?: string;
  subtitle?: string;
  tutorials: readonly VideoTutorial[];
  allowedVideoHosts?: readonly string[];
  onTutorialOpen?: (tutorial: VideoTutorial) => void;
}
