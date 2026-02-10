import { markdownComponents } from "@/components/tambo/markdown-components";
import { cn } from "@/lib/utils";
import type {
  TamboThreadMessage,
  Content,
  TamboToolUseContent,
  TamboComponentContent,
  ResourceContent,
} from "@tambo-ai/react";
import { useTambo } from "@tambo-ai/react";
import { cva, type VariantProps } from "class-variance-authority";
import stringify from "json-stringify-pretty-compact";
import { Check, ChevronDown, ExternalLink, Loader2, X } from "lucide-react";
import * as React from "react";
import { useState } from "react";
import { Streamdown } from "streamdown";

/**
 * CSS variants for the message container
 */
const messageVariants = cva("flex", {
  variants: {
    variant: {
      default: "",
      solid: [
        "[&>div>div:first-child]:shadow-md",
        "[&>div>div:first-child]:bg-container/50",
        "[&>div>div:first-child]:hover:bg-container",
        "[&>div>div:first-child]:transition-all",
        "[&>div>div:first-child]:duration-200",
      ].join(" "),
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

interface MessageContextValue {
  role: "user" | "assistant";
  variant?: VariantProps<typeof messageVariants>["variant"];
  message: TamboThreadMessage;
  isLoading?: boolean;
}

const MessageContext = React.createContext<MessageContextValue | null>(null);

const useMessageContext = () => {
  const context = React.useContext(MessageContext);
  if (!context) {
    throw new Error("Message sub-components must be used within a Message");
  }
  return context;
};

/**
 * Helper to extract text content from V1 message content blocks
 */
function getTextContent(content: Content[]): string {
  return content
    .filter((block): block is { type: "text"; text: string } => block.type === "text")
    .map((block) => block.text)
    .join("");
}

/**
 * Helper to extract tool_use content blocks from a message
 */
function getToolUseBlocks(content: Content[]): TamboToolUseContent[] {
  return content.filter(
    (block): block is TamboToolUseContent => block.type === "tool_use",
  );
}

/**
 * Helper to extract component content blocks from a message
 */
function getComponentBlocks(content: Content[]): TamboComponentContent[] {
  return content.filter(
    (block): block is TamboComponentContent => block.type === "component",
  );
}

/**
 * Helper to check if content has meaningful text
 */
function hasTextContent(content: Content[]): boolean {
  return content.some(
    (block) => block.type === "text" && block.text.trim().length > 0,
  );
}

// --- Sub-Components ---

export interface MessageProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "content"> {
  role: "user" | "assistant";
  message: TamboThreadMessage;
  variant?: VariantProps<typeof messageVariants>["variant"];
  isLoading?: boolean;
  children: React.ReactNode;
}

const Message = React.forwardRef<HTMLDivElement, MessageProps>(
  (
    { children, className, role, variant, isLoading, message, ...props },
    ref,
  ) => {
    const contextValue = React.useMemo(
      () => ({ role, variant, isLoading, message }),
      [role, variant, isLoading, message],
    );

    // Skip system messages.
    if (message.role === "system") {
      return null;
    }

    return (
      <MessageContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn(messageVariants({ variant }), className)}
          data-message-role={role}
          data-message-id={message.id}
          {...props}
        >
          {children}
        </div>
      </MessageContext.Provider>
    );
  },
);
Message.displayName = "Message";

const LoadingIndicator: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => {
  return (
    <div className={cn("flex items-center gap-1", className)} {...props}>
      <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></span>
      <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.2s]"></span>
      <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.1s]"></span>
    </div>
  );
};
LoadingIndicator.displayName = "LoadingIndicator";

export type MessageImagesProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Displays images from resource content blocks.
 */
const MessageImages = React.forwardRef<HTMLDivElement, MessageImagesProps>(
  ({ className, ...props }, ref) => {
    const { message } = useMessageContext();
    // In V1, images are resource content blocks
    const images = message.content
      .filter(
        (block): block is ResourceContent =>
          block.type === "resource" &&
          !!block.resource.mimeType?.startsWith("image/") &&
          !!block.resource.blob,
      )
      .map((block) => `data:${block.resource.mimeType};base64,${block.resource.blob}`);

    if (images.length === 0) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn("flex flex-wrap gap-2 mb-2", className)}
        data-slot="message-images"
        {...props}
      >
        {images.map((imageUrl: string, index: number) => (
          <div
            key={index}
            className="w-32 h-32 rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <img
              src={imageUrl}
              alt={`Image ${index + 1}`}
              width={128}
              height={128}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    );
  },
);
MessageImages.displayName = "MessageImages";

export interface MessageContentProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "content"> {
  content?: string;
  markdown?: boolean;
}

const MessageContent = React.forwardRef<HTMLDivElement, MessageContentProps>(
  (
    { className, children, content: contentProp, markdown = true, ...props },
    ref,
  ) => {
    const { message, isLoading } = useMessageContext();

    // Extract text from V1 content blocks
    const textContent = React.useMemo(() => {
      if (children) return undefined; // will render children instead
      if (contentProp !== undefined) return contentProp;
      return getTextContent(message.content);
    }, [children, contentProp, message.content]);

    const hasContent = React.useMemo(() => {
      if (children) return true;
      if (textContent) return textContent.trim().length > 0;
      return false;
    }, [children, textContent]);

    const showLoading = isLoading && !hasContent;

    return (
      <div
        ref={ref}
        className={cn(
          "relative block rounded-3xl px-4 py-2 text-[15px] leading-relaxed transition-all duration-200 font-medium max-w-full [&_p]:py-1 [&_li]:list-item",
          className,
        )}
        data-slot="message-content"
        {...props}
      >
        {showLoading && !message.reasoning ? (
          <div
            className="flex items-center justify-start h-4 py-1"
            data-slot="message-loading-indicator"
          >
            <LoadingIndicator />
          </div>
        ) : (
          <div
            className={cn("break-words", !markdown && "whitespace-pre-wrap")}
            data-slot="message-content-text"
          >
            {children ? (
              children
            ) : !textContent ? (
              <span className="text-muted-foreground italic">
                Empty message
              </span>
            ) : markdown ? (
              <Streamdown components={markdownComponents}>
                {textContent}
              </Streamdown>
            ) : (
              textContent
            )}
          </div>
        )}
      </div>
    );
  },
);
MessageContent.displayName = "MessageContent";

export interface ToolcallInfoProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "content"> {
  markdown?: boolean;
}

/**
 * Displays tool call information for V1 content blocks.
 */
const ToolcallInfo = React.forwardRef<HTMLDivElement, ToolcallInfoProps>(
  ({ className, markdown = true, ...props }, ref) => {
    const [expandedToolId, setExpandedToolId] = useState<string | null>(null);
    const { message, isLoading } = useMessageContext();
    const { messages } = useTambo();

    const toolUseBlocks = React.useMemo(
      () => getToolUseBlocks(message.content),
      [message.content],
    );

    // Find tool results across all messages
    const toolResults = React.useMemo(() => {
      const results = new Map<string, Content>();
      for (const msg of messages) {
        for (const block of msg.content) {
          if (block.type === "tool_result") {
            results.set(block.toolUseId, block);
          }
        }
      }
      return results;
    }, [messages]);

    if (message.role !== "assistant" || toolUseBlocks.length === 0) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn("flex flex-col gap-1", className)}
        data-slot="toolcall-info"
        {...props}
      >
        {toolUseBlocks.map((toolBlock) => {
          const isExpanded = expandedToolId === toolBlock.id;
          const toolDetailsId = `tool-${toolBlock.id}`;
          const hasCompleted = toolBlock.hasCompleted ?? false;
          const statusMessage = toolBlock.statusMessage ?? (hasCompleted ? `Called ${toolBlock.name}` : `Calling ${toolBlock.name}`);
          const toolResult = toolResults.get(toolBlock.id);

          return (
            <div
              key={toolBlock.id}
              className="flex flex-col items-start text-xs opacity-50"
            >
              <div className="flex flex-col w-full">
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  aria-controls={toolDetailsId}
                  onClick={() => setExpandedToolId(isExpanded ? null : toolBlock.id)}
                  className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 rounded-md p-1 select-none w-fit"
                >
                  {!hasCompleted && isLoading ? (
                    <Loader2 className="w-3 h-3 text-muted-foreground text-bold animate-spin" />
                  ) : hasCompleted ? (
                    <Check className="w-3 h-3 text-bold text-green-500" />
                  ) : (
                    <X className="w-3 h-3 text-bold text-red-500" />
                  )}
                  <span>{statusMessage}</span>
                  <ChevronDown
                    className={cn(
                      "w-3 h-3 transition-transform duration-200",
                      !isExpanded && "-rotate-90",
                    )}
                  />
                </button>
                <div
                  id={toolDetailsId}
                  className={cn(
                    "flex flex-col gap-1 p-3 pl-7 overflow-auto transition-[max-height,opacity,padding] duration-300 w-full truncate",
                    isExpanded ? "max-h-auto opacity-100" : "max-h-0 opacity-0 p-0",
                  )}
                >
                  <span className="whitespace-pre-wrap pl-2">
                    tool: {toolBlock.name}
                  </span>
                  <span className="whitespace-pre-wrap pl-2">
                    parameters:{"\n"}
                    {stringify(toolBlock.input)}
                  </span>
                  {toolResult && toolResult.type === "tool_result" && (
                    <div className="pl-2">
                      <span className="whitespace-pre-wrap">result:</span>
                      <div>
                        {!toolResult.content || toolResult.content.length === 0 ? (
                          <span className="text-muted-foreground italic">
                            Empty response
                          </span>
                        ) : (
                          formatToolResult(
                            toolResult.content
                              .filter((c): c is { type: "text"; text: string } => c.type === "text")
                              .map((c) => c.text)
                              .join(""),
                            markdown,
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  },
);
ToolcallInfo.displayName = "ToolcallInfo";

export type ReasoningInfoProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "content"
>;

const ReasoningInfo = React.forwardRef<HTMLDivElement, ReasoningInfoProps>(
  ({ className, ...props }, ref) => {
    const { message, isLoading } = useMessageContext();
    const reasoningDetailsId = React.useId();
    const [isExpanded, setIsExpanded] = useState(true);
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    // Auto-collapse when content arrives and reasoning is not loading
    React.useEffect(() => {
      if (hasTextContent(message.content) && !isLoading) {
        setIsExpanded(false);
      }
    }, [message.content, isLoading]);

    // Auto-scroll to bottom when reasoning content changes
    React.useEffect(() => {
      if (scrollContainerRef.current && isExpanded && message.reasoning) {
        const scroll = () => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
              top: scrollContainerRef.current.scrollHeight,
              behavior: "smooth",
            });
          }
        };

        if (isLoading) {
          requestAnimationFrame(scroll);
        } else {
          const timeoutId = setTimeout(scroll, 50);
          return () => clearTimeout(timeoutId);
        }
      }
    }, [message.reasoning, isExpanded, isLoading]);

    if (!message.reasoning?.length) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-start text-xs opacity-50",
          className,
        )}
        data-slot="reasoning-info"
        {...props}
      >
        <div className="flex flex-col w-full">
          <button
            type="button"
            aria-expanded={isExpanded}
            aria-controls={reasoningDetailsId}
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "flex items-center gap-1 cursor-pointer hover:bg-muted-foreground/10 rounded-md px-3 py-1 select-none w-fit",
            )}
          >
            <span className={isLoading ? "animate-thinking-gradient" : ""}>
              {isLoading
                ? "Thinking "
                : message.reasoningDurationMS
                  ? formatReasoningDuration(message.reasoningDurationMS) + " "
                  : "Done Thinking "}
              {message.reasoning.length > 1
                ? `(${message.reasoning.length} steps)`
                : ""}
            </span>
            <ChevronDown
              className={cn(
                "w-3 h-3 transition-transform duration-200",
                !isExpanded && "-rotate-90",
              )}
            />
          </button>
          <div
            ref={scrollContainerRef}
            id={reasoningDetailsId}
            className={cn(
              "flex flex-col gap-1 px-3 py-3 overflow-auto transition-[max-height,opacity,padding] duration-300 w-full",
              isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0 p-0",
            )}
          >
            {message.reasoning.map((reasoningStep, index) => (
              <div key={index} className="flex flex-col gap-1">
                {message.reasoning?.length && message.reasoning.length > 1 && (
                  <span className="text-muted-foreground text-xs font-medium">
                    Step {index + 1}:
                  </span>
                )}
                {reasoningStep ? (
                  <div className="bg-muted/50 rounded-md p-3 text-xs overflow-x-auto overflow-y-auto max-w-full">
                    <div className="whitespace-pre-wrap break-words">
                      <Streamdown components={markdownComponents}>
                        {reasoningStep}
                      </Streamdown>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  },
);
ReasoningInfo.displayName = "ReasoningInfo";

function formatReasoningDuration(durationMS: number) {
  const seconds = Math.floor(Math.max(0, durationMS) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 1) return "Thought for less than 1 second";
  if (seconds < 60)
    return `Thought for ${seconds} ${seconds === 1 ? "second" : "seconds"}`;
  if (minutes < 60)
    return `Thought for ${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
  return `Thought for ${hours} ${hours === 1 ? "hour" : "hours"}`;
}

function formatToolResult(
  content: string,
  enableMarkdown = true,
): React.ReactNode {
  if (!content) return content;

  try {
    const parsed = JSON.parse(content);
    return (
      <pre
        className={cn(
          "bg-muted/50 rounded-md p-3 text-xs overflow-x-auto overflow-y-auto max-w-full max-h-64",
        )}
      >
        <code className="font-mono break-words whitespace-pre-wrap">
          {JSON.stringify(parsed, null, 2)}
        </code>
      </pre>
    );
  } catch {
    if (!enableMarkdown) return content;
    return (
      <Streamdown components={markdownComponents}>{content}</Streamdown>
    );
  }
}

export type MessageRenderedComponentAreaProps =
  React.HTMLAttributes<HTMLDivElement>;

/**
 * Displays rendered components from V1 component content blocks.
 */
const MessageRenderedComponentArea = React.forwardRef<
  HTMLDivElement,
  MessageRenderedComponentAreaProps
>(({ className, children, ...props }, ref) => {
  const { message, role } = useMessageContext();
  const [canvasExists, setCanvasExists] = React.useState(false);

  React.useEffect(() => {
    const checkCanvasExists = () => {
      const canvas = document.querySelector('[data-canvas-space="true"]');
      setCanvasExists(!!canvas);
    };
    checkCanvasExists();
    window.addEventListener("resize", checkCanvasExists);
    return () => {
      window.removeEventListener("resize", checkCanvasExists);
    };
  }, []);

  // In V1, components are in content blocks
  const componentBlocks = React.useMemo(
    () => getComponentBlocks(message.content),
    [message.content],
  );

  const renderedComponents = componentBlocks
    .filter((block) => block.renderedComponent)
    .map((block) => ({ id: block.id, element: block.renderedComponent! }));

  if (renderedComponents.length === 0 || role !== "assistant") {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn(className)}
      data-slot="message-rendered-component-area"
      {...props}
    >
      {children ??
        renderedComponents.map(({ id, element }) =>
          canvasExists ? (
            <div key={id} className="flex justify-start pl-4">
              <button
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(
                      new CustomEvent("tambo:showComponent", {
                        detail: {
                          messageId: message.id,
                          component: element,
                        },
                      }),
                    );
                  }
                }}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer group"
                aria-label="View component in canvas"
              >
                View component
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div key={id} className="w-full pt-2 px-2">{element}</div>
          ),
        )}
    </div>
  );
});
MessageRenderedComponentArea.displayName = "Message.RenderedComponentArea";

// --- Exports ---
export {
  LoadingIndicator,
  Message,
  MessageContent,
  MessageImages,
  MessageRenderedComponentArea,
  messageVariants,
  ReasoningInfo,
  ToolcallInfo,
};
