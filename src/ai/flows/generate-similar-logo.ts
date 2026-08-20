'use server';
/**
 * @fileOverview An AI agent that generates a new logo similar to a provided source image, adapted for a user's business.
 *
 * - generateSimilarLogo - A function that handles the image-based logo generation process.
 * - GenerateSimilarLogoInput - The input type for the generateSimilarLogo function.
 * - GenerateSimilarLogoOutput - The return type for the generateSimilarLogo function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { requireSignedIn } from '@/lib/auth-api';

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
  await requireSignedIn();
  return generateSimilarLogoFlow(input);
}

const generateSimilarLogoFlow = ai.defineFlow(
  {
    name: 'generateSimilarLogoFlow',
    inputSchema: GenerateSimilarLogoInputSchema,
    outputSchema: GenerateSimilarLogoOutputSchema,
  },
  async (input) => {
    let promptText = `You are an expert flat vector logo designer.
Analyze the source design context and generate a *new* flat design SVG logo for:
Business Name: "${input.businessName}"
Description: "${input.businessDescription}"

Strict Rules:
1. Output ONLY valid XML SVG code wrapped inside \`\`\`xml ... \`\`\`.
2. The SVG MUST have \`viewBox="0 0 512 512"\`, \`xmlns="http://www.w3.org/2000/svg"\`, width="100%", height="100%".
3. Adhere to flat design principles: minimalism, bold geometric shapes, clean typography.`;

    if (input.colorPalette) {
      promptText += ` Use a ${input.colorPalette} color palette.`;
    }
    if (input.fontStyle) {
      promptText += ` The font style should be ${input.fontStyle}.`;
    }
    if (input.logoShape) {
      promptText += ` The logo should have a ${input.logoShape} shape.`;
    }

    const res = await ai.generate({
      model: 'googleai/gemini-3.6-flash',
      prompt: [
        { media: { url: input.sourceImageUri } },
        { text: promptText },
      ],
    });

    const text = res.text || '';
    const match = text.match(/```(?:xml|svg)?([\s\S]*?)```/) || [null, text];
    let svg = (match[1] || text).trim();

    if (!svg.includes('<svg')) {
      const safeName = input.businessName.replace(/["<>]/g, '');
      const initials = safeName.slice(0, 2).toUpperCase() || 'FL';
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <rect width="512" height="512" rx="128" fill="#10B981"/>
  <circle cx="256" cy="220" r="110" fill="#ffffff" opacity="0.15"/>
  <text x="256" y="245" font-family="system-ui, -apple-system, sans-serif" font-size="88" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${initials}</text>
  <text x="256" y="385" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="600" fill="#ffffff" text-anchor="middle" letter-spacing="2">${safeName}</text>
</svg>`;
    }

    const logoDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    return { logoDataUri };
  }
);
