/**
 * Admin Authentication Storage Utility
 * Provides persistent caching for admin authentication to prevent infinite loading issues
 */

// Key for storing admin auth data in session storage
const ADMIN_AUTH_KEY = 'luster_legacy_admin_auth';

// Maximum time admin auth data is considered valid (4 hours in milliseconds)
const MAX_AUTH_AGE = 4 * 60 * 60 * 1000;

// Interface for admin auth data structure
export interface AdminAuthData {
  id: number;
  username?: string;
  loginID?: string;
  role: string;
  email?: string;
  authTime: number;
  authSource: string;
}

/**
 * Saves admin authentication data to session storage
 */
export function saveAdminAuth(authData: AdminAuthData): void {
  try {
    // Add current timestamp to track when this data was cached
    const dataToStore = {
      ...authData,
      authTime: Date.now(),
      authSource: authData.authSource || 'session_storage'
    };
    
    // Store in session storage
    sessionStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify(dataToStore));
    console.log('Updated cached user data in storage');
  } catch (error) {
    console.error('Error saving admin auth data to session storage:', error);
  }
}

/**
 * Retrieves admin authentication data from session storage
 * Returns null if no data is found or if data is expired
 */
export function getAdminAuth(): AdminAuthData | null {
  try {
    // Get data from session storage
    const storedData = sessionStorage.getItem(ADMIN_AUTH_KEY);
    if (!storedData) {
      return null;
    }
    
    // Parse the data
    const authData = JSON.parse(storedData) as AdminAuthData;
    
    // Check if the data is expired
    const now = Date.now();
    if (now - authData.authTime > MAX_AUTH_AGE) {
      console.log('Cached admin auth data is expired');
      // Clear expired data
      sessionStorage.removeItem(ADMIN_AUTH_KEY);
      return null;
    }
    
    console.log('Loaded cached user data from session storage:', authData);
    return authData;
  } catch (error) {
    console.error('Error retrieving admin auth data from session storage:', error);
    return null;
  }
}

/**
 * Clears admin authentication data from session storage
 */
export function clearAdminAuth(): void {
  try {
    sessionStorage.removeItem(ADMIN_AUTH_KEY);
    console.log('Cleared admin auth data from session storage');
  } catch (error) {
    console.error('Error clearing admin auth data from session storage:', error);
  }
}

/**
 * Verifies if the stored admin authentication data is valid
 * and belongs to an admin or limited-admin
 */
export function isValidAdminAuth(): boolean {
  const authData = getAdminAuth();
  
  if (!authData) {
    return false;
  }
  
  // Check if user has admin role
  return authData.role === 'admin' || authData.role === 'limited-admin';
}

/**
 * Force update the auth time to extend the session
 */
export function refreshAdminAuthTime(): void {
  try {
    const authData = getAdminAuth();
    if (authData) {
      saveAdminAuth({
        ...authData,
        authTime: Date.now()
      });
      console.log('Refreshed admin auth timestamp');
    }
  } catch (error) {
    console.error('Error refreshing admin auth timestamp:', error);
  }
}