"use client";

import { useState, useEffect } from "react";
import type { Period, DashboardResponse } from "@/lib/types/dashboard";
import { OutstandingRevenueCard } from "@/components/dashboard/OutstandingRevenueCard";
import { ProfitCard } from "@/components/dashboard/ProfitCard";
import { UnbilledCard } from "@/components/dashboard/UnbilledCard";
import { RevenueExpensesCard } from "@/components/dashboard/RevenueExpensesCard";
import { ProjectTypesChart } from "@/components/dashboard/ProjectTypesChart";

// Tell TS: in THIS page, we always have all these metrics:
type FullDashboardResponse = DashboardResponse & {
  metrics: {
    outstandingRevenue: NonNullable<DashboardResponse["metrics"]["outstandingRevenue"]>;
    profit: NonNullable<DashboardResponse["metrics"]["profit"]>;
    unbilled: NonNullable<DashboardResponse["metrics"]["unbilled"]>;
  };
  summaryCounts: NonNullable<DashboardResponse["summaryCounts"]>;
};

const MOCK_DATA: FullDashboardResponse = {
  period: "last-30",
  metrics: {
    outstandingRevenue: {
      total: 47500,
      overdue: 12000,
      currency: "USD",
      agingBuckets: [
        { bucket: "current", amount: 25500 },
        { bucket: "1-30", amount: 10000 },
        { bucket: "31-60", amount: 7500 },
        { bucket: "61-90", amount: 3000 },
        { bucket: "90+", amount: 1500 },
      ],
    },
    profit: {
      income: 125000,
      expenses: 45000,
      net: 80000,
      currency: "USD",
      monthlySeries: [],
    },
    unbilled: {
      timeValue: 18750,
      expenseValue: 3200,
      currency: "USD",
    },
    bankConnections: {
      connectedCount: 2,
      connections: [
        { id: "1", name: "Chase Business (x1234)", status: "CONNECTED" },
        {
          id: "2",
          name: "Bank of America (x5678)",
          status: "ATTENTION",
          statusMessage: "Reauthenticate",
        },
      ],
    },
    myTimeSummary: {
      periodHours: 0,
      periodBillableHours: 0,
      periodBillableValue: 0,
    },
  },
  recentActivity: [
    // your sample items...
  ],
  summaryCounts: {
    draftInvoices: 3,
    overdueInvoices: 5,
    openEstimates: 2,
    activeProjects: 8,
  },
};

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>("last-30");
  const [data, setData] = useState<FullDashboardResponse>(MOCK_DATA);

  useEffect(() => {
    setData((prev) => ({ ...prev, period }));
  }, [period]);

  return (
    <section className="min-h-screen bg-slate-50">
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <div className="flex gap-3">
            <button className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors">
              Add Team Member
            </button>
            <button className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors flex items-center gap-1">
              Create New...
            </button>
          </div>
        </header>

        <OutstandingRevenueCard data={data.metrics.outstandingRevenue} />

        <RevenueExpensesCard
          income={data.metrics.profit.income}
          expenses={data.metrics.profit.expenses}
          currency={data.metrics.profit.currency}
        />

        <ProjectTypesChart />

        <UnbilledCard data={data.metrics.unbilled} />

        <ProfitCard data={data.metrics.profit} />
      </div>
    </section>
  );
}
