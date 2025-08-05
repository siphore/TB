import fs from "fs";
import qs from "qs";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const tokenFile = "./tokens.json";

function saveTokenToFile(data) {
  fs.writeFileSync(tokenFile, JSON.stringify(data, null, 2));
}

function loadTokenFromFile() {
  if (!fs.existsSync(tokenFile)) return null;
  return JSON.parse(fs.readFileSync(tokenFile));
}

async function refreshAccessToken(refreshToken) {
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

  const { access_token, refresh_token } = response.data;

  saveTokenToFile({
    accessToken: access_token,
    refreshToken: refresh_token,
  });

  return access_token;
}

export default async function makeAuthorizedRequest(requestFn) {
  let tokenData = loadTokenFromFile();
  if (!tokenData) throw new Error("No token data available");

  try {
    return await requestFn(tokenData.accessToken);
  } catch (err) {
    if (err.response?.status === 401) {
      console.warn("🔁 Access token expired, refreshing...");
      try {
        const newAccessToken = await refreshAccessToken(tokenData.refreshToken);
        return await requestFn(newAccessToken);
      } catch (refreshErr) {
        console.error("❌ Token refresh failed:", refreshErr);
        throw refreshErr;
      }
    }

    // Only log other errors
    console.error("❌ Request error:", err);
    throw err;
  }
}
