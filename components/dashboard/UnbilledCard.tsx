import type { DashboardResponse } from "@/lib/types/dashboard";

interface UnbilledCardProps {
  data?: DashboardResponse["metrics"]["unbilled"];
}

export function UnbilledCard({ data }: UnbilledCardProps) {
  if (!data) return null;

  return (
    <article className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <header className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Monthly Recurring Revenue
        </h2>
      </header>

      <div className="flex items-center justify-center h-64 bg-gradient-to-b from-blue-50 to-transparent rounded relative">
        <svg
          className="w-full h-full"
          viewBox="0 0 600 200"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient
              id="recurringGradient"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop
                offset="0%"
                stopColor="rgb(191, 219, 254)"
                stopOpacity="0.5"
              />
              <stop
                offset="100%"
                stopColor="rgb(191, 219, 254)"
                stopOpacity="0.1"
              />
            </linearGradient>
          </defs>
          <path
            d="M 0 150 Q 150 120, 300 100 T 600 60 L 600 200 L 0 200 Z"
            fill="url(#recurringGradient)"
            stroke="none"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-blue-600 font-medium">
            keep track of your recurring revenue
          </p>
        </div>
      </div>
    </article>
  );
}
