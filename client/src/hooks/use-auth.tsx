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
      const res = await apiRequest("POST", "/api/login", credentials);
      
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
          const adminLoginRes = await apiRequest("POST", "/api/auth/login", credentials);
          if (adminLoginRes.ok) {
            console.log("Successfully logged into both auth systems");
          } else {
            console.warn("Admin login succeeded but legacy admin auth failed");
          }
        } catch (error) {
          console.warn("Error during admin compatibility login:", error);
          // Continue anyway since the main login succeeded
        }
      }
      
      return userData;
    },
    onSuccess: (userData) => {
      // Log the user data to see what's happening
      console.log("Login success - user data:", userData);
      
      // Update the query cache with user data
      queryClient.setQueryData(["/api/user"], userData);
      
      // Force refetch user data to ensure we have the most up-to-date session
      refetchUser();
      
      // Show appropriate toast message based on role
      if (userData.role === "admin") {
        console.log("Admin user detected - redirecting to dashboard");
        toast({
          title: "Admin login successful",
          description: `Welcome back, ${userData.username}!`,
        });
        
        // Add a slight delay to ensure toast is shown before redirect
        setTimeout(() => {
          // Use more forceful redirect for admin dashboard
          window.location.replace("/admin/dashboard");
        }, 500);
      } else {
        toast({
          title: "Login successful",
          description: `Welcome ${userData.username}!`,
        });
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
      queryClient.setQueryData(["/api/user"], userData);
      // Force refetch user data to ensure we have the most up-to-date session
      refetchUser();
      toast({
        title: "Registration successful",
        description: `Welcome to Luster Legacy, ${userData.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for logout
  const logoutMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      console.log("Logging out from primary auth system...");
      // First logout from the main system
      const res = await apiRequest("POST", "/api/logout");
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Logout failed");
      }
      
      // Also logout from admin auth system for compatibility
      try {
        console.log("Also logging out from admin auth system...");
        await apiRequest("POST", "/api/auth/logout");
        console.log("Successfully logged out from both auth systems");
      } catch (error) {
        console.warn("Error during admin logout:", error);
        // Continue anyway since the main logout succeeded
      }
    },
    onSuccess: () => {
      console.log("Logout successful, clearing auth state");
      // Clear user data from cache
      queryClient.setQueryData(["/api/user"], null);
      
      // Also ensure admin-specific endpoints are invalidated
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
      // Force refetch to confirm logout state from server
      refetchUser();
      
      toast({
        title: "Logged out successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
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