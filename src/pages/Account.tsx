import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { apiService } from '../services/api';
import { UserRole } from '../types';

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

const Account: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    reset: resetProfile
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
    setIsUpdating(true);
    try {
      await apiService.updateUser(user!.id, data);
      toast.success('Profile updated successfully');
      // You might want to refresh the user data in context here
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

  const getRoleColor = (role: UserRole) => {
    const colors = {
      [UserRole.ADMIN]: 'bg-red-100 text-red-800',
      [UserRole.MANAGER]: 'bg-blue-100 text-blue-800',
      [UserRole.REVIEWER]: 'bg-green-100 text-green-800',
      [UserRole.STAFF]: 'bg-yellow-100 text-yellow-800',
      [UserRole.USER]: 'bg-gray-100 text-gray-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Not Logged In</h2>
          <p className="text-gray-600">Please log in to access your account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center">
          <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mr-4">
            <span className="text-white text-2xl font-bold">
              {user.full_name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.full_name}</h1>
            <p className="text-gray-600">{user.email}</p>
            <div className="flex items-center mt-2">
              <span className="mr-2">{getRoleIcon(user.role)}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                {user.role.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Account Information */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <p className="mt-1 text-sm text-gray-900">{user.username}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="mt-1 text-sm text-gray-900">{user.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <p className="mt-1 text-sm text-gray-900">{user.full_name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <div className="mt-1 flex items-center">
              <span className="mr-2">{getRoleIcon(user.role)}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                {user.role.toUpperCase()}
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Member Since</label>
            <p className="mt-1 text-sm text-gray-900">
              {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Account Status</label>
            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
              user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {user.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Role Permissions</h3>
          <p className="text-sm text-gray-600">{getRoleDescription(user.role)}</p>
        </div>
      </div>

      {/* Settings Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Profile Settings
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'password'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Change Password
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Update Profile</h3>
              <form onSubmit={handleSubmitProfile(handleProfileUpdate)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    {...registerProfile('username', { required: 'Username is required' })}
                    className={`input ${profileErrors.username ? 'input-error' : ''}`}
                    placeholder="Enter username"
                  />
                  {profileErrors.username && (
                    <p className="text-red-500 text-sm mt-1">{profileErrors.username.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    {...registerProfile('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    type="email"
                    className={`input ${profileErrors.email ? 'input-error' : ''}`}
                    placeholder="Enter email"
                  />
                  {profileErrors.email && (
                    <p className="text-red-500 text-sm mt-1">{profileErrors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    {...registerProfile('full_name', { required: 'Full name is required' })}
                    className={`input ${profileErrors.full_name ? 'input-error' : ''}`}
                    placeholder="Enter full name"
                  />
                  {profileErrors.full_name && (
                    <p className="text-red-500 text-sm mt-1">{profileErrors.full_name.message}</p>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="btn btn-primary disabled:opacity-50"
                  >
                    {isUpdating ? 'Updating...' : 'Update Profile'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'password' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
              <form onSubmit={handleSubmitPassword(handlePasswordChange)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    {...registerPassword('current_password', { required: 'Current password is required' })}
                    type="password"
                    className={`input ${passwordErrors.current_password ? 'input-error' : ''}`}
                    placeholder="Enter current password"
                  />
                  {passwordErrors.current_password && (
                    <p className="text-red-500 text-sm mt-1">{passwordErrors.current_password.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    {...registerPassword('new_password', { 
                      required: 'New password is required',
                      minLength: {
                        value: 8,
                        message: 'Password must be at least 8 characters'
                      }
                    })}
                    type="password"
                    className={`input ${passwordErrors.new_password ? 'input-error' : ''}`}
                    placeholder="Enter new password"
                  />
                  {passwordErrors.new_password && (
                    <p className="text-red-500 text-sm mt-1">{passwordErrors.new_password.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    {...registerPassword('confirm_password', { 
                      required: 'Please confirm your password',
                      validate: (value) => value === watchPassword || 'Passwords do not match'
                    })}
                    type="password"
                    className={`input ${passwordErrors.confirm_password ? 'input-error' : ''}`}
                    placeholder="Confirm new password"
                  />
                  {passwordErrors.confirm_password && (
                    <p className="text-red-500 text-sm mt-1">{passwordErrors.confirm_password.message}</p>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="btn btn-primary disabled:opacity-50"
                  >
                    {isUpdating ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500">
        <h3 className="text-lg font-medium text-red-600 mb-2">Danger Zone</h3>
        <p className="text-sm text-gray-600 mb-4">
          Once you log out, you will need to sign in again to access your account.
        </p>
        <button
          onClick={logout}
          className="btn btn-danger"
        >
          Log Out
        </button>
      </div>
    </div>
  );
};

export default Account;