interface MacroBreakdownProps {
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
}

const MACROS: Array<{ key: keyof MacroBreakdownProps; label: string; colorClass: string }> = [
  { key: "proteinG", label: "Protein", colorClass: "bg-accent" },
  { key: "carbsG", label: "Karbo", colorClass: "bg-warning" },
  { key: "fatG", label: "Lemak", colorClass: "bg-danger" },
  { key: "fiberG", label: "Serat", colorClass: "bg-muted" },
];

export function MacroBreakdown(props: MacroBreakdownProps) {
  const total = props.proteinG + props.carbsG + props.fatG + props.fiberG || 1;

  return (
    <div className="space-y-3">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-border">
        {MACROS.map((m) => (
          <div
            key={m.key}
            className={m.colorClass}
            style={{ width: `${(props[m.key] / total) * 100}%` }}
          />
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        {MACROS.map((m) => (
          <div key={m.key}>
            <span className={`mx-auto mb-1 block h-1.5 w-1.5 rounded-full ${m.colorClass}`} />
            <p className="font-mono text-sm font-semibold tabular-nums text-foreground">
              {props[m.key].toFixed(1)}g
            </p>
            <p className="text-xs text-muted">{m.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
