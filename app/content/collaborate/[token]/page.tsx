'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { 
  Users, 
  Mail, 
  CheckCircle, 
  XCircle, 
  Clock,
  FileText,
  Crown,
  Edit,
  Eye,
  AlertCircle
} from 'lucide-react';

interface InvitationDetails {
  id: string;
  contentTitle: string;
  contentType: string;
  inviterName: string;
  inviterEmail: string;
  permission: 'owner' | 'editor' | 'viewer';
  message?: string;
  createdAt: string;
}

export default function CollaborationInvitePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = params.token as string;

  useEffect(() => {
    if (token) {
      loadInvitation();
    }
  }, [token]);

  const loadInvitation = async () => {
    try {
      const response = await fetch(`/api/content/collaborate/${token}`);
      const data = await response.json();

      if (response.ok) {
        setInvitation(data.invitation);
      } else {
        setError(data.error || 'Invalid invitation');
      }
    } catch (error) {
      console.error('Error loading invitation:', error);
      setError('Failed to load invitation details');
    } finally {
      setLoading(false);
    }
  };

  const handleInvitationResponse = async (action: 'accept' | 'decline') => {
    if (status !== 'authenticated') {
      toast.error('Please sign in to respond to this invitation');
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(`/api/content/collaborate/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (response.ok) {
        if (action === 'accept') {
          toast.success('Invitation accepted! Redirecting to content...');
          setTimeout(() => {
            router.push(data.redirectUrl || '/content');
          }, 1500);
        } else {
          toast.success('Invitation declined');
          setTimeout(() => {
            router.push('/content');
          }, 1500);
        }
      } else {
        toast.error(data.error || `Failed to ${action} invitation`);
      }
    } catch (error) {
      console.error(`Error ${action}ing invitation:`, error);
      toast.error(`Failed to ${action} invitation`);
    } finally {
      setProcessing(false);
    }
  };

  const getPermissionDetails = (permission: string) => {
    switch (permission) {
      case 'owner':
        return {
          icon: <Crown className="h-5 w-5 text-yellow-500" />,
          label: 'Owner',
          description: 'Full access to edit, share, and manage this content'
        };
      case 'editor':
        return {
          icon: <Edit className="h-5 w-5 text-blue-500" />,
          label: 'Editor',
          description: 'Can edit and modify this content'
        };
      case 'viewer':
        return {
          icon: <Eye className="h-5 w-5 text-gray-500" />,
          label: 'Viewer',
          description: 'Can view this content but not make changes'
        };
      default:
        return {
          icon: <Users className="h-5 w-5" />,
          label: permission,
          description: 'Collaborate on this content'
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Invalid Invitation</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => router.push('/content')}>
                Go to Content
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  const permissionDetails = getPermissionDetails(invitation.permission);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">You've been invited to collaborate!</CardTitle>
          <CardDescription>
            {invitation.inviterName} has invited you to collaborate on their content
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Inviter Info */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <Avatar className="h-12 w-12">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${invitation.inviterEmail}`} />
              <AvatarFallback>
                {invitation.inviterName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{invitation.inviterName}</h3>
              <p className="text-sm text-gray-600">{invitation.inviterEmail}</p>
            </div>
          </div>

          {/* Content Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-gray-500" />
              <div>
                <h4 className="font-medium">{invitation.contentTitle}</h4>
                <p className="text-sm text-gray-600 capitalize">{invitation.contentType} content</p>
              </div>
            </div>

            {/* Permission Level */}
            <div className="flex items-center gap-3">
              {permissionDetails.icon}
              <div>
                <h4 className="font-medium">{permissionDetails.label} Access</h4>
                <p className="text-sm text-gray-600">{permissionDetails.description}</p>
              </div>
            </div>

            {/* Invitation Date */}
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-gray-500" />
              <div>
                <h4 className="font-medium">Invited</h4>
                <p className="text-sm text-gray-600">
                  {new Date(invitation.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Personal Message */}
          {invitation.message && (
            <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
              <div className="flex items-start gap-2">
                <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Personal Message</h4>
                  <p className="text-blue-800 mt-1">{invitation.message}</p>
                </div>
              </div>
            </div>
          )}

          {/* Authentication Check */}
          {status !== 'authenticated' ? (
            <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
              <p className="text-yellow-800 mb-3">
                Please sign in to respond to this invitation
              </p>
              <Button onClick={() => router.push('/auth/login')}>
                Sign In
              </Button>
            </div>
          ) : (
            /* Action Buttons */
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => handleInvitationResponse('accept')}
                disabled={processing}
                className="flex-1"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Accept Invitation
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleInvitationResponse('decline')}
                disabled={processing}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Decline
              </Button>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 pt-4 border-t">
            This invitation will expire in 7 days from when it was sent.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}