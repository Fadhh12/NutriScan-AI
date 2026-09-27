import { Icon, ModuleBadge } from "@/components/studio/StudioShell";

export default function CalorieTrackerPage() {
  return (
    <>
      <div className="flex flex-col justify-between gap-space-md md:flex-row md:items-end">
        <div>
          <ModuleBadge moduleLabel="Module 02 // Metabolic Budget" description="Dynamic Calorie Deficit Engine" color="emerald" />
          <h1 className="font-headline-lg text-headline-lg font-bold tracking-tight text-slate-900">
            Today&apos;s Calories &amp; Daily Intake
          </h1>
        </div>
        <div className="flex items-center gap-space-xs">
          <span className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm">Wednesday, Aug 27</span>
          <button className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900">
            <Icon name="settings" className="text-[18px]" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-gutter lg:grid-cols-12">
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-space-md shadow-sm sm:p-space-xl lg:col-span-5">
          <div className="flex items-center justify-between">
            <span className="font-title-md text-title-md font-bold text-slate-900">Today&apos;s calories</span>
            <Icon name="more_horiz" className="cursor-pointer text-[20px] text-slate-400 hover:text-slate-600" />
          </div>

          <div className="my-space-lg flex flex-col items-center justify-center gap-space-xl sm:flex-row">
            <div className="relative flex h-44 w-44 items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                <circle className="fill-none stroke-slate-100" cx="60" cy="60" r="50" strokeWidth="10" />
                <circle
                  className="fill-none stroke-rose-500"
                  cx="60"
                  cy="60"
                  r="50"
                  strokeDasharray="314.159"
                  strokeDashoffset="80"
                  strokeLinecap="round"
                  strokeWidth="10"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-metric-display text-metric-display font-extrabold leading-none tracking-tight text-slate-900">486</span>
                <span className="mt-1 font-label-sm text-[10px] font-bold uppercase tracking-wider text-slate-500">Cal left</span>
              </div>
            </div>

            <div className="flex flex-col gap-space-xs rounded-xl border border-slate-100 bg-slate-50 p-4 text-left">
              <span className="font-label-sm text-[10px] font-bold uppercase tracking-widest text-slate-500">Daily goal</span>
              <div className="flex items-baseline gap-1">
                <span className="font-headline-md text-headline-md font-bold text-slate-900">1893</span>
                <span className="font-body-sm text-body-sm text-slate-500">kcal</span>
              </div>
              <div className="flex items-center gap-1 font-label-sm text-xs font-semibold text-emerald-600">
                <Icon name="trending_up" className="text-[14px]" />
                <span>On track (+12%)</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-space-sm pt-space-md">
            <MacroStat label="Protein" pct={54} value="65" of="120g" color="bg-rose-500" textColor="text-rose-600" />
            <MacroStat label="Carbs" pct={67} value="256" of="380g" color="bg-emerald-500" textColor="text-emerald-600" />
            <MacroStat label="Fat" pct={50} value="43" of="85g" color="bg-blue-500" textColor="text-blue-600" />
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-space-md shadow-sm sm:p-space-xl lg:col-span-7">
          <div className="mb-space-md flex items-center justify-between">
            <div>
              <h3 className="font-headline-sm text-headline-sm font-bold text-slate-900">Recently Logged Meals</h3>
              <p className="font-body-sm text-body-sm text-slate-500">Real-time synchronized caloric telemetry</p>
            </div>
            <button className="flex items-center gap-1 rounded-full border border-slate-200/60 bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-200/80">
              <Icon name="add" className="text-[16px]" />
              Log Food
            </button>
          </div>

          <div className="flex flex-col gap-space-md">
            <MealRow
              name="Vegetable Salad"
              time="09:25 PM"
              calories={256}
              protein="22g"
              carbs="156g"
              fat="24g"
              image="https://lh3.googleusercontent.com/aida-public/AB6AXuAicJBDw3EcgKj4x61EhbZT3_AVgDd0UocIBKp4BebAcj-0kBGoVoJzOLKQn36PRCQldgHUL9TnJEmCC3dinMXdD1bqVfAM8Ojzzru7pZ9zwZupdhq6f-A2uxNkXH4EgQ-BKqaCrksF37Cyg01x9qjT7_pC7cq3SCHqsxa-0zM4RSHl6me_4eSZj3agPUzTEExs9qXUD-i0Sdyse9a3jTD7UioUREG-5qIUSgQLU60ABDBz-aqYgwQ6"
            />
            <MealRow
              name="Shrimp platter"
              time="01:15 PM"
              calories={136}
              protein="24g"
              carbs="89g"
              fat="20g"
              image="https://lh3.googleusercontent.com/aida-public/AB6AXuBPEu8pXCbEvsKFw_kzjZ2LpwjXh_N7-Z6A0Bw28OaN516YO0YaUZ5ZogMNn_jEnq9SLuko46VbI1RaDX73SI2xEsCWApvOlNzqioVJlWWUABvrAh7SsXA0WV5ABEzmNosf3NJ3Y8mwa1HxyntNURdz9bgBfHuLd9uKnjAkXRVwqV2Dz44ZeUhH3UcidrnFLPl9zEhHu0DNAbamMO5MT2ylC4oz3hSY6KxTfpk4MscV7K-A1Ade_XP4"
            />
          </div>

          <div className="flex flex-col gap-1 pt-space-md font-body-sm text-body-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>2 logged entries today · Synchronized with Apple Health</span>
            <a className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline" href="#">
              View all 14 weekly entries &rarr;
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

function MacroStat({
  label,
  pct,
  value,
  of,
  color,
  textColor,
}: {
  label: string;
  pct: number;
  value: string;
  of: string;
  color: string;
  textColor: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50 p-3">
      <div className="flex items-center justify-between font-label-sm text-xs text-slate-500">
        <span>{label}</span>
        <span className={`font-bold ${textColor}`}>{pct}%</span>
      </div>
      <span className="font-title-md text-title-md font-bold text-slate-900">
        {value} <span className="font-body-sm text-body-sm text-slate-500">/ {of}</span>
      </span>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MealRow({
  name,
  time,
  calories,
  protein,
  carbs,
  fat,
  image,
}: {
  name: string;
  time: string;
  calories: number;
  protein: string;
  carbs: string;
  fat: string;
  image: string;
}) {
  return (
    <div className="flex flex-col justify-between gap-space-md rounded-xl border border-slate-100 bg-slate-50 p-space-md transition-all hover:bg-slate-100/60 sm:flex-row sm:items-center">
      <div className="flex items-center gap-space-md">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200/60 bg-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt={name} className="h-full w-full object-cover" src={image} />
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
      <div className="flex flex-wrap items-center gap-space-xs">
        <span className="rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 font-label-sm text-xs font-medium text-slate-700">
          <span className="font-bold text-rose-600">{protein}</span> Protein
        </span>
        <span className="rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 font-label-sm text-xs font-medium text-slate-700">
          <span className="font-bold text-emerald-600">{carbs}</span> Carbs
        </span>
        <span className="rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 font-label-sm text-xs font-medium text-slate-700">
          <span className="font-bold text-blue-600">{fat}</span> Fat
        </span>
      </div>
    </div>
  );
}
