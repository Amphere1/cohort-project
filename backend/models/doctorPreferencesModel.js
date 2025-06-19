import mongoose from 'mongoose';

// Schema for storing individual medication preferences
const MedicationPreferenceSchema = new mongoose.Schema({
  medicationName: {
    type: String,
    required: true,
    trim: true
  },
  preferenceScore: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
    default: 0.5
  },
  prescriptionCount: {
    type: Number,
    default: 1
  },
  diagnoses: [{
    type: String,
    trim: true
  }],
  commonSymptoms: [{
    type: String,
    trim: true
  }],
  lastPrescribed: {
    type: Date,
    default: Date.now
  }
});

// Schema for storing doctor's prescription modifications
const PrescriptionModificationSchema = new mongoose.Schema({
  originalPrescription: {
    type: Object,
    required: true
  },
  modifiedPrescription: {
    type: Object,
    required: true
  },
  diagnosis: {
    type: String,
    required: true,
    trim: true
  },
  symptoms: [{
    type: String,
    trim: true
  }],
  patientAge: {
    type: Number
  },
  patientGender: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Schema for doctor's medication preferences
const DoctorPreferencesSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  medications: [MedicationPreferenceSchema],
  prescriptionHistory: [PrescriptionModificationSchema],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index to quickly find doctor preferences
DoctorPreferencesSchema.index({ doctorId: 1 });
DoctorPreferencesSchema.index({ 'medications.medicationName': 1, doctorId: 1 });

// Method to update medication preferences based on a new prescription
DoctorPreferencesSchema.methods.updatePreferences = async function(originalPrescription, modifiedPrescription, diagnosis, symptoms) {
  const addedMeds = modifiedPrescription.medications
    .filter(med => !originalPrescription.medications.some(origMed => origMed.name === med.name))
    .map(med => med.name);
  
  const removedMeds = originalPrescription.medications
    .filter(med => !modifiedPrescription.medications.some(modMed => modMed.name === med.name))
    .map(med => med.name);
  
  const keptMeds = originalPrescription.medications
    .filter(med => modifiedPrescription.medications.some(modMed => modMed.name === med.name))
    .map(med => med.name);
  
  // Increase preference scores for added and kept medications
  for (const medName of [...addedMeds, ...keptMeds]) {
    const existingMed = this.medications.find(m => m.medicationName === medName);
    
    if (existingMed) {
      // Increase preference score for existing medication
      existingMed.preferenceScore = Math.min(1, existingMed.preferenceScore + 0.05);
      existingMed.prescriptionCount += 1;
      existingMed.lastPrescribed = new Date();
      
      // Add diagnosis and symptoms if they don't already exist
      if (diagnosis && !existingMed.diagnoses.includes(diagnosis)) {
        existingMed.diagnoses.push(diagnosis);
      }
      
      if (symptoms && symptoms.length > 0) {
        for (const symptom of symptoms) {
          if (!existingMed.commonSymptoms.includes(symptom)) {
            existingMed.commonSymptoms.push(symptom);
          }
        }
      }
    } else {
      // Add new medication preference
      this.medications.push({
        medicationName: medName,
        preferenceScore: 0.6, // Start slightly above average
        prescriptionCount: 1,
        diagnoses: diagnosis ? [diagnosis] : [],
        commonSymptoms: symptoms || [],
        lastPrescribed: new Date()
      });
    }
  }
  
  // Decrease preference scores for removed medications
  for (const medName of removedMeds) {
    const existingMed = this.medications.find(m => m.medicationName === medName);
    
    if (existingMed) {
      // Decrease preference score
      existingMed.preferenceScore = Math.max(0, existingMed.preferenceScore - 0.1);
      
      // If score is very low and it was prescribed for the same diagnosis, consider it strongly disliked
      if (existingMed.preferenceScore < 0.2 && existingMed.diagnoses.includes(diagnosis)) {
        existingMed.preferenceScore = 0.1; // Very low preference
      }
    }
  }
  
  // Add to prescription history
  this.prescriptionHistory.push({
    originalPrescription,
    modifiedPrescription,
    diagnosis,
    symptoms,
    patientAge: modifiedPrescription.patientAge,
    patientGender: modifiedPrescription.patientGender,
    timestamp: new Date()
  });
  
  // Limit history size to prevent document growth
  if (this.prescriptionHistory.length > 100) {
    this.prescriptionHistory = this.prescriptionHistory.slice(-100);
  }
  
  this.lastUpdated = new Date();
  return this.save();
};

// Static method to get doctor's preferred medications for a specific diagnosis
DoctorPreferencesSchema.statics.getDoctorPreferredMedications = async function(doctorId, diagnosis, symptoms) {
  try {
    const doctorPrefs = await this.findOne({ doctorId });
    
    if (!doctorPrefs || !doctorPrefs.medications || doctorPrefs.medications.length === 0) {
      return {};
    }
    
    const preferredMeds = {};
    
    // First, prioritize medications that match both diagnosis and symptoms
    for (const med of doctorPrefs.medications) {
      if (med.preferenceScore >= 0.5) { // Only include if preference is average or higher
        let relevanceScore = med.preferenceScore;
        
        // Boost score if this medication is commonly prescribed for this diagnosis
        if (med.diagnoses.includes(diagnosis)) {
          relevanceScore += 0.2;
        }
        
        // Boost score if medication treats similar symptoms
        if (symptoms && symptoms.length > 0) {
          const matchingSymptoms = symptoms.filter(s => med.commonSymptoms.includes(s));
          if (matchingSymptoms.length > 0) {
            relevanceScore += 0.1 * (matchingSymptoms.length / symptoms.length);
          }
        }
        
        // Include recency factor (more recently prescribed gets higher score)
        const daysSinceLastPrescribed = (new Date() - new Date(med.lastPrescribed)) / (1000 * 60 * 60 * 24);
        if (daysSinceLastPrescribed < 30) { // If prescribed in last month
          relevanceScore += 0.1;
        }
        
        preferredMeds[med.medicationName] = Math.min(1, relevanceScore);
      }
    }
    
    return preferredMeds;
  } catch (error) {
    console.error('Error getting doctor preferred medications:', error);
    return {};
  }
};

const DoctorPreferences = mongoose.model('DoctorPreferences', DoctorPreferencesSchema);

export default DoctorPreferences;
