
import { type NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const MAX_HISTORY_ITEMS = 15; // Increased slightly from typical localStorage use

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
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, promptHistory: user.promptHistory || [] });

  } catch (error) {
    console.error("Get Prompt History API error:", error);
    if (error instanceof Error && error.name === 'MongoNetworkError') {
        return NextResponse.json({ success: false, message: 'Database connection error.' }, { status: 503 });
    }
    return NextResponse.json({ success: false, message: 'An internal server error occurred.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, prompt } = await request.json();

    if (!userId || !prompt) {
      return NextResponse.json({ success: false, message: 'User ID and prompt are required.' }, { status: 400 });
    }
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ success: false, message: 'Invalid User ID format.' }, { status: 400 });
    }


    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }

    let currentHistory: string[] = user.promptHistory || [];

    // Add new prompt to the beginning, remove duplicates, and limit size
    currentHistory = [prompt, ...currentHistory.filter(p => p !== prompt)].slice(0, MAX_HISTORY_ITEMS);

    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { promptHistory: currentHistory } }
    );

    return NextResponse.json({ success: true, message: 'Prompt history updated.', promptHistory: currentHistory });

  } catch (error) {
    console.error("Post Prompt History API error:", error);
    if (error instanceof Error && error.name === 'MongoNetworkError') {
        return NextResponse.json({ success: false, message: 'Database connection error.' }, { status: 503 });
    }
    return NextResponse.json({ success: false, message: 'An internal server error occurred.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { promptHistory: [] } }
    );

    return NextResponse.json({ success: true, message: 'Prompt history cleared.' });

  } catch (error) {
    console.error("Delete Prompt History API error:", error);
    if (error instanceof Error && error.name === 'MongoNetworkError') {
        return NextResponse.json({ success: false, message: 'Database connection error.' }, { status: 503 });
    }
    return NextResponse.json({ success: false, message: 'An internal server error occurred.' }, { status: 500 });
  }
}
