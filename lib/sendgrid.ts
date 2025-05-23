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
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.error('SendGrid API key is not set');
    return false;
  }

  try {
    console.log('[SendGrid] Sending email to:', params.to);
    console.log('[SendGrid] Email subject:', params.subject);

    const defaultText = 'Please view this email in an HTML-compatible email client.';
    const defaultHtml = '<p>Please view this email in an HTML-compatible email client.</p>';

    const safeText = (params.text && params.text.trim() !== '') ? params.text : defaultText;
    const safeHtml = (params.html && params.html.trim() !== '') ? params.html : defaultHtml;

    const emailData: any = {
      to: params.to,
      from: process.env.EMAIL_FROM || 'no-reply@sarahwharton.com',
      subject: params.subject || 'Notification from Sarah Wharton Astrology',
      text: safeText,
      html: safeHtml,
    };

    if (params.templateId) {
      console.log('[SendGrid] Using template ID:', params.templateId);
      emailData.templateId = params.templateId;

      if (params.dynamicTemplateData) {
        console.log('[SendGrid] With dynamic template data:', JSON.stringify(params.dynamicTemplateData, null, 2));
        emailData.dynamic_template_data = params.dynamicTemplateData;
      }

      console.log('[SendGrid] Email content lengths with template:', {
        textLength: emailData.text?.length || 0,
        htmlLength: emailData.html?.length || 0,
      });
    } else {
      const text = params.text && typeof params.text === 'string' && params.text.trim().length > 0
        ? params.text
        : 'No text content provided';

      const html = params.html && typeof params.html === 'string' && params.html.trim().length > 0
        ? params.html
        : '<p>No HTML content provided</p>';

      emailData.text = text;
      emailData.html = html;
      console.log('[SendGrid] Using inline content. Text length:', text.length, 'HTML length:', html.length);
    }

    const response = await mailService.send(emailData);
    console.log('[SendGrid] Email sent successfully. Response:', JSON.stringify(response, null, 2));
    return true;
  } catch (error: any) {
    console.error('[SendGrid] SendGrid email error:', error.message);
    if (error.response) {
      console.error('[SendGrid] SendGrid error response:', JSON.stringify(error.response.body, null, 2));
    }
    return false;
  }
}

export function getClientBookingConfirmationEmail(booking: {
  client_name: string;
  client_email: string;
  service_name: string;
  start_time: Date;
  end_time: Date;
  zoom_link?: string;
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

  // Combine date and time into a single booking_date field to match the template
  const bookingDate = `${formattedDate} from ${formattedStartTime} to ${formattedEndTime}`;

  const BOOKING_TEMPLATE_ID = process.env.SENDGRID_CLIENT_BOOKING_TEMPLATE_ID;

  console.log(`[SendGrid] Client booking template ID: ${BOOKING_TEMPLATE_ID || 'NOT SET'}`);

  if (BOOKING_TEMPLATE_ID) {
    const dynamicData = {
      booking_date: bookingDate, // Matches {{booking_date}} in the template
      zoom_link: booking.zoom_link || '', // Matches {{zoom_link}}
      client_name: booking.client_name, // For potential future use
      service_name: booking.service_name, // For potential future use
    };

    console.log(`[SendGrid] Using template ID: ${BOOKING_TEMPLATE_ID} with dynamic data:`, dynamicData);

    return {
      to: booking.client_email,
      subject: 'Your Astrology Reading Confirmation',
      templateId: BOOKING_TEMPLATE_ID,
      dynamicTemplateData: dynamicData,
      text: `Your booking for ${booking.service_name} has been confirmed for ${formattedDate} at ${formattedStartTime}.`,
      html: `<p>Your booking for ${booking.service_name} has been confirmed for ${formattedDate} at ${formattedStartTime}.</p>`,
    };
  } else {
    console.warn('[SendGrid] SENDGRID_CLIENT_BOOKING_TEMPLATE_ID not set, using inline email content');
    return {
      to: booking.client_email,
      subject: 'Your Astrology Reading Confirmation',
      text: `Thank you for booking an astrology reading with Sarah Wharton. Your appointment for ${booking.service_name} has been confirmed for ${formattedDate} at ${formattedStartTime}.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0a1930;">Booking Confirmation</h2>
          <p>Dear ${booking.client_name},</p>
          <p>Thank you for booking an astrology reading. Your appointment has been confirmed.</p>
          <div style="background-color: #f7f7f7; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Service:</strong> ${booking.service_name}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${formattedStartTime} - ${formattedEndTime}</p>
            ${booking.zoom_link ? `<p><strong>Zoom Link:</strong> <a href="${booking.zoom_link}">${booking.zoom_link}</a></p>` : ''}
          </div>
          <p>Please be prepared 5 minutes before your appointment. If you need to reschedule or cancel, please contact me at least 24 hours in advance.</p>
          <p>Looking forward to your session!</p>
          <p>Warm regards,<br>Sarah Wharton</p>
        </div>
      `,
    };
  }
}

export function getAstrologerBookingNotificationEmail(booking: {
  client_name: string;
  client_email: string;
  service_name: string;
  start_time: Date;
  end_time: Date;
  zoom_link?: string;
  birthplace?: string;
  birthdate?: string;
  birthtime?: string;
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

  const BOOKING_TEMPLATE_ID = process.env.SENDGRID_ADMIN_BOOKING_TEMPLATE_ID;

  console.log(`[SendGrid] Admin booking notification template ID: ${BOOKING_TEMPLATE_ID || 'NOT SET'}`);

  if (BOOKING_TEMPLATE_ID) {
    const dynamicData = {
      client_name: booking.client_name,
      client_email: booking.client_email,
      service_name: booking.service_name,
      booking_date: formattedDate,
      booking_time: `${formattedStartTime} - ${formattedEndTime}`,
      zoom_link: booking.zoom_link || 'No Zoom link provided',
      birthplace: booking.birthplace || 'Not provided',
      birthdate: booking.birthdate || 'Not provided',
      birthtime: booking.birthtime || 'Not provided',
    };

    console.log(`[SendGrid] Using admin template ID: ${BOOKING_TEMPLATE_ID} with dynamic data:`, dynamicData);

    return {
      to: process.env.EMAIL_FROM || 'sarah@sarahwharton.com',
      subject: `New Booking: ${booking.client_name} - ${booking.service_name}`,
      templateId: BOOKING_TEMPLATE_ID,
      dynamicTemplateData: dynamicData,
      text: `New booking received from ${booking.client_name} (${booking.client_email}) for ${booking.service_name} on ${formattedDate} at ${formattedStartTime}.`,
      html: `<p>New booking received from ${booking.client_name} (${booking.client_email}) for ${booking.service_name} on ${formattedDate} at ${formattedStartTime}.</p>`,
    };
  } else {
    console.warn('[SendGrid] SENDGRID_ADMIN_BOOKING_TEMPLATE_ID not set, using inline email content');
    return {
      to: process.env.EMAIL_FROM || 'sarah@sarahwharton.com',
      subject: `New Booking: ${booking.client_name} - ${booking.service_name}`,
      text: `New booking received from ${booking.client_name} (${booking.client_email}) for ${booking.service_name} on ${formattedDate} at ${formattedStartTime}.
      
Client Details:
- Name: ${booking.client_name}
- Email: ${booking.client_email}
- Service: ${booking.service_name}
- Date: ${formattedDate}
- Time: ${formattedStartTime} - ${formattedEndTime}
- Zoom Link: ${booking.zoom_link || 'No Zoom link provided'}
- Birthplace: ${booking.birthplace || 'Not provided'}
- Birthdate: ${booking.birthdate || 'Not provided'}
- Birthtime: ${booking.birthtime || 'Not provided'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0a1930;">New Booking Notification</h2>
          <p>You have received a new booking request:</p>
          <div style="background-color: #f7f7f7; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Client:</strong> ${booking.client_name} (${booking.client_email})</p>
            <p><strong>Service:</strong> ${booking.service_name}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${formattedStartTime} - ${formattedEndTime}</p>
            ${booking.zoom_link ? `<p><strong>Zoom Link:</strong> <a href="${booking.zoom_link}">${booking.zoom_link}</a></p>` : ''}
            <p><strong>Birthplace:</strong> ${booking.birthplace || 'Not provided'}</p>
            <p><strong>Birthdate:</strong> ${booking.birthdate || 'Not provided'}</p>
            <p><strong>Birthtime:</strong> ${booking.birthtime || 'Not provided'}</p>
          </div>
          <p>This booking has been automatically confirmed.</p>
        </div>
      `,
    };
  }
}

export function getContactFormNotificationEmail(contact: {
  name: string;
  email: string;
  message: string;
}): EmailParams {
  return {
    to: process.env.EMAIL_FROM || 'sarah@sarahwharton.com',
    subject: 'New Contact Form Submission',
    text: `New contact form submission from ${contact.name} (${contact.email}): ${contact.message}`,
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