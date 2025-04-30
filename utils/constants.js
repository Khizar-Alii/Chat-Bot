// utils/constants.ts

// Define all categories in the order they should be asked
exports.CATEGORIES = [
  "Introduction",
  "Technical Skills",
  "Work Experience",
  "Career Goals",
  "Soft Skills",
];

// Define the questions associated with each category
exports.QUESTIONS_BY_CATEGORY = {
  Introduction: [
    "Let's start with your full name, please.",
    "Could you briefly introduce yourself?",
    "What are your passions or hobbies outside of work?",
  ],
  "Technical Skills": [
    "What technical skills are you most confident in?",
    "Which programming languages, frameworks, or tools do you frequently work with?",
    "Are there any certifications or courses you’ve completed recently?",
  ],
  "Work Experience": [
    "Could you describe your most recent work experience?",
    "What were your main responsibilities in your previous roles?",
    "Can you share a project you're particularly proud of?",
  ],
  "Career Goals": [
    "Where would you like to see yourself professionally in the next 3 to 5 years?",
    "What kind of roles or industries are you aiming for next?",
    "Are there any specific skills or fields you are eager to explore further?",
  ],
  "Soft Skills": [
    "How would you describe your communication and teamwork style?",
    "Can you share an example where you successfully resolved a conflict at work?",
    "What do you believe are your strongest soft skills?",
  ],
};
