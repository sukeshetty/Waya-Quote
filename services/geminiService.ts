import { GoogleGenAI, Type } from "@google/genai";
import { TravelQuotation, FileUpload } from "../types";

const SYSTEM_INSTRUCTION = `
You are an expert travel consultant for "Waya.AI". Your goal is to extract structured travel quotation details from the provided user notes and documents.

Rules:
1. Extract customer name, pricing, flights, hotels, and daily itinerary.
2. **REAL WORLD DATA (Crucial)**:
 - Use Google Search to find **ACTUAL** details for the hotels mentioned.
 - Find the **real star rating** (e.g. 4.5) and the approximate **number of reviews**.
 - Find a **real, short excerpt** from a recent positive guest review for each hotel.
 - **IMAGES ARE CRITICAL**: You MUST use Google Search to find REAL, DIRECT image URLs for:
   a) **Hotels**: Search for the EXACT hotel name + location on Google. Find the official hotel website or Google Hotels listing. Use a direct image URL (ending in .jpg, .png, .webp) from official sources. DO NOT guess or make up URLs.
   b) **Destinations/Itinerary**: Search for the specific attraction or place mentioned. Use real photos from travel sites, tourism boards, or Wikipedia.
   c) **Restaurants**: Search for the exact restaurant name + location. Use a real photo URL.
   d) **Hero Image**: Search for a beautiful landmark photo of the main destination.
 - If you CANNOT find a verified, real image URL for any item, set the image field to an EMPTY STRING "". Do NOT fabricate or guess URLs.
 - NEVER use placeholder URLs or URLs you are not confident about.
3. **Granularity is Key**: Pay close attention to specific times mentioned for activities (e.g., "09:00 AM", "14:30"). If exact times aren't present, infer logical times.
4. **Dining Recommendations**: Identify any specific restaurants or dining experiences mentioned. Extract them into a dedicated 'restaurants' list.
5. **Flight Details**: Extract duration (e.g., "8h 30m") and stops (e.g., "Non-stop", "1 Stop").
6. Create a short, inspiring summary of the trip.
7. The currency should be formatted (e.g., "USD", "EUR").

**IMPORTANT**: You must output **ONLY VALID JSON**. Do not include any markdown formatting, backticks, or explanations.
The JSON structure must be exactly as follows:
{
 "customerName": "string",
 "tripTitle": "string",
 "destination": "string",
 "startDate": "string",
 "endDate": "string",
 "totalPrice": "string",
 "currency": "string",
 "summary": "string",
 "heroImage": "string (REAL URL from Google Search or empty string)",
 "flights": [{ "airline": "string", "flightNumber": "string", "departureTime": "string", "departureAirport": "string", "arrivalTime": "string", "arrivalAirport": "string", "date": "string", "duration": "string", "stops": "string" }],
 "hotels": [{ "name": "string", "location": "string", "checkIn": "string", "checkOut": "string", "amenities": ["string"], "roomType": "string", "image": "string (REAL URL from Google Search or empty string)", "rating": "string", "reviewCount": "string", "recentReview": "string" }],
 "restaurants": [{ "name": "string", "cuisine": "string", "description": "string", "image": "string (REAL URL from Google Search or empty string)" }],
 "itinerary": [{ "day": number, "date": "string", "title": "string", "image": "string (REAL URL from Google Search or empty string)", "activities": [{ "time": "string", "description": "string", "location": "string" }] }],
 "inclusions": ["string"],
 "exclusions": ["string"],
 "travelTips": ["string"]
}
`;

// Helper to check for quota errors
const isQuotaError = (e: any): boolean => {
 const msg = e.toString().toLowerCase();
 return (
  msg.includes("429") ||
  msg.includes("resource_exhausted") ||
  msg.includes("quota") ||
  e.status === 429
 );
};

// Helper for 500 errors
const isInternalError = (e: any): boolean => {
 const status = e.status || e.code;
 const msg = e.message || e.toString();
 return status === 500 || status === 503 || status === "INTERNAL" || msg.includes("Internal error") || msg.includes("internal_error");
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to validate if a URL is likely a real image URL
const isValidImageUrl = (url: string): boolean => {
 if (!url || url.trim() === "") return false;
 try {
  const parsed = new URL(url);
  // Must be http or https
  if (!['http:', 'https:'].includes(parsed.protocol)) return false;
  // Reject obvious placeholder/fake patterns
  if (url.includes('placeholder') || url.includes('example.com')) return false;
  // Reject data: URLs (AI generated)
  if (url.startsWith('data:')) return false;
  return true;
 } catch {
  return false;
 }
};

export const generateQuotation = async (
 textInput: string,
 files: FileUpload[]
): Promise<TravelQuotation> => {
 if (!process.env.API_KEY) {
  throw new Error("API Key is missing");
 }

 const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

 const parts: any[] = [];

 // Add text input
 if (textInput) {
  parts.push({ text: `User Notes: ${textInput}` });
 }

 // Add files (images or PDFs)
 files.forEach((file) => {
  // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
  const base64Data = file.data.split(",")[1];
  parts.push({
   inlineData: {
    mimeType: file.type,
    data: base64Data,
   },
  });
 });

 if (parts.length === 0) {
  throw new Error("Please provide text details or upload a file.");
 }

 // Generate the structured data using Google Search Grounding for real image URLs
 let response;
 let lastError;
 const maxRetries = 3;

 for (let attempt = 0; attempt < maxRetries; attempt++) {
  try {
   // Attempt 1 & 2: Use Google Search (Tools) - CRITICAL for finding real image URLs
   // Attempt 3: Fallback to NO Tools
   const useTools = attempt < 2;

   if (attempt > 0) {
    const backoffTime = 1000 * Math.pow(2, attempt - 1);
    console.warn(`Retry attempt ${attempt + 1} for text generation... (Tools: ${useTools}). Waiting ${backoffTime}ms.`);
    await sleep(backoffTime);
   }

   response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: {
     role: "user",
     parts: parts,
    },
    config: {
     systemInstruction: SYSTEM_INSTRUCTION,
     tools: useTools ? [{ googleSearch: {} }] : undefined,
    },
   });

   // If successful, break the loop
   break;

  } catch (e: any) {
   lastError = e;

   if (isQuotaError(e)) {
    throw new Error("AI Text Generation Quota Exceeded. Please try again later.");
   }

   if (isInternalError(e)) {
    if (attempt === maxRetries - 1) continue;
    continue;
   }

   throw e;
  }
 }

 if (!response?.text) {
  console.error("Final API Error:", lastError);
  throw lastError || new Error("Failed to generate response from AI after multiple attempts.");
 }

 // Parse JSON manually, handling potential Markdown code blocks
 let cleanText = response.text.trim();
 const codeBlockMatch = cleanText.match(/```json([\s\S]*?)```/) || cleanText.match(/```([\s\S]*?)```/);
 if (codeBlockMatch) {
  cleanText = codeBlockMatch[1].trim();
 }

 // REPAIR STRATEGY for truncated JSON
 if (cleanText.endsWith('}') && !cleanText.match(/\]\s*\}$/)) {
  cleanText = cleanText.substring(0, cleanText.length - 1) + '] }';
 }

 let quotationData: TravelQuotation;
 try {
  quotationData = JSON.parse(cleanText) as TravelQuotation;
 } catch (e) {
  console.error("Failed to parse JSON response:", cleanText);
  throw new Error("AI generated an invalid format. Please try again.");
 }

 // ========================================================
 // VALIDATE IMAGE URLs - Only keep real, working URLs
 // If URL looks fake or broken, clear it so the UI shows
 // an upload placeholder instead.
 // ========================================================

 // Validate hero image
 if (!isValidImageUrl(quotationData.heroImage || "")) {
  quotationData.heroImage = "";
 }

 // Validate hotel images
 if (quotationData.hotels) {
  quotationData.hotels.forEach(hotel => {
   if (!isValidImageUrl(hotel.image || "")) {
    hotel.image = "";
   }
  });
 }

 // Validate restaurant images
 if (quotationData.restaurants) {
  quotationData.restaurants.forEach(restaurant => {
   if (!isValidImageUrl(restaurant.image || "")) {
    restaurant.image = "";
   }
  });
 }

 // Validate itinerary images
 if (quotationData.itinerary) {
  quotationData.itinerary.forEach(day => {
   if (!isValidImageUrl(day.image || "")) {
    day.image = "";
   }
  });
 }

 // NO AI IMAGE GENERATION - we only use real URLs from Google Search
 // If an image URL is empty, the UI will show an upload placeholder
 // so the user can manually add the correct image.

 return quotationData;
};

// Keep the enhanceLogo function as-is (it's for logo editing, not quotation images)
export const enhanceLogo = async (
 imageBase64: string,
 mimeType: string,
 prompt: string
): Promise<string> => {
 if (!process.env.API_KEY) {
  throw new Error("API Key is missing");
 }

 const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
 const base64Data = imageBase64.split(",")[1];

 const maxRetries = 3;
 for (let attempt = 0; attempt < maxRetries; attempt++) {
  try {
   if (attempt > 0) {
    const backoffTime = 1000 * Math.pow(2, attempt - 1);
    await sleep(backoffTime);
   }

   const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
     parts: [
      {
       inlineData: {
        mimeType: mimeType,
        data: base64Data,
       },
      },
      {
       text: `Enhance this logo based on the following instructions: ${prompt}. Return only the image.`,
      },
     ],
    },
   });

   let generatedImageBase64 = '';
   if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
     if (part.inlineData && part.inlineData.data) {
      generatedImageBase64 = `data:image/png;base64,${part.inlineData.data}`;
      break;
     }
    }
   }

   if (!generatedImageBase64) {
    throw new Error("No image generated by the model.");
   }

   return generatedImageBase64;

  } catch (e) {
   if (isQuotaError(e)) {
    throw new Error("Daily image generation quota reached. Please try again later.");
   }
   if (isInternalError(e) && attempt < maxRetries - 1) {
    console.warn(`Logo enhance retry ${attempt + 1}`);
    continue;
   }
   throw e;
  }
 }
 throw new Error("Failed to enhance logo after multiple attempts.");
};