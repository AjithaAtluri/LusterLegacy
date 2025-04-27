import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
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
  const [activeTab, setActiveTab] = useState<string>("login");
  
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
    return <Redirect to="/" />;
  }
  
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
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Sign Up</TabsTrigger>
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