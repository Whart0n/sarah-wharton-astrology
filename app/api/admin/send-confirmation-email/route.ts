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
      return NextResponse.json({ error: 'Error processing booking service details. Name not found.' }, { status: 500 });
    }

    // Prepare dynamic template data for SendGrid
    const startDate = new Date(booking.start_time as string);
    const booking_date = startDate.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const booking_time = startDate.toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', hour12: true
    });
    const dynamicTemplateData = {
      client_name: booking.client_name as string,
      service_name: serviceNameForEmail,
      booking_date,
      booking_time,
      zoom_link: booking.zoom_link || '',
    };

    // Send the email using SendGrid dynamic template
    await sendEmail({
      to: booking.client_email as string,
      subject: 'Your Booking Confirmation',
      // SendGrid requires non-empty content values, even when using templates
      html: `<p>Your booking for ${serviceNameForEmail} has been confirmed for ${booking_date} at ${booking_time}.</p>`,
      text: `Your booking for ${serviceNameForEmail} has been confirmed for ${booking_date} at ${booking_time}.`,
      templateId: 'd-f63c675b82824b509e553189f71ff82e',
      dynamicTemplateData,
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
