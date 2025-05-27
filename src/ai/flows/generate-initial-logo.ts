// use server'
'use server';
/**
 * @fileOverview A flat design logo generator for small business owners.
 *
 * - generateInitialLogo - A function that handles the logo generation process.
 * - GenerateInitialLogoInput - The input type for the generateInitialLogo function.
 * - GenerateInitialLogoOutput - The return type for the generateInitialLogo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateInitialLogoInputSchema = z.object({
  businessName: z.string().describe('The name of the business.'),
  businessDescription: z.string().describe('A brief description of the business.'),
});
export type GenerateInitialLogoInput = z.infer<typeof GenerateInitialLogoInputSchema>;

const GenerateInitialLogoOutputSchema = z.object({
  logoDataUri: z
    .string()
    .describe(
      "A data URI of the generated logo image, that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateInitialLogoOutput = z.infer<typeof GenerateInitialLogoOutputSchema>;

export async function generateInitialLogo(input: GenerateInitialLogoInput): Promise<GenerateInitialLogoOutput> {
  return generateInitialLogoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInitialLogoPrompt',
  input: {schema: GenerateInitialLogoInputSchema},
  output: {schema: GenerateInitialLogoOutputSchema},
  prompt: `You are an AI logo generator specializing in flat design logos.

  Generate a flat design logo based on the following business information:

  Business Name: {{{businessName}}}
  Business Description: {{{businessDescription}}}

  The logo should adhere to flat design principles: minimalism, bold geometric shapes, vibrant colors, clean typography, and the absence of gradients, shadows, or 3D effects.

  Return the logo as a data URI.
  `,
});

const generateInitialLogoFlow = ai.defineFlow(
  {
    name: 'generateInitialLogoFlow',
    inputSchema: GenerateInitialLogoInputSchema,
    outputSchema: GenerateInitialLogoOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      // IMPORTANT: ONLY the googleai/gemini-2.0-flash-exp model is able to generate images. You MUST use exactly this model to generate images.
      model: 'googleai/gemini-2.0-flash-exp',

      prompt: `Generate a flat design logo for a business named ${input.businessName} that can be described as ${input.businessDescription}`,

      config: {
        responseModalities: ['TEXT', 'IMAGE'], // MUST provide both TEXT and IMAGE, IMAGE only won't work
      },
    });

    return {logoDataUri: media.url!};
  }
);
