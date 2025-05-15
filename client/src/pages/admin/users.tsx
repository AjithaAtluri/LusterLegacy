import { useState } from "react";
import AdminLayout from "@/components/admin/admin-layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, UserCircle, UserPlus, ShieldCheck, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { UserDetailDialog } from "@/components/admin/user-detail-dialog";

// User type definition
interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt: string;
}

// New admin user form state interface
interface NewAdminFormState {
  username: string;
  email: string;
  password: string;
  role: "admin" | "limited-admin";
}

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newAdminForm, setNewAdminForm] = useState<NewAdminFormState>({
    username: "",
    email: "",
    password: "",
    role: "limited-admin"
  });
  
  // Fetch all users
  const { data: users, isLoading, error } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/users");
      const data = await response.json();
      return data as User[];
    }
  });
  
  // Mutation for deleting a user
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      toast({
        title: "User deleted",
        description: "User has been successfully deleted",
        variant: "default"
      });
      
      // Invalidate and refetch users
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      
      // Close the confirmation dialog
      setUserToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete user: " + (error instanceof Error ? error.message : "Unknown error"),
        variant: "destructive"
      });
    }
  });
  
  // Mutation for creating admin user
  const createAdminMutation = useMutation({
    mutationFn: async (formData: NewAdminFormState) => {
      const response = await apiRequest("POST", "/api/admin/create-user", formData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Admin user created",
        description: `${newAdminForm.role === "admin" ? "Admin" : "Limited-access admin"} user has been successfully created`,
        variant: "default"
      });
      
      // Reset form
      setNewAdminForm({
        username: "",
        email: "",
        password: "",
        role: "limited-admin"
      });
      
      // Close dialog
      setIsCreateDialogOpen(false);
      
      // Invalidate and refetch users
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create admin user: " + (error instanceof Error ? error.message : "Unknown error"),
        variant: "destructive"
      });
    }
  });
  
  // Handle input changes in the form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewAdminForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle role selection
  const handleRoleChange = (value: string) => {
    setNewAdminForm(prev => ({
      ...prev,
      role: value as "admin" | "limited-admin"
    }));
  };
  
  // Handle form submission
  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    createAdminMutation.mutate(newAdminForm);
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "PPP");
    } catch (error) {
      return "Invalid date";
    }
  };
  
  return (
    <AdminLayout title="User Management">
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                Manage user accounts in your system.
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Admin User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Admin User</DialogTitle>
                  <DialogDescription>
                    Add a new administrator or limited-access admin to the system.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateAdmin}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        name="username"
                        placeholder="Username"
                        value={newAdminForm.username}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Email"
                        value={newAdminForm.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Password"
                        value={newAdminForm.password}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="role">Admin Role</Label>
                      <Select value={newAdminForm.role} onValueChange={handleRoleChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="h-4 w-4" />
                              <span>Full Administrator</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="limited-admin">
                            <div className="flex items-center gap-2">
                              <UserCircle className="h-4 w-4" />
                              <span>Limited-Access Admin</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {newAdminForm.role === "limited-admin" && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          <p>Limited-access admins can:</p>
                          <ul className="list-disc ml-5 mt-2">
                            <li>Manage customer request chats</li>
                            <li>Update order statuses</li>
                            <li>Add new products</li>
                          </ul>
                          <p className="mt-2">They cannot access product types, stone types, metal types, or user management.</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createAdminMutation.isPending}>
                      {createAdminMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>Create</>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="py-4 text-center text-destructive">
                Error loading users. Please try again.
              </div>
            ) : !users || users.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No users found.
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created On</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium flex items-center gap-2">
                          <UserCircle className="h-5 w-5 text-muted-foreground" />
                          {user.username}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === "admin" ? "secondary" : user.role === "limited-admin" ? "default" : "outline"}>
                            {user.role || "user"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedUserId(user.id)}
                              title="View user details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setUserToDelete(user)}
                              disabled={user.role === "admin" || deleteUserMutation.isPending}
                              title={user.role === "admin" ? "Admin users cannot be deleted" : "Delete user"}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Confirmation dialog for user deletion */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the user <strong>{userToDelete?.username}</strong> and all of their associated data, including customization requests, quote requests, design requests, orders, and all comments.
              <br /><br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && deleteUserMutation.mutate(userToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete User"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* User detail dialog */}
      <UserDetailDialog 
        userId={selectedUserId} 
        onClose={() => setSelectedUserId(null)} 
      />
    </AdminLayout>
  );
}