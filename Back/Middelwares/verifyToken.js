const jwt = require("jsonwebtoken");
const { User } = require("../models/User");

// Verify token middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }
  } else {
    return res.status(401).json({ message: "No token provided" });
  }
};

// Verify admin
const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role === "admin" || req.user.role === "superadmin") {
      next();
    } else {
      return res.status(403).json({ message: "You are not an administrator!" });
    }
  });
};

// Verify same user
const verifyUser = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.id === req.params.id) {
      next();
    } else {
      return res.status(403).json({ message: "You are not this user!" });
    }
  });
};

// Verify admin or same user
const verifyAdminOrUser = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role === "admin" || req.user.role === "superadmin" || req.user.id === req.params.id) {
      next();
    } else {
      return res.status(403).json({ message: "You are not authorized!" });
    }
  });
};

// Verify seller (requires db check to see if approved status is current)
const verifySeller = (req, res, next) => {
  verifyToken(req, res, async () => {
    if (req.user.role === "admin" || req.user.role === "superadmin") {
      return next();
    }
    try {
      const dbUser = await User.findById(req.user.id);
      if (dbUser && dbUser.role === "seller" && dbUser.sellerStatus === "approved") {
        next();
      } else {
        return res.status(403).json({ message: "Approved sellers access only!" });
      }
    } catch (err) {
      return res.status(500).json({ message: "Authorization verification failed" });
    }
  });
};

// Verify superadmin
const verifySuperAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role === "superadmin") {
      next();
    } else {
      return res.status(403).json({ message: "Super Administrator access only!" });
    }
  });
};

// Verify moderator
const verifyModerator = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role === "moderator" || req.user.role === "admin") {
      next();
    } else {
      return res.status(403).json({ message: "Moderator or Admin access only!" });
    }
  });
};

// Verify roles dynamically
const verifyRoles = (...allowedRoles) => {
  return (req, res, next) => {
    verifyToken(req, res, () => {
      if (allowedRoles.includes(req.user.role)) {
        next();
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
