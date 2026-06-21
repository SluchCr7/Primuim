const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const morgan = require("morgan");
const logger = require("./config/logger");
const { errorhandler } = require("./Middelwares/errorHandler");
const { notfound } = require("./Middelwares/errorHandler");
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

const app = express();

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
        origin: process.env.FRONTEND_ORIGIN ? process.env.FRONTEND_ORIGIN.split(",") : true,
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
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(mongoSanitize());
app.use(cookieParser());

// Routes
app.get("/", (req, res) => {
    // Build the absolute path to index.html inside the public folder and send it to the client
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        status: "ok",
        uptime: process.uptime()
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
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
app.use("/api/articles" , require("./Routers/ArticleRoute"));
app.use("/api/sellers", require("./Routers/sellerRoutes"));
app.use("/api/superadmin", require("./Routers/superAdminRoutes"));
app.use("/api/testimonials", require("./Routers/TestimoialRoutes"));
app.use(notfound);
app.use(errorhandler);

const port = process.env.PORT || 5000;

// دالة بدء تشغيل السيرفر بعد ضمان اتصال قاعدة البيانات
const startServer = async () => {
    try {
        // 1. الاتصال بقاعدة البيانات أولاً
        await connectDB();
        
        // 2. تشغيل السيرفر للاستماع للطلبات بعد نجاح الاتصال
        app.listen(port, () => {
            console.log(`Server is running successfully on port ${port}`);
        });
    } catch (error) {
        console.error("Failed to start the server due to DB connection error:", error);
        process.exit(1); // إنهاء العملية إذا فشل الاتصال الحرج
    }
};

// استدعاء الدالة لتشغيل التطبيق
startServer();

module.exports = app;