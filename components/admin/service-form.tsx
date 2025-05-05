"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

// Define the form schema
const serviceFormSchema = z.object({
  name: z.string().min(3, {
    message: "Service name must be at least 3 characters.",
  }),
  description: z.string().min(20, {
    message: "Description must be at least 20 characters.",
  }),
  duration_minutes: z.coerce.number().int().min(15, {
    message: "Duration must be at least 15 minutes.",
  }),
  price_cents: z.coerce.number().int().min(1000, {
    message: "Price must be at least $10.00.",
  }),
})

type ServiceFormValues = z.infer<typeof serviceFormSchema>

interface ServiceFormProps {
  service?: {
    id: string
    name: string
    description: string
    duration_minutes: number
    price_cents: number
  }
}

export function ServiceForm({ service }: ServiceFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Format price from cents to dollars for the form input
  const dollarPrice = service ? (service.price_cents / 100).toFixed(2) : undefined

  // Create form with default values
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: service?.name || "",
      description: service?.description || "",
      duration_minutes: service?.duration_minutes || 60,
      // Convert cents to dollars for the form
      price_cents: service ? service.price_cents : 10000,
    },
  })

  // Handle form submission
  async function onSubmit(values: ServiceFormValues) {
    setIsSubmitting(true)
    setError(null)

    try {
      // Convert dollar input to cents for the API
      const priceInCents = Math.round(values.price_cents)

      const serviceData = {
        name: values.name,
        description: values.description,
        duration_minutes: values.duration_minutes,
        price_cents: priceInCents,
      }

      const url = service 
        ? `/api/services?id=${service.id}` 
        : "/api/services"
      
      const method = service ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(serviceData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to save service")
      }

      // Refresh data and redirect back to services list
      router.refresh()
      router.push("/admin/services")
    } catch (err) {
      console.error("Error saving service:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Name</FormLabel>
              <FormControl>
                <Input placeholder="Birth Chart Reading" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Description of the service and what clients can expect..." 
                  rows={5} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="duration_minutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (minutes)</FormLabel>
                <FormControl>
                  <Input type="number" min={15} step={15} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="price_cents"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price ($)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min={10} 
                    step={0.01} 
                    onChange={(e) => {
                      const dollarValue = parseFloat(e.target.value);
                      const centValue = Math.round(dollarValue * 100);
                      field.onChange(centValue);
                    }}
                    value={(field.value / 100).toFixed(2)} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {error && (
          <div className="text-red-500 text-sm">
            {error}
          </div>
        )}
        
        <div className="flex space-x-2">
          <Button type="submit" variant="gold" disabled={isSubmitting}>
            {isSubmitting 
              ? "Saving..." 
              : service 
                ? "Update Service" 
                : "Create Service"
            }
          </Button>
          <Button 
            type="button" 
            variant="outline"
            onClick={() => router.push("/admin/services")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
