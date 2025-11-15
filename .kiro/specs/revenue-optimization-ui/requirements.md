# Requirements Document - Revenue Optimization UI

## Introduction

This feature adds user interfaces to the existing Revenue Optimization backend system. The backend logic, ML models, and APIs are already implemented and functional. This spec focuses exclusively on creating the UI layer that allows creators to interact with and leverage the existing revenue optimization capabilities.

The system currently provides dynamic pricing recommendations, churn predictions, upsell opportunities, revenue forecasts, and payout tracking - but these capabilities are not accessible to end users without UI components.

## Glossary

- **Creator**: A content creator using the Huntaze platform to manage their OnlyFans/Fansly business
- **Fan**: A subscriber or follower who pays for content from a creator
- **Churn**: When a fan cancels their subscription or stops engaging
- **ARPU**: Average Revenue Per User
- **LTV**: Lifetime Value of a fan
- **PPV**: Pay-Per-View content (one-time purchase)
- **CIN AI**: The existing AI recommendation engine that provides pricing and strategy suggestions
- **Dynamic Pricing**: Automated price optimization based on demand and engagement data
- **Upsell**: Offering additional products/services to existing customers
- **MoM**: Month-over-Month growth metric

## Requirements

### Requirement 1: Dynamic Pricing Interface

**User Story:** As a creator, I want to see and apply AI-recommended pricing changes, so that I can optimize my revenue without manual analysis.

#### Acceptance Criteria

1. WHEN the Creator views the pricing dashboard, THE System SHALL display the current subscription price and the AI-recommended optimal price
2. WHEN the CIN AI generates a pricing recommendation, THE System SHALL display the expected revenue impact as a percentage increase
3. WHEN the CIN AI generates a pricing recommendation, THE System SHALL display the reasoning behind the recommendation
4. WHEN the Creator clicks the apply button, THE System SHALL update the subscription price to the recommended value
5. WHERE the Creator has PPV content, THE System SHALL display separate pricing recommendations for PPV items with expected revenue ranges

### Requirement 2: Churn Risk Dashboard

**User Story:** As a creator, I want to identify fans at risk of churning, so that I can re-engage them before they leave.

#### Acceptance Criteria

1. WHEN the Creator views the churn dashboard, THE System SHALL display a count of fans categorized by churn risk level (high, medium, low)
2. WHEN the System identifies a fan with high churn risk (above 80%), THE System SHALL display the fan's name, churn probability percentage, and days since last activity
3. WHEN the Creator selects a fan at risk, THE System SHALL provide a one-click re-engagement action that sends a personalized message
4. WHEN the Creator views a fan's churn risk details, THE System SHALL display historical engagement metrics and predicted churn date
5. WHILE the Creator is viewing the churn dashboard, THE System SHALL refresh the risk calculations every 60 seconds

### Requirement 3: Upsell Automation Interface

**User Story:** As a creator, I want to automatically suggest relevant upsells to fans, so that I can increase average order value without manual effort.

#### Acceptance Criteria

1. WHEN a Fan purchases content, THE System SHALL automatically identify upsell opportunities based on purchase history and display them to the Creator
2. WHEN the System identifies an upsell opportunity, THE System SHALL display the suggested product, expected buy rate percentage, and estimated revenue
3. WHEN the Creator approves an upsell suggestion, THE System SHALL automatically send the upsell offer to the Fan
4. WHEN the System displays upsell opportunities, THE System SHALL show the confidence level (percentage) for each suggestion
5. WHERE the Creator has configured upsell automation rules, THE System SHALL execute approved upsells without requiring manual approval

### Requirement 4: Revenue Forecast Dashboard

**User Story:** As a creator, I want to see revenue forecasts and progress tracking, so that I can plan financially and understand what actions to take to reach my goals.

#### Acceptance Criteria

1. WHEN the Creator views the forecast dashboard, THE System SHALL display the current month's projected revenue and actual revenue with percentage completion
2. WHEN the current month's revenue is below 85% of the projection, THE System SHALL display a warning indicator
3. WHEN the Creator views next month's forecast, THE System SHALL display the predicted revenue amount with a confidence percentage
4. WHEN the System generates a revenue forecast, THE System SHALL provide actionable recommendations (number of new subscribers needed, PPV content to post) to reach a specified revenue goal
5. WHILE viewing the forecast dashboard, THE System SHALL display a 12-month revenue trend chart with month-over-month growth percentages

### Requirement 5: Multi-Platform Payout Dashboard

**User Story:** As a creator, I want to see all my payouts from different platforms in one place, so that I can manage my finances and prepare for taxes.

#### Acceptance Criteria

1. WHEN the Creator views the payout dashboard, THE System SHALL display upcoming payouts from all connected platforms (OnlyFans, Fansly, Patreon) with amounts and dates
2. WHEN the System displays payout information, THE System SHALL calculate and display the total expected payout amount
3. WHEN the System displays payout information, THE System SHALL calculate and display an estimated tax amount based on a configurable tax rate (default 30%)
4. WHEN the System displays payout information, THE System SHALL calculate and display the net income after estimated taxes
5. WHEN the Creator clicks the export button, THE System SHALL generate a downloadable CSV file containing all payout data formatted for accountant review

### Requirement 6: Performance Metrics Overview

**User Story:** As a creator, I want to see key revenue metrics at a glance, so that I can quickly understand my business performance.

#### Acceptance Criteria

1. WHEN the Creator views the metrics dashboard, THE System SHALL display current ARPU, LTV, and churn rate with trend indicators (up/down arrows)
2. WHEN a metric changes by more than 10% compared to the previous period, THE System SHALL highlight the metric with a visual indicator
3. WHEN the Creator views the metrics dashboard, THE System SHALL display the total number of active subscribers and the change from the previous month
4. WHEN the Creator views the metrics dashboard, THE System SHALL display total revenue for the current month and the month-over-month growth percentage
5. WHILE viewing any metric, THE System SHALL allow the Creator to click for detailed historical data spanning the last 12 months

### Requirement 7: Responsive Design and Accessibility

**User Story:** As a creator, I want to access revenue optimization features on any device, so that I can manage my business from anywhere.

#### Acceptance Criteria

1. THE System SHALL render all revenue optimization UI components responsively on screen widths from 320px to 2560px
2. WHEN the Creator accesses the revenue optimization features on a mobile device (screen width below 768px), THE System SHALL display a mobile-optimized layout with stacked components
3. THE System SHALL ensure all interactive elements have a minimum touch target size of 44x44 pixels for mobile accessibility
4. THE System SHALL provide keyboard navigation support for all interactive elements in the revenue optimization UI
5. THE System SHALL maintain WCAG 2.1 Level AA compliance for color contrast ratios in all revenue optimization UI components

### Requirement 8: Real-Time Data Updates

**User Story:** As a creator, I want to see up-to-date revenue data, so that I can make timely decisions.

#### Acceptance Criteria

1. WHEN the Creator views any revenue optimization dashboard, THE System SHALL fetch the latest data from the backend within 2 seconds of page load
2. WHEN new revenue data becomes available, THE System SHALL update the displayed metrics within 5 seconds without requiring a page refresh
3. IF the System fails to fetch updated data, THEN THE System SHALL display an error message and provide a manual refresh button
4. WHEN the System is fetching updated data, THE System SHALL display a loading indicator without blocking the user interface
5. THE System SHALL cache revenue data locally for 5 minutes to reduce unnecessary API calls

### Requirement 9: Error Handling and User Feedback

**User Story:** As a creator, I want clear feedback when actions succeed or fail, so that I understand what happened and what to do next.

#### Acceptance Criteria

1. WHEN the Creator applies a pricing change successfully, THE System SHALL display a success message confirming the new price
2. IF a pricing change fails, THEN THE System SHALL display an error message explaining the failure reason and provide a retry option
3. WHEN the Creator sends a re-engagement message, THE System SHALL display a confirmation message indicating the message was sent
4. IF an API request fails due to network issues, THEN THE System SHALL display a user-friendly error message and automatically retry up to 3 times with exponential backoff
5. WHEN the System encounters an error, THE System SHALL log the error details with a correlation ID for debugging purposes

### Requirement 10: Integration with Existing Backend

**User Story:** As a developer, I want the UI to seamlessly integrate with existing backend services, so that we leverage the already-implemented business logic.

#### Acceptance Criteria

1. THE System SHALL use the existing CIN AI service endpoints for all pricing recommendations without duplicating business logic
2. THE System SHALL use the existing churn prediction models and APIs without re-implementing prediction algorithms
3. THE System SHALL use the existing revenue analytics service for all financial calculations and forecasts
4. THE System SHALL use the existing commission tracking system for payout data without creating new data sources
5. THE System SHALL maintain backward compatibility with existing API contracts and data structures
