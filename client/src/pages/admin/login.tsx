import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Helmet } from "react-helmet";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required")
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: ""
    }
  });
  
  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    
    try {
      console.log("Admin login attempt...");
      
      // First use the main authentication system
      const response = await apiRequest("POST", "/api/login", data);
      const userData = await response.json();
      
      // Check if user has admin role
      if (userData.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }
      
      console.log("Main auth successful, now syncing with admin auth...");
      
      // Also sync with the admin auth system for extra compatibility
      try {
        const adminResponse = await apiRequest("POST", "/api/auth/login", data);
        console.log("Admin auth system response:", adminResponse.status);
      } catch (adminAuthError) {
        console.warn("Admin auth sync failed, but continuing with main auth:", adminAuthError);
        // Continue anyway since main auth succeeded
      }
      
      // Verify auth state is correct by checking both endpoints
      const userCheckResponse = await apiRequest("GET", "/api/user");
      const adminCheckResponse = await apiRequest("GET", "/api/auth/me");
      
      console.log("Auth verification results:", { 
        mainAuth: userCheckResponse.status, 
        adminAuth: adminCheckResponse.status 
      });
      
      toast({
        title: "Admin login successful",
        description: "Welcome to Luster Legacy admin dashboard",
      });
      
      // Use hard navigation to ensure full page reload and clean state
      window.location.href = "/admin/dashboard";
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: "Invalid credentials or insufficient permissions",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      <Helmet>
        <title>Admin Login | Luster Legacy</title>
        <meta name="description" content="Administrator login for Luster Legacy jewelry management system." />
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary flex items-center justify-center">
              <Lock className="h-6 w-6 text-background" />
            </div>
            <CardTitle className="font-playfair text-2xl">Admin Login</CardTitle>
            <CardDescription>
              Sign in to access the administrator dashboard
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
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full font-montserrat bg-primary text-background hover:bg-accent" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </>
  );
}
