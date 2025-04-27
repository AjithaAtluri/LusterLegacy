import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, LogIn, UserPlus, ArrowRight } from "lucide-react";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  
  // Login form state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Register form state
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  
  // Check for redirect after successful login
  useEffect(() => {
    // If user is already logged in, redirect to home or saved redirect path
    if (user) {
      const redirectPath = localStorage.getItem('redirectAfterLogin') || '/';
      localStorage.removeItem('redirectAfterLogin'); // Clear the stored path
      setLocation(redirectPath);
    }
  }, [user, setLocation]);
  
  // Handle login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!loginUsername || !loginPassword) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    // Submit login request
    loginMutation.mutate({
      username: loginUsername,
      password: loginPassword,
    });
  };
  
  // Handle registration submission
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!registerUsername || !registerPassword || !registerEmail || !registerConfirmPassword) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    // Password confirmation check
    if (registerPassword !== registerConfirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "The passwords you entered don't match.",
        variant: "destructive",
      });
      return;
    }
    
    // Submit registration request
    registerMutation.mutate({
      username: registerUsername,
      password: registerPassword,
      email: registerEmail,
      role: "customer" // Default role for new users
    });
  };
  
  // If still checking authentication status, show loading spinner
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>Login or Register | Luster Legacy</title>
      </Helmet>
      
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Auth Forms */}
          <div>
            <h1 className="font-playfair text-3xl font-bold mb-6 text-center lg:text-left">
              Welcome to Luster Legacy
            </h1>
            
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              {/* Login Tab */}
              <TabsContent value="login">
                <Card>
                  <CardHeader>
                    <CardTitle>Login to Your Account</CardTitle>
                    <CardDescription>
                      Access your orders, wishlist, and custom design requests
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-username">Username</Label>
                        <Input
                          id="login-username"
                          placeholder="Enter your username"
                          value={loginUsername}
                          onChange={(e) => setLoginUsername(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password">Password</Label>
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="Enter your password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <span className="flex items-center justify-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Logging in...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center">
                            <LogIn className="mr-2 h-4 w-4" />
                            Login
                          </span>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Register Tab */}
              <TabsContent value="register">
                <Card>
                  <CardHeader>
                    <CardTitle>Create a New Account</CardTitle>
                    <CardDescription>
                      Join Luster Legacy to track orders and save your preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-username">Username</Label>
                        <Input
                          id="register-username"
                          placeholder="Choose a username"
                          value={registerUsername}
                          onChange={(e) => setRegisterUsername(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-email">Email</Label>
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="Enter your email"
                          value={registerEmail}
                          onChange={(e) => setRegisterEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-password">Password</Label>
                        <Input
                          id="register-password"
                          type="password"
                          placeholder="Create a password"
                          value={registerPassword}
                          onChange={(e) => setRegisterPassword(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-confirm-password">Confirm Password</Label>
                        <Input
                          id="register-confirm-password"
                          type="password"
                          placeholder="Confirm your password"
                          value={registerConfirmPassword}
                          onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                          required
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <span className="flex items-center justify-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating Account...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Register
                          </span>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Hero Section */}
          <div className="hidden lg:block">
            <div className="bg-gradient-to-br from-primary/5 to-primary/20 rounded-lg p-10 h-full">
              <h2 className="font-playfair text-3xl font-bold mb-6">Experience the Luxury of Luster Legacy</h2>
              <p className="mb-6 text-lg">
                Join our exclusive community and unlock special benefits:
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <ArrowRight className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" />
                  <span>Track your orders and custom design requests in one place</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" />
                  <span>Receive exclusive updates on new collections and limited editions</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" />
                  <span>Access to personalized jewelry recommendations based on your preferences</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" />
                  <span>Save your favorite designs for future inspiration</span>
                </li>
              </ul>
              <p className="text-sm text-muted-foreground italic">
                Your journey to exquisite, custom jewelry begins with a simple account creation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}