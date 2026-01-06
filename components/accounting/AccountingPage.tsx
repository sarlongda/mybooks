'use client';

import {
  TrendingUp,
  BookOpen,
  Calendar,
  Users,
  Building,
  Scale,
  Landmark,
  DollarSign,
  FileText,
  ChevronDown,
  List
} from 'lucide-react';

interface ReportCard {
  id: string;
  title: string;
  description: string;
  icon: any;
  badge?: string;
}

const accountingReports: ReportCard[] = [
  {
    id: 'profit-loss',
    title: 'Profit and Loss',
    description:
      'A summary of your total income, expenses, and net profit. Updated with new style and functionality.',
    icon: TrendingUp,
    badge: 'UPDATED'
  },
  {
    id: 'general-ledger',
    title: 'General Ledger',
    description:
      'A complete record of transactions and balances for all your accounts. Updated with new style and functionality.',
    icon: BookOpen,
    badge: 'UPDATED'
  },
  {
    id: 'balance-sheet',
    title: 'Balance Sheet',
    description:
      'A complete record of transactions and balances for all your accounts. Updated with new style and functionality.',
    icon: Calendar,
    badge: 'UPDATED'
  },
  {
    id: 'revenue-by-client',
    title: 'Revenue by Client',
    description:
      'A breakdown of your revenue by client to help you understand your business better. Updated with new style and functionality.',
    icon: Users,
    badge: 'UPDATED'
  },
  {
    id: 'trial-balance',
    title: 'Trial Balance',
    description: 'A quick gut check to make sure your books are balanced',
    icon: Scale
  },
  {
    id: 'bank-reconciliation',
    title: 'Bank Reconciliation Summary',
    description: 'Shows unreconciled bank transactions and FreshBooks entries',
    icon: Building
  },
  {
    id: 'sales-tax',
    title: 'Sales Tax Summary',
    description: 'Helps determine how much you owe the government in Sales Taxes',
    icon: Landmark
  },
  {
    id: 'cash-flow',
    title: 'Cash Flow',
    description: 'Overview of Cash coming in and going out of your business',
    icon: DollarSign
  },
  {
    id: 'journal-entry',
    title: 'Journal Entry',
    description:
      'Helps you see all the Manual Journal Entries and Adjustments made to your books',
    icon: FileText
  }
];

export function AccountingPage() {
  function handleReportClick(reportId: string) {
    // later: router.push(`/accounting/reports/${reportId}`)
    alert(`Opening ${reportId} report...`);
  }

  return (
    <section className="min-h-screen bg-white">
      <div className="space-y-8 p-8 max-w-[1400px] mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold text-slate-900">Accounting</h1>
          <button className="px-4 py-2 text-sm text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50 flex items-center gap-2">
            Invite
            <ChevronDown className="w-4 h-4" />
          </button>
        </header>

        {/* Accounting reports grid */}
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">
            Accounting Reports
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accountingReports.map((report) => {
              const Icon = report.icon;
              return (
                <button
                  key={report.id}
                  onClick={() => handleReportClick(report.id)}
                  className="p-6 bg-white border border-slate-200 rounded-lg hover:shadow-md transition-all text-left group"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {report.title}
                        </h3>
                        {report.badge && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded">
                            {report.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600">{report.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Update your books section */}
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">
            Update Your Books
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Journal Entries */}
            <div className="p-6 bg-white border border-slate-200 rounded-lg">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Journal Entries
                  </h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Journal Entries allow you to create transactions and assign
                    them to specific accounts. Use these and work with your
                    accountant to keep your books balanced.{` `}
                    <a href="#" className="text-blue-600 hover:underline">
                      Learn More
                    </a>
                  </p>
                  <button className="w-full px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors">
                    View Your Journal Entries
                  </button>
                </div>
              </div>
            </div>

            {/* Chart of Accounts */}
            <div className="p-6 bg-white border border-slate-200 rounded-lg">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <List className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Chart of Accounts
                  </h3>
                  <p className="text-sm text-slate-600 mb-4">
                    See a list of accounts your business has across Assets,
                    Liabilities, Equity, Revenue and Expenses. Collaborate with
                    your accountant to customize the accounts for your
                    business.{` `}
                    <a href="#" className="text-blue-600 hover:underline">
                      Learn More
                    </a>
                  </p>
                  <button className="w-full px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors">
                    View Your Accounts
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
