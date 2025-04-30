import React from "react";
import { Helmet } from "react-helmet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
          <TabsTrigger value="gemstones" className="text-lg py-3">Gemstones</TabsTrigger>
          <TabsTrigger value="stone-forms" className="text-lg py-3">Stone Forms</TabsTrigger>
          <TabsTrigger value="metals" className="text-lg py-3">Precious Metals</TabsTrigger>
          <TabsTrigger value="craftsmanship" className="text-lg py-3">Craftsmanship</TabsTrigger>
        </TabsList>

        {/* Stone Forms Tab */}
        <TabsContent value="stone-forms" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
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

            <Card>
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

            <Card>
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

            <Card>
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
                  While diamonds, emeralds, and sapphires are occasionally used in rough form for avant-garde designs, rough stones are more commonly seen with crystals like tourmaline, quartz, and tanzanite that naturally form in aesthetically pleasing shapes with vivid colors and interesting textures.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl">Tumbled Stones</CardTitle>
                <CardDescription>Smooth, polished irregular shapes</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Tumbled stones are rough stones that have been smoothed and polished in a tumbling machine, creating rounded, irregular shapes with a high luster. Though often used for crystal collections, larger tumbled stones are increasingly popular in contemporary jewelry designs.
                </p>
                <p>
                  This finishing technique preserves the stone's natural shape while giving it a refined appearance. Tumbled stones are particularly effective for showcasing the natural patterns in stones like agate, jasper, and malachite, and they're often used in bohemian or nature-inspired jewelry designs.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl">Doublets and Triplets</CardTitle>
                <CardDescription>Composite stone constructions</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Doublets and triplets are composite stones created by bonding two or three layers of material together. Typically, a thin slice of precious gemstone is bonded to a backing material (doublet) or sandwiched between a clear top layer and backing material (triplet).
                </p>
                <p>
                  These constructions allow for creative use of thin gem materials that would otherwise be too fragile to use alone. Opal doublets and triplets are among the most common, allowing thinner slices of precious opal to be used effectively. While not as valuable as solid stones, well-made composites can create stunning visual effects at more accessible price points.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Gemstones Tab */}
        <TabsContent value="gemstones" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                <CardTitle className="font-cormorant text-2xl">Natural vs. Lab Created</CardTitle>
                <CardDescription>Ethical and practical considerations</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Lab-created gemstones have the same physical, chemical, and optical properties as their natural counterparts but are grown in controlled laboratory environments.
                </p>
                <p>
                  While natural gemstones carry the allure of rarity and tradition, lab-created stones offer ethical certainty, consistent quality, and are typically more affordable.
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
          
          <h3 className="font-cormorant text-3xl text-center my-10">Global Gemstone Sources</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl">Famous Gemstone Origins</CardTitle>
                <CardDescription>Where the world's finest gems are found</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-2">
                  <span className="font-semibold">Diamonds:</span> Notable sources include Botswana, Russia, Canada, and Australia. Historically, India was the world's only diamond source until the 18th century.
                </p>
                <p className="mb-2">
                  <span className="font-semibold">Rubies:</span> The finest rubies traditionally come from Myanmar (Burma), particularly the Mogok Valley. Other significant sources include Thailand, Cambodia, and Mozambique.
                </p>
                <p className="mb-2">
                  <span className="font-semibold">Sapphires:</span> Kashmir, Burma, and Sri Lanka produce the most coveted blue sapphires, while Madagascar and Australia are important modern sources.
                </p>
                <p>
                  <span className="font-semibold">Emeralds:</span> Colombia is renowned for producing the world's finest emeralds, particularly from the Muzo, Chivor, and Coscuez mines. Zambia and Brazil are also significant producers.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl">Origin and Value</CardTitle>
                <CardDescription>How a gem's birthplace affects its worth</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  The origin of a gemstone can significantly impact its value, as certain mines are known for producing stones with exceptional color, clarity, or other desirable characteristics. For example, rubies from Myanmar (Burma) typically command premium prices due to their intense "pigeon's blood" red color.
                </p>
                <p>
                  Modern gemological laboratories can often determine a gem's geographic origin through sophisticated testing methods that analyze trace elements and inclusions. These origin determinations are increasingly important in the luxury gem market, where provenance adds to a stone's story and value.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl">Ethical Sourcing</CardTitle>
                <CardDescription>Responsible practices in the gem trade</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  The gemstone industry has made significant strides in addressing ethical concerns around mining practices, working conditions, and environmental impact. 
                </p>
                <p>
                  Organizations like the Responsible Jewellery Council certify companies that adhere to responsible practices. Fair Trade gemstones ensure miners receive fair compensation and work in safe conditions. When purchasing fine jewelry, inquire about the origin of stones and the jeweler's commitment to ethical sourcing.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl">India's Gem Legacy</CardTitle>
                <CardDescription>Ancient traditions and modern excellence</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  India has been a major player in the global gem trade for millennia, once the world's only source of diamonds and still a center for cutting and polishing. Today, India processes over 90% of the world's diamonds by volume.
                </p>
                <p>
                  Beyond diamonds, India has rich deposits of many colored stones including star rubies, sapphires, and a wide variety of semi-precious gems. The country's long history of gemstone expertise is reflected in its traditional jewelry styles that showcase intricate gemstone setting techniques like Kundan and Meenakari.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Metals Tab */}
        <TabsContent value="metals" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl">Gold Purity: Understanding Karats</CardTitle>
                <CardDescription>What those numbers really mean</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  The karat system measures the purity of gold in 24 parts. 24K gold is pure (99.9%), while 22K, 18K, and 14K contain 22, 18, and 14 parts gold, respectively, mixed with other metals.
                </p>
                <p>
                  Higher karat gold (22K-24K) is more valuable but softer, while lower karat gold is more durable for everyday wear. Different jewelry pieces benefit from different karat levels based on their intended use.
                </p>
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
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl">Setting Techniques</CardTitle>
                <CardDescription>How gems are secured in jewelry</CardDescription>
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
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl">Handcrafted vs. Machine-Made</CardTitle>
                <CardDescription>The value of artisan craftsmanship</CardDescription>
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
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl">Jewelry Finishing Techniques</CardTitle>
                <CardDescription>Surface treatments that enhance beauty</CardDescription>
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
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl">Caring for Fine Jewelry</CardTitle>
                <CardDescription>Preserving beauty for generations</CardDescription>
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
          
          <h3 className="font-cormorant text-3xl text-center my-10">Traditional Craftsmanship Techniques</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl">Filigree</CardTitle>
                <CardDescription>Delicate metalwork artistry</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Filigree is an ancient technique involving delicate metalwork where thin threads of gold or silver are twisted and soldered together to create intricate, lace-like patterns. This labor-intensive craft dates back thousands of years and is still practiced in regions like India, Italy, and the Middle East.
                </p>
                <p>
                  Modern filigree often incorporates both traditional hand techniques and advanced technology like laser welding. The result is incredibly detailed and lightweight jewelry that showcases the artisan's skill and patience.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl">Granulation</CardTitle>
                <CardDescription>Ancient technique of fused metal beads</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Granulation is a decorative technique where tiny spheres of metal are arranged in patterns and fused to a metal surface without solder. Dating back to 3000 BCE, this technique reached its peak with the Etruscans, who created astonishingly detailed designs that modern jewelers still struggle to replicate.
                </p>
                <p>
                  The secret of granulation was lost for centuries before being rediscovered in the early 20th century. Today, it's prized for its rich texture and the way it catches and plays with light from multiple angles.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl">Repoussé and Chasing</CardTitle>
                <CardDescription>Three-dimensional metal forming</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Repoussé involves hammering metal from the reverse side to create a raised design, while chasing refers to indenting the metal from the front to add details and definition. Together, these complementary techniques create dramatic three-dimensional relief in metal.
                </p>
                <p>
                  This versatile method has been used to create everything from ancient Greek armor to the Statue of Liberty's copper skin. In jewelry, it creates bold, sculptural pieces with depth and character that cannot be achieved through casting alone.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl">Enameling</CardTitle>
                <CardDescription>Fusing glass onto metal</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Enameling involves fusing powdered glass to metal through high-temperature firing. Different techniques include cloisonné (using wire cells to separate colors), champlevé (filling recessed areas with enamel), and plique-à-jour (creating translucent, stained-glass effects).
                </p>
                <p>
                  Indian Meenakari is a celebrated form of enameling, particularly associated with Jaipur. This technique adds vibrant colors to gold jewelry and is often found on the reverse side of traditional pieces, creating a hidden world of beauty known only to the wearer.
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-10">
            <Card>
              <CardHeader>
                <CardTitle className="font-cormorant text-2xl text-center">Comparing Traditional and Modern Jewelry Making</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold">Aspect</th>
                        <th className="text-left py-3 px-4 font-semibold">Traditional Craftsmanship</th>
                        <th className="text-left py-3 px-4 font-semibold">Modern Technology</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border">
                        <td className="py-3 px-4 font-medium">Design Development</td>
                        <td className="py-3 px-4">Hand sketches and wax carving</td>
                        <td className="py-3 px-4">Computer-aided design (CAD) and 3D modeling</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-3 px-4 font-medium">Production Method</td>
                        <td className="py-3 px-4">Hand fabrication with files, hammers, and torches</td>
                        <td className="py-3 px-4">3D printing, laser cutting, and automated casting</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-3 px-4 font-medium">Time Investment</td>
                        <td className="py-3 px-4">Days to months for a single piece</td>
                        <td className="py-3 px-4">Hours to days for production</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-3 px-4 font-medium">Reproducibility</td>
                        <td className="py-3 px-4">Each piece slightly unique due to hand work</td>
                        <td className="py-3 px-4">Perfect consistency across multiple pieces</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-3 px-4 font-medium">Signature Qualities</td>
                        <td className="py-3 px-4">Tool marks, subtle asymmetry, artist's touch</td>
                        <td className="py-3 px-4">Precision, complex geometry, perfect symmetry</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-medium">Best For</td>
                        <td className="py-3 px-4">One-of-a-kind pieces, cultural techniques, artistic expression</td>
                        <td className="py-3 px-4">Complex designs, precision settings, consistency</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="mt-6 text-center text-muted-foreground">
                  The finest contemporary jewelry often combines both traditional handcrafting and modern technology, 
                  taking advantage of the precision of machines while preserving the soul and character of hand finishing.
                </p>
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