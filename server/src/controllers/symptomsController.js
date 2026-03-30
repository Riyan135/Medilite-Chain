import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ✅ MAIN FUNCTION (used by frontend)
export const assessSymptoms = async (req, res) => {
  try {
    const { symptoms } = req.body;

    if (!symptoms) {
      return res.status(400).json({ error: "Symptoms are required" });
    }

    let predicted_disease = "Common Cold";
    let risk_level = "Low";

    const text = symptoms.toLowerCase();

    if (text.includes("fever") && text.includes("cough")) {
      predicted_disease = "Flu";
      risk_level = "Medium";
    }

    if (text.includes("headache") && text.includes("nausea")) {
      predicted_disease = "Migraine";
      risk_level = "Low";
    }

    if (text.includes("chest pain")) {
      predicted_disease = "Heart Disease";
      risk_level = "High";
    }

    if (text.includes("sore throat")) {
      predicted_disease = "Throat Infection";
      risk_level = "Low";
    }

    if (text.includes("breathing")) {
      predicted_disease = "Asthma";
      risk_level = "High";
    }

    const response = {
      predicted_disease,
      risk_level,
      doctor_suggestion:
        risk_level === "High"
          ? "Consult a doctor immediately"
          : "Take rest and monitor symptoms",

      care_type:
        risk_level === "High"
          ? "Emergency care"
          : "Home care",

      precautions:
        "Stay hydrated, eat healthy food, and rest well.",

      advice:
        "If symptoms worsen, consult a doctor.",

      disclaimer:
        "This is AI-generated advice and not a medical diagnosis.",
    };

    res.status(200).json(response);

  } catch (error) {
    console.error("❌ assessSymptoms error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ SECOND FUNCTION (used in route)
export const getPatientSymptomHistory = async (req, res) => {
  try {
    const { patientId } = req.params;

    // dummy data (replace with DB later)
    const history = [
      { date: "2026-03-20", symptoms: "fever, cough" },
      { date: "2026-03-22", symptoms: "headache" }
    ];

    res.status(200).json(history);

  } catch (error) {
    console.error("❌ history error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};