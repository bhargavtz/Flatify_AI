
import { type NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Email and password are required.' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(); // Use your default DB or specify one

    const user = await db.collection('users').findOne({ email });

    if (!user) {
      return NextResponse.json({ success: false, message: 'Invalid credentials.' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json({ success: false, message: 'Invalid credentials.' }, { status: 401 });
    }

    // User authenticated successfully
    // Prepare user object to return, excluding password
    const userToReturn = {
      id: user._id.toString(), // Convert ObjectId to string
      name: user.name,
      email: user.email,
    };

    return NextResponse.json({ success: true, user: userToReturn, message: "Login successful" });

  } catch (error) {
    console.error("Login API error:", error);
     if (error instanceof Error && error.name === 'MongoNetworkError') {
        return NextResponse.json({ success: false, message: 'Database connection error. Please try again later.' }, { status: 503 });
    }
    return NextResponse.json({ success: false, message: 'An internal server error occurred.' }, { status: 500 });
  }
}
