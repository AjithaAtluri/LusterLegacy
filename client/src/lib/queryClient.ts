import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: {
    isFormData?: boolean;
    headers?: Record<string, string>;
  }
): Promise<Response> {
  const headers: Record<string, string> = options?.headers || {};
  let body: any = undefined;
  
  if (data) {
    if ((options?.isFormData) || data instanceof FormData) {
      // Don't set Content-Type for FormData; browser will set it with boundary
      body = data;
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(data);
    }
  }
  
  // Enhanced auth headers for admin endpoints
  // Always include cache control headers for auth requests
  headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
  headers["Pragma"] = "no-cache";
  headers["Expires"] = "0";
  
  // Enhanced debugging for admin and AI APIs
  const isAdminEndpoint = url.includes('/admin/');
  const isAIEndpoint = url.includes('generate') || url.includes('analyze') || url.includes('content');
  
  // Debug level varies by endpoint type and environment
  const isDev = import.meta.env.DEV;
  const shouldLog = isDev && (isAdminEndpoint || isAIEndpoint);
  
  if (shouldLog) {
    console.log(`Making ${isAIEndpoint ? 'AI' : 'admin'} API request to ${url}`);
    
    // For AI endpoints, add special debug header
    if (isAIEndpoint) {
      headers["X-Debug-AI-Request"] = "true";
    }
  }

  try {
    // Use same-origin credentials mode for all requests to ensure cookies are sent
    const res = await fetch(url, {
      method,
      headers,
      body,
      credentials: "include", // Always include credentials for auth cookies
    });
    
    if (shouldLog) {
      console.log(`${isAIEndpoint ? 'AI' : 'Admin'} API response status: ${res.status} for ${url}`);
      
      // Only log error details in dev mode
      if (isAIEndpoint && !res.ok) {
        console.error(`AI endpoint error: ${res.status}`);
      }
    }

    await throwIfResNotOk(res);
    
    // Return response instead of trying to parse it
    return res;
  } catch (error) {
    console.error(`API request error to ${url}:`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include", // Always include credentials for all requests
        headers: {
          "Cache-Control": "no-cache", // Prevent caching auth state
          "Pragma": "no-cache"
        }
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        if (import.meta.env.DEV) {
          console.log(`Auth query returned 401 for ${queryKey[0]}, returning null`);
        }
        return null;
      }

      await throwIfResNotOk(res);
      const data = await res.json();
      if (import.meta.env.DEV) {
        console.log(`Auth query successful for ${queryKey[0]}`);
      }
      return data;
    } catch (error) {
      // Only log the error message, not the full error object in production
      if (import.meta.env.DEV) {
        console.error(`Error in query ${queryKey[0]}:`, error);
      } else {
        console.error(`Error in query ${queryKey[0]}`);
      }
      throw error;
    }
  };

// Development helper functions
export const devHelpers = {
  /**
   * Direct login utility for development purposes only
   * This bypasses password verification and directly authenticates as the given user
   * @param username Username to login as
   * @returns Promise with login result
   */
  async directLogin(username: string): Promise<any> {
    console.log(`[DEV] Attempting direct login as: ${username}`);
    try {
      const response = await fetch(`/api/debug/direct-login/${username}`, {
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Direct login failed: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log(`[DEV] Direct login successful:`, result);
      
      // First invalidate any stale data 
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      // After direct login, fetch the user data to update the React Query cache
      try {
        // Explicit anti-cache headers to ensure we get fresh data
        const userResponse = await fetch('/api/user', {
          credentials: "include",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
          }
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          console.log("[DEV] Fetched user data after login:", userData);
          
          // Log complete auth state for debugging
          console.log("[DEV] Complete authentication state:", {
            userData,
            cookies: document.cookie
          });
          
          // Directly update the cache with fresh user data
          queryClient.setQueryData(["/api/user"], userData);
          
          // Force cache invalidation for all related queries to ensure fresh data
          queryClient.invalidateQueries();
          
          // Execute redirect with a short delay to allow cache updates to propagate
          setTimeout(() => {
            if (result.redirectTo) {
              console.log("[DEV] Redirecting to:", result.redirectTo);
              console.log("[DEV] Current URL:", window.location.href);
              console.log("[DEV] Target URL:", window.location.origin + result.redirectTo);
              
              // Use the most reliable redirect method with full URL
              window.location.href = window.location.origin + result.redirectTo;
            } else {
              console.log("[DEV] No redirect specified, reloading page");
              window.location.reload();
            }
          }, 300);
          
          return;
        } else {
          console.warn("[DEV] Failed to fetch user data after login:", userResponse.status);
        }
      } catch (fetchError) {
        console.error("[DEV] Error fetching user data after login:", fetchError);
      }
      
      // Fallback: force a page reload as last resort
      console.log("[DEV] Using fallback redirect mechanism");
      setTimeout(() => {
        if (result.redirectTo) {
          window.location.href = window.location.origin + result.redirectTo;
        } else {
          window.location.reload();
        }
      }, 500);
      
      return result;
    } catch (error) {
      console.error(`[DEV] Direct login error:`, error);
      throw error;
    }
  },
  
  /**
   * Check authentication status
   * @returns Promise with current user info or null if not authenticated
   */
  async checkAuthStatus(): Promise<any> {
    try {
      console.log('[DEV] Performing comprehensive auth status check');
      
      // First check main auth system
      const mainResponse = await fetch('/api/user', {
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate", 
          "Pragma": "no-cache",
          "Expires": "0"
        }
      });
      
      // Then check admin auth system
      const adminResponse = await fetch('/api/auth/me', {
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate", 
          "Pragma": "no-cache",
          "Expires": "0"
        }
      });
      
      // Get session info
      const sessionResponse = await fetch('/api/debug/session', {
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate", 
          "Pragma": "no-cache",
          "Expires": "0"
        }
      });
      
      // Analyze results
      const mainAuthStatus = mainResponse.status === 200 ? 'authenticated' : 'not authenticated';
      const adminAuthStatus = adminResponse.status === 200 ? 'authenticated' : 'not authenticated';
      const sessionInfo = sessionResponse.ok ? await sessionResponse.json() : null;
      
      console.log(`[DEV] Auth check results: Main auth: ${mainAuthStatus}, Admin auth: ${adminAuthStatus}`);
      console.log('[DEV] Session info:', sessionInfo);
      
      // Check cookies without displaying values
      const cookies = document.cookie.split(';').map(cookie => cookie.trim().split('=')[0]);
      console.log('[DEV] Cookies present:', cookies);
      
      // If main auth is authenticated, return the user data
      if (mainResponse.status === 200) {
        try {
          const user = await mainResponse.json();
          console.log('[DEV] User is authenticated:', user);
          
          // Also update the React Query cache with this user data
          queryClient.setQueryData(["/api/user"], user);
          
          return {
            authenticated: true,
            user,
            mainAuth: true,
            adminAuth: adminResponse.status === 200,
            sessionInfo,
            cookies
          };
        } catch (parseError) {
          console.error('[DEV] Error parsing user data:', parseError);
        }
      }
      
      // If we reach here, user is not authenticated
      console.log('[DEV] User is not authenticated');
      return {
        authenticated: false,
        user: null,
        mainAuth: false,
        adminAuth: adminResponse.status === 200,
        sessionInfo,
        cookies
      };
    } catch (error) {
      console.error('[DEV] Auth check error:', error);
      return {
        authenticated: false,
        user: null,
        error: String(error)
      };
    }
  },
  
  /**
   * List all users in the system (for debugging only)
   * @returns Promise with list of users
   */
  async listAllUsers(): Promise<any[]> {
    try {
      const response = await fetch('/api/debug/users', {
        credentials: "include"
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`User list failed: ${response.status} - ${errorText}`);
      }
      
      const users = await response.json();
      console.log('[DEV] User list:', users);
      return users;
    } catch (error) {
      console.error('[DEV] User list error:', error);
      return [];
    }
  }
};

// Create environment-specific Query Client configuration
const isDev = import.meta.env.DEV;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: isDev ? false : true, // Enable refetching on window focus in production
      staleTime: isDev ? Infinity : 5 * 60 * 1000, // 5 minutes stale time in production
      retry: isDev ? false : 1, // Allow one retry in production
      retryDelay: 1000, // 1 second delay between retries
      gcTime: 10 * 60 * 1000, // 10 minutes before unused data is garbage collected
      networkMode: 'online', // Only fetch when online
    },
    mutations: {
      retry: isDev ? false : 1,
      retryDelay: 1000,
      networkMode: 'online',
    },
  },
});
