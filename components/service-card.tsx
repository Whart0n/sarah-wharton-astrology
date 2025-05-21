import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatPrice, formatDuration } from "@/lib/utils"

interface ServiceCardProps {
  id: string
  name: string
  description: string
  duration_minutes: number
  price_cents: number
  detailsLink?: boolean
  className?: string
}

export function ServiceCard({
  id,
  name,
  description,
  duration_minutes,
  price_cents,
  detailsLink = true,
  className = ""
}: ServiceCardProps) {
  return (
    <Card className={`h-full flex flex-col transition-all hover:shadow-md ${className}`}>
      <CardHeader>
        <CardTitle className="font-serif text-rose-quartz-400">{name}</CardTitle>
        <CardDescription className="flex items-center justify-between">
          <span>{formatDuration(duration_minutes)}</span>
          <span className="font-medium text-muted-foreground">{formatPrice(price_cents)}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-muted-foreground">
          {description.length > 150 
            ? `${description.substring(0, 150)}...` 
            : description}
        </p>
      </CardContent>
      <CardFooter className="flex gap-2 pt-2">
        <Button asChild variant="desert" className="w-full">
          <Link href={`/booking/${id}`}>Book Now</Link>
        </Button>
        {detailsLink && (
          <Button asChild variant="outline" className="w-full">
            <Link href={`/services#${id}`}>Details</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
