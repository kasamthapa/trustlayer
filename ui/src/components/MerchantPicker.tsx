import type { MerchantSummary } from "../types";
import styles from "./MerchantPicker.module.css";

interface Props {
  merchants: MerchantSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

// Deterministic hue from merchant id — gives each merchant a distinct avatar colour
function avatarHue(id: string): string {
  const hues: Record<string, string> = {
    saraswati: "#4F46E5",
    bardan:    "#0891B2",
    kumar:     "#7C3AED",
    maya:      "#059669",
    f1:        "#DC2626",
    f2:        "#DC2626",
    f3:        "#DC2626",
    f4:        "#DC2626",
    f5:        "#DC2626",
  };
  return hues[id] ?? "#64748B";
}

const FRAUD_IDS = new Set(["f1", "f2", "f3", "f4", "f5"]);

export function MerchantPicker({ merchants, selectedId, onSelect }: Props) {
  const healthy = merchants.filter(m => !FRAUD_IDS.has(m.id));
  const flagged = merchants.filter(m => FRAUD_IDS.has(m.id));

  const renderItem = (m: MerchantSummary) => {
    const active  = selectedId === m.id;
    const isFraud = FRAUD_IDS.has(m.id);
    return (
      <button
        key={m.id}
        className={`${styles.item} ${active ? styles.active : ""}`}
        onClick={() => onSelect(m.id)}
        aria-pressed={active}
      >
        <span
          className={styles.avatar}
          style={{ background: avatarHue(m.id) }}
        >
          {m.name[0]}
        </span>
        <div className={styles.itemText}>
          <span className={styles.itemName}>{m.name}</span>
          <span className={styles.itemId}>{m.id}</span>
        </div>
        {isFraud && <span className={styles.fraudTag}>⚠</span>}
        {active && !isFraud && (
          <svg className={styles.activeChevron} width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
    );
  };

  return (
    <div className={styles.picker}>
      <div className={styles.pickerHeader}>
        <span className="label">Merchants</span>
        <span className={styles.count}>{merchants.length}</span>
      </div>

      <div className={styles.group}>
        {healthy.map(renderItem)}
      </div>

      {flagged.length > 0 && (
        <>
          <div className={styles.groupLabel}>
            <span className="label">Flagged</span>
            <div className={styles.groupLine} />
          </div>
          <div className={styles.group}>
            {flagged.map(renderItem)}
          </div>
        </>
      )}
    </div>
  );
}
