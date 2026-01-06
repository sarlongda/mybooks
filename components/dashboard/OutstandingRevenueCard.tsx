import { ChevronDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatters";
import type { DashboardResponse } from "@/lib/types/dashboard";

interface OutstandingRevenueCardProps {
  data?: DashboardResponse["metrics"]["outstandingRevenue"];
}

export function OutstandingRevenueCard({ data }: OutstandingRevenueCardProps) {
  if (!data) return null;

  return (
    <article className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-slate-900">
            Outstanding Invoices
          </h2>
        </div>
        <button className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
          USD <ChevronDown className="w-4 h-4" />
        </button>
      </header>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-pink-400 rounded-sm" />
            <span className="text-slate-600">Overdue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-300 rounded-sm" />
            <span className="text-slate-600">Outstanding</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-slate-900">
            {formatCurrency(data.total, data.currency)}
          </div>
          <div className="text-xs text-slate-500">total outstanding</div>
        </div>
      </div>

      <div className="relative h-8 bg-slate-100 rounded overflow-hidden flex">
        <div
          className="bg-yellow-300 h-full transition-all"
          style={{
            width: `${((data.total - data.overdue) / data.total) * 100}%`,
          }}
        />
        <div
          className="bg-pink-400 h-full transition-all"
          style={{ width: `${(data.overdue / data.total) * 100}%` }}
        />
      </div>

      <div className="mt-6 grid grid-cols-4 gap-4 text-sm">
        <div className="text-right">
          <div className="text-slate-600">0-30 Days</div>
          <div className="font-semibold text-slate-900">
            {formatCurrency(data.agingBuckets[1].amount, data.currency)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-slate-600">31-60 Days</div>
          <div className="font-semibold text-slate-900">
            {formatCurrency(data.agingBuckets[2].amount, data.currency)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-slate-600">61-90 Days</div>
          <div className="font-semibold text-slate-900">
            {formatCurrency(data.agingBuckets[3].amount, data.currency)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-slate-600">90+ Days</div>
          <div className="font-semibold text-slate-900">
            {formatCurrency(data.agingBuckets[4].amount, data.currency)}
          </div>
        </div>
      </div>

      <div className="mt-4 text-right">
        <a
          href="#"
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          View Accounts Aging Report
        </a>
      </div>
    </article>
  );
}
