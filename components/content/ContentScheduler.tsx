'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar as CalendarIcon, Clock, Zap, Globe } from 'lucide-react';
import { format } from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface ContentSchedulerProps {
  onScheduleChange: (date: Date | undefined) => void;
  platforms: string[];
}

interface OptimalTime {
  platform: string;
  time: string;
  timezone: string;
  engagement: number;
}

const optimalTimes: Record<string, OptimalTime[]> = {
  onlyfans: [
    { platform: 'onlyfans', time: '20:00', timezone: 'EST', engagement: 95 },
    { platform: 'onlyfans', time: '22:00', timezone: 'EST', engagement: 88 },
    { platform: 'onlyfans', time: '14:00', timezone: 'EST', engagement: 82 },
  ],
  instagram: [
    { platform: 'instagram', time: '11:00', timezone: 'EST', engagement: 92 },
    { platform: 'instagram', time: '19:00', timezone: 'EST', engagement: 89 },
    { platform: 'instagram', time: '07:00', timezone: 'EST', engagement: 85 },
  ],
  tiktok: [
    { platform: 'tiktok', time: '06:00', timezone: 'EST', engagement: 94 },
    { platform: 'tiktok', time: '10:00', timezone: 'EST', engagement: 91 },
    { platform: 'tiktok', time: '19:00', timezone: 'EST', engagement: 87 },
  ],
  reddit: [
    { platform: 'reddit', time: '09:00', timezone: 'EST', engagement: 90 },
    { platform: 'reddit', time: '12:00', timezone: 'EST', engagement: 86 },
    { platform: 'reddit', time: '17:00', timezone: 'EST', engagement: 83 },
  ],
};

export function ContentScheduler({ onScheduleChange, platforms }: ContentSchedulerProps) {
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState('20:00');
  const [timezone, setTimezone] = useState('EST');
  const [useOptimalTime, setUseOptimalTime] = useState(true);

  const handleDateChange = (newDate: Date | undefined) => {
    setDate(newDate);
    if (newDate && time) {
      const [hours, minutes] = time.split(':');
      newDate.setHours(parseInt(hours), parseInt(minutes));
      onScheduleChange(newDate);
    } else {
      onScheduleChange(undefined);
    }
  };

  const handleTimeChange = (newTime: string) => {
    setTime(newTime);
    if (date && newTime) {
      const [hours, minutes] = newTime.split(':');
      const updatedDate = new Date(date);
      updatedDate.setHours(parseInt(hours), parseInt(minutes));
      onScheduleChange(updatedDate);
    }
  };

  const selectOptimalTime = (optimal: OptimalTime) => {
    setTime(optimal.time);
    setTimezone(optimal.timezone);
    if (date) {
      const [hours, minutes] = optimal.time.split(':');
      const updatedDate = new Date(date);
      updatedDate.setHours(parseInt(hours), parseInt(minutes));
      onScheduleChange(updatedDate);
    }
  };

  const getBestTimeForPlatforms = () => {
    const allOptimalTimes = platforms.flatMap(platform => 
      optimalTimes[platform] || []
    );
    
    // Get the best time across all selected platforms
    return allOptimalTimes.sort((a, b) => b.engagement - a.engagement)[0];
  };

  const bestTime = getBestTimeForPlatforms();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Schedule Post</CardTitle>
          <CardDescription>
            Choose when to publish your content for maximum engagement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Publication Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={handleDateChange}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="w-full pl-10 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger id="timezone">
                  <Globe className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EST">Eastern (EST)</SelectItem>
                  <SelectItem value="PST">Pacific (PST)</SelectItem>
                  <SelectItem value="CST">Central (CST)</SelectItem>
                  <SelectItem value="MST">Mountain (MST)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="optimal"
              checked={useOptimalTime}
              onChange={(e) => setUseOptimalTime((e.target as HTMLInputElement).checked)}
            />
            <Label htmlFor="optimal" className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Use AI-suggested optimal times
            </Label>
          </div>
        </CardContent>
      </Card>

      {useOptimalTime && platforms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Optimal Posting Times</CardTitle>
            <CardDescription>
              Based on your audience engagement patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {platforms.map(platform => {
                const times = optimalTimes[platform] || [];
                return (
                  <div key={platform} className="space-y-2">
                    <h4 className="font-medium capitalize flex items-center gap-2">
                      {platform}
                      <Badge variant="secondary" className="text-xs">
                        {times[0]?.engagement || 0}% engagement
                      </Badge>
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {times.slice(0, 3).map((optimal, idx) => (
                        <Button
                          key={`${platform}-${idx}`}
                          variant="outline"
                          size="sm"
                          onClick={() => selectOptimalTime(optimal)}
                          className={cn(
                            'justify-between',
                            time === optimal.time && 'border-primary'
                          )}
                        >
                          <span>{optimal.time}</span>
                          <span className="text-xs text-muted-foreground">
                            {optimal.engagement}%
                          </span>
                        </Button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {bestTime && (
              <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Best time across all platforms: {bestTime.time} {bestTime.timezone}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
