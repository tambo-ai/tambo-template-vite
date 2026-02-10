import { cn } from "@/lib/utils";
import {
  type ThreadListResponse,
  useTambo,
  useTamboThreadList,
} from "@tambo-ai/react";
import {
  ArrowLeftToLine,
  ArrowRightToLine,
  PlusIcon,
  SearchIcon,
} from "lucide-react";
import React, { useMemo } from "react";

/**
 * Context for sharing thread history state and functions
 */
interface ThreadHistoryContextValue {
  threads: ThreadListResponse | null | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
  currentThreadId: string;
  switchThread: (threadId: string) => void;
  startNewThread: () => void;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  onThreadChange?: () => void;
  position?: "left" | "right";
}

const ThreadHistoryContext =
  React.createContext<ThreadHistoryContextValue | null>(null);

const useThreadHistoryContext = () => {
  const context = React.useContext(ThreadHistoryContext);
  if (!context) {
    throw new Error(
      "ThreadHistory components must be used within ThreadHistory",
    );
  }
  return context;
};

interface ThreadHistoryProps extends React.HTMLAttributes<HTMLDivElement> {
  onThreadChange?: () => void;
  children?: React.ReactNode;
  defaultCollapsed?: boolean;
  position?: "left" | "right";
}

const ThreadHistory = React.forwardRef<HTMLDivElement, ThreadHistoryProps>(
  (
    {
      className,
      onThreadChange,
      defaultCollapsed = true,
      position = "left",
      children,
      ...props
    },
    ref,
  ) => {
    const [searchQuery, setSearchQuery] = React.useState("");
    const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
    const [shouldFocusSearch, setShouldFocusSearch] = React.useState(false);

    const {
      data: threads,
      isLoading,
      error,
      refetch,
    } = useTamboThreadList();

    const {
      switchThread,
      startNewThread,
      currentThreadId,
    } = useTambo();

    // Update CSS variable when sidebar collapses/expands
    React.useEffect(() => {
      const sidebarWidth = isCollapsed ? "3rem" : "16rem";
      document.documentElement.style.setProperty(
        "--sidebar-width",
        sidebarWidth,
      );
    }, [isCollapsed]);

    React.useEffect(() => {
      if (!isCollapsed && shouldFocusSearch) {
        setShouldFocusSearch(false);
      }
    }, [isCollapsed, shouldFocusSearch]);

    const contextValue = React.useMemo(
      () => ({
        threads,
        isLoading,
        error,
        refetch,
        currentThreadId,
        switchThread,
        startNewThread,
        searchQuery,
        setSearchQuery,
        isCollapsed,
        setIsCollapsed,
        onThreadChange,
        position,
      }),
      [
        threads,
        isLoading,
        error,
        refetch,
        currentThreadId,
        switchThread,
        startNewThread,
        searchQuery,
        isCollapsed,
        onThreadChange,
        position,
      ],
    );

    return (
      <ThreadHistoryContext.Provider
        value={contextValue as ThreadHistoryContextValue}
      >
        <div
          ref={ref}
          className={cn(
            "border-flat bg-container h-full transition-all duration-300 flex-none",
            position === "left" ? "border-r" : "border-l",
            isCollapsed ? "w-12" : "w-64",
            className,
          )}
          {...props}
        >
          <div
            className={cn(
              "flex flex-col h-full",
              isCollapsed ? "py-4 px-2" : "p-4",
            )}
          >
            {children}
          </div>
        </div>
      </ThreadHistoryContext.Provider>
    );
  },
);
ThreadHistory.displayName = "ThreadHistory";

const ThreadHistoryHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const {
    isCollapsed,
    setIsCollapsed,
    position = "left",
  } = useThreadHistoryContext();

  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center mb-4 relative",
        isCollapsed ? "p-1" : "p-1",
        className,
      )}
      {...props}
    >
      <h2
        className={cn(
          "text-sm text-muted-foreground whitespace-nowrap ",
          isCollapsed
            ? "opacity-0 max-w-0 overflow-hidden "
            : "opacity-100 max-w-none transition-all duration-300 delay-75",
        )}
      >
        Tambo Conversations
      </h2>
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={cn(
          `bg-container p-1 hover:bg-backdrop transition-colors rounded-md cursor-pointer absolute flex items-center justify-center`,
          position === "left" ? "right-1" : "left-0",
        )}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ArrowRightToLine
            className={cn("h-4 w-4", position === "right" && "rotate-180")}
          />
        ) : (
          <ArrowLeftToLine
            className={cn("h-4 w-4", position === "right" && "rotate-180")}
          />
        )}
      </button>
    </div>
  );
});
ThreadHistoryHeader.displayName = "ThreadHistory.Header";

const ThreadHistoryNewButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ ...props }, ref) => {
  const { isCollapsed, startNewThread, refetch, onThreadChange } =
    useThreadHistoryContext();

  const handleNewThread = React.useCallback(
    async (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();

      try {
        startNewThread();
        await refetch();
        onThreadChange?.();
      } catch (error) {
        console.error("Failed to create new thread:", error);
      }
    },
    [startNewThread, refetch, onThreadChange],
  );

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.shiftKey && event.key === "n") {
        event.preventDefault();
        handleNewThread();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleNewThread]);

  return (
    <button
      ref={ref}
      onClick={handleNewThread}
      className={cn(
        "flex items-center rounded-md mb-4 hover:bg-backdrop transition-colors cursor-pointer relative",
        isCollapsed ? "p-1 justify-center" : "p-2 gap-2",
      )}
      title="New thread"
      {...props}
    >
      <PlusIcon className="h-4 w-4 bg-green-600 rounded-full text-white" />
      <span
        className={cn(
          "text-sm font-medium whitespace-nowrap absolute left-8 pb-[2px] ",
          isCollapsed
            ? "opacity-0 max-w-0 overflow-hidden pointer-events-none"
            : "opacity-100 transition-all duration-300 delay-100",
        )}
      >
        New thread
      </span>
    </button>
  );
});
ThreadHistoryNewButton.displayName = "ThreadHistory.NewButton";

const ThreadHistorySearch = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { isCollapsed, setIsCollapsed, searchQuery, setSearchQuery } =
    useThreadHistoryContext();
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const expandOnSearch = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300);
    }
  };

  return (
    <div ref={ref} className={cn("mb-4 relative", className)} {...props}>
      <button
        onClick={expandOnSearch}
        className={cn(
          "p-1 hover:bg-backdrop rounded-md cursor-pointer absolute left-1/2 -translate-x-1/2",
          isCollapsed
            ? "opacity-100 pointer-events-auto transition-all duration-300"
            : "opacity-0 pointer-events-none",
        )}
        title="Search threads"
      >
        <SearchIcon className="h-4 w-4 text-gray-400" />
      </button>

      <div
        className={cn(
          isCollapsed
            ? "opacity-0 pointer-events-none"
            : "opacity-100 delay-100 transition-all duration-500",
        )}
      >
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon className="h-4 w-4 text-gray-400" />
        </div>
        <input
          ref={searchInputRef}
          type="text"
          className="pl-10 pr-4 py-2 w-full text-sm rounded-md bg-container focus:outline-none"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
    </div>
  );
});
ThreadHistorySearch.displayName = "ThreadHistory.Search";

const ThreadHistoryList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const {
    threads,
    isLoading,
    error,
    isCollapsed,
    searchQuery,
    currentThreadId,
    switchThread,
    onThreadChange,
  } = useThreadHistoryContext();

  // Filter threads based on search query
  const filteredThreads = useMemo(() => {
    if (isCollapsed) return [];

    if (!threads?.threads) return [];

    const query = searchQuery.toLowerCase();
    return threads.threads.filter((thread) => {
      const nameMatches = thread.name?.toLowerCase().includes(query) ?? false;
      const idMatches = thread.id.toLowerCase().includes(query);

      return idMatches ? true : nameMatches;
    });
  }, [isCollapsed, threads, searchQuery]);

  const handleSwitchThread = async (threadId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    try {
      switchThread(threadId);
      onThreadChange?.();
    } catch (error) {
      console.error("Failed to switch thread:", error);
    }
  };

  let content;
  if (isLoading) {
    content = (
      <div
        ref={ref}
        className={cn("text-sm text-muted-foreground p-2", className)}
        {...props}
      >
        Loading threads...
      </div>
    );
  } else if (error) {
    content = (
      <div
        ref={ref}
        className={cn(
          `text-sm text-destructive p-2 whitespace-nowrap ${isCollapsed ? "opacity-0 max-w-0 overflow-hidden" : "opacity-100"}`,
          className,
        )}
        {...props}
      >
        Error loading threads
      </div>
    );
  } else if (filteredThreads.length === 0) {
    content = (
      <div
        ref={ref}
        className={cn(
          `text-sm text-muted-foreground p-2 whitespace-nowrap ${isCollapsed ? "opacity-0 max-w-0 overflow-hidden" : "opacity-100"}`,
          className,
        )}
        {...props}
      >
        {searchQuery ? "No matching threads" : "No previous threads"}
      </div>
    );
  } else {
    content = (
      <div className="space-y-1">
        {filteredThreads.map((thread) => (
          <div
            key={thread.id}
            onClick={async () => await handleSwitchThread(thread.id)}
            className={cn(
              "p-2 rounded-md hover:bg-backdrop cursor-pointer group flex items-center justify-between",
              currentThreadId === thread.id ? "bg-muted" : "",
            )}
          >
            <div className="text-sm flex-1">
              <span className="font-medium line-clamp-1">
                {thread.name ?? `Thread ${thread.id.substring(0, 8)}`}
              </span>
              <p className="text-xs text-muted-foreground truncate mt-1">
                {new Date(thread.createdAt).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={cn(
        "overflow-y-auto flex-1 transition-all duration-300 ease-in-out",
        isCollapsed
          ? "opacity-0 max-h-0 overflow-hidden pointer-events-none"
          : "opacity-100 max-h-full pointer-events-auto",
        className,
      )}
      {...props}
    >
      {content}
    </div>
  );
});
ThreadHistoryList.displayName = "ThreadHistory.List";

export {
  ThreadHistory,
  ThreadHistoryHeader,
  ThreadHistoryList,
  ThreadHistoryNewButton,
  ThreadHistorySearch,
};
