import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config({ override: true });

const groqApiKey = process.env.GROQ_API_KEY;

console.log("=".repeat(50));
console.log("Groq API Key Test");
console.log("=".repeat(50));
console.log(`API Key loaded: ${groqApiKey ? groqApiKey.substring(0, 7) + '...' : 'NOT FOUND'}`);
console.log(`API Key length: ${groqApiKey?.length || 0}`);
console.log("=".repeat(50));

if (!groqApiKey) {
  console.error("❌ ERROR: No Groq API key found in .env file");
  process.exit(1);
}

const groq = new Groq({ apiKey: groqApiKey });

async function testGroq() {
  try {
    console.log("\n🔄 Testing Groq API connection...\n");
    
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are a test assistant." },
        { role: "user", content: "Say hello" }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const response = chatCompletion.choices[0]?.message?.content;
    console.log("✅ SUCCESS! Groq API is working!");
    console.log(`Response: ${response}`);
    console.log("\n" + "=".repeat(50));
  } catch (error: any) {
    console.error("❌ FAILED! Groq API Error:");
    console.error(`Status: ${error.status}`);
    console.error(`Message: ${error.message}`);
    if (error.response) {
      console.error(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    console.log("\n" + "=".repeat(50));
    console.log("\n⚠️  Possible issues:");
    console.log("   1. API key is invalid or expired");
    console.log("   2. API key doesn't have access to 'llama-3.1-8b-instant' model");
    console.log("   3. Rate limit exceeded");
    console.log("   4. Check your Groq account at https://console.groq.com/");
    process.exit(1);
  }
}

testGroq();