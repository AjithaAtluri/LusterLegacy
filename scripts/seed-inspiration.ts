import { db } from "../server/db";
import { inspirationGallery } from "../shared/schema";

// Sample inspiration gallery items
const inspirationItems = [
  {
    title: "Diamond Elegance Necklace",
    description: "Stunning diamond pendant with white gold chain",
    imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
    category: "necklaces",
    tags: ["diamond", "gold", "pendant"],
    featured: true
  },
  {
    title: "Sapphire Engagement Ring",
    description: "Classic sapphire center stone with diamond halo",
    imageUrl: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80",
    category: "rings",
    tags: ["sapphire", "diamond", "engagement"],
    featured: true
  },
  {
    title: "Pearl Drop Earrings",
    description: "Elegant pearl earrings with diamond accents",
    imageUrl: "https://images.unsplash.com/photo-1589128777073-263566ae5e4d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
    category: "earrings",
    tags: ["pearl", "diamond", "drop"],
    featured: false
  },
  {
    title: "Ruby Tennis Bracelet",
    description: "Stunning ruby bracelet with diamond details",
    imageUrl: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=688&q=80",
    category: "bracelets",
    tags: ["ruby", "diamond", "tennis"],
    featured: true
  },
  {
    title: "Emerald Statement Ring",
    description: "Bold emerald ring with intricate gold work",
    imageUrl: "https://images.unsplash.com/photo-1608042314453-ae338d80c427?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=690&q=80",
    category: "rings",
    tags: ["emerald", "gold", "statement"],
    featured: false
  },
  {
    title: "Diamond Chandelier Earrings",
    description: "Exquisite diamond earrings for special occasions",
    imageUrl: "https://images.unsplash.com/photo-1633810253710-7ed0bc822a0f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
    category: "earrings",
    tags: ["diamond", "chandelier", "statement"],
    featured: true
  },
  {
    title: "Gold Layered Necklace",
    description: "Trendy layered gold necklace with pendants",
    imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
    category: "necklaces",
    tags: ["gold", "layered", "pendant"],
    featured: false
  },
  {
    title: "Pearl and Diamond Bracelet",
    description: "Elegant bracelet featuring pearls and diamonds",
    imageUrl: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80",
    category: "bracelets",
    tags: ["pearl", "diamond", "elegant"],
    featured: true
  },
  {
    title: "Vintage Amethyst Ring",
    description: "Beautiful vintage-inspired amethyst ring",
    imageUrl: "https://images.unsplash.com/photo-1589674781759-c21c37956a44?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=880&q=80",
    category: "rings",
    tags: ["amethyst", "vintage", "gold"],
    featured: false
  },
  {
    title: "Platinum Wedding Band",
    description: "Timeless platinum wedding band with small diamonds",
    imageUrl: "https://images.unsplash.com/photo-1607703829739-c05b7beddf60?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=880&q=80",
    category: "rings",
    tags: ["platinum", "wedding", "diamond"],
    featured: true
  },
  {
    title: "Opal Stud Earrings",
    description: "Simple yet striking opal stud earrings",
    imageUrl: "https://images.unsplash.com/photo-1635767798638-3e25273a5800?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=764&q=80",
    category: "earrings",
    tags: ["opal", "stud", "simple"],
    featured: false
  },
  {
    title: "Men's Gold Chain",
    description: "Sophisticated gold chain for men",
    imageUrl: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=880&q=80",
    category: "necklaces",
    tags: ["gold", "chain", "men"],
    featured: true
  }
];

async function seed() {
  console.log("🌱 Seeding inspiration gallery items...");
  
  try {
    // Clear existing data
    await db.delete(inspirationGallery);
    console.log("Cleared existing inspiration gallery items");
    
    // Insert new items
    for (const item of inspirationItems) {
      await db.insert(inspirationGallery).values(item);
    }
    
    console.log(`✅ Successfully seeded ${inspirationItems.length} inspiration gallery items`);
  } catch (error) {
    console.error("❌ Error seeding inspiration gallery items:", error);
  } finally {
    process.exit(0);
  }
}

seed();