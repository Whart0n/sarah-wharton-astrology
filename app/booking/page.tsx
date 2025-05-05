import { Metadata } from "next"
import Link from "next/link"
import { getServices } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ServiceCard } from "@/components/service-card"

export const metadata: Metadata = {
  title: "Book a Reading | Sarah Wharton Astrology",
  description: "Schedule your personal astrology reading and discover insights to guide your path forward.",
}

export default async function BookingPage() {
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
      <section className="bg-deepBlue text-white py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif mb-6 gold-gradient-text">
            Book Your Reading
          </h1>
          <p className="text-lg md:text-xl max-w-3xl mx-auto text-white/80">
            Select a service below to begin your journey of cosmic discovery
          </p>
        </div>
      </section>

      {/* Services Selection */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="mb-10">
            <h2 className="text-2xl font-serif text-deepBlue mb-2">Choose a Service</h2>
            <p className="text-muted-foreground">
              Browse my services and select the one that resonates with your current needs
            </p>
          </div>

          {services.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground mb-4">
                  No services are currently available for booking. Please check back soon or contact me for more information.
                </p>
                <Link href="/contact" className="text-deepBlue hover:text-deepBlue-light underline">
                  Contact Me
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  id={service.id}
                  name={service.name}
                  description={service.description}
                  duration_minutes={service.duration_minutes}
                  price_cents={service.price_cents}
                  detailsLink={false}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Booking Information */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-serif text-deepBlue mb-2">Booking Information</h2>
              <p className="text-muted-foreground">
                Important details to know before scheduling your reading
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">What to Provide</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    For an accurate reading, please have the following information ready:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>Your full date of birth (month, day, year)</li>
                    <li>Your exact time of birth (as accurate as possible)</li>
                    <li>Your place of birth (city, state/province, country)</li>
                  </ul>
                  <p className="text-muted-foreground">
                    If you don't know your exact birth time, I can still work with what you have, but some aspects of the reading may be less specific.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Booking & Payment Policy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    All readings require full payment at the time of booking to secure your appointment.
                  </p>
                  <p className="text-muted-foreground">
                    Cancellation policy:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>More than 48 hours notice: Full refund</li>
                    <li>24-48 hours notice: 50% refund</li>
                    <li>Less than 24 hours notice: No refund</li>
                  </ul>
                  <p className="text-muted-foreground">
                    If you need to reschedule, please contact me at least 24 hours in advance.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="text-lg">What to Expect</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  After booking, you'll receive:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>A confirmation email with your appointment details</li>
                  <li>A brief intake form to help tailor your reading to your needs</li>
                  <li>Instructions for joining the video call for your reading</li>
                </ul>
                <p className="text-muted-foreground">
                  Readings are conducted via video call. You'll have the opportunity to ask questions and discuss areas of particular interest. A recording of the session will be provided afterward for your reference.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
