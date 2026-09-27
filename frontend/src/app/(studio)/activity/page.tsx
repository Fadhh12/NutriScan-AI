import { Icon, ModuleBadge } from "@/components/studio/StudioShell";

const STEPS_WEEK = [
  { day: "S", h: "70%" },
  { day: "M", h: "40%" },
  { day: "T", h: "55%" },
  { day: "W", h: "85%", today: true },
  { day: "T", h: "20%" },
  { day: "F", h: "80%" },
  { day: "S", h: "65%" },
];

export default function ActivityPage() {
  return (
    <>
      <div>
        <ModuleBadge moduleLabel="Module 05 // Kinetic Expenditure" description="Track calories burned with daily activity" color="emerald" />
        <h1 className="font-headline-lg text-headline-lg font-bold tracking-tight text-slate-900">Daily Activity &amp; Caloric Expenditure</h1>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-gutter lg:grid-cols-12">
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-space-md shadow-sm sm:p-space-xl lg:col-span-5">
          <div className="flex flex-col gap-space-lg">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-label-sm text-[10px] font-bold uppercase tracking-widest text-slate-500">Active Burn Matrix</span>
                <h3 className="mt-0.5 font-headline-sm text-headline-sm font-bold text-slate-900">Today&apos;s calories</h3>
              </div>
              <button className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/60 bg-slate-100 text-slate-600 transition-all hover:bg-slate-200">
                <Icon name="tune" className="text-[18px]" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-space-sm sm:gap-space-md">
              <ActivityStat icon="directions_walk" label="Steps" value="+84" bg="bg-rose-50/70" border="border-rose-100" color="text-rose-600" />
              <ActivityStat icon="fitness_center" label="Weightlifting" value="+156" bg="bg-blue-50/70" border="border-blue-100" color="text-blue-600" />
              <ActivityStat icon="directions_run" label="Run" value="+35" bg="bg-emerald-50/70" border="border-emerald-100" color="text-emerald-600" />
              <ActivityStat icon="sports_gymnastics" label="Others" value="+67" bg="bg-amber-50/70" border="border-amber-100" color="text-amber-600" />
            </div>

            <div className="flex flex-col gap-space-md rounded-xl border border-slate-100 bg-slate-50 p-space-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <Icon name="footprint" className="text-[20px] text-slate-800" />
                  <span className="font-headline-sm text-headline-sm font-extrabold text-slate-900">2467</span>
                  <span className="hidden font-body-sm text-body-sm font-medium text-slate-500 sm:inline">steps today</span>
                </div>
                <span className="font-label-sm text-xs font-bold text-emerald-700">Goal 10k</span>
              </div>
              <div className="grid h-20 grid-cols-7 items-end gap-2 pt-2">
                {STEPS_WEEK.map((s, i) => (
                  <div key={i} className="flex h-full flex-col items-center justify-end gap-1">
                    <div className={`w-full rounded-t-sm ${s.today ? "bg-slate-900" : "bg-slate-300"}`} style={{ height: s.h }} />
                    <span className={`font-label-sm text-xs ${s.today ? "font-bold text-slate-900" : "text-slate-500"}`}>{s.day}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 pt-space-md font-body-sm text-body-sm text-slate-500">
            <span className="font-medium">Total Kinetic Output</span>
            <span className="font-title-md text-title-md font-extrabold text-slate-900">+342 kcal</span>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-space-md shadow-sm sm:p-space-xl lg:col-span-7">
          <div className="mb-space-md flex items-center justify-between">
            <div>
              <h3 className="font-headline-sm text-headline-sm font-bold text-slate-900">Recently logged</h3>
              <p className="font-body-sm text-body-sm text-slate-500">Continuous heart rate &amp; caloric burn synchronization</p>
            </div>
            <button className="flex items-center gap-1 rounded-full border border-slate-200/60 bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-200/80">
              <Icon name="add_circle" className="text-[16px]" />
              Log Activity
            </button>
          </div>

          <div className="flex flex-col gap-space-md">
            <ActivityRow icon="fitness_center" iconColor="text-emerald-600" name="Weightlifting" time="09:25 PM" calories={672} duration="60mins" intensity="high" intensityColor="text-rose-600" />
            <ActivityRow icon="directions_run" iconColor="text-teal-600" name="Running" time="06:30 AM" calories={573} duration="30mins" intensity="medium" intensityColor="text-emerald-700" />
          </div>

          <div className="mt-space-md flex flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50 p-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-space-xs font-body-sm text-body-sm text-slate-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Syncing live with Apple Watch Ultra &amp; Garmin Connect</span>
            </div>
            <span className="font-label-md text-xs font-bold text-emerald-700">1,245 kcal Total Burn</span>
          </div>
        </div>
      </div>
    </>
  );
}

function ActivityStat({
  icon,
  label,
  value,
  bg,
  border,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  bg: string;
  border: string;
  color: string;
}) {
  return (
    <div className={`flex items-center justify-between rounded-2xl border ${border} ${bg} p-space-sm sm:p-space-md`}>
      <div className="flex items-center gap-space-xs">
        <Icon name={icon} className={`text-[20px] ${color}`} />
        <span className="text-xs font-semibold text-slate-800 sm:text-sm">{label}</span>
      </div>
      <span className={`text-sm font-extrabold sm:text-base ${color}`}>{value}</span>
    </div>
  );
}

function ActivityRow({
  icon,
  iconColor,
  name,
  time,
  calories,
  duration,
  intensity,
  intensityColor,
}: {
  icon: string;
  iconColor: string;
  name: string;
  time: string;
  calories: number;
  duration: string;
  intensity: string;
  intensityColor: string;
}) {
  return (
    <div className="flex flex-col justify-between gap-space-md rounded-2xl border border-slate-100 bg-slate-50 p-space-md transition-all hover:bg-slate-100/60 sm:flex-row sm:items-center">
      <div className="flex items-center gap-space-md">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white shadow-sm sm:h-16 sm:w-16">
          <Icon name={icon} className={`text-[28px] sm:text-[32px] ${iconColor}`} />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-space-xs">
            <span className="font-title-lg text-title-lg font-bold text-slate-900">{name}</span>
            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-label-sm text-[10px] font-semibold text-slate-500">{time}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-space-xs font-title-md text-title-md font-semibold text-rose-600">
            <span>🔥</span>
            <span>{calories} calories</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-space-md">
        <div className="flex items-center gap-1 font-body-sm text-body-sm text-slate-500">
          <Icon name="schedule" className="text-[16px]" />
          <span>{duration}</span>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-label-sm text-xs font-semibold text-slate-700">
          Intensity: <span className={`font-bold ${intensityColor}`}>{intensity}</span>
        </div>
      </div>
    </div>
  );
}
