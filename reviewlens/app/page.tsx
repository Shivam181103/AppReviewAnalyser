import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { BarChart3, Brain, Shield, TrendingUp, Users, Zap } from "lucide-react";
import Link from "next/link";

export default async function Home() {
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
            <Link href="/pricing">
              <Button variant="ghost">Pricing</Button>
            </Link>
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

      <section className="container mx-auto px-4 py-24 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Turn App Store Reviews Into
            <span className="text-primary"> Actionable Insights</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Powerful review intelligence platform powered by AI. Understand user
            sentiment, track competitors, and make data-driven decisions.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/sign-up">
              <Button size="lg" className="text-lg px-8">
                Start for Free — No Credit Card Required
              </Button>
            </Link>
            <Link href="#demo">
              <Button size="lg" variant="outline" className="text-lg px-8">
                See Live Demo
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            14-day Pro trial • Cancel anytime
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Brain,
              title: "AI-Powered Insights",
              description:
                "GPT-4o analyzes sentiment and extracts themes from thousands of reviews automatically",
            },
            {
              icon: TrendingUp,
              title: "Track Trends Over Time",
              description:
                "Monitor rating changes, sentiment shifts, and review volume with beautiful charts",
            },
            {
              icon: Zap,
              title: "Instant Alerts",
              description:
                "Get notified when ratings drop, keywords spike, or sentiment changes",
            },
            {
              icon: Users,
              title: "Competitor Analysis",
              description:
                "Compare your app against competitors and discover opportunities",
            },
            {
              icon: BarChart3,
              title: "Beautiful Reports",
              description:
                "Generate branded PDF reports and shareable links for stakeholders",
            },
            {
              icon: Shield,
              title: "Enterprise Ready",
              description:
                "Team collaboration, API access, and white-label options available",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="border rounded-lg p-6 hover:border-primary transition-colors"
            >
              <feature.icon className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-muted/30 py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Trusted by Teams Worldwide
          </h2>
          <p className="text-xl text-muted-foreground mb-12">
            From indie developers to enterprise teams
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div>
              <div className="text-4xl font-bold text-primary">10K+</div>
              <div className="text-muted-foreground">Apps Tracked</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary">2M+</div>
              <div className="text-muted-foreground">Reviews Analyzed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary">500+</div>
              <div className="text-muted-foreground">Happy Customers</div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-24 text-center">
        <h2 className="text-4xl font-bold mb-12">
          Simple, Transparent Pricing
        </h2>
        <div className="max-w-4xl mx-auto mb-12">
          <Link href="/pricing">
            <Button size="lg" className="text-lg px-8">
              View All Plans
            </Button>
          </Link>
        </div>
      </section>

      <section className="bg-primary text-primary-foreground py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join hundreds of teams using ReviewLens to understand their users
            better
          </p>
          <Link href="/sign-up">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Start Your Free Trial
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t py-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2026 ReviewLens. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
