/**
 * Bridge between Tambo tool calls and the React interactable system.
 *
 * Tools are plain functions that can't access React hooks. This module
 * holds a ref to the interactable context's addInteractableComponent
 * function, populated by DashboardBridge (a React component).
 */

import type { InteractableComponent } from "@tambo-ai/react";

import { MetricCardBase, metricCardSchema, metricCardStateSchema } from "@/components/dashboard/metric-card";
import { DashboardAreaChartBase, areaChartSchema, areaChartStateSchema } from "@/components/dashboard/area-chart";
import { DonutChartBase, donutChartSchema, donutChartStateSchema } from "@/components/dashboard/donut-chart";
import { DashboardBarChartBase, barChartSchema, barChartStateSchema } from "@/components/dashboard/bar-chart";
import { FunnelChartBase, funnelChartSchema, funnelChartStateSchema } from "@/components/dashboard/funnel-chart";
import { DataTableBase, dataTableSchema, dataTableStateSchema } from "@/components/dashboard/data-table";

// Component registry: maps names → { component, schema, description }
const WIDGET_REGISTRY: Record<
  string,
  {
    component: React.ComponentType<any>;
    propsSchema: any;
    stateSchema: any;
    description: string;
  }
> = {
  MetricCard: {
    component: MetricCardBase,
    propsSchema: metricCardSchema,
    stateSchema: metricCardStateSchema,
    description:
      "KPI card showing a single metric with value, trend, and sparkline.",
  },
  AreaChart: {
    component: DashboardAreaChartBase,
    propsSchema: areaChartSchema,
    stateSchema: areaChartStateSchema,
    description: "Line/area chart for time series trends.",
  },
  DonutChart: {
    component: DonutChartBase,
    propsSchema: donutChartSchema,
    stateSchema: donutChartStateSchema,
    description: "Donut chart for proportional breakdowns.",
  },
  BarChart: {
    component: DashboardBarChartBase,
    propsSchema: barChartSchema,
    stateSchema: barChartStateSchema,
    description: "Horizontal bar chart for rankings.",
  },
  FunnelChart: {
    component: FunnelChartBase,
    propsSchema: funnelChartSchema,
    stateSchema: funnelChartStateSchema,
    description: "Conversion funnel with drop-off rates.",
  },
  DataTable: {
    component: DataTableBase,
    propsSchema: dataTableSchema,
    stateSchema: dataTableStateSchema,
    description: "Sortable data table for tabular detail.",
  },
};

// --- Ref-based bridge ---

type AddComponentFn = (
  component: Omit<InteractableComponent, "id" | "createdAt">,
) => string;

type RemoveComponentFn = (id: string) => void;

let _addComponent: AddComponentFn | null = null;
let _removeComponent: RemoveComponentFn | null = null;

/**
 * Called by the DashboardBridge React component to populate the bridge.
 */
export function setBridgeCallbacks(
  addFn: AddComponentFn,
  removeFn: RemoveComponentFn,
) {
  _addComponent = addFn;
  _removeComponent = removeFn;
}

/**
 * Called by tools to add a widget to the dashboard.
 */
export function addDashboardWidget(
  componentName: string,
  props: Record<string, unknown>,
): { success: boolean; componentId?: string; error?: string } {
  if (!_addComponent) {
    return { success: false, error: "Dashboard bridge not initialized" };
  }

  const entry = WIDGET_REGISTRY[componentName];
  if (!entry) {
    return {
      success: false,
      error: `Unknown component: ${componentName}. Valid: ${Object.keys(WIDGET_REGISTRY).join(", ")}`,
    };
  }

  const id = _addComponent({
    name: componentName,
    component: entry.component,
    description: entry.description,
    propsSchema: entry.propsSchema,
    stateSchema: entry.stateSchema,
    props,
  });

  return { success: true, componentId: id };
}

/**
 * Called by tools to remove a widget from the dashboard.
 */
export function removeDashboardWidget(
  componentId: string,
): { success: boolean; error?: string } {
  if (!_removeComponent) {
    return { success: false, error: "Dashboard bridge not initialized" };
  }

  _removeComponent(componentId);
  return { success: true };
}

export { WIDGET_REGISTRY };
