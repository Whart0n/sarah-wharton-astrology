import { NextResponse } from "next/server"
import { sendEmail, getContactFormNotificationEmail } from "@/lib/sendgrid"

export async function POST(request: Request) {
  try {
    const { name, email, message } = await request.json()

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      )
    }

    // Send email notification
    const emailSent = await sendEmail(
      getContactFormNotificationEmail({
        name,
        email,
        message,
      })
    )

    if (!emailSent) {
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error sending contact form:", error)
    return NextResponse.json(
      { error: "Failed to process contact form" },
      { status: 500 }
    )
  }
}
