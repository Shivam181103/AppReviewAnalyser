export type PlanType = "free" | "starter" | "pro" | "agency";
export type Platform = "ios" | "android";
export type SentimentLabel = "positive" | "neutral" | "negative";
export type InsightType = "complaints" | "praise" | "summary" | "trends";
export type AlertType =
  | "rating_drop"
  | "keyword_spike"
  | "review_spike"
  | "sentiment_change";
export type ReportType = "weekly" | "monthly" | "custom";
export type Severity = "low" | "medium" | "high";

export interface User {
  id: string;
  clerk_id: string;
  email: string;

  name?: string;
  avatar_url?: string;
  plan: PlanType;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  trial_ends_at?: string;
  subscription_status: string;
  created_at: string;
  updated_at: string;
}

export interface App {
  id: string;
  user_id: string;
  platform: Platform;
  app_id: string;
  country: string;
  name: string;
  developer?: string;
  icon_url?: string;
  category?: string;
  current_rating?: number;
  rating_count?: number;
  current_version?: string;
  description?: string;
  app_url: string;
  is_competitor: boolean;
  parent_app_id?: string;
  last_fetched_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  app_id: string;
  platform: Platform;
  review_id?: string;
  title?: string;
  content: string;
  rating: number;
  author_name?: string;
  author_url?: string;
  app_version?: string;
  date: string;
  helpful_count: number;
  sentiment_label?: SentimentLabel;
  sentiment_score?: number;
  sentiment_magnitude?: number;
  ai_analyzed: boolean;
  ai_themes?: string[];
  created_at: string;
}

export interface Insight {
  id: string;
  app_id: string;
  insight_type: InsightType;
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
  period_start?: string;
  period_end?: string;
  created_at: string;
}

export interface Alert {
  id: string;
  user_id: string;
  app_id?: string;
  alert_type: AlertType;
  condition: Record<string, unknown>;
  is_active: boolean;
  notify_email: boolean;
  notify_in_app: boolean;
  created_at: string;
  updated_at: string;
}

export interface AlertNotification {
  id: string;
  alert_id: string;
  app_id: string;
  message: string;
  severity: Severity;
  read: boolean;
  created_at: string;
}

export interface Report {
  id: string;
  user_id: string;
  app_id?: string;
  report_type: ReportType;
  title: string;
  period_start: string;
  period_end: string;
  data: Record<string, unknown>;
  pdf_url?: string;
  share_token?: string;
  is_public: boolean;
  created_at: string;
}

export interface AnalyticsSnapshot {
  id: string;
  app_id: string;
  date: string;
  average_rating?: number;
  total_reviews?: number;
  new_reviews_count?: number;
  sentiment_positive?: number;
  sentiment_neutral?: number;
  sentiment_negative?: number;
  rating_1_star?: number;
  rating_2_star?: number;
  rating_3_star?: number;
  rating_4_star?: number;
  rating_5_star?: number;
  created_at: string;
}

export interface PlanLimits {
  apps: number;
  reviews: number;
  ai_features: boolean;
  competitor_tracking: boolean;
  pdf_reports: boolean;
  team_members: boolean;
  api_access: boolean;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    apps: 1,
    reviews: 100,
    ai_features: false,
    competitor_tracking: false,
    pdf_reports: false,
    team_members: false,
    api_access: false,
  },
  starter: {
    apps: 3,
    reviews: 1000,
    ai_features: true,
    competitor_tracking: false,
    pdf_reports: false,
    team_members: false,
    api_access: false,
  },
  pro: {
    apps: 10,
    reviews: -1, // unlimited
    ai_features: true,
    competitor_tracking: true,
    pdf_reports: true,
    team_members: true,
    api_access: false,
  },
  agency: {
    apps: -1, // unlimited
    reviews: -1, // unlimited
    ai_features: true,
    competitor_tracking: true,
    pdf_reports: true,
    team_members: true,
    api_access: true,
  },
};

export interface PricingPlan {
  name: string;
  slug: PlanType;
  price: number;
  annualPrice: number;
  description: string;
  features: string[];
  highlighted?: boolean;
  stripePriceId?: string;
  stripeAnnualPriceId?: string;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: "Free",
    slug: "free",
    price: 0,
    annualPrice: 0,
    description: "For solo developers trying it out",
    features: [
      "1 app",
      "100 reviews",
      "Basic analytics",
      "Rating trends",
      "Email support",
    ],
  },
  {
    name: "Starter",
    slug: "starter",
    price: 19,
    annualPrice: 182, // 20% off
    description: "For indie developers",
    features: [
      "3 apps",
      "1,000 reviews",
      "AI sentiment analysis",
      "Basic insights",
      "Email alerts",
      "CSV export",
    ],
  },
  {
    name: "Pro",
    slug: "pro",
    price: 49,
    annualPrice: 470, // 20% off
    description: "For small studios & PMs",
    highlighted: true,
    features: [
      "10 apps",
      "Unlimited reviews",
      "Full AI insights",
      "Competitor tracking",
      "Advanced alerts",
      "PDF reports",
      "Team members",
      "Priority support",
    ],
  },
  {
    name: "Agency",
    slug: "agency",
    price: 149,
    annualPrice: 1430, // 20% off
    description: "For agencies & enterprises",
    features: [
      "Unlimited apps",
      "Unlimited reviews",
      "Full AI insights",
      "Competitor tracking",
      "White-label reports",
      "Team collaboration",
      "API access",
      "Dedicated support",
      "Custom integrations",
    ],
  },
];
