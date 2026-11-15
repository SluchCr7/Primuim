const jwt = require("jsonwebtoken");
const { User } = require("../models/User");

// Verify token middleware
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !/^Bearer\s+\S+$/i.test(authHeader)) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(/\s+/)[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }
  if (user.isBlocked) {
    return res.status(403).json({ message: "This account is blocked." });
  }
  if (!user.isVerify) {
    return res.status(403).json({ message: "Please verify your email before signing in." });
  }
  if ((decoded.tokenVersion || 0) !== (user.tokenVersion || 0)) {
    return res.status(401).json({ message: "Session expired. Please sign in again." });
  }

  req.user = {
    ...decoded,
    id: user._id.toString(),
    role: user.role,
    sellerStatus: user.sellerStatus
  };
  return next();
};

// Verify admin
const verifyAdmin = (req, res, next) => {
  return verifyToken(req, res, () => {
    if (req.user.role === "admin" || req.user.role === "superadmin") {
      return next();
    } else {
      return res.status(403).json({ message: "You are not an administrator!" });
    }
  });
};

// Verify same user
const verifyUser = (req, res, next) => {
  return verifyToken(req, res, () => {
    if (req.user.id === req.params.id) {
      return next();
    } else {
      return res.status(403).json({ message: "You are not this user!" });
    }
  });
};

// Verify admin or same user
const verifyAdminOrUser = (req, res, next) => {
  return verifyToken(req, res, () => {
    if (req.user.role === "admin" || req.user.role === "superadmin" || req.user.id === req.params.id) {
      return next();
    } else {
      return res.status(403).json({ message: "You are not authorized!" });
    }
  });
};

// verifyToken loads the current role and approval status from the database.
const verifySeller = (req, res, next) => {
  return verifyToken(req, res, () => {
    if (req.user.role === "admin" || req.user.role === "superadmin") {
      return next();
    }
    if (req.user.role === "seller" && req.user.sellerStatus === "approved") {
      return next();
    }
    return res.status(403).json({ message: "Approved sellers access only!" });
  });
};

// Verify superadmin
const verifySuperAdmin = (req, res, next) => {
  return verifyToken(req, res, () => {
    if (req.user.role === "superadmin") {
      return next();
    } else {
      return res.status(403).json({ message: "Super Administrator access only!" });
    }
  });
};

// Verify moderator
const verifyModerator = (req, res, next) => {
  return verifyToken(req, res, () => {
    if (req.user.role === "moderator" || req.user.role === "admin") {
      return next();
    } else {
      return res.status(403).json({ message: "Moderator or Admin access only!" });
    }
  });
};

// Verify roles dynamically
const verifyRoles = (...allowedRoles) => {
  return (req, res, next) => {
    return verifyToken(req, res, () => {
      if (allowedRoles.includes(req.user.role)) {
        return next();
      } else {
        return res.status(403).json({ message: `Access denied. Requires one of: ${allowedRoles.join(", ")}` });
      }
    });
  };
};

module.exports = { 
  verifyToken, 
  verifyAdmin, 
  verifyUser, 
  verifyAdminOrUser,
  verifySeller,
  verifyModerator,
  verifySuperAdmin,
  verifyRoles
};
