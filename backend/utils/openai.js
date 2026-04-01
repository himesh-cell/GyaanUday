const OpenAI = require("openai");

const fallbackSummary = (description) => ({
  summary: description.slice(0, 160),
  tags: ["innovation", "project"],
  suggestions: ["Add measurable outcomes", "Include architecture diagram"],
});

const generateSummary = async (description) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return fallbackSummary(description);
  }

  const client = new OpenAI({ apiKey });

  const prompt = `
You are an assistant for student project insights.
Return ONLY valid JSON with keys: summary (string), tags (array of strings), suggestions (array of strings).
Description: ${description}
`;

  try {
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: prompt,
      temperature: 0.3,
    });

    const rawText = response.output_text || "";
    const cleaned = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    return {
      summary: parsed.summary || "",
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    };
  } catch (error) {
    return fallbackSummary(description);
  }
};

module.exports = { generateSummary };
