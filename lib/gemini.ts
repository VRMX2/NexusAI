
import { GoogleGenAI, Modality, Type, GenerateContentResponse } from "@google/genai";

// Ensure API key is available
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface ChatMessage {
  role: 'user' | 'model';
  parts: any[];
}

export async function generateText(
  prompt: string, 
  options: { 
    model?: string, 
    history?: ChatMessage[], 
    useSearch?: boolean, 
    useMaps?: boolean,
    useThinking?: boolean,
    location?: { latitude: number, longitude: number }
  } = {}
) {
  const ai = getAI();
  const modelName = options.model || (options.useThinking ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview');
  
  const tools: any[] = [];
  if (options.useSearch) tools.push({ googleSearch: {} });
  if (options.useMaps) tools.push({ googleMaps: {} });

  const config: any = {
    tools: tools.length > 0 ? tools : undefined,
  };

  if (options.useMaps && options.location) {
    config.toolConfig = {
      retrievalConfig: {
        latLng: options.location
      }
    };
  }

  if (options.useThinking && modelName.includes('gemini-3')) {
    config.thinkingConfig = { thinkingBudget: 32768 };
  }

  const contents = options.history ? [...options.history, { role: 'user', parts: [{ text: prompt }] }] : prompt;

  const response = await ai.models.generateContent({
    model: modelName,
    contents,
    config
  });

  return {
    text: response.text,
    grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
}

// Added mandatory key check for Pro image generation model
export async function generateImage(prompt: string, config: { aspectRatio: string, imageSize: "1K" | "2K" | "4K" }) {
  const ai = getAI();
  
  // Checking for API key selection for gemini-3-pro-image-preview
  if (!(await (window as any).aistudio.hasSelectedApiKey())) {
    await (window as any).aistudio.openSelectKey();
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: {
        aspectRatio: config.aspectRatio,
        imageSize: config.imageSize
      }
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
}

export async function editImage(prompt: string, base64Image: string, mimeType: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType } },
        { text: prompt }
      ]
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No edited image generated");
}

export async function generateVideo(prompt: string, options: { image?: { data: string, mimeType: string }, aspectRatio: '16:9' | '9:16' }) {
  const ai = getAI();
  
  // Checking for API key selection for Veo models
  if (!(await (window as any).aistudio.hasSelectedApiKey())) {
    await (window as any).aistudio.openSelectKey();
  }

  const payload: any = {
    model: 'veo-3.1-fast-generate-preview',
    prompt,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: options.aspectRatio
    }
  };

  if (options.image) {
    payload.image = {
      imageBytes: options.image.data,
      mimeType: options.image.mimeType
    };
  }

  let operation = await ai.models.generateVideos(payload);

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await videoResponse.blob();
  return URL.createObjectURL(blob);
}

export async function analyzeMedia(prompt: string, media: { data: string, mimeType: string }) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { inlineData: { data: media.data, mimeType: media.mimeType } },
        { text: prompt }
      ]
    }
  });
  return response.text;
}

export async function transcribeAudio(base64Audio: string, mimeType: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Audio, mimeType } },
        { text: "Transcribe the following audio precisely. Only provide the text." }
      ]
    }
  });
  return response.text;
}

export async function textToSpeech(text: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
}
