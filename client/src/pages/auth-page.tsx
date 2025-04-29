import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage 
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { devHelpers } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Login form validation schema
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

// Registration form validation schema
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Please enter a valid email address"),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions"
  })
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

// Form values types
type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("login");
  const [location] = useLocation();
  const [returnPath, setReturnPath] = useState<string>("/");
  
  // Parse returnTo parameter from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get("returnTo");
    if (returnTo) {
      setReturnPath(returnTo);
      
      // Debug logging to check if there is form data saved in sessionStorage
      if (returnTo === '/custom-design') {
        const savedData = sessionStorage.getItem('designFormData');
        console.log("Auth page - found saved custom design data:", savedData ? "Yes" : "No");
        if (savedData) {
          try {
            const parsedData = JSON.parse(savedData);
            console.log("Auth page - saved form data preview:", {
              hasPrimaryStones: !!parsedData.primaryStones,
              primaryStonesCount: parsedData.primaryStones?.length || 0,
              hasImage: !!parsedData.imageDataUrl,
              imageInfo: parsedData.imageInfo
            });
          } catch (e) {
            console.error("Auth page - error parsing saved form data:", e);
          }
        }
      }
    }
  }, []);
  
  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: ""
    }
  });
  
  // Registration form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      email: "",
      acceptTerms: false
    }
  });
  
  // Submit handlers
  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };
  
  const onRegisterSubmit = (data: RegisterFormValues) => {
    const { confirmPassword, acceptTerms, ...userData } = data;
    // Set the default role to "customer"
    registerMutation.mutate({
      ...userData,
      role: "customer"
    });
  };
  
  // Redirect if user is already logged in
  if (user) {
    // If admin, redirect to admin dashboard
    if (user.role === "admin") {
      console.log("Admin user detected, redirecting to admin dashboard");
      return <Redirect to="/admin/dashboard" />;
    }
    // Otherwise go to return path or home
    return <Redirect to={returnPath} />;
  }
  
  // Debug utility functions
  const [debugUsername, setDebugUsername] = useState<string>("");
  const [userList, setUserList] = useState<any[]>([]);
  const [isLoadingUserList, setIsLoadingUserList] = useState<boolean>(false);
  const [isDirectLoginLoading, setIsDirectLoginLoading] = useState<boolean>(false);

  // Debug actions
  const handleDirectLogin = async () => {
    if (!debugUsername) {
      toast({
        title: "Username required",
        description: "Please enter a username for direct login",
        variant: "destructive"
      });
      return;
    }
    
    setIsDirectLoginLoading(true);
    try {
      const result = await devHelpers.directLogin(debugUsername);
      toast({
        title: "Direct login successful",
        description: `Logged in as ${debugUsername} (${result.redirectTo})`,
      });
    } catch (error) {
      toast({
        title: "Direct login failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsDirectLoginLoading(false);
    }
  };
  
  const handleLoadUsers = async () => {
    setIsLoadingUserList(true);
    try {
      const users = await devHelpers.listAllUsers();
      setUserList(users);
      toast({
        title: "Users loaded",
        description: `Found ${users.length} users in the database`
      });
    } catch (error) {
      toast({
        title: "Failed to load users",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsLoadingUserList(false);
    }
  };
  
  const handleCheckAuthStatus = async () => {
    try {
      const user = await devHelpers.checkAuthStatus();
      if (user) {
        toast({
          title: "Authentication status",
          description: `Logged in as ${user.username} (${user.role})`,
        });
      } else {
        toast({
          title: "Authentication status",
          description: "Not currently authenticated",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error checking auth status",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left side - Form */}
      <div className="flex flex-col items-center justify-center w-full md:w-1/2 px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight font-serif">
              Welcome to Luster Legacy
            </h2>
            <p className="mt-2 text-muted-foreground">
              Sign in to your account or create a new one
            </p>
          </div>
          
          <Tabs 
            defaultValue="login" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Sign Up</TabsTrigger>
              <TabsTrigger value="debug">Debug</TabsTrigger>
            </TabsList>
            
            {/* Login Form */}
            <TabsContent value="login" className="space-y-4 pt-4">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your username" 
                            {...field} 
                            disabled={loginMutation.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Enter your password" 
                            {...field} 
                            disabled={loginMutation.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </Form>
              
              <div className="text-center mt-4">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <button
                    onClick={() => setActiveTab("register")}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign Up
                  </button>
                </p>
              </div>
            </TabsContent>
            
            {/* Registration Form */}
            <TabsContent value="register" className="space-y-4 pt-4">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-6">
                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Choose a username" 
                            {...field} 
                            disabled={registerMutation.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="Enter your email" 
                            {...field} 
                            disabled={registerMutation.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Create a password" 
                            {...field} 
                            disabled={registerMutation.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Confirm your password" 
                            {...field} 
                            disabled={registerMutation.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="acceptTerms"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={registerMutation.isPending}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            I accept the terms and conditions
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </Form>
              
              <div className="text-center mt-4">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <button
                    onClick={() => setActiveTab("login")}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </TabsContent>
            
            {/* Debug Tools */}
            <TabsContent value="debug" className="space-y-6 pt-4">
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md mb-4">
                <h3 className="text-amber-800 font-medium mb-2">Debug Tools</h3>
                <p className="text-amber-700 text-sm">
                  These tools are for development and debugging purposes only.
                </p>
              </div>
              
              {/* Direct Login */}
              <div className="space-y-4 border border-border p-4 rounded-md">
                <h3 className="font-medium">Direct Login</h3>
                <p className="text-sm text-muted-foreground">
                  Bypass password verification and log in directly as any user
                </p>
                
                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter username"
                    value={debugUsername}
                    onChange={(e) => setDebugUsername(e.target.value)}
                    disabled={isDirectLoginLoading}
                  />
                  <Button 
                    onClick={handleDirectLogin}
                    disabled={isDirectLoginLoading}
                  >
                    {isDirectLoginLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      "Direct Login"
                    )}
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setDebugUsername("admin")}
                  >
                    Admin
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setDebugUsername("Ajitha72")}
                  >
                    Customer
                  </Button>
                </div>
              </div>
              
              {/* Authentication Status */}
              <div className="space-y-4 border border-border p-4 rounded-md">
                <h3 className="font-medium">Authentication Status</h3>
                <p className="text-sm text-muted-foreground">
                  Check current authentication status
                </p>
                
                <Button onClick={handleCheckAuthStatus}>
                  Check Auth Status
                </Button>
              </div>
              
              {/* User List */}
              <div className="space-y-4 border border-border p-4 rounded-md">
                <h3 className="font-medium">User List</h3>
                <p className="text-sm text-muted-foreground">
                  List all users in the database
                </p>
                
                <Button 
                  onClick={handleLoadUsers}
                  disabled={isLoadingUserList}
                >
                  {isLoadingUserList ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading users...
                    </>
                  ) : (
                    "Load Users"
                  )}
                </Button>
                
                {userList.length > 0 && (
                  <div className="mt-4 max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-2 py-1 text-left">ID</th>
                          <th className="px-2 py-1 text-left">Username</th>
                          <th className="px-2 py-1 text-left">Email</th>
                          <th className="px-2 py-1 text-left">Role</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userList.map((user) => (
                          <tr key={user.id} className="border-b border-border hover:bg-muted/50">
                            <td className="px-2 py-1">{user.id}</td>
                            <td className="px-2 py-1">{user.username}</td>
                            <td className="px-2 py-1">{user.email}</td>
                            <td className="px-2 py-1">{user.role}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Right side - Hero */}
      <div className="hidden md:block md:w-1/2 bg-gradient-to-r from-primary/80 to-primary">
        <div className="relative h-full flex items-center justify-center p-8">
          <div className="max-w-lg">
            <h1 className="text-4xl font-serif font-bold text-white mb-6">
              Timeless Elegance, Personalized Luxury
            </h1>
            <Separator className="bg-white/30 my-6" />
            <p className="text-white/90 text-lg mb-8">
              Join Luster Legacy to discover exclusive custom jewelry designs that reflect your unique style. 
              Create an account to track your orders, save favorite pieces, and request custom designs tailored just for you.
            </p>
            <div className="grid grid-cols-2 gap-4 text-white/90">
              <div className="flex flex-col items-center p-4 bg-white/10 rounded-lg">
                <span className="font-bold text-lg mb-2">Custom Designs</span>
                <span className="text-center text-sm">Personalized jewelry tailored to your preferences</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-white/10 rounded-lg">
                <span className="font-bold text-lg mb-2">Premium Materials</span>
                <span className="text-center text-sm">Finest gold, diamonds, and precious gemstones</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}