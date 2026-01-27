"use client";

/**
 * UsersClient.tsx
 *
 * Client-side component responsible for rendering the user management UI.
 * - Receives `initialUser` from the server wrapper (UsersPage) so we can do a server-authoritative auth check quickly.
 * - Falls back to fetching current user via `apiService.getCurrentUser()` when `initialUser` isn't provided.
 * - Only admin users can use this component: non-admins see Access Denied UI.
 *
 * Note: This component uses the existing `apiService` for all requests so behavior is consistent with the rest of the app.
 */

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { apiService } from "@/services/api";
import { toast } from "sonner";
import type { CreateUserData, User as BackendUser } from "@/types";
import { UserRole } from "@/types";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@vision_dashboard/ui/card";
import { Button } from "@vision_dashboard/ui/button";
import { Input } from "@vision_dashboard/ui/input";
import { Label } from "@vision_dashboard/ui/label";
import { Badge } from "@vision_dashboard/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@vision_dashboard/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@vision_dashboard/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@vision_dashboard/ui/select";
import { Spinner } from "@vision_dashboard/ui/spinner";
import { Plus, Pencil, Trash2, Users, Shield } from "lucide-react";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function UsersClient({ initialUser }: { initialUser?: SessionUser | null }) {
  // Session user (comes from server wrapper or fetched)
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(initialUser ?? null);

  // Users list and UI state
  const [users, setUsers] = useState<BackendUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<BackendUser | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<BackendUser | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CreateUserData>();

  const selectedRole = watch("role");

  // Normalize a role for safe comparison (server session may use 'admin' lower-case).
  const isAdmin = (role?: string) => {
    if (!role) return false;
    return String(role).toUpperCase() === String(UserRole.ADMIN).toUpperCase();
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      setLoading(true);

      // If we don't have a session from the server, try fetching it client-side.
      let session = currentUser;
      if (!session) {
        try {
          const me = await apiService.getCurrentUser();
          session = {
            id: String((me as any).id),
            email: (me as any).email,
            name: (me as any).full_name || (me as any).name || (me as any).username,
            role: (me as any).role,
          };
          if (mounted) setCurrentUser(session);
        } catch (err) {
          // Not authenticated or API failed - bail out (server wrapper should normally handle redirect)
          if (mounted) {
            setLoading(false);
          }
          return;
        }
      }

      // Check admin permissions
      if (!isAdmin(session.role)) {
        if (mounted) {
          setLoading(false);
        }
        return;
      }

      // Load users
      try {
        const data = await apiService.getUsers();
        if (mounted) setUsers(data);
      } catch (err) {
        toast.error("Failed to load users");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUser]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await apiService.getUsers();
      setUsers(data);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (data: CreateUserData) => {
    setSubmitting(true);
    try {
      await apiService.createUser(data);
      toast.success("User created successfully");
      setShowAddModal(false);
      reset();
      await loadUsers();
    } catch {
      toast.error("Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUser = async (data: CreateUserData) => {
    if (!editingUser) return;

    setSubmitting(true);
    try {
      const { password, ...updateData } = data as any; // don't include password on update
      await apiService.updateUser(editingUser.id as any, updateData);
      toast.success("User updated successfully");
      setEditingUser(null);
      reset();
      await loadUsers();
    } catch {
      toast.error("Failed to update user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (user: BackendUser) => {
    setSubmitting(true);
    try {
      await apiService.deleteUser(user.id as any);
      toast.success("User deleted successfully");
      setShowDeleteModal(null);
      await loadUsers();
    } catch {
      toast.error("Failed to delete user");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (user: BackendUser) => {
    setEditingUser(user);
    setValue("username", (user as any).username);
    setValue("email", (user as any).email);
    setValue("full_name", (user as any).full_name);
    setValue("role", user.role as any);
    // we intentionally don't set password
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingUser(null);
    reset();
  };

  const getRoleColor = (role: string) => {
    const r = String(role).toUpperCase();
    const colors: Record<string, "destructive" | "default" | "secondary" | "outline"> = {
      [String(UserRole.ADMIN).toUpperCase()]: "destructive",
      [String(UserRole.WORKER).toUpperCase()]: "default",
    };
    return colors[r] || "outline";
  };

  const getRoleIcon = (role: string) => {
    const r = String(role).toUpperCase();
    const map: Record<string, React.ReactNode> = {
      [String(UserRole.ADMIN).toUpperCase()]: <Shield className="h-4 w-4" />,
      [String(UserRole.WORKER).toUpperCase()]: <Users className="h-4 w-4" />,
    };
    return map[r] || <Users className="h-4 w-4" />;
  };

  const getRoleDescription = (role: string) => {
    const r = String(role).toUpperCase();
    const descriptions: Record<string, string> = {
      [String(UserRole.ADMIN).toUpperCase()]: "Full system access and user management",
      [String(UserRole.WORKER).toUpperCase()]: "View dashboard, review detections, and monitor cameras",
    };
    return descriptions[r] || "Basic system access";
  };

  // Render Access Denied if we have a session but the user is not admin
  if (currentUser && !isAdmin(currentUser.role)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You don't have permission to access this page. Admin privileges are required.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage system users and their roles</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} disabled={!isAdmin(currentUser?.role)}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground font-medium">
                          {String(user.full_name || user.username || "").charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{user.full_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {user.username} &bull; {user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getRoleIcon(user.role)}
                      <Badge variant={getRoleColor(user.role)}>{String(user.role).toUpperCase()}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? "default" : "destructive"}>
                      {user.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.created_at ? format(new Date(user.created_at), "MMM dd, yyyy") : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(user)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {String(user.id) !== String(currentUser?.id) && (
                        <Button variant="ghost" size="sm" onClick={() => setShowDeleteModal(user)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <div className="py-8 text-center text-muted-foreground">No users found</div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {Object.values(UserRole).map((role) => {
          // role here may be a runtime enum key or value depending on build; coerce to string
          const roleStr = String(role);
          const count = users.filter((u) => String(u.role).toUpperCase() === roleStr.toUpperCase()).length;
          return (
            <Card key={roleStr}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">{getRoleIcon(roleStr)}</div>
                  <div>
                    <p className="text-sm text-muted-foreground capitalize">{roleStr.toLowerCase()}s</p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add/Edit User Modal */}
      <Dialog open={showAddModal || !!editingUser} onOpenChange={closeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSubmit(editingUser ? handleEditUser : handleAddUser)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" {...register("username", { required: "Username is required" })} placeholder="Enter username" />
              {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
                placeholder="Enter email"
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input id="full_name" {...register("full_name", { required: "Full name is required" })} placeholder="Enter full name" />
              {errors.full_name && <p className="text-sm text-destructive">{errors.full_name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={selectedRole ?? ""} onValueChange={(value) => setValue("role", value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(UserRole).map((role) => (
                    <SelectItem key={String(role)} value={String(role)}>
                      <div className="flex items-center gap-2">
                        {getRoleIcon(String(role))}
                        <span className="capitalize">{String(role).toLowerCase()}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedRole && <p className="text-sm text-muted-foreground">{getRoleDescription(selectedRole)}</p>}
              {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
            </div>

            {!editingUser && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...register("password", {
                    required: "Password is required",
                    minLength: { value: 6, message: "Password must be at least 6 characters" },
                  })}
                  placeholder="Enter password"
                />
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Spinner className="h-4 w-4 mr-2" /> : null}
                {editingUser ? "Update" : "Create"} User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!showDeleteModal} onOpenChange={() => setShowDeleteModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to delete &quot;{showDeleteModal?.full_name}&quot;? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => showDeleteModal && handleDeleteUser(showDeleteModal)} disabled={submitting}>
              {submitting ? <Spinner className="h-4 w-4 mr-2" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
