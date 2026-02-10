# Tambo Template

This is a starter template built with **TanStack Router** and **Vite** with Tambo hooked up to get your AI app development started quickly.

## Get Started

1. Run `npm create-tambo@latest my-tambo-app` for a new project

2. `npm install`

3. `npx tambo init`

- or rename `example.env.local` to `.env.local` and add your Tambo API key (get one for free [here](https://tambo.co/dashboard)).

4. Run `npm run dev` and go to `localhost:5173` to use the app!

## Project Structure

```
src/
├── routes/              # TanStack Router pages
│   ├── __root.tsx       # Root layout
│   ├── index.tsx        # Home page
│   ├── chat.tsx         # Chat interface with TamboProvider
│   └── interactables.tsx
├── components/
│   ├── tambo/           # Tambo-specific components
│   │   ├── graph.tsx    # Recharts data visualization
│   │   ├── message*.tsx # Chat UI components
│   │   └── thread*.tsx  # Thread management UI
│   └── ui/
│       └── card-data.tsx # DataCard component
├── lib/
│   ├── tambo.ts         # Central config: component & tool registration
│   ├── thread-hooks.ts  # Custom thread management hooks
│   └── utils.ts         # Utility functions
├── services/
│   └── population-stats.ts # Demo data service
└── main.tsx             # App entry point
```

## Customizing

### Change what components Tambo can control

Components are registered in `src/lib/tambo.ts` with Zod schemas. This template comes with two registered components — `Graph` and `DataCard`:

```tsx
export const components: TamboComponent[] = [
  {
    name: "Graph",
    description:
      "A component that renders various types of charts (bar, line, pie) using Recharts...",
    component: Graph,
    propsSchema: graphSchema,
  },
  {
    name: "DataCard",
    description:
      "A component that displays options as clickable cards with links and summaries...",
    component: DataCard,
    propsSchema: dataCardSchema,
  },
  // Add more components here
];
```

Each component has:
- A **name** and **description** so the AI knows when to use it
- A **component** reference to the React component
- A **propsSchema** defined with Zod for runtime validation

You can install additional components into any project with:

```bash
npx tambo add <component-name>
```

Update the `components` array with any component(s) you want Tambo to be able to use in a response.

Find more information about registering components [here](https://tambo.co/docs/concepts/registering-components).

### Add tools for Tambo to use

Tools let the AI fetch data or perform actions. This template includes two demo tools — `countryPopulation` and `globalPopulation`:

```tsx
export const tools: TamboTool[] = [
  {
    name: "countryPopulation",
    description:
      "A tool to get population statistics by country with advanced filtering options",
    tool: getCountryPopulations,
    inputSchema: z.object({
      continent: z.string().optional(),
      sortBy: z.enum(["population", "growthRate"]).optional(),
      limit: z.number().optional(),
      order: z.enum(["asc", "desc"]).optional(),
    }),
    outputSchema: z.array(
      z.object({
        countryCode: z.string(),
        countryName: z.string(),
        continent: z.enum(["Asia", "Africa", "Europe", "North America", "South America", "Oceania"]),
        population: z.number(),
        year: z.number(),
        growthRate: z.number(),
      }),
    ),
  },
  // Add more tools here
];
```

Each tool has:
- A **name** and **description** for the AI
- A **tool** function that performs the action
- An **inputSchema** defining expected arguments
- An **outputSchema** defining the return type

Find more information about tools [here](https://tambo.co/docs/concepts/tools).

### The TamboProvider

The `TamboProvider` wraps your app and provides components, tools, and MCP support. In this template, it lives in the chat route (`src/routes/chat.tsx`):

```tsx
<TamboProvider
  apiKey={import.meta.env.VITE_TAMBO_API_KEY!}
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
```

You can place the provider anywhere in your app — just make sure it wraps any components that need access to Tambo.

### Change where component responses are shown

The components used by Tambo are shown alongside the message response within the chat thread. You can also render them wherever you like by accessing the latest thread message's `renderedComponent` field:

```tsx
const { thread } = useTamboThread();
const latestComponent =
  thread?.messages[thread.messages.length - 1]?.renderedComponent;

return (
  <div>
    {latestComponent && (
      <div className="my-custom-wrapper">{latestComponent}</div>
    )}
  </div>
);
```

For more detailed documentation, visit [Tambo's official docs](https://docs.tambo.co).
