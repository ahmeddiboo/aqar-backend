const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const authMiddleware = require("../middleware/auth.middleware");

// Admin only routes
router.use(authMiddleware.protect);

// Route handlers
router.get("/", authMiddleware.restrictTo("admin"), userController.getAllUsers);
router.get(
  "/:id",
  authMiddleware.restrictTo("admin"),
  userController.getUserById
);
router.patch(
  "/:id",
  authMiddleware.restrictTo("admin"),
  userController.updateUser
);
router.delete(
  "/:id",
  authMiddleware.restrictTo("admin"),
  userController.deleteUser
);

module.exports = router;
