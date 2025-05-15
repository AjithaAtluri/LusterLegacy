import { useState, useEffect } from "react";
import { useLocation, Redirect } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Helmet } from "react-helmet";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const loginSchema = z.object({
  username: z.string().min(1, "Login ID is required"),
  password: z.string().min(1, "Password is required")
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading, stableLoading, loginMutation } = useAuth();
  const isLoading = loginMutation.isPending;
  const [showAuthLoading, setShowAuthLoading] = useState(false);
  
  // Maximum loading state duration with forced continuation
  useEffect(() => {
    let loadingTimer: NodeJS.Timeout;
    let maxDurationTimer: NodeJS.Timeout;
    
    if (authLoading || stableLoading) {
      // Regular loading indicator after a short delay to prevent flickering
      loadingTimer = setTimeout(() => {
        setShowAuthLoading(true);
      }, 400); // Show loading faster
      
      // Force continue after max duration (2 seconds) regardless of loading state
      maxDurationTimer = setTimeout(() => {
        console.log("Admin login - Loading timeout reached, forcing continuation");
        setShowAuthLoading(false);
      }, 2000);
    } else {
      setShowAuthLoading(false);
    }
    
    return () => {
      clearTimeout(loadingTimer);
      clearTimeout(maxDurationTimer);
    };
  }, [authLoading, stableLoading]);
  
  // Redirect if already logged in as admin
  useEffect(() => {
    // Add a direct check to help break out of endless loading cycles
    if (showAuthLoading) {
      const directCheck = async () => {
        try {
          const response = await fetch('/api/auth/me', {
            credentials: 'include',
            headers: {
              'Accept': 'application/json'
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            if (userData && userData.role === 'admin') {
              console.log("Admin detected via direct check, forcing redirect");
              window.location.href = window.location.origin + "/admin/dashboard";
              return;
            }
          }
        } catch (error) {
          console.error("Direct admin check failed:", error);
        }
      };
      
      // Run the direct check
      directCheck();
    }
    
    // Regular check through user context
    if (user && user.role === "admin") {
      console.log("Admin already authenticated, redirecting to dashboard");
      window.location.href = window.location.origin + "/admin/dashboard";
    }
  }, [user, showAuthLoading]);
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: ""
    }
  });
  
  const onSubmit = async (data: LoginFormValues) => {
    console.log("ADMIN LOGIN - Using central auth system for login");
    
    // Transform data to match LoginData type (username → loginID)
    const loginData = {
      loginID: data.username, // Map username field to loginID for API
      password: data.password
    };
    
    // Use the mutation from useAuth hook
    loginMutation.mutate(loginData, {
      onSuccess: async (userData) => {
        // Check if user has admin role
        if (userData.role !== 'admin') {
          toast({
            title: "Unauthorized",
            description: "This login is for administrators only",
            variant: "destructive"
          });
          return;
        }
        
        toast({
          title: "Admin login successful",
          description: "Welcome to Luster Legacy admin dashboard",
        });
        
        // Sync admin cookie before redirecting
        console.log("Admin login successful, syncing admin cookie");
        
        try {
          // Call the sync endpoint to ensure cookies and session are properly set
          const syncResponse = await fetch('/api/auth/sync-admin-cookie', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              adminId: userData.id,
              loginID: userData.loginID || userData.username,
              password: data.password  // Include password for verification
            })
          });
          
          if (syncResponse.ok) {
            console.log("Admin cookie sync successful");
          } else {
            console.warn("Admin cookie sync failed, but continuing with login");
          }
        } catch (error) {
          console.error("Admin cookie sync error:", error);
          // Continue despite sync error
        }
        
        // Navigate to the admin dashboard
        console.log("Redirecting to dashboard");
        window.location.href = window.location.origin + "/admin/dashboard";
      },
      onError: (error) => {
        console.error("Login error:", error);
        toast({
          title: "Login failed",
          description: "Invalid credentials or insufficient permissions",
          variant: "destructive"
        });
      }
    });
  };
  
  // If we're checking auth status, show the loading UI
  if (showAuthLoading) {
    return (
      <>
        <Helmet>
          <title>Checking Auth | Luster Legacy</title>
        </Helmet>
        
        <div className="min-h-screen flex flex-col items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mb-4"></div>
          <p className="text-foreground/70 text-sm font-montserrat">Verifying authentication status...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Admin Login | Luster Legacy</title>
        <meta name="description" content="Administrator login for Luster Legacy jewelry management system." />
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md shadow-lg border-border/50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-primary flex items-center justify-center">
              <ShieldCheck className="h-7 w-7 text-background" />
            </div>
            <CardTitle className="font-playfair text-2xl">Admin Dashboard</CardTitle>
            <CardDescription>
              Sign in with your administrative credentials
            </CardDescription>
          </CardHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Login ID</FormLabel>
                      <FormControl>
                        <Input {...field} className="font-montserrat" placeholder="Enter your login ID" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} className="font-montserrat" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              
              <CardFooter className="flex-col gap-2">
                <Button 
                  type="submit" 
                  className="w-full font-montserrat bg-primary text-background hover:bg-primary/90" 
                  disabled={isLoading}
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    "Sign In to Dashboard"
                  )}
                </Button>
                
                <div className="text-xs text-muted-foreground mt-2 text-center">
                  Access restricted to authorized administrators only
                </div>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </>
  );
}
