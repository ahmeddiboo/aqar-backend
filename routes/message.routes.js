const express = require("express");
const router = express.Router();
const messageController = require("../controllers/message.controller");
const authMiddleware = require("../middleware/auth.middleware");

// Public routes - anyone can send a message
router.post("/", messageController.createMessage);

// Protected routes - only admins can view, update, and delete messages
router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo("admin"));

router.get("/", messageController.getAllMessages);
router.get("/:id", messageController.getMessageById);
router.patch("/:id", messageController.updateMessage);
router.delete("/:id", messageController.deleteMessage);

module.exports = router;
