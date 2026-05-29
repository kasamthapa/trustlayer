// ─── Shared enums (from API contract) ────────────────────────────────────────

export type Band = "Low" | "Medium" | "High";
export type Confidence = "Low" | "Medium" | "High";
export type GateStatus = "none" | "soft" | "hard";
export type Sign = "+" | "-";

// ─── POST /score ──────────────────────────────────────────────────────────────

export interface MerchantInput {
  id: string;
  psychometric: number;        // float 0–1
  months_of_data: number;      // int
  cashflow_monthly: number;    // int, NPR
  bill_ontime_ratio: number;   // float 0–1
  qr_consistency: number;      // float 0–1
  airtime_regularity: number;  // float 0–1
  requested_loan: number | null;
}

export interface ExplanationItem {
  factor: string;
  sign: Sign;
}

export interface ScoreResult {
  id: string;
  score: number;               // int 0–1000
  band: Band;
  confidence: Confidence;
  loan_ceiling: number;        // int, NPR
  gate_status: GateStatus;
  gate_reason: string | null;
  explanation: ExplanationItem[];
}

// ─── GET /graph ───────────────────────────────────────────────────────────────

export interface GraphNode {
  id: string;
  name: string;
  trust: number;   // float 0–1 → drives size/colour
  score: number;
  fraud: boolean;  // true → render RED
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number;  // float 0–1 → edge thickness
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// ─── GET /fairness ────────────────────────────────────────────────────────────

export interface FairnessData {
  groups: string[];
  before: Record<string, number>;
  after: Record<string, number>;
  note: string;
}

// ─── GET /merchants ───────────────────────────────────────────────────────────

export interface MerchantSummary {
  id: string;
  name: string;
}
