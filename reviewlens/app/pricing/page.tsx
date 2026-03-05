import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PRICING_PLANS } from "@/types";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { BarChart3, Check } from "lucide-react";
import Link from "next/link";

export default async function PricingPage() {
  const { userId } = await auth();

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">ReviewLens</span>
          </Link>
          <div className="flex items-center gap-4">
            {userId ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
                <UserButton />
              </>
            ) : (
              <>
                <Link href="/sign-in">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/sign-up">
                  <Button>Start Free Trial</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start with a 14-day free trial of Pro. No credit card required.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {PRICING_PLANS.map((plan) => (
            <Card
              key={plan.slug}
              className={`p-6 ${
                plan.highlighted
                  ? "border-primary shadow-lg scale-105"
                  : "border-border"
              }`}
            >
              {plan.highlighted && (
                <div className="bg-primary text-primary-foreground text-sm font-semibold px-3 py-1 rounded-full inline-block mb-4">
                  Most Popular
                </div>
              )}
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold">${plan.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                {plan.description}
              </p>

              <Link href="/sign-up">
                <Button
                  className="w-full mb-6"
                  variant={plan.highlighted ? "default" : "outline"}
                >
                  {plan.slug === "free" ? "Get Started" : "Start Free Trial"}
                </Button>
              </Link>

              <div className="space-y-3">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-4">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto space-y-6 text-left">
            {[
              {
                q: "Can I switch plans anytime?",
                a: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately and we'll prorate any charges.",
              },
              {
                q: "What happens after my trial ends?",
                a: "After your 14-day Pro trial ends, you'll be automatically moved to the Free plan. You can upgrade anytime to continue using Pro features.",
              },
              {
                q: "Do you offer refunds?",
                a: "Yes, we offer a 30-day money-back guarantee. If you're not satisfied, contact us for a full refund.",
              },
              {
                q: "Can I cancel anytime?",
                a: "Absolutely. You can cancel your subscription at any time from your account settings. No questions asked.",
              },
            ].map((faq, i) => (
              <div key={i} className="border-b pb-4">
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 text-center bg-muted/30 rounded-lg p-12">
          <h2 className="text-3xl font-bold mb-4">Need a Custom Plan?</h2>
          <p className="text-xl text-muted-foreground mb-6 max-w-2xl mx-auto">
            For large teams or specific requirements, we offer custom Enterprise
            plans with dedicated support.
          </p>
          <Button size="lg">Contact Sales</Button>
        </div>
      </div>

      <footer className="border-t py-12 mt-16">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2026 ReviewLens. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
