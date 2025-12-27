import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        // Note: The Node.js SDK for Gemini might not expose listModels directly on the main class 
        // depending on version, but let's try to infer if it works or use a model check.
        // Actually, usually it's not on genAI instance directly in some versions.
        // If listModels isn't available, we will try to generate content with a few common names.

        const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.0-pro", "gemini-pro"];

        console.log("Testing common models...");

        for (const modelName of models) {
            console.log(`Testing ${modelName}...`);
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Hello");
                console.log(`✅ SUCCESS: ${modelName}`);
                console.log(result.response.text());
                return; // Found a working one
            } catch (e) {
                console.log(`❌ FAILED: ${modelName} - ${e.message.split('[')[0]}`); // Print short error
            }
        }
    } catch (error) {
        console.error("Fatal error:", error);
    }
}

listModels();
