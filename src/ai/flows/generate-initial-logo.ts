'use server';
/**
 * @fileOverview A flat design logo generator for small business owners.
 *
 * - generateInitialLogo - A function that handles the logo generation process.
 * - GenerateInitialLogoInput - The input type for the generateInitialLogo function.
 * - GenerateInitialLogoOutput - The return type for the generateInitialLogo function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { requireSignedIn } from '@/lib/auth-api';

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
  await requireSignedIn();
  return generateInitialLogoFlow(input);
}

const generateInitialLogoFlow = ai.defineFlow(
  {
    name: 'generateInitialLogoFlow',
    inputSchema: GenerateInitialLogoInputSchema,
    outputSchema: GenerateInitialLogoOutputSchema,
  },
  async (input) => {
    const promptText = `You are a world-class flat design logo artist and vector SVG designer.
Design an iconic, modern, minimalist flat vector logo for:
Business Name: "${input.businessName}"
Description: "${input.businessDescription}"

Strict Rules:
1. Output ONLY valid XML SVG code wrapped inside \`\`\`xml ... \`\`\`.
2. The SVG MUST have \`viewBox="0 0 512 512"\`, \`xmlns="http://www.w3.org/2000/svg"\`, width="100%", height="100%".
3. Visual Aesthetic: Flat design principles, bold geometric shapes, modern harmonious color palette, high contrast, clean vector icon, elegant typography with the business name.
4. DO NOT use raster images or 3D skeuomorphic gradients/shadows.`;

    const res = await ai.generate({
      model: 'googleai/gemini-3.6-flash',
      prompt: promptText,
    });

    const text = res.text || '';
    const match = text.match(/```(?:xml|svg)?([\s\S]*?)```/) || [null, text];
    let svg = (match[1] || text).trim();

    if (!svg.includes('<svg')) {
      const safeName = input.businessName.replace(/["<>]/g, '');
      const initials = safeName.slice(0, 2).toUpperCase() || 'FL';
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <rect width="512" height="512" rx="128" fill="#3B82F6"/>
  <circle cx="256" cy="220" r="110" fill="#ffffff" opacity="0.15"/>
  <text x="256" y="245" font-family="system-ui, -apple-system, sans-serif" font-size="88" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${initials}</text>
  <text x="256" y="385" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="600" fill="#ffffff" text-anchor="middle" letter-spacing="2">${safeName}</text>
</svg>`;
    }

    const logoDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    return { logoDataUri };
  }
);
