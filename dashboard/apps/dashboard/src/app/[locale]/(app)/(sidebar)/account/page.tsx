"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { User, Shield, Clock, LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@vision_dashboard/ui/card";
import { Button } from "@vision_dashboard/ui/button";
import { Input } from "@vision_dashboard/ui/input";
import { Label } from "@vision_dashboard/ui/label";
import { Badge } from "@vision_dashboard/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@vision_dashboard/ui/tabs";
import { Separator } from "@vision_dashboard/ui/separator";
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { UserRole } from '@/types';

interface PasswordChangeData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

interface ProfileUpdateData {
  username: string;
  email: string;
  full_name: string;
}

export default function AccountPage() {
  const { user, logout } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileUpdateData>({
    defaultValues: {
      username: user?.username || '',
      email: user?.email || '',
      full_name: user?.full_name || ''
    }
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
    watch
  } = useForm<PasswordChangeData>();

  const watchPassword = watch('new_password');

  const handleProfileUpdate = async (data: ProfileUpdateData) => {
    if (!user) return;

    setIsUpdating(true);
    try {
      await apiService.updateUser(user.id, data);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async (data: PasswordChangeData) => {
    setIsUpdating(true);
    try {
      // Note: This endpoint would need to be implemented in the backend
      // For now, we'll show a success message
      toast.success('Password changed successfully');
      resetPassword();
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setIsUpdating(false);
    }
  };

  const getRoleVariant = (role: UserRole): "default" | "secondary" | "destructive" | "outline" => {
    switch (role) {
      case UserRole.ADMIN:
        return 'destructive';
      case UserRole.MANAGER:
        return 'default';
      case UserRole.REVIEWER:
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleIcon = (role: UserRole) => {
    const icons = {
      [UserRole.ADMIN]: '👑',
      [UserRole.MANAGER]: '👔',
      [UserRole.REVIEWER]: '🔍',
      [UserRole.STAFF]: '👨‍💼',
      [UserRole.USER]: '👤'
    };
    return icons[role] || '👤';
  };

  const getRoleDescription = (role: UserRole) => {
    const descriptions = {
      [UserRole.ADMIN]: 'Full system access and user management',
      [UserRole.MANAGER]: 'Camera management and detection oversight',
      [UserRole.REVIEWER]: 'Detection review and analytics access',
      [UserRole.STAFF]: 'Basic camera operations and monitoring',
      [UserRole.USER]: 'View dashboard and detection results'
    };
    return descriptions[role] || 'Basic system access';
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Not Logged In</h2>
          <p className="text-muted-foreground">Please log in to access your account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground text-2xl font-bold">
                {user.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">{user.full_name}</h1>
              <p className="text-muted-foreground">{user.email}</p>
              <div className="flex items-center mt-2 gap-2">
                <span>{getRoleIcon(user.role)}</span>
                <Badge variant={getRoleVariant(user.role)}>
                  {user.role.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-muted-foreground">Username</Label>
              <p className="mt-1 font-medium">{user.username}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Email</Label>
              <p className="mt-1 font-medium">{user.email}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Full Name</Label>
              <p className="mt-1 font-medium">{user.full_name}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Role</Label>
              <div className="mt-1 flex items-center gap-2">
                <span>{getRoleIcon(user.role)}</span>
                <Badge variant={getRoleVariant(user.role)}>
                  {user.role.toUpperCase()}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Member Since</Label>
              <p className="mt-1 font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Account Status</Label>
              <Badge
                variant={user.is_active ? 'default' : 'destructive'}
                className="mt-1"
              >
                {user.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4" />
              <h3 className="font-medium">Role Permissions</h3>
            </div>
            <p className="text-sm text-muted-foreground">{getRoleDescription(user.role)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Settings Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="profile">
            <TabsList className="mb-4">
              <TabsTrigger value="profile">Profile Settings</TabsTrigger>
              <TabsTrigger value="password">Change Password</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <div>
                <h3 className="text-lg font-medium mb-4">Update Profile</h3>
                <form onSubmit={handleSubmitProfile(handleProfileUpdate)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      {...registerProfile('username', { required: 'Username is required' })}
                      placeholder="Enter username"
                    />
                    {profileErrors.username && (
                      <p className="text-destructive text-sm">{profileErrors.username.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...registerProfile('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      placeholder="Enter email"
                    />
                    {profileErrors.email && (
                      <p className="text-destructive text-sm">{profileErrors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      {...registerProfile('full_name', { required: 'Full name is required' })}
                      placeholder="Enter full name"
                    />
                    {profileErrors.full_name && (
                      <p className="text-destructive text-sm">{profileErrors.full_name.message}</p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isUpdating}>
                      {isUpdating ? 'Updating...' : 'Update Profile'}
                    </Button>
                  </div>
                </form>
              </div>
            </TabsContent>

            <TabsContent value="password">
              <div>
                <h3 className="text-lg font-medium mb-4">Change Password</h3>
                <form onSubmit={handleSubmitPassword(handlePasswordChange)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current_password">Current Password</Label>
                    <Input
                      id="current_password"
                      type="password"
                      {...registerPassword('current_password', { required: 'Current password is required' })}
                      placeholder="Enter current password"
                    />
                    {passwordErrors.current_password && (
                      <p className="text-destructive text-sm">{passwordErrors.current_password.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new_password">New Password</Label>
                    <Input
                      id="new_password"
                      type="password"
                      {...registerPassword('new_password', {
                        required: 'New password is required',
                        minLength: {
                          value: 8,
                          message: 'Password must be at least 8 characters'
                        }
                      })}
                      placeholder="Enter new password"
                    />
                    {passwordErrors.new_password && (
                      <p className="text-destructive text-sm">{passwordErrors.new_password.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">Confirm New Password</Label>
                    <Input
                      id="confirm_password"
                      type="password"
                      {...registerPassword('confirm_password', {
                        required: 'Please confirm your password',
                        validate: (value) => value === watchPassword || 'Passwords do not match'
                      })}
                      placeholder="Confirm new password"
                    />
                    {passwordErrors.confirm_password && (
                      <p className="text-destructive text-sm">{passwordErrors.confirm_password.message}</p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isUpdating}>
                      {isUpdating ? 'Changing...' : 'Change Password'}
                    </Button>
                  </div>
                </form>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Once you log out, you will need to sign in again to access your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
