import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

type AIProvider = "openai" | "gemini";

const AI_PROVIDER = (process.env.AI_PROVIDER || "gemini") as AIProvider;

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

interface SentimentResult {
  label: "positive" | "neutral" | "negative";
  score: number;
  magnitude: number;
}

interface ThemeResult {
  themes: string[];
}

interface InsightResult {
  complaints: string[];
  praise: string[];
  summary: string;
}

async function callOpenAI(
  prompt: string,
  systemPrompt?: string,
): Promise<string> {
  if (!openai) throw new Error("OpenAI API key not configured");

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      ...(systemPrompt
        ? [{ role: "system" as const, content: systemPrompt }]
        : []),
      { role: "user" as const, content: prompt },
    ],
    temperature: 0.3,
  });

  return response.choices[0].message.content || "";
}

async function callGemini(
  prompt: string,
  systemPrompt?: string,
): Promise<string> {
  if (!genAI) throw new Error("Gemini API key not configured");

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;

  const result = await model.generateContent(fullPrompt);
  const response = await result.response;
  return response.text();
}

async function callAI(prompt: string, systemPrompt?: string): Promise<string> {
  if (AI_PROVIDER === "openai") {
    return callOpenAI(prompt, systemPrompt);
  } else {
    return callGemini(prompt, systemPrompt);
  }
}

export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  const prompt = `Analyze the sentiment of this review and return ONLY a JSON object with this exact structure:
{
  "label": "positive" | "neutral" | "negative",
  "score": number between -1 and 1,
  "magnitude": number between 0 and 1
}

Review: "${text}"

Return only the JSON, no other text.`;

  const response = await callAI(prompt);

  try {
    const cleanResponse = response
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const parsed = JSON.parse(cleanResponse);
    return {
      label: parsed.label,
      score: parsed.score,
      magnitude: parsed.magnitude,
    };
  } catch (error) {
    console.error("Failed to parse sentiment response:", error);
    return { label: "neutral", score: 0, magnitude: 0 };
  }
}

export async function extractThemes(reviews: string[]): Promise<string[]> {
  const prompt = `Analyze these app reviews and extract the top 5-10 recurring themes or topics.
Return ONLY a JSON object with this structure:
{
  "themes": ["theme1", "theme2", ...]
}

Reviews:
${reviews
  .slice(0, 100)
  .map((r, i) => `${i + 1}. ${r}`)
  .join("\n")}

Return only the JSON, no other text.`;

  const response = await callAI(prompt);

  try {
    const cleanResponse = response
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const parsed = JSON.parse(cleanResponse);
    return parsed.themes || [];
  } catch (error) {
    console.error("Failed to parse themes response:", error);
    return [];
  }
}

export async function generateInsights(
  positiveReviews: string[],
  negativeReviews: string[],
): Promise<InsightResult> {
  const prompt = `Analyze these app reviews and generate insights.
Return ONLY a JSON object with this structure:
{
  "complaints": ["complaint1", "complaint2", ...],
  "praise": ["praise1", "praise2", ...],
  "summary": "A brief 2-3 sentence summary of overall feedback"
}

Positive Reviews:
${positiveReviews
  .slice(0, 20)
  .map((r, i) => `${i + 1}. ${r}`)
  .join("\n")}

Negative Reviews:
${negativeReviews
  .slice(0, 20)
  .map((r, i) => `${i + 1}. ${r}`)
  .join("\n")}

Return only the JSON, no other text.`;

  const response = await callAI(prompt);

  try {
    const cleanResponse = response
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const parsed = JSON.parse(cleanResponse);
    return {
      complaints: parsed.complaints || [],
      praise: parsed.praise || [],
      summary: parsed.summary || "",
    };
  } catch (error) {
    console.error("Failed to parse insights response:", error);
    return { complaints: [], praise: [], summary: "" };
  }
}

export async function generateReplyDraft(
  reviewText: string,
  rating: number,
): Promise<string> {
  const systemPrompt = `You are a helpful customer support representative. Generate a professional, empathetic reply to this app review. Keep it concise (2-3 sentences).`;

  const prompt = `Review (${rating} stars): "${reviewText}"

Generate a professional reply:`;

  const response = await callAI(prompt, systemPrompt);
  return response.trim();
}

export async function analyzeCompetitors(
  myAppReviews: string[],
  competitorReviews: string[],
): Promise<string> {
  const prompt = `Compare these two sets of app reviews and identify:
1. What the competitor is doing better
2. What we're doing better
3. Key opportunities for improvement

Our App Reviews:
${myAppReviews
  .slice(0, 20)
  .map((r, i) => `${i + 1}. ${r}`)
  .join("\n")}

Competitor Reviews:
${competitorReviews
  .slice(0, 20)
  .map((r, i) => `${i + 1}. ${r}`)
  .join("\n")}

Provide a concise analysis (3-4 paragraphs):`;

  const response = await callAI(prompt);
  return response.trim();
}

export function getAIProvider(): AIProvider {
  return AI_PROVIDER;
}

export function isAIConfigured(): boolean {
  if (AI_PROVIDER === "openai") {
    return !!process.env.OPENAI_API_KEY;
  } else {
    return !!process.env.GEMINI_API_KEY;
  }
}
