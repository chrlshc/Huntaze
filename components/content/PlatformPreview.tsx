'use client';

import { useState, useEffect } from 'react';
import { platformOptimizerService } from '@/lib/services/platformOptimizerService';
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';

interface PlatformPreviewProps {
  platforms: string[];
  content: {
    text?: string;
    imageUrl?: string;
    videoUrl?: string;
    imageWidth?: number;
    imageHeight?: number;
  };
  userName?: string;
  userAvatar?: string;
}

export default function PlatformPreview({ platforms, content, userName = 'User', userAvatar }: PlatformPreviewProps) {
  const [validationResults, setValidationResults] = useState<Record<string, any>>({});
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile');
  const [selectedPlatform, setSelectedPlatform] = useState<string>(platforms[0] || '');

  useEffect(() => {
    const hashtagCount = (content.text?.match(/#\w+/g) || []).length;
    const results = platformOptimizerService.validateMultiplePlatforms(platforms, {
      text: content.text,
      hashtagCount,
      imageSize: content.imageWidth && content.imageHeight ? (content.imageWidth * content.imageHeight * 3) : undefined
    });
    setValidationResults(results);
  }, [platforms, content]);

  const renderPlatformSpecificPreview = (platform: string, result: any) => {
    const displayText = result.optimizedText || content.text || '';
    
    switch (platform.toLowerCase()) {
      case 'instagram':
        return (
          <div className={`bg-white rounded-lg overflow-hidden ${viewMode === 'mobile' ? 'max-w-sm' : 'max-w-2xl'}`}>
            {/* Instagram Header */}
            <div className="flex items-center gap-3 p-3 border-b">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-0.5">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                  {userAvatar ? <img src={userAvatar} alt={userName} className="w-full h-full rounded-full" /> : <span className="text-xs">👤</span>}
                </div>
              </div>
              <span className="font-semibold text-sm">{userName}</span>
            </div>
            {/* Instagram Image/Video */}
            {content.imageUrl && <img src={content.imageUrl} alt="Post" className="w-full aspect-square object-cover" />}
            {content.videoUrl && <video src={content.videoUrl} className="w-full aspect-square object-cover" controls />}
            {/* Instagram Actions */}
            <div className="p-3">
              <div className="flex gap-4 mb-2">
                <span className="text-2xl">❤️</span>
                <span className="text-2xl">💬</span>
                <span className="text-2xl">📤</span>
              </div>
              <p className="text-sm"><span className="font-semibold">{userName}</span> {displayText}</p>
            </div>
          </div>
        );
      
      case 'twitter':
        return (
          <div className={`bg-white rounded-lg border overflow-hidden ${viewMode === 'mobile' ? 'max-w-sm' : 'max-w-2xl'}`}>
            <div className="p-4">
              <div className="flex gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  {userAvatar ? <img src={userAvatar} alt={userName} className="w-full h-full rounded-full" /> : <span>👤</span>}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold">{userName}</span>
                    <span className="text-gray-500 text-sm">@{userName.toLowerCase().replace(/\s/g, '')}</span>
                    <span className="text-gray-500 text-sm">· now</span>
                  </div>
                  <p className="text-sm mb-3 whitespace-pre-wrap">{displayText}</p>
                  {content.imageUrl && <img src={content.imageUrl} alt="Tweet" className="w-full rounded-2xl border" />}
                  {content.videoUrl && <video src={content.videoUrl} className="w-full rounded-2xl border" controls />}
                  <div className="flex justify-between mt-3 text-gray-500 text-sm">
                    <span>💬</span>
                    <span>🔁</span>
                    <span>❤️</span>
                    <span>📊</span>
                    <span>📤</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'tiktok':
        return (
          <div className={`bg-black rounded-lg overflow-hidden ${viewMode === 'mobile' ? 'max-w-sm aspect-[9/16]' : 'max-w-md aspect-[9/16]'}`}>
            <div className="relative h-full">
              {content.videoUrl ? (
                <video src={content.videoUrl} className="w-full h-full object-cover" controls />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                  <span className="text-white text-4xl">🎵</span>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    {userAvatar ? <img src={userAvatar} alt={userName} className="w-full h-full rounded-full" /> : <span>👤</span>}
                  </div>
                  <span className="text-white font-semibold">@{userName.toLowerCase().replace(/\s/g, '')}</span>
                </div>
                <p className="text-white text-sm">{displayText}</p>
              </div>
            </div>
          </div>
        );
      
      case 'facebook':
        return (
          <div className={`bg-white rounded-lg border overflow-hidden ${viewMode === 'mobile' ? 'max-w-sm' : 'max-w-2xl'}`}>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  {userAvatar ? <img src={userAvatar} alt={userName} className="w-full h-full rounded-full" /> : <span>👤</span>}
                </div>
                <div>
                  <div className="font-semibold text-sm">{userName}</div>
                  <div className="text-xs text-gray-500">Just now · 🌎</div>
                </div>
              </div>
              <p className="text-sm mb-3 whitespace-pre-wrap">{displayText}</p>
            </div>
            {content.imageUrl && <img src={content.imageUrl} alt="Post" className="w-full" />}
            {content.videoUrl && <video src={content.videoUrl} className="w-full" controls />}
            <div className="p-2 border-t flex justify-around text-gray-600 text-sm">
              <button className="px-3 py-1 hover:bg-gray-100 rounded">👍 Like</button>
              <button className="px-3 py-1 hover:bg-gray-100 rounded">💬 Comment</button>
              <button className="px-3 py-1 hover:bg-gray-100 rounded">📤 Share</button>
            </div>
          </div>
        );
      
      case 'linkedin':
        return (
          <div className={`bg-white rounded-lg border overflow-hidden ${viewMode === 'mobile' ? 'max-w-sm' : 'max-w-2xl'}`}>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                  {userAvatar ? <img src={userAvatar} alt={userName} className="w-full h-full rounded-full" /> : userName.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-sm">{userName}</div>
                  <div className="text-xs text-gray-500">Professional Title</div>
                  <div className="text-xs text-gray-500">Just now · 🌐</div>
                </div>
              </div>
              <p className="text-sm mb-3 whitespace-pre-wrap">{displayText}</p>
            </div>
            {content.imageUrl && <img src={content.imageUrl} alt="Post" className="w-full" />}
            {content.videoUrl && <video src={content.videoUrl} className="w-full" controls />}
            <div className="p-2 border-t flex justify-around text-gray-600 text-sm">
              <button className="px-3 py-1 hover:bg-gray-100 rounded">👍 Like</button>
              <button className="px-3 py-1 hover:bg-gray-100 rounded">💬 Comment</button>
              <button className="px-3 py-1 hover:bg-gray-100 rounded">🔁 Repost</button>
              <button className="px-3 py-1 hover:bg-gray-100 rounded">📤 Send</button>
            </div>
          </div>
        );
      
      default:
        return (
          <Card className="bg-white rounded-lg border p-4">
            <p className="text-sm whitespace-pre-wrap">{displayText}</p>
            {content.imageUrl && <img src={content.imageUrl} alt="Preview" className="w-full rounded mt-3" />}
            {content.videoUrl && <video src={content.videoUrl} className="w-full rounded mt-3" controls />}
          </Card>
        );
    }
  };

  return (
    <div className="border rounded-lg p-6 bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Platform Previews</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('mobile')}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${viewMode === 'mobile' ? 'bg-blue-600 text-white' : 'bg-white border hover:bg-gray-50'}`}
          >
            📱 Mobile
          </button>
          <button
            onClick={() => setViewMode('desktop')}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${viewMode === 'desktop' ? 'bg-blue-600 text-white' : 'bg-white border hover:bg-gray-50'}`}
          >
            💻 Desktop
          </button>
        </div>
      </div>

      {/* Platform Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {platforms.map(platform => {
          const result = validationResults[platform];
          const hasErrors = result?.warnings?.some((w: any) => w.type === 'error');
          const hasWarnings = result?.warnings?.some((w: any) => w.type === 'warning');
          
          return (
            <button
              key={platform}
              onClick={() => setSelectedPlatform(platform)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedPlatform === platform
                  ? 'bg-white shadow-sm border-2 border-blue-500'
                  : 'bg-white border hover:bg-gray-50'
              }`}
            >
              <span className="capitalize">{platform}</span>
              {hasErrors && <span className="ml-2 text-red-500">●</span>}
              {!hasErrors && hasWarnings && <span className="ml-2 text-yellow-500">●</span>}
              {!hasErrors && !hasWarnings && result && <span className="ml-2 text-green-500">●</span>}
            </button>
          );
        })}
      </div>

      {/* Selected Platform Preview */}
      {selectedPlatform && validationResults[selectedPlatform] && (
        <div className="space-y-4">
          {/* Preview Area */}
          <div className="flex justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg p-8">
            {renderPlatformSpecificPreview(selectedPlatform, validationResults[selectedPlatform])}
          </div>

          {/* Validation Status */}
          <Card className="bg-white rounded-lg p-4 border">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">Validation Status</h4>
              {validationResults[selectedPlatform].isValid ? (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  ✓ All checks passed
                </span>
              ) : (
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                  ✗ Issues found
                </span>
              )}
            </div>

            {/* Warnings and Errors */}
            {validationResults[selectedPlatform].warnings && validationResults[selectedPlatform].warnings.length > 0 && (
              <div className="space-y-2 mb-3">
                {validationResults[selectedPlatform].warnings.map((warning: any, idx: number) => (
                  <div 
                    key={idx} 
                    className={`flex items-start gap-2 p-3 rounded-lg ${
                      warning.type === 'error' 
                        ? 'bg-red-50 border border-red-200' 
                        : 'bg-yellow-50 border border-yellow-200'
                    }`}
                  >
                    <span className="text-lg">{warning.type === 'error' ? '❌' : '⚠️'}</span>
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${warning.type === 'error' ? 'text-red-800' : 'text-yellow-800'}`}>
                        {warning.field.charAt(0).toUpperCase() + warning.field.slice(1)} Issue
                      </div>
                      <div className={`text-sm ${warning.type === 'error' ? 'text-red-700' : 'text-yellow-700'}`}>
                        {warning.message}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Suggestions */}
            {validationResults[selectedPlatform].suggestedChanges && validationResults[selectedPlatform].suggestedChanges.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">💡 Suggestions:</div>
                {validationResults[selectedPlatform].suggestedChanges.map((suggestion: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <span className="text-blue-600 text-sm">{suggestion}</span>
                  </div>
                ))}
              </div>
            )}

            {/* No Issues */}
            {(!validationResults[selectedPlatform].warnings || validationResults[selectedPlatform].warnings.length === 0) && 
             (!validationResults[selectedPlatform].suggestedChanges || validationResults[selectedPlatform].suggestedChanges.length === 0) && (
              <div className="text-center py-4 text-gray-500 text-sm">
                ✨ Your content meets all requirements for {selectedPlatform}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
