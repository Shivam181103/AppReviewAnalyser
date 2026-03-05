// List available Gemini models
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY || "AIzaSyAjDIfmt9hBXuSLzofs_NPjScFVAfHrj9Y";
  
  console.log("🔍 Fetching available models...\n");

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    
    const data = await response.json();
    
    if (data.models) {
      console.log("✅ Available models:");
      data.models.forEach(model => {
        console.log(`- ${model.name}`);
        console.log(`  Supported: ${model.supportedGenerationMethods?.join(', ')}`);
      });
    } else {
      console.log("❌ Error:", data);
    }
  } catch (error) {
    console.error("❌ Failed to list models:", error.message);
  }
}

listModels();
