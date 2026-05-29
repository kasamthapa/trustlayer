import type { FairnessData } from "../types";
import styles from "./FairnessChart.module.css";

interface Props {
  data: FairnessData;
}

const MAX_SCORE = 800;

export function FairnessChart({ data }: Props) {
  const { groups, before, after, note } = data;

  const beforeGap = Math.abs((before[groups[0]] ?? 0) - (before[groups[1]] ?? 0));
  const afterGap  = Math.abs((after[groups[0]]  ?? 0) - (after[groups[1]]  ?? 0));
  const reduction = Math.round(((beforeGap - afterGap) / beforeGap) * 100);

  return (
    <div className={styles.wrap}>

      {/* ── Section header ── */}
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.title}>Fairness Audit</h2>
          <p className={styles.subtitle}>
            Score gap between equally-reliable communities, before and after personal-dominant weighting.
          </p>
        </div>
      </div>

      {/* ── KPI cards row ── */}
      <div className={styles.kpiRow}>
        <div className={`${styles.kpi} ${styles.kpiAccent}`}>
          <span className={styles.kpiNum}>{reduction}%</span>
          <span className={styles.kpiLabel}>Gap reduced</span>
        </div>
        <div className={styles.kpi}>
          <span className={styles.kpiNum} style={{ color: "var(--band-low)" }}>{beforeGap} pts</span>
          <span className={styles.kpiLabel}>Gap before</span>
        </div>
        <div className={styles.kpi}>
          <span className={styles.kpiNum} style={{ color: "var(--band-high)" }}>{afterGap} pts</span>
          <span className={styles.kpiLabel}>Gap after</span>
        </div>
      </div>

      {/* ── Bar chart ── */}
      <div className={styles.chart}>
        <div className={styles.chartHeader}>
          <div className={styles.legendRow}>
            <span className={`${styles.legendDot} ${styles.dotBefore}`} /> Before
            <span className={`${styles.legendDot} ${styles.dotAfter}`}  style={{ marginLeft: 12 }} /> After
          </div>
        </div>

        {groups.map((group) => {
          const bVal = before[group] ?? 0;
          const aVal = after[group]  ?? 0;
          const bPct = (bVal / MAX_SCORE) * 100;
          const aPct = (aVal / MAX_SCORE) * 100;

          return (
            <div key={group} className={styles.row}>
              <div className={styles.rowLabel}>{group}</div>
              <div className={styles.rowBars}>
                {/* Before */}
                <div className={styles.barTrack}>
                  <div
                    className={`${styles.bar} ${styles.barBefore}`}
                    style={{ width: `${bPct}%` }}
                  />
                  <span className={styles.barVal}>{bVal}</span>
                </div>
                {/* After */}
                <div className={styles.barTrack}>
                  <div
                    className={`${styles.bar} ${styles.barAfter}`}
                    style={{ width: `${aPct}%` }}
                  />
                  <span className={styles.barVal}>{aVal}</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* X-axis */}
        <div className={styles.xAxis}>
          <div className={styles.xAxisInner}>
            {[0, 200, 400, 600, 800].map(v => (
              <span key={v} className={styles.xTick}>
                {v}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Insight note ── */}
      <div className={styles.note}>
        <div className={styles.noteBar} />
        <p>{note}</p>
      </div>

    </div>
  );
}
