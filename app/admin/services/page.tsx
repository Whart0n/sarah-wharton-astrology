"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatPrice, formatDuration } from "@/lib/utils"

interface Service {
  id: string
  name: string
  description: string
  duration_minutes: number
  price_cents: number
  created_at: string
}

export default function ServicesPage() {
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; serviceId: string | null }>({
    open: false,
    serviceId: null,
  })
  // State for Stripe import dialog and results
  const [importDialog, setImportDialog] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)

  // Fetch services
  useEffect(() => {
    async function loadServices() {
      try {
        const response = await fetch("/api/services")
        if (!response.ok) {
          throw new Error("Failed to fetch services")
        }
        const data = await response.json()
        setServices(data)
      } catch (err) {
        console.error("Error fetching services:", err)
        setError(err instanceof Error ? err.message : "Failed to load services")
      } finally {
        setIsLoading(false)
      }
    }

    loadServices()
  }, [])

  // Delete service
  const handleDeleteService = async (id: string) => {
    try {
      const response = await fetch(`/api/services?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete service")
      }

      // Remove the service from state
      setServices(prevServices => prevServices.filter(service => service.id !== id))
      
      // Close dialog
      setDeleteDialog({ open: false, serviceId: null })
    } catch (err) {
      console.error("Error deleting service:", err)
      setError(err instanceof Error ? err.message : "Failed to delete service")
    }
  }

  if (isLoading) {
    return <div className="py-8 text-center">Loading services...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif text-deepBlue mb-2">Services</h1>
          <p className="text-muted-foreground">Manage your astrology services</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              setImportDialog(true)
              setImportLoading(true)
              setImportResult(null)
              try {
                const res = await fetch("/api/import-stripe-products", { method: "POST" })
                const data = await res.json()
                setImportResult(data)
                // Optionally reload services
                if (res.ok) {
                  const response = await fetch("/api/services")
                  if (response.ok) {
                    setServices(await response.json())
                  }
                }
              } catch (e: any) {
                setImportResult({ error: e?.message || "Unknown error" })
              } finally {
                setImportLoading(false)
              }
            }}
            disabled={importLoading}
          >
            {importLoading ? "Importing..." : "Import Stripe Products"}
          </Button>
          <Button asChild variant="secondary">
            <Link href="/admin/services/new">Add New Service</Link>
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-md">
          {error}
        </div>
      )}

      {services.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">No services found. Create your first service to get started.</p>
            <Button asChild variant="default">
              <Link href="/admin/services/new">Create Service</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card key={service.id} className="overflow-hidden">
              <CardHeader className="bg-deepBlue-light/10 pb-3">
                <CardTitle className="text-xl text-deepBlue">{service.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-muted-foreground">{formatDuration(service.duration_minutes)}</span>
                  <span className="font-medium text-deepBlue">{formatPrice(service.price_cents)}</span>
                </div>
                <p className="text-muted-foreground text-sm line-clamp-3 mb-6">
                  {service.description}
                </p>
                <div className="flex space-x-2 mt-4">
                  <Button 
                    asChild
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                  >
                    <Link href={`/admin/services/edit-service?id=${service.id}`}>
                      Edit
                    </Link>
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    className="flex-1"
                    onClick={() => setDeleteDialog({ open: true, serviceId: service.id })}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Service</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this service? This action cannot be undone and will remove the service from your offerings.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, serviceId: null })}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteDialog.serviceId && handleDeleteService(deleteDialog.serviceId)}
            >
              Delete Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Import Stripe Products Dialog */}
      <Dialog open={importDialog} onOpenChange={setImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Stripe Products</DialogTitle>
            <DialogDescription>
              This will import or update all active Stripe products as services.
            </DialogDescription>
          </DialogHeader>
          {importLoading ? (
            <div className="py-8 text-center">Importing from Stripe...</div>
          ) : importResult ? (
            <div className="space-y-2">
              {importResult.error && (
                <div className="text-red-500">Error: {importResult.error}</div>
              )}
              {importResult.imported !== undefined && (
                <div className="text-green-700">Imported: {importResult.imported}</div>
              )}
              {importResult.updated !== undefined && (
                <div className="text-blue-700">Updated: {importResult.updated}</div>
              )}
              {importResult.skipped !== undefined && (
                <div className="text-gray-600">Skipped: {importResult.skipped}</div>
              )}
              {Array.isArray(importResult.results) && importResult.results.length > 0 && (
                <div className="max-h-40 overflow-y-auto border p-2 bg-gray-50 rounded text-xs">
                  <ul>
                    {importResult.results.map((r: any, i: number) => (
                      <li key={i}>
                        {r.name}: {r.status || r.reason || ""}
                        {r.error && <span className="text-red-500"> ({r.error})</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
