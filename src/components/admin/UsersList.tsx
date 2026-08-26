import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { UserPlus, Eye, Pause, Play, Pencil, KeyRound, Trash2, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { detectEmailTypo } from '@/utils/emailValidation';
import { UserDataViewer } from '@/components/admin/UserDataViewer';

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(1, 'Full name is required'),
  role: z.enum(['admin', 'driver1', 'driver2', 'driver3']),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  role: 'admin' | 'driver1' | 'driver2' | 'driver3' | null;
  status: 'active' | 'inactive' | 'paused' | null;
  last_login: string | null;
  login_count: number | null;
  created_at: string | null;
}

interface UsersListProps {
  searchTerm?: string;
}

export const UsersList = ({ searchTerm = '' }: UsersListProps) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [editingName, setEditingName] = useState('');
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [viewingUser, setViewingUser] = useState<Profile | null>(null);
  const queryClient = useQueryClient();

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      password: '',
      fullName: '',
      role: 'driver1',
    },
  });

  // Fetch all users
  const { data: users = [], isLoading } = useQuery({
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

  // Create new user mutation
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
            role: data.role,
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
      toast({ title: "Success", description: "User account created successfully!" });
      form.reset();
      setIsCreateDialogOpen(false);
      setEmailSuggestion(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error('Not authenticated');

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
      if (!response.ok) throw new Error(result.error || 'Failed to delete user');
      return result;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "User deleted successfully!" });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error('Not authenticated');

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
      if (!response.ok) throw new Error(result.error || 'Failed to reset password');
      return result;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Password reset successfully!" });
      setResetPasswordUserId(null);
      setNewPassword('');
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Update user status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ status: status as 'active' | 'inactive' | 'paused' })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "User status updated!" });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Update user name mutation
  const updateNameMutation = useMutation({
    mutationFn: async ({ userId, fullName }: { userId: string; fullName: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "User name updated!" });
      setEditingUser(null);
      setEditingName('');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ role: role as 'admin' | 'driver1' | 'driver2' | 'driver3' })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "User role updated!" });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: CreateUserFormData) => {
    createUserMutation.mutate(data);
  };

  const handleEmailChange = (email: string) => {
    form.setValue('email', email);
    setEmailSuggestion(detectEmailTypo(email));
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
      case null:
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30">Active</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30">Paused</Badge>;
      case 'inactive':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30">Inactive</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const roleLabel = (role: string | null) => {
    if (!role) return 'User';
    if (role === 'admin') return 'Admin';
    const match = role.match(/^driver(\d)$/);
    return match ? `User ${match[1]}` : role;
  };

  const getRoleBadge = (role: string | null) => {
    if (role === 'admin') {
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30"><Shield className="h-3 w-3 mr-1" />Admin</Badge>;
    }
    return <Badge variant="outline">{roleLabel(role)}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Create, edit, and manage user accounts</p>
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
                Create a new user account. They will be able to log in immediately.
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
                    Did you mean <button type="button" className="font-semibold underline" onClick={() => { form.setValue('email', emailSuggestion); setEmailSuggestion(null); }}>{emailSuggestion}</button>?
                  </p>
                )}
                {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Enter password" {...form.register('password')} />
                {form.formState.errors.password && <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" type="text" placeholder="Enter full name" {...form.register('fullName')} />
                {form.formState.errors.fullName && <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select onValueChange={(value) => form.setValue('role', value as any)} defaultValue="driver1">
                  <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin"><div className="flex items-center gap-2"><Shield className="h-4 w-4" />Admin</div></SelectItem>
                    <SelectItem value="driver1">User 1</SelectItem>
                    <SelectItem value="driver2">User 2</SelectItem>
                    <SelectItem value="driver3">User 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={createUserMutation.isPending}>
                {createUserMutation.isPending ? 'Creating...' : 'Create User'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* All Users Card */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading users...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Logins</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users
                  .filter((user) => {
                    if (!searchTerm.trim()) return true;
                    const q = searchTerm.toLowerCase();
                    return (
                      (user.full_name || '').toLowerCase().includes(q) ||
                      (user.username || '').toLowerCase().includes(q) ||
                      (user.role || '').toLowerCase().includes(q) ||
                      (user.status || '').toLowerCase().includes(q)
                    );
                  })
                  .map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold">{user.full_name || 'No name'}</p>
                        <p className="text-sm text-muted-foreground">{user.username}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>
                      {user.last_login 
                        ? format(new Date(user.last_login), 'MMM d, yyyy HH:mm')
                        : 'Never'}
                    </TableCell>
                    <TableCell>{user.login_count || 0}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {/* View User */}
                        <Button variant="ghost" size="icon" onClick={() => setViewingUser(user)} title="View">
                          <Eye className="h-4 w-4" />
                        </Button>

                        {/* Pause/Activate User */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => updateStatusMutation.mutate({ 
                            userId: user.id, 
                            status: user.status === 'paused' ? 'active' : 'paused' 
                          })}
                          title={user.status === 'paused' ? 'Activate' : 'Pause'}
                        >
                          {user.status === 'paused' ? <Play className="h-4 w-4 text-green-600" /> : <Pause className="h-4 w-4 text-yellow-600" />}
                        </Button>

                        {/* Edit User */}
                        <Dialog open={editingUser?.id === user.id} onOpenChange={(open) => !open && setEditingUser(null)}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => { setEditingUser(user); setEditingName(user.full_name || ''); }} title="Edit">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit User</DialogTitle>
                              <DialogDescription>Update user information</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Full Name</Label>
                                <Input value={editingName} onChange={(e) => setEditingName(e.target.value)} />
                              </div>
                              <div className="space-y-2">
                                <Label>Role</Label>
                                <Select defaultValue={user.role || 'driver1'} onValueChange={(value) => updateRoleMutation.mutate({ userId: user.id, role: value })}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="driver1">User 1</SelectItem>
                                    <SelectItem value="driver2">User 2</SelectItem>
                                    <SelectItem value="driver3">User 3</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
                              <Button onClick={() => updateNameMutation.mutate({ userId: user.id, fullName: editingName })} disabled={updateNameMutation.isPending}>
                                {updateNameMutation.isPending ? 'Saving...' : 'Save'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        {/* Reset Password */}
                        <Dialog open={resetPasswordUserId === user.id} onOpenChange={(open) => { if (!open) { setResetPasswordUserId(null); setNewPassword(''); } }}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setResetPasswordUserId(user.id)} title="Reset Password">
                              <KeyRound className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Reset Password</DialogTitle>
                              <DialogDescription>Set a new password for {user.full_name || user.username}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>New Password</Label>
                                <Input type="password" placeholder="Enter new password (min 6 characters)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => { setResetPasswordUserId(null); setNewPassword(''); }}>Cancel</Button>
                              <Button onClick={() => { if (newPassword.length >= 6) { resetPasswordMutation.mutate({ userId: user.id, newPassword }); } else { toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" }); } }} disabled={resetPasswordMutation.isPending}>
                                {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        {/* Delete User */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User</AlertDialogTitle>
                              <AlertDialogDescription>Are you sure you want to delete {user.full_name || user.username}? This cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteUserMutation.mutate(user.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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

      {/* View User Dialog */}
      <Dialog open={!!viewingUser} onOpenChange={(open) => !open && setViewingUser(null)}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {viewingUser && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-muted-foreground">Full Name</Label>
                  <p className="font-semibold">{viewingUser.full_name || 'Not set'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-semibold break-all">{viewingUser.username}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Role</Label>
                  <p>{getRoleBadge(viewingUser.role)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p>{getStatusBadge(viewingUser.status)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Last Login</Label>
                  <p className="font-semibold">{viewingUser.last_login ? format(new Date(viewingUser.last_login), 'MMM d, yyyy HH:mm') : 'Never'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Total Logins</Label>
                  <p className="font-semibold">{viewingUser.login_count || 0}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created At</Label>
                  <p className="font-semibold">{viewingUser.created_at ? format(new Date(viewingUser.created_at), 'MMM d, yyyy') : 'Unknown'}</p>
                </div>
              </div>

              <UserDataViewer
                userId={viewingUser.id}
                userLabel={viewingUser.full_name || viewingUser.username}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
