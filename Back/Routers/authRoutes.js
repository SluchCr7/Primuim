const express = require("express");
const router  = express.Router();

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
  socialLogin,
} = require("../Controllers/AuthController");
const { verifyToken } = require("../Middelwares/verifyToken");

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication & Authorization
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201:
 *         description: Account created successfully. Verification email sent.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Validation error or email already in use.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/register", register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email & password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Login successful. Returns access token and user object. Refresh token set as HttpOnly cookie.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthTokenResponse'
 *       401:
 *         description: Invalid credentials.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Account is blocked or not verified.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/login", login);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token using HttpOnly refresh-token cookie
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: New access token issued.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:     { type: boolean, example: true }
 *                 accessToken: { type: string, example: 'eyJhbGci...' }
 *       401:
 *         description: Missing or expired refresh token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/refresh", refresh);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout and clear the refresh-token cookie
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post("/logout", logout);

/**
 * @swagger
 * /api/auth/verify/{id}/{token}:
 *   get:
 *     summary: Verify email address via link sent in registration email
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ObjectId
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Email verification token
 *     responses:
 *       200:
 *         description: Email verified successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid or expired token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/verify/:id/:token", verifyAccount);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request a password-reset link via email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordInput'
 *     responses:
 *       200:
 *         description: Reset link sent to email (if the account exists).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post("/forgot-password", forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using token received via email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordInput'
 *     responses:
 *       200:
 *         description: Password reset successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid or expired token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/reset-password", resetPassword);

/**
 * @swagger
 * /api/auth/social-login:
 *   post:
 *     summary: Authenticate using a Google or Facebook OAuth token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SocialLoginInput'
 *     responses:
 *       200:
 *         description: Social login successful.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthTokenResponse'
 *       400:
 *         description: Invalid provider token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/social-login", socialLogin);

/**
 * @swagger
 * /api/auth/otp/send:
 *   post:
 *     summary: Send a one-time password (OTP) to the authenticated user's phone or email
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OTP sent successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/otp/send", verifyToken, sendOTP);

/**
 * @swagger
 * /api/auth/otp/verify:
 *   post:
 *     summary: Verify an OTP code
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [otp]
 *             properties:
 *               otp:
 *                 type: string
 *                 example: '482910'
 *     responses:
 *       200:
 *         description: OTP verified. User session elevated.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid or expired OTP.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/otp/verify", verifyToken, verifyOTP);

/**
 * @swagger
 * /api/auth/2fa/toggle:
 *   post:
 *     summary: Enable or disable two-factor authentication for the current user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [enable]
 *             properties:
 *               enable:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: 2FA status updated.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/2fa/toggle", verifyToken, toggle2FA);

module.exports = router;