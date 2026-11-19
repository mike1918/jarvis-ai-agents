export type Role = "owner" | "operator" | "viewer";
export interface Me { id: number; username: string; role: Role; perms: string[] }
export interface District { folder: string; district: string; planned_capacity: number; agents: string[]; count: number; working: number }
export interface AgentRow {
  name: string; description: string; model: string; access: string; tools: string[]; note?: string | null;
  state: "idle" | "working" | "queued"; counts: Record<string, number>;
  last_task?: { id: number; status: string; prompt: string; finished_at?: number; cost_usd: number } | null;
  stats: { n: number; failed: number | null; usd: number };
}
export interface Task {
  id: number; agent: string; prompt: string; mode: "read" | "write"; status: string; max_budget_usd: number; source: string;
  created_at: number; started_at?: number; finished_at?: number; cost_usd: number; result?: string; error?: string;
  suggested?: string; delegated?: string; executor?: string; events?: { ts: number; kind: string; data: string }[]; delegates_now?: string[];
}
export interface Limits {
  max_parallel_tasks: number; default_task_budget_usd: number; approval_threshold_usd: number; hard_task_cap_usd: number;
  daily_budget_usd: number; monthly_budget_usd: number; queue_paused: boolean; spent_today_usd: number; spent_month_usd: number;
  running: number; executor: string; reserved_usd: number; expected_usd: number; remaining_today_usd: number;
  remaining_month_usd: number; paid_blocked: boolean;
}
export interface Approval { id: number; ts: number; kind: string; reason: string; requested_by_name: string; task?: Task }
