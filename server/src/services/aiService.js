import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const summarizeReport = async (fileUrl, type, language = 'English') => {
  try {
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
    
    // Clean up potential markdown formatting in the JSON response
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('Error in summarizeReport detailed:', error);
    throw new Error(`Failed to generate AI summary: ${error.message} \n ${error.stack}`);
  }
};

export const generateHealthOverview = async (records, language = 'English') => {
  try {
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
    
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('Error in generateHealthOverview:', error);
    throw new Error('Failed to generate health overview');
  }
};

