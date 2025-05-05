import Link from "next/link"
import { Metadata } from "next"
import { MDXRemote } from "next-mdx-remote/rsc"
import fs from "fs"
import path from "path"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ServiceCard } from "@/components/service-card"
import { getServices } from "@/lib/supabase"

export const metadata: Metadata = {
  title: "Cosmic Insight | Professional Astrology Readings",
  description: "Discover your cosmic blueprint with professional astrology readings tailored to illuminate your path forward.",
}

export default async function HomePage() {
  // Load content from MDX file
  const mdxContent = await fs.promises.readFile(
    path.join(process.cwd(), "content/home.mdx"),
    "utf-8"
  )

  // Fetch featured services (limit to 3)
  let services = []
  try {
    services = await getServices()
    services = services.slice(0, 3) // Get top 3 services
  } catch (error) {
    console.error("Error fetching services:", error)
    services = []
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section text-white">
        <div className="container mx-auto px-4 py-20 md:py-32 flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-6xl font-serif mb-6 gold-gradient-text">
            Illuminate Your Cosmic Journey
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mb-10 text-white/80">
            Discover the wisdom of the stars and unlock your true potential with professional astrology readings
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg" variant="gold">
              <Link href="/booking">Book a Reading</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-white border-white/30 hover:bg-white/10">
              <Link href="/services">Explore Services</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* MDX Content Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="prose prose-slate max-w-none md:prose-lg">
            <MDXRemote source={mdxContent} />
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif text-deepBlue mb-4">Featured Services</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover the perfect astrological reading to guide you on your journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.length > 0 ? (
              services.map((service) => (
                <ServiceCard
                  key={service.id}
                  id={service.id}
                  name={service.name}
                  description={service.description}
                  duration_minutes={service.duration_minutes}
                  price_cents={service.price_cents}
                />
              ))
            ) : (
              <div className="col-span-3 text-center py-8">
                <p className="text-muted-foreground">Services are currently being updated. Please check back soon.</p>
              </div>
            )}
          </div>

          <div className="text-center mt-12">
            <Button asChild variant="outline">
              <Link href="/services">View All Services</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif text-deepBlue mb-4">Client Testimonials</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Hear what others have discovered through their readings
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="card-hover-effect">
              <CardHeader>
                <CardTitle className="text-lg">Transformative Experience</CardTitle>
                <CardDescription>Jessica M.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  "My birth chart reading was truly eye-opening. It helped me understand patterns in my life that I've been struggling with for years. The insights were spot-on and the guidance provided was practical and empowering."
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover-effect">
              <CardHeader>
                <CardTitle className="text-lg">Remarkably Accurate</CardTitle>
                <CardDescription>Michael T.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  "I was skeptical at first, but the solar return reading was remarkably accurate. It predicted major themes that unfolded throughout my year and gave me the tools to navigate challenges with confidence. I'm now a regular client."
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover-effect">
              <CardHeader>
                <CardTitle className="text-lg">Career Clarity</CardTitle>
                <CardDescription>Sarah L.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  "The career astrology consultation came at the perfect time. I was at a crossroads professionally, and the reading provided clarity on which path aligned best with my cosmic blueprint. Six months later, I'm thriving in my new direction."
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-deepBlue text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-serif mb-6 gold-gradient-text">
            Begin Your Cosmic Journey Today
          </h2>
          <p className="text-lg max-w-2xl mx-auto mb-10 text-white/80">
            Unlock the wisdom of the stars and discover insights that will illuminate your path forward
          </p>
          <Button asChild size="lg" variant="gold">
            <Link href="/booking">Book Your Reading</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
