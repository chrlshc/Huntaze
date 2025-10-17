"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign,
  Clock,
  MessageSquare,
  Target,
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react";

export default function PredictiveInsightsPage() {
  const predictions = [
    {
      type: "revenue",
      title: "Revenue Projection",
      prediction: "$15,420",
      confidence: 85,
      trend: "up",
      change: "+23%",
      period: "Next 30 days",
      insights: ["PPV campaigns performing 40% above average", "Tip frequency increased by 15%"]
    },
    {
      type: "churn",
      title: "Churn Risk Analysis",
      prediction: "12 fans",
      confidence: 78,
      trend: "down",
      change: "-5%",
      period: "At risk this week",
      insights: ["8 fans haven't engaged in 10+ days", "4 fans declined last PPV"]
    },
    {
      type: "engagement",
      title: "Best Posting Time",
      prediction: "8:00 PM EST",
      confidence: 92,
      trend: "up",
      change: "+45%",
      period: "Peak engagement",
      insights: ["67% of fans active at this time", "Highest PPV conversion rate"]
    }
  ];

  const fanSegments = [
    { name: "High Spenders", count: 45, revenue: "$8,234", growth: "+15%" },
    { name: "Regular Tippers", count: 123, revenue: "$4,567", growth: "+8%" },
    { name: "New Fans", count: 89, revenue: "$1,234", growth: "+45%" },
    { name: "At Risk", count: 34, revenue: "$567", growth: "-12%" }
  ];

  const recommendations = [
    {
      priority: "high",
      title: "Launch weekend PPV campaign",
      impact: "Estimated $2,500 revenue",
      reason: "85% of high spenders are active on weekends"
    },
    {
      priority: "medium",
      title: "Re-engage dormant fans",
      impact: "Recover 15-20 fans",
      reason: "23 fans haven't opened messages in 7 days"
    },
    {
      priority: "low",
      title: "Adjust pricing strategy",
      impact: "5-10% revenue increase",
      reason: "Current prices 20% below optimal based on engagement"
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case "high": return "text-red-600 bg-red-100";
      case "medium": return "text-yellow-600 bg-yellow-100";
      case "low": return "text-green-600 bg-green-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch(priority) {
      case "high": return AlertCircle;
      case "medium": return Clock;
      case "low": return CheckCircle;
      default: return Target;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Predictive Insights</h1>
        <p className="text-muted-foreground">
          AI-powered predictions and recommendations for your OnlyFans growth
        </p>
      </div>

      {/* Key Predictions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {predictions.map((pred, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {pred.title}
                <span className="text-sm font-normal text-muted-foreground">
                  {pred.period}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{pred.prediction}</span>
                    <span className={`flex items-center gap-1 text-sm font-medium ${
                      pred.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {pred.trend === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      {pred.change}
                    </span>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Confidence</span>
                    <span className="font-medium">{pred.confidence}%</span>
                  </div>
                  <Progress value={pred.confidence} className="h-2" />
                </div>

                <div className="space-y-1">
                  {pred.insights.map((insight, i) => (
                    <p key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      {insight}
                    </p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Fan Segmentation */}
      <Card>
        <CardHeader>
          <CardTitle>Fan Segmentation Analysis</CardTitle>
          <CardDescription>AI-identified fan groups based on behavior patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {fanSegments.map((segment, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{segment.name}</h4>
                    <p className="text-sm text-muted-foreground">{segment.count} fans</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{segment.revenue}</p>
                  <p className={`text-sm ${
                    segment.growth.startsWith('+') ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {segment.growth} this month
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>AI Recommendations</CardTitle>
          <CardDescription>Actionable insights to maximize your earnings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recommendations.map((rec, index) => {
              const Icon = getPriorityIcon(rec.priority);
              return (
                <div key={index} className="flex items-start gap-4 p-4 rounded-lg border hover:shadow-md transition-shadow">
                  <div className={`p-2 rounded-lg ${getPriorityColor(rec.priority)}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{rec.title}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{rec.reason}</p>
                    <p className="text-sm font-medium text-primary">{rec.impact}</p>
                  </div>
                  <button className="px-3 py-1 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                    Apply
                  </button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}