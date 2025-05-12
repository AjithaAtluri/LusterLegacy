// This file contains application-wide constants

// Country list for dropdowns with their calling codes
export const COUNTRIES = [
  { id: "in", name: "India", code: "+91" },
  { id: "us", name: "United States", code: "+1" },
  { id: "ae", name: "United Arab Emirates", code: "+971" },
  { id: "gb", name: "United Kingdom", code: "+44" },
  { id: "ca", name: "Canada", code: "+1" },
  { id: "au", name: "Australia", code: "+61" },
  { id: "sg", name: "Singapore", code: "+65" },
  { id: "hk", name: "Hong Kong", code: "+852" },
  { id: "my", name: "Malaysia", code: "+60" },
  { id: "sa", name: "Saudi Arabia", code: "+966" },
  { id: "qa", name: "Qatar", code: "+974" },
  { id: "kw", name: "Kuwait", code: "+965" },
  { id: "th", name: "Thailand", code: "+66" },
  { id: "jp", name: "Japan", code: "+81" },
  { id: "kr", name: "South Korea", code: "+82" },
  { id: "de", name: "Germany", code: "+49" },
  { id: "fr", name: "France", code: "+33" },
  { id: "ch", name: "Switzerland", code: "+41" },
  { id: "it", name: "Italy", code: "+39" },
  { id: "es", name: "Spain", code: "+34" }
];

// Customization options
export const METAL_TYPES = [
  { id: "22k-gold", name: "22K Gold", priceMultiplier: 1.2 },
  { id: "18k-gold", name: "18K Gold", priceMultiplier: 1.0 },
  { id: "14k-gold", name: "14K Gold", priceMultiplier: 0.8 }
];

export const STONE_TYPES = [
  { id: "lab-created-diamond", name: "Lab Created Diamond", priceMultiplier: 1.3 },
  { id: "lab-created-gems", name: "Lab Created Gems", priceMultiplier: 0.8 },
  { id: "lab-created-polki", name: "Lab Created Polki", priceMultiplier: 1.2 },
  { id: "natural-diamond", name: "Natural Diamond", priceMultiplier: 2.0 },
  { id: "natural-polki", name: "Natural Polki", priceMultiplier: 1.5 },
  { id: "onyx", name: "Onyx", priceMultiplier: 0.9 },
  { id: "precious-gems", name: "Precious Gems (Ruby, Emerald, Sapphire, etc)", priceMultiplier: 1.4 },
  { id: "semi-precious-gems", name: "Semi Precious Gems (Amethyst, Quartz, Morganite, etc)", priceMultiplier: 1.0 }
].sort((a, b) => a.name.localeCompare(b.name));

// Company details
export const COMPANY = {
  name: "Luster Legacy",
  email: "support@lusterlegacy.com",
  phone: "+919876543210",
  whatsapp: "919876543210",
  address: {
    line1: "Luster Legacy Design Studio",
    line2: "42 Luxury Lane, Diamond District",
    city: "Mumbai",
    state: "Maharashtra",
    postalCode: "400001",
    country: "India"
  },
  social: {
    instagram: "https://instagram.com/lusterlegacy",
    facebook: "https://facebook.com/lusterlegacy",
    pinterest: "https://pinterest.com/lusterlegacy"
  }
};

// Color scheme
export const COLORS = {
  gold: "hsl(46, 65%, 52%)",
  ivory: "hsl(60, 54%, 91%)",
  charcoal: "hsl(0, 0%, 13%)",
  plum: "hsl(292, 63%, 18%)",
  pearl: "hsl(36, 33%, 97%)",
  success: "#2E7D32",
  error: "#C62828"
};

// Payment terms
export const PAYMENT_TERMS = {
  ADVANCE_PERCENTAGE: 0.5, // 50% advance payment
  ADVANCE_DESCRIPTION: "This is an advance payment of 50% to begin crafting your jewelry.",
  REMAINING_DESCRIPTION: "The remaining 50% will be due before shipping once your item is completed.",
  cadFee: 150,  // CAD fee in USD
  cadFeeDescription: "design consultation & CAD fee"
};
