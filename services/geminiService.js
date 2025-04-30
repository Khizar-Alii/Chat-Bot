// services/geminiService.js
const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Ask Gemini
exports.askGemini = async (prompt) => {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro-002:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    const generatedText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    return generatedText || "I'm sorry, I didn't understand that.";
  } catch (error) {
    console.error('Error communicating with Gemini API:', error.response?.data || error.message);
    throw new Error('Failed to get response from Gemini API');
  }
};
