import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY environment variable not set");
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

export interface EmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.error('SendGrid API key is not set');
    return false;
  }

  try {
    await mailService.send({
      to: params.to,
      from: process.env.EMAIL_FROM || 'no-reply@sarahwharton.com',
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

// Template for booking confirmation to client
export function getClientBookingConfirmationEmail(booking: {
  client_name: string;
  service_name: string;
  start_time: Date;
  end_time: Date;
}): EmailParams {
  const startTime = new Date(booking.start_time);
  const formattedDate = startTime.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const formattedStartTime = startTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  
  const formattedEndTime = new Date(booking.end_time).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return {
    to: booking.client_name,
    subject: 'Your Astrology Reading Confirmation',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0a1930;">Booking Confirmation</h2>
        <p>Dear ${booking.client_name},</p>
        <p>Thank you for booking an astrology reading. Your appointment has been confirmed.</p>
        <div style="background-color: #f7f7f7; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Service:</strong> ${booking.service_name}</p>
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p><strong>Time:</strong> ${formattedStartTime} - ${formattedEndTime}</p>
        </div>
        <p>Please be prepared 5 minutes before your appointment. If you need to reschedule or cancel, please contact us at least 24 hours in advance.</p>
        <p>Looking forward to your session!</p>
        <p>Warm regards,<br>Your Astrologer</p>
      </div>
    `,
  };
}

// Template for booking notification to astrologer
export function getAstrologerBookingNotificationEmail(booking: {
  client_name: string;
  client_email: string;
  service_name: string;
  start_time: Date;
  end_time: Date;
}): EmailParams {
  const startTime = new Date(booking.start_time);
  const formattedDate = startTime.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const formattedStartTime = startTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  
  const formattedEndTime = new Date(booking.end_time).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return {
    to: process.env.EMAIL_FROM || 'sarah@sarahwharton.com',
    subject: 'New Booking Notification',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0a1930;">New Booking Alert</h2>
        <p>You have a new booking!</p>
        <div style="background-color: #f7f7f7; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Client:</strong> ${booking.client_name}</p>
          <p><strong>Email:</strong> ${booking.client_email}</p>
          <p><strong>Service:</strong> ${booking.service_name}</p>
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p><strong>Time:</strong> ${formattedStartTime} - ${formattedEndTime}</p>
        </div>
        <p>This appointment has been added to your calendar.</p>
      </div>
    `,
  };
}

// Template for contact form submission
export function getContactFormNotificationEmail(contact: {
  name: string;
  email: string;
  message: string;
}): EmailParams {
  return {
    to: process.env.EMAIL_FROM || 'sarah@sarahwharton.com',
    subject: 'New Contact Form Submission',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0a1930;">New Contact Form Submission</h2>
        <div style="background-color: #f7f7f7; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Name:</strong> ${contact.name}</p>
          <p><strong>Email:</strong> ${contact.email}</p>
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap;">${contact.message}</p>
        </div>
      </div>
    `,
  };
}
