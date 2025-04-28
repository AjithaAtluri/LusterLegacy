import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

// Enhanced admin validation middleware with multi-token support
export const validateAdmin = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    console.log("ADMIN ACCESS - Validating admin request");
    
    // Try multiple admin auth methods, with priority on dedicated admin cookies
    
    // 1. First check admin dedicated cookie (most reliable)
    const adminId = req.cookies?.admin_id;
    if (adminId) {
      try {
        const parsedAdminId = parseInt(adminId);
        if (!isNaN(parsedAdminId)) {
          console.log("Admin auth check - found admin_id cookie:", parsedAdminId);
          
          const adminUser = await storage.getUser(parsedAdminId);
          if (adminUser && adminUser.role === 'admin') {
            console.log("Admin auth check - verified admin via dedicated admin cookie");
            
            // Set user on request for downstream handlers
            req.user = adminUser;
            
            // Also verify timestamp if available
            const authTime = req.cookies?.admin_auth_time;
            if (authTime) {
              const now = Date.now();
              const authTimeVal = parseInt(authTime);
              if (!isNaN(authTimeVal)) {
                const authAgeHours = (now - authTimeVal) / (1000 * 60 * 60);
                console.log(`Admin auth check - auth cookie age: ${authAgeHours.toFixed(2)} hours`);
                
                // If auth is too old (over 24 hours), refresh the timestamp
                if (authAgeHours > 24) {
                  console.log("Admin auth check - refreshing auth timestamp cookie");
                  res.cookie('admin_auth_time', Date.now(), { 
                    httpOnly: true, 
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    path: '/',
                    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
                  });
                }
              }
            }
            
            // Ensure passport session is synced if needed
            if (!req.isAuthenticated || !req.isAuthenticated()) {
              try {
                req.login(adminUser, (loginErr) => {
                  if (loginErr) {
                    console.warn("Admin auth check - could not sync passport session (non-critical):", loginErr);
                  }
                });
              } catch (sessionError) {
                console.warn("Admin auth check - error syncing sessions (non-critical):", sessionError);
              }
            }
            
            // Allow the request to proceed
            return next();
          } else if (adminUser) {
            console.log("Admin auth check - user found but not admin, role:", adminUser.role);
            // Clear invalid admin cookie
            res.clearCookie('admin_id', { path: '/' });
            res.clearCookie('admin_auth_time', { path: '/' });
          } else {
            console.log("Admin auth check - no user found for admin cookie ID:", parsedAdminId);
            // Clear invalid admin cookie
            res.clearCookie('admin_id', { path: '/' });
            res.clearCookie('admin_auth_time', { path: '/' });
          }
        }
      } catch (cookieError) {
        console.error("Admin auth check - error checking admin cookie:", cookieError);
      }
    }
    
    // 2. Next check legacy cookie auth (backward compatibility)
    const userId = req.cookies?.userId;
    if (userId) {
      try {
        const parsedUserId = parseInt(userId);
        if (!isNaN(parsedUserId)) {
          console.log("Admin auth check - found legacy userId cookie:", parsedUserId);
          
          const legacyUser = await storage.getUser(parsedUserId);
          if (legacyUser && legacyUser.role === 'admin') {
            console.log("Admin auth check - verified admin via legacy cookie");
            
            // Set user on request for downstream handlers
            req.user = legacyUser;
            
            // Set the new admin cookies for future requests
            console.log("Admin auth check - migrating to dedicated admin cookies");
            res.cookie('admin_id', legacyUser.id, { 
              httpOnly: true, 
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
              maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });
            res.cookie('admin_auth_time', Date.now(), { 
              httpOnly: true, 
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
              maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });
            
            // Sync passport session if needed
            if (!req.isAuthenticated || !req.isAuthenticated()) {
              try {
                req.login(legacyUser, (loginErr) => {
                  if (loginErr) {
                    console.warn("Admin auth check - could not sync passport (non-critical):", loginErr);
                  }
                });
              } catch (sessionError) {
                console.warn("Admin auth check - error syncing sessions (non-critical):", sessionError);
              }
            }
            
            // Allow the request to proceed
            return next();
          } else if (legacyUser) {
            console.log("Admin auth check - legacy user found but not admin, role:", legacyUser.role);
          } else {
            console.log("Admin auth check - no user found for legacy cookie ID:", parsedUserId);
          }
        }
      } catch (cookieError) {
        console.error("Admin auth check - error checking legacy cookie:", cookieError);
      }
    }
    
    // 3. Finally check passport session auth
    if (req.isAuthenticated && req.isAuthenticated()) {
      if (req.user && req.user.role === 'admin') {
        console.log("Admin auth check - verified admin via passport session");
        
        // Set admin cookies for future requests
        console.log("Admin auth check - setting admin cookies from passport session");
        res.cookie('admin_id', req.user.id, { 
          httpOnly: true, 
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        res.cookie('admin_auth_time', Date.now(), { 
          httpOnly: true, 
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        
        // Allow the request to proceed
        return next();
      } else {
        console.log("Admin auth check - passport user found but not admin");
        return res.status(403).json({ message: 'Admin access required' });
      }
    }
    
    // If we get here, no valid admin auth was found with any method
    console.log("Admin auth check - no admin authentication found by any method");
    return res.status(401).json({ message: 'Authentication required' });
  } catch (error) {
    console.error('Unexpected error validating admin:', error);
    res.status(500).json({ 
      message: 'Server error during authentication', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

// Calculate price based on options
export const calculatePrice = (
  basePrice: number, 
  metalTypeId: string, 
  stoneTypeId: string
): number => {
  const metalMultipliers: Record<string, number> = {
    '22kt-gold': 1.2,
    '18kt-gold': 1.0,
    '14kt-gold': 0.8,
    'silver-gold': 0.5
  };

  const stoneMultipliers: Record<string, number> = {
    'natural-polki': 1.5,
    'lab-polki': 1.2,
    'moissanite': 0.9,
    'natural-diamond': 2.0,
    'lab-diamond': 1.3,
    'swarovski': 0.7,
    'cz': 0.5,
    'pota': 0.4,
    'ruby': 1.3,
    'emerald': 1.4,
    'sapphire': 1.3
  };

  const metalMultiplier = metalMultipliers[metalTypeId] || 1.0;
  const stoneMultiplier = stoneMultipliers[stoneTypeId] || 1.0;

  return Math.round(basePrice * metalMultiplier * stoneMultiplier);
};

// Format currency (INR)
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};
