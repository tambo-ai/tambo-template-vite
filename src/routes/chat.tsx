import { createFileRoute } from '@tanstack/react-router';
import { MessageThreadFull } from '@/components/tambo/message-thread-full';
import { useAnonymousUserKey } from '@/lib/use-anonymous-user-key';
import { components, tools } from '@/lib/tambo';
import { TaxContextProvider } from '@/lib/tax-context';
import { TamboProvider } from '@tambo-ai/react';
import { TamboMcpProvider } from '@tambo-ai/react/mcp';
import { useMemo } from 'react';

export const Route = createFileRoute('/chat')({
  component: ChatPage,
});

function ChatPage() {
  const userKey = useAnonymousUserKey();

  const contextHelpers = useMemo(
    () => ({
      currentDate: () => `Today's date is ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.`,
    }),
    [],
  );

  return (
    <TamboProvider
      apiKey={import.meta.env.VITE_TAMBO_API_KEY!}
      // For production, use userToken with your auth provider instead. See: https://docs.tambo.co/concepts/user-authentication
      userKey={userKey}
      components={components}
      tools={tools}
      tamboUrl={import.meta.env.VITE_TAMBO_URL}
      autoGenerateThreadName
      autoGenerateNameThreshold={1}
      contextHelpers={contextHelpers}
    >
      <TamboMcpProvider>
        <TaxContextProvider>
          <div className="flex h-screen flex-col">
            <header className="border-b border-border px-4 py-3">
              <h1 className="text-lg font-bold tracking-tight text-foreground">Tambo generative UI agent</h1>
            </header>
            <div className="min-h-0 flex-1">
              <MessageThreadFull />
            </div>
          </div>
        </TaxContextProvider>
      </TamboMcpProvider>
    </TamboProvider>
  );
}