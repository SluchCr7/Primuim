const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const RefreshToken = require("../models/RefreshTOken");
const {
  generateAccessToken,
  generateRefreshToken
} = require("../Middelwares/TokenGenerator");
const { User, validateRegisterUser, validateLoginUser } = require("../models/User");
const Verification = require("../models/VerificationToken");
const sendEmail = require("../utils/sendEmail");

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

const hashRefreshToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");


const register = asyncHandler(async (req, res) => {
  const { error } = validateRegisterUser(req.body);

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const {
    username,
    email,
    password,
    referredByCode,
    role,
    brandName,
    storeName,
    country,
    storeDescription,
    storeLogo,
    storeCover,
    phone
  } = req.body;
  const emailExists = await User.findOne({ email });

  if (emailExists) {
    return res.status(400).json({ message: "Email already exists" });
  }   

  let referredByUser = null;
  if (referredByCode) {
    referredByUser = await User.findOne({ referralCode: referredByCode.toUpperCase() });
  }

  const user = await User.create({
    username,
    email,
    password,
    referredBy: referredByUser ? referredByUser._id : null,
    role: role || "customer",
    phone: phone || "",
    brandName: role === "seller" ? brandName : "",
    storeName: role === "seller" ? storeName : "",
    country: role === "seller" ? country : "",
    storeDescription: role === "seller" ? storeDescription : "",
    storeLogo: role === "seller" ? (storeLogo ? { url: storeLogo } : undefined) : undefined,
    storeCover: role === "seller" ? (storeCover ? { url: storeCover } : undefined) : undefined,
    sellerStatus: role === "seller" ? "pending" : null
  });

  // Award referral reward points if referred
  if (referredByUser) {
    referredByUser.loyaltyPoints += 50; // 50 reward points for referring
    referredByUser.activityLogs.push({
      action: "referral_bonus",
      details: `Referred user ${user.username}. Earned 50 points.`
    });
    await referredByUser.save();

    user.loyaltyPoints += 25; // 25 points for signing up via referral
    user.activityLogs.push({
      action: "referral_signup",
      details: `Signed up via referral code ${referredByCode}. Earned 25 points.`
    });
    await user.save();
  }

  // Account verification token
  const tokenVer = crypto.randomBytes(32).toString("hex");
  await Verification.create({
    userId: user._id,
    tokenVer
  });

  // Send email
  const verifyUrl = `${process.env.FRONTEND_ORIGIN || "http://localhost:3000"}/verify-email?id=${user._id}&token=${tokenVer}`;
  await sendEmail({
    email: user.email,
    subject: "Verify your email - Shop Premium",
    html: `
      <h1>Welcome to Shop Premium</h1>
      <p>Hi ${user.username},</p>
      <p>Please verify your account by clicking the link below:</p>
      <a href="${verifyUrl}" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
      <p>Or copy and paste this URL into your browser:</p>
      <p>${verifyUrl}</p>
    `
  });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await RefreshToken.create({
    user: user._id,
    token: hashRefreshToken(refreshToken),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  res.cookie("refreshToken", refreshToken, cookieOptions);

  res.status(201).json({
    accessToken,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    }
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { error } = validateLoginUser({ email, password });

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // Account Locking check
  if (user.lockUntil && user.lockUntil > Date.now()) {
    const timeRemaining = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
    return res.status(403).json({
      message: `Account is temporarily locked. Try again in ${timeRemaining} minutes.`
    });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    // Increment failed attempts
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= 5) {
      user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lockout
      user.activityLogs.push({
        action: "account_locked",
        ip: req.ip,
        details: "Account locked due to 5 failed login attempts."
      });
    } else {
      user.activityLogs.push({
        action: "failed_login_attempt",
        ip: req.ip,
        details: `Failed attempt ${user.failedLoginAttempts} of 5.`
      });
    }
    await user.save();
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // Reset login locking & attempts
  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  user.lastLogin = new Date();

  // Save history
  const device = req.headers["user-agent"] || "unknown";
  user.loginHistory.push({
    ip: req.ip,
    device,
    loginAt: new Date()
  });

  user.activityLogs.push({
    action: "login",
    ip: req.ip,
    details: `Successfully logged in via ${device}.`
  });

  await user.save();

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await RefreshToken.create({
    user: user._id,
    token: hashRefreshToken(refreshToken),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  res.cookie("refreshToken", refreshToken, cookieOptions);

  res.json({
    accessToken,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    }
  });
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return res.status(401).json({ message: "No refresh token" });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    return res.status(401).json({ message: "Invalid refresh token signature" });
  }

  const hashedToken = hashRefreshToken(token);
  const storedToken = await RefreshToken.findOne({ token: hashedToken });

  if (!storedToken) {
    // REUSE DETECTION!
    // Someone is trying to refresh with an old/used token. Revoke all sessions!
    await RefreshToken.deleteMany({ user: decoded.id });
    res.clearCookie("refreshToken");
    
    // Log security incident
    const user = await User.findById(decoded.id);
    if (user) {
      user.activityLogs.push({
        action: "security_alert",
        ip: req.ip,
        details: "Refresh token reuse detected. Revoked all sessions."
      });
      await user.save();
    }
    
    return res.status(403).json({ message: "Security warning: Refresh token reuse detected. All sessions revoked." });
  }

  const user = await User.findById(decoded.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Token rotation
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  await RefreshToken.deleteOne({ token: hashedToken });

  await RefreshToken.create({
    user: user._id,
    token: hashRefreshToken(newRefreshToken),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  res.cookie("refreshToken", newRefreshToken, cookieOptions);

  res.json({
    accessToken: newAccessToken
  });
});

const logout = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;

  if (token) {
    await RefreshToken.deleteOne({ token: hashRefreshToken(token) });
  }

  res.clearCookie("refreshToken");

  res.json({ message: "Logged out successfully" });
});

const verifyAccount = asyncHandler(async (req, res) => {
  const { id, token } = req.params;

  const user = await User.findById(id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const verificationToken = await Verification.findOne({ userId: user._id, tokenVer: token });
  if (!verificationToken) {
    res.status(404);
    throw new Error('Verification token not found or expired');
  }

  user.isVerify = true;
  user.verifyAt = Date.now();
  
  user.activityLogs.push({
    action: "email_verified",
    ip: req.ip,
    details: "Account marked verified after verifying link."
  });

  await user.save();

  await Verification.findByIdAndDelete(verificationToken._id);

  res.status(200).json({ message: 'Email verified successfully' });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(200).json({ message: "If your email is registered, we have sent a reset link." });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

  await user.save();

  const resetUrl = `${process.env.FRONTEND_ORIGIN || "http://localhost:3000"}/reset-password?token=${resetToken}`;
  
  await sendEmail({
    email: user.email,
    subject: "Reset Password - Shop Premium",
    html: `
      <h1>Password Reset Request</h1>
      <p>You requested a password reset. Please click the button below to set a new password:</p>
      <a href="${resetUrl}" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
      <p>This link will expire in 10 minutes.</p>
    `
  });

  res.status(200).json({ message: "Reset link sent successfully." });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: "Token and new password are required" });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters long" });
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired reset token" });
  }

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  
  user.activityLogs.push({
    action: "password_reset",
    ip: req.ip,
    details: "Password was reset successfully via email link."
  });

  await user.save();

  res.status(200).json({ success: true, message: "Password reset successful." });
});

const sendOTP = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  user.otpSecret = crypto.createHash("sha256").update(otp).digest("hex");
  user.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 mins valid

  await user.save();

  await sendEmail({
    email: user.email,
    subject: "Your OTP Verification Code - Shop Premium",
    html: `<h3>Your Verification Code is:</h3><h1>${otp}</h1><p>It is valid for 5 minutes.</p>`
  });

  res.status(200).json({ success: true, message: "OTP sent successfully." });
});

const verifyOTP = asyncHandler(async (req, res) => {
  const { otp } = req.body;
  if (!otp) {
    return res.status(400).json({ message: "OTP is required" });
  }

  const user = await User.findById(req.user.id).select("+otpSecret");
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (!user.otpExpires || user.otpExpires < Date.now()) {
    return res.status(400).json({ message: "OTP has expired" });
  }

  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
  if (hashedOtp !== user.otpSecret) {
    return res.status(400).json({ message: "Invalid OTP code" });
  }

  user.isVerify = true;
  user.verifyAt = new Date();
  user.otpSecret = undefined;
  user.otpExpires = undefined;
  
  user.activityLogs.push({
    action: "otp_verify",
    ip: req.ip,
    details: "OTP verification completed successfully."
  });

  await user.save();

  res.status(200).json({ success: true, message: "OTP verified successfully. Account marked as verified." });
});

const toggle2FA = asyncHandler(async (req, res) => {
  const { enable } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  user.is2FAEnabled = !!enable;
  user.activityLogs.push({
    action: enable ? "2fa_enabled" : "2fa_disabled",
    ip: req.ip,
    details: `Two-factor authentication ${enable ? "enabled" : "disabled"}.`
  });
  await user.save();

  res.status(200).json({ success: true, is2FAEnabled: user.is2FAEnabled });
});

const socialLogin = asyncHandler(async (req, res) => {
  const { provider, email, name, id } = req.body;

  if (!provider || !email || !id) {
    return res.status(400).json({ message: "Missing social login payload" });
  }

  let user = await User.findOne({ email });

  if (!user) {
    const dummyPassword = crypto.randomBytes(16).toString("hex") + "!1aA"; 
    user = await User.create({
      username: name || email.split("@")[0],
      email,
      password: dummyPassword,
      isVerify: true,
      verifyAt: new Date()
    });
    
    user.activityLogs.push({
      action: "social_register",
      ip: req.ip,
      details: `Registered via ${provider} OAuth integration.`
    });
  } else {
    user.activityLogs.push({
      action: "social_login",
      ip: req.ip,
      details: `Logged in via ${provider} OAuth integration.`
    });
  }

  user.lastLogin = new Date();
  await user.save();

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await RefreshToken.create({
    user: user._id,
    token: hashRefreshToken(refreshToken),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  res.cookie("refreshToken", refreshToken, cookieOptions);

  res.status(200).json({
    accessToken,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    }
  });
});

module.exports = {
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
};