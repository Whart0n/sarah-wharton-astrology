import axios, { AxiosError } from 'axios';

const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;
const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;
const ZOOM_HOST_EMAIL = process.env.ZOOM_HOST_EMAIL;

// Log environment variable status (without revealing secrets)
console.log('[Zoom] Environment variables status:', {
  hasAccountId: !!ZOOM_ACCOUNT_ID,
  hasClientId: !!ZOOM_CLIENT_ID,
  hasClientSecret: !!ZOOM_CLIENT_SECRET,
  hostEmail: ZOOM_HOST_EMAIL || 'Not set, will use client email as fallback'
});

if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
  const missing = [];
  if (!ZOOM_ACCOUNT_ID) missing.push('ZOOM_ACCOUNT_ID');
  if (!ZOOM_CLIENT_ID) missing.push('ZOOM_CLIENT_ID');
  if (!ZOOM_CLIENT_SECRET) missing.push('ZOOM_CLIENT_SECRET');
  
  const errorMsg = `Missing required Zoom API credentials: ${missing.join(', ')}`;
  console.error('[Zoom] Configuration Error:', errorMsg);
  throw new Error(errorMsg);
}

// 1. Get Zoom access token (Server-to-Server OAuth)
export async function getZoomAccessToken(): Promise<string> {
  try {
    console.log('[Zoom] Requesting access token...');
    const params = new URLSearchParams();
    params.append('grant_type', 'account_credentials');
    params.append('account_id', ZOOM_ACCOUNT_ID!);

    const response = await axios.post(
      'https://zoom.us/oauth/token',
      params,
      {
        headers: {
          Authorization:
            'Basic ' + Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 10000, // 10 second timeout
      }
    );
    
    if (!response.data.access_token) {
      throw new Error('No access token in Zoom API response');
    }
    
    console.log('[Zoom] Successfully obtained access token');
    return response.data.access_token;
  } catch (error) {
    const err = error as Error | AxiosError;
    let errorDetails = 'Unknown error';
    
    if (axios.isAxiosError(err)) {
      errorDetails = JSON.stringify({
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
      });
    } else {
      errorDetails = err.message || 'Unknown error';
    }
    
    console.error('[Zoom] Failed to get access token:', errorDetails);
    throw new Error(`Failed to authenticate with Zoom: ${errorDetails}`);
  }
}

// 2. Create a Zoom meeting for a user (host)
export async function createZoomMeeting({
  topic,
  start_time,
  duration = 60,
  timezone = 'America/Denver',
  agenda = '',
  host_email: providedHostEmail,
}: {
  topic: string;
  start_time: string; // ISO string
  duration?: number; // in minutes
  timezone?: string;
  agenda?: string;
  host_email: string;
}): Promise<{ join_url: string; meeting_id: string }> {
  try {
    // Use environment variable host email if available, otherwise fall back to provided email
    const host_email = ZOOM_HOST_EMAIL || providedHostEmail;
    
    if (!host_email) {
      const errorMsg = 'No host email provided and ZOOM_HOST_EMAIL not set in environment';
      console.error('[Zoom] Error:', errorMsg);
      throw new Error(errorMsg);
    }
    
    // Log the exact values being used (without exposing sensitive data)
    console.log('[Zoom] Creating meeting with details:', {
      topic,
      start_time,
      start_time_iso: new Date(start_time).toISOString(),
      duration,
      timezone,
      host_email: `${host_email.substring(0, 3)}...@...${host_email.split('@')[1]?.slice(-3) || ''}`,
      has_agenda: !!agenda,
      env_vars: {
        hasAccountId: !!ZOOM_ACCOUNT_ID,
        hasClientId: !!ZOOM_CLIENT_ID,
        hasClientSecret: !!ZOOM_CLIENT_SECRET,
        hostEmailSet: !!ZOOM_HOST_EMAIL,
      }
    });

    const accessToken = await getZoomAccessToken();
    
    const meetingData = {
      topic,
      type: 2, // Scheduled meeting
      start_time: new Date(start_time).toISOString(), // Ensure proper ISO format
      duration: Math.ceil(duration / 60), // Convert to hours (ceiling to ensure minimum 1 hour)
      timezone,
      agenda: agenda || `Astrology session scheduled for ${new Date(start_time).toLocaleString()}`,
      settings: {
        join_before_host: false,
        waiting_room: true,
        approval_type: 0, // Automatically approve registration
        registration_type: 1, // Register once for all occurrences
        audio: 'both',
        auto_recording: 'none',
        alternative_hosts: '',
        host_video: true,
        participant_video: true,
        mute_upon_entry: false,
        meeting_invitees: [],
      },
    };

    console.log('[Zoom] Sending meeting creation request...');
    const response = await axios.post(
      `https://api.zoom.us/v2/users/${encodeURIComponent(host_email)}/meetings`,
      meetingData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000, // 15 second timeout
      }
    );

    if (!response.data?.join_url) {
      throw new Error('No join URL in Zoom API response');
    }

    console.log('[Zoom] Meeting created successfully:', {
      meeting_id: response.data.id,
      join_url: response.data.join_url,
      start_url: response.data.start_url ? '***' : 'Not available',
      password: response.data.password || 'None',
    });

    return {
      join_url: response.data.join_url,
      meeting_id: response.data.id,
    };
  } catch (error) {
    const err = error as Error | AxiosError;
    let errorDetails = 'Unknown error';
    
    if (axios.isAxiosError(err)) {
      errorDetails = JSON.stringify({
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          data: err.config?.data ? JSON.parse(err.config.data) : null,
        },
      });
    } else {
      errorDetails = err.message || 'Unknown error';
    }
    
    console.error('[Zoom] Failed to create meeting:', errorDetails);
    throw new Error(`Failed to create Zoom meeting: ${errorDetails}`);
  }
}
