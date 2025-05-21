import Link from "next/link"
import Image from "next/image"
import { Metadata } from "next"
import { MDXRemote } from "next-mdx-remote/rsc"
import fs from "fs"
import path from "path"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ServiceCard } from "@/components/service-card"
import { getServices } from "@/lib/supabase"

export const metadata: Metadata = {
  title: "Sarah Wharton | Professional Astrology Readings",
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
      {/* Full-width Hero Section */}
      <section className="relative h-screen w-full overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image 
            src="/images/sarah-portrait.png" 
            alt="Sarah Wharton, Professional Astrologer"
            fill
            className="object-cover object-center"
            priority
            quality={100}
          />
          <div className="absolute inset-0 bg-black/20"></div>
        </div>
        
        {/* Content Overlay */}
        <div className="relative z-10 h-full flex items-center">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-manrope font-bold text-white mb-6 tracking-tight">
                Sarah Wharton
              </h1>
              <p className="text-xl md:text-2xl text-white/90 mb-8 font-sora">
                Professional Astrology Readings to Illuminate Your Path Forward
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/booking">
                  <Button className="bg-white text-accent-plum hover:bg-white/90 px-8 py-6 text-lg rounded-full font-manrope tracking-wide">
                    Book a Reading
                  </Button>
                </Link>
                <Link href="/services">
                  <Button variant="outline" className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-lg rounded-full font-manrope tracking-wide">
                    View Services
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* MDX Content Section */}
      <section className="py-16 md:py-24 bg-amber-50">
        <div className="container mx-auto px-4">
          <div className="prose prose-slate max-w-5xl mx-auto md:prose-lg">
            <MDXRemote 
              source={mdxContent} 
              components={{
                h1: (props: any) => (
                  <h1 className="text-4xl font-bold text-purple-700 mb-6" {...props} />
                ),
                img: (props: any) => (
                  <div className="float-right ml-8 mb-6 mt-4 w-80 md:w-96">
                    <div className="relative pb-6">
                      <Image 
                        src={props.src} 
                        alt={props.alt} 
                        width={500}
                        height={750}
                        className="rounded-lg shadow-xl w-full h-auto"
                        priority
                      />
                      <div className="absolute -bottom-4 left-0 right-0 h-6 bg-gradient-to-t from-wheat-800 to-transparent"></div>
                    </div>
                  </div>
                )
              }}
            />
          </div>
        </div>
      </section>

      {/* White Section Separator */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-serif text-blue-500 mb-6">Personalized Readings</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto font-sora">
            Each reading is carefully crafted to address your unique questions and cosmic influences
          </p>
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-20 md:py-28 bg-blue-100">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-serif text-purple-700 mb-4">Featured Services</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto font-sora">
              Discover the perfect astrological reading to guide you on your journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {services.length > 0 ? (
              services.map((service) => (
                <ServiceCard
                  key={service.id}
                  id={service.id}
                  name={service.name}
                  description={service.description}
                  duration_minutes={service.duration_minutes}
                  price_cents={service.price_cents}
                  className="bg-amber-50 p-8 border border-amber-200 hover:shadow-md transition rounded-lg"
                />
              ))
            ) : (
              <div className="col-span-3 text-center py-8">
                <p className="text-plum/70">No services found.</p>
              </div>
            )}
          </div>

          <div className="text-center mt-14">
            <Link href="/services">
              <button className="bg-transparent border-2 border-amber-400 text-amber-600 hover:bg-amber-50 font-sora px-8 py-3 rounded-md transition-all transform hover:-translate-y-1">
                VIEW ALL SERVICES
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 md:py-28 bg-white">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-serif text-[#808294] mb-4 font-bold">Client Testimonials</h2>
            <p className="text-xl text-[#808294] max-w-2xl mx-auto font-sora">
              Hear what others have discovered through their readings
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-amber-300 p-8 rounded-lg shadow-lg border-2 border-amber-200 transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div className="mb-4 border-b-2 border-white pb-2">
                <h3 className="text-xl font-serif font-bold text-white">Transformative Experience</h3>
                <p className="text-white font-sora font-medium">Jessica M.</p>
              </div>
              <p className="text-white font-sora leading-relaxed">
                "My birth chart reading was truly eye-opening. It helped me understand patterns in my life that I've been struggling with for years. The insights were spot-on and the guidance provided was practical and empowering."
              </p>
            </div>

            <div className="bg-blue-300 p-8 rounded-lg shadow-lg border-2 border-blue-200 transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div className="mb-4 border-b-2 border-white pb-2">
                <h3 className="text-xl font-serif font-bold text-white">Remarkably Accurate</h3>
                <p className="text-white font-sora font-medium">Michael T.</p>
              </div>
              <p className="text-white font-sora leading-relaxed">
                "I was skeptical at first, but the solar return reading was remarkably accurate. It predicted major themes that unfolded throughout my year and gave me the tools to navigate challenges with confidence. I'm now a regular client."
              </p>
            </div>

            <div className="bg-purple-300 p-8 rounded-lg shadow-lg border-2 border-purple-200 transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div className="mb-4 border-b-2 border-white pb-2">
                <h3 className="text-xl font-serif font-bold text-white">Career Clarity</h3>
                <p className="text-white font-sora font-medium">Sarah L.</p>
              </div>
              <p className="text-white font-sora leading-relaxed">
                "The career astrology consultation came at the perfect time. I was at a crossroads professionally, and the reading provided clarity on which path aligned best with my cosmic blueprint. Six months later, I'm thriving in my new direction."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-white border-t border-amber-200">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-serif text-purple-700 mb-6">
            Begin Your Cosmic Journey Today
          </h2>
          <p className="text-lg max-w-2xl mx-auto mb-10 text-gray-600 font-sora">
            Unlock the wisdom of the stars and discover insights that will illuminate your path forward
          </p>
          <Link href="/booking">
            <button className="bg-blue-400 hover:bg-blue-500 text-white font-sora px-8 py-3 rounded-md transition-all transform hover:-translate-y-1 shadow-md">
              BOOK YOUR READING
            </button>
          </Link>
        </div>
      </section>
    </div>
  )
}
