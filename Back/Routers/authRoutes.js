const express = require("express");
const router = express.Router();

const {
  register,
  login,
  refresh,
  logout,
  verifyAccount,
  forgotPassword,
  resetPassword,
  sendOTP,
  verifyOTP,
  toggle2FA,
  socialLogin
} = require("../Controllers/AuthController");
const { verifyToken } = require("../Middelwares/verifyToken");

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/verify/:id/:token", verifyAccount);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/social-login", socialLogin);

// Protected Auth Routes
router.post("/otp/send", verifyToken, sendOTP);
router.post("/otp/verify", verifyToken, verifyOTP);
router.post("/2fa/toggle", verifyToken, toggle2FA);

module.exports = router;