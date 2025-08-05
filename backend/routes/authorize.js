import express from "express";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:4000/callback";

const router = express.Router();

router.get("/authorize", (req, res) => {
  const authUrl = `https://api.getjobber.com/api/oauth/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&scope=read_clients read_invoices offline_access`;
  res.redirect(authUrl);
});

router.get("/callback", async (req, res) => {
  const { code } = req.query;
  console.log(code);

  try {
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

    console.log("Response:", response.data);

    res.send(`
      <h1>✅ Authorization successful!</h1>
    `);
  } catch (error) {
    console.error(
      "Token exchange failed:",
      error.response?.data || error.message
    );
    res.status(500).send("❌ Token exchange failed");
  }
});

export default router;
