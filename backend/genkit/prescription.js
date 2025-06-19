import { gemini20Flash, googleAI } from '@genkit-ai/googleai';
import { genkit } from 'genkit';
import { z } from 'zod';
import fetch from 'node-fetch';

// Genkit AI instance
const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GENKIT_ENV,
    }),
  ],
  model: gemini20Flash,
});

// This system relies exclusively on OpenFDA API and AI-powered search for drug information
// No local database is used, ensuring up-to-date information without maintenance overhead

// Function to get doctor's preferred medications based on past prescriptions
async function getDoctorPreferredMedications(doctorId, diagnosis, symptoms) {
  try {
    // Import the model dynamically to avoid circular dependencies
    const DoctorPreferences = await import('../models/doctorPreferencesModel.js').then(m => m.default);
    
    console.log(`Retrieving medication preferences for doctor ${doctorId} for diagnosis: ${diagnosis}`);
    
    // Get preferences from the database
    const preferredMedications = await DoctorPreferences.getDoctorPreferredMedications(
      doctorId, 
      diagnosis, 
      symptoms
    );
    
    return preferredMedications || {};
  } catch (error) {
    console.error('Error getting doctor preferred medications:', error);
    return {};
  }
}

// Function to fetch drugs from OpenFDA API
async function fetchDrugsFromOpenFDA(condition) {
  try {
    const searchTerm = encodeURIComponent(condition);
    const url = `https://api.fda.gov/drug/label.json?search=indications_and_usage:${searchTerm}&limit=10`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data && data.results && data.results.length > 0) {
      // Extract drug names and information from the API response
      return data.results.map(result => {
        return {
          name: result.openfda?.brand_name?.[0] || result.openfda?.generic_name?.[0] || "Unknown",
          purpose: result.purpose?.[0] || result.indications_and_usage?.[0] || "",
          warnings: result.warnings?.[0] || "",
        };
      });
    }
    return [];
  } catch (error) {
    console.error('Error fetching from OpenFDA:', error);
    return [];
  }
}

// Function to use AI to search for relevant medications when local data is insufficient
async function searchMedicationsForCondition(condition, symptoms) {
  // Build a comprehensive search string
  const searchTerms = [condition, ...symptoms].join(", ");
  
  const prompt = `
You are a medical database assistant. I need information about medications commonly prescribed for the following condition and symptoms:
Condition/Symptoms: ${searchTerms}

Please provide information about 5-8 relevant medications in this JSON format:
[
  {
    "name": "Medication Name",
    "purpose": "Brief description of what it treats",
    "dosageForm": "pill, injection, etc.",
    "typicalDosage": "typical dosage range",
    "commonSideEffects": ["side effect 1", "side effect 2"]
  }
]

Only include medications that are commonly prescribed by doctors for these specific symptoms or conditions. Focus on first-line treatments with well-established safety profiles.
`;

  try {
    const { output } = await ai.generate({
      prompt,
      output: { 
        schema: z.array(z.object({
          name: z.string(),
          purpose: z.string(),
          dosageForm: z.string(),
          typicalDosage: z.string(),
          commonSideEffects: z.array(z.string())
        }))
      },
      temperature: 0.2,
    });
    
    return output;
  } catch (error) {
    console.error('Error searching for medications:', error);
    return [];
  }
}

// Function to learn from doctor's prescription modifications
export async function learnFromDoctorModifications(originalPrescription, modifiedPrescription, doctorId, patientSymptoms, diagnosis) {
  try {
    // Import the model dynamically to avoid circular dependencies
    const DoctorPreferences = await import('../models/doctorPreferencesModel.js').then(m => m.default);
    
    // Extract the medications from both prescriptions
    const originalMeds = originalPrescription.medications.map(med => med.name);
    const modifiedMeds = modifiedPrescription.medications.map(med => med.name);
    
    // Determine which medications were added, removed, or kept
    const addedMeds = modifiedMeds.filter(med => !originalMeds.includes(med));
    const removedMeds = originalMeds.filter(med => !modifiedMeds.includes(med));
    const keptMeds = originalMeds.filter(med => modifiedMeds.includes(med));
    
    console.log(`Learning from doctor ${doctorId}'s modifications for diagnosis: ${diagnosis}`);
    console.log(`Added: ${addedMeds.join(', ')}`);
    console.log(`Removed: ${removedMeds.join(', ')}`);
    console.log(`Kept: ${keptMeds.join(', ')}`);
    
    // Find or create doctor preferences document
    let doctorPrefs = await DoctorPreferences.findOne({ doctorId });
    
    if (!doctorPrefs) {
      doctorPrefs = new DoctorPreferences({ doctorId, medications: [] });
    }
    
    // Update doctor preferences based on these modifications
    await doctorPrefs.updatePreferences(
      originalPrescription,
      modifiedPrescription,
      diagnosis,
      patientSymptoms
    );
    
    return {
      doctorId,
      timestamp: new Date(),
      diagnosis,
      symptoms: patientSymptoms,
      changes: {
        added: addedMeds,
        removed: removedMeds,
        kept: keptMeds
      }
    };
  } catch (error) {
    console.error('Error learning from doctor modifications:', error);
    return null;
  }
}

// Schema for a medication in the prescription
const MedicationSchema = z.object({
  name: z.string().describe("Name of the medication"),
  dosage: z.string().describe("Dosage information (e.g., '500mg')"),
  frequency: z.string().describe("How often to take (e.g., 'twice daily')"),
  duration: z.string().describe("How long to take the medication (e.g., '7 days')"),
  instructions: z.string().describe("Special instructions for taking this medication"),
  purpose: z.string().describe("Why this medication is being prescribed"),
  possibleSideEffects: z.array(z.string()).describe("Common side effects to watch for")
});

// Schema for prescription output
const PrescriptionSchema = z.object({
  medications: z.array(MedicationSchema).describe("List of prescribed medications"),
  diagnosis: z.string().describe("Preliminary diagnosis or assessment"),
  generalInstructions: z.string().describe("General instructions for the patient"),
  followUp: z.string().describe("Follow-up recommendations"),
  lifestyle: z.array(z.string()).describe("Lifestyle or diet recommendations"),
  precautions: z.array(z.string()).describe("Important precautions for the patient"),
  referrals: z.array(z.string()).optional().describe("Specialist referrals if needed")
});

// Schema for patient information input
const PatientInfoSchema = z.object({
  patientName: z.string().describe("Patient's name"),
  patientAge: z.number().describe("Patient's age"),
  patientGender: z.string().optional().describe("Patient's gender"),
  symptoms: z.array(z.string()).describe("Patient's reported symptoms"),
  medicalHistory: z.array(z.string()).optional().describe("Relevant medical history"),
  allergies: z.array(z.string()).optional().describe("Known allergies"),
  currentMedications: z.array(z.string()).optional().describe("Medications the patient is currently taking"),
  doctorNotes: z.string().optional().describe("Additional doctor's notes about the patient"),
  doctorId: z.string().optional().describe("The ID of the doctor creating this prescription, used for personalization")
});

// Flow for generating prescription recommendations
export const generatePrescription = ai.defineFlow(
  {
    name: 'generatePrescription',
    inputSchema: PatientInfoSchema,
    outputSchema: PrescriptionSchema,
  },
  async (patientInfo) => {
    // Step 1: Try to determine a likely diagnosis from symptoms for better medication matching
    let preliminaryDiagnosis = "";
    try {
      const diagnosisPrompt = `
Based on these symptoms: ${patientInfo.symptoms.join(', ')}
${patientInfo.medicalHistory ? `And medical history: ${patientInfo.medicalHistory.join(', ')}` : ''}

What is the most likely preliminary diagnosis or condition? Provide just the name of the condition, no explanation.
`;
      const { output: diagnosis } = await ai.generate({
        prompt: diagnosisPrompt,
        output: { schema: z.string() },
        temperature: 0.1,
      });
      preliminaryDiagnosis = diagnosis;
    } catch (error) {
      console.error('Error determining preliminary diagnosis:', error);
    }    // Step 2: Build a comprehensive drug list from multiple sources
    let drugsList = [];
    let doctorPreferences = {};
    
    // Source 0: Doctor's preferences (if doctor ID is provided)
    if (patientInfo.doctorId && preliminaryDiagnosis) {
      try {
        doctorPreferences = await getDoctorPreferredMedications(
          patientInfo.doctorId,
          preliminaryDiagnosis,
          patientInfo.symptoms
        );
        
        // Add doctor's preferred medications to the top of the list (if any exist)
        const preferredMeds = Object.keys(doctorPreferences);
        if (preferredMeds.length > 0) {
          drugsList = drugsList.concat(
            preferredMeds.map(med => `${med} (Doctor's frequent choice)`)
          );
        }
      } catch (error) {
        console.error('Error fetching doctor preferences:', error);
      }
    }
    
    // Source 1: OpenFDA API (if we have a diagnosis to search)
    if (preliminaryDiagnosis) {
      try {
        const fdaDrugs = await fetchDrugsFromOpenFDA(preliminaryDiagnosis);
        if (fdaDrugs.length > 0) {
          drugsList = drugsList.concat(
            fdaDrugs.map(drug => `${drug.name} (${drug.purpose.substring(0, 50)}...)`)
          );
        }
      } catch (error) {
        console.error('Error fetching from OpenFDA:', error);
      }
    }
    
    // Source 2: AI-powered web search for additional medications
    if (preliminaryDiagnosis) {
      try {
        const searchedMedications = await searchMedicationsForCondition(
          preliminaryDiagnosis, 
          patientInfo.symptoms
        );
        
        if (searchedMedications.length > 0) {
          drugsList = drugsList.concat(
            searchedMedications.map(med => `${med.name} (${med.purpose.substring(0, 50)}...)`)
          );
        }
      } catch (error) {
        console.error('Error searching for medications:', error);
      }
    }
      // Deduplicate and take the top 30
    const uniqueDrugs = [...new Set(drugsList)].slice(0, 30);
    
    // Fallback if we still don't have drugs
    const relevantDrugs = uniqueDrugs.length > 0 ? 
      uniqueDrugs : 
      ["Note: Unable to retrieve specific medication data from OpenFDA or AI search. Recommendations will be generic."];    const prompt = `
You are an AI assistant to a doctor. Generate a comprehensive prescription recommendation based on the patient information.
Your recommendation will be reviewed by the doctor before being finalized, so be thorough and professional.

PATIENT INFORMATION:
Name: ${patientInfo.patientName}
Age: ${patientInfo.patientAge}
${patientInfo.patientGender ? `Gender: ${patientInfo.patientGender}` : ''}
Symptoms: ${patientInfo.symptoms.join(', ')}
${patientInfo.medicalHistory && patientInfo.medicalHistory.length > 0 ? `Medical History: ${patientInfo.medicalHistory.join(', ')}` : ''}
${patientInfo.allergies && patientInfo.allergies.length > 0 ? `Allergies: ${patientInfo.allergies.join(', ')}` : ''}
${patientInfo.currentMedications && patientInfo.currentMedications.length > 0 ? `Current Medications: ${patientInfo.currentMedications.join(', ')}` : ''}
${patientInfo.doctorNotes ? `Doctor's Notes: ${patientInfo.doctorNotes}` : ''}

AVAILABLE MEDICATIONS (select from these or suggest others if needed):
${relevantDrugs.join(', ')}

${Object.keys(doctorPreferences).length > 0 ? 
  `NOTE: Medications listed with "(Doctor's frequent choice)" are this doctor's preferred medications for similar cases and should be prioritized when appropriate.` : ''}

Based on this information, please generate a detailed prescription recommendation in JSON format with the following structure:
1. A likely diagnosis
2. Medications with detailed instructions
3. General instructions for the patient
4. Follow-up recommendations
5. Lifestyle recommendations
6. Important precautions
7. Specialist referrals if needed

IMPORTANT GUIDELINES:
- Be specific with medication dosages, frequencies, and durations
- Consider patient age, symptoms, and medical history
- Note any potential drug interactions with current medications
- Include practical lifestyle recommendations
- Suggest appropriate follow-up timeframes
- Consider this a RECOMMENDATION only that requires doctor review
`;

    const { output } = await ai.generate({
      prompt,
      output: { schema: PrescriptionSchema },
      temperature: 0.2, // Lower temperature for more consistent recommendations
    });

    return output;
  }
);

// Flow for checking if prescribed medications have interactions with patient's current medications
export const checkPrescriptionInteractions = ai.defineFlow(
  {
    name: 'checkPrescriptionInteractions',
    inputSchema: z.object({
      prescribedMedications: z.array(z.string()).describe("Medications in the new prescription"),
      currentMedications: z.array(z.string()).describe("Medications the patient is already taking")
    }),
    outputSchema: z.array(z.object({
      interaction: z.string().describe("Description of the potential interaction"),
      severity: z.enum(["high", "moderate", "low"]).describe("Severity of the interaction"),
      recommendation: z.string().describe("Recommendation for managing this interaction")
    })),
  },
  async ({ prescribedMedications, currentMedications }) => {
    const prompt = `
You are a pharmacology expert. Review these medications for potential interactions.

PRESCRIBED MEDICATIONS:
${prescribedMedications.join(', ')}

CURRENT MEDICATIONS:
${currentMedications.join(', ')}

Identify any significant drug interactions between the prescribed and current medications.
For each potential interaction, provide:
1. A clear description of the interaction
2. The severity level (high, moderate, or low)
3. A recommendation for managing the interaction

Format your response as a JSON array of interaction objects.
If there are no significant interactions, return an empty array.
`;

    const { output } = await ai.generate({
      prompt,
      output: { 
        schema: z.array(z.object({
          interaction: z.string(),
          severity: z.enum(["high", "moderate", "low"]),
          recommendation: z.string()
        })) 
      },
    });

    return output;
  }
);

// Flow for providing patient-friendly medication instructions
export const generatePatientInstructions = ai.defineFlow(
  {
    name: 'generatePatientInstructions',
    inputSchema: z.object({
      patientName: z.string().describe("Patient's name"),
      medications: z.array(MedicationSchema).describe("Prescribed medications"),
      patientAge: z.number().optional().describe("Patient's age"),
      diagnosis: z.string().optional().describe("Patient's diagnosis")
    }),
    outputSchema: z.object({
      medicationSchedule: z.string().describe("Easy-to-follow medication schedule"),
      keyPoints: z.array(z.string()).describe("Important points for the patient to remember"),
      sideEffectsToWatch: z.string().describe("Side effects that require medical attention"),
      followUpReminder: z.string().describe("Follow-up appointment reminder")
    }),
  },
  async ({ patientName, medications, patientAge, diagnosis }) => {
    const prompt = `
Create simple, patient-friendly medication instructions for ${patientName}${patientAge ? ` (${patientAge} years old)` : ''}.
${diagnosis ? `The patient has been diagnosed with: ${diagnosis}` : ''}

MEDICATIONS:
${JSON.stringify(medications, null, 2)}

Create clear instructions that:
1. Provide an easy-to-follow daily schedule for all medications
2. Highlight key points about taking the medications correctly
3. List important side effects that require medical attention
4. Include a follow-up appointment reminder

Write in simple, non-technical language appropriate for patient education.
`;

    const { output } = await ai.generate({
      prompt,
      output: { 
        schema: z.object({
          medicationSchedule: z.string(),
          keyPoints: z.array(z.string()),
          sideEffectsToWatch: z.string(),
          followUpReminder: z.string()
        }) 
      },
    });

    return output;
  }
);

// Function to apply doctor's modifications to a prescription and learn from them
export async function applyDoctorModifications(originalPrescription, doctorModifications, doctorId) {
  try {
    // Create a new prescription object with the doctor's modifications
    const modifiedPrescription = {
      ...originalPrescription,
      ...doctorModifications,
      modifiedBy: doctorId,
      modifiedAt: new Date()
    };
    
    // Learn from the modifications if we have enough context
    if (doctorId && modifiedPrescription.diagnosis && originalPrescription.medications) {
      await learnFromDoctorModifications(
        originalPrescription,
        modifiedPrescription,
        doctorId,
        modifiedPrescription.patientSymptoms || [],
        modifiedPrescription.diagnosis
      );
    }
    
    return modifiedPrescription;
  } catch (error) {
    console.error('Error applying doctor modifications:', error);
    return originalPrescription;
  }
}