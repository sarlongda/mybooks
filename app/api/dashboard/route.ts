// app/api/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function getOrgId() {
  return process.env.DEFAULT_ORG_ID || "demo-org";
}

function getDateRange(period: string) {
  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case "last-30":
      startDate.setDate(endDate.getDate() - 30);
      break;
    case "this-month":
      startDate.setDate(1);
      break;
    case "last-6-months":
      startDate.setMonth(endDate.getMonth() - 6);
      break;
    case "this-year":
      startDate.setMonth(0);
      startDate.setDate(1);
      break;
    default:
      startDate.setDate(endDate.getDate() - 30);
  }

  return { startDate, endDate };
}

function calculateAgingBuckets(invoices: any[]) {
  const today = new Date();
  const buckets: Record<string, number> = {
    current: 0,
    "1-30": 0,
    "31-60": 0,
    "61-90": 0,
    "90+": 0,
  };

  for (const inv of invoices) {
    if (inv.status === "PAID" || inv.status === "VOID") continue;
    if (!inv.dueDate) continue;

    const daysOverdue = Math.floor(
      (today.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const total = Number(inv.total);

    if (daysOverdue <= 0) buckets.current += total;
    else if (daysOverdue <= 30) buckets["1-30"] += total;
    else if (daysOverdue <= 60) buckets["31-60"] += total;
    else if (daysOverdue <= 90) buckets["61-90"] += total;
    else buckets["90+"] += total;
  }

  return Object.entries(buckets).map(([bucket, amount]) => ({ bucket, amount }));
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "last-30";
    const { startDate, endDate } = getDateRange(period);
    const organizationId = getOrgId();
    const baseCurrency = "USD"; // later: read from Organization

    const [openInvoices, paidInvoices, periodExpenses] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          organizationId,
          status: { in: ["SENT", "OVERDUE"] },
        },
      }),
      prisma.invoice.findMany({
        where: {
          organizationId,
          status: "PAID",
          paidAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      prisma.expense.findMany({
        where: {
          organizationId,
          expenseDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
    ]);

    // Outstanding revenue
    const outstandingTotal = openInvoices.reduce(
      (sum, inv) => sum + Number(inv.total),
      0
    );
    const overdueTotal = openInvoices
      .filter((inv) => inv.dueDate && inv.dueDate < new Date())
      .reduce((sum, inv) => sum + Number(inv.total), 0);

    const outstandingRevenue = {
      total: outstandingTotal,
      overdue: overdueTotal,
      currency: baseCurrency,
      agingBuckets: calculateAgingBuckets(openInvoices),
    };

    // Profit (very simple v1)
    const income = paidInvoices.reduce(
      (sum, inv) => sum + Number(inv.total),
      0
    );
    const expenses = periodExpenses.reduce(
      (sum, exp) => sum + Number(exp.amount),
      0
    );

    const profit = {
      income,
      expenses,
      net: income - expenses,
      currency: baseCurrency,
      monthlySeries: [], // can fill later
    };

    // Summary counts (basic)
    const [draftInvoices, overdueInvoices] = await Promise.all([
      prisma.invoice.count({
        where: { organizationId, status: "DRAFT" },
      }),
      prisma.invoice.count({
        where: { organizationId, status: "OVERDUE" },
      }),
    ]);

    const summaryCounts = {
      draftInvoices,
      overdueInvoices,
      openEstimates: 0,
    };

    // For now, no activity log wired
    const recentActivity: Array<{
      id: string;
      type: string;
      message: string;
      timestamp: string;
    }> = [];

    return NextResponse.json({
      period,
      metrics: {
        outstandingRevenue,
        profit,
        // unbilled, bankConnections, myTimeSummary can be added later
      },
      summaryCounts,
      recentActivity,
    });
  } catch (error) {
    console.error("[GET /api/dashboard] error", error);
    return NextResponse.json(
      { error: "Failed to load dashboard" },
      { status: 500 }
    );
  }
}
