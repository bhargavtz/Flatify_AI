
import { type NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const { userId, businessName, businessDescription, primaryColor, secondaryColor, logoDataUri } = await request.json();

    if (!userId || !logoDataUri || !businessName || !businessDescription) {
      return NextResponse.json({ success: false, message: 'User ID, business name, description, and logo data are required.' }, { status: 400 });
    }
    const client = await clientPromise;
    const db = client.db();
    
    const newGeneration = {
      userId,
      businessName,
      businessDescription, // This should be the full description used for generation
      primaryColor,
      secondaryColor,
      logoDataUri,
      createdAt: new Date(),
    };

    await db.collection('novice_generations').insertOne(newGeneration);

    return NextResponse.json({ success: true, message: 'Novice logo generation saved.'});
  } catch (error) {
    console.error("Save Novice Generation API error:", error);
    if (error instanceof Error && error.name === 'MongoNetworkError') {
        return NextResponse.json({ success: false, message: 'Database connection error.' }, { status: 503 });
    }
    return NextResponse.json({ success: false, message: 'An internal server error occurred.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!id || !userId) {
      return NextResponse.json({ success: false, message: 'ID and User ID are required.' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const result = await db.collection('novice_generations').deleteOne({
      _id: new ObjectId(id),
      userId: userId,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, message: 'Novice logo not found or user not authorized.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Novice logo deleted successfully.' });
  } catch (error) {
    console.error("Delete Novice Generation API error:", error);
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
    const client = await clientPromise;
    const db = client.db();
    const generations = await db.collection('novice_generations')
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ success: true, data: generations });
  } catch (error) {
    console.error("Get Novice Generations API error:", error);
    if (error instanceof Error && error.name === 'MongoNetworkError') {
        return NextResponse.json({ success: false, message: 'Database connection error.' }, { status: 503 });
    }
    return NextResponse.json({ success: false, message: 'An internal server error occurred.' }, { status: 500 });
  }
}
