import { useState, useEffect, useCallback } from "react";
import { getMerchants, getScore, getGraph, getFairness } from "./api";
import type {
  MerchantSummary,
  ScoreResult,
  GraphData,
  FairnessData,
} from "./types";
import { MerchantPicker } from "./components/MerchantPicker";
import { ScorePanel } from "./components/ScorePanel";
import { GraphView } from "./components/GraphView";
import { FairnessChart } from "./components/FairnessChart";
import styles from "./App.module.css";

type Tab = "score" | "graph" | "fairness";

const DEFAULT_INPUT = {
  psychometric: 0.72,
  months_of_data: 18,
  cashflow_monthly: 60000,
  bill_ontime_ratio: 0.93,
  qr_consistency: 0.88,
  airtime_regularity: 0.80,
  requested_loan: 45000,
};

// ── Logo SVG ─────────────────────────────────────────────────────────────────
function LogoMark() {
  return (
    <div className={styles.logoMark}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        {/* Shield shape */}
        <path
          d="M10 2L3 5v5c0 4.4 3 8.5 7 9.5 4-1 7-5.1 7-9.5V5L10 2z"
          fill="rgba(255,255,255,0.15)"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="1"
        />
        {/* Checkmark / trust tick */}
        <path
          d="M7 10.5l2 2 4-4"
          stroke="#fff"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>("score");
  const [merchants, setMerchants] = useState<MerchantSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [scoreResult, setScoreResult]   = useState<ScoreResult | null>(null);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [scoreError, setScoreError]     = useState<string | null>(null);

  const [graphData, setGraphData]       = useState<GraphData | null>(null);
  const [fairnessData, setFairnessData] = useState<FairnessData | null>(null);

  useEffect(() => {
    getMerchants().then((list) => {
      setMerchants(list);
      if (list.length > 0) setSelectedId(list[0].id);
    });
    getGraph().then(setGraphData);
    getFairness().then(setFairnessData);
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setScoreLoading(true);
    setScoreError(null);
    getScore({ id: selectedId, ...DEFAULT_INPUT })
      .then((r) => { setScoreResult(r); setScoreLoading(false); })
      .catch((e) => { setScoreError(String(e)); setScoreLoading(false); });
  }, [selectedId]);

  const handleGraphNodeClick = useCallback((id: string) => {
    setSelectedId(id);
    setTab("score");
  }, []);

  return (
    <div className={styles.app}>

      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <LogoMark />
            <div className={styles.brandText}>
              <span className={styles.brandName}>TrustLayer</span>
              <span className={styles.brandSub}>Alternative Credit Scoring</span>
            </div>
          </div>

          <div className={styles.headerRight}>
            <nav className={styles.tabs}>
              {(["score", "graph", "fairness"] as Tab[]).map((t) => (
                <button
                  key={t}
                  className={`${styles.tab} ${tab === t ? styles.tabActive : ""}`}
                  onClick={() => setTab(t)}
                >
                  {t === "score"    && "Score"}
                  {t === "graph"    && "Trust Graph"}
                  {t === "fairness" && "Fairness"}
                </button>
              ))}
            </nav>
            <span className={styles.stubBadge}>Demo mode</span>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <div className={styles.main}>

        {/* ── Sidebar ── */}
        <aside className={styles.sidebar}>
          <div className="card" style={{ padding: "var(--sp-4)", height: "100%" }}>
            <MerchantPicker
              merchants={merchants}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>
        </aside>

        {/* ── Content ── */}
        <main className={styles.content}>

          {/* SCORE */}
          {tab === "score" && (
            <div className={styles.scoreLayout}>
              <div className={`card ${styles.scoreCard}`} style={{ padding: "var(--sp-8)" }}>
                {scoreLoading && (
                  <div className={styles.loading}>
                    <div className={styles.spinner} />
                    Scoring merchant…
                  </div>
                )}
                {scoreError && (
                  <div className={styles.error}>Error: {scoreError}</div>
                )}
                {!scoreLoading && !scoreError && scoreResult && (
                  <ScorePanel result={scoreResult} />
                )}
                {!scoreLoading && !scoreError && !scoreResult && (
                  <div className={styles.empty}>
                    <span className={styles.emptyIcon}>🏪</span>
                    Select a merchant from the sidebar to see their credit score.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* GRAPH */}
          {tab === "graph" && (
            <div className={styles.graphLayout}>
              <div className={styles.graphMeta}>
                <h2 className={styles.graphTitle}>Community Trust Graph</h2>
                <p className={styles.graphSubtitle}>
                  Node size = trust score · Red nodes = fraud flagged · Click any node to score
                </p>
              </div>
              {graphData ? (
                <div className={`card ${styles.graphCanvasWrap}`} style={{ padding: 0, overflow: "hidden" }}>
                  <GraphView
                    data={graphData}
                    selectedId={selectedId}
                    onSelectNode={handleGraphNodeClick}
                  />
                </div>
              ) : (
                <div className={styles.loading}><div className={styles.spinner} />Loading graph…</div>
              )}
              {scoreResult && (
                <div className={`card ${styles.graphScorePanel}`} style={{ padding: "var(--sp-6)" }}>
                  <ScorePanel result={scoreResult} compact />
                </div>
              )}
            </div>
          )}

          {/* FAIRNESS */}
          {tab === "fairness" && (
            <div className={styles.fairnessLayout}>
              <div className={`card ${styles.fairnessCard}`} style={{ padding: "var(--sp-8)" }}>
                {fairnessData
                  ? <FairnessChart data={fairnessData} />
                  : <div className={styles.loading}><div className={styles.spinner} />Loading…</div>
                }
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
