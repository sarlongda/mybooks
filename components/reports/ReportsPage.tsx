'use client';

import {
  DollarSign,
  FileText,
  Clock,
  Users,
  TrendingUp,
  Package,
  RefreshCw,
  Hourglass,
  CreditCard,
  PieChart,
  Wallet,
  BookOpen,
  Receipt,
  UserCheck,
  Star
} from 'lucide-react';

interface ReportCard {
  id: string;
  title: string;
  description: string;
  icon: any;
  badge?: string;
  isFavorite?: boolean;
}

const invoiceAndExpenseReports: ReportCard[] = [
  {
    id: 'invoice-details',
    title: 'Invoice Details',
    description:
      "A detailed summary of all invoices you've sent over a period of time",
    icon: FileText
  },
  {
    id: 'expense-report',
    title: 'Expense Report',
    description:
      "See how much money you're spending, and where you're spending it",
    icon: Wallet
  },
  {
    id: 'item-sales',
    title: 'Item Sales',
    description: 'See how much money you\'re making from each item you sell',
    icon: Package
  },
  {
    id: 'revenue-by-client',
    title: 'Revenue by Client',
    description:
      'A breakdown of how much revenue each of your clients is bringing in. Updated with new style and functionality.',
    icon: Users,
    badge: 'UPDATED'
  },
  {
    id: 'recurring-revenue-annual',
    title: 'Recurring Revenue Annual',
    description: 'An annual summary of your recurring revenue',
    icon: RefreshCw
  },
  {
    id: 'recurring-revenue-details',
    title: 'Recurring Revenue Details',
    description: 'A detailed breakdown of your projected recurring revenue',
    icon: RefreshCw
  }
];

const paymentReports: ReportCard[] = [
  {
    id: 'accounts-aging',
    title: 'Accounts Aging',
    description:
      "Shows which clients owe you money and how long they've owed it",
    icon: Hourglass
  },
  {
    id: 'payments-collected',
    title: 'Payments Collected',
    description: 'Overview of payments collected from your clients',
    icon: CreditCard
  }
];

const timeTrackingReports: ReportCard[] = [
  {
    id: 'time-entry-details',
    title: 'Time Entry Details',
    description:
      'A detailed work summary of how much time you and / or your team tracked over a period of time',
    icon: Clock
  },
  {
    id: 'retainer-summary',
    title: 'Retainer Summary',
    description: 'A detailed work summary for your retainer clients',
    icon: UserCheck
  },
  {
    id: 'profitability-summary',
    title: 'Profitability Summary',
    description:
      "View a summary of a client's profitability across all their projects",
    icon: PieChart
  },
  {
    id: 'profitability-details',
    title: 'Profitability Details',
    description:
      'Get a detailed breakdown of project profitability by service and expense categories',
    icon: TrendingUp
  },
  {
    id: 'team-utilization',
    title: 'Team Utilization',
    description:
      'Overview of billable hours from team members against their expected capacity',
    icon: Users
  }
];

const otherReports: ReportCard[] = [
  {
    id: 'cash-flow',
    title: 'Cash Flow',
    description:
      'Overview of Cash coming in and going out of your business',
    icon: DollarSign
  },
  {
    id: 'journal-entry',
    title: 'Journal Entry',
    description:
      'Helps you see all the Manual Journal Entries and Adjustments made to your books',
    icon: BookOpen
  }
];

const logsReports: ReportCard[] = [
  {
    id: 'audit-log',
    title: 'Audit Log',
    description: 'View changes made to your books',
    icon: FileText
  }
];

const payrollReports: ReportCard[] = [
  {
    id: 'payroll-journal',
    title: 'Payroll Journal',
    description:
      'Helps you get detailed payroll information for each pay period and employee',
    icon: Receipt,
    badge: 'PREMIUM'
  },
  {
    id: 'contractor-payment',
    title: 'Contractor Payment',
    description:
      'Helps you get detailed payroll information for each contractor',
    icon: Receipt,
    badge: 'PREMIUM'
  }
];

export function ReportsPage() {
  function handleReportClick(reportId: string) {
    // later: router.push(`/reports/${reportId}`)
    alert(`Opening ${reportId} report...`);
  }

  function toggleFavorite(reportId: string) {
    // later: persist favorites in DB / local storage
    alert(`Toggling favorite for ${reportId}`);
  }

  const renderReportCard = (report: ReportCard) => {
    const Icon = report.icon;
    return (
      <div
        key={report.id}
        className="p-6 bg-white border border-slate-200 rounded-lg hover:shadow-md transition-all group relative"
      >
        <button
          onClick={() => toggleFavorite(report.id)}
          className="absolute top-4 right-4 text-slate-300 hover:text-yellow-500 transition-colors"
          title="Add to favorites"
        >
          <Star className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleReportClick(report.id)}
          className="w-full text-left"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
              <Icon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1 pr-8">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-base font-semibold text-slate-900">
                  {report.title}
                </h3>
                {report.badge && (
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded ${
                      report.badge === 'PREMIUM'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {report.badge}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600">{report.description}</p>
            </div>
          </div>
        </button>
      </div>
    );
  };

  return (
    <section className="min-h-screen bg-white">
      <div className="space-y-8 p-8 max-w-[1400px] mx-auto">
        {/* Header */}
        <header>
          <h1 className="text-3xl font-semibold text-slate-900">Reports</h1>
        </header>

        {/* Favorites skeleton */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900">
              Favorite Reports
            </h2>
            <span className="text-sm text-blue-600">
              Star your favorite reports →
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center min-h-[180px]"
              >
                <div className="w-16 h-16 rounded-full bg-slate-200 mb-4" />
                <div className="w-full h-2 bg-slate-200 rounded mb-2" />
                <div className="w-3/4 h-2 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-slate-500 italic">
            Easy access to your favorite reports
          </p>
        </div>

        {/* Invoice & Expense */}
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Invoice and Expense Reports
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {invoiceAndExpenseReports.map(renderReportCard)}
          </div>
        </div>

        {/* Payments */}
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Payments Reports
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paymentReports.map(renderReportCard)}
          </div>
        </div>

        {/* Time & Project */}
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Time Tracking and Project Reports
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {timeTrackingReports.map(renderReportCard)}
          </div>
        </div>

        {/* Logs & Payroll */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Logs</h2>
            <div className="space-y-4">
              {logsReports.map(renderReportCard)}
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Payroll
            </h2>
            <div className="space-y-4">
              {payrollReports.map(renderReportCard)}
            </div>
          </div>
        </div>

        {/* Other */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {otherReports.map(renderReportCard)}
        </div>
      </div>
    </section>
  );
}
