import {
  Message,
  MessageContent,
  MessageImages,
  MessageRenderedComponentArea,
  ReasoningInfo,
  ToolcallInfo,
  type messageVariants,
} from "@/components/tambo/message";
import { cn } from "@/lib/utils";
import { type TamboThreadMessage, useTambo } from "@tambo-ai/react";
import { type VariantProps } from "class-variance-authority";
import * as React from "react";

interface ThreadContentContextValue {
  messages: TamboThreadMessage[];
  isGenerating: boolean;
  lastRunCancelled: boolean;
  variant?: VariantProps<typeof messageVariants>["variant"];
}

const ThreadContentContext =
  React.createContext<ThreadContentContextValue | null>(null);

const useThreadContentContext = () => {
  const context = React.useContext(ThreadContentContext);
  if (!context) {
    throw new Error(
      "ThreadContent sub-components must be used within a ThreadContent",
    );
  }
  return context;
};

export interface ThreadContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: VariantProps<typeof messageVariants>["variant"];
  children?: React.ReactNode;
}

const ThreadContent = React.forwardRef<HTMLDivElement, ThreadContentProps>(
  ({ children, className, variant, ...props }, ref) => {
    const { messages, isIdle, thread } = useTambo();
    const isGenerating = !isIdle;
    const lastRunCancelled = thread?.thread.lastRunCancelled ?? false;

    const contextValue = React.useMemo(
      () => ({
        messages: messages ?? [],
        isGenerating,
        lastRunCancelled,
        variant,
      }),
      [messages, isGenerating, lastRunCancelled, variant],
    );

    return (
      <ThreadContentContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn("w-full", className)}
          data-slot="thread-content-container"
          {...props}
        >
          {children}
        </div>
      </ThreadContentContext.Provider>
    );
  },
);
ThreadContent.displayName = "ThreadContent";

export type ThreadContentMessagesProps = React.HTMLAttributes<HTMLDivElement>;

const ThreadContentMessages = React.forwardRef<
  HTMLDivElement,
  ThreadContentMessagesProps
>(({ className, ...props }, ref) => {
  const { messages, isGenerating, lastRunCancelled, variant } =
    useThreadContentContext();

  const filteredMessages = messages.filter((message) => {
    if (message.role === "system") return false;
    if (
      message.content.length > 0 &&
      message.content.every((block) => block.type === "tool_result")
    ) {
      return false;
    }
    return true;
  });

  // Find the index of the last assistant message to show cancellation indicator
  let lastAssistantIndex = -1;
  for (let i = filteredMessages.length - 1; i >= 0; i--) {
    if (filteredMessages[i].role === "assistant") {
      lastAssistantIndex = i;
      break;
    }
  }

  return (
    <div
      ref={ref}
      className={cn("flex flex-col gap-2", className)}
      data-slot="thread-content-messages"
      {...props}
    >
      {filteredMessages.map((message, index) => {
        const isLastAssistantMessage =
          message.role === "assistant" && index === lastAssistantIndex;
        const wasCancelled = isLastAssistantMessage && lastRunCancelled;

        return (
          <div
            key={
              message.id ??
              `${message.role}-${message.createdAt ?? `${index}`}`
            }
            data-slot="thread-content-item"
          >
            <Message
              role={message.role === "assistant" ? "assistant" : "user"}
              message={message}
              variant={variant}
              isLoading={isGenerating && index === filteredMessages.length - 1}
              className={cn(
                "flex w-full",
                message.role === "assistant" ? "justify-start" : "justify-end",
              )}
            >
              <div
                className={cn(
                  "flex flex-col",
                  message.role === "assistant" ? "w-full" : "max-w-3xl",
                )}
              >
                <ReasoningInfo />
                <MessageImages />
                <MessageContent
                  className={
                    message.role === "assistant"
                      ? "text-foreground font-sans"
                      : "text-foreground bg-container hover:bg-backdrop font-sans"
                  }
                />
                {wasCancelled && (
                  <span className="text-muted-foreground text-xs pl-4">
                    cancelled
                  </span>
                )}
                <ToolcallInfo />
                {!wasCancelled && (
                  <MessageRenderedComponentArea className="w-full" />
                )}
              </div>
            </Message>
          </div>
        );
      })}
    </div>
  );
});
ThreadContentMessages.displayName = "ThreadContent.Messages";

export { ThreadContent, ThreadContentMessages };
