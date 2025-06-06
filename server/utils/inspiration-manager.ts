import fs from 'fs';
import path from 'path';
import { db } from '../db';
import { inspirationGallery, products } from '../../shared/schema';
import { eq } from 'drizzle-orm';

export class InspirationManager {
  private uploadsDir = path.join(process.cwd(), 'uploads');
  private attachedAssetsDir = path.join(process.cwd(), 'attached_assets');

  /**
   * Validate if an image file exists in the file system
   */
  private imageExists(imagePath: string): boolean {
    // Remove leading slash and check in uploads directory
    const cleanPath = imagePath.replace(/^\//, '');
    const fullPath = path.join(process.cwd(), cleanPath);
    
    return fs.existsSync(fullPath);
  }

  /**
   * Get a valid image path or find an alternative
   */
  private async getValidImagePath(imageUrl: string): Promise<string | null> {
    // Check if current image exists
    if (this.imageExists(imageUrl)) {
      return imageUrl;
    }

    // Try to find an alternative from existing products
    try {
      const validProducts = await db.select({ imageUrl: products.imageUrl })
        .from(products)
        .where(eq(products.imageUrl, imageUrl));

      if (validProducts.length > 0) {
        const productImage = validProducts[0].imageUrl;
        if (this.imageExists(productImage)) {
          return productImage;
        }
      }

      // Find any valid product image as fallback
      const allProducts = await db.select({ imageUrl: products.imageUrl })
        .from(products)
        .limit(20);

      for (const product of allProducts) {
        if (product.imageUrl && this.imageExists(product.imageUrl)) {
          return product.imageUrl;
        }
      }

      return null;
    } catch (error) {
      console.error('Error finding valid image path:', error);
      return null;
    }
  }

  /**
   * Validate and fix all inspiration gallery images
   */
  async validateAndFixImages(): Promise<{ fixed: number; removed: number }> {
    try {
      const allItems = await db.select().from(inspirationGallery);
      let fixed = 0;
      let removed = 0;

      for (const item of allItems) {
        if (!this.imageExists(item.imageUrl)) {
          console.log(`Invalid image found: ${item.imageUrl} for item ${item.id}`);
          
          const validPath = await this.getValidImagePath(item.imageUrl);
          
          if (validPath) {
            // Update with valid image path
            await db.update(inspirationGallery)
              .set({ imageUrl: validPath })
              .where(eq(inspirationGallery.id, item.id));
            fixed++;
            console.log(`Fixed image for item ${item.id}: ${validPath}`);
          } else {
            // Remove item if no valid image found
            await db.delete(inspirationGallery)
              .where(eq(inspirationGallery.id, item.id));
            removed++;
            console.log(`Removed item ${item.id} - no valid image found`);
          }
        }
      }

      return { fixed, removed };
    } catch (error) {
      console.error('Error validating inspiration images:', error);
      return { fixed: 0, removed: 0 };
    }
  }

  /**
   * Populate inspiration gallery from existing products
   */
  async populateFromProducts(): Promise<number> {
    try {
      // Get products with valid images
      const validProducts = await db.select({
        id: products.id,
        name: products.name,
        imageUrl: products.imageUrl,
        category: products.category
      }).from(products).limit(50);

      const validItems = validProducts.filter(product => 
        product.imageUrl && this.imageExists(product.imageUrl)
      );

      if (validItems.length === 0) {
        console.log('No valid product images found for inspiration gallery');
        return 0;
      }

      // Clear existing inspiration items
      await db.delete(inspirationGallery);

      // Create inspiration items from valid products
      const inspirationItems = validItems.slice(0, 20).map((product, index) => ({
        title: product.name || 'Luxury Jewelry Design',
        description: `Exquisite craftsmanship showcasing the beauty of ${product.category || 'fine jewelry'}`,
        imageUrl: product.imageUrl!,
        category: this.mapProductCategory(product.category),
        tags: this.generateTags(product.name, product.category),
        featured: index < 4 // Make first 4 items featured
      })) as Array<{
        title: string;
        description: string;
        imageUrl: string;
        category: string;
        tags: string[];
        featured: boolean;
      }>;

      await db.insert(inspirationGallery).values(inspirationItems);
      
      console.log(`Successfully populated ${inspirationItems.length} inspiration items`);
      return inspirationItems.length;
    } catch (error) {
      console.error('Error populating inspiration gallery:', error);
      return 0;
    }
  }

  private mapProductCategory(category: string | null): string {
    if (!category) return 'general';
    
    const categoryMap: Record<string, string> = {
      'necklace': 'necklaces',
      'necklaces': 'necklaces',
      'ring': 'rings',
      'rings': 'rings',
      'earring': 'earrings',
      'earrings': 'earrings',
      'bracelet': 'bracelets',
      'bracelets': 'bracelets',
      'pendant': 'pendants',
      'pendants': 'pendants'
    };

    return categoryMap[category.toLowerCase()] || 'general';
  }

  private generateTags(name: string | null, category: string | null): string[] {
    const tags: string[] = [];
    
    if (category) tags.push(category.toLowerCase());
    
    if (name) {
      const nameWords = name.toLowerCase();
      if (nameWords.includes('gold')) tags.push('gold');
      if (nameWords.includes('diamond')) tags.push('diamonds');
      if (nameWords.includes('emerald')) tags.push('emerald');
      if (nameWords.includes('ruby')) tags.push('ruby');
      if (nameWords.includes('sapphire')) tags.push('sapphire');
      if (nameWords.includes('pearl')) tags.push('pearls');
      if (nameWords.includes('amethyst')) tags.push('amethyst');
      if (nameWords.includes('polki')) tags.push('polki');
      if (nameWords.includes('kundan')) tags.push('kundan');
      if (nameWords.includes('traditional')) tags.push('traditional');
      if (nameWords.includes('modern')) tags.push('modern');
      if (nameWords.includes('luxury')) tags.push('luxury');
    }

    return tags.length > 0 ? tags : ['jewelry', 'luxury'];
  }
}

export const inspirationManager = new InspirationManager();