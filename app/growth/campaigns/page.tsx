"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  Plus, 
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Zap,
  Play,
  Pause,
  Edit,
  BarChart
} from "lucide-react";

export default function GrowthCampaignsPage() {
  const campaigns = [
    {
      id: 1,
      name: "New Fan Welcome Series",
      type: "Automated",
      status: "active",
      audience: "New subscribers",
      conversion: "34%",
      revenue: "$2,340",
      enrolled: 156,
      steps: 5
    },
    {
      id: 2,
      name: "Win-Back Campaign",
      type: "Targeted",
      status: "paused",
      audience: "Inactive 30+ days",
      conversion: "12%",
      revenue: "$890",
      enrolled: 89,
      steps: 3
    },
    {
      id: 3,
      name: "VIP Upsell Flow",
      type: "Automated",
      status: "active",
      audience: "High spenders",
      conversion: "67%",
      revenue: "$5,670",
      enrolled: 45,
      steps: 4
    }
  ];

  const campaignTemplates = [
    {
      name: "Welcome Series",
      description: "Onboard new fans with personalized messages",
      icon: Users,
      color: "bg-blue-500"
    },
    {
      name: "Re-engagement",
      description: "Win back inactive fans with special offers",
      icon: TrendingUp,
      color: "bg-green-500"
    },
    {
      name: "PPV Promotion",
      description: "Promote exclusive content to targeted segments",
      icon: DollarSign,
      color: "bg-purple-500"
    },
    {
      name: "Tip Campaign",
      description: "Encourage tipping with strategic messaging",
      icon: Zap,
      color: "bg-orange-500"
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Growth Campaigns</h1>
          <p className="text-muted-foreground">
            Automated marketing campaigns to grow your fanbase and revenue
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Active Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>Active Campaigns</CardTitle>
          <CardDescription>Monitor and manage your running campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaigns.map(campaign => (
              <div key={campaign.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{campaign.name}</h3>
                        <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                          {campaign.status}
                        </Badge>
                        <Badge variant="outline">{campaign.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {campaign.audience} • {campaign.steps} steps
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <BarChart className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      {campaign.status === 'active' ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Enrolled</p>
                    <p className="font-semibold">{campaign.enrolled} fans</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Conversion</p>
                    <p className="font-semibold text-green-600">{campaign.conversion}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Revenue</p>
                    <p className="font-semibold">{campaign.revenue}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Performance</p>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-green-600">+23%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Campaign Templates */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Campaign Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {campaignTemplates.map((template, index) => {
            const Icon = template.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-lg ${template.color} text-white flex items-center justify-center mb-4`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold mb-2">{template.name}</h3>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
          <CardDescription>Overall campaign metrics for the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">290</p>
              <p className="text-sm text-muted-foreground">Total Enrolled</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">38%</p>
              <p className="text-sm text-muted-foreground">Avg Conversion</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">$8,900</p>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">4.2x</p>
              <p className="text-sm text-muted-foreground">ROI</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}