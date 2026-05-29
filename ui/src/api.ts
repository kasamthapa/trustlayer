import type {
  MerchantInput,
  ScoreResult,
  GraphData,
  FairnessData,
  MerchantSummary,
} from "./types";

// ─── Flip to false on Day 2 when engine is live ───────────────────────────────
const USE_STUB = true;
const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// ─── Stub: merchant list ──────────────────────────────────────────────────────

const STUB_MERCHANTS: MerchantSummary[] = [
  { id: "saraswati", name: "Saraswati Tea" },
  { id: "bardan",    name: "Bardan Store" },
  { id: "kumar",     name: "Kumar Kirana" },
  { id: "maya",      name: "Maya Textiles" },
  { id: "f1",        name: "Merchant F1" },
  { id: "f2",        name: "Merchant F2" },
  { id: "f3",        name: "Merchant F3" },
  { id: "f4",        name: "Merchant F4" },
  { id: "f5",        name: "Merchant F5" },
];

// ─── Stub: score results ──────────────────────────────────────────────────────
// Story per README:
//   saraswati → happy path, high score, full loan
//   bardan    → cold-start solved, decent score, small loan
//   kumar     → honest edge case, low score, tiny probation loan
//   maya      → fairness — reliable, poor community, scores fairly
//   f1–f5     → fraud ring, flagged hard

const STUB_SCORES: Record<string, ScoreResult> = {
  saraswati: {
    id: "saraswati",
    score: 720,
    band: "High",
    confidence: "High",
    loan_ceiling: 45000,
    gate_status: "none",
    gate_reason: null,
    explanation: [
      { factor: "Steady QR income (3 yrs)", sign: "+" },
      { factor: "Bills paid on time 14/15 months", sign: "+" },
      { factor: "3 high-quality community vouches", sign: "+" },
      { factor: "Psychometric: high integrity score", sign: "+" },
      { factor: "Thin formal credit history", sign: "-" },
    ],
  },
  bardan: {
    id: "bardan",
    score: 540,
    band: "Medium",
    confidence: "Medium",
    loan_ceiling: 15000,
    gate_status: "none",
    gate_reason: null,
    explanation: [
      { factor: "Pre-existing utility bills paid on time", sign: "+" },
      { factor: "Consistent airtime top-ups (8 months)", sign: "+" },
      { factor: "1 strong community vouch", sign: "+" },
      { factor: "Short QR history — only 6 months", sign: "-" },
      { factor: "Low cashflow volume", sign: "-" },
    ],
  },
  kumar: {
    id: "kumar",
    score: 310,
    band: "Low",
    confidence: "Low",
    loan_ceiling: 5000,
    gate_status: "soft",
    gate_reason: "Minimal digital footprint — probation limit applied",
    explanation: [
      { factor: "Airtime payments regular", sign: "+" },
      { factor: "No QR transaction history", sign: "-" },
      { factor: "No community vouches yet", sign: "-" },
      { factor: "Very short behavioural record (2 months)", sign: "-" },
      { factor: "Low psychometric confidence interval", sign: "-" },
    ],
  },
  maya: {
    id: "maya",
    score: 668,
    band: "High",
    confidence: "High",
    loan_ceiling: 40000,
    gate_status: "none",
    gate_reason: null,
    explanation: [
      { factor: "Consistent QR income for 2.5 years", sign: "+" },
      { factor: "Bills paid on time 11/12 months", sign: "+" },
      { factor: "Psychometric: high integrity score", sign: "+" },
      { factor: "Community weighting reduced (fairness correction)", sign: "+" },
      { factor: "2 moderate community vouches", sign: "+" },
    ],
  },
  f1: {
    id: "f1",
    score: 190,
    band: "Low",
    confidence: "Low",
    loan_ceiling: 0,
    gate_status: "hard",
    gate_reason: "Loan request 9× typical monthly volume — fraud ring detected",
    explanation: [
      { factor: "Loan 9× normal volume", sign: "-" },
      { factor: "Coordinated spike with 4 linked accounts", sign: "-" },
      { factor: "QR transactions irregular and clustered", sign: "-" },
      { factor: "High graph centrality in flagged cluster", sign: "-" },
    ],
  },
  f2: {
    id: "f2",
    score: 210,
    band: "Low",
    confidence: "Low",
    loan_ceiling: 0,
    gate_status: "hard",
    gate_reason: "Part of coordinated fraud ring (F1–F5)",
    explanation: [
      { factor: "Simultaneous loan request with ring members", sign: "-" },
      { factor: "Synthetic vouch network detected", sign: "-" },
      { factor: "Airtime pattern irregular", sign: "-" },
    ],
  },
  f3: {
    id: "f3",
    score: 175,
    band: "Low",
    confidence: "Low",
    loan_ceiling: 0,
    gate_status: "hard",
    gate_reason: "Part of coordinated fraud ring (F1–F5)",
    explanation: [
      { factor: "Vouches only within flagged cluster", sign: "-" },
      { factor: "Abnormal cashflow spike in last 30 days", sign: "-" },
      { factor: "No legitimate third-party vouches", sign: "-" },
    ],
  },
  f4: {
    id: "f4",
    score: 200,
    band: "Low",
    confidence: "Low",
    loan_ceiling: 0,
    gate_status: "hard",
    gate_reason: "Part of coordinated fraud ring (F1–F5)",
    explanation: [
      { factor: "Short account age, high loan ask", sign: "-" },
      { factor: "Circular vouch structure detected", sign: "-" },
      { factor: "Low psychometric score", sign: "-" },
    ],
  },
  f5: {
    id: "f5",
    score: 220,
    band: "Low",
    confidence: "Low",
    loan_ceiling: 0,
    gate_status: "hard",
    gate_reason: "Part of coordinated fraud ring (F1–F5)",
    explanation: [
      { factor: "Vouches only within flagged cluster", sign: "-" },
      { factor: "Loan amount inconsistent with history", sign: "-" },
      { factor: "Abnormal QR timing patterns", sign: "-" },
    ],
  },
};

// ─── Stub: graph data ─────────────────────────────────────────────────────────

const STUB_GRAPH: GraphData = {
  nodes: [
    { id: "saraswati", name: "Saraswati Tea",  trust: 0.88, score: 720, fraud: false },
    { id: "bardan",    name: "Bardan Store",   trust: 0.62, score: 540, fraud: false },
    { id: "kumar",     name: "Kumar Kirana",   trust: 0.31, score: 310, fraud: false },
    { id: "maya",      name: "Maya Textiles",  trust: 0.79, score: 668, fraud: false },
    { id: "f1",        name: "Merchant F1",    trust: 0.18, score: 190, fraud: true  },
    { id: "f2",        name: "Merchant F2",    trust: 0.15, score: 210, fraud: true  },
    { id: "f3",        name: "Merchant F3",    trust: 0.12, score: 175, fraud: true  },
    { id: "f4",        name: "Merchant F4",    trust: 0.14, score: 200, fraud: true  },
    { id: "f5",        name: "Merchant F5",    trust: 0.16, score: 220, fraud: true  },
  ],
  edges: [
    // Healthy network
    { source: "saraswati", target: "bardan",    weight: 0.85 },
    { source: "saraswati", target: "maya",      weight: 0.90 },
    { source: "bardan",    target: "kumar",     weight: 0.60 },
    { source: "maya",      target: "bardan",    weight: 0.70 },
    // Fraud ring — dense circular structure
    { source: "f1",        target: "f2",        weight: 0.95 },
    { source: "f2",        target: "f3",        weight: 0.92 },
    { source: "f3",        target: "f4",        weight: 0.88 },
    { source: "f4",        target: "f5",        weight: 0.91 },
    { source: "f5",        target: "f1",        weight: 0.93 },
    { source: "f1",        target: "f3",        weight: 0.80 },
    { source: "f2",        target: "f4",        weight: 0.78 },
  ],
};

// ─── Stub: fairness data ──────────────────────────────────────────────────────
// Community A = well-connected; Community B = reliable but poor network (like Maya).
// Before (naive, community weight 0.8): big gap. After (personal-dominant, weight 0.2): gap shrinks.

const STUB_FAIRNESS: FairnessData = {
  groups: ["Community A", "Community B"],
  before: { "Community A": 712, "Community B": 548 },
  after:  { "Community A": 705, "Community B": 668 },
  note: "Equally-reliable merchants. 'before' = community weight 0.8, 'after' = 0.2. Gap shrinks from 164 to 37.",
};

// ─── API functions ────────────────────────────────────────────────────────────

export async function getMerchants(): Promise<MerchantSummary[]> {
  if (USE_STUB) return STUB_MERCHANTS;
  const r = await fetch(`${BASE}/merchants`);
  return r.json();
}

export async function getScore(m: MerchantInput): Promise<ScoreResult> {
  if (USE_STUB) {
    const result = STUB_SCORES[m.id];
    if (!result) throw new Error(`No stub data for merchant: ${m.id}`);
    return result;
  }
  const r = await fetch(`${BASE}/score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(m),
  });
  return r.json();
}

export async function getGraph(): Promise<GraphData> {
  if (USE_STUB) return STUB_GRAPH;
  const r = await fetch(`${BASE}/graph`);
  return r.json();
}

export async function getFairness(): Promise<FairnessData> {
  if (USE_STUB) return STUB_FAIRNESS;
  const r = await fetch(`${BASE}/fairness`);
  return r.json();
}
