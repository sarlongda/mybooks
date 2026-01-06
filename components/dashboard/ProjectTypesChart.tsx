"use client";

import { useState } from "react";
import type React from "react";
import { formatCurrency } from "@/lib/utils/formatters";

interface ProjectTypeData {
  id: string;
  name: string;
  revenue: number;
  expenses: number;
  netIncome: number;
  color: string;
}

interface TooltipData extends ProjectTypeData {
  x: number;
  y: number;
}

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

// Temporary mock data (replace later with real API data)
const MOCK_PROJECT_TYPES: ProjectTypeData[] = [
  { id: "1", name: "Web Design", revenue: 32000, expenses: 12000, netIncome: 20000, color: COLORS[0] },
  { id: "2", name: "Consulting", revenue: 18000, expenses: 5000, netIncome: 13000, color: COLORS[1] },
  { id: "3", name: "Maintenance", revenue: 9000, expenses: 3000, netIncome: 6000, color: COLORS[2] },
];

export function ProjectTypesChart() {
  const [data] = useState<ProjectTypeData[]>(MOCK_PROJECT_TYPES);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);

  function calculatePieSlices() {
    if (totalRevenue === 0) return [];

    let currentAngle = -90;
    return data.map((item) => {
      const percentage = (item.revenue / totalRevenue) * 100;
      const angle = (percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      return {
        ...item,
        percentage,
        startAngle,
        endAngle,
      };
    });
  }

  function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
    const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  }

  function describeSvgArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return [
      "M",
      x,
      y,
      "L",
      start.x,
      start.y,
      "A",
      radius,
      radius,
      0,
      largeArcFlag,
      0,
      end.x,
      end.y,
      "Z",
    ].join(" ");
  }

  function handleMouseEnter(item: ProjectTypeData, event: React.MouseEvent<SVGPathElement>) {
    const rect = (event.target as SVGElement).getBoundingClientRect();
    setTooltip({
      ...item,
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  }

  function handleMouseLeave() {
    setTooltip(null);
  }

  const slices = calculatePieSlices();
  const centerX = 150;
  const centerY = 150;
  const radius = 120;

  if (data.length === 0) {
    return (
      <article className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">
          Revenue by Project Type
        </h2>
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">No project type data available</p>
        </div>
      </article>
    );
  }

  return (
    <>
      <article className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">
          Revenue by Project Type
        </h2>

        <div className="flex gap-8">
          <div className="flex-1 flex items-center justify-center">
            <svg width="300" height="300" viewBox="0 0 300 300">
              {slices.map((slice) => (
                <path
                  key={slice.id}
                  d={describeSvgArc(centerX, centerY, radius, slice.startAngle, slice.endAngle)}
                  fill={slice.color}
                  stroke="white"
                  strokeWidth="2"
                  className="cursor-pointer transition-opacity hover:opacity-80"
                  onMouseEnter={(e) => handleMouseEnter(slice, e)}
                  onMouseLeave={handleMouseLeave}
                />
              ))}
            </svg>
          </div>

          <div className="flex-1">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">
              Project Types
            </h3>
            <div className="space-y-3">
              {data.map((item) => (
                <div key={item.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium text-slate-900">
                      {item.name}
                    </span>
                  </div>
                  <div className="ml-5 space-y-0.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Revenue:</span>
                      <span className="font-medium text-slate-900">
                        {formatCurrency(item.revenue, "USD")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Expenses:</span>
                      <span className="font-medium text-slate-900">
                        {formatCurrency(item.expenses, "USD")}
                      </span>
                    </div>
                    <div className="flex justify-between pt-0.5 border-t border-slate-200">
                      <span className="text-slate-600">Net Income:</span>
                      <span
                        className={`font-semibold ${
                          item.netIncome >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {formatCurrency(item.netIncome, "USD")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-700">
                    Total Revenue:
                  </span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(totalRevenue, "USD")}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-700">
                    Total Expenses:
                  </span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(
                      data.reduce((sum, item) => sum + item.expenses, 0),
                      "USD"
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-base pt-2 border-t border-slate-200">
                  <span className="font-semibold text-slate-900">
                    Total Net Income:
                  </span>
                  <span
                    className={`font-bold ${
                      data.reduce((sum, item) => sum + item.netIncome, 0) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(
                      data.reduce((sum, item) => sum + item.netIncome, 0),
                      "USD"
                    )}
                  </span>
                </div>
              </div>
            </div>
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
          <div className="bg-slate-900 text-white rounded-lg shadow-xl p-4 min-w-[240px]">
            <div className="text-sm font-bold text-white mb-3">
              {tooltip.name}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-300">Revenue</span>
                <span className="text-sm font-semibold text-green-400">
                  {formatCurrency(tooltip.revenue, "USD")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-300">Expenses</span>
                <span className="text-sm font-semibold text-red-400">
                  {formatCurrency(tooltip.expenses, "USD")}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                <span className="text-sm text-slate-300">Net Income</span>
                <span
                  className={`text-sm font-bold ${
                    tooltip.netIncome >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {formatCurrency(tooltip.netIncome, "USD")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-300">Profit Margin</span>
                <span className="text-sm font-semibold">
                  {tooltip.revenue > 0
                    ? ((tooltip.netIncome / tooltip.revenue) * 100).toFixed(1)
                    : "0"}
                  %
                </span>
              </div>
            </div>
          </div>
          <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-t-slate-900 mx-auto" />
        </div>
      )}
    </>
  );
}
