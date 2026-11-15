# Premium Amazon-Inspired MERN eCommerce Marketplace

A highly scalable, secure, and production-ready eCommerce marketplace built on the MERN stack (MongoDB, Express, Next.js, Node.js). Engineered with a luxury design system, dynamic animations, and enterprise-level security.

---

## 🎯 Architecture & Tech Stack

This project is divided into two primary workspaces:
1. **Backend Server (`/Back`)**: Node.js Express server with Mongoose ODM, JWT authentication, and automated email dispatch.
2. **Frontend Client (`/front`)**: Next.js App Router, Tailwind CSS v4 styling, Redux Toolkit for local/global state management, and RTK Query for backend API calls.

### Core Technologies
- **Backend**: Express v5, MongoDB & Mongoose, Winston Logging, Nodemailer SMTP, Stripe API, Socket.io, PDFKit.
- **Frontend**: Next.js v16, React v19, Tailwind CSS v4, Framer Motion, Lucide Icons, Recharts.
- **State Management**: Redux Toolkit & RTK Query.

---

## 🧠 Backend Enhancements & Security Audit

During a deep system audit and quality engineering phase, the following enhancements were implemented:

1. **Email Service Refactoring**: Fixed a critical parameter mismatch in `sendEmail.js` to support both object arguments `{ email, subject, html }` and positional arguments `(useremail, subject, htmlTemplet)`.
2. **Verified Purchases Enforcement**: Enforced that product reviews are restricted *only* to verified buyers who have purchased the item and had it successfully delivered (`orderStatus: "delivered"`). Unverified review attempts return a `400 Bad Request`.
3. **Automated Transaction Notifications**:
   - Integrated async email confirmations on checkout completion.
   - Integrated async email alerts to notify customers of order status updates (e.g. `processing` ➔ `shipped` ➔ `delivered` ➔ `cancelled`).
4. **Security Hardening**:
   - Helmet & CORS configuration.
   - Rate limiting on authentication APIs to prevent brute force.
   - NoSQL injection prevention via inputs sanitization.
   - Winston logger piping HTTP requests to local log cabinets.
   - JWT Access + HttpOnly Cookie Refresh token rotation with reuse detection (revokes all active sessions if an old refresh token is reused).
5. **Multi-Store Fulfillment**: A mixed-store checkout creates one linked order per seller. Shipping, tax, and redeemed loyalty points are allocated proportionally, with rounding remainder assigned deterministically so the child-order totals equal the checkout total. The order API returns both `orders` and the first-order `order` field for compatibility.

---

## 🎨 Frontend Redesign & UX Improvements

1. **Dynamic Hero Carousel**: Replaced static imagery with an interactive, animated carousel featuring private drops and seasonal collections with Framer Motion, manual indicators, and auto-play.
2. **Flash Sales Countdown & Deals**: Added a conversion-focused deals section showing discounted products (`comparePrice > price`) with a real-time countdown timer, stock availability bars, and claim actions.
3. **Personalized Recommendations**: Added a section based on local browser history (`localStorage`) displaying the user's recently viewed products, and trending fallbacks for new users.
4. **Interactive Hover Zoom**: Implemented a smooth hover-zoom magnifying effect on the main product details page.
5. **Silent Re-Authentication (RTK Query Interceptor)**: Added a custom `baseQueryWithReauth` middleware wrapper. When an access token expires (returning a `401`), the app automatically rotates the token in the background and retries the failed request transparently.
6. **New Authentication Pages**: Created Next.js pages for:
   - `/forgot-password`: Recover credentials via email.
   - `/reset-password`: Enter new passwords securely with reset tokens.
   - `/verify-email`: Capture URL verification tokens and validate profiles.

---

## ⚙️ Setup & Development Guide

### Prerequisites
- Node.js (v18+)
- MongoDB (Local instance or Atlas connection string)
- Gmail SMTP app password (for Nodemailer)
- Cloudinary credentials (for image hosting)

### 1. Backend Setup
1. Navigate to `/Back` and install dependencies:
   ```bash
   cd Back
   npm install
   ```
2. Configure `.env` variables:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/premium-ecommerce
   JWT_ACCESS_SECRET=your_access_token_secret
   JWT_REFRESH_SECRET=your_refresh_token_secret
   CLOUDINARY_NAME=your_cloudinary_name
   API_KEY=your_cloudinary_api_key
   API_SECRET_KEY=your_cloudinary_api_secret
   EMAIL_NAME=your_email@gmail.com
   EMAIL_APP_PASS=your_gmail_app_password
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=465
   EMAIL_SECURE=true
   FRONTEND_ORIGIN=http://localhost:3000
   ```
3. Run in development mode:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup
1. Navigate to `/front` and install dependencies:
   ```bash
   cd ../front
   npm install
   ```
2. Configure `.env.local` variables:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```
3. Run Next.js in development mode:
   ```bash
   npm run dev
   ```

### 3. Vercel Production Configuration

Deploy the backend and frontend as separate Vercel projects:

- Set the backend project's Root Directory to `Back`; its `vercel.json` routes API and health requests to the Express app.
- Set the frontend project's Root Directory to `front`.
- Configure these environment variables in the backend project:
  - `MONGO_URI`: production MongoDB connection string.
  - `FRONTEND_ORIGIN`: public HTTPS frontend origin, without a path. Multiple allowed origins may be comma-separated.
- Configure these environment variables in the frontend project:
  - `NEXT_PUBLIC_API_URL`: public HTTPS backend URL, preferably ending in `/api`.
  - `NEXT_PUBLIC_SITE_URL`: public HTTPS frontend origin, without a path.

The frontend build rejects missing or non-public production URLs. The backend health endpoints (`/health` and `/api/health`) verify MongoDB connectivity and return `503` when the database is unavailable. Confirm the MongoDB provider's network access rules permit the deployed backend to connect; do not commit connection strings or widen database access unnecessarily.

The repository cannot verify Vercel project/root-directory settings, deployment status, environment variable values, or MongoDB network access. If a Vercel domain still returns a platform-level `404`, verify that the domain is attached to the project using the expected repository and Root Directory, then redeploy.

### 4. Docker Compose Setup
To spin up the entire stack (Database + Backend + Frontend) in containerized environments:
```bash
docker-compose up --build
```

### 5. Existing MongoDB inventory reservations

The backend releases expired reservations transactionally; MongoDB TTL deletion must not remove reservation records first. Before deploying this change to an existing database, reconcile `WarehouseInventory.reservedStock` against its reservation records, then manually replace the old `stockreservations` indexes:

```javascript
db.stockreservations.dropIndex("expiresAt_1")
db.stockreservations.dropIndex("cartId_1_sku_1")
db.stockreservations.createIndex({ expiresAt: 1 })
db.stockreservations.createIndex(
  { cartId: 1, sku: 1, warehouse: 1 },
  { unique: true }
)
```

Do not run this as an automatic startup migration. Existing TTL indexes may already have deleted expired reservation records without releasing their reserved stock, so reconcile inventory before changing indexes. New installations create the non-TTL expiry index and the compound reservation key from the model.

---

## 🧪 Verification & Tests

### Backend Tests
Execute unit and API integration tests:
```bash
cd Back
npm test
```

### Frontend Build
Compile the Next.js production bundle:
```bash
cd front
npm run build
```
