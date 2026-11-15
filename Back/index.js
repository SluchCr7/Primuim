const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const path = require("path");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const morgan = require("morgan");
const logger = require("./config/logger");
const { errorhandler } = require("./Middelwares/errorHandler");
const { notfound } = require("./Middelwares/errorHandler");
const { swaggerUi, specs } = require('./swagger');
const mongoose = require("mongoose");
const mongoSanitize = () => (req, res, next) => {
  const sanitizeInput = (obj) => {
    if (obj && typeof obj === "object") {
      for (const key in obj) {
        if (key.startsWith("$") || key.includes(".")) {
          delete obj[key];
        } else {
          sanitizeInput(obj[key]);
        }
      }
    }
    return obj;
  };
  if (req.body) sanitizeInput(req.body);
  if (req.query) sanitizeInput(req.query);
  if (req.params) sanitizeInput(req.params);
  next();
};
const authRoutes = require("./Routers/authRoutes");
const userRoutes = require("./Routers/userRoutes");
const productRoutes = require("./Routers/productRoutes");
const cartRoutes = require("./Routers/cartRoutes");
const orderRoutes = require("./Routers/orderRoutes");
const paymentRoutes = require("./Routers/paymentRoutes");
const discountRoutes = require("./Routers/discountRoutes");
const adminRoutes = require("./Routers/adminRoutes");
const categoryRoutes = require("./Routers/categoryRoutes");
const checkoutRoutes = require("./Routers/checkoutRoutes");
const reviewRoutes = require("./Routers/reviewRoutes");
const analyticsRoutes = require("./Routers/analyticsRoutes");
const currencyRoutes = require("./Routers/currencyRoutes");
const loyaltyRoutes = require("./Routers/loyaltyRoutes");
const inventoryRoutes = require("./Routers/inventoryRoutes");

const app = express();
app.set("trust proxy", 1);

// HTTP request logger piped to Winston
const morganFormat = process.env.NODE_ENV === "production" ? "combined" : "dev";
app.use(
    morgan(morganFormat, {
        stream: {
            write: (message) => logger.info(message.trim())
        }
    })
);

// Middleware
app.use(helmet());
app.use(
    cors({
        origin: (origin, callback) => {
            const configuredOrigins = process.env.FRONTEND_ORIGIN
                ? process.env.FRONTEND_ORIGIN
                    .split(",")
                    .map((value) => value.trim())
                    .filter(Boolean)
                    .map((value) => new URL(value).origin)
                : [];
            const allowedOrigins = configuredOrigins.length
                ? configuredOrigins
                : process.env.NODE_ENV === "production"
                    ? []
                    : ["http://localhost:3000"];

            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(new Error("Origin is not allowed by CORS"));
        },
        credentials: true
    })
);
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,
    standardHeaders: true,
    legacyHeaders: false
}));

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 15, // Max 15 requests
    message: { message: "Too many login or authentication requests. Please try again after 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);
app.use("/api/auth/reset-password", authLimiter);
app.use("/api/auth/otp/send", authLimiter);
app.use("/api/auth/otp/verify", authLimiter);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(mongoSanitize());
app.use(cookieParser());
app.use('/images', express.static(path.join(__dirname, 'images')));
// Routes
app.get("/", (req, res) => {
    // Build the absolute path to index.html inside the public folder and send it to the client
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

const healthCheck = async (req, res) => {
    const states = {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting",
    };

    try {
        await connectDB();
        await mongoose.connection.db.admin().ping();

        return res.status(200).json({
            success: true,
            server: "running",
            database: "connected",
            readyState: mongoose.connection.readyState,
            uptime: process.uptime(),
        });
    } catch (error) {
        logger.error(`Health check database connection failed: ${error?.name || "ConnectionError"}`);
        return res.status(503).json({
            success: false,
            server: "running",
            database: states[mongoose.connection.readyState] || "unknown",
            readyState: mongoose.connection.readyState,
            uptime: process.uptime(),
        });
    }
};

app.get("/health", healthCheck);
app.get("/api/health", healthCheck);

app.use("/api", async (req, res, next) => {
    try {
        await connectDB();
        return next();
    } catch (error) {
        logger.error(`API request rejected because MongoDB is unavailable: ${error?.name || "ConnectionError"}`);
        return res.status(503).json({
            success: false,
            message: "Database unavailable",
        });
    }
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", require("./Routers/notificationRoutes"));
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/discounts", discountRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/currency", currencyRoutes);
app.use("/api/loyalty", loyaltyRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/articles" , require("./Routers/ArticleRoute"));
app.use("/api/sellers", require("./Routers/sellerRoutes"));
app.use("/api/superadmin", require("./Routers/superAdminRoutes"));
app.use("/api/testimonials", require("./Routers/TestimoialRoutes"));
app.use("/api/upload", require("./Routers/uploadRoutes"));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
app.use(notfound);
app.use(errorhandler);

const port = process.env.PORT || 5000;

// دالة بدء تشغيل السيرفر بعد ضمان اتصال قاعدة البيانات
const startServer = async () => {
    try {
        // 1. الاتصال بقاعدة البيانات أولاً
        await connectDB();
        
        // 2. تشغيل السيرفر للاستماع للطلبات بعد نجاح الاتصال
        const server = app.listen(port, () => {
            console.log(`Server is running successfully on port ${port}`);
        });

        // 3. تهيئة Socket.io
        const socketUtil = require("./utils/socket");
        socketUtil.init(server);

        // 4. Start Background Cleanups for Inventory Reservations & Expired Loyalty Points
        const { releaseExpiredReservations } = require("./utils/inventoryService");
        const { processExpiredPoints } = require("./utils/loyaltyService");
        
        setInterval(async () => {
            try {
                await releaseExpiredReservations();
                await processExpiredPoints();
            } catch (err) {
                logger.error(`Background inventory/loyalty cleanup failed: ${err?.name || "Error"}`);
            }
        }, 60 * 1000);
    } catch (error) {
        logger.error(`Failed to start the server due to a database connection error: ${error?.name || "Error"}`);
        process.exit(1); // إنهاء العملية إذا فشل الاتصال الحرج
    }
};

// استدعاء الدالة لتشغيل التطبيق
if (require.main === module) {
    startServer();
}

module.exports = app;