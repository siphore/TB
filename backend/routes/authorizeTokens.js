import express from "express";
import { exchangeCodeForToken } from "../helpers/jobberAuth.js";

const router = express.Router();

router.get("/", (req, res) => {
  const authUrl = `https://api.getjobber.com/api/oauth/authorize?response_type=code&client_id=${
    process.env.CLIENT_ID
  }&redirect_uri=${encodeURIComponent(
    `${process.env.API_URL}/authorize/callback`
  )}&scope=read_clients read_invoices offline_access`;

  res.redirect(authUrl);
});

router.get("/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send("Missing authorization code");

  try {
    await exchangeCodeForToken(code);
    res.redirect(process.env.FRONTEND_URL);
  } catch (err) {
    console.error("❌ Callback error:", err.message);
    res.status(500).send("❌ Authorization failed");
  }
});

export default router;
