import { gemini20Flash, googleAI } from '@genkit-ai/googleai';
import { genkit } from 'genkit';
import { z } from 'zod';
import Doctor from '../models/doctorModel.js';

// Genkit AI instance
const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GENKIT_ENV,
    }),
  ],
  model: gemini20Flash,
});

// Schema for medical specialization matching
const SpecializationMatchSchema = z.object({
  recommendedSpecialization: z.string().describe("The most appropriate medical specialization for the symptoms"),
  alternativeSpecializations: z.array(z.string()).describe("Alternative specializations that could also address these symptoms"),
  reasonForRecommendation: z.string().describe("Brief explanation for why this specialization is recommended"),
  urgencyLevel: z.enum(["low", "medium", "high"]).describe("Assessment of the urgency level based on symptoms")
});

// Schema for doctor recommendation
const DoctorRecommendationSchema = z.object({
  doctorId: z.string().optional().describe("The MongoDB ID of the recommended doctor"),
  doctorName: z.string().optional().describe("The name of the recommended doctor"),
  specialization: z.string().describe("The specialization that best matches the symptoms")
});

// Flow for matching symptoms to medical specializations using AI
export const matchSpecialization = ai.defineFlow(
  {
    name: 'matchSpecialization',
    inputSchema: z.object({
      symptoms: z.array(z.string()).describe("Patient's reported symptoms")
    }),
    outputSchema: SpecializationMatchSchema,
  },
  async ({ symptoms }) => {
    const prompt = `
You are an expert medical triage system. Given a list of patient symptoms, determine the most appropriate medical specialization and provide alternatives.

Patient symptoms: ${symptoms.join(', ')}

Respond with:
1. The single most appropriate medical specialization for these symptoms
2. 1-3 alternative specializations that could also address these symptoms
3. A brief explanation of why the primary specialization is recommended
4. An urgency assessment (low/medium/high)

Format your response as a JSON object with these fields:
- recommendedSpecialization: string (e.g., "Cardiology")
- alternativeSpecializations: array of strings
- reasonForRecommendation: string
- urgencyLevel: string (one of "low", "medium", "high")
`;

    const { output } = await ai.generate({
      prompt,
      output: { schema: SpecializationMatchSchema },
    });

    return output;
  }
);

// Function to find the best doctor based on specialization
async function findBestDoctor(specialization, alternativeSpecializations = []) {
  // First try to find an active doctor with the recommended specialization
  let doctor = await Doctor.findOne({ 
    specialization, 
    active: true 
  }).sort({ 'ratings.average': -1 });  // Sort by highest rating
  
  // If no doctor found with primary specialization, try alternatives
  if (!doctor && alternativeSpecializations.length > 0) {
    doctor = await Doctor.findOne({ 
      specialization: { $in: alternativeSpecializations },
      active: true
    }).sort({ 'ratings.average': -1 });
  }
  
  // If still no doctor found, get any available active doctor
  if (!doctor) {
    doctor = await Doctor.findOne({ active: true }).sort({ 'ratings.average': -1 });
  }
  
  return doctor;
}

// Main flow for assigning the appropriate doctor based on symptoms
export const assignDoctorForSymptoms = ai.defineFlow(
  {
    name: 'assignDoctorForSymptoms',
    inputSchema: z.object({
      symptoms: z.array(z.string()).describe("Patient's reported symptoms"),
      preferredDoctor: z.string().optional().describe("Name of preferred doctor if specified")
    }),
    outputSchema: DoctorRecommendationSchema,
  },
  async ({ symptoms, preferredDoctor }) => {    // If preferred doctor is specified, try to find that doctor
    if (preferredDoctor) {
      const doctor = await Doctor.findOne({ 
        name: { $regex: preferredDoctor, $options: 'i' },
        active: true
      });
      
      if (doctor) {
        return {
          doctorId: doctor._id.toString(),
          doctorName: doctor.name,
          specialization: doctor.specialization
        };
      }
      // If preferred doctor not found, fall back to symptom matching
    }
    
    // Use AI to determine the appropriate specialization
    const specializationMatch = await matchSpecialization({ symptoms });
    
    // Find the best doctor based on the recommended specialization
    const doctor = await findBestDoctor(
      specializationMatch.recommendedSpecialization, 
      specializationMatch.alternativeSpecializations
    );
      if (doctor) {
      return {
        doctorId: doctor._id.toString(),
        doctorName: doctor.name,
        specialization: doctor.specialization
      };
    } else {
      // Return just the specialization if no doctor found
      return {
        specialization: specializationMatch.recommendedSpecialization
      };
    }
  }
);

// Flow for getting AI summary of patient symptoms for doctors
export const summarizePatientCase = ai.defineFlow(
  {
    name: 'summarizePatientCase',
    inputSchema: z.object({
      name: z.string().describe("Patient's name"),
      age: z.number().describe("Patient's age"),
      symptoms: z.array(z.string()).describe("Patient's reported symptoms"),
      appointmentReason: z.string().optional().describe("Patient's stated reason for appointment")
    }),
    outputSchema: z.object({
      summary: z.string().describe("Concise summary of the patient case"),
      possibleConditions: z.array(z.string()).describe("Potential conditions based on symptoms"),
      recommendedTests: z.array(z.string()).optional().describe("Recommended diagnostic tests"),
      suggestedQuestions: z.array(z.string()).describe("Suggested questions for the doctor to ask")
    }),
  },
  async ({ name, age, symptoms, appointmentReason }) => {
    const prompt = `
You are assisting a doctor by providing a preliminary analysis of a patient case.

Patient details:
- Name: ${name}
- Age: ${age}
- Symptoms: ${symptoms.join(', ')}
${appointmentReason ? `- Appointment reason: ${appointmentReason}` : ''}

Please provide:
1. A concise clinical summary of this case
2. 2-4 possible conditions that could explain these symptoms (most likely first)
3. Any recommended diagnostic tests that would be appropriate
4. 3-5 important questions the doctor should ask this patient during the consultation

Format your response as a JSON object.
`;

    const { output } = await ai.generate({
      prompt,
      output: { 
        schema: z.object({
          summary: z.string(),
          possibleConditions: z.array(z.string()),
          recommendedTests: z.array(z.string()).optional(),
          suggestedQuestions: z.array(z.string())
        })
      },
    });

    return output;
  }
);