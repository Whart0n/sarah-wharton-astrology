import axios from 'axios';

const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;
const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;

if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
  throw new Error('Missing Zoom API credentials in environment variables');
}

// 1. Get Zoom access token (Server-to-Server OAuth)
export async function getZoomAccessToken(): Promise<string> {
  const params = new URLSearchParams();
  params.append('grant_type', 'account_credentials');
  params.append('account_id', ZOOM_ACCOUNT_ID!); // Non-null assertion since we check above

  const response = await axios.post(
    'https://zoom.us/oauth/token',
    params,
    {
      headers: {
        Authorization:
          'Basic ' + Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );
  return response.data.access_token;
}

// 2. Create a Zoom meeting for a user (host)
export async function createZoomMeeting({
  topic,
  start_time,
  duration = 60,
  timezone = 'America/Denver',
  agenda = '',
  host_email,
}: {
  topic: string;
  start_time: string; // ISO string
  duration?: number; // in minutes
  timezone?: string;
  agenda?: string;
  host_email: string;
}): Promise<{ join_url: string; meeting_id: string }> {
  const accessToken = await getZoomAccessToken();
  const response = await axios.post(
    `https://api.zoom.us/v2/users/${encodeURIComponent(host_email)}/meetings`,
    {
      topic,
      type: 2, // Scheduled meeting
      start_time,
      duration,
      timezone,
      agenda,
      settings: {
        join_before_host: false,
        waiting_room: true,
        approval_type: 0,
        registration_type: 1,
        audio: 'both',
        auto_recording: 'none',
      },
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return {
    join_url: response.data.join_url,
    meeting_id: response.data.id,
  };
}
