export interface WrappedUser {
  email: string;
  displayName: string;
  accountId: string;
  avatarUrl: string | null;
}

export interface RequestTypeCount {
  type: string;
  count: number;
}

export interface ProjectCount {
  project: string;
  count: number;
}

export interface MonthlyData {
  month: string;
  count: number;
}

export interface WrappedSummary {
  user: WrappedUser;
  year: number;
  total_issues: number;
  resolved_issues: number;
  top_request_types: RequestTypeCount[];
  top_projects: ProjectCount[];
  avg_resolution_hours: number;
  peak_month: string;
  peak_weekday: string;
  first_contact_rate: number;
  monthly_breakdown: MonthlyData[];
  avg_per_month: number;
}
