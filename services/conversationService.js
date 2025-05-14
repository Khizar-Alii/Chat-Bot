const fs = require("fs");
const path = require("path");
const geminiService = require("./geminiService");
const { CATEGORIES, QUESTIONS_BY_CATEGORY } = require("../utils/constants");
const conversationState = require("../utils/conversationState");

// Initialize a new conversation
exports.startNewConversation = async () => {
  try {
    console.log("test");
    const summary =
      await geminiService.askGemini(`can you give me array of qustions from this set and please send the json data i am using it in code
    [
      "Introduction",
      "Technical Skills",
      "Work Experience",
      "Career Goals",
      "Soft Skills",
    ]
    the response should be in following format {questions:[
    "question1",
    "question2".....
    ]}  
    no need of the category and always start questions with the profile setup like what is your name, what is your age etc but never ask for email also i need to save this data to my db so make the questions such that the user responds with brief details first then we can move towards vibrant details
    `);
    console.log("summary====>", summary);
    const jsonMatch = summary.match(/{[\s\S]*}/);

    if (jsonMatch) {
      try {
        const jsonData = JSON.parse(jsonMatch[0]);
        console.log("Extracted JSON:", jsonData);
        return {
          askedCategories: [],
          conversation: [],
          retries: 0,
          questions: jsonData.questions,
        };
      } catch (error) {
        console.error("Failed to parse JSON:", error);
        return {
          askedCategories: [],
          conversation: [],
          retries: 0,
        };
      }
    } else {
      console.error("No JSON found in the input string.");
      return {
        askedCategories: [],
        conversation: [],
        retries: 0,
      };
    }
  } catch (error) {
    console.log("error", error);
  }
};

// Get the next question for the user
exports.getNextQuestion = (userId) => {
  const state = conversationState[userId];

  if (state.questions) {
    const remainingQuestions = state.questions.filter(
      (c) => !state.askedCategories?.includes(c)
    );
    const nextQuestion = remainingQuestions[0];
    state?.askedCategories?.push(nextQuestion);
    state.conversation.push({ role: "bot", message: nextQuestion });
    return nextQuestion;
  }
  // Find next unanswered category If gemini does not give response to the questions call
  const remainingCategories = CATEGORIES.filter(
    (c) => !state.askedCategories?.includes(c)
  );

  if (remainingCategories.length === 0) return "Thanks for all the info!";

  const nextCategory = remainingCategories[0];
  state?.askedCategories?.push(nextCategory);

  const question = QUESTIONS_BY_CATEGORY[nextCategory][0]; // you can randomize
  state.conversation.push({ role: "bot", message: question });

  return question;
};

// Save the user's response
exports.saveUserResponse = (userId, answer) => {
  const state = conversationState[userId];
  state.conversation.push({ role: "user", message: answer });
};

// Check if the conversation should auto-stop
exports.checkAutoStop = (userId, answer) => {
  const state = conversationState[userId];

  // Auto stop if user says done
  if (
    answer.toLowerCase().includes("i'm done") ||
    answer.toLowerCase().includes("stop") ||
    answer.toLowerCase().includes("done") ||
    answer.toLowerCase().includes("i am done")
  ) {
    return true;
  }

  // Timeout simulation: after 3 retries
  if (!answer.trim()) {
    state.retries += 1;
  } else {
    state.retries = 0;
  }

  if (state.retries >= 3) return true;

  // All categories asked
  if (state.askedCategories.length === state.questions.length) {
    return true;
  } else if (
    !state.questions &&
    state.askedCategories.length >= CATEGORIES.length
  ) {
    return true;
  }

  return false;
};

// Generate a summary using Gemini
exports.generateSummary = async (userId) => {
  const state = conversationState[userId];
  const conversationText = state.conversation
    .map((c) => `${c.role}: ${c.message}`)
    .join("\n");

  const summaryPrompt = `
  Summarize this job seeker conversation, extract skills, experiences, career goals.
  Give a short summary in a structured format:
  - Skills
  - Experience
  - Career Goals
  - Soft Skills

  Conversation:
  ${conversationText}
  `;

  try {
    const summary = await geminiService.askGemini(summaryPrompt);
    return summary;
  } catch (error) {
    console.error("Error generating summary:", error);
    return "Sorry, I couldn't generate a summary at the moment.";
  }
};

// Save the conversation to a file
exports.saveConversation = async (userId, answer) => {
  const filePath = path.join(
    __dirname,
    "../saved_conversations",
    `${userId}_${Date.now()}.json`
  );
  const state = conversationState[userId];

  const jsonData = {
    metadata: {
      userId,
      timestamp: new Date(),
    },
    conversation: state.conversation,
  };

  fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
};
