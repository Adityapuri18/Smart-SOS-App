# Smart SOS - Backend (Express + MongoDB)

This repository contains a minimal backend for a Smart SOS Emergency App.

Features implemented:
- Register / Login (JWT) using phone/email and password (no OTP)
- Save emergency contacts (CRUD)
- Trigger SOS alerts (creates Alert, sends SMS to contacts via Twilio if configured)
- Live tracking via Socket.IO (update location endpoint + socket events)
- Stop SOS (mark alert as safe)

Quick start

1. Copy `.env.example` to `.env` and set `MONGODB_URI` and `JWT_SECRET`. Set Twilio vars if you want SMS.

2. Install and run:

```bash
npm install
npm run dev
```

API endpoints
- POST `/auth/register` { phone/email, name, password } -> { token }
- POST `/auth/login` { phone/email, password } -> { token }
- GET/POST/DELETE `/contacts` (protected) -> manage emergency contacts
- POST `/alerts/trigger` { latitude, longitude, message } -> create alert + notify
- POST `/alerts/:id/location` { latitude, longitude } -> update alert location
- POST `/alerts/:id/stop` -> mark safe

Realtime
- Connect Socket.IO client and `emit('join', userId)` to receive `alert:triggered`, `alert:location`, `alert:stopped` events.

Notes
- OTP and automatic calling are client responsibilities; server provides endpoints and notification hooks.
- Twilio is optional; if not configured, messages are logged.
