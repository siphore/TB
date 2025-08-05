import express from "express";
import fs from "fs";

const router = express.Router();

let latestWebhook = null;
let sockets = [];

export const setSockets = (socketList) => {
  sockets = socketList;
};

router.post("/webhooks/invoice", (req, res) => {
  const event = req.body?.data?.webHookEvent;
  if (!event || event.topic !== "INVOICE_CREATE")
    return res.status(200).send("Ignored");

  const { topic, appId, accountId, itemId, occurredAt } = event;
  latestWebhook = {
    topic,
    appId,
    accountId,
    itemId,
    occurredAt,
    receivedAt: new Date().toISOString(),
  };

  // Notify clients
  sockets.forEach((s) =>
    s.send(JSON.stringify({ type: "INVOICE_CREATED", data: latestWebhook }))
  );

  fs.appendFileSync("./softwares/jobber/invoices.log", JSON.stringify(latestWebhook) + "\n");
  res.status(200).send("Webhook received and saved");
});

router.post("/webhooks/invoice-update", (req, res) => {
  const event = req.body?.data?.webHookEvent;
  if (!event || event.topic !== "INVOICE_UPDATE")
    return res.status(200).send("Ignored");

  const itemId = event.itemId;

  sockets.forEach((client) => {
    if (client.readyState === 1) {
      client.send(
        JSON.stringify({ type: "INVOICE_UPDATED", data: { itemId } })
      );
    }
  });

  res.status(200).send("Invoice update webhook received");
});

router.get("/api/latest-webhook", (req, res) => {
  if (!latestWebhook)
    return res.status(404).json({ error: "No webhook received yet" });
  res.json(latestWebhook);
});

export default router;
