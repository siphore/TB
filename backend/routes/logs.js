import express from "express";
import fs from "fs";

const router = express.Router();

router.get("/invoices", (req, res) => {
  const logPath = "./softwares/jobber/invoices.log";

  if (!fs.existsSync(logPath))
    return res.status(404).json({ error: "Log file not found" });

  fs.readFile(logPath, "utf-8", (err, data) => {
    if (err) return res.status(500).json({ error: "Error reading log file" });

    const lines = data
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return { raw: line, error: "Invalid JSON" };
        }
      });

    res.json(lines);
  });
});

export default router;
