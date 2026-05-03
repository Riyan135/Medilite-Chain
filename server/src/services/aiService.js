import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';

const getGeminiApiKey = () => process.env.GEMINI_API_KEY?.trim();

const getGenAI = () => {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing. Add a valid Google Gemini API key to server/.env and restart the backend.');
  }

  return new GoogleGenerativeAI(apiKey);
};

const parseGeminiError = (error) => {
  const message = error.message || 'Gemini request failed';

  if (message.includes('API_KEY_INVALID') || message.includes('API Key not found')) {
    return 'GEMINI_API_KEY is invalid or not enabled for the Gemini API. Create a new key in Google AI Studio, update server/.env, and restart the backend.';
  }

  if (message.includes('quota') || message.includes('RESOURCE_EXHAUSTED')) {
    return 'Gemini API quota is exhausted for this key. Check billing/quota or use another valid Gemini API key.';
  }

  return message;
};

const parseJsonResponse = (text) => {
  const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleanedText);
};

export const getAiStatus = () => {
  const apiKey = getGeminiApiKey();

  return {
    configured: Boolean(apiKey),
    keyLooksLikeGoogleKey: Boolean(apiKey && apiKey.startsWith('AIza') && apiKey.length >= 30),
    model: 'gemini-2.5-flash',
  };
};

export const summarizeReport = async (fileUrl, type, language = 'English') => {
  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Fetch the file from the URL
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      throw new Error(`Failed to fetch file from URL: ${fileResponse.statusText}`);
    }
    
    const arrayBuffer = await fileResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Get the mime type from the response, default to pdf if unknown
    const mimeType = fileResponse.headers.get('content-type') || 'application/pdf';

    const prompt = `
      You are a specialized medical assistant. Analyze the provided medical document.
      The document type is ${type}.
      Please provide a concise and clear summary of the key findings, diagnosis, and recommendations.
      The summary must be in ${language}.
      If the language is Hindi or Kannada, ensure the medical terms are explained simply.
      Format the response as JSON with the following structure:
      {
        "key_findings": ["point 1", "point 2"],
        "diagnosis": "concise diagnosis",
        "recommendations": ["rec 1", "rec 2"],
        "disclaimer": "This is an AI-generated summary for informational purposes only. Please consult a doctor for official diagnosis."
      }
    `;

    const filePart = {
      inlineData: {
        data: buffer.toString("base64"),
        mimeType
      }
    };

    const result = await model.generateContent([prompt, filePart]);
    const response = await result.response;
    const text = response.text();

    return parseJsonResponse(text);
  } catch (error) {
    console.error('Error in summarizeReport detailed:', error);
    throw new Error(parseGeminiError(error));
  }
};

export const generateHealthOverview = async (records, language = 'English') => {
  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const recordsText = records.map(r => `Type: ${r.type}, Title: ${r.title}, Summary: ${JSON.stringify(r.summary)}`).join('\n');

    const prompt = `
      You are a specialized medical consultant. Based on the following list of medical records and their individual summaries, 
      provide a comprehensive "whole picture" health overview for the patient.
      
      Records:
      ${recordsText}
      
      Please analyze trends, recurring issues, and provide a holistic health status.
      The overview must be in ${language}.
      If the language is Hindi or Kannada, ensure the medical terms are explained simply.
      
      Format the response as JSON with the following structure:
      {
        "status_overview": "A paragraph summarizing the overall health status",
        "key_trends": ["trend 1", "trend 2"],
        "concerns": ["concern 1", "concern 2"],
        "long_term_advice": ["advice 1", "advice 2"],
        "disclaimer": "This is an AI-generated holistic overview for informational purposes only. Please consult your primary physician for a formal review."
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return parseJsonResponse(text);
  } catch (error) {
    console.error('Error in generateHealthOverview:', error);
    throw new Error(parseGeminiError(error));
  }
};

export const analyzeSymptoms = async (symptoms, language = 'English') => {
  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are a specialized medical AI assistant. Analyze the following patient symptoms.
      Symptoms: "${symptoms}"
      
      Please provide an assessment in ${language}.
      If the language is Hindi or Kannada, ensure the medical terms are explained simply.
      
      Format the response strictly as a JSON object with the following structure:
      {
        "predicted_disease": "Name of the most likely disease or condition based on symptoms",
        "doctor_suggestion": "Specialist to consult (e.g., General Physician, Cardiologist)",
        "care_type": "Home Care or Hospital Visit",
        "precautions": "A string containing basic precautions or steps to take",
        "risk_level": "Low, Medium, or High",
        "advice": "A short, basic advice related to the condition",
        "disclaimer": "This is an AI-generated assessment for informational purposes only. Please consult a doctor for official diagnosis."
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return parseJsonResponse(text);
  } catch (error) {
    console.error('Error in analyzeSymptoms:', error);
    throw new Error(parseGeminiError(error));
  }
};

