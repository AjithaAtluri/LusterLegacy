import { Layout } from "@/components/layout/layout";
import { PriceCalculatorDisplay } from "@/components/custom-design/price-calculator-display";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PriceCalculatorPage() {
  return (
    <Layout>
      <div className="container py-10">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Luster Legacy Pricing Tool</CardTitle>
              <CardDescription>
                Calculate accurate price estimates using our 2025 market rate pricing model
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                This tool provides real-time price calculations for custom jewelry designs based on
                current market rates. Select different materials and options to see how they affect
                the final price of your jewelry piece.
              </p>
              <p className="text-sm text-muted-foreground">
                Note: Final prices may vary slightly based on specific design requirements,
                craftsmanship complexity, and market fluctuations.
              </p>
            </CardContent>
          </Card>
          
          <PriceCalculatorDisplay />
          
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>How Our Pricing Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <h3 className="font-semibold">Materials</h3>
                  <p className="text-sm">
                    We source premium materials with pricing based on current market rates,
                    including gold, platinum, silver, and a wide range of precious and semi-precious
                    stones.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold">Craftsmanship</h3>
                  <p className="text-sm">
                    Our master artisans bring decades of experience to each piece. Different product
                    types require varying levels of craftsmanship, affecting the final price.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold">Payment Terms</h3>
                  <p className="text-sm">
                    We require a 50% advance payment to begin crafting your jewelry piece, with the
                    remaining balance due before shipping upon completion.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}