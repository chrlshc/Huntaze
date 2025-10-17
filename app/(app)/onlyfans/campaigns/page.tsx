"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Target, 
  TrendingUp, 
  DollarSign, 
  Users,
  Calendar,
  MessageSquare,
  Package,
  Plus,
  Edit,
  Trash,
  Play,
  Pause,
  CheckCircle
} from "lucide-react";

export default function PPVCampaignsPage() {
  const [activeTab, setActiveTab] = useState("active");

  const campaigns = [
    {
      id: 1,
      name: "Summer Special Bundle",
      status: "active",
      type: "PPV Message",
      price: "$49.99",
      sent: 245,
      opens: 189,
      purchases: 67,
      revenue: "$3,349.33",
      conversion: "27.3%",
      createdAt: "2024-01-20"
    },
    {
      id: 2,
      name: "VIP Content Drop",
      status: "scheduled",
      type: "Mass PPV",
      price: "$29.99",
      sent: 0,
      opens: 0,
      purchases: 0,
      revenue: "$0",
      conversion: "0%",
      scheduledFor: "2024-01-25",
      createdAt: "2024-01-19"
    },
    {
      id: 3,
      name: "New Year Exclusive",
      status: "completed",
      type: "Targeted PPV",
      price: "$99.99",
      sent: 128,
      opens: 102,
      purchases: 34,
      revenue: "$3,399.66",
      conversion: "26.6%",
      createdAt: "2024-01-01"
    }
  ];

  const getStatusColor = (status: string) => {
    switch(status) {
      case "active": return "bg-green-100 text-green-700";
      case "scheduled": return "bg-blue-100 text-blue-700";
      case "completed": return "bg-gray-100 text-gray-700";
      case "paused": return "bg-yellow-100 text-yellow-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case "active": return Play;
      case "scheduled": return Calendar;
      case "completed": return CheckCircle;
      case "paused": return Pause;
      default: return Target;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">PPV Campaigns</h1>
          <p className="text-muted-foreground">
            Create and manage pay-per-view content campaigns
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Campaign
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Campaigns</p>
                <p className="text-2xl font-bold">3</p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">$10,148.99</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Conversion</p>
                <p className="text-2xl font-bold">26.5%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Messages Sent</p>
                <p className="text-2xl font-bold">501</p>
              </div>
              <MessageSquare className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <Card>
        <CardHeader>
          <CardTitle>Campaigns</CardTitle>
          <CardDescription>Manage and monitor your PPV campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="all">All Campaigns</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab} className="mt-6">
              <div className="space-y-4">
                {campaigns
                  .filter(c => activeTab === "all" || c.status === activeTab)
                  .map(campaign => {
                    const StatusIcon = getStatusIcon(campaign.status);
                    return (
                      <div key={campaign.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-muted">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{campaign.name}</h3>
                                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                                  <StatusIcon className="h-3 w-3" />
                                  {campaign.status}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {campaign.type} · {campaign.price} · Created {campaign.createdAt}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {campaign.status !== "scheduled" && (
                          <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Sent</p>
                              <p className="font-semibold">{campaign.sent}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Opens</p>
                              <p className="font-semibold">{campaign.opens}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Purchases</p>
                              <p className="font-semibold">{campaign.purchases}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Revenue</p>
                              <p className="font-semibold text-green-600">{campaign.revenue}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Conversion</p>
                              <p className="font-semibold">{campaign.conversion}</p>
                            </div>
                          </div>
                        )}
                        
                        {campaign.status === "scheduled" && (
                          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                            <p className="text-sm">
                              <Calendar className="inline h-4 w-4 mr-1" />
                              Scheduled for {campaign.scheduledFor}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}