import express from "express";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const router = express.Router();
const USERNAME = process.env.LOGIN_USERNAME;
const PASSWORD = process.env.LOGIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET || "your-fallback-secret";

router.post("/login", express.json(), (req, res) => {
  const { username, password } = req.body;

  if (username === USERNAME && password === PASSWORD) {
    const token = jwt.sign({ user: username }, JWT_SECRET, { expiresIn: "1d" });
    return res.json({ token });
  }

  return res.status(401).json({ error: "Invalid credentials" });
});

export default router;
