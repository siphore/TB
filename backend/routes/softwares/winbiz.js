import express from "express";
import crypto from "crypto";
import FormData from "form-data";
import fs from "fs";
import axios from "axios";

const router = express.Router();
const WINBIZ_API = "https://api.winbizcloud.ch/Bizinfo";

const encryptPwd = (pwd) => {
  // Your PEM-formatted public key
  const publicKey = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDMLrpmZu3cBDlbw8dg71kuaGsq
2rbpyS8KwazYZcC1imRWt7WguSpe3dcQKB49QHQOX4Va512C0XqrNtR3qte3hkju
/A8wslpcvpX9sk0blDdsG4IwN8PDw9c0aZxaRGXDo09aILlhYqHkzBetWrlDbO3O
CHhnF9XSAJTpnWzeWQIDAQAB
-----END PUBLIC KEY-----`;

  // Encrypt the password
  const encryptedBuffer = crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    },
    Buffer.from(pwd)
  );

  // Base64 encode the result (to match PHP behavior)
  const encryptedBase64 = encryptedBuffer.toString("base64");

  return encryptedBase64;
};

router.post("/", async (req, res) => {
  const general = req.body;
  const client = req.body.client;
  const billingAddress = req.body.billingAddress;
  const filePath = "./softwares/winbiz/bizexdoc_winbiz.wdx";

  const inputData = {
    isCompany: client.isCompany,
    companyName: client.companyName,
    firstName: client.firstName,
    lastName: client.lastName,
    gender: client.gender,
    invoiceNumber: general.invoiceNumber,
    dueDate: general.dueDate,
    total: general.amounts.total,
    // subject: general.subject,
    country: billingAddress.country,
    city: billingAddress.city,
    npa: billingAddress.postalCode,
    street: billingAddress.street,
    phone: client.phones[0]?.number || "",
    email: client.emails[0]?.address || "",
    lineItems: req.body.lineItems.nodes,
    job: req.body.jobs.nodes,
  };

  const {
    companyName,
    firstName,
    lastName,
    gender,
    invoiceNumber,
    dueDate,
    total,
    // subject,
    country,
    city,
    npa,
    street,
    phone,
    email,
    lineItems,
    job,
  } = inputData;

  const itemCount = inputData.lineItems.length;
  const isTaxable = lineItems[0].taxable;
  const pad = (n) => String(n).padStart(2, "0");
  const dueDate2 = new Date(dueDate);
  const formattedDueDate = `${pad(dueDate2.getDate())}.${pad(
    dueDate2.getMonth() + 1
  )}.${dueDate2.getFullYear()}`;

  const tva = isTaxable === "true" || isTaxable === true ? "8.1" : "0";
  const tvaCode = tva === "0" ? "0" : "1";

  const winbizLines = [];

  for (let i = 0; i < itemCount; i++) {
    const fields = Array(159).fill("");
    const lineItem = inputData.lineItems[i];
    const date = new Date(lineItem.date);
    const lineDate = `${pad(date.getDate())}${pad(
      date.getMonth() + 1
    )}${date.getFullYear()}`;
    const formattedDate = `${pad(date.getDate())}.${pad(
      date.getMonth() + 1
    )}.${date.getFullYear()}`;
    const lineCode = lineItem.name.includes("|")
      ? lineItem.name.split("|")[1].trim()
      : "";

    // En-tête
    fields[0] = "<NEW>"; // Numéro facture
    fields[1] = "20"; // Code de journal "facture débiteur"
    fields[2] = formattedDueDate; // Date
    fields[4] = job[0].title; // Notre référence
    fields[5] = parseFloat(total).toFixed(2); // Montant total monnaie locale
    fields[6] = "CHF"; // Code ISO de la monnaie
    fields[10] = "<AUTO>"; // Compte collectif de tiers
    fields[11] = "<AUTO>"; // Compte d'escompte

    // Adresse
    // fields[19] = addressCode; // Code adresse
    fields[22] = lastName ? lastName : ""; // Nom
    fields[23] = firstName ? firstName : companyName ? companyName : ""; // Prénom
    fields[24] = street; // Rue 1
    fields[26] = npa; // Numéro postal
    fields[27] = city; // Ville, localité
    fields[28] = "CH"; // Code pays ISO
    fields[31] = phone; // Téléphone 1
    fields[35] = email; // Email
    fields[46] = "2"; // Mise à jour de l'adresse

    // Lignes
    fields[47] = String(i + 1); // N° de ligne
    fields[49] = lineCode; // Code de ligne
    fields[50] = formattedDate + " - " + lineItem.description; // Description
    fields[51] = lineDate; // Date de ligne
    fields[52] = lineItem.quantity; // Quantité
    fields[53] = lineItem.unitPrice; // Prix monaie locale
    fields[56] = lineItem.totalPrice; // Montant total de la ligne
    fields[59] = "<AUTO>"; // Compte chiffre d'affaires
    fields[60] = tva; // TVA %
    fields[61] = tvaCode; // TVA incluse/exclue

    // Document
    fields[131] = "Facture"; // Type de message

    winbizLines.push(fields.join(";"));
  }

  const joined = winbizLines.join("\r\n");

  // Write the base64-decoded CSV to a file
  await fs.promises.writeFile(filePath, joined);

  try {
    const form = new FormData();
    form.append("winbiz-file", fs.createReadStream(filePath));
    form.append("winbiz-method", "DocumentImport");

    const response = await axios.post(WINBIZ_API, form, {
      headers: {
        ...form.getHeaders(),
        "winbiz-companyname": "Ouidoo SA",
        "winbiz-username": "wb-ouidoo2",
        "winbiz-key": process.env.WINBIZ_KEY,
        "winbiz-password": encryptPwd(process.env.ENCRYPT_PASSWORD),
        "winbiz-companyid": 11,
        "winbiz-year": 2025,
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    console.log("✅ Winbiz response:", response.data);
    res.json(response.data);
  } catch (e) {
    console.error("❌ Error sending to Winbiz:", e.message);
    res.status(500).json({ error: e.message });
  }
});

router.post("/folders", async (req, res) => {
  try {
    const response = await fetch(WINBIZ_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "winbiz-companyname": "Ouidoo SA",
        "winbiz-username": "wb-ouidoo2",
        "winbiz-key": process.env.WINBIZ_KEY,
        "winbiz-password": encryptPwd(process.env.ENCRYPT_PASSWORD),
        "winbiz-companyid": 0,
        "winbiz-year": 0,
      },
      body: JSON.stringify({
        Method: "Folders",
        Parameters: [],
      }),
    });

    const result = await response.json();
    res.json(result);
  } catch (e) {
    console.error("Error fetching folders from Winbiz:", e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
