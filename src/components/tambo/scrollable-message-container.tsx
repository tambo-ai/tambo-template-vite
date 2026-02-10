import { cn } from "@/lib/utils";
import { useTambo } from "@tambo-ai/react";
import * as React from "react";
import { useEffect, useRef, useState } from "react";

export type ScrollableMessageContainerProps =
  React.HTMLAttributes<HTMLDivElement>;

export const ScrollableMessageContainer = React.forwardRef<
  HTMLDivElement,
  ScrollableMessageContainerProps
>(({ className, children, ...props }, ref) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { messages, isStreaming } = useTambo();
  const [shouldAutoscroll, setShouldAutoscroll] = useState(true);
  const lastScrollTopRef = useRef(0);

  React.useImperativeHandle(ref, () => scrollContainerRef.current!, []);

  const messagesContent = React.useMemo(() => {
    if (!messages) return null;

    return messages.map((message) => ({
      id: message.id,
      content: message.content,
      reasoning: message.reasoning,
    }));
  }, [messages]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } =
      scrollContainerRef.current;
    const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 8;

    if (scrollTop < lastScrollTopRef.current) {
      setShouldAutoscroll(false);
    } else if (isAtBottom) {
      setShouldAutoscroll(true);
    }

    lastScrollTopRef.current = scrollTop;
  };

  useEffect(() => {
    if (scrollContainerRef.current && messagesContent && shouldAutoscroll) {
      const scroll = () => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({
            top: scrollContainerRef.current.scrollHeight,
            behavior: "smooth",
          });
        }
      };

      if (isStreaming) {
        requestAnimationFrame(scroll);
      } else {
        const timeoutId = setTimeout(scroll, 50);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [messagesContent, isStreaming, shouldAutoscroll]);

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className={cn(
        "flex-1 overflow-y-auto",
        "[&::-webkit-scrollbar]:w-[6px]",
        "[&::-webkit-scrollbar-thumb]:bg-gray-300",
        "[&::-webkit-scrollbar:horizontal]:h-[4px]",
        className,
      )}
      data-slot="scrollable-message-container"
      {...props}
    >
      {children}
    </div>
  );
});
ScrollableMessageContainer.displayName = "ScrollableMessageContainer";
