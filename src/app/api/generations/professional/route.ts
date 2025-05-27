
import { type NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const { userId, originalPrompt, refinedPrompt, usedPrompt, logoDataUri } = await request.json();

    if (!userId || !usedPrompt || !logoDataUri) {
      return NextResponse.json({ success: false, message: 'User ID, used prompt, and logo data are required.' }, { status: 400 });
    }
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ success: false, message: 'Invalid User ID format.' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    
    const newGeneration = {
      userId: new ObjectId(userId),
      originalPrompt,
      refinedPrompt,
      usedPrompt,
      logoDataUri,
      createdAt: new Date(),
    };

    await db.collection('professional_generations').insertOne(newGeneration);

    return NextResponse.json({ success: true, message: 'Professional logo generation saved.'});
  } catch (error) {
    console.error("Save Professional Generation API error:", error);
    if (error instanceof Error && error.name === 'MongoNetworkError') {
        return NextResponse.json({ success: false, message: 'Database connection error.' }, { status: 503 });
    }
    return NextResponse.json({ success: false, message: 'An internal server error occurred.' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, message: 'User ID is required.' }, { status: 400 });
    }
     if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ success: false, message: 'Invalid User ID format.' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const generations = await db.collection('professional_generations')
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ success: true, data: generations });
  } catch (error) {
    console.error("Get Professional Generations API error:", error);
     if (error instanceof Error && error.name === 'MongoNetworkError') {
        return NextResponse.json({ success: false, message: 'Database connection error.' }, { status: 503 });
    }
    return NextResponse.json({ success: false, message: 'An internal server error occurred.' }, { status: 500 });
  }
}
