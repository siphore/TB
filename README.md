# 🔁 Jobber ↔ Winbiz Integration Tool

A full-stack application built to automate the transfer of invoice data from **Jobber** to **Winbiz Cloud**, eliminating double data entry and improving operational efficiency for **Ouidoo SA**.

Because of all the secret variables in the .env files you'll see down below, you won't be able to run this program locally (unless you have the right values). I am sorry about that, but since this program is handling real clients data, I did not want to give anybody the opportunity to use this carelessly. I hope you understand.

## 📦 Project Structure

```
project-root/
├── backend/
├── frontend/
└── README.md
```

---

## 🚀 Features

- 🔒 **JWT-based authentication** with login interface
- 📦 **OAuth2 integration** with Jobber API (token refresh supported)
- 📤 **Invoice submission** to Winbiz Cloud using Winbiz’s API
- 📡 **Real-time WebSocket updates** when invoices are created/sent
- 💾 **Logs of previous invoices** available in frontend
- 🧠 **Guided onboarding tour** for new users using `driver.js`
- 🌙 **Light/Dark mode toggle**

---

## ⚙️ Technologies Used

### Frontend
- React + Vite
- Tailwind CSS
- `driver.js` (guided tour)
- Context API (theme, latest invoice)
- Socket.IO client

### Backend
- Node.js + Express
- JWT (jsonwebtoken)
- OAuth2 flow for Jobber
- Winbiz Cloud API integration (multipart/form-data)
- Socket.IO server
- Axios, dotenv, cookie-parser

---

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-repo/jobber-winbiz-integration.git
cd jobber-winbiz-integration
```

---

### 2. Setup Environment Variables

#### 🔐 Backend `.env`

In `/backend/.env`:

```env
PORT=4000
API_URL=http://localhost:4000
FRONTEND_URL=http://localhost:5173

# Jobber API
CLIENT_ID=your-jobber-client-id
CLIENT_SECRET=your-jobber-client-secret
ENCRYPT_PASSWORD=your-jobber-password

# Winbiz API
WINBIZ_KEY=your-winbiz-key
WINBIZ_PWD=your-winbiz-password

# Login
LOGIN_USERNAME=admin
LOGIN_PASSWORD=Ouidoo2025

# JWT
JWT_SECRET=your-secret-key
```

#### 🌍 Frontend `.env`

In `/frontend/.env`:

```env
VITE_API_URL=http://localhost:4000
```

---

### 3. Install Dependencies

#### Backend

```bash
cd backend
npm install
```

#### Frontend

```bash
cd frontend
npm install
```

---

### 4. Start the Development Servers

#### Backend

```bash
npm start
```

> You should see: `🚀 Server running on port 4000`

#### Frontend

```bash
npm run dev
```

> Visit [http://localhost:5173](http://localhost:5173) to use the app.

---

## 🔐 Authentication Flow

- User logs in via `/auth/login` with `LOGIN_USERNAME` + `LOGIN_PASSWORD`.
- A **JWT token** is returned and stored in `localStorage`.
- Protected routes (like `/jobber/invoice`) require this token in the `Authorization` header.
- Token verification is done server-side (`Authorization: Bearer <token>`).
- If a token is expired or invalid, user is redirected to re-authorize Jobber OAuth.

---

## 🔁 OAuth & Token Refresh (Jobber)

- The backend stores Jobber access + refresh tokens in a local JSON file.
- Tokens are refreshed automatically before each API request to Jobber.
- If a refresh token is expired, the user must re-authorize manually.

---

## 🧪 Dev Tools

- `localhost:4000/authorize` — Triggers Jobber authorization flow
- `localhost:5173` — Frontend app
- Console logs show token activity and real-time events

---

## 📝 Notes

- **Winbiz API** requires correct formatting of invoices (dates, encoding, line items).
- **Jobber scopes**: `read_clients read_invoices offline_access` are required.

---

## ✅ To Do / Improvements

- [ ] Store logs in a database (currently JSON or localStorage)
- [ ] Better error handling for Winbiz file imports
- [ ] Admin panel to manage Jobber credentials
- [ ] Multi-user support

---

## 🧠 Developed for

**Ouidoo SA** — by Michaël Cheneval (HEIG-VD)