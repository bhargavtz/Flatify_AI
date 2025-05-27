import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';

export async function POST(req: NextRequest) {
  try {
    const { logoDataUri, refinementPrompt } = await req.json();

    if (!logoDataUri || !refinementPrompt) {
      return NextResponse.json({ success: false, message: 'Missing logoDataUri or refinementPrompt' }, { status: 400 });
    }

    const response = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp', // IMPORTANT: Image generation capable model
      prompt: [
        { media: { url: logoDataUri } },
        { text: `Refine the provided logo based on the following instructions: "${refinementPrompt}". The output should be a new version of the logo incorporating these changes, maintaining a flat design style.` },
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'], // MUST provide both TEXT and IMAGE
      },
    });

    const refinedLogoDataUri = response.media?.url;

    if (!refinedLogoDataUri) {
      throw new Error('Logo refinement failed to produce a valid media object.');
    }

    return NextResponse.json({ success: true, refinedLogoDataUri });
  } catch (error: any) {
    console.error('Error refining logo:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal server error' }, { status: 500 });
  }
}
