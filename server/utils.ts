import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

// Admin validation middleware
export const validateAdmin = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    // First check if this is using passport auth
    if (req.isAuthenticated && req.isAuthenticated()) {
      if (req.user && req.user.role === 'admin') {
        return next();
      } else {
        return res.status(403).json({ message: 'Admin access required' });
      }
    }
    
    // Fallback to cookie-based auth for legacy support
    const userId = req.cookies?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await storage.getUser(parseInt(userId));
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Add user to request for downstream middleware/handlers
    req.user = user;
    next();
  } catch (error) {
    console.error('Error validating admin:', error);
    res.status(500).json({ message: 'Server error during authentication' });
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
