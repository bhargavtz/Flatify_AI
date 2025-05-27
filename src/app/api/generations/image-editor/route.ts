
import { type NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const { userId, sourceImageUri, sourceImageOriginalName, businessName, businessDescription, logoDataUri } = await request.json();

    if (!userId || !sourceImageUri || !businessName || !businessDescription || !logoDataUri) {
      return NextResponse.json({ success: false, message: 'User ID, source image, business details, and logo data are required.' }, { status: 400 });
    }
    const client = await clientPromise;
    const db = client.db();
    
    const newGeneration = {
      userId, // Store userId as a string
      sourceImageUri, // Storing as data URI; consider blob storage for production
      sourceImageOriginalName,
      businessName,
      businessDescription,
      logoDataUri,
      createdAt: new Date(),
    };

    await db.collection('image_editor_generations').insertOne(newGeneration);

    return NextResponse.json({ success: true, message: 'Image Editor logo generation saved.'});
  } catch (error) {
    console.error("Save Image Editor Generation API error:", error);
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

    const result = await db.collection('image_editor_generations').deleteOne({
      _id: new ObjectId(id),
      userId: userId, // userId is stored as a string in this collection
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, message: 'Image Editor logo not found or user not authorized.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Image Editor logo deleted successfully.' });
  } catch (error) {
    console.error("Delete Image Editor Generation API error:", error);
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
    const generations = await db.collection('image_editor_generations')
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ success: true, data: generations });
  } catch (error) {
    console.error("Get Image Editor Generations API error:", error);
    if (error instanceof Error && error.name === 'MongoNetworkError') {
        return NextResponse.json({ success: false, message: 'Database connection error.' }, { status: 503 });
    }
    return NextResponse.json({ success: false, message: 'An internal server error occurred.' }, { status: 500 });
  }
}
