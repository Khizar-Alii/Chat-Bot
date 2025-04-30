// routes.js
const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");

// Start new conversation
router.post("/start-conversation", chatController.startConversation);

// Receive user reply
router.post("/reply", chatController.handleUserReply);

module.exports = router;
