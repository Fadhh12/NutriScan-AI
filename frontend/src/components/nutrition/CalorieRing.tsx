interface CalorieRingProps {
  consumed: number;
  target: number;
}

const SIZE = 132;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CalorieRing({ consumed, target }: CalorieRingProps) {
  const ratio = target > 0 ? Math.min(consumed / target, 1) : 0;
  const isOver = consumed > target;
  const dashOffset = CIRCUMFERENCE * (1 - ratio);
  const remaining = Math.max(target - consumed, 0);

  return (
    <div className="flex items-center gap-5">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          strokeWidth={STROKE}
          className="fill-none stroke-border"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          className={`fill-none transition-all duration-700 ease-out ${isOver ? "stroke-warning" : "stroke-accent"}`}
        />
      </svg>
      <div>
        <p className="font-mono text-3xl font-semibold tabular-nums text-foreground">
          {consumed.toLocaleString("id-ID")}
        </p>
        <p className="text-sm text-muted">dari {target.toLocaleString("id-ID")} kkal</p>
        <p className="mt-1 text-xs text-muted">
          {isOver
            ? `${(consumed - target).toLocaleString("id-ID")} kkal di atas target`
            : `Sisa ${remaining.toLocaleString("id-ID")} kkal`}
        </p>
      </div>
    </div>
  );
}
