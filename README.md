# MotoDoor: Doorstep Two-Wheeler Service

> **Your bike, our responsibility. Service at your doorstep.**

MotoDoor is a full-stack web platform that sends trained mechanics to a rider's home, workplace or breakdown location. Customers book a service, track the mechanic's progress, pay online and rate the job. Mechanics accept nearby requests, and admins manage the whole operation.

**Live demo:** [Frontend (Vercel)](https://client-xi-six-37.vercel.app) · [API health check (Render)](https://motodoor.onrender.com/api/health)
*The API runs on a free Render plan, so the first request after a period of inactivity can take up to a minute.*

---

## Table of contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Project structure](#project-structure)
4. [Getting started](#getting-started)
5. [Environment variables](#environment-variables)
6. [How it works](#how-it-works)
7. [API reference](#api-reference)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)
10. [Roadmap](#roadmap)
11. [Team](#team)

---

## Features

**Customer**
- Sign up and log in
- Add bike details (model and registration number)
- Choose from routine care, core repairs, electrical help or urgent roadside response
- Share current GPS location, use a saved home address, or type an address
- Pick a date and time slot (urgent requests are dispatched immediately)
- Track the booking live, from confirmation to completion
- Pay by mock UPI or card, view and print the digital invoice, and leave a rating

**Mechanic**
- Sign up with skills and experience (an admin approves new accounts)
- See nearby open requests, sorted by distance
- Accept jobs (first mechanic to accept gets the job)
- Open directions to the customer in Google Maps
- Update job status and add parts charges before completing

**Admin**
- Dashboard with revenue, open and completed bookings, customer and mechanic counts
- View, filter, assign, reassign and cancel bookings
- Approve or suspend mechanics and see their jobs and average rating

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router, Axios |
| Backend | Node.js, Express |
| Database | MongoDB with Mongoose (`2dsphere` geospatial index) |
| Auth | JWT, bcryptjs, role-based middleware |
| Hosting | Vercel (client), Render (server), MongoDB Atlas (database) |

## Project structure

```
motodoor/
├── server/
│   ├── server.js                 # Express app, route mounting, error handler
│   ├── config/
│   │   ├── db.js                 # MongoDB connection
│   │   └── services.js           # Service catalogue and prices
│   ├── models/                   # User.js, Booking.js
│   ├── middleware/auth.js        # JWT protect + role authorize
│   ├── routes/                   # auth, bookings, payments, mechanic, admin
│   └── utils/                    # invoice.js, geo.js, seedAdmin.js, asyncHandler.js
└── client/
    ├── vercel.json               # SPA rewrite so page refreshes do not 404
    └── src/
        ├── App.jsx, main.jsx, api.js, lib.js
        ├── context/AuthContext.jsx
        ├── components/           # Navbar, ProtectedRoute, StatusTracker,
        │                         # Invoice, PaymentPanel, FeedbackForm
        └── pages/                # Home, Auth, BookService, MyBookings,
                                  # BookingDetail, MechanicDashboard, AdminDashboard
```

## Getting started

**Prerequisites:** Node.js 18 or newer, and MongoDB (local install or a free MongoDB Atlas cluster).

### 1. Backend

```bash
cd server
cp .env.example .env        # then edit MONGO_URI and JWT_SECRET
npm install
npm run seed:admin          # creates the admin account from .env
npm run dev                 # http://localhost:5000
```

### 2. Frontend

```bash
cd client
npm install
npm run dev                 # http://localhost:5173 (proxies /api to :5000)
```

### 3. Try the full flow

1. Sign up as a **mechanic**.
2. Log in as the **admin**, open the Mechanics tab and approve the mechanic.
3. Sign up as a **customer** and book a service (allow browser location access).
4. Log in as the mechanic, then Nearby requests → Accept → Reached → Start → Complete.
5. As the customer, watch the status update, pay with mock UPI or card, and rate the service.

## Environment variables

### Server (`server/.env`)

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | Yes | MongoDB connection string, e.g. `mongodb+srv://user:pass@cluster.mongodb.net/motodoor` |
| `JWT_SECRET` | Yes | Long random string used to sign tokens |
| `CLIENT_URL` | Yes | Allowed frontend origin for CORS (`http://localhost:5173` locally) |
| `PORT` | No | Defaults to `5000` (Render sets this automatically) |
| `ADMIN_EMAIL` | For seeding | Admin login email (default `admin@motodoor.in`) |
| `ADMIN_PASSWORD` | For seeding | Admin password (default `Admin@12345`, **change this in production**) |

### Client (Vercel / `client/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | In production | Base URL of the API, ending in `/api`, e.g. `https://motodoor.onrender.com/api`. Locally the Vite proxy handles this. |

> Never commit `.env` files or put secrets in client variables. Anything prefixed with `VITE_` is public in the built app.

## How it works

### Booking lifecycle

```
confirmed → assigned → reached → in_progress → completed
    └──────────────┴──→ cancelled (customer or admin, before work starts)
```

| Status | Triggered by |
|---|---|
| `confirmed` | Customer creates the booking |
| `assigned` | Mechanic accepts, or admin assigns |
| `reached` | Mechanic marks arrival |
| `in_progress` | Mechanic starts the service |
| `completed` | Mechanic finishes; the invoice is generated |

### Pricing

Prices are in INR and defined in `server/config/services.js`.

| Category | Services |
|---|---|
| Routine care | General servicing ₹499, Engine oil ₹349 |
| Core repairs | Brake ₹399, Battery ₹299, Tyre ₹249, Chain ₹299, Puncture ₹99 |
| Electrical help | Lights ₹199, Wiring ₹299, Self-start ₹349 |
| Urgent response | Roadside assistance ₹199, Jump start ₹149 |

A doorstep visit charge of ₹99 applies to every booking, plus ₹149 for urgent requests. The invoice adds any parts the mechanic records and 18% GST. All amounts are calculated on the server.

### Design notes

- **Nearby search:** the booking `location` field has a `2dsphere` index and requests are found with `$near`, nearest first.
- **No double booking:** accepting a job uses an atomic `findOneAndUpdate` on `{ status: 'confirmed', mechanic: null }`, so only the first mechanic succeeds.
- **Valid status changes only:** the server decides the next status, so steps cannot be skipped.
- **Live updates:** the customer's booking page polls every 8 seconds, and the mechanic's location is refreshed every 15 seconds.

## API reference

All routes are prefixed with `/api`.

| Method | Route | Access |
|---|---|---|
| GET | `/health` | Public |
| GET | `/services` | Public |
| POST | `/auth/signup`, `/auth/login` | Public |
| GET | `/auth/me` | Logged in |
| PATCH | `/auth/home` | Customer |
| POST | `/bookings` | Customer |
| GET | `/bookings/my` | Customer |
| GET | `/bookings/:id` | Owner, assigned mechanic or admin |
| PATCH | `/bookings/:id/cancel` | Customer |
| POST | `/bookings/:id/feedback` | Customer |
| POST | `/payments/:id/pay` | Customer (mock) |
| PATCH | `/mechanic/location` | Mechanic |
| GET | `/mechanic/requests?lat&lng&radius` | Mechanic |
| POST | `/mechanic/requests/:id/accept` | Approved mechanic |
| GET | `/mechanic/jobs` | Mechanic |
| PATCH | `/mechanic/jobs/:id/status` | Mechanic |
| GET | `/admin/stats`, `/admin/bookings`, `/admin/mechanics` | Admin |
| PATCH | `/admin/bookings/:id/assign`, `/admin/bookings/:id/cancel` | Admin |
| PATCH | `/admin/mechanics/:id` | Admin |

Authenticated requests send `Authorization: Bearer <token>`.

## Deployment

The app is deployed with **MongoDB Atlas** (database), **Render** (API) and **Vercel** (frontend).

### 1. Database (MongoDB Atlas)
1. Create a free cluster and a database user.
2. Under **Network Access**, allow `0.0.0.0/0`. Render's IP addresses change, so a fixed IP will not work.
3. Copy the connection string and add the database name `motodoor` after `.mongodb.net/`.

### 2. API (Render)
1. Create a **Web Service** from this repository.
2. Settings:
   - Root directory: `server`
   - Build command: `npm install`
   - Start command: `npm start`
3. Add the server environment variables from the table above (`MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`).
4. After the first successful deploy, open the Render **Shell** and run `npm run seed:admin` once.
5. Check `https://<your-service>.onrender.com/api/health` returns `{"ok":true}`.

### 3. Frontend (Vercel)
1. Import the repository and set the root directory to `client`.
2. Build command `npm run build`, output directory `dist`.
3. Set `VITE_API_URL` to your Render URL ending in `/api`.
4. Deploy, then set Render's `CLIENT_URL` to the Vercel URL and redeploy the API (this avoids CORS errors).

## Troubleshooting

| Problem | Likely cause and fix |
|---|---|
| `MONGO_URI is not set` in Render logs | The variable is missing or misspelled. Add it under **Environment**, then redeploy. |
| `Could not connect to any servers` / IP not whitelisted | Add `0.0.0.0/0` in Atlas **Network Access** and make sure the cluster is not paused. |
| `bad auth` / `Authentication failed` | Wrong database password, or `<` `>` left in the connection string. Special characters in passwords can also break the URI. |
| CORS error in the browser | `CLIENT_URL` on Render does not exactly match the Vercel URL (no trailing slash). |
| Frontend calls fail in production | `VITE_API_URL` is missing. Set it and redeploy Vercel. |
| First request is very slow | Free Render services sleep after inactivity. Open the API URL once before a demo. |
| Location button does nothing | Browsers only share location on HTTPS or `localhost`, and only after you allow it. |

## Roadmap

Current limitations and planned improvements:

- [ ] Replace the mock payment with Razorpay or Cashfree and verify payments through a server webhook
- [ ] Add geocoding (Google or Mapbox) so typed addresses get exact coordinates. Right now they use central Lucknow.
- [ ] Switch polling to Socket.io for real-time status and mechanic tracking
- [ ] Add a map view for customers and mechanics
- [ ] Add API tests and input validation (zod or joi)
- [ ] Harden the API with `helmet` and `express-rate-limit`, and move the JWT to an httpOnly cookie
- [ ] SMS or email notifications for booking updates
- [ ] Monthly and annual maintenance packages, memberships and fleet accounts

