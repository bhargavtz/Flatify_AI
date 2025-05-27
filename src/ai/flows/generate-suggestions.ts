'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSuggestionsInputSchema = z.object({
  businessName: z.string().describe('The name of the business.'),
  suggestionType: z.enum(['description', 'slogan', 'color', 'icon']).describe('The type of suggestion to generate.'),
});
export type GenerateSuggestionsInput = z.infer<typeof GenerateSuggestionsInputSchema>;

const GenerateSuggestionsOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('A list of generated suggestions.'),
});
export type GenerateSuggestionsOutput = z.infer<typeof GenerateSuggestionsOutputSchema>;

export async function generateSuggestions(input: GenerateSuggestionsInput): Promise<GenerateSuggestionsOutput> {
  return generateSuggestionsFlow(input);
}

const generateSuggestionsFlow = ai.defineFlow(
  {
    name: 'generateSuggestionsFlow',
    inputSchema: GenerateSuggestionsInputSchema,
    outputSchema: GenerateSuggestionsOutputSchema,
  },
  async input => {
    let promptText = '';
    switch (input.suggestionType) {
      case 'description':
        promptText = `Generate 3-5 brief and creative business descriptions for a business named "${input.businessName}". Each description should be concise and highlight a unique aspect or style. Return them as a comma-separated list.`;
        break;
      case 'slogan':
        promptText = `Generate 3-5 catchy and memorable slogans for a business named "${input.businessName}". Return them as a comma-separated list.`;
        break;
      case 'color':
        promptText = `Suggest 3-5 hex color codes (e.g., #RRGGBB) that would be suitable for a logo for a business named "${input.businessName}". Focus on colors that evoke the business's nature. Return them as a comma-separated list.`;
        break;
      case 'icon':
        promptText = `Suggest 3-5 simple, flat design icon ideas (e.g., "a stylized leaf", "a minimalist gear") that would be suitable for a logo for a business named "${input.businessName}". Return them as a comma-separated list.`;
        break;
      default:
        throw new Error('Invalid suggestion type');
    }

    const llmResponse = await ai.generate({
      model: 'googleai/gemini-1.5-flash', // Using a text-based model for suggestions
      prompt: promptText,
      config: {
        responseModalities: ['TEXT'],
      },
    });

    const suggestions = llmResponse.text.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
    return { suggestions };
  }
);
