import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { METAL_TYPES, STONE_TYPES } from "./constants";

// Centralized mapping of product IDs to their correct image paths
// This ensures consistent images across product cards, detail pages, and collections
export const PRODUCT_IMAGE_MAP: Record<number, string> = {
  23: "/uploads/9cffd119-20ca-461d-be69-fd53a03b177d.jpeg", // Ethereal Elegance
  22: "/uploads/9e0ee12c-3349-41a6-b615-f574b4e71549.jpeg", // Ethereal Navaratan
  21: "/uploads/08eca768-8ea6-4d12-974b-eb7707daca49.jpeg", // Majestic Emerald
  19: "/uploads/08a3cf15-9317-45ac-9968-aa58a5bf2220.jpeg", // Multigem Harmony
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency (INR)
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
}

// Get metal type by ID
export function getMetalType(id: string) {
  return METAL_TYPES.find(metal => metal.id === id) || METAL_TYPES[0];
}

// Get stone type by ID
export function getStoneType(id: string) {
  return STONE_TYPES.find(stone => stone.id === id) || STONE_TYPES[0];
}

/**
 * Universal function to handle image URLs across the application
 * This resolves the inconsistency between how images are stored in the database
 * and how they need to be served from the filesystem
 * 
 * @param url The image URL to process
 * @param productId Optional product ID to use for direct product image mapping
 */
export function getImageUrl(url: string | undefined, productId?: number): string {
  // If a product ID is provided, use our centralized mapping to ensure consistency
  if (productId !== undefined && PRODUCT_IMAGE_MAP[productId]) {
    console.log(`Using centralized product image mapping for product ID: ${productId}`);
    return PRODUCT_IMAGE_MAP[productId];
  }
  
  // Common missing image cases
  if (!url) {
    return "/uploads/test_jewelry.jpeg";
  }
  
  // If it's an absolute URL (starts with http/https or //)
  if (url.match(/^(https?:)?\/\//)) {
    return url;
  }
  
  // If it's a URL path starting with /uploads/
  if (url.startsWith('/uploads/')) {
    const filename = url.replace('/uploads/', '');
    
    // Skip debug screenshots and testing images
    if (filename.startsWith('screenshot-') || filename.startsWith('image_')) {
      console.log(`Skipping debug screenshot: ${filename}`);
      return "/uploads/test_jewelry.jpeg";
    }
    
    // Create a mapping of UUID filenames to known existing files
    const knownUuids: Record<string, string> = {
      // Map database UUIDs to actual files we know exist
      'c3cf99fd-6257-4b52-9843-88050e1ade00.jpeg': 'test_jewelry.jpeg',
      'bb374f67-4346-4ab8-9d47-ddc503508d35.jpeg': '9e0ee12c-3349-41a6-b615-f574b4e71549.jpeg',
      'edad80ba-8efe-4880-a31c-005ed2881a65.jpeg': '08eca768-8ea6-4d12-974b-eb7707daca49.jpeg',
      '890f5f5b-f6af-4db1-a2d4-ef28af6764b0.jpeg': '9cffd119-20ca-461d-be69-fd53a03b177d.jpeg',
      '0a6966da-a68b-47b2-9dee-90aa31808c8f.jpeg': '08a3cf15-9317-45ac-9968-aa58a5bf2220.jpeg',
      // Add any additional mappings here
    };
    
    // If we have a known mapping for this UUID, use it
    if (knownUuids[filename]) {
      return `/uploads/${knownUuids[filename]}`;
    }
    
    // If filename appears to be a UUID but we don't have a specific mapping,
    // check if it's a known extension and use our fallback
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpe?g|png|gif|webp)$/i;
    if (uuidPattern.test(filename)) {
      const extension = filename.split('.').pop()?.toLowerCase();
      if (extension === 'jpeg' || extension === 'jpg') {
        return '/uploads/test_jewelry.jpeg';
      } else if (extension === 'png') {
        // We could add other defaults for different file types here
        return '/uploads/test_jewelry.jpeg';
      }
    }
    
    // Default behavior: attempt direct access first, but provide an error handler
    return url;
  }
  
  // If it's a UUID filename without path
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpe?g|png|gif|webp)$/i;
  if (uuidPattern.test(url)) {
    return `/uploads/${url}`;
  }
  
  // For any other file path, ensure it has a leading slash
  if (!url.startsWith('/')) {
    return `/${url}`;
  }
  
  return url;
}

// Calculate price based on base price and selected options
export function calculatePrice(
  basePrice: number, 
  metalTypeId: string, 
  stoneTypeId: string
): number {
  const metal = getMetalType(metalTypeId);
  const stone = getStoneType(stoneTypeId);
  
  // Calculate final price with multipliers
  const price = basePrice * metal.priceMultiplier * stone.priceMultiplier;
  
  return Math.round(price);
}

// Calculate advance payment (50%)
export function calculateAdvancePayment(totalPrice: number): number {
  return Math.round(totalPrice * 0.5);
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Validate phone number format (simple validation)
export function isValidPhone(phone: string): boolean {
  const regex = /^[0-9]{10,12}$/;
  return regex.test(phone);
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// Get file extension
export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
}

// Check if file is image
export function isImageFile(file: File): boolean {
  const acceptedImageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
  return file && acceptedImageTypes.includes(file.type);
}

// Format date
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
