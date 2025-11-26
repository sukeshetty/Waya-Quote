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
   - Attempt to find a **DIRECT public URL** for an image (ending in .jpg, .png) for hotels and restaurants.
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
  "flights": [{ "airline": "string", "flightNumber": "string", "departureTime": "string", "departureAirport": "string", "arrivalTime": "string", "arrivalAirport": "string", "date": "string", "duration": "string", "stops": "string" }],
  "hotels": [{ "name": "string", "location": "string", "checkIn": "string", "checkOut": "string", "amenities": ["string"], "roomType": "string", "image": "string", "rating": "string", "reviewCount": "string", "recentReview": "string" }],
  "restaurants": [{ "name": "string", "cuisine": "string", "description": "string", "image": "string" }],
  "itinerary": [{ "day": number, "date": "string", "title": "string", "image": "string", "activities": [{ "time": "string", "description": "string", "location": "string" }] }],
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
    return status === 500 || status === 503 || status === "INTERNAL" || msg.includes("Internal error");
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

  // 1. Generate the initial structured data using Google Search Grounding for accuracy
  // IMPLEMENTING RETRY LOGIC FOR 500 ERRORS
  let response;
  let lastError;
  const maxRetries = 3;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
          // Attempt 1 & 2: Use Google Search (Tools)
          // Attempt 3: Fallback to NO Tools to prevent crashing if the tool is the cause of the 500 error
          const useTools = attempt < 2;
          
          if (attempt > 0) {
              console.warn(`Retry attempt ${attempt + 1} for text generation... (Tools: ${useTools})`);
              await sleep(1000 * attempt); // Exponential backoff
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
             // If it's the last attempt, we let it throw outside the loop
             if (attempt === maxRetries - 1) continue; 
             // Otherwise continue to next iteration (retry)
             continue;
          }

          // For other errors (400, etc), throw immediately
          throw e;
      }
  }

  if (!response?.text) {
      console.error("Final API Error:", lastError);
      throw lastError || new Error("Failed to generate response from AI after multiple attempts.");
  }

  // Parse JSON manually, handling potential Markdown code blocks more robustly
  let cleanText = response.text.trim();
  const codeBlockMatch = cleanText.match(/```json([\s\S]*?)```/) || cleanText.match(/```([\s\S]*?)```/);
  if (codeBlockMatch) {
      cleanText = codeBlockMatch[1].trim();
  }

  // REPAIR STRATEGY:
  // The schema ends with arrays (inclusions, exclusions, travelTips).
  // If the model output is truncated or malformed, it often misses the closing ']' for the last array.
  // We check if it ends with '}' but NOT ']}' (ignoring whitespace).
  if (cleanText.endsWith('}') && !cleanText.match(/\]\s*\}$/)) {
      // It likely looks like "... "some tip" }" so we insert the missing bracket.
      cleanText = cleanText.substring(0, cleanText.length - 1) + '] }';
  }

  let quotationData: TravelQuotation;
  try {
    quotationData = JSON.parse(cleanText) as TravelQuotation;
  } catch (e) {
    console.error("Failed to parse JSON response:", cleanText);
    throw new Error("AI generated an invalid format. Please try again.");
  }

  // 2. Parallel Visual Enrichment
  const imageTasks: Promise<void>[] = [];

  // Helper regex to check if a URL is likely a direct image
  const isDirectImage = (url: string) => {
    if (!url) return false;
    if (url.startsWith('data:')) return true;
    // Strict check for extension
    return url.startsWith('http') && /\.(jpeg|jpg|gif|png|webp)$/i.test(url.split('?')[0]);
  };

  // Force AI Generation for Hero Image to ensure it's "stunning" and definitely renders
  imageTasks.push(
    generateTravelImage(`Cinematic 8k wide shot of ${quotationData.destination}, golden hour, travel photography, breathtaking view`)
    .then(url => { if (url) quotationData.heroImage = url; })
    .catch(e => console.error("Hero generation failed", e))
  );

  // Hotel Images - ALWAYS FORCE AI GENERATION
  // We ignore the search result image to ensure we have a rendering, high-quality asset.
  if (quotationData.hotels) {
    quotationData.hotels.forEach(hotel => {
      hotel.image = ""; // Clear potentially broken search link
      imageTasks.push(
        generateTravelImage(`Luxury hotel exterior of ${hotel.name} in ${hotel.location}, sunny day, architectural photography, 4k, photorealistic`)
          .then(url => { if (url) hotel.image = url; })
          .catch(e => console.error(`Hotel image generation failed for ${hotel.name}`, e))
      );
    });
  }

  // Restaurant Images
  if (quotationData.restaurants) {
    quotationData.restaurants.forEach(restaurant => {
      // ALWAYS Clear the image from text model to prevent duplicate placeholders.
      // We rely on either the unique AI image generation OR the curated UI fallback list.
      restaurant.image = ""; 

      imageTasks.push(
        generateTravelImage(`Delicious plated food at ${restaurant.name}, ${restaurant.cuisine} cuisine, fine dining atmosphere, food photography`)
          .then(url => { if (url) restaurant.image = url; })
          .catch(e => console.error(`Restaurant image generation failed for ${restaurant.name}`, e))
      );
    });
  }

  // Itinerary Images - Force AI generation for these to ensure coverage
  if (quotationData.itinerary) {
    quotationData.itinerary.forEach(day => {
        // We generally ignore the text model's image for itinerary as it's often generic or broken
        // Generating specific images for each day is much richer.
        const prompt = `Travel photography of ${day.title} in ${quotationData.destination}, scenic view, 4k, tourist attraction`;
        imageTasks.push(
          generateTravelImage(prompt)
            .then(url => { if (url) day.image = url; })
            .catch(e => console.error(`Itinerary image generation failed for Day ${day.day}`, e))
        );
    });
  }

  await Promise.allSettled(imageTasks);

  return quotationData;
};

// Helper to generate an image using Nano Banana
const generateTravelImage = async (prompt: string): Promise<string> => {
    if (!process.env.API_KEY) return "";
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: {
                // No mime/schema for nano banana image gen
            }
        });

        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
        }
        return "";
    } catch (e: any) {
        if (isQuotaError(e)) {
            console.warn("Image generation quota exceeded. Skipping AI image generation.");
            // Return empty string to allow UI to fallback to Unsplash placeholders
            return ""; 
        }
        console.error("Image gen error:", e);
        return "";
    }
};

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

  try {
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
    throw e;
  }
};