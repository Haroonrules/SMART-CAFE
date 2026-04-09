import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config({ override: true });

const groqApiKey = process.env.GROQ_API_KEY;
const groq = new Groq({ apiKey: groqApiKey });

async function testModels() {
  try {
    console.log("🔍 Checking available models...\n");
    
    const models = await groq.models.list();
    console.log("✅ Available models:");
    models.data.forEach(model => {
      console.log(`   - ${model.id}`);
    });
    
    // Try alternative models
    const alternativeModels = [
      'llama-3.1-8b-instant',
      'llama3-8b-8192',
      'llama3-70b-8192',
      'mixtral-8x7b-32768'
    ];
    
    for (const modelId of alternativeModels) {
      try {
        console.log(`\n🔄 Testing model: ${modelId}...`);
        const completion = await groq.chat.completions.create({
          messages: [{ role: "user", content: "Hi" }],
          model: modelId,
        });
        console.log(`✅ SUCCESS with ${modelId}!`);
        break;
      } catch (error: any) {
        console.log(`❌ Failed: ${error.status || error.message}`);
      }
    }
  } catch (error: any) {
    console.error("Error:", error.message);
  }
}

testModels();