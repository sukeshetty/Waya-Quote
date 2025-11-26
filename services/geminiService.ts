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
   - Attempt to find a **DIRECT public URL** for an image (ending in .jpg, .png) for hotels, restaurants, and itinerary locations. If you find a webpage instead of an image file, leave the image field EMPTY.
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
  // NOTE: responseMimeType: 'application/json' cannot be used combined with tools.
  // We rely on the System Instruction to enforce JSON structure and parse the text manually.
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: {
      role: "user",
      parts: parts,
    },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ googleSearch: {} }], // Enable Search Grounding
    },
  });

  if (!response.text) {
    throw new Error("No response from AI");
  }

  // Parse JSON manually, handling potential Markdown code blocks
  let cleanText = response.text.trim();
  // Remove markdown code blocks if present
  cleanText = cleanText.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "");

  let quotationData: TravelQuotation;
  try {
    quotationData = JSON.parse(cleanText) as TravelQuotation;
  } catch (e) {
    console.error("Failed to parse JSON response:", cleanText);
    throw new Error("AI generated an invalid format. Please try again.");
  }

  // 2. Parallel Visual Enrichment
  // We fire off image generation requests to "fill in the gaps" if real images weren't found
  // or to generate the Hero image.
  
  const imageTasks: Promise<void>[] = [];

  // Helper regex to check if a URL is likely a direct image
  const isDirectImage = (url: string) => {
    if (!url) return false;
    if (url.startsWith('data:')) return true;
    return url.startsWith('http') && /\.(jpeg|jpg|gif|png|webp)$/i.test(url.split('?')[0]);
  };

  // Hero Image (Always generate a fresh cinematic one for the 'wow' factor, 
  // ignoring text model output unless it's a specific data uri we somehow passed)
  if (!quotationData.heroImage || !quotationData.heroImage.startsWith('data:')) {
    imageTasks.push(
      generateTravelImage(`Cinematic 8k wide shot of ${quotationData.destination}, golden hour, travel photography, breathtaking view`)
        .then(url => { if (url) quotationData.heroImage = url; })
        .catch(e => console.error("Hero generation failed", e))
    );
  }

  // Hotel Images
  if (quotationData.hotels) {
    quotationData.hotels.forEach(hotel => {
      // Validate the URL from the text model. 
      // If it's a webpage URL (common with search grounding), discard it and generate a new one.
      const isValid = isDirectImage(hotel.image || '');
      
      if (!isValid) {
        hotel.image = ""; // Clear invalid URL
        imageTasks.push(
          generateTravelImage(`Luxury hotel exterior of ${hotel.name} in ${hotel.location}, architectural photography, 4k`)
            .then(url => { if (url) hotel.image = url; })
            .catch(e => console.error(`Hotel image generation failed for ${hotel.name}`, e))
        );
      }
    });
  }

  // Restaurant Images
  if (quotationData.restaurants) {
    quotationData.restaurants.forEach(restaurant => {
      const isValid = isDirectImage(restaurant.image || '');

      if (!isValid) {
        restaurant.image = ""; // Clear invalid URL
        imageTasks.push(
          generateTravelImage(`Delicious plated food at ${restaurant.name}, ${restaurant.cuisine} cuisine, fine dining atmosphere, food photography`)
            .then(url => { if (url) restaurant.image = url; })
            .catch(e => console.error(`Restaurant image generation failed for ${restaurant.name}`, e))
        );
      }
    });
  }

  // Itinerary Images
  if (quotationData.itinerary) {
    quotationData.itinerary.forEach(day => {
      const isValid = isDirectImage(day.image || '');

      if (!isValid) {
        day.image = ""; // Clear invalid URL
        // Create a prompt based on the day's title and destination
        const prompt = `Travel photography of ${day.title} in ${quotationData.destination}, scenic view, 4k, tourist attraction`;
        imageTasks.push(
          generateTravelImage(prompt)
            .then(url => { if (url) day.image = url; })
            .catch(e => console.error(`Itinerary image generation failed for Day ${day.day}`, e))
        );
      }
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

        // Parse response for image
        // The API returns the image in the parts
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
        }
        return "";
    } catch (e) {
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
};