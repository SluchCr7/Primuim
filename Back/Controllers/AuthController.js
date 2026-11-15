const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const RefreshToken = require("../models/RefreshTOken");
const {
  generateAccessToken,
  generateRefreshToken
} = require("../Middelwares/TokenGenerator");
const {
  User,
  validateRegisterUser,
  validateLoginUser,
  validateResetPassword
} = require("../models/User");
const Verification = require("../models/VerificationToken");
const sendEmail = require("../utils/sendEmail");
const SellerRequest = require("../models/SellerRequest");

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,            // must be true on HTTPS
  sameSite: "lax",                 // Lax is best practice when proxying via Next.js rewrites (same-origin to browser)
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

const hashRefreshToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const getFrontendOrigin = () => {
  const configuredOrigin = process.env.FRONTEND_ORIGIN?.split(",")[0].trim();
  if (!configuredOrigin) {
    if (isProduction) {
      throw new Error("FRONTEND_ORIGIN is required to send account links in production.");
    }
    return "http://localhost:3000";
  }

  const origin = new URL(configuredOrigin);
  if (
    isProduction &&
    (origin.protocol !== "https:" ||
      ["localhost", "127.0.0.1", "::1"].includes(origin.hostname))
  ) {
    throw new Error("FRONTEND_ORIGIN must use a public HTTPS URL in production.");
  }
  return origin.origin;
};


const register = asyncHandler(async (req, res) => {
  const { error, value } = validateRegisterUser(req.body);

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
    storeAddress,
    storeLogo,
    storeCover,
    phone
  } = value;
  const emailExists = await User.findOne({ email });

  if (emailExists) {
    return res.status(400).json({ message: "Email already exists" });
  }   

  let referredByUser = null;
  if (referredByCode && referredByCode.trim() !== "") {
    referredByUser = await User.findOne({ referralCode: referredByCode.trim().toUpperCase() });
  }

  const user = await User.create({
    username,
    email,
    password,
    referredBy: referredByUser ? referredByUser._id : null,
    role: role === "seller" ? "seller" : "customer",
    phone: phone || "",
    brandName: role === "seller" ? brandName : "",
    storeName: role === "seller" ? storeName : "",
    country: role === "seller" ? country : "",
    storeDescription: role === "seller" ? storeDescription : "",
    storePhone: role === "seller" ? phone : "",
    storeAddress: role === "seller" ? storeAddress : "",
    storeLogo: role === "seller" && storeLogo ? storeLogo : "",
    storeCover: role === "seller" && storeCover ? storeCover : "",
    sellerStatus: role === "seller" ? "pending" : null
  });

  // If registering as seller, automatically create a SellerRequest document
  // so the admin can see and approve/reject it from the admin panel
  if (role === "seller") {
    try {
      await SellerRequest.create({
        user: user._id,
        storeName,
        storeDescription,
        storePhone: phone,
        storeAddress,
        status: "pending"
      });
    } catch (sellerReqErr) {
      await User.deleteOne({ _id: user._id });
      throw sellerReqErr;
    }
  }

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
  const verifyUrl = `${getFrontendOrigin()}/verify-email?id=${user._id}&token=${tokenVer}`;

  await sendEmail({
    email: user.email,
    subject: "🔒 Activate Your Shop Premium Account",
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #fff;">
        
        <!-- Header / Logo Area -->
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #111; font-size: 26px; font-weight: 700; margin: 0; letter-spacing: 1px;">SHOP PREMIUM</h1>
          <p style="color: #666; font-size: 14px; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 2px;">Elevate Your Experience</p>
        </div>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin-bottom: 30px;" />
        
        <!-- Body Content -->
        <div style="padding: 0 10px;">
          <h2 style="color: #222; font-size: 20px; font-weight: 600; margin-top: 0;">Welcome aboard, ${user.username}! ✨</h2>
          
          <p style="color: #444; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
            Thank you for joining <strong>Shop Premium</strong>. We're thrilled to have you with us. To unlock your exclusive access and start exploring premium deals, please verify your email address.
          </p>
          
          <!-- CTA Button -->
          <div style="text-align: center; margin: 35px 0;">
            <a href="${verifyUrl}" style="background-color: #000; color: #fff; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.5; margin-bottom: 10px;">
            This verification link is valid for a limited time. If the button above doesn't work, please copy and paste the following URL into your browser:
          </p>
          
          <!-- Fallback URL -->
          <div style="background-color: #f9f9f9; padding: 12px; border-radius: 6px; word-break: break-all; margin-bottom: 30px;">
            <a href="${verifyUrl}" style="color: #0066cc; font-size: 13px; text-decoration: none;">${verifyUrl}</a>
          </div>
        </div>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin-bottom: 20px;" />
        
        <!-- Footer -->
        <div style="text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0 0 5px 0;">
            If you didn't create an account, you can safely ignore this email.
          </p>
          <p style="color: #999; font-size: 12px; margin: 0;">
            &copy; ${new Date().getFullYear()} Shop Premium. All rights reserved.
          </p>
        </div>
        
      </div>
    `
  });

  res.status(201).json({
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      sellerStatus: user.sellerStatus || null
    }
  });
});

// const login = asyncHandler(async (req, res) => {
//   const { email, password } = req.body;

//   const { error } = validateLoginUser({ email, password });

//   if (error) {
//     return res.status(400).json({ message: error.details[0].message });
//   }

//   const user = await User.findOne({ email }).select("+password");

//   if (!user) {
//     return res.status(401).json({ message: "Invalid credentials" });
//   }

//   // Account Locking check
//   if (user.lockUntil && user.lockUntil > Date.now()) {
//     const timeRemaining = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
//     return res.status(403).json({
//       message: `Account is temporarily locked. Try again in ${timeRemaining} minutes.`
//     });
//   }

//   const isMatch = await bcrypt.compare(password, user.password);

//   if (!isMatch) {
//     // Increment failed attempts
//     user.failedLoginAttempts += 1;
//     if (user.failedLoginAttempts >= 5) {
//       user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lockout
//       user.activityLogs.push({
//         action: "account_locked",
//         ip: req.ip,
//         details: "Account locked due to 5 failed login attempts."
//       });
//     } else {
//       user.activityLogs.push({
//         action: "failed_login_attempt",
//         ip: req.ip,
//         details: `Failed attempt ${user.failedLoginAttempts} of 5.`
//       });
//     }
//     await user.save();
//     return res.status(401).json({ message: "Invalid credentials" });
//   }

//   // Reset login locking & attempts
//   user.failedLoginAttempts = 0;
//   user.lockUntil = undefined;
//   user.lastLogin = new Date();

//   // Save history
//   const device = req.headers["user-agent"] || "unknown";
//   user.loginHistory.push({
//     ip: req.ip,
//     device,
//     loginAt: new Date()
//   });

//   user.activityLogs.push({
//     action: "login",
//     ip: req.ip,
//     details: `Successfully logged in via ${device}.`
//   });

//   await user.save();

//   const accessToken = generateAccessToken(user);
//   const refreshToken = generateRefreshToken(user);

//   await RefreshToken.create({
//     user: user._id,
//     token: hashRefreshToken(refreshToken),
//     expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
//   });

//   res.cookie("refreshToken", refreshToken, cookieOptions);

//   res.json({
//     accessToken,
//     user: {
//       id: user._id,
//       username: user.username,
//       email: user.email,
//       role: user.role
//     }
//   });
// });


const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { error, value } = validateLoginUser({ email, password });

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  // ملحوظة: تأكدت هنا إننا بنجيب الـ isVerify لو مش نازلة باي ديفولت في الـ Schema
  const user = await User.findOne({ email: value.email }).select("+password");

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

  const isMatch = await bcrypt.compare(value.password, user.password);

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

  if (user.isBlocked) {
    return res.status(403).json({ message: "This account is blocked." });
  }

  // ==================== التعديل الجديد هنا ====================
  // الفحص: هل الحساب مفعل؟ (استخدمنا نفس الـ Property اللي في الـ verifyAccount وهي isVerify)
  if (!user.isVerify) {
    // 1. مسح أي توكن تفعيل قديم للمستخدم ده عشان ميبقاش فيه زحمة في الـ DB
    await Verification.deleteOne({ userId: user._id });

    // 2. توليد توكن تفعيل جديد
    const tokenVer = crypto.randomBytes(32).toString("hex");
    await Verification.create({
      userId: user._id,
      tokenVer
    });

    // 3. تجهيز رابط التفعيل (نفس اللي عملته في الـ register)
    const verifyUrl = `${getFrontendOrigin()}/verify-email?id=${user._id}&token=${tokenVer}`;

    // 4. إرسال الإيميل
    await sendEmail({
      email: user.email,
      subject: "🔒 Activate Your Shop Premium Account",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #fff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #111; font-size: 26px; font-weight: 700; margin: 0; letter-spacing: 1px;">SHOP PREMIUM</h1>
            <p style="color: #666; font-size: 14px; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 2px;">Elevate Your Experience</p>
          </div>
          <hr style="border: 0; border-top: 1px solid #eee; margin-bottom: 30px;" />
          <div style="padding: 0 10px;">
            <h2 style="color: #222; font-size: 20px; font-weight: 600; margin-top: 0;">Welcome back, ${user.username}! ✨</h2>
            <p style="color: #444; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              Your account is not activated yet. Please click the button below to verify your email address and unlock your account.
            </p>
            <div style="text-align: center; margin: 35px 0;">
              <a href="${verifyUrl}" style="background-color: #000; color: #fff; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                Verify Email Address
              </a>
            </div>
            <div style="background-color: #f9f9f9; padding: 12px; border-radius: 6px; word-break: break-all; margin-bottom: 30px;">
              <a href="${verifyUrl}" style="color: #0066cc; font-size: 13px; text-decoration: none;">${verifyUrl}</a>
            </div>
          </div>
        </div>
      `
    });

    // 5. الرد على الـ Frontend بـ 403 ورسالة واضحة مع إرجاع flag يسهل على الفرونت إظهار زرار إعادة الإرسال لو احتاج
    return res.status(403).json({
      isVerified: false,
      message: "Your account is not verified. A new verification link has been sent to your email."
    });
  }
  // ==========================================================

  // Reset login locking & attempts (يكمل عادي لو الحساب مفعل)
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
      role: user.role,
      sellerStatus: user.sellerStatus || null
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
  const user = await User.findById(decoded.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if ((decoded.tokenVersion || 0) !== (user.tokenVersion || 0)) {
    res.clearCookie("refreshToken", cookieOptions);
    return res.status(401).json({ message: "Session expired. Please sign in again." });
  }

  // Token rotation
  if (!user.isVerify || user.isBlocked) {
    await RefreshToken.deleteOne({ token: hashedToken });
    res.clearCookie("refreshToken", cookieOptions);
    return res.status(403).json({
      message: user.isBlocked ? "This account is blocked." : "Please verify your email before signing in."
    });
  }

  const storedToken = await RefreshToken.findOneAndDelete({
    token: hashedToken,
    user: user._id
  });
  if (!storedToken) {
    await RefreshToken.deleteMany({ user: user._id });
    await User.updateOne(
      { _id: user._id },
      {
        $inc: { tokenVersion: 1 },
        $push: {
          activityLogs: {
            action: "security_alert",
            ip: req.ip,
            details: "Refresh token reuse detected. Revoked all sessions."
          }
        }
      }
    );
    res.clearCookie("refreshToken", cookieOptions);
    return res.status(403).json({ message: "Security warning: Refresh token reuse detected. All sessions revoked." });
  }

  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  await RefreshToken.create({
    user: user._id,
    token: hashRefreshToken(newRefreshToken),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  res.cookie("refreshToken", newRefreshToken, cookieOptions);

  res.json({
    accessToken: newAccessToken,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      sellerStatus: user.sellerStatus || null
    }
  });
});

const logout = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;

  if (token) {
    await RefreshToken.deleteOne({ token: hashRefreshToken(token) });
  }

  // Must pass the same options used when setting the cookie, otherwise the
  // browser will ignore the clear instruction (especially sameSite/secure).
  res.clearCookie("refreshToken", {
    httpOnly: cookieOptions.httpOnly,
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
    path: cookieOptions.path,
  });

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
  if (typeof email !== "string" || !email.trim()) {
    return res.status(400).json({ message: "Email is required" });
  }

  const responseMessage = "If your email is registered, we have sent a reset link.";
  const user = await User.findOne({ email: email.trim().toLowerCase() });
  if (!user) {
    return res.status(200).json({ message: responseMessage });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

  await user.save();

  const resetUrl = `${getFrontendOrigin()}/reset-password?token=${resetToken}`;
  
  await sendEmail({
    email: user.email,
    subject: "🔒 Reset Your Shop Premium Password",
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #fff;">
        
        <!-- Header / Logo Area -->
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #111; font-size: 26px; font-weight: 700; margin: 0; letter-spacing: 1px;">SHOP PREMIUM</h1>
          <p style="color: #666; font-size: 14px; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 2px;">Securing Your Account</p>
        </div>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin-bottom: 30px;" />
        
        <!-- Body Content -->
        <div style="padding: 0 10px;">
          <h2 style="color: #222; font-size: 20px; font-weight: 600; margin-top: 0;">Password Reset Request 🔐</h2>
          
          <p style="color: #444; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
            We received a request to reset the password for your <strong>Shop Premium</strong> account. No changes have been made yet. You can set your new password by clicking the secure button below:
          </p>
          
          <!-- CTA Button -->
          <div style="text-align: center; margin: 35px 0;">
            <a href="${resetUrl}" style="background-color: #000; color: #fff; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
              Reset Password
            </a>
          </div>
          
          <!-- Urgency & Security Note -->
          <div style="background-color: #fff9e6; border-left: 4px solid #ffcc00; padding: 15px; border-radius: 4px; margin-bottom: 25px;">
            <p style="color: #7a5c00; font-size: 14px; margin: 0; font-weight: 500;">
              ⏳ For security purposes, this link is highly time-sensitive and will expire in <strong>10 minutes</strong>.
            </p>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.5; margin-bottom: 10px;">
            If the button doesn't work, please copy and paste this URL into your browser:
          </p>
          
          <!-- Fallback URL -->
          <div style="background-color: #f9f9f9; padding: 12px; border-radius: 6px; word-break: break-all; margin-bottom: 30px;">
            <a href="${resetUrl}" style="color: #0066cc; font-size: 13px; text-decoration: none;">${resetUrl}</a>
          </div>
        </div>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin-bottom: 20px;" />
        
        <!-- Footer -->
        <div style="text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0 0 5px 0;">
            If you didn't request a password reset, you can safely ignore this email; your account remains secure.
          </p>
          <p style="color: #999; font-size: 12px; margin: 0;">
            &copy; ${new Date().getFullYear()} Shop Premium. All rights reserved.
          </p>
        </div>
        
      </div>
      `
  });
  res.status(200).json({ message: responseMessage });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { error, value } = validateResetPassword(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const hashedToken = crypto.createHash("sha256").update(value.token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired reset token" });
  }

  const passwordHash = await bcrypt.hash(value.newPassword, 12);
  const updateResult = await User.updateOne(
    {
      _id: user._id,
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() }
    },
    {
      $set: { password: passwordHash, failedLoginAttempts: 0 },
      $unset: { passwordResetToken: 1, passwordResetExpires: 1, lockUntil: 1 },
      $inc: { tokenVersion: 1 },
      $push: {
        activityLogs: {
          action: "password_reset",
          ip: req.ip,
          details: "Password was reset successfully via email link."
        }
      }
    },
    { runValidators: true }
  );
  if (updateResult.modifiedCount !== 1) {
    return res.status(400).json({ message: "Invalid or expired reset token" });
  }
  await RefreshToken.deleteMany({ user: user._id });

  res.status(200).json({ success: true, message: "Password reset successful." });
});

const sendOTP = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const otp = crypto.randomInt(100000, 1000000).toString();
  
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