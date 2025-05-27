import Link from 'next/link';
import { Button } from '@/components/ui/button'; // Assuming Button is needed for consistency
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; // Assuming Card is needed for sections

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header and Footer are handled by the root layout (src/app/layout.tsx) */}

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center py-20 px-4 bg-gradient-to-b from-background to-secondary/30">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
          Flat Design Logos, Effortlessly.
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl">
          Generate unique, professional flat design logos for your business using advanced AI.
          Simple, fast, and tailored to your brand.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/role-select" passHref>
            <Button size="lg" className="text-lg px-8 py-3">
              Get Started
            </Button>
          </Link>
          <Link href="/help" passHref>
            <Button variant="outline" size="lg" className="text-lg px-8 py-3">
              Learn More
            </Button>
          </Link>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-16 px-4 bg-card">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">1. Sign Up & Select Role</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Quickly sign up and choose your role (e.g., Small Business Owner, Freelance Designer).</CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">2. Provide Details</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Enter your business name, description, and optional preferences.</CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">3. Generate & Refine</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Our AI creates logo options. Refine until it's perfect!</CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-4 bg-secondary/30">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-12">What Our Users Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground italic mb-4">"Flatify AI made getting a professional logo so easy! Saved me so much time and money."</p>
                <p className="font-semibold">- Happy Business Owner</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground italic mb-4">"A fantastic tool for designers to quickly generate concepts. The AI refinement is a game-changer."</p>
                <p className="font-semibold">- Creative Freelancer</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
       <section className="py-16 px-4 text-center bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold mb-6">Ready to Create Your Logo?</h2>
          <p className="text-lg mb-8">
            Join thousands of businesses and designers using Flatify AI to bring their brand to life.
          </p>
           <Link href="/role-select" passHref>
            <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
              Start Generating Now
            </Button>
          </Link>
        </div>
      </section>

    </div>
  );
}
