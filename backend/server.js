import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { WebSocketServer } from "ws";
// import authorizeRoutes from "./routes/authorize.js";
import jobberRoutes from "./routes/softwares/jobber.js";
import winbizRoutes from "./routes/softwares/winbiz.js";
import webhookRoutes, { setSockets } from "./routes/webhook.js";
import logRoutes from "./routes/logs.js";
dotenv.config();

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// app.use("/", authorizeRoutes);
app.use("/", jobberRoutes);
app.use("/", winbizRoutes);
app.use("/", webhookRoutes);
app.use("/", logRoutes);

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

let sockets = [];
setSockets(sockets);

const wss = new WebSocketServer({ server });

wss.on("connection", (socket) => {
  sockets.push(socket);

  socket.on("message", (data) => {
    const text = data.toString();
    sockets.forEach((s) => {
      if (s !== socket && s.readyState === 1) {
        s.send(text);
      }
    });
  });

  socket.on("close", () => {
    sockets = sockets.filter((s) => s !== socket);
    setSockets(sockets);
  });
});
