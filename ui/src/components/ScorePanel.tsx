import type { ScoreResult, Band } from "../types";
import styles from "./ScorePanel.module.css";

interface Props {
  result: ScoreResult;
  compact?: boolean;
}

interface BandStyle {
  color: string;
  bg: string;
  border: string;
  text: string;
  ringColor: string;
}

function bandStyle(band: Band): BandStyle {
  if (band === "High") return {
    color:     "var(--band-high)",
    bg:        "var(--band-high-bg)",
    border:    "var(--band-high-border)",
    text:      "var(--band-high-text)",
    ringColor: "#059669",
  };
  if (band === "Medium") return {
    color:     "var(--band-med)",
    bg:        "var(--band-med-bg)",
    border:    "var(--band-med-border)",
    text:      "var(--band-med-text)",
    ringColor: "#D97706",
  };
  return {
    color:     "var(--band-low)",
    bg:        "var(--band-low-bg)",
    border:    "var(--band-low-border)",
    text:      "var(--band-low-text)",
    ringColor: "#DC2626",
  };
}

// r=54 → circumference = 2π×54 ≈ 339.3
const RING_R   = 54;
const RING_C   = 2 * Math.PI * RING_R; // 339.29

function dashOffset(score: number) {
  const pct = Math.min(Math.max(score / 1000, 0), 1);
  return RING_C * (1 - pct);
}

export function ScorePanel({ result, compact = false }: Props) {
  const { score, band, confidence, loan_ceiling, gate_status, gate_reason, explanation, id } = result;
  const bs = bandStyle(band);
  const offset = dashOffset(score);

  return (
    <div className={`${styles.panel} ${compact ? styles.compact : ""}`}>

      {/* ══ HERO: score ring + band ═══════════════════════════════════════ */}
      <div className={styles.hero}>
        {/* SVG ring */}
        <div className={styles.ringWrap}>
          <svg
            className={styles.ring}
            viewBox="0 0 130 130"
            aria-label={`Credit score ${score} out of 1000`}
          >
            {/* Background track */}
            <circle
              cx="65" cy="65" r={RING_R}
              className={styles.ringTrack}
            />
            {/* Subtle tick marks */}
            {[0, 25, 50, 75].map((pct) => {
              const angle = (pct / 100) * 360 - 90;
              const rad   = (angle * Math.PI) / 180;
              const x1    = 65 + (RING_R - 6) * Math.cos(rad);
              const y1    = 65 + (RING_R - 6) * Math.sin(rad);
              const x2    = 65 + (RING_R + 6) * Math.cos(rad);
              const y2    = 65 + (RING_R + 6) * Math.sin(rad);
              return <line key={pct} x1={x1} y1={y1} x2={x2} y2={y2} className={styles.ringTick} />;
            })}
            {/* Filled arc */}
            <circle
              cx="65" cy="65" r={RING_R}
              className={styles.ringFill}
              style={{
                stroke: bs.ringColor,
                strokeDashoffset: offset,
              }}
            />
          </svg>

          {/* Score number centred in ring */}
          <div className={styles.ringCenter}>
            <span className={styles.scoreNum}>{score}</span>
            <span className={styles.scoreMax}>/ 1000</span>
          </div>
        </div>

        {/* Band pill */}
        <div
          className={styles.bandPill}
          style={{
            color:            bs.text,
            background:       bs.bg,
            borderColor:      bs.border,
          }}
        >
          <span
            className={styles.bandDot}
            style={{ background: bs.color }}
          />
          {band === "High" ? "Creditworthy" : band === "Medium" ? "Moderate risk" : "High risk"}
        </div>

        {!compact && (
          <p className={styles.scoreCaption}>
            {band === "High"
              ? "Strong profile — qualifies for recommended loan amount."
              : band === "Medium"
              ? "Adequate history — partial loan recommended."
              : "Insufficient footprint — probation limit applied."}
          </p>
        )}
      </div>

      {/* ══ META ROW ═════════════════════════════════════════════════════ */}
      <div className={styles.metaRow}>
        <div className={styles.metaCell}>
          <span className="label">Confidence</span>
          <span className={styles.metaVal}>{confidence}</span>
        </div>
        <div className={styles.metaDivider} />
        <div className={styles.metaCell}>
          <span className="label">Loan ceiling</span>
          <span className={styles.metaVal}>
            {loan_ceiling > 0
              ? `NPR ${loan_ceiling.toLocaleString()}`
              : <span style={{ color: "var(--band-low)" }}>Not approved</span>
            }
          </span>
        </div>
        <div className={styles.metaDivider} />
        <div className={styles.metaCell}>
          <span className="label">Merchant</span>
          <span className={styles.metaVal} style={{ fontFamily: "var(--mono)", fontSize: "13px" }}>{id}</span>
        </div>
      </div>

      {/* ══ GATE BANNER ══════════════════════════════════════════════════ */}
      {gate_status !== "none" && (
        <div className={`${styles.gate} ${gate_status === "hard" ? styles.gateHard : styles.gateSoft}`}>
          <div className={`${styles.gateBar} ${gate_status === "hard" ? styles.gateBarHard : styles.gateBarSoft}`} />
          <div className={styles.gateBody}>
            <span className={styles.gateTitle}>
              {gate_status === "hard" ? "Fraud gate — blocked" : "Soft limit applied"}
            </span>
            {gate_reason && <span className={styles.gateReason}>{gate_reason}</span>}
          </div>
        </div>
      )}

      {/* ══ EXPLANATION ══════════════════════════════════════════════════ */}
      <div className={styles.explain}>
        <span className="label">Score breakdown</span>
        <ul className={styles.chips}>
          {explanation.map((item, i) => (
            <li
              key={i}
              className={`${styles.chip} ${item.sign === "+" ? styles.chipPos : styles.chipNeg}`}
            >
              <span
                className={styles.chipAccent}
                style={{
                  background: item.sign === "+" ? "var(--band-high)" : "var(--band-low)",
                }}
              />
              <span
                className={styles.chipSign}
                style={{ color: item.sign === "+" ? "var(--band-high)" : "var(--band-low)" }}
              >
                {item.sign}
              </span>
              {item.factor}
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}
