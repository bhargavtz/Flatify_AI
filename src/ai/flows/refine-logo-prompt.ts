'use server';

/**
 * @fileOverview Refines logo generation prompts using AI to predictably generate high-quality outputs.
 *
 * - refineLogoPrompt - A function that refines a logo prompt.
 * - RefineLogoPromptInput - The input type for the refineLogoPrompt function.
 * - RefineLogoPromptOutput - The return type for the refineLogoPrompt function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { requireSignedIn } from '@/lib/auth-api';

const RefineLogoPromptInputSchema = z.object({
  prompt: z
    .string()
    .describe('The original logo generation prompt to be refined.'),
});
export type RefineLogoPromptInput = z.infer<typeof RefineLogoPromptInputSchema>;

const RefineLogoPromptOutputSchema = z.object({
  refinedPrompt: z
    .string()
    .describe('The refined logo generation prompt for better results.'),
});
export type RefineLogoPromptOutput = z.infer<typeof RefineLogoPromptOutputSchema>;

export async function refineLogoPrompt(input: RefineLogoPromptInput): Promise<RefineLogoPromptOutput> {
  await requireSignedIn();
  return refineLogoPromptFlow(input);
}

const refineLogoPromptFlow = ai.defineFlow(
  {
    name: 'refineLogoPromptFlow',
    inputSchema: RefineLogoPromptInputSchema,
    outputSchema: RefineLogoPromptOutputSchema,
  },
  async (input) => {
    const res = await ai.generate({
      model: 'googleai/gemini-3.6-flash',
      prompt: `You are an expert flat logo prompt engineer.
Take the user's prompt and enhance it with flat design keywords, specific vector shapes, modern color schemes, and clean typography:

Original Prompt: ${input.prompt}

Return ONLY the refined prompt text with no quotation marks or meta commentary.`,
    });

    return { refinedPrompt: res.text.trim() || input.prompt };
  }
);
