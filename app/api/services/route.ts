import { NextResponse } from "next/server"
import { supabase, supabaseAdmin } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const count = searchParams.get("count") === "true"

    // If we just need the count
    if (count) {
      const { data, error } = await supabase
        .from("services")
        .select("id", { count: "exact" })
      
      if (error) {
        throw error
      }
      
      return NextResponse.json({ count: data.length })
    }

    // If requesting a specific service
    if (id) {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("id", id)
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }

      return NextResponse.json(data)
    }

    // Otherwise return all services
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("active", true)
      .order("price_cents", { ascending: true })

    if (error) {
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching services:", error)
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { name, description, duration_minutes, price_cents } = await request.json()

    // Validate required fields
    if (!name || !description || !duration_minutes || !price_cents) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Create service
    const { data, error } = await supabase
      .from("services")
      .insert([
        {
          name,
          description,
          duration_minutes,
          price_cents,
        },
      ])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error creating service:", error)
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Service ID is required" },
        { status: 400 }
      )
    }

    const { name, description, duration_minutes, price_cents } = await request.json()

    // Validate required fields
    if (!name || !description || !duration_minutes || !price_cents) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Update service
    const { data, error } = await supabase
      .from("services")
      .update({
        name,
        description,
        duration_minutes,
        price_cents,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error updating service:", error)
    return NextResponse.json(
      { error: "Failed to update service" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Service ID is required" },
        { status: 400 }
      )
    }

    // Check if service has associated bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("id")
      .eq("service_id", id)
      .limit(1)

    if (bookingsError) {
      return NextResponse.json({ error: bookingsError.message }, { status: 500 })
    }

    // Don't allow deletion if there are associated bookings
    if (bookings.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete a service with existing bookings" },
        { status: 400 }
      )
    }

    // Delete service
    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting service:", error)
    return NextResponse.json(
      { error: "Failed to delete service" },
      { status: 500 }
    )
  }
}
