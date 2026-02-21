/**
 * Deterministic fake data generators for the analytics dashboard.
 * Each function accepts filter params and returns shaped data.
 * Uses seeded random from filter values so same inputs → same output.
 */

// --- Types ---

export type DateRange = "7d" | "30d" | "90d" | "12m" | "all";
export type Granularity = "hourly" | "daily" | "weekly" | "monthly";

export interface DateFilter {
  dateRange: DateRange;
  granularity?: Granularity;
}

export interface MetricData {
  label: string;
  value: number;
  previousValue: number;
  change: number;
  changePercent: number;
  format: "currency" | "number" | "percent";
  sparkline: number[];
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
  previousValue?: number;
}

export interface BreakdownSegment {
  name: string;
  value: number;
  percent: number;
  color: string;
}

export interface RankingItem {
  rank: number;
  name: string;
  value: number;
  percentOfMax: number;
}

export interface FunnelStep {
  name: string;
  value: number;
  percent: number;
  dropoff: number;
}

export interface TableRow {
  [key: string]: string | number;
}

export interface TableData {
  columns: { key: string; label: string }[];
  rows: TableRow[];
  total: number;
}

// --- Seeded random ---

function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return () => {
    hash = (hash * 16807 + 0) % 2147483647;
    return (hash & 0x7fffffff) / 0x7fffffff;
  };
}

function autoGranularity(dateRange: DateRange): Granularity {
  switch (dateRange) {
    case "7d":
      return "daily";
    case "30d":
      return "daily";
    case "90d":
      return "weekly";
    case "12m":
      return "monthly";
    case "all":
      return "monthly";
  }
}

function dataPointCount(dateRange: DateRange, granularity: Granularity): number {
  const map: Record<DateRange, Record<Granularity, number>> = {
    "7d": { hourly: 168, daily: 7, weekly: 1, monthly: 1 },
    "30d": { hourly: 720, daily: 30, weekly: 4, monthly: 1 },
    "90d": { hourly: 2160, daily: 90, weekly: 13, monthly: 3 },
    "12m": { hourly: 8760, daily: 365, weekly: 52, monthly: 12 },
    all: { hourly: 8760, daily: 730, weekly: 104, monthly: 24 },
  };
  return Math.min(map[dateRange]?.[granularity] ?? 30, 120);
}

// --- Metric configs ---

const METRIC_CONFIG: Record<
  string,
  { label: string; base: number; noise: number; trend: number; format: "currency" | "number" | "percent" }
> = {
  mrr: { label: "MRR", base: 87400, noise: 2000, trend: 0.004, format: "currency" },
  activeUsers: { label: "Active Users", base: 2847, noise: 150, trend: 0.003, format: "number" },
  churnRate: { label: "Churn Rate", base: 4.2, noise: 0.5, trend: -0.001, format: "percent" },
  arpu: { label: "ARPU", base: 48.2, noise: 3, trend: 0.002, format: "currency" },
  signups: { label: "Signups", base: 342, noise: 40, trend: 0.005, format: "number" },
  nps: { label: "NPS Score", base: 72, noise: 5, trend: 0.001, format: "number" },
};

const TIME_SERIES_CONFIG: Record<
  string,
  { base: number; noise: number; trend: number }
> = {
  revenue: { base: 87400, noise: 3000, trend: 0.004 },
  users: { base: 2847, noise: 200, trend: 0.003 },
  signups: { base: 342, noise: 50, trend: 0.005 },
  churn: { base: 4.2, noise: 0.8, trend: -0.001 },
  arpu: { base: 48.2, noise: 4, trend: 0.002 },
};

// --- Breakdown data ---

const BREAKDOWN_DATA: Record<string, { name: string; weight: number }[]> = {
  plan: [
    { name: "Pro", weight: 42 },
    { name: "Starter", weight: 28 },
    { name: "Enterprise", weight: 18 },
    { name: "Free", weight: 12 },
  ],
  country: [
    { name: "United States", weight: 62 },
    { name: "United Kingdom", weight: 14 },
    { name: "Germany", weight: 8 },
    { name: "Canada", weight: 6 },
    { name: "Other", weight: 10 },
  ],
  channel: [
    { name: "Organic Search", weight: 38 },
    { name: "Direct", weight: 25 },
    { name: "Referral", weight: 18 },
    { name: "Social", weight: 12 },
    { name: "Paid", weight: 7 },
  ],
  device: [
    { name: "Desktop", weight: 58 },
    { name: "Mobile", weight: 32 },
    { name: "Tablet", weight: 10 },
  ],
  referrer: [
    { name: "Google", weight: 45 },
    { name: "Twitter", weight: 18 },
    { name: "Product Hunt", weight: 15 },
    { name: "Hacker News", weight: 12 },
    { name: "Other", weight: 10 },
  ],
};

// --- Bar ranking data ---

const RANKING_DATA: Record<string, { name: string; base: number }[]> = {
  feature: [
    { name: "Dashboard", base: 8420 },
    { name: "Reports", base: 6350 },
    { name: "API Access", base: 4890 },
    { name: "Integrations", base: 3210 },
    { name: "Notifications", base: 2150 },
    { name: "Export", base: 1840 },
    { name: "Settings", base: 1320 },
  ],
  page: [
    { name: "/dashboard", base: 12400 },
    { name: "/reports", base: 8900 },
    { name: "/settings", base: 5600 },
    { name: "/integrations", base: 4200 },
    { name: "/billing", base: 3100 },
  ],
  country: [
    { name: "United States", base: 15200 },
    { name: "United Kingdom", base: 4800 },
    { name: "Germany", base: 3200 },
    { name: "Canada", base: 2400 },
    { name: "Australia", base: 1800 },
  ],
  plan: [
    { name: "Pro", base: 1240 },
    { name: "Starter", base: 890 },
    { name: "Enterprise", base: 340 },
    { name: "Free", base: 2100 },
  ],
  referrer: [
    { name: "Google", base: 8400 },
    { name: "Twitter", base: 3200 },
    { name: "Product Hunt", base: 2800 },
    { name: "Hacker News", base: 2100 },
    { name: "LinkedIn", base: 1400 },
  ],
};

// --- Funnel data ---

const DEFAULT_FUNNEL_STEPS = ["Signup", "Onboarding", "Active", "Paid"];
const FUNNEL_RATES = [1.0, 0.65, 0.40, 0.18];

// --- Colors ---

const SEGMENT_COLORS = [
  "hsl(220, 100%, 62%)",
  "hsl(160, 82%, 47%)",
  "hsl(32, 100%, 62%)",
  "hsl(340, 82%, 66%)",
  "hsl(270, 70%, 60%)",
  "hsl(190, 80%, 50%)",
  "hsl(45, 90%, 55%)",
];

// --- Table data ---

const FIRST_NAMES = ["Alex", "Jordan", "Sam", "Taylor", "Morgan", "Casey", "Riley", "Jamie", "Drew", "Avery", "Quinn", "Reese", "Blake", "Hayden", "Dakota"];
const LAST_NAMES = ["Chen", "Smith", "Patel", "Kim", "Garcia", "Williams", "Lee", "Brown", "Jones", "Miller", "Davis", "Wilson", "Moore", "Anderson", "Thomas"];
const PLANS = ["Free", "Starter", "Pro", "Enterprise"];
const STATUSES = ["active", "trial", "churned", "pending"];
const EVENT_TYPES = ["page_view", "click", "signup", "purchase", "api_call", "export", "login"];

// --- Data generators ---

export async function getMetricsSummary(
  filters: DateFilter & { metric: string },
): Promise<MetricData> {
  const seed = `metric-${filters.metric}-${filters.dateRange}`;
  const rand = seededRandom(seed);
  const config = METRIC_CONFIG[filters.metric] ?? METRIC_CONFIG.mrr;

  const value = config.base + (rand() - 0.5) * config.noise * 2;
  const previousValue = value * (1 - config.trend * 30 + (rand() - 0.5) * 0.02);
  const change = value - previousValue;
  const changePercent = (change / previousValue) * 100;

  const sparkline: number[] = [];
  let v = previousValue;
  for (let i = 0; i < 14; i++) {
    v += config.trend * config.base + (rand() - 0.5) * config.noise * 0.5;
    sparkline.push(Math.round(v * 100) / 100);
  }

  return {
    label: config.label,
    value: Math.round(value * 100) / 100,
    previousValue: Math.round(previousValue * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 10) / 10,
    format: config.format,
    sparkline,
  };
}

export async function getTimeSeries(
  filters: DateFilter & { metric: string },
): Promise<TimeSeriesPoint[]> {
  const granularity = filters.granularity ?? autoGranularity(filters.dateRange);
  const count = dataPointCount(filters.dateRange, granularity);
  const seed = `ts-${filters.metric}-${filters.dateRange}-${granularity}`;
  const rand = seededRandom(seed);
  const config = TIME_SERIES_CONFIG[filters.metric] ?? TIME_SERIES_CONFIG.revenue;

  const points: TimeSeriesPoint[] = [];
  const now = new Date();

  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(now);
    switch (granularity) {
      case "hourly":
        date.setHours(date.getHours() - i);
        break;
      case "daily":
        date.setDate(date.getDate() - i);
        break;
      case "weekly":
        date.setDate(date.getDate() - i * 7);
        break;
      case "monthly":
        date.setMonth(date.getMonth() - i);
        break;
    }

    const trendFactor = 1 + config.trend * (count - i);
    const value = config.base * trendFactor + (rand() - 0.5) * config.noise * 2;
    const previousValue = config.base * (trendFactor - config.trend * count) + (rand() - 0.5) * config.noise * 2;

    const label =
      granularity === "hourly"
        ? date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric" })
        : granularity === "monthly"
          ? date.toLocaleString("en-US", { month: "short", year: "2-digit" })
          : date.toLocaleString("en-US", { month: "short", day: "numeric" });

    points.push({
      date: label,
      value: Math.round(value * 100) / 100,
      previousValue: Math.round(previousValue * 100) / 100,
    });
  }

  return points;
}

export async function getBreakdown(
  filters: DateFilter & { groupBy: string; metric?: string; limit?: number },
): Promise<BreakdownSegment[]> {
  const seed = `breakdown-${filters.groupBy}-${filters.metric ?? "revenue"}-${filters.dateRange}`;
  const rand = seededRandom(seed);
  const items = BREAKDOWN_DATA[filters.groupBy] ?? BREAKDOWN_DATA.plan;
  const limit = filters.limit ?? 5;

  const total = items.reduce((sum, item) => sum + item.weight, 0);
  const segments: BreakdownSegment[] = items.slice(0, limit).map((item, i) => {
    const jitter = 1 + (rand() - 0.5) * 0.1;
    const adjustedWeight = item.weight * jitter;
    return {
      name: item.name,
      value: Math.round(adjustedWeight * 1000),
      percent: 0,
      color: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
    };
  });

  const segTotal = segments.reduce((sum, s) => sum + s.value, 0);
  for (const seg of segments) {
    seg.percent = Math.round((seg.value / segTotal) * 1000) / 10;
  }

  return segments;
}

export async function getBarRanking(
  filters: DateFilter & {
    dimension: string;
    metric?: string;
    limit?: number;
    sortDirection?: "asc" | "desc";
  },
): Promise<RankingItem[]> {
  const seed = `bar-${filters.dimension}-${filters.metric ?? "usage"}-${filters.dateRange}`;
  const rand = seededRandom(seed);
  const items = RANKING_DATA[filters.dimension] ?? RANKING_DATA.feature;
  const limit = filters.limit ?? 5;
  const direction = filters.sortDirection ?? "desc";

  const ranked = items.slice(0, limit).map((item) => {
    const jitter = 1 + (rand() - 0.5) * 0.15;
    return {
      name: item.name,
      value: Math.round(item.base * jitter),
    };
  });

  ranked.sort((a, b) => (direction === "desc" ? b.value - a.value : a.value - b.value));
  const maxVal = Math.max(...ranked.map((r) => r.value));

  return ranked.map((item, i) => ({
    rank: i + 1,
    name: item.name,
    value: item.value,
    percentOfMax: Math.round((item.value / maxVal) * 100),
  }));
}

export async function getFunnelData(
  filters: DateFilter & { steps?: string[] },
): Promise<FunnelStep[]> {
  const steps = filters.steps ?? DEFAULT_FUNNEL_STEPS;
  const seed = `funnel-${filters.dateRange}-${steps.join(",")}`;
  const rand = seededRandom(seed);

  const baseTotal = 2400 + Math.round(rand() * 600);
  const rates = steps.map((_, i) => {
    if (i < FUNNEL_RATES.length) {
      return FUNNEL_RATES[i] + (rand() - 0.5) * 0.05;
    }
    const prev = i > 0 ? FUNNEL_RATES[Math.min(i - 1, FUNNEL_RATES.length - 1)] : 1;
    return prev * (0.4 + rand() * 0.2);
  });

  return steps.map((name, i) => {
    const percent = Math.round(rates[i] * 100);
    const value = Math.round(baseTotal * rates[i]);
    const prevValue = i === 0 ? value : Math.round(baseTotal * rates[i - 1]);
    const dropoff = i === 0 ? 0 : Math.round(((prevValue - value) / prevValue) * 100);
    return { name, value, percent, dropoff };
  });
}

export async function getTableRows(
  filters: DateFilter & {
    entity: string;
    sortBy?: string;
    sortDirection?: "asc" | "desc";
    limit?: number;
    columns?: string[];
  },
): Promise<TableData> {
  const limit = filters.limit ?? 10;
  const seed = `table-${filters.entity}-${filters.dateRange}-${filters.sortBy ?? "date"}`;
  const rand = seededRandom(seed);

  const entityGenerators: Record<string, () => { columns: { key: string; label: string }[]; row: () => TableRow }> = {
    signups: () => ({
      columns: [
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "plan", label: "Plan" },
        { key: "date", label: "Date" },
        { key: "status", label: "Status" },
      ],
      row: () => {
        const first = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
        const last = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)];
        const daysAgo = Math.floor(rand() * 30);
        const d = new Date();
        d.setDate(d.getDate() - daysAgo);
        return {
          name: `${first} ${last}`,
          email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
          plan: PLANS[Math.floor(rand() * PLANS.length)],
          date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          status: STATUSES[Math.floor(rand() * STATUSES.length)],
        };
      },
    }),
    transactions: () => ({
      columns: [
        { key: "id", label: "Transaction ID" },
        { key: "customer", label: "Customer" },
        { key: "amount", label: "Amount" },
        { key: "plan", label: "Plan" },
        { key: "date", label: "Date" },
      ],
      row: () => {
        const first = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
        const last = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)];
        const daysAgo = Math.floor(rand() * 30);
        const d = new Date();
        d.setDate(d.getDate() - daysAgo);
        return {
          id: `TXN-${Math.floor(rand() * 90000 + 10000)}`,
          customer: `${first} ${last}`,
          amount: Math.round((rand() * 200 + 20) * 100) / 100,
          plan: PLANS[Math.floor(rand() * PLANS.length)],
          date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        };
      },
    }),
    events: () => ({
      columns: [
        { key: "type", label: "Event" },
        { key: "user", label: "User" },
        { key: "page", label: "Page" },
        { key: "timestamp", label: "Time" },
      ],
      row: () => {
        const first = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
        const last = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)];
        const hoursAgo = Math.floor(rand() * 72);
        const d = new Date();
        d.setHours(d.getHours() - hoursAgo);
        return {
          type: EVENT_TYPES[Math.floor(rand() * EVENT_TYPES.length)],
          user: `${first} ${last}`,
          page: ["/dashboard", "/reports", "/settings", "/billing", "/api"][Math.floor(rand() * 5)],
          timestamp: d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
        };
      },
    }),
    users: () => ({
      columns: [
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "plan", label: "Plan" },
        { key: "status", label: "Status" },
        { key: "joined", label: "Joined" },
      ],
      row: () => {
        const first = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
        const last = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)];
        const daysAgo = Math.floor(rand() * 365);
        const d = new Date();
        d.setDate(d.getDate() - daysAgo);
        return {
          name: `${first} ${last}`,
          email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
          plan: PLANS[Math.floor(rand() * PLANS.length)],
          status: STATUSES[Math.floor(rand() * STATUSES.length)],
          joined: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        };
      },
    }),
  };

  const generator = entityGenerators[filters.entity] ?? entityGenerators.signups;
  const gen = generator();
  let columns = gen.columns;

  if (filters.columns && filters.columns.length > 0) {
    columns = columns.filter((c) => filters.columns!.includes(c.key));
  }

  const rows: TableRow[] = [];
  const totalRows = limit + Math.floor(rand() * 40 + 10);

  for (let i = 0; i < limit; i++) {
    const row = gen.row();
    const filtered: TableRow = {};
    for (const col of columns) {
      filtered[col.key] = row[col.key];
    }
    rows.push(filtered);
  }

  return { columns, rows, total: totalRows };
}
