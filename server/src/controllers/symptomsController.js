import { analyzeSymptoms } from '../services/aiService.js';

const diseaseProfiles = [
  {
    disease: 'Acute Viral Fever / Flu',
    doctor: 'General Physician',
    careType: 'Hospital Visit',
    risk: 'Medium',
    advice:
      'Rest well, drink plenty of fluids, monitor temperature, and seek a medical check if fever continues or breathing worsens.',
    precautions:
      'Stay hydrated, isolate if contagious symptoms are present, use fever medicine only as advised, and monitor temperature regularly.',
    keywords: ['fever', 'cough', 'body pain', 'body ache', 'fatigue', 'chills', 'headache'],
  },
  {
    disease: 'Common Cold / Upper Respiratory Infection',
    doctor: 'General Physician',
    careType: 'Home Care',
    risk: 'Low',
    advice:
      'Take rest, use steam inhalation if needed, stay hydrated, and observe whether symptoms improve within a few days.',
    precautions:
      'Drink warm fluids, avoid cold exposure, cover coughs and sneezes, and get evaluated if fever or shortness of breath appears.',
    keywords: ['runny nose', 'sneezing', 'sore throat', 'nasal congestion', 'mild cough', 'cold'],
  },
  {
    disease: 'Migraine / Severe Headache Disorder',
    doctor: 'Neurologist',
    careType: 'Hospital Visit',
    risk: 'Medium',
    advice:
      'Rest in a quiet dark room, avoid bright screens, and consult a doctor if headaches are severe, recurring, or associated with vomiting.',
    precautions:
      'Avoid strong light, loud noise, missed meals, and dehydration. Track recurring episodes and triggers.',
    keywords: ['headache', 'nausea', 'vomiting', 'light sensitivity', 'migraine', 'throbbing'],
  },
  {
    disease: 'Gastroenteritis / Food Poisoning',
    doctor: 'General Physician',
    careType: 'Hospital Visit',
    risk: 'Medium',
    advice:
      'Focus on oral hydration and seek medical care quickly if there is ongoing vomiting, weakness, or reduced urine output.',
    precautions:
      'Use safe fluids, avoid oily food, eat light meals, and watch for dehydration or blood in stools.',
    keywords: ['stomach pain', 'abdominal pain', 'diarrhea', 'vomiting', 'loose motion', 'nausea'],
  },
  {
    disease: 'Possible Asthma / Bronchospasm',
    doctor: 'Pulmonologist',
    careType: 'Hospital Visit',
    risk: 'High',
    advice:
      'Get medical care soon, especially if breathing is difficult, wheezing increases, or chest tightness is worsening.',
    precautions:
      'Avoid smoke, dust, and allergens. Use prescribed inhalers only if already advised by a doctor.',
    keywords: ['wheezing', 'shortness of breath', 'breathing difficulty', 'breathlessness', 'chest tightness', 'asthma'],
  },
  {
    disease: 'Possible Pneumonia / Lower Respiratory Infection',
    doctor: 'Pulmonologist',
    careType: 'Hospital Visit',
    risk: 'High',
    advice:
      'Seek urgent medical evaluation, especially if fever is high, cough is productive, or there is chest pain with breathing.',
    precautions:
      'Rest, stay hydrated, monitor oxygen-related symptoms, and do not ignore fast breathing or confusion.',
    keywords: ['fever', 'cough', 'chest pain', 'breathing difficulty', 'phlegm', 'weakness'],
  },
  {
    disease: 'Possible Heart-Related Chest Pain',
    doctor: 'Cardiologist',
    careType: 'Emergency care',
    risk: 'High',
    advice:
      'Chest pain with sweating, breathlessness, dizziness, or pain spreading to the arm or jaw needs immediate emergency assessment.',
    precautions:
      'Avoid exertion and seek emergency help immediately if symptoms are sudden, severe, or associated with collapse-like feeling.',
    keywords: ['chest pain', 'left arm pain', 'jaw pain', 'sweating', 'dizziness', 'pressure in chest'],
  },
  {
    disease: 'Throat Infection / Tonsillitis',
    doctor: 'ENT Specialist',
    careType: 'Hospital Visit',
    risk: 'Low',
    advice:
      'Warm fluids and rest may help, but persistent throat pain, high fever, or difficulty swallowing should be checked by a doctor.',
    precautions:
      'Avoid cold drinks, maintain hydration, use soothing warm fluids, and monitor for fever or worsening pain.',
    keywords: ['sore throat', 'pain while swallowing', 'throat pain', 'tonsil', 'hoarseness'],
  },
  {
    disease: 'Urinary Tract Infection',
    doctor: 'General Physician',
    careType: 'Hospital Visit',
    risk: 'Medium',
    advice:
      'Consult a doctor for urine-related burning, urgency, or lower abdominal discomfort, especially if fever is present.',
    precautions:
      'Drink plenty of water, avoid delaying urination, and seek medical care if there is fever or back pain.',
    keywords: ['burning urine', 'burning urination', 'frequent urination', 'urine urgency', 'lower abdominal pain'],
  },
  {
    disease: 'Possible Dengue / Mosquito-Borne Viral Illness',
    doctor: 'General Physician',
    careType: 'Hospital Visit',
    risk: 'High',
    advice:
      'Fever with severe body pain, headache behind the eyes, or rash should be evaluated urgently to rule out dengue.',
    precautions:
      'Stay hydrated, avoid self-medicating with blood-thinning painkillers unless prescribed, and monitor bleeding symptoms.',
    keywords: ['high fever', 'body pain', 'joint pain', 'rash', 'eye pain', 'platelet'],
  },
];

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const includesKeyword = (text, keyword) => {
  if (text.includes(keyword)) {
    return true;
  }

  const pattern = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, 'i');
  return pattern.test(text);
};

const buildFallbackAssessment = (symptoms) => {
  const text = symptoms.toLowerCase().trim();

  const scoredProfiles = diseaseProfiles
    .map((profile) => ({
      ...profile,
      score: profile.keywords.reduce((count, keyword) => count + (includesKeyword(text, keyword) ? 1 : 0), 0),
    }))
    .filter((profile) => profile.score > 0)
    .sort((a, b) => b.score - a.score);

  const bestMatch = scoredProfiles[0];

  if (!bestMatch) {
    return {
      predicted_disease: 'Non-specific Symptom Pattern',
      doctor_suggestion: 'General Physician',
      care_type: 'Hospital Visit',
      precautions:
        'Track the exact symptoms, temperature, duration, and any worsening signs before meeting a doctor.',
      risk_level: 'Medium',
      advice:
        'The symptoms are too general for a safe prediction. A doctor should assess you directly if the problem continues or worsens.',
      disclaimer:
        'This is an AI-assisted first-pass assessment, not a confirmed medical diagnosis. Please consult a doctor for proper evaluation.',
    };
  }

  return {
    predicted_disease: bestMatch.disease,
    doctor_suggestion: bestMatch.doctor,
    care_type: bestMatch.careType,
    precautions: bestMatch.precautions,
    risk_level: bestMatch.risk,
    advice: bestMatch.advice,
    disclaimer:
      'This is an AI-assisted first-pass assessment, not a confirmed medical diagnosis. Please consult a doctor for proper evaluation.',
  };
};

const normalizeAssessment = (assessment, symptoms) => {
  const fallback = buildFallbackAssessment(symptoms);

  return {
    predicted_disease: assessment?.predicted_disease?.trim() || fallback.predicted_disease,
    doctor_suggestion: assessment?.doctor_suggestion?.trim() || fallback.doctor_suggestion,
    care_type: assessment?.care_type?.trim() || fallback.care_type,
    precautions: assessment?.precautions?.trim() || fallback.precautions,
    risk_level: assessment?.risk_level?.trim() || fallback.risk_level,
    advice: assessment?.advice?.trim() || fallback.advice,
    disclaimer:
      assessment?.disclaimer?.trim() ||
      'This is an AI-assisted first-pass assessment, not a confirmed medical diagnosis. Please consult a doctor for proper evaluation.',
  };
};

export const assessSymptoms = async (req, res) => {
  try {
    const { symptoms, language = 'English' } = req.body;

    if (!symptoms?.trim()) {
      return res.status(400).json({ error: 'Symptoms are required' });
    }

    let response;

    try {
      response = await analyzeSymptoms(symptoms, language);
    } catch (error) {
      console.error('AI symptom analysis failed, using local fallback:', error.message);
      response = buildFallbackAssessment(symptoms);
    }

    res.status(200).json(normalizeAssessment(response, symptoms));
  } catch (error) {
    console.error('assessSymptoms error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getPatientSymptomHistory = async (req, res) => {
  try {
    const { patientId } = req.params;

    const history = [
      { date: '2026-03-20', symptoms: 'fever, cough', patientId },
      { date: '2026-03-22', symptoms: 'headache, nausea', patientId },
    ];

    res.status(200).json(history);
  } catch (error) {
    console.error('history error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
