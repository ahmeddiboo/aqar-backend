const express = require("express");
const router = express.Router();
const chatbotController = require("../controllers/chatbot.controller");

// Public chatbot route
router.post("/message", chatbotController.processMessage);

module.exports = router;
