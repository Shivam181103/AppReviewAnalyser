// Test script to check available Gemini models
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY not found in environment");
    process.exit(1);
  }

  console.log("✅ API Key found");
  console.log("🔍 Testing Gemini models...\n");

  const genAI = new GoogleGenerativeAI(apiKey);

  // Try different model names
  const modelsToTest = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro",
    "gemini-1.5-pro-latest",
    "gemini-pro",
    "gemini-pro-vision",
  ];

  for (const modelName of modelsToTest) {
    try {
      console.log(`Testing: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Say hello");
      const response = await result.response;
      const text = response.text();
      console.log(`✅ ${modelName} works! Response: ${text.substring(0, 50)}...\n`);
      break; // Stop after first working model
    } catch (error) {
      console.log(`❌ ${modelName} failed: ${error.message}\n`);
    }
  }
}

testGemini().catch(console.error);
