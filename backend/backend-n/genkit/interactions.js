import { gemini20Flash, googleAI } from '@genkit-ai/googleai';
import { genkit } from 'genkit';
import { z } from 'zod';

// Genkit AI instance
const ai = genkit({
  plugins: [
    googleAI({
      apiKey:process.env.GENKIT_ENV,
    }),
  ],
  model: gemini20Flash,
});

// output schema
const InteractionSchema = z.object({
  highRisk: z.array(
    z.object({
      drug1: z.string(),
      drug2: z.string(),
      reason: z.string(),
    })
  ),
  moderateRisk: z.array(
    z.object({
      drug1: z.string(),
      drug2: z.string(),
      reason: z.string(),
    })
  ),
  lowRisk: z.array(
    z.object({
      drug1: z.string(),
      drug2: z.string(),
      reason: z.string(),
    })
  ),
});

// flow
export const checkInteractions = ai.defineFlow(
  {
    name: 'checkInteractions',
    inputSchema: z.array(
      z.object({
        name: z.string(),
        purpose: z.array(z.string()).optional(),
        interactions: z.array(z.string()).optional(),
        warnings: z.array(z.string()).optional(),
        description: z.string().optional(),
      })
    ),
    outputSchema: InteractionSchema.nullish(),
  },
  async (drugData) => {
    const prompt = `
You are a medical assistant. Analyze the following list of drugs and their possible interactions.

Categorize each drug-drug interaction as one of:
- "highRisk"
- "moderateRisk"
- "lowRisk"

Respond in strict JSON format using this schema:
{
  "highRisk": [ { "drug1": "A", "drug2": "B", "reason": "..." } ],
  "moderateRisk": [...],
  "lowRisk": [...]
}

Here is the drug data:
${JSON.stringify(drugData, null, 2)}
`;

    const { output } = await ai.generate({
      prompt,
      output: { schema: InteractionSchema }, // lowercase `schema`
    });

    return output;
  }
);
