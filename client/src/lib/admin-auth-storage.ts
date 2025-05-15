/**
 * Admin Authentication Storage
 * 
 * Provides utilities for storing and retrieving admin authentication data
 * from session storage to maintain login state between page refreshes
 * and handle authentication timeout situations in production.
 */

// Storage key for admin authentication data
const ADMIN_AUTH_STORAGE_KEY = 'luster_admin_auth';

// Set expiration time for admin session cache (4 hours)
const AUTH_EXPIRATION_MS = 4 * 60 * 60 * 1000; 

/**
 * Admin authentication data structure
 */
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
    // Ensure authTime is set
    if (!authData.authTime) {
      authData.authTime = Date.now();
    }
    
    // Save to session storage
    sessionStorage.setItem(ADMIN_AUTH_STORAGE_KEY, JSON.stringify(authData));
    console.log('Updated cached user data in storage');
  } catch (error) {
    console.error('Failed to save admin auth data to session storage:', error);
  }
}

/**
 * Retrieves admin authentication data from session storage
 * Returns null if no data is found or if data is expired
 */
export function getAdminAuth(): AdminAuthData | null {
  try {
    // Get data from session storage
    const storedData = sessionStorage.getItem(ADMIN_AUTH_STORAGE_KEY);
    if (!storedData) {
      return null;
    }
    
    // Parse the stored data
    const authData: AdminAuthData = JSON.parse(storedData);
    
    // Check if data is expired (4 hours)
    if (Date.now() - authData.authTime > AUTH_EXPIRATION_MS) {
      console.log('Admin auth data is expired, clearing');
      clearAdminAuth();
      return null;
    }
    
    return authData;
  } catch (error) {
    console.error('Failed to retrieve admin auth data from session storage:', error);
    return null;
  }
}

/**
 * Clears admin authentication data from session storage
 */
export function clearAdminAuth(): void {
  try {
    sessionStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear admin auth data from session storage:', error);
  }
}

/**
 * Verifies if the stored admin authentication data is valid
 * and belongs to an admin or limited-admin
 */
export function isValidAdminAuth(): boolean {
  const authData = getAdminAuth();
  
  // Check if we have valid auth data
  if (!authData) {
    return false;
  }
  
  // Check if the role is admin or limited-admin
  return authData.role === 'admin' || authData.role === 'limited-admin';
}

/**
 * Force update the auth time to extend the session
 */
export function refreshAdminAuthTime(): void {
  try {
    const authData = getAdminAuth();
    if (authData) {
      authData.authTime = Date.now();
      saveAdminAuth(authData);
    }
  } catch (error) {
    console.error('Failed to refresh admin auth time:', error);
  }
}