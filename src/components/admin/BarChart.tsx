import { formatCOP } from "@/lib/format";

type Bar = { key: string; label: string; value: number; count: number };

/**
 * Barras simples en SVG (sin librerías). Cada barra trae su valor exacto en el tooltip;
 * la escala sale del máximo y se marca con una línea de referencia.
 */
export function BarChart({ bars, highlightLast = true, height = 160 }: { bars: Bar[]; highlightLast?: boolean; height?: number }) {
  const max = Math.max(1, ...bars.map((b) => b.value));
  const W = 100 / bars.length;
  return (
    <figure className="grid gap-1">
      <div className="relative" style={{ height }}>
        <span className="absolute top-0 right-0 text-[0.65rem] font-semibold text-carbon-suave tabular-nums">{formatCOP(max)}</span>
        <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="size-full overflow-visible" role="img" aria-label="Gráfica de barras">
          <line x1="0" x2="100" y1="0.5" y2="0.5" stroke="var(--color-carbon)" strokeOpacity="0.15" vectorEffect="non-scaling-stroke" strokeDasharray="3 3" />
          <line x1="0" x2="100" y1={height - 0.5} y2={height - 0.5} stroke="var(--color-carbon)" strokeOpacity="0.4" vectorEffect="non-scaling-stroke" />
          {bars.map((b, i) => {
            const h = (b.value / max) * (height - 4);
            const last = highlightLast && i === bars.length - 1;
            return (
              <rect
                key={b.key}
                x={i * W + W * 0.15}
                width={W * 0.7}
                y={height - h}
                height={Math.max(h, b.value > 0 ? 1.5 : 0)}
                rx="0.8"
                fill={last ? "var(--color-carbon)" : "var(--color-uva)"}
              >
                <title>{`${b.label}: ${formatCOP(b.value)} · ${b.count} ${b.count === 1 ? "venta" : "ventas"}`}</title>
              </rect>
            );
          })}
        </svg>
      </div>
      <figcaption className="flex justify-between text-[0.65rem] font-semibold text-carbon-suave">
        <span>{bars[0]?.label}</span>
        <span>{bars[Math.floor(bars.length / 2)]?.label}</span>
        <span>{bars.at(-1)?.label}</span>
      </figcaption>
    </figure>
  );
}
