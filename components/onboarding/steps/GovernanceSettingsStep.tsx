"use client";

import { useOnboarding } from "@/src/hooks/useOnboarding";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, DollarSign, Users, Brain, Calendar, MessageSquare } from "lucide-react";

export function GovernanceSettingsStep() {
  const { complianceSettings, updateComplianceSettings } = useOnboarding();

  const handleSliderChange = (field: keyof typeof complianceSettings, value: number[]) => {
    updateComplianceSettings({ [field]: value[0] });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 mx-auto bg-indigo-100 rounded-full flex items-center justify-center">
          <Eye className="w-8 h-8 text-indigo-600" />
        </div>
        <h3 className="text-xl font-semibold">Governance settings</h3>
        <p className="text-gray-600">
          Configure supervision thresholds to stay in control
        </p>
      </div>

      <Alert className="bg-indigo-50 border-indigo-200">
        <AlertDescription>
          These settings ensure human oversight on sensitive actions. 
          You can adjust them anytime to fit your needs.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Price supervision
            </CardTitle>
            <CardDescription>
              Messages with high prices require manual approval
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <Label>Price threshold for approval</Label>
                <Badge variant="outline">${complianceSettings.requireApprovalAbovePrice}</Badge>
              </div>
              <Slider
                value={[complianceSettings.requireApprovalAbovePrice]}
                onValueChange={(value) => handleSliderChange('requireApprovalAbovePrice', value)}
                min={50}
                max={500}
                step={50}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>$50</span>
                <span>$500</span>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Any PPV content or offer above this amount will be queued 
              for manual approval.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Mass messaging
            </CardTitle>
            <CardDescription>
              Messages to multiple recipients are supervised
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <Label>Recipient threshold</Label>
                <Badge variant="outline">{complianceSettings.requireApprovalAboveRecipients} fans</Badge>
              </div>
              <Slider
                value={[complianceSettings.requireApprovalAboveRecipients]}
                onValueChange={(value) => handleSliderChange('requireApprovalAboveRecipients', value)}
                min={10}
                max={200}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>10 fans</span>
                <span>200 fans</span>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Messages sent to more recipients than this threshold will require approval.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              AI confidence
            </CardTitle>
            <CardDescription>
              Minimum confidence level for automated actions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <Label>AI confidence threshold</Label>
                <Badge variant="outline">{Math.round(complianceSettings.aiConfidenceThreshold * 100)}%</Badge>
              </div>
              <Slider
                value={[complianceSettings.aiConfidenceThreshold * 100]}
                onValueChange={(value) => handleSliderChange('aiConfidenceThreshold', [value[0] / 100])}
                min={50}
                max={95}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>50% (More oversight)</span>
                <span>95% (More autonomy)</span>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              If AI confidence is below this threshold, the action will be queued for review.
            </p>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="w-4 h-4" />
                Data retention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between mb-2">
                <Label>Retention period</Label>
                <Badge variant="outline">{complianceSettings.dataRetentionDays} days</Badge>
              </div>
              <Slider
                value={[complianceSettings.dataRetentionDays]}
                onValueChange={(value) => handleSliderChange('dataRetentionDays', value)}
                min={30}
                max={365}
                step={30}
                className="w-full"
              />
              <p className="text-xs text-gray-600 mt-2">
                Older messages will be automatically deleted
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="w-4 h-4" />
                Daily volume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between mb-2">
                <Label>Max messages/day</Label>
                <Badge variant="outline">{complianceSettings.maxMessagesPerDay}</Badge>
              </div>
              <Slider
                value={[complianceSettings.maxMessagesPerDay]}
                onValueChange={(value) => handleSliderChange('maxMessagesPerDay', value)}
                min={100}
                max={1000}
                step={100}
                className="w-full"
              />
              <p className="text-xs text-gray-600 mt-2">
                Safety limit to avoid spam
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardContent className="pt-6">
          <h4 className="font-semibold mb-2">💡 Recommendations</h4>
          <ul className="space-y-1 text-sm text-gray-700">
            <li>• Start strict, then relax thresholds progressively</li>
            <li>• Review settings weekly at first</li>
            <li>• Per‑platform limits are applied automatically</li>
            <li>• A weekly report shows oversight activity</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
