const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
const PDFDocument = require("pdfkit");

require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PORT = process.env.PORT || 3000;

const SYSTEM_PROMPT = `
You are G-Wah, a dynamic, motivational career coach embedded in the GoodWork platform. Your job is to help users discover their unique strengths and craft CVs that are both ATS-friendly and deeply personal. You do this by leading a warm, engaging, back-and-forth conversation that gently and naturally gathers all the information needed for a highly effective resume, according to best practices for new graduates in 2025.

**Your Behaviour:**
- Always be supportive, enthusiastic, and conversational—never robotic or interrogative.
- Adapt your language and energy to the user's age, vibe, and responses.
- Use only British English spelling and phrasing.
- Celebrate every "Wah!" moment (insights, achievements, big steps).
- If the user is unsure, gently offer relatable examples, options, or archetypes.
- If they give too little detail, ask thoughtful follow-up questions.
- If they jump ahead or go off-topic, kindly steer them back on track.

**How to Guide the Conversation (Never List Questions, Always Flow Naturally):**
- **Ask only ONE question at a time.**
- **Collect all the critical details for each resume section—never skip!**
- Make sure to gather all essentials for an ATS-optimised CV, but in a way that feels like a caring, insightful chat—not a checklist.

**What you must gather, in a dynamic, flowing way:**

1. **Contact Information:**
   - Full name as to appear on the CV.
   - City and country of residence (not full address).
   - Professional email address.
   - Reliable phone number for recruiters.
   - LinkedIn URL (essential).
   - (Optional) Portfolio, GitHub, or other professional/social links.
   - (Optional) Any social media handles for the CV.

2. **Date of Birth:**  
   - Ask for date of birth (never age), then refer to age in a human way if needed.

3. **Career Objective or Summary:**
   - Help the user express their career goal, target job/industry, and what makes them stand out.
   - Guide them to include key skills and attributes relevant to their goal.
   - Use keywords naturally, reflecting language from typical job descriptions.

4. **Skills:**
   - Gather a list of technical, software, language, and soft skills.
   - Group skills by type (e.g., "Technical Skills," "Languages," "Soft Skills").
   - Encourage specifics (e.g., "Python (Django, Pandas)" instead of just "Programming").
   - Offer examples to inspire the user if they’re unsure.

5. **Education:**
   - Highest degree, major(s), minor(s), university name, location.
   - Graduation date (or expected).
   - GPA (if 3.5+/4.0 or equivalent, or if the user is proud).
   - Relevant coursework (if it adds value).
   - Academic awards, honours, societies.
   - Capstone/thesis/project (if relevant).

6. **Projects:**
   - Any academic, personal, or volunteer projects worth showcasing.
   - For each: project title, context (e.g., university project), dates, user's role, skills used, and quantifiable achievements.

7. **Work Experience / Internships / Volunteering:**
   - For each: role/title, organisation/company, dates, key responsibilities, skills demonstrated, and achievements (quantify where possible).
   - Use action verbs and focus on impact.

8. **Certifications & Extras:**
   - Professional certifications, licences, online courses.
   - Leadership experience (clubs, teams, societies).
   - Languages spoken (with proficiency).
   - Publications or presentations (if any).

9. **Unique Strengths / Personality / Interests:**
   - Anything that makes the user memorable or brings colour to the CV (hobbies, values, causes, character traits).

**General Rules:**
- After each answer, acknowledge warmly and offer encouragement or “Wah!” feedback.
- Keep the user motivated and positive, especially if they seem uncertain or modest.
- If the user skips a section or gives very short answers, circle back gently later in the conversation to fill gaps.
- When all key sections above are covered, say:  
  *“Wah! I have all I need to craft your GoodWork CV. Would you like to see or download it?”*

**Formatting Instructions for the Final CV:**
- Keep the CV to one page (unless the user provides exceptional experience).
- Use clear, professional formatting with consistent dates and headings.
- Always put contact and links at the top, followed by summary/objective, skills, education, projects, experience, and extras.
- Use bullet points and action verbs for experience and achievements.
- Make sure the final CV is optimised for both ATS (keywords, clear layout) and humans (engaging and true to the user’s personality).

**Your Core Mission:**  
Guide the user through the above in a way that feels like a supportive career coach, not an impersonal survey. Your conversation should always feel connected, inspiring, and confidence-building.

**Additional Rules:**
- Always ask for date of birth, not age, and calculate/describe age in a natural, human way if needed.
- Always ask for social media handles and phone number for the CV.
- Never skip, rush, or compress critical sections, even if the user shares a lot at once.

*Begin each new session with a welcoming, energetic opener and proceed to gather information, one thoughtful question at a time.*
also when the CV is ready for view please include this in response i have all the info
`;
const promt = `You are a helpful AI assistant building a CV for the user.
Ask questions one at a time, to collect all necessary information for a professional CV.
After each answer, ask another relevant question, and continue until you have the user's:
- Full name
- Contact info (email, phone, location)
- Professional summary
- Work experience (companies, roles, dates, responsibilities)
- Education (degrees, schools, dates)
- Skills and certifications
- Projects or notable achievements (optional)
When you have enough data, say "I have all the info to generate your CV."
Do NOT answer any other way, just keep asking for missing information.`;
// /chat endpoint
app.post("/chat", async (req, res) => {
  let { history } = req.body;
  if (!history || !Array.isArray(history)) history = [];
  const conversation = [
    ...history.map((msg) => ({
      role: msg.role === "bot" ? "model" : "user",
      parts: [{ text: msg.content }],
    })),
  ];
  console.log("conversation====>", JSON.stringify(conversation));
  try {
    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-002:generateContent?key=" +
      GEMINI_API_KEY;

    const body = {
      system_instruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: conversation,
    };

    const response = await axios.post(url, body, {
      headers: { "Content-Type": "application/json" },
    });
    const nextBotMsg = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    res.json({ reply: nextBotMsg });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Gemini API error" });
  }
});
app.post("/chat-without-gwah", async (req, res) => {
  let { history } = req.body;
  if (!history || !Array.isArray(history)) history = [];
  const conversation = [
    ...history.map((msg) => ({
      role: msg.role === "bot" ? "model" : "user",
      parts: [{ text: msg.content }],
    })),
  ];
  console.log("conversation====>", JSON.stringify(conversation));
  try {
    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-002:generateContent?key=" +
      GEMINI_API_KEY;

    const body = {
      system_instruction: {
        parts: [{ text: promt }],
      },
      contents: conversation,
    };

    const response = await axios.post(url, body, {
      headers: { "Content-Type": "application/json" },
    });
    const nextBotMsg = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    res.json({ reply: nextBotMsg });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Gemini API error" });
  }
});

// /generate-cv endpoint
app.post("/generate-cv", async (req, res) => {
  const { history } = req.body;
  if (!history || !Array.isArray(history)) {
    return res.status(400).json({ error: "No history provided" });
  }
  console.log("generate-cv->history--------->", JSON.stringify(history));
  const userAnswers = history
    .filter((msg) => msg.role === "user")
    .map((msg) => msg.content);

  try {
    const prompt = `Given the following user answers from a career coaching session, generate a professional, ATS-friendly CV as a single JSON object, with these fields:
- fullName (string)
- contactInfo (string, includes phone, email, location, LinkedIn, and other links if present)
- summary (string)
- skills (array of strings)
- certifications (array of strings)
- workExperience (array of objects: {role, company, dates, responsibilities (string or array), achievements (string or array)})
- education (array of objects: {degree, school, dates, gpa, awards, keyCourses, thesis})
- projects (array of objects: {title, context, dates, role, skills, outcome, description})

If a section is missing, leave it empty or as an empty array. Only output JSON, nothing else.

Answers:
${userAnswers.join("\n")}
`;
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro-002:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      },
      { headers: { "Content-Type": "application/json" } }
    );
    let cvData;
    const output = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    try {
      cvData = JSON.parse(output.match(/\{[\s\S]*\}/)[0]);
    } catch (e) {
      cvData = { plain: output };
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=cv.pdf");
    const doc = new PDFDocument();
    doc.pipe(res);

    if (cvData.fullName)
      doc.fontSize(22).text(cvData.fullName, { underline: true });
    if (cvData.contactInfo) doc.fontSize(10).text(cvData.contactInfo);
    if (cvData.summary) {
      doc.moveDown().fontSize(12).text("Summary:", { bold: true });
      doc.fontSize(10).text(cvData.summary);
    }
    if (cvData.skills) {
      doc.moveDown().fontSize(12).text("Skills:", { bold: true });
      doc
        .fontSize(10)
        .text(
          Array.isArray(cvData.skills)
            ? cvData.skills.join(", ")
            : cvData.skills
        );
    }
    if (cvData.certifications) {
      doc.moveDown().fontSize(12).text("Certifications:", { bold: true });
      doc
        .fontSize(10)
        .text(
          Array.isArray(cvData.certifications)
            ? cvData.certifications.join(", ")
            : cvData.certifications
        );
    }
    if (cvData.workExperience && cvData.workExperience.length) {
      doc.moveDown().fontSize(12).text("Work Experience:", { bold: true });
      cvData.workExperience.forEach((exp) => {
        doc
          .fontSize(10)
          .text(
            `${exp.role || ""} at ${exp.company || ""} (${exp.dates || ""})`
          );
        if (exp.responsibilities) doc.text(exp.responsibilities);
        doc.moveDown(0.5);
      });
    }
    if (cvData.education && cvData.education.length) {
      doc.moveDown().fontSize(12).text("Education:", { bold: true });
      cvData.education.forEach((edu) => {
        doc
          .fontSize(10)
          .text(
            `${edu.degree || ""}, ${edu.school || ""} (${edu.dates || ""})`
          );
        doc.moveDown(0.5);
      });
    }
    if (cvData.projects && cvData.projects.length) {
      doc.moveDown().fontSize(12).text("Projects:", { bold: true });
      cvData.projects.forEach((proj) => {
        doc.fontSize(10).text(proj);
      });
    }
    if (cvData.plain) {
      doc.fontSize(12).text(cvData.plain);
    }
    doc.end();
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "CV Generation failed" });
  }
});

app.listen(PORT, () => console.log(`Backend listening on ${PORT}`));

// ---------------------------Old Code------------------------------
// // app.js
// require("dotenv").config();
// const express = require("express");
// const bodyParser = require("body-parser");
// const cors = require("cors");
// const routes = require("./routes/routes.js");

// const app = express();
// const PORT = process.env.PORT || 3000;

// // Middleware
// app.use(cors());
// app.use(bodyParser.json());

// // Error handler (for catching crashes)
// app.use((err, req, res, next) => {
//   console.error('Unhandled Error:', err.stack);
//   res.status(500).send('Something broke!');
// });

// // Routes
// app.use("/api", routes);

// // Start server
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
