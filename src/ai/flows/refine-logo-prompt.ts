// The directive tells the Next.js runtime that this code should only be executed on the server.
'use server';

/**
 * @fileOverview Refines logo generation prompts using AI to predictably generate high-quality outputs.
 *
 * - refineLogoPrompt - A function that refines a logo prompt.
 * - RefineLogoPromptInput - The input type for the refineLogoPrompt function.
 * - RefineLogoPromptOutput - The return type for the refineLogoPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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
  return refineLogoPromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'refineLogoPromptPrompt',
  input: {schema: RefineLogoPromptInputSchema},
  output: {schema: RefineLogoPromptOutputSchema},
  prompt: `You are an expert logo prompt engineer.

  Your goal is to take a user's prompt and improve it so that it will generate better results from a text-to-image AI model.
  Pay close attention to details that would improve the logo, such as specifying flat design principles like minimalism, bold geometric shapes, vibrant colors, clean typography, and the absence of gradients, shadows, or 3D effects.
  Suggest specific keywords related to flat design, modern aesthetics, and current design trends. Provide details about specific shapes, colors, and typography.

  Original Prompt: {{{prompt}}}

  Refined Prompt: `,
});

const refineLogoPromptFlow = ai.defineFlow(
  {
    name: 'refineLogoPromptFlow',
    inputSchema: RefineLogoPromptInputSchema,
    outputSchema: RefineLogoPromptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
