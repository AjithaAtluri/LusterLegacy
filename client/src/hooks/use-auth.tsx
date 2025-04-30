import { createContext, ReactNode, useContext } from "react";
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
  error: Error | null;
  loginMutation: UseMutationResult<Omit<User, "password">, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<Omit<User, "password">, Error, RegisterData>;
};

// Data type for login
type LoginData = {
  username: string;
  password: string;
};

// Data type for registration based on insertUserSchema but explicitly adding role
const registerSchema = insertUserSchema.extend({
  role: z.string().optional().default("customer")
});
type RegisterData = z.infer<typeof registerSchema>;

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  // Query to get the current user (if logged in)
  const {
    data: user,
    error,
    isLoading,
    refetch: refetchUser
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false, // Don't retry on 401 (not authenticated)
    refetchOnWindowFocus: true, // Allow refetching when focus returns to window
    refetchOnMount: true,
    staleTime: 1000 * 60 * 5, // Consider data stale after 5 minutes
  });
  
  console.log("Auth Context - User data:", user);
  console.log("Auth Context - Loading:", isLoading);
  console.log("Auth Context - Error:", error);

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
          description: `Welcome back, ${userData.username}!`,
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
          description: `Welcome ${userData.username}!`,
        });
        
        // Check for returnTo parameter in URL
        const params = new URLSearchParams(window.location.search);
        const returnTo = params.get("returnTo");
        const redirectPath = returnTo || "/customer-dashboard"; // Default to customer dashboard
        
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
      const res = await apiRequest("POST", "/api/register", userData);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Registration failed");
      }
      
      return await res.json();
    },
    onSuccess: (userData) => {
      console.log("Registration success - user data:", userData);
      
      // Update the query cache with user data
      queryClient.setQueryData(["/api/user"], userData);
      
      // Force refetch user data to ensure we have the most up-to-date session
      refetchUser();
      
      toast({
        title: "Registration successful",
        description: `Welcome to Luster Legacy, ${userData.username}!`,
      });
      
      // Check for returnTo parameter in URL, also for registration
      const params = new URLSearchParams(window.location.search);
      const returnTo = params.get("returnTo");
      const redirectPath = returnTo || "/customer-dashboard"; // Default to customer dashboard
      
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
      toast({
        title: "Registration failed",
        description: error.message,
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

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
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