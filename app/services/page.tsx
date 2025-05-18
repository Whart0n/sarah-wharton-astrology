import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { formatPrice, formatDuration } from "@/lib/utils"
import { getServices } from "@/lib/supabase"

export const metadata: Metadata = {
  title: "Services | Sarah Wharton Astrology",
  description: "Explore my range of astrology services including natal chart readings, relationship compatibility, and career guidance.",
}

export default async function ServicesPage() {
  // Fetch all services
  let services = []
  try {
    services = await getServices()
  } catch (error) {
    console.error("Error fetching services:", error)
    services = []
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-deepBlue text-white py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif mb-6 gold-gradient-text">
            Astrology Services
          </h1>
          <p className="text-lg md:text-xl max-w-3xl mx-auto text-white/80">
            Discover the perfect reading to illuminate your path and provide cosmic guidance
          </p>
        </div>
      </section>

      {/* Services List */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          {services.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-2xl font-serif text-deepBlue mb-4">Services Coming Soon</h2>
              <p className="text-muted-foreground mb-8">
                I'm currently updating my service offerings. Please check back soon or contact me for more information.
              </p>
              <Button asChild variant="deepBlue">
                <Link href="/contact">Contact Me</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-16">
              {services.map((service) => (
                <div key={service.id} id={service.id} className="scroll-mt-24">
                  <Card className="overflow-hidden">
                    <CardHeader className="bg-deepBlue-light/10">
                      <CardTitle className="text-2xl font-serif text-deepBlue">{service.name}</CardTitle>
                      <CardDescription className="flex justify-between items-center">
                        <span className="text-base">{formatDuration(service.duration_minutes)}</span>
                        <span className="text-lg font-medium text-deepBlue">{formatPrice(service.price_cents)}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="prose prose-slate max-w-none">
                        <p>{service.description}</p>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-muted/30 py-4 px-6">
                      <Button asChild variant="gold">
                        <Link href={`/booking/${service.id}`}>Book Now</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif text-deepBlue mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Common questions about astrology readings and what to expect
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What information do I need to provide for a reading?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  For most readings, you'll need to provide your date of birth, exact time of birth, and location of birth. This information allows me to calculate your unique birth chart with precision.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What if I don't know my exact birth time?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  While a precise birth time offers the most accurate reading, we can still work with approximate times or unknown birth times. Some techniques, like rectification, can help narrow down your birth time, or we can focus on aspects of your chart that don't rely on the exact time.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How are readings conducted?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Readings are conducted via video call (Zoom), and you'll receive a recording afterward for reference. Each session includes time for questions and discussion to ensure you get the most from your reading.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How should I prepare for my reading?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Consider what questions or areas of life you'd like to focus on. Coming prepared with specific questions can help us make the most of our time together. However, it's also perfectly fine to come with an open mind and no specific agenda.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-deepBlue text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-serif mb-6 gold-gradient-text">
            Ready to Begin Your Cosmic Journey?
          </h2>
          <p className="text-lg max-w-2xl mx-auto mb-8 text-white/80">
            Book your reading today and discover what the stars have in store for you
          </p>
          <Button asChild size="lg" variant="gold">
            <Link href="/booking">Book a Reading</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
