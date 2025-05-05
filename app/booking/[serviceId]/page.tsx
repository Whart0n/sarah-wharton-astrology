import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { getServiceById } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { BookingForm } from "@/components/booking-form"

import { PageProps } from 'next/types'

interface BookingServicePageProps extends PageProps {
  params: {
    serviceId: string
  }
}

export async function generateMetadata({ params }: BookingServicePageProps): Promise<Metadata> {
  try {
    const service = await getServiceById(params.serviceId)
    return {
      title: `Book ${service.name} | Sarah Wharton Astrology`,
      description: `Schedule your ${service.name} astrology reading and discover insights to guide your path forward.`,
    }
  } catch (error) {
    return {
      title: "Book a Reading | Sarah Wharton Astrology",
      description: "Schedule your personal astrology reading.",
    }
  }
}

export default async function BookingServicePage({ params }: BookingServicePageProps) {
  // Fetch the service
  let service
  try {
    service = await getServiceById(params.serviceId)
  } catch (error) {
    console.error("Error fetching service:", error)
    notFound()
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-deepBlue text-white py-12 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-serif mb-4 gold-gradient-text">
            Book Your {service.name}
          </h1>
          <p className="text-lg max-w-3xl mx-auto text-white/80">
            Complete the form below to schedule your reading
          </p>
        </div>
      </section>

      {/* Booking Form */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <Link href="/booking" className="text-deepBlue hover:text-deepBlue-light flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Services
              </Link>
            </div>

            <BookingForm service={service} />

            <div className="mt-12 bg-muted/30 p-6 rounded-lg">
              <h3 className="text-lg font-medium mb-4">Important Information</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-deepBlue flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Readings are conducted via video call. You'll receive connection details after booking.</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-deepBlue flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Please be prepared with your birth details: date, exact time, and location of birth.</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-deepBlue flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Cancellations with less than 24 hours notice are non-refundable.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Questions Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-serif text-deepBlue mb-4">Have Questions?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
            If you have any questions about the booking process or what to expect from your reading, please don't hesitate to reach out.
          </p>
          <Button asChild variant="outline">
            <Link href="/contact">Contact Me</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
