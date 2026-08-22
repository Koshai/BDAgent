export function SparkChart({
  values,
  label,
  color = "var(--jade)",
}: {
  values: number[];
  label: string;
  color?: string;
}) {
  const max = Math.max(...values, 1);
  const w = 640;
  const h = 140;
  const pad = { t: 12, r: 8, b: 24, l: 36 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;

  const pts = values.map((v, i) => {
    const x = pad.l + (i / Math.max(values.length - 1, 1)) * innerW;
    const y = pad.t + innerH - (v / max) * innerH;
    return { x, y, v };
  });

  const line = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const area =
    pts.length > 0
      ? `${pad.l},${pad.t + innerH} ${line} ${pad.l + innerW},${pad.t + innerH}`
      : "";

  const gridLines = [0, 0.5, 1].map((t, i) => {
    const y = pad.t + innerH * (1 - t);
    const val = Math.round(max * t);
    return { i, y, val };
  });

  return (
    <div className="chart-card">
      <div className="chart-head">
        <span className="chart-label">{label}</span>
        <span className="chart-peak">{values.length ? `Peak ${max}` : "No data yet"}</span>
      </div>
      <svg className="spark" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label} preserveAspectRatio="xMidYMid meet">
        {gridLines.map((g) => (
          <g key={`grid-${g.i}`}>
            <line x1={pad.l} y1={g.y} x2={w - pad.r} y2={g.y} className="chart-grid" />
            <text x={pad.l - 6} y={g.y + 4} className="chart-axis" textAnchor="end">
              {g.val}
            </text>
          </g>
        ))}
        {area ? <polygon points={area} className="chart-area" style={{ fill: color, opacity: 0.12 }} /> : null}
        {line ? (
          <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" points={line} />
        ) : (
          <text x={w / 2} y={h / 2} className="chart-empty" textAnchor="middle">
            Waiting for activity
          </text>
        )}
      </svg>
    </div>
  );
}

export function FunnelChart({
  steps,
}: {
  steps: Array<{ label: string; value: number }>;
}) {
  const max = Math.max(...steps.map((s) => s.value), 1);
  return (
    <div className="funnel-chart">
      {steps.map((s) => (
        <div key={s.label} className="funnel-step">
          <div className="funnel-meta">
            <span className="funnel-label">{s.label}</span>
            <span className="funnel-val">{s.value}</span>
          </div>
          <div className="funnel-bar">
            <i style={{ width: `${Math.max((s.value / max) * 100, s.value > 0 ? 4 : 0)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
