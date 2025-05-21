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
      <section className="relative py-20 md:py-28 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-manrope font-bold text-accent-plum mb-6 tracking-tight">
              Astrology Services
            </h1>
            <p className="text-xl md:text-2xl text-accent-plum/80 mb-8 max-w-3xl mx-auto font-sora">
              Discover the perfect reading to illuminate your path and provide cosmic guidance
            </p>
          </div>
        </div>
      </section>

      {/* Services List */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          {services.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-2xl font-serif text-plum mb-4">Services Coming Soon</h2>
              <p className="text-plum/70 mb-8">
                I'm currently updating my service offerings. Please check back soon or contact me for more information.
              </p>
              <Link href="/contact">
                <button className="btn-elegant">
                  CONTACT ME
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-16">
              {services.map((service) => (
                <div key={service.id} id={service.id} className="scroll-mt-24">
                  <Card className="overflow-hidden bg-white border border-blush/30 shadow-sm">
                    <CardHeader className="bg-blush-light">
                      <CardTitle className="text-2xl font-serif text-plum">{service.name}</CardTitle>
                      <CardDescription className="flex justify-between items-center">
                        <span className="text-base text-plum/70">{formatDuration(service.duration_minutes)}</span>
                        <span className="text-lg font-medium text-plum">{formatPrice(service.price_cents)}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="prose prose-slate max-w-none">
                        <p className="text-plum/70">{service.description}</p>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-white py-4 px-6 border-t border-blush/20">
                      <Link href={`/booking/${service.id}`}>
                        <button className="btn-elegant">
                          BOOK NOW
                        </button>
                      </Link>
                    </CardFooter>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-blush-light">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif text-plum mb-4">Frequently Asked Questions</h2>
            <p className="text-plum/70 max-w-2xl mx-auto">
              Common questions about astrology readings and what to expect
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="bg-white border border-blush/30 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-serif text-plum">What information do I need to provide for a reading?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-plum/70">
                  For most readings, you'll need to provide your date of birth, exact time of birth, and location of birth. This information allows me to calculate your unique birth chart with precision.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-blush/30 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-serif text-plum">What if I don't know my exact birth time?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-plum/70">
                  While a precise birth time offers the most accurate reading, we can still work with approximate times or unknown birth times. Some techniques, like rectification, can help narrow down your birth time, or we can focus on aspects of your chart that don't rely on the exact time.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-blush/30 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-serif text-plum">How are readings conducted?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-plum/70">
                  Readings are conducted via video call (Zoom), and you'll receive a recording afterward for reference. Each session includes time for questions and discussion to ensure you get the most from your reading.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-blush/30 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-serif text-plum">How should I prepare for my reading?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-plum/70">
                  Consider what questions or areas of life you'd like to focus on. Coming prepared with specific questions can help us make the most of our time together. However, it's also perfectly fine to come with an open mind and no specific agenda.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white border-t border-blush/20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-serif mb-6 text-plum">
            Ready to Begin Your Cosmic Journey?
          </h2>
          <p className="text-lg max-w-2xl mx-auto mb-8 text-plum/70">
            Book your reading today and discover what the stars have in store for you
          </p>
          <Link href="/booking">
            <button className="btn-elegant">
              BOOK A READING
            </button>
          </Link>
        </div>
      </section>
    </div>
  )
}
