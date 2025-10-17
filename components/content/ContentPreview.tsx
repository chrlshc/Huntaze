'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share2, Bookmark, DollarSign, Calendar, Tag } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';

interface ContentPreviewProps {
  content: {
    title: string;
    description: string;
    category: string;
    price?: number;
    tags: string[];
    platforms: string[];
    scheduledDate?: Date;
    isBundle: boolean;
  };
  mediaUrls: string[];
}

export function ContentPreview({ content, mediaUrls }: ContentPreviewProps) {
  const renderPlatformPreview = (platform: string) => {
    switch (platform) {
      case 'onlyfans':
        return (
          <div className="bg-black rounded-lg p-4">
            <div className="flex items-start space-x-3 mb-4">
              <Avatar>
                <AvatarImage src="/placeholder-avatar.jpg" />
                <AvatarFallback>YU</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-white">Your Username</h4>
                  <Badge variant="secondary" className="text-xs">
                    {content.price ? `$${content.price}` : 'Free'}
                  </Badge>
                </div>
                <p className="text-gray-400 text-sm">Just now</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-white">{content.description}</p>
              
              {mediaUrls.length > 0 && (
                <div className={`grid gap-2 ${mediaUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {mediaUrls.slice(0, 4).map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-gray-800">
                      <Image
                        src={url}
                        alt={`Preview ${idx + 1}`}
                        fill
                        className="object-cover"
                      />
                      {content.price && idx === 0 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <DollarSign className="h-8 w-8 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                  {mediaUrls.length > 4 && (
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-sm">
                      +{mediaUrls.length - 4} more
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                <div className="flex items-center space-x-4">
                  <button className="flex items-center space-x-1 text-gray-400 hover:text-red-500">
                    <Heart className="h-5 w-5" />
                    <span className="text-sm">0</span>
                  </button>
                  <button className="flex items-center space-x-1 text-gray-400 hover:text-blue-500">
                    <MessageCircle className="h-5 w-5" />
                    <span className="text-sm">0</span>
                  </button>
                  <button className="text-gray-400 hover:text-green-500">
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>
                <button className="text-gray-400 hover:text-yellow-500">
                  <Bookmark className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        );

      case 'instagram':
        return (
          <div className="bg-white border rounded-lg">
            <div className="flex items-center p-3 border-b">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder-avatar.jpg" />
                <AvatarFallback>YU</AvatarFallback>
              </Avatar>
              <span className="ml-3 font-semibold text-sm">your_username</span>
            </div>

            {mediaUrls.length > 0 && (
              <div className="relative aspect-square bg-gray-100">
                <Image
                  src={mediaUrls[0]}
                  alt="Instagram preview"
                  fill
                  className="object-cover"
                />
                {mediaUrls.length > 1 && (
                  <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded-full text-xs">
                    1/{mediaUrls.length}
                  </div>
                )}
              </div>
            )}

            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Heart className="h-6 w-6" />
                  <MessageCircle className="h-6 w-6" />
                  <Share2 className="h-6 w-6" />
                </div>
                <Bookmark className="h-6 w-6" />
              </div>

              <div className="space-y-1">
                <p className="text-sm">
                  <span className="font-semibold mr-1">your_username</span>
                  {content.description}
                </p>
                {content.tags.length > 0 && (
                  <p className="text-sm text-blue-600">
                    {content.tags.map(tag => `#${tag}`).join(' ')}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 'tiktok':
        return (
          <div className="bg-black rounded-lg p-4 text-white">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src="/placeholder-avatar.jpg" />
                  <AvatarFallback>YU</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold">@yourusername</h4>
                  <p className="text-gray-400 text-sm">Just now</p>
                </div>
              </div>
              <button className="bg-red-600 text-white px-4 py-1 rounded text-sm font-semibold">
                Follow
              </button>
            </div>

            <div className="mb-4">
              <p>{content.description}</p>
              {content.tags.length > 0 && (
                <p className="text-blue-400 mt-2">
                  {content.tags.map(tag => `#${tag}`).join(' ')}
                </p>
              )}
            </div>

            {mediaUrls.length > 0 && (
              <div className="relative aspect-[9/16] rounded-lg overflow-hidden bg-gray-900">
                <Image
                  src={mediaUrls[0]}
                  alt="TikTok preview"
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>
        );

      case 'reddit':
        return (
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex flex-col items-center space-y-1">
                <button className="text-gray-400 hover:text-orange-500">▲</button>
                <span className="text-sm font-semibold">1</span>
                <button className="text-gray-400 hover:text-blue-500">▼</button>
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src="/placeholder-avatar.jpg" />
                    <AvatarFallback>YU</AvatarFallback>
                  </Avatar>
                  <span>Posted by u/yourusername</span>
                  <span>•</span>
                  <span>Just now</span>
                </div>

                <h3 className="font-semibold text-lg">{content.title}</h3>

                {content.tags.length > 0 && (
                  <div className="flex gap-2">
                    {content.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <p className="text-sm">{content.description}</p>

                {mediaUrls.length > 0 && (
                  <div className="mt-3">
                    {mediaUrls.length === 1 ? (
                      <div className="relative aspect-video rounded overflow-hidden bg-gray-100">
                        <Image
                          src={mediaUrls[0]}
                          alt="Reddit preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="text-sm text-blue-600">
                        Gallery • {mediaUrls.length} images
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center space-x-4 text-sm text-gray-500 pt-2">
                  <button className="flex items-center space-x-1 hover:bg-gray-100 px-2 py-1 rounded">
                    <MessageCircle className="h-4 w-4" />
                    <span>0 Comments</span>
                  </button>
                  <button className="flex items-center space-x-1 hover:bg-gray-100 px-2 py-1 rounded">
                    <Share2 className="h-4 w-4" />
                    <span>Share</span>
                  </button>
                  <button className="flex items-center space-x-1 hover:bg-gray-100 px-2 py-1 rounded">
                    <Bookmark className="h-4 w-4" />
                    <span>Save</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Content Preview</CardTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {content.scheduledDate 
                ? format(content.scheduledDate, 'PPP \'at\' p') 
                : 'Publishing immediately'
              }
            </span>
            {content.price && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                ${content.price}
              </span>
            )}
            {content.tags.length > 0 && (
              <span className="flex items-center gap-1">
                <Tag className="h-4 w-4" />
                {content.tags.length} tags
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {content.platforms.map(platform => (
              <div key={platform} className="space-y-2">
                <h4 className="font-medium capitalize flex items-center gap-2">
                  {platform} Preview
                  <Badge variant="outline" className="text-xs">
                    {mediaUrls.length} media
                  </Badge>
                </h4>
                {renderPlatformPreview(platform)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}