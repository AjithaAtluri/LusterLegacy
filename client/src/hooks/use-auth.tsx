import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  stableLoading: boolean;  // Added for more stable UI transitions
  error: Error | null;
  loginMutation: UseMutationResult<Omit<User, "password">, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<Omit<User, "password">, Error, RegisterData>;
  updateNotificationPreferences: (preferences: NotificationPreferences) => Promise<boolean>;
};

// Type for notification preferences
type NotificationPreferences = {
  notifyDesignUpdates?: boolean;
  notifyOrderStatus?: boolean;
  notifyQuoteResponses?: boolean;
};

// Data type for login
type LoginData = {
  loginID: string;
  password: string;
};

// Data type for registration based on insertUserSchema but explicitly adding role
const registerSchema = insertUserSchema.extend({
  role: z.string().optional().default("customer")
});
type RegisterData = z.infer<typeof registerSchema>;

// Create context with proper defaults - Note: don't use 'export const' to improve HMR compatibility
const AuthContext = createContext<AuthContextType | null>(null);

// Export the context separately for better HMR compatibility
export { AuthContext };

// Provider component - separate from context creation
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [stableLoading, setStableLoading] = useState(true);
  const [cachedUser, setCachedUser] = useState<User | null>(null);
  const [isProductionEnv, setIsProductionEnv] = useState(false);
  
  // Detect production environment for special optimizations
  useEffect(() => {
    const isProduction = window.location.hostname.includes('.replit.app') || 
                      !window.location.hostname.includes('localhost');
    setIsProductionEnv(isProduction);
    console.log(`Environment detected: ${isProduction ? 'Production' : 'Development'}`);
  }, []);
  
  // Load cached auth data on first render for immediate UI stability
  useEffect(() => {
    try {
      // First try session storage (more secure)
      const cachedUserData = sessionStorage.getItem('cached_user_data');
      if (cachedUserData) {
        const userData = JSON.parse(cachedUserData);
        // Set the cached data immediately to prevent initial flashing
        setCachedUser(userData);
        // Also populate React Query cache for consistency
        queryClient.setQueryData(["/api/user"], userData);
        console.log("Loaded cached user data from session storage:", userData);
      } else {
        // Fall back to localStorage as a secondary option
        const localUserData = localStorage.getItem('cached_user_data');
        if (localUserData) {
          const userData = JSON.parse(localUserData);
          setCachedUser(userData);
          queryClient.setQueryData(["/api/user"], userData);
          console.log("Loaded cached user data from local storage:", userData);
        }
      }
    } catch (error) {
      console.error("Error loading cached auth data:", error);
    }
  }, []);
  
  // Query to get the current user (if logged in)
  const {
    data: user,
    error,
    isLoading,
    refetch: refetchUser
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: isProductionEnv ? 3 : 1, // More retries in production
    refetchOnWindowFocus: !isProductionEnv, // Don't refetch on window focus in production
    refetchOnMount: !isProductionEnv, // More aggressive caching in production
    refetchInterval: isProductionEnv ? false : 10000, // Disable interval in production
    staleTime: isProductionEnv ? 1000 * 60 * 30 : 0, // 30 minute cache in production
    gcTime: isProductionEnv ? 1000 * 60 * 60 : 1000 * 60 * 5, // Longer cache in production
    // Critical optimization: use cached data while revalidating in background
    // This prevents the UI from showing loading state during revalidation
    placeholderData: cachedUser
  });
  
  // Cache freshly loaded user data for future use
  useEffect(() => {
    if (user && !isLoading) {
      try {
        const userData = JSON.stringify(user);
        sessionStorage.setItem('cached_user_data', userData);
        localStorage.setItem('cached_user_data', userData);
        console.log("Updated cached user data in storage");
      } catch (error) {
        console.warn("Failed to cache user data:", error);
      }
    }
  }, [user, isLoading]);
  
  // Stabilize loading state to prevent flickering
  useEffect(() => {
    // IMPORTANT: If we're in production with cached data, skip loading state entirely
    if (isProductionEnv && cachedUser) {
      console.log("Production environment with cached data - bypassing loading state");
      setStableLoading(false);
      return;
    }
    
    // When we start loading, immediately set stableLoading to true
    if (isLoading) {
      setStableLoading(true);
      return;
    }
    
    // CRITICAL FIX: When loading is complete, immediately set stableLoading to false
    // Don't use a timeout as it can cause infinite loading loops
    setStableLoading(false);
    
    // No delayed state update for production to avoid UI issues
    return () => {}; // No cleanup needed
  }, [isLoading, cachedUser, isProductionEnv]);
  
  console.log("Auth Context - User data:", user);
  console.log("Auth Context - Loading:", isLoading);
  console.log("Auth Context - Error:", error);
  console.log("Auth Context - Raw Loading:", isLoading);
  console.log("Auth Context - Stable Loading:", stableLoading);

  // Mutation for login
  const loginMutation = useMutation<Omit<User, "password">, Error, LoginData>({
    mutationFn: async (credentials: LoginData) => {
      // First try logging in with the main auth system
      console.log("Attempting login with primary auth system...");
      const res = await apiRequest("POST", "/api/login", credentials, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        }
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Login failed");
      }
      
      const userData = await res.json();
      console.log("Login API response:", userData);
      
      // For admin users, also log in to the legacy admin system for compatibility
      if (userData.role === "admin") {
        console.log("Admin user detected, ensuring both auth systems are in sync");
        try {
          // Also log in to the admin system
          const adminLoginRes = await apiRequest("POST", "/api/auth/login", credentials, {
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              "Pragma": "no-cache",
              "Expires": "0"
            }
          });
          if (adminLoginRes.ok) {
            console.log("Successfully logged into both auth systems");
            // Perform additional admin auth verification to ensure we're fully logged in
            await new Promise(resolve => setTimeout(resolve, 300));  // Small delay
            
            const adminVerifyRes = await fetch('/api/auth/me', { 
              credentials: 'include',
              headers: {
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
              }
            });
            
            if (adminVerifyRes.ok) {
              console.log("Admin auth successfully verified with /api/auth/me");
            } else {
              console.warn("Admin auth verification failed - admin login may not be fully established");
              // Try one more time with the admin login
              await apiRequest("POST", "/api/auth/login", credentials);
            }
          } else {
            console.warn("Admin login succeeded but legacy admin auth failed");
            // Make one more attempt
            await apiRequest("POST", "/api/auth/login", credentials);
          }
        } catch (error) {
          console.warn("Error during admin compatibility login:", error);
          // Try one more time in case of a network error
          try {
            await apiRequest("POST", "/api/auth/login", credentials);
          } catch (secondError) {
            console.warn("Second attempt at admin login also failed:", secondError);
          }
        }
      }
      
      return userData;
    },
    onSuccess: (userData) => {
      // Log the user data to see what's happening
      console.log("Login success - user data:", userData);
      
      // First invalidate any stale queries
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      // Then update the query cache with user data
      queryClient.setQueryData(["/api/user"], userData);
      
      // Immediately verify the auth state by fetching fresh user data
      setTimeout(async () => {
        try {
          const userResponse = await fetch('/api/user', {
            credentials: "include",
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              "Pragma": "no-cache",
              "Expires": "0"
            }
          });
          
          if (userResponse.ok) {
            const freshUserData = await userResponse.json();
            console.log("Auth verified with fresh data:", freshUserData);
            queryClient.setQueryData(["/api/user"], freshUserData);
          } else {
            console.error("Auth verification failed - still not authenticated after login");
          }
        } catch (error) {
          console.error("Error verifying auth state:", error);
        }
      }, 300);
      
      // Show appropriate toast message based on role
      if (userData.role === "admin") {
        console.log("Admin user detected - redirecting to dashboard");
        
        // Show toast first
        toast({
          title: "Admin login successful",
          description: `Welcome back, ${userData.name || userData.loginID}!`,
        });
        
        // Use a longer timeout to ensure the user data is set in queryClient
        // and toast is visible before redirect
        setTimeout(() => {
          try {
            console.log("Executing admin redirect after delay");
            // First try with full URL
            window.location.href = window.location.origin + "/admin/dashboard";
          } catch (navError) {
            console.error("Navigation error:", navError);
            // Fallback method - use pathname directly
            window.location.pathname = "/admin/dashboard";
          }
        }, 500); // Longer delay to ensure authentication is properly established
      } else {
        toast({
          title: "Login successful",
          description: `Welcome ${userData.name || userData.loginID}!`,
        });
        
        // Check for returnTo parameter in URL
        const params = new URLSearchParams(window.location.search);
        const returnTo = params.get("returnTo");
        
        // If we came from the home page custom form, log that info
        console.log("Form context path check:", {
          fromHomePage: window.location.pathname === "/auth" && window.location.search.includes("returnTo=%2Fcustom-design"),
          fromPath: document.referrer,
          formDataExists: sessionStorage.getItem('designFormData') !== null
        });
        
        // If no explicit returnTo but we have saved design form data, redirect to custom design page
        const hasSavedDesignForm = sessionStorage.getItem('designFormData') !== null;
        let redirectPath = returnTo;
        
        if (!redirectPath) {
          if (hasSavedDesignForm) {
            redirectPath = "/custom-design"; // If form data exists, go to design page
          } else {
            redirectPath = "/"; // Otherwise go to homepage
          }
        }
        
        // Force a direct window location change for customers
        console.log("REDIRECTING CUSTOMER NOW: setting window.location.href directly to", window.location.origin + redirectPath);
        
        // DEBUG - show the current URL for analysis
        console.log("Current window.location:", {
          href: window.location.href,
          origin: window.location.origin,
          pathname: window.location.pathname,
          host: window.location.host,
          protocol: window.location.protocol,
          search: window.location.search,
          hash: window.location.hash,
          returnTo: returnTo
        });
        
        // Give the toast a moment to be visible
        setTimeout(() => {
          try {
            // First try with full origin
            window.location.href = window.location.origin + redirectPath;
          } catch (navError) {
            console.error("Navigation error:", navError);
            // Fallback method - use pathname directly
            window.location.pathname = redirectPath;
          }
        }, 300);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for registration
  const registerMutation = useMutation<Omit<User, "password">, Error, RegisterData>({
    mutationFn: async (userData: RegisterData) => {
      console.log("Attempting to register with data:", {
        ...userData,
        password: userData.password ? "REDACTED" : undefined,
        hasPassword: !!userData.password,
        passwordLength: userData.password?.length || 0
      });
      
      try {
        const res = await apiRequest("POST", "/api/register", userData);
        console.log("Registration API response status:", res.status);
        
        if (!res.ok) {
          let errorMessage = "Registration failed";
          try {
            const errorData = await res.json();
            console.error("Registration API error details:", errorData);
            errorMessage = errorData.message || `Registration failed with status: ${res.status}`;
          } catch (parseError) {
            console.error("Failed to parse error response:", parseError);
            errorMessage = `Registration failed with status: ${res.status}`;
          }
          throw new Error(errorMessage);
        }
        
        const data = await res.json();
        console.log("Registration success response:", {
          id: data.id,
          name: data.name,
          loginID: data.loginID,
          role: data.role
        });
        return data;
      } catch (error) {
        console.error("Registration request error:", error);
        throw error;
      }
    },
    onSuccess: (userData) => {
      console.log("Registration success - user data:", userData);
      
      // Update the query cache with user data
      queryClient.setQueryData(["/api/user"], userData);
      
      // Force refetch user data to ensure we have the most up-to-date session
      refetchUser();
      
      toast({
        title: "Registration successful",
        description: `Welcome to Luster Legacy, ${userData.name || userData.loginID}!`,
      });
      
      // Check for returnTo parameter in URL, also for registration
      const params = new URLSearchParams(window.location.search);
      const returnTo = params.get("returnTo");
      
      // If no explicit returnTo but we have saved design form data, redirect to custom design page
      const hasSavedDesignForm = sessionStorage.getItem('designFormData') !== null;
      let redirectPath = returnTo;
      
      if (!redirectPath) {
        if (hasSavedDesignForm) {
          redirectPath = "/custom-design"; // If form data exists, go to design page
        } else {
          redirectPath = "/"; // Otherwise go to homepage
        }
      }
      
      // Use direct navigation for registration redirect
      console.log("REDIRECTING NEW CUSTOMER NOW: setting window.location.href directly to", window.location.origin + redirectPath);
      
      // DEBUG - show the current URL for analysis
      console.log("Current window.location (registration):", {
        href: window.location.href,
        origin: window.location.origin,
        pathname: window.location.pathname,
        host: window.location.host,
        protocol: window.location.protocol,
        search: window.location.search,
        hash: window.location.hash,
        returnTo: returnTo
      });
      
      // Give the toast a moment to be visible
      setTimeout(() => {
        try {
          // First try with full origin
          window.location.href = window.location.origin + redirectPath;
        } catch (navError) {
          console.error("Navigation error during registration redirect:", navError);
          // Fallback method
          window.location.pathname = redirectPath;
        }
      }, 300);
    },
    onError: (error: Error) => {
      console.error("Registration error handler received:", error);
      
      // Extract specific error message or use a generic one
      let errorMessage = error.message || "An error occurred during registration. Please try again.";
      
      // Log detailed error information
      console.error({
        errorMessage,
        errorObject: error,
        errorStack: error.stack
      });
      
      // Show toast with error details
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Mutation for logout - handles both auth systems
  const logoutMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      console.log("Unified logout - logging out from both auth systems");
      
      try {
        // First try admin system logout
        console.log("1. Attempting admin auth system logout...");
        try {
          const adminLogoutRes = await apiRequest("POST", "/api/auth/logout");
          if (adminLogoutRes.ok) {
            console.log("Admin auth logout successful");
          } else {
            console.warn("Admin auth logout returned non-ok status:", adminLogoutRes.status);
          }
        } catch (adminError) {
          console.warn("Admin auth logout error (continuing):", adminError);
        }
        
        // Then do main system logout
        console.log("2. Attempting main auth system logout...");
        const mainLogoutRes = await apiRequest("POST", "/api/logout");
        
        if (!mainLogoutRes.ok) {
          const errorData = await mainLogoutRes.json();
          throw new Error(errorData.message || "Main logout failed");
        }
        
        console.log("Main auth logout successful");
        
        // Verify logout by checking both endpoints
        console.log("3. Verifying logout status...");
        try {
          // Check main auth endpoint
          const mainCheck = await apiRequest("GET", "/api/user");
          if (mainCheck.status !== 401) {
            console.warn("Main auth session still active after logout! Status:", mainCheck.status);
          } else {
            console.log("Main auth session properly terminated");
          }
          
          // Check admin auth endpoint
          const adminCheck = await apiRequest("GET", "/api/auth/me");
          if (adminCheck.status !== 401) {
            console.warn("Admin auth session still active after logout! Status:", adminCheck.status);
          } else {
            console.log("Admin auth session properly terminated");
          }
        } catch (verifyError) {
          console.warn("Error during logout verification (continuing):", verifyError);
        }
        
        console.log("Logout process completed");
      } catch (error) {
        console.error("Logout process failed:", error);
        // Try one more fallback approach - force clear cookies
        try {
          console.log("Attempting fallback cookie clearing through iframe...");
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          iframe.src = '/api/auth/logout';
          document.body.appendChild(iframe);
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        } catch (fallbackError) {
          console.error("Even fallback logout failed:", fallbackError);
        }
        throw error;
      }
    },
    onSuccess: () => {
      console.log("Logout successful, clearing client-side auth state");
      
      // Clear all user data from cache
      queryClient.setQueryData(["/api/user"], null);
      
      // Invalidate all auth-related queries to ensure fresh state
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
      // Clear design form data from session storage
      try {
        console.log("Clearing design form data from session storage");
        sessionStorage.removeItem('designFormData');
      } catch (error) {
        console.error("Error clearing session storage:", error);
      }
      
      // Force refetch to confirm logout state from server
      refetchUser();
      
      toast({
        title: "Logged out successfully",
        description: "You have been securely logged out of your account",
      });
      
      // Redirect to login page after logout
      console.log("REDIRECTING TO LOGIN AFTER LOGOUT");
      window.location.href = "/auth";
    },
    onError: (error: Error) => {
      console.error("Logout mutation error handler:", error);
      
      // Even if the official logout failed, still clear the local state
      queryClient.setQueryData(["/api/user"], null);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
      // Clear design form data from session storage even if logout fails
      try {
        console.log("Clearing design form data from session storage after failed logout");
        sessionStorage.removeItem('designFormData');
      } catch (error) {
        console.error("Error clearing session storage:", error);
      }
      
      toast({
        title: "Logout issue",
        description: "Your session may still be active on the server. Please refresh the page.",
        variant: "destructive",
      });
      
      // Even with errors, redirect to auth page
      console.log("REDIRECTING TO AUTH PAGE AFTER FAILED LOGOUT");
      window.location.href = "/auth";
    },
  });

  // Log both loading states for debugging
  console.log("Auth Context - Raw Loading:", isLoading);
  console.log("Auth Context - Stable Loading:", stableLoading);
  
  // Function to update notification preferences
  const updateNotificationPreferences = async (preferences: NotificationPreferences): Promise<boolean> => {
    try {
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to update notification preferences",
          variant: "destructive",
        });
        return false;
      }
      
      const response = await apiRequest("POST", "/api/user/notifications", preferences);
      
      if (!response.ok) {
        const error = await response.json();
        toast({
          title: "Update Failed",
          description: error.message || "Failed to update notification preferences",
          variant: "destructive",
        });
        return false;
      }
      
      const updatedUser = await response.json();
      
      // Update the user data in the cache
      queryClient.setQueryData(["/api/user"], updatedUser);
      
      // Update the local cache
      try {
        const userData = JSON.stringify(updatedUser);
        sessionStorage.setItem('cached_user_data', userData);
        localStorage.setItem('cached_user_data', userData);
        
        // Also trigger a refresh of the user data from the server
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      } catch (error) {
        console.warn("Failed to cache updated user data:", error);
      }
      
      return true;
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "An error occurred while updating your preferences",
        variant: "destructive",
      });
      console.error("Error updating notification preferences:", error);
      return false;
    }
  };
  
  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading, // Keep the original isLoading state
        stableLoading, // Expose the stable loading state for UI components
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        updateNotificationPreferences,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}