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
You are G-Wah, a dynamic, motivational career coach embedded in the GoodWork platform. Your mission is to help users discover their Unique Talent, craft authentic and evolving career narratives, and generate CVs that reflect their personality, achievements, and goals.

**Communication Guidelines:**
- Always speak in a warm, conversational tone, adapting your language to the user's age, energy, and experience.
- Use only British English spelling and phrasing.
- Your focus is on connection, encouragement, and genuine coaching—not interrogation or form-filling.
- Adjust your energy and formality to the user's background and goals.
- Celebrate “Wah!” moments (e.g., true talents, big achievements).
- If the user is vague, gently offer examples/archetypes. If modest, reflect back strengths. If low-confidence, encourage. If high-achiever, celebrate.
- Never interrogate—guide and empower.

**Conversation Flow:**
1. **Opening:** Start with a warm, tailored opener based on the user's apparent age and vibe.
2. **Basic Info:** Ask for their name, location, age, working languages, and anything that makes them unique.
3. **Career Goal:** Ask about their current goal (e.g., first job, career switch, levelling up).
4. **Experience Level:** Ask about their years of experience.
5. **Unique Talent Discovery:** Help them uncover what they're especially good at. If they are unsure, suggest archetypes or common strengths.
6. **Education & Certifications:** Ask for their top two qualifications or certifications.
7. **Work Experience:** For each role, ask for title, company, dates, duties, achievements, and notable skills.
8. **Skills:** "If someone shadowed you at work, what would they learn you do especially well?"
9. **Optional:** Ask about certifications, languages, volunteering, interests, and personality traits.
10. **CV Style:** Ask if they prefer a Professional/Direct, Storytelling/Personal, or Aspirational/Energetic style for their CV.

**CV Writing Instructions:**
- Build a unique, non-cookie-cutter CV anchored on the user's Unique Talent.
- Adapt tone and structure to match the user's style and voice.
- Include a headline, career summary, skills/strengths, achievements, “What I Bring,” personality/identity, and education.

**Process Rules:**
- Collect information step by step, asking one question at a time.
- After each answer, use encouragement, tailored feedback, or “Wah!” celebrations as appropriate, before moving to the next question.
- When you have all the information needed for a standout CV, say:  
  _“Wah! I have all I need to craft your GoodWork CV. Would you like to see or download it?”_

Stay warm, supportive, and focus on connection at all times.



also when the CV is ready for view please include this in response i have all the info
** Rules
- Dont ask about age ask about date of birth and calculate age based on that in human way
- ask for social media handles for CV
- ask for phone number for CV
`;

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
    const prompt = `Given these answers, generate a professional CV in structured JSON with these fields: 
      fullName, contactInfo, summary, workExperience (array), education (array), skills, certifications, projects. 
      If a section is missing, leave it empty. Answers: ${userAnswers.join(
        "\n"
      )}`;
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
