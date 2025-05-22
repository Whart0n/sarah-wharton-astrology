import sgMail from '@sendgrid/mail';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn('SENDGRID_API_KEY is not set. Email functionality will be disabled.');
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string; // Optional plain text version
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: EmailOptions): Promise<void> {
  if (!process.env.SENDGRID_API_KEY) {
    console.error('SendGrid API Key not configured. Cannot send email.');
    // In a real app, you might throw an error or handle this more gracefully
    // For now, we'll log and prevent sending if not configured.
    return;
  }

  const fromEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  if (!fromEmail) {
    console.error('Sender email (NEXT_PUBLIC_ADMIN_EMAIL) not configured. Cannot send email.');
    return;
  }

  const msg = {
    to,
    from: fromEmail, // Use your verified sender email
    subject,
    html,
    text: text || html.replace(/<[^>]*>?/gm, ''), // Basic text version from HTML if not provided
  };

  try {
    await sgMail.send(msg);
    console.log(`Email sent successfully to ${to} with subject: ${subject}`);
  } catch (error) {
    console.error('Error sending email:', error);
    if ((error as any).response) {
      console.error((error as any).response.body);
    }
    // Optionally, rethrow the error or handle it as needed
    // throw error;
  }
}

// Example confirmation email content function
export function getBookingConfirmationEmailContent(booking: {
  client_name: string;
  service_name: string;
  start_time: string; // Assuming ISO string or a parsable date string
  // Add other relevant booking details here
}) {
  const formattedDate = new Date(booking.start_time).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const formattedTime = new Date(booking.start_time).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true
  });

  const subject = `Your Astrology Reading with Sarah Wharton is Confirmed!`;
  const html = `
    <p>Dear ${booking.client_name},</p>
    <p>This email confirms your booking for an <strong>${booking.service_name}</strong> with Sarah Wharton.</p>
    <p><strong>Date:</strong> ${formattedDate}</p>
    <p><strong>Time:</strong> ${formattedTime}</p>
    <p>You will receive a separate email with the video call link and any preparation details shortly before your session.</p>
    <p>If you have any questions or need to reschedule (please note the 24-hour cancellation policy), reply to this email or contact Sarah directly.</p>
    <p>Warmly,<br>Sarah Wharton Astrology</p>
  `;
  return { subject, html };
}
