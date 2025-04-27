import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useAuth } from "@/hooks/use-auth";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// Login form schema
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Registration form schema
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [location, navigate] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();

  // Redirect to home if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Login form setup
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form setup
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate({
      ...data,
      role: "customer",
    });
  };

  return (
    <>
      <Helmet>
        <title>Sign In or Register | Luster Legacy</title>
        <meta name="description" content="Sign in to your Luster Legacy account or create a new account" />
      </Helmet>

      <div className="container mx-auto py-12">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Auth Form Column */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-6">Account</h1>
            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                <Card>
                  <CardHeader>
                    <CardTitle>Sign In</CardTitle>
                    <CardDescription>
                      Enter your credentials to access your account
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your username" {...field} />
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
                                <Input type="password" placeholder="Enter your password" {...field} />
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
                          {loginMutation.isPending ? "Signing in..." : "Sign In"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                  <CardFooter className="flex flex-col items-start">
                    <p className="text-sm text-muted-foreground">
                      Don&apos;t have an account?{" "}
                      <Button 
                        variant="link" 
                        className="p-0"
                        onClick={() => setActiveTab("register")}
                      >
                        Register now
                      </Button>
                    </p>
                  </CardFooter>
                </Card>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register">
                <Card>
                  <CardHeader>
                    <CardTitle>Create an Account</CardTitle>
                    <CardDescription>
                      Enter your details to create a new account
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="Choose a username" {...field} />
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
                                <Input type="password" placeholder="Choose a password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending ? "Creating account..." : "Create Account"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                  <CardFooter className="flex flex-col items-start">
                    <p className="text-sm text-muted-foreground">
                      Already have an account?{" "}
                      <Button 
                        variant="link" 
                        className="p-0"
                        onClick={() => setActiveTab("login")}
                      >
                        Sign in
                      </Button>
                    </p>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Hero Column */}
          <div className="bg-muted rounded-lg p-8 flex flex-col justify-center min-h-[400px] relative overflow-hidden">
            <div className="z-10 relative">
              <h2 className="text-3xl font-bold mb-4">Welcome to Luster Legacy</h2>
              <p className="mb-4">
                Sign in to your account to access your personalized dashboard, track your orders, and manage your custom jewelry designs.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center">
                  <span className="mr-2">✓</span> Track your order status
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span> View your custom design requests
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span> Save your favorite products
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span> Faster checkout experience
                </li>
              </ul>
            </div>
            <div className="absolute inset-0 bg-gradient-to-tr from-background/80 to-background/20 z-0"></div>
            <div className="absolute inset-0 bg-[url('/src/assets/WhatsApp%20Image%202025-03-28%20at%203.06.26%20AM.jpeg')] bg-cover bg-center opacity-30 z-[-1]"></div>
          </div>
        </div>
      </div>
    </>
  );
}