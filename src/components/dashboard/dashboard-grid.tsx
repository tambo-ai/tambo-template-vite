"use client";

import { cn } from "@/lib/utils";
import { ComponentContentProvider, useTamboInteractable } from "@tambo-ai/react";
import { LayoutDashboard } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/** Tracks prop changes and briefly applies a glow class. */
function useUpdateGlow(props: Record<string, unknown>) {
  const [glowing, setGlowing] = useState(false);
  const prevProps = useRef(props);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevProps.current = props;
      return;
    }
    const changed = JSON.stringify(props) !== JSON.stringify(prevProps.current);
    prevProps.current = props;
    if (changed) {
      setGlowing(true);
      const timer = setTimeout(() => setGlowing(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [props]);

  return glowing;
}

function GlowCard({
  children,
  id,
  props,
  selectedId,
  onSelect,
  className,
}: {
  children: React.ReactNode;
  id: string;
  props: Record<string, unknown>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}) {
  const glowing = useUpdateGlow(props);
  return (
    <div
      onClick={() => onSelect(id)}
      className={cn(
        "rounded-lg border bg-card overflow-hidden cursor-pointer transition-all hover:shadow-md",
        selectedId === id && "ring-2 ring-primary shadow-md",
        glowing && "animate-glow-pulse",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Renders all interactable components in a responsive grid.
 * Handles click-to-select: clicking a widget marks it as selected for
 * interaction, so the AI knows which widget the user is referring to.
 */
export function DashboardGrid() {
  const {
    interactableComponents,
    setInteractableSelected,
    clearInteractableSelections,
  } = useTamboInteractable();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // MetricCards get grouped in a row; DataTable is full-width
  const metricCards = interactableComponents.filter(
    (c) => c.name === "MetricCard",
  );
  const otherComponents = interactableComponents.filter(
    (c) => c.name !== "MetricCard",
  );

  const handleSelect = (id: string) => {
    clearInteractableSelections();
    if (selectedId === id) {
      setSelectedId(null);
    } else {
      setInteractableSelected(id, true);
      setSelectedId(id);
    }
  };

  if (interactableComponents.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center space-y-3">
          <LayoutDashboard className="w-12 h-12 mx-auto opacity-30" />
          <p className="text-sm">
            Your dashboard will appear here.
          </p>
          <p className="text-xs opacity-60">
            Try: &quot;Create a dashboard for my SaaS product&quot;
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 overflow-auto h-full">
      {/* Metric cards row */}
      {metricCards.length > 0 && (
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(${Math.min(metricCards.length, 4)}, minmax(0, 1fr))`,
          }}
        >
          {metricCards.map((comp) => (
            <GlowCard
              key={comp.id}
              id={comp.id}
              props={comp.props}
              selectedId={selectedId}
              onSelect={handleSelect}
            >
              <ComponentContentProvider componentId={comp.id} threadId="" messageId="" componentName={comp.name}>
                <comp.component {...comp.props} />
              </ComponentContentProvider>
            </GlowCard>
          ))}
        </div>
      )}

      {/* Other charts in 2-col grid, DataTable gets full width */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {otherComponents.map((comp) => {
          const isFullWidth = comp.name === "DataTable";
          return (
            <GlowCard
              key={comp.id}
              id={comp.id}
              props={comp.props}
              selectedId={selectedId}
              onSelect={handleSelect}
              className={isFullWidth ? "md:col-span-2" : undefined}
            >
              <ComponentContentProvider componentId={comp.id} threadId="" messageId="" componentName={comp.name}>
                <comp.component {...comp.props} />
              </ComponentContentProvider>
            </GlowCard>
          );
        })}
      </div>
    </div>
  );
}
