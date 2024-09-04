const express = require('express');
const cors = require('cors'); // Import the cors package
const axios = require('axios');
const querystring = require('querystring');
require('dotenv').config();

const app = express();
app.use(express.json());

// Use the cors middleware
app.use(cors());

let accessToken = '';

// Function to get OAuth token using client credentials
const getOAuthToken = async () => {
  const tokenUrl = 'https://zoom.us/oauth/token';
  const authHeader = Buffer.from(`${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`).toString('base64');

  try {
    const response = await axios.post(tokenUrl, querystring.stringify({
      grant_type: 'account_credentials',
      account_id: process.env.ZOOM_ACCOUNT_ID,
    }), {
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    accessToken = response.data.access_token;
    console.log('Access token obtained:', accessToken);
  } catch (error) {
    console.error('Error obtaining OAuth token:', error.message);
  }
};

// Root route to handle GET requests
app.get('/', (req, res) => {
  res.send('Zoom API Integration is running!');
});

// Generate a Zoom Meeting Link and return Zoom Web Client URL
app.post('/create-meeting', async (req, res) => {
  // Destructure the data from the request body
  const { hostEmail, topic, duration, startTime } = req.body;

  if (!accessToken) {
    await getOAuthToken();
  }

  try {
    const response = await axios.post('https://api.zoom.us/v2/users/' + hostEmail + '/meetings', {
      topic: topic || "Default Meeting Topic",
      type: 2, // Scheduled Meeting
      start_time: startTime, // ISO-8601 format (e.g., 2024-09-02T10:00:00Z)
      duration: duration || 60, // Set default duration if not provided
      timezone: 'UTC',
      password: '123456', // Set the password as "123456"
      settings: {
        host_video: true,
        participant_video: true,
        waiting_room: false, // Disable waiting room
      },
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const meetingId = response.data.id; // This will be the Zoom-generated meeting ID
    const meetingPassword = response.data.password; // This will be the password you set

    // Generate the Zoom Web Client URL
    const meetingLink = `https://zoom.us/wc/join/${meetingId}?pwd=${meetingPassword}`;

    // Respond with the meeting ID, password, and link
    res.json({
      meetingId: meetingId, // Zoom-generated meeting ID
      meetingPassword: meetingPassword, // Password set to "123456"
      meetingLink: meetingLink // Zoom Web Client link
    });
  } catch (error) {
    console.log(error);

    if (error.response && error.response.status === 401) {
      // If token has expired, get a new one and retry the request
      await getOAuthToken();
      return app.post('/create-meeting', req, res);
    }
    res.status(500).json({ error: error.message });
  }
});

// Server setup
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
