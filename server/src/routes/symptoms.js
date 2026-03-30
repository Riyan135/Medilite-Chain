import express from 'express';
import { assessSymptoms, getPatientSymptomHistory } from '../controllers/symptomsController.js';

const router = express.Router();

// FIXED ROUTE
router.post('/analyze', async (req, res) => {
    try {
        await assessSymptoms(req, res);
    } catch (error) {
        console.error("❌ Error in /analyze:", error);
        res.status(500).json({ error: error.message || "Internal Server Error" });
    }
});

router.get('/patient/:patientId', async (req, res) => {
    try {
        await getPatientSymptomHistory(req, res);
    } catch (error) {
        console.error("❌ Error in /patient:", error);
        res.status(500).json({ error: error.message || "Internal Server Error" });
    }
});

export default router;