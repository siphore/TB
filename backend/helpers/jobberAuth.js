import fs from "fs";
import qs from "qs";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = `${process.env.API_URL}/callback`;
const tokenFile = "./tokens.json";

// Save tokens to disk
export function saveTokenToFile(data) {
  fs.writeFileSync(tokenFile, JSON.stringify(data, null, 2));
}

// Load tokens from disk
export function loadTokenFromFile() {
  if (!fs.existsSync(tokenFile)) return null;
  return JSON.parse(fs.readFileSync(tokenFile));
}

// Exchange auth code for access + refresh tokens
export async function exchangeCodeForToken(code) {
  const response = await axios.post(
    "https://api.getjobber.com/api/oauth/token",
    {
      grant_type: "authorization_code",
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
    },
    {
      headers: { "Content-Type": "application/json" },
    }
  );

  saveTokenToFile(response.data);
  return response.data;
}

// Refresh access token using refresh token
export async function refreshAccessToken(refreshToken) {
  const response = await axios.post(
    "https://api.getjobber.com/api/oauth/token",
    qs.stringify({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  saveTokenToFile(response.data);
  return response.data.access_token;
}

// Make authorized API request
export default async function makeAuthorizedRequest(requestFn) {
  let tokenData = loadTokenFromFile();
  if (!tokenData) throw new Error("No token data found");

  try {
    return await requestFn(tokenData.accessToken);
  } catch (err) {
    if (err.response?.status === 401) {
      const newAccessToken = await refreshAccessToken(tokenData.refreshToken);
      return await requestFn(newAccessToken);
    }
    throw err;
  }
}
