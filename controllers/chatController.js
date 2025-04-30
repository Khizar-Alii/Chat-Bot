// controllers/chatController.js
const conversationService = require("../services/conversationService");

// In-memory conversation state (use Redis/DB for production)
const conversationState = require("../utils/conversationState");

exports.startConversation = async (req, res) => {
  console.log("Start Conversation Triggered");
  const userId = req.body.userId;
  console.log("Received userId:", userId);

  conversationState[userId] = await conversationService.startNewConversation();
  const firstQuestion = conversationService.getNextQuestion(userId);
  console.log("Sending first question:", firstQuestion);

  res.json({ message: firstQuestion });
};

exports.handleUserReply = async (req, res) => {
  const { userId, answer } = req.body;

  conversationService.saveUserResponse(userId, answer);

  // Check auto-stop conditions
  const shouldStop = conversationService.checkAutoStop(userId, answer);

  if (shouldStop) {
    const summary = await conversationService.generateSummary(userId);
    await conversationService.saveConversation(userId);

    return res.json({
      message: "Conversation complete!",
      summary,
    });
  }

  const nextQuestion = conversationService.getNextQuestion(userId);

  res.json({ message: nextQuestion });
};
