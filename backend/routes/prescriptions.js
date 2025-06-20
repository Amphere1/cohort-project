import express from 'express';
import verifyToken from '../middleware/auth.js';
import verifyDoctor from '../middleware/doctorAuth.js';
import { verifyReceptionist } from '../middleware/roleAuth.js';
import { 
  generatePrescription, 
  applyDoctorModifications, 
  checkPrescriptionInteractions, 
  generatePatientInstructions 
} from '../genkit/prescription.js';

const router = express.Router();

// Get a doctor's prescription preferences
router.get('/doctor-preferences', verifyDoctor, async (req, res) => {
  try {
    const DoctorPreferences = await import('../models/doctorPreferencesModel.js').then(m => m.default);
    const doctorId = req.doctorData.doctorId;
    
    const preferences = await DoctorPreferences.findOne({ doctorId });
    
    if (!preferences) {
      return res.status(200).json({
        message: 'No prescription preferences found for this doctor',
        preferences: {}
      });
    }
    
    return res.status(200).json({
      preferences: preferences.medications
        .filter(med => med.preferenceScore >= 0.6) // Only return high preference items
        .sort((a, b) => b.preferenceScore - a.preferenceScore)
    });
  } catch (error) {
    console.error('Error getting doctor preferences:', error);
    return res.status(500).json({
      message: 'Error retrieving doctor preferences',
      error: error.message
    });
  }
});

// Generate a prescription recommendation
router.post('/generate', verifyDoctor, async (req, res) => {
  try {
    // Add doctor ID to the patient info for personalized recommendations
    const patientInfo = {
      ...req.body,
      doctorId: req.doctorData.doctorId.toString()
    };
    
    // Validate required fields
    if (!patientInfo.patientName || !patientInfo.patientAge || !patientInfo.symptoms || !patientInfo.symptoms.length) {
      return res.status(400).json({
        message: 'Missing required patient information'
      });
    }
    
    // Generate prescription recommendation
    const prescription = await generatePrescription(patientInfo);
    
    return res.status(200).json({
      message: 'Prescription generated successfully',
      prescription
    });
  } catch (error) {
    console.error('Error generating prescription:', error);
    return res.status(500).json({
      message: 'Error generating prescription',
      error: error.message
    });
  }
});

// Apply doctor's modifications to a prescription and learn from them
router.post('/modify', verifyDoctor, async (req, res) => {
  try {
    const { originalPrescription, modifications } = req.body;
    const doctorId = req.doctorData.doctorId;
    
    if (!originalPrescription || !modifications) {
      return res.status(400).json({
        message: 'Both original prescription and modifications are required'
      });
    }
    
    // Apply doctor's modifications and learn from them
    const modifiedPrescription = await applyDoctorModifications(
      originalPrescription,
      modifications,
      doctorId
    );
    
    // Check for drug interactions with patient's current medications
    let interactions = [];
    
    if (modifiedPrescription.medications && Array.isArray(modifiedPrescription.medications)) {
      const prescribedMedications = modifiedPrescription.medications.map(med => med.name);
      const currentMedications = req.body.currentMedications || [];
      
      if (prescribedMedications.length > 0 && currentMedications.length > 0) {
        interactions = await checkPrescriptionInteractions({
          prescribedMedications,
          currentMedications
        });
      }
    }
    
    // Generate patient-friendly instructions
    const patientInstructions = await generatePatientInstructions({
      patientName: modifiedPrescription.patientName || "Patient",
      medications: modifiedPrescription.medications,
      patientAge: modifiedPrescription.patientAge,
      diagnosis: modifiedPrescription.diagnosis
    });
    
    return res.status(200).json({
      message: 'Prescription modified and personalized successfully',
      prescription: modifiedPrescription,
      interactions,
      patientInstructions
    });
    
  } catch (error) {
    console.error('Error modifying prescription:', error);
    return res.status(500).json({
      message: 'Error modifying prescription',
      error: error.message
    });
  }
});

// Doctor-only endpoint to get all prescriptions modified by this doctor
router.get('/doctor-prescriptions', verifyDoctor, async (req, res) => {
  try {
    // Since verifyDoctor middleware ensures this is a doctor
    const doctorId = req.doctorData.doctorId;
    
    const DoctorPreferences = await import('../models/doctorPreferencesModel.js').then(m => m.default);
    
    // Get the doctor's preferences document which includes prescription history
    const doctorPrefs = await DoctorPreferences.findOne({ doctorId });
    
    if (!doctorPrefs) {
      return res.status(200).json({
        message: 'No prescription history found for this doctor',
        prescriptions: []
      });
    }
    
    // Sort prescriptions by date (most recent first) and limit to 50
    const prescriptionHistory = doctorPrefs.prescriptionHistory
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 50)
      .map(p => ({
        original: {
          diagnosis: p.originalPrescription.diagnosis,
          medications: p.originalPrescription.medications.map(m => m.name)
        },
        modified: {
          diagnosis: p.modifiedPrescription.diagnosis,
          medications: p.modifiedPrescription.medications.map(m => m.name)
        },
        patientAge: p.patientAge,
        patientGender: p.patientGender,
        diagnosis: p.diagnosis,
        symptoms: p.symptoms,
        timestamp: p.timestamp
      }));
    
    return res.status(200).json({
      message: 'Doctor prescription history retrieved successfully',
      prescriptions: prescriptionHistory
    });
  } catch (error) {
    console.error('Error fetching doctor prescriptions:', error);
    return res.status(500).json({
      message: 'Error fetching doctor prescriptions',
      error: error.message
    });
  }
});

// Check drug interactions for a prescription
router.post('/interactions', verifyDoctor, async (req, res) => {
  try {
    const { medications, currentMedications = [] } = req.body;
    
    if (!medications || !Array.isArray(medications)) {
      return res.status(400).json({
        message: 'Medications array is required'
      });
    }
    
    // Extract medication names from the prescription
    const prescribedMedications = medications.map(med => 
      typeof med === 'string' ? med : med.name
    ).filter(Boolean);
    
    if (prescribedMedications.length === 0) {
      return res.status(400).json({
        message: 'No valid medications found to check'
      });
    }
    
    // Check for drug interactions
    const interactions = await checkPrescriptionInteractions({
      prescribedMedications,
      currentMedications
    });
    
    return res.status(200).json({
      message: 'Drug interactions checked successfully',
      interactions,
      prescribedMedications,
      currentMedications
    });
    
  } catch (error) {
    console.error('Error checking drug interactions:', error);
    return res.status(500).json({
      message: 'Error checking drug interactions',
      error: error.message
    });
  }
});

export default router;
