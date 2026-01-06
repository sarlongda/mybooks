"use client";

import { useState } from "react";
import type React from "react";
import { ChevronDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatters";

interface RevenueExpensesCardProps {
  income: number;
  expenses: number;
  currency: string;
}

interface MonthlyData {
  month: string;
  amountReceived: number;
  outstandingInvoices: number;
  invoicePayments: number;
  otherIncome: number;
  amountSpent: number;
  outstandingBills: number;
}

interface TooltipData extends MonthlyData {
  x: number;
  y: number;
}

export function RevenueExpensesCard({
  income,
  expenses,
  currency,
}: RevenueExpensesCardProps) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const monthlyData: MonthlyData[] = [
    {
      month: "JUL",
      amountReceived: 38000,
      outstandingInvoices: 2000,
      invoicePayments: 38000,
      otherIncome: 0,
      amountSpent: 12000,
      outstandingBills: 0,
    },
    {
      month: "AUG",
      amountReceived: 45000,
      outstandingInvoices: 2500,
      invoicePayments: 43000,
      otherIncome: 2000,
      amountSpent: 18000,
      outstandingBills: 1000,
    },
    {
      month: "SEP",
      amountReceived: 40287,
      outstandingInvoices: 4035,
      invoicePayments: 40287,
      otherIncome: 0,
      amountSpent: 13000,
      outstandingBills: 0,
    },
    {
      month: "OCT",
      amountReceived: 32000,
      outstandingInvoices: 11000,
      invoicePayments: 30000,
      otherIncome: 2000,
      amountSpent: 8000,
      outstandingBills: 0,
    },
    {
      month: "NOV",
      amountReceived: 14000,
      outstandingInvoices: 23000,
      invoicePayments: 14000,
      otherIncome: 0,
      amountSpent: 5000,
      outstandingBills: 0,
    },
    {
      month: "DEC",
      amountReceived: 4275,
      outstandingInvoices: 0,
      invoicePayments: 4275,
      otherIncome: 0,
      amountSpent: 0,
      outstandingBills: 0,
    },
  ];

  const totalAmountReceived = monthlyData.reduce(
    (sum, m) => sum + m.amountReceived,
    0
  );
  const totalOutstandingInvoices = monthlyData.reduce(
    (sum, m) => sum + m.outstandingInvoices,
    0
  );
  const totalAmountSpent = monthlyData.reduce(
    (sum, m) => sum + m.amountSpent,
    0
  );
  const totalOutstandingBills = monthlyData.reduce(
    (sum, m) => sum + m.outstandingBills,
    0
  );

  const maxValue = Math.max(
    ...monthlyData.map((m) => m.amountReceived + m.outstandingInvoices),
    ...monthlyData.map((m) => m.amountSpent + m.outstandingBills)
  );

  const gridLines = [0, 15000, 30000, 45000, 60000];

  function handleMouseEnter(
    data: MonthlyData,
    event: React.MouseEvent<HTMLDivElement>
  ) {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      ...data,
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
              Revenue and Expenses
            </h2>
            <button className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
              USD <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="flex gap-8">
          <div className="flex-1">
            <div className="relative h-64">
              {gridLines.map((value) => (
                <div
                  key={value}
                  className="absolute w-full border-t border-slate-200"
                  style={{
                    bottom: `${(value / maxValue) * 100}%`,
                  }}
                >
                  <span className="absolute -left-12 -top-2 text-xs text-slate-500">
                    {value >= 1000 ? `${value / 1000}k` : value}
                  </span>
                </div>
              ))}

              <div className="h-full flex items-end justify-around gap-4 pt-4">
                {monthlyData.map((data) => {
                  const revenueTotal =
                    data.amountReceived + data.outstandingInvoices;
                  const expenseTotal =
                    data.amountSpent + data.outstandingBills;

                  const revenueTotalHeight = (revenueTotal / maxValue) * 100;
                  const revenueReceivedHeight =
                    (data.amountReceived / maxValue) * 100;

                  const expenseTotalHeight = (expenseTotal / maxValue) * 100;
                  const expenseSpentHeight =
                    (data.amountSpent / maxValue) * 100;

                  return (
                    <div
                      key={data.month}
                      className="flex-1 flex flex-col items-center gap-2"
                    >
                      <div
                        className="w-full flex gap-2 items-end relative"
                        style={{ height: "220px" }}
                      >
                        <div
                          className="flex-1 relative cursor-pointer"
                          onMouseEnter={(e) => handleMouseEnter(data, e)}
                          onMouseLeave={handleMouseLeave}
                        >
                          <div
                            className="w-full bg-green-500 rounded-t"
                            style={{ height: `${revenueReceivedHeight}%` }}
                          />
                          {data.outstandingInvoices > 0 && (
                            <div
                              className="w-full border-2 border-green-500 rounded-t absolute bottom-0 left-0"
                              style={{
                                height: `${revenueTotalHeight}%`,
                                backgroundColor: "transparent",
                              }}
                            />
                          )}
                        </div>

                        <div
                          className="flex-1 relative cursor-pointer"
                          onMouseEnter={(e) => handleMouseEnter(data, e)}
                          onMouseLeave={handleMouseLeave}
                        >
                          <div
                            className="w-full bg-pink-400 rounded-t"
                            style={{ height: `${expenseSpentHeight}%` }}
                          />
                          {data.outstandingBills > 0 && (
                            <div
                              className="w-full border-2 border-pink-400 rounded-t absolute bottom-0 left-0"
                              style={{
                                height: `${expenseTotalHeight}%`,
                                backgroundColor: "transparent",
                              }}
                            />
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">
                        {data.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-center gap-6 mt-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-green-500 rounded-sm" />
                <span className="text-slate-600">Outstanding Invoices</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-pink-400 rounded-sm" />
                <span className="text-slate-600">Outstanding Bills</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-sm" />
                <span className="text-slate-600">Amount Received</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-pink-400 rounded-sm" />
                <span className="text-slate-600">Amount Spent</span>
              </div>
            </div>
          </div>

          <div className="w-72 bg-slate-50 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">
              Summary of the past 6 months
            </h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-semibold text-slate-900 mb-2">
                  Revenue
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-slate-600">
                    Amount Received
                  </span>
                  <span className="text-lg font-semibold text-slate-900">
                    {formatCurrency(totalAmountReceived, currency)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">
                    Outstanding Invoices
                  </span>
                  <span className="text-lg font-semibold text-blue-600">
                    {formatCurrency(totalOutstandingInvoices, currency)}
                  </span>
                </div>
              </div>
              <div className="border-t border-slate-200 pt-4">
                <div className="text-sm font-semibold text-slate-900 mb-2">
                  Expenses
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-slate-600">Amount Spent</span>
                  <span className="text-lg font-semibold text-slate-900">
                    {formatCurrency(totalAmountSpent, currency)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">
                    Outstanding Bills
                  </span>
                  <span className="text-lg font-semibold text-blue-600">
                    {formatCurrency(totalOutstandingBills, currency)}
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
              {tooltip.month} Revenue
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-300">Amount Received</span>
                <span className="text-sm font-semibold">
                  {formatCurrency(tooltip.amountReceived, currency)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-300">Invoice Payments</span>
                <span className="text-sm font-semibold">
                  {formatCurrency(tooltip.invoicePayments, currency)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-300">Other Income</span>
                <span className="text-sm font-semibold">
                  {formatCurrency(tooltip.otherIncome, currency)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                <span className="text-sm text-slate-300">
                  Outstanding Invoices
                </span>
                <span className="text-sm font-semibold">
                  {formatCurrency(tooltip.outstandingInvoices, currency)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                <span className="text-sm text-slate-300">Amount Spent</span>
                <span className="text-sm font-semibold text-pink-400">
                  {formatCurrency(tooltip.amountSpent, currency)}
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
