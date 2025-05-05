import { Metadata } from "next"
import Link from "next/link"
import { ServiceForm } from "@/components/admin/service-form"

export const metadata: Metadata = {
  title: "Add New Service | Admin Dashboard",
  description: "Create a new astrology service offering.",
}

export default function NewServicePage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-serif text-deepBlue mb-2">Create New Service</h1>
        <p className="text-muted-foreground">Add a new astrology service to your offerings</p>
      </div>

      <div className="mb-6">
        <Link href="/admin/services" className="text-deepBlue hover:text-deepBlue-light flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Services
        </Link>
      </div>

      <ServiceForm />
    </div>
  )
}
