import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase'; // Import the pre-configured admin client
import { sendEmail, getBookingConfirmationEmailContent } from '@/lib/email';

// Define a type for the booking data structure we need for the email
interface BookingForEmail {
  id: string;
  client_name: string;
  client_email: string;
  start_time: string;
  status: string; // To check if we need to update status
  service: {
    name: string;
  };
  zoom_link?: string;
}

export async function POST(request: Request) {
  // In a production app, you MUST protect this route to ensure only admins can call it.
  // This could involve checking user roles from Supabase auth, a session secret, etc.

  if (!supabaseAdmin) {
    console.error('Supabase admin client is not initialized. Check SUPABASE_SERVICE_ROLE_KEY.');
    return NextResponse.json({ error: 'Server configuration error: Supabase admin client not available.' }, { status: 500 });
  }
  // Use supabaseAdmin for database operations
  const supabase = supabaseAdmin;

  try {
    const { bookingId } = await request.json();

    if (!bookingId || typeof bookingId !== 'string') {
      return NextResponse.json({ error: 'Booking ID is required and must be a string.' }, { status: 400 });
    }

    // Fetch the booking details
    // Make sure the select query matches the BookingForEmail structure
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select(`
        id,
        client_name,
        client_email,
        start_time,
        status,
        zoom_link,
        service:services (name)
      `)
      .eq('id', bookingId)
      .single(); // Use .single() if bookingId is unique and expected to return one row

    if (fetchError) {
      console.error('Supabase error fetching booking:', fetchError);
      return NextResponse.json({ error: 'Error fetching booking details.', details: fetchError.message }, { status: 500 });
    }
    
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    }

    // Safely extract service name, accommodating if booking.service is an array
    let serviceNameForEmail: string | undefined;
    const serviceData = booking.service as any; // Type as any to inspect structure

    if (Array.isArray(serviceData) && serviceData.length > 0 && serviceData[0] && typeof serviceData[0].name === 'string') {
      serviceNameForEmail = serviceData[0].name;
    } else if (serviceData && typeof serviceData.name === 'string') { // Fallback if it's already an object
      serviceNameForEmail = serviceData.name;
    }

    if (!serviceNameForEmail) {
      console.error('Could not extract service name from booking data:', booking.service);
      
      const errorHtmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Booking Error</h2>
          <p>Hello ${booking.client_name},</p>
          <p>We encountered an issue processing your booking details.</p>
          <p>Please contact us for assistance with your booking.</p>
          <p>Best regards,<br>The Astrology Team</p>
        </div>
      `;

      await sendEmail({
        to: booking.client_email,
        subject: 'Booking Error - Action Required',
        html: errorHtmlContent,
      });
      
      return NextResponse.json({ error: 'Error processing booking service details. Name not found.' }, { status: 500 });
    }

    // Prepare email content
    const startDate = new Date(booking.start_time as string);
    const bookingDate = startDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const bookingTime = startDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Denver',
    });

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Your Booking Confirmation</h2>
        <p>Hello ${booking.client_name},</p>
        <p>Your booking for <strong>${serviceNameForEmail}</strong> has been confirmed.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Date:</strong> ${bookingDate}</p>
          <p><strong>Time:</strong> ${bookingTime} (Mountain Time)</p>
          ${booking.zoom_link ? `
            <p><strong>Zoom Link:</strong> <a href="${booking.zoom_link}">Join Meeting</a></p>
            <p>Meeting ID: ${booking.zoom_link.split('/').pop()}</p>
          ` : '<p>No Zoom link provided. Please contact us for assistance.</p>'}
        </div>

        <p>We look forward to seeing you!</p>
        <p>Best regards,<br>The Astrology Team</p>
      </div>
    `;

    // Send the email
    await sendEmail({
      to: booking.client_email as string,
      subject: `Your ${serviceNameForEmail} Booking Confirmation`,
      html: htmlContent,
    });

    let statusUpdated = false;
    // As a fallback, ensure the booking status is 'confirmed'.
    // The Stripe webhook should primarily handle this upon successful payment.
    // Use booking.status directly instead of typedBooking.status
    if (booking.status !== 'confirmed') {
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', bookingId);

      if (updateError) {
        console.warn('Failed to update booking status to confirmed via admin action (email already sent):', updateError);
        // Do not fail the entire request if only this part fails, as the email was sent.
      } else {
        statusUpdated = true;
        console.log(`Booking ${bookingId} status updated to confirmed via admin email action.`);
      }
    }

    return NextResponse.json({ message: 'Confirmation email sent successfully.', statusUpdated }, { status: 200 });

  } catch (error: any) {
    console.error('Error in send-confirmation-email route:', error);
    // Check if it's a JSON parsing error or other type
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error.', details: error.message || 'Unknown error' }, { status: 500 });
  }
}
