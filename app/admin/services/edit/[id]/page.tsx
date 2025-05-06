import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ServiceForm } from "@/components/admin/service-form"
import { getServiceById } from "@/lib/supabase"
import { NextPage } from 'next'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const service = await getServiceById(params.id)
    return {
      title: `Edit ${service.name} | Admin Dashboard`,
      description: `Edit ${service.name} service details.`,
    }
  } catch (error) {
    return {
      title: "Edit Service | Admin Dashboard",
      description: "Edit service details.",
    }
  }
}

const EditServicePage = async ({ params }: { params: { id: string } }) => {
  // Fetch the service
  let service
  try {
    service = await getServiceById(params.id)
  } catch (error) {
    console.error("Error fetching service:", error)
    notFound()
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-serif text-deepBlue mb-2">Edit Service</h1>
        <p className="text-muted-foreground">Update details for {service.name}</p>
      </div>

      <div className="mb-6">
        <Link href="/admin/services" className="text-deepBlue hover:text-deepBlue-light flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Services
        </Link>
      </div>

      <ServiceForm service={service} />
    </div>
  )
}

export default EditServicePage;
