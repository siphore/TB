import crypto from "crypto";

// Your PEM-formatted public key
const publicKey = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDMLrpmZu3cBDlbw8dg71kuaGsq
2rbpyS8KwazYZcC1imRWt7WguSpe3dcQKB49QHQOX4Va512C0XqrNtR3qte3hkju
/A8wslpcvpX9sk0blDdsG4IwN8PDw9c0aZxaRGXDo09aILlhYqHkzBetWrlDbO3O
CHhnF9XSAJTpnWzeWQIDAQAB
-----END PUBLIC KEY-----`;

// The password to encrypt
const password = process.env.ENCRYPT_PASSWORD;

// Encrypt the password
const encryptedBuffer = crypto.publicEncrypt(
  {
    key: publicKey,
    padding: crypto.constants.RSA_PKCS1_PADDING,
  },
  Buffer.from(password)
);

// Base64 encode the result (to match PHP behavior)
const encryptedBase64 = encryptedBuffer.toString("base64");

console.log("Encrypted password:", encryptedBase64);
