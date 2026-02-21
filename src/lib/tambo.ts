/**
 * @file tambo.ts
 * @description Central configuration file for Tambo components and tools
 *
 * Each dashboard widget type gets its own tool with an explicit schema.
 * Update/remove are handled automatically by TamboInteractableProvider
 * once a widget exists on the dashboard.
 */

import { addDashboardWidget } from "@/lib/dashboard-bridge";
import { metricCardSchema } from "@/components/dashboard/metric-card";
import { areaChartSchema } from "@/components/dashboard/area-chart";
import { donutChartSchema } from "@/components/dashboard/donut-chart";
import { barChartSchema } from "@/components/dashboard/bar-chart";
import { funnelChartSchema } from "@/components/dashboard/funnel-chart";
import { dataTableSchema } from "@/components/dashboard/data-table";
import type { TamboComponent } from "@tambo-ai/react";
import { TamboTool } from "@tambo-ai/react";
import { z } from "zod";

const outputSchema = z.object({
  success: z.boolean(),
  componentId: z.string().optional(),
  error: z.string().optional(),
});

export const tools: TamboTool[] = [
  {
    name: "add_metric_card",
    description:
      "Add a KPI metric card to the dashboard. Shows a single number with trend arrow, percent change, and sparkline. Metrics: mrr, activeUsers, churnRate, arpu, signups, nps. Call multiple times for multiple KPIs.",
    tool: async (input: z.infer<typeof metricCardSchema>) => {
      return addDashboardWidget("MetricCard", input);
    },
    inputSchema: metricCardSchema,
    outputSchema,
  },
  {
    name: "add_area_chart",
    description:
      "Add a time series area chart to the dashboard. Shows trends over time with gradient fill. Metrics: revenue, users, signups, churn, arpu. Supports period comparison.",
    tool: async (input: z.infer<typeof areaChartSchema>) => {
      return addDashboardWidget("AreaChart", input);
    },
    inputSchema: areaChartSchema,
    outputSchema,
  },
  {
    name: "add_donut_chart",
    description:
      "Add a donut/pie chart to the dashboard. Shows proportional breakdown with legend. Group by: plan, country, channel, device, referrer. Measures revenue or users.",
    tool: async (input: z.infer<typeof donutChartSchema>) => {
      return addDashboardWidget("DonutChart", input);
    },
    inputSchema: donutChartSchema,
    outputSchema,
  },
  {
    name: "add_bar_chart",
    description:
      "Add a horizontal bar chart to the dashboard. Shows rankings/comparisons. Dimensions: feature, page, country, plan, referrer. Metrics: usage, revenue, users, sessions.",
    tool: async (input: z.infer<typeof barChartSchema>) => {
      return addDashboardWidget("BarChart", input);
    },
    inputSchema: barChartSchema,
    outputSchema,
  },
  {
    name: "add_funnel_chart",
    description:
      "Add a conversion funnel chart to the dashboard. Shows step-by-step drop-off rates. Default: signup → activation → engagement → subscription. Custom steps supported.",
    tool: async (input: z.infer<typeof funnelChartSchema>) => {
      return addDashboardWidget("FunnelChart", input);
    },
    inputSchema: funnelChartSchema,
    outputSchema,
  },
  {
    name: "add_data_table",
    description:
      "Add a sortable data table to the dashboard. Shows tabular detail with status badges and formatted values. Entities: signups, transactions, events, users.",
    tool: async (input: z.infer<typeof dataTableSchema>) => {
      return addDashboardWidget("DataTable", input);
    },
    inputSchema: dataTableSchema,
    outputSchema,
  },
];

/**
 * No inline chat components — all widgets are added as interactables via tools.
 */
export const components: TamboComponent[] = [];
