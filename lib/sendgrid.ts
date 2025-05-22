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
    // Log the email being sent for debugging
    console.log('Sending email to:', params.to);
    console.log('Email subject:', params.subject);
    
    // Prepare the email data with required fields
    // Define default content to ensure we always have valid values
    const defaultText = 'Please view this email in an HTML-compatible email client.';
    const defaultHtml = '<p>Please view this email in an HTML-compatible email client.</p>';
    
    // Ensure text and html are never empty or undefined
    const safeText = (params.text && params.text.trim() !== '') ? params.text : defaultText;
    const safeHtml = (params.html && params.html.trim() !== '') ? params.html : defaultHtml;
    
    const emailData: any = {
      to: params.to,
      from: process.env.EMAIL_FROM || 'no-reply@sarahwharton.com',
      subject: params.subject || 'Notification from Sarah Wharton Astrology',
      // Always include content, even with templates
      text: safeText,
      html: safeHtml,
    };
    
    // If using a template, add template ID and dynamic data
    if (params.templateId) {
      console.log('Using template ID:', params.templateId);
      emailData.templateId = params.templateId;
      
      if (params.dynamicTemplateData) {
        console.log('With dynamic template data:', JSON.stringify(params.dynamicTemplateData));
        emailData.dynamicTemplateData = params.dynamicTemplateData;
      }
      
      // Double-check content is present - SendGrid requires this even with templates
      console.log('Email content lengths with template:', {
        textLength: emailData.text?.length || 0,
        htmlLength: emailData.html?.length || 0
      });
    } else {
      // Fallback to text/html content if no template
      // Ensure text and html are valid non-empty strings
      const text = params.text && typeof params.text === 'string' && params.text.trim().length > 0 
        ? params.text 
        : 'No text content provided';
        
      const html = params.html && typeof params.html === 'string' && params.html.trim().length > 0 
        ? params.html 
        : '<p>No HTML content provided</p>';
      
      emailData.text = text;
      emailData.html = html;
      console.log('Using inline content. Text length:', text.length, 'HTML length:', html.length);
    }
    
    await mailService.send(emailData);
    console.log('Email sent successfully');
    return true;
  } catch (error: any) {
    console.error('SendGrid email error:', error);
    if (error?.response?.body?.errors) {
      console.error('SendGrid error details:', JSON.stringify(error.response.body.errors, null, 2));
    }
    return false;
  }
}

// Template for booking confirmation to client
export function getClientBookingConfirmationEmail(booking: {
  client_name: string;
  client_email: string;
  service_name: string;
  start_time: Date;
  end_time: Date;
  zoom_link?: string; // Add Zoom link as optional parameter
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

  // Use SendGrid dynamic template - prioritize SENDGRID_CLIENT_BOOKING_TEMPLATE_ID
  const BOOKING_TEMPLATE_ID = process.env.SENDGRID_CLIENT_BOOKING_TEMPLATE_ID || process.env.SENDGRID_BOOKING_TEMPLATE_ID;
  
  console.log(`[SendGrid] Client booking template ID: ${BOOKING_TEMPLATE_ID || 'NOT SET'}`);
  
  if (BOOKING_TEMPLATE_ID) {
    // Prepare the dynamic template data
    const dynamicData = {
      client_name: booking.client_name,
      service_name: booking.service_name,
      date: formattedDate,
      start_time: formattedStartTime,
      end_time: formattedEndTime,
      zoom_link: booking.zoom_link || '',
      has_zoom_link: !!booking.zoom_link,
    };
    
    console.log(`[SendGrid] Using template ID: ${BOOKING_TEMPLATE_ID} with dynamic data:`, dynamicData);
    
    // Use the dynamic template
    return {
      to: booking.client_email,
      subject: 'Your Astrology Reading Confirmation',
      templateId: BOOKING_TEMPLATE_ID,
      dynamicTemplateData: dynamicData,
      // Always include minimal content to satisfy SendGrid API requirements
      text: `Your booking for ${booking.service_name} has been confirmed for ${formattedDate} at ${formattedStartTime}.`,
      html: `<p>Your booking for ${booking.service_name} has been confirmed for ${formattedDate} at ${formattedStartTime}.</p>`,
    };
  } else {
    // Fallback to inline content if no template ID is set
    console.warn('SENDGRID_BOOKING_TEMPLATE_ID not set, using inline email content');
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

// Template for booking notification to astrologer
export function getAstrologerBookingNotificationEmail(booking: {
  client_name: string;
  client_email: string;
  service_name: string;
  start_time: Date;
  end_time: Date;
  zoom_link?: string; // Add Zoom link as optional parameter
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

  // Use SendGrid dynamic template
  const BOOKING_TEMPLATE_ID = process.env.SENDGRID_BOOKING_TEMPLATE_ID || process.env.SENDGRID_CLIENT_BOOKING_TEMPLATE_ID;
  
  if (BOOKING_TEMPLATE_ID) {
    // Use the dynamic template
    return {
      to: process.env.EMAIL_FROM || 'sarah@sarahwharton.com',
      subject: 'New Booking Notification',
      templateId: BOOKING_TEMPLATE_ID,
      dynamicTemplateData: {
        client_name: booking.client_name,
        client_email: booking.client_email,
        service_name: booking.service_name,
        date: formattedDate,
        start_time: formattedStartTime,
        end_time: formattedEndTime,
        zoom_link: booking.zoom_link || '',
        has_zoom_link: !!booking.zoom_link,
      },
    };
  } else {
    // Fallback to inline content if no template ID is set
    console.warn('SENDGRID_BOOKING_TEMPLATE_ID not set, using inline email content');
    return {
      to: process.env.EMAIL_FROM || 'sarah@sarahwharton.com',
      subject: 'New Booking Notification',
      text: `New booking from ${booking.client_name} (${booking.client_email}) for ${booking.service_name} on ${formattedDate} at ${formattedStartTime}.`,
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
            ${booking.zoom_link ? `<p><strong>Zoom Link:</strong> <a href="${booking.zoom_link}">${booking.zoom_link}</a></p>` : ''}
          </div>
          <p>This appointment has been added to your calendar.</p>
        </div>
      `,
    };
  }
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
