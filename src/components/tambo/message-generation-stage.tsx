import { cn } from "@/lib/utils";
import { useTambo } from "@tambo-ai/react";
import type { StreamingState } from "@tambo-ai/react";
import { Loader2Icon } from "lucide-react";
import * as React from "react";

/**
 * Represents the generation stage of a message
 * @property {string} className - Optional className for custom styling
 * @property {boolean} showLabel - Whether to show the label
 */

export interface GenerationStageProps
  extends React.HTMLAttributes<HTMLDivElement> {
  showLabel?: boolean;
}

export function MessageGenerationStage({
  className,
  showLabel = true,
  ...props
}: GenerationStageProps) {
  const { streamingState, isIdle } = useTambo();
  const status = streamingState.status;

  // Map status to user-friendly labels
  const stageLabels: Record<StreamingState["status"], string> = {
    idle: "Idle",
    waiting: "Waiting for response",
    streaming: "Generating response",
  };

  const label = stageLabels[status] ?? status;

  if (isIdle) {
    return null;
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-2 py-1 text-xs rounded-md bg-transparent text-muted-foreground",
        className,
      )}
      {...props}
    >
      <Loader2Icon className="h-3 w-3 animate-spin" />
      {showLabel && <span>{label}</span>}
    </div>
  );
}
