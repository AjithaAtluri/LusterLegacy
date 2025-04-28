import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

// Enhanced admin validation middleware with multi-token support and improved diagnostics
export const validateAdmin = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const endpoint = req.originalUrl || req.url;
    const isAIEndpoint = endpoint.includes('generate') || endpoint.includes('analyze') || endpoint.includes('content');
    
    console.log(`ADMIN ACCESS - Validating admin request to ${endpoint}${isAIEndpoint ? ' [AI ENDPOINT]' : ''}`);
    
    // Give more detailed diagnostics for AI-related endpoints
    if (isAIEndpoint) {
      console.log("=== AI ENDPOINT ACCESS DIAGNOSTICS ===");
      console.log("X-Headers:", Object.keys(req.headers)
        .filter(key => key.toLowerCase().startsWith('x-'))
        .reduce((obj, key) => {
          obj[key] = req.headers[key];
          return obj;
        }, {} as Record<string, any>));
    }
    
    // Log detailed request info for debugging admin API calls
    console.log("Admin auth check - request details:", {
      method: req.method,
      path: endpoint,
      contentType: req.headers['content-type'],
      origin: req.headers.origin || req.headers.referer,
      cookies: Object.keys(req.cookies || {}),
      cookieValues: isAIEndpoint ? {
        adminId: req.cookies?.admin_id,
        userId: req.cookies?.userId,
        sessionID: req.sessionID
      } : undefined,
      hasBody: !!req.body,
      bodyKeys: req.body ? Object.keys(req.body) : [],
      sessionId: req.sessionID,
      isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false
    });
    
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
            console.log("Admin auth check - verified admin via dedicated admin cookie:", adminUser.username);
            
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
            console.log(`Admin auth GRANTED via admin_id cookie for ${endpoint}`);
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
    } else {
      console.log("Admin auth check - no admin_id cookie found");
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
            console.log("Admin auth check - verified admin via legacy cookie:", legacyUser.username);
            
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
            console.log(`Admin auth GRANTED via legacy userId cookie for ${endpoint}`);
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
    } else {
      console.log("Admin auth check - no legacy userId cookie found");
    }
    
    // 3. Finally check passport session auth
    if (req.isAuthenticated && req.isAuthenticated()) {
      console.log("Admin auth check - passport session is authenticated, checking user:", req.user);
      
      if (req.user && req.user.role === 'admin') {
        console.log("Admin auth check - verified admin via passport session:", req.user.username);
        
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
        console.log(`Admin auth GRANTED via passport session for ${endpoint}`);
        return next();
      } else if (req.user) {
        console.log("Admin auth check - passport user found but not admin, role:", req.user.role);
        return res.status(403).json({ 
          message: 'Admin access required', 
          detail: 'User is authenticated but lacks admin role'
        });
      } else {
        console.log("Admin auth check - passport session authenticated but no user object");
      }
    } else {
      console.log("Admin auth check - passport session is NOT authenticated");
    }
    
    // If we get here, no valid admin auth was found with any method
    console.log(`Admin auth DENIED for ${endpoint} - no admin authentication found with any method`);
    
    // Special handling for AI endpoints to aid in debugging
    if (isAIEndpoint) {
      console.log("=== AI ENDPOINT ACCESS FAILURE DETAILS ===");
      console.log("Full cookie list:", req.cookies);
      console.log("Session data:", req.session);
      console.log("Headers:", req.headers);
      
      // For AI endpoints, try to provide a more specific error message
      return res.status(401).json({
        message: 'AI Content Generation Authentication Failed',
        detail: 'Valid admin authentication not found for AI content generation. Please login as an admin user and try again.',
        endpoint: endpoint,
        authStatus: {
          adminCookie: !!req.cookies?.admin_id,
          legacyCookie: !!req.cookies?.userId,
          passportSession: !!(req.isAuthenticated && req.isAuthenticated()),
          hasSession: !!req.sessionID,
          hasCredentials: req.headers.authorization ? 'provided' : 'missing'
        },
        troubleshooting: "Try refreshing the admin page, logging out and back in, or clearing browser cookies and cache."
      });
    }
    
    // Standard admin auth failure response for non-AI endpoints
    return res.status(401).json({ 
      message: 'Authentication required',
      detail: 'Valid admin authentication not found. Please login as an admin user.',
      endpoint: endpoint,
      authMethods: {
        adminCookie: !!req.cookies?.admin_id,
        legacyCookie: !!req.cookies?.userId,
        passportSession: !!(req.isAuthenticated && req.isAuthenticated()),
      }
    });
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
