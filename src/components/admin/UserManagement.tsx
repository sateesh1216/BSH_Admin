import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Shield, Users, Trash2, KeyRound, Eye, Pause, Play } from 'lucide-react';
import { detectEmailTypo } from '@/utils/emailValidation';
import { format } from 'date-fns';

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(1, 'Full name is required'),
  role: z.enum(['admin', 'user']),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  role: 'admin' | 'driver1' | 'driver2' | 'driver3' | null;
  created_at: string | null;
  status: string | null;
}

export const UserManagement = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [viewingUser, setViewingUser] = useState<Profile | null>(null);
  
  // Edit form state for viewing user
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'user'>('user');
  
  const queryClient = useQueryClient();

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      password: '',
      fullName: '',
      role: 'user',
    },
  });

  // Helper to map UI role to database role
  const mapRoleToDb = (role: string): 'admin' | 'driver1' | 'driver2' | 'driver3' => {
    return role === 'admin' ? 'admin' : 'driver1';
  };

  // Helper to display role (merge driver1/2/3 as "User")
  const displayRole = (role: string | null): string => {
    if (role === 'admin') return 'Admin';
    return 'User';
  };

  // Helper to get UI role from db role
  const getUiRole = (role: string | null): 'admin' | 'user' => {
    return role === 'admin' ? 'admin' : 'user';
  };

  // Fetch all users
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Profile[];
    },
  });

  // Fetch user's trips data when viewing a user
  const { data: userTrips, isLoading: isLoadingTrips } = useQuery({
    queryKey: ['user-trips', viewingUser?.id],
    queryFn: async () => {
      if (!viewingUser) return null;
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('created_by', viewingUser.id)
        .order('date', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: !!viewingUser,
  });

  // Fetch user's maintenance data when viewing a user
  const { data: userMaintenance, isLoading: isLoadingMaintenance } = useQuery({
    queryKey: ['user-maintenance', viewingUser?.id],
    queryFn: async () => {
      if (!viewingUser) return null;
      const { data, error } = await supabase
        .from('maintenance')
        .select('*')
        .eq('created_by', viewingUser.id)
        .order('date', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: !!viewingUser,
  });

  // Fetch user's login history when viewing a user
  const { data: userLoginHistory, isLoading: isLoadingLoginHistory } = useQuery({
    queryKey: ['user-login-history', viewingUser?.id],
    queryFn: async () => {
      if (!viewingUser) return null;
      const { data, error } = await supabase
        .from('login_history')
        .select('*')
        .eq('user_id', viewingUser.id)
        .order('login_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    enabled: !!viewingUser,
  });

  // Create new user mutation - calls edge function
  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserFormData) => {
      const suggestion = detectEmailTypo(data.email);
      if (suggestion) {
        throw new Error(`Did you mean ${suggestion}? The domain appears to have a typo.`);
      }

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('You must be logged in to create users');
      }

      const response = await fetch(
        'https://hecnhsynlpachotmpmjg.supabase.co/functions/v1/admin-create-user',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionData.session.access_token}`,
          },
          body: JSON.stringify({
            email: data.email,
            password: data.password,
            fullName: data.fullName,
            role: mapRoleToDb(data.role),
          }),
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user');
      }

      return result;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User account created successfully! They can now log in immediately.",
      });
      form.reset();
      setIsCreateDialogOpen(false);
      setEmailSuggestion(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('You must be logged in to delete users');
      }

      const response = await fetch(
        'https://hecnhsynlpachotmpmjg.supabase.co/functions/v1/admin-delete-user',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionData.session.access_token}`,
          },
          body: JSON.stringify({ userId }),
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete user');
      }

      return result;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('You must be logged in to reset passwords');
      }

      const response = await fetch(
        'https://hecnhsynlpachotmpmjg.supabase.co/functions/v1/admin-reset-password',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionData.session.access_token}`,
          },
          body: JSON.stringify({ userId, newPassword }),
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset password');
      }

      return result;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Password reset successfully!",
      });
      setResetPasswordUserId(null);
      setNewPassword('');
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update user profile mutation (name, role)
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, fullName, role }: { userId: string; fullName: string; role: string }) => {
      const dbRole = mapRoleToDb(role);
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, role: dbRole })
        .eq('id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User updated successfully!",
      });
      setViewingUser(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle user status (pause/reactivate) mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ userId, currentStatus }: { userId: string; currentStatus: string | null }) => {
      const newStatus = currentStatus === 'paused' ? 'active' : 'paused';
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId);
      
      if (error) throw error;
      return newStatus;
    },
    onSuccess: (newStatus) => {
      toast({
        title: "Success",
        description: newStatus === 'paused' ? "User account paused!" : "User account reactivated!",
      });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateUserFormData) => {
    createUserMutation.mutate(data);
  };

  const handleEmailChange = (email: string) => {
    form.setValue('email', email);
    const suggestion = detectEmailTypo(email);
    setEmailSuggestion(suggestion);
  };

  const handleViewUser = (user: Profile) => {
    setViewingUser(user);
    setEditFullName(user.full_name || '');
    setEditEmail(user.username);
    setEditRole(getUiRole(user.role));
  };

  const handleSaveUser = () => {
    if (viewingUser) {
      updateUserMutation.mutate({
        userId: viewingUser.id,
        fullName: editFullName,
        role: editRole,
      });
    }
  };

  const getRoleBadgeVariant = (role: string | null): "default" | "secondary" | "outline" | "destructive" => {
    return role === 'admin' ? 'default' : 'secondary';
  };

  const getStatusBadge = (status: string | null) => {
    if (status === 'paused') {
      return <Badge variant="destructive">Paused</Badge>;
    }
    return <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>User Management</CardTitle>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Create User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Create a new user account. They will be able to log in immediately without email verification.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    {...form.register('email')}
                    onChange={(e) => handleEmailChange(e.target.value)}
                  />
                  {emailSuggestion && (
                    <p className="text-sm text-amber-600 bg-amber-100 dark:bg-amber-900/30 p-2 rounded">
                      Did you mean <button 
                        type="button"
                        className="font-semibold underline"
                        onClick={() => {
                          form.setValue('email', emailSuggestion);
                          setEmailSuggestion(null);
                        }}
                      >
                        {emailSuggestion}
                      </button>?
                    </p>
                  )}
                  {form.formState.errors.email && (
                    <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    {...form.register('password')}
                  />
                  {form.formState.errors.password && (
                    <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter full name"
                    {...form.register('fullName')}
                  />
                  {form.formState.errors.fullName && (
                    <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select 
                    onValueChange={(value) => form.setValue('role', value as 'admin' | 'user')} 
                    defaultValue="user"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Admin
                        </div>
                      </SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={createUserMutation.isPending}
                >
                  {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription>Manage user accounts and their roles</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">Loading users...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.full_name || '-'}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {user.role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                      {displayRole(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {/* View/Edit User Details Dialog */}
                      <Dialog 
                        open={viewingUser?.id === user.id} 
                        onOpenChange={(open) => {
                          if (!open) setViewingUser(null);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewUser(user)}
                            title="View & Edit user"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>View & Edit User</DialogTitle>
                            <DialogDescription>
                              View and edit details for {user.full_name || user.username}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-6 py-4">
                            {/* Editable Info */}
                            <div className="space-y-4">
                              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">User Information</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="editFullName">Full Name</Label>
                                  <Input
                                    id="editFullName"
                                    value={editFullName}
                                    onChange={(e) => setEditFullName(e.target.value)}
                                    placeholder="Enter full name"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="editEmail">Email</Label>
                                  <Input
                                    id="editEmail"
                                    value={editEmail}
                                    disabled
                                    className="bg-muted"
                                  />
                                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="editRole">Role</Label>
                                  <Select 
                                    value={editRole}
                                    onValueChange={(value) => setEditRole(value as 'admin' | 'user')}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="admin">
                                        <div className="flex items-center gap-2">
                                          <Shield className="h-4 w-4" />
                                          Admin
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="user">User</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label>Member Since</Label>
                                  <p className="text-sm font-medium py-2">
                                    {user.created_at ? format(new Date(user.created_at), 'MMM dd, yyyy') : '-'}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Recent Logins */}
                            <div className="space-y-3">
                              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Recent Logins</h4>
                              {isLoadingLoginHistory ? (
                                <p className="text-sm text-muted-foreground">Loading...</p>
                              ) : userLoginHistory && userLoginHistory.length > 0 ? (
                                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                                  {userLoginHistory.map((login) => (
                                    <div key={login.id} className="flex justify-between text-sm">
                                      <span>{format(new Date(login.login_at), 'MMM dd, yyyy HH:mm')}</span>
                                      <span className="text-muted-foreground">{login.ip_address || 'Unknown IP'}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">No login history found</p>
                              )}
                            </div>

                            {/* Recent Trips */}
                            <div className="space-y-3">
                              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Recent Trips</h4>
                              {isLoadingTrips ? (
                                <p className="text-sm text-muted-foreground">Loading...</p>
                              ) : userTrips && userTrips.length > 0 ? (
                                <div className="bg-muted/50 rounded-lg overflow-hidden">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="text-xs">Date</TableHead>
                                        <TableHead className="text-xs">Route</TableHead>
                                        <TableHead className="text-xs">Customer</TableHead>
                                        <TableHead className="text-xs text-right">Amount</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {userTrips.map((trip) => (
                                        <TableRow key={trip.id}>
                                          <TableCell className="text-sm">{format(new Date(trip.date), 'MMM dd')}</TableCell>
                                          <TableCell className="text-sm">{trip.from_location} → {trip.to_location}</TableCell>
                                          <TableCell className="text-sm">{trip.customer_name}</TableCell>
                                          <TableCell className="text-sm text-right">₹{trip.trip_amount}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">No trips found</p>
                              )}
                            </div>

                            {/* Recent Maintenance */}
                            <div className="space-y-3">
                              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Recent Maintenance</h4>
                              {isLoadingMaintenance ? (
                                <p className="text-sm text-muted-foreground">Loading...</p>
                              ) : userMaintenance && userMaintenance.length > 0 ? (
                                <div className="bg-muted/50 rounded-lg overflow-hidden">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="text-xs">Date</TableHead>
                                        <TableHead className="text-xs">Type</TableHead>
                                        <TableHead className="text-xs">Vehicle</TableHead>
                                        <TableHead className="text-xs text-right">Amount</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {userMaintenance.map((record) => (
                                        <TableRow key={record.id}>
                                          <TableCell className="text-sm">{format(new Date(record.date), 'MMM dd')}</TableCell>
                                          <TableCell className="text-sm">{record.maintenance_type}</TableCell>
                                          <TableCell className="text-sm">{record.vehicle_number}</TableCell>
                                          <TableCell className="text-sm text-right">₹{record.amount}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">No maintenance records found</p>
                              )}
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setViewingUser(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleSaveUser}
                              disabled={updateUserMutation.isPending}
                            >
                              {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      {/* Pause/Reactivate Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleStatusMutation.mutate({ userId: user.id, currentStatus: user.status })}
                        disabled={toggleStatusMutation.isPending}
                        title={user.status === 'paused' ? 'Reactivate account' : 'Pause account'}
                      >
                        {user.status === 'paused' ? (
                          <Play className="h-4 w-4 text-green-600" />
                        ) : (
                          <Pause className="h-4 w-4 text-amber-600" />
                        )}
                      </Button>
                      
                      {/* Reset Password Dialog */}
                      <Dialog 
                        open={resetPasswordUserId === user.id} 
                        onOpenChange={(open) => {
                          if (!open) {
                            setResetPasswordUserId(null);
                            setNewPassword('');
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setResetPasswordUserId(user.id)}
                            title="Reset password"
                          >
                            <KeyRound className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Reset Password</DialogTitle>
                            <DialogDescription>
                              Set a new password for {user.full_name || user.username}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="newPassword">New Password</Label>
                              <Input
                                id="newPassword"
                                type="password"
                                placeholder="Enter new password (min 6 characters)"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setResetPasswordUserId(null);
                                setNewPassword('');
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={() => {
                                if (newPassword.length >= 6) {
                                  resetPasswordMutation.mutate({ userId: user.id, newPassword });
                                } else {
                                  toast({
                                    title: "Error",
                                    description: "Password must be at least 6 characters",
                                    variant: "destructive",
                                  });
                                }
                              }}
                              disabled={resetPasswordMutation.isPending}
                            >
                              {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      {/* Delete User Confirmation */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            title="Delete user"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete User</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {user.full_name || user.username}? 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteUserMutation.mutate(user.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {deleteUserMutation.isPending ? 'Deleting...' : 'Delete'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
