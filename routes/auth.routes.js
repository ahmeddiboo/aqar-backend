const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middleware/auth.middleware");

// Authentication routes
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password/:token", authController.resetPassword);

// Protected routes
router.get("/me", authMiddleware.protect, authController.getMe);

router.patch("/update-me", authMiddleware.protect, authController.updateMe);

router.patch(
  "/update-my-password",
  authMiddleware.protect,
  authController.updatePassword
);

module.exports = router;
