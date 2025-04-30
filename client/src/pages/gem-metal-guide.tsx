import React from "react";
import { Helmet } from "react-helmet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { GemIcon, Gem, Sparkles, Sigma, Settings, Clock3, History, Palette, Wrench, Crown, Swords, Medal, HeartHandshake, BookOpenText } from "lucide-react";

export default function GemMetalGuide() {
  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 max-w-7xl">
      <Helmet>
        <title>Gem & Metal Guide | Luster Legacy</title>
        <meta name="description" content="Educational guide about gemstones, metals, and jewelry terminology" />
      </Helmet>

      <div className="text-center mb-12">
        <h1 className="font-cormorant text-4xl md:text-6xl font-bold mb-4 tracking-tight">
          <span className="text-foreground">Gem & Metal</span>
          <span className="text-primary"> Guide</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
          Dive into the world of fine jewelry with our comprehensive guide to gemstones, metals, 
          and jewelry crafting techniques. Become an informed collector with our expert insights.
        </p>
      </div>

      <Tabs defaultValue="gemstones" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="gemstones" className="text-lg py-3 flex items-center gap-2">
            <GemIcon className="h-4 w-4 text-primary" />
            <span>Gemstones</span>
          </TabsTrigger>
          <TabsTrigger value="metals" className="text-lg py-3 flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-500" />
            <span>Precious Metals</span>
          </TabsTrigger>
          <TabsTrigger value="craftsmanship" className="text-lg py-3 flex items-center gap-2">
            <Wrench className="h-4 w-4 text-slate-500" />
            <span>Craftsmanship</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="text-lg py-3 flex items-center gap-2">
            <History className="h-4 w-4 text-rose-500" />
            <span>Indian Heritage</span>
          </TabsTrigger>
        </TabsList>

        {/* Gemstones Tab */}
        <TabsContent value="gemstones" className="space-y-8">
          <div className="grid grid-cols-1 gap-8">
            <Card className="border-primary/20">
              <CardHeader className="bg-primary/5">
                <CardTitle className="font-cormorant text-3xl">Premium Gemstones: Natural, Lab-Created & Simulants</CardTitle>
                <CardDescription>A comprehensive comparison across gemstone varieties and creation methods</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="col-span-1 lg:col-span-4 mb-6">
                  <h3 className="font-semibold text-xl mb-3 text-primary flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    Overview of Gemstone Types
                  </h3>
                  <p className="mb-4">
                    The world of gemstones spans from earth-mined natural gems to sophisticated lab creations and affordable simulants. Understanding the differences in origin, composition, optical properties, and value helps collectors make informed decisions based on their preferences and budget.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="col-span-1 md:col-span-3">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Crown className="h-5 w-5 text-amber-600" />
                      Natural Gemstones: Earth's Treasures
                    </h3>
                  </div>
                  
                  <div className="bg-muted/5 p-4 rounded-lg border border-primary/10">
                    <h4 className="font-semibold text-lg mb-2">Diamonds</h4>
                    <ul className="list-disc pl-5 space-y-1.5">
                      <li><span className="font-medium">Origin:</span> Formed deep in Earth's mantle under extreme pressure</li>
                      <li><span className="font-medium">Value factors:</span> Graded by the 4Cs (cut, color, clarity, carat)</li>
                      <li><span className="font-medium">Price range:</span> $2,000-$20,000+ per carat for quality stones</li>
                      <li><span className="font-medium">Durability:</span> 10 on Mohs scale (hardest natural substance)</li>
                      <li><span className="font-medium">Notable sources:</span> Russia, Botswana, Canada, Australia</li>
                    </ul>
                  </div>
                  
                  <div className="bg-muted/5 p-4 rounded-lg border border-primary/10">
                    <h4 className="font-semibold text-lg mb-2">Colored Gemstones</h4>
                    <ul className="list-disc pl-5 space-y-1.5">
                      <li><span className="font-medium">Sapphire:</span> Various colors (blue most valuable), Burma/Kashmir origin premium</li>
                      <li><span className="font-medium">Ruby:</span> "Pigeon blood" red most prized, Burma (Myanmar) commands highest prices</li>
                      <li><span className="font-medium">Emerald:</span> Colombian stones fetch premium prices, typically oil-treated</li>
                      <li><span className="font-medium">Pricing:</span> Fine natural sapphires/rubies: $1,000-$15,000/ct; emeralds: $500-$9,000/ct</li>
                      <li><span className="font-medium">Investment:</span> Excellent long-term value retention for untreated stones</li>
                    </ul>
                  </div>
                  
                  <div className="bg-muted/5 p-4 rounded-lg border border-primary/10">
                    <h4 className="font-semibold text-lg mb-2">Polki & Uncut Diamonds</h4>
                    <ul className="list-disc pl-5 space-y-1.5">
                      <li><span className="font-medium">Description:</span> Natural, uncut diamonds with flat bottoms and polished tops</li>
                      <li><span className="font-medium">Heritage:</span> Traditional in Indian jewelry for centuries</li>
                      <li><span className="font-medium">Light play:</span> Subtle, organic sparkle unlike brilliant-cut diamonds</li>
                      <li><span className="font-medium">Value factors:</span> Size, clarity, and natural crystal shape</li>
                      <li><span className="font-medium">Price range:</span> $200-$1,000/ct, much lower than faceted diamonds</li>
                    </ul>
                  </div>
                  
                  <div className="col-span-1 md:col-span-3 mt-4">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Settings className="h-5 w-5 text-slate-500" />
                      Lab-Created Gems: Scientific Marvels
                    </h3>
                  </div>
                  
                  <div className="bg-muted/5 p-4 rounded-lg border border-primary/10">
                    <h4 className="font-semibold text-lg mb-2">Lab-Grown Diamonds</h4>
                    <ul className="list-disc pl-5 space-y-1.5">
                      <li><span className="font-medium">Composition:</span> 100% carbon, chemically identical to natural diamonds</li>
                      <li><span className="font-medium">Creation:</span> HPHT (high pressure) or CVD (chemical vapor deposition) methods</li>
                      <li><span className="font-medium">Price comparison:</span> 40-70% less than natural diamonds</li>
                      <li><span className="font-medium">Identification:</span> Requires specialized equipment to distinguish from natural</li>
                      <li><span className="font-medium">Sustainability:</span> Minimal environmental impact compared to mining</li>
                    </ul>
                  </div>
                  
                  <div className="bg-muted/5 p-4 rounded-lg border border-primary/10">
                    <h4 className="font-semibold text-lg mb-2">Lab-Created Colored Gems</h4>
                    <ul className="list-disc pl-5 space-y-1.5">
                      <li><span className="font-medium">Composition:</span> Chemically identical to natural counterparts</li>
                      <li><span className="font-medium">Methods:</span> Flame fusion, hydrothermal, or flux growth</li>
                      <li><span className="font-medium">Sapphire/Ruby:</span> 10-30% of natural prices, consistent color, fewer inclusions</li>
                      <li><span className="font-medium">Emerald:</span> 5-10% of natural prices, fewer inclusions, no oil treatment</li>
                      <li><span className="font-medium">Price range:</span> $50-300/ct depending on type and quality</li>
                    </ul>
                  </div>
                  
                  <div className="bg-muted/5 p-4 rounded-lg border border-primary/10">
                    <h4 className="font-semibold text-lg mb-2">Moissanite</h4>
                    <ul className="list-disc pl-5 space-y-1.5">
                      <li><span className="font-medium">Composition:</span> Silicon carbide, not a diamond but its own gemstone</li>
                      <li><span className="font-medium">Brilliance:</span> Higher refractive index than diamond (more fire/rainbow flashes)</li>
                      <li><span className="font-medium">Durability:</span> 9.25 on Mohs scale (second only to diamond)</li>
                      <li><span className="font-medium">Price comparison:</span> 1/10th of diamond cost ($250-800/ct)</li>
                      <li><span className="font-medium">Identification:</span> Double refraction and rainbow flashes distinguish from diamond</li>
                    </ul>
                  </div>
                  
                  <div className="col-span-1 md:col-span-3 mt-4">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Gem className="h-5 w-5 text-rose-500" />
                      Simulants & Luxury Crystals
                    </h3>
                  </div>
                  
                  <div className="bg-muted/5 p-4 rounded-lg border border-primary/10">
                    <h4 className="font-semibold text-lg mb-2">Cubic Zirconia (CZ)</h4>
                    <ul className="list-disc pl-5 space-y-1.5">
                      <li><span className="font-medium">Composition:</span> Zirconium dioxide, a diamond simulant</li>
                      <li><span className="font-medium">Visual traits:</span> More brilliance than diamond but less fire</li>
                      <li><span className="font-medium">Durability:</span> 8-8.5 on Mohs scale, prone to scratching over time</li>
                      <li><span className="font-medium">Price range:</span> $5-30/ct, extremely affordable</li>
                      <li><span className="font-medium">Longevity:</span> Can cloud or yellow with age, not lifetime pieces</li>
                    </ul>
                  </div>
                  
                  <div className="bg-muted/5 p-4 rounded-lg border border-primary/10">
                    <h4 className="font-semibold text-lg mb-2">Swarovski Crystals</h4>
                    <ul className="list-disc pl-5 space-y-1.5">
                      <li><span className="font-medium">Composition:</span> Lead glass crystal, not a gemstone</li>
                      <li><span className="font-medium">Manufacturing:</span> Precision-cut with proprietary techniques</li>
                      <li><span className="font-medium">Durability:</span> 6-7 on Mohs scale, softer than most gemstones</li>
                      <li><span className="font-medium">Distinction:</span> Higher quality than regular glass, luxurious for costume jewelry</li>
                      <li><span className="font-medium">Price point:</span> $0.10-10 per piece depending on size and complexity</li>
                    </ul>
                  </div>
                  
                  <div className="bg-muted/5 p-4 rounded-lg border border-primary/10">
                    <h4 className="font-semibold text-lg mb-2">Other Gemstone Simulants</h4>
                    <ul className="list-disc pl-5 space-y-1.5">
                      <li><span className="font-medium">Glass:</span> Used for imitation emeralds and low-cost jewelry</li>
                      <li><span className="font-medium">Synthetic spinel:</span> Common for colored stone imitations</li>
                      <li><span className="font-medium">YAG/GGG:</span> Earlier diamond simulants before CZ became dominant</li>
                      <li><span className="font-medium">Strontium titanate:</span> Extreme dispersion (rainbow effect), low durability</li>
                      <li><span className="font-medium">Treated natural stones:</span> Dyed quartz to imitate more expensive gems</li>
                    </ul>
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                <div className="mb-6">
                  <h3 className="font-semibold text-xl mb-3 text-primary flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-slate-500" />
                    Treatments & Enhancements
                  </h3>
                  <p className="mb-4">
                    Most gemstones undergo some form of enhancement to improve their appearance. Understanding these treatments and their impact on value is crucial for informed purchasing decisions.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Heat Treatment</h4>
                    <p className="mb-3">
                      The most common and accepted treatment for sapphires and rubies. Permanent enhancement that improves color and clarity.
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><span className="font-medium">Price impact:</span> Unheated stones command 30-100% premium</li>
                      <li><span className="font-medium">Disclosure:</span> Standard industry practice to disclose</li>
                      <li><span className="font-medium">Detection:</span> Specialized lab equipment required</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Oil/Resin Treatments</h4>
                    <p className="mb-3">
                      Used primarily for emeralds and other included stones to improve clarity by filling fractures.
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><span className="font-medium">Cedar oil:</span> Traditional, accepted treatment (minimal value impact)</li>
                      <li><span className="font-medium">Polymers/resins:</span> More permanent but significantly reduce value</li>
                      <li><span className="font-medium">Maintenance:</span> May require re-treatment over time</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Fracture Filling/Glass Filling</h4>
                    <p className="mb-3">
                      Used on rubies, diamonds, and other stones with fractures. Lead glass or similar substances fill cracks.
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><span className="font-medium">Value impact:</span> Dramatic reduction (90-99%)</li>
                      <li><span className="font-medium">Durability issues:</span> Can degrade with heat, chemicals, or ultrasonic cleaning</li>
                      <li><span className="font-medium">Identification:</span> Gas bubbles, flash effects under magnification</li>
                    </ul>
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                <h3 className="font-semibold text-xl mb-3 text-primary flex items-center gap-2">
                  <Gem className="h-5 w-5 text-rose-500" />
                  Cuts, Shapes & Forms
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Faceted Cuts</h4>
                    <p className="mb-2">Stones cut with multiple flat surfaces (facets) to maximize light reflection and brilliance.</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><span className="font-medium">Value impact:</span> Highest for precision-cut gems</li>
                      <li><span className="font-medium">Popular cuts:</span> Oval, cushion, and emerald cuts for these gems</li>
                      <li><span className="font-medium">Price differential:</span> Well-cut stones command 20-50% premium</li>
                      <li><span className="font-medium">Best for:</span> Higher clarity stones where brilliance is emphasized</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Cabochons (Cabs)</h4>
                    <p className="mb-2">Stones with a polished, rounded top and flat bottom, no facets.</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><span className="font-medium">Value impact:</span> Generally lower than faceted cuts</li>
                      <li><span className="font-medium">Best for:</span> Star rubies or emeralds with interesting inclusions</li>
                      <li><span className="font-medium">Price differential:</span> 30-60% less than equivalent faceted stones</li>
                      <li><span className="font-medium">Exception:</span> Star rubies can be more valuable as cabochons</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Carved Gems</h4>
                    <p className="mb-2">Stones carved into decorative shapes or with engraved designs.</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><span className="font-medium">Value factors:</span> Artistry, complexity, and stone quality</li>
                      <li><span className="font-medium">Types:</span> Relief carvings, intaglios, and three-dimensional figures</li>
                      <li><span className="font-medium">Premium for:</span> Master carver signatures (can double value)</li>
                      <li><span className="font-medium">Size impact:</span> Larger stones allow more detail and higher values</li>
                    </ul>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Beads & Their Shapes</h4>
                    <p className="mb-2">Perforated stones used in strands or as components in jewelry designs.</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><span className="font-medium">Round beads:</span> Most traditional, labor-intensive, highest value</li>
                      <li><span className="font-medium">Rondelles:</span> Disc-shaped, show more color face-up</li>
                      <li><span className="font-medium">Briolettes:</span> Teardrop-shaped with facets, premium value</li>
                      <li><span className="font-medium">Tumbled beads:</span> Irregular shapes, lowest per-carat value</li>
                      <li><span className="font-medium">Factors affecting value:</span> Consistency in size/shape, polish quality, color matching</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Onyx: Varieties & Properties</h4>
                    <p className="mb-2">Onyx is a type of chalcedony quartz that comes in various colors, not just black.</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><span className="font-medium">Composition:</span> Layered chalcedony quartz with parallel bands</li>
                      <li><span className="font-medium">Natural colors:</span> White, red (sardonyx), brown, and rarely black</li>
                      <li><span className="font-medium">Treatments:</span> Most black onyx is color-enhanced through dyeing</li>
                      <li><span className="font-medium">Durability:</span> 6.5-7 on Mohs scale, excellent for everyday wear</li>
                      <li><span className="font-medium">Value factors:</span> Color intensity, banding pattern, and carving quality</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl">Precious vs. Semi-Precious</CardTitle>
                <CardDescription>Understanding the classification of gemstones</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  The terms "precious" and "semi-precious" are traditional classifications that have been used for centuries, but modern gemologists recognize that this distinction is somewhat arbitrary.
                </p>
                <p>
                  Historically, only diamonds, rubies, sapphires, and emeralds were considered precious, while all other gemstones were deemed semi-precious. Today, factors like rarity, durability, and market demand are more important indicators of a gemstone's value.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl">Understanding Carats</CardTitle>
                <CardDescription>The weight and measurement of gemstones</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Carat is a unit of weight used specifically for gemstones, equal to 200 milligrams. Don't confuse it with "karat," which measures gold purity.
                </p>
                <p>
                  While larger gemstones (higher carat weight) are generally more valuable, factors like color, clarity, and cut can influence a stone's value more significantly than size alone.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl">Price Impact of Gemstone Features</CardTitle>
                <CardDescription>How various factors affect the market value</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="bg-primary/10">
                        <th className="border p-2 text-left">Feature</th>
                        <th className="border p-2 text-left">Premium Quality</th>
                        <th className="border p-2 text-left">Standard Quality</th>
                        <th className="border p-2 text-left">Price Impact</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border p-2 font-medium">Origin</td>
                        <td className="border p-2">Burma (Ruby), Colombia (Emerald)</td>
                        <td className="border p-2">Thailand, Zambia</td>
                        <td className="border p-2">200-300% premium</td>
                      </tr>
                      <tr className="bg-muted/20">
                        <td className="border p-2 font-medium">Treatment</td>
                        <td className="border p-2">Untreated</td>
                        <td className="border p-2">Heat/Oil treated</td>
                        <td className="border p-2">100-200% premium</td>
                      </tr>
                      <tr>
                        <td className="border p-2 font-medium">Cut Type</td>
                        <td className="border p-2">Precision faceted</td>
                        <td className="border p-2">Cabochon</td>
                        <td className="border p-2">30-50% premium</td>
                      </tr>
                      <tr className="bg-muted/20">
                        <td className="border p-2 font-medium">Formation</td>
                        <td className="border p-2">Natural</td>
                        <td className="border p-2">Lab-created</td>
                        <td className="border p-2">90-95% discount for lab</td>
                      </tr>
                      <tr>
                        <td className="border p-2 font-medium">Bead Quality</td>
                        <td className="border p-2">Matched, round</td>
                        <td className="border p-2">Irregular, tumbled</td>
                        <td className="border p-2">50-70% premium</td>
                      </tr>
                      <tr className="bg-muted/20">
                        <td className="border p-2 font-medium">Carving</td>
                        <td className="border p-2">Master carver signed</td>
                        <td className="border p-2">Commercial carving</td>
                        <td className="border p-2">100-300% premium</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  Note: These price differentials are approximate and can vary significantly based on market conditions, size, and other quality factors.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl">Polki & Kundan</CardTitle>
                <CardDescription>Traditional Indian gemstone techniques</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Polki refers to uncut, natural diamonds that have been used in traditional Indian jewelry for centuries. Unlike modern cut diamonds, Polki stones retain their natural character and are set with their flat side up.
                </p>
                <p>
                  Kundan is a traditional technique of setting gems in gold foil. This labor-intensive process creates a distinctive look that has adorned Indian royalty for generations.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Metals Tab */}
        <TabsContent value="metals" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-primary/20">
              <CardHeader className="bg-primary/5">
                <CardTitle className="font-cormorant text-2xl flex items-center gap-2">
                  <Scale className="h-5 w-5 text-amber-500" />
                  Gold Purity: Understanding Karats
                </CardTitle>
                <CardDescription>What those numbers really mean</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <p className="mb-4">
                    The karat system measures the purity of gold in 24 parts. 24K gold is pure (99.9%), while 22K, 18K, and 14K contain 22, 18, and 14 parts gold, respectively, mixed with other metals.
                  </p>
                  <p>
                    Higher karat gold (22K-24K) is more valuable but softer, while lower karat gold is more durable for everyday wear. Different jewelry pieces benefit from different karat levels based on their intended use.
                  </p>
                </div>
                
                <div className="bg-gradient-to-r from-amber-50 to-transparent p-5 rounded-lg border border-amber-200/30">
                  <h3 className="font-semibold text-lg mb-3">Why 14K Gold Is Excellent for Fine Jewelry: Debunking the Myths</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-base mb-2 flex items-center gap-1.5">
                        <Check className="h-4 w-4 text-primary" />
                        Superior Durability
                      </h4>
                      <p className="mb-3 text-sm">
                        14K gold contains 58.3% pure gold, with the remainder being stronger metals like silver, copper, and zinc. This optimal balance creates jewelry that resists daily wear far better than higher karat options.
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li><span className="font-medium">Scratch resistance:</span> 2-3× more resistant to scratching than 24K</li>
                        <li><span className="font-medium">Deformation resistance:</span> Maintains shape under pressure</li>
                        <li><span className="font-medium">Practical advantage:</span> Ideal for rings and bracelets that face constant impact</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-base mb-2 flex items-center gap-1.5">
                        <X className="h-4 w-4 text-rose-500" />
                        Myth: "14K is Low Quality"
                      </h4>
                      <p className="mb-3 text-sm">
                        The misconception that higher karat equals higher quality is simply incorrect. Quality in gold jewelry depends on craftsmanship, design, and appropriate karat selection for the piece's purpose.
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li><span className="font-medium">Industry standard:</span> Most luxury jewelry houses use 14K-18K for fine pieces</li>
                        <li><span className="font-medium">Historical precedent:</span> Many museum-quality antique pieces are 14K</li>
                        <li><span className="font-medium">Expert preference:</span> Jewelers often recommend 14K for everyday luxury</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-base mb-2 flex items-center gap-1.5">
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                        Smart Value Proposition
                      </h4>
                      <p className="mb-3 text-sm">
                        14K gold offers superior value, allowing more investment in design complexity, gemstone quality, or overall size compared to the same budget in higher karat gold.
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li><span className="font-medium">Cost efficiency:</span> 30-40% less expensive than 18K with minimal visible difference</li>
                        <li><span className="font-medium">Metal value retention:</span> Still contains substantial gold for investment purposes</li>
                        <li><span className="font-medium">Design potential:</span> Budget allows for more elaborate craftsmanship</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-base mb-2 flex items-center gap-1.5">
                        <X className="h-4 w-4 text-rose-500" />
                        Myth: "14K Will Look Dull"
                      </h4>
                      <p className="mb-3 text-sm">
                        While 14K has a slightly different tone than higher karat gold, well-formulated 14K alloys maintain beautiful color and luster. Yellow, rose, and white gold all shine brilliantly in 14K.
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li><span className="font-medium">Color control:</span> Premium 14K alloys are formulated for optimal color</li>
                        <li><span className="font-medium">Luster retention:</span> 14K holds polish longer due to hardness</li>
                        <li><span className="font-medium">Versatility:</span> White and rose gold often look best in 14K due to alloy compositions</li>
                      </ul>
                    </div>
                  </div>
                  
                  <p className="mt-4 text-sm text-muted-foreground">
                    The ideal karat choice should balance budget, intended use, and design needs. For jewelry that will be worn frequently, 14K offers the perfect combination of quality, durability, and value.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl">Gold Colors Explained</CardTitle>
                <CardDescription>Beyond the traditional yellow</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Yellow gold is the natural color of pure gold alloyed with silver and copper. White gold contains white metals like palladium or silver, plus usually a rhodium plating. Rose gold incorporates a higher percentage of copper for its distinctive pink hue.
                </p>
                <p>
                  Each gold color has unique properties and aesthetic qualities that suit different skin tones and design styles.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl">Metal Allergies: Facts & Solutions</CardTitle>
                <CardDescription>Finding jewelry that works for sensitive skin</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Metal allergies are most commonly reactions to nickel, which can be present in white gold and other alloys. Pure metals like 24K gold or platinum rarely cause allergic reactions.
                </p>
                <p>
                  For sensitive skin, consider platinum, palladium, titanium, or higher karat gold pieces that contain minimal alloys.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl">Metal Weight in Jewelry</CardTitle>
                <CardDescription>Why it matters for quality and longevity</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  The weight of precious metals in a piece reflects its durability and investment value. Heavier pieces typically contain more precious metal and will withstand daily wear better.
                </p>
                <p>
                  However, modern jewelry techniques can create strong yet lightweight pieces that are comfortable to wear while maintaining durability.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Craftsmanship Tab */}
        <TabsContent value="craftsmanship" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <Settings className="h-6 w-6 text-slate-500" />
                <div>
                  <CardTitle className="font-cormorant text-2xl">Setting Techniques</CardTitle>
                  <CardDescription>How gems are secured in jewelry</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Prong settings elevate gems for maximum light exposure but offer less protection. Bezel settings encircle stones completely, offering more security but potentially less brilliance.
                </p>
                <p>
                  Pavé, channel, and invisible settings are techniques used to create surfaces of continuous sparkle with multiple smaller stones set closely together.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <Wrench className="h-6 w-6 text-amber-600" />
                <div>
                  <CardTitle className="font-cormorant text-2xl">Handcrafted vs. Machine-Made</CardTitle>
                  <CardDescription>The value of artisan craftsmanship</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Handcrafted jewelry carries the unique signature of its creator, with subtle variations that make each piece one-of-a-kind. These pieces often feature more complex designs and attention to detail.
                </p>
                <p>
                  Machine-made jewelry offers consistency and precision but may lack the character and personal touch of handcrafted pieces. The best jewelry often combines both approaches.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <Palette className="h-6 w-6 text-indigo-500" />
                <div>
                  <CardTitle className="font-cormorant text-2xl">Jewelry Finishing Techniques</CardTitle>
                  <CardDescription>Surface treatments that enhance beauty</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Polishing creates mirror-like surfaces that maximize sparkle and shine. Hammering or texturing adds visual interest and can disguise minor scratches over time.
                </p>
                <p>
                  Techniques like engraving, filigree, and milgrain (tiny beads along edges) add intricate details that elevate a piece from ordinary to extraordinary.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <Sparkles className="h-6 w-6 text-amber-500" />
                <div>
                  <CardTitle className="font-cormorant text-2xl">Caring for Fine Jewelry</CardTitle>
                  <CardDescription>Preserving beauty for generations</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Different gems and metals require specific care. Diamonds are durable but can chip if struck at the right angle. Pearls are delicate and should avoid contact with perfumes and cosmetics.
                </p>
                <p>
                  Regular professional cleaning and maintenance can extend the life of your jewelry. Store pieces separately to prevent scratching, and remove jewelry before swimming, exercising, or using household chemicals.
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-10">
            <Card className="border-primary/20">
              <CardHeader className="bg-primary/5">
                <CardTitle className="font-cormorant text-3xl flex items-center gap-2">
                  <Users className="h-6 w-6 text-amber-600" />
                  Artisans, Craftspeople & Designers
                </CardTitle>
                <CardDescription>The human element that transforms jewelry from accessory to art</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                  <div className="col-span-1 lg:col-span-3">
                    <h3 className="font-semibold text-xl mb-4 text-primary flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-amber-500" />
                      Master Craftspeople: The Guardians of Tradition
                    </h3>
                    <p className="mb-4">
                      Behind every exceptional piece of jewelry stands a master craftsperson whose skills have been refined over decades. These artisans represent the pinnacle of their specialized trades, with knowledge often passed down through generations and refined through years of dedicated practice.
                    </p>
                  </div>
                  
                  <div className="bg-muted/5 p-5 rounded-lg border border-primary/10">
                    <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Hammer className="h-5 w-5 text-slate-500" />
                      Master Goldsmiths
                    </h4>
                    <p className="mb-3">
                      Master goldsmiths are the architects of fine jewelry, transforming raw precious metals into wearable art through techniques like forging, casting, and fabrication.
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5 text-sm">
                      <li><span className="font-medium">Training period:</span> 5-15 years to achieve mastery</li>
                      <li><span className="font-medium">Signature skills:</span> Creating perfect solder joints invisible to the naked eye</li>
                      <li><span className="font-medium">Tools:</span> Often use tools designed and made by the goldsmith themselves</li>
                      <li><span className="font-medium">Luxury indicator:</span> Hand-forged pieces by renowned masters can command 200-500% premium</li>
                    </ul>
                  </div>
                  
                  <div className="bg-muted/5 p-5 rounded-lg border border-primary/10">
                    <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Gem className="h-5 w-5 text-emerald-500" />
                      Master Gemsetters
                    </h4>
                    <p className="mb-3">
                      The elite specialists who secure precious stones in their settings. Their steady hands and perfect eye ensure each stone is secure while maximizing its beauty.
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5 text-sm">
                      <li><span className="font-medium">Technical precision:</span> Work at microscopic levels of detail</li>
                      <li><span className="font-medium">Specialization:</span> May focus on specific setting styles (pavé, invisible, channel)</li>
                      <li><span className="font-medium">Risk management:</span> Handle gems worth thousands to millions of dollars</li>
                      <li><span className="font-medium">Signatures:</span> Top setters develop recognizable styles collectors can identify</li>
                    </ul>
                  </div>
                  
                  <div className="bg-muted/5 p-5 rounded-lg border border-primary/10">
                    <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Brush className="h-5 w-5 text-orange-500" />
                      Enamellists & Specialists
                    </h4>
                    <p className="mb-3">
                      Practitioners of specialized decorative techniques that add color, texture, and dimension to jewelry through methods that may be centuries old.
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5 text-sm">
                      <li><span className="font-medium">Enamelling:</span> Fusing colored glass to metal at high temperatures</li>
                      <li><span className="font-medium">Engraving:</span> Creating patterns and images through precision carving</li>
                      <li><span className="font-medium">Filigree:</span> Weaving fine threads of precious metal into delicate patterns</li>
                      <li><span className="font-medium">Granulation:</span> Attaching tiny spheres of metal to create texture and design</li>
                    </ul>
                  </div>
                  
                  <div className="col-span-1 lg:col-span-3 mt-6">
                    <h3 className="font-semibold text-xl mb-4 text-primary flex items-center gap-2">
                      <PenTool className="h-5 w-5 text-indigo-500" />
                      Jewelry Designers: From Vision to Reality
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div>
                        <p className="mb-4">
                          Jewelry designers are the visionaries who conceive the pieces that craftspeople bring to life. They blend artistic sensibility with technical understanding, creating designs that balance aesthetics, wearability, and structural integrity.
                        </p>
                        <div className="bg-gradient-to-r from-primary/5 to-transparent p-5 rounded-lg mb-4">
                          <h4 className="font-semibold text-lg mb-2">Signature Design Houses</h4>
                          <p className="mb-3">
                            The most prestigious luxury jewelry houses maintain distinctive design languages recognizable across generations. Their signature elements become cultural touchstones, with pieces that represent not just adornment but cultural artifacts.
                          </p>
                          <ul className="list-disc pl-5 space-y-1 text-sm">
                            <li><span className="font-medium">Heritage houses:</span> Build on decades or centuries of design history</li>
                            <li><span className="font-medium">Design consistency:</span> Create pieces that remain relevant across generations</li>
                            <li><span className="font-medium">Archives:</span> Maintain extensive design libraries spanning their history</li>
                            <li><span className="font-medium">Legacy value:</span> Signed vintage pieces often appreciate significantly</li>
                          </ul>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex flex-col h-full">
                          <div className="bg-gradient-to-r from-primary/5 to-transparent p-5 rounded-lg mb-4">
                            <h4 className="font-semibold text-lg mb-2">Independent Designer-Artisans</h4>
                            <p className="mb-3">
                              Independent jewelry artists who both design and create their work represent a special category where artistic vision meets technical mastery, resulting in deeply personal, distinctive jewelry.
                            </p>
                            <ul className="list-disc pl-5 space-y-1 text-sm">
                              <li><span className="font-medium">Personal touch:</span> Often meet directly with clients for bespoke commissions</li>
                              <li><span className="font-medium">Artistic freedom:</span> Create signature styles uninhibited by corporate directives</li>
                              <li><span className="font-medium">Limited production:</span> Typically create fewer, more exclusive pieces</li>
                              <li><span className="font-medium">Collectibility:</span> Early works of later-famous artists become highly sought after</li>
                            </ul>
                          </div>
                          
                          <div className="bg-gradient-to-r from-primary/5 to-transparent p-5 rounded-lg">
                            <h4 className="font-semibold text-lg mb-2">Recognizing Master Craftsmanship</h4>
                            <ul className="list-disc pl-5 space-y-2 text-sm">
                              <li>
                                <span className="font-medium">Look for precision:</span> Carefully examine joint work, symmetry, and stone setting quality
                              </li>
                              <li>
                                <span className="font-medium">Weight and feel:</span> Well-crafted pieces have appropriate heft and balance
                              </li>
                              <li>
                                <span className="font-medium">Finishing details:</span> Check underside and hidden areas for quality consistency
                              </li>
                              <li>
                                <span className="font-medium">Maker's marks:</span> Quality pieces are signed by their creators or houses
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator className="my-8" />
                
                <div className="mb-6">
                  <h3 className="font-semibold text-xl mb-4 text-primary flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-amber-600" />
                    Notable Traditions in Jewelry Artisanship
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="col-span-1 md:col-span-3">
                    <div className="bg-muted/5 p-5 rounded-lg border border-primary/10 mb-6">
                      <h4 className="font-semibold text-lg mb-3">Indian Jewelry Masters</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="mb-3">
                            Indian jewelry traditions span thousands of years, with regional specializations that have been refined over centuries by dedicated family workshops.
                          </p>
                          <ul className="list-disc pl-5 space-y-1.5">
                            <li><span className="font-medium">Kundan masters:</span> Craftspeople who can set stones in gold foil without using prongs or adhesives</li>
                            <li><span className="font-medium">Meenakari artists:</span> Specialists in vitreous enamel work featuring intricate painted scenes</li>
                            <li><span className="font-medium">Thewa artisans:</span> Creators of gold-fused colored glass jewelry from Rajasthan</li>
                            <li><span className="font-medium">Filigree masters:</span> Particularly from Orissa and Bengal, creating lace-like metal designs</li>
                          </ul>
                        </div>
                        <div>
                          <p className="mb-3">
                            The hallmark of Indian craftsmanship is the extraordinary level of detail achieved through painstaking handwork that can require months for a single piece.
                          </p>
                          <ul className="list-disc pl-5 space-y-1.5">
                            <li><span className="font-medium">Training method:</span> Traditional guru-shishya (master-apprentice) relationship</li>
                            <li><span className="font-medium">Time investment:</span> 10-15 years to achieve mastery in specialized techniques</li>
                            <li><span className="font-medium">Family lineage:</span> Skills often passed through generations within families</li>
                            <li><span className="font-medium">Regional styles:</span> Each region of India has distinctive traditional designs</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-muted/5 p-5 rounded-lg border border-primary/10">
                    <h4 className="font-semibold text-lg mb-2">Italian Goldsmithing</h4>
                    <p className="mb-3">
                      Italy's jewelry tradition, particularly centered in regions like Arezzo, Vicenza, and Valenza, is renowned for excellence in chain-making, hollow-form construction, and innovative gold alloys.
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><span className="font-medium">Chain mastery:</span> Creating complex patterns with microscopic links</li>
                      <li><span className="font-medium">Technical innovation:</span> Pioneering lightweight hollow gold techniques</li>
                      <li><span className="font-medium">Design legacy:</span> Contemporary designs informed by ancient Etruscan methods</li>
                      <li><span className="font-medium">Marking:</span> Look for Italian hallmarks and city stamps as quality indicators</li>
                    </ul>
                  </div>
                  
                  <div className="bg-muted/5 p-5 rounded-lg border border-primary/10">
                    <h4 className="font-semibold text-lg mb-2">French High Jewelry</h4>
                    <p className="mb-3">
                      French jewelry making, especially from Parisian houses, emphasizes sophisticated design, elegant proportions, and impeccable gem setting quality.
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><span className="font-medium">Atelier system:</span> Collaborative workshops with specialized artisans</li>
                      <li><span className="font-medium">Setting excellence:</span> Pioneered many invisible and mystery settings</li>
                      <li><span className="font-medium">Transformable design:</span> Creating pieces that can be worn multiple ways</li>
                      <li><span className="font-medium">Provenance:</span> Careful documentation of design and creation processes</li>
                    </ul>
                  </div>
                  
                  <div className="bg-muted/5 p-5 rounded-lg border border-primary/10">
                    <h4 className="font-semibold text-lg mb-2">Japanese Metalwork</h4>
                    <p className="mb-3">
                      Japanese jewelry artisans draw from centuries of metalworking traditions like those used in sword fittings, bringing extraordinary surface treatments to contemporary jewelry.
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><span className="font-medium">Mokume-gane:</span> Creating wood-grain patterns in metal through lamination</li>
                      <li><span className="font-medium">Shakudo:</span> Alloy technique producing deep blue-black patinas on gold-copper</li>
                      <li><span className="font-medium">Precision:</span> Exceptional attention to detail and surface finish</li>
                      <li><span className="font-medium">Materials:</span> Creative use of non-precious metals alongside precious elements</li>
                    </ul>
                  </div>
                </div>
                
                <div className="bg-primary/5 p-5 rounded-lg border border-primary/20">
                  <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <HeartHandshake className="h-5 w-5 text-rose-500" />
                    The Future of Jewelry Craftsmanship
                  </h4>
                  <p className="mb-4">
                    Today's most innovative jewelry artists are finding ways to honor traditional craftsmanship while embracing new technologies and sustainable practices. This fusion approach represents the future of luxury jewelry.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-medium text-base mb-2">Technology Integration</h5>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Computer-aided design for complex structures impossible by hand</li>
                        <li>3D printing for prototyping and creating complex components</li>
                        <li>Laser welding for previously impossible joining techniques</li>
                        <li>Digital archives preserving traditional techniques and designs</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium text-base mb-2">Ethical & Sustainable Practices</h5>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Focus on traceable gemstone sourcing and fair mining practices</li>
                        <li>Use of recycled precious metals to reduce environmental impact</li>
                        <li>Revival of traditional techniques that minimize waste</li>
                        <li>Creating pieces designed for generational longevity rather than temporary fashion</li>
                      </ul>
                    </div>
                  </div>
                  <p className="mt-4 text-sm italic text-muted-foreground">
                    "The most precious element in a piece of jewelry isn't the gold or the gemstones, but the human ingenuity, skill, and heart that transformed them into something transcendent." — Contemporary jewelry philosophy
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Indian Heritage Tab */}
        <TabsContent value="history" className="space-y-8">
          <div className="grid grid-cols-1 gap-8">
            <Card className="border-primary/20">
              <CardHeader className="bg-primary/5">
                <CardTitle className="font-cormorant text-3xl flex items-center gap-2">
                  <Crown className="h-6 w-6 text-amber-600" />
                  The Luxury Legacy of Indian Jewelry
                </CardTitle>
                <CardDescription>A journey through centuries of opulence and craftsmanship</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="mb-8">
                  <h3 className="font-semibold text-xl mb-3 text-primary flex items-center gap-2">
                    <History className="h-5 w-5 text-rose-500" />
                    Royal Patronage: The Foundation of Luxury
                  </h3>
                  <p className="mb-4">
                    India's jewelry heritage is inextricably linked to royal patronage, which fostered the development of specialized techniques and designs that continue to define luxury today. For centuries, Indian maharajas commissioned extraordinary pieces that combined massive gemstones with intricate craftsmanship.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border-l-4 border-primary/30 pl-4">
                      <h4 className="font-semibold text-lg mb-2">The Patiala Necklace</h4>
                      <p>
                        Perhaps the most legendary example of Indian jewelry opulence, this Cartier creation for Maharaja Bhupinder Singh of Patiala featured 2,930 diamonds and multiple Burmese rubies. Commissioned in 1928, it exemplified how Indian royalty influenced global luxury jewelry design, creating pieces that built generational legacy.
                      </p>
                    </div>
                    <div className="border-l-4 border-amber-300/50 pl-4">
                      <h4 className="font-semibold text-lg mb-2">The Baroda Pearl Carpet</h4>
                      <p>
                        Created by the Maharaja of Baroda, this extraordinary piece featured 1.5-2 million natural pearls, along with diamonds, rubies, emeralds, and sapphires. Intended as a gift for the tomb of the Prophet Muhammad in Medina, it never reached its destination and instead became a symbol of how jewelry transcends adornment to become cultural artifacts of immense value.
                      </p>
                    </div>
                  </div>
                </div>
                
                <Separator className="my-8" />
                
                <div className="mb-8">
                  <h3 className="font-semibold text-xl mb-4 text-primary flex items-center gap-2">
                    <Medal className="h-5 w-5 text-amber-500" />
                    Regional Mastery: The Pillars of Indian Jewelry Legacy
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-muted/10 p-4 rounded-lg border border-primary/10">
                      <h4 className="font-semibold text-lg mb-2 text-primary">Kundan & Meenakari</h4>
                      <p className="mb-3">
                        Originating in the royal courts of Rajasthan and Gujarat, Kundan involves setting stones in a gold foil base, while Meenakari adds colored enameling to the reverse side. This combination creates pieces with incredible dimension and color contrast.
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li><span className="font-medium">Luxury factor:</span> Labor-intensive technique requires multiple artisans</li>
                        <li><span className="font-medium">Legacy value:</span> Pieces are often passed down as heirlooms</li>
                        <li><span className="font-medium">Investment quality:</span> Finest examples appreciate 15-20% annually</li>
                      </ul>
                    </div>
                    
                    <div className="bg-muted/10 p-4 rounded-lg border border-primary/10">
                      <h4 className="font-semibold text-lg mb-2 text-primary">Temple Jewelry</h4>
                      <p className="mb-3">
                        Developed in South India, particularly Tamil Nadu and Kerala, Temple jewelry originated as adornments for deity statues. Characterized by divine motifs and substantial gold work, these pieces embody both luxury and spiritual significance.
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li><span className="font-medium">Luxury factor:</span> Uses highest purity gold (22-24K)</li>
                        <li><span className="font-medium">Legacy value:</span> Combines material value with cultural heritage</li>
                        <li><span className="font-medium">Investment quality:</span> Gold content provides security against inflation</li>
                      </ul>
                    </div>
                    
                    <div className="bg-muted/10 p-4 rounded-lg border border-primary/10">
                      <h4 className="font-semibold text-lg mb-2 text-primary">Jadau & Polki</h4>
                      <p className="mb-3">
                        Jadau is a technique of embedding uncut diamonds (Polki) and other gemstones into metal. This Mughal-era technique represents the pinnacle of Indian jewelry craftsmanship, combining substantial gemstone weight with artistic excellence.
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li><span className="font-medium">Luxury factor:</span> Uncut diamonds create unique light-play</li>
                        <li><span className="font-medium">Legacy value:</span> Each piece has distinctive character</li>
                        <li><span className="font-medium">Investment quality:</span> Increasingly rare due to declining artisan numbers</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <Separator className="my-8" />
                
                <div>
                  <h3 className="font-semibold text-xl mb-4 text-primary flex items-center gap-2">
                    <HeartHandshake className="h-5 w-5 text-rose-500" />
                    Building Your Jewelry Legacy: Modern Strategies
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-semibold text-lg mb-2">Collecting with Purpose</h4>
                      <p className="mb-3">
                        The most valuable jewelry collections tell a cohesive story. Whether focusing on a particular technique, gemstone, or historical period, intentional collecting creates both personal meaning and financial value.
                      </p>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>
                          <span className="font-medium">Signature pieces:</span> Invest in distinctive designs that represent the pinnacle of craftsmanship rather than generic styles
                        </li>
                        <li>
                          <span className="font-medium">Provenance matters:</span> Items with documented history or from notable collections command premium prices
                        </li>
                        <li>
                          <span className="font-medium">Authenticity:</span> Work with reputable jewelers who provide detailed documentation of materials and techniques
                        </li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-lg mb-2">Sustainability in Luxury</h4>
                      <p className="mb-3">
                        Modern luxury increasingly embraces sustainability and ethical sourcing. The most prestigious contemporary Indian jewelry houses are reviving traditional techniques with environmentally and socially responsible practices.
                      </p>
                      <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                        <h5 className="font-medium text-base mb-2">Elements of a Lasting Jewelry Legacy</h5>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-1.5">
                            <BookOpenText className="h-4 w-4 text-primary" />
                            <span>Documentation & certificates</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Swords className="h-4 w-4 text-amber-600" />
                            <span>Master craftsmanship</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Gem className="h-4 w-4 text-emerald-500" />
                            <span>Ethical sourcing</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock3 className="h-4 w-4 text-slate-500" />
                            <span>Regular maintenance</span>
                          </div>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground italic">
                        "True luxury jewelry is not merely about possession, but about passing on beauty, craftsmanship, and stories to future generations."
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-20 text-center">
        <h2 className="font-cormorant text-3xl font-semibold mb-6">Have More Questions?</h2>
        <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
          Our jewelry experts are ready to assist you with any questions about gemstones, 
          metals, or jewelry care. Reach out to us for personalized guidance.
        </p>
        <a 
          href="/contact" 
          className="inline-block bg-primary text-white px-8 py-3 rounded-md font-medium hover:bg-primary/90 transition-colors"
        >
          Contact Our Experts
        </a>
      </div>
    </div>
  );
}