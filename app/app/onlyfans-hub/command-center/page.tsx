"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  Users, 
  Target, 
  TrendingUp,
  DollarSign,
  Activity,
  Package,
  Zap
} from "lucide-react";
import Link from "next/link";

export default function OnlyFansCommandCenter() {
  const quickStats = [
    { label: "Active Fans", value: "2,847", change: "+12%", icon: Users },
    { label: "Unread Messages", value: "34", change: "-5%", icon: MessageSquare },
    { label: "Revenue Today", value: "$1,234", change: "+23%", icon: DollarSign },
    { label: "Active Campaigns", value: "7", change: "+2", icon: Target }
  ];

  const sections = [
    {
      title: "Inbox (AI Messages)",
      description: "Manage conversations with AI assistance",
      href: "/onlyfans/inbox",
      icon: MessageSquare,
      color: "bg-blue-500"
    },
    {
      title: "Fan CRM",
      description: "Track and manage your fan relationships",
      href: "/onlyfans/fans",
      icon: Users,
      color: "bg-purple-500"
    },
    {
      title: "PPV Campaigns",
      description: "Create and track pay-per-view campaigns",
      href: "/onlyfans/campaigns",
      icon: Target,
      color: "bg-green-500"
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">OnlyFans Command Center</h1>
        <p className="text-muted-foreground">
          Your centralized hub for managing OnlyFans operations
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    <p className={`text-sm mt-1 ${
                      stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change} from yesterday
                    </p>
                  </div>
                  <Icon className="h-8 w-8 text-muted-foreground opacity-50" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sections.map((section, index) => {
          const Icon = section.icon;
          return (
            <Link key={index} href={section.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${section.color} text-white`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle>{section.title}</CardTitle>
                      <CardDescription>{section.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates from your OnlyFans account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">New subscriber: Emma Johnson</p>
                <p className="text-xs text-muted-foreground">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">5 new messages in inbox</p>
                <p className="text-xs text-muted-foreground">15 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">PPV campaign completed: $450 earned</p>
                <p className="text-xs text-muted-foreground">1 hour ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex gap-3 flex-wrap">
        <Button>
          <Zap className="h-4 w-4 mr-2" />
          Quick Message All
        </Button>
        <Button variant="outline">
          <Package className="h-4 w-4 mr-2" />
          Upload Content
        </Button>
        <Button variant="outline">
          <Target className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
        <Button variant="outline">
          <TrendingUp className="h-4 w-4 mr-2" />
          View Analytics
        </Button>
      </div>
    </div>
  );
}