import { GoogleGenAI, Type } from "@google/genai";
import { TravelQuotation, FileUpload } from "../types";

const SYSTEM_INSTRUCTION = `
You are an expert travel consultant for "Waya.AI". Your goal is to extract structured travel quotation details from the provided user notes and documents.

Rules:
1. Extract customer name, pricing, flights, hotels, and daily itinerary.
2. **Granularity is Key**: Pay close attention to specific times mentioned for activities (e.g., "09:00 AM", "14:30"). If exact times aren't present, infer logical times like "Morning", "Afternoon", or "Evening" based on the sequence.
3. **Dining Recommendations**: Identify any specific restaurants or dining experiences mentioned. Extract them into a dedicated 'restaurants' list, capturing the name, cuisine type, and a brief description/vibe.
4. **Activity Details**: Ensure activity descriptions are precise, including specific locations or venue names where available.
5. Create a short, inspiring summary of the trip.
6. Generate practical travel tips relevant to the destination.
7. Format the output strictly as JSON.
8. The currency should be formatted (e.g., "USD", "EUR").
9. Ensure the itinerary is sorted by date/day.
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

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: {
      role: "user",
      parts: parts,
    },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          customerName: { type: Type.STRING },
          tripTitle: { type: Type.STRING },
          destination: { type: Type.STRING },
          startDate: { type: Type.STRING },
          endDate: { type: Type.STRING },
          totalPrice: { type: Type.STRING },
          currency: { type: Type.STRING },
          summary: { type: Type.STRING },
          flights: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                airline: { type: Type.STRING },
                flightNumber: { type: Type.STRING },
                departureTime: { type: Type.STRING },
                departureAirport: { type: Type.STRING },
                arrivalTime: { type: Type.STRING },
                arrivalAirport: { type: Type.STRING },
                date: { type: Type.STRING },
              },
            },
          },
          hotels: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                location: { type: Type.STRING },
                checkIn: { type: Type.STRING },
                checkOut: { type: Type.STRING },
                amenities: { type: Type.ARRAY, items: { type: Type.STRING } },
                roomType: { type: Type.STRING },
              },
            },
          },
          restaurants: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                cuisine: { type: Type.STRING },
                description: { type: Type.STRING },
              },
            },
          },
          itinerary: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                day: { type: Type.INTEGER },
                date: { type: Type.STRING },
                title: { type: Type.STRING },
                activities: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      time: { type: Type.STRING },
                      description: { type: Type.STRING },
                      location: { type: Type.STRING },
                    },
                  },
                },
              },
            },
          },
          inclusions: { type: Type.ARRAY, items: { type: Type.STRING } },
          exclusions: { type: Type.ARRAY, items: { type: Type.STRING } },
          travelTips: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: [
          "customerName",
          "tripTitle",
          "totalPrice",
          "itinerary",
        ],
      },
    },
  });

  if (!response.text) {
    throw new Error("No response from AI");
  }

  return JSON.parse(response.text) as TravelQuotation;
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

  // Using 'gemini-2.5-flash-image' (Nano Banana) for image enhancement
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
    config: {
      // responseMimeType is not supported for nano banana
      // responseSchema is not supported for nano banana
    }
  });

  // Extract the image from the response parts
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
