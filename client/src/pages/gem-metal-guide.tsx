import React from "react";
import { Helmet } from "react-helmet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";

export default function GemMetalGuide() {
  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 max-w-7xl">
      <Helmet>
        <title>Gem & Metal Guide | Luster Legacy</title>
        <meta name="description" content="Educational guide about gemstones, metals, and jewelry terminology" />
      </Helmet>

      {/* Hero Banner */}
      <div className="relative rounded-lg overflow-hidden mb-16">
        <div className="w-full h-[300px] bg-gradient-to-r from-purple-900 to-indigo-900"></div>
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
        
        {/* Gemstones Tab */}
        <TabsContent value="gemstones" className="space-y-8">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-10">
            <h3 className="font-cormorant text-3xl text-center mb-6">Understanding Gemstones</h3>
            <p className="text-center max-w-4xl mx-auto text-lg">
              Gemstones have captivated humanity for millennia with their beauty, rarity, and symbolism. 
              From the fire of a diamond to the deep blue of a sapphire, each gem has its own unique character 
              and properties that make it precious and special.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <motion.div whileHover={{ y: -5 }} className="rounded-lg overflow-hidden shadow-md">
              <div className="relative h-64 bg-gradient-to-br from-blue-400 to-blue-700"></div>
              <div className="p-4 bg-white">
                <h3 className="font-cormorant text-xl font-semibold">Natural Gemstones</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Formed over millions of years through natural geological processes, these gems capture Earth's beauty.
                </p>
              </div>
            </motion.div>
            
            <motion.div whileHover={{ y: -5 }} className="rounded-lg overflow-hidden shadow-md">
              <div className="relative h-64 bg-gradient-to-br from-pink-400 to-purple-700"></div>
              <div className="p-4 bg-white">
                <h3 className="font-cormorant text-xl font-semibold">Lab-Created Gems</h3>
                <p className="mt-2 text-sm text-gray-600">
                  With identical physical properties to natural gems, lab-created stones offer ethical and sustainable options.
                </p>
              </div>
            </motion.div>
            
            <motion.div whileHover={{ y: -5 }} className="rounded-lg overflow-hidden shadow-md">
              <div className="relative h-64 bg-gradient-to-br from-gray-700 to-black"></div>
              <div className="p-4 bg-white">
                <h3 className="font-cormorant text-xl font-semibold">Onyx & Rare Stones</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Striking and unique, these stones add drama and mystery to jewelry designs and collections.
                </p>
              </div>
            </motion.div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <div className="h-56 bg-gradient-to-r from-red-400 to-red-700"></div>
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl">Rubies</CardTitle>
                <CardDescription>The king of gemstones</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Rubies are a variety of the mineral corundum and get their red color from chromium. The most valuable rubies have a pure, vibrant red to slightly purplish-red color, often described as "pigeon blood red." 
                </p>
                <p>
                  The finest rubies come from Myanmar (Burma), though quality stones also come from Thailand, Sri Lanka, and Africa. A ruby's value is determined by color, clarity, cut, and carat weight, with color being the most important factor.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <div className="h-56 bg-gradient-to-r from-blue-400 to-blue-700"></div>
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl">Sapphires</CardTitle>
                <CardDescription>Blue beauty with royal heritage</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Sapphires are also a variety of corundum, and while most people associate them with a deep blue color, they actually come in nearly every color except red (which would be a ruby). The most prized sapphires have a medium to medium-dark blue color with strong saturation.
                </p>
                <p>
                  Classic blue sapphires come primarily from Kashmir, Myanmar, and Sri Lanka. "Fancy sapphires" in colors like pink, yellow, and green are increasingly popular for unique jewelry pieces.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Stone Forms Tab */}
        <TabsContent value="stone-forms" className="space-y-8">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-10">
            <h3 className="font-cormorant text-3xl text-center mb-6">Understanding Stone Forms</h3>
            <p className="text-center max-w-4xl mx-auto text-lg">
              The way a gemstone is cut and shaped dramatically affects its appearance, value, and suitability for 
              different jewelry designs. From smooth cabochons that showcase color to brilliantly faceted stones 
              that maximize sparkle, each form has unique characteristics.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <motion.div whileHover={{ y: -5 }} className="rounded-lg overflow-hidden shadow-md">
              <div className="relative h-64 bg-gradient-to-br from-pink-400 to-purple-700">
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <h3 className="text-white font-cormorant text-xl font-semibold">Cabochons</h3>
                </div>
              </div>
            </motion.div>
            
            <motion.div whileHover={{ y: -5 }} className="rounded-lg overflow-hidden shadow-md">
              <div className="relative h-64 bg-gradient-to-br from-blue-400 to-blue-700">
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <h3 className="text-white font-cormorant text-xl font-semibold">Faceted Stones</h3>
                </div>
              </div>
            </motion.div>
            
            <motion.div whileHover={{ y: -5 }} className="rounded-lg overflow-hidden shadow-md">
              <div className="relative h-64 bg-gradient-to-br from-amber-400 to-amber-700">
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <h3 className="text-white font-cormorant text-xl font-semibold">Natural Crystals</h3>
                </div>
              </div>
            </motion.div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="overflow-hidden">
              <div className="h-56 bg-gradient-to-r from-green-400 to-green-700"></div>
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl">Carved Gemstones</CardTitle>
                <CardDescription>The ancient art of stone sculptures</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Carved gemstones, also known as glyptics, involve shaping stones into intricate designs, reliefs, or figures. This ancient art form dates back thousands of years, with some of the earliest examples found in Mesopotamia.
                </p>
                <p>
                  Different types include intaglios (designs carved into the stone's surface), cameos (designs raised above the background), and figurines (three-dimensional sculptures). The most commonly carved stones include jade, malachite, lapis lazuli, and various quartzes.
                </p>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden">
              <div className="h-56 bg-gradient-to-r from-purple-400 to-purple-700"></div>
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl">Cabochons (Cabs)</CardTitle>
                <CardDescription>Smooth, rounded gemstone forms</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Cabochons are gemstones that are shaped and polished rather than faceted. They typically have a flat bottom and a domed top, creating a smooth, rounded appearance that showcases the stone's color, patterns, and optical effects.
                </p>
                <p>
                  Cabochons are ideal for stones with phenomenal effects like asterism (star sapphires), chatoyancy (cat's eye stones), or color play (opals). They're also perfect for displaying the patterns in stones like malachite, turquoise, and lapis lazuli.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Metals Tab */}
        <TabsContent value="metals" className="space-y-8">
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-6 mb-10">
            <h3 className="font-cormorant text-3xl text-center mb-6">Precious Metals in Jewelry</h3>
            <p className="text-center max-w-4xl mx-auto text-lg">
              The metal chosen for jewelry provides the foundation for gemstones and determines much of a piece's character.
              From the warm glow of gold to the cool brilliance of platinum, each metal offers distinct advantages and aesthetic qualities.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="overflow-hidden">
              <div className="h-56 bg-gradient-to-r from-yellow-300 to-yellow-500"></div>
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl">Gold</CardTitle>
                <CardDescription>The timeless standard of luxury</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Pure gold (24 karat) is too soft for everyday wear, so it's typically alloyed with other metals for durability. Common gold alloys include:
                </p>
                <ul className="list-disc pl-5 space-y-2 mb-4">
                  <li><span className="font-semibold">Yellow Gold</span>: Traditional alloy with silver and copper that maintains gold's warm color</li>
                  <li><span className="font-semibold">White Gold</span>: Alloy with white metals like nickel, silver or palladium and typically rhodium-plated</li>
                  <li><span className="font-semibold">Rose Gold</span>: Alloy with higher copper content, creating a romantic pink hue</li>
                </ul>
                <p>
                  Karat indicates gold purity: 24K (99.9% pure), 18K (75% pure), 14K (58.3% pure), and 10K (41.7% pure).
                </p>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden">
              <div className="h-56 bg-gradient-to-r from-gray-300 to-gray-400"></div>
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl">Platinum</CardTitle>
                <CardDescription>The premium white metal</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Platinum is a naturally white precious metal that's significantly rarer than gold. Its density and weight give platinum jewelry a substantial feel, and its natural white color never fades or tarnishes.
                </p>
                <p className="mb-4">
                  When platinum scratches, it doesn't lose metal but merely displaces it, creating a patina over time rather than wearing away. This makes it ideal for securing precious gemstones and creating intricate details.
                </p>
                <p>
                  Platinum jewelry is typically 95% pure (stamped "PT950" or "PLAT"), making it hypoallergenic and perfect for those with sensitive skin.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Craftsmanship Tab */}
        <TabsContent value="craftsmanship" className="space-y-8">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 mb-10">
            <h3 className="font-cormorant text-3xl text-center mb-6">The Art of Jewelry Making</h3>
            <p className="text-center max-w-4xl mx-auto text-lg">
              Behind every exceptional piece of jewelry lies the hand and eye of a skilled artisan.
              Jewelry craftsmanship combines traditional techniques passed down through generations with
              modern technology to create wearable works of art.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="overflow-hidden">
              <div className="h-56 bg-gradient-to-r from-amber-400 to-amber-600"></div>
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl">Filigree</CardTitle>
                <CardDescription>Delicate metalwork with ancient roots</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Filigree is a delicate form of metalwork that uses fine threads and beads of precious metals to create intricate patterns. The word comes from the Latin "filum" (thread) and "granum" (grain).
                </p>
                <p>
                  This ancient technique creates airy, lace-like designs that can stand alone or form backgrounds for gemstones. While labor-intensive, filigree adds incredible detail and dimension to jewelry, making each piece a unique work of art.
                </p>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden">
              <div className="h-56 bg-gradient-to-r from-blue-400 to-blue-600"></div>
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl">Stone Setting</CardTitle>
                <CardDescription>Secure mounting for precious gems</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Stone setting is the art of securing gemstones in metal. Different setting styles include:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><span className="font-semibold">Prong Setting</span>: Metal claws that hold a stone while allowing maximum light exposure</li>
                  <li><span className="font-semibold">Bezel Setting</span>: Metal rim that encircles a gemstone, offering maximum protection</li>
                  <li><span className="font-semibold">Pavé Setting</span>: Small stones set close together with tiny prongs, creating a continuous sparkle</li>
                  <li><span className="font-semibold">Channel Setting</span>: Stones set in a channel between two strips of metal, with no prongs</li>
                  <li><span className="font-semibold">Tension Setting</span>: Stone held by pressure from the metal band, appearing to float</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}