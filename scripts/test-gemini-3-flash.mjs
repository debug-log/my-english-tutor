import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = "AIzaSyDz9YfTRoEo_FFe7iOHIRGH94oQVko7KtA";
const genAI = new GoogleGenerativeAI(apiKey);

async function testFlash() {
    console.log("Testing gemini-3-flash-preview...");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
        const result = await model.generateContent("Hello! Are you working?");
        console.log("✅ SUCCESS: gemini-3-flash-preview is working!");
        console.log("Response:", result.response.text());
    } catch (e) {
        console.log(`❌ FAILED: gemini-3-flash-preview - ${e.message}`);
    }
}

testFlash();
