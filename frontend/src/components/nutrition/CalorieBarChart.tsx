"use client";

import { useState } from "react";
import type { DaySummary } from "@/lib/types";

interface CalorieBarChartProps {
  days: DaySummary[];
  target: number;
}

const DAY_LABEL = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const DATE_FORMATTER = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" });

function dayOfWeek(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00`).getDay();
}

function formatDate(dateStr: string): string {
  return DATE_FORMATTER.format(new Date(`${dateStr}T00:00:00`));
}

/**
 * 7-day calorie bar chart. Color is a status encoding (dalam target / lewat target),
 * so it always ships with an icon+label legend and per-bar tooltip — never color alone
 * (warning vs background contrast is borderline on light surfaces).
 */
export function CalorieBarChart({ days, target }: CalorieBarChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const maxValue = Math.max(target, ...days.map((d) => d.calories), 1);
  const targetLinePct = Math.min((target / maxValue) * 100, 100);
  const todayIndex = days.length - 1;

  return (
    <div>
      <div className="mb-3 flex items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
          Dalam target
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-warning" aria-hidden="true" />
          Lewat target
        </span>
      </div>

      <div className="relative h-40">
        <div
          className="absolute inset-x-0 border-t border-dashed border-muted"
          style={{ bottom: `${targetLinePct}%` }}
        >
          <span className="absolute right-0 -top-4 text-[10px] text-muted">
            Target {target.toLocaleString("id-ID")}
          </span>
        </div>

        <div className="flex h-full items-end justify-between gap-2">
          {days.map((day, index) => {
            const heightPct = Math.max((day.calories / maxValue) * 100, day.calories > 0 ? 3 : 0);
            const isOver = day.calories > target;
            const isToday = index === todayIndex;
            const isActive = activeIndex === index;
            const statusLabel = isOver ? "lewat target" : "dalam target";

            return (
              <div key={day.date} className="relative flex h-full flex-1 flex-col items-center justify-end gap-2">
                {isActive && (
                  <div className="absolute bottom-full z-10 mb-1 w-max -translate-x-1/2 rounded-control border border-border bg-surface-elevated px-2.5 py-1.5 text-center shadow-lg">
                    <p className="font-mono text-sm font-semibold tabular-nums text-foreground">
                      {day.calories.toFixed(0)} kkal
                    </p>
                    <p className="text-[10px] text-muted">
                      {formatDate(day.date)} · {statusLabel}
                    </p>
                  </div>
                )}

                {isToday && day.calories > 0 && (
                  <p className="font-mono text-[10px] font-semibold tabular-nums text-foreground">
                    {day.calories.toFixed(0)}
                  </p>
                )}

                <button
                  type="button"
                  className="flex h-full w-full items-end"
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onFocus={() => setActiveIndex(index)}
                  onBlur={() => setActiveIndex(null)}
                  aria-label={`${formatDate(day.date)}: ${day.calories.toFixed(0)} kkal, ${statusLabel}`}
                >
                  <span
                    className={`w-full rounded-t transition-[height] ${isOver ? "bg-warning" : "bg-accent"} ${
                      isActive ? "brightness-110" : ""
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                </button>

                <span className={`text-xs ${isToday ? "font-semibold text-foreground" : "text-muted"}`}>
                  {DAY_LABEL[dayOfWeek(day.date)]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <table className="sr-only">
        <caption>Kalori per hari, 7 hari terakhir, target {target} kkal</caption>
        <thead>
          <tr>
            <th scope="col">Tanggal</th>
            <th scope="col">Kalori</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr key={day.date}>
              <td>{formatDate(day.date)}</td>
              <td>{day.calories.toFixed(0)} kkal</td>
              <td>{day.calories > target ? "Lewat target" : "Dalam target"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
