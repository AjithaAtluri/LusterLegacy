import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { COUNTRIES } from "@/lib/constants";

// Login form validation schema
const loginSchema = z.object({
  loginID: z.string().min(3, "Login ID must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

// Forgot password validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address")
});

// Registration form validation schema
const registerSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters").nonempty("Full name is required"),
  loginID: z.string().min(3, "Login ID must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(8, "Phone number must be at least 8 characters").nonempty("Phone number is required"),
  country: z.string().min(2, "Country is required").nonempty("Country is required"),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions"
  })
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

// Form values types
type LoginFormValues = z.infer<typeof loginSchema>;
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("login");
  const [location] = useLocation();
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isRequestingPasswordReset, setIsRequestingPasswordReset] = useState(false);
  const [returnPath, setReturnPath] = useState<string>("/");
  
  // Parse returnTo parameter from URL and check for prefilled data
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get("returnTo");
    const shareStory = params.get("shareStory") === "true";
    let hasPrefilledData = false;
    
    if (returnTo) {
      // For client stories page with share=true, we want to redirect to the share tab
      if (returnTo === '/client-stories' && shareStory) {
        setReturnPath(returnTo + "?tab=share");
      } else {
        setReturnPath(returnTo);
      }
      
      // Check for saved form data based on the return path
      if (returnTo === '/custom-design') {
        // Custom design request form
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
            
            // Check if we have enough data to consider it "prefilled"
            if (parsedData.fullName || parsedData.email) {
              hasPrefilledData = true;
            }
          } catch (e) {
            console.error("Auth page - error parsing saved form data:", e);
          }
        }
      } else if (returnTo.startsWith('/customize-request/')) {
        // Product customization request form
        const savedData = sessionStorage.getItem('customizationFormData');
        console.log("Auth page - found saved customization data:", savedData ? "Yes" : "No");
        if (savedData) {
          try {
            const parsedData = JSON.parse(savedData);
            console.log("Auth page - saved customization form data preview:", {
              productId: parsedData.productId,
              customizationType: parsedData.customizationType,
              hasRequirements: !!parsedData.requirements
            });
            
            // Check if we have enough data to consider it "prefilled"
            if (parsedData.fullName || parsedData.email) {
              hasPrefilledData = true;
            }
          } catch (e) {
            console.error("Auth page - error parsing saved customization form data:", e);
          }
        }
      } else if (returnTo.startsWith('/place-order/')) {
        // Quote request form
        const savedData = sessionStorage.getItem('quoteFormData');
        console.log("Auth page - found saved quote request data:", savedData ? "Yes" : "No");
        if (savedData) {
          try {
            const parsedData = JSON.parse(savedData);
            console.log("Auth page - saved quote form data preview:", {
              productId: parsedData.productId,
              name: parsedData.name,
              email: parsedData.email,
              currency: parsedData.currency
            });
            
            // Check if we have enough data to consider it "prefilled"
            if (parsedData.fullName || parsedData.email) {
              hasPrefilledData = true;
            }
          } catch (e) {
            console.error("Auth page - error parsing saved quote form data:", e);
          }
        }
      }
    } else {
      // Even if no returnTo is in the URL, check if we have saved form data
      // that might contain prefillable information
      const hasDesignData = sessionStorage.getItem('designFormData') !== null;
      const hasCustomizationData = sessionStorage.getItem('customizationFormData') !== null;
      const hasQuoteData = sessionStorage.getItem('quoteFormData') !== null;
      
      if (hasDesignData || hasCustomizationData || hasQuoteData) {
        console.log("Auth page - found saved form data without returnTo param");
        hasPrefilledData = true;
      }
    }
    
    // If we have prefilled data, automatically switch to the register tab
    if (hasPrefilledData) {
      console.log("Auth page - automatically switching to register tab due to prefilled data");
      setActiveTab("register");
      
      // Show toast with helpful message
      toast({
        title: "Form data transferred",
        description: "We've prefilled the registration form with your information for convenience.",
        duration: 5000,
      });
    }
  }, [toast]);
  
  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      loginID: "",
      password: ""
    }
  });
  
  // Forgot password form
  const forgotPasswordForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ""
    }
  });
  
  // Get prefilled values from stored form data
  const getPrefilledFormValues = () => {
    let prefilledValues = {
      name: "",
      loginID: "",
      password: "",
      confirmPassword: "",
      email: "",
      phone: "",
      country: "us", // Default to United States
      acceptTerms: false
    };
    
    try {
      // Check for design form data
      const designFormData = sessionStorage.getItem('designFormData');
      if (designFormData) {
        const parsedData = JSON.parse(designFormData);
        console.log("Attempting to prefill registration form with design form data");
        
        if (parsedData.fullName) prefilledValues.name = parsedData.fullName;
        if (parsedData.email) prefilledValues.email = parsedData.email;
        if (parsedData.phone) prefilledValues.phone = parsedData.phone;
        if (parsedData.country) prefilledValues.country = parsedData.country;
        
        // Generate a suggested login ID from the name if available
        if (parsedData.fullName && !prefilledValues.loginID) {
          const nameParts = parsedData.fullName.split(' ');
          if (nameParts.length >= 2) {
            // Use first name + first letter of last name
            prefilledValues.loginID = (nameParts[0] + nameParts[nameParts.length - 1][0]).replace(/[^a-zA-Z0-9]/g, '');
          } else if (nameParts.length === 1) {
            prefilledValues.loginID = nameParts[0].replace(/[^a-zA-Z0-9]/g, '');
          }
        }
      }
      
      // Check for customization form data
      const customizationFormData = sessionStorage.getItem('customizationFormData');
      if (customizationFormData) {
        const parsedData = JSON.parse(customizationFormData);
        console.log("Attempting to prefill registration form with customization form data");
        
        if (parsedData.fullName) prefilledValues.name = parsedData.fullName;
        if (parsedData.email) prefilledValues.email = parsedData.email;
        if (parsedData.phone) prefilledValues.phone = parsedData.phone;
        if (parsedData.country) prefilledValues.country = parsedData.country;
        
        // Generate a suggested login ID from the name if available
        if (parsedData.fullName && !prefilledValues.loginID) {
          const nameParts = parsedData.fullName.split(' ');
          if (nameParts.length >= 2) {
            // Use first name + first letter of last name
            prefilledValues.loginID = (nameParts[0] + nameParts[nameParts.length - 1][0]).replace(/[^a-zA-Z0-9]/g, '');
          } else if (nameParts.length === 1) {
            prefilledValues.loginID = nameParts[0].replace(/[^a-zA-Z0-9]/g, '');
          }
        }
      }
      
      // Check for quote form data
      const quoteFormData = sessionStorage.getItem('quoteFormData');
      if (quoteFormData) {
        const parsedData = JSON.parse(quoteFormData);
        console.log("Attempting to prefill registration form with quote form data");
        
        if (parsedData.fullName) prefilledValues.name = parsedData.fullName;
        if (parsedData.email) prefilledValues.email = parsedData.email;
        if (parsedData.phone) prefilledValues.phone = parsedData.phone;
        if (parsedData.country) prefilledValues.country = parsedData.country;
        
        // Generate a suggested login ID from the name if available
        if (parsedData.fullName && !prefilledValues.loginID) {
          const nameParts = parsedData.fullName.split(' ');
          if (nameParts.length >= 2) {
            // Use first name + first letter of last name
            prefilledValues.loginID = (nameParts[0] + nameParts[nameParts.length - 1][0]).replace(/[^a-zA-Z0-9]/g, '');
          } else if (nameParts.length === 1) {
            prefilledValues.loginID = nameParts[0].replace(/[^a-zA-Z0-9]/g, '');
          }
        }
      }
      
      // Log the prefilled values
      console.log("Prefilled registration form values:", {
        name: prefilledValues.name ? "✓" : "✗",
        email: prefilledValues.email ? "✓" : "✗",
        phone: prefilledValues.phone ? "✓" : "✗", 
        country: prefilledValues.country,
        loginID: prefilledValues.loginID ? "✓" : "✗"
      });
    } catch (error) {
      console.error("Error getting prefilled form values:", error);
    }
    
    return prefilledValues;
  };
  
  // Registration form with prefilled values
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: getPrefilledFormValues()
  });
  
  // Submit handlers
  // Handle forgot password form submission
  const onForgotPasswordSubmit = async (data: ForgotPasswordFormValues) => {
    try {
      setIsRequestingPasswordReset(true);
      
      // Make API call to request password reset
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email }),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to request password reset');
      }
      
      // Success - show message to user
      toast({
        title: "Password Reset Link Sent",
        description: "If an account exists with that email, you'll receive a password reset link shortly.",
        duration: 5000,
      });
      
      // If in development mode and a reset link is provided in the response, show it in the console
      if (responseData.resetLink) {
        console.log("[DEV] Password reset link:", responseData.resetLink);
        console.log("[DEV] You can use this link to reset your password in development mode");
      }
      
      // Reset form and return to login view
      forgotPasswordForm.reset();
      setShowForgotPassword(false);
    } catch (error) {
      toast({
        title: "Request Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsRequestingPasswordReset(false);
    }
  };
  
  const onLoginSubmit = (data: LoginFormValues) => {
    // Check if there's a saved form state in the session that we need to return to
    const hasSavedDesignForm = sessionStorage.getItem('designFormData') !== null;
    const hasSavedCustomizationForm = sessionStorage.getItem('customizationFormData') !== null;
    const hasSavedQuoteForm = sessionStorage.getItem('quoteFormData') !== null;
    
    // Preserve returnTo parameter if it exists, otherwise check for form data and set appropriate return path
    const params = new URLSearchParams(window.location.search);
    const existingReturnTo = params.get("returnTo");
    
    if (!existingReturnTo) {
      let redirectPath = null;
      
      // Set the appropriate return path based on which form data we have saved
      if (hasSavedDesignForm) {
        redirectPath = "/custom-design";
        console.log("Setting custom-design as returnTo for login due to saved form data");
      } else if (hasSavedCustomizationForm) {
        // The actual customization request ID will be part of the saved data
        const savedData = JSON.parse(sessionStorage.getItem('customizationFormData') || '{}');
        if (savedData.productId) {
          redirectPath = `/customize-request/${savedData.productId}`;
          console.log(`Setting ${redirectPath} as returnTo for login due to saved customization form data`);
        }
      } else if (hasSavedQuoteForm) {
        // The actual product ID will be part of the saved data
        const savedData = JSON.parse(sessionStorage.getItem('quoteFormData') || '{}');
        if (savedData.productId) {
          redirectPath = `/place-order/${savedData.productId}`;
          console.log(`Setting ${redirectPath} as returnTo for login due to saved quote form data`);
        }
      }
      
      // Update the URL if we found a redirect path
      if (redirectPath) {
        params.set("returnTo", redirectPath);
        window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
        setReturnPath(redirectPath);
      }
    }
    
    loginMutation.mutate(data);
  };
  
  const onRegisterSubmit = (data: RegisterFormValues) => {
    // Check if there's a returnTo path in the URL that we need to redirect to after registration
    const params = new URLSearchParams(window.location.search);
    const existingReturnTo = params.get("returnTo");
    const shareStory = params.get("shareStory") === "true";
    
    // If returnTo is set and it's to the client-stories page with a share parameter,
    // update the return path to add the tab parameter
    if (existingReturnTo === "/client-stories" && shareStory) {
      setReturnPath("/client-stories?tab=share");
    } else if (existingReturnTo) {
      setReturnPath(existingReturnTo);
    }
    
    // Remove properties not needed for registration
    const { confirmPassword, acceptTerms, ...registerData } = data;
    
    // Update the URL to include the return path for use after registration completes
    if (existingReturnTo) {
      // URL already has returnTo parameter, no need to update
    } else if (returnPath !== "/") {
      params.set("returnTo", returnPath);
      window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
    }
    
    registerMutation.mutate(registerData);
  };
  
  // If user is already logged in, redirect
  if (user) {
    // Get any stored returnTo path from URL parameters
    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get("returnTo") || "/";
    return <Redirect to={returnTo} />;
  }
  
  // Render auth page with login/registration forms
  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-background to-background/95 relative">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-b from-primary/10 to-transparent rounded-bl-full opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-gradient-to-t from-secondary/15 to-transparent rounded-tr-full opacity-70"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row bg-card rounded-xl shadow-xl overflow-hidden border border-primary/10">
          {/* Hero side */}
          <div className="lg:w-1/2 p-8 md:p-12 bg-gradient-to-br from-primary/10 to-primary/5 flex flex-col justify-center">
            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                Welcome to Luster Legacy
              </h1>
              <p className="text-lg text-muted-foreground">
                Sign in to access your personalized luxury jewelry experience.
              </p>
              
              <div className="pt-6">
                <Separator className="my-6 bg-gradient-to-r from-primary/40 to-secondary/40" />
                <h2 className="text-xl font-semibold mb-4 text-primary">The Luster Legacy Difference</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col items-center p-6 bg-gradient-to-b from-background/80 to-background/50 rounded-lg border border-primary/20 shadow-md hover:shadow-lg hover:border-primary/30 transition-all">
                    <span className="font-bold text-lg mb-2 text-primary">Bespoke Designs</span>
                    <span className="text-center text-sm">Personalized creations that tell your story</span>
                  </div>
                  
                  <div className="flex flex-col items-center p-6 bg-gradient-to-b from-background/80 to-background/50 rounded-lg border border-primary/20 shadow-md hover:shadow-lg hover:border-primary/30 transition-all">
                    <span className="font-bold text-lg mb-2 text-primary">Master Craftsmanship</span>
                    <span className="text-center text-sm">Handcrafted with generations of expertise</span>
                  </div>
                  
                  <div className="flex flex-col items-center p-6 bg-gradient-to-b from-background/80 to-background/50 rounded-lg border border-primary/20 shadow-md hover:shadow-lg hover:border-primary/30 transition-all">
                    <span className="font-bold text-lg mb-2 text-primary">Premium Materials</span>
                    <span className="text-center text-sm">Finest gold, diamonds, and precious gemstones</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Auth forms side */}
          <div className="lg:w-1/2 p-8 md:p-12 bg-gradient-to-br from-background to-background/90 relative">
            {/* Subtle decorative elements */}
            <div className="absolute top-8 right-8 w-16 h-16 bg-primary/5 rounded-full blur-2xl"></div>
            <div className="absolute bottom-12 left-12 w-24 h-24 bg-secondary/5 rounded-full blur-3xl"></div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full relative z-10">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-gradient-to-r from-primary/20 to-secondary/20 p-1">
                <TabsTrigger value="login" className="data-[state=active]:bg-white/80 data-[state=active]:text-primary font-medium">Sign In</TabsTrigger>
                <TabsTrigger value="register" className="data-[state=active]:bg-white/80 data-[state=active]:text-primary font-medium">Register</TabsTrigger>
              </TabsList>
              
              {/* Login Form */}
              <TabsContent value="login" className="space-y-4 pt-4">
                {showForgotPassword ? (
                  <div className="space-y-4">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-semibold text-primary">Forgot Password</h3>
                      <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                        Enter your email address and we'll send you a link to reset your password.
                      </p>
                      <div className="h-1 w-24 mx-auto mt-3 bg-gradient-to-r from-primary/40 to-secondary/40 rounded-full"></div>
                    </div>
                    <Form {...forgotPasswordForm}>
                      <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-6">
                        <FormField
                          control={forgotPasswordForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input 
                                  type="email" 
                                  placeholder="Enter your email address" 
                                  {...field} 
                                  disabled={isRequestingPasswordReset}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex space-x-4 pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="w-1/2 border-primary/30 hover:bg-primary/5 transition-all"
                            onClick={() => setShowForgotPassword(false)}
                            disabled={isRequestingPasswordReset}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            className="w-1/2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md"
                            disabled={isRequestingPasswordReset}
                          >
                            {isRequestingPasswordReset ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              "Send Reset Link"
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </div>
                ) : (
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                      <FormField
                        control={loginForm.control}
                        name="loginID"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Login ID</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your login ID" 
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
                            <div className="mt-1">
                              <Button 
                                variant="link" 
                                className="p-0 h-auto text-xs text-primary"
                                type="button"
                                onClick={() => setShowForgotPassword(true)}
                              >
                                Forgot Password?
                              </Button>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md"
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
                )}
                
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
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your full name" 
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
                      name="loginID"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Login ID</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Create a login ID" 
                              {...field} 
                              disabled={registerMutation.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    </div>
                    
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={registerForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your phone number" 
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
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <Select 
                              value={field.value} 
                              onValueChange={field.onChange}
                              disabled={registerMutation.isPending}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select your country" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {COUNTRIES.map((country) => (
                                  <SelectItem key={country.id} value={country.id}>{country.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={registerForm.control}
                      name="acceptTerms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={registerMutation.isPending}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Accept Terms and Conditions</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              I agree to the{" "}
                              <a href="/terms" target="_blank" className="text-primary hover:underline">
                                Terms of Service
                              </a>{" "}
                              and{" "}
                              <a href="/privacy" target="_blank" className="text-primary hover:underline">
                                Privacy Policy
                              </a>
                              .
                            </p>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md"
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
                      Sign In
                    </button>
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}