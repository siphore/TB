import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authorizeRoutes from "./routes/authorize.js";
import jobberRoutes from "./routes/softwares/jobber.js";
import winbizRoutes from "./routes/softwares/winbiz.js";
import webhookRoutes from "./routes/webhook.js";
import logRoutes from "./routes/logs.js";
import { Server } from "socket.io";
dotenv.config();

const app = express();
const PORT = 4000;

const corsOptions = {
  origin: ["https://invoice-review.ouidoo.ch", "http://localhost:5173"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Origin", "http://localhost:5173");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res.sendStatus(204);
  }
  next();
});

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

app.use(express.json());

app.use("/", authorizeRoutes);
app.use("/", jobberRoutes);
app.use("/", winbizRoutes);
app.use("/", webhookRoutes);
app.use("/", logRoutes);

app.use((req, res) => {
  res.header("Access-Control-Allow-Origin", "https://invoice-review.ouidoo.ch");
  res.header("Access-Control-Allow-Credentials", "true");
  res.status(404).json({ error: "Not found" });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

const io = new Server(server, {
  cors: {
    origin: ["https://invoice-review.ouidoo.ch", "http://localhost:5173"],
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
