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
  hostEmail: ZOOM_HOST_EMAIL || 'Not set, will fail if not provided',
});

if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET || !ZOOM_HOST_EMAIL) {
  const missing = [];
  if (!ZOOM_ACCOUNT_ID) missing.push('ZOOM_ACCOUNT_ID');
  if (!ZOOM_CLIENT_ID) missing.push('ZOOM_CLIENT_ID');
  if (!ZOOM_CLIENT_SECRET) missing.push('ZOOM_CLIENT_SECRET');
  if (!ZOOM_HOST_EMAIL) missing.push('ZOOM_HOST_EMAIL');
  
  const errorMsg = `Missing required Zoom API credentials: ${missing.join(', ')}`;
  console.error('[Zoom] Configuration Error:', errorMsg);
  throw new Error(errorMsg);
}

// Validate ZOOM_HOST_EMAIL format
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ZOOM_HOST_EMAIL)) {
  const errorMsg = `Invalid ZOOM_HOST_EMAIL format: ${ZOOM_HOST_EMAIL}`;
  console.error('[Zoom] Configuration Error:', errorMsg);
  throw new Error(errorMsg);
}

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
          Authorization: 'Basic ' + Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 10000,
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

export async function createZoomMeeting({
  topic,
  start_time,
  duration = 60,
  timezone = 'Australia/Sydney', // Default to AEST
  agenda = '',
}: {
  topic: string;
  start_time: string; // ISO string
  duration?: number; // in minutes
  timezone?: string;
  agenda?: string;
}): Promise<{ join_url: string; meeting_id: string }> {
  try {
    const host_email = ZOOM_HOST_EMAIL!; // We’ve ensured this exists via the check above

    // Validate start_time
    const startDate = new Date(start_time);
    if (isNaN(startDate.getTime())) {
      const errorMsg = `Invalid start_time format: ${start_time}`;
      console.error('[Zoom] Error:', errorMsg);
      throw new Error(errorMsg);
    }

    // Validate duration
    if (duration <= 0) {
      const errorMsg = `Invalid duration: ${duration} minutes`;
      console.error('[Zoom] Error:', errorMsg);
      throw new Error(errorMsg);
    }

    // Log the exact values being used
    console.log('[Zoom] Creating meeting with details:', {
      topic,
      start_time,
      start_time_iso: startDate.toISOString(),
      duration,
      timezone,
      host_email: `${host_email.substring(0, 3)}...@...${host_email.split('@')[1]?.slice(-3) || ''}`,
      has_agenda: !!agenda,
    });

    const accessToken = await getZoomAccessToken();

    const meetingData = {
      topic,
      type: 2, // Scheduled meeting
      start_time: startDate.toISOString(),
      duration, // Zoom expects duration in minutes
      timezone,
      agenda: agenda || `Astrology session scheduled for ${startDate.toLocaleString()}`,
      settings: {
        join_before_host: false,
        waiting_room: true,
        approval_type: 0,
        registration_type: 1,
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
        timeout: 15000,
      }
    );

    if (!response.data?.join_url || !response.data?.id) {
      throw new Error('Missing join_url or meeting_id in Zoom API response');
    }

    console.log('[Zoom] Meeting created successfully:', {
      meeting_id: response.data.id,
      join_url: response.data.join_url,
    });

    return {
      join_url: response.data.join_url,
      meeting_id: response.data.id.toString(),
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