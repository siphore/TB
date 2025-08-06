import express from "express";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";

import authenticateRoutes from "./routes/authenticate.js";
import authorizeRoutes from "./routes/authorizeTokens.js";
import jobberRoutes from "./routes/softwares/jobber.js";
import winbizRoutes from "./routes/softwares/winbiz.js";
import webhookRoutes from "./routes/webhook.js";
import logRoutes from "./routes/logs.js";

dotenv.config();

const app = express();
const PORT = 4000;
const FRONTEND_URL = process.env.FRONTEND_URL;
const JWT_SECRET = process.env.JWT_SECRET || "your-fallback-secret";

// --- CORS config ---
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", FRONTEND_URL);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(express.json());

// --- JWT Middleware ---
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];

  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// --- Auth check route ---
app.get("/protected", requireAuth, (req, res) => {
  res.json({ secret: "🎉 You are authenticated!" });
});

// --- Public routes ---
app.use("/auth", authenticateRoutes);
app.use("/authorize", authorizeRoutes);

// --- Protected routes ---
app.use("/jobber", requireAuth, jobberRoutes);
app.use("/winbiz", requireAuth, winbizRoutes);
app.use("/webhook", requireAuth, webhookRoutes);
app.use("/logs", requireAuth, logRoutes);

// --- Catch-all 404 ---
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// --- Start HTTP server ---
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// --- WebSocket server ---
const io = new Server(server, {
  cors: {
    origin: [FRONTEND_URL, "http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("🔌 New client connected");

  socket.on("INVOICE_CREATED", (data) => {
    socket.broadcast.emit("INVOICE_CREATED", data);
  });

  socket.on("INVOICE_SENT", (data) => {
    socket.broadcast.emit("INVOICE_SENT", data);
  });

  socket.on("INVOICE_SELECTED", (data) => {
    socket.broadcast.emit("INVOICE_SELECTED", data);
  });

  socket.on("disconnect", () => {
    console.log("🔌 Client disconnected");
  });
});
