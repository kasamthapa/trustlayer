import { useEffect, useRef, useCallback, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
// react-force-graph-2d ships d3-force-3d — use it to configure forces via ref
import { forceManyBody, forceCollide, forceCenter } from "d3-force-3d";
import type { GraphData, GraphNode } from "../types";
import styles from "./GraphView.module.css";

interface Props {
  data: GraphData;
  selectedId: string | null;
  onSelectNode: (id: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nodeRadius(trust: number) {
  return 8 + trust * 14;
}

// Indigo-spectrum colour for healthy nodes: low trust = muted blue, high = vivid indigo
function healthyFill(trust: number): string {
  const r = Math.round(60  + (1 - trust) * 40);
  const g = Math.round(80  + trust * 50);
  const b = Math.round(200 + trust * 55);
  return `rgb(${r},${g},${b})`;
}

const FRAUD_IDS = new Set(["f1", "f2", "f3", "f4", "f5"]);

// Resolve node id from either a string or a simulation-mutated node object
function resolveId(endpoint: unknown): string {
  if (typeof endpoint === "object" && endpoint !== null) {
    return (endpoint as GraphNode).id;
  }
  return endpoint as string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GraphView({ data, selectedId, onSelectNode }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef        = useRef<any>(null);         // ForceGraph2D instance
  const didFit       = useRef(false);             // only auto-fit once
  const [dims, setDims] = useState({ w: 800, h: 500 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // ── Resize observer ──────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setDims({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    setDims({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // ── Configure d3 forces once the graph instance is ready ────────────────
  // We need the ref to be populated; easiest hook point is useEffect on dims
  // (fires after first render when fgRef.current is set).
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;

    // Moderate repulsion — spread without pushing clusters too far apart
    fg.d3Force("charge", forceManyBody().strength(-360).distanceMax(420));

    // Hard collision — nodes never overlap
    const maxR = nodeRadius(1.0);
    fg.d3Force("collide", forceCollide(maxR + 20).strength(0.85));

    // Stronger centering — pulls both clusters toward canvas centre
    fg.d3Force("center", forceCenter(dims.w / 2, dims.h / 2).strength(0.12));

    // Restart so new forces take effect
    fg.d3ReheatSimulation();
    didFit.current = false; // allow re-fit after reheat
  }, [dims]);

  // ── Zoom to fit once the simulation settles ──────────────────────────────
  const handleEngineStop = useCallback(() => {
    const fg = fgRef.current;
    if (!fg || didFit.current) return;
    didFit.current = true;
    fg.zoomToFit(600, 35); // 600ms animation, 35px padding — fills canvas
  }, []);

  // ── Node canvas painter ──────────────────────────────────────────────────
  const nodeCanvasObject = useCallback(
    (node: object, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const n = node as GraphNode & { x?: number; y?: number };
      if (n.x == null || n.y == null) return;

      const { x, y } = n;
      const r          = nodeRadius(n.trust);
      const isSelected = n.id === selectedId;
      const isHovered  = n.id === hoveredId;

      // ── FRAUD nodes ────────────────────────────────────────────────────
      if (n.fraud) {
        // 1. Radial glow halo
        const haloR = r + 16;
        const grd   = ctx.createRadialGradient(x, y, r * 0.4, x, y, haloR);
        grd.addColorStop(0,    "rgba(220,38,38,0.65)");
        grd.addColorStop(0.5,  "rgba(220,38,38,0.28)");
        grd.addColorStop(1,    "rgba(220,38,38,0)");
        ctx.beginPath();
        ctx.arc(x, y, haloR, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // 2. Dashed outer ring
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, r + 8, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(220,38,38,0.85)";
        ctx.lineWidth   = 1.8;
        ctx.setLineDash([5, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // 3. Solid red fill
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle  = "#DC2626";
        ctx.shadowColor = "#DC2626";
        ctx.shadowBlur  = 20;
        ctx.fill();
        ctx.shadowBlur = 0;

        // 4. White × mark
        const s = r * 0.30;
        ctx.strokeStyle = "rgba(255,255,255,0.80)";
        ctx.lineWidth   = 2;
        ctx.lineCap     = "round";
        ctx.beginPath();
        ctx.moveTo(x - s, y - s); ctx.lineTo(x + s, y + s);
        ctx.moveTo(x + s, y - s); ctx.lineTo(x - s, y + s);
        ctx.stroke();

      // ── HEALTHY nodes ──────────────────────────────────────────────────
      } else {
        // Selection / hover halo
        if (isSelected || isHovered) {
          const haloAlpha = isSelected ? 0.22 : 0.10;
          ctx.beginPath();
          ctx.arc(x, y, r + 8, 0, Math.PI * 2);
          ctx.fillStyle   = `rgba(79,70,229,${haloAlpha})`;
          ctx.fill();
          ctx.strokeStyle = isSelected ? "#4F46E5" : "rgba(79,70,229,0.55)";
          ctx.lineWidth   = isSelected ? 2.5 : 1;
          ctx.stroke();
        }

        // Fill
        const col = healthyFill(n.trust);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle  = col;
        ctx.shadowColor = col;
        ctx.shadowBlur  = isSelected ? 16 : 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Thin rim highlight
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.22)";
        ctx.lineWidth   = 1;
        ctx.stroke();
      }

      // ── Label ──────────────────────────────────────────────────────────
      // Fraud nodes are named "Merchant F1" — take last word to get "F1".
      // Healthy nodes are "Saraswati Tea" — first word is the right short label.
      const parts = n.name.split(" ");
      const label = n.fraud ? parts[parts.length - 1] : parts[0];
      const fontSize = Math.max(10, Math.min(13, r * 0.68));
      ctx.font          = `${isSelected ? 700 : 500} ${fontSize}px Inter, system-ui, sans-serif`;
      ctx.textAlign     = "center";
      ctx.textBaseline  = "middle";

      const tw = ctx.measureText(label).width;
      const lx = x;
      const ly = y + r + 13;
      const ph = fontSize + 5;
      const pw = tw + 12;

      // Pill backdrop
      ctx.fillStyle = "rgba(8,11,20,0.72)";
      ctx.beginPath();
      // @ts-ignore — roundRect supported in all modern browsers
      ctx.roundRect(lx - pw / 2, ly - ph / 2, pw, ph, 4);
      ctx.fill();

      ctx.fillStyle = n.fraud
        ? "#FCA5A5"
        : isSelected
          ? "#FFFFFF"
          : "rgba(224,231,255,0.92)";
      ctx.fillText(label, lx, ly + 0.5);

      // Score sub-label when zoomed in
      if (globalScale > 0.85) {
        ctx.font      = `500 ${Math.max(8, fontSize - 2.5)}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = n.fraud
          ? "rgba(252,165,165,0.70)"
          : "rgba(148,163,184,0.80)";
        ctx.fillText(`${n.score}`, lx, ly + fontSize + 4);
      }
    },
    [selectedId, hoveredId]
  );

  // ── Pointer hit area (larger than drawn node) ────────────────────────────
  const nodePointerAreaPaint = useCallback(
    (node: object, color: string, ctx: CanvasRenderingContext2D) => {
      const n = node as GraphNode & { x?: number; y?: number };
      if (n.x == null || n.y == null) return;
      ctx.beginPath();
      ctx.arc(n.x, n.y, nodeRadius(n.trust) + 14, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    },
    []
  );

  // ── Link styling ─────────────────────────────────────────────────────────
  const linkColor = useCallback((link: object) => {
    const l = link as { source: unknown; target: unknown; weight: number };
    const srcId = resolveId(l.source);
    const tgtId = resolveId(l.target);
    const isFraud = FRAUD_IDS.has(srcId) || FRAUD_IDS.has(tgtId);
    if (isFraud) {
      return `rgba(220,38,38,${0.45 + l.weight * 0.35})`;
    }
    return `rgba(99,102,241,${0.30 + l.weight * 0.45})`;
  }, []);

  const linkWidth = useCallback(
    (link: object) => Math.max(1.2, (link as { weight: number }).weight * 3),
    []
  );

  // ── Graph data (memoised shape) ──────────────────────────────────────────
  const graphData = {
    nodes: data.nodes.map(n => ({ ...n })),
    links: data.edges.map(e => ({
      source: e.source,
      target: e.target,
      weight: e.weight,
    })),
  };

  return (
    <div className={styles.wrap} ref={containerRef}>
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        width={dims.w}
        height={dims.h}
        backgroundColor="#080B12"
        // ── Node rendering ──
        nodeCanvasObject={nodeCanvasObject}
        nodeCanvasObjectMode={() => "replace"}
        nodePointerAreaPaint={nodePointerAreaPaint}
        // ── Link rendering ──
        linkColor={linkColor}
        linkWidth={linkWidth}
        linkDirectionalArrowLength={6}
        linkDirectionalArrowRelPos={0.88}
        linkDirectionalArrowColor={linkColor}
        linkCurvature={0}
        // ── Simulation ──
        // warmupTicks runs the sim before first paint so nodes start spread
        warmupTicks={120}
        cooldownTicks={200}
        d3AlphaDecay={0.018}
        d3VelocityDecay={0.4}
        onEngineStop={handleEngineStop}
        // ── Interaction ──
        onNodeClick={(node) => onSelectNode((node as GraphNode).id)}
        onNodeHover={(node) => setHoveredId(node ? (node as GraphNode).id : null)}
        enableNodeDrag
        enableZoomInteraction
        minZoom={0.3}
        maxZoom={4}
      />

      {/* ── Legend — white card over dark canvas ── */}
      <div className={styles.legend}>
        <div className={styles.legendTitle}>Graph legend</div>
        <div className={styles.legendItem}>
          <span className={styles.dotHealthy} />
          Merchant — size = trust score
        </div>
        <div className={styles.legendItem}>
          <span className={styles.dotFraud} />
          Fraud flagged
        </div>
        <div className={styles.legendItem}>
          <span className={styles.edgeLine} />
          Vouch (thickness = strength)
        </div>
        <div className={styles.legendHint}>Click any node → Score tab</div>
      </div>
    </div>
  );
}
