import { createFileRoute } from "@tanstack/react-router";
import {
  MessageInput,
  MessageInputSubmitButton,
  MessageInputTextarea,
  MessageInputToolbar,
} from "@/components/tambo/message-input";
import { ScrollableMessageContainer } from "@/components/tambo/scrollable-message-container";
import {
  ThreadContent,
  ThreadContentMessages,
} from "@/components/tambo/thread-content";
import { DashboardGrid } from "@/components/dashboard/dashboard-grid";
import { setBridgeCallbacks } from "@/lib/dashboard-bridge";
import { useAnonymousUserKey } from "@/lib/use-anonymous-user-key";
import { components, tools } from "@/lib/tambo";
import {
  TamboProvider,
  useTambo,
  useTamboContextHelpers,
  useTamboInteractable,
  useTamboThreadInput,
} from "@tambo-ai/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const userKey = useAnonymousUserKey();

  return (
    <TamboProvider
      apiKey={import.meta.env.VITE_TAMBO_API_KEY!}
      userKey={userKey}
      components={components}
      tools={tools}
      tamboUrl={import.meta.env.VITE_TAMBO_URL}
      autoGenerateThreadName
      autoGenerateNameThreshold={1}
    >
      <DashboardBridge />
      <DashboardLayout />
    </TamboProvider>
  );
}

function DashboardBridge() {
  const { addInteractableComponent, removeInteractableComponent, interactableComponents } =
    useTamboInteractable();
  const { addContextHelper } = useTamboContextHelpers();

  useEffect(() => {
    setBridgeCallbacks(addInteractableComponent, removeInteractableComponent);
  }, [addInteractableComponent, removeInteractableComponent]);

  // Override the default "interactables" context helper to fix isSelected mapping
  useEffect(() => {
    addContextHelper("interactables", () => {
      if (interactableComponents.length === 0) return null;
      return {
        components: interactableComponents.map((comp) => ({
          id: comp.id,
          componentName: comp.name,
          description: comp.description ?? "",
          props: comp.props,
          isSelectedForInteraction: comp.isSelected ?? false,
        })),
      };
    });
  }, [interactableComponents, addContextHelper]);

  return null;
}

const STARTER_QUERIES = [
  {
    label: "Full product dashboard",
    query: "Build a full product dashboard with MRR, active users, churn rate, and signups as KPI cards, a revenue trend area chart, signup-to-paid conversion funnel, top features bar ranking, and users by plan donut chart",
  },
  {
    label: "Executive overview",
    query: "Create an executive overview with MRR, ARPU, NPS, and churn KPI cards, revenue over time area chart, users by country donut chart, feature usage rankings bar chart, and a recent transactions data table",
  },
  {
    label: "Growth deep-dive",
    query: "Show me a growth deep-dive with signups and active users KPI cards, a signups trend area chart, signup conversion funnel, revenue by channel donut chart, top pages bar chart, users by device donut chart, and a recent signups data table",
  },
];

function StarterQueries() {
  const { setValue } = useTamboThreadInput();

  return (
    <div className="flex flex-wrap justify-center gap-2 mt-2">
      {STARTER_QUERIES.map((item) => (
        <button
          key={item.label}
          onClick={() => setValue(item.query)}
          className="text-xs px-3 py-1.5 rounded-full border border-border text-foreground/70 hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Three stages:
 *  "landing"   — centered input only
 *  "chat"      — full-width chat, input at bottom, messages grow upward
 *  "dashboard" — chat shrinks to sidebar, dashboard grows out to the right
 */
type Stage = "landing" | "chat" | "dashboard";

function DashboardLayout() {
  const [isChatOpen, setIsChatOpen] = useState(true);
  const { interactableComponents } = useTamboInteractable();
  const { messages } = useTambo();

  const hasDashboard = interactableComponents.length > 0;
  const hasMessages = (messages?.length ?? 0) > 0;

  const stage: Stage = hasDashboard
    ? "dashboard"
    : hasMessages
      ? "chat"
      : "landing";

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* ---- Chat panel (always in DOM for smooth transitions) ---- */}
      <div
        className="flex flex-col relative overflow-hidden transition-all duration-700 ease-in-out"
        style={{
          width:
            stage === "dashboard"
              ? isChatOpen
                ? "384px"
                : "0px"
              : "100%",
          flexShrink: 0,
          borderRight:
            stage === "dashboard" ? "1px solid var(--border)" : "none",
        }}
      >
        {/* Inner container — centers content in chat stage, fills in sidebar */}
        <div
          className="flex flex-col h-full w-full mx-auto transition-all duration-700 ease-in-out"
          style={{
            maxWidth: stage === "dashboard" ? "100%" : "672px",
          }}
        >
          {/* Chat header — appears in chat & dashboard stages */}
          <div
            className="border-b border-border shrink-0 overflow-hidden transition-all duration-500 ease-in-out"
            style={{
              maxHeight: stage === "landing" ? "0px" : "80px",
              opacity: stage === "landing" ? 0 : 1,
              padding:
                stage === "landing" ? "0px 1rem" : "1rem",
            }}
          >
            <h2 className="text-sm font-semibold text-foreground whitespace-nowrap">
              Generative Analytics with Tambo
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 whitespace-nowrap">
              Describe a business to generate a live analytics dashboard
            </p>
          </div>

          {/* Messages area — grows upward as messages come in */}
          <ScrollableMessageContainer
            className="p-4 transition-all duration-500 ease-in-out"
            style={{
              flex: stage === "landing" ? "0 0 0px" : "1 1 0%",
              opacity: stage === "landing" ? 0 : 1,
            }}
          >
            <ThreadContent variant="default">
              <ThreadContentMessages />
            </ThreadContent>
          </ScrollableMessageContainer>

          {/* Spacer pushes input to vertical center in landing */}
          <div
            className="shrink-0 transition-all duration-500 ease-in-out"
            style={{
              flex: stage === "landing" ? "1 1 0%" : "0 0 0px",
            }}
          />

          {/* Landing header — right above the input, fades out when messages appear */}
          <div
            className="flex flex-col items-center gap-2 px-4 shrink-0 transition-all duration-500 ease-in-out overflow-hidden"
            style={{
              maxHeight: stage === "landing" ? "200px" : "0px",
              opacity: stage === "landing" ? 1 : 0,
              marginBottom: stage === "landing" ? "0.75rem" : "0px",
            }}
          >
            <h1 className="text-2xl font-semibold text-foreground">
              Generative Analytics with Tambo
            </h1>
            <p className="text-sm text-muted-foreground">
              Describe a business to generate a live analytics dashboard
            </p>
          </div>

          {/* Input — always visible, centered in landing, bottom in chat/dashboard */}
          <div className="p-4 shrink-0" style={{
            borderTop: stage === "landing" ? "none" : "1px solid var(--border)",
          }}>
            <MessageInput variant="bordered">
              <MessageInputTextarea
                placeholder={
                  stage === "dashboard"
                    ? "Add more charts..."
                    : "Create a dashboard for..."
                }
              />
              <MessageInputToolbar>
                <MessageInputSubmitButton />
              </MessageInputToolbar>
            </MessageInput>
          </div>

          {/* Starter queries — below input, fades out when messages appear */}
          <div
            className="flex justify-center px-4 shrink-0 transition-all duration-500 ease-in-out overflow-hidden"
            style={{
              maxHeight: stage === "landing" ? "100px" : "0px",
              opacity: stage === "landing" ? 1 : 0,
            }}
          >
            <StarterQueries />
          </div>

          {/* Bottom spacer — matches top spacer in landing */}
          <div
            className="shrink-0 transition-all duration-500 ease-in-out"
            style={{
              flex: stage === "landing" ? "1 1 0%" : "0 0 0px",
            }}
          />
        </div>

        {/* Toggle button */}
        {stage === "dashboard" && (
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="absolute -right-8 top-1/2 -translate-y-1/2 bg-card border border-border rounded-r-lg p-1.5 hover:bg-muted transition-colors z-10"
          >
            {isChatOpen ? (
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        )}
      </div>

      {/* ---- Dashboard area — grows out of chat ---- */}
      <div
        className="overflow-hidden transition-all duration-700 ease-in-out"
        style={{
          flex: stage === "dashboard" ? "1 1 0%" : "0 0 0%",
          opacity: stage === "dashboard" ? 1 : 0,
        }}
      >
        <DashboardGrid />
      </div>
    </div>
  );
}
