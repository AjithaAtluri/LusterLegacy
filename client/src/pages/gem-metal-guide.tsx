import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import AIEducationalImage from "@/components/gem-guide/ai-educational-image";

// This will keep track of AI-generated image URLs
interface GeneratedImages {
  [key: string]: string;
}

export default function GemMetalGuide() {
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImages>({});

  // Function to handle when an AI image is loaded
  const handleImageLoaded = (topic: string, url: string) => {
    setGeneratedImages(prev => ({
      ...prev,
      [topic]: url
    }));
  };

  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 max-w-7xl">
      <Helmet>
        <title>Gem & Metal Guide | Luster Legacy</title>
        <meta name="description" content="Educational guide about gemstones, metals, and jewelry terminology" />
      </Helmet>

      {/* Hero Banner */}
      <div className="relative rounded-lg overflow-hidden mb-16">
        <div className="w-full h-[300px]">
          <AIEducationalImage
            topic="Luxury gemstone collection with sapphires, rubies, and emeralds in a dark, elegant setting"
            altText="Luxury Gemstones"
            className="w-full h-full object-cover brightness-50"
            height="h-[300px]"
            onImageLoaded={(url) => handleImageLoaded("hero", url)}
          />
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-cormorant text-5xl md:text-7xl font-bold mb-4 tracking-tight text-center"
          >
            Gem & Metal <span className="text-primary">Guide</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg max-w-3xl mx-auto text-center text-gray-200"
          >
            Discover the timeless artistry and science behind fine jewelry with our expert insights
          </motion.p>
        </div>
      </div>

      <Tabs defaultValue="gemstones" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8 relative z-10">
          <TabsTrigger value="gemstones" className="text-lg py-3 font-medium">Gemstones</TabsTrigger>
          <TabsTrigger value="stone-forms" className="text-lg py-3 font-medium">Stone Forms</TabsTrigger>
          <TabsTrigger value="metals" className="text-lg py-3 font-medium">Precious Metals</TabsTrigger>
          <TabsTrigger value="craftsmanship" className="text-lg py-3 font-medium">Craftsmanship</TabsTrigger>
        </TabsList>
        
        {/* Lightbox for image preview */}
        {activeImage && (
          <div 
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setActiveImage(null)}
          >
            <div className="relative max-w-5xl max-h-full">
              <img 
                src={activeImage} 
                alt="Enlarged jewelry view" 
                className="max-w-full max-h-[90vh] object-contain rounded-lg" 
              />
              <button 
                className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2"
                onClick={() => setActiveImage(null)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
          </div>
        )}

        {/* Stone Forms Tab */}
        <TabsContent value="stone-forms" className="space-y-8">
          {/* Visual introduction to stone forms */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <motion.div 
              whileHover={{ y: -5 }}
              onClick={() => generatedImages.cabochons && setActiveImage(generatedImages.cabochons)}
              className="rounded-lg overflow-hidden shadow-md cursor-pointer"
            >
              <div className="relative h-64">
                <AIEducationalImage
                  topic="Cabochon gemstones with smooth domed tops in various colors"
                  altText="Cabochon gemstones"
                  onImageLoaded={(url) => handleImageLoaded("cabochons", url)}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <h3 className="text-white font-cormorant text-xl font-semibold">Cabochons</h3>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -5 }}
              onClick={() => generatedImages.faceted && setActiveImage(generatedImages.faceted)}
              className="rounded-lg overflow-hidden shadow-md cursor-pointer"
            >
              <div className="relative h-64">
                <AIEducationalImage
                  topic="Faceted gemstones showing multiple polished surfaces with light reflection"
                  altText="Faceted gemstones"
                  onImageLoaded={(url) => handleImageLoaded("faceted", url)}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <h3 className="text-white font-cormorant text-xl font-semibold">Faceted Stones</h3>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -5 }}
              onClick={() => generatedImages.crystals && setActiveImage(generatedImages.crystals)}
              className="rounded-lg overflow-hidden shadow-md cursor-pointer"
            >
              <div className="relative h-64">
                <AIEducationalImage
                  topic="Natural crystal formations of raw gemstones in their natural state"
                  altText="Natural crystal gemstones"
                  onImageLoaded={(url) => handleImageLoaded("crystals", url)}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <h3 className="text-white font-cormorant text-xl font-semibold">Natural Crystals</h3>
                </div>
              </div>
            </motion.div>
          </div>
          
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-10">
            <h3 className="font-cormorant text-3xl text-center mb-6">Understanding Stone Forms</h3>
            <p className="text-center max-w-4xl mx-auto text-lg">
              The way a gemstone is cut and shaped dramatically affects its appearance, value, and suitability for 
              different jewelry designs. From smooth cabochons that showcase color to brilliantly faceted stones 
              that maximize sparkle, each form has unique characteristics that create different visual effects.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="overflow-hidden">
              <div className="h-56 overflow-hidden">
                <AIEducationalImage
                  topic="Carved gemstone with intricate relief designs showing artistry and craftsmanship"
                  altText="Carved gemstone"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                  onImageLoaded={(url) => handleImageLoaded("carved", url)}
                  onClick={() => generatedImages.carved && setActiveImage(generatedImages.carved)}
                />
              </div>
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl">Carved Gemstones</CardTitle>
                <CardDescription>The ancient art of stone sculptures</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Carved gemstones, also known as glyptics, involve shaping stones into intricate designs, reliefs, or figures. This ancient art form dates back thousands of years, with some of the earliest examples found in Mesopotamia.
                </p>
                <p>
                  Different types include intaglios (designs carved into the stone's surface), cameos (designs raised above the background), and figurines (three-dimensional sculptures). The most commonly carved stones include jade, malachite, lapis lazuli, and various quartzes due to their ideal hardness and workability.
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <div className="h-56 overflow-hidden">
                <AIEducationalImage
                  topic="Close-up of cabochon gemstones showing their smooth domed surface and rich colors"
                  altText="Cabochon gemstones detail"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                  onImageLoaded={(url) => handleImageLoaded("cabochons-detail", url)}
                  onClick={() => generatedImages["cabochons-detail"] && setActiveImage(generatedImages["cabochons-detail"])}
                />
              </div>
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl">Cabochons (Cabs)</CardTitle>
                <CardDescription>Smooth, rounded gemstone forms</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Cabochons are gemstones that are shaped and polished rather than faceted. They typically have a flat bottom and a domed top, creating a smooth, rounded appearance that showcases the stone's color, patterns, and optical effects.
                </p>
                <p>
                  Cabochons are ideal for stones with phenomenal effects like asterism (star sapphires), chatoyancy (cat's eye stones), or color play (opals). They're also perfect for displaying the patterns in stones like malachite, turquoise, and lapis lazuli, where faceting would disrupt the stone's natural beauty.
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <div className="h-56 overflow-hidden">
                <AIEducationalImage
                  topic="Close-up of faceted diamond gemstone with brilliant light reflection and sparkle"
                  altText="Faceted gemstone detail"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                  onImageLoaded={(url) => handleImageLoaded("faceted-detail", url)}
                  onClick={() => generatedImages["faceted-detail"] && setActiveImage(generatedImages["faceted-detail"])}
                />
              </div>
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl">Faceted Stones</CardTitle>
                <CardDescription>Precision-cut for maximum brilliance</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Faceted stones feature multiple flat, polished surfaces (facets) designed to reflect and refract light, creating brilliance, fire, and scintillation. Common faceting styles include brilliant cuts (maximizing sparkle), step cuts (emphasizing clarity and color), and mixed cuts (combining both).
                </p>
                <p>
                  The quality of a faceted stone depends on proportions, symmetry, and polish. A well-cut stone will exhibit maximum light return and display optimal color. While diamonds are the most well-known faceted stones, virtually all transparent gemstones can be faceted, including sapphires, rubies, emeralds, and many semi-precious gems.
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <div className="h-56 overflow-hidden">
                <AIEducationalImage
                  topic="Strand of colorful gemstone beads of different shapes and sizes for jewelry making"
                  altText="Gemstone beads"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                  onImageLoaded={(url) => handleImageLoaded("beads", url)}
                  onClick={() => generatedImages.beads && setActiveImage(generatedImages.beads)}
                />
              </div>
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl">Beads</CardTitle>
                <CardDescription>Versatile stone forms for stringing</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Gemstone beads are drilled stones that can be strung together to create necklaces, bracelets, and other jewelry. They come in countless shapes including round, oval, barrel, rondelle, nugget, and faceted varieties, each offering different aesthetic qualities.
                </p>
                <p>
                  The size of beads is typically measured in millimeters rather than carats. Quality factors include uniformity (for matched sets), smoothness of drill holes, polish, and color consistency. Popular bead materials include amethyst, tourmaline, coral, pearl, turquoise, and jade, though virtually any gemstone can be fashioned into beads.
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="bg-gradient-to-l from-indigo-50 to-purple-50 rounded-xl p-6 mt-10 mb-10">
            <h3 className="font-cormorant text-3xl text-center mb-6">Specialized Stone Forms</h3>
            <p className="text-center max-w-4xl mx-auto text-lg">
              Beyond the common cuts, jewelers employ specialized stone forms to achieve particular 
              artistic effects or to work with challenging materials. These unique approaches 
              open up new possibilities for jewelry design and wearable art.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl">Briolettes</CardTitle>
                <CardDescription>Teardrop-shaped faceted beads</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Briolettes are pear or teardrop-shaped gemstones that are faceted all around and drilled at the narrow end. This special cutting style creates maximum light play from all angles, making them perfect for dangling elements in earrings, necklaces, and pendants.
                </p>
                <p>
                  Creating a well-proportioned briolette requires significant skill as the stone must be faceted symmetrically on all sides while maintaining the proper proportions. They're particularly stunning in transparent stones like aquamarine, tourmaline, and topaz.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl">Rough and Raw Stones</CardTitle>
                <CardDescription>Natural beauty in uncut form</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Rough or raw gemstones are used in their natural, uncut state, preserving their organic shape and texture. This approach celebrates the stone's natural formation and character, creating one-of-a-kind pieces that connect wearers to the earth's processes.
                </p>
                <p>
                  While diamonds, emeralds, and sapphires are occasionally used in rough form for avant-garde designs, rough stones are more commonly seen with crystals like tourmaline, quartz, and tanzanite that naturally form in aesthetically pleasing shapes with striking color zoning and inclusions that add character.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Gemstones Tab */}
        <TabsContent value="gemstones" className="space-y-8">
          {/* Visual introduction to gemstone types */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <motion.div 
              whileHover={{ y: -5 }}
              onClick={() => generatedImages.natural && setActiveImage(generatedImages.natural)}
              className="rounded-lg overflow-hidden shadow-md cursor-pointer"
            >
              <div className="relative h-64">
                <AIEducationalImage
                  topic="Natural gemstones including ruby, emerald, and sapphire showing rich colors and clarity"
                  altText="Natural gemstones"
                  onImageLoaded={(url) => handleImageLoaded("natural", url)}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <h3 className="text-white font-cormorant text-xl font-semibold">Natural Gemstones</h3>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -5 }}
              onClick={() => generatedImages['lab-created'] && setActiveImage(generatedImages['lab-created'])}
              className="rounded-lg overflow-hidden shadow-md cursor-pointer"
            >
              <div className="relative h-64">
                <AIEducationalImage
                  topic="Laboratory created gemstones in a scientific setting showing perfect clarity"
                  altText="Lab-created gemstones"
                  onImageLoaded={(url) => handleImageLoaded("lab-created", url)}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <h3 className="text-white font-cormorant text-xl font-semibold">Lab-Created Gems</h3>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -5 }}
              onClick={() => generatedImages.onyx && setActiveImage(generatedImages.onyx)}
              className="rounded-lg overflow-hidden shadow-md cursor-pointer"
            >
              <div className="relative h-64">
                <AIEducationalImage
                  topic="Onyx gemstone jewelry showing deep black color with subtle banding"
                  altText="Onyx gemstone jewelry"
                  onImageLoaded={(url) => handleImageLoaded("onyx", url)}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <h3 className="text-white font-cormorant text-xl font-semibold">Onyx & Black Gems</h3>
                </div>
              </div>
            </motion.div>
          </div>
          
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-10">
            <h3 className="font-cormorant text-3xl text-center mb-6">Understanding Gemstone Types</h3>
            <p className="text-center max-w-4xl mx-auto text-lg">
              From Earth-mined treasures to advanced laboratory creations, gemstones offer a 
              spectrum of beauty, value, and ethical considerations. Each type brings unique 
              characteristics to jewelry design, allowing for both traditional luxury and modern alternatives.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="overflow-hidden">
              <div className="h-56 overflow-hidden">
                <AIEducationalImage
                  topic="Close-up of natural ruby gemstone showing deep red color and natural inclusions"
                  altText="Natural ruby gemstone"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                  onImageLoaded={(url) => handleImageLoaded("natural-detail", url)}
                  onClick={() => generatedImages["natural-detail"] && setActiveImage(generatedImages["natural-detail"])}
                />
              </div>
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl">Natural Gemstones</CardTitle>
                <CardDescription>Earth's treasures mined from the ground</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Natural gemstones are formed deep within the Earth through geological processes that span millions of years. Their value comes from their rarity, durability, and beauty, with factors like color, clarity, cut, and carat weight determining their worth.
                </p>
                <p>
                  The "Big Four" of precious gemstones—diamond, ruby, sapphire, and emerald—have traditionally been most valued, but many semi-precious stones like amethyst, topaz, and garnet are also prized for their unique colors and optical effects. Each natural stone carries tiny inclusions and characteristics that serve as its unique fingerprint.
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <div className="h-56 overflow-hidden">
                <AIEducationalImage
                  topic="Laboratory created sapphire gemstone in controlled scientific environment"
                  altText="Lab-created sapphire gemstone"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                  onImageLoaded={(url) => handleImageLoaded("lab-created-detail", url)}
                  onClick={() => generatedImages["lab-created-detail"] && setActiveImage(generatedImages["lab-created-detail"])}
                />
              </div>
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl">Lab-Created Gemstones</CardTitle>
                <CardDescription>Science replicating nature's beauty</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Lab-created gemstones are genuine gems grown in controlled environments that replicate the natural processes of gem formation. Chemically and physically identical to their natural counterparts, they possess the same optical, physical, and chemical properties.
                </p>
                <p>
                  Unlike simulants or imitations, lab-created stones are real gems that offer several advantages: they typically have fewer inclusions, come at a lower cost, and are ethically sourced with minimal environmental impact. Popular lab-created stones include rubies, sapphires, emeralds, and diamonds.
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <div className="h-56 overflow-hidden">
                <AIEducationalImage
                  topic="Black onyx gemstone jewelry piece showing lustrous polish and deep color"
                  altText="Onyx gemstone jewelry"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                  onImageLoaded={(url) => handleImageLoaded("onyx-detail", url)}
                  onClick={() => generatedImages["onyx-detail"] && setActiveImage(generatedImages["onyx-detail"])}
                />
              </div>
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl">Onyx & Black Gemstones</CardTitle>
                <CardDescription>Elegant darkness in jewelry</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  True onyx is a variety of chalcedony quartz characterized by parallel bands of different colors. When most people refer to "onyx" in jewelry, they're typically describing black onyx—a solid black chalcedony that's been dyed to enhance its color.
                </p>
                <p>
                  In luxury jewelry, black onyx creates dramatic contrast with precious metals and colorless diamonds. Other black gemstones include black diamonds (typically treated), black spinel (naturally occurring), and black jade. When evaluating black gemstones, look for even color saturation, good polish, and absence of visible fractures.
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <div className="h-56 overflow-hidden">
                <AIEducationalImage
                  topic="Comparison of natural, lab-grown, and synthetic black onyx gemstones side by side"
                  altText="Natural vs synthetic gemstone comparison"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                  onImageLoaded={(url) => handleImageLoaded("synthetic-comparison", url)}
                  onClick={() => generatedImages["synthetic-comparison"] && setActiveImage(generatedImages["synthetic-comparison"])}
                />
              </div>
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl">Natural vs. Synthetic</CardTitle>
                <CardDescription>Understanding distinctions in stone origins</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Natural, lab-created, and synthetic stones represent different points on the spectrum of authenticity. Natural gems form through geological processes, while lab-created stones are chemically identical to natural ones but grown in controlled environments.
                </p>
                <p>
                  Synthetic imitations like cubic zirconia, moissanite, and glass merely resemble natural stones visually but have different chemical compositions. With onyx specifically, natural specimens show subtle banding and occasional translucency, while dyed black agate (often sold as onyx) shows more uniform coloration, and synthetic onyx imitations typically have perfect uniformity without the subtle variations found in natural materials.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Metals Tab */}
        <TabsContent value="metals" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <motion.div 
              whileHover={{ y: -5 }}
              onClick={() => generatedImages.gold && setActiveImage(generatedImages.gold)}
              className="rounded-lg overflow-hidden shadow-md cursor-pointer"
            >
              <div className="relative h-64">
                <AIEducationalImage
                  topic="Various gold jewelry pieces showing different colors of gold - yellow, white, and rose"
                  altText="Gold jewelry in different colors"
                  onImageLoaded={(url) => handleImageLoaded("gold", url)}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <h3 className="text-white font-cormorant text-xl font-semibold">Gold Varieties</h3>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -5 }}
              onClick={() => generatedImages.platinum && setActiveImage(generatedImages.platinum)}
              className="rounded-lg overflow-hidden shadow-md cursor-pointer"
            >
              <div className="relative h-64">
                <AIEducationalImage
                  topic="Platinum jewelry pieces with elegant designs showing the metal's bright white luster"
                  altText="Platinum jewelry"
                  onImageLoaded={(url) => handleImageLoaded("platinum", url)}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <h3 className="text-white font-cormorant text-xl font-semibold">Platinum & Silver</h3>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -5 }}
              onClick={() => generatedImages.alloys && setActiveImage(generatedImages.alloys)}
              className="rounded-lg overflow-hidden shadow-md cursor-pointer"
            >
              <div className="relative h-64">
                <AIEducationalImage
                  topic="Comparison of different metal alloys used in jewelry making showing color and finish differences"
                  altText="Jewelry metal alloys"
                  onImageLoaded={(url) => handleImageLoaded("alloys", url)}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <h3 className="text-white font-cormorant text-xl font-semibold">Metal Alloys</h3>
                </div>
              </div>
            </motion.div>
          </div>
          
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-10">
            <h3 className="font-cormorant text-3xl text-center mb-6">Understanding Precious Metals</h3>
            <p className="text-center max-w-4xl mx-auto text-lg">
              The metal chosen for a piece of jewelry defines its character, durability, and value. 
              From the warmth of gold to the modern sleekness of platinum, each metal brings its own 
              qualities and considerations to jewelry design.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="overflow-hidden">
              <div className="h-56 overflow-hidden">
                <AIEducationalImage
                  topic="Close-up of 24K, 18K, and 14K gold jewelry showing color differences"
                  altText="Gold karat comparison"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                  onImageLoaded={(url) => handleImageLoaded("gold-karats", url)}
                  onClick={() => generatedImages["gold-karats"] && setActiveImage(generatedImages["gold-karats"])}
                />
              </div>
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl">Gold & Its Karats</CardTitle>
                <CardDescription>The timeless precious metal</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Gold's purity is measured in karats (K), with 24K representing pure gold (99.9%). Since pure gold is too soft for most jewelry, it's alloyed with other metals to increase durability: 18K gold contains 75% gold, 14K contains 58.3%, and 10K contains 41.7%.
                </p>
                <p>
                  Different gold colors are created through specific alloy combinations: yellow gold typically contains silver and copper; white gold contains nickel, palladium, or silver; and rose gold contains a higher proportion of copper. Each karat level offers a different balance between purity, price, and durability, with higher karat gold being more pure but also softer.
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <div className="h-56 overflow-hidden">
                <AIEducationalImage
                  topic="Platinum jewelry piece with diamonds showcasing the metal's durability and white luster"
                  altText="Platinum jewelry with diamonds"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                  onImageLoaded={(url) => handleImageLoaded("platinum-detail", url)}
                  onClick={() => generatedImages["platinum-detail"] && setActiveImage(generatedImages["platinum-detail"])}
                />
              </div>
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl">Platinum</CardTitle>
                <CardDescription>The king of white metals</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Platinum is a naturally white, dense precious metal that's significantly rarer than gold. Jewelry-grade platinum is typically 95% pure (950 platinum) and alloyed with other metals like iridium, ruthenium, or cobalt to improve workability and durability.
                </p>
                <p>
                  Prized for its durability, platinum doesn't tarnish and develops a distinctive patina over time that many connoisseurs appreciate. Its natural white color never fades or yellows. Platinum's density makes it more secure for setting gemstones, but this same quality makes it heavier and more expensive than gold alternatives.
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <div className="h-56 overflow-hidden">
                <AIEducationalImage
                  topic="Sterling silver jewelry with ornate filigree work showing the metal's bright white color"
                  altText="Sterling silver filigree jewelry"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                  onImageLoaded={(url) => handleImageLoaded("silver", url)}
                  onClick={() => generatedImages.silver && setActiveImage(generatedImages.silver)}
                />
              </div>
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl">Silver</CardTitle>
                <CardDescription>Affordable luxury with timeless appeal</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Sterling silver, composed of 92.5% silver and 7.5% other metals (typically copper), is the most common silver alloy used in fine jewelry. This composition balances silver's natural beauty with improved durability and workability.
                </p>
                <p>
                  Silver's affordability makes it popular for intricate designs like filigree and detailed patterns that would be prohibitively expensive in gold or platinum. However, silver tarnishes over time through exposure to air and requires regular cleaning. Many high-end silver pieces are rhodium-plated to prevent tarnishing and enhance the white appearance.
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <div className="h-56 overflow-hidden">
                <AIEducationalImage
                  topic="Comparison of titanium, stainless steel, and palladium jewelry showing different finishes"
                  altText="Alternative jewelry metals"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                  onImageLoaded={(url) => handleImageLoaded("alternative-metals", url)}
                  onClick={() => generatedImages["alternative-metals"] && setActiveImage(generatedImages["alternative-metals"])}
                />
              </div>
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl">Alternative Metals</CardTitle>
                <CardDescription>Modern options with unique properties</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Beyond traditional precious metals, contemporary jewelry embraces alternatives like titanium, stainless steel, and palladium. Titanium is exceptionally lightweight yet strong, hypoallergenic, and can be colored through anodization to create stunning visual effects.
                </p>
                <p>
                  Palladium, a member of the platinum family, offers a natural white color and durability at a lower price point than platinum. Stainless steel provides remarkable durability and scratch resistance at an affordable price, making it popular for modern, minimalist designs and men's jewelry. Each alternative metal brings unique properties that expand the possibilities in contemporary jewelry design.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Craftsmanship Tab */}
        <TabsContent value="craftsmanship" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <motion.div 
              whileHover={{ y: -5 }}
              onClick={() => generatedImages.filigree && setActiveImage(generatedImages.filigree)}
              className="rounded-lg overflow-hidden shadow-md cursor-pointer"
            >
              <div className="relative h-64">
                <AIEducationalImage
                  topic="Intricate gold filigree jewelry work showing delicate wirework and craftsmanship"
                  altText="Filigree jewelry work"
                  onImageLoaded={(url) => handleImageLoaded("filigree", url)}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <h3 className="text-white font-cormorant text-xl font-semibold">Filigree</h3>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -5 }}
              onClick={() => generatedImages.setting && setActiveImage(generatedImages.setting)}
              className="rounded-lg overflow-hidden shadow-md cursor-pointer"
            >
              <div className="relative h-64">
                <AIEducationalImage
                  topic="Different gemstone setting techniques in jewelry - prong, bezel, and pavé"
                  altText="Jewelry setting techniques"
                  onImageLoaded={(url) => handleImageLoaded("setting", url)}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <h3 className="text-white font-cormorant text-xl font-semibold">Stone Setting</h3>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -5 }}
              onClick={() => generatedImages.enamel && setActiveImage(generatedImages.enamel)}
              className="rounded-lg overflow-hidden shadow-md cursor-pointer"
            >
              <div className="relative h-64">
                <AIEducationalImage
                  topic="Vibrant enamel work on jewelry showing colorful designs and techniques"
                  altText="Enamel jewelry work"
                  onImageLoaded={(url) => handleImageLoaded("enamel", url)}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <h3 className="text-white font-cormorant text-xl font-semibold">Enameling</h3>
                </div>
              </div>
            </motion.div>
          </div>
          
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-10">
            <h3 className="font-cormorant text-3xl text-center mb-6">The Art of Jewelry Making</h3>
            <p className="text-center max-w-4xl mx-auto text-lg">
              Beyond beautiful materials, fine jewelry is defined by exceptional craftsmanship. 
              These specialized techniques transform metals and gemstones into wearable art, 
              often requiring years of training to master.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="overflow-hidden">
              <div className="h-56 overflow-hidden">
                <AIEducationalImage
                  topic="Detailed gold filigree jewelry work showing intricate wirework patterns"
                  altText="Detailed filigree jewelry"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                  onImageLoaded={(url) => handleImageLoaded("filigree-detail", url)}
                  onClick={() => generatedImages["filigree-detail"] && setActiveImage(generatedImages["filigree-detail"])}
                />
              </div>
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl">Filigree</CardTitle>
                <CardDescription>Delicate metalwork of extraordinary detail</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Filigree is a delicate form of jewelry metalwork that uses thin threads of gold or silver twisted and soldered into intricate patterns. Dating back to ancient Mesopotamia, this technique creates lace-like designs that appear impossibly delicate.
                </p>
                <p>
                  True filigree requires exceptional patience and skill, with artisans manipulating wire as thin as human hair. While historically created entirely by hand, modern filigree sometimes incorporates machine assistance for consistency, though the finest examples remain completely handcrafted. This technique is particularly popular in Indian, Middle Eastern, and Southern European jewelry traditions.
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <div className="h-56 overflow-hidden">
                <AIEducationalImage
                  topic="Comparison of different gemstone setting techniques - prong, bezel, channel, and pavé"
                  altText="Gemstone setting techniques"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                  onImageLoaded={(url) => handleImageLoaded("setting-techniques", url)}
                  onClick={() => generatedImages["setting-techniques"] && setActiveImage(generatedImages["setting-techniques"])}
                />
              </div>
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl">Stone Setting</CardTitle>
                <CardDescription>The art of securing gemstones in metal</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Stone setting is the technique of securing gemstones in metal. Different setting styles serve both functional and aesthetic purposes, with each highlighting different aspects of the stones and creating distinct visual effects.
                </p>
                <p>
                  Common setting techniques include prong (which maximizes light exposure using metal claws), bezel (which encircles the stone with metal for protection), channel (which aligns stones between two metal walls), and pavé (which creates a surface "paved" with small stones). The choice of setting affects not only the appearance but also the security and wearability of the piece.
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <div className="h-56 overflow-hidden">
                <AIEducationalImage
                  topic="Vibrantly colored enamel jewelry showing cloisonné technique with fine metal wire partitions"
                  altText="Cloisonné enamel jewelry"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                  onImageLoaded={(url) => handleImageLoaded("cloisonne", url)}
                  onClick={() => generatedImages.cloisonne && setActiveImage(generatedImages.cloisonne)}
                />
              </div>
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl">Enameling</CardTitle>
                <CardDescription>Adding color through fused glass</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Enameling is the art of fusing powdered glass to metal using high heat, creating vibrant, durable colors. This ancient technique dates back to the Mycenaeans and has been practiced across numerous cultures, each developing distinctive styles.
                </p>
                <p>
                  Notable enameling techniques include cloisonné (using wire to create partitions filled with enamel), champlevé (filling recessed areas with enamel), plique-à-jour (creating translucent, window-like effects), and guilloché (applying enamel over an engine-turned pattern). Modern enameling continues to evolve with contemporary color palettes and designs while maintaining the timeless appeal of this challenging art form.
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <div className="h-56 overflow-hidden">
                <AIEducationalImage
                  topic="CAD/CAM jewelry design and 3D printing for jewelry manufacturing"
                  altText="Modern jewelry making technology"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                  onImageLoaded={(url) => handleImageLoaded("modern-techniques", url)}
                  onClick={() => generatedImages["modern-techniques"] && setActiveImage(generatedImages["modern-techniques"])}
                />
              </div>
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl">Modern Techniques</CardTitle>
                <CardDescription>Technology meets traditional craftsmanship</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Modern jewelry making blends traditional handiwork with cutting-edge technology. Computer-Aided Design (CAD) allows for precise 3D modeling of jewelry before creation, while Computer-Aided Manufacturing (CAM) enables the production of wax models through 3D printing or CNC milling.
                </p>
                <p>
                  Laser welding provides extremely precise joins without the heat spread of traditional soldering, making it ideal for repair work near heat-sensitive gemstones. Modern casting techniques create consistent production pieces, while advanced finishing methods like Physical Vapor Deposition (PVD) create durable, vibrant colored metal finishes. Despite these technological advances, the finest jewelry still requires the skilled hand of an experienced jeweler.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}