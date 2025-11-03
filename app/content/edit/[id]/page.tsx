'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import CollaborativeEditor from '@/components/content/CollaborativeEditor';
import { CollaboratorManager } from '@/components/content/CollaboratorManager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Save, 
  Share2, 
  Users, 
  FileText,
  Clock,
  Eye
} from 'lucide-react';

interface ContentItem {
  id: string;
  title: string;
  text: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function ContentEditPage() {
  const params = useParams();
  const { data: session } = useSession();
  const [content, setContent] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const contentId = params.id as string;

  // Load content data
  useEffect(() => {
    if (!contentId || !session?.user) return;

    loadContent();
  }, [contentId, session?.user]);

  const loadContent = async () => {
    try {
      const response = await fetch(`/api/content/${contentId}`);
      if (response.ok) {
        const data = await response.json();
        setContent(data.content);
        setIsOwner(data.content.userId === session?.user?.id);
      } else {
        toast.error('Failed to load content');
      }
    } catch (error) {
      console.error('Error loading content:', error);
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (newContent: string) => {
    if (!content) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/content/${contentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: newContent,
        }),
      });

      if (response.ok) {
        const updatedContent = await response.json();
        setContent(updatedContent.content);
        toast.success('Content saved successfully');
      } else {
        toast.error('Failed to save content');
      }
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error('Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  const handleContentChange = (newContent: string) => {
    if (content) {
      setContent({
        ...content,
        text: newContent,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading content...</p>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Content Not Found</h2>
              <p className="text-gray-600">The content you're looking for doesn't exist or you don't have access to it.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {content.title || 'Untitled Content'}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Last updated {new Date(content.updatedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span className="capitalize">{content.status}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={() => handleSave(content.text)}
                disabled={saving}
                variant="outline"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
              
              {isOwner && (
                <Button>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Editor */}
          <div className="lg:col-span-3">
            <CollaborativeEditor
              contentId={contentId}
              initialContent={content.text}
              onChange={handleContentChange}
              onSave={handleSave}
              currentUserId={session?.user?.id || ''}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Tabs defaultValue="collaborators" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="collaborators">
                  <Users className="h-4 w-4 mr-2" />
                  Team
                </TabsTrigger>
                <TabsTrigger value="details">
                  <FileText className="h-4 w-4 mr-2" />
                  Details
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="collaborators" className="mt-4">
                <Card>
                  <CardContent className="p-4">
                    <CollaboratorManager
                      contentId={contentId}
                      isOwner={isOwner}
                      onCollaboratorsChange={loadContent}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="details" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Content Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Status</label>
                      <p className="text-sm text-gray-600 capitalize">{content.status}</p>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Created</label>
                      <p className="text-sm text-gray-600">
                        {new Date(content.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Last Modified</label>
                      <p className="text-sm text-gray-600">
                        {new Date(content.updatedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Word Count</label>
                      <p className="text-sm text-gray-600">
                        {content.text.split(/\s+/).filter(word => word.length > 0).length} words
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Character Count</label>
                      <p className="text-sm text-gray-600">
                        {content.text.length} characters
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}