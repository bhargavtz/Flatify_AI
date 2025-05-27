
'use server';
/**
 * @fileOverview An AI agent that generates a new logo similar to a provided source image, adapted for a user's business.
 *
 * - generateSimilarLogo - A function that handles the image-based logo generation process.
 * - GenerateSimilarLogoInput - The input type for the generateSimilarLogo function.
 * - GenerateSimilarLogoOutput - The return type for the generateSimilarLogo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSimilarLogoInputSchema = z.object({
  sourceImageUri: z
    .string()
    .describe(
      "The source image as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  businessName: z.string().describe('The name of the business for the new logo.'),
  businessDescription: z.string().describe('A brief description of the business to guide the new logo design.'),
  colorPalette: z.string().optional().describe('Optional: Desired color palette for the logo (e.g., "vibrant", "monochrome", "pastel").'),
  fontStyle: z.string().optional().describe('Optional: Desired font style for the logo text (e.g., "modern", "classic", "handwritten").'),
  logoShape: z.string().optional().describe('Optional: Desired overall shape or layout for the logo (e.g., "circle", "square", "abstract").'),
});
export type GenerateSimilarLogoInput = z.infer<typeof GenerateSimilarLogoInputSchema>;

const GenerateSimilarLogoOutputSchema = z.object({
  logoDataUri: z
    .string()
    .describe(
      "A data URI of the newly generated logo image, inspired by the source image. Must include a MIME type and use Base64 encoding."
    ),
});
export type GenerateSimilarLogoOutput = z.infer<typeof GenerateSimilarLogoOutputSchema>;

export async function generateSimilarLogo(input: GenerateSimilarLogoInput): Promise<GenerateSimilarLogoOutput> {
  return generateSimilarLogoFlow(input);
}

const generateSimilarLogoFlow = ai.defineFlow(
  {
    name: 'generateSimilarLogoFlow',
    inputSchema: GenerateSimilarLogoInputSchema,
    outputSchema: GenerateSimilarLogoOutputSchema,
  },
  async (input) => {
    let promptText = `Analyze the provided image. Then, generate a *new* flat design logo for a business named "${input.businessName}". This new logo should be conceptually inspired by the style, elements, or feel of the provided image, but tailored to the business description: "${input.businessDescription}". The final output must be a completely new logo, not just a modification of the input image. Adhere to flat design principles: minimalism, bold geometric shapes, vibrant colors, and clean typography, avoiding gradients or 3D effects.`;

    if (input.colorPalette) {
      promptText += ` Use a ${input.colorPalette} color palette.`;
    }
    if (input.fontStyle) {
      promptText += ` The font style should be ${input.fontStyle}.`;
    }
    if (input.logoShape) {
      promptText += ` The logo should have a ${input.logoShape} shape.`;
    }

    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp', // IMPORTANT: Image generation capable model
      prompt: [
        {media: {url: input.sourceImageUri}},
        {
          text: promptText
        },
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'], // MUST provide both TEXT and IMAGE
      },
    });

    if (!media || !media.url) {
      throw new Error('Image generation failed to produce a valid media object.');
    }
    return {logoDataUri: media.url};
  }
);
