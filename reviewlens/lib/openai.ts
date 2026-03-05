import OpenAI from 'openai';
import type { Review, SentimentLabel } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeSentiment(text: string): Promise<{
  label: SentimentLabel;
  score: number;
  magnitude: number;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a sentiment analysis expert. Analyze the sentiment of app reviews and return JSON with:
- label: "positive", "neutral", or "negative"
- score: a number between -1.0 (very negative) and 1.0 (very positive)
- magnitude: how strong the sentiment is (0.0 to 1.0)`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      label: result.label || 'neutral',
      score: result.score || 0,
      magnitude: result.magnitude || 0,
    };
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    return { label: 'neutral', score: 0, magnitude: 0 };
  }
}

export async function extractThemes(reviews: Review[]): Promise<string[]> {
  if (reviews.length === 0) return [];

  const reviewTexts = reviews
    .map((r) => `${r.title ? r.title + ': ' : ''}${r.content}`)
    .slice(0, 50)
    .join('\n\n');

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Extract the main themes and topics from these app reviews. Return a JSON array of strings, each representing a key theme or topic mentioned frequently.`,
        },
        {
          role: 'user',
          content: reviewTexts,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    });

    const result = JSON.parse(response.choices[0].message.content || '{"themes":[]}');
    return result.themes || [];
  } catch (error) {
    console.error('Error extracting themes:', error);
    return [];
  }
}

export async function generateInsightSummary(
  reviews: Review[],
  type: 'complaints' | 'praise' | 'summary'
): Promise<string> {
  const filteredReviews = reviews.filter((r) => {
    if (type === 'complaints') return r.sentiment_label === 'negative';
    if (type === 'praise') return r.sentiment_label === 'positive';
    return true;
  });

  if (filteredReviews.length === 0) {
    return type === 'complaints'
      ? 'No major complaints found in recent reviews.'
      : type === 'praise'
      ? 'No specific praise found in recent reviews.'
      : 'No reviews available for analysis.';
  }

  const reviewTexts = filteredReviews
    .slice(0, 100)
    .map((r) => `[${r.rating}★] ${r.title ? r.title + ': ' : ''}${r.content}`)
    .join('\n\n');

  const prompts = {
    complaints:
      'Analyze these negative reviews and summarize the top complaints and issues users are experiencing. Group similar issues together and prioritize by frequency.',
    praise:
      'Analyze these positive reviews and summarize what users love most about the app. Highlight the most praised features and aspects.',
    summary:
      'Provide a comprehensive summary of these app reviews, including overall sentiment, key themes, and actionable insights for the development team.',
  };

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: prompts[type],
        },
        {
          role: 'user',
          content: reviewTexts,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0].message.content || '';
  } catch (error) {
    console.error('Error generating insight summary:', error);
    return 'Unable to generate summary at this time.';
  }
}

export async function generateReplyDraft(review: Review): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a professional app developer responding to user reviews. Generate a thoughtful, empathetic, and helpful response to this review. Keep it concise (2-3 sentences). If it's negative, acknowledge the issue and thank them for feedback. If positive, thank them for their support.`,
        },
        {
          role: 'user',
          content: `Rating: ${review.rating}/5\nTitle: ${review.title || 'N/A'}\nReview: ${review.content}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    return response.choices[0].message.content || '';
  } catch (error) {
    console.error('Error generating reply draft:', error);
    return '';
  }
}

export async function analyzeCompetitors(
  myAppReviews: Review[],
  competitorReviews: Review[]
): Promise<string> {
  const myPositive = myAppReviews.filter((r) => r.sentiment_label === 'positive');
  const myNegative = myAppReviews.filter((r) => r.sentiment_label === 'negative');
  const compPositive = competitorReviews.filter((r) => r.sentiment_label === 'positive');
  const compNegative = competitorReviews.filter((r) => r.sentiment_label === 'negative');

  const context = `
My App Stats: ${myAppReviews.length} reviews, ${((myPositive.length / myAppReviews.length) * 100).toFixed(1)}% positive
Competitor Stats: ${competitorReviews.length} reviews, ${((compPositive.length / competitorReviews.length) * 100).toFixed(1)}% positive

My App Positive Reviews (sample):
${myPositive.slice(0, 10).map((r) => r.content).join('\n')}

My App Negative Reviews (sample):
${myNegative.slice(0, 10).map((r) => r.content).join('\n')}

Competitor Positive Reviews (sample):
${compPositive.slice(0, 10).map((r) => r.content).join('\n')}

Competitor Negative Reviews (sample):
${compNegative.slice(0, 10).map((r) => r.content).join('\n')}
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Analyze the comparison between these two apps based on user reviews. Identify:
1. What the competitor does better
2. What we do better
3. Opportunities for improvement
Provide actionable insights.`,
        },
        {
          role: 'user',
          content: context,
        },
      ],
      temperature: 0.7,
      max_tokens: 600,
    });

    return response.choices[0].message.content || '';
  } catch (error) {
    console.error('Error analyzing competitors:', error);
    return 'Unable to generate competitor analysis at this time.';
  }
}
