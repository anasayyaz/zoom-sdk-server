const express = require("express");
const cors = require("cors");
const axios = require("axios");
const querystring = require("querystring");
const jwt = require("jsonwebtoken"); // Import jsonwebtoken for JWT
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

let accessToken = "";

// Function to get OAuth token using client credentials
// const getOAuthToken = async () => {
//   const tokenUrl = "https://zoom.us/oauth/token";
//   const authHeader = Buffer.from(
//     `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
//   ).toString("base64");

//   try {
//     const response = await axios.post(
//       tokenUrl,
//       querystring.stringify({
//         grant_type: "account_credentials",
//         account_id: process.env.ZOOM_ACCOUNT_ID,
//       }),
//       {
//         headers: {
//           Authorization: `Basic ${authHeader}`,
//           "Content-Type": "application/x-www-form-urlencoded",
//         },
//       }
//     );

//     accessToken = response.data.access_token;
//     console.log("Access token obtained:", accessToken);
//   } catch (error) {
//     console.error("Error obtaining OAuth token:", error.message);
//   }
// };

// Root route to handle GET requests
app.get("/", (req, res) => {
  res.send("Zoom API Integration is running!");
});

// Generate a Zoom Meeting Link and return JWT token with meeting details
app.post("/create-meeting", async (req, res) => {
  const { hostEmail, topic, duration, startTime } = req.body;

  // if (!accessToken) {
  //   await getOAuthToken();
  // }

  try {
    // const response = await axios.post(
    //   "https://api.zoom.us/v2/users/" + hostEmail + "/meetings",
    //   {
    //     topic: topic || "Default Meeting Topic",
    //     type: 2, // Scheduled Meeting
    //     start_time: startTime, // ISO-8601 format (e.g., 2024-09-02T10:00:00Z)
    //     duration: duration || 60, // Set default duration if not provided
    //     timezone: "UTC",
    //     password: "123456", // Set the password as "123456"
    //     settings: {
    //       host_video: true,
    //       participant_video: true,
    //       waiting_room: false, // Disable waiting room
    //     },
    //   },
    //   {
    //     headers: {
    //       Authorization: `Bearer ${accessToken}`,
    //       "Content-Type": "application/json",
    //     },
    //   }
    // );

    // const meetingId = response.data.id;
    // const meetingPassword = response.data.password;
    // const meetingLink = `https://zoom.us/wc/join/${meetingId}?pwd=${meetingPassword}`;

    // Payload to include in the JWT
    const payload = {
      appKey: process.env.ZOOM_CLIENT_ID,
      tokenExp: Math.floor(Date.now() / 1000) + 60 * 60,
      // meetingId: meetingId,
      // meetingPassword: meetingPassword,
      // meetingLink: meetingLink
    };

    // Generate JWT token
    const jwtToken = jwt.sign(
      payload,
      process.env.JWT_SECRET || "my-zoom-app-secret",
      { expiresIn: "1h" }
    );

    // Respond with JWT token and meeting details
    res.json({
      success: true,
      token: jwtToken,
      // meetingId: meetingId,
      // meetingPassword: meetingPassword,
      // meetingLink: meetingLink,
    });
  } catch (error) {
    console.log(error);

    if (error.response && error.response.status === 401) {
      await getOAuthToken();
      return app.post("/create-meeting", req, res);
    }
    res.status(500).json({ error: error.message });
  }
});

// Server setup
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
