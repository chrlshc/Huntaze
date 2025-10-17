'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MediaUploader } from '@/components/content/MediaUploader';
import { ContentScheduler } from '@/components/content/ContentScheduler';
import { ContentPreview } from '@/components/content/ContentPreview';
import { useAIChat } from '@/hooks/useAIChat';
import { useToast } from '@/components/ui/use-toast';
import { Upload, Calendar, Eye, Send, Loader2, DollarSign, Tag, Users, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { analytics } from '@/lib/analytics/realtime-analytics';
import { queueManager } from '@/lib/queue/queue-manager';

interface ContentFormData {
  title: string;
  description: string;
  category: string;
  price?: number;
  tags: string[];
  platforms: string[];
  scheduledDate?: Date;
  mediaUrls: string[];
  isBundle: boolean;
  bundleItems?: string[];
}

export default function CreateContentPage() {
  const { toast } = useToast();
  const { sendMessage } = useAIChat({ useCase: 'content' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [uploadedMediaUrls, setUploadedMediaUrls] = useState<string[]>([]);
  
  const [formData, setFormData] = useState<ContentFormData>({
    title: '',
    description: '',
    category: 'photos',
    tags: [],
    platforms: ['onlyfans'],
    mediaUrls: [],
    isBundle: false
  });

  const handleMediaUpload = (urls: string[]) => {
    setUploadedMediaUrls(urls);
    setFormData(prev => ({ ...prev, mediaUrls: urls }));
    
    analytics.trackEvent({
      userId: 'current-user',
      eventType: 'media_uploaded',
      properties: {
        fileCount: urls.length,
        category: formData.category,
      },
    });
  };

  const handleScheduleChange = (date: Date | undefined) => {
    setFormData(prev => ({ ...prev, scheduledDate: date }));
  };

  const generateAIDescription = async () => {
    if (!formData.title) {
      toast({
        title: "Title Required",
        description: "Please enter a title first to generate AI description",
        variant: "destructive",
      });
      return;
    }

    const response = await sendMessage(
      `Generate an engaging OnlyFans post description for content titled "${formData.title}". Make it flirty, intriguing, and encourage engagement. Keep it under 200 characters.`
    );

    if (response) {
      setFormData(prev => ({ ...prev, description: response.content }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Queue for AI processing
      await queueManager.queueAIProcessing({
        type: 'analyze_content',
        payload: {
          ...formData,
          mediaUrls: uploadedMediaUrls,
          scheduledDate: formData.scheduledDate?.toISOString()
        },
        userId: 'current-user',
        priority: 'normal',
      });

      // Track content creation
      await analytics.trackEvent({
        userId: 'current-user',
        eventType: 'content_created',
        properties: {
          category: formData.category,
          platformCount: formData.platforms.length,
          hasPrice: !!formData.price,
          isScheduled: !!formData.scheduledDate,
          mediaCount: uploadedMediaUrls.length,
        },
        revenue: formData.price || 0,
      });

      toast({
        title: 'Content created successfully!',
        description: `Published to ${formData.platforms.length} platform${formData.platforms.length > 1 ? 's' : ''}`
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        category: 'photos',
        tags: [],
        platforms: ['onlyfans'],
        mediaUrls: [],
        isBundle: false
      });
      setUploadedMediaUrls([]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create content. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({ 
      ...prev, 
      tags: prev.tags.filter(t => t !== tag) 
    }));
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Create Content</h1>
          <p className="text-muted-foreground mt-1">
            Create and schedule your content across multiple platforms
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setPreviewMode(!previewMode)}
        >
          <Eye className="h-4 w-4 mr-2" />
          {previewMode ? 'Edit' : 'Preview'}
        </Button>
      </div>

      {previewMode ? (
        <ContentPreview 
          content={formData}
          mediaUrls={uploadedMediaUrls}
        />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Content Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Eye-catching title for your content"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Write an engaging description..."
                      rows={4}
                      required
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        {formData.description.length}/500 characters
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={generateAIDescription}
                        disabled={!formData.title}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate with AI
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="photos">Photos</SelectItem>
                        <SelectItem value="videos">Videos</SelectItem>
                        <SelectItem value="bundle">Bundle</SelectItem>
                        <SelectItem value="live">Live Stream</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex gap-2 flex-wrap mb-2">
                      {formData.tags.map(tag => (
                        <Badge 
                          key={tag} 
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => removeTag(tag)}
                        >
                          {tag} ×
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a tag"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag((e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                      />
                      <Button type="button" variant="outline">
                        <Tag className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Platforms</Label>
                    <div className="space-y-2">
                      {['onlyfans', 'instagram', 'tiktok', 'reddit'].map(platform => (
                        <div key={platform} className="flex items-center space-x-2">
                          <Checkbox
                            id={platform}
                            checked={formData.platforms.includes(platform)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData(prev => ({ 
                                  ...prev, 
                                  platforms: [...prev.platforms, platform] 
                                }));
                              } else {
                                setFormData(prev => ({ 
                                  ...prev, 
                                  platforms: prev.platforms.filter(p => p !== platform) 
                                }));
                              }
                            }}
                          />
                          <Label htmlFor={platform} className="capitalize">
                            {platform}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="media" className="mt-6">
              <MediaUploader 
                onUpload={handleMediaUpload}
                maxFiles={10}
                acceptedTypes={['image/*', 'video/*']}
              />
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pricing & Monetization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="bundle"
                      checked={formData.isBundle}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, isBundle: checked }))
                      }
                    />
                    <Label htmlFor="bundle">Create as bundle</Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Price ($)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        className="pl-10"
                        value={formData.price || ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          price: parseFloat(e.target.value) || undefined 
                        }))}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Revenue Estimate
                    </h4>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>100 fans:</span>
                        <span className="font-medium">
                          ${((formData.price || 0) * 100).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>500 fans:</span>
                        <span className="font-medium">
                          ${((formData.price || 0) * 500).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>1000 fans:</span>
                        <span className="font-medium">
                          ${((formData.price || 0) * 1000).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schedule" className="mt-6">
              <ContentScheduler 
                onScheduleChange={handleScheduleChange}
                platforms={formData.platforms}
              />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline">
              Save as Draft
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {formData.scheduledDate ? 'Schedule' : 'Publish Now'}
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}