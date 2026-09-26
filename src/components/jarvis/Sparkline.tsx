type SparklineProps = {
  series: number[];
  accent?: string;
};

export function Sparkline({ series, accent = "#35d4c7" }: SparklineProps) {
  if (series.length < 2) {
    return null;
  }

  const width = 120;
  const height = 28;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;

  const points = series.map((value, index) => {
    const x = (index / (series.length - 1)) * width;
    const y = height - ((value - min) / span) * (height - 4) - 2;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  const line = `M ${points.join(" L ")}`;
  const area = `${line} L ${width},${height} L 0,${height} Z`;

  return (
    <svg
      className="h-7 w-[120px] shrink-0"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <path d={area} fill={accent} opacity={0.12} />
      <path d={line} fill="none" stroke={accent} strokeWidth={1.2} opacity={0.85} />
    </svg>
  );
}
