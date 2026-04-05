import type { AccountStat } from "./types";

interface AccountStatsProps {
  stats: AccountStat[];
}

export function AccountStats({ stats }: AccountStatsProps) {
  return (
    <section className="mb-16">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">
        Account Statistics
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.id}
            className="bg-white border border-slate-200 p-5 rounded-xl flex flex-col gap-2"
          >
            <span className="text-slate-500 text-sm font-medium">
              {stat.label}
            </span>
            <div className="flex items-center gap-3">
              <div
                className={`size-8 ${stat.iconBg} rounded-full flex items-center justify-center ${stat.iconColor}`}
              >
                <span className="material-symbols-outlined">{stat.icon}</span>
              </div>
              <span className="text-xl font-bold text-slate-900">
                {stat.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
