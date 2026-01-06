export type Period = 'last-30' | 'this-month' | 'last-6-months' | 'this-year';

export interface DashboardResponse {
  period: Period;
  metrics: {
    outstandingRevenue?: {
      total: number;
      overdue: number;
      currency: string;
      agingBuckets: Array<{
        bucket: string;
        amount: number;
      }>;
    };
    profit?: {
      income: number;
      expenses: number;
      net: number;
      currency: string;
      monthlySeries: Array<{
        monthLabel: string;
        income: number;
        expenses: number;
      }>;
    };
    unbilled?: {
      timeValue: number;
      expenseValue: number;
      currency: string;
    };
    bankConnections?: {
      connectedCount: number;
      connections: Array<{
        id: string;
        name: string;
        status: 'CONNECTED' | 'ATTENTION' | 'ERROR';
        statusMessage?: string;
      }>;
    };
    myTimeSummary?: {
      periodHours: number;
      periodBillableHours: number;
      periodBillableValue?: number;
    };
  };
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
  }>;
  summaryCounts?: {
    draftInvoices: number;
    overdueInvoices: number;
    openEstimates: number;
    activeProjects: number;
  };
}
