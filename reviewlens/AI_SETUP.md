# AI Provider Setup Guide

ReviewLens supports two AI providers for sentiment analysis and insights generation:

## 🆓 Google Gemini (Recommended - FREE)

Google Gemini offers a generous free tier that's perfect for getting started.

### Setup Steps:

1. **Get Your API Key**
   - Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Sign in with your Google account
   - Click "Create API Key" or "Get API Key"
   - Copy the generated key

2. **Configure Environment**
   
   Add to your `.env.local`:
   ```env
   AI_PROVIDER=gemini
   GEMINI_API_KEY=your_api_key_here
   ```

3. **Free Tier Limits**
   - 15 requests per minute
   - 1 million tokens per minute
   - 1,500 requests per day
   - Perfect for development and small-scale production

### Model Used
- **gemini-1.5-flash** - Fast, efficient, and free

---

## 💳 OpenAI (Alternative - PAID)

If you prefer OpenAI or need higher rate limits:

### Setup Steps:

1. **Get Your API Key**
   - Visit [OpenAI Platform](https://platform.openai.com/api-keys)
   - Create an account and add payment method
   - Generate a new API key

2. **Configure Environment**
   
   Add to your `.env.local`:
   ```env
   AI_PROVIDER=openai
   OPENAI_API_KEY=sk-your_api_key_here
   ```

3. **Pricing**
   - GPT-4o: ~$2.50 per 1M input tokens
   - GPT-4o: ~$10.00 per 1M output tokens
   - Estimated cost: $0.01-0.05 per review analyzed

### Model Used
- **gpt-4o** - Most capable model for sentiment analysis

---

## 🔄 Switching Between Providers

You can easily switch between providers by changing the `AI_PROVIDER` environment variable:

```env
# Use Gemini (free)
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_key

# OR use OpenAI (paid)
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_key
```

Restart your dev server after changing providers.

---

## 🧪 Testing Your AI Setup

After configuring your AI provider, test it by:

1. Sign in to your ReviewLens dashboard
2. Add an app (paste App Store URL)
3. The system will automatically:
   - Fetch reviews
   - Analyze sentiment using your configured AI provider
   - Display sentiment labels (positive/neutral/negative)

---

## 🛠️ AI Features in ReviewLens

The AI service powers these features:

- **Sentiment Analysis** - Classifies reviews as positive, neutral, or negative
- **Theme Extraction** - Identifies recurring topics in reviews
- **Insight Generation** - Summarizes complaints and praise
- **Reply Suggestions** - Generates professional response drafts
- **Competitor Analysis** - Compares your app vs competitors

---

## 📊 Provider Comparison

| Feature | Google Gemini | OpenAI GPT-4o |
|---------|---------------|---------------|
| **Cost** | Free | ~$0.01-0.05/review |
| **Speed** | Very Fast | Fast |
| **Quality** | Excellent | Excellent |
| **Rate Limits** | 15 req/min | Depends on tier |
| **Best For** | Development, MVP | Production, Scale |

---

## ❓ Troubleshooting

### "AI provider not configured" error
- Check that `AI_PROVIDER` is set to either `gemini` or `openai`
- Verify your API key is correctly set in `.env.local`
- Restart your development server

### Rate limit errors
- **Gemini**: Wait a minute or upgrade to paid tier
- **OpenAI**: Check your usage limits in dashboard

### Invalid API key
- Regenerate your API key from the provider's dashboard
- Ensure no extra spaces in `.env.local`
- Check that the key starts with the correct prefix:
  - Gemini: Usually starts with `AI...`
  - OpenAI: Always starts with `sk-`

---

## 🚀 Production Recommendations

For production deployments:

- **Small Scale (<1000 reviews/day)**: Use Gemini free tier
- **Medium Scale (1000-10000 reviews/day)**: Use Gemini paid or OpenAI
- **Large Scale (>10000 reviews/day)**: Use OpenAI with higher tier

Monitor your usage and costs regularly!
