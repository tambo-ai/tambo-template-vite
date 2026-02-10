import { createFileRoute } from '@tanstack/react-router';
import { MessageThreadFull } from '@/components/tambo/message-thread-full';
import { useAnonymousUserKey } from '@/lib/use-anonymous-user-key';
import { components, tools } from '@/lib/tambo';
import { TamboProvider } from '@tambo-ai/react';
import { TamboMcpProvider } from '@tambo-ai/react/mcp';

export const Route = createFileRoute('/chat')({
  component: ChatPage,
});

function ChatPage() {
  const userKey = useAnonymousUserKey();

  return (
    <TamboProvider
      apiKey={import.meta.env.VITE_TAMBO_API_KEY!}
      // For production, use userToken with your auth provider instead. See: https://docs.tambo.co/concepts/user-authentication
      userKey={userKey}
      components={components}
      tools={tools}
      tamboUrl={import.meta.env.VITE_TAMBO_URL}
    >
      <TamboMcpProvider>
        <div className="h-screen">
          <MessageThreadFull />
        </div>
      </TamboMcpProvider>
    </TamboProvider>
  );
}