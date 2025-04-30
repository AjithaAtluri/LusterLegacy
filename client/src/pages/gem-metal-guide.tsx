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
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="gemstones" className="text-lg py-3">Gemstones</TabsTrigger>
          <TabsTrigger value="metals" className="text-lg py-3">Precious Metals</TabsTrigger>
          <TabsTrigger value="craftsmanship" className="text-lg py-3">Craftsmanship</TabsTrigger>
        </TabsList>

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