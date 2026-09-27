import { Icon, ModuleBadge } from "@/components/studio/StudioShell";

const WEEK_MACROS = [
  { day: "S", total: 2450, p: 92, c: 128, f: 56, hp: "h-10", hc: "h-16", hf: "h-8" },
  { day: "M", total: 1235, p: 121, c: 104, f: 56, hp: "h-8", hc: "h-12", hf: "h-6" },
  { day: "T", total: 2176, p: 92, c: 117, f: 48, hp: "h-9", hc: "h-14", hf: "h-7" },
  { day: "W", total: 2176, p: 92, c: 117, f: 48, hp: "h-9", hc: "h-14", hf: "h-7", today: true },
  { day: "T", total: 2470, p: 96, c: 128, f: 56, hp: "h-10", hc: "h-16", hf: "h-8" },
  { day: "F", total: 1924, p: 88, c: 102, f: 54, hp: "h-7", hc: "h-12", hf: "h-7" },
  { day: "S", total: 2165, p: 92, c: 117, f: 58, hp: "h-9", hc: "h-14", hf: "h-8" },
];

export default function AnalyticsPage() {
  return (
    <>
      <div className="flex flex-col justify-between gap-space-md md:flex-row md:items-end">
        <div>
          <ModuleBadge moduleLabel="Module 04 // Macro Analytics" description="Personalize goals on your dashboard" color="rose" />
          <h1 className="font-headline-lg text-headline-lg font-bold tracking-tight text-slate-900">Dashboard &amp; Weekly Aggregates</h1>
        </div>
        <div className="flex items-center gap-space-md">
          <div className="flex flex-col items-end rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
            <span className="font-label-sm text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Calories</span>
            <span className="font-title-lg text-title-lg font-bold text-slate-900">
              15,400 <span className="font-body-sm text-body-sm font-normal text-slate-500">kcal</span>
            </span>
          </div>
          <div className="flex flex-col items-end rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
            <span className="font-label-sm text-[10px] font-bold uppercase tracking-wider text-slate-500">Daily Avg</span>
            <span className="font-title-lg text-title-lg font-bold text-emerald-700">
              2,200 <span className="font-body-sm text-body-sm font-normal text-slate-500">kcal</span>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-gutter lg:grid-cols-12">
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-space-md shadow-sm sm:p-space-xl lg:col-span-5">
          <div className="mb-space-md flex items-center justify-between">
            <div>
              <span className="font-title-md text-title-md font-bold text-slate-900">Weight &amp; Deficit Trajectory</span>
              <p className="font-body-sm text-body-sm text-slate-500">Aug 23 – Aug 27 (Descending)</p>
            </div>
            <Icon name="trending_down" className="text-[24px] text-emerald-600" />
          </div>

          <div className="relative my-space-md flex h-48 w-full items-end rounded-xl border border-slate-100 bg-slate-50/50 p-2">
            <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 400 160">
              <defs>
                <linearGradient id="grad-area" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line className="text-slate-200" stroke="currentColor" strokeDasharray="4" x1="0" x2="400" y1="40" y2="40" />
              <line className="text-slate-200" stroke="currentColor" strokeDasharray="4" x1="0" x2="400" y1="80" y2="80" />
              <line className="text-slate-200" stroke="currentColor" strokeDasharray="4" x1="0" x2="400" y1="120" y2="120" />
              <path d="M 0 60 Q 90 65 180 85 T 400 125 L 400 160 L 0 160 Z" fill="url(#grad-area)" />
              <path d="M 0 60 Q 90 65 180 85 T 400 125" fill="none" stroke="#2563eb" strokeLinecap="round" strokeWidth="3" />
              <circle cx="0" cy="60" fill="#2563eb" r="4" />
              <circle cx="100" cy="67" fill="#2563eb" r="4" />
              <circle cx="200" cy="92" fill="#2563eb" r="4" />
              <circle cx="300" cy="110" fill="#2563eb" r="4" />
              <circle cx="400" cy="125" fill="#10b981" r="5" />
            </svg>
          </div>

          <div className="flex items-center justify-between pt-space-xs font-label-sm text-xs text-slate-500">
            <span>08/23 (76.2kg)</span>
            <span className="hidden sm:inline">08/24</span>
            <span className="hidden sm:inline">08/25</span>
            <span className="hidden sm:inline">08/26</span>
            <span className="font-bold text-emerald-700">08/27 (74.8kg)</span>
          </div>
          <div className="mt-space-md flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3">
            <span className="font-body-sm text-body-sm font-medium text-slate-600">Net weight variance</span>
            <span className="font-title-md text-title-md font-bold text-emerald-700">-1.4 kg this cycle</span>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-space-md shadow-sm sm:p-space-xl lg:col-span-7">
          <div className="mb-space-md flex flex-col gap-space-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="font-title-lg text-title-lg font-extrabold text-slate-900">Weekly Daily Macro Distribution</span>
              <p className="font-body-sm text-body-sm text-slate-500">Segmented breakdown: Calories, Protein, Carbs, Fat</p>
            </div>
            <div className="flex flex-wrap items-center gap-space-sm">
              <Legend color="bg-slate-900" label="Calories" />
              <Legend color="bg-rose-500" label="Protein" />
              <Legend color="bg-emerald-500" label="Carbs" />
              <Legend color="bg-blue-500" label="Fat" />
            </div>
          </div>

          <div className="grid h-56 grid-cols-7 items-end gap-1 pb-space-sm pt-space-lg sm:gap-space-sm md:gap-space-md">
            {WEEK_MACROS.map((d, i) => (
              <div key={i} className="flex h-full flex-col items-center justify-end gap-1.5">
                <span className={`font-label-sm text-[10px] font-bold sm:text-xs ${d.today ? "text-rose-600" : "text-slate-800"}`}>{d.total}</span>
                <div className={`flex w-full max-w-[42px] flex-col gap-1 overflow-hidden rounded-t-lg ${d.today ? "ring-2 ring-rose-400/40" : ""}`}>
                  <div className={`${d.hp} flex items-center justify-center rounded-sm bg-rose-500 font-label-sm text-[9px] font-bold text-white sm:text-[10px]`}>{d.p} P</div>
                  <div className={`${d.hc} flex items-center justify-center rounded-sm bg-emerald-500 font-label-sm text-[9px] font-bold text-white sm:text-[10px]`}>{d.c} C</div>
                  <div className={`${d.hf} flex items-center justify-center rounded-sm bg-blue-500 font-label-sm text-[9px] font-bold text-white sm:text-[10px]`}>{d.f} F</div>
                </div>
                <span className={`mt-1 font-title-md text-xs font-bold sm:text-sm ${d.today ? "text-rose-600" : "text-slate-600"}`}>{d.day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1 font-label-sm text-xs font-semibold text-slate-700">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} /> {label}
    </span>
  );
}
