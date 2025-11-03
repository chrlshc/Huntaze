'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { 
  Users, 
  UserPlus, 
  Mail, 
  MoreVertical, 
  Shield, 
  Eye, 
  Edit, 
  Crown,
  Trash2,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface Collaborator {
  id: string;
  email: string;
  name?: string;
  permission: 'owner' | 'editor' | 'viewer';
  status: 'pending' | 'accepted' | 'declined';
  addedAt: string;
}

interface CollaboratorManagerProps {
  contentId: string;
  isOwner: boolean;
  onCollaboratorsChange?: () => void;
}

export function CollaboratorManager({ 
  contentId, 
  isOwner, 
  onCollaboratorsChange 
}: CollaboratorManagerProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    permission: 'editor' as 'owner' | 'editor' | 'viewer',
    message: ''
  });
  const [inviting, setInviting] = useState(false);

  // Load collaborators
  useEffect(() => {
    loadCollaborators();
  }, [contentId]);

  const loadCollaborators = async () => {
    try {
      const response = await fetch(`/api/content/${contentId}/collaborators`);
      if (response.ok) {
        const data = await response.json();
        setCollaborators(data.collaborators);
      }
    } catch (error) {
      console.error('Error loading collaborators:', error);
      toast.error('Failed to load collaborators');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteCollaborator = async () => {
    if (!inviteForm.email.trim()) {
      toast.error('Email is required');
      return;
    }

    setInviting(true);
    try {
      const response = await fetch(`/api/content/${contentId}/collaborators`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inviteForm),
      });

      if (response.ok) {
        toast.success('Invitation sent successfully');
        setShowInviteDialog(false);
        setInviteForm({ email: '', permission: 'editor', message: '' });
        loadCollaborators();
        onCollaboratorsChange?.();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error inviting collaborator:', error);
      toast.error('Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleUpdatePermission = async (collaboratorId: string, permission: string) => {
    try {
      const response = await fetch(
        `/api/content/${contentId}/collaborators?collaboratorId=${collaboratorId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ permission }),
        }
      );

      if (response.ok) {
        toast.success('Permission updated');
        loadCollaborators();
        onCollaboratorsChange?.();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update permission');
      }
    } catch (error) {
      console.error('Error updating permission:', error);
      toast.error('Failed to update permission');
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    if (!confirm('Are you sure you want to remove this collaborator?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/content/${contentId}/collaborators?collaboratorId=${collaboratorId}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        toast.success('Collaborator removed');
        loadCollaborators();
        onCollaboratorsChange?.();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to remove collaborator');
      }
    } catch (error) {
      console.error('Error removing collaborator:', error);
      toast.error('Failed to remove collaborator');
    }
  };

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'editor':
        return <Edit className="h-4 w-4 text-blue-500" />;
      case 'viewer':
        return <Eye className="h-4 w-4 text-gray-500" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge variant="success" className="text-xs"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
      case 'pending':
        return <Badge variant="warning" className="text-xs"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'declined':
        return <Badge variant="destructive" className="text-xs"><XCircle className="h-3 w-3 mr-1" />Declined</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Collaborators</h3>
          <Badge variant="secondary">{collaborators.length}</Badge>
        </div>
        
        {isOwner && (
          <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Collaborator</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@example.com"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="permission">Permission Level</Label>
                  <Select
                    value={inviteForm.permission}
                    onValueChange={(value: 'owner' | 'editor' | 'viewer') => 
                      setInviteForm(prev => ({ ...prev, permission: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          <div>
                            <div>Viewer</div>
                            <div className="text-xs text-gray-500">Can view content</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="editor">
                        <div className="flex items-center gap-2">
                          <Edit className="h-4 w-4" />
                          <div>
                            <div>Editor</div>
                            <div className="text-xs text-gray-500">Can edit content</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="owner">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4" />
                          <div>
                            <div>Owner</div>
                            <div className="text-xs text-gray-500">Full access</div>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="message">Personal Message (Optional)</Label>
                  <Textarea
                    id="message"
                    placeholder="Add a personal note to your invitation..."
                    value={inviteForm.message}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, message: e.target.value }))}
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowInviteDialog(false)}
                    disabled={inviting}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleInviteCollaborator} disabled={inviting}>
                    {inviting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Invitation
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-2">
        {collaborators.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No collaborators yet</p>
            {isOwner && (
              <p className="text-sm">Invite team members to collaborate on this content</p>
            )}
          </div>
        ) : (
          collaborators.map((collaborator) => (
            <div
              key={collaborator.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${collaborator.email}`} />
                  <AvatarFallback>
                    {collaborator.name?.charAt(0) || collaborator.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {collaborator.name || collaborator.email}
                    </span>
                    {getStatusBadge(collaborator.status)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    {getPermissionIcon(collaborator.permission)}
                    <span className="capitalize">{collaborator.permission}</span>
                    <span>•</span>
                    <span>Added {new Date(collaborator.addedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {isOwner && collaborator.permission !== 'owner' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleUpdatePermission(collaborator.id, 'viewer')}
                      disabled={collaborator.permission === 'viewer'}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Make Viewer
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleUpdatePermission(collaborator.id, 'editor')}
                      disabled={collaborator.permission === 'editor'}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Make Editor
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleUpdatePermission(collaborator.id, 'owner')}
                      disabled={collaborator.permission === 'owner'}
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      Make Owner
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleRemoveCollaborator(collaborator.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}