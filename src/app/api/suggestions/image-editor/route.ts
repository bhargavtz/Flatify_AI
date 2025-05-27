import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';

export async function POST(req: NextRequest) {
  try {
    const { sourceImageUri, type } = await req.json();

    if (!sourceImageUri || !type) {
      return NextResponse.json({ success: false, message: 'Missing sourceImageUri or type' }, { status: 400 });
    }

    let prompt: string;
    if (type === 'name') {
      prompt = `Given the following image, suggest a concise and creative business name (2-5 words). Only return the name, no other text.`;
    } else if (type === 'description') {
      prompt = `Given the following image, suggest a brief and compelling business description (1-2 sentences). Only return the description, no other text.`;
    } else {
      return NextResponse.json({ success: false, message: 'Invalid suggestion type' }, { status: 400 });
    }

    const response = await ai.generate({
      model: 'googleai/gemini-2.0-flash', // Use the model configured in src/ai/genkit.ts
      prompt: [
        { text: prompt },
        { media: { url: sourceImageUri, contentType: 'image/jpeg' } }, // Assuming JPEG, adjust if other types are supported
      ],
      config: {
        temperature: 0.7,
      },
    });

    const suggestion = response.text.trim();

    return NextResponse.json({ success: true, suggestion });
  } catch (error: any) {
    console.error('Error generating suggestion:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal server error' }, { status: 500 });
  }
}
