const STAT_ICONS: { iconBg: string; iconColor: string; icon: string }[] = [
  { icon: "military_tech", iconBg: "bg-red-100", iconColor: "text-red-500" },
  { icon: "award_star", iconBg: "bg-blue-100", iconColor: "text-blue-500" },
  { icon: "palette", iconBg: "bg-purple-100", iconColor: "text-purple-500" },
  { icon: "trending_up", iconBg: "bg-green-100", iconColor: "text-green-500" },
  { icon: "attach_money", iconBg: "bg-yellow-100", iconColor: "text-yellow-600" },
];

interface SpecEntry {
  key: string;
  value: string;
}

interface AccountStatsProps {
  specs: SpecEntry[];
}

export function AccountStats({ specs }: AccountStatsProps) {
  const displaySpecs = specs.slice(0, 5);

  if (displaySpecs.length === 0) return null;

  return (
    <section className="mb-16">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Account Statistics</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {displaySpecs.map((spec, index) => {
          const style = STAT_ICONS[index % STAT_ICONS.length];
          return (
            <div
              key={spec.key}
              className="bg-white border border-slate-200 p-5 rounded-xl flex flex-col gap-2"
            >
              <span className="text-slate-500 text-sm font-medium">{spec.key}</span>
              <div className="flex items-center gap-3">
                <div
                  className={`size-8 ${style.iconBg} rounded-full flex items-center justify-center ${style.iconColor}`}
                >
                  <span className="material-symbols-outlined">{style.icon}</span>
                </div>
                <span className="text-xl font-bold text-slate-900">{spec.value}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
