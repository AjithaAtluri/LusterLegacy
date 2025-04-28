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
      console.log("ADMIN LOGIN - STARTING IMPROVED LOGIN FLOW");
      
      // Try admin-specific login first for direct admin session
      console.log("1. Attempting admin-specific login...");
      try {
        const adminResponse = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
          credentials: "include" // Important for cookies
        });
        
        if (!adminResponse.ok) {
          console.warn("Admin login API failed:", adminResponse.status);
        } else {
          console.log("Admin API login successful");
        }
      } catch (adminLoginError) {
        console.error("Error during admin login:", adminLoginError);
      }
      
      // Now also try the main login system 
      console.log("2. Attempting main auth login...");
      const mainResponse = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include" // Important for cookies
      });
      
      if (!mainResponse.ok) {
        throw new Error("Main login failed");
      }
      
      const userData = await mainResponse.json();
      
      // Check if user has admin role
      if (userData.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }
      
      console.log("3. Both login systems completed, now verifying login state...");
      
      // Verify login state (do this with fetch instead of apiRequest to ensure fresh state)
      const verifyPromises = [
        fetch("/api/user", { credentials: "include" }),
        fetch("/api/auth/me", { credentials: "include" })
      ];
      
      const [mainVerify, adminVerify] = await Promise.all(verifyPromises);
      console.log("Verification results:", { 
        mainAuth: mainVerify.status, 
        adminAuth: adminVerify.status 
      });
      
      if (mainVerify.status !== 200 || adminVerify.status !== 200) {
        console.warn("Login verification failed, trying one more time after delay...");
        
        // One more attempt after a delay to ensure sessions are properly established
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const [secondMainVerify, secondAdminVerify] = await Promise.all([
          fetch("/api/user", { credentials: "include" }),
          fetch("/api/auth/me", { credentials: "include" })
        ]);
        
        console.log("Second verification results:", { 
          mainAuth: secondMainVerify.status, 
          adminAuth: secondAdminVerify.status 
        });
      }
      
      toast({
        title: "Admin login successful",
        description: "Welcome to Luster Legacy admin dashboard",
      });
      
      console.log("4. Login process complete - preparing to redirect to dashboard");
      
      // Use a timeout to ensure cookies and session state are properly established
      // before redirecting to the dashboard
      setTimeout(() => {
        console.log("Executing admin dashboard redirect after delay");
        // Use hard navigation to ensure full page reload and clean state
        window.location.href = window.location.origin + "/admin/dashboard";
      }, 500);
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
