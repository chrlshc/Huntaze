"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsFilterDto = exports.ExportAnalyticsDto = exports.PeriodComparisonDto = exports.ContentAnalyticsDto = exports.SubscriberAnalyticsDto = exports.RevenueAnalyticsDto = exports.DashboardOverviewDto = void 0;
class DashboardOverviewDto {
    period;
    dateRange;
    // KPIs principaux
    totalRevenue;
    revenueGrowth;
    activeSubscribers;
    subscriberGrowth;
    conversionRate;
    averageOrderValue;
    // Détails revenus
    revenue;
    // Détails abonnés
    subscribers;
    // Engagement
    engagement;
    // Top content & transactions
    topProducts;
    recentTransactions;
    // Quick stats
    quickStats;
}
exports.DashboardOverviewDto = DashboardOverviewDto;
class RevenueAnalyticsDto {
    period;
    summary;
    byType;
    timeSeries;
    topSources;
    projection;
    commissionMetrics;
}
exports.RevenueAnalyticsDto = RevenueAnalyticsDto;
class SubscriberAnalyticsDto {
    period;
    summary;
    growth;
    retention;
    lifetimeValue;
    planDistribution;
    churnPrediction;
    cohorts;
    segments;
}
exports.SubscriberAnalyticsDto = SubscriberAnalyticsDto;
class ContentAnalyticsDto {
    period;
    summary;
    performanceByType;
    topContent;
    engagement;
    publishingPatterns;
    recommendations;
}
exports.ContentAnalyticsDto = ContentAnalyticsDto;
class PeriodComparisonDto {
    current;
    previous;
    changes;
}
exports.PeriodComparisonDto = PeriodComparisonDto;
class ExportAnalyticsDto {
    format;
    type;
    period;
    includeDetails;
}
exports.ExportAnalyticsDto = ExportAnalyticsDto;
class AnalyticsFilterDto {
    startDate;
    endDate;
    period;
    groupBy;
    metrics;
    includeComparison;
}
exports.AnalyticsFilterDto = AnalyticsFilterDto;
//# sourceMappingURL=analytics.dto.js.map