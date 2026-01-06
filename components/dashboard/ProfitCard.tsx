import { useState } from "react";
import type React from "react";
import { ChevronDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatters";
import type { DashboardResponse } from "@/lib/types/dashboard";

interface ProfitCardProps {
  data?: DashboardResponse["metrics"]["profit"];
}

interface TooltipData {
  month: string;
  income: number;
  expenses: number;
  net: number;
  x: number;
  y: number;
}

export function ProfitCard({ data }: ProfitCardProps) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  if (!data) return null;

  const monthlyData =
    data.monthlySeries.length > 0
      ? data.monthlySeries
      : [
          { monthLabel: "JAN", income: 8500, expenses: 3200 },
          { monthLabel: "FEB", income: 9200, expenses: 3400 },
          { monthLabel: "MAR", income: 9800, expenses: 3600 },
          { monthLabel: "APR", income: 10500, expenses: 3800 },
          { monthLabel: "MAY", income: 11200, expenses: 4000 },
          { monthLabel: "JUN", income: 11800, expenses: 4200 },
          { monthLabel: "JUL", income: 12500, expenses: 4400 },
          { monthLabel: "AUG", income: 13200, expenses: 4600 },
          { monthLabel: "SEP", income: 13800, expenses: 4800 },
          { monthLabel: "OCT", income: 14500, expenses: 5000 },
          { monthLabel: "NOV", income: 15200, expenses: 5200 },
          { monthLabel: "DEC", income: 15800, expenses: 5400 },
        ];

  const maxProfit = Math.max(...monthlyData.map((m) => m.income - m.expenses));
  const chartPoints = monthlyData.map((month, i) => {
    const profit = month.income - month.expenses;
    const x = (i / (monthlyData.length - 1)) * 600;
    const y = 200 - (profit / maxProfit) * 160;
    return { x, y, ...month, net: profit };
  });

  const pathData = chartPoints
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(" ");

  const areaPathData = `${pathData} L 600 250 L 0 250 Z`;

  function handleMouseEnter(
    point: (typeof chartPoints)[0],
    event: React.MouseEvent<SVGCircleElement>
  ) {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      month: point.monthLabel,
      income: point.income,
      expenses: point.expenses,
      net: point.net,
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  }

  function handleMouseLeave() {
    setTooltip(null);
  }

  return (
    <>
      <article className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900">
              Total Profit
            </h2>
            <span className="text-sm text-slate-500">
              for Jan 1, 2025 to Dec 31, 2025 (USD)
            </span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>
          <a
            href="#"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            View Profit and Loss Report
          </a>
        </header>

        <div className="flex items-start justify-between mb-6">
          <div className="h-64 flex-1 bg-gradient-to-t from-green-100 to-transparent rounded relative">
            <svg
              className="w-full h-full"
              viewBox="0 0 600 250"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient
                  id="profitGradient"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    stopColor="rgb(134, 239, 172)"
                    stopOpacity="0.4"
                  />
                  <stop
                    offset="100%"
                    stopColor="rgb(134, 239, 172)"
                    stopOpacity="0.1"
                  />
                </linearGradient>
              </defs>
              <path d={areaPathData} fill="url(#profitGradient)" stroke="none" />
              <path
                d={pathData}
                fill="none"
                stroke="rgb(34, 197, 94)"
                strokeWidth="2"
              />
              {chartPoints.map((point, i) => (
                <circle
                  key={i}
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill="rgb(34, 197, 94)"
                  stroke="white"
                  strokeWidth="2"
                  className="cursor-pointer hover:r-6 transition-all"
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(e) => handleMouseEnter(point, e)}
                  onMouseLeave={handleMouseLeave}
                />
              ))}
            </svg>
            <div className="absolute bottom-2 left-0 right-0 flex justify-between px-4 text-xs text-slate-500">
              {monthlyData.map((month) => (
                <span key={month.monthLabel}>{month.monthLabel}</span>
              ))}
            </div>
          </div>
          <div className="text-right ml-8">
            <div className="text-3xl font-bold text-blue-600">
              {formatCurrency(data.net, data.currency)}
            </div>
            <div className="text-sm text-slate-500">total profit</div>
          </div>
        </div>
      </article>

      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y - 10}px`,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="bg-slate-900 text-white rounded-lg shadow-lg p-3 min-w-[200px]">
            <div className="text-xs font-semibold text-slate-300 mb-2">
              {tooltip.month}
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-300">Income:</span>
                <span className="font-semibold text-green-400">
                  {formatCurrency(tooltip.income, data.currency)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-300">Expenses:</span>
                <span className="font-semibold text-red-400">
                  {formatCurrency(tooltip.expenses, data.currency)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm pt-1 mt-1 border-t border-slate-700">
                <span className="text-slate-300">Net Profit:</span>
                <span className="font-bold">
                  {formatCurrency(tooltip.net, data.currency)}
                </span>
              </div>
            </div>
          </div>
          <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-slate-900 mx-auto"></div>
        </div>
      )}
    </>
  );
}
