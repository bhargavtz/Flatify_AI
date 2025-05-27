
import { type NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, message: 'Missing required fields.' }, { status: 400 });
    }

    // Validate email format (simple regex, consider a library for robust validation)
    if (!/^\S+@\S+\.\S+$/.test(email)) {
        return NextResponse.json({ success: false, message: 'Invalid email format.' }, { status: 400 });
    }

    // Validate password strength (example: at least 6 characters)
    if (password.length < 6) {
        return NextResponse.json({ success: false, message: 'Password must be at least 6 characters long.' }, { status: 400 });
    }


    const client = await clientPromise;
    const db = client.db(); // Use your default DB or specify one e.g., client.db("yourDbName");

    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return NextResponse.json({ success: false, message: 'User with this email already exists.' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.collection('users').insertOne({
      name,
      email,
      password: hashedPassword,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, message: 'Account created successfully. Please log in.' });

  } catch (error) {
    console.error("Signup API error:", error);
    // Check if the error is a MongoDB related error and provide a more specific message if needed
    if (error instanceof Error && error.name === 'MongoNetworkError') {
        return NextResponse.json({ success: false, message: 'Database connection error. Please try again later.' }, { status: 503 });
    }
    return NextResponse.json({ success: false, message: 'An internal server error occurred.' }, { status: 500 });
  }
}
