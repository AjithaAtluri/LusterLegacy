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
import { Loader2, Lock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required")
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, loginMutation } = useAuth();
  const isLoading = loginMutation.isPending;
  
  // Redirect if already logged in as admin
  useEffect(() => {
    if (user && user.role === "admin") {
      console.log("Admin already authenticated, redirecting to dashboard");
      window.location.href = window.location.origin + "/admin/dashboard";
    }
  }, [user]);
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: ""
    }
  });
  
  const onSubmit = async (data: LoginFormValues) => {
    console.log("ADMIN LOGIN - Using central auth system for login");
    
    // Use the mutation from useAuth hook
    loginMutation.mutate(data, {
      onSuccess: (userData) => {
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
        
        // Navigate to the direct admin dashboard
        console.log("Admin login successful, redirecting to direct dashboard");
        // Use the direct-dashboard route that doesn't require authentication
        window.location.href = window.location.origin + "/admin/direct-dashboard";
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
